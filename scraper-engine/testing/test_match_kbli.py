"""
test_match_kbli.py — Crosscheck endpoint POST /api/v1/match-kbli pakai data
hasil ekstraksi PDF (storage/test_output_pdf_extractor_nibcri.json) sebagai
kbli_list, jadi nggak perlu seed tabel master_kbli dulu.

Jalankan dari folder scraper-engine/:
    python testing/test_match_kbli.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)

KBLI_SOURCE = Path(__file__).parent.parent / "storage" / "test_output_pdf_extractor_nibcri.json"

# (tender_text, expected_kbli_code) — expected dipakai cuma buat sanity-check manual,
# bukan assert keras (semantic matching itu probabilistik, bukan exact lookup).
TEST_CASES = [
    ("Dibutuhkan jasa penyediaan tenaga kerja waktu tertentu (outsourcing)", "78200"),
    ("Pengadaan alat ukur dan alat uji elektronik untuk laboratorium", "26513"),
    ("Pekerjaan perdagangan besar alat fotografi dan barang optik", "46430"),
    ("Sewa dan perawatan alat transportasi laut beserta suku cadangnya", "46592"),
]


def main():
    if not KBLI_SOURCE.is_file():
        print(f"❌ File sumber KBLI tidak ditemukan: {KBLI_SOURCE}")
        print("   Jalankan dulu: python testing/test_pdf_extractor.py <path_pdf>")
        return

    with open(KBLI_SOURCE, encoding="utf-8") as f:
        kbli_list = json.load(f)["data"]

    print(f"\n{'='*70}")
    print(f"🔎 CROSSCHECK POST /api/v1/match-kbli  (kbli_list: {len(kbli_list)} entri dari {KBLI_SOURCE.name})")
    print(f"{'='*70}")

    for tender_text, expected_code in TEST_CASES:
        payload = {
            "tender_text": tender_text,
            "kbli_list": kbli_list,
            "threshold": 0.2,
            "use_masking": False,
        }
        response = client.post("/api/v1/match-kbli", json=payload)
        body = response.json()
        data = body.get("data")

        print(f"\nTender text : {tender_text}")
        print(f"Expected    : {expected_code}")
        if response.status_code != 200:
            print(f"❌ HTTP {response.status_code} — {body}")
            continue
        if not data:
            print(f"❌ Tidak ada match (status: {body.get('message')})")
            continue

        mark = "✅" if data["kbli_code"] == expected_code else "⚠️ "
        print(f"{mark} Match found: {data['kbli_code']} — {data['description']} (score: {data['score']:.3f})")

    print(f"\n{'='*70}")
    print("Selesai. ⚠️  bukan berarti salah — semantic matching bisa pilih KBLI lain")
    print("yang skornya lebih tinggi; cek manual deskripsinya untuk menilai relevansi.")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
