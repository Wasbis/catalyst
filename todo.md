# 📋 CATALYST — TODO LIST

> Diperbarui: 2026-06-05 | Audit aktual vs PRD v1.0
>
> **Legenda:** ✅ Selesai · ❌ Belum · ⚠️ Parsial/Placeholder
>
> **🚫 UPDATE SCOPE — 2026-06-08:** setelah crosscheck ke tim terkait, platform yang akan di-scrape **hanya CIVD & GeoDipa**. GEP dan LPSE **dikeluarkan dari scope** — kode placeholder/referensi keduanya sudah dihapus dari `scraper.py`, `main.py` (`valid_sources`/`_run_scraper_task`), `database.py` (komentar kolom `source`), dan `test_scrape.py`. Item GEP/LPSE di bawah dibiarkan tercatat (dicoret) sebagai jejak histori, bukan dihapus.

---

## 🎯 AGENDA BESOK — 2026-06-09

> **Strategi baru:** kelarkan dulu sistem scraper (backend Python) dari A–Z — semua platform, semua endpoint pendukung, matching, scheduler — biar fitur scraping benar-benar solid & lengkap. Next.js/frontend baru disentuh setelah backend stabil, supaya pas integrasi gak bolak-balik nambal API.

### 1. Lengkapi semua scraper platform

- [x] ~~LPSE _(PRD: prioritas utama, belum ada sama sekali)_ — crosscheck struktur scraping & data dulu (listing-only kayak CIVD, atau ada detail page kayak GeoDipa?), baru implementasi `lpse_scraper.py`, daftarkan ke `valid_sources`/`_run_scraper_task`~~ → **OUT OF SCOPE — 2026-06-08**, tim konfirmasi cuma CIVD & GeoDipa yang di-scrape
- [x] ~~GEP — saat ini placeholder kosong (`return []`), lanjutkan implementasi~~ → **OUT OF SCOPE — 2026-06-08**, placeholder `scrape_gep`/`run_all_scrapers` sudah dihapus dari `scraper.py`
- [x] Input Manual — endpoint `POST /api/v1/tenders` buat input tender non-scraping ✅ — 2026-06-08 ([main.py](scraper-engine/api/main.py)), scope tetap fokus tender (lihat diskusi: project di luar tender masuk App 2, bukan di-merge ke endpoint ini)

### 2. Endpoint pendukung tender (lihat 5.3)

- [x] `GET /api/v1/tenders/{id}` — detail satu tender ✅ — 2026-06-08
- [x] `PUT /api/v1/tenders/{id}/status` — update status tender ✅ — 2026-06-08 (validasi `VALID_TENDER_STATUSES`: DITEMUKAN→DITINJAU→DIKEJAR→DISERAHKAN→MENANG/KALAH/BATAL)
- [x] `GET /api/v1/scraper/log` — riwayat run per platform ⚠️ — 2026-06-08 endpoint jalan, tapi return kosong karena tabel `scraping_jobs` belum pernah diisi (lihat item RF-T-012 di bawah, masih perlu di-wire)

### 3. Matching & KBLI di sisi Python

- [x] Cek implementasi `POST /api/v1/match-kbli` — **DONE 2026-06-08**: sudah jalan penuh (semantic AI matching, bukan placeholder), lihat detail & bug fix `description` di item 5.3 ([todo.md:173](todo.md#L173)). Crosscheck end-to-end via `testing/test_match_kbli.py` (4/4 skenario match sesuai ekspektasi, score 0.65–0.98)
- [x] `POST /api/v1/kbli/import-preview` — parsing PDF (NIB/`crikbli.pdf`) → JSON preview (belum nulis ke DB) — **DONE 2026-06-08**: endpoint lama `/api/v1/extract-pdf` di-rename jadi `/api/v1/kbli/import-preview` (sudah sesuai fungsinya: parse-only, belum nulis ke DB). `pdf_extractor.py` ditulis ulang pakai parsing berbasis struktur tabel (`page.find_tables()`/`table.extract()`) — pendekatan lama (regex per baris dari `extract_text()`) menghasilkan deskripsi acak karena kolom "Judul KBLI" & "Lokasi Usaha" ke-interleave di teks linear. Diverifikasi dengan `nibcri.pdf`: 38/38 kode KBLI unik berhasil diekstrak dengan deskripsi benar (1 dari 38 terpotong sedikit — "Aktivitas Konsultasi Komputer dan Manajemen Fasilitas [Komputer Lainnya]" — karena sel tabel itu kebetulan terpotong tepat di batas halaman PDF dan teksnya tercampur dengan kolom lain; edge case langka, masih lebih baik daripada hasil sebelumnya yang 0% akurat). Helper `dump_extraction_to_json()` ditambahkan untuk crosscheck manual + script `testing/test_pdf_extractor.py`.

### 4. Otomatisasi & notifikasi backend

- [x] **Logging job scraping lengkap (RF-T-012)** — **DONE 2026-06-08**: `_run_scraper_task` di [main.py:825](scraper-engine/api/main.py#L825) di-refactor jadi loop per-platform (geodipa/civd dipisah biar log & status independen) — tiap platform sekarang buka baris `ScrapingJob` (status=running) di awal, lalu ditutup dengan statistik final (`tenders_found/new/updated`, `error_message`, `consecutive_failures`) + relasi `scraping_job_id` di tiap `TenderResult` yang disimpan. `GET /api/v1/scraper/log` sekarang akan terisi data nyata setelah scraper jalan.
- [x] **Notifikasi kegagalan scraper (RF-T-013)** — **DONE 2026-06-08**: `_notify_on_scraper_failure()` ([main.py:771](scraper-engine/api/main.py#L771)) — kirim `Notification` begitu `consecutive_failures` sebuah platform PERSIS mencapai 2 (bukan `>=`, biar cuma sekali per rentetan kegagalan sampai akhirnya sukses lagi & counter reset). Ditambahkan model SQLAlchemy `Notification` ([database.py](scraper-engine/api/models/database.py)) yang map ke tabel Prisma `Notification` (camelCase via alias kolom).
- [x] **Retry otomatis (NFR 2.6)** — **DONE 2026-06-08**: sebelumnya scraper TIDAK ada retry (gagal langsung `return None`). Ditambahkan helper `request_with_retry()` di [scraper.py](scraper-engine/api/services/scraper.py) — retry max 3x dengan backoff, hanya untuk error transient (timeout/network/5xx; 4xx langsung di-raise tanpa retry karena percuma diulang). Dipasang di semua titik fetch produksi: `_init_session`, `_fetch_page`, `download_file` (CIVD) dan `_fetch_page` (POST), `fetch_detail` (GeoDipa) + `fetch_html_async` (base `CatalystScraper`).
- [x] **Change detection (RF-T-005)** — **DONE 2026-06-08**: dulu fingerprint match → langsung `skip`. Sekarang ada `_apply_tender_changes()` ([main.py:90](scraper-engine/api/main.py#L90)) yang membandingkan `budget_estimated`/`deadline_text`/`deadline_date`/`source_metadata_json` (mencakup status platform spesifik mis. `geodipa_status` "Terbuka"→"Ditutup") antara record existing vs hasil scrape terbaru — kalau beda, di-update & dihitung sebagai `tenders_updated` (bukan cuma `skipped_duplicate_fingerprint`).
- [x] Notifikasi tender skor tinggi (RF-T-008) — **DONE 2026-06-08** (kode siap, tapi lihat catatan ⚠️ di bawah): `_notify_on_high_score_tender()` ([main.py:715](scraper-engine/api/main.py#L715)) trigger `Notification` begitu tender baru tersimpan dengan `match_score >= 70`, dipanggil tepat setelah commit per-item di `_run_scraper_task`.
  - ⚠️ **GAP DITEMUKAN**: `match_score` saat ini **selalu `None`** — `civd_scraper.py`/`geodipa_scraper.py` cuma nulis placeholder `"match_score": None  # diisi setelah matching`, dan TIDAK ADA kode manapun yang benar-benar memanggil `semantic_kbli_match()` untuk mengisi `match_score`/`recommendation` sebelum/saat disimpan ke DB (RF-T-006/RF-T-007 belum di-wire ke pipeline scrape→save — beda dari endpoint `match-kbli` yang sudah jalan tapi terpisah/manual). Jadi notifikasi RF-T-008 ini **siap pakai tapi belum akan pernah terpicu** sampai scoring itu diintegrasikan ke alur simpan tender. Perlu ditindaklanjuti: panggil `semantic_kbli_match` per-item (against `MasterKbli`) di `_run_scraper_task` sebelum `db.add(TenderResult(...))`, isi `match_score`+`recommendation`+`kbli_matched_json`.
- [x] Scheduler otomatis (RF-T-001) — **DONE 2026-06-08** _(LPSE dicoret dari scope — 2026-06-08)_: in-process asyncio loop `_scheduler_loop()` ([main.py:172](scraper-engine/api/main.py#L172)), dijalankan via `asyncio.create_task()` di startup event. Cek tiap 15 menit apakah GeoDipa (interval 24 jam) atau CIVD (interval 12 jam) sudah "jatuh tempo" — acuan waktu diambil dari `started_at` run terakhir di tabel `scraping_jobs` (bukan in-memory, jadi tetap akurat lintas restart server), lalu trigger `_run_scraper_task(..., trigger="scheduled")`. Sengaja gak pakai APScheduler/cron eksternal biar gak nambah dependency — cukup untuk single-instance deployment saat ini.

### 5. Setelah backend scraper solid → baru lanjut Next.js

- [ ] Fondasi frontend: `lib/prisma.js`, `prisma db push`, isi server actions, layout dashboard
- [ ] Halaman Tenders & KBLI (list, filter, detail, import PDF flow)
- [ ] Proposal generator (Tahap 6 — prasyarat Tahap 1-4 stabil dulu)

---

## 🗺️ STATUS PLATFORM SCRAPER

| Platform            | PRD       | Implementasi                                                                                | Status                  |
| ------------------- | --------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| **GeoDipa**         | Sekunder  | `scrape_geodipa` + detail page + parser `source_metadata` selaras CIVD + filter `only_open` | ✅ Selesai — 2026-06-08 |
| **CIVD SKK Migas**  | Utama     | `scrape_civd`, AJAX pagination, 3 tipe                                                      | ✅ Selesai — 2026-06-04 |
| ~~**GEP (Smart GEP)**~~ | ~~—~~ | ~~Placeholder kosong, return `[]`~~ — kode placeholder sudah dihapus 2026-06-08 | 🚫 Out of scope (2026-06-08) |
| ~~**LPSE**~~        | ~~Utama~~ | ~~Tidak ada sama sekali~~                                                                   | 🚫 Out of scope (2026-06-08) |
| **Input Manual**    | Pelengkap | Endpoint `POST /api/v1/tenders` ✅ — 2026-06-08; UI form (TAHAP 3.4) masih belum            | ⚠️ Backend selesai, UI belum |

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
- [ ] CRUD `MasterKbli` (create/update/delete) — **Next.js**: isi `actions/kbliActions.js` (`createKbli`, `updateKbli`, `deleteKbli`, selain `getKbliList` yang sudah direncanakan), pakai Prisma client. `GET` list tetap konsumsi `/api/v1/kbli` Python (sudah ada & dipakai juga oleh matcher internal)

#### 5.4 Notifikasi Tender Skor Tinggi _(PRD RF-T-008)_

- [x] Trigger notifikasi saat tender baru skor ≥70 — **DONE 2026-06-08** (kode), tapi ⚠️ belum pernah terpicu krn `match_score` selalu `None` — lihat catatan GAP di bagian "Otomatisasi & notifikasi backend"
- [x] Simpan ke tabel `Notification` (sudah ada di schema) — **DONE 2026-06-08**: model SQLAlchemy `Notification` ditambahkan di `database.py`, dipakai juga oleh RF-T-013
- [ ] Kirim ke frontend via polling atau WebSocket — _(belum, nunggu giliran Next.js — TAHAP 1-4 dulu)_

---

### 🟢 TAHAP 6 — Proposal Generator _(PRD Phase 2)_

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

| Tanggal    | Yang Dikerjakan                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-06 | Inisialisasi monorepo Catalyst                                                                                                                                                                                                                                                                                |
| 2026-05-08 | Merge catalyst-scout ke dalam monorepo                                                                                                                                                                                                                                                                        |
| 2026-06-04 | Prisma schema lengkap — semua model (User, Tender, TenderResult, KBLI, Notification, Proposal, dll)                                                                                                                                                                                                           |
| 2026-06-04 | GeoDipa scraper (`scrape_geodipa` + detail page)                                                                                                                                                                                                                                                              |
| 2026-06-04 | CIVD scraper (`scrape_civd`, AJAX pagination, 3 tipe announcement)                                                                                                                                                                                                                                            |
| 2026-06-04 | AI Matcher (`ai_matcher.py`)                                                                                                                                                                                                                                                                                  |
| 2026-06-04 | Masking Service (`masking_services.py`) — 215 baris, lengkap                                                                                                                                                                                                                                                  |
| 2026-06-04 | PDF Extractor (`pdf_extractor.py`)                                                                                                                                                                                                                                                                            |
| 2026-06-04 | AI Proposal Agent logic (`ai_proposal_agent.py`)                                                                                                                                                                                                                                                              |
| 2026-06-04 | Database model (`database.py` — SQLAlchemy + TenderResult)                                                                                                                                                                                                                                                    |
| 2026-06-04 | Struktur file frontend dibuat (pages, actions, routes) — **tapi semua masih kosong**                                                                                                                                                                                                                          |
| 2026-06-05 | Fix typo `docker-compose.yml`: `./scrapper-engine` → `./scraper-engine`                                                                                                                                                                                                                                       |
| 2026-06-05 | Test scraping (`test_scrape.py`, `test_save_db.py`)                                                                                                                                                                                                                                                           |
| 2026-06-05 | Export CIVD (`export_civd.py`)                                                                                                                                                                                                                                                                                |
| 2026-06-08 | GeoDipa parser refinement: `source_metadata` (golongan_usaha/bidang_usaha/jenis_pengadaan/jadwal/informasi_umum) diselaraskan dgn CIVD biar FE bisa render generic; tambah filter `only_open` (skip tender "Ditutup" sebelum fetch detail); fix `description`/`doc_files` shape & dedup fingerprint jadi O(1) |
| 2026-06-08 | Diskusi & keputusan arsitektur: pembagian endpoint Python vs Next.js untuk LPSE, detail tender, KBLI CRUD, & alur import KBLI dari PDF (parse di Python → preview → commit via Prisma)                                                                                                                        |
| 2026-06-08 | **Scope berubah**: crosscheck ke tim → platform yang di-scrape final cuma **CIVD & GeoDipa** (LPSE & GEP keluar dari scope). Bersihkan kode placeholder/referensi GEP-LPSE: hapus `scrape_gep`+`run_all_scrapers` dari `scraper.py`, hapus cabang `gep` dari `valid_sources`/`_run_scraper_task` di `main.py`, update komentar kolom `source` di `database.py`, bersihkan `test_scrape.py` |
| 2026-06-08 | **Endpoint pendukung tender selesai**: `POST /api/v1/tenders` (input manual, scope tetap fokus tender — bukan project), `GET /api/v1/tenders/{id}` (detail + `tender_text` lengkap), `PUT /api/v1/tenders/{id}/status` (validasi `VALID_TENDER_STATUSES`), `GET /api/v1/scraper/log` (baca dari `scraping_jobs`, masih kosong sampai RF-T-012 di-wire). Sekalian fix bug routing: `/tenders/{id}` sempat "menelan" `/tenders/export` karena didaftarkan duluan — dipindah ke setelah path statis |
| 2026-06-08 | **`POST /api/v1/kbli/import-preview`** (rename dari `/extract-pdf`) — `pdf_extractor.py` ditulis ulang pakai cell-based table parsing (`find_tables`/`table.extract`), 38/38 KBLI unik dari `nibcri.pdf` ter-ekstrak benar. **Bug fix `match-kbli`**: `semantic_kbli_match()` di `ai_matcher.py` ketinggalan field `description` di return value — selalu kosong di response, sekarang sudah ditambahkan & diverifikasi end-to-end via `testing/test_match_kbli.py` |
| 2026-06-08 | **Otomatisasi & notifikasi backend (RF-T-001/005/008/012/013, NFR 2.6) — semua selesai**: `_run_scraper_task` di-refactor jadi loop per-platform dengan logging penuh ke `scraping_jobs` (RF-T-012); retry otomatis max 3x via `request_with_retry()` di semua titik fetch produksi CIVD/GeoDipa (NFR 2.6); change detection update-on-change untuk budget/deadline/status platform (RF-T-005); notifikasi kegagalan scraper 2x berturut-turut (RF-T-013) & skor tinggi ≥70 (RF-T-008) — keduanya nulis ke model `Notification` baru yang di-map ke tabel Prisma; scheduler in-process asyncio (GeoDipa 24 jam, CIVD 12 jam) berbasis `started_at` terakhir di `scraping_jobs` (RF-T-001). **Catatan**: notifikasi skor tinggi belum akan terpicu di lapangan karena `match_score` masih selalu `None` — AI scoring (RF-T-006/007) belum di-wire ke pipeline scrape→save, lihat catatan GAP di bagian terkait |

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

| Komponen                           | Status                                   |
| ---------------------------------- | ---------------------------------------- |
| Backend — GeoDipa scraper          | ✅ Selesai — 2026-06-04                  |
| Backend — CIVD scraper             | ✅ Selesai — 2026-06-04                  |
| ~~Backend — GEP scraper~~           | 🚫 Out of scope (2026-06-08), kode dihapus |
| ~~Backend — LPSE scraper~~          | 🚫 Out of scope (2026-06-08)             |
| Backend — AI matcher               | ✅ Selesai — 2026-06-04                  |
| Backend — Masking service          | ✅ Selesai — 2026-06-04                  |
| Backend — AI Proposal agent        | ✅ Logic ada — 2026-06-04                |
| Backend — `docx_generator.py`      | ❌ 0 byte                                |
| Backend — Scheduler otomatis (RF-T-001) | ✅ Selesai — 2026-06-08 (asyncio loop, GeoDipa 24j/CIVD 12j) |
| Backend — Logging job scraping (RF-T-012) | ✅ Selesai — 2026-06-08 (`ScrapingJob` ter-wire penuh) |
| Backend — Retry otomatis (NFR 2.6) | ✅ Selesai — 2026-06-08 (`request_with_retry`, max 3x) |
| Backend — Change detection (RF-T-005) | ✅ Selesai — 2026-06-08 (`_apply_tender_changes`) |
| Backend — Notif kegagalan scraper (RF-T-013) | ✅ Selesai — 2026-06-08 |
| Backend — Notif skor tinggi (RF-T-008) | ⚠️ Kode siap, belum terpicu — `match_score` selalu `None` (RF-T-006/007 belum di-wire ke pipeline scrape→save) |
| Backend — endpoint `/tenders/{id}` | ✅ Selesai — 2026-06-08                  |
| Backend — endpoint status update   | ✅ Selesai — 2026-06-08                  |
| Backend — endpoint input manual `POST /tenders` | ✅ Selesai — 2026-06-08     |
| Backend — endpoint `/scraper/log`  | ⚠️ Ada, data kosong (nunggu RF-T-012)    |
| Database schema (Prisma)           | ✅ Lengkap — 2026-06-04, belum `db push` |
| Docker compose — path fix          | ✅ Fix — 2026-06-05                      |
| Docker compose — Next.js service   | ❌ Belum                                 |
| API Routes Next.js                 | ❌ File ada, semua 0 byte                |
| Server Actions Next.js             | ❌ File ada, semua 0 byte                |
| `lib/prisma.js`                    | ❌ 0 byte                                |
| UI — Layout dashboard + Sidebar    | ❌ Belum ada                             |
| UI — Halaman Tenders               | ❌ Placeholder                           |
| UI — Halaman Detail Tender         | ❌ File tidak ada                        |
| UI — Halaman KBLI                  | ❌ Placeholder                           |
| UI — Proposal Generator            | ❌ Placeholder                           |
| Auth / Login                       | ❌ Belum ada                             |
