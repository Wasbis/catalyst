"""
test_pdf_extractor.py — Script untuk crosscheck hasil ekstraksi KBLI dari PDF NIB.

Jalankan dari folder scraper-engine/:
    python testing/test_pdf_extractor.py path/ke/file.pdf

Output: ringkasan di-print ke terminal + hasil lengkap disimpan ke
storage/test_output_pdf_extractor_{nama_file}.json untuk diperiksa manual.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from api.services.pdf_extractor import dump_extraction_to_json


def main(pdf_path: str):
    if not os.path.isfile(pdf_path):
        print(f"❌ File tidak ditemukan: {pdf_path}")
        return

    os.makedirs("storage", exist_ok=True)
    stem = Path(pdf_path).stem
    output_path = f"storage/test_output_pdf_extractor_{stem}.json"

    dump_extraction_to_json(pdf_path, output_path)

    import json
    with open(output_path, encoding="utf-8") as f:
        result = json.load(f)

    print(f"\n{'='*60}")
    print(f"📊 HASIL EKSTRAKSI KBLI — {pdf_path}")
    print(f"{'='*60}")
    print(f"Total KBLI unik ditemukan: {result['total']}")
    for item in result["data"]:
        print(f"  {item['kbli_code']} — {item['description']}")
    print(f"\n✅ Disimpan ke: {output_path}")
    print(f"   Buka file ini untuk crosscheck manual.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Penggunaan: python testing/test_pdf_extractor.py path/ke/file.pdf")
        sys.exit(1)
    main(sys.argv[1])
