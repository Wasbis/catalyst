import pdfplumber
import re
import logging

logger = logging.getLogger(__name__)


def extract_kbli_from_nib(pdf_file_path: str) -> list[dict]:
    """
    Mengekstrak KBLI dari dokumen PDF NIB.
    Akan mengembalikan list of dictionary: [{"kbli_code": "46592", "description": "Perdagangan Besar..."}, ...]
    """
    extracted_kblis = []

    try:
        with pdfplumber.open(pdf_file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                # NIB dari OSS biasanya memiliki format yang cukup standar.
                # Kita cari pola 5 digit angka yang biasanya berada di awal baris atau setelah pemisah tabel.
                # Contoh regex: mencari 5 digit angka, mengabaikan spasi, lalu mengambil teks huruf setelahnya.

                # Memecah teks per baris untuk dianalisa
                lines = text.split("\n")
                for line in lines:
                    # Cari 5 digit angka berturut-turut
                    match = re.search(r"\b(\d{5})\b", line)
                    if match:
                        kbli_code = match.group(1)

                        # Mengambil deskripsi (teks yang ada di baris yang sama atau menggunakan logic lanjutan
                        # jika deskripsi ada di kolom sebelahnya)
                        # Untuk NIB OSS, kadang kode dan judul KBLI ada di kolom yang berbeda.
                        # Ini pembersihan sederhana: ambil semua huruf (A-Z) setelah kode angka.
                        description_raw = line[match.end() :].strip()

                        # Bersihkan karakter aneh dari hasil ekstraksi
                        description_clean = re.sub(
                            r"[^a-zA-Z\s,]", "", description_raw
                        ).strip()

                        # Menghindari duplikasi jika ada KBLI yang sama di halaman berbeda
                        if kbli_code and description_clean:
                            # Cek apakah kode sudah ada di list
                            if not any(
                                k["kbli_code"] == kbli_code for k in extracted_kblis
                            ):
                                extracted_kblis.append(
                                    {
                                        "kbli_code": kbli_code,
                                        "description": description_clean,
                                    }
                                )

        logger.info(f"Berhasil mengekstrak {len(extracted_kblis)} KBLI dari dokumen.")
        return extracted_kblis

    except Exception as e:
        logger.error(f"Gagal membaca PDF: {e}")
        return []
