import asyncio
import hashlib
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
    Notification,
    ScrapingJob,
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


def _apply_tender_changes(existing: "TenderResult", item: dict) -> bool:
    """
    RF-T-005 — Change detection: bandingkan field yang rawan berubah di sumber
    (budget, deadline, status platform via source_metadata) antara record yang
    sudah ada dengan hasil scrape terbaru. Update record kalau ada perbedaan,
    return True kalau ada perubahan yang di-apply (dipakai caller untuk hitung
    `tenders_updated`), False kalau memang tidak ada yang berubah (skip biasa).
    """
    changed = False

    new_budget = item.get("budget_estimated")
    if new_budget is not None and new_budget != existing.budget_estimated:
        existing.budget_estimated = new_budget
        changed = True

    new_deadline_text = item.get("deadline_text")
    if new_deadline_text and new_deadline_text != existing.deadline_text:
        existing.deadline_text = new_deadline_text
        changed = True

    raw_deadline_date = item.get("deadline_date")
    if raw_deadline_date:
        try:
            new_deadline_date = date_type.fromisoformat(raw_deadline_date)
            if new_deadline_date != existing.deadline_date:
                existing.deadline_date = new_deadline_date
                changed = True
        except (ValueError, TypeError):
            pass

    # source_metadata menampung status platform yang spesifik per sumber
    # (mis. geodipa_status "Terbuka" → "Ditutup") — bandingkan sebagai JSON string
    new_metadata = item.get("source_metadata")
    if new_metadata:
        new_metadata_json = json.dumps(new_metadata, ensure_ascii=False)
        if new_metadata_json != (existing.source_metadata_json or ""):
            existing.source_metadata_json = new_metadata_json
            changed = True

    return changed

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
    """Buat semua tabel DB + jalankan scheduler scraper otomatis (RF-T-001) saat server naik."""
    init_db()
    logger.info("Database initialised.")
    asyncio.create_task(_scheduler_loop())


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
    source: str = "all"  # "geodipa" | "civd" | "all"
    max_pages: int = 5
    keyword: Optional[str] = ""
    save_to_db: bool = True


class ManualTenderRequest(BaseModel):
    title: str
    agency: Optional[str] = None
    description: Optional[str] = None
    requirement_text: Optional[str] = None
    budget_estimated: Optional[int] = None
    deadline_text: Optional[str] = None
    deadline_date: Optional[date_type] = None
    source_url: Optional[str] = None


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
    "current_source": None,     # scraper aktif: "civd" | "geodipa"
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
# RF-T-001 — Scheduler otomatis (GeoDipa tiap 24 jam, CIVD tiap 12 jam)
# ---------------------------------------------------------------------------
# In-process asyncio loop (bukan APScheduler/cron eksternal) — cukup untuk
# single-instance deployment saat ini & gak nambah dependency baru. Acuan "kapan
# terakhir run" diambil dari tabel `scraping_jobs` (bukan in-memory) supaya tetap
# akurat lintas restart server.
SCHEDULER_INTERVALS: dict[str, timedelta] = {
    "geodipa": timedelta(hours=24),
    "civd": timedelta(hours=12),
}
SCHEDULER_CHECK_INTERVAL_SECONDS = 15 * 60  # cek kelayakan tiap 15 menit
SCHEDULED_MAX_PAGES = 50


def _is_scrape_due(db: Session, source: str, interval: timedelta, now: datetime) -> bool:
    last_job = (
        db.query(ScrapingJob)
        .filter(ScrapingJob.source == source)
        .order_by(ScrapingJob.started_at.desc())
        .first()
    )
    if last_job is None:
        return True
    return (now - last_job.started_at) >= interval


async def _maybe_run_scheduled_scrape() -> None:
    if _scraper_status["running"]:
        return

    from api.models.database import SessionLocal

    db = SessionLocal()
    try:
        now = datetime.now(WIB)
        due = [
            source
            for source, interval in SCHEDULER_INTERVALS.items()
            if _is_scrape_due(db, source, interval, now)
        ]
    finally:
        db.close()

    if not due:
        return

    source = "all" if len(due) == len(SCHEDULER_INTERVALS) else due[0]
    logger.info(f"[Scheduler] Waktunya scrape terjadwal: {due} → trigger source='{source}'")
    await _run_scraper_task(
        source=source,
        max_pages=SCHEDULED_MAX_PAGES,
        keyword="",
        save_to_db=True,
        trigger="scheduled",
    )


async def _scheduler_loop() -> None:
    logger.info(
        "[Scheduler] Aktif — GeoDipa tiap 24 jam, CIVD tiap 12 jam "
        f"(cek tiap {SCHEDULER_CHECK_INTERVAL_SECONDS // 60} menit)."
    )
    while True:
        try:
            await _maybe_run_scheduled_scrape()
        except Exception as e:
            logger.error(f"[Scheduler] Error saat cek/jalankan scrape terjadwal: {e}", exc_info=True)
        await asyncio.sleep(SCHEDULER_CHECK_INTERVAL_SECONDS)


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
# ENDPOINTS — KBLI IMPORT (dari PDF NIB)
# ---------------------------------------------------------------------------
@app.post("/api/v1/kbli/import-preview", tags=["kbli"])
async def preview_kbli_import_from_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload file PDF NIB, ekstrak daftar KBLI-nya untuk di-preview (belum disimpan ke DB).
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
        logger.error(f"Error di kbli/import-preview: {e}", exc_info=True)
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
    Source: "geodipa" | "civd" | "all"
    """
    if _scraper_status["running"]:
        raise HTTPException(
            status_code=409,
            detail="Scraper sedang berjalan. Tunggu sampai selesai.",
        )

    valid_sources = {"geodipa", "civd", "all"}
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
        trigger="manual",
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


@app.get("/api/v1/scraper/log", tags=["scraper"])
def get_scraper_log(
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Riwayat run scraper per platform — dari tabel `scraping_jobs`.
    Filter opsional: `?source=civd`, `?source=geodipa`.

    Catatan: tabel ini baru terisi kalau `_run_scraper_task` sudah mencatat
    setiap run ke `scraping_jobs` (RF-T-012 — masih perlu di-wire, lihat todo.md).
    """
    query = db.query(ScrapingJob)
    if source:
        query = query.filter(ScrapingJob.source == source)

    total = query.count()
    items = (
        query.order_by(ScrapingJob.started_at.desc()).offset(offset).limit(limit).all()
    )

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [
            {
                "id": j.id,
                "source": j.source,
                "trigger": j.trigger,
                "status": j.status,
                "started_at": str(j.started_at),
                "finished_at": str(j.finished_at) if j.finished_at else None,
                "tenders_found": j.tenders_found,
                "tenders_new": j.tenders_new,
                "tenders_updated": j.tenders_updated,
                "error_message": j.error_message,
                "consecutive_failures": j.consecutive_failures,
            }
            for j in items
        ],
    }


@app.post("/api/v1/tenders", tags=["scraper"], status_code=201)
def create_manual_tender(
    req: ManualTenderRequest,
    db: Session = Depends(get_db),
):
    """
    Input tender secara manual (di luar hasil scraping).

    Dipakai untuk tender yang ditemukan dari sumber lain (relasi, email, dst)
    yang nggak ke-cover scraper CIVD/GeoDipa. Tersimpan ke tabel `tender_results`
    yang sama, jadi langsung muncul di list/kanban bareng hasil scraping.
    """
    now = datetime.now(WIB)
    fingerprint = hashlib.md5(
        f"manual:{req.title}:{req.agency or ''}:{now.isoformat()}".encode("utf-8")
    ).hexdigest()

    tender = TenderResult(
        source="manual",
        title=req.title,
        agency=req.agency,
        description=req.description,
        budget_estimated=req.budget_estimated,
        deadline_text=req.deadline_text,
        deadline_date=req.deadline_date,
        source_url=req.source_url,
        tender_text=req.requirement_text,
        fingerprint=fingerprint,
        status="DITEMUKAN",
        scraped_at=now,
    )
    db.add(tender)
    db.commit()
    db.refresh(tender)

    return {
        "status": "success",
        "message": "Tender manual berhasil ditambahkan.",
        "data": {"id": tender.id, "fingerprint": tender.fingerprint},
    }


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
# ENDPOINTS — TENDER DETAIL & STATUS
# Catatan: harus didaftarkan SETELAH /api/v1/tenders/export — path dinamis
# {tender_id} kalau didaftarkan duluan akan "menelan" path statis /export
# (FastAPI mencocokkan path secara berurutan).
# ---------------------------------------------------------------------------
@app.get("/api/v1/tenders/{tender_id}", tags=["scraper"])
def get_tender_detail(
    tender_id: int,
    db: Session = Depends(get_db),
):
    """
    Ambil detail satu tender berdasarkan ID — termasuk `tender_text` lengkap
    (requirement text) yang nggak disertakan di endpoint list.
    """
    tender = db.query(TenderResult).filter(TenderResult.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=404, detail=f"Tender dengan id={tender_id} tidak ditemukan."
        )

    return {
        "id": tender.id,
        "source": tender.source,
        "title": tender.title,
        "agency": tender.agency,
        "description": tender.description,
        "tender_text": tender.tender_text,
        "budget_estimated": tender.budget_estimated,
        "status": tender.status,
        "recommendation": tender.recommendation,
        "match_score": tender.match_score,
        "kbli_codes": json.loads(tender.kbli_codes_json) if tender.kbli_codes_json else [],
        "kbli_matched": json.loads(tender.kbli_matched_json) if tender.kbli_matched_json else [],
        "deadline_text": tender.deadline_text,
        "deadline_date": str(tender.deadline_date) if tender.deadline_date else None,
        "source_url": tender.source_url,
        "doc_files": json.loads(tender.doc_files_json) if tender.doc_files_json else [],
        "source_metadata": json.loads(tender.source_metadata_json) if tender.source_metadata_json else {},
        "fingerprint": tender.fingerprint,
        "notes": tender.notes,
        "converted_to_project": tender.converted_to_project,
        "project_id": tender.project_id,
        "is_masked": tender.is_masked,
        "scraped_at": str(tender.scraped_at),
        "updated_at": str(tender.updated_at) if tender.updated_at else None,
    }


VALID_TENDER_STATUSES = {
    "DITEMUKAN", "DITINJAU", "DIKEJAR", "DISERAHKAN", "MENANG", "KALAH", "BATAL",
}


class TenderStatusUpdateRequest(BaseModel):
    status: str


@app.put("/api/v1/tenders/{tender_id}/status", tags=["scraper"])
def update_tender_status(
    tender_id: int,
    req: TenderStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update status tender mengikuti workflow:
    DITEMUKAN → DITINJAU → DIKEJAR → DISERAHKAN → MENANG / KALAH / BATAL
    """
    if req.status not in VALID_TENDER_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Status tidak valid. Pilih salah satu: {sorted(VALID_TENDER_STATUSES)}",
        )

    tender = db.query(TenderResult).filter(TenderResult.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=404, detail=f"Tender dengan id={tender_id} tidak ditemukan."
        )

    tender.status = req.status
    db.commit()
    db.refresh(tender)

    return {
        "status": "success",
        "message": f"Status tender #{tender_id} diupdate jadi '{req.status}'.",
        "data": {
            "id": tender.id,
            "status": tender.status,
            "updated_at": str(tender.updated_at) if tender.updated_at else None,
        },
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
# RF-T-008 — Notifikasi tender skor tinggi
# ---------------------------------------------------------------------------
HIGH_SCORE_THRESHOLD = 70


def _notify_on_high_score_tender(db: Session, tender: TenderResult) -> None:
    """
    Kirim notifikasi ke admin begitu tender BARU yang baru disimpan punya
    `match_score` >= HIGH_SCORE_THRESHOLD.

    CATATAN PENTING: saat ini scraper (civd_scraper.py/geodipa_scraper.py) selalu
    menyimpan `match_score=None` — AI scoring (RF-T-006/RF-T-007, semantic match
    via `semantic_kbli_match`) belum di-wire ke pipeline scrape→save, jadi trigger
    ini "siap pakai" tapi belum akan benar-benar terpicu sampai scoring itu
    diintegrasikan. Lihat catatan di todo.md.
    """
    if tender.match_score is None or tender.match_score < HIGH_SCORE_THRESHOLD:
        return

    try:
        db.add(
            Notification(
                title=f"Tender skor tinggi: {tender.title[:80]}",
                message=(
                    f"Tender '{tender.title}' dari {tender.source.upper()} "
                    f"punya skor kecocokan {tender.match_score} (≥ {HIGH_SCORE_THRESHOLD}). "
                    f"Rekomendasi: {tender.recommendation or '-'}."
                ),
                action_link=f"/tenders/{tender.id}",
            )
        )
        db.commit()
        logger.info(
            f"[TASK] Notifikasi skor tinggi terkirim untuk tender #{tender.id} "
            f"(score={tender.match_score})"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Gagal menyimpan notifikasi skor tinggi: {e}")


# ---------------------------------------------------------------------------
# RF-T-013 — Notifikasi kegagalan scraper 2x berturut-turut
# ---------------------------------------------------------------------------
def _notify_on_scraper_failure(db: Session, job: ScrapingJob) -> None:
    """
    Kirim notifikasi ke admin begitu sebuah platform scraper gagal PERSIS 2x
    berturut-turut. Dicek dengan `== 2` (bukan `>= 2`) supaya cuma terkirim
    sekali per "rentetan kegagalan" — bukan setiap kali gagal lagi (3x, 4x, dst),
    sampai akhirnya berhasil lagi dan counter-nya reset ke 0.
    """
    if job.status != "failed" or job.consecutive_failures != 2:
        return

    try:
        db.add(
            Notification(
                title=f"Scraper {job.source} gagal 2x berturut-turut",
                message=(
                    f"Scraper '{job.source}' gagal berjalan 2 kali berturut-turut. "
                    f"Pesan error terakhir: {job.error_message or '-'}"
                ),
                action_link=f"/scraper/log?source={job.source}",
            )
        )
        db.commit()
        logger.warning(
            f"[TASK][{job.source}] Notifikasi kegagalan scraper terkirim "
            f"(consecutive_failures={job.consecutive_failures})"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Gagal menyimpan notifikasi kegagalan scraper: {e}")


# ---------------------------------------------------------------------------
# BACKGROUND TASK — SCRAPER RUNNER
# ---------------------------------------------------------------------------
async def _run_scraper_task(
    source: str,
    max_pages: int,
    keyword: str,
    save_to_db: bool,
    trigger: str = "manual",
) -> None:
    """
    Background task yang menjalankan scraper dan menyimpan hasilnya ke DB.

    Flow per platform (geodipa/civd dijalankan terpisah supaya log & status
    kegagalannya independen — RF-T-012/RF-T-013):
    1. Catat baris `ScrapingJob` baru (status=running)
    2. Load existing fingerprints/URLs dari DB untuk dedup
    3. Jalankan scraper, simpan hasil baru ke tabel tender_results
    4. Tutup `ScrapingJob` dengan statistik final + consecutive_failures
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

    platforms: List[str] = []
    if source in ("geodipa", "all"):
        platforms.append("geodipa")
    if source in ("civd", "all"):
        platforms.append("civd")

    db = SessionLocal()
    scraper = CatalystScraper()
    total_found = total_saved = total_updated = 0
    total_skipped_fp = total_skipped_url = total_failed = 0

    try:
        for platform in platforms:
            _scraper_status["phase"] = "scraping"
            _scraper_status["current_source"] = platform
            _scraper_status["live_progress"] = None

            # ── Buka ScrapingJob (RF-T-012) ──────────────────────────────
            job = ScrapingJob(source=platform, trigger=trigger, status="running")
            db.add(job)
            db.commit()
            db.refresh(job)

            items: List[dict] = []
            saved = updated = skipped_fp = skipped_url = failed = 0
            job_error: Optional[str] = None

            try:
                # ── Load data dedup dari DB ──────────────────────────────
                fp_rows = (
                    db.query(TenderResult.fingerprint)
                    .filter(TenderResult.fingerprint.isnot(None))
                    .all()
                )
                existing_fingerprints: set = {r.fingerprint for r in fp_rows}

                if platform == "geodipa":
                    url_rows = (
                        db.query(TenderResult.source_url)
                        .filter(TenderResult.source == "geodipa")
                        .all()
                    )
                    existing_geodipa_urls: List[str] = [
                        r.source_url for r in url_rows if r.source_url
                    ]
                    logger.info(
                        f"[TASK][{platform}] Dedup loaded — "
                        f"{len(existing_fingerprints)} fingerprints, "
                        f"{len(existing_geodipa_urls)} GeoDipa URLs."
                    )
                    items = await scraper.scrape_geodipa(
                        existing_urls=existing_geodipa_urls,
                        on_progress=_on_progress,
                    )
                else:
                    logger.info(
                        f"[TASK][{platform}] Dedup loaded — "
                        f"{len(existing_fingerprints)} fingerprints."
                    )
                    items = await scraper.scrape_civd(
                        max_pages=max_pages,
                        keyword=keyword,
                        existing_fingerprints=existing_fingerprints,
                        on_progress=_on_progress,
                    )

                logger.info(f"[TASK][{platform}] scraper returned {len(items)} items")
                total_found += len(items)
                _scraper_status["items_found_so_far"] = total_found

                # ── Simpan ke DB ─────────────────────────────────────────
                if save_to_db:
                    _scraper_status["phase"] = "saving"
                    _scraper_status["current_source"] = platform
                    _scraper_status["live_progress"] = None
                    logger.info(
                        f"[TASK][{platform}] Mulai save ke DB. Total dari scraper: {len(items)}"
                    )

                    for idx, item in enumerate(items):
                        fp = item.get("fingerprint")
                        existing_row: Optional[TenderResult] = None

                        # Fingerprint sudah ada → cek perubahan (RF-T-005),
                        # bukan langsung skip — siapa tahu budget/deadline/status berubah
                        if fp and fp in existing_fingerprints:
                            existing_row = (
                                db.query(TenderResult)
                                .filter(TenderResult.fingerprint == fp)
                                .first()
                            )
                        # Fallback dedup via source_url (GeoDipa, fingerprint kosong)
                        elif not fp and item.get("source_url"):
                            existing_row = (
                                db.query(TenderResult)
                                .filter(TenderResult.source_url == item["source_url"])
                                .first()
                            )

                        if existing_row:
                            if _apply_tender_changes(existing_row, item):
                                try:
                                    db.commit()
                                    updated += 1
                                    logger.info(
                                        f"[TASK][{platform}] #{idx} UPDATED (RF-T-005): "
                                        f"{item.get('title', '')[:60]}"
                                    )
                                except Exception as upd_err:
                                    db.rollback()
                                    logger.error(f"[TASK][{platform}] #{idx} update gagal: {upd_err}")
                            elif fp:
                                skipped_fp += 1
                            else:
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
                            new_tender = TenderResult(
                                    source=item.get("source", platform),
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
                                    scraping_job_id=job.id,
                            )
                            db.add(new_tender)
                            db.commit()  # commit per-item
                            db.refresh(new_tender)

                            if fp:
                                existing_fingerprints.add(fp)
                            saved += 1
                            _scraper_status["items_saved_so_far"] = total_saved + saved
                            logger.info(f"[TASK][{platform}] #{idx} SAVED: {item.get('title', '')[:60]}")

                            _notify_on_high_score_tender(db, new_tender)

                        except Exception as item_err:
                            failed += 1
                            _scraper_status["items_failed_so_far"] = total_failed + failed
                            db.rollback()
                            logger.error(
                                f"[TASK][{platform}] #{idx} FAILED: {item_err} | "
                                f"title={item.get('title', '')[:60]} | "
                                f"source={item.get('source')}"
                            )
                            logger.error(f"[TASK][{platform}] #{idx} item keys: {list(item.keys())}")

                    logger.info(
                        f"[TASK][{platform}] DONE. Total={len(items)}, "
                        f"Saved={saved}, Updated={updated}, SkippedFP={skipped_fp}, "
                        f"SkippedURL={skipped_url}, Failed={failed}"
                    )

            except Exception as e:
                job_error = str(e)
                logger.error(f"[TASK][{platform}] Scraper error: {e}", exc_info=True)
                db.rollback()

            # ── Tutup ScrapingJob — statistik & consecutive_failures (RF-T-013) ──
            prev_job = (
                db.query(ScrapingJob)
                .filter(ScrapingJob.source == platform, ScrapingJob.id != job.id)
                .order_by(ScrapingJob.started_at.desc())
                .first()
            )
            prev_failures = prev_job.consecutive_failures if prev_job else 0

            job.status = "failed" if job_error else "success"
            job.finished_at = datetime.now(WIB)
            job.tenders_found = len(items)
            job.tenders_new = saved
            job.tenders_updated = updated
            job.error_message = job_error
            job.consecutive_failures = (prev_failures + 1) if job_error else 0
            db.commit()

            _notify_on_scraper_failure(db, job)

            total_saved += saved
            total_updated += updated
            total_skipped_fp += skipped_fp
            total_skipped_url += skipped_url
            total_failed += failed

        duration = round((datetime.now(WIB) - _run_start).total_seconds(), 1)
        _scraper_status.update({
            "phase": "done",
            "current_source": None,
            "live_progress": None,
            "last_run": datetime.now(WIB).isoformat(),
            "last_duration_seconds": duration,
            "last_stats": {
                "total_from_scraper": total_found,
                "saved": total_saved,
                "updated": total_updated,
                "skipped_duplicate_fingerprint": total_skipped_fp,
                "skipped_duplicate_url": total_skipped_url,
                "failed": total_failed,
            },
        })

    except Exception as e:
        logger.error(f"[TASK] Scraper error: {e}", exc_info=True)
        db.rollback()
        _scraper_status["last_error"] = str(e)

    finally:
        db.close()
        _scraper_status["running"] = False
        db.close()
