"""
civd_scraper.py — Isolated CIVD SKK Migas scraper untuk debugging.

Jalankan langsung:
    python civd_scraper.py

Atau import:
    from civd_scraper import CIVDScraper
    scraper = CIVDScraper()
    results = asyncio.run(scraper.scrape(max_pages=2, announcement_types=[1]))
"""

import asyncio
import hashlib
import json
import logging
import math
import random
import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG,  # DEBUG supaya semua detail keliatan saat isolasi
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Zona waktu WIB (UTC+7)
# ---------------------------------------------------------------------------
WIB = timezone(timedelta(hours=7))

# ---------------------------------------------------------------------------
# Konstanta
# ---------------------------------------------------------------------------
CIVD_BASE = "https://civd.skkmigas.go.id"
CIVD_INDEX = f"{CIVD_BASE}/index.jwebs"
CIVD_AJAX = f"{CIVD_BASE}/ajax/search/tnd.jwebs"
CIVD_DL = f"{CIVD_BASE}/download/tnd/ann.jwebs"

CIVD_ANNOUNCEMENT_TYPES = {
    1: "Undangan Prakualifikasi",
    2: "Pengumuman Tender",
    3: "Pemilihan Langsung",
}

BULAN_ID = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4,
    "mei": 5, "juni": 6, "juli": 7, "agustus": 8,
    "september": 9, "oktober": 10, "november": 11, "desember": 12,
}

HEADERS = {
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


# ---------------------------------------------------------------------------
# CIVDScraper
# ---------------------------------------------------------------------------
class CIVDScraper:

    # =========================================================================
    # UTILITY
    # =========================================================================

    @staticmethod
    def _clean_text(text: str) -> str:
        """Bersihkan artifact encoding dari server CIVD."""
        if not text:
            return text
        text = text.replace("Â ", " ")
        text = text.replace("\u00a0", " ")  # non-breaking space
        text = text.replace("Â", "")
        text = text.replace("â\x80\x93", "\u2014")  # em-dash
        text = text.replace("â\x80\x99", "\u2019")  # right single quote
        text = re.sub(r"[\r\n]+", " ", text)
        return re.sub(r"[ \t]+", " ", text).strip()

    @staticmethod
    def now_wib() -> str:
        return datetime.now(WIB).isoformat()

    @staticmethod
    def _parse_deadline_date(text: str) -> Optional[str]:
        """Parse '16 Juni 2026' → 'YYYY-MM-DD'. Return None kalau format tidak dikenal."""
        if not text:
            return None
        parts = text.strip().split()
        if len(parts) != 3:
            return None
        try:
            day = int(parts[0])
            month = BULAN_ID.get(parts[1].lower())
            year = int(parts[2])
            if not month:
                return None
            return f"{year:04d}-{month:02d}-{day:02d}"
        except (ValueError, IndexError):
            return None

    # =========================================================================
    # SESSION INIT
    # =========================================================================

    async def _init_session(self) -> tuple[dict, str]:
        """
        GET halaman index CIVD untuk ambil session cookie + JSESSIONID.
        Return: (session_cookies, session_jsid)
        """
        session_cookies: dict = {}
        session_jsid: str = ""

        try:
            async with httpx.AsyncClient(
                verify=False, follow_redirects=True, timeout=20
            ) as client:
                logger.info(f"[CIVD] Init session → GET {CIVD_INDEX}")
                resp = await client.get(
                    CIVD_INDEX,
                    headers={**HEADERS, "Accept": "text/html,application/xhtml+xml"},
                )
                resp.raise_for_status()

                session_cookies = dict(resp.cookies)
                logger.debug(f"[CIVD] Cookies diterima: {list(session_cookies.keys())}")
                logger.debug(f"[CIVD] Final URL setelah redirect: {resp.url}")

                # Coba ambil JSESSIONID dari URL (kadang di-append server)
                m = re.search(r"jsessionid=([A-F0-9]+)", str(resp.url), re.I)
                if m:
                    session_jsid = m.group(1)
                    logger.info(f"[CIVD] JSESSIONID dari URL: {session_jsid}")

                # Fallback: dari cookie header
                if not session_jsid:
                    session_jsid = session_cookies.get("JSESSIONID", "")
                    if session_jsid:
                        logger.info(f"[CIVD] JSESSIONID dari cookie: {session_jsid}")

                if not session_jsid:
                    logger.warning(
                        "[CIVD] JSESSIONID tidak ditemukan — request mungkin gagal."
                    )

        except Exception as e:
            logger.error(f"[CIVD] Init session error: {e}")

        return session_cookies, session_jsid

    # =========================================================================
    # FETCH SATU PAGE
    # =========================================================================

    async def _fetch_page(
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
            delay = random.uniform(0.3, 0.8)
            logger.debug(
                f"[CIVD] Delay {delay:.2f}s sebelum fetch page={page} type={ann_type}"
            )
            await asyncio.sleep(delay)

            params = {
                "type": str(ann_type),
                "keyword": keyword,
                pagination_param: str(page),
            }
            logger.info(f"[CIVD] GET {ajax_url} | params={params}")

            try:
                resp = await client.get(
                    ajax_url,
                    params=params,
                    headers={
                        **HEADERS,
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "text/html, */*; q=0.01",
                        "Referer": CIVD_INDEX,
                    },
                    timeout=20,
                )
                logger.debug(f"[CIVD] Status: {resp.status_code} | URL: {resp.url}")
                resp.raise_for_status()

                text = resp.text.strip()
                logger.debug(f"[CIVD] Response length: {len(text)} chars")
                logger.debug(f"[CIVD] Response preview (200 char): {text[:200]!r}")

                if len(text) < 50:
                    logger.warning(
                        f"[CIVD] Response terlalu pendek ({len(text)} chars) — "
                        f"kemungkinan empty atau error page."
                    )
                    return None

                return text

            except httpx.HTTPStatusError as e:
                logger.error(
                    f"[CIVD] HTTP error page={page} type={ann_type}: "
                    f"{e.response.status_code} {e.response.text[:300]}"
                )
                return None
            except Exception as e:
                logger.error(f"[CIVD] Error fetch page={page} type={ann_type}: {e}")
                return None

    # =========================================================================
    # PARSE HELPERS
    # =========================================================================

    @staticmethod
    def _extract_pagination_param(html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        pagelinks = soup.find("div", class_="pagelinks")
        if pagelinks:
            for a in pagelinks.find_all("a", class_="ajax"):
                href = str(a.get("href", ""))
                m = re.search(r"(d-\d+-p)=\d+", href)
                if m:
                    param = m.group(1)
                    logger.debug(f"[CIVD] Pagination param ditemukan: {param}")
                    return param
        logger.debug("[CIVD] Pagination param tidak ditemukan — pakai default d-1789-p")
        return "d-1789-p"

    @staticmethod
    def _extract_jsid_from_html(html: str) -> Optional[str]:
        m = re.search(r"jsessionid=([A-F0-9]+)", html, re.I)
        return m.group(1) if m else None

    @staticmethod
    def _build_download_url(file_id: str) -> str:
        """
        Build direct GET download URL.
        Format: GET /download/tnd/ann.jwebs?id=base64({timestamp_ms}|{file_id})
        Timestamp fresh tiap call supaya tidak expired.
        """
        import base64, time

        raw = f"{int(time.time() * 1000)}|{file_id}"
        return f"{CIVD_DL}?id={base64.b64encode(raw.encode()).decode()}"

    def _parse_total_pages(self, html: str) -> Optional[int]:
        """
        Coba deteksi total pages dari HTML CIVD.
        Strategi (urutan prioritas):
          1. Tag <h6 class="tnd-section-title"><b>N Data</b> → total item paling reliable
          2. "Last" button di pagelinks → langsung dapat page terakhir
          3. pagebanner "N items was found, displays X to Y" → hitung ceil(N/Y)
          4. Nomor halaman terbesar di pagelinks buttons
        Return None kalau semua gagal → caller pakai defensive pagination.
        """
        soup = BeautifulSoup(html, "html.parser")

        # ── Strategi 1: tnd-section-title ──────────────────────────────────
        # <h6 class="tnd-section-title"><b>64 Data</b>...
        section_title = soup.find("h6", class_="tnd-section-title")
        if section_title:
            b_tag = section_title.find("b")
            if b_tag:
                m_total = re.search(r"(\d+)", b_tag.get_text())
                if m_total:
                    total_items = int(m_total.group(1))
                    # Deteksi per_page dari pagebanner
                    banner = soup.find("div", class_="pagebanner")
                    per_page = 6  # default CIVD
                    if banner:
                        btext = banner.get_text()
                        pp_m = re.search(r"displays?\s+\d+\s+to\s+(\d+)", btext, re.I)
                        if pp_m:
                            per_page = int(pp_m.group(1))
                    total = math.ceil(total_items / per_page)
                    logger.info(
                        f"[CIVD] Total pages dari tnd-section-title: "
                        f"{total_items} item / {per_page} per page = {total} pages"
                    )
                    return total

        # ── Strategi 2: Last button di pagelinks ───────────────────────────
        # <a href="...d-1789-p=11" title="Last" class="dataTables_paginate uibutton ajax">
        pagelinks = soup.find("div", class_="pagelinks")
        if pagelinks:
            # cari semua <a> dengan title mengandung "Last" atau "last"
            for a in pagelinks.find_all("a"):
                title_attr = str(a.get("title", "")).strip().lower()
                href = str(a.get("href", ""))
                if title_attr == "last" and href:
                    m = re.search(r"d-\d+-p=(\d+)", href)
                    if m:
                        total = int(m.group(1))
                        logger.info(f"[CIVD] Total pages dari Last button: {total}")
                        return total

            # ── Strategi 4: max nomor halaman dari buttons ─────────────────
            page_nums = []
            for btn in pagelinks.find_all("a"):
                txt = btn.get_text(strip=True)
                if txt.isdigit():
                    page_nums.append(int(txt))
            if page_nums:
                total = max(page_nums)
                logger.info(f"[CIVD] Total pages dari page buttons (max): {total}")
                return total

        # ── Strategi 3: pagebanner fallback ────────────────────────────────
        banner = soup.find("div", class_="pagebanner")
        if banner:
            btext = banner.get_text()
            logger.debug(f"[CIVD] Pagebanner: {btext!r}")
            total_m = re.search(r"(\d+)\s+items?\s+was\s+found", btext, re.I)
            per_m = re.search(r"displays?\s+\d+\s+to\s+(\d+)", btext, re.I)
            if total_m and per_m:
                total = math.ceil(int(total_m.group(1)) / int(per_m.group(1)))
                logger.info(f"[CIVD] Total pages dari pagebanner: {total}")
                return total

        logger.warning(
            "[CIVD] Semua strategi deteksi total pages gagal — "
            "akan pakai defensive pagination (fetch sampai kosong)."
        )
        return None

    def _parse_cards(
        self, html: str, ann_type: int, type_label: str, scrape_timestamp: str = ""
    ) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", class_="card-body")
        scraped_at = scrape_timestamp or self.now_wib()

        logger.debug(f"[CIVD] Cards ditemukan di HTML: {len(cards)}")

        results = []
        for i, card in enumerate(cards):
            try:
                # 1. Title
                title_tag = card.find("h5", class_="card-title")
                title = (
                    self._clean_text(title_tag.get_text(strip=True))
                    if title_tag
                    else ""
                )
                if not title:
                    logger.debug(f"[CIVD] Card #{i} skip: title kosong")
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

                # 3. Description
                description = ""
                extra_details = {}
                desc_tag = card.find("p", class_="card-text")
                if desc_tag:
                    description = self._clean_text(
                        desc_tag.get_text(separator=" ", strip=True)
                    )
                    if "," in description and ":" in description:
                        for part in description.split(","):
                            if ":" in part:
                                k, v = part.split(":", 1)
                                extra_details[self._clean_text(k)] = self._clean_text(v)

                # 4. Fields (Golongan Usaha, Jenis Pengadaan, Bidang Usaha)
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
                                line = (
                                    re.sub(
                                        r"\s*\(SIUP-IUT-IUI-PROP KBLI 20\d{2}\)\s*;?\s*$",
                                        "",
                                        line.strip(),
                                        flags=re.I,
                                    )
                                    .strip()
                                    .rstrip(";")
                                )
                                if line:
                                    fields_data["Bidang Usaha"].append(
                                        self._clean_text(line)
                                    )
                        else:
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

                # 5. Attachment Files
                # CIVD download: GET /download/tnd/ann.jwebs?id=base64({ts_ms}|{file_id})
                doc_files = []
                cta_div = card.find("div", class_="tnd-cta")
                if cta_div:
                    for a_tag in cta_div.find_all("a", class_="download-file-blob"):
                        file_id = str(a_tag.get("data-file-id", ""))
                        if file_id:
                            file_name = self._clean_text(
                                str(a_tag.get("data-name", file_id + ".pdf"))
                            )
                            safe_name = re.sub(r'[<>:"/\\|?*]', "_", file_name)
                            direct_url = CIVDScraper._build_download_url(file_id)
                            doc_files.append(
                                {
                                    "file_id": file_id,
                                    "file_name": file_name,
                                    "download_url": direct_url,
                                    "download_method": "GET",
                                    "download_curl": (
                                        f'curl -s "{direct_url}" '
                                        f'-H "Referer: {CIVD_INDEX}" '
                                        f'--output "{safe_name}"'
                                    ),
                                }
                            )
                fp_raw = f"{title.lower()}|{agency.lower()}|{ann_type}"
                results.append(
                    {
                        # id will be assigned globally after all pages collected
                        # === Core (RF-T-003) ===
                        "source": "civd",
                        "title": title,
                        "agency": agency,
                        "description": description,
                        "budget_estimated": None,           # CIVD tidak expose budget
                        "deadline_text": deadline_text,
                        "deadline_date": CIVDScraper._parse_deadline_date(deadline_text),
                        "source_url": "",                   # CIVD tidak punya halaman detail per tender

                        # === Dedup (RF-T-004) ===
                        "fingerprint": hashlib.md5(fp_raw.encode()).hexdigest(),

                        # === AI Matching (RF-T-006, RF-T-007) ===
                        "tender_text": (
                            f"{title}\n\n{description}\n\n"
                            f"Jenis Pengadaan: {fields_data['Jenis Pengadaan']}\n"
                            f"Bidang Usaha: {'; '.join(fields_data['Bidang Usaha'])}"
                        ).strip(),
                        "kbli_codes": [],                   # diisi oleh ai_matcher setelah scraping
                        "kbli_matched": [],                 # diisi setelah matching dengan MasterKbli
                        "match_score": None,                # diisi setelah matching
                        "recommendation": None,             # diisi setelah matching: KEJAR|TINJAU|LEWATI

                        # === Status (RF-T-009) ===
                        "status": "DITEMUKAN",

                        # === Attachments ===
                        "doc_files": doc_files,

                        # === Source-specific (CIVD) ===
                        "source_metadata": {
                            "announcement_type": ann_type,
                            "announcement_type_label": fields_data["Jenis Pengumuman"],
                            "golongan_usaha": fields_data["Golongan Usaha"],
                            "jenis_pengadaan": fields_data["Jenis Pengadaan"],
                            "bidang_usaha": fields_data["Bidang Usaha"],
                        },

                        # === Audit ===
                        "scraped_at": scraped_at,
                    }
                )

            except Exception as e:
                logger.warning(f"[CIVD] Parse error card #{i}: {e}", exc_info=True)
                continue

        logger.info(f"[CIVD] Cards berhasil di-parse: {len(results)}/{len(cards)}")
        return results

    # =========================================================================
    # MAIN SCRAPE
    # =========================================================================

    async def scrape(
        self,
        max_pages: int = 50,
        keyword: str = "",
        announcement_types: List[int] = None,
        existing_fingerprints: set = None,
        on_progress: Optional[Any] = None,
    ) -> Dict[str, Any]:
        if announcement_types is None:
            announcement_types = list(CIVD_ANNOUNCEMENT_TYPES.keys())
        if existing_fingerprints is None:
            existing_fingerprints = set()

        all_results: List[Dict[str, Any]] = []
        stats = {"new": 0, "duplicate": 0}
        scrape_timestamp = self.now_wib()

        # --- Init session ---
        session_cookies, session_jsid = await self._init_session()
        ajax_url = (
            f"{CIVD_AJAX};jsessionid={session_jsid}" if session_jsid else CIVD_AJAX
        )
        logger.info(f"[CIVD] AJAX URL: {ajax_url}")

        semaphore = asyncio.Semaphore(3)

        async with httpx.AsyncClient(
            verify=False,
            follow_redirects=True,
            timeout=25,
            cookies=session_cookies,
        ) as client:

            for ann_type in announcement_types:
                type_label = CIVD_ANNOUNCEMENT_TYPES.get(ann_type, f"type-{ann_type}")
                logger.info(f"\n{'='*50}")
                logger.info(f"[CIVD] Scraping ann_type={ann_type} ({type_label})")
                logger.info(f"{'='*50}")

                if on_progress:
                    on_progress({
                        "source": "civd",
                        "ann_type": ann_type,
                        "ann_type_label": type_label,
                        "page": 0,
                        "total_pages": None,
                        "found_so_far": len(all_results),
                    })

                # --- Page 1 ---
                first_html = await self._fetch_page(
                    client, ajax_url, ann_type, 1, keyword, semaphore
                )
                if not first_html:
                    logger.warning(
                        f"[CIVD] ann_type={ann_type} page=1 gagal — skip tipe ini."
                    )
                    continue

                # Cek apakah JSESSIONID di-refresh oleh server
                fresh_jsid = self._extract_jsid_from_html(first_html)
                if fresh_jsid and fresh_jsid != session_jsid:
                    session_jsid = fresh_jsid
                    ajax_url = f"{CIVD_AJAX};jsessionid={session_jsid}"
                    logger.info(f"[CIVD] JSESSIONID di-refresh: {session_jsid}")

                pagination_param = self._extract_pagination_param(first_html)
                detected_max = self._parse_total_pages(first_html)
                use_defensive = detected_max is None
                actual_max = (
                    max_pages if use_defensive else min(detected_max, max_pages)
                )

                logger.info(
                    f"[CIVD] ann_type={ann_type} | "
                    f"total_pages={'UNKNOWN→defensive' if use_defensive else detected_max} | "
                    f"will_fetch_up_to={actual_max} | "
                    f"pagination_param={pagination_param}"
                )

                if on_progress:
                    on_progress({
                        "source": "civd",
                        "ann_type": ann_type,
                        "ann_type_label": type_label,
                        "page": 1,
                        "total_pages": actual_max,
                        "found_so_far": len(all_results),
                    })

                # Parse page 1
                cards_p1 = self._parse_cards(
                    first_html, ann_type, type_label, scrape_timestamp
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

                if use_defensive:
                    # ── Defensive mode: fetch satu-per-satu, stop kalau dapat 0 cards ──
                    logger.info(
                        "[CIVD] Defensive pagination aktif — fetch sekuensial sampai kosong."
                    )
                    consecutive_empty = 0
                    for p in range(2, actual_max + 1):
                        html_chunk = await self._fetch_page(
                            client,
                            ajax_url,
                            ann_type,
                            p,
                            keyword,
                            semaphore,
                            pagination_param,
                        )
                        if not html_chunk:
                            consecutive_empty += 1
                            if consecutive_empty >= 2:
                                logger.info(
                                    f"[CIVD] 2x empty berturut-turut di page {p} — berhenti."
                                )
                                break
                            continue
                        consecutive_empty = 0

                        cards = self._parse_cards(
                            html_chunk, ann_type, type_label, scrape_timestamp
                        )
                        if not cards:
                            logger.info(f"[CIVD] Page {p} dapat 0 cards — berhenti.")
                            break
                        for item in cards:
                            if item["fingerprint"] in existing_fingerprints:
                                stats["duplicate"] += 1
                            else:
                                all_results.append(item)
                                existing_fingerprints.add(item["fingerprint"])
                                stats["new"] += 1

                        if on_progress:
                            on_progress({
                                "source": "civd",
                                "ann_type": ann_type,
                                "ann_type_label": type_label,
                                "page": p,
                                "total_pages": actual_max,
                                "found_so_far": len(all_results),
                            })
                else:
                    # ── Normal mode: concurrent fetch semua page sekaligus ──
                    pages_html = await asyncio.gather(
                        *[
                            self._fetch_page(
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
                        for item in self._parse_cards(
                            html_chunk, ann_type, type_label, scrape_timestamp
                        ):
                            if item["fingerprint"] in existing_fingerprints:
                                stats["duplicate"] += 1
                            else:
                                all_results.append(item)
                                existing_fingerprints.add(item["fingerprint"])
                                stats["new"] += 1

                    if on_progress:
                        on_progress({
                            "source": "civd",
                            "ann_type": ann_type,
                            "ann_type_label": type_label,
                            "page": actual_max,
                            "total_pages": actual_max,
                            "found_so_far": len(all_results),
                        })

        # Assign sequential global IDs starting from 1
        for idx, item in enumerate(all_results, start=1):
            item["id"] = idx

        finished_at = self.now_wib()
        logger.info(
            f"\n{'='*50}\n"
            f"[CIVD] SELESAI\n"
            f"  ✅ Baru      : {stats['new']}\n"
            f"  ♻️  Duplikat  : {stats['duplicate']}\n"
            f"  📦 Total     : {len(all_results)}\n"
            f"{'='*50}"
        )

        return {
            "success": True,
            "source": "civd",
            "total": len(all_results),
            "new": stats["new"],
            "duplicate": stats["duplicate"],
            "scraped_at": scrape_timestamp,
            "finished_at": finished_at,
            "data": all_results,
        }

    # =========================================================================
    # DOWNLOAD FILE
    # =========================================================================

    async def download_file(
        self,
        file_id: str,
        session_cookies: dict = None,  # tidak dipakai lagi, retained for compat
    ) -> Optional[bytes]:
        """
        Download file via GET ?id=base64({ts_ms}|{file_id}). No session needed.
        """
        url = self._build_download_url(file_id)
        logger.info(f"[CIVD] Download GET {url[:80]}...")
        try:
            async with httpx.AsyncClient(
                verify=False, follow_redirects=True, timeout=60
            ) as client:
                resp = await client.get(url, headers={**HEADERS, "Referer": CIVD_INDEX})
            ct = resp.headers.get("content-type", "")
            if resp.status_code != 200:
                logger.error(f"[CIVD] HTTP {resp.status_code}: {resp.text[:200]}")
                return None
            if "text/html" in ct:
                logger.error(f"[CIVD] Got HTML instead of file: {resp.text[:200]}")
                return None
            if not resp.content.startswith(b"%PDF") and len(resp.content) < 1000:
                logger.error(
                    f"[CIVD] Suspicious response ({len(resp.content)}b): {resp.content[:100]}"
                )
                return None
            logger.info(f"[CIVD] OK | ct={ct} | {len(resp.content):,} bytes")
            return resp.content
        except Exception as e:
            logger.error(f"[CIVD] download_file error: {e}")
            return None

    async def download_and_save(
        self,
        file_id: str,
        file_name: str,
        out_dir: str = ".",
        session_cookies: dict = None,
    ) -> Optional[str]:
        """Download lalu simpan ke disk. Return path file kalau berhasil, None kalau gagal."""
        import os

        content = await self.download_file(file_id, session_cookies=session_cookies)
        if not content:
            return None
        safe_name = re.sub(r'[<>:"/\\|?*]', "_", file_name)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, safe_name)
        with open(out_path, "wb") as fh:
            fh.write(content)
        logger.info(f"[CIVD] Saved \u2192 {out_path}")
        return out_path

    async def download_tender_files(
        self,
        tender: Dict[str, Any],
        base_dir: str = "./downloads",
        session_cookies: dict = None,
        use_curl: bool = False,
        cookie_string: str = "",
    ) -> Dict[str, Any]:
        """
        Download semua file dari satu tender ke folder tersendiri.

        Struktur:
            base_dir/
                {id:04d}_{slug}/
                    file1.pdf
                    file2.pdf
        """
        import os

        tender_id = tender.get("id", 0)
        tender_title = tender.get("title", "unknown")
        doc_files = tender.get("doc_files", [])

        slug = re.sub(r"[^\w\s-]", "", tender_title)
        slug = re.sub(r"\s+", "_", slug.strip())[:60]
        folder_path = os.path.join(base_dir, f"{tender_id:04d}_{slug}")
        os.makedirs(folder_path, exist_ok=True)

        result: Dict[str, Any] = {
            "tender_id": tender_id,
            "tender_title": tender_title,
            "folder": folder_path,
            "files": [],
            "total": len(doc_files),
            "success": 0,
            "failed": 0,
        }

        for doc in doc_files:
            file_id = doc.get("file_id", "")
            file_name = doc.get("file_name", file_id + ".pdf")
            info = {"file_name": file_name, "path": None, "size": 0, "ok": False}

            if use_curl:
                out_path = self.execute_curl(
                    doc.get("download_curl", ""),
                    out_dir=folder_path,
                    cookie_string=cookie_string,
                )
            else:
                out_path = await self.download_and_save(
                    file_id,
                    file_name,
                    out_dir=folder_path,
                    session_cookies=session_cookies,
                )

            if out_path:
                info.update(
                    {"path": out_path, "size": os.path.getsize(out_path), "ok": True}
                )
                result["success"] += 1
            else:
                result["failed"] += 1

            result["files"].append(info)

        logger.info(
            f"[CIVD] Tender id={tender_id} | "
            f"ok={result['success']} fail={result['failed']} | folder={folder_path}"
        )
        return result

    async def download_all_tender_files(
        self,
        data: List[Dict[str, Any]],
        base_dir: str = "./downloads",
        session_cookies: dict = None,
        use_curl: bool = False,
        cookie_string: str = "",
        max_concurrent: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Download semua attachment semua tender secara concurrent.
        max_concurrent = berapa tender yang didownload bersamaan.
        """
        sem = asyncio.Semaphore(max_concurrent)

        async def _one(t):
            async with sem:
                return await self.download_tender_files(
                    t,
                    base_dir=base_dir,
                    session_cookies=session_cookies,
                    use_curl=use_curl,
                    cookie_string=cookie_string,
                )

        results = list(await asyncio.gather(*[_one(t) for t in data]))
        total_ok = sum(r["success"] for r in results)
        total_fail = sum(r["failed"] for r in results)
        logger.info(
            f"[CIVD] \u2705 Selesai | tender={len(data)} | "
            f"file_ok={total_ok} | file_gagal={total_fail} | folder={base_dir}"
        )
        return results

    @staticmethod
    def execute_curl(
        download_curl: str,
        out_dir: str = ".",
        cookie_string: str = "",
    ) -> Optional[str]:
        """
        Eksekusi string download_curl dari field doc_files secara langsung.

        Args:
            download_curl : nilai field "download_curl" dari doc_files
            out_dir       : folder output (default: direktori saat ini)
            cookie_string : "JSESSIONID=XXXX" (inject session, opsional)

        Returns:
            Path file hasil download, atau None kalau gagal.

        Contoh:
            path = CIVDScraper.execute_curl(
                doc_file["download_curl"],
                out_dir="./downloads",
                cookie_string="JSESSIONID=ABC123",
            )
        """
        import os, shlex, subprocess

        os.makedirs(out_dir, exist_ok=True)

        # Parse --output dari curl string untuk tahu nama file
        try:
            parts = shlex.split(download_curl)
            out_idx = parts.index("--output")
            file_name = os.path.basename(parts[out_idx + 1])
        except (ValueError, IndexError):
            file_name = (
                f"civd_{hashlib.md5(download_curl.encode()).hexdigest()[:8]}.pdf"
            )

        out_path = os.path.join(out_dir, file_name)

        # Rebuild command dengan out_path final
        cmd = shlex.split(download_curl)
        try:
            out_idx = cmd.index("--output")
            cmd[out_idx + 1] = out_path
        except ValueError:
            cmd += ["--output", out_path]

        # Inject session cookie kalau ada
        if cookie_string:
            cmd += ["-H", f"Cookie: {cookie_string}"]

        # --fail: curl exit non-zero pada HTTP 4xx/5xx
        cmd += ["--fail", "--show-error"]

        logger.info(f"[CIVD] execute_curl: {' '.join(cmd[:5])}...")

        try:
            result = subprocess.run(cmd, capture_output=True, timeout=60)
            if result.returncode != 0:
                err = result.stderr.decode(errors="replace")
                logger.error(f"[CIVD] curl rc={result.returncode}: {err[:300]}")
                return None

            if not os.path.exists(out_path):
                logger.error("[CIVD] curl selesai tapi file tidak ada")
                return None

            # Sanity check: pastikan bukan HTML error page
            with open(out_path, "rb") as fh:
                peek = fh.read(300).lower()
            if b"<html" in peek or b"an error occurred" in peek:
                logger.error(
                    "[CIVD] Output adalah HTML error page, bukan file. "
                    "Session mungkin expired — coba tambah cookie_string."
                )
                os.remove(out_path)
                return None

            size = os.path.getsize(out_path)
            logger.info(f"[CIVD] ✅ Saved → {out_path} ({size:,} bytes)")
            return out_path

        except subprocess.TimeoutExpired:
            logger.error("[CIVD] curl timeout 60s")
            return None
        except FileNotFoundError:
            logger.error("[CIVD] curl tidak terinstall")
            return None
        except Exception as e:
            logger.error(f"[CIVD] execute_curl error: {e}")
            return None


# ---------------------------------------------------------------------------
# Quick Test — jalankan: python civd_scraper.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":

    async def _test():
        scraper = CIVDScraper()
        ann_type = 1
        keyword = ""

        print("\n" + "=" * 60)
        print("STEP 1 — Init session")
        print("=" * 60)
        session_cookies, session_jsid = await scraper._init_session()
        print(f"  JSESSIONID : {session_jsid!r}")
        print(f"  Cookies    : {list(session_cookies.keys())}")

        ajax_url = (
            f"{CIVD_AJAX};jsessionid={session_jsid}" if session_jsid else CIVD_AJAX
        )
        semaphore = asyncio.Semaphore(3)

        print("\n" + "=" * 60)
        print("STEP 2 — Fetch page 1")
        print("=" * 60)
        async with httpx.AsyncClient(
            verify=False, follow_redirects=True, timeout=25, cookies=session_cookies
        ) as client:
            first_html = await scraper._fetch_page(
                client, ajax_url, ann_type, 1, keyword, semaphore
            )

        if not first_html:
            print("  \u274c Page 1 gagal \u2014 cek log di atas")
            return

        print(f"  \u2705 HTML length   : {len(first_html)} chars")
        print(f"  Preview (300c)  : {first_html[:300]!r}")

        print("\n" + "=" * 60)
        print("STEP 3 — Parse pagination info dari page 1")
        print("=" * 60)
        pagination_param = scraper._extract_pagination_param(first_html)
        detected_max = scraper._parse_total_pages(first_html)
        cards_p1 = scraper._parse_cards(first_html, ann_type, "Undangan Prakualifikasi")

        print(f"  pagination_param : {pagination_param!r}")
        print(f"  detected_max     : {detected_max}")
        print(f"  cards page 1     : {len(cards_p1)}")

        if detected_max is None:
            print(
                "  \u26a0\ufe0f  Pagination tidak terdeteksi \u2192 defensive mode akan aktif"
            )
        elif detected_max <= 1:
            print(
                "  \u26a0\ufe0f  detected_max <= 1 \u2192 loop page 2+ TIDAK akan dijalankan!"
            )

        print("\n" + "=" * 60)
        print("STEP 4 — Fetch page 2 (test manual)")
        print("=" * 60)
        async with httpx.AsyncClient(
            verify=False, follow_redirects=True, timeout=25, cookies=session_cookies
        ) as client:
            page2_html = await scraper._fetch_page(
                client, ajax_url, ann_type, 2, keyword, semaphore, pagination_param
            )

        if not page2_html:
            print(
                "  \u274c Page 2 gagal \u2014 kemungkinan session expired atau server block"
            )
        else:
            cards_p2 = scraper._parse_cards(
                page2_html, ann_type, "Undangan Prakualifikasi"
            )
            print(f"  \u2705 HTML length : {len(page2_html)} chars")
            print(f"  cards page 2  : {len(cards_p2)}")
            if cards_p2:
                print(f"  Judul card #1 : {cards_p2[0]['title'][:80]!r}")
            else:
                print(f"  \u26a0\ufe0f  0 cards di page 2! Preview HTML:")
                print(f"  {page2_html[:500]!r}")

        print("\n" + "=" * 60)
        print("STEP 5 — Full scrape (max_pages=50, type=[1])")
        print("=" * 60)
        response = await scraper.scrape(
            max_pages=50,
            announcement_types=[1],
        )

        # ── Summary ─────────────────────────────────────────────────────────
        print(f"\n  success      : {response['success']}")
        print(f"  total        : {response['total']}")
        print(f"  new          : {response['new']}")
        print(f"  duplicate    : {response['duplicate']}")
        print(f"  scraped_at   : {response['scraped_at']}")
        print(f"  finished_at  : {response['finished_at']}")

        data = response["data"]
        if data:
            print("\n--- Sample: item id=1 ---")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
            print("\n--- Sample: item id=2 ---")
            (
                print(json.dumps(data[1], indent=2, ensure_ascii=False))
                if len(data) > 1
                else None
            )
        else:
            print("\n  \u26a0\ufe0f  Tidak ada data \u2014 cek log di atas.")

        out_file = f"civd_debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(response, f, indent=2, ensure_ascii=False)

        # ── STEP 6: Download files ke folder per tender ──────────────────────
        print("\n" + "=" * 60)
        print("STEP 6 \u2014 Download files (GET, no session needed)")
        print("=" * 60)

        if not data:
            print("  \u26a0\ufe0f  Tidak ada data.")
        else:
            import base64 as _b64, time as _t

            # Quick sanity: decode URL dari item pertama
            first_with_file = next((t for t in data if t.get("doc_files")), None)
            if first_with_file:
                doc = first_with_file["doc_files"][0]
                fresh_url = scraper._build_download_url(doc["file_id"])
                qs = fresh_url.split("?id=")[1]
                decoded = _b64.b64decode(qs).decode()
                print(f"  URL format check:")
                print(f"    file_id : {doc['file_id']}")
                print(f"    decoded : {decoded}")
                print(f"    url     : {fresh_url[:90]}...")
                print()

            # Download 3 tender pertama yang punya attachment
            sample = [t for t in data if t.get("doc_files")][:3]
            print(f"  Downloading {len(sample)} tender ke ./downloads/...\n")

            results_dl = await scraper.download_all_tender_files(
                sample,
                base_dir="./downloads",
                session_cookies=None,
                use_curl=False,
            )

            for r in results_dl:
                icon = "\u2705" if r["failed"] == 0 else "\u26a0\ufe0f"
                print(f"  {icon} [{r['tender_id']:04d}] {r['tender_title'][:55]}")
                print(f"       folder: {r['folder']}")
                for f in r["files"]:
                    fi = "\u2705" if f["ok"] else "\u274c"
                    sz = f"{f['size']:,}b" if f["ok"] else "GAGAL"
                    print(f"       {fi} {f['file_name']} ({sz})")
                print()

        print(f"\n  JSON Saved \u2192 {out_file}")

    asyncio.run(_test())
