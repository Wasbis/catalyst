# Catalyst

Monorepo with two apps that talk to a shared PostgreSQL database:

- **catalyst-scout/** — Next.js 16 + React 19 + Prisma frontend/dashboard ("Cliste" tender platform). See [catalyst-scout/CLAUDE.md](catalyst-scout/CLAUDE.md) (loads `AGENTS.md` — read it before touching Next.js code, this version has breaking changes from training-data Next.js).
- **scraper-engine/** — Python FastAPI service that scrapes tender data (CIVD SKK Migas, GeoDipa, GEP, LPSE) and exposes it via API + stores to Postgres.

Both apps connect to the same `catalystDB` Postgres instance — schema is owned by Prisma (catalyst-scout).

## Running locally

Two separate terminals (no Docker for the apps in dev — only Postgres):

```
cd catalyst-scout && npm run dev          # http://localhost:3000
cd scraper-engine && .\.venv\Scripts\Activate && uvicorn api.main:app --reload --port 8000   # http://localhost:8000/docs
```

Full environment setup, database connection strings, Tailscale/remote-DB access, and production/Docker deployment steps are documented in `guideline.md` (gitignored — local only, contains credentials). Read it when you need connection details; never copy secrets from it into committed files or code.

## Communication

- **Selalu jelaskan dalam Bahasa Indonesia.** Penjelasan, ringkasan progres, dan diskusi/analisis harus pakai Bahasa Indonesia (kode, nama variabel, commit message tetap pakai Bahasa Inggris seperti biasa).

## Naming conventions

**Semua identifier (variabel, fungsi, class, key JSON, id/class HTML, dll) WAJIB pakai Bahasa Inggris** — supaya konsisten dan gampang dibaca lintas layer/tools. Teks untuk user (UI label, pesan error ke user, dokumentasi) boleh Bahasa Indonesia, tapi nama identifier di kode tetap Inggris.

Per-bahasa, ikuti best practice standar masing-masing (jangan campur dalam satu file/layer):

| Bahasa/format | Convention | Contoh |
|---|---|---|
| **Python** (scraper-engine) | `snake_case` untuk variabel/fungsi/module; `PascalCase` untuk class; `UPPER_SNAKE_CASE` untuk konstanta | `tender_date`, `def fetch_tenders()`, `class CivdScraper`, `MAX_RETRIES` |
| **JS/TS** (catalyst-scout) | `camelCase` untuk variabel/fungsi; `PascalCase` untuk komponen React/class; `UPPER_SNAKE_CASE` untuk konstanta global | `tenderDate`, `function getTenders()`, `function TenderCard()`, `MAX_PAGE_SIZE` |
| **JSON** (API payload/config) | Ikut konvensi sisi konsumen-nya — payload yang dikonsumsi Next.js → `camelCase`; payload internal scraper-engine → `snake_case` (lihat aturan boundary di bawah) | — |
| **HTML/CSS** (kelas, id, atribut `data-*`) | `kebab-case` | `class="tender-card"`, `data-tender-id` |
| **Prisma schema / kolom DB** | Model field `camelCase` di schema, kolom fisik `snake_case` lewat `@map`/`@@map` (konvensi umum Postgres) | `tenderDate @map("tender_date")` |

Ada *language boundary* antara Next.js/Prisma (JS, `camelCase`) dan scraper-engine (Python, `snake_case`). Supaya nggak ada mismatch field di DB/JSON antar layer:

- **Di boundary** (response API scraper-engine ⇄ Prisma/Next.js): konversi casing harus eksplisit (mapping di serializer FastAPI atau `@map`/`@@map` di Prisma schema) — jangan biarkan inconsistency nyelip lewat tanpa disadari.

## Code style

- **Jangan kasih komentar di setiap baris** — itu mengganggu dan bikin noise. Komentar cuma untuk hal yang nggak jelas dari kode itu sendiri (alasan non-obvious, workaround, edge case tersembunyi), bukan menjelaskan apa yang sudah jelas dari nama variabel/fungsi.

## Git / commit workflow

- Claude **tidak pernah commit otomatis**. Edit kode dulu → lo review diff (`git status`/`git diff` atau lewat IDE) → kalau oke baru minta commit secara eksplisit. Commit hanya dibuat saat diminta, dan selalu commit baru (bukan amend) kecuali diminta lain.

## Conventions & rules

- **Never commit `.env`/`.env.local`, `guideline.md`, `prd*.md`, or `crikbli.pdf`** — already gitignored, keep it that way.
- **scraper-engine/api/services/** is where active scraper implementations live (`civd_scraper.py`, `geodipa_scraper.py`, etc). `scraper-engine/testing/` is scratch/experimental — don't treat it as the source of truth.
- Scraper debug/output artifacts (`*_debug_*.json`, `hasil_*.json`, `test_output_*.json`) are run-time junk — don't commit them; clean them up if you generate them during a task.
- Prisma schema (`catalyst-scout/prisma/`) is the single source of truth for the DB schema. After changing it, run `npx prisma db push` (dev) — don't hand-edit tables from the Python side.
- "Masking" feature (sensitive data redaction before hitting OpenAI) must keep working — flagged in deployment checklist as a pre-prod requirement.

## Folder structure recommendation

Struktur yang ada sekarang sudah cukup baik (Next.js App Router dengan route groups, Python service layer terpisah). Beberapa rapihan yang disarankan:

**scraper-engine/**
- Pindahkan script scratch dari root (`test_scrape.py`, `test_save_db.py`) ke `testing/` — biar root cuma berisi `api/`, `Dockerfile`, `requirements.txt`.
- `api/services/*_debug_*.json` dan `geodipa_debug_*.json` **jangan disimpan di folder kode** (`api/services/`) — pindahkan ke `testing/` atau folder `storage/`/`tmp/` yang sudah di-gitignore, supaya service layer tetap bersih dari artifact runtime.
- `api/services/downloads/` — kalau ini tempat hasil download dokumen tender, sebaiknya jadi top-level `scraper-engine/storage/downloads/` (terpisah dari source code), dan pastikan masuk `.gitignore`.
- Tambahkan satu folder per platform scraper kalau makin banyak (`api/services/scrapers/civd.py`, `geodipa.py`, `lpse.py`, `gep.py`) supaya `services/` nggak campur antara scraper, AI, masking, dan utilitas (pdf/docx).

**catalyst-scout/src/**
- Struktur `app/(dashboard)/{kbli,management,settings,tenders}` sudah sesuai pola App Router — pertahankan.
- `actions/` dan `lib/` sudah pas untuk server actions & shared utilities (Prisma client). Pastikan `lib/prisma.js` (saat ini 0 byte per `todo.md`) jadi satu-satunya entry point Prisma client (singleton pattern), jangan `new PrismaClient()` tersebar di banyak file.
- Kalau komponen UI mulai banyak, pertimbangkan `src/components/` terpisah dari `src/app/` (App Router) supaya komponen reusable nggak campur dengan route files.

## Project status

`todo.md` tracks an audit of PRD vs. actual implementation (last updated 2026-06-05) — check it for what's done/pending per platform (CIVD ✅, GeoDipa ✅, GEP ⚠️ placeholder, LPSE ❌, Manual input ❌) and per Tahap (stage) of the tender platform build-out.
