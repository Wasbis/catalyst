# Proposal Generator — Methodology 2 (docxtpl/Jinja2 Field Mapper)

STATUS: **Methodology 2** (2026-06-15) — dokumen ini dibuat setelah
[`proposal-generator-strategy.md`](./proposal-generator-strategy.md)
(**Methodology 1**, status historical reference, jangan ditimpa) dicoba
end-to-end dan ditemukan gap fundamental. Dokumen ini **tidak menggantikan**
Methodology 1 — keduanya akan hidup berdampingan, dipilih per-template (lihat
§2).

## 1. Kenapa Methodology 2 dibutuhkan

User generate proposal pakai template nyata
`260310_CRI2602P100-Rev_00_Proposal_Excellence_CMMS_-_GOKP_(1).docx` dengan
Methodology 1 (`_fill_by_sections`). Body section AI (BACKGROUND, dll) terisi
dengan benar — tapi banyak bagian lain **tetap statis dari template asli**:

| Bagian | Isi statis di template asli | Harus jadi |
|---|---|---|
| Cover — judul proposal | "EXCELLENCE WEB-BASED... **GENTING OIL KASURI PTE. LTD.**" | dinamis per client |
| Cover — nomor referensi | "CRI2603P100-Rev 00" | dinamis (proposal numbering) |
| Cover — "Prepared for:" | "Genting Oil Kasuri PTE. LTD." | dinamis dari `Client` |
| Proprietary Notice (hal. 2) | Teks legal sebut "GOKPL" berkali-kali | dinamis — **risiko tinggi** kalau salah/tidak terupdate untuk client lain |
| Header/Footer (hal. 3+) | Judul proposal + nama client, "Ref. No: CRI2603P100-Rev 00", page numbering | dinamis |
| Document Info table | Author(s): "Nadya Friska", Classification: "Confidential" | dari DB (Employee/User + setting) |
| Project Info table | End User / Client's Ref / CRI Project No/Name | dari `Project`/`Client` |
| Revision table | Rev/Date/Author/Reviewed by/Approved by/Description (baris berulang) | loop dari `ProposalRevision[]` |
| Table of Contents | Statis dari template | harus mengikuti jumlah bab/sub-bab hasil AI |

**Root cause**: `_apply_replacements()` (Methodology 1) hanya iterate
`doc.paragraphs` + `doc.tables` via **python-docx object model**. Cover page
("GENTING OIL KASURI PTE. LTD.", "Prepared for", Proprietary Notice) ternyata
berada di **text box** (`txbxContent` — 36 buah di `word/document.xml`
template GOKP), dan header/footer ada di `word/header*.xml`/`word/footer*.xml`
— semuanya **di luar jangkauan** `doc.paragraphs`/`doc.tables`.

## 2. Dua pendekatan, dipilih per-template — bukan dua engine fisik terpisah

`scraper-engine/api/services/docx_generator.py` (Methodology 1:
`_fill_by_sections` / `_fill_by_placeholders` / `_generate_from_scratch`)
**tetap ada tanpa diubah** — masih dipakai untuk `documentType` lain (Surat
Kerja, BAST, dll) dan template proposal yang field dinamisnya cuma di body.

Methodology 2 (docxtpl/Jinja2, full-document templating) adalah **pendekatan
tambahan**, bukan rewrite. Kalau diimplementasi, paling natural ditambahkan
sebagai *method baru* di `docx_generator.py` (mis. `_fill_by_template_tags`
yang memanggil `docxtpl.DocxTemplate`) — karena tetap 1 file "engine layer",
tinggal beda mode. Keputusan final ada di Fase 7 implementasi.

**Decision table — kapan pakai yang mana** (per template, via
`DocumentTemplate`, lihat §6 untuk field konfigurasinya):

| Kriteria template | Methodology 1 (section-replace) | Methodology 2 (docxtpl/Jinja2) |
|---|---|---|
| Field dinamis hanya di body, di bawah Heading-1 | ✅ cocok | berlebihan |
| Cover/header/footer/proprietary notice/tabel info berisi nama client/nomor referensi spesifik | ❌ tidak terjangkau | ✅ wajib |
| Revision table / project team perlu baris berulang (loop) | ❌ tidak ada loop | ✅ `{% for %}` |
| Effort siapkan template | rendah — upload `.docx` apa adanya, tinggal pilih heading di `aiSections` | sedang — sekali per template, jalankan **Template Field Mapper** (§5) untuk men-tag field |
| Contoh | Surat Kerja, BAST, proposal sederhana tanpa cover dinamis | Proposal CRI (cover + header/footer + tabel info + revision table dinamis — kasus GOKP) |

Untuk SEMUA template proposal CRI yang dipakai produksi (punya cover/header/
footer/tabel info seperti GOKP), Methodology 2 yang relevan.

## 3. Pertanyaan desain: generalisasi `ai_proposal_agent.py` → "Document Generator Agent"

Saat ini `AIProposalAgent.generate_document()`
(`scraper-engine/api/services/ai_proposal_agent.py`) hardcode untuk 6 nama
section narasi proposal (`_SECTION_GUIDELINES`: BACKGROUND, INTRODUCTION,
SUMMARY, DURATION & COMMERCIAL, PROPOSED SOLUTION, METHODOLOGY).

Dengan Methodology 2, field `ai`-classified bisa ada **di mana saja** —
bukan cuma 6 section itu:
- TOC summary (daftar bab hasil generate).
- Kalimat pendek di Proprietary Notice yang perlu disesuaikan konteks
  (mis. menyebut nama proyek tertentu).
- Section narasi baru yang namanya beda-beda per template (lihat studi kasus
  §6 di Methodology 1 — "CUSTOMISABLE APPLICATION", dll).

**Usulan arah (didiskusikan, belum diimplementasi)**: generalisasi
`AIProposalAgent` jadi **`DocumentGeneratorAgent`** dengan API generic:

```python
def generate_fields(
    self,
    field_specs: list[dict],   # [{"field_key": "BACKGROUND", "guideline": "...", "context": "..."}, ...]
    context_text: str,
    company_name: str = "PT Cliste Rekayasa Indonesia",
    user_requirements: str | None = None,
) -> dict[str, str]:           # {"BACKGROUND": "...", "proprietary_notice_intro": "...", ...}
    ...
```

- Tidak hardcode 6 nama section — `field_specs` datang dari
  `DocumentTemplate.fieldMappingJson` (hasil Template Field Mapper, §5),
  field mana pun yang diklasifikasi `ai`.
- `AIProposalAgent` (nama lama, dan `_SECTION_GUIDELINES` 6 key) bisa jadi
  **thin wrapper** di atas `generate_fields()` — caller existing
  (`/api/v1/proposals*`, Methodology 1) tidak breaking.
- Agent ini jadi tempat natural untuk **orchestration**: baca konfigurasi
  template (`templateMode` — lihat §6), generate semua field `ai`, lalu
  panggil rendering yang sesuai (`_fill_by_sections` untuk
  `templateMode: "section_replace"`, atau `_fill_by_template_tags` untuk
  `templateMode: "jinja_template"`).

Ini keputusan terbuka untuk Fase 7 — dicatat di sini supaya tidak hilang,
bukan untuk dikerjakan sekarang.

## 4. Klasifikasi 3-tier — diperluas ke SELURUH dokumen

Methodology 1 §2 sudah punya klasifikasi `static`/`data`/`ai`, tapi
diterapkan hanya ke Heading-1 body sections. Methodology 2 menerapkan
klasifikasi yang sama ke **setiap candidate string** di seluruh dokumen
(cover, header/footer, tabel, body, TOC):

| Klasifikasi | Arti | Contoh di GOKP template |
|---|---|---|
| `static` | Boilerplate CRI yang sama untuk semua client — tidak ditag, dibiarkan apa adanya. | "PT Cliste Rekayasa Indonesia © 2026" di footer, teks proses generik di Proprietary Notice |
| `data` | Ditag `{{ jinja_var }}` / `{% for %}`, diisi dari DB. | `{{ client_name }}` (cover, header), `{{ proposal_ref }}` (footer), `{% for rev in revisions %}` (revision table) |
| `ai` | Ditag `{{ jinja_var }}`, diisi dari `DocumentGeneratorAgent.generate_fields()` (§3). | Body narrative (BACKGROUND, dll), TOC summary, kalimat kontekstual di Proprietary Notice |

## 5. "Template Field Mapper" — konsep UI (roadmap Fase 7)

Menjawab permintaan user: *"bisa gak untuk mengidentifikasi mana yang
dinamis dan mana yang statis... user bisa mendefine sendiri berdasarkan
proposal yang ada... atau lu buatin rangka dari keseluruhannya terus user
yang define"* — desain berikut menyediakan KEDUA opsi (skeleton otomatis
sebagai starting point, lalu user define).

### Backend — scan

Buka `.docx` sebagai zip, ekstrak semua text run dari `word/document.xml`
(termasuk isi `txbxContent`/text box), `word/header*.xml`, `word/footer*.xml`
— dikelompokkan jadi **candidate groups**:

- Cover
- Proprietary Notice
- Header/Footer
- Document Info table
- Project Info table
- Revision table
- Body Sections (existing Methodology 1 heading-based scan,
  `_scan_docx_headings`, sudah ada — reuse)
- Table of Contents

Setiap candidate string disertai konteks teks sekitarnya (untuk uniqueness
saat replace nanti) dan lokasi (nama xml part).

> **Catatan teknis penting (temuan POC §7)**: satu string visible bisa
> terpecah jadi beberapa `<w:r><w:t>` run (karena revisi/format Word) —
> replace naif berbasis substring XML bisa miss. Field Mapper scan perlu
> bekerja di level `paragraph.text`/`run`-merge, bukan raw-XML substring
> search, supaya semua occurrence (termasuk yang run-nya terpecah) tertangkap.

### UI — "skeleton + define"

1. Sistem generate **skeleton awal otomatis**: setiap candidate group
   ditampilkan dengan dugaan klasifikasi default (heuristik sederhana, mis.
   string yang match nama client tender → `data` + saran field
   `client.name`; string panjang di bawah Heading-1 → `ai`; sisanya
   `static`).
2. User membuka dokumen (preview list candidate per group, dikelompokkan
   sesuai §5 Backend) dan **mengoreksi/mendefinisikan ulang**:
   - `static` — biarkan.
   - `data` — pilih field DB dari dropdown (`client.name`,
     `client.legalName`, `employee.name`, `project.poSoNumber`,
     `proposalReference.code`, dst — lihat §6 untuk daftar model).
   - `ai` — isi guideline (textarea, sama UX seperti `AiSectionsEditor.jsx`
     Methodology 1, tapi scope-nya semua field bukan cuma Heading-1).
3. "Apply" → backend tulis ulang `.docx` (dari copy original): setiap
   candidate string diganti tag Jinja2 sesuai mapping (atau dibiarkan kalau
   `static`) → hasil disimpan sebagai file template "tagged" (one-time per
   template, bukan tiap generate).
4. Generate time: rendering Methodology 2 cukup render file "tagged" +
   context dict — tidak perlu scan ulang.

## 6. DB schema tambahan (didesain, **belum dimigrasi** sesi ini)

- **`Client`** (model baru): `id`, `name`, `legalName`, `shortName`,
  `address`, `picName`, `picTitle`, dll — sumber utama "Prepared for",
  Proprietary Notice, Document/Project Info table. (`Project.client`/
  `ProjectLead.client` saat ini cuma string nama — bisa jadi referensi awal
  data migration ke `Client`.)
- **`ProposalRevision`** (model baru): `id`, `documentId` (FK
  `GeneratedDocument`), `revisionNumber`, `date`, `authorId`/`reviewedById`/
  `approvedById` (FK `Employee` — model `Employee` sudah ada:
  `id`/`name`/`position`/`isActive`), `description` — untuk revision table
  loop (`{% for rev in revisions %}`).
- **`GeneratedDocument`** tambahan field: `proposalReferenceNumber`
  (String?, mis. "CRI2603P100-Rev 00"), `classification` (String?, default
  "Confidential"), `clientId` (FK `Client`).
- **`DocumentTemplate`** tambahan:
  - `templateMode` (String?, `"section_replace"` default / `"jinja_template"`)
    — flag method generate per template, dibaca orchestrator (§3).
  - `fieldMappingJson` (Json?) — hasil Template Field Mapper (§5):
    `[{ "candidate": "...", "group": "cover|header_footer|document_info|...",
    "classification": "static|data|ai", "dataField": "client.name", "guideline": "..." }, ...]`
  - `taggedFilePath` (String?) — path file `.docx` hasil "Apply" Field Mapper
    (yang sudah berisi tag Jinja2), dipakai saat generate untuk
    `templateMode: "jinja_template"`.

## 7. POC feasibility — hasil

`scraper-engine/testing/docxtpl_poc.py` membuktikan docxtpl bisa render field
dinamis di **seluruh dokumen** template GOKP, termasuk bagian yang tidak
terjangkau Methodology 1:

- ✅ Cover textbox (`{{ client_name }}`, `{{ client_legal_name }}`).
- ✅ Proprietary Notice (`{{ client_short_name }}` — replace "GOKPL" di
  paragraf notice).
- ✅ Document Info table (`{{ author_name }}`, `{{ classification }}`).
- ✅ Footer (`{{ proposal_ref }}`).

**Caveat ditemukan** (lihat §5 catatan teknis): "CRI2603P100-Rev 00" tampil
identik di beberapa `footer*.xml`, tapi hanya `footer2.xml` yang
menyimpannya sebagai string XML kontiguous — `footer1/3/4.xml` memecah
string yang sama jadi beberapa run. Field Mapper produksi harus menangani ini
(merge run sebelum match, bukan raw substring search) — POC hanya menag
bagian yang kontiguous untuk membuktikan rendering docxtpl-nya jalan.

Kesimpulan: **pendekatan docxtpl/Jinja2 viable** untuk Methodology 2. Risiko
implementasi ada di tahap **scan & tag** (Field Mapper backend), bukan di
rendering.

## 8. Roadmap Fase 7 (tracked di `todo.md`)

1. **Phase 1 — DB schema**: migrasi `Client`, `ProposalRevision`, tambahan
   field `GeneratedDocument`/`DocumentTemplate` (§6).
2. **Phase 2 — Field Mapper backend**: endpoint scan (ekstrak candidate
   strings dari seluruh `.docx`, dengan run-merge per §5 catatan teknis) +
   endpoint apply (tulis tag Jinja2 ke copy template → `taggedFilePath`).
3. **Phase 3 — Field Mapper UI**: skeleton otomatis + form classify
   (static/data/ai) per candidate group, reuse pattern `AiSectionsEditor.jsx`.
4. **Phase 4 — Rendering Methodology 2**: implementasi
   `_fill_by_template_tags` (docxtpl) di `docx_generator.py` + generalisasi
   `ai_proposal_agent.py` → `DocumentGeneratorAgent.generate_fields()` (§3).
5. **Phase 5 — Endpoint & wiring**: endpoint generate baca `templateMode`,
   pilih rendering yang sesuai; wiring `ProposalSetup.jsx`/
   `TenderDetailClient.jsx` tidak berubah dari sisi user (transparan).
6. **Phase 6 — QA end-to-end**: generate proposal pakai template GOKP
   (setelah di-tag via Field Mapper), export `.docx`, bandingkan visual
   dengan file asli — cover/header/footer/tabel info harus terisi dinamis
   dan benar, section `static` (boilerplate produk CRI) identik.
