import asyncio
import json
import logging
from datetime import datetime, date as date_type, timezone, timedelta
from typing import List, Optional

WIB = timezone(timedelta(hours=7))

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Services
from api.services.ai_matcher import semantic_kbli_match
from api.services.ai_proposal_agent import AIProposalAgent
from api.services.masking_services import MaskingService
from api.services.pdf_extractor import extract_kbli_from_nib
from api.services.scraper import CatalystScraper

# Database
from api.models.database import (
    MasterKbli,
    TenderResult,
    get_db,
    init_db,
)

# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _parse_scraped_at(value: str | None) -> datetime:
    """Parse scraped_at ISO string dari scraper → datetime. Fallback ke now() WIB."""
    if value:
        try:
            return datetime.fromisoformat(value)
        except (ValueError, TypeError):
            pass
    return datetime.now(WIB)

# ---------------------------------------------------------------------------
app = FastAPI(
    title="Catalyst Scraper & AI Engine",
    description="Backend API untuk PT Cliste Rekayasa Indonesia",
    version="1.1.0",
)


# ---------------------------------------------------------------------------
# STARTUP
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    """Buat semua tabel DB saat server pertama kali naik."""
    init_db()
    logger.info("Database initialised.")


# ---------------------------------------------------------------------------
# SCHEMAS
# ---------------------------------------------------------------------------
class KbliItem(BaseModel):
    kbli_code: str
    description: str


class MatchRequest(BaseModel):
    tender_text: str
    kbli_list: List[KbliItem]
    threshold: Optional[float] = 0.6
    use_masking: Optional[bool] = True


class ScrapeRequest(BaseModel):
    source: str = "all"  # "geodipa" | "civd" | "gep" | "all"
    max_pages: int = 5
    keyword: Optional[str] = ""
    save_to_db: bool = True


class ProposalRequest(BaseModel):
    tender_title: str
    tender_text: str
    kbli_code: str
    kbli_description: str
    company_name: Optional[str] = "[NAMA PERUSAHAAN]"
    use_masking: Optional[bool] = True


# ---------------------------------------------------------------------------
# SCRAPER STATE  (in-memory — cukup untuk single-instance)
# ---------------------------------------------------------------------------
_scraper_status: dict = {
    # ── Live state (berubah saat scraper berjalan) ──
    "running": False,
    "phase": None,              # "scraping" | "saving" | "done" | "error"
    "current_source": None,     # scraper aktif: "civd" | "geodipa" | "gep"
    "live_progress": None,      # dict detail progress (page, ann_type, dst)
    "started_at": None,         # ISO timestamp mulai run
    "elapsed_seconds": None,    # dihitung live saat GET, bukan disimpan
    "items_found_so_far": 0,    # total item terkumpul dari scraper
    "items_saved_so_far": 0,    # item berhasil commit ke DB
    "items_failed_so_far": 0,   # item gagal disimpan

    # ── Last completed run ──
    "last_run": None,
    "last_source": None,
    "last_error": None,
    "last_duration_seconds": None,
    "last_stats": None,         # {total_from_scraper, saved, skipped_*, failed}
}


# ---------------------------------------------------------------------------
# ENDPOINTS — HEALTH
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
def health_check():
    """Cek apakah server hidup."""
    return {
        "status": "OK",
        "service": "Catalyst AI Engine",
        "version": "1.1.0",
    }


# ---------------------------------------------------------------------------
# ENDPOINTS — AI MATCHING
# ---------------------------------------------------------------------------
@app.post("/api/v1/match-kbli", tags=["ai"])
def api_match_kbli(
    req: MatchRequest,
    db: Session = Depends(get_db),
):
    """
    Cocokkan teks tender dengan daftar KBLI menggunakan semantic AI lokal.

    - Jika `use_masking=true` (default): teks di-mask sebelum dikirim ke model,
      lalu di-unmask di hasil akhir.
    - Jika `kbli_list` kosong, fallback ke Master KBLI dari database.
    """
    try:
        # BUG FIX: harus pakai .from_db(db), bukan MaskingService(db=db)
        masking = MaskingService.from_db(db) if req.use_masking else None

        # Teks yang akan diproses AI
        text_to_process = (
            masking.mask_text(req.tender_text) if masking else req.tender_text
        )

        # Pakai KBLI dari request; kalau kosong, load dari DB
        if req.kbli_list:
            kbli_dicts = [
                {"kbli_code": k.kbli_code, "description": k.description}
                for k in req.kbli_list
            ]
        else:
            rows = db.query(MasterKbli).filter(MasterKbli.is_active == True).all()
            if not rows:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "kbli_list kosong dan Master KBLI di database juga kosong. "
                        "Kirim kbli_list atau seed tabel master_kbli terlebih dahulu."
                    ),
                )
            kbli_dicts = [
                {"kbli_code": r.kbli_code, "description": r.description} for r in rows
            ]

        result = semantic_kbli_match(text_to_process, kbli_dicts, req.threshold)

        # Unmask description di hasil (kalau ada teks yang sempat ter-mask)
        if result and masking:
            result["description"] = masking.unmask_text(result.get("description", ""))

        if result:
            return {"status": "success", "message": "Match found", "data": result}
        return {"status": "success", "message": "No match found", "data": None}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in match-kbli: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Internal Server Error saat memproses AI."
        )


# ---------------------------------------------------------------------------
# ENDPOINTS — PDF EXTRACTION
# ---------------------------------------------------------------------------
@app.post("/api/v1/extract-pdf", tags=["pdf"])
async def api_extract_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload file PDF NIB, ekstrak daftar KBLI-nya.
    Nama dan deskripsi KBLI di output di-mask jika mengandung data sensitif.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File harus berformat PDF.")

    try:
        pdf_bytes = await file.read()
        extracted_data = extract_kbli_from_nib(pdf_bytes)

        if not extracted_data:
            return {
                "status": "warning",
                "message": "Tidak ada KBLI yang ditemukan di PDF ini.",
                "data": [],
            }

        # Mask deskripsi kalau ada data sensitif
        # BUG FIX: harus pakai .from_db(db)
        masking = MaskingService.from_db(db)
        for item in extracted_data:
            item["description"] = masking.mask_text(item.get("description", ""))

        return {
            "status": "success",
            "message": f"Berhasil mengekstrak {len(extracted_data)} KBLI.",
            "data": extracted_data,
        }

    except Exception as e:
        logger.error(f"Error di extract-pdf: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Gagal memproses file PDF.")


# ---------------------------------------------------------------------------
# ENDPOINTS — MASTER KBLI
# ---------------------------------------------------------------------------
@app.get("/api/v1/kbli", tags=["kbli"])
def get_kbli_list(
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Ambil daftar Master KBLI dari database.
    Gunakan `?search=kata` untuk filter by kode atau deskripsi.
    """
    query = db.query(MasterKbli).filter(MasterKbli.is_active == True)
    if search:
        query = query.filter(
            MasterKbli.description.ilike(f"%{search}%")
            | MasterKbli.kbli_code.ilike(f"%{search}%")
        )
    items = query.limit(limit).all()
    return {
        "total": len(items),
        "items": [
            {"kbli_code": k.kbli_code, "description": k.description} for k in items
        ],
    }


# ---------------------------------------------------------------------------
# ENDPOINTS — SCRAPER
# ---------------------------------------------------------------------------
@app.post("/api/v1/scrape", tags=["scraper"])
async def trigger_scrape(
    req: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Trigger scraper di background.
    Source: "geodipa" | "civd" | "gep" | "all"
    """
    if _scraper_status["running"]:
        raise HTTPException(
            status_code=409,
            detail="Scraper sedang berjalan. Tunggu sampai selesai.",
        )

    valid_sources = {"geodipa", "civd", "gep", "all"}
    if req.source not in valid_sources:
        raise HTTPException(
            status_code=422,
            detail=f"Source tidak valid. Pilih salah satu: {valid_sources}",
        )

    # FastAPI BackgroundTasks mendukung async function secara native —
    # cukup pass function-nya (bukan di-call), dan argumennya sebagai kwargs.
    background_tasks.add_task(
        _run_scraper_task,
        source=req.source,
        max_pages=req.max_pages,
        keyword=req.keyword or "",
        save_to_db=req.save_to_db,
    )
    return {
        "status": "started",
        "message": f"Scraper '{req.source}' berjalan di background.",
        "source": req.source,
    }


@app.get("/api/v1/scrape/status", tags=["scraper"])
def get_scrape_status():
    """
    Cek status scraper yang sedang atau terakhir berjalan.

    Response saat running:
    - phase: "scraping" (fetching dari web) atau "saving" (simpan ke DB)
    - current_source: scraper yang aktif sekarang
    - live_progress: detail page/fase yang sedang diproses
    - elapsed_seconds: berapa detik sejak scraper mulai (dihitung realtime)
    - items_found_so_far: total item yang sudah dikumpulkan scraper
    - items_saved_so_far: item yang sudah berhasil masuk DB

    Response saat idle:
    - phase: "done" atau "error"
    - last_stats: ringkasan run terakhir
    - last_duration_seconds: durasi run terakhir (detik)
    """
    status = dict(_scraper_status)
    if status["running"] and status.get("started_at"):
        try:
            started = datetime.fromisoformat(status["started_at"])
            elapsed = (datetime.now(WIB) - started).total_seconds()
            status["elapsed_seconds"] = round(elapsed, 1)
        except Exception:
            pass
    return status


@app.get("/api/v1/tenders", tags=["scraper"])
def get_tenders(
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Ambil hasil tender dari database.
    Filter opsional: `?source=civd`, `?source=geodipa`, dst.
    """
    query = db.query(TenderResult)
    if source:
        query = query.filter(TenderResult.source == source)

    total = query.count()
    items = (
        query.order_by(TenderResult.scraped_at.desc()).offset(offset).limit(limit).all()
    )

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [
            {
                "id": t.id,
                "source": t.source,
                "title": t.title,
                "agency": t.agency,
                "description": t.description,
                "budget_estimated": t.budget_estimated,
                "status": t.status,
                "recommendation": t.recommendation,
                "match_score": t.match_score,
                "kbli_codes": json.loads(t.kbli_codes_json) if t.kbli_codes_json else [],
                "kbli_matched": json.loads(t.kbli_matched_json) if t.kbli_matched_json else [],
                "deadline_text": t.deadline_text,
                "deadline_date": str(t.deadline_date) if t.deadline_date else None,
                "source_url": t.source_url,
                "doc_files": json.loads(t.doc_files_json) if t.doc_files_json else [],
                "source_metadata": json.loads(t.source_metadata_json) if t.source_metadata_json else {},
                "fingerprint": t.fingerprint,
                "notes": t.notes,
                "converted_to_project": t.converted_to_project,
                "project_id": t.project_id,
                "is_masked": t.is_masked,
                "scraped_at": str(t.scraped_at),
                "updated_at": str(t.updated_at) if t.updated_at else None,
            }
            for t in items
        ],
    }


# ---------------------------------------------------------------------------
# ENDPOINTS — EXPORT JSON (untuk debug & verifikasi)
# ---------------------------------------------------------------------------
@app.get("/api/v1/tenders/export", tags=["scraper"])
def export_tenders_json(
    source: Optional[str] = None,
    limit: int = 500,
    db: Session = Depends(get_db),
):
    """
    Export semua tender dari DB sebagai JSON file (untuk verifikasi scraping).
    Gunakan ?source=civd atau ?source=geodipa untuk filter per platform.
    Gunakan ?limit=N untuk batasi jumlah (default 500).
    """
    query = db.query(TenderResult)
    if source:
        query = query.filter(TenderResult.source == source)

    total = query.count()
    items = query.order_by(TenderResult.scraped_at.desc()).limit(limit).all()

    data = [
        {
            "id": t.id,
            "source": t.source,
            "title": t.title,
            "agency": t.agency,
            "description": t.description,
            "budget_estimated": t.budget_estimated,
            "deadline_text": t.deadline_text,
            "deadline_date": str(t.deadline_date) if t.deadline_date else None,
            "source_url": t.source_url,
            "tender_text": t.tender_text,
            "kbli_codes": json.loads(t.kbli_codes_json) if t.kbli_codes_json else [],
            "kbli_matched": json.loads(t.kbli_matched_json) if t.kbli_matched_json else [],
            "match_score": t.match_score,
            "recommendation": t.recommendation,
            "status": t.status,
            "doc_files": json.loads(t.doc_files_json) if t.doc_files_json else [],
            "source_metadata": json.loads(t.source_metadata_json) if t.source_metadata_json else {},
            "fingerprint": t.fingerprint,
            "scraped_at": str(t.scraped_at),
        }
        for t in items
    ]

    return JSONResponse(
        content={"total_in_db": total, "exported": len(data), "items": data},
        headers={
            "Content-Disposition": f'attachment; filename="tenders_export_{source or "all"}.json"'
        },
    )


# ---------------------------------------------------------------------------
# ENDPOINTS — PROPOSAL GENERATOR
# ---------------------------------------------------------------------------
@app.post("/api/v1/generate-proposal", tags=["proposal"])
def generate_proposal(
    req: ProposalRequest,
    db: Session = Depends(get_db),
):
    """
    Generate draft proposal teknis berdasarkan data tender dan KBLI yang sudah di-match.

    Pipeline:
    1. Mask data sensitif di tender_text (opsional, default aktif)
    2. Generate proposal via AIProposalAgent
    3. Unmask hasil akhir sebelum dikembalikan
    """
    try:
        # BUG FIX: harus pakai .from_db(db)
        masking = MaskingService.from_db(db) if req.use_masking else None

        masked_text = masking.mask_text(req.tender_text) if masking else req.tender_text

        agent = AIProposalAgent()
        result = agent.generate_proposal(
            tender_title=req.tender_title,
            tender_text=masked_text,
            kbli_code=req.kbli_code,
            kbli_description=req.kbli_description,
            company_name=req.company_name,
        )

        if masking:
            result["proposal_text"] = masking.unmask_text(result["proposal_text"])

        return {
            "status": "success",
            "message": "Proposal berhasil digenerate.",
            "data": result,
        }

    except Exception as e:
        logger.error(f"Error di generate-proposal: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Gagal generate proposal.")


# ---------------------------------------------------------------------------
# BACKGROUND TASK — SCRAPER RUNNER
# ---------------------------------------------------------------------------
async def _run_scraper_task(
    source: str,
    max_pages: int,
    keyword: str,
    save_to_db: bool,
) -> None:
    """
    Background task yang menjalankan scraper dan menyimpan hasilnya ke DB.

    Flow:
    1. Load existing fingerprints + GeoDipa URLs dari DB untuk dedup
    2. Jalankan scraper sesuai source
    3. Simpan hasil baru ke tabel tender_results
    """
    from datetime import datetime

    from api.models.database import SessionLocal

    _run_start = datetime.now(WIB)
    _scraper_status.update({
        "running": True,
        "phase": "scraping",
        "current_source": None,
        "live_progress": None,
        "started_at": _run_start.isoformat(),
        "elapsed_seconds": 0,
        "items_found_so_far": 0,
        "items_saved_so_far": 0,
        "items_failed_so_far": 0,
        "last_source": source,
        "last_error": None,
    })

    def _on_progress(info: dict) -> None:
        _scraper_status["live_progress"] = info
        if "found_so_far" in info:
            _scraper_status["items_found_so_far"] = info["found_so_far"]

    db = SessionLocal()
    try:
        # ── Load data dedup dari DB ──────────────────────────────────────
        fp_rows = (
            db.query(TenderResult.fingerprint)
            .filter(TenderResult.fingerprint.isnot(None))
            .all()
        )
        existing_fingerprints: set = {r.fingerprint for r in fp_rows}

        url_rows = (
            db.query(TenderResult.source_url)
            .filter(TenderResult.source == "geodipa")
            .all()
        )
        existing_geodipa_urls: List[str] = [
            r.source_url for r in url_rows if r.source_url
        ]

        logger.info(
            f"[TASK] Dedup loaded — "
            f"{len(existing_fingerprints)} fingerprints, "
            f"{len(existing_geodipa_urls)} GeoDipa URLs."
        )

        # ── Jalankan scraper ─────────────────────────────────────────────
        scraper = CatalystScraper()
        results: List[dict] = []

        if source in ("geodipa", "all"):
            _scraper_status["current_source"] = "geodipa"
            geo = await scraper.scrape_geodipa(
                existing_urls=existing_geodipa_urls,
                on_progress=_on_progress,
            )
            logger.info(f"[TASK] scrape_geodipa returned {len(geo)} items")
            results.extend(geo)
            _scraper_status["items_found_so_far"] = len(results)

        if source in ("civd", "all"):
            _scraper_status["current_source"] = "civd"
            civd_items = await scraper.scrape_civd(
                max_pages=max_pages,
                keyword=keyword,
                existing_fingerprints=existing_fingerprints,
                on_progress=_on_progress,
            )
            logger.info(f"[TASK] scrape_civd returned {len(civd_items)} items")
            results.extend(civd_items)
            _scraper_status["items_found_so_far"] = len(results)

        if source in ("gep", "all"):
            _scraper_status["current_source"] = "gep"
            gep = await scraper.scrape_gep(max_pages=max_pages, keyword=keyword)
            logger.info(f"[TASK] scrape_gep returned {len(gep)} items")
            results.extend(gep)
            _scraper_status["items_found_so_far"] = len(results)

        logger.info(f"[TASK] TOTAL results to save: {len(results)}")
        
        # ── Simpan ke DB ─────────────────────────────────────────────────
        saved = 0
        skipped_fp = 0
        skipped_url = 0
        failed = 0

        if save_to_db:
            _scraper_status["phase"] = "saving"
            _scraper_status["current_source"] = None
            _scraper_status["live_progress"] = None
            logger.info(
                f"[TASK] Mulai save ke DB. Total results dari scraper: {len(results)}"
            )

            for idx, item in enumerate(results):
                fp = item.get("fingerprint")

                # Skip kalau fingerprint sudah ada
                if fp and fp in existing_fingerprints:
                    skipped_fp += 1
                    continue

                # Fallback dedup via source_url (GeoDipa)
                if not fp and item.get("source_url"):
                    exists = (
                        db.query(TenderResult)
                        .filter(TenderResult.source_url == item["source_url"])
                        .first()
                    )
                    if exists:
                        skipped_url += 1
                        continue

                # Parse deadline_date string → Python date
                _dl = item.get("deadline_date")
                deadline_date = None
                if _dl:
                    try:
                        deadline_date = date_type.fromisoformat(_dl)
                    except (ValueError, TypeError):
                        pass

                # Save per-item biar error 1 row gak rollback semua
                try:
                    db.add(
                        TenderResult(
                            source=item.get("source", source),
                            title=item.get("title", ""),
                            agency=item.get("agency", ""),
                            description=item.get("description", ""),
                            budget_estimated=item.get("budget_estimated"),
                            deadline_text=item.get("deadline_text", ""),
                            deadline_date=deadline_date,
                            source_url=item.get("source_url", ""),
                            tender_text=(
                                item.get("tender_text")
                                or item.get("requirement_text", "")
                            ),
                            kbli_codes_json=json.dumps(
                                item.get("kbli_codes", []), ensure_ascii=False
                            ),
                            kbli_matched_json=json.dumps(
                                item.get("kbli_matched", []), ensure_ascii=False
                            ),
                            match_score=item.get("match_score"),
                            recommendation=item.get("recommendation"),
                            status=item.get("status", "DITEMUKAN"),
                            doc_files_json=json.dumps(
                                item.get("doc_files", []), ensure_ascii=False
                            ),
                            source_metadata_json=json.dumps(
                                item.get("source_metadata", {}), ensure_ascii=False
                            ),
                            fingerprint=fp,
                            scraped_at=_parse_scraped_at(item.get("scraped_at")),
                        )
                    )
                    db.commit()  # commit per-item

                    if fp:
                        existing_fingerprints.add(fp)
                    saved += 1
                    _scraper_status["items_saved_so_far"] = saved
                    logger.info(f"[TASK] #{idx} SAVED: {item.get('title', '')[:60]}")

                except Exception as item_err:
                    failed += 1
                    _scraper_status["items_failed_so_far"] = failed
                    db.rollback()
                    logger.error(
                        f"[TASK] #{idx} FAILED: {item_err} | "
                        f"title={item.get('title', '')[:60]} | "
                        f"source={item.get('source')}"
                    )
                    logger.error(f"[TASK] #{idx} item keys: {list(item.keys())}")

            logger.info(
                f"[TASK] DONE. Total={len(results)}, "
                f"Saved={saved}, SkippedFP={skipped_fp}, "
                f"SkippedURL={skipped_url}, Failed={failed}"
            )

        duration = round((datetime.now(WIB) - _run_start).total_seconds(), 1)
        _scraper_status.update({
            "phase": "done",
            "current_source": None,
            "live_progress": None,
            "last_run": datetime.now(WIB).isoformat(),
            "last_duration_seconds": duration,
            "last_stats": {
                "total_from_scraper": len(results),
                "saved": saved,
                "skipped_duplicate_fingerprint": skipped_fp,
                "skipped_duplicate_url": skipped_url,
                "failed": failed,
            },
        })

    except Exception as e:
        logger.error(f"[TASK] Scraper error: {e}", exc_info=True)
        db.rollback()
        _scraper_status["last_error"] = str(e)

    finally:
        _scraper_status["running"] = False
        db.close()
