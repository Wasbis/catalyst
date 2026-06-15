# Kontrak — Bedah Struktur Template

STATUS: TBD - menunggu file `.docx` asli dari user

Dugaan awal berdasarkan pola umum kontrak kerja proyek engineering +
struktur "SCOPE OF WORK" yang sudah disebut sebagai contoh `aiSections` di
`todo.md` §6.0. Revisi setelah template asli tersedia di
`storage/document_templates/kontrak/`.

## Section list (dugaan awal)

- Kop surat / letterhead — `static`
- Judul kontrak + nomor + tanggal — `data`
- Para pihak (identitas lengkap kedua perusahaan + PIC) — `data`
- Pasal 1 — Definisi — `static` (boilerplate hukum)
- Pasal — Ruang Lingkup Pekerjaan / **SCOPE OF WORK** — `ai` (contoh
  eksplisit dari todo.md §6.0)
- Pasal — Jangka Waktu — `data`
- Pasal — Nilai Kontrak & Cara Pembayaran — `data`
- Pasal — Hak & Kewajiban Para Pihak — `static`
- Pasal — Force Majeure, Penyelesaian Sengketa, dll — `static`
- Lampiran (RAB, timeline, dll) — `data`/`static`
- Blok tanda tangan kedua belah pihak — `data`

## Placeholder yang diperkirakan dipakai

- `{{PROJECT_NAME}}`, `{{CLIENT_NAME}}`
- `{{CONTRACT_NUMBER}}`, `{{CONTRACT_DATE}}`
- `{{CONTRACT_START_DATE}}`, `{{CONTRACT_END_DATE}}`
- `{{CONTRACT_VALUE}}`
- `{{SCOPE_OF_WORK}}` (AI-generated)
- `{{SIGNATORY_PIHAK1_*}}`, `{{SIGNATORY_PIHAK2_*}}`

## Mapping ke field Prisma (dugaan)

| Placeholder | Field Prisma | Catatan |
|---|---|---|
| `{{PROJECT_NAME}}` | `Project.name` | |
| `{{CLIENT_NAME}}` | `Project.client` | |
| `{{CONTRACT_NUMBER}}` | `Project.poSoNumber` (atau nomor kontrak terpisah) | klarifikasi saat template ada |
| `{{CONTRACT_DATE}}` / `{{CONTRACT_START_DATE}}`/`{{CONTRACT_END_DATE}}` | `Project.poSoDate` / `ProjectPhase` tanggal min-max | |
| `{{CONTRACT_VALUE}}` | sum `ProjectPhase.disbursementAmount` atau field baru `Project.contractValue` | perlu cek apakah field ini sudah ada |
| `{{SCOPE_OF_WORK}}` | AI — `entity_data` minimal: `Project.name`, `Project.client`, deskripsi singkat | section AI utama untuk kontrak |
| `{{SIGNATORY_PIHAK1_*}}` | `Employee.name`/`position` | |
| `{{SIGNATORY_PIHAK2_*}}` | — | input manual, pihak klien |

## Klasifikasi section

| Section | data / ai / static | Catatan |
|---|---|---|
| Letterhead, judul, para pihak | data | |
| Pasal Definisi | static | boilerplate hukum |
| **SCOPE OF WORK** | **ai** | contoh utama AI section di kontrak (todo.md §6.0) |
| Jangka waktu, nilai kontrak | data | |
| Hak/kewajiban, force majeure, sengketa | static | boilerplate hukum |
| Lampiran | data/static | |
| Tanda tangan | data | |
