import asyncio
from scraper import CatalystScraper


async def test_download():
    scraper = CatalystScraper()

    # Ambil file_id dari data JSON lu (Contoh data no 13)
    file_id = "e207d529-14bd-4daf-b554-8ada886e5138"
    file_name = "Undangan_Prakualifikasi_Pertamina.pdf"

    print(f"Mencoba download file ID: {file_id}...")

    # Method ini udah otomatis ngelakuin POST request yang bener ke server CIVD
    pdf_bytes = await scraper.download_civd_file(file_id)

    if pdf_bytes:
        # Save bytes-nya jadi file fisik
        with open(file_name, "wb") as f:
            f.write(pdf_bytes)
        print(f"✅ Berhasil! Coba buka file: {file_name}")
    else:
        print("❌ Gagal download file.")


if __name__ == "__main__":
    asyncio.run(test_download())
