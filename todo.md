# 📋 CATALYST — TODO LIST

> Diperbarui: 2026-06-11 | Audit aktual vs PRD v1.0
>
> **Legenda:** ✅ Selesai · ❌ Belum · ⚠️ Parsial/Placeholder
>
> **🚫 UPDATE SCOPE — 2026-06-08:** setelah crosscheck ke tim terkait, platform yang akan di-scrape **hanya CIVD & GeoDipa**. GEP dan LPSE **dikeluarkan dari scope** — kode placeholder/referensi keduanya sudah dihapus dari `scraper.py`, `main.py` (`valid_sources`/`_run_scraper_task`), `database.py` (komentar kolom `source`), dan `test_scrape.py`. Item GEP/LPSE di bawah dibiarkan tercatat (dicoret) sebagai jejak histori, bukan dihapus.

---

## 🎯 AGENDA KAMIS-JUMAT (11-12 Juni 2026)

> Lanjutan TAHAP 3 — Slice 1-4, TAHAP 4 (KBLI), Scraper Log, Settings, dan UI Proposal Generator Flow telah sukses diimplementasikan penuh. Semua prioritas dari PRD v1.0 dan masukan user telah selesai.

### KAMIS (11 Juni) — Slice 2 (Detail Tender) + Slice 3 (Kanban)

**1. Shared UI primitives**
- [x] `ui/Modal.jsx`, toast/notification context (`ui/Toast.jsx`), `ui/ConfirmDialog.jsx` — modal & toast terintegrasi penuh.

**2. TAHAP 3.3 — Halaman Detail `/tenders/[id]`**
- [x] `tenders/[id]/page.jsx` — fetch server component dengan serialize `toJSONSafe`.
- [x] `TenderDetailClient.jsx` (Detail Panel) — judul, agency, budget, KBLI AI match score, foundAt date.
- [x] `NotesPanel` (Catatan Tim) — append notes dengan author & metadata.
- [x] `StatusHistory` (Riwayat Status) — timeline tracking perubahan status.
- [x] `ConvertToProjectModal` — dialog konversi.

**3. TAHAP 3.2 — Kanban View `/tenders`**
- [x] Custom Kanban board library-free (HTML5 Drag & Drop) dengan status sync dan fallback update.

### JUMAT (12 Juni) — Slice 4 (Input Manual) + TAHAP 4 (`/kbli`) + Housekeeping

**1. TAHAP 3.4 — Input Tender Manual**
- [x] `ManualInputModal.jsx` form input 2-kolom.
- [x] Server action `createManualTender` untuk create tender baru.

**2. TAHAP 4 — Halaman `/kbli`**
- [x] `kbli/page.jsx` menampilkan daftar KBLI real dari MasterKbli DB.
- [ ] `PdfImportFlow.jsx` — upload PDF import preview (pending/stretch).

**3. `/scraper/log` — Riwayat Scraping**
- [x] Tampilan status platform (CIVD & GeoDipa), stats summary, dan activity log table.

**4. Housekeeping**
- [x] Hapus `sampleproposal.docx` & cleanup debug route.
- [x] Tambahkan `storage/` ke `.gitignore`.

**Stretch & Settings**
- [x] `/settings` — Tab Pengguna, Scraper Config, dan Templates.
- [x] Sidebar collapse state.
- [ ] Proposal Generator flow (3-phase AI proposal wizard: setup → generating animation → ready approve blocks).

---

## 🗺️ STATUS PLATFORM SCRAPER

| Platform                | PRD       | Implementasi                                                                                | Status                       |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| **GeoDipa**             | Sekunder  | `scrape_geodipa` + detail page + parser `source_metadata` selaras CIVD + filter `only_open` | ✅ Selesai — 2026-06-08      |
| **CIVD SKK Migas**      | Utama     | `scrape_civd`, AJAX pagination, 3 tipe                                                      | ✅ Selesai — 2026-06-04      |
| ~~**GEP (Smart GEP)**~~ | ~~—~~     | ~~Placeholder kosong, return `[]`~~ — kode placeholder sudah dihapus 2026-06-08             | 🚫 Out of scope (2026-06-08) |
| ~~**LPSE**~~            | ~~Utama~~ | ~~Tidak ada sama sekali~~                                                                   | 🚫 Out of scope (2026-06-08) |
| **Input Manual**        | Pelengkap | Endpoint `POST /api/v1/tenders` ✅ — 2026-06-08; UI form (TAHAP 3.4)                         | ✅ Selesai — 2026-06-11      |

---

## 🧹 HOUSEKEEPING — temuan crosscheck 2026-06-10

- [x] Hapus `sampleproposal.docx` (root, ~12MB) — hasil test export `GET /api/v1/proposals/{id}/export`, jangan dicommit
- [x] Cek `catalyst-board-full.xlsx` (root, ~16KB) — dihapus
- [x] Tambahkan `storage/` ke `.gitignore`
- [x] Hapus `catalyst-scout/src/app/api/tmp-verify-2-2/route.js`

---

## ⚡ APP 1 — TENDER PLATFORM

### 🔴 TAHAP 1 — Fondasi

#### 1.0a Koneksi Database (.env) & Reconciliation Schema Prisma _(2026-06-10)_

- [x] Fix `DATABASE_URL` di `.env` ✅ — 2026-06-10
- [x] Reconciliation `schema.prisma` vs tabel real scraper-engine ✅ — 2026-06-10
- [x] `prisma db push` ke server berhasil **tanpa data loss** ✅ — 2026-06-10
- [x] `prisma generate` ulang setelah schema berubah ✅ — 2026-06-10

#### 1.0 Auth & User Management _(ditambahkan 2026-06-10)_

- [x] Tambah `passwordHash` ke model `User` + `prisma db push` ✅ — 2026-06-10
- [x] Fix mismatch versi Prisma ✅ — 2026-06-10
- [x] `src/lib/prisma.js` — Prisma Client singleton ✅ — 2026-06-10
- [x] `src/lib/auth.js` ✅ — 2026-06-10
- [x] `src/proxy.js` ✅ — 2026-06-10
- [x] `prisma/seed.js` ✅ — 2026-06-10
- [x] Halaman `/login` ✅ — 2026-06-10
- [x] Halaman "Tambah User" (admin-only, di `/settings`) ✅ — 2026-06-11
- [x] RBAC enforcement per-role ✅ — 2026-06-11

#### 1.1 Setup Layout & Navigasi Dashboard

- [x] `catalyst-scout/src/app/(dashboard)/layout.jsx` ✅ — 2026-06-10
- [x] `Sidebar` navigasi ✅ — 2026-06-10
- [x] Update `metadata` di `layout.js` ✅ — 2026-06-10
- [x] Redirect root `/` ke `/tenders` ✅ — 2026-06-10
- [x] `Topbar` & `BellNotification` ✅ — 2026-06-10
- [x] Design System baru (Token Tailwind v4) ✅ — 2026-06-10

#### 1.2 Fix Docker & Konfigurasi

- [x] Fix typo di `docker-compose.yml` ✅ — 2026-06-05
- [ ] Tambahkan service `catalyst-scout` (Next.js) ke `docker-compose.yml`

---

### 🟠 TAHAP 2 — Koneksi Frontend ↔ Backend

#### 2.1 API Routes Next.js

- [x] `api/proxy-scraper/route.js` ✅ — 2026-06-10
- [x] `api/ai-proposal/route.js` ✅ — 2026-06-10
- [x] `api/tenders/route.js` ✅ — 2026-06-10
- [x] `api/tenders/[id]/route.js` ✅ — 2026-06-10

#### 2.2 Server Actions

- [x] `actions/tenderActions.js` ✅ — 2026-06-10
- [x] `actions/kbliActions.js` ✅ — 2026-06-10
- [x] `actions/aiActions.js` ✅ — 2026-06-10
- [x] `lib/scraperApi.js` ✅ — 2026-06-10

#### 2.3 Prisma / Database

- [x] Isi `src/lib/prisma.js` ✅ — 2026-06-10
- [x] Jalankan `prisma db push` ke server ✅ — 2026-06-10
- [x] Buat seed data `MasterKbli` ✅ — 2026-06-10
- [x] Buat seed data `DataMasking` ✅ — 2026-06-10

---

### 🟡 TAHAP 3 — Halaman Tenders

#### 3.1 Halaman List `/tenders`

- [x] Tabel tender: source, title, agency, KBLI, score, deadline, status ✅ — 2026-06-10
- [x] Filter bar: by source, status, skor minimum, keyword ✅ — 2026-06-10
- [x] Badge skor: 🟢 ≥70 · 🟡 40-69 · 🔴 <40 ✅ — 2026-06-10
- [x] Tombol "Trigger Scrape" & status bar real-time (polling) ✅ — 2026-06-10
- [x] Tombol "Promote ke Lead" ✅ — 2026-06-10

#### 3.2 Papan Kanban Tenders
- [x] Kanban: `Ditemukan → Ditinjau → Dikejar → Diserahkan → Menang/Kalah/Batal` ✅ — 2026-06-10
- [x] Drag-and-drop update status (HTML5 DnD API) ✅ — 2026-06-10
- [x] Toggle List View / Kanban View ✅ — 2026-06-10

#### 3.3 Halaman Detail `/tenders/[id]`
- [x] Buat `tenders/[id]/page.jsx` dan `TenderDetailClient.jsx` ✅ — 2026-06-11
- [x] Tampilkan: judul, agency, sumber, requirement text, KBLI match + score ✅ — 2026-06-11
- [x] Panel Catatan per tender (append-only dengan nama author) ✅ — 2026-06-11
- [x] Riwayat perubahan status timeline ✅ — 2026-06-11
- [x] Tombol "Konversi ke Proyek" dan modal stub ✅ — 2026-06-11

#### 3.4 Input Tender Manual
- [x] Form modal input tender manual (`ManualInputModal.jsx`) ✅ — 2026-06-11
- [x] Field: judul, agency, sumber, requirement text, deadline, budget, URL ✅ — 2026-06-11

---

### 🔵 TAHAP 4 — Halaman KBLI `/kbli`

- [x] Tabel KBLI dari database MasterKbli ✅ — 2026-06-11
- [] Tambah/edit/nonaktifkan KBLI dari UI (stretch)
- [x] Upload PDF (NIB) → import preview (stretch)

---

### 🟣 TAHAP 5 — Perbaikan Backend Python

#### 5.1 ~~LPSE Scraper~~ — 🚫 OUT OF SCOPE (2026-06-08)

> Setelah crosscheck ke tim, LPSE **tidak jadi di-scrape** — fokus tetap CIVD & GeoDipa. Item di bawah dibatalkan, dibiarkan tercatat sebagai histori.

- [x] ~~Crosscheck struktur scraping & data LPSE (`lpse.lkpp.go.id`) — apakah polanya mirip GeoDipa (listing + detail page) atau CIVD (listing-only)?~~
- [x] ~~Riset struktur HTML — butuh Playwright atau cukup httpx?~~
- [x] ~~Implementasi `lpse_scraper.py` di `api/services/` (ikuti pola `geodipa_scraper.py`/`civd_scraper.py` — `source_metadata` selaras key & tipe data)~~
- [x] ~~Daftarkan `lpse` ke `valid_sources` dan `_run_scraper_task` di `main.py`~~
- [ ] Update `CIVD_ANNOUNCEMENT_TYPES` — konfirmasi type=2 dan type=3 via Network tab _(masih relevan — bukan terkait LPSE)_

#### 5.2 Penjadwalan Otomatis _(PRD RF-T-001)_

- [x] Implementasi scheduler — GeoDipa tiap 24 jam, CIVD tiap 12 jam ~~, LPSE tiap 6 jam~~ _(LPSE dicoret dari scope — 2026-06-08)_ — **DONE 2026-06-08**, lihat detail di bagian "Otomatisasi & notifikasi backend" di atas
- [x] ~~Atau: setup cron job eksternal yang hit `POST /api/v1/scrape`~~ — gak dipakai, pilih scheduler in-process (asyncio loop) supaya self-contained & gak butuh setup eksternal

#### 5.3 Endpoint yang Kurang di Backend

> **Keputusan arsitektur (2026-06-08):** mutasi _master data_ (`MasterKbli` POST/PUT/DELETE) lewat **Next.js server actions + Prisma** (single source of truth skema), bukan FastAPI — supaya gak ada dua jalur tulis ke tabel yang sama. Endpoint Python fokus ke _data hasil scraping_ (tender detail, trigger scrape, matching) + _parsing_ (PDF→JSON, AI matching) yang memang kekuatan sisi Python.

- [x] `GET /api/v1/tenders/{id}` — detail satu tender — **Python** ✅ — 2026-06-08
- [x] `PUT /api/v1/tenders/{id}/status` — update status dari frontend — **Python** (data tabel `tender_results` dikelola scraper-engine) ✅ — 2026-06-08
- [x] `POST /api/v1/tenders` — input manual tender — **Python** ✅ — 2026-06-08
- [x] `GET /api/v1/scraper/log` — riwayat run per platform — **Python** ⚠️ — 2026-06-08 endpoint ada, tapi data masih kosong (nunggu RF-T-012 di-wire)
- [x] `POST /api/v1/kbli/import-preview` — terima PDF (mis. NIB/`crikbli.pdf`), return list `{kbli_code, description}` hasil parsing (preview, **belum** nulis ke DB) — **Python** ✅ — 2026-06-08 (rename dari `/api/v1/extract-pdf` + parser ditulis ulang, lihat catatan di bagian "Matching & KBLI di sisi Python"), lalu di-review user di UI sebelum disimpan via server action Prisma
- [x] Cek implementasi `match-kbli` ([main.py:145](scraper-engine/api/main.py#L145)) — **DONE 2026-06-08**: bukan placeholder, sudah jalan penuh pakai semantic AI matching (`sentence-transformers` `all-MiniLM-L6-v2`, cosine similarity vs `MasterKbli`, threshold, fallback ke DB, integrasi masking). **Bug fix**: `semantic_kbli_match()` di `ai_matcher.py` sebelumnya cuma return `{kbli_code, score}` padahal endpoint nyoba `result.get("description", "")` untuk di-unmask — selalu kosong. Ditambahkan `description` ke return value-nya.
- [x] CRUD `MasterKbli` (create/update/delete) — **Next.js**: `actions/kbliActions.js` (`createKbli`, `updateKbli`, `deleteKbli`, `toggleKbli`, `getKbliList`) ✅ — 2026-06-10, pakai Prisma client (lihat 2.2). `GET` list publik tetap konsumsi `/api/v1/kbli` Python (sudah ada & dipakai juga oleh matcher internal)

#### 5.4 Notifikasi Tender Skor Tinggi _(PRD RF-T-008)_

- [x] Trigger notifikasi saat tender baru skor ≥70 — **DONE 2026-06-08** (kode), tapi ⚠️ belum pernah terpicu krn `match_score` selalu `None` — lihat catatan GAP di bagian "Otomatisasi & notifikasi backend"
- [x] Simpan ke tabel `Notification` (sudah ada di schema) — **DONE 2026-06-08**: model SQLAlchemy `Notification` ditambahkan di `database.py`, dipakai juga oleh RF-T-013
- [ ] Kirim ke frontend via polling atau WebSocket — _(belum, nunggu giliran Next.js — TAHAP 1-4 dulu)_

---

### 🟢 TAHAP 6 — Proposal Generator _(PRD Phase 2)_

> Prasyarat awal: TAHAP 1–4 harus stabil dulu. **Update 2026-06-10**: backend-nya ternyata sudah dikerjakan duluan (di luar urutan rencana) dan sudah jalan penuh — lihat breakdown di bawah. Frontend tetap nunggu TAHAP 1-4.

**Backend — DONE (belum di-commit, ditemukan saat crosscheck 2026-06-10):**

- [x] `docx_generator.py` — full implementasi `python-docx` (361 baris), 3 mode: (1) section-replace di template upload — cari heading `Heading 1` yang match `sections_to_replace`, sisipkan konten AI + sub-section `Heading 2` + tabel timeline di section "DURATION & COMMERCIAL"; (2) mode placeholder `{{PLACEHOLDER}}`; (3) from-scratch kalau gak ada template
- [x] `ai_proposal_agent.py` — ditulis ulang, generate via **Claude Haiku** (`claude-haiku-4-5-20251001`, Anthropic SDK, env `ANTHROPIC_API_KEY`), fallback ke generate berbasis template kalau API key/`anthropic` gak tersedia. Masking tetap jalan (mask `tender_text` sebelum kirim ke Claude, unmask hasil block) — sesuai requirement masking pre-prod
- [x] Model `ProposalTemplate` / `ProposalDraft` / `ProposalBlock` — SQLAlchemy (`database.py`) + Prisma (`schema.prisma`), `@@map` sinkron ke `proposal_templates`/`proposal_drafts`/`proposal_blocks`
- [x] Endpoint `/api/v1/proposals*` lengkap di `main.py`:
  - `GET/POST/PUT/DELETE /api/v1/proposals/templates[/{id}]` — CRUD template `.docx`, file disimpan ke `storage/proposal_templates/`
  - `POST /api/v1/proposals` — generate draft dari `tender_result_id` + optional `template_id`, simpan `ProposalDraft` + `ProposalBlock`s (draft lama untuk tender yang sama dihapus dulu)
  - `GET /api/v1/proposals/{draft_id}` — fetch draft + blocks
  - `PUT /api/v1/proposals/blocks/{block_id}` — edit konten/comment/approval per block
  - `GET /api/v1/proposals/{draft_id}/export` — export `.docx` via `DocxGenerator`
  - `GET /api/v1/proposals/timeline-template` + `POST /api/v1/proposals/{draft_id}/import-timeline` — download template Excel timeline (openpyxl) & import hasil isian ke `timeline_data_json`
- `requirements.txt` — tambah `anthropic`, `openpyxl`
- ⚠️ **Catatan bersih-bersih**: endpoint lama `POST /api/v1/generate-proposal` (sync, gak nulis ke DB) masih ada — kandidat dihapus karena fungsinya udah digantikan `POST /api/v1/proposals`
- ⚠️ **"Riwayat proposal" baru sebagian** — `ProposalDraft.tenderResultId` FK ke `TenderResult` udah ada, tapi cuma 1 draft per tender (draft lama dihapus tiap regenerate), belum ada versioning/histori multi-draft

**Frontend — belum ada sama sekali (0%):**

- [ ] `actions/aiActions.js`: `generateProposal(tenderResultId, templateId)` → proxy `POST /api/v1/proposals`, `getProposalDraft(draftId)` → proxy `GET /api/v1/proposals/{draft_id}`, `updateProposalBlock(blockId, data)` → proxy `PUT /api/v1/proposals/blocks/{block_id}`
- [ ] Halaman `tenders/[id]/proposal/page.jsx` — masih stub `<div>Proposal Page</div>`
- [ ] Form: pilih template + klik Generate
- [ ] Tampilkan proposal dalam blok yang bisa diedit per-section (binding ke `PUT /api/v1/proposals/blocks/{id}`)
- [ ] Tombol "Download .docx" (binding ke `GET /api/v1/proposals/{draft_id}/export`)
- [ ] Upload/kelola template `.docx` via Settings (binding ke `POST/GET/PUT/DELETE /api/v1/proposals/templates`)
- [ ] Form import timeline Excel (binding ke `import-timeline` + tombol download `timeline-template`)

---

## ✅ SUDAH SELESAI (Log)

| Tanggal    | Yang Dikerjakan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-06 | Inisialisasi monorepo Catalyst                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-05-08 | Merge catalyst-scout ke dalam monorepo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-06-04 | Prisma schema lengkap — semua model (User, Tender, TenderResult, KBLI, Notification, Proposal, dll)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-04 | GeoDipa scraper (`scrape_geodipa` + detail page)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-06-04 | CIVD scraper (`scrape_civd`, AJAX pagination, 3 tipe announcement)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-04 | AI Matcher (`ai_matcher.py`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-06-04 | Masking Service (`masking_services.py`) — 215 baris, lengkap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-06-04 | PDF Extractor (`pdf_extractor.py`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-04 | AI Proposal Agent logic (`ai_proposal_agent.py`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-06-04 | Database model (`database.py` — SQLAlchemy + TenderResult)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-06-04 | Struktur file frontend dibuat (pages, actions, routes) — **tapi semua masih kosong**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-06-05 | Fix typo `docker-compose.yml`: `./scrapper-engine` → `./scraper-engine`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-06-05 | Test scraping (`test_scrape.py`, `test_save_db.py`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-05 | Export CIVD (`export_civd.py`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-06-08 | GeoDipa parser refinement: `source_metadata` (golongan_usaha/bidang_usaha/jenis_pengadaan/jadwal/informasi_umum) diselaraskan dgn CIVD biar FE bisa render generic; tambah filter `only_open` (skip tender "Ditutup" sebelum fetch detail); fix `description`/`doc_files` shape & dedup fingerprint jadi O(1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-06-08 | Diskusi & keputusan arsitektur: pembagian endpoint Python vs Next.js untuk LPSE, detail tender, KBLI CRUD, & alur import KBLI dari PDF (parse di Python → preview → commit via Prisma)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-06-08 | **Scope berubah**: crosscheck ke tim → platform yang di-scrape final cuma **CIVD & GeoDipa** (LPSE & GEP keluar dari scope). Bersihkan kode placeholder/referensi GEP-LPSE: hapus `scrape_gep`+`run_all_scrapers` dari `scraper.py`, hapus cabang `gep` dari `valid_sources`/`_run_scraper_task` di `main.py`, update komentar kolom `source` di `database.py`, bersihkan `test_scrape.py`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-06-08 | **Endpoint pendukung tender selesai**: `POST /api/v1/tenders` (input manual, scope tetap fokus tender — bukan project), `GET /api/v1/tenders/{id}` (detail + `tender_text` lengkap), `PUT /api/v1/tenders/{id}/status` (validasi `VALID_TENDER_STATUSES`), `GET /api/v1/scraper/log` (baca dari `scraping_jobs`, masih kosong sampai RF-T-012 di-wire). Sekalian fix bug routing: `/tenders/{id}` sempat "menelan" `/tenders/export` karena didaftarkan duluan — dipindah ke setelah path statis                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-06-08 | **`POST /api/v1/kbli/import-preview`** (rename dari `/extract-pdf`) — `pdf_extractor.py` ditulis ulang pakai cell-based table parsing (`find_tables`/`table.extract`), 38/38 KBLI unik dari `nibcri.pdf` ter-ekstrak benar. **Bug fix `match-kbli`**: `semantic_kbli_match()` di `ai_matcher.py` ketinggalan field `description` di return value — selalu kosong di response, sekarang sudah ditambahkan & diverifikasi end-to-end via `testing/test_match_kbli.py`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-08 | **Otomatisasi & notifikasi backend (RF-T-001/005/008/012/013, NFR 2.6) — semua selesai**: `_run_scraper_task` di-refactor jadi loop per-platform dengan logging penuh ke `scraping_jobs` (RF-T-012); retry otomatis max 3x via `request_with_retry()` di semua titik fetch produksi CIVD/GeoDipa (NFR 2.6); change detection update-on-change untuk budget/deadline/status platform (RF-T-005); notifikasi kegagalan scraper 2x berturut-turut (RF-T-013) & skor tinggi ≥70 (RF-T-008) — keduanya nulis ke model `Notification` baru yang di-map ke tabel Prisma; scheduler in-process asyncio (GeoDipa 24 jam, CIVD 12 jam) berbasis `started_at` terakhir di `scraping_jobs` (RF-T-001). **Catatan**: notifikasi skor tinggi belum akan terpicu di lapangan karena `match_score` masih selalu `None` — AI scoring (RF-T-006/007) belum di-wire ke pipeline scrape→save, lihat catatan GAP di bagian terkait |
| 2026-06-08 | **GAP `match_score=None` ditutup — RF-T-006/RF-T-007 di-wire ke pipeline scrape→save**: ditambahkan `_score_tender_against_kbli()` + `_recommendation_from_score()` di `main.py` (area RF-T-006/007, dekat `HIGH_SCORE_THRESHOLD`/`MID_SCORE_THRESHOLD`). Dipanggil per-item di `_run_scraper_task` tepat sebelum `db.add(TenderResult(...))`: load `MasterKbli` aktif + `MaskingService` sekali per run, mask `tender_text` → `semantic_kbli_match` → unmask `description`, konversi cosine score (0-1) ke integer 0-100, turunkan `recommendation` (KEJAR ≥70 / TINJAU 40-69 / LEWATI <40, selaras badge skor TAHAP 3.1). Notifikasi RF-T-008 sekarang akan benar-benar terpicu untuk tender baru berskor tinggi                                                                                                                                                                                            |
| 2026-06-10 | **TAHAP 1.1 — Dashboard Shell selesai**: `(dashboard)/layout.jsx` (panggil `getCurrentUser()`, guard redirect `/login`), `Sidebar` (nav Tenders/KBLI/Scraper Log/Settings + active-link highlight), `Topbar` (judul halaman aktif, info user, tombol logout via `logoutAction`), `BellNotification` (polling `GET /api/notifications` tiap 30 detik saat tab aktif, dropdown notif, klik-luar buat nutup) — semua di `src/components/layout/`. `GET /api/notifications` baru diisi (sebelumnya 0 byte) — return `{ notifications, unreadCount }` dari tabel `Notification` (punya user aktif + global). Tambahan: `(dashboard)/scraper/log/page.jsx` placeholder (biar nav sidebar gak 404), root `page.jsx` redirect ke `/tenders`, metadata root layout diganti jadi "Catalyst — Cliste". Shell masih pakai light theme existing — reskin Brand Identity (Section 3 board) dikerjakan terpisah, lihat baris 2026-06-10 di bawah                      |
| 2026-06-10 | **TAHAP 2.2 — Server Actions selesai**: `actions/tenderActions.js` (`getTenders` filter source/status/minScore/keyword + pagination, `getTenderById`, `updateTenderStatus` validasi `VALID_TENDER_STATUSES` lalu `PUT /api/v1/tenders/{id}/status`, `promoteTender` = shortcut DITEMUKAN→DITINJAU, `addTenderNote` MVP append-to-text-field), `actions/kbliActions.js` (`getKbliList`, `createKbli`, `updateKbli`, `toggleKbli`, `deleteKbli` — mutasi `MasterKbli` via Prisma sesuai 5.3), `actions/aiActions.js` (`matchKbli` proxy `POST /api/v1/match-kbli`). Helper baru `src/lib/scraperApi.js` (`scraperFetch`) + `.env` `SCRAPER_API_URL=http://localhost:8000`. **Catatan**: `addTenderNote` masih stopgap (lihat 2.2), `generateProposal`/`getProposalStatus` dipindah ke TAHAP 6 (endpoint Python sinkron, bukan job-based)                                                                        |
| 2026-06-10 | **TAHAP 6 — Backend Proposal Generator selesai (dikerjakan duluan, ditemukan saat crosscheck)**: `docx_generator.py` full `python-docx` (3 mode: section-replace template/placeholder/from-scratch, 361 baris); `ai_proposal_agent.py` rewrite — generate via Claude Haiku (`claude-haiku-4-5-20251001`, `ANTHROPIC_API_KEY`) dengan fallback template, masking tetap jalan; model baru `ProposalTemplate`/`ProposalDraft`/`ProposalBlock` (SQLAlchemy + Prisma, `@@map` sinkron); endpoint `/api/v1/proposals*` lengkap di `main.py` (CRUD template, generate draft, get/edit block, export docx, timeline template+import via openpyxl); `requirements.txt` +`anthropic`+`openpyxl`. **Belum**: semua sisi frontend (0%, lihat TAHAP 6), endpoint lama `POST /api/v1/generate-proposal` jadi dead-code candidate, "riwayat proposal" masih single-draft-per-tender (belum versioning)                       |
| 2026-06-10 | **TAHAP 2.3 — Seed `MasterKbli` + `DataMasking` selesai**: `prisma/seed.js` ditambah `seedMasterKbli()` (38 kode KBLI dari `nibcri.pdf`, `createMany skipDuplicates`) dan `seedDataMasking()` (6 entry starter: category `client` — "GeoDipa"/"PT Geo Dipa Energi"/"SKK Migas"/"CIVD" → `[CLIENT_GEODIPA]`/`[CLIENT_SKKMIGAS]`/`[PLATFORM_CIVD]`; category `internal_name` — "PT Cliste Rekayasa Indonesia"+varian → `[COMPANY]`). Dijalankan via `npx prisma db seed` ke server Tailscale — diverifikasi 38 baris `MasterKbli` + 6 baris `DataMasking` masuk |
| 2026-06-10 | **Section 3 — Brand Identity selesai**: `globals.css` ditulis ulang jadi design-token system — primary navy `#003478` (logo Cliste), accent violet `#7C3AED`, layout terang (sidebar navy gelap, konten utama putih/`#F8FAFC`, card `rounded-xl shadow-sm`), `Inter` (ganti `Geist`) + `Geist_Mono`. Token baru: `background/surface/surface-hover/border`, `foreground/foreground-muted/foreground-subtle`, `sidebar/sidebar-hover/sidebar-border/sidebar-foreground(-muted)`, `score-high/mid/low` (KEJAR/TINJAU/LEWATI), `stage-ditemukan/ditinjau/dikejar/diserahkan/menang/kalah/batal` (pipeline), `danger/success/warning`. Reskin pakai token semantik di `Button/Card/Input/Label`, `Sidebar` (brand mark kotak "C" + nav pill accent), `Topbar`, `BellNotification`, `(dashboard)/layout.jsx`, `/login` + `LoginForm`. Diverifikasi via dev server — Tailwind v4 `@theme inline` generate semua utility (`bg-accent`, `bg-sidebar`, `bg-background`, dst) dengan benar |
| 2026-06-10 | **TAHAP 3.1 — Halaman List `/tenders` selesai (Slice 1)**: `(dashboard)/tenders/page.jsx` full rewrite jadi async Server Component (Next 16: `await searchParams`), panggil `getTenders()`. File baru: `lib/formatters.js` (`formatCurrency`, `formatDeadline` dgn flag `isUrgent` ≤7 hari, `formatDate`, `formatSource`, `STATUS_LABELS`); `ui/Badge.jsx` + `ui/Select.jsx` + `ui/Pagination.jsx` (Link-based, preserve query params lain); `tenders/ScoreBadge.jsx` (token `score-high/mid/low` + label KEJAR/TINJAU/LEWATI, `score==null` → "—"), `tenders/StatusBadge.jsx` (token `stage-*` per status pipeline), `tenders/FilterBar.jsx` (`"use client"`, source/status/minScore/keyword via `useSearchParams`+`router.push`, debounce 400ms utk keyword & minScore, reset `page` tiap filter berubah), `tenders/TenderTable.jsx` (kolom Sumber/Tender+Agency+Budget/KBLI dari `kbliMatchedJson[0]?.kbli_code`/Skor/Tenggat (urgent → `text-danger`)/Status/Aksi, empty state), `tenders/PromoteButton.jsx` (`useActionState` + `promoteTender`, pola sama `LoginForm`), `tenders/ScrapeStatusBar.jsx` (`"use client"`, tombol Semua/CIVD/GeoDipa → `POST /api/proxy-scraper`, polling `GET /api/proxy-scraper` tiap 5 detik saat tab visible, progress bar `current_source`/`items_found_so_far`/`items_saved_so_far`/`elapsed_seconds`, auto-`router.refresh()` saat running→selesai, disable tombol saat `running=true`). Diverifikasi end-to-end via dev server (curl + sesi JWT manual): tabel render 240 tender asli, filter source/status/pagination jalan (preserve query params), `bg-stage-*/10`/`bg-score-*/10` resolve via `color-mix()` Tailwind v4. **Catatan**: semua `matchScore`/`kbliMatchedJson` masih `null` di data existing (AI scoring blm pernah jalan utk data lama) — `ScoreBadge`/kolom KBLI tampil "—", baru keisi utk tender baru hasil scrape setelah GAP RF-T-006/007 ditutup (2026-06-08). Slice 2-4 (`/tenders/[id]` detail, Kanban drag-drop, input manual) & TAHAP 4 (`/kbli`) menyusul di sesi terpisah |
| 2026-06-11 | **TAHAP 1.0 & Settings selesai**: Halaman Settings (Pengguna, Scraper Config) kini fully functional terhubung API Next.js dan Prisma DB. Interval scraper dan threshold skor `KEJAR` sekarang dibaca dinamis dari database di `main.py`. Sebagian besar TAHAP 1-4 selesai. TAHAP 6 (Proposal Generator) baru selesai di Backend, Frontend masih 0%. |
---

## 🔲 SETELAH TENDER SELESAI — Project Maker (Catalyst Expansion)

> **Update 2026-06-13**: Arah "App 2 — Internal Workspace" (TAHAP A-G lama, lihat histori
> di bawah) **disupersede**. Project Management (Modul A), Document Management (Modul B),
> dan Client Portal (Modul C) dari `prdv2.md` Bagian 3 sekarang jadi tanggung jawab tim
> **Project App** ("Task by Cliste") eksternal — Catalyst **tidak** membangun ulang ketiganya.
> Arah baru: Catalyst diperluas jadi **"Project Maker"** (business/admin/commercial layer +
> HR + Document Management Hub), terhubung ke Project App lewat
> `integration-contract-project-app.md`. Detail arsitektur & fase: `project-maker-roadmap.md`.
>
> **RAG Knowledge Base (TAHAP G lama) tetap jadi item Catalyst** — relevan untuk
> Document Management Hub (Fase 2) dan potensial modul lain (HR, checklist dokumen
> project), bukan ikut dipegang Project App. Belum masuk 4 fase di bawah — direvisit
> setelah Fase 1-3 stabil & ada cukup volume dokumen (sama seperti prasyarat Phase 3 di
> `prdv2.md`).
>
> **Update 2026-06-13 (lanjutan)**: crosscheck Fase 1-4 vs `project-maker-roadmap.md`
> menambahkan: (1) **Area 1.2** — `ProjectLead` mini-kanban untuk jalur non-tender
> (Lead→Proposal→Quotation), masuk Fase 1; (2) **Fase 5 baru** — Audit Trail/
> `AuditLog` (siapa ubah apa & kapan, scope: data mutation, bukan page-view/presence);
> (3) **Area 6 "Belum berfase"** — potensi integrasi dengan admin website (data pelamar
> vacancy/scholarship → `Employee`), discussion-stage, perlu
> `integration-contract-admin-website.md`. Lihat `project-maker-roadmap.md` untuk detail
> arsitektur tiap penambahan ini.
>
> **Update 2026-06-14**: feedback user terhadap hasil Fase 1 memicu **redesain Fase 2** —
> rencana "Work-Experience Library" (`WorkExperienceRecord`, CRUD kontrak/BAST saja)
> digabung & diperluas jadi **Document Management Hub** generik (`DocumentCategory` +
> `DocumentRecord`, kategori dinamis, dipakai lintas modul tender/project/lead). Modul ini
> juga jadi tempat tim kelola dokumen kerja di halaman tender (gap yang dilaporkan user) +
> shortcut "cari referensi dokumen" di tender & project detail. Detail: `project-maker-roadmap.md`
> Area 3 & §5 Fase 2 (keduanya sudah diupdate).

Kerjakan setelah TAHAP 1-5 App 1 (Tender Platform) stabil. Fase 1-3 & 5 independen (bisa
paralel), Fase 4 blocked (lihat di bawah). Fase 6 **sengaja ditaruh terakhir** (keputusan
user 2026-06-13) — secara teknis tidak blocked, tapi value-nya paling besar setelah
Fase 1-3 punya data untuk diisi ke template.

- [x] **Fase 1** — Project Pipeline Extension: model `Project`/`ProjectTask`/
      `ProjectChecklistItem`/`ProjectPhase`/`ProjectLead` + halaman `/projects`,
      `/projects/[id]`, `/projects/leads` (mini-kanban non-tender), aktifkan
      `ConvertToProjectModal` (`project-maker-roadmap.md` §5 Fase 1)
- [ ] **Fase 2** — Document Management Hub _(redesain 2026-06-14)_: model
      `DocumentCategory` + `DocumentRecord` + halaman `/documents`,
      `/settings/document-categories`, component `DocumentUploadPanel` &
      `DocumentReferencePicker` di `tenders/[id]` & `projects/[id]` (§5 Fase 2)
- [ ] **Fase 3** — HR Module: model `Employee`/`EmployeeDocument` + halaman `/hr`,
      `/hr/[id]`, reminder dokumen via `Notification` (§5 Fase 3)
- [ ] **Fase 4** — Integrasi Project App: create-project API, reporting reference
      (S-Curve/Timesheet deep-link), identity matching — **blocked**, menunggu
      `integration-contract-project-app.md` disepakati dengan tim Project App (§5 Fase 4)
- [ ] **Fase 5** — Audit Trail / Activity Log: model `AuditLog` + helper `logActivity`
      terintegrasi ke Fase 1-3 + halaman `/activity-log` (§5 Fase 5)
- [ ] **Fase 6** _(fase terakhir)_ — Document Generator / Template Engine: rename +
      generalisasi `ProposalTemplate`/`ProposalDraft`/`ProposalBlock` →
      `DocumentTemplate`/`GeneratedDocument`/`DocumentBlock`, panel
      `/settings/document-templates`, generate dokumen (Surat Kerja/BAST/Invoice/
      Kontrak/Laporan CTR/Proposal) dari `ProjectChecklistItem`, dengan strategi
      minimalisasi token AI (§5 Fase 6)
- [ ] **Fase 7** _(Housekeeping & UI Polish)_ — UI Standardization: Audit dan refactor
      komponen-komponen lama (Tenders & Fase 1) agar 100% *compliant* dengan token Tailwind v4
      di `cliste-design-system.md` dan `cliste-component-character.md`.
- [ ] **(Belum berfase)** RAG Knowledge Base untuk Document Management Hub & modul lain —
      direvisit setelah Fase 1-3 jalan, lihat catatan di atas
- [ ] **(Belum berfase)** Page-view tracking & online/offline presence user — beda scope
      dari Fase 5 (audit trail data), perlu pertimbangan privasi tambahan, direvisit
      setelah Fase 5 jalan
- [ ] **(Belum berfase)** Integrasi Admin Website (Area 6: 6.1 Recruitment, 6.2 Project
      Portfolio Showcase) — field data Area 6.1 sudah jelas (lihat
      `integration-contract-admin-website.md`), tapi endpoint/auth/arah call (pull vs
      push) masih perlu dikonfirmasi dgn tim admin website (`project-maker-roadmap.md`
      Area 6)

---

### 🟤 FASE 1 — Project Pipeline Extension (detail)

> Fondasi: model `Project` + turunannya, halaman `/projects`, dan entry point dari
> `TenderResult` (Menang) maupun lead non-tender baru. Fase 2-4 nempel ke `Project` yang
> dibuat di fase ini. Referensi schema sketch: `project-maker-roadmap.md` §4 Area 1 & 1.1.

#### 1.0 Catatan pra-implementasi (perlu diputuskan sebelum/saat schema berubah)

- [x] **Reconcile model legacy `Tender`/`TenderTask`/`KnowledgeBase`** — model ini terpisah
      dari `TenderResult` (yang aktif dipakai Kanban `/tenders`), statusnya pakai enum
      berbeda (`new_lead`→...→`won` vs `DITEMUKAN`→...→`MENANG`), dan kemungkinan dead code
      dari setup awal 2026-06-04. `Project` baru di-FK ke `TenderResult` (bukan `Tender`).
      Sebelum nambah `ProjectTask` (nama mirip `TenderTask` yang sudah ada, beda konteks),
      cek apakah `Tender`/`TenderTask`/`KnowledgeBase` masih dipakai di mana pun
      (`grep` untuk `prisma.tender\.` / `TenderTask`) — kalau tidak, hapus saat migrasi
      schema ini supaya tidak ada dua model "Task" yang ambigu.
- [x] **Checklist template per kategori** — **Keputusan 2026-06-13 (final, bukan
      sementara)**: **tidak ada** auto-generate dari template. Dokumen wajib berbeda
      per pekerjaan — client infokan apa yang perlu diserahkan, tim
      administratif/management input `ProjectChecklistItem` **manual** per
      project/phase. Tidak ada fase lanjutan untuk fitur ini.
- [x] **CTR backfill (`dataCompleteness: "summary"`)** — kolom disiapkan di schema
      `ProjectPhase`. **Update 2026-06-13**: sumber data historis (CTR1-7) **tersedia
      lengkap** (catatan finance ada) — pengisian data masih bisa dikerjakan
      setelah Fase 1 (bukan blocker schema), tapi tidak lagi "menunggu sumber data".
      Fase 1 cukup pastikan field-nya ada dan default `"full"` untuk project/phase baru.
- [x] **Sidebar naming** — **Keputusan 2026-06-13**: rebrand jadi **"Project Maker"**
      (bukan lagi minimal-risk "tambah nav Projects tanpa rebrand"). "Tenders" tetap
      sub-modul sourcing. Task aktual ada di §1.5 (item baru "Rebrand Project Maker").

#### 1.1 Schema Prisma — model baru

- [x] Tambah model `Project` (`id`, `name`, `sourceType` "tender"|"non_tender",
      `tenderResultId`/relasi ke `TenderResult`, `client`, `description`, `status`, `poSoNumber`,
      `poSoDate`, `isShowcased`, `externalProjectId`/`externalProjectUrl` — placeholder utk Fase 4)
- [x] Tambah model `ProjectTask` (todo level admin internal — bukan task eksekusi
      teknis, itu tetap di Project App; lihat catatan 1.0 soal `TenderTask` lama)
- [x] Tambah model `ProjectChecklistItem` (`category` "teknis"|"komersial", `label`,
      `status` "belum"|"sudah"|"expired", `fileUrl`, `phaseId` nullable — `null` =
      checklist level project, terisi = checklist per-fase/CTR)
- [x] Tambah model `ProjectPhase` (CTR: `label`, `sequence`, `startDate`/`endDate`,
      `status`, `disbursementAmount`/`disbursementStatus`, `dataCompleteness` default
      `"full"`)
- [x] Tambah model `ProjectLead` (Area 1.2 — non-tender lead pipeline: `name`, `client`,
      `status` "lead"|"proposal"|"quotation"|"converted"|"cancelled", `description`,
      `estimatedValue`, `notes`, `projectId` nullable/relasi ke `Project` diisi saat
      convert)
- [x] `TenderResult.projectId` (sudah ada sebagai `Int?` polos, lihat
      [schema.prisma:138](catalyst-scout/prisma/schema.prisma#L138)) — jadikan relasi FK
      ke `Project` (`@relation`)
- [x] `npx prisma db push` ke server (100.112.188.84) + `npx prisma generate`

#### 1.2 Server Actions — `actions/projectActions.js` (baru)

- [x] `getProjects({ sourceType, status, client, page })` — list + filter, pola sama
      `getTenders` di `tenderActions.js`
- [x] `getProjectById(id)` — detail + `checklistItems` + `phases` + `tasks`
- [x] `createProjectFromTender(tenderResultId, formData)` — dipanggil dari
      `ConvertToProjectModal`; set `TenderResult.convertedToProject = true` +
      `TenderResult.projectId`, buat `Project` baru `sourceType: "tender"`,
      `status: "Approval"`
- [x] `updateProjectStatus(id, status)` — validasi terhadap
      `Approval | KickOff | POSOIssued | Pelaksanaan | Invoicing | Closed`, dipakai
      kanban drag-and-drop (pola sama `updateTenderStatus`)
- [x] `createChecklistItem` / `updateChecklistItem` (status, `fileUrl`) — manual, lihat
      catatan 1.0 soal template
- [x] `createProjectPhase` / `updateProjectPhase`
- [x] **`ProjectLead` (Area 1.2)**:
  - `getProjectLeads({ status, keyword, page })` — list + filter, pola sama `getTenders`
  - `getProjectLeadById(id)`
  - `createProjectLead(formData)` — `status: "lead"` default
  - `updateProjectLead(id, formData)` — edit info (name/client/description/
    estimatedValue/notes)
  - `updateProjectLeadStatus(id, status)` — validasi `lead|proposal|quotation|
    converted|cancelled`, dipakai mini-kanban drag-and-drop
  - `createProjectFromLead(leadId, formData)` — dipanggil dari tombol "Convert to
    Project" saat `status: "quotation"`; buat `Project` baru (`sourceType:
    "non_tender"`, `status: "Approval"`), set `ProjectLead.projectId` +
    `status: "converted"`

#### 1.3 UI — Halaman List `/projects`

- [x] `app/(dashboard)/projects/page.jsx` — async Server Component, panggil
      `getProjects()`, toggle List/Kanban (reuse `ViewToggle.jsx`)
- [x] `components/projects/ProjectTable.jsx` — kolom: nama, client, sourceType, status,
      PO/SO, link `externalProjectUrl` (kalau sudah ada)
- [x] `components/projects/ProjectKanbanBoard.jsx` + `ProjectKanbanColumn.jsx` +
      `ProjectCard.jsx` — kolom `Approval → KickOff → POSOIssued → Pelaksanaan →
      Invoicing → Closed`, drag-and-drop (pola sama `KanbanBoard.jsx` tenders)
- [x] `components/projects/ProjectStatusBadge.jsx` — token warna per status (tambah
      `stage-project-*` baru di `globals.css` kalau perlu, jangan reuse token
      `stage-*` tenders supaya gak ambigu)
- [x] `components/projects/ProjectFilterBar.jsx` — `sourceType`, `status`, `client`,
      keyword (pola sama `FilterBar.jsx` tenders — `useSearchParams` + debounce)

#### 1.4 UI — Halaman Detail `/projects/[id]`

- [x] `app/(dashboard)/projects/[id]/page.jsx` — fetch via `getProjectById`,
      `toJSONSafe` (pola sama `tenders/[id]/page.jsx`)
- [x] `components/projects/ProjectDetailClient.jsx` — info project (nama, client,
      deskripsi, toggle isShowcased, PO/SO, sourceType, link ke `tenderResult` asal kalau `sourceType === "tender"`,
      link `externalProjectUrl` disabled/placeholder dengan tooltip "menunggu Fase 4")
- [x] `components/projects/ChecklistPanel.jsx` — grouped by `category`, item tanpa
      `phaseId` = checklist level project; item dengan `phaseId` = tampil di bawah
      phase terkait; form tambah item manual. **Tidak ada generate dari template
      kategori** — daftar dokumen wajib beda per project (client infokan, tim
      administratif/management input manual, lihat keputusan roadmap §6)
- [x] `components/projects/ProjectPhaseList.jsx` — daftar `ProjectPhase` (CTR), badge
      `dataCompleteness` (full/summary), status pencairan
- [x] `components/projects/ProjectTaskList.jsx` — todo list ringan level admin
- [ ] `components/projects/ProjectDocumentsPanel.jsx` _(Fase 2 dependency, redesain
      2026-06-14)_ — gabungan `DocumentUploadPanel` (upload & list `DocumentRecord`
      dengan `entityType: "Project"`, `entityId: project.id`) + `DocumentReferencePicker`
      (shortcut "Cari Referensi Dokumen" dari project lain) — lihat Fase 2 §2.5

#### 1.4b UI — Halaman `/projects/leads` (Area 1.2, Non-Tender Lead Pipeline)

- [x] `app/(dashboard)/projects/leads/page.jsx` — mini-kanban
      `Lead → Proposal → Quotation → Converted/Cancelled`, drag-and-drop (pola sama
      `KanbanBoard.jsx` tenders), panggil `getProjectLeads()`
- [x] `components/projects/leads/LeadKanbanBoard.jsx` + `LeadKanbanColumn.jsx` +
      `LeadCard.jsx`
- [x] `app/(dashboard)/projects/leads/new/page.jsx` — form manual entry (name, client,
      description, estimatedValue, notes) → `createProjectLead`
- [x] `app/(dashboard)/projects/leads/[id]/page.jsx` +
      `components/projects/leads/LeadDetailClient.jsx` — detail + edit info; tombol
      "Convert to Project" muncul/aktif hanya saat `status === "quotation"` →
      `createProjectFromLead`, redirect ke `/projects/[id]` setelah sukses

#### 1.5 Entry Points

- [x] `ConvertToProjectModal.jsx` — ganti stub jadi form real (nama project, client
      prefill dari `TenderResult`, PO/SO opsional) → `createProjectFromTender`,
      redirect ke `/projects/[id]` setelah sukses
- [x] `tenders/[id]` — kalau `TenderResult.convertedToProject === true`, sembunyikan
      tombol "Konversi ke Proyek" dan tampilkan link ke `/projects/[id]` (via
      `TenderResult.projectId`) sebagai gantinya
- [x] Jalur non-tender: `/projects/leads/new` → mini-kanban `/projects/leads` → tombol
      "Convert to Project" di `/projects/leads/[id]` (lihat 1.4b) — menggantikan
      rencana lama "halaman `/projects/new`" yang cuma 1 form
- [x] `Sidebar.jsx` — tambah `NAV_ITEMS` entry "Projects" (`/projects`), icon baru.
      "Leads" cukup sub-nav/tab di dalam `/projects`, tidak perlu entry sidebar terpisah
- [x] **Rebrand "Project Maker"** _(keputusan roadmap §6, 2026-06-13)_ — update judul
      brand di `Sidebar.jsx`/`Topbar`/metadata root layout dari "Cliste" (tender-only)
      jadi mencerminkan scope "Project Maker" (mis. "Project Maker" sebagai nama
      aplikasi, "Tenders" tetap sub-modul sourcing). Cosmetic, tidak ada migrasi
      data/skema — bisa dikerjakan kapan saja di Fase 1, gak blocking item lain

#### 1.6 Data Pipeline Ringkas

```
TenderResult (status = MENANG)
   │  ConvertToProjectModal → createProjectFromTender()
   ▼
Project { sourceType: "tender", tenderResultId, status: "Approval" }
   │  (TenderResult.convertedToProject=true, TenderResult.projectId di-set
   │   → tenders/[id] sembunyikan tombol konversi, tampilkan link balik)
   │
   ├─ ProjectChecklistItem  (phaseId = null → checklist level project, manual)
   ├─ ProjectPhase          (opsional, kalau project butuh siklus CTR)
   └─ ProjectTask           (opsional, todo admin internal)

/projects/leads/new (manual entry)
   ▼
ProjectLead { status: "lead" }
   │  drag-and-drop di /projects/leads (mini-kanban)
   ▼
ProjectLead { status: "lead" → "proposal" → "quotation" }
   │  /projects/leads/[id] → tombol "Convert to Project" (aktif saat status=quotation)
   │  → createProjectFromLead()
   ▼
Project { sourceType: "non_tender", tenderResultId: null, status: "Approval" }
   (ProjectLead.projectId di-set, ProjectLead.status: "converted")
   (alur checklist/phase/task sama seperti di atas)

Project.status (kanban /projects, drag-and-drop):
Approval → KickOff → POSOIssued → Pelaksanaan → Invoicing → Closed

externalProjectId / externalProjectUrl: kolom disiapkan kosong di fase ini,
diisi nanti oleh Fase 4 (integrasi Project App).
```

---

### 🟤 FASE 2 — Document Management Hub (detail) _(redesain 2026-06-14)_

> Repository dokumen generik lintas modul (`DocumentRecord`) dengan kategori dinamis
> (`DocumentCategory`) — gantikan rencana "Work-Experience Library" lama
> (`WorkExperienceRecord`). Tiga fungsi sekaligus: (1) hub pusat `/documents` untuk
> search/browse dokumen apapun, (2) tempat tim kelola dokumen kerja di halaman
> tender/project (`DocumentUploadPanel`, jawab poin 3 feedback 2026-06-14), (3) shortcut
> "cari referensi dokumen" by kategori di tender & project detail
> (`DocumentReferencePicker`, jawab poin 4), plus jadi kandidat sumber data **RAG
> Knowledge Base** ("Belum berfase", lihat catatan di atas §SETELAH TENDER SELESAI).
> Referensi schema sketch: `project-maker-roadmap.md` §4 Area 3 (redesain 2026-06-14).
> Butuh model `Project` (Fase 1) — dikerjakan setelah Fase 1, tidak paralel.

#### 2.0 Catatan pra-implementasi

- [ ] **Lokasi file upload** — modul ini pure CRUD master data tanpa AI/parsing, jadi
      sesuai aturan boundary CLAUDE.md ditangani **Next.js saja**, tidak lewat
      scraper-engine. File disimpan di `catalyst-scout/public/uploads/documents/`
      (Next.js serve langsung via `/uploads/documents/<filename>`), tambahkan
      `public/uploads/` ke `.gitignore` (pola sama seperti `storage/` di scraper-engine).
- [ ] **`DocumentCategory` dinamis (poin 5 feedback 2026-06-14)** — seed beberapa kategori
      default saat migrasi (`kontrak`, `bast`, `surat_kerja`, `dokumen_administrasi`,
      `dokumen_teknis`, dll, masing-masing dengan `group` yang sesuai), tapi admin bisa
      tambah/edit/nonaktifkan dari `/settings/document-categories` — jangan hardcode enum
      di kode.
- [ ] **`entityType`/`entityId` polymorphic** — pola sama `AuditLog` (Area 5). Validasi
      `entityType` di server action terhadap whitelist string (`"TenderResult"` |
      `"Project"` | `"ProjectPhase"` | `"ProjectChecklistItem"` | `"ProjectLead"` |
      `null`), bukan enum Prisma — biar gampang nambah entity baru tanpa migration.
- [ ] **Kaitan ke RAG (Belum berfase)** — pastikan `fileUrl` nyimpen path file asli (bukan
      cuma metadata) supaya nanti bisa langsung jadi sumber ingestion kalau RAG Knowledge
      Base digarap, tanpa perlu re-upload.

#### 2.1 Schema Prisma — model baru

- [ ] Tambah model `DocumentCategory` (`id`, `name` unique `@db.VarChar(50)`, `label`,
      `group` nullable `@db.VarChar(30)`, `isActive` `Boolean @default(true)`,
      `sortOrder` `Int @default(0)`, relasi `documents DocumentRecord[]`)
- [ ] Tambah model `DocumentRecord` (`id`, `title`, `fileUrl`, `categoryId` nullable →
      `DocumentCategory`, `entityType` nullable `@db.VarChar(30)`, `entityId` nullable,
      `client` nullable, `tags` nullable, `isReference` `Boolean @default(false)`,
      `uploadedById` nullable → `User`, `createdAt`, index `[entityType, entityId]` +
      `[categoryId]`)
- [ ] Seed data awal `DocumentCategory` (lihat catatan 2.0) — via migration seed script
      atau manual insert sekali setelah `db push`
- [ ] `npx prisma db push` ke server (100.112.188.84) + `npx prisma generate`

#### 2.2 API Route & Server Actions

- [ ] `app/api/documents/upload/route.js` — terima `multipart/form-data`, simpan file ke
      `public/uploads/documents/` (nama file di-prefix `crypto.randomUUID()` biar gak
      collision), return path relatif untuk disimpan ke `fileUrl` (pola request-handling
      sama `api/ai-proposal/templates/route.js`, tapi tanpa proxy ke Python — simpan
      langsung di filesystem Next.js)
- [ ] `actions/documentActions.js` (baru):
  - `getDocuments({ categoryId, group, entityType, entityId, client, keyword,
    isReference, page })` — filter + pagination, pola sama `getTenders`
  - `getDocumentById(id)`
  - `createDocument(formData)` — termasuk `fileUrl` hasil dari upload route, plus
    `entityType`/`entityId`/`categoryId`/`client`/`tags`/`isReference`
  - `updateDocument(id, formData)` — termasuk toggle `isReference`,
    pindah kategori
  - `deleteDocument(id)` — sekaligus hapus file fisik di `public/uploads/documents/`
    kalau ada
  - `getDocumentsForEntity(entityType, entityId)` — dipakai `DocumentUploadPanel`
    (lihat §2.5)
  - `getReferenceDocuments({ categoryId, client, tags, excludeEntityType,
    excludeEntityId })` — dipakai `DocumentReferencePicker` (lihat §2.5), filter
    `isReference: true`
- [ ] `actions/documentCategoryActions.js` (baru):
  - `getDocumentCategories({ activeOnly })` — utk populate dropdown kategori
  - `createDocumentCategory(formData)` / `updateDocumentCategory(id, formData)` /
    `deactivateDocumentCategory(id)` — soft-delete via `isActive: false` (kategori yang
    sudah dipakai `DocumentRecord` tidak boleh hard-delete)

#### 2.3 UI — Halaman `/documents` (Document Hub)

- [ ] `app/(dashboard)/documents/page.jsx` — async Server Component, panggil
      `getDocuments()`
- [ ] `components/documents/DocumentTable.jsx` — kolom: title, kategori (badge, warna by
      `group`), client, link entity asal (kalau `entityType`/`entityId` terisi, link ke
      `/tenders/[id]` atau `/projects/[id]`), badge `isReference`, link file,
      aksi edit/hapus
- [ ] `components/documents/DocumentFilterBar.jsx` — filter `categoryId`, `group`,
      `entityType`, `client`, `isReference`, keyword (pola sama
      `FilterBar.jsx` tenders)
- [ ] `components/documents/DocumentFormModal.jsx` — form tambah/edit (title, kategori
      dropdown dinamis dari `getDocumentCategories`, client, tags, `entityType`/`entityId`
      opsional, toggle `isReference`) + upload file (panggil
      `api/documents/upload` dulu, baru submit form dengan URL hasil upload)

#### 2.4 UI — Halaman `/settings/document-categories`

- [ ] `app/(dashboard)/settings/document-categories/page.jsx` — async Server Component,
      panggil `getDocumentCategories({ activeOnly: false })`
- [ ] `components/settings/DocumentCategoryClient.jsx` — kolom: name (slug), label, group,
      jumlah dokumen terkait, status aktif, aksi edit/nonaktifkan
- [ ] `components/settings/DocumentCategoryFormModal.jsx` — form tambah/edit (`name`,
      `label`, `group` dropdown teknis/komersial/legal/hr, `sortOrder`)

#### 2.5 Components embeddable — `tenders/[id]` & `projects/[id]`

- [ ] `components/documents/DocumentUploadPanel.jsx` — panel "Dokumen" (props
      `entityType`, `entityId`): list `DocumentRecord` via `getDocumentsForEntity` +
      form upload baru (title, kategori dropdown, tags, toggle `isReference`). Dipasang
      di `TenderDetailClient.jsx` (entity `"TenderResult"`, jawab poin 3 feedback
      2026-06-14 — sebelumnya tender detail cuma punya lampiran scraping read-only) dan
      `ProjectDetailClient.jsx`/`ProjectDocumentsPanel.jsx` (entity `"Project"`, lihat
      Fase 1 §1.4)
- [ ] `components/documents/DocumentReferencePicker.jsx` — tombol "Cari Referensi
      Dokumen" → modal filter by kategori/client/tags, browse `getReferenceDocuments()`
      (exclude entity saat ini), preview/download dokumen. Dipasang di kedua halaman
      detail yang sama (jawab poin 4 feedback 2026-06-14)

#### 2.6 Sidebar

- [ ] `Sidebar.jsx` — tambah `NAV_ITEMS` entry "Documents" (`/documents`), icon baru
- [ ] `Sidebar.jsx` (atau menu settings) — tambah link "Document Categories"
      (`/settings/document-categories`)

#### 2.7 Data Pipeline Ringkas

```
User isi DocumentFormModal / DocumentUploadPanel (title, kategori, client, tags)
   │  upload file → POST /api/documents/upload
   │  → file tersimpan di public/uploads/documents/<uuid>-<filename>
   ▼
createDocument(formData + fileUrl + entityType/entityId opsional)
   ▼
DocumentRecord (DB)
   │
   ├─ ditampilkan di /documents (hub: search + filter lintas modul)
   ├─ ditampilkan di DocumentUploadPanel pada entity asalnya (tenders/[id], projects/[id])
   ├─ kalau isReference=true → muncul di DocumentReferencePicker entity lain
   └─ (masa depan, "Belum berfase") kandidat sumber ingestion RAG Knowledge Base
```

---

### 🟤 FASE 3 — HR Module (detail)

> Master data karyawan + dokumen pribadi dengan tracking masa berlaku, untuk lampiran
> personel di dokumen tender/project. Referensi schema sketch: `project-maker-roadmap.md`
> §4 Area 2. Independen dari Fase 1-2 — bisa paralel.

#### 3.0 Catatan pra-implementasi

- [ ] **PII — storage & access control `EmployeeDocument`** — KTP/BPJS/Ijazah/KK/NPWP
      adalah data pribadi sensitif, **beda level** dari kontrak/BAST di Fase 2. **Jangan**
      pakai pola `public/uploads/` (file ke-serve tanpa auth ke siapa saja yang punya
      link). Simpan di folder non-public `catalyst-scout/storage/hr/` (gitignored, pola
      sama `scraper-engine/storage/`), serve lewat API route ber-auth
      `app/api/hr/files/[...path]/route.js` yang cek `getCurrentUser()` sebelum stream
      file (401 kalau belum login). *(Catatan tambahan, bukan blocking Fase 3: pola
      `public/uploads/` di Fase 2 untuk kontrak/BAST masih oke untuk MVP, tapi worth
      direvisit kalau dokumen tersebut juga dianggap confidential.)*
- [ ] **Mekanisme reminder expiry — belum ada scheduler persistent di Next.js.** Hanya
      scraper-engine yang punya asyncio loop. Pilihan:
      - **(a) Lazy-check (default Fase 3 MVP)** — tiap `/hr` page di-load, hitung
        `status` per `EmployeeDocument` on-the-fly dari `expiryDate`; kalau status
        berubah jadi `expiring_soon`/`expired` dan belum ada `Notification` aktif untuk
        dokumen itu (cek by `actionLink`), buat satu `Notification` baru. Simple, no
        cross-domain dependency, tapi cuma trigger kalau ada yang buka `/hr`.
      - **(b) Extend scraper-engine scheduler** dengan task harian cek
        `EmployeeDocument.expiryDate` — lebih reliable (jalan otomatis tiap hari)
        tapi scraper-engine jadi nyentuh tabel HR (cross-domain). Didiskusikan kalau
        opsi (a) kerasa kurang.
- [ ] **`docType` fixed set** (per roadmap): `ktp | bpjs | ijazah | kk | npwp`.
      `status` dihitung: `valid` (expiryDate > now+30hari atau null utk dokumen tanpa
      expiry seperti ijazah/kk/npwp), `expiring_soon` (`expiryDate <= now+30hari`),
      `expired` (`expiryDate < now`), `missing` (belum ada record `EmployeeDocument`
      untuk `docType` tersebut).

#### 3.1 Schema Prisma — model baru

- [ ] Tambah model `Employee` (`id`, `name`, `position` nullable, `isActive` default
      `true`, relasi `documents EmployeeDocument[]`)
- [ ] Tambah kolom placeholder `Employee.originApplicantId` (String?, nullable) +
      `Employee.source` (String? "internal"|"admin_website_vacancy"|
      "admin_website_scholarship") — prep untuk Area 6 (integrasi admin website,
      "Belum berfase"), tidak mengubah flow Fase 3 yang ada
- [ ] Tambah model `EmployeeDocument` (`id`, `employeeId`/relasi ke `Employee`,
      `docType` `@db.VarChar(20)`, `fileUrl`, `expiryDate` nullable, `status`
      `@db.VarChar(20)`)
- [ ] `npx prisma db push` ke server (100.112.188.84) + `npx prisma generate`

#### 3.2 API Route & Server Actions

- [ ] `app/api/hr/upload/route.js` — terima `multipart/form-data`, simpan file ke
      `catalyst-scout/storage/hr/` (gitignored, **bukan** `public/`), return path
      relatif untuk `EmployeeDocument.fileUrl`
- [ ] `app/api/hr/files/[...path]/route.js` — `getCurrentUser()` guard → stream file
      dari `storage/hr/` (401 kalau belum login, 404 kalau file gak ada)
- [ ] `actions/hrActions.js` (baru):
  - `getEmployees({ isActive, keyword, page })` — list + filter, pola sama `getTenders`;
    sekaligus compute `status` per `docType` untuk badge kelengkapan
  - `getEmployeeById(id)` — detail + semua `EmployeeDocument`
  - `createEmployee(formData)` / `updateEmployee(id, formData)` /
    `toggleEmployeeActive(id)`
  - `upsertEmployeeDocument(employeeId, docType, formData)` — create atau replace
    dokumen existing per `docType` (1 dokumen aktif per `docType` per employee),
    hitung & simpan `status` dari `expiryDate`
  - `checkExpiringDocumentsAndNotify()` — implementasi opsi 3.0(a): dipanggil dari
    `getEmployees()`/`/hr` page load, scan `EmployeeDocument` yang `status` berubah ke
    `expiring_soon`/`expired`, create `Notification` (title, message, `actionLink:
    /hr/{employeeId}`) kalau belum ada notif aktif untuk dokumen tsb

#### 3.3 UI — Halaman `/hr`

- [ ] `app/(dashboard)/hr/page.jsx` — async Server Component, panggil `getEmployees()`
      (sekaligus trigger `checkExpiringDocumentsAndNotify()`)
- [ ] `components/hr/EmployeeTable.jsx` — kolom: nama, posisi, status aktif, 5 badge
      kelengkapan dokumen (KTP/BPJS/Ijazah/KK/NPWP)
- [ ] `components/hr/EmployeeDocumentBadge.jsx` — badge per `docType`, warna per
      `status` (valid/expiring_soon/expired/missing — token baru di `globals.css`,
      bisa reuse `success/warning/danger` yang sudah ada utk 3 dari 4 status)
- [ ] Filter bar: `isActive`, keyword (nama/posisi)

#### 3.4 UI — Halaman Detail `/hr/[id]`

- [ ] `app/(dashboard)/hr/[id]/page.jsx` — fetch via `getEmployeeById`
- [ ] `components/hr/EmployeeDetailClient.jsx` — info karyawan (nama, posisi, status
      aktif, toggle aktif/nonaktif)
- [ ] `components/hr/EmployeeDocumentList.jsx` — list 5 `docType`, tiap baris:
      status badge, `expiryDate` (kalau ada), link "Lihat" (via
      `/api/hr/files/[...path]`, auth-gated), tombol upload/replace
- [ ] `components/hr/EmployeeDocumentUploadForm.jsx` — form upload per `docType`
      (file + `expiryDate` opsional) → `POST /api/hr/upload` lalu
      `upsertEmployeeDocument`

#### 3.5 Sidebar

- [ ] `Sidebar.jsx` — tambah `NAV_ITEMS` entry "HR" (`/hr`), icon baru

#### 3.6 Data Pipeline Ringkas

```
Admin create Employee (name, position)
   ▼
EmployeeDocument per docType (ktp | bpjs | ijazah | kk | npwp)
   │  upload file → POST /api/hr/upload
   │  → file tersimpan di storage/hr/<uuid>-<filename> (non-public)
   │  expiryDate diisi (null utk ijazah/kk/npwp biasanya)
   ▼
status dihitung: valid | expiring_soon (<=30 hari) | expired | missing
   │
   ├─ ditampilkan sebagai badge di /hr (list) dan /hr/[id] (detail)
   ├─ "Lihat" dokumen → GET /api/hr/files/[...path] (cek getCurrentUser(), stream file)
   └─ saat /hr di-load & status transisi ke expiring_soon/expired (3.0 opsi a)
       → checkExpiringDocumentsAndNotify() → createNotification
       (title, message, actionLink=/hr/{employeeId})
       → muncul di BellNotification (sudah ada, polling 30s)
```

---

### 🟤 FASE 4 — Integrasi Project App (detail) — 🚫 BLOCKED

> **Status: blocked.** Seluruh breakdown di bawah adalah **kerangka kerja** begitu
> `integration-contract-project-app.md` disepakati dengan tim Project App — **bukan**
> task yang bisa dimulai sekarang. Jangan mulai 4.1-4.5 sebelum 4.0 selesai.

#### 4.0 Prasyarat (blocking — lihat `integration-contract-project-app.md` §7)

- [ ] `{PROJECT_APP_URL}` — base URL endpoint integrasi disepakati
- [ ] Mekanisme `{SERVICE_TOKEN}` (API key vs service account, penerbitan, rotasi)
- [ ] Trigger timing create-project: status `Approval` atau `KickOff`?
- [ ] Webhook callback (§4) tersedia atau tidak — kalau tidak, perlu rencana polling
- [ ] Mapping status: daftar status Project App ↔ `Approval|KickOff|POSOIssued|
      Pelaksanaan|Invoicing|Closed` di Catalyst
- [ ] §6: format URL deep-link S-Curve/Timesheet (`from`/`to` filter) + apakah perlu
      session Task by Cliste terpisah
- [ ] §6: API export Excel snapshot tersedia (untuk arsip laporan CTR)?
- [ ] §9: Skema A (email) vs Skema B (`globalSubject`) — keputusan + status
      SSO/Entra migration (workstream terpisah, lihat roadmap §2.2)
- [ ] `ProjectPhase.externalPhaseId` — apakah Project App punya konsep "phase"/"sprint"
      yang align dengan CTR? Kalau ya, tambah kolom via migration terpisah (non-blocking,
      **keputusan 2026-06-13**: tidak ditambah sebagai placeholder di Fase 1, lihat
      roadmap §6)

#### 4.1 Create-Project API Integration (contract §2-3)

- [ ] `.env` — `PROJECT_APP_URL`, `PROJECT_APP_SERVICE_TOKEN` (gitignored, jangan
      hardcode)
- [ ] `lib/projectAppApi.js` — fetch wrapper ke Project App (pola sama
      `lib/scraperApi.js`), inject `Authorization: Bearer {SERVICE_TOKEN}`
- [ ] `actions/projectActions.js` — hook di `updateProjectStatus`: begitu `Project`
      mencapai status trigger (Approval/KickOff, sesuai 4.0), panggil
      `POST {PROJECT_APP_URL}/api/integrations/projects` dengan payload
      `{ name, client, sourceType, poSoNumber, poSoDate, catalystRefId: project.id }`
      → simpan response `externalProjectId`/`externalProjectUrl` ke `Project`
- [ ] Error handling: kalau call gagal, `Project` tetap tersimpan di Catalyst
      (`externalProjectId` tetap `null`) — tambah tombol manual "Sync ke Project App"
      di `ProjectDetailClient.jsx` untuk retry, daripada blocking create flow

#### 4.2 Event Callback (contract §4, opsional — tergantung 4.0)

- [ ] `app/api/integrations/project-status/route.js` — `POST`, verifikasi
      `SERVICE_TOKEN`, terima `{ catalystRefId, externalProjectId, status }`
- [ ] Mapping status Project App → `Project.status` internal (tabel mapping dari 4.0),
      update via `updateProjectStatus` internal (tanpa re-trigger 4.1)

#### 4.3 Reporting Reference — S-Curve/Timesheet Deep-link (contract §6)

- [ ] Saat `ProjectPhase` (CTR) dibuat/checklist kategori "Laporan CTR-X" dibuat,
      generate deep-link:
      `{PROJECT_APP_URL}/projects/{externalProjectId}/s-curve?from={phase.startDate}&to={phase.endDate}`
      (path & query param exact — tunggu konfirmasi 4.0)
- [ ] Simpan URL ke `ProjectChecklistItem.fileUrl` (field yang sama dipakai untuk
      link, bukan cuma file upload — lihat `ChecklistPanel.jsx` dari Fase 1)
- [ ] `ChecklistPanel.jsx` — render `fileUrl` yang berupa URL eksternal sebagai link
      "Buka S-Curve/Timesheet" (`target="_blank"`), beda styling dari link file upload
      biasa
- [ ] (Opsional, arsip) saat `ProjectPhase.status` → `closed`, ambil snapshot Export
      Excel rentang tanggal fase (kalau API tersedia, 4.0) dan simpan sebagai file
      statis arsip — terpisah dari live link di atas

#### 4.4 Document Management & Client Portal — Link-out (roadmap §2.1)

- [ ] **Tidak ada build baru** — `ProjectChecklistItem.fileUrl` juga bisa point ke
      URL storage/client-portal Project App (pola sama 4.3), `prdv2.md` Bagian 3
      Modul B/C tetap jadi requirement reference untuk tim Project App, bukan
      diimplementasi di Catalyst

#### 4.5 Identity Matching (contract §9)

- [ ] **Short-term (Skema A)**: matching by email (`User.email` Catalyst vs email
      Project App, format `namalengkap@cliste.co.id`) — dipakai untuk link PIC/
      assignee antar sistem di `ProjectDetailClient.jsx` (mis. "PIC project ini di
      Project App: ...")
- [ ] **Long-term (Skema B)**: capture `globalSubject` (Entra `oid`/`sub`) — **blocked
      lebih lanjut** oleh SSO/Entra migration (roadmap §2.2, workstream terpisah,
      Catalyst masih JWT_SECRET lokal). Tidak actionable sampai SSO aktif di kedua
      sistem.

#### 4.6 Data Pipeline Ringkas (setelah contract tersedia)

```
Project.status → (Approval | KickOff, sesuai 4.0)
   │  actions/projectActions.js → lib/projectAppApi.js
   ▼
POST {PROJECT_APP_URL}/api/integrations/projects
   { name, client, sourceType, poSoNumber, poSoDate, catalystRefId }
   ▼
Response { externalProjectId, externalProjectUrl }
   → disimpan ke Project.externalProjectId / externalProjectUrl
   → ProjectDetailClient.jsx tampilkan link aktif (gak disabled lagi, lihat Fase 1)

ProjectPhase (CTR) dibuat
   ▼
ProjectChecklistItem.fileUrl = deep-link S-Curve/Timesheet (contract §6)
   → ChecklistPanel.jsx render sebagai link eksternal

(Opsional) Project App kirim event status berubah
   ▼
POST {CATALYST_URL}/api/integrations/project-status
   → mapping status → Project.status (internal, no re-trigger ke 4.1)
```

---

### 🟤 FASE 5 — Audit Trail / Activity Log (detail)

> Jawab kebutuhan "log perubahan data per project/file, siapa & kapan". Model generik
> `AuditLog` + helper `logActivity`, dipasang ke server actions Fase 1-3. Referensi:
> `project-maker-roadmap.md` Area 5. **Tidak termasuk** page-view tracking & online/
> offline presence — itu item "Belum berfase" terpisah (beda scope & pertimbangan
> privasi). Independen — bisa dikerjakan kapan saja setelah ada actions Fase 1-3 untuk
> di-instrument (idealnya setelah Fase 1-3, tapi bisa dicicil incremental).

#### 5.0 Catatan pra-implementasi

- [ ] **Scope dikunci ke audit trail data mutation saja** (create/update/delete/
      status_change pada `Project`/`ProjectLead`/`ProjectPhase`/
      `ProjectChecklistItem`/`Employee`/`EmployeeDocument`/`DocumentRecord`/
      `DocumentCategory`).
      Page-view & presence **di luar scope Fase 5** — jangan dicampur ke `AuditLog`.
- [ ] **Retensi data** — masih open question (roadmap §6 Area 5). Fase 5 MVP: tanpa
      retention policy/cleanup job (simpan semua). Kebijakan retensi (terutama kalau
      nanti `AuditLog` correlate dengan data PII HR) didiskusikan terpisah, **tidak
      blocking** implementasi awal.
- [ ] `entityId` disimpan sebagai `String` (bukan `Int`) supaya generic — beberapa
      model pakai `Int` autoincrement (`Project`, `ProjectLead`, dst), `User` pakai
      `String` (uuid).

#### 5.1 Schema Prisma — model baru

- [ ] Tambah model `AuditLog` (`id`, `userId` nullable/relasi ke `User`, `action`
      "create"|"update"|"delete"|"status_change", `entityType`, `entityId` (String),
      `changesJson` (Json? — `{ field: { old, new } }`), `metadata` (Json?),
      `createdAt`)
- [ ] `npx prisma db push` ke server (100.112.188.84) + `npx prisma generate`

#### 5.2 Helper — `lib/auditLog.js` (baru)

- [ ] `logActivity({ userId, action, entityType, entityId, changes, metadata })` —
      tulis 1 row `AuditLog`. `changes` = object `{ field: { old, new } }` (caller
      hitung diff sebelum panggil); `try/catch` internal — kegagalan log **tidak**
      boleh gagalkan mutasi utamanya (fire-and-forget, log error ke console kalau gagal)

#### 5.3 Integrasi ke Server Actions Fase 1-3

- [ ] `actions/projectActions.js`:
  - `createProjectFromTender`/`createProjectFromLead` → `logActivity(action: "create",
    entityType: "Project", entityId: project.id)`
  - `updateProjectStatus` → `logActivity(action: "status_change", entityType:
    "Project", changes: { status: { old, new } })`
  - `createChecklistItem`/`updateChecklistItem`, `createProjectPhase`/
    `updateProjectPhase`, `updateProjectLeadStatus` → masing-masing
    `logActivity` sesuai `entityType` (`ProjectChecklistItem`/`ProjectPhase`/
    `ProjectLead`)
- [ ] `actions/documentActions.js`: `createDocument`/`updateDocument`/`deleteDocument` →
      `logActivity(entityType: "DocumentRecord")`; `documentCategoryActions.js`:
      `createDocumentCategory`/`updateDocumentCategory`/`deactivateDocumentCategory` →
      `logActivity(entityType: "DocumentCategory")`
- [ ] `actions/hrActions.js`: `createEmployee`/`updateEmployee`/
      `toggleEmployeeActive`/`upsertEmployeeDocument` →
      `logActivity(entityType: "Employee" | "EmployeeDocument")`

#### 5.4 UI — Halaman `/activity-log`

- [ ] `app/(dashboard)/activity-log/page.jsx` — async Server Component, panggil
      `getAuditLogs({ entityType, userId, dateFrom, dateTo, page })`
- [ ] `actions/auditLogActions.js` — `getAuditLogs(filters)`, pola sama `getTenders`
      (pagination + filter)
- [ ] `components/activity-log/ActivityLogTable.jsx` — kolom: waktu, user, action,
      entity (link ke halaman terkait, mis. `Project #42` → `/projects/42`), ringkasan
      `changesJson`
- [ ] `components/activity-log/ActivityLogFilterBar.jsx` — filter `entityType`,
      `userId`, rentang tanggal
- [ ] `Sidebar.jsx` — tambah `NAV_ITEMS` entry "Activity Log" (`/activity-log`,
      admin-only — cek `role === "admin"` di guard halaman, pola sama "Tambah User"
      di `/settings`)

#### 5.5 Data Pipeline Ringkas

```
User lakukan aksi (create/update/delete/status_change) via server action
Fase 1-3 (projectActions.js / workExperienceActions.js / hrActions.js)
   │
   ▼
Action jalan seperti biasa (mutasi Prisma) → lalu panggil
logActivity({ userId, action, entityType, entityId, changes, metadata })
   │  (fire-and-forget, gak block response kalau gagal)
   ▼
AuditLog (DB)
   │
   └─ ditampilkan di /activity-log (admin-only), filter by entityType/user/tanggal,
      link ke entity terkait
```

### 🟤 FASE 6 — Document Generator / Template Engine (detail) _(fase terakhir)_

> Generalisasi backend Proposal Generator (TAHAP 6, sudah jalan tapi frontend 0%) jadi
> template engine generik untuk semua jenis dokumen (Surat Kerja, BAST, Laporan CTR,
> Invoice, Kontrak, Proposal). Referensi arsitektur: `project-maker-roadmap.md` Area 7 &
> §5 Fase 6. **Sengaja ditaruh terakhir** — secara teknis tidak blocked (basis backend
> TAHAP 6 sudah ada), tapi value-nya paling besar setelah `ProjectChecklistItem` (Fase 1),
> `DocumentRecord` (Fase 2), `Employee` (Fase 3) tersedia sebagai sumber data-fill.

#### 6.0 Catatan pra-implementasi — strategi minimalisasi token AI

- [ ] **Default = data-fill, bukan AI.** Mayoritas `documentType` (Surat Kerja, BAST,
      Invoice, Laporan CTR) adalah substitusi placeholder `.docx` dari data
      `Project`/`ProjectPhase`/`Employee`/`DocumentRecord` — **0 token AI**.
      `DocumentTemplate.aiSections: []` (atau `null`) = pure data-fill.
- [ ] **AI sections eksplisit per-template** — hanya heading yang ditandai di
      `aiSections` (mis. "SCOPE OF WORK" di Kontrak/Proposal) yang trigger call AI.
      Kebanyakan template lain realistis `aiSections: []`.
- [ ] **Reuse Claude Haiku + masking** — pola sama `ai_proposal_agent.py`
      (`claude-haiku-4-5-20251001`), masking tetap jalan sesuai
      `security-checklist.md` §7. **Jangan** ganti ke model lebih besar untuk
      generalisasi ini.
- [ ] **Prompt minimal & ter-scope** — kirim hanya field relevan ke `sectionKey` yang
      sedang digenerate (mis. `project.name`/`client`/deskripsi singkat), bukan
      seluruh data entity atau `tender_text`.
- [ ] **Generate-once, cache `DocumentBlock.content`** — re-export `.docx` (
      `status: "exported"`) **tidak** panggil AI ulang, pakai content tersimpan.
      AI hanya dipanggil ulang lewat tombol "Regenerate" per-block.
- [ ] **Edit manual → `DocumentBlock.source: "manual"`** — supaya "Regenerate All"
      tidak menimpa edit manual tanpa konfirmasi (warning dialog kalau ada block
      `source: "manual"` yang akan ke-overwrite).

#### 6.1 Migrasi/Rename Model — Prisma + SQLAlchemy

- [ ] Rename `ProposalTemplate` → `DocumentTemplate`: tambah kolom `documentType`
      (`@db.VarChar(30)`, default `"proposal"` untuk row existing), `aiSections`
      (`Json?`), `isActive` (`Boolean @default(true)`). `fileUrl` tetap, tapi
      storage path target generalisasi ke `storage/document_templates/` (existing
      `storage/proposal_templates/` jadi sub-case `documentType="proposal"` atau
      di-migrate isi foldernya — pilih salah satu, catat di commit).
- [ ] Rename `ProposalDraft` → `GeneratedDocument`: tambah kolom `entityType`
      (`@db.VarChar(30)`, default `"TenderResult"` utk row existing),
      `entityId` (`String`, isi dari `tenderResultId.toString()` saat migrasi),
      `documentType` (default `"proposal"`). Kolom `tenderResultId` lama bisa
      dipertahankan nullable untuk backward-compat data lama, atau drop kalau
      `entityType`+`entityId` cukup — **keputusan saat eksekusi**, cek dulu apakah
      ada row existing yang perlu dipertahankan.
- [ ] Rename `ProposalBlock` → `DocumentBlock`: kolom `source`
      (`"data"|"ai"|"manual"`, default `"ai"` utk row existing — sebelumnya semua
      block proposal emang hasil AI/template).
- [ ] `npx prisma db push` + `npx prisma generate`; sinkronkan rename di
      `database.py` (SQLAlchemy) — model class name + `@@map`/`__tablename__`
      ke `document_templates`/`generated_documents`/`document_blocks`.

#### 6.2 Backend — Generalisasi `docx_generator.py` & `ai_proposal_agent.py`

- [ ] `docx_generator.py` — ganti parameter dari tender-specific (`tender_result_id`,
      `sections_to_replace` hardcoded utk proposal) jadi generik: terima
      `entity_data: dict` (field-field yang akan di-substitusi ke placeholder/
      section) + `ai_sections: list[str]` dari `DocumentTemplate.aiSections`. 3 mode
      (section-replace/placeholder/from-scratch) **logic-nya tetap sama**, cuma
      sumber datanya jadi parameter, bukan query `TenderResult` langsung.
- [ ] `ai_proposal_agent.py` — generalisasi nama (atau biarkan nama file, cukup
      generalisasi fungsi) jadi terima `section_key` + `entity_data` minimal yang
      relevan ke section itu (lihat 6.0 poin "Prompt minimal"), bukan seluruh
      `tender_text`. Masking tetap dipanggil sebelum kirim ke Claude & sesudah
      terima hasil.
- [ ] Endpoint `main.py`:
      - `GET/POST/PUT/DELETE /api/v1/documents/templates[/{id}]` — CRUD
        `DocumentTemplate`, filter by `documentType`, upload `.docx` ke
        `storage/document_templates/`
      - `POST /api/v1/documents` — generate `GeneratedDocument` dari
        `{ documentType, templateId, entityType, entityId, entityData }` — buat
        `DocumentBlock`s (data-fill langsung utk section non-AI, call AI utk
        section di `aiSections`)
      - `GET /api/v1/documents/{id}` — fetch document + blocks
      - `PUT /api/v1/documents/blocks/{block_id}` — edit content/approval
        (`source` jadi `"manual"` kalau content diubah user)
      - `POST /api/v1/documents/blocks/{block_id}/regenerate` — regenerate 1 block
        via AI (hanya untuk block dengan `source: "ai"`/section ada di
        `aiSections`) — endpoint baru, **eksplisit per-block**, tidak ada
        "regenerate all" otomatis tanpa konfirmasi
      - `GET /api/v1/documents/{id}/export` — export `.docx` via
        `DocxGenerator` (generalized)
      - `POST /api/v1/proposals*` (existing) — tetap ada sebagai **alias** ke
        endpoint generic dengan `documentType="proposal"` (lihat open question
        roadmap §6), supaya kalau frontend Proposal Generator (TAHAP 6) mulai
        dikerjakan duluan/bareng, tidak perlu tunggu Fase 6 selesai total.

#### 6.3 UI — Panel `/settings/document-templates`

- [ ] `app/(dashboard)/settings/document-templates/page.jsx` — list
      `DocumentTemplate` grouped by `documentType`, filter active/archived.
- [ ] `actions/documentTemplateActions.js` — `getDocumentTemplates(documentType?)`,
      `uploadDocumentTemplate(formData)`, `updateDocumentTemplate(id, {aiSections,
      isActive})`, `deleteDocumentTemplate(id)` — proxy ke
      `/api/v1/documents/templates*`.
- [ ] `components/document-templates/TemplateUploadForm.jsx` — pilih
      `documentType` (dropdown: Proposal/Surat Kerja/BAST/Invoice/Kontrak/Laporan
      CTR — bisa extend), upload `.docx`.
- [ ] `components/document-templates/AiSectionsEditor.jsx` — setelah upload,
      tampilkan daftar heading `Heading 1`/`Heading 2` yang terdeteksi di `.docx`
      (hasil scan backend saat upload), user centang mana yang `aiSections` (lihat
      open question roadmap §6 soal UX exact-nya — checklist heading vs convention
      `[AI]` prefix, putuskan salah satu saat mulai fase ini).
- [ ] `components/document-templates/TemplateList.jsx` — per `documentType`: badge
      versi aktif, tombol "Set as active"/"Archive" (versi lama tetap ada untuk
      referensi `GeneratedDocument` historis, tidak dihapus).
- [ ] `Sidebar.jsx`/settings nav — tambah entry "Document Templates" di
      `/settings` (admin-only, pola sama "Activity Log").

#### 6.4 UI — Generate Document dari `ProjectChecklistItem`

- [ ] Di `ChecklistPanel.jsx` (Fase 1) — tombol "Generate Document" per
      `ProjectChecklistItem` yang `label`-nya match `documentType` (mis. label
      "Surat Kerja" → `documentType: "surat_kerja"`). Kalau tidak ada
      `DocumentTemplate` aktif untuk `documentType` itu, tombol disabled +
      tooltip "Belum ada template, atur di Settings".
- [ ] `actions/documentActions.js` — `generateDocument({ documentType, entityType:
      "Project"|"ProjectChecklistItem"|..., entityId, entityData })` → proxy
      `POST /api/v1/documents`; `getGeneratedDocument(id)`, `updateDocumentBlock`,
      `regenerateDocumentBlock`, `exportDocument`.
- [ ] `components/documents/DocumentBlockEditor.jsx` — render per-`DocumentBlock`:
      `source: "data"` (read-only, badge "Data"), `source: "ai"`/`"manual"`
      (editable textarea + badge, tombol "Regenerate" hanya utk `source: "ai"`).
- [ ] Tombol "Download .docx" → `exportDocument` → simpan `fileUrl` balik ke
      `ProjectChecklistItem.fileUrl` (update via `updateChecklistItem` Fase 1).
- [ ] Proposal Generator (TAHAP 6 existing plan) — `tenders/[id]/proposal/page.jsx`
      bisa reuse `DocumentBlockEditor`/`documentActions.js` yang sama
      (`documentType: "proposal"`, `entityType: "TenderResult"`), tinggal beda
      entry point & data awal.

#### 6.5 Data Pipeline Ringkas

```
Admin upload template .docx → /settings/document-templates
   │  scan heading, tandai aiSections (mis. "SCOPE OF WORK")
   ▼
DocumentTemplate { documentType, fileUrl, aiSections, isActive: true }

User di /projects/[id] (ChecklistPanel) klik "Generate Document"
   │  (untuk item "Surat Kerja"/"BAST"/dst)
   ▼
generateDocument({ documentType, entityType: "ProjectChecklistItem", entityId, entityData })
   │  POST /api/v1/documents
   ▼
Backend: untuk tiap section template —
   - section TIDAK di aiSections → DocumentBlock{ source: "data", content: <substitusi> }   (0 token)
   - section ADA di aiSections   → mask entityData relevan → Claude Haiku → unmask
                                     → DocumentBlock{ source: "ai", content: <hasil> }
   ▼
GeneratedDocument { status: "draft" } + DocumentBlock[]
   │
   ├─ user edit block manual → source: "manual"
   ├─ user klik "Regenerate" per-block (source: "ai" only) → 1 call AI, bukan semua
   └─ user klik "Download .docx" → export → fileUrl
                                       │
                                       ▼
                          ProjectChecklistItem.fileUrl (Fase 1) terisi
```

<details>
<summary>Histori — rencana lama "App 2: Internal Workspace TAHAP A-G" (superseded 2026-06-13)</summary>

- [ ] ~~**TAHAP A:** Auth & RBAC — model `User` sudah ada di schema, belum ada auth layer~~
- [ ] ~~**TAHAP B:** App 2 — Project Management (Kanban, task, milestone, workload)~~ → dipegang Project App
- [ ] ~~**TAHAP C:** App 2 — Document Management (upload, versioning, MinIO)~~ → dipegang Project App
- [ ] ~~**TAHAP D:** App 2 — Client Portal (token akses per-proyek, MoM, sign-off)~~ → dipegang Project App
- [ ] ~~**TAHAP E:** Integrasi: Tender Won → Proyek Baru di App 2~~ → digantikan Fase 1 & 4 di atas
- [ ] ~~**TAHAP F:** App 2 Phase 2 — Analytics, notifikasi email, Gantt Chart~~ → dipegang Project App
- [ ] ~~**TAHAP G:** App 2 Phase 3 — RAG Knowledge Base~~ → tetap jadi item Catalyst, lihat "(Belum berfase)" di atas

</details>

---

## 📌 STATUS RINGKAS CODEBASE

| Komponen                                        | Status                                                                                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend — GeoDipa scraper                       | ✅ Selesai — 2026-06-04                                                                                                                                  |
| Backend — CIVD scraper                          | ✅ Selesai — 2026-06-04                                                                                                                                  |
| ~~Backend — GEP scraper~~                       | 🚫 Out of scope (2026-06-08), kode dihapus                                                                                                               |
| ~~Backend — LPSE scraper~~                      | 🚫 Out of scope (2026-06-08)                                                                                                                             |
| Backend — AI matcher                            | ✅ Selesai — 2026-06-04                                                                                                                                  |
| Backend — Masking service                       | ✅ Selesai — 2026-06-04                                                                                                                                  |
| Backend — AI Proposal agent                     | ✅ Selesai — 2026-06-10 (rewrite, generate via Claude Haiku + masking, fallback template)                                                                |
| Backend — `docx_generator.py`                   | ✅ Selesai — 2026-06-10 (361 baris, `python-docx`, 3 mode: section-replace/placeholder/from-scratch)                                                     |
| Backend — Scheduler otomatis (RF-T-001)         | ✅ Selesai — 2026-06-08 (asyncio loop, GeoDipa 24j/CIVD 12j)                                                                                             |
| Backend — Logging job scraping (RF-T-012)       | ✅ Selesai — 2026-06-08 (`ScrapingJob` ter-wire penuh)                                                                                                   |
| Backend — Retry otomatis (NFR 2.6)              | ✅ Selesai — 2026-06-08 (`request_with_retry`, max 3x)                                                                                                   |
| Backend — Change detection (RF-T-005)           | ✅ Selesai — 2026-06-08 (`_apply_tender_changes`)                                                                                                        |
| Backend — Notif kegagalan scraper (RF-T-013)    | ✅ Selesai — 2026-06-08                                                                                                                                  |
| Backend — Notif skor tinggi (RF-T-008)          | ✅ Selesai — 2026-06-08 (`match_score`/`recommendation` kini diisi via `_score_tender_against_kbli`, RF-T-006/007 sudah di-wire ke pipeline scrape→save) |
| Backend — endpoint `/tenders/{id}`              | ✅ Selesai — 2026-06-08                                                                                                                                  |
| Backend — endpoint status update                | ✅ Selesai — 2026-06-08                                                                                                                                  |
| Backend — endpoint input manual `POST /tenders` | ✅ Selesai — 2026-06-08                                                                                                                                  |
| Backend — endpoint `/scraper/log`               | ⚠️ Ada, data kosong (nunggu RF-T-012)                                                                                                                    |
| Backend — endpoint `/api/v1/proposals*`         | ✅ Selesai — 2026-06-10 (CRUD template, generate draft, get/edit block, export docx, timeline import/template)                                           |
| Database schema (Prisma)                        | ✅ `db push` ke server (100.112.188.84) sukses — 2026-06-10, sudah di-reconcile dgn tabel scraper-engine (lihat 1.0a)                                    |
| Docker compose — path fix                       | ✅ Fix — 2026-06-05                                                                                                                                      |
| Docker compose — Next.js service                | ❌ Belum                                                                                                                                                 |
| API Routes Next.js                              | ✅ Selesai — 2026-06-10 (`notifications`, `proxy-scraper`, `ai-proposal`, `tenders`, `tenders/[id]`)                                                     |
| Server Actions Next.js                          | ✅ Selesai — 2026-06-10 (`tenderActions`, `kbliActions`, `aiActions`/`matchKbli`; `generateProposal` ditunda ke TAHAP 6)                                 |
| `lib/prisma.js`                                 | ✅ Selesai — 2026-06-10 (singleton + driver adapter)                                                                                                     |
| UI — Layout dashboard + Sidebar                 | ✅ Selesai — 2026-06-10 (layout shell, Sidebar, Topbar, BellNotification)                                                                                |
| UI — Halaman Tenders                            | ✅ Selesai — 2026-06-10                                                                                                                  |
| UI — Halaman Detail Tender                      | ✅ Selesai — 2026-06-11                                                                                                                  |
| UI — Halaman KBLI                               | ✅ Selesai — 2026-06-11                                                                                                                  |
| UI — Proposal Generator                         | ❌ Belum (Masih 0% stub)                                                                                                |
| Auth / Login                                    | ✅ Minimal selesai — 2026-06-10 (login custom JWT, lihat 1.0)                                                                                            |
