import asyncio
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import httpx

WIB = timezone(timedelta(hours=7))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# NFR 2.6 — retry otomatis maksimal 3x sebelum sebuah request dinyatakan gagal
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 1.5


async def request_with_retry(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    max_retries: int = MAX_RETRIES,
    log_prefix: str = "",
    **kwargs: Any,
) -> httpx.Response:
    """
    Kirim HTTP request dengan retry otomatis (NFR 2.6: max 3x sebelum gagal).

    Cuma retry untuk error yang sifatnya transient — timeout, masalah koneksi,
    atau status 5xx (server sedang bermasalah). Status 4xx (mis. 404/403) langsung
    di-raise tanpa retry karena mengulang request yang sama tidak akan mengubah hasil.

    Raise exception terakhir kalau tetap gagal setelah `max_retries` percobaan —
    biar pemanggil (loop scraping per page/detail) yang memutuskan cara handle-nya
    (skip item itu, hentikan scrape, dst), konsisten dengan pola try/except yang
    sudah ada di masing-masing scraper.
    """
    last_exc: Exception = RuntimeError(f"{method} {url} gagal tanpa exception tercatat")

    for attempt in range(1, max_retries + 1):
        try:
            resp = await client.request(method, url, **kwargs)
            resp.raise_for_status()
            return resp
        except httpx.HTTPStatusError as e:
            if e.response.status_code < 500:
                raise
            last_exc = e
        except (httpx.TimeoutException, httpx.TransportError) as e:
            last_exc = e

        if attempt < max_retries:
            wait = RETRY_BACKOFF_SECONDS * attempt
            logger.warning(
                f"{log_prefix}Percobaan {attempt}/{max_retries} gagal untuk "
                f"{method} {url}: {last_exc}. Coba lagi dalam {wait:.1f}s..."
            )
            await asyncio.sleep(wait)

    logger.error(
        f"{log_prefix}{method} {url} tetap gagal setelah {max_retries}x percobaan: {last_exc}"
    )
    raise last_exc


class CatalystScraper:

    def __init__(self):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;"
                "q=0.9,image/avif,image/webp,*/*;q=0.8"
            ),
        }

    @staticmethod
    def _clean_text(text: str) -> str:
        if not text:
            return text
        text = text.replace("Â ", " ")
        text = text.replace(" ", " ")
        text = text.replace("Â", "")
        text = text.replace("â\x80\x93", "—")
        text = text.replace("â\x80\x99", "’")
        text = re.sub(r"[\r\n]+", " ", text)
        return re.sub(r"[ \t]+", " ", text).strip()

    def now_wib(self) -> str:
        return datetime.now(WIB).isoformat()

    async def fetch_html_async(self, url: str) -> Optional[str]:
        try:
            async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
                resp = await request_with_retry(client, "GET", url, headers=self.headers, timeout=15.0)
                return resp.text
        except Exception as e:
            logger.error(f"Gagal fetch {url} (setelah retry): {e}")
            return None

    def exact_regex_match(
        self, text: str, kbli_list: List[Dict[str, str]]
    ) -> Optional[str]:
        if not text:
            return None
        match = re.search(r"\b\d{5}\b", text)
        if match:
            found_code = match.group(0)
            for kbli in kbli_list:
                if kbli["kbli_code"] == found_code:
                    return found_code
        return None

    # =========================================================================
    # GEODIPA — delegates ke GeodipaScraper (api/services/geodipa_scraper.py)
    # =========================================================================

    async def scrape_geodipa(
        self,
        max_pages: int = 85,
        existing_urls: List[str] = None,
        on_progress: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:
        from api.services.geodipa_scraper import GeodipaScraper

        geodipa = GeodipaScraper()
        result = await geodipa.scrape(
            max_pages=max_pages,
            existing_urls=existing_urls,
            on_progress=on_progress,
        )
        return result.get("data", [])

    # =========================================================================
    # CIVD — delegates ke CIVDScraper (api/services/civd_scraper.py)
    # =========================================================================

    async def scrape_civd(
        self,
        max_pages: int = 50,
        keyword: str = "",
        announcement_types: List[int] = None,
        existing_fingerprints: set = None,
        on_progress: Optional[Any] = None,
    ) -> List[Dict[str, Any]]:
        from api.services.civd_scraper import CIVDScraper

        civd = CIVDScraper()
        result = await civd.scrape(
            max_pages=max_pages,
            keyword=keyword,
            announcement_types=announcement_types,
            existing_fingerprints=existing_fingerprints or set(),
            on_progress=on_progress,
        )
        return result.get("data", [])


# ---------------------------------------------------------------------------
# Quick test (jalankan langsung: python api/services/scraper.py)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json

    async def _test():
        bot = CatalystScraper()

        print("\n=== TEST GEODIPA (3 hal) ===")
        geo = await bot.scrape_geodipa(max_pages=3)
        print(f"GeoDipa: {len(geo)} tender")

        print("\n=== TEST CIVD (type=1, 2 hal) ===")
        civd = await bot.scrape_civd(max_pages=2, announcement_types=[1])
        print(f"CIVD: {len(civd)} tender")
        if civd:
            print(json.dumps(civd[0], indent=2, ensure_ascii=False))

        with open("test_output.json", "w", encoding="utf-8") as f:
            json.dump({"geodipa": geo, "civd": civd}, f, indent=2, ensure_ascii=False)
        print("\nSaved → test_output.json")

    asyncio.run(_test())
