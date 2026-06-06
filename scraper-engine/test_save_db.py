"""
test_save_db.py — Test scraping + simpan ke DB secara langsung (bypass FastAPI/BackgroundTask).

Jalankan dari folder scraper-engine/:
    python test_save_db.py --source civd --pages 1
    python test_save_db.py --source geodipa --pages 1
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from api.models.database import SessionLocal, TenderResult, init_db
from api.services.scraper import CatalystScraper


async def main(source: str, pages: int):
    print(f"\n{'='*60}")
    print(f"🚀 TEST SAVE DB — source={source}, pages={pages}")
    print(f"{'='*60}")

    # 1. Pastikan tabel ada
    print("\n[1] Init DB (create tables if not exist)...")
    init_db()
    print("    ✅ Done")

    # 2. Scrape
    print(f"\n[2] Scraping {source}...")
    scraper = CatalystScraper()
    results = []

    if source in ("civd", "all"):
        civd = await scraper.scrape_civd(max_pages=pages)
        print(f"    CIVD: {len(civd)} items")
        results.extend(civd)

    if source in ("geodipa", "all"):
        geo = await scraper.scrape_geodipa(max_pages=pages)
        print(f"    GeoDipa: {len(geo)} items")
        results.extend(geo)

    if not results:
        print("❌ Tidak ada data dari scraper — berhenti.")
        return

    print(f"    Total: {len(results)} items")

    # 3. Simpan ke DB
    print(f"\n[3] Simpan ke DB...")
    db = SessionLocal()
    saved = 0
    skipped = 0
    failed = 0

    try:
        # Load fingerprint yang sudah ada
        from sqlalchemy import text
        existing = {r[0] for r in db.execute(
            text("SELECT fingerprint FROM tender_results WHERE fingerprint IS NOT NULL")
        )}
        print(f"    Fingerprint existing di DB: {len(existing)}")

        for idx, item in enumerate(results):
            fp = item.get("fingerprint")

            # Skip duplikat
            if fp and fp in existing:
                skipped += 1
                continue

            try:
                row = TenderResult(
                    source=item.get("source", source),
                    title=item.get("title", ""),
                    agency=item.get("agency", ""),
                    detail_url=item.get("detail_url") or "",
                    tender_text=(
                        item.get("tender_text") or item.get("requirement_text", "")
                    ),
                    doc_url=(item.get("doc_url") or item.get("document_url", "")),
                    doc_files_json=item.get(
                        "doc_files_json",
                        json.dumps(item.get("doc_files", []), ensure_ascii=False),
                    ),
                    announcement_type=item.get("announcement_type"),
                    announcement_type_label=item.get("announcement_type_label", ""),
                    golongan_usaha_json=json.dumps(
                        item.get("golongan_usaha", []), ensure_ascii=False
                    ),
                    jenis_pengadaan=item.get("jenis_pengadaan", ""),
                    bidang_usaha_json=json.dumps(
                        item.get("bidang_usaha", []), ensure_ascii=False
                    ),
                    deadline_text=item.get("deadline_text", ""),
                    publish_date=item.get("publish_date", ""),
                    fingerprint=fp,
                )
                db.add(row)
                db.commit()
                if fp:
                    existing.add(fp)
                saved += 1
                print(f"    ✅ #{idx+1} SAVED: {item.get('title', '')[:70]}")

            except Exception as e:
                failed += 1
                db.rollback()
                print(f"    ❌ #{idx+1} FAILED: {e}")
                print(f"       title : {item.get('title', '')[:60]}")
                print(f"       source: {item.get('source')}")
                print(f"       fp    : {fp}")
                print(f"       keys  : {list(item.keys())}")

    finally:
        db.close()

    # 4. Verifikasi dari DB
    print(f"\n[4] Verifikasi count di DB...")
    db2 = SessionLocal()
    try:
        from sqlalchemy import text as t2
        count = db2.execute(t2("SELECT COUNT(*) FROM tender_results")).fetchone()[0]
        by_source = db2.execute(t2(
            "SELECT source, COUNT(*) FROM tender_results GROUP BY source"
        )).fetchall()
        print(f"    Total rows: {count}")
        for s, c in by_source:
            print(f"    - {s}: {c} rows")
    finally:
        db2.close()

    print(f"\n{'='*60}")
    print(f"SUMMARY: Saved={saved}, Skipped={skipped}, Failed={failed}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["civd", "geodipa", "all"], default="civd")
    parser.add_argument("--pages", type=int, default=1)
    args = parser.parse_args()
    asyncio.run(main(source=args.source, pages=args.pages))
