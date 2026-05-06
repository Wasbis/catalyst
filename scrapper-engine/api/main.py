# ... (kode import dan setup scheduler dari jawaban sebelumnya) ...
from app.services.scraper import scrape_geodipa, exact_regex_match
from app.services.ai_matcher import semantic_kbli_match
from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List
from pydantic import BaseModel
import shutil
import os
from app.services.pdf_extractor import extract_kbli_from_nib


def scheduled_scraper_job():
    logger.info("Cron Job berjalan: Memulai proses scraping tender...")

    # 1. Pura-puranya kita query dari database untuk ngambil Master KBLI yang aktif
    active_kblis = [
        {
            "kbli_code": "46599",
            "description": "PERDAGANGAN BESAR MESIN, PERALATAN DAN PERLENGKAPAN LAINNYA",
        },
        {
            "kbli_code": "46900",
            "description": "PERDAGANGAN BESAR BERBAGAI MACAM BARANG",
        },
    ]

    # 2. Tarik data dari website
    scraped_tenders = scrape_geodipa()

    # 3. Proses Matching untuk tiap tender
    for tender in scraped_tenders:
        req_text = tender["requirement_text"]
        match_method = None
        matched_kbli = None

        # Coba Rule-Based (Regex) dulu, karena ini komputasi paling murah (Gratis Token/CPU)
        regex_result = exact_regex_match(req_text, active_kblis)

        if regex_result:
            matched_kbli = regex_result
            match_method = "exact_regex"
            logger.info(f"Matched by Regex: {matched_kbli}")
        else:
            # Kalau Regex gagal (kayak kasus GeoDipa), baru turunkan "monster" AI-nya
            ai_result = semantic_kbli_match(req_text, active_kblis, threshold=0.5)
            if ai_result:
                matched_kbli = ai_result["kbli_code"]
                match_method = "semantic_ai"

        # 4. Kalau dapat KBLI, eksekusi INSERT ke Database & kirim Notifikasi
        if matched_kbli:
            logger.info(
                f"SUCCESS: Menyimpan tender '{tender['title']}' ke database. KBLI: {matched_kbli} via {match_method}"
            )
            # db_session.add(Tender(title=..., kbli=matched_kbli, ...))
            # db_session.commit()


class KBLIResponse(BaseModel):
    kbli_code: str
    description: str


@app.post("/api/v1/extract-pdf", response_model=List[KBLIResponse])
async def upload_and_extract_pdf(file: UploadFile = File(...)):
    """
    Endpoint untuk menerima file PDF NIB dari Next.js,
    mengekstrak KBLI-nya, dan mengembalikan data dalam format JSON.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File harus berupa PDF")

    # Simpan file sementara di dalam container
    temp_file_path = f"/tmp/{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Ekstrak data menggunakan service yang kita buat
        kblis = extract_kbli_from_nib(temp_file_path)

        # Hapus file sementara setelah selesai
        os.remove(temp_file_path)

        # PENTING: Python (Scraper Engine) HANYA mereturn JSON ke Next.js.
        # Tugas melakukan INSERT data KBLI ini ke database adalah tugas Next.js (Prisma).
        return kblis

    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))
