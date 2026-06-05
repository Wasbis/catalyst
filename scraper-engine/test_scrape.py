"""
test_scrape.py — Script untuk test scraping secara mandiri (tanpa server).

Jalankan dari folder scraper-engine/:
    python test_scrape.py --source civd --pages 2
    python test_scrape.py --source geodipa --pages 3
    python test_scrape.py --source all --pages 1

Output: hasil di-print ke terminal + disimpan ke storage/test_output_{source}.json
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Pastikan bisa import dari root package
sys.path.insert(0, str(Path(__file__).parent))

from api.services.scraper import CatalystScraper


def save_json(data: list, source: str) -> str:
    """Simpan hasil ke folder storage/ sebagai JSON."""
    os.makedirs("storage", exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"storage/test_output_{source}_{ts}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return filename


def print_summary(results: list, source: str):
    """Print ringkasan hasil scraping."""
    print(f"\n{'='*60}")
    print(f"📊 RINGKASAN — {source.upper()}")
    print(f"{'='*60}")
    print(f"Total tender: {len(results)}")

    if not results:
        print("❌ Tidak ada data yang didapat!")
        return

    # Tampilkan sample pertama
    sample = results[0]
    print(f"\n📋 Sample item pertama:")
    print(f"  Keys   : {list(sample.keys())}")
    print(f"  Source : {sample.get('source')}")
    print(f"  Title  : {sample.get('title', '')[:80]}")
    print(f"  Agency : {sample.get('agency', '')[:60]}")
    print(f"  FP     : {sample.get('fingerprint', 'NONE')}")

    # Statistik per source
    sources = {}
    for item in results:
        s = item.get("source", "unknown")
        sources[s] = sources.get(s, 0) + 1
    print(f"\n  Breakdown per source: {sources}")

    # Check field kritis
    missing_title = sum(1 for r in results if not r.get("title"))
    missing_fp = sum(1 for r in results if not r.get("fingerprint"))
    print(f"\n  ⚠️  Item tanpa title      : {missing_title}")
    print(f"  ⚠️  Item tanpa fingerprint : {missing_fp}")


async def main(source: str, pages: int):
    scraper = CatalystScraper()
    results = []

    print(f"🚀 Mulai scraping: source={source}, max_pages={pages}")
    print(f"   Waktu: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if source in ("geodipa", "all"):
        print("\n⏳ Scraping GeoDipa...")
        geo = await scraper.scrape_geodipa(max_pages=pages)
        print(f"   → {len(geo)} items")
        results.extend(geo)

    if source in ("civd", "all"):
        print("\n⏳ Scraping CIVD SKK Migas...")
        civd = await scraper.scrape_civd(max_pages=pages)
        print(f"   → {len(civd)} items")
        results.extend(civd)

    if source in ("gep", "all"):
        print("\n⏳ Scraping GEP... (placeholder, akan return 0)")
        gep = await scraper.scrape_gep(max_pages=pages)
        print(f"   → {len(gep)} items")
        results.extend(gep)

    print_summary(results, source)

    if results:
        filepath = save_json(results, source)
        print(f"\n✅ Disimpan ke: {filepath}")
        print(f"   Buka file ini untuk verifikasi data scraping.")
    else:
        print("\n❌ Tidak ada data — file JSON tidak dibuat.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test scraper Catalyst secara mandiri")
    parser.add_argument(
        "--source",
        choices=["geodipa", "civd", "gep", "all"],
        default="civd",
        help="Platform yang di-scrape (default: civd)",
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=2,
        help="Max halaman per platform (default: 2)",
    )
    args = parser.parse_args()

    asyncio.run(main(source=args.source, pages=args.pages))
