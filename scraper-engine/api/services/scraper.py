import asyncio
import hashlib
import json
import logging
import random
import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup

# Zona waktu WIB (UTC+7)
WIB = timezone(timedelta(hours=7))

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Konstanta CIVD
# ---------------------------------------------------------------------------
CIVD_BASE = "https://civd.skkmigas.go.id"
CIVD_INDEX = f"{CIVD_BASE}/index.jwebs"
CIVD_AJAX = f"{CIVD_BASE}/ajax/search/tnd.jwebs"
CIVD_DL = f"{CIVD_BASE}/download/tnd/ann.jwebs"

# type=1 sudah dikonfirmasi dari DOM (Undangan Prakualifikasi).
# type=2 dan type=3 perlu dikonfirmasi via Network tab browser.
CIVD_ANNOUNCEMENT_TYPES = {
    1: "Undangan Prakualifikasi",
    2: "Pengumuman Tender",
    3: "Pemilihan Langsung",
}


# ---------------------------------------------------------------------------
# CatalystScraper
# ---------------------------------------------------------------------------
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

    # =========================================================================
    # SHARED UTILITY
    # =========================================================================

    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Bersihkan artifact encoding yang muncul dari server CIVD.
        Pola \xc2\xa0 = non-breaking space yang double-encoded (latin-1 → UTF-8).
        """
        if not text:
            return text
        # Â  adalah hasil double-encode non-breaking space → ganti spasi biasa
        text = text.replace("Â ", " ")
        # Sisa non-breaking space
        text = text.replace(" ", " ")
        # Karakter Â yang sering jadi sisa artifact
        text = text.replace("Â", "")
        # â€" → em-dash, â€™ → right single quote (Windows-1252 moji-bake)
        text = text.replace("â", "—")
        text = text.replace("â", "’")
        # Normalkan line breaks lalu whitespace
        text = re.sub(r"[\r\n]+", " ", text)
        return re.sub(r"[ \t]+", " ", text).strip()

    def now_wib(self) -> str:
        """Timestamp sekarang dalam WIB (UTC+7), format ISO 8601 dengan offset +07:00."""
        return datetime.now(WIB).isoformat()

    async def fetch_html_async(self, url: str) -> Optional[str]:
        """GET satu URL secara async. Return HTML string atau None kalau gagal."""
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
        """
        Layer-1 matcher: cari kode KBLI 5 digit langsung di teks.
        Dipakai sebagai fallback sebelum AI semantic matching.
        """
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
    # KAMAR 1 — GEODIPA
    # =========================================================================

    async def scrape_geodipa(
        self,
        max_pages: int = 85,
        existing_urls: List[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Scrape GeoDipa via REST API internal (POST JSON per halaman).
        """
        api_url = "https://www.geodipa.co.id/wp-json/geodipa/v1/auction-list/"
        tenders = []
        known_urls = set(existing_urls or [])
        stats = {"new": 0, "duplicate": 0}
        semaphore = asyncio.Semaphore(5)

        async def _fetch_detail(detail_url: str, status_label: str):
            async with semaphore:
                await asyncio.sleep(random.uniform(0.5, 1.5))
                detail = await self.scrape_geodipa_detail(detail_url)
                if detail:
                    detail["status"] = status_label.lower()
                return detail

        logger.info(f"[GeoDipa] Mulai scraping via REST API (max {max_pages} hal)...")

        async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
            for page in range(1, max_pages + 1):
                payload = {
                    "page": str(page),
                    "total": "6",
                    "status": "all",
                    "date": "",
                }
                logger.info(f"[GeoDipa] Halaman {page}...")

                try:
                    resp = await client.post(
                        api_url,
                        json=payload,
                        headers=self.headers,
                        timeout=20.0,
                    )
                    resp.raise_for_status()

                    raw = resp.json()
                    if isinstance(raw, dict):
                        html_chunk = raw.get("html", "")
                    elif isinstance(raw, str):
                        html_chunk = raw
                    else:
                        logger.warning(
                            f"[GeoDipa] Unexpected response type: {type(raw)}"
                        )
                        break

                    if not html_chunk or "No auctions found" in html_chunk:
                        logger.info(f"[GeoDipa] Hal {page} kosong — berhenti.")
                        break

                    soup = BeautifulSoup(html_chunk, "html.parser")
                    items = soup.find_all("div", class_="item")
                    if not items:
                        break

                    tasks = []
                    for item in items:
                        status_tag = item.find("span")
                        status_label = (
                            status_tag.text.strip() if status_tag else "unknown"
                        )
                        link_tag = item.find("a", class_="more")

                        if not link_tag:
                            continue
                        detail_url = link_tag.get("href", "")
                        if not detail_url or detail_url in known_urls:
                            stats["duplicate"] += 1
                            continue

                        tasks.append(_fetch_detail(detail_url, status_label))

                    if tasks:
                        page_results = await asyncio.gather(*tasks)
                        valid_results = [r for r in page_results if r]
                        tenders.extend(valid_results)
                        stats["new"] += len(valid_results)
                        for r in valid_results:
                            known_urls.add(r["source_url"])

                except Exception as e:
                    logger.error(f"[GeoDipa] Error hal {page}: {e}")
                    break

        logger.info("=" * 40)
        logger.info("[REPORT] GeoDipa")
        logger.info(f"  ✅ Baru      : {stats['new']}")
        logger.info(f"  ♻️  Duplikat  : {stats['duplicate']}")
        logger.info("=" * 40)
        return tenders

    async def scrape_geodipa_detail(self, detail_url: str) -> Optional[Dict[str, Any]]:
        """Ekstrak detail dari satu halaman tender GeoDipa."""
        html = await self.fetch_html_async(detail_url)
        if not html:
            return None

        soup = BeautifulSoup(html, "html.parser")

        # Judul
        title_section = soup.find("div", class_="hentry")
        title = (
            title_section.find("h2").text.strip()
            if title_section and title_section.find("h2")
            else "Tender GeoDipa"
        )

        # Teks syarat
        req_texts = []
        format_texts = soup.find_all("div", class_="format-text")
        for ft in format_texts:
            text = ft.get_text(separator="\n").strip()
            if text:
                req_texts.append(text)
        full_requirement = "\n\n---\n\n".join(req_texts)

        # URL dokumen / PDF
        doc_url = None
        download_btn = soup.find("a", class_="button", download=True)
        if not download_btn:
            download_btn = soup.find("a", href=re.compile(r".*\.pdf", re.I))
        if download_btn:
            doc_url = download_btn.get("href")

        return {
            "source": "geodipa",
            "title": title,
            "agency": "PT Geo Dipa Energi (Persero)",
            "source_url": detail_url,
            "detail_url": detail_url,
            "document_url": doc_url,
            "doc_url": doc_url,
            "requirement_text": full_requirement,
            "tender_text": full_requirement,
            "status": "new_lead",
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "fingerprint": hashlib.md5(detail_url.encode()).hexdigest(),
        }

    # =========================================================================
    # KAMAR 2 — CIVD SKK MIGAS
    # =========================================================================

    async def scrape_civd(
        self,
        max_pages: int = 50,
        keyword: str = "",
        announcement_types: List[int] = None,
        existing_fingerprints: set = None,
    ) -> List[Dict[str, Any]]:
        if announcement_types is None:
            announcement_types = list(CIVD_ANNOUNCEMENT_TYPES.keys())
        if existing_fingerprints is None:
            existing_fingerprints = set()

        all_results: List[Dict[str, Any]] = []
        stats = {"new": 0, "duplicate": 0, "parse_error": 0}
        scrape_timestamp = self.now_wib()

        session_cookies: dict = {}
        session_jsid: str = ""

        try:
            async with httpx.AsyncClient(
                verify=False, follow_redirects=True, timeout=20
            ) as init_client:
                init_resp = await init_client.get(
                    CIVD_INDEX,
                    headers={
                        **self.headers,
                        "Accept": "text/html,application/xhtml+xml",
                    },
                )
                init_resp.raise_for_status()
                session_cookies = dict(init_resp.cookies)

                if "jsessionid" in str(init_resp.url).lower():
                    m = re.search(r"jsessionid=([A-F0-9]+)", str(init_resp.url), re.I)
                    if m:
                        session_jsid = m.group(1)

                if not session_jsid:
                    session_jsid = session_cookies.get("JSESSIONID", "")
        except Exception as e:
            logger.warning(f"[CIVD] Init session gagal: {e}. Lanjut tanpa session.")

        ajax_url = (
            f"{CIVD_AJAX};jsessionid={session_jsid}" if session_jsid else CIVD_AJAX
        )
        semaphore = asyncio.Semaphore(3)

        async with httpx.AsyncClient(
            verify=False,
            follow_redirects=True,
            timeout=25,
            cookies=session_cookies,
        ) as client:
            for ann_type in announcement_types:
                type_label = CIVD_ANNOUNCEMENT_TYPES.get(ann_type, f"type-{ann_type}")

                first_html = await self._civd_fetch_page(
                    client, ajax_url, ann_type, 1, keyword, semaphore
                )
                if not first_html:
                    logger.warning(f"[CIVD] ann_type={ann_type} page=1 gagal — skip tipe ini.")
                    continue

                pagination_param = self._civd_extract_pagination_param(first_html)
                actual_max = min(self._civd_parse_total_pages(first_html), max_pages)

                fresh_jsid = self._civd_extract_jsid_from_html(first_html)
                if fresh_jsid and fresh_jsid != session_jsid:
                    session_jsid = fresh_jsid
                    ajax_url = f"{CIVD_AJAX};jsessionid={session_jsid}"

                cards_p1 = self._civd_parse_cards(first_html, ann_type, type_label, scrape_timestamp)
                logger.info(
                    f"[CIVD] ann_type={ann_type} ({type_label}) | page=1 cards={len(cards_p1)} | total_pages={actual_max}"
                )

                for item in cards_p1:
                    if item["fingerprint"] in existing_fingerprints:
                        stats["duplicate"] += 1
                    else:
                        all_results.append(item)
                        existing_fingerprints.add(item["fingerprint"])
                        stats["new"] += 1

                if actual_max <= 1:
                    continue

                pages_html = await asyncio.gather(
                    *[
                        self._civd_fetch_page(
                            client,
                            ajax_url,
                            ann_type,
                            p,
                            keyword,
                            semaphore,
                            pagination_param,
                        )
                        for p in range(2, actual_max + 1)
                    ]
                )

                for html_chunk in pages_html:
                    if not html_chunk:
                        continue
                    for item in self._civd_parse_cards(
                        html_chunk, ann_type, type_label, scrape_timestamp
                    ):
                        if item["fingerprint"] in existing_fingerprints:
                            stats["duplicate"] += 1
                        else:
                            all_results.append(item)
                            existing_fingerprints.add(item["fingerprint"])
                            stats["new"] += 1

        logger.info(
            f"[CIVD] Selesai | Baru: {stats['new']} | Duplikat (sudah di DB): {stats['duplicate']} | "
            f"Error parse: {stats['parse_error']} | "
            f"{'Data sudah ada di DB — tidak ada yang baru.' if stats['new'] == 0 and stats['duplicate'] > 0 else ''}"
        )
        return all_results

    @staticmethod
    def _civd_extract_pagination_param(html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        pagelinks = soup.find("div", class_="pagelinks")
        if pagelinks:
            for a in pagelinks.find_all("a", class_="ajax"):
                href = str(a.get("href", ""))
                m = re.search(r"(d-\d+-p)=\d+", href)
                if m:
                    return m.group(1)
        return "d-1789-p"

    @staticmethod
    def _civd_extract_jsid_from_html(html: str) -> Optional[str]:
        m = re.search(r"jsessionid=([A-F0-9]+)", html, re.I)
        return m.group(1) if m else None

    async def _civd_fetch_page(
        self,
        client: httpx.AsyncClient,
        ajax_url: str,
        ann_type: int,
        page: int,
        keyword: str,
        semaphore: asyncio.Semaphore,
        pagination_param: str = "d-1789-p",
    ) -> Optional[str]:
        async with semaphore:
            await asyncio.sleep(random.uniform(0.3, 0.8))
            try:
                resp = await client.get(
                    ajax_url,
                    params={
                        "type": str(ann_type),
                        "keyword": keyword,
                        pagination_param: str(page),
                    },
                    headers={
                        **self.headers,
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "text/html, */*; q=0.01",
                        "Referer": CIVD_INDEX,
                    },
                    timeout=20,
                )
                resp.raise_for_status()
                text = resp.text.strip()
                if len(text) < 50:
                    logger.warning(
                        f"[CIVD] Page {page} ann_type={ann_type} response terlalu pendek "
                        f"({len(text)} chars): {text[:200]!r}"
                    )
                    return None
                return text
            except Exception as e:
                logger.error(f"[CIVD] Error fetch {page}: {e}")
                return None

    def _civd_parse_total_pages(self, html: str) -> int:
        soup = BeautifulSoup(html, "html.parser")
        pagelinks = soup.find("div", class_="pagelinks")
        if pagelinks:
            last_btn = pagelinks.find("a", title=re.compile("Last", re.I))
            if last_btn and last_btn.has_attr("href"):
                if m_last := re.search(r"d-\d+-p=(\d+)", str(last_btn["href"])):
                    return int(m_last.group(1))
            page_nums = [
                int(btn.get_text(strip=True))
                for btn in pagelinks.find_all("a", class_="uibutton")
                if btn.get_text(strip=True).isdigit()
            ]
            if page_nums:
                return max(page_nums)

        banner = soup.find("div", class_="pagebanner")
        if banner:
            txt = banner.get_text()
            if total_m := re.search(r"(\d+)\s+items?\s+was\s+found", txt, re.I):
                if per_page_m := re.search(r"displays?\s+\d+\s+to\s+(\d+)", txt, re.I):
                    import math

                    return math.ceil(int(total_m.group(1)) / int(per_page_m.group(1)))
        return 1

    def _civd_parse_cards(
        self, html: str, ann_type: int, type_label: str, scrape_timestamp: str = ""
    ) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", class_="card-body")
        scraped_at = scrape_timestamp or self.now_wib()
        results = []

        for card in cards:
            try:
                # 1. Title Extraction
                title_tag = card.find("h5", class_="card-title")
                title = (
                    self._clean_text(title_tag.get_text(strip=True))
                    if title_tag
                    else ""
                )
                if not title:
                    continue

                # 2. Subtitle (Agency & Deadline)
                agency = ""
                deadline_text = ""
                subtitle_tag = card.find("small", class_="card-subtitle")
                if subtitle_tag:
                    if strong_tag := subtitle_tag.find("strong"):
                        agency = self._clean_text(strong_tag.get_text(strip=True))

                    full_sub = subtitle_tag.get_text(separator=" ", strip=True)
                    if deadline_m := re.search(
                        r"Tayang\s+hingga\s+([\d]+\s+\w+\s+[\d]{4})", full_sub, re.I
                    ):
                        deadline_text = deadline_m.group(1).strip()

                # 3. Description & Extra Detail extraction (e.g., TKDN)
                description = ""
                extra_details = {}
                desc_tag = card.find("p", class_="card-text")
                if desc_tag:
                    description = self._clean_text(
                        desc_tag.get_text(separator=" ", strip=True)
                    )
                    # Beberapa card nge-dump string metadata ke description (Batasan Minimal TKDN, dll)
                    if "," in description and ":" in description:
                        parts = description.split(",")
                        for part in parts:
                            if ":" in part:
                                k, v = part.split(":", 1)
                                extra_details[self._clean_text(k)] = self._clean_text(v)

                # 4. Tipe / Fields Extraction (Dynamic Parser)
                fields_data = {
                    "Golongan Usaha": [],
                    "Jenis Pengadaan": "",
                    "Bidang Usaha": [],
                    "Jenis Pengumuman": type_label,
                }

                tipe_tag = card.find("p", class_="tipe")
                if tipe_tag:
                    for span in tipe_tag.find_all("span"):
                        bold = span.find("b")
                        if not bold:
                            continue

                        raw_label = bold.get_text(strip=True).rstrip(":")
                        label = self._clean_text(raw_label)

                        if "Bidang Usaha" in label:
                            raw_text = span.get_text(separator="\n", strip=True)
                            raw_text = re.sub(
                                rf"^{re.escape(raw_label)}\s*:",
                                "",
                                raw_text,
                                flags=re.I,
                            ).strip()
                            for line in raw_text.splitlines():
                                line = re.sub(
                                    r"\s*\(SIUP-IUT-IUI-PROP KBLI 20\d{2}\)\s*;?\s*$",
                                    "",
                                    line.strip(),
                                    flags=re.I,
                                ).strip()
                                line = line.rstrip(";")
                                if line:
                                    fields_data["Bidang Usaha"].append(
                                        self._clean_text(line)
                                    )
                        else:
                            # Parse untuk standard field (Golongan Usaha, Jenis Pengadaan)
                            values = []
                            for child in span.children:
                                if child.name == "b":
                                    continue
                                val = (
                                    child.get_text(strip=True)
                                    if hasattr(child, "get_text")
                                    else str(child).strip()
                                )
                                val = val.strip().lstrip(":")
                                if val:
                                    values.append(self._clean_text(val))

                            val_clean = " ".join(values).strip()
                            if "Golongan Usaha" in label:
                                fields_data["Golongan Usaha"] = [
                                    v.strip() for v in val_clean.split()
                                ]
                            elif "Jenis Pengadaan" in label:
                                fields_data["Jenis Pengadaan"] = val_clean
                            elif "Jenis Pengumuman" in label:
                                fields_data["Jenis Pengumuman"] = (
                                    val_clean or type_label
                                )

                # 5. Attachment Files Extraction
                doc_files = []
                cta_div = card.find("div", class_="tnd-cta")
                if cta_div:
                    for a_tag in cta_div.find_all("a", class_="download-file-blob"):
                        file_id = str(a_tag.get("data-file-id", ""))
                        if file_id:
                            doc_files.append(
                                {
                                    "file_id": file_id,
                                    "file_name": self._clean_text(
                                        str(a_tag.get("data-name", ""))
                                    ),
                                    "download_url": f"{CIVD_BASE}{str(a_tag.get('data-url', '/download/tnd/ann.jwebs'))}",
                                    # CATATAN: Download menggunakan POST + payload JSON {"fileId": file_id}
                                }
                            )

                # Gabungkan semua extract
                fp_raw = f"{title.lower()}|{agency.lower()}|{ann_type}"

                results.append(
                    {
                        "source": "civd",
                        "title": title,
                        "agency": agency,
                        "description": description,
                        "extra_details": extra_details,
                        "deadline_text": deadline_text,
                        "announcement_type": ann_type,
                        "announcement_type_label": fields_data["Jenis Pengumuman"],
                        "golongan_usaha": fields_data["Golongan Usaha"],
                        "jenis_pengadaan": fields_data["Jenis Pengadaan"],
                        "bidang_usaha": fields_data["Bidang Usaha"],
                        "doc_files": doc_files,
                        "doc_files_json": json.dumps(doc_files, ensure_ascii=False),
                        "tender_text": f"{title}\n\n{description}\n\nJenis Pengadaan: {fields_data['Jenis Pengadaan']}\nBidang Usaha: {'; '.join(fields_data['Bidang Usaha'])}".strip(),
                        "fingerprint": hashlib.md5(fp_raw.encode()).hexdigest(),
                        "scraped_at": scraped_at,
                    }
                )
            except Exception as e:
                logger.warning(f"[CIVD] Parse error di card: {e}")
                continue
        return results

    async def download_civd_file(
        self, file_id: str, endpoint: str = CIVD_DL
    ) -> Optional[bytes]:
        try:
            async with httpx.AsyncClient(
                verify=False, follow_redirects=True, timeout=60
            ) as client:
                resp = await client.post(
                    endpoint,
                    json={"fileId": file_id},
                    headers={**self.headers, "Referer": CIVD_INDEX},
                )
                resp.raise_for_status()
                # Return bytes dari dokumen untuk dihandle di service layer
                return resp.content
        except Exception as e:
            logger.error(f"[CIVD] Gagal download file_id={file_id}: {e}")
            return None

    # =========================================================================
    # KAMAR 3 — SMART GEP (placeholder)
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
