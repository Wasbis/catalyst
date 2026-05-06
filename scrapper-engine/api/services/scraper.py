import httpx
from bs4 import BeautifulSoup
import re
import logging

logger = logging.getLogger(__name__)


def scrape_geodipa() -> list[dict]:
    """Contoh fungsi scraper untuk web GeoDipa"""
    url = "https://www.geodipa.co.id/procurement/"
    results = []

    try:
        # Pura-puranya kita nembak API atau ambil HTML (Sesuai kesepakatan bisa pakai XHR Interception)
        # Di sini pakai HTTPX untuk request asinkron/sinkron yang kenceng
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Asumsikan kita udah parse dom/JSON-nya dan dapet data mentah
        # Ini contoh mock data hasil parsing:
        raw_tenders = [
            {
                "title": "Pengadaan Barang Spare Part Main Stop Valve",
                "agency": "PT Geo Dipa Energi",
                "requirement_text": "General, Perdagangan Mesin Besar, Spare Parts, Services, Engineering",
            }
        ]
        return raw_tenders

    except Exception as e:
        logger.error(f"Error scraping GeoDipa: {e}")
        return []


def exact_regex_match(text: str, kbli_list: list[dict]) -> str | None:
    """Mencari angka 5 digit persis seperti di web Pertamina/SKK Migas"""
    # Cari pola 5 angka berjejer
    match = re.search(r"\b\d{5}\b", text)
    if match:
        found_code = match.group(0)
        # Validasi apakah angka tersebut ada di Master KBLI kita
        for kbli in kbli_list:
            if kbli["kbli_code"] == found_code:
                return found_code
    return None
