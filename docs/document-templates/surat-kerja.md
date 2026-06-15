# Surat Kerja (Work Order Letter) — Bedah Struktur Template

STATUS: TBD - menunggu file `.docx` asli dari user

Isi di bawah ini adalah **dugaan awal** berdasarkan pola umum surat kerja
proyek engineering Indonesia + field yang sudah ada di
`Project`/`ProjectPhase`/`Employee`. Wajib direvisi begitu file `.docx` asli
tersedia (taruh di `storage/document_templates/surat_kerja/`, upload via
`/settings/document-templates`, lalu bandingkan hasil scan heading dengan
daftar di bawah).

## Section list (dugaan awal)

- Kop surat / letterhead perusahaan (logo, alamat) — `static`
- Nomor surat, tanggal — `data`
- Perihal: "Surat Perintah Kerja" / judul pekerjaan — `data`
- Kepada (nama klien/perusahaan tujuan) — `data`
- Isi/badan surat: deskripsi pekerjaan, lingkup kerja, jangka waktu — `ai`
  atau `data` (tergantung apakah deskripsi diketik manual atau di-generate)
- Lampiran (jika ada) — `static`
- Blok tanda tangan (nama, posisi, tanggal) — `data`

## Placeholder yang diperkirakan dipakai

- `{{PROJECT_NAME}}`
- `{{CLIENT_NAME}}`
- `{{PO_SO_NUMBER}}`
- `{{PO_SO_DATE}}`
- `{{LETTER_NUMBER}}` (nomor surat — perlu sumber data baru, lihat catatan)
- `{{LETTER_DATE}}`
- `{{SIGNATORY_NAME}}`, `{{SIGNATORY_POSITION}}`

## Mapping ke field Prisma (dugaan)

| Placeholder | Field Prisma | Catatan |
|---|---|---|
| `{{PROJECT_NAME}}` | `Project.name` | |
| `{{CLIENT_NAME}}` | `Project.client` | |
| `{{PO_SO_NUMBER}}` | `Project.poSoNumber` | |
| `{{PO_SO_DATE}}` | `Project.poSoDate` | |
| `{{LETTER_NUMBER}}` | — | belum ada field; kemungkinan perlu nomor manual diisi user saat generate, atau auto-generate sequence baru |
| `{{LETTER_DATE}}` | tanggal generate (`now()`) | |
| `{{SIGNATORY_NAME}}` / `{{SIGNATORY_POSITION}}` | `Employee.name` / `Employee.position` | user pilih signatory saat generate |

## Klasifikasi section

| Section | data / ai / static | Catatan |
|---|---|---|
| Letterhead | static | |
| Nomor & tanggal surat | data | butuh input manual nomor surat |
| Perihal & kepada | data | |
| Isi/badan surat | data (kemungkinan) | revisi ke `ai` kalau template butuh narasi bebas |
| Tanda tangan | data | |
