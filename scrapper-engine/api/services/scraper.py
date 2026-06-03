import asyncio
import hashlib
import json
import logging
import random
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup

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

        Endpoint : POST https://www.geodipa.co.id/wp-json/geodipa/v1/auction-list/
        Payload  : {"page": "N", "total": "6", "status": "all", "date": ""}
        Response : {"html": "<div class='item'>...</div>", ...}

        Args:
            max_pages      : Batas halaman (default 85 — sesuai total data GeoDipa).
            existing_urls  : List URL yang sudah ada di DB untuk skip duplikat.
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
                    html_chunk = resp.json().get("html", "")

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

        # Teks syarat (semua div.format-text digabung)
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
    # Struktur situs:
    #   GET  /index.jwebs                          → init session (jsessionid)
    #   GET  /ajax/search/tnd.jwebs
    #            ?type={1|2|3}&keyword=&d-1789-p=N → AJAX pagination
    #   POST /download/tnd/ann.jwebs               → download lampiran
    #        body: {"fileId": "..."}
    #
    # Seluruh data tender sudah ada di HTML card —
    # modal "Lebih lanjut" hanya tampil ulang data yang sama via JS,
    # sehingga TIDAK perlu request terpisah ke detail page.
    # =========================================================================

    async def scrape_civd(
        self,
        max_pages: int = 20,
        keyword: str = "",
        announcement_types: List[int] = None,
        existing_fingerprints: set = None,
    ) -> List[Dict[str, Any]]:
        """
        Scrape CIVD SKK Migas via AJAX pagination.

        Args:
            max_pages             : Batas halaman per tipe pengumuman.
            keyword               : Filter kata kunci (opsional).
            announcement_types    : Tipe yang di-scrape [1,2,3]; default semua.
            existing_fingerprints : Fingerprint yang sudah ada di DB (untuk dedup).
        """
        if announcement_types is None:
            announcement_types = list(CIVD_ANNOUNCEMENT_TYPES.keys())
        if existing_fingerprints is None:
            existing_fingerprints = set()

        all_results: List[Dict[str, Any]] = []
        stats = {"new": 0, "duplicate": 0, "parse_error": 0}

        # ── Init session (jsessionid) ────────────────────────────────────────
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

                logger.info(
                    f"[CIVD] Session OK — "
                    f"jsessionid={'***' + session_jsid[-6:] if session_jsid else 'NONE'}"
                )
        except Exception as e:
            logger.warning(f"[CIVD] Init session gagal: {e}. Lanjut tanpa session.")

        ajax_url = (
            f"{CIVD_AJAX};jsessionid={session_jsid}" if session_jsid else CIVD_AJAX
        )
        semaphore = asyncio.Semaphore(4)

        # ── Loop per tipe pengumuman ─────────────────────────────────────────
        async with httpx.AsyncClient(
            verify=False,
            follow_redirects=True,
            timeout=25,
            cookies=session_cookies,
        ) as client:
            for ann_type in announcement_types:
                type_label = CIVD_ANNOUNCEMENT_TYPES.get(ann_type, f"type-{ann_type}")
                logger.info(
                    f"[CIVD] Scraping '{type_label}' (type={ann_type}) "
                    f"max {max_pages} hal..."
                )

                # Halaman 1 dulu untuk tahu total halaman
                first_html = await self._civd_fetch_page(
                    client, ajax_url, ann_type, 1, keyword, semaphore
                )
                if not first_html:
                    logger.warning(f"[CIVD] Hal 1 type={ann_type} kosong — skip.")
                    continue

                total_pages = self._civd_parse_total_pages(first_html)
                actual_max = min(total_pages, max_pages)
                logger.info(
                    f"[CIVD] type={ann_type}: {total_pages} hal tersedia, "
                    f"ambil {actual_max} hal."
                )

                # Proses halaman 1
                for item in self._civd_parse_cards(first_html, ann_type, type_label):
                    if item["fingerprint"] in existing_fingerprints:
                        stats["duplicate"] += 1
                    else:
                        all_results.append(item)
                        existing_fingerprints.add(item["fingerprint"])
                        stats["new"] += 1

                if actual_max <= 1:
                    continue

                # Fetch halaman 2..N secara concurrent
                pages_html = await asyncio.gather(
                    *[
                        self._civd_fetch_page(
                            client, ajax_url, ann_type, page, keyword, semaphore
                        )
                        for page in range(2, actual_max + 1)
                    ]
                )

                for html_chunk in pages_html:
                    if not html_chunk:
                        continue
                    for item in self._civd_parse_cards(
                        html_chunk, ann_type, type_label
                    ):
                        if item["fingerprint"] in existing_fingerprints:
                            stats["duplicate"] += 1
                        else:
                            all_results.append(item)
                            existing_fingerprints.add(item["fingerprint"])
                            stats["new"] += 1

        logger.info("=" * 40)
        logger.info("[REPORT] CIVD")
        logger.info(f"  ✅ Baru       : {stats['new']}")
        logger.info(f"  ♻️  Duplikat   : {stats['duplicate']}")
        logger.info(f"  ⚠️  Parse err  : {stats['parse_error']}")
        logger.info("=" * 40)
        return all_results

    async def _civd_fetch_page(
        self,
        client: httpx.AsyncClient,
        ajax_url: str,
        ann_type: int,
        page: int,
        keyword: str,
        semaphore: asyncio.Semaphore,
    ) -> Optional[str]:
        """Fetch satu halaman AJAX CIVD. Return HTML string atau None."""
        async with semaphore:
            await asyncio.sleep(random.uniform(0.3, 0.8))
            try:
                resp = await client.get(
                    ajax_url,
                    params={
                        "type": str(ann_type),
                        "keyword": keyword,
                        "d-1789-p": str(page),  # parameter DisplayTag pagination
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
                html = resp.text.strip()
                return html if html and len(html) >= 50 else None

            except httpx.HTTPStatusError as e:
                logger.error(
                    f"[CIVD] HTTP {e.response.status_code} "
                    f"(type={ann_type}, hal={page})"
                )
                return None
            except Exception as e:
                logger.error(f"[CIVD] Error type={ann_type} hal={page}: {e}")
                return None

    def _civd_parse_total_pages(self, html: str) -> int:
        """
        Hitung total halaman dari elemen pagination.

        Prioritas:
        1. Angka terbesar di tombol .pagelinks .uibutton
        2. Hitung dari teks pagebanner: "55 items found, displays 1 to 6"
        """
        soup = BeautifulSoup(html, "html.parser")

        pagelinks = soup.find("div", class_="pagelinks")
        if pagelinks:
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
            total_m = re.search(r"(\d+)\s+items?\s+was\s+found", txt, re.I)
            per_page_m = re.search(r"displays?\s+\d+\s+to\s+(\d+)", txt, re.I)
            if total_m and per_page_m:
                total = int(total_m.group(1))
                per_page = int(per_page_m.group(1))
                if per_page > 0:
                    import math

                    return math.ceil(total / per_page)

        return 1

    def _civd_parse_cards(
        self,
        html: str,
        ann_type: int,
        type_label: str,
    ) -> List[Dict[str, Any]]:
        """
        Parse semua card tender dari satu chunk HTML CIVD.

        Field yang diekstrak:
          title, agency, deadline_text, golongan_usaha (list),
          jenis_pengadaan, bidang_usaha (list), jenis_pengumuman,
          doc_files (list {file_id, file_name, download_url}),
          fingerprint (MD5 title+agency+type), scraped_at (ISO UTC).
        """
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", class_="card-body")
        scraped_at = datetime.now(timezone.utc).isoformat()
        results = []

        for card in cards:
            try:
                # Judul
                title_tag = card.find("h5", class_="card-title")
                title = title_tag.get_text(strip=True) if title_tag else ""
                if not title:
                    continue

                # Agency + deadline
                agency = ""
                deadline_text = ""
                subtitle_tag = card.find("small", class_="card-subtitle")
                if subtitle_tag:
                    strong_tag = subtitle_tag.find("strong")
                    if strong_tag:
                        agency = strong_tag.get_text(strip=True)

                    full_sub = subtitle_tag.get_text(separator=" ", strip=True)
                    deadline_m = re.search(
                        r"Tayang\s+hingga\s+([\d]+\s+\w+\s+[\d]{4})",
                        full_sub,
                        re.I,
                    )
                    if deadline_m:
                        deadline_text = deadline_m.group(1).strip()

                # Golongan, jenis pengadaan, bidang usaha
                golongan_usaha = []
                jenis_pengadaan = ""
                bidang_usaha = []
                jenis_pengumuman = type_label
                tipe_tag = card.find("p", class_="tipe")

                if tipe_tag:
                    for span in tipe_tag.find_all("span"):
                        bold = span.find("b")
                        if not bold:
                            continue
                        label = bold.get_text(strip=True).rstrip(":")

                        # Teks dalam span selain bold
                        values = [
                            (
                                child.get_text(strip=True)
                                if hasattr(child, "get_text")
                                else str(child).strip()
                            )
                            for child in span.children
                            if child != bold
                        ]
                        val_clean = " ".join(v for v in values if v).strip()

                        if "Golongan Usaha" in label:
                            golongan_usaha = [v for v in val_clean.split() if v]

                        elif "Jenis Pengadaan" in label:
                            jenis_pengadaan = val_clean

                        elif "Bidang Usaha" in label:
                            field_span = tipe_tag.find("span", class_="field")
                            if field_span:
                                raw = field_span.get_text(separator="\n", strip=True)
                                raw = re.sub(
                                    r"^Bidang\s+Usaha\s*:", "", raw, flags=re.I
                                ).strip()
                                for line in raw.splitlines():
                                    line = re.sub(
                                        r"\s*\(SIUP-IUT-IUI-PROP KBLI 2020\)\s*;?\s*$",
                                        "",
                                        line.strip(),
                                        flags=re.I,
                                    ).strip()
                                    if line:
                                        bidang_usaha.append(line)

                        elif "Jenis Pengumuman" in label:
                            jenis_pengumuman = val_clean or type_label

                # Dokumen lampiran
                doc_files = []
                cta_div = card.find("div", class_="tnd-cta")
                if cta_div:
                    for a_tag in cta_div.find_all("a", class_="download-file-blob"):
                        file_id = a_tag.get("data-file-id", "")
                        file_name = a_tag.get("data-name", "")
                        dl_path = a_tag.get("data-url", "/download/tnd/ann.jwebs")
                        if file_id:
                            doc_files.append(
                                {
                                    "file_id": file_id,
                                    "file_name": file_name,
                                    "download_url": f"{CIVD_BASE}{dl_path}",
                                }
                            )

                # Fingerprint untuk dedup
                fp_raw = f"{title.lower().strip()}|{agency.lower().strip()}|{ann_type}"
                fingerprint = hashlib.md5(fp_raw.encode()).hexdigest()

                results.append(
                    {
                        "source": "civd",
                        "title": title,
                        "agency": agency,
                        "deadline_text": deadline_text,
                        "announcement_type": ann_type,
                        "announcement_type_label": jenis_pengumuman,
                        "golongan_usaha": golongan_usaha,
                        "jenis_pengadaan": jenis_pengadaan,
                        "bidang_usaha": bidang_usaha,
                        "doc_files": doc_files,
                        "doc_files_json": json.dumps(doc_files, ensure_ascii=False),
                        # Shortcut untuk kolom DB dan AI matching
                        "tender_text": (
                            f"{title} {jenis_pengadaan} {' '.join(bidang_usaha)}"
                        ).strip(),
                        "doc_url": doc_files[0]["download_url"] if doc_files else "",
                        "detail_url": "",  # CIVD tidak punya halaman detail terpisah
                        "fingerprint": fingerprint,
                        "scraped_at": scraped_at,
                    }
                )

            except Exception as e:
                logger.warning(f"[CIVD] Parse error satu card: {e}")
                continue

        return results

    async def download_civd_file(self, file_id: str) -> Optional[bytes]:
        """
        Download lampiran CIVD.
        CIVD memakai POST + body JSON {"fileId": "..."}, bukan direct link.
        """
        try:
            async with httpx.AsyncClient(
                verify=False, follow_redirects=True, timeout=60
            ) as client:
                resp = await client.post(
                    CIVD_DL,
                    json={"fileId": file_id},
                    headers={**self.headers, "Referer": CIVD_INDEX},
                )
                resp.raise_for_status()
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
        """Placeholder — implementasi menyusul setelah endpoint GEP dikonfirmasi."""
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
        """
        Jalankan GeoDipa + CIVD + GEP secara concurrent.
        Scraper yang gagal tidak menghentikan yang lain (return_exceptions=True).

        Args:
            existing_fingerprints  : Set fingerprint dari DB (untuk CIVD dedup).
            existing_geodipa_urls  : List URL GeoDipa yang sudah di DB.
        """
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

        # Test GeoDipa (kecil dulu)
        print("\n=== TEST GEODIPA (3 hal) ===")
        geo = await bot.scrape_geodipa(max_pages=3)
        print(f"GeoDipa: {len(geo)} tender")

        # Test CIVD (tipe 1 saja, 2 hal)
        print("\n=== TEST CIVD (type=1, 2 hal) ===")
        civd = await bot.scrape_civd(max_pages=2, announcement_types=[1])
        print(f"CIVD: {len(civd)} tender")
        if civd:
            print(json.dumps(civd[0], indent=2, ensure_ascii=False))

        # Save sample output
        with open("test_output.json", "w", encoding="utf-8") as f:
            json.dump({"geodipa": geo, "civd": civd}, f, indent=2, ensure_ascii=False)
        print("\nSaved → test_output.json")

    asyncio.run(_test())
