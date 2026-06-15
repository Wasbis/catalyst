# Proposal Generator — Konsep, Workflow & Strategi Multi-Template

STATUS: **Methodology 1** (2026-06-15) — dokumen ini menjawab pertanyaan
strategis tentang Proposal Generator (`documentType: "proposal"`), sebelum
lanjut ke implementasi roadmap §7. Untuk bedah teknis heading/section per
file `.docx` existing, lihat [`proposal.md`](./proposal.md). Untuk konvensi
umum penamaan/placeholder lintas `documentType`, lihat
[`README.md`](./README.md).

> **Catatan versi**: Pendekatan di dokumen ini (template-first section-replace
> + klasifikasi static/data/ai + guideline per-section) adalah **Methodology
> 1**. Setelah dicoba & dievaluasi end-to-end dengan template CRI2408P46 (§6)
> — kalau hasilnya kurang cocok (misal terlalu rigid untuk variasi struktur
> antar template, atau guideline AI tidak cukup kontrol), pendekatan
> alternatif akan didokumentasikan sebagai **Methodology 2, 3, dst** di file
> terpisah (`proposal-generator-strategy-v2.md`, dst) — dokumen ini tetap
> dipertahankan sebagai referensi histori, jangan ditimpa.

## 1. Konsep besar: "template-first, AI cuma isi yang dikonfigurasi"

Proposal Generator **tidak** men-generate dokumen dari nol. Setiap kali user
klik "Generate Document" untuk proposal:

1. Backend mengambil file `.docx` dari `DocumentTemplate` yang dipilih
   (`template.fileUrl`/`filePath`) — **file ini di-copy**, bukan dibaca lalu
   ditulis ulang dari nol.
2. `DocxGenerator._fill_by_sections` (Mode 1 — section-replace, lihat
   `scraper-engine/api/services/docx_generator.py`) menyusuri copy tersebut,
   dan **hanya** menghapus+mengganti isi di bawah Heading 1 yang namanya ada
   di `template.aiSections` (atau diklasifikasikan `data`).
3. Semua bagian lain dari file copy — cover page, Table of Content, gambar,
   tabel, heading lain, dan terutama **font/style/layout** (karena masih
   berasal dari `styles.xml` file yang sama) — **tidak disentuh sama sekali**.

**Konsekuensi langsung**: kalau template proposal *diganti* (misal dari
template "Asset Management" ke template "CMMS Excellence"), output otomatis
ikut layout/font/cover/boilerplate template baru — **tanpa perubahan kode
apa pun**. Yang berubah hanyalah:

- Daftar heading yang ada di file `.docx` itu (struktur beda per template).
- Konfigurasi `aiSections` (mana yang AI-generate, mana yang data-fill, mana
  yang dibiarkan apa adanya) — ini **konfigurasi**, diisi sekali per template
  lewat `/settings/document-templates`, bukan kode.

Jadi jawaban untuk 3 pertanyaan awal:

| Pertanyaan | Jawaban singkat |
|---|---|
| Bagaimana AI tahu section apa yang harus digenerate? | Dari `DocumentTemplate.aiSections` milik template yang dipilih — daftar heading + guideline, per-template (lihat §3). |
| Kalau template ganti, apakah layout/font/background ikut berubah? | Ya, **otomatis** — karena generator bekerja di atas copy file template itu sendiri. Tidak butuh perubahan kode. Yang perlu disesuaikan cuma konfigurasi `aiSections` untuk template baru tersebut. |
| Bagaimana strategi multi-template per bidang pekerjaan? | 1 row `DocumentTemplate` (`documentType: "proposal"`) per bidang/jenis proposal, dibedakan label `proposalType`, masing-masing dengan `aiSections` sendiri (lihat §4). |

## 2. Klasifikasi 3-tier per section

Setiap Heading 1 (dan beberapa Heading 2/3 penting) di template diklasifikasi
ke salah satu dari 3 tipe saat admin konfigurasi template:

| Klasifikasi | Arti | Contoh (template CRI2408P46 Asset Management) | Token AI |
|---|---|---|---|
| `static` | Tidak pernah disentuh — boilerplate produk/legal CRI, tetap apa adanya dari file template. | "CRI ESTABLISHED APPLICATION", "RIGHTS AND RESPONSIBILITIES", "QUALITY ASSURANCE", "CRI EXPERIENCES", "TABLE OF CONTENT" | 0 |
| `data` | Diisi otomatis dari `entityData`/timeline (substitusi, tanpa AI). | tabel "Work Duration & Schedule" di bawah "DURATION & COMMERCIAL" | 0 |
| `ai` | Konten digenerate AI sesuai `guideline` yang dikonfigurasi per-template. | "BACKGROUND", "INTRODUCTION", "SUMMARY", "CUSTOMISABLE APPLICATION" | sesuai panjang section |

**Aturan pilih klasifikasi**:
- Kalau section berisi narasi spesifik proyek/klien yang harus "menjual" →
  `ai`.
- Kalau section berisi angka/tanggal/tabel yang sudah ada di data
  Project/Tender → `data`.
- Kalau section berisi deskripsi produk/kapabilitas CRI yang sama untuk semua
  proposal di bidang itu → `static` (biarkan konten asli template).

Default: **mayoritas section adalah `static`**. Hanya section yang benar-benar
perlu disesuaikan per-proyek yang ditandai `ai`/`data` — ini juga konsisten
dengan strategi minimalisasi token AI di `todo.md` §6.0.

## 3. Skema `aiSections` per-section (termasuk guideline custom)

Saat ini `DocumentTemplate.aiSections` (`Json?`, lihat
`catalyst-scout/prisma/schema.prisma`) berisi array flat nama heading
(`["BACKGROUND", "INTRODUCTION", ...]`), dan guideline AI diambil dari
`_SECTION_GUIDELINES` global di `ai_proposal_agent.py` — yang hanya mencakup 6
nama section generik. Untuk template seperti CRI2408P46 yang punya section
spesifik ("CUSTOMISABLE APPLICATION", "ASSET MANAGEMENT DASHBOARD FOR JSP"),
guideline generik tidak cukup.

**Skema baru (tanpa migration — `aiSections` tetap kolom `Json?`)**: ubah
bentuk dari array of string jadi array of object:

```json
[
  { "heading": "BACKGROUND", "classification": "ai" },
  { "heading": "INTRODUCTION", "classification": "ai" },
  { "heading": "SUMMARY", "classification": "ai" },
  { "heading": "DURATION & COMMERCIAL", "classification": "ai" },
  { "heading": "CUSTOMISABLE APPLICATION", "classification": "ai",
    "guideline": "Describe CRI's application customization process: needs analysis, design, implementation, testing, and on-site assistance — tailored to the client's asset management workflow." },
  { "heading": "ASSET MANAGEMENT DASHBOARD FOR {{CLIENT_NAME}}", "classification": "ai",
    "guideline": "Describe the asset management dashboard modules (Integrity Status, Asset Profile, Production Profile, Budget & Cost Profile) as they apply to the client's assets." },
  { "heading": "CRI ESTABLISHED APPLICATION", "classification": "static" }
]
```

Aturan resolusi guideline saat generate:

1. Kalau `classification == "static"` → heading **tidak** dimasukkan ke
   `sections_to_replace`/`section_keys` sama sekali — konten asli template
   dipertahankan 100%.
2. Kalau `classification == "ai"` dan `guideline` diisi → pakai guideline
   tersebut.
3. Kalau `classification == "ai"` dan `guideline` **kosong**, dan `heading`
   cocok salah satu dari 6 key `_SECTION_GUIDELINES` global (BACKGROUND,
   INTRODUCTION, SUMMARY, DURATION & COMMERCIAL, PROPOSED SOLUTION,
   METHODOLOGY) → pakai guideline global tersebut (backward-compat, tidak ada
   template lama yang rusak).
4. Kalau `classification == "data"` → diisi dari `entityData`/timeline,
   bukan AI.

## 4. Multi-template per bidang pekerjaan (`proposalType`)

`DocumentTemplate.proposalType` (`String?`, `@map("proposal_type")` — kolom
sudah ada di schema, sebelumnya hanya dipakai jalur legacy
`/api/v1/proposals*`) dipakai sebagai **label bidang pekerjaan/jenis
proposal**, contoh:

| `proposalType` | File template | Contoh konten unik |
|---|---|---|
| "Asset Management Application" | `CRI2408P46_Rev_01_..._Jawa_Satu_Power.docx` | "CUSTOMISABLE APPLICATION", "ASSET MANAGEMENT DASHBOARD FOR {{CLIENT_NAME}}" |
| "CMMS Excellence" | `260310_CRI2602P100-Rev_00_..._GOKP_(1).docx` | "TECHNICAL", "METHODOLOGY" |
| "EWS HSSE Satelit" | `Proposal_EWS_HSSE_Satelit_CRI.docx` | section bernomor Bahasa Indonesia (lihat `proposal.md` §6 — **bukan** template generation, jangan diupload sebagai `DocumentTemplate`) |

Setiap `proposalType` = 1 row `DocumentTemplate` (`documentType: "proposal"`,
`isActive: true`) dengan `aiSections` sendiri sesuai §3. Tidak perlu satu
daftar section universal — setiap template punya struktur dan guideline
sendiri, dikonfigurasi sekali lewat `/settings/document-templates` (UI sudah
ada, `AiSectionsEditor.jsx`).

Saat user membuat proposal baru (`ProposalSetup.jsx`), dropdown template
existing tinggal menampilkan `proposalType` sebagai label opsi — user pilih
bidang pekerjaan yang sesuai dengan tender/proyeknya, sisanya (layout, font,
section, guideline) otomatis ikut template tersebut.

## 5. Konvensi heading dengan nama klien (`{{CLIENT_NAME}}`)

Beberapa template proposal punya heading yang mengandung nama klien spesifik
dari proposal asal — contoh nyata di CRI2408P46:

```
Heading 1 | ASSET MANAGEMENT DASHBOARD FOR JSP
```

("JSP" = PT Jawa Satu Power, klien dari proposal contoh tersebut). Kalau
template ini dipakai ulang untuk klien lain, heading ini akan tetap berbunyi
"...FOR JSP" kecuali diedit.

**Solusi — konvensi penulisan template (bukan kode baru)**: saat admin
menyiapkan template untuk dipakai ulang, edit heading di Word menjadi:

```
Heading 1 | ASSET MANAGEMENT DASHBOARD FOR {{CLIENT_NAME}}
```

`_apply_replacements()` di `docx_generator.py` (Phase 4 dari
`_fill_by_sections`) berjalan di **semua paragraf, termasuk paragraf
heading** — jadi `{{CLIENT_NAME}}` di heading akan otomatis tersubstitusi dari
`_build_metadata_replacements` (sumber: `entityData.client`/`project.client`)
sama seperti placeholder di body teks. Tidak ada perubahan kode yang
diperlukan; ini murni proses editing `.docx` oleh admin saat menyiapkan
template baru. Konvensi placeholder umum (`{{FIELD_NAME}}` uppercase
underscore) sudah didokumentasikan di `README.md`.

Section "ASSET MANAGEMENT DASHBOARD FOR {{CLIENT_NAME}}" sendiri tetap
diklasifikasi `ai` (kontennya — Integrity Status/Asset Profile/Production
Profile/Budget & Cost Profile — perlu disesuaikan per aset klien), hanya
**nama di heading**-nya yang jadi placeholder otomatis.

## 6. Studi kasus: CRI2408P46 (Asset Management Application, PT Jawa Satu Power)

Template ini jadi **template percontohan pertama** yang dikonfigurasi
end-to-end di `/settings/document-templates`, karena paling detail dan
mewakili proposal nyata CRI. Berdasarkan scan `python-docx` (lihat
`proposal.md` §1-2 untuk konteks tambahan), berikut rekomendasi konfigurasi
lengkap:

| Heading 1 (+ sub penting) | Klasifikasi | Guideline draft (kalau `ai`) |
|---|---|---|
| TABLE OF CONTENT | `static` | — |
| BACKGROUND | `ai` | pakai default global `_SECTION_GUIDELINES["BACKGROUND"]` |
| INTRODUCTION | `ai` | pakai default global `_SECTION_GUIDELINES["INTRODUCTION"]` |
| SUMMARY | `ai` | pakai default global `_SECTION_GUIDELINES["SUMMARY"]` |
| DURATION & COMMERCIAL | `ai` (narasi) | pakai default global; sub "Work Duration & Schedule"/"Terms & Conditions" sudah dicover guideline ini |
| ↳ tabel "Work Duration & Schedule" | `data` | dari `ProjectPhase[]`/`timeline_data` |
| CUSTOMISABLE APPLICATION | `ai` | "Describe CRI's application customization process — needs analysis, design & implementation plan, testing & update, on-site installation & usage assistance — tailored to the client's project scope." |
| ASSET MANAGEMENT DASHBOARD FOR {{CLIENT_NAME}} | `ai` | "Describe the Asset Management Dashboard modules (Integrity Status, Asset Profile, Production Profile, Budget & Cost Profile) relevant to the client's assets and operations." |
| CRI ESTABLISHED APPLICATION (+ semua sub Heading 2/3) | `static` | — (boilerplate produk CRI: Overview, Global Business Flow, Mandatory/Optional Modules, Dashboard/Asset Register/FMEA/RCM/RBI/Corrosion Management dst) |
| RIGHTS AND RESPONSIBILITIES | `static` | — |
| QUALITY ASSURANCE | `static` | — |
| CRI EXPERIENCES | `static` | — |

Heading `ASSET MANAGEMENT DASHBOARD FOR JSP` di file asli perlu diedit jadi
`ASSET MANAGEMENT DASHBOARD FOR {{CLIENT_NAME}}` sebelum diupload sebagai
`DocumentTemplate` (lihat §5).

## 7. Roadmap implementasi (belum dikerjakan — tracked di `todo.md` §6.6)

1. **A — Skema `aiSections` object array**: update endpoint
   `POST /api/v1/documents` (dan `/api/v1/proposals` draft creation) di
   `scraper-engine/api/main.py` untuk membaca `aiSections` sebagai array of
   `{heading, classification, guideline?}`, exclude `classification:
   "static"` dari `sections_to_replace`/`section_keys`, dan kirim
   `section_guidelines` map ke `ai_proposal_agent.generate_document()` sesuai
   aturan resolusi §3.
2. **B — `AiSectionsEditor.jsx`**: ubah dari checklist nama heading jadi UI
   per-heading dengan radio classification (Static/Data/AI) + textarea
   guideline (muncul kalau AI), menyimpan bentuk object array via
   `updateDocumentTemplate(templateId, { ai_sections: [...] })`.
3. **C — `ProposalSetup.jsx`**: tampilkan `proposalType` sebagai label di
   dropdown pemilihan template (`getProposalTemplates()`), supaya user pilih
   berdasarkan bidang pekerjaan.
4. **D — Upload & konfigurasi template percontohan**: edit heading
   "ASSET MANAGEMENT DASHBOARD FOR JSP" → "...FOR {{CLIENT_NAME}}" di
   `CRI2408P46_...docx`, upload via `/settings/document-templates`
   (`proposalType: "Asset Management Application"`), konfigurasi `aiSections`
   sesuai tabel §6.
5. **E — QA end-to-end**: generate proposal pakai template ini untuk 1 tender
   contoh, export `.docx`, bandingkan visual dengan file asli — pastikan
   section `static` identik 100% (font, layout, cover, boilerplate), dan
   section `ai`/`data` terisi sesuai guideline & data proyek.
