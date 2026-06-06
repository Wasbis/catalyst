# 📋 CATALYST — TODO LIST

> Diperbarui: 2026-06-05 | Audit aktual vs PRD v1.0
>
> **Legenda:** ✅ Selesai · ❌ Belum · ⚠️ Parsial/Placeholder

---

## 🗺️ STATUS PLATFORM SCRAPER

| Platform | PRD | Implementasi | Status |
|---|---|---|---|
| **GeoDipa** | Sekunder | `scrape_geodipa` + detail page | ✅ Selesai — 2026-06-04 |
| **CIVD SKK Migas** | Utama | `scrape_civd`, AJAX pagination, 3 tipe | ✅ Selesai — 2026-06-04 |
| **GEP (Smart GEP)** | — | Placeholder kosong, return `[]` | ⚠️ Belum implementasi |
| **LPSE** | Utama | Tidak ada sama sekali | ❌ Harus dibuat |
| **Input Manual** | Pelengkap | Belum ada endpoint/UI | ❌ Harus dibuat |

---

## ⚡ APP 1 — TENDER PLATFORM

---

### 🔴 TAHAP 1 — Fondasi

#### 1.1 Setup Layout & Navigasi Dashboard
- [ ] Buat `catalyst-scout/src/app/(dashboard)/layout.jsx` — shell dashboard dengan Sidebar + Topbar
- [ ] Buat komponen `Sidebar` dengan navigasi ke: Tenders, KBLI, Scraper Log, Settings
- [ ] Update `metadata` di `layout.js` — ganti judul dari "Create Next App" ke "Catalyst — Cliste"
- [ ] Buat halaman root `/` yang redirect langsung ke `/tenders`

#### 1.2 Fix Docker & Konfigurasi
- [x] Fix typo di `docker-compose.yml`: context scraper ✅ — 2026-06-05 (`./scraper-engine` sudah benar)
- [ ] Tambahkan service `catalyst-scout` (Next.js) ke `docker-compose.yml`

---

### 🟠 TAHAP 2 — Koneksi Frontend ↔ Backend

#### 2.1 API Routes Next.js
- [ ] Isi `api/proxy-scraper/route.js` — file ada tapi **0 byte**
- [ ] Isi `api/ai-proposal/route.js` — file ada tapi **0 byte**
- [ ] Buat `api/tenders/route.js` — belum ada file
- [ ] Buat `api/tenders/[id]/route.js` — belum ada file

#### 2.2 Server Actions
- [ ] Isi `actions/tenderActions.js` — file ada tapi **0 byte**
  - `getTenders`, `promoteTender`, `updateTenderStatus`, `addTenderNote`
- [ ] Isi `actions/kbliActions.js` — file ada tapi **0 byte**
  - `getKbliList(search)`
- [ ] Isi `actions/aiActions.js` — file ada tapi **0 byte**

#### 2.3 Prisma / Database
- [ ] Isi `src/lib/prisma.js` — file ada tapi **0 byte** (Prisma client singleton)
- [ ] Jalankan `prisma db push` — schema sudah lengkap tapi belum di-push ke DB
- [ ] Buat seed data `MasterKbli`
- [ ] Buat seed data `DataMasking`

---

### 🟡 TAHAP 3 — Halaman Tenders

#### 3.1 Halaman List `/tenders`
- [ ] Tabel tender: source, title, agency, KBLI, score, deadline, status — sekarang placeholder `<div>`
- [ ] Filter bar: by source, status, skor minimum, keyword
- [ ] Badge skor: 🟢 ≥70 · 🟡 40-69 · 🔴 <40
- [ ] Tombol "Trigger Scrape" → call proxy-scraper API
- [ ] Status bar scraper real-time (polling)
- [ ] Tombol "Promote ke Lead"

#### 3.2 Papan Kanban Tenders
- [ ] Kanban: `Ditemukan → Ditinjau → Dikejar → Diserahkan → Menang/Kalah/Batal`
- [ ] Drag-and-drop update status
- [ ] Toggle List View / Kanban View

#### 3.3 Halaman Detail `/tenders/[id]`
- [ ] Buat `tenders/[id]/page.jsx` — **folder ada, file tidak ada**
- [ ] Tampilkan: judul, agency, sumber, requirement text, KBLI match + score
- [ ] Panel Catatan per tender
- [ ] Riwayat perubahan status
- [ ] Tombol "Konversi ke Proyek" jika status = `won`

#### 3.4 Input Tender Manual
- [ ] Form modal/drawer untuk input tender manual
- [ ] Field: judul, agency, sumber, requirement text, deadline, budget, URL (opsional)

---

### 🔵 TAHAP 4 — Halaman KBLI `/kbli`
- [ ] Tabel KBLI dari database — sekarang placeholder `<div>`
- [ ] Tambah/edit/nonaktifkan KBLI dari UI
- [ ] Upload NIB PDF → ekstrak KBLI via `/api/v1/extract-pdf`

---

### 🟣 TAHAP 5 — Perbaikan Backend Python

#### 5.1 LPSE Scraper *(PRD: PRIORITAS UTAMA)*
- [ ] Riset struktur HTML `lpse.lkpp.go.id` — butuh Playwright atau cukup httpx?
- [ ] Implementasi `scrape_lpse()` di `scraper.py`
- [ ] Daftarkan `lpse` ke `valid_sources` dan `_run_scraper_task` di `main.py`
- [ ] Update `CIVD_ANNOUNCEMENT_TYPES` — konfirmasi type=2 dan type=3 via Network tab

#### 5.2 Penjadwalan Otomatis *(PRD RF-T-001)*
- [ ] Implementasi scheduler — GeoDipa tiap 24 jam, CIVD tiap 12 jam, LPSE tiap 6 jam
- [ ] Atau: setup cron job eksternal yang hit `POST /api/v1/scrape`

#### 5.3 Endpoint yang Kurang di Backend
- [ ] `GET /api/v1/tenders/{id}` — detail satu tender (sekarang hanya ada list)
- [ ] `PUT /api/v1/tenders/{id}/status` — update status dari frontend
- [ ] `POST /api/v1/tenders` — input manual tender
- [ ] `GET /api/v1/scraper/log` — riwayat run per platform

#### 5.4 Notifikasi Tender Skor Tinggi *(PRD RF-T-008)*
- [ ] Trigger notifikasi saat tender baru skor ≥70
- [ ] Simpan ke tabel `Notification` (sudah ada di schema)
- [ ] Kirim ke frontend via polling atau WebSocket

---

### 🟢 TAHAP 6 — Proposal Generator *(PRD Phase 2)*

> Prasyarat: TAHAP 1–4 harus stabil dulu

- [ ] Form: pilih template + klik Generate
- [ ] Tampilkan proposal dalam blok yang bisa diedit per-section
- [ ] Tombol "Generate" → call AI proposal agent (async)
- [ ] Tombol "Download .docx"
- [ ] **Implementasi `docx_generator.py` — sekarang 0 byte!** Pakai `python-docx`
- [ ] Upload template .docx via Settings
- [ ] Riwayat proposal terhubung ke tender

---

## ✅ SUDAH SELESAI (Log)

| Tanggal | Yang Dikerjakan |
|---|---|
| 2026-05-06 | Inisialisasi monorepo Catalyst |
| 2026-05-08 | Merge catalyst-scout ke dalam monorepo |
| 2026-06-04 | Prisma schema lengkap — semua model (User, Tender, TenderResult, KBLI, Notification, Proposal, dll) |
| 2026-06-04 | GeoDipa scraper (`scrape_geodipa` + detail page) |
| 2026-06-04 | CIVD scraper (`scrape_civd`, AJAX pagination, 3 tipe announcement) |
| 2026-06-04 | AI Matcher (`ai_matcher.py`) |
| 2026-06-04 | Masking Service (`masking_services.py`) — 215 baris, lengkap |
| 2026-06-04 | PDF Extractor (`pdf_extractor.py`) |
| 2026-06-04 | AI Proposal Agent logic (`ai_proposal_agent.py`) |
| 2026-06-04 | Database model (`database.py` — SQLAlchemy + TenderResult) |
| 2026-06-04 | Struktur file frontend dibuat (pages, actions, routes) — **tapi semua masih kosong** |
| 2026-06-05 | Fix typo `docker-compose.yml`: `./scrapper-engine` → `./scraper-engine` |
| 2026-06-05 | Test scraping (`test_scrape.py`, `test_save_db.py`) |
| 2026-06-05 | Export CIVD (`export_civd.py`) |

---

## 🔲 SETELAH TENDER SELESAI — App 2: Internal Workspace

> Kerjakan setelah semua TAHAP 1–5 App 1 selesai dan stabil

- [ ] **TAHAP A:** Auth & RBAC — model `User` sudah ada di schema, belum ada auth layer
- [ ] **TAHAP B:** App 2 — Project Management (Kanban, task, milestone, workload)
- [ ] **TAHAP C:** App 2 — Document Management (upload, versioning, MinIO)
- [ ] **TAHAP D:** App 2 — Client Portal (token akses per-proyek, MoM, sign-off)
- [ ] **TAHAP E:** Integrasi: Tender Won → Proyek Baru di App 2
- [ ] **TAHAP F:** App 2 Phase 2 — Analytics, notifikasi email, Gantt Chart
- [ ] **TAHAP G:** App 2 Phase 3 — RAG Knowledge Base

---

## 📌 STATUS RINGKAS CODEBASE

| Komponen | Status |
|---|---|
| Backend — GeoDipa scraper | ✅ Selesai — 2026-06-04 |
| Backend — CIVD scraper | ✅ Selesai — 2026-06-04 |
| Backend — GEP scraper | ⚠️ Placeholder |
| Backend — LPSE scraper | ❌ Belum ada |
| Backend — AI matcher | ✅ Selesai — 2026-06-04 |
| Backend — Masking service | ✅ Selesai — 2026-06-04 |
| Backend — AI Proposal agent | ✅ Logic ada — 2026-06-04 |
| Backend — `docx_generator.py` | ❌ 0 byte |
| Backend — Scheduler otomatis | ❌ Belum ada |
| Backend — endpoint `/tenders/{id}` | ❌ Belum ada |
| Backend — endpoint status update | ❌ Belum ada |
| Database schema (Prisma) | ✅ Lengkap — 2026-06-04, belum `db push` |
| Docker compose — path fix | ✅ Fix — 2026-06-05 |
| Docker compose — Next.js service | ❌ Belum |
| API Routes Next.js | ❌ File ada, semua 0 byte |
| Server Actions Next.js | ❌ File ada, semua 0 byte |
| `lib/prisma.js` | ❌ 0 byte |
| UI — Layout dashboard + Sidebar | ❌ Belum ada |
| UI — Halaman Tenders | ❌ Placeholder |
| UI — Halaman Detail Tender | ❌ File tidak ada |
| UI — Halaman KBLI | ❌ Placeholder |
| UI — Proposal Generator | ❌ Placeholder |
| Auth / Login | ❌ Belum ada |
