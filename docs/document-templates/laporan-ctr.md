# Laporan CTR — Bedah Struktur Template

STATUS: TBD - menunggu file `.docx` asli dari user

Dugaan awal berdasarkan field `ProjectPhase` (yang sudah ada konvensi
penamaan "CTR-1".."CTR-8" sebagai `label`) + `disbursementAmount`/
`disbursementStatus`. Revisi setelah template asli tersedia di
`storage/document_templates/laporan_ctr/`.

## Section list (dugaan awal)

- Kop surat / letterhead — `static`
- Judul: "Laporan CTR [label]" + nomor + tanggal — `data`
- Info proyek (nama proyek, klien, PO/SO) — `data`
- Ringkasan progress fase ini (periode, status) — `data`
- Uraian pekerjaan yang dilakukan pada periode CTR ini — `ai` (narasi
  progress) atau `data` (kalau diisi manual dari checklist)
- Tabel disbursement (nilai, status pencairan) — `data`
- Lampiran bukti pekerjaan / foto — `static`/`data`
- Tanda tangan persetujuan — `data`

## Placeholder yang diperkirakan dipakai

- `{{PROJECT_NAME}}`, `{{CLIENT_NAME}}`
- `{{CTR_LABEL}}` (mis. "CTR-8")
- `{{CTR_REPORT_NUMBER}}`, `{{CTR_REPORT_DATE}}`
- `{{PHASE_START_DATE}}`, `{{PHASE_END_DATE}}`, `{{PHASE_STATUS}}`
- `{{DISBURSEMENT_AMOUNT}}`, `{{DISBURSEMENT_STATUS}}`
- `{{PROGRESS_NARRATIVE}}` (AI-generated, opsional)
- `{{SIGNATORY_NAME}}`, `{{SIGNATORY_POSITION}}`

## Mapping ke field Prisma (dugaan)

| Placeholder | Field Prisma | Catatan |
|---|---|---|
| `{{PROJECT_NAME}}` | `Project.name` | |
| `{{CLIENT_NAME}}` | `Project.client` | |
| `{{CTR_LABEL}}` | `ProjectPhase.label` | sumber utama entity untuk Laporan CTR (`entityType="ProjectPhase"`) |
| `{{CTR_REPORT_NUMBER}}`/`{{CTR_REPORT_DATE}}` | — | input manual / tanggal generate |
| `{{PHASE_START_DATE}}`/`{{PHASE_END_DATE}}`/`{{PHASE_STATUS}}` | `ProjectPhase.startDate`/`endDate`/`status` | |
| `{{DISBURSEMENT_AMOUNT}}`/`{{DISBURSEMENT_STATUS}}` | `ProjectPhase.disbursementAmount`/`disbursementStatus` | |
| `{{PROGRESS_NARRATIVE}}` | AI — `entity_data` minimal: `ProjectPhase.label`, `status`, `Project.name`/`client` | satu-satunya kandidat `aiSections` |
| `{{SIGNATORY_*}}` | `Employee.name`/`position` | |

## Klasifikasi section

| Section | data / ai / static | Catatan |
|---|---|---|
| Letterhead | static | |
| Judul, info proyek, ringkasan | data | |
| Uraian pekerjaan / narasi progress | ai (opsional) atau data | default `data` (diisi dari checklist), `ai` kalau butuh narasi |
| Tabel disbursement | data | dari `ProjectPhase.disbursementAmount`/`disbursementStatus` |
| Lampiran | static/data | |
| Tanda tangan | data | |

## Catatan khusus

`entityType` untuk Laporan CTR kemungkinan **`"ProjectPhase"`** (bukan
`"Project"`), karena 1 laporan CTR = 1 fase. Pastikan `entity_data` resolver
di Step 2 bisa query `ProjectPhase` + join `Project` parent untuk dapat
`name`/`client`.
