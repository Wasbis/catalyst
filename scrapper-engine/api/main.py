import json
import logging
from typing import List, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
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
    "running": False,
    "last_run": None,
    "last_count": 0,
    "last_source": None,
    "last_error": None,
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
        masking = MaskingService(db=db) if req.use_masking else None

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
        masking = MaskingService(db=db)
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
    """Cek status scraper yang sedang atau terakhir berjalan."""
    return _scraper_status


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
                "detail_url": t.detail_url,
                "jenis_pengadaan": t.jenis_pengadaan,
                "announcement_type_label": t.announcement_type_label,
                "matched_kbli": t.matched_kbli,
                "match_score": t.match_score,
                "deadline_text": t.deadline_text,
                "scraped_at": str(t.scraped_at),
            }
            for t in items
        ],
    }


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
        masking = MaskingService(db=db) if req.use_masking else None

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

    _scraper_status["running"] = True
    _scraper_status["last_source"] = source
    _scraper_status["last_error"] = None

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
            db.query(TenderResult.detail_url)
            .filter(TenderResult.source == "geodipa")
            .all()
        )
        existing_geodipa_urls: List[str] = [
            r.detail_url for r in url_rows if r.detail_url
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
            geo = await scraper.scrape_geodipa(existing_urls=existing_geodipa_urls)
            results.extend(geo)

        if source in ("civd", "all"):
            civd = await scraper.scrape_civd(
                max_pages=max_pages,
                keyword=keyword,
                existing_fingerprints=existing_fingerprints,
            )
            results.extend(civd)

        if source in ("gep", "all"):
            gep = await scraper.scrape_gep(max_pages=max_pages, keyword=keyword)
            results.extend(gep)

        # ── Simpan ke DB ─────────────────────────────────────────────────
        saved = 0
        if save_to_db:
            for item in results:
                fp = item.get("fingerprint")

                # Skip kalau fingerprint sudah ada
                if fp and fp in existing_fingerprints:
                    continue

                # Fallback dedup via detail_url (GeoDipa)
                if not fp and item.get("detail_url"):
                    exists = (
                        db.query(TenderResult)
                        .filter(TenderResult.detail_url == item["detail_url"])
                        .first()
                    )
                    if exists:
                        continue

                db.add(
                    TenderResult(
                        source=item.get("source", source),
                        title=item.get("title", ""),
                        agency=item.get("agency", ""),
                        detail_url=item.get("detail_url") or "",
                        tender_text=(
                            item.get("tender_text") or item.get("requirement_text", "")
                        ),
                        doc_url=(item.get("doc_url") or item.get("document_url", "")),
                        doc_files_json=item.get(
                            "doc_files_json",
                            json.dumps(item.get("doc_files", []), ensure_ascii=False),
                        ),
                        announcement_type=item.get("announcement_type"),
                        announcement_type_label=item.get("announcement_type_label", ""),
                        golongan_usaha_json=json.dumps(
                            item.get("golongan_usaha", []), ensure_ascii=False
                        ),
                        jenis_pengadaan=item.get("jenis_pengadaan", ""),
                        bidang_usaha_json=json.dumps(
                            item.get("bidang_usaha", []), ensure_ascii=False
                        ),
                        deadline_text=item.get("deadline_text", ""),
                        publish_date=item.get("publish_date", ""),
                        fingerprint=fp,
                    )
                )

                if fp:
                    existing_fingerprints.add(fp)
                saved += 1

            db.commit()
            logger.info(f"[TASK] Saved {saved} tender baru ke DB.")

        _scraper_status["last_count"] = saved
        _scraper_status["last_run"] = datetime.now().isoformat()

    except Exception as e:
        logger.error(f"[TASK] Scraper error: {e}", exc_info=True)
        db.rollback()
        _scraper_status["last_error"] = str(e)

    finally:
        _scraper_status["running"] = False
        db.close()
