# 📋 CATALYST — TODO LIST

> Diperbarui: 2026-06-04 | Selaras dengan PRD v1.0 & kondisi aktual codebase

---

## 🗺️ STATUS PLATFORM SCRAPER (Realita di scraper.py)

| Platform | PRD | Implementasi di `scraper.py` | Status |
|---|---|---|---|
| **GeoDipa** | Sekunder | ✅ Lengkap (`scrape_geodipa` + detail page) | Siap pakai |
| **CIVD SKK Migas** | Utama | ✅ Lengkap (`scrape_civd`, AJAX pagination, 3 tipe) | Siap pakai |
| **GEP (Smart GEP)** | — | ⚠️ Placeholder kosong, return `[]` | Belum implementasi |
| **LPSE** | Utama | ❌ Tidak ada sama sekali di `scraper.py` | Harus dibuat |
| **Input Manual** | Pelengkap | ❌ Belum ada endpoint/UI | Harus dibuat |

> **Catatan LPSE:** PRD menjadikan LPSE sebagai prioritas utama ("setiap 6 jam"), tapi belum ada di scraper sama sekali. Perlu riset dulu: struktur URL `lpse.*.go.id` dan kemungkinan butuh Playwright (bukan httpx biasa) karena JS-rendered.

---

## ⚡ FOKUS SEKARANG — APP 1: TENDER PLATFORM

---

### 🔴 TAHAP 1 — Fondasi (Kerjakan duluan, semua yang lain bergantung ini)

#### 1.1 Setup Layout & Navigasi Dashboard
- [ ] Buat `catalyst-scout/src/app/(dashboard)/layout.jsx` — shell dashboard dengan Sidebar + Topbar
- [ ] Buat komponen `Sidebar` dengan navigasi ke: Tenders, KBLI, Scraper Log, Settings
- [ ] Update `metadata` di `layout.js` — ganti judul dari "Create Next App" ke "Catalyst — Cliste"
- [ ] Buat halaman root `/` yang redirect langsung ke `/tenders`

#### 1.2 Fix Docker & Konfigurasi
- [ ] Fix typo di `docker-compose.yml`: context scraper pakai `./scraper-engine` tapi folder aslinya `./scrapper-engine`
- [ ] Tambahkan service `catalyst-scout` (Next.js) ke `docker-compose.yml` untuk production nanti

---

### 🟠 TAHAP 2 — Koneksi Frontend ↔ Backend (API Glue)

#### 2.1 API Routes Next.js (semua file masih kosong)
- [ ] Isi `api/proxy-scraper/route.js` — proxy `POST /api/v1/scrape` dan `GET /api/v1/scrape/status` ke Python backend
- [ ] Isi `api/ai-proposal/route.js` — proxy `POST /api/v1/generate-proposal` ke Python backend
- [ ] Buat `api/tenders/route.js` — proxy `GET /api/v1/tenders` (list + filter)
- [ ] Buat `api/tenders/[id]/route.js` — proxy `GET /api/v1/tenders/{id}` (detail satu tender)

#### 2.2 Server Actions (semua file masih kosong)
- [ ] Isi `actions/tenderActions.js`:
  - `getTenders({ source, status, page, limit })` — query Prisma ke `TenderResult`
  - `promoteTender(tenderResultId, data)` — promote `TenderResult` → `Tender` (status: `new_lead`)
  - `updateTenderStatus(tenderId, status)` — update status: `new_lead → evaluating → bidding → won/lost`
  - `addTenderNote(tenderId, noteText)` — tambah catatan ke tender *(PRD RF-T-010)*
- [ ] Isi `actions/kbliActions.js`:
  - `getKbliList(search)` — query `MasterKbli` via Prisma

#### 2.3 Prisma / Database
- [ ] Jalankan `prisma db push` untuk sync schema ke database (semua model baru belum di-push)
- [ ] Buat seed data `MasterKbli` — tanpa ini, fitur KBLI matching tidak bisa jalan
- [ ] Buat seed data `DataMasking` — keyword sensitif awal (nama client, internal names)

---

### 🟡 TAHAP 3 — Halaman Tenders (UI Utama — PRD Section 2.3)

#### 3.1 Halaman List Tenders `/tenders` *(PRD RF-T-002, RF-T-003, RF-T-009)*
- [ ] Tabel/list tender dengan kolom: source, title, agency, matched KBLI, score, deadline, status
- [ ] Filter bar: by source (geodipa/civd/lpse), by status, by skor minimum, by keyword
- [ ] Badge skor dengan warna: 🟢 ≥70 (Kejar), 🟡 40-69 (Tinjau), 🔴 <40 (Lewati) *(PRD RF-T-007)*
- [ ] Tombol **"Trigger Scrape"** — pilih source, klik → call proxy-scraper API *(PRD RF-T-002)*
- [ ] Status bar scraper real-time (polling): running / last run / jumlah baru *(PRD RF-T-012)*
- [ ] Tombol **"Promote ke Lead"** pada baris `TenderResult` yang belum dipromote *(PRD RF-T-011)*

#### 3.2 Papan Kanban Tenders *(PRD RF-T-009)*
- [ ] Kanban dengan kolom: `Ditemukan → Ditinjau → Dikejar → Diserahkan → Menang / Kalah / Batal`
- [ ] Drag-and-drop untuk update status *(PRD KP-T-005)*
- [ ] Toggle view antara List View dan Kanban View

#### 3.3 Halaman Detail Tender `/tenders/[id]` *(PRD RF-T-010)*
- [ ] Buat `tenders/[id]/page.jsx` — sekarang folder ada tapi tidak punya `page.jsx`
- [ ] Tampilkan: judul, agency, sumber, requirement text, doc attachments, KBLI match + score
- [ ] Panel **Catatan** — tambah/lihat catatan teks per tender *(PRD RF-T-010)*
- [ ] Riwayat perubahan status
- [ ] Tombol **"Konversi ke Proyek"** muncul jika status = `won` *(PRD RF-T-011)*

#### 3.4 Input Tender Manual *(PRD RF-T-014)*
- [ ] Form modal/drawer untuk input tender manual (dari luar portal digital)
- [ ] Field: judul, agency, sumber, requirement text, deadline, estimasi budget, URL (opsional)

---

### 🔵 TAHAP 4 — Halaman KBLI `/kbli`

- [ ] Tabel daftar KBLI dari `MasterKbli` database dengan search by kode/deskripsi
- [ ] Tambah/edit/nonaktifkan KBLI langsung dari UI
- [ ] Upload NIB PDF → ekstrak KBLI baru via `/api/v1/extract-pdf` *(sudah ada di Python)*

---

### 🟣 TAHAP 5 — Perbaikan Backend Python (Tender-related)

#### 5.1 LPSE Scraper *(PRD RF-T-001 — PRIORITAS UTAMA)*
- [ ] **Riset dulu:** cek struktur HTML `lpse.lkpp.go.id` — apakah butuh Playwright atau cukup httpx?
- [ ] Implementasi `scrape_lpse()` di `scraper.py` — multi-instansi (minimal 1 LPSE dulu)
- [ ] Daftarkan `lpse` ke `main.py`: tambah ke `valid_sources` dan `_run_scraper_task`
- [ ] Update `CIVD_ANNOUNCEMENT_TYPES` — konfirmasi type=2 dan type=3 via browser Network tab

#### 5.2 Penjadwalan Otomatis *(PRD RF-T-001)*
- [ ] Implementasi scheduler (APScheduler atau cron): GeoDipa tiap 24 jam, CIVD tiap 12 jam, LPSE tiap 6 jam
- [ ] Atau: setup cron job eksternal yang hit endpoint `POST /api/v1/scrape`

#### 5.3 Endpoint yang Kurang
- [ ] Tambah `GET /api/v1/tenders/{id}` — detail satu tender (sekarang hanya ada list)
- [ ] Tambah `PUT /api/v1/tenders/{id}/status` — update status dari frontend
- [ ] Tambah `POST /api/v1/tenders` — input manual tender *(PRD RF-T-014)*
- [ ] Tambah `GET /api/v1/scraper/log` — riwayat run scraper per platform *(PRD RF-T-012)*

#### 5.4 Notifikasi Tender Skor Tinggi *(PRD RF-T-008)*
- [ ] Implementasi notifikasi saat tender baru dengan skor ≥70 ditemukan
- [ ] Simpan ke tabel `Notification` (sudah ada di schema Prisma)
- [ ] Kirim ke frontend via polling atau WebSocket

---

### 🟢 TAHAP 6 — Halaman Proposal Generator `/tenders/[id]/proposal` *(PRD Phase 2)*

> **Prasyarat:** TAHAP 1–4 harus sudah stabil dulu

- [ ] Form input: pilih template + klik Generate
- [ ] Tampilkan proposal dalam blok-blok yang bisa diedit per-section
- [ ] Tombol **"Generate"** → call AI proposal agent (async, tampilkan loading)
- [ ] Tombol **"Download .docx"** — **butuh implementasi `docx_generator.py` yang masih 0 byte!**
- [ ] Implementasi `docx_generator.py` menggunakan `python-docx`: isi template .docx dari proposal blocks
- [ ] Upload template .docx via Settings, simpan path-nya *(PRD RF-AI-001)*
- [ ] Riwayat proposal terhubung ke tender *(PRD RF-AI-008)*

---

## 🔲 SETELAH TENDER SELESAI — App 2: Internal Workspace

> Kerjakan setelah semua TAHAP 1–5 App 1 selesai dan stabil

- [ ] **TAHAP A:** Auth & RBAC — model `User` sudah ada di schema, belum ada auth layer (NextAuth/JWT)
- [ ] **TAHAP B:** App 2 — Project Management (Kanban, task, milestone, workload)
- [ ] **TAHAP C:** App 2 — Document Management (upload, versioning, MinIO)
- [ ] **TAHAP D:** App 2 — Client Portal (token akses per-proyek, MoM, sign-off)
- [ ] **TAHAP E:** Integrasi: Tender Won → Proyek Baru di App 2 *(PRD Section 4.1)*
- [ ] **TAHAP F:** App 2 Phase 2 — Analytics, notifikasi email, Gantt Chart
- [ ] **TAHAP G:** App 2 Phase 3 — RAG Knowledge Base (butuh 3-6 bulan data dulu)

---

## ✅ PRE-PRODUCTION CHECKLIST *(dari guideline.md)*

- [ ] Fitur **Data Masking** berjalan normal di lokal — cek sebelum push ke production
- [ ] File `.env` tidak ter-commit ke Git
- [ ] Update `requirements.txt`: `pip freeze > requirements.txt` di `scraper-engine`
- [ ] Jalankan `npm run build` di `catalyst-scout` — pastikan zero build error
- [ ] Tambahkan service `catalyst-scout` ke `docker-compose.yml`
- [ ] `docker exec -it catalyst-scout-container npx prisma db push` saat pertama deploy

---

## 📌 RINGKASAN STATUS CODEBASE

| Komponen | Kondisi Sekarang |
|---|---|
| Backend Python — GeoDipa scraper | ✅ Lengkap & siap |
| Backend Python — CIVD scraper | ✅ Lengkap & siap |
| Backend Python — GEP scraper | ⚠️ Placeholder, belum implementasi |
| Backend Python — LPSE scraper | ❌ Belum ada, harus dibuat (PRD: prioritas utama) |
| Backend Python — AI matcher & masking | ✅ Lengkap |
| Backend Python — Proposal agent | ✅ Logic ada, tapi `docx_generator.py` kosong |
| Database schema (Prisma) | ✅ Lengkap & well-designed, belum di-push ke DB |
| Docker compose | ⚠️ Ada tapi typo path + belum include Next.js |
| API Routes Next.js | ❌ Semua file kosong |
| Server Actions Next.js | ❌ Semua file kosong |
| UI — Layout dashboard | ❌ Belum ada |
| UI — Halaman Tenders | ❌ Masih placeholder |
| UI — Halaman KBLI | ❌ Masih placeholder |
| UI — Proposal Generator | ❌ Masih placeholder |
| Auth / Login | ❌ Belum ada |
