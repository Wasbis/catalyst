import asyncio
import json
import logging
from api.services.scraper import CatalystScraper

# Matiin log level INFO dari httpx biar terminal gak terlalu berisik
logging.getLogger("httpx").setLevel(logging.WARNING)


async def export_civd_to_json():
    print("🚀 Mulai scraping khusus data CIVD...")
    scraper = CatalystScraper()

    # Setup parameter: scrape tipe 1, 2, 3. Max 10 halaman per tipe (bisa lu sesuaikan)
    # Kita kosongin existing_fingerprints biar dia narik semua dari nol
    civd_data = await scraper.scrape_civd(max_pages=10, announcement_types=[1, 2, 3])

    print(f"\n✅ Selesai! Berhasil narik {len(civd_data)} data tender dari CIVD.")

    # Save ke JSON
    filename = "export_civd_only.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(civd_data, f, indent=2, ensure_ascii=False)

    print(f"📁 Data berhasil di-export dan disimpan di -> {filename}")


if __name__ == "__main__":
    asyncio.run(export_civd_to_json())
