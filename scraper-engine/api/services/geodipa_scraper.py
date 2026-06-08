"""
geodipa_scraper.py — Isolated GeoDipa scraper untuk debugging.

Jalankan langsung:
    python geodipa_scraper.py

Atau import:
    from geodipa_scraper import GeodipaScraper
    scraper = GeodipaScraper()
    results = asyncio.run(scraper.scrape(max_pages=3))
"""

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

from api.services.scraper import request_with_retry

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG,
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
GEODIPA_API_URL = "https://www.geodipa.co.id/wp-json/geodipa/v1/auction-list/"
GEODIPA_AGENCY = "PT Geo Dipa Energi (Persero)"

BULAN_ID = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4,
    "mei": 5, "juni": 6, "juli": 7, "agustus": 8,
    "september": 9, "oktober": 10, "november": 11, "desember": 12,
}

# Pola section boilerplate yang selalu muncul di tiap detail page — dibuang dari tender_text
# supaya teks yang masuk ke AI matcher fokus ke konten relevan (bukan kontak/anti-korupsi).
BOILERPLATE_SECTION_PATTERNS = [
    r"pencegahan.{0,30}korupsi",
    r"ingin mengajukan pertanyaan",
]

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
# GeodipaScraper
# ---------------------------------------------------------------------------
class GeodipaScraper:

    # =========================================================================
    # UTILITY
    # =========================================================================

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

    @staticmethod
    def now_wib() -> str:
        return datetime.now(WIB).isoformat()

    # =========================================================================
    # FETCH SATU PAGE (REST API — POST html-fragment)
    # =========================================================================

    async def _fetch_page(
        self,
        client: httpx.AsyncClient,
        page: int,
    ) -> Optional[str]:
        payload = {
            "page": str(page),
            "total": "6",
            "status": "all",
            "date": "",
        }
        logger.info(f"[GeoDipa] POST {GEODIPA_API_URL} | payload={payload}")

        try:
            resp = await request_with_retry(
                client,
                "POST",
                GEODIPA_API_URL,
                json=payload,
                headers=HEADERS,
                timeout=20.0,
                log_prefix=f"[GeoDipa][page={page}] ",
            )

            raw = resp.json()
            if isinstance(raw, dict):
                html_chunk = raw.get("html", "")
            elif isinstance(raw, str):
                html_chunk = raw
            else:
                logger.warning(f"[GeoDipa] Unexpected response type: {type(raw)}")
                return None

            if not html_chunk or "No auctions found" in html_chunk:
                logger.info(f"[GeoDipa] Hal {page} kosong.")
                return None

            return html_chunk

        except Exception as e:
            logger.error(f"[GeoDipa] Error fetch hal {page}: {e}")
            return None

    # =========================================================================
    # PARSE HELPERS
    # =========================================================================

    @staticmethod
    def _parse_list_items(html: str) -> List[Dict[str, str]]:
        """Ekstrak {detail_url, status_label} dari satu chunk HTML listing."""
        soup = BeautifulSoup(html, "html.parser")
        items = []
        for item in soup.find_all("div", class_="item"):
            status_tag = item.find("span")
            status_label = status_tag.text.strip() if status_tag else "unknown"

            link_tag = item.find("a", class_="more")
            if not link_tag:
                continue
            detail_url = link_tag.get("href", "")
            if not detail_url:
                continue

            items.append({"detail_url": detail_url, "status_label": status_label})
        return items

    @staticmethod
    def _parse_indo_date(text: str) -> Optional[str]:
        """Parse '11 Juni 2026' → 'YYYY-MM-DD'. Return None kalau format tidak dikenal
        (mis. tanggal berupa rentang seperti '5, 8-10 Juni 2026')."""
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

    @staticmethod
    def _split_sections(text: str) -> List[str]:
        """Pecah tender_text jadi section berdasarkan pemisah '---' (lihat join di _parse_detail)."""
        return [s.strip() for s in re.split(r"-{3,}", text) if s.strip()]

    @staticmethod
    def _extract_field(text: str, *labels: str) -> Optional[str]:
        """Generic label:value extractor — menangani baik format inline ('Label : Value')
        maupun format multi-baris dengan colon di baris sendiri ('Label\\n\\n:\\n\\nValue'),
        karena \\s pada regex meliputi newline. Coba label dari yang paling spesifik dulu."""
        for label in labels:
            m = re.search(
                r"\b" + re.escape(label) + r"\b\s*:\s*([^\n]+)",
                text,
                re.IGNORECASE,
            )
            if m:
                value = GeodipaScraper._clean_text(m.group(1))
                if value:
                    return value
        return None

    def _parse_detail(
        self, html: str, detail_url: str, scraped_at: str = ""
    ) -> Optional[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")

        title_section = soup.find("div", class_="hentry")
        title = (
            self._clean_text(title_section.find("h2").text.strip())
            if title_section and title_section.find("h2")
            else "Tender GeoDipa"
        )

        req_texts = []
        for ft in soup.find_all("div", class_="format-text"):
            text = ft.get_text(separator="\n").strip()
            if text:
                req_texts.append(text)

        # Buang section boilerplate (kontak & anti-korupsi) — selalu identik di tiap halaman,
        # cuma menambah noise buat AI matcher.
        clean_req_texts = [
            t for t in req_texts
            if not any(re.search(p, t, re.IGNORECASE) for p in BOILERPLATE_SECTION_PATTERNS)
        ]
        full_requirement = "\n\n---\n\n".join(req_texts)
        tender_text = "\n\n---\n\n".join(clean_req_texts)

        # ==== Parsing struktural: jadwal, kualifikasi/bidang, informasi umum ====
        sections = self._split_sections(full_requirement)

        jadwal: Dict[str, Any] = {}
        informasi_umum: Optional[Dict[str, Any]] = None
        golongan_usaha: List[str] = []
        bidang_usaha: List[str] = []
        jenis_pengadaan: Optional[str] = None

        for sec in sections:
            has_hari = re.search(r"\bHari\b\s*:", sec, re.I)
            has_tempat = re.search(r"\bTempat\b\s*:", sec, re.I)
            has_metode = re.search(r"\bMetode\b\s*:", sec, re.I)
            has_judul = re.search(r"\bJudul\b\s*:", sec, re.I)
            has_no_rks = re.search(r"\bNo\.?\s*RKS\b\s*:", sec, re.I)
            has_kualifikasi = re.search(r"\bKualifikasi\b", sec, re.I)
            has_bentuk_badan = re.search(r"\bBentuk Badan usaha\b\s*:", sec, re.I)

            if has_hari and has_tempat and "penjelasan_rks" not in jadwal:
                jadwal["penjelasan_rks"] = {
                    k: v for k, v in {
                        "hari": self._extract_field(sec, "Hari"),
                        "tanggal": self._extract_field(sec, "Tanggal"),
                        "tempat": self._extract_field(sec, "Tempat"),
                        "waktu": self._extract_field(sec, "Waktu"),
                    }.items() if v
                }
            elif has_hari and has_metode and "pendaftaran_rks" not in jadwal:
                jadwal["pendaftaran_rks"] = {
                    k: v for k, v in {
                        "hari": self._extract_field(sec, "Hari"),
                        "tanggal": self._extract_field(sec, "Tanggal"),
                        "metode": self._extract_field(sec, "Metode"),
                        "waktu": self._extract_field(sec, "Waktu"),
                    }.items() if v
                }
            elif has_judul and has_no_rks:
                metode_pengadaan = self._extract_field(sec, "Metode Pengadaan")
                informasi_umum = {
                    k: v for k, v in {
                        "judul": self._extract_field(sec, "Judul"),
                        "no_rks": self._extract_field(sec, "No. RKS", "No RKS"),
                        "jangka_waktu_perjanjian": self._extract_field(sec, "Jangka Waktu Perjanjian"),
                        "lokasi_kerja": self._extract_field(sec, "Lokasi Kerja"),
                        "metode_pengadaan": metode_pengadaan,
                    }.items() if v
                }
                jenis_pengadaan = metode_pengadaan
            elif has_kualifikasi or has_bentuk_badan:
                kualifikasi = self._extract_field(sec, "Kualifikasi usaha", "Kualifikasi")
                bidang = self._extract_field(sec, "Bidang")
                sub_bidang = self._extract_field(sec, "Sub Bidang")
                if kualifikasi:
                    golongan_usaha = [
                        v.strip() for v in re.split(r"\batau\b|/|,", kualifikasi) if v.strip()
                    ]
                for v in (bidang, sub_bidang):
                    if v:
                        bidang_usaha.append(v)

        # deadline diambil dari tanggal "Penjelasan RKS" — selalu format tanggal tunggal
        # (beda dengan "Pendaftaran RKS" yang sering berupa rentang, mis. "5, 8-10 Juni 2026")
        penjelasan_tanggal = jadwal.get("penjelasan_rks", {}).get("tanggal")
        deadline_text = penjelasan_tanggal or ""
        deadline_date = self._parse_indo_date(penjelasan_tanggal) if penjelasan_tanggal else None

        doc_url = None
        download_btn = soup.find("a", class_="button", download=True)
        if not download_btn:
            download_btn = soup.find("a", href=re.compile(r".*\.pdf", re.I))
        if download_btn:
            doc_url = download_btn.get("href")

        # Ringkasan singkat untuk card preview di FE — GeoDipa tidak punya field
        # description terpisah seperti CIVD, jadi disusun dari informasi_umum kalau ada,
        # fallback ke potongan awal tender_text.
        if informasi_umum:
            description = " — ".join(
                v for v in (informasi_umum.get("judul"), informasi_umum.get("lokasi_kerja")) if v
            )
        else:
            description = self._clean_text(tender_text)[:200]

        return {
            # === Core (RF-T-003) ===
            "source": "geodipa",
            "title": title,
            "agency": GEODIPA_AGENCY,
            "description": description,
            "budget_estimated": None,
            "deadline_text": deadline_text,
            "deadline_date": deadline_date,
            "source_url": detail_url,

            # === Dedup (RF-T-004) ===
            "fingerprint": hashlib.md5(detail_url.encode()).hexdigest(),

            # === AI Matching (RF-T-006, RF-T-007) ===
            "tender_text": tender_text,
            "kbli_codes": [],
            "kbli_matched": [],
            "match_score": None,
            "recommendation": None,

            # === Status (RF-T-009) ===
            "status": "DITEMUKAN",

            # === Attachments ===
            "doc_files": (
                [{
                    "file_id": "",
                    "file_name": "Dokumen Tender",
                    "download_url": doc_url,
                    "download_method": "GET",
                }]
                if doc_url
                else []
            ),

            # === Source-specific (GeoDipa) ===
            # golongan_usaha/bidang_usaha/jenis_pengadaan disamakan key & tipe-nya dengan
            # CIVD (lihat civd_scraper.py:525-531) supaya frontend bisa render generic.
            # geodipa_status diisi oleh caller (scrape()).
            "source_metadata": {
                k: v for k, v in {
                    "golongan_usaha": golongan_usaha,
                    "bidang_usaha": bidang_usaha,
                    "jenis_pengadaan": jenis_pengadaan,
                    "jadwal": jadwal or None,
                    "informasi_umum": informasi_umum,
                }.items() if v
            },

            # === Audit ===
            "scraped_at": scraped_at or self.now_wib(),
        }

    async def fetch_detail(self, client: httpx.AsyncClient, detail_url: str) -> Optional[str]:
        try:
            resp = await request_with_retry(
                client,
                "GET",
                detail_url,
                headers=HEADERS,
                timeout=15.0,
                log_prefix="[GeoDipa][detail] ",
            )
            return resp.text
        except Exception as e:
            logger.error(f"[GeoDipa] Gagal fetch detail {detail_url}: {e}")
            return None

    # =========================================================================
    # MAIN SCRAPE
    # =========================================================================

    async def scrape(
        self,
        max_pages: int = 85,
        existing_urls: List[str] = None,
        on_progress: Optional[Any] = None,
        only_open: bool = True,
    ) -> Dict[str, Any]:
        """
        only_open: kalau True (default), tender dengan status_label selain "Terbuka"
        (mis. "Ditutup") dilewati sebelum fetch detail page — hemat request & waktu,
        karena listing API GeoDipa tidak punya filter status server-side yang terdokumentasi.
        """
        known_urls = set(existing_urls or [])
        known_fingerprints: set = set()
        all_results: List[Dict[str, Any]] = []
        stats = {"new": 0, "duplicate": 0, "skipped_closed": 0}
        scrape_timestamp = self.now_wib()
        semaphore = asyncio.Semaphore(5)

        async def _fetch_one_detail(client: httpx.AsyncClient, detail_url: str, status_label: str):
            async with semaphore:
                await asyncio.sleep(random.uniform(0.5, 1.5))
                html = await self.fetch_detail(client, detail_url)
                if not html:
                    return None
                detail = self._parse_detail(html, detail_url, scrape_timestamp)
                if detail:
                    detail["source_metadata"]["geodipa_status"] = status_label
                return detail

        logger.info(f"[GeoDipa] Mulai scraping via REST API (max {max_pages} hal)...")

        async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
            for page in range(1, max_pages + 1):
                logger.info(f"[GeoDipa] Halaman {page}...")

                html_chunk = await self._fetch_page(client, page)
                if not html_chunk:
                    logger.info(f"[GeoDipa] Hal {page} kosong/gagal — berhenti.")
                    break

                list_items = self._parse_list_items(html_chunk)
                if not list_items:
                    logger.info(f"[GeoDipa] Hal {page} tidak ada item — berhenti.")
                    break

                tasks = []
                for li in list_items:
                    if only_open and li["status_label"].strip().lower() != "terbuka":
                        stats["skipped_closed"] += 1
                        continue
                    if li["detail_url"] in known_urls:
                        stats["duplicate"] += 1
                        continue
                    tasks.append(
                        _fetch_one_detail(client, li["detail_url"], li["status_label"])
                    )

                if tasks:
                    page_results = await asyncio.gather(*tasks)
                    for detail in page_results:
                        if not detail:
                            continue
                        if detail["fingerprint"] in known_fingerprints:
                            stats["duplicate"] += 1
                            continue
                        all_results.append(detail)
                        known_urls.add(detail["source_url"])
                        known_fingerprints.add(detail["fingerprint"])
                        stats["new"] += 1

                if on_progress:
                    on_progress({
                        "source": "geodipa",
                        "page": page,
                        "total_pages": None,
                        "found_so_far": len(all_results),
                    })

        # Assign sequential global IDs starting from 1
        for idx, item in enumerate(all_results, start=1):
            item["id"] = idx

        finished_at = self.now_wib()
        logger.info(
            f"\n{'='*50}\n"
            f"[GeoDipa] SELESAI\n"
            f"  ✅ Baru          : {stats['new']}\n"
            f"  ♻️  Duplikat      : {stats['duplicate']}\n"
            f"  🚫 Dilewati (tutup): {stats['skipped_closed']}\n"
            f"  📦 Total         : {len(all_results)}\n"
            f"{'='*50}"
        )

        return {
            "success": True,
            "source": "geodipa",
            "total": len(all_results),
            "new": stats["new"],
            "duplicate": stats["duplicate"],
            "skipped_closed": stats["skipped_closed"],
            "scraped_at": scrape_timestamp,
            "finished_at": finished_at,
            "data": all_results,
        }


# ---------------------------------------------------------------------------
# Quick Test — jalankan: python geodipa_scraper.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":

    async def _test():
        scraper = GeodipaScraper()

        print("\n" + "=" * 60)
        print("STEP 1 — Fetch halaman 1")
        print("=" * 60)
        async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
            html_p1 = await scraper._fetch_page(client, 1)

        if not html_p1:
            print("  ❌ Halaman 1 gagal — cek log di atas")
            return

        items_p1 = scraper._parse_list_items(html_p1)
        print(f"  ✅ HTML length : {len(html_p1)} chars")
        print(f"  Items hal 1   : {len(items_p1)}")
        if items_p1:
            print(f"  Contoh URL    : {items_p1[0]['detail_url']}")
            print(f"  Status        : {items_p1[0]['status_label']}")

        print("\n" + "=" * 60)
        print("STEP 2 — Full scrape (max_pages=3)")
        print("=" * 60)
        response = await scraper.scrape(max_pages=3)

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
        else:
            print("\n  ⚠️  Tidak ada data — cek log di atas.")

        out_file = f"geodipa_debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(response, f, indent=2, ensure_ascii=False)
        print(f"\n  JSON Saved → {out_file}")

    asyncio.run(_test())
