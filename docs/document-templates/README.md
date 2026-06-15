# Document Templates — Bedah Struktur

Folder ini adalah dokumentasi referensi untuk Fase 6 (Document Generator /
Template Engine, lihat `todo.md` §6 dan plan
`.claude/plans/magical-kindling-deer.md`). Setiap file membedah struktur satu
`documentType` template `.docx`: daftar section/heading, placeholder yang
dipakai, mapping ke field Prisma, dan klasifikasi tiap section
(`data`/`ai`/`static`).

## Status per documentType

| File | Status |
|---|---|
| `proposal.md` | Lengkap — dibedah dari 3 file `.docx` nyata di `storage/proposal_templates/` |
| `surat-kerja.md` | TBD — skeleton/dugaan, menunggu template asli |
| `bast.md` | TBD — skeleton/dugaan, menunggu template asli |
| `invoice.md` | TBD — skeleton/dugaan, menunggu template asli |
| `kontrak.md` | TBD — skeleton/dugaan, menunggu template asli |
| `laporan-ctr.md` | TBD — skeleton/dugaan, menunggu template asli |

## Alur update saat template baru datang

1. User taruh file `.docx` asli di `storage/document_templates/<documentType>/`.
2. Admin upload via `/settings/document-templates` (Step 3, Fase 6) — backend
   scan semua paragraph dengan style `Heading 1`/`Heading 2`/`Heading 3` dan
   tampilkan ke `AiSectionsEditor`.
3. Bandingkan hasil scan dengan "Section list (dugaan awal)" di file `.md`
   terkait — update jadi struktur riil (heading exact text, urutan,
   sub-section).
4. Update tabel "Mapping ke field Prisma" kalau ada placeholder baru yang
   belum tercakup field existing — diskusikan apakah perlu field Prisma baru
   atau cukup input manual saat generate.
5. Set `DocumentTemplate.aiSections` sesuai kolom "Klasifikasi section" yang
   sudah direvisi (hanya heading yang ditandai `ai`).
6. Ubah `STATUS:` di bagian atas file dari `TBD` jadi `Lengkap (revisi
   <tanggal>)`.

## Konvensi placeholder (kalau template ditulis dengan `{{...}}`)

- Section block: `{{SECTION_NAME}}` — uppercase, underscore untuk spasi
  (contoh: `{{DURATION_COMMERCIAL}}`, `{{SCOPE_OF_WORK}}`).
- Metadata/field tunggal: `{{FIELD_NAME}}` — uppercase, underscore (contoh:
  `{{PROJECT_NAME}}`, `{{CLIENT_NAME}}`, `{{PO_SO_NUMBER}}`).

Kalau template **tidak** punya `{{...}}` sama sekali (kasus 3 template
proposal existing), `DocxGenerator` otomatis pakai mode section-replace
(cocokkan `Heading 1` dengan nama section di `aiSections`/`sections_to_replace`
— exact match, case-insensitive). Lihat `proposal.md` §2 untuk contoh kasus
mismatch heading.
