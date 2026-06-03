import pdfplumber
import re
import logging
from io import BytesIO

logger = logging.getLogger(__name__)


def extract_kbli_from_nib(pdf_bytes: bytes) -> list[dict]:
    """
    Mengekstrak KBLI dari dokumen PDF NIB langsung dari memory (RAM).
    Return: [{"kbli_code": "46592", "description": "Perdagangan Besar..."}, ...]
    """
    extracted_kblis = []

    try:
        # Gunakan BytesIO biar nggak usah nge-save file fisik ke server
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                lines = text.split("\n")
                for line in lines:
                    match = re.search(r"\b(\d{5})\b", line)
                    if match:
                        kbli_code = match.group(1)
                        description_raw = line[match.end() :].strip()
                        description_clean = re.sub(
                            r"[^a-zA-Z\s,]", "", description_raw
                        ).strip()

                        if kbli_code and description_clean:
                            if not any(
                                k["kbli_code"] == kbli_code for k in extracted_kblis
                            ):
                                extracted_kblis.append(
                                    {
                                        "kbli_code": kbli_code,
                                        "description": description_clean,
                                    }
                                )

        logger.info(
            f"Berhasil mengekstrak {len(extracted_kblis)} KBLI dari dokumen NIB."
        )
        return extracted_kblis

    except Exception as e:
        logger.error(f"Gagal membaca PDF: {e}")
        return []
