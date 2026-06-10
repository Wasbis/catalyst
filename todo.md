# 📋 CATALYST — TODO LIST

> Diperbarui: 2026-06-10 | Audit aktual vs PRD v1.0
>
> **Legenda:** ✅ Selesai · ❌ Belum · ⚠️ Parsial/Placeholder
>
> **🚫 UPDATE SCOPE — 2026-06-08:** setelah crosscheck ke tim terkait, platform yang akan di-scrape **hanya CIVD & GeoDipa**. GEP dan LPSE **dikeluarkan dari scope** — kode placeholder/referensi keduanya sudah dihapus dari `scraper.py`, `main.py` (`valid_sources`/`_run_scraper_task`), `database.py` (komentar kolom `source`), dan `test_scrape.py`. Item GEP/LPSE di bawah dibiarkan tercatat (dicoret) sebagai jejak histori, bukan dihapus.

---

## 🎯 AGENDA KAMIS-JUMAT (11-12 Juni 2026)

> Lanjutan TAHAP 3 — Slice 1 (List View `/tenders`) sudah ✅ (lihat log 2026-06-10). Urutan prioritas mengikuti kolom "Priority" di `catalyst-board-full.xlsx` (High dulu, baru Medium/Low) dan kolom marking "Status (Catalyst)" yang baru ditambahkan ke file itu (✅/⚠️/❌ per ticket). Target realistis: ~52 dari 69 weight point ticket yang masih ⚠️/❌; sisanya (terutama TAHAP 6 frontend & polish dark mode/responsive) kemungkinan lanjut ke sesi berikutnya — lihat daftar di paling bawah.

### KAMIS (11 Juni) — Slice 2 (Detail Tender) + Slice 3 (Kanban)

**1. Shared UI primitives** _(prasyarat NotesPanel, ConvertToProjectModal, Kanban)_

- [ ] `ui/Modal.jsx`, toast/notification context (`ui/Toast.jsx`), `ui/ConfirmDialog.jsx` — board "Shared: Modal, Toast, ConfirmDialog, Pagination, EmptyState" (Pagination & EmptyState sudah ✅ dari Slice 1)

**2. TAHAP 3.3 — Halaman Detail `/tenders/[id]`** (board: High, weight 5 + 3)

- [ ] `tenders/[id]/page.jsx` — fetch via `getTenderById()` (Next 16: `await params`)
- [ ] `TenderDetailPanel.jsx` — judul, agency, sumber, `tenderText`/description, KBLI match + score (full list `kbliMatchedJson`, bukan cuma top-1 kayak di tabel)
- [ ] `NotesPanel.jsx` — tampilkan + tambah catatan (`addTenderNote`, MVP append-only — lihat catatan TAHAP 2.2)
- [ ] `StatusHistory.jsx` — riwayat perubahan status (cek dulu: cukup tampilkan `status` saat ini + `updatedAt`, atau perlu model riwayat baru?)
- [ ] `ConvertToProjectModal.jsx` — stub, muncul kalau status `MENANG` (RF-T-011 — App 2 belum ada, jadi modal placeholder dulu)

**3. TAHAP 3.2 — Kanban View `/tenders`** (board: High, weight 5 + 5, RF-T-009) -> kanban viewnya gue mau custom 

- [ ] Install `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] `KanbanBoard.jsx` + `KanbanColumn.jsx` + `KanbanCard.jsx` — 7 kolom sesuai `VALID_TENDER_STATUSES`
- [ ] Toggle List View / Kanban View di `/tenders` (search param `view=list|kanban`)
- [ ] Drag-and-drop antar kolom → `updateTenderStatus`
- [ ] Visual kartu Kanban reuse `ScoreBadge`/`StatusBadge` existing (board "Kanban Card & Score Visual Language")

### JUMAT (12 Juni) — Slice 4 (Input Manual) + TAHAP 4 (`/kbli`) + Housekeeping

**1. TAHAP 3.4 — Input Tender Manual** (board: Medium, weight 2; RF-T-014)

- [ ] `ManualInputModal.jsx` (pakai `Modal` dari Kamis)
- [ ] Server action `createManualTender` → proxy `POST /api/v1/tenders`

**2. TAHAP 4 — Halaman `/kbli`** (board: High, weight 3 + 5)

- [ ] `KbliTable.jsx` + `KbliForm.jsx` — CRUD via `kbliActions.js` (server action sudah ada)
- [ ] `PdfImportFlow.jsx` — upload PDF → `POST /api/v1/kbli/import-preview` → preview hasil parse → user review/edit → commit via server action Prisma

**3. `/scraper/log` — Riwayat Scraping** (board: Medium, weight 2; RF-T-012/013 sisi FE)

- [ ] Server action baru: query `ScrapingJob` (Prisma)
- [ ] Render tabel run per platform (status, durasi, tenders_found/new/updated, error_message)
- [ ] Banner kegagalan kalau `last_error`/`consecutive_failures` ada (RF-T-013 sisi FE)

**4. Housekeeping** (dari section "🧹 HOUSEKEEPING" di atas)

- [ ] Hapus `sampleproposal.docx` (root, ~12MB) & `catalyst-scout/src/app/api/tmp-verify-2-2/route.js`
- [ ] Tambahkan `storage/` ke `.gitignore`
- [ ] Putuskan lokasi `catalyst-board-full.xlsx` (root → simpan di tempat lain atau keluarkan dari git)
- [ ] PATCH mark-as-read `/api/notifications` (polish RF-T-008/013)

**Stretch (kalau waktu Jumat sore masih ada)**

- [ ] `/settings` — skeleton + form "Tambah User" admin-only (TAHAP 1.0 pending item)
- [ ] RBAC enforcement per-role di `proxy.js`
- [ ] Sidebar collapse state (board "Layout Grid & Spacing")

### Kemungkinan lanjut ke sesi berikutnya (di luar 2 hari ini)

- TAHAP 6 Frontend — Proposal Generator (scope besar: templates CRUD UI, form generate, blok editable, export, import timeline; backend sudah siap)
- Dark mode toggle & audit responsive penuh
- `CIVD_ANNOUNCEMENT_TYPES` konfirmasi type=2/3
- Audit politeness delay scraping (PRD Gap)

---

## 🗺️ STATUS PLATFORM SCRAPER

| Platform                | PRD       | Implementasi                                                                                | Status                       |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| **GeoDipa**             | Sekunder  | `scrape_geodipa` + detail page + parser `source_metadata` selaras CIVD + filter `only_open` | ✅ Selesai — 2026-06-08      |
| **CIVD SKK Migas**      | Utama     | `scrape_civd`, AJAX pagination, 3 tipe                                                      | ✅ Selesai — 2026-06-04      |
| ~~**GEP (Smart GEP)**~~ | ~~—~~     | ~~Placeholder kosong, return `[]`~~ — kode placeholder sudah dihapus 2026-06-08             | 🚫 Out of scope (2026-06-08) |
| ~~**LPSE**~~            | ~~Utama~~ | ~~Tidak ada sama sekali~~                                                                   | 🚫 Out of scope (2026-06-08) |
| **Input Manual**        | Pelengkap | Endpoint `POST /api/v1/tenders` ✅ — 2026-06-08; UI form (TAHAP 3.4) masih belum            | ⚠️ Backend selesai, UI belum |

---

## 🧹 HOUSEKEEPING — temuan crosscheck 2026-06-10

> Working tree ada banyak perubahan TAHAP 6 (backend Proposal Generator) yang sudah jalan tapi belum sempat tercatat — sudah ditulis ulang di TAHAP 6 di bawah. Selain itu ada beberapa file nyasar/leftover yang perlu dibereskan sebelum commit:

- [ ] Hapus `sampleproposal.docx` (root, ~12MB) — hasil test export `GET /api/v1/proposals/{id}/export`, jangan dicommit
- [ ] Cek `catalyst-board-full.xlsx` (root, ~16KB) — isinya kanban/ticket board export, gak relevan ke kode; putuskan disimpan di lokasi lain atau dihapus
- [ ] Tambahkan `storage/` ke `.gitignore` — `storage/proposal_templates/` berisi 3 file `.docx` template asli (~19MB total), ini storage runtime/upload (sesuai konvensi folder structure di CLAUDE.md), bukan source code
- [ ] Hapus `catalyst-scout/src/app/api/tmp-verify-2-2/route.js` — endpoint debug sisa testing TAHAP 2.2 (query `tenderResult` buat verifikasi Prisma), sudah gak diperlukan

---

## ⚡ APP 1 — TENDER PLATFORM

---

### 🔴 TAHAP 1 — Fondasi

#### 1.0a Koneksi Database (.env) & Reconciliation Schema Prisma _(2026-06-10)_

> **Temuan**: `catalyst-scout/.env` sempat ke-set ke `localhost` (DB lokal kosong, sisa testing Sesi 1), padahal DB yang dipakai bareng (shared, isinya data scraping real dari scraper-engine) ada di server Tailscale `100.112.188.84` — lihat `guideline.md` bagian C.

- [x] Fix `DATABASE_URL` di `.env` → arahkan ke server Tailscale (`100.112.188.84`), bukan `localhost` ✅ — 2026-06-10
- [x] **Reconciliation `schema.prisma` vs tabel real scraper-engine (SQLAlchemy)** — `TenderResult`/`ProposalTemplate`/`ProposalDraft`/`ProposalBlock` (PascalCase) di Prisma **belum pernah di-push** & beda struktur total dari tabel snake_case yang sudah berisi data asli (`tender_results` 236 baris, `scraping_jobs` 5 baris, `proposal_templates` 2 baris, `proposal_drafts`, `proposal_blocks`). `prisma db push` polos akan **DROP 3 tabel berisi data** — dibatalkan, schema direvisi dulu ✅ — 2026-06-10:
  - `TenderResult` direwrite total mengikuti kolom real (`kbliCodesJson`, `matchScore`, `recommendation`, `status` DITEMUKAN/DITINJAU/DIKEJAR/DISERAHKAN/MENANG/KALAH/BATAL, `convertedToProject`, `projectId`, `scrapingJobId`, dll) + `@@map("tender_results")`
  - Model baru `ScrapingJob` (`@@map("scraping_jobs")`) — sebelumnya gak ada modelnya di Prisma sama sekali
  - `ProposalTemplate`/`ProposalDraft`/`ProposalBlock` direwrite + `@@map` ke `proposal_templates`/`proposal_drafts`/`proposal_blocks`. `ProposalDraft` sekarang relasi ke `TenderResult` (via `tenderResultId`/`tender_result_id`), **bukan** ke `Tender` (kolom itu gak pernah ada di tabel real)
  - `Tender.proposalDraft` (relasi 1:1 lama ke ProposalDraft) dihapus — gak valid lagi
- [x] `prisma db push` ke server berhasil **tanpa data loss** — 236 `tender_results` + 5 `scraping_jobs` + 2 `proposal_templates` aman, plus tabel baru dibuat: `User`, `Tender`, `TenderTask`, `KnowledgeBase`, `ScraperSetting` ✅ — 2026-06-10
- [x] `prisma generate` ulang setelah schema berubah ✅ — 2026-06-10

> **Catatan untuk Sesi 3 (Koneksi backend)**: `prisma.tenderResult.findMany()` sekarang baca 236 data scrape asli dari `tender_results` dengan field camelCase (`matchScore`, `kbliCodesJson`, `status`, dll — sesuai konvensi `@map` di CLAUDE.md). Model `Tender` (lead yang dipromote) masih tabel **kosong/baru** — alur "Promote ke Lead" (TAHAP 3.1) perlu mengisi `Tender` dari `TenderResult` terpilih.

#### 1.0 Auth & User Management _(ditambahkan 2026-06-10 — digeser maju dari TAHAP A karena semua halaman App 1 butuh konsep "current user")_

> **Keputusan desain (2026-06-10)**: UI pakai raw Tailwind + komponen internal `src/components/ui/` (bukan shadcn/library lain). Auth custom lightweight (bcryptjs + jose JWT di httpOnly cookie + `proxy.js`), bukan Auth.js — registrasi user baru cuma lewat admin (bukan self-register publik). RBAC (`role`: admin/engineer/manager) **disimpan tapi belum di-enforce** — login gate dulu, pembatasan akses per-role nanti. `/management` route (gak relevan App 1) sudah dihapus.

- [x] Tambah `passwordHash` ke model `User` (`prisma/schema.prisma`) + `prisma db push` ✅ — 2026-06-10
- [x] Fix mismatch versi Prisma (`prisma` CLI `^6.19.3` → `^7.8.0` biar match `@prisma/client`) ✅ — 2026-06-10
- [x] `src/lib/prisma.js` — Prisma Client singleton ✅ — 2026-06-10 (lihat catatan breaking change Prisma 7 di bawah)
- [x] `src/lib/auth.js` — `hashPassword`/`verifyPassword` (bcryptjs), `createSessionToken`/`verifySessionToken` (jose JWT), session cookie helpers (`setSessionCookie`/`clearSessionCookie`/`getCurrentUser`) ✅ — 2026-06-10
- [x] `src/proxy.js` — proteksi route: redirect ke `/login` kalau belum login, redirect ke `/tenders` kalau sudah login & buka `/login` ✅ — 2026-06-10 (lihat catatan breaking change Next 16 di bawah)
- [x] `prisma/seed.js` — seed 1 admin awal (`admin@catalyst.local` / `ChangeMe123!`, **ganti setelah login pertama**), wired via `prisma.config.ts` (`migrations.seed`) ✅ — 2026-06-10
- [x] Halaman `/login` (`src/app/login/page.jsx`) + `LoginForm` client component (`useActionState`) + `src/actions/authActions.js` (`loginAction`/`logoutAction`) ✅ — 2026-06-10, sudah ditest end-to-end (redirect logged-out, login sukses, login gagal, redirect logged-in dari `/login`)
- [ ] Halaman "Tambah User" (admin-only, di `/settings`) — pengganti register publik, dikerjakan di sesi layout (1.1/Settings)
- [ ] RBAC enforcement per-role — ditunda, `role` sudah tersimpan di JWT session & DB

> **⚠️ Breaking changes ditemukan (training-data Claude sudah outdated untuk versi ini, dicatat biar gak keulang di sesi depan):**
>
> - **Prisma 7**: `datasource db { url = env(...) }` di `schema.prisma` **gak didukung lagi** — connection URL cuma di `prisma.config.ts` (`datasource.url`). `PrismaClient` butuh **driver adapter** (`@prisma/adapter-pg` + `pg`), gak bisa `new PrismaClient()` polos lagi: `new PrismaClient({ adapter: new PrismaPg({ connectionString: ... }) })`.
> - **Next.js 16**: `middleware.js` **di-rename jadi `proxy.js`** (function export `proxy`, bukan `middleware`). Proxy sekarang default Node.js runtime (bukan Edge lagi).
> - Prisma VSCode extension sempat kasih diagnostic error palsu ("Argument `url` is missing") setelah `url` dihapus dari datasource — itu extension-nya yang belum update ke v7, CLI (`prisma db push`) sudah confirm valid. Abaikan diagnostic itu kalau muncul lagi.

#### 1.1 Setup Layout & Navigasi Dashboard

- [x] Buat `catalyst-scout/src/app/(dashboard)/layout.jsx` — shell dashboard dengan Sidebar + Topbar ✅ — 2026-06-10
- [x] Buat komponen `Sidebar` dengan navigasi ke: Tenders, KBLI, Scraper Log, Settings ✅ — 2026-06-10 (`src/components/layout/Sidebar.jsx`, active-link highlight via `usePathname`; placeholder `(dashboard)/scraper/log/page.jsx` ditambahkan biar link gak 404)
- [x] Update `metadata` di `layout.js` — ganti judul dari "Create Next App" ke "Catalyst — Cliste" ✅ — 2026-06-10
- [x] Buat halaman root `/` yang redirect langsung ke `/tenders` ✅ — 2026-06-10
- [x] **Tambahan (selaras tiket board "Sidebar+Topbar+BellNotification")**: `Topbar` (`src/components/layout/Topbar.jsx`, judul halaman aktif + info user + tombol logout) dan `BellNotification` (`src/components/layout/BellNotification.jsx`, polling 30 detik saat tab aktif, dropdown notif, klik di luar buat nutup) ✅ — 2026-06-10. Di-backing oleh `GET /api/notifications` (baru, sebelumnya 0 byte) — return `{ notifications, unreadCount }` dari tabel `Notification` (punya user aktif + notif global `userId=null`). **PATCH mark-as-read belum** — itu bagian RF-T-008/013 (Section 5), dikerjakan terpisah.
- [x] Section 3 board (Brand Identity) ✅ — 2026-06-10: design system baru di `globals.css` — primary navy `#003478` (logo Cliste), accent violet `#7C3AED`, layout terang (sidebar navy gelap + konten utama putih/`#F8FAFC`, card `rounded-xl` + `shadow-sm`), font `Inter` (ganti Geist). Token: `background/surface/surface-hover/border`, `foreground/foreground-muted/foreground-subtle`, `sidebar/sidebar-hover/sidebar-border/sidebar-foreground(-muted)`, `score-high/mid/low`, `stage-*` (pipeline), `danger/success/warning`. Reskin: `Button/Card/Input/Label`, `Sidebar` (brand mark "C", active nav = pill accent), `Topbar`, `BellNotification`, `(dashboard)/layout.jsx`, halaman `/login` + `LoginForm`

#### 1.2 Fix Docker & Konfigurasi

- [x] Fix typo di `docker-compose.yml`: context scraper ✅ — 2026-06-05 (`./scraper-engine` sudah benar)
- [ ] Tambahkan service `catalyst-scout` (Next.js) ke `docker-compose.yml`

---

### 🟠 TAHAP 2 — Koneksi Frontend ↔ Backend

#### 2.1 API Routes Next.js

- [x] `api/proxy-scraper/route.js` ✅ — 2026-06-10: `POST` proxy ke `POST /api/v1/scrape` (trigger scrape, dipakai tombol "Trigger Scrape" TAHAP 3.1), `GET` proxy ke `GET /api/v1/scrape/status` (polling status realtime)
- [x] `api/ai-proposal/route.js` ✅ — 2026-06-10: `POST` proxy minimal ke `POST /api/v1/proposals` (generate draft+blocks dari `tender_result_id`+`template_id`) — operasi proposal lain (templates CRUD, get draft, edit block, export, timeline) menyusul saat TAHAP 6 frontend digarap
- [x] `api/tenders/route.js` ✅ — 2026-06-10: `GET` list tender (filter source/status/minScore/keyword + pagination), reuse `getTenders()` dari `tenderActions.js` — buat client-side fetch/polling di TAHAP 3.1
- [x] `api/tenders/[id]/route.js` ✅ — 2026-06-10: `GET` detail tender by id, reuse `getTenderById()` — buat TAHAP 3.3
- Catatan: keempatnya pakai guard `getCurrentUser()` (401 kalau belum login, sesuai pola `api/notifications`); ditambahkan helper `lib/serialize.js` (`toJSONSafe`) buat handle `BigInt` (`budgetEstimated`) di response JSON, dan `scraperFetch` (`lib/scraperApi.js`) sekarang attach `error.status` dari response Python biar proxy bisa forward status code asli (409/422/404/dst)

#### 2.2 Server Actions

- [x] Isi `actions/tenderActions.js` ✅ — 2026-06-10
  - `getTenders` (filter source/status/minScore/keyword + pagination), `getTenderById`, `promoteTender`, `updateTenderStatus` (validasi `VALID_TENDER_STATUSES` selaras Python, lalu `PUT /api/v1/tenders/{id}/status`), `addTenderNote`
  - **Catatan `addTenderNote`**: schema belum punya model `Note`/`TenderNote` (cuma `TenderResult.notes: String?`), jadi diimplementasi sebagai MVP append-only (prepend entry `[timestamp] nama: isi` ke field `notes` lewat Prisma). Model `TenderNote` proper (multi-note, author+timestamp terstruktur) jadi prasyarat TAHAP 3.3 (Panel Catatan)
- [x] Isi `actions/kbliActions.js` ✅ — 2026-06-10
  - `getKbliList(search)`, `createKbli`, `updateKbli`, `toggleKbli`, `deleteKbli` (mutasi `MasterKbli` lewat Prisma, selaras 5.3)
- [x] Isi `actions/aiActions.js` ✅ — 2026-06-10 (scope: `matchKbli(tenderText)` proxy ke `POST /api/v1/match-kbli`, `kbli_list: []` → fallback ke `MasterKbli` DB. `generateProposal`/`getProposalStatus` **belum** — dipindah jadi item TAHAP 6, lihat catatan di sana)
- [x] Tambah `SCRAPER_API_URL=http://localhost:8000` ke `.env` + helper `src/lib/scraperApi.js` (`scraperFetch`, fetch wrapper + error handling utk hit Python API dari server actions) ✅ — 2026-06-10

#### 2.3 Prisma / Database

- [x] Isi `src/lib/prisma.js` ✅ — 2026-06-10 (lihat 1.0)
- [x] Jalankan `prisma db push` ke server ✅ — 2026-06-10 (lihat 1.0a — termasuk reconciliation schema vs tabel scraper-engine)
- [x] Buat seed data `MasterKbli` ✅ — 2026-06-10: 38 kode KBLI hasil ekstraksi `nibcri.pdf` (lihat "Matching & KBLI di sisi Python") di-embed ke `prisma/seed.js`, insert via `createMany({ skipDuplicates: true })`. Fix kecil: deskripsi `62029` dilengkapi jadi "...Komputer Lainnya" (sebelumnya terpotong di hasil parsing PDF)
- [x] Buat seed data `DataMasking` ✅ — 2026-06-10: starter generic 6 entry — category `client`: "GeoDipa"/"PT Geo Dipa Energi"→`[CLIENT_GEODIPA]`, "SKK Migas"→`[CLIENT_SKKMIGAS]`, "CIVD"→`[PLATFORM_CIVD]`; category `internal_name`: "PT Cliste Rekayasa Indonesia" + varian→`[COMPANY]`. Builtin regex (EMAIL/PHONE/CURRENCY/ACCOUNT) di `MaskingService` udah otomatis cover PII generik, gak perlu di-seed. Tambah/edit entry lain via DB langsung dulu (UI Settings utk DataMasking belum ada)

---

### 🟡 TAHAP 3 — Halaman Tenders

#### 3.1 Halaman List `/tenders`

- [x] Tabel tender: source, title, agency, KBLI, score, deadline, status ✅ — 2026-06-10, `TenderTable.jsx`
- [x] Filter bar: by source, status, skor minimum, keyword ✅ — 2026-06-10, `FilterBar.jsx` (URL search params)
- [x] Badge skor: 🟢 ≥70 · 🟡 40-69 · 🔴 <40 ✅ — 2026-06-10, `ScoreBadge.jsx` (token `score-high/mid/low`)
- [x] Tombol "Trigger Scrape" → call proxy-scraper API ✅ — 2026-06-10, `ScrapeStatusBar.jsx`
- [x] Status bar scraper real-time (polling) ✅ — 2026-06-10, `ScrapeStatusBar.jsx` (polling 5 detik)
- [x] Tombol "Promote ke Lead" ✅ — 2026-06-10, `PromoteButton.jsx`

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
- [ ] Tambah/edit/nonaktifkan KBLI dari UI — via server action Prisma (lihat keputusan arsitektur di 5.3: mutasi `MasterKbli` di Next.js, bukan Python)
- [ ] Upload PDF (NIB/`crikbli.pdf`) → kirim ke `POST /api/v1/kbli/import-preview` (Python, parsing only) → tampilkan preview hasil parse → user review/edit → simpan via server action Prisma (alur 2 tahap: parse lalu commit, supaya user bisa koreksi hasil parsing PDF yang formatnya bisa beda-beda)

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
| UI — Halaman Tenders                            | ❌ Placeholder                                                                                                                                           |
| UI — Halaman Detail Tender                      | ❌ File tidak ada                                                                                                                                        |
| UI — Halaman KBLI                               | ❌ Placeholder                                                                                                                                           |
| UI — Proposal Generator                         | ❌ Placeholder (backend `/api/v1/proposals*` sudah siap dipakai — 2026-06-10)                                                                            |
| Auth / Login                                    | ✅ Minimal selesai — 2026-06-10 (login custom JWT, lihat 1.0)                                                                                            |
