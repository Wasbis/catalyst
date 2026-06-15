# BAST (Berita Acara Serah Terima) — Bedah Struktur Template

STATUS: TBD - menunggu file `.docx` asli dari user

Dugaan awal berdasarkan pola umum BAST proyek engineering + field yang ada
di `Project`/`ProjectPhase`/`Employee`. Revisi setelah template asli tersedia
di `storage/document_templates/bast/`.

## Section list (dugaan awal)

- Kop surat / letterhead — `static`
- Judul: "Berita Acara Serah Terima Pekerjaan" + nomor BAST — `data`
- Para pihak (Pihak Pertama / Pihak Kedua — perusahaan & PIC) — `data`
- Uraian pekerjaan yang diserahterimakan (deskripsi, lingkup, fase) — `data`
  atau `ai`
- Tabel item/deliverable yang diserahkan — `data`
- Pernyataan serah terima (boilerplate hukum) — `static`
- Blok tanda tangan kedua belah pihak — `data`

## Placeholder yang diperkirakan dipakai

- `{{PROJECT_NAME}}`, `{{CLIENT_NAME}}`
- `{{BAST_NUMBER}}`, `{{BAST_DATE}}`
- `{{PHASE_LABEL}}` (mis. "CTR-8" — fase mana yang diserahterimakan)
- `{{PHASE_START_DATE}}`, `{{PHASE_END_DATE}}`
- `{{SIGNATORY_PIHAK1_NAME}}`/`{{SIGNATORY_PIHAK1_POSITION}}` (CRI),
  `{{SIGNATORY_PIHAK2_NAME}}`/`{{SIGNATORY_PIHAK2_POSITION}}` (klien — manual)

## Mapping ke field Prisma (dugaan)

| Placeholder | Field Prisma | Catatan |
|---|---|---|
| `{{PROJECT_NAME}}` | `Project.name` | |
| `{{CLIENT_NAME}}` | `Project.client` | |
| `{{BAST_NUMBER}}` | — | input manual saat generate |
| `{{BAST_DATE}}` | tanggal generate (`now()`) | |
| `{{PHASE_LABEL}}` | `ProjectPhase.label` | BAST biasanya per-fase |
| `{{PHASE_START_DATE}}` / `{{PHASE_END_DATE}}` | `ProjectPhase.startDate` / `endDate` | |
| `{{SIGNATORY_PIHAK1_*}}` | `Employee.name` / `Employee.position` | pihak CRI |
| `{{SIGNATORY_PIHAK2_*}}` | — | pihak klien, input manual |

## Klasifikasi section

| Section | data / ai / static | Catatan |
|---|---|---|
| Letterhead | static | |
| Judul & nomor | data | nomor input manual |
| Para pihak | data | pihak klien perlu input manual (belum ada model "Client Contact") |
| Uraian pekerjaan | data | revisi ke `ai` kalau perlu narasi |
| Tabel deliverable | data | sumber: `ProjectChecklistItem` per fase? perlu konfirmasi saat template ada |
| Pernyataan hukum | static | |
| Tanda tangan | data | |
