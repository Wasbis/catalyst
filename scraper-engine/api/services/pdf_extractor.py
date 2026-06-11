import json
import logging
import re
from io import BytesIO

import pdfplumber

logger = logging.getLogger(__name__)

KBLI_CODE_PATTERN = re.compile(r"\b(\d{5})\b")

# Sel "Kode KBLI" hanya berisi kodenya sendiri (kadang + anotasi "(Pendukung)"/
# "(Utama)") — pola ketat ini dipakai untuk membedakannya dari angka 5-digit lain
# yang ikut nyangkut di kolom alamat (mis. "Kode Pos: 12240").
CODE_CELL_PATTERN = re.compile(r"^(\d{5})(?:\s*\((?:pendukung|utama)\))?$", re.IGNORECASE)


def _match_code_cell(cell: str | None) -> str | None:
    if not cell:
        return None
    match = CODE_CELL_PATTERN.match(re.sub(r"\s+", " ", cell).strip())
    return match.group(1) if match else None

# Cuplikan teks yang menandakan sebuah sel BUKAN bagian dari "Judul KBLI" —
# melainkan kolom tetangga (Lokasi Usaha, Perizinan Berusaha, status compliance)
# atau teks header/footer template dokumen NIB yang ikut "nyasar" ke kolom yang
# sama saat tabel terpotong lintas halaman.
NON_TITLE_MARKERS = (
    "perkantoran gandaria", "gandaria 8 office tower", "jl sultan", "jl. s",
    "kode pos", "kec. kebayoran", "kota adm. jakarta", "provinsi dki",
    "desa/kelurahan",
    "dokumen ini", "dalam hal terjadi", "data lengkap perizinan",
    "tersimpan dalam sistem", "ditandatangani secara elektronik",
    "kode kbli", "judul kbli", "lokasi usaha", "tingkat\nrisiko", "tingkat risiko",
    "perizinan berusaha", "nama penerbit izin", "nomor izin", "tanggal terbit",
    "izin usaha", "sertifikat standar", "lakukan pemenuhan",
    "belum terbit", "belum terverifikasi",
)
ANNOTATION_ONLY = ("(pendukung)", "(utama)")


def _clean_cell(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def _is_title_fragment(text: str) -> bool:
    if not text:
        return False
    lowered = text.lower()
    if lowered in ANNOTATION_ONLY:
        return False
    if KBLI_CODE_PATTERN.search(text):
        return False
    if any(marker in lowered for marker in NON_TITLE_MARKERS):
        return False
    return True


def _find_title_column_index(rows: list[list]) -> int | None:
    """Cari index kolom "Judul KBLI" dari baris pertama yang memuat kode KBLI.

    Tabel lampiran NIB selalu menempatkan "Judul KBLI" tepat satu kolom setelah
    "Kode KBLI" — index ini konsisten dalam satu objek tabel meski jumlah kolom
    berbeda antar tabel/halaman (pdfplumber memecah tabel besar per halaman).
    """
    for row in rows:
        for idx, cell in enumerate(row):
            if _match_code_cell(cell):
                return idx + 1
    return None


def extract_kbli_from_nib(pdf_bytes: bytes) -> list[dict]:
    """
    Mengekstrak KBLI dari dokumen PDF NIB langsung dari memory (RAM).
    Return: [{"kbli_code": "46592", "description": "Perdagangan Besar..."}, ...]
    """
    extracted_kblis: list[dict] = []
    current_code: str | None = None
    title_fragments: list[str] = []

    def flush_current():
        nonlocal current_code, title_fragments
        if current_code and title_fragments:
            description = _clean_cell(" ".join(title_fragments))
            if description and not any(k["kbli_code"] == current_code for k in extracted_kblis):
                extracted_kblis.append({"kbli_code": current_code, "description": description})
        current_code = None
        title_fragments = []

    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                for table in page.find_tables():
                    rows = table.extract()
                    title_idx = _find_title_column_index(rows)
                    if title_idx is None:
                        continue

                    for row in rows:
                        code_match = next(
                            (matched for cell in row if (matched := _match_code_cell(cell))),
                            None,
                        )
                        if code_match:
                            flush_current()
                            current_code = code_match

                        if not current_code or title_idx >= len(row):
                            continue

                        fragment = _clean_cell(row[title_idx])
                        if _is_title_fragment(fragment):
                            title_fragments.append(fragment)

            flush_current()

        logger.info(
            f"Berhasil mengekstrak {len(extracted_kblis)} KBLI dari dokumen NIB."
        )
        return extracted_kblis

    except Exception as e:
        logger.error(f"Gagal membaca PDF: {e}")
        return []


def dump_extraction_to_json(pdf_path: str, output_path: str) -> str:
    """
    Helper untuk crosscheck manual: jalankan ekstraksi atas file PDF di disk
    lalu simpan hasilnya sebagai JSON. Bukan dipakai di endpoint — murni buat
    verifikasi hasil parsing waktu development/testing.
    """
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    extracted = extract_kbli_from_nib(pdf_bytes)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {"source_file": pdf_path, "total": len(extracted), "data": extracted},
            f,
            indent=2,
            ensure_ascii=False,
        )

    return output_path


def extract_kbli_and_tkdn_from_tender_pdf(pdf_bytes: bytes, master_kblis: list[str]) -> tuple[list[str], float | None]:
    """
    Ekstrak kode KBLI 5-digit dan persentase TKDN dari file PDF lampiran tender.
    master_kblis digunakan untuk memfilter agar kode 5-digit yang ditemukan benar-benar KBLI valid.
    """
    text = ""
    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.error(f"Gagal membaca PDF tender: {e}")
        return [], None

    # 1. Ekstrak KBLI
    all_5_digits = re.findall(r"\b\d{5}\b", text)
    extracted_kblis = sorted(list(set(code for code in all_5_digits if code in master_kblis)))

    # 2. Ekstrak TKDN
    tkdn_pct = None
    matches = []
    
    # Pola 1: Mencari kata kunci, lalu persentase dalam 100 karakter setelahnya
    for m in re.finditer(r"(?:TKDN|Tingkat\s+Komponen\s+Dalam\s+Negeri)[^\n]{0,100}?(\d+(?:[\.,]\d+)?)\s*%", text, re.IGNORECASE):
        try:
            val_str = m.group(1).replace(",", ".")
            matches.append(float(val_str))
        except ValueError:
            pass

    # Pola 2: Pola yang lebih spesifik "TKDN minimal/minimum/sebesar X%"
    for m in re.finditer(r"(?:TKDN|Tingkat\s+Komponen\s+Dalam\s+Negeri)\s*(?:minimal|minimum|sebesar|sebesar\s+minimal)?\s*(?::|sebesar)?\s*(\d+(?:[\.,]\d+)?)\s*%", text, re.IGNORECASE):
        try:
            val_str = m.group(1).replace(",", ".")
            matches.append(float(val_str))
        except ValueError:
            pass

    if matches:
        tkdn_pct = max(matches)

    logger.info(f"PDF extraction complete. Extracted KBLIs: {extracted_kblis}, TKDN: {tkdn_pct}%")
    return extracted_kblis, tkdn_pct

