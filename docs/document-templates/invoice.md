# Invoice — Bedah Struktur Template

STATUS: TBD - menunggu file `.docx` asli dari user

Dugaan awal berdasarkan pola umum invoice proyek + field
`Project`/`ProjectPhase`. Revisi setelah template asli tersedia di
`storage/document_templates/invoice/`.

## Section list (dugaan awal)

- Kop surat / letterhead — `static`
- Judul "INVOICE" + nomor invoice + tanggal — `data`
- Info klien (nama, alamat, NPWP jika ada) — `data`
- Referensi PO/SO — `data`
- Tabel rincian tagihan (deskripsi item, qty, harga, subtotal) — `data`
- Total, pajak (PPN), grand total — `data`
- Info pembayaran (bank, nomor rekening) — `static` (data perusahaan tetap)
- Tanda tangan — `data`

## Placeholder yang diperkirakan dipakai

- `{{PROJECT_NAME}}`, `{{CLIENT_NAME}}`
- `{{INVOICE_NUMBER}}`, `{{INVOICE_DATE}}`
- `{{PO_SO_NUMBER}}`, `{{PO_SO_DATE}}`
- `{{PHASE_LABEL}}`, `{{DISBURSEMENT_AMOUNT}}`
- `{{SIGNATORY_NAME}}`, `{{SIGNATORY_POSITION}}`

## Mapping ke field Prisma (dugaan)

| Placeholder | Field Prisma | Catatan |
|---|---|---|
| `{{PROJECT_NAME}}` | `Project.name` | |
| `{{CLIENT_NAME}}` | `Project.client` | |
| `{{INVOICE_NUMBER}}` | — | input manual / sequence baru |
| `{{INVOICE_DATE}}` | tanggal generate | |
| `{{PO_SO_NUMBER}}` / `{{PO_SO_DATE}}` | `Project.poSoNumber` / `Project.poSoDate` | |
| `{{PHASE_LABEL}}` | `ProjectPhase.label` | invoice biasanya per-fase/termin |
| `{{DISBURSEMENT_AMOUNT}}` | `ProjectPhase.disbursementAmount` | nilai tagihan termin ini |
| `{{SIGNATORY_*}}` | `Employee.name`/`position` | |

## Klasifikasi section

| Section | data / ai / static | Catatan |
|---|---|---|
| Letterhead | static | |
| Judul, nomor, tanggal | data | nomor input manual |
| Info klien & referensi PO/SO | data | |
| Tabel rincian tagihan | data | sumber `ProjectPhase.disbursementAmount` per termin — perlu konfirmasi struktur tabel saat template ada |
| Total/pajak | data | hitung dari rincian |
| Info pembayaran bank | static | data perusahaan, tetap |
| Tanda tangan | data | |
