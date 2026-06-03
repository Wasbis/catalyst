Markdown
# 🚀 DEPLOYMENT GUIDELINE (Catalyst Ecosystem)

## A. ATURAN MAIN DI LOCAL (LAPTOP)
Saat development di laptop, kita menjalankan aplikasi secara "terpisah" (tanpa Docker untuk aplikasinya, tapi Docker hanya untuk Database).

1. Database
Hanya nyalakan PostgreSQL via Docker:
docker-compose up -d postgres-db

2. Environment Variables (.env)
Perhatikan penggunaan localhost karena aplikasi di-run langsung di OS laptop lo.

catalyst-scout: DATABASE_URL="postgresql://user:pass@localhost:5432/catalyst_db?schema=public"

scraper-engine: DATABASE_URL="postgresql://user:pass@localhost:5432/catalyst_db"

3. Cara Menjalankan
Buka dua terminal terpisah:

Terminal 1 (Next.js):

Bash
cd catalyst-scout && npm run dev
Terminal 2 (Python):

Bash
cd scraper-engine && source .venv/bin/activate && uvicorn api.main:app --reload --port 8000

## B. ATURAN MAIN DI PRODUCTION (SERVER)
Saat dipindah ke server produksi, semua aplikasi (Database, Next.js, Python) akan dibungkus dan dijalankan di dalam Docker Container secara bersamaan.

1. Environment Variables (.env)
Ubah localhost menjadi nama service Docker!

catalyst-scout: DATABASE_URL="postgresql://user:pass@postgres-db:5432/catalyst_db?schema=public"

scraper-engine: DATABASE_URL="postgresql://user:pass@postgres-db:5432/catalyst_db"

⚠️ PENTING: Jika Next.js mau nge-hit API Python, gunakan http://scraper-engine:8000 bukan localhost:8000.

2. Cara Menjalankan
Cukup satu perintah sakti di folder root (/Catalyst):

Bash
docker-compose up -d --build
3. Database Migration (Wajib!)
Saat pertama kali deploy ke production, tabel di database Docker server pasti masih kosong. Lo harus push strukturnya dari dalam container Next.js:

Bash
docker exec -it catalyst-scout-container npx prisma db push

## C. CHECKLIST SEBELUM PUSH KE PRODUCTION
[ ] Pastikan fitur Masking berjalan normal di lokal agar data sensitif tidak bocor ke OpenAI.

[ ] Pastikan file .env tidak ter-commit ke Git.

[ ] Pastikan requirements.txt Python sudah di-update (pip freeze > requirements.txt).

[ ] Pastikan npm install sudah beres dan tidak ada error build (npm run build lokal aman).