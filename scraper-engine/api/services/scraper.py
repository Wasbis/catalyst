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
                resp = await client.get(url, headers=self.headers, timeout=15.0)
                resp.raise_for_status()
                return resp.text
        except Exception as e:
            logger.error(f"Gagal fetch {url}: {e}")
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

    # =========================================================================
    # GEP — placeholder
    # =========================================================================

    async def scrape_gep(
        self,
        max_pages: int = 5,
        keyword: str = "",
    ) -> List[Dict[str, Any]]:
        logger.info("[GEP] Scraper belum diimplementasi.")
        return []

    # =========================================================================
    # RUNNER — jalankan semua scraper concurrent
    # =========================================================================

    async def run_all_scrapers(
        self,
        existing_fingerprints: set = None,
        existing_geodipa_urls: List[str] = None,
    ) -> List[Dict[str, Any]]:
        if existing_fingerprints is None:
            existing_fingerprints = set()
        if existing_geodipa_urls is None:
            existing_geodipa_urls = []

        logger.info("Memulai scraping massal (GeoDipa + CIVD + GEP)...")

        results = await asyncio.gather(
            self.scrape_geodipa(existing_urls=existing_geodipa_urls),
            self.scrape_civd(existing_fingerprints=existing_fingerprints),
            self.scrape_gep(),
            return_exceptions=True,
        )

        all_tenders: List[Dict[str, Any]] = []
        labels = ["GeoDipa", "CIVD", "GEP"]
        for label, result in zip(labels, results):
            if isinstance(result, Exception):
                logger.error(f"[RUN ALL] {label} gagal: {result}")
            elif result:
                all_tenders.extend(result)

        logger.info(f"[RUN ALL] Total tender terkumpul: {len(all_tenders)}")
        return all_tenders


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
