# Proposal — Bedah Struktur Template

STATUS: Lengkap (berdasarkan 3 file `.docx` nyata di
`storage/proposal_templates/` + kode `docx_generator.py` /
`ai_proposal_agent.py` per 2026-06-15)

## Sumber yang dibedah

| File | Ukuran | Punya `{{...}}` placeholder? | Heading 1 cocok dgn `DEFAULT_PROPOSAL_SECTIONS`? |
|---|---|---|---|
| `CRI2408P46_Rev_01_Proposal_Asset_Management_Application_PT_Jawa_Satu_Power.docx` | 12 MB | Tidak | Sebagian (lihat di bawah) |
| `260310_CRI2602P100-Rev_00_Proposal_Excellence_CMMS_-_GOKP_(1).docx` | 6.8 MB | Tidak | Sebagian (lihat di bawah) |
| `Proposal_EWS_HSSE_Satelit_CRI.docx` | 18 KB | Tidak | Tidak — struktur beda total |

Karena tidak ada `{{...}}` di ketiga file, `DocxGenerator._fill_template()`
auto-detect selalu jatuh ke **Mode 1 (section-replace / `_fill_by_sections`)**
untuk template proposal yang ada saat ini. Mode 2 (placeholder) hanya akan
aktif kalau ada template baru yang sengaja ditulis dengan `{{...}}`.

## 1. Cover page & front matter (di luar `sections_to_replace`)

Ketiga file punya cover page sebelum Heading 1 pertama — **tidak disentuh
oleh `_fill_by_sections`** (hanya `_apply_replacements()` untuk
`METADATA_PLACEHOLDERS`, yang hanya jalan kalau ada `{{...}}` — saat ini
no-op untuk 3 file ini karena tidak ada placeholder sama sekali):

- Title block (judul proposal, subjudul).
- Tabel "Prepared for / Prepared by" (table pertama, 3 baris x 2 kolom) — ada
  di template EWS_HSSE; di 2 template lain front matter-nya berbentuk
  paragraf cover + "TABLE OF CONTENT(S)" sebagai Heading 1 pertama (di-skip
  dari `sections_to_replace` karena bukan salah satu dari 6 default section).

**Klasifikasi**: `static` — bagian ini tidak pernah di-generate ulang oleh
sistem saat ini. Kalau mau jadi `data` (isi otomatis nama proyek/klien di
cover), perlu logic baru di `_apply_replacements` yang jalan independen dari
`has_placeholders` check — **dicatat sebagai item tambahan untuk Step 2**,
bukan blocker.

## 2. Enam section default (`DEFAULT_PROPOSAL_SECTIONS`)

Dari `ai_proposal_agent.py`:

```python
DEFAULT_PROPOSAL_SECTIONS = [
    "BACKGROUND",
    "INTRODUCTION",
    "SUMMARY",
    "DURATION & COMMERCIAL",
    "PROPOSED SOLUTION",
    "METHODOLOGY",
]
```

Cocokkan dengan Heading 1 yang benar-benar ada di template:

| Default section | `CRI2408P46` (Asset Mgmt) | `260310 CMMS GOKP` | Catatan |
|---|---|---|---|
| BACKGROUND | ✅ Heading 1 "BACKGROUND" | ✅ Heading 1 "BACKGROUND" | match persis |
| INTRODUCTION | ✅ Heading 1 "INTRODUCTION" | ✅ Heading 1 "INTRODUCTION" | match persis |
| SUMMARY | ✅ Heading 1 "SUMMARY" | ⚠️ Heading 1 **"PROPOSAL SUMMARY"** | match case-insensitive di `_fill_by_sections` cuma exact string — "SUMMARY" ≠ "PROPOSAL SUMMARY", **tidak match** di template CMMS |
| DURATION & COMMERCIAL | ✅ Heading 1 "DURATION & COMMERCIAL" (+ sub: Work Duration & Schedule, Commercial > Terms & Conditions, Payment Schedule) | ✅ sama + sub "Main Cost" | match persis di kedua, struktur sub-section beda dikit |
| PROPOSED SOLUTION | ❌ tidak ada — heading sebenarnya "CUSTOMISABLE APPLICATION" | ❌ tidak ada — heading sebenarnya "TECHNICAL" | **tidak match di kedua template** — block AI "PROPOSED SOLUTION" tidak akan menemukan heading untuk diganti |
| METHODOLOGY | ❌ tidak ada Heading 1 "METHODOLOGY" (ada "CRI ESTABLISHED APPLICATION" sebagai pengganti) | ✅ Heading 1 "METHODOLOGY" ada | template CMMS match, template Asset Mgmt tidak |

**Temuan penting**: 3 dari 6 default section (`SUMMARY`, `PROPOSED SOLUTION`,
`METHODOLOGY`) **tidak selalu match 1:1** dengan heading riil di template
proposal CRI yang sebenarnya dipakai tim. Saat ini kalau heading tidak
ditemukan, `_fill_by_sections` kemungkinan skip block tersebut (konten AI
"menghilang" / tidak masuk dokumen) — **perlu diverifikasi saat Step 2**
apakah ada fallback (mis. append di akhir dokumen) atau benar-benar silent
drop. Untuk Fase 6, **`DocumentTemplate.aiSections` per-template harus diisi
sesuai heading riil masing-masing template** (bukan asumsi
`DEFAULT_PROPOSAL_SECTIONS` berlaku untuk semua), contoh:
- Template "CRI2408P46 Asset Mgmt" → `aiSections: ["BACKGROUND",
  "INTRODUCTION", "SUMMARY", "DURATION & COMMERCIAL"]` (4 section yang
  benar-benar match; "CUSTOMISABLE APPLICATION"/"CRI ESTABLISHED APPLICATION"
  dibiarkan `static` kecuali nanti ditambah guideline khusus).
- Template "260310 CMMS GOKP" → `aiSections: ["BACKGROUND", "INTRODUCTION",
  "DURATION & COMMERCIAL", "METHODOLOGY"]` (+ "PROPOSAL SUMMARY" kalau
  guideline "SUMMARY" disesuaikan namanya).

## 3. Sub-sections (Heading 2/3) di bawah section AI

`_fill_by_sections` menyisipkan AI `subsections` (Heading 2) di bawah
heading yang match. Section `DURATION & COMMERCIAL` di kedua template besar
punya sub-heading riil:

- "Work Duration & Schedule" (Heading 2)
- "Commercial" (Heading 2) → "Terms & Conditions" / "Main Cost" / "Payment
  Schedule" (Heading 3)

`_SECTION_GUIDELINES["DURATION & COMMERCIAL"]` di `ai_proposal_agent.py`
sudah meminta AI generate sub-section "Work Duration & Schedule" dan "Terms &
Conditions" — **cocok** dengan struktur riil. "Main Cost"/"Payment Schedule"
belum di-cover guideline — opsional untuk fase ini.

## 4. Timeline table

`TIMELINE_SECTION = "DURATION & COMMERCIAL"` — kalau `timeline_data`
diberikan, `DocxGenerator` menambahkan tabel dengan header:

```python
headers = ["No.", "Phase / Activity", "Duration", "Notes"]
```

Item `timeline_data: List[Dict]` dengan keys `phase`, `activities`,
`duration`, `notes`. Template riil sendiri sudah punya tabel "Work Duration &
Schedule" (Heading 2) — tabel timeline disisipkan **setelah** heading
"DURATION & COMMERCIAL" (di section level, bukan di dalam sub-heading), jadi
posisinya relatif terhadap sub-section "Work Duration & Schedule" perlu
dicek manual saat implementasi (potensi duplikasi/urutan aneh — flag untuk
Step 2 QA, bukan blocker desain).

## 5. Placeholder mode (Mode 2) — belum dipakai, tapi didukung kode

`BLOCK_PLACEHOLDERS` & `METADATA_PLACEHOLDERS` (di `docx_generator.py`)
mendefinisikan placeholder `{{...}}` yang **akan** dipakai kalau ada template
baru ditulis dengan placeholder eksplisit:

```python
BLOCK_PLACEHOLDERS = {
    "BACKGROUND": "{{BACKGROUND}}",
    "INTRODUCTION": "{{INTRODUCTION}}",
    "SUMMARY": "{{SUMMARY}}",
    "DURATION & COMMERCIAL": "{{DURATION_COMMERCIAL}}",
    "PROPOSED SOLUTION": "{{PROPOSED_SOLUTION}}",
    "METHODOLOGY": "{{METHODOLOGY}}",
}
METADATA_PLACEHOLDERS = {
    "tender_title": "{{PROJECT_TITLE}}",
    "company_name": "{{COMPANY_NAME}}",
    "kbli_code": "{{KBLI_CODE}}",
    "kbli_description": "{{KBLI_DESCRIPTION}}",
}
```

Tidak ada perubahan dibutuhkan di Step 2 untuk mode ini — sudah generik (key
dict = nama section/field). Untuk doc type lain, pola placeholder yang sama
(`{{SECTION_NAME}}` uppercase-with-underscore, `{{METADATA_FIELD}}`) dipakai
sebagai konvensi default kalau admin upload template ber-placeholder.

## 6. File `Proposal_EWS_HSSE_Satelit_CRI.docx` — bukan template generation

File ini (18 KB) strukturnya **beda total**: heading numbered Bahasa
Indonesia ("1. Ringkasan Eksekutif", "2. Latar Belakang & Permasalahan", dst,
8 section), tabel custom (risk matrix, ROI framework, dll), tanpa
`{{...}}` dan tanpa heading yang match `DEFAULT_PROPOSAL_SECTIONS` sama
sekali. Ini adalah **contoh proposal hasil jadi** (sample output / referensi
gaya penulisan), **bukan** template `.docx` yang dipakai sebagai
`template_path` di `DocxGenerator`. Jangan upload file ini sebagai
`DocumentTemplate` — kalau diupload, `_fill_by_sections` tidak akan
menemukan heading match apa pun dan hasilnya kosong/tidak berubah.

## 7. Mapping field → sumber data

| Placeholder/metadata | Sumber data saat ini | Sumber data setelah generalisasi (entityType="Project"/"TenderResult") |
|---|---|---|
| `{{PROJECT_TITLE}}` / "tender_title" | `TenderResult.title` | `Project.name` atau `TenderResult.title` (tergantung `entityType`) |
| `{{COMPANY_NAME}}` / "company_name" | hardcoded `"PT Cliste Rekayasa Indonesia"` | tetap hardcoded (bukan field per-entity) |
| `{{KBLI_CODE}}` / "kbli_code" | `TenderResult.kbliMatchedJson` | sama, hanya relevan untuk `entityType="TenderResult"` |
| `{{KBLI_DESCRIPTION}}` / "kbli_description" | idem | idem |
| Timeline table | `ProposalDraft.timelineDataJson` (input manual/import Excel) | `GeneratedDocument` timeline field — bisa di-derive dari `ProjectPhase[]` (label, startDate, endDate) untuk `entityType="Project"`, atau tetap manual untuk proposal |

## 8. Klasifikasi final per section (ringkasan untuk `aiSections` default)

| Section | Klasifikasi | Catatan |
|---|---|---|
| Cover / front matter / TOC | `static` | tidak disentuh |
| BACKGROUND | `ai` | sesuai `_SECTION_GUIDELINES` |
| INTRODUCTION | `ai` | idem |
| SUMMARY / PROPOSAL SUMMARY | `ai` | **nama heading harus dicocokkan per-template** (lihat §2) |
| DURATION & COMMERCIAL | `ai` (text) + `data` (timeline table) | sub "Work Duration & Schedule"/"Terms & Conditions" via AI, tabel timeline via data |
| PROPOSED SOLUTION / CUSTOMISABLE APPLICATION / TECHNICAL | `ai` jika heading match guideline; `static` jika tidak ada heading yang cocok | per-template, isi `aiSections` sesuai heading riil |
| METHODOLOGY / CRI ESTABLISHED APPLICATION | sama seperti di atas | per-template |
| Bagian lain (RIGHTS AND RESPONSIBILITIES, QUALITY ASSURANCE, ANNEXES, CRI EXPERIENCES, dst) | `static` | tidak pernah disentuh — bagian "boilerplate" perusahaan |
