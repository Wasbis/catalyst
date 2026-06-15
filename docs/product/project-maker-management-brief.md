# Project Maker — Briefing untuk Diskusi dengan Management

> Dokumen ini dibuat untuk bahan diskusi internal dengan management, berdasarkan hasil
> breakdown teknis di `todo.md` & `project-maker-roadmap.md`. Fokusnya: **konsep**,
> **value bisnis**, **konsep data (non-teknis)**, **hal yang perlu didiskusikan**, dan
> **apa yang perlu disiapkan dari sisi management** agar pengembangan bisa jalan lancar.
>
> Status: draft 2026-06-13, siap dipakai sebagai bahan rapat.

---

## 1. Latar Belakang & Konsep

**Kondisi sekarang**: Catalyst ("Cliste") berfungsi sebagai *tender sourcing tool* —
scraping tender dari CIVD & GeoDipa, scoring kecocokan, dan tracking pipeline
`Ditemukan → Ditinjau → Dikejar → Diserahkan → Menang/Kalah/Batal`.

**Masalahnya**: proses **berhenti di "Menang"**. Apa yang terjadi setelah itu — approval
internal, kick-off, PO/SO, pelaksanaan administratif (surat kerja, timesheet, BAST,
laporan termin/CTR), sampai invoicing — **belum punya sistem terpusat**, masih
tersebar/manual (Excel, WA, email, folder pribadi).

Selain itu ada 2 jenis data pendukung yang sifatnya lintas-project tapi "berantakan":
- **Riwayat kontrak & BAST** — sering dibutuhkan berulang sebagai lampiran dokumen
  kualifikasi tender baru, tapi gak ada repository terpusat.
- **Dokumen karyawan** (KTP, BPJS, Ijazah, KK, NPWP) — dibutuhkan untuk lampiran
  personel di dokumen tender/project, tapi tracking masa berlakunya manual.

**Konsep "Project Maker"**: perluas Catalyst dari sekadar *sourcing tool* jadi
**platform administrasi & komersial end-to-end** — dari sourcing → approval →
pelaksanaan-admin → invoicing — plus 2 modul pendukung (riwayat kerja & data karyawan)
dan 2 modul "infrastruktur" (audit trail & document generator).

**Pembagian kerja dengan tim "Project App" (Task by Cliste)**:
| | Project Maker (Catalyst) | Project App |
|---|---|---|
| Fokus | Administrasi, dokumen, status komersial, HR, riwayat kerja | Eksekusi teknis detail (task/sprint per disiplin: IT, engineer, branding) |
| Contoh | "Project X status Invoicing, BAST CTR-3 sudah upload" | "Task desain UI halaman login progress 80%" |

Kedua sistem terhubung lewat link/ID — Project Maker **tidak** menduplikasi detail
teknis Project App.

---

## 2. Value yang Bisa Di-deliver ke Management

| Area | Value bisnis |
|---|---|
| **Project Pipeline** (Fase 1) | Visibility status semua project aktif dalam 1 dashboard (kanban Approval→Closed), bukan tersebar di Excel/WA. Tracking dokumen wajib per project — gampang tahu dokumen apa yang belum lengkap. |
| **Lead Pipeline non-tender** (Fase 1) | Proposal/quotation yang masuk dari jalur non-tender (komunikasi langsung dgn client) sekarang tercatat & ter-tracking, sebelumnya tidak ada sistemnya sama sekali. |
| **Work-Experience Library** (Fase 2) | Repository searchable kontrak & BAST — saat nyusun dokumen kualifikasi tender baru, tim tinggal cari & pakai, gak perlu nyari-nyari file lama. Sekaligus jadi sumber data **showcase portfolio di website Cliste**. |
| **HR Module** (Fase 3) | Dashboard kelengkapan dokumen karyawan (KTP/BPJS/Ijazah/KK/NPWP) + reminder otomatis sebelum expired — mengurangi risiko dokumen personel kadaluarsa saat dibutuhkan untuk tender. |
| **Integrasi Project App** (Fase 4) | Sinkronisasi otomatis: project yang disetujui di Project Maker langsung muncul di Project App tanpa input ulang. Laporan progress (S-Curve/Timesheet) bisa diakses langsung dari Project Maker. |
| **Audit Trail** (Fase 5) | Akuntabilitas — bisa lihat siapa mengubah data apa dan kapan, untuk semua project/dokumen. Penting untuk kontrol internal & investigasi kalau ada masalah data. |
| **Document Generator** (Fase 6) | Percepat pembuatan dokumen administratif berulang (Surat Kerja, BAST, Invoice, Kontrak, Laporan CTR, Proposal) — isi otomatis dari data project, AI hanya untuk bagian narasi yang memang perlu. Mengurangi waktu tim admin/management nyusun dokumen dari nol setiap kali. |

---

## 3. Konsep Data (Ringkas, Non-Teknis)

Supaya gampang dibayangkan, ini istilah-istilah utama yang akan dipakai (tanpa istilah
teknis database):

- **Project** — representasi satu pekerjaan/kontrak, dari status *Approval* sampai
  *Closed*. Bisa berasal dari tender yang dimenangkan, atau dari jalur non-tender
  (lead → proposal → quotation).
- **Lead (non-tender)** — pekerjaan yang belum jadi "Project resmi", masih di tahap
  proposal/quotation dengan client.
- **Phase / CTR** — untuk project jangka panjang dengan pencairan & laporan bertahap
  (per termin). Satu Project bisa punya banyak Phase/CTR.
- **Checklist Dokumen** — daftar dokumen yang wajib ada untuk satu Project (Surat
  Kerja, BAST, Invoice, dll). **Daftarnya beda-beda per project** — diisi manual sesuai
  kebutuhan client, bukan template baku.
- **Work-Experience Record** — satu entri "pengalaman kerja" (nama project, client,
  kontrak, BAST) yang bisa dipakai berulang sebagai lampiran tender baru, dan/atau
  ditampilkan sebagai portfolio di website Cliste.
- **Employee + Dokumen Karyawan** — data karyawan beserta status kelengkapan dokumen
  pribadinya (valid / mendekati expired / expired / belum ada).
- **Audit Log** — catatan "siapa mengubah apa, kapan" untuk semua data di atas.
- **Document Template & Generated Document** — template dokumen (.docx) yang
  di-upload tim, dan hasil generate (otomatis isi data + opsional narasi AI) per
  Project/Checklist.

---

## 4. Roadmap Fase (Ringkas)

| Fase | Scope | Status |
|---|---|---|
| **Fase 1** | Project Pipeline (kanban Approval→Closed) + Lead Pipeline non-tender + Checklist Dokumen + Phase/CTR | Siap dikerjakan, tidak ada blocker |
| **Fase 2** | Work-Experience Library (kontrak/BAST searchable + showcase website) | Siap, independen — bisa paralel dgn Fase 1 |
| **Fase 3** | HR Module (data karyawan + dokumen + reminder expiry) | Siap, independen |
| **Fase 4** | Integrasi Project App (sinkronisasi project, link laporan progress) | **Blocked** — menunggu kontrak API dari tim Project App |
| **Fase 5** | Audit Trail (siapa ubah apa & kapan) | Siap setelah Fase 1-3 punya cukup titik untuk dicatat |
| **Fase 6** | Document Generator (template engine, hemat AI token) | Sengaja **paling akhir** — value maksimal setelah Fase 1-3 punya data |

---

## 5. Hal yang Perlu Didiskusikan / Diputuskan dengan Management

### A. Koordinasi dengan tim **Project App** (untuk Fase 4 — saat ini blocking)
1. Alamat & cara akses API Project App untuk membuat project otomatis.
2. Mekanisme keamanan komunikasi antar sistem (token khusus, bukan login user biasa).
3. Project dikirim ke Project App pada tahap apa — saat "Approval" atau saat
   "Kick-off"?
4. Apakah Project App bisa memberi notifikasi balik ke Project Maker kalau status
   project berubah di sisi mereka (closed, dll)?
5. Penyamaan daftar status project antar 2 sistem.
6. Apakah Project App punya konsep "fase/termin" yang bisa disinkronkan dengan
   Phase/CTR di Project Maker?
7. Apakah laporan progress (S-Curve/Timesheet) di Project App punya link langsung
   yang bisa diakses dari Project Maker tanpa login ulang?
8. Apakah ada cara otomatis untuk ambil/arsip laporan progress per termin (export)?
9. Cara mencocokkan identitas user antar 2 sistem (pakai email, atau ID standar dari
   sistem login terpusat Microsoft)?

### B. Koordinasi dengan tim **Admin Website** (Area 6 — recruitment & showcase)
- Endpoint/akses API: siapa yang minta data ke siapa (Project Maker minta data
  pelamar yang sudah "accepted", vs Project Maker kirim data showcase ke Admin
  Website).
- Field data pelamar sudah jelas (nama, posisi, pendidikan, dll) — perlu konfirmasi
  cara aksesnya.

### C. Kebijakan Internal yang Perlu Diputuskan
- **SSO terpusat (login satu akun Microsoft untuk semua sistem)** — kapan
  diprioritaskan? Butuh koordinasi dengan tim IT yang mengelola akun Microsoft
  perusahaan.
- **Tracking aktivitas user (siapa online, halaman apa yang dibuka)** — apa
  tujuannya? Kalau untuk "lihat siapa lagi kerja di data yang sama" (kolaborasi) vs
  untuk "monitoring kinerja karyawan" — ini menentukan desain & perlu kejelasan
  kebijakan ke karyawan kalau opsi kedua.
- **Berapa lama data log/audit disimpan?** — saat ini diasumsikan disimpan permanen
  (tidak ada batas waktu), konfirmasi apakah ini sudah final.

### D. Operasional — Checklist Dokumen per Project
- Sudah disepakati: **daftar dokumen wajib per project ditentukan manual**,
  berdasarkan info dari client, lalu diinput oleh tim administratif/management.
- **Perlu disiapkan**: siapa di tim administratif/management yang akan bertanggung
  jawab mengisi checklist ini setiap ada project baru? Ini jadi kebiasaan kerja baru
  (bukan one-time setup).

---

## 6. Yang Perlu Disiapkan dari Management

1. **Data historis CTR1-7** — sudah dikonfirmasi tersedia lengkap (catatan finance).
   Perlu diserahkan/diberi akses ke tim development untuk proses input data ke sistem.
2. **Template dokumen `.docx`** untuk Fase 6 (Document Generator) — Surat Kerja, BAST,
   Invoice, Kontrak, Laporan CTR (format yang biasa dipakai sekarang). Untuk
   masing-masing, tentukan juga **bagian mana yang isinya selalu sama/data project**
   (otomatis) vs **bagian mana yang butuh narasi/penjelasan custom** (baru pakai AI).
3. **PIC untuk koordinasi tim Project App** — untuk menjawab pertanyaan di §5.A,
   supaya Fase 4 tidak terus blocked.
4. **PIC untuk koordinasi tim Admin Website** — untuk §5.B.
5. **Keputusan kebijakan** di §5.C (SSO timeline, tujuan activity tracking, retensi
   audit log).
6. **Komitmen operasional** di §5.D — proses pengisian checklist dokumen per project
   jadi bagian SOP tim administratif/management ke depannya.
7. (Kalau memungkinkan) **Daftar dokumen pribadi karyawan yang wajib di-track** (Fase
   3) — konfirmasi 5 jenis dokumen (KTP/BPJS/Ijazah/KK/NPWP) sudah cukup, atau ada
   tambahan?

---

## 7. Catatan Data Sensitif (untuk Awareness Management)

- Dokumen karyawan (KTP, NPWP, KK, dll — Fase 3) adalah **data pribadi** — akan
  disimpan di lokasi terpisah (tidak publik), dengan akses terbatas hanya untuk
  role HR/Admin.
- Audit Trail (Fase 5) membantu pelacakan kalau ada masalah/insiden terkait data ini.
- Tidak ada perubahan ke kebijakan keamanan login yang sudah ada — sudah sesuai
  best-practice (sesi login terenkripsi, password ter-hash).

---

## 8. Prompt untuk Generate ke .docx / .pptx

Salin prompt di bawah, lalu jalankan di tool AI yang bisa generate dokumen (atau minta
saya jalankan di sesi terpisah dengan tool yang sesuai).

### Untuk Word (.docx) — dokumen briefing lengkap

```
Tolong ubah isi markdown berikut menjadi dokumen Word (.docx) formal untuk
diskusi internal dengan management. Gunakan:
- Cover page sederhana: judul "Project Maker — Briefing untuk Management",
  tanggal 2026-06-13.
- Heading hierarchy sesuai struktur markdown (H1 = judul bagian besar, H2 = sub-bagian).
- Tabel tetap jadi tabel Word (gunakan style tabel rapi, header row bold).
- Bagian "5. Hal yang Perlu Didiskusikan" dan "6. Yang Perlu Disiapkan dari
  Management" dibuat dalam bentuk checklist/numbered list yang jelas, karena akan
  dipakai sebagai bahan rapat dan ditandai satu-satu saat dibahas.
- Bahasa: Bahasa Indonesia, gaya formal-bisnis (bukan teknis/developer).
- Jangan tampilkan bagian "8. Prompt untuk Generate..." di hasil dokumen.

[paste isi project-maker-management-brief.md di sini]
```

### Untuk PowerPoint (.pptx) — presentasi ringkas

```
Tolong ubah isi markdown berikut menjadi slide deck PowerPoint (.pptx) untuk
presentasi ke management, target ±12-15 slide. Struktur yang disarankan:

1. Slide judul: "Project Maker — Dari Tender Sourcing ke Platform Administrasi
   End-to-End"
2. Slide "Latar Belakang & Masalah" (dari bagian 1)
3. Slide "Konsep Project Maker" (diagram sederhana: Sourcing -> Approval -> ...
   -> Invoicing, + 2 modul pendukung)
4. 1 slide per area value (bagian 2) — ringkas jadi 1 kalimat value + 1 contoh
5. Slide "Konsep Data" (bagian 3) — sederhanakan jadi diagram/daftar istilah,
   hindari detail teknis
6. Slide "Roadmap 6 Fase" (bagian 4) — timeline/tabel visual
7. 1-2 slide "Yang Perlu Didiskusikan" (bagian 5, ringkas per kategori A-D)
8. 1 slide "Yang Perlu Disiapkan dari Management" (bagian 6, checklist ringkas)
9. Slide penutup: "Next Steps"

Gunakan bahasa Indonesia, gaya bisnis (bukan teknis), minimalkan teks per slide
(bullet pendek, bukan paragraf).

[paste isi project-maker-management-brief.md di sini]
```
