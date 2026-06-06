# CLISTE
## Product Requirements Document
**Ekosistem Digital Internal — Tender Platform & Internal Workspace**

| Field | Detail |
|---|---|
| Versi | 1.0 — Draft |
| Tanggal | 31 Mei 2026 |
| Status | Draft — Untuk Review Internal |
| Cakupan | App 1: Tender Platform · App 2: Internal Workspace |
| Fase | Phase 1 (Core) · Phase 2 (AI & Analytics) · Phase 3 (Knowledge Base) |
| Bahasa | Bahasa Indonesia |

> ⚠️ **Rahasia Internal** — Tidak untuk Disebarluaskan

---

## Riwayat Revisi

| Versi | Tanggal | Deskripsi Perubahan | Penulis |
|---|---|---|---|
| 1.0 | 31 Mei 2026 | Versi awal — mencakup App 1 Phase 1–2, App 2 Phase 1–3 | — |

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [App 1 — Tender Platform](#2-app-1--tender-platform)
3. [App 2 — Internal Workspace](#3-app-2--internal-workspace)
4. [Integrasi Antar Aplikasi](#4-integrasi-antar-aplikasi)
5. [Roadmap & Urutan Pengembangan](#5-roadmap--urutan-pengembangan)

---

## 1. Pendahuluan

### 1.1 Latar Belakang

Cliste adalah perusahaan konsultan yang secara aktif mengikuti proses tender pengadaan dari berbagai instansi pemerintah maupun swasta, serta mengelola beberapa proyek aktif secara bersamaan.

**Kondisi saat ini (pain points):**

- Pencarian tender dilakukan secara manual melalui kunjungan rutin ke portal LPSE, CIVD, dan Geodipa
- Pengelolaan proyek tersebar di berbagai platform yang tidak terintegrasi
- Dokumen proyek disimpan secara tidak terstruktur
- Komunikasi dengan klien masih bergantung pada WhatsApp dan email

**Dampak:** peluang tender yang terlewat, beban kerja yang tidak termonitor, dokumen yang sulit ditemukan kembali, serta tidak adanya transparansi terstruktur antara tim Cliste dan klien.

Dokumen ini mendefinisikan kebutuhan produk untuk **dua aplikasi terintegrasi** yang akan membangun ekosistem digital internal Cliste.

### 1.2 Tujuan Dokumen

PRD ini bertujuan untuk:

1. Mendefinisikan kebutuhan fungsional dan non-fungsional setiap fitur secara rinci
2. Menjadi acuan utama pengembang selama proses pembangunan
3. Mendokumentasikan user stories dan kriteria penerimaan yang terukur
4. Menjadi dasar kesepakatan lingkup pekerjaan antara pengembang dan pemangku kepentingan

### 1.3 Gambaran Ekosistem

| Aplikasi | Fungsi Utama | Pengguna |
|---|---|---|
| App 1 — Tender Platform | Otomatisasi pencarian, pencocokan KBLI, dan pengelolaan tender | Manajemen, PM, Business Dev |
| App 2 — Internal Workspace | Manajemen proyek, dokumen, dan transparansi klien dalam satu platform | Seluruh staf internal + Klien (portal) |

Kedua aplikasi berbagi satu **database PostgreSQL**, sistem autentikasi, dan penyimpanan file **(MinIO)**. Satu-satunya titik integrasi adalah konversi tender yang dimenangkan menjadi proyek aktif di App 2.

### 1.4 Target Pengguna

| Peran | Deskripsi | Akses App |
|---|---|---|
| Manajemen / Direktur | Pantau tender & proyek, setujui keputusan strategis | App 1 + App 2 |
| Project Manager (PM) | Kelola tender, buat & pimpin proyek, koordinasi tim | App 1 + App 2 |
| Engineer IT / Sipil | Kerjakan task proyek, unggah dokumen teknis | App 2 |
| Tim Administrasi | Kelola dokumen, arsip MoM, administrasi proyek | App 2 |
| Finance | Pantau dokumen keuangan, invoice, kontrak | App 2 |
| Branding & Communication | Kelola proposal dan materi presentasi | App 1 + App 2 |
| Klien (Eksternal) | Pantau progres, baca MoM, berikan persetujuan | App 2 (Portal saja) |

---

## 2. App 1 — Tender Platform

### 2.1 Gambaran Umum

Tender Platform mengotomatiskan seluruh proses pengelolaan tender di Cliste, mulai dari penemuan peluang hingga pengiriman proposal. Sistem bekerja secara proaktif di latar belakang sehingga tim hanya perlu fokus pada keputusan strategis.

### 2.2 Platform Tender yang Didukung

| Platform | URL / Sumber | Jenis Tender | Prioritas |
|---|---|---|---|
| LPSE (e-Procurement) | `lpse.*.go.id` (multi-instansi) | Pengadaan pemerintah pusat & daerah | Utama |
| CIVD | `civd.pu.go.id` | Konstruksi & infrastruktur PUPR | Utama |
| Geodipa | `procurement.geodipa.co.id` | Pengadaan BUMN Geodipa | Sekunder |
| Input Manual | — | Tender dari jaringan atau referensi langsung | Pelengkap |

---

### PHASE 1 · Core Tender Management

> Fondasi sistem: scraping otomatis dari portal tender, pencocokan KBLI dengan profil perusahaan, dan pengelolaan status tender oleh tim.

#### 2.3 Deskripsi Fitur Phase 1

##### 2.3.1 Tender Discovery — Scraping Otomatis

Sistem secara otomatis mengumpulkan data tender dari portal-portal yang dikonfigurasi menggunakan **Playwright** untuk merender halaman berbasis JavaScript.

- Penjadwalan otomatis per platform: LPSE setiap 6 jam, CIVD setiap 12 jam, Geodipa setiap 24 jam
- Trigger manual dari dashboard oleh PM atau Admin kapan pun dibutuhkan
- Normalisasi data dari berbagai format sumber ke schema standar internal (judul, instansi, KBLI, budget, deadline)
- Deduplication: tender yang sama tidak dimasukkan ulang ke database
- Change detection: perubahan budget, deadline, atau status pada tender yang sudah ada diperbarui secara otomatis
- Logging lengkap setiap aktivitas scraping (sukses/gagal, jumlah tender ditemukan/baru)

##### 2.3.2 KBLI Matching & Scoring

Sistem menganalisis kesesuaian antara persyaratan tender dengan profil, KBLI, dan kapabilitas Cliste, menghasilkan skor prioritas.

- Ekstraksi kode KBLI dari teks deskripsi tender menggunakan pencocokan pola
- Pencocokan KBLI tender dengan daftar KBLI aktif yang dimiliki Cliste
- Perhitungan skor kesesuaian keseluruhan **(0–100)** berdasarkan: kecocokan KBLI, estimasi budget vs kapasitas, dan lokasi
- Klasifikasi rekomendasi otomatis:
  - ✅ **Kejar** — skor ≥ 70
  - 🟡 **Tinjau** — skor 40–69
  - ❌ **Lewati** — skor < 40
- Notifikasi otomatis ke Manajemen dan PM saat ditemukan tender dengan skor ≥ 70

##### 2.3.3 Tender Tracking & Manajemen Status

Antarmuka terpusat untuk mengelola status keputusan setiap tender, menggantikan pemantauan yang sebelumnya tersebar di spreadsheet dan WhatsApp.

- Papan Kanban dengan kolom status:  
  `Ditemukan → Ditinjau → Dikejar → Diserahkan → Menang / Kalah / Batal`
- Perbarui status, tambah catatan, dan lampirkan dokumen pendukung per tender
- Filter dan pencarian berdasarkan status, platform, skor, deadline, dan kata kunci
- Konversi tender menang ke proyek aktif di App 2 dengan satu formulir terpadu

#### 2.4 Kebutuhan Fungsional — App 1 Phase 1

| ID | Deskripsi Kebutuhan | Prioritas |
|---|---|---|
| RF-T-001 | Sistem melakukan scraping otomatis dari LPSE, CIVD, dan Geodipa sesuai jadwal yang dikonfigurasi | Wajib |
| RF-T-002 | Pengguna dengan peran PM atau Admin dapat memicu scraping manual dari dashboard | Wajib |
| RF-T-003 | Data tender yang diekstrak dinormalisasi ke schema standar: judul, instansi, KBLI, estimasi budget, deadline, URL sumber | Wajib |
| RF-T-004 | Sistem mencegah duplikasi menggunakan kombinasi unik platform sumber dan ID sumber | Wajib |
| RF-T-005 | Sistem mendeteksi dan memperbarui record tender yang mengalami perubahan data (budget, deadline, status) | Tinggi |
| RF-T-006 | Sistem mengekstrak kode KBLI dari teks tender dan mencocokkannya dengan daftar KBLI Cliste | Wajib |
| RF-T-007 | Sistem menghitung skor kesesuaian (0–100) dan klasifikasi rekomendasi untuk setiap tender | Wajib |
| RF-T-008 | Tender baru dengan skor ≥70 memicu notifikasi ke pengguna dengan peran Manajemen dan PM | Wajib |
| RF-T-009 | Pengguna dapat memperbarui status tender melalui papan Kanban dengan drag-and-drop | Wajib |
| RF-T-010 | Pengguna dapat menambahkan catatan teks dan melampirkan dokumen pendukung ke setiap tender | Tinggi |
| RF-T-011 | Tender berstatus 'Menang' dapat dikonversi ke proyek App 2 melalui formulir dalam satu halaman | Wajib |
| RF-T-012 | Sistem mencatat log setiap job scraping beserta statistik (tender ditemukan, baru, diperbarui) | Tinggi |
| RF-T-013 | Admin menerima notifikasi saat scraper gagal dua kali berturut-turut pada platform yang sama | Tinggi |
| RF-T-014 | Pengguna dapat memasukkan tender secara manual untuk peluang dari luar portal digital | Sedang |

#### 2.5 User Stories — App 1 Phase 1

| ID | Sebagai... | Saya ingin... | Agar... | Prioritas |
|---|---|---|---|---|
| US-T-001 | Sistem | Berjalan otomatis setiap hari | Tim tidak perlu cek portal manual | Wajib |
| US-T-002 | PM | Melihat tender skor tertinggi di atas | Bisa langsung fokus pada peluang terbaik | Wajib |
| US-T-003 | PM | Memperbarui status tender satu klik | Tim tahu tender mana yang sedang dikerjakan | Wajib |
| US-T-004 | PM | Konversi tender menang ke proyek | Tidak ada data yang perlu diinput ulang | Wajib |
| US-T-005 | Manajemen | Terima notifikasi tender relevan baru | Bisa memberi arahan lebih cepat | Wajib |
| US-T-006 | Admin | Lihat status dan riwayat semua job scraping | Bisa mendeteksi masalah lebih awal | Tinggi |
| US-T-007 | Admin | Picu ulang scraping secara manual | Dapat data terbaru kapan pun dibutuhkan | Tinggi |
| US-T-008 | PM | Tambah catatan strategis ke tender | Konteks keputusan tersimpan terdokumentasi | Tinggi |

#### 2.6 Kebutuhan Non-Fungsional — App 1 Phase 1

- **Ketersediaan scraper:** minimum 95% sesuai jadwal terkonfigurasi
- **Waktu respons UI** daftar tender: P95 < 1 detik
- **Toleransi kegagalan:** setiap request ke portal target di-retry otomatis hingga 3 kali sebelum dinyatakan gagal
- **Politeness:** minimum delay 2 detik antar request ke server yang sama untuk menghindari pemblokiran IP
- **Keamanan:** fitur admin scraping hanya dapat diakses oleh peran Admin dan Manajemen

#### 2.7 Kriteria Penerimaan — App 1 Phase 1

| ID | Kriteria Penerimaan | Status |
|---|---|---|
| KP-T-001 | Scraper LPSE berhasil mengekstrak minimal 20 tender dari satu instansi tanpa error | `[ ]` |
| KP-T-002 | Scraping tender yang sama dua kali tidak menghasilkan duplikasi data di database | `[ ]` |
| KP-T-003 | Skor kesesuaian tampil pada setiap kartu tender di papan Kanban | `[ ]` |
| KP-T-004 | Tender dengan skor ≥70 menghasilkan notifikasi yang diterima pengguna dalam waktu < 60 detik | `[ ]` |
| KP-T-005 | Pembaruan status tender tercermin di papan Kanban tanpa refresh halaman penuh | `[ ]` |
| KP-T-006 | Konversi tender ke proyek App 2 berhasil dan data tender terpindah dengan benar | `[ ]` |
| KP-T-007 | Log kegagalan scraper tercatat dan notifikasi admin terkirim pada kegagalan kedua berturut-turut | `[ ]` |

---

### PHASE 2 · Proposal AI Generator

> Menambahkan kemampuan AI untuk menghasilkan draft proposal otomatis berdasarkan data tender dan template dokumen yang dimiliki Cliste.

#### 2.8 Deskripsi Fitur Phase 2

##### 2.8.1 Manajemen Template Proposal

- Unggah template proposal DOCX dengan placeholder variabel dalam format `{{nama_variabel}}`
- Kategorisasi template per jenis pekerjaan: infrastruktur, sistem informasi, konsultansi
- Versioning template: setiap pembaruan menghasilkan versi baru tanpa menghapus yang lama
- Pratinjau template langsung dari antarmuka sebelum digunakan untuk generasi

##### 2.8.2 Generasi Proposal Berbasis AI

- Pilih tender dan template, sistem mengisi placeholder dari data tender secara otomatis
- AI menghasilkan narasi bagian metodologi, pendekatan teknis, dan pemahaman lingkup pekerjaan
- Hasil berupa file DOCX yang dapat langsung diedit oleh PM atau tim teknis
- Generasi berjalan **asinkron**: pengguna mendapat notifikasi saat proposal selesai dibuat
- Semua proposal yang dihasilkan tersimpan dalam riwayat terhubung ke tender asalnya
- Integrasi dengan Document Management App 2: proposal yang disetujui tersimpan otomatis

#### 2.9 Kebutuhan Fungsional — App 1 Phase 2

| ID | Deskripsi Kebutuhan | Prioritas |
|---|---|---|
| RF-AI-001 | Pengguna dapat mengunggah template DOCX dengan placeholder format `{{nama_variabel}}` | Wajib |
| RF-AI-002 | Sistem mengekstrak daftar variabel dari template yang diunggah secara otomatis | Wajib |
| RF-AI-003 | Pengguna memilih tender dan template, lalu memicu proses generasi proposal | Wajib |
| RF-AI-004 | Sistem mengisi variabel dari data tender (judul, instansi, KBLI, budget) secara otomatis | Wajib |
| RF-AI-005 | AI menghasilkan narasi bagian metodologi berdasarkan konteks tender dan profil perusahaan | Tinggi |
| RF-AI-006 | Hasil generasi berupa file DOCX yang dapat diunduh dan diedit secara bebas | Wajib |
| RF-AI-007 | Proses generasi berjalan asinkron dengan notifikasi saat selesai (< 60 detik) | Tinggi |
| RF-AI-008 | Semua proposal tersimpan dalam riwayat terhubung ke tender dan dapat diakses ulang | Tinggi |

#### 2.10 Kriteria Penerimaan — App 1 Phase 2

- Template dengan minimal 5 placeholder diunggah dan variabelnya terdeteksi secara otomatis
- Generasi proposal selesai dalam waktu < 60 detik untuk dokumen 10 halaman
- Semua placeholder dalam proposal tergantikan dengan data yang benar dari tender yang dipilih
- Proposal yang dihasilkan tersimpan di Document Management App 2 secara otomatis

---

## 3. App 2 — Internal Workspace

### 3.1 Gambaran Umum

Internal Workspace adalah platform terpusat yang menjadi ruang kerja digital sehari-hari seluruh staf internal Cliste. Filosofi: **satu tempat untuk semua** — tidak ada lagi informasi yang tersebar di WhatsApp, email, Google Drive, atau berbagai spreadsheet.

App 2 terdiri dari tiga modul dalam satu platform:

- **Project Management** — inti workspace
- **Document Management** — penyimpanan dokumen terstruktur
- **Client Portal** — antarmuka transparansi untuk klien eksternal

### 3.2 Matriks Peran & Akses — App 2

| Peran | Hak Akses | Fungsi Utama |
|---|---|---|
| Superadmin | Penuh atas semua fitur dan konfigurasi sistem | Manajemen user, konfigurasi sistem, audit log |
| Manajemen | Baca semua proyek aktif, setujui permintaan, akses laporan | Pantau portofolio proyek, workload divisi |
| Project Manager | Kelola proyek yang dipimpin, buat task, unggah dokumen, publikasi MoM | Koordinasi tim, pelaporan ke klien |
| Engineer | Akses proyek yang diikuti, update status task, unggah dokumen teknis | Eksekusi pekerjaan, dokumentasi teknis |
| Administrasi | Kelola dokumen lintas proyek, arsip MoM | Pengelolaan arsip dan administrasi |
| Finance | Akses dokumen keuangan (kontrak, invoice, PO) | Administrasi keuangan proyek |
| Branding | Akses dokumen presentasi dan materi komunikasi | Pengelolaan materi visual dan proposal |
| Klien | Baca milestone & progres proyek tertentu, unduh MoM, berikan persetujuan | Pantau progres, tanda tangan digital |

---

### PHASE 1 · MODUL A · Project Management

> Inti App 2: pengelolaan proyek, task, milestone, workload tim, dan koordinasi lintas divisi dalam satu workspace.

#### 3.3 Deskripsi Fitur — Project Management

##### 3.3.1 Manajemen Proyek & Task

- Buat proyek dengan informasi lengkap: nama, klien, kode proyek, PM penanggung jawab, tanggal mulai/selesai, dan estimasi anggaran
- Tambah anggota tim ke proyek dengan peran: PM, Lead, Anggota, Reviewer, atau Observer
- Buat milestone dengan target tanggal dan persentase progres otomatis berdasarkan task yang selesai
- Buat task dengan: judul, deskripsi, penugasan ke anggota, prioritas (Rendah/Sedang/Tinggi/Kritis), estimasi jam, dan deadline
- Dukungan **subtask** (task di dalam task) untuk pekerjaan yang perlu dipecah lebih lanjut
- **Papan Kanban:** kolom `Belum Mulai → Sedang Dikerjakan → Review → Selesai` dengan drag-and-drop
- **Tampilan Daftar:** tabel terstruktur dengan filter dan sortir per kolom
- **Tampilan Milestone:** progress bar per milestone dengan daftar task yang terhubung
- Kolom komentar di setiap task untuk diskusi kontekstual antar anggota tim

##### 3.3.2 Workload Management

- Matriks workload mingguan: estimasi jam terkonfirmasi vs jam tersedia untuk setiap anggota tim aktif
- Indikator utilisasi berwarna:
  - 🟢 **Hijau** — di bawah 80%
  - 🟡 **Kuning** — 80–95%
  - 🔴 **Merah** — di atas 95%
- Peringatan otomatis saat PM akan menugaskan task ke anggota dengan utilisasi > 90%
- Tampilan agregat per divisi untuk manajemen tingkat atas (tanpa detail individu)

##### 3.3.3 Permintaan Lintas Divisi

- Formulir permintaan: deskripsi kebutuhan, divisi yang dituju, deadline, dan tingkat urgensi
- Notifikasi ke pimpinan divisi yang dituju untuk persetujuan atau penolakan dengan alasan
- Setelah disetujui, task otomatis terbuat dan masuk ke antrian kerja divisi yang dituju

---

### PHASE 1 · MODUL B · Document Management

> Modul penyimpanan semua dokumen proyek secara terstruktur, terversionkan, terkontrol aksesnya, dan siap diindeks untuk pencarian berbasis AI di Phase 3.

#### 3.4 Deskripsi Fitur — Document Management

##### 3.4.1 Upload & Versioning

- Unggah satu atau beberapa file sekaligus via drag-and-drop atau klik
- Metadata wajib saat unggah: tipe dokumen (sesuai taksonomi), fase proyek (Perencanaan/Pelaksanaan/Penutupan), deskripsi singkat
- Setiap unggahan ulang pada dokumen yang sama otomatis membuat versi baru (v1, v2, v3, dst.) tanpa menghapus versi lama
- Riwayat versi dapat dilihat dan versi lama dapat diunduh kapan pun
- PM dapat melakukan rollback ke versi tertentu jika diperlukan
- File disimpan langsung ke object storage (MinIO) melalui **presigned URL** tanpa melewati server aplikasi

##### 3.4.2 Akses & Keamanan

- Akses default berdasarkan keanggotaan proyek: semua anggota proyek dapat mengakses dokumen dalam proyek tersebut
- Penandaan dokumen sebagai **Rahasia**: hanya PM dan Manajemen yang dapat mengaksesnya
- PM dapat menandai dokumen tertentu sebagai **dapat dilihat klien** melalui Client Portal
- Semua unduhan menggunakan presigned URL yang kedaluwarsa dalam 1 jam — tidak ada tautan permanen
- Setiap akses unduhan tercatat di **audit log**

##### 3.4.3 Pencarian Dokumen

- Pencarian berdasarkan nama file, tipe dokumen, fase proyek, dan tanggal unggah
- Pencarian **full-text** berdasarkan isi dokumen untuk PDF dan DOCX yang sudah diindeks
- Filter: per proyek, per tipe dokumen, per pengunggah, dan per rentang tanggal

---

### PHASE 1 · MODUL C · Client Portal

> Antarmuka khusus klien: transparansi progres proyek, akses MoM resmi, dan mekanisme persetujuan formal yang terdokumentasi.

#### 3.5 Deskripsi Fitur — Client Portal

##### 3.5.1 Visibilitas Progres Proyek

- Dashboard per proyek: status keseluruhan, daftar milestone, persentase progres, dan tanggal target
- Klien hanya dapat melihat milestone dan status tingkat tinggi — bukan task-task teknis internal
- Akses dokumen yang secara eksplisit ditandai oleh PM sebagai dapat dilihat klien
- Login klien menggunakan **token akses per-proyek** yang dihasilkan PM, tanpa akun internal

##### 3.5.2 MoM & Rekaman Rapat

- PM membuat catatan rapat dengan struktur: agenda, pembahasan, keputusan, dan tindak lanjut
- Alur persetujuan MoM: `Draft → Review PM → Disetujui → Diterbitkan ke Klien`
- Klien dapat membaca dan mengunduh MoM yang sudah diterbitkan
- Action item dari MoM yang ditandai sebagai terlihat klien muncul di dashboard portal
- Ekspor MoM ke format PDF dengan format resmi perusahaan

##### 3.5.3 Persetujuan & Sign-off

- PM dapat mengirimkan permintaan persetujuan ke klien untuk milestone atau dokumen tertentu
- Klien dapat memberikan persetujuan atau penolakan disertai komentar langsung dari portal
- Semua keputusan persetujuan tersimpan dengan timestamp dan bersifat **tidak dapat diubah**

#### 3.6 Kebutuhan Fungsional — App 2 Phase 1

| ID | Deskripsi Kebutuhan | Modul | Prioritas |
|---|---|---|---|
| RF-PM-001 | Pengguna dapat membuat proyek dengan data lengkap dan mengundang anggota tim | PM | Wajib |
| RF-PM-002 | Pengguna dapat membuat task dengan penugasan, prioritas, estimasi jam, dan deadline | PM | Wajib |
| RF-PM-003 | Status task dapat diperbarui melalui drag-and-drop di papan Kanban | PM | Wajib |
| RF-PM-004 | Pembaruan status task menghitung ulang persentase penyelesaian milestone secara otomatis | PM | Wajib |
| RF-PM-005 | Sistem menampilkan matriks workload mingguan dengan indikator utilisasi berwarna | PM | Wajib |
| RF-PM-006 | Peringatan muncul saat penugasan akan melebihi kapasitas 90% anggota tim | PM | Tinggi |
| RF-PM-007 | Pengguna dapat mengajukan permintaan bantuan ke divisi lain melalui formulir | PM | Tinggi |
| RF-PM-008 | Pengguna dapat mengunggah dokumen ke proyek dengan metadata yang dipersyaratkan | DM | Wajib |
| RF-PM-009 | Unggahan ulang dokumen membuat versi baru tanpa menghapus versi sebelumnya | DM | Wajib |
| RF-PM-010 | Dokumen dapat ditandai sebagai Rahasia atau Dapat Dilihat Klien oleh PM | DM | Wajib |
| RF-PM-011 | Unduhan dokumen menggunakan presigned URL dengan masa berlaku 1 jam | DM | Wajib |
| RF-PM-012 | Klien login menggunakan token akses per-proyek yang dibuat oleh PM | Portal | Wajib |
| RF-PM-013 | Portal klien menampilkan milestone proyek dan status progres secara akurat | Portal | Wajib |
| RF-PM-014 | MoM harus melalui alur Draft → Disetujui sebelum dapat diterbitkan ke klien | Portal | Wajib |
| RF-PM-015 | Klien dapat memberikan persetujuan atau penolakan atas permintaan yang dikirimkan PM | Portal | Wajib |

#### 3.7 User Stories — App 2 Phase 1

| ID | Sebagai... | Saya ingin... | Agar... | Prioritas |
|---|---|---|---|---|
| US-PM-001 | PM | Buat proyek dari tender yang dimenangkan | Data tidak perlu diinput ulang dari nol | Wajib |
| US-PM-002 | Engineer | Lihat semua task yang ditugaskan ke saya | Tidak perlu tanya ke PM satu per satu | Wajib |
| US-PM-003 | Engineer | Perbarui status task dalam satu klik | Update progres tidak terasa merepotkan | Wajib |
| US-PM-004 | PM | Lihat utilisasi tim sebelum assign task | Tidak ada anggota yang kelelahan tanpa sadar | Wajib |
| US-PM-005 | Manajemen | Lihat semua proyek aktif dan statusnya | Pantau portofolio tanpa rapat status harian | Wajib |
| US-PM-006 | Engineer | Unggah laporan teknis ke proyek | Dokumen tidak hilang di folder lokal | Wajib |
| US-PM-007 | PM | Terbitkan MoM setelah saya setujui | Klien terima dokumen resmi, bukan foto WA | Wajib |
| US-PM-008 | Klien | Lihat progres milestone proyek saya | Tidak perlu selalu tanya status ke PM | Wajib |
| US-PM-009 | Klien | Baca dan unduh MoM dari rapat terakhir | Ada rekam jejak diskusi yang dapat dirujuk | Wajib |
| US-PM-010 | Klien | Berikan persetujuan atas milestone selesai | Persetujuan terdokumentasi secara formal | Tinggi |

#### 3.8 Kebutuhan Non-Fungsional — App 2 Phase 1

- **LCP (Largest Contentful Paint):** < 2 detik pada koneksi 10 Mbps
- **Papan Kanban** dengan 50 kartu task: render < 500ms
- **Pembaruan optimistis:** perubahan status task tampil di UI sebelum respons server kembali
- **Responsif di mobile:** semua fitur kritis (update task, lihat notifikasi, unggah dokumen) dapat digunakan di viewport minimal 375px
- **Notifikasi real-time:** pesan baru diterima pengguna dalam < 2 detik tanpa refresh halaman

#### 3.9 Kriteria Penerimaan — App 2 Phase 1

| ID | Kriteria Penerimaan | Status |
|---|---|---|
| KP-PM-001 | Login berhasil dan pengguna diarahkan ke dashboard sesuai perannya | `[ ]` |
| KP-PM-002 | Proyek baru dapat dibuat dan anggota tim dapat ditambahkan | `[ ]` |
| KP-PM-003 | Task dapat dibuat, ditugaskan, dan diperbarui statusnya melalui drag-and-drop Kanban | `[ ]` |
| KP-PM-004 | Matriks workload menampilkan data utilisasi akurat berdasarkan task aktif mingguan | `[ ]` |
| KP-PM-005 | Dokumen berhasil diunggah dan tersimpan dengan versi yang benar di MinIO | `[ ]` |
| KP-PM-006 | Unggahan kedua menghasilkan versi v2 dengan `is_current = true`, versi v1 tetap ada | `[ ]` |
| KP-PM-007 | Klien dapat login dengan token akses dan melihat milestone proyek | `[ ]` |
| KP-PM-008 | MoM berstatus Draft tidak muncul di portal klien | `[ ]` |
| KP-PM-009 | Persetujuan klien tersimpan dengan timestamp dan dapat diaudit | `[ ]` |
| KP-PM-010 | Notifikasi real-time tampil tanpa reload saat task di-assign ke pengguna aktif | `[ ]` |

---

### PHASE 2 · Fitur Lanjutan & Analytics

> Menambahkan lapisan analitik, peningkatan notifikasi, dan fitur produktivitas tim setelah semua modul Phase 1 berjalan stabil.

#### 3.10 Deskripsi Fitur Phase 2 — App 2

##### 3.10.1 Laporan & Analitik Proyek

- Laporan ringkasan proyek per periode: jumlah task selesai, rata-rata waktu penyelesaian, dokumen diunggah
- Grafik tren progres berbasis milestone untuk pelaporan bulanan ke manajemen
- Ekspor laporan ke format PDF dengan tampilan profesional

##### 3.10.2 Notifikasi Email

- Notifikasi email untuk event kritis: task overdue, MoM diterbitkan, permintaan persetujuan masuk
- Ringkasan harian atau mingguan yang dapat dikonfigurasi per pengguna

##### 3.10.3 Tampilan Gantt Chart

- Tampilan alternatif Gantt Chart di samping Kanban untuk proyek dengan dependensi timeline kompleks
- Visualisasi milestone dan task dalam garis waktu horizontal yang dapat di-scroll

#### 3.11 Kebutuhan Fungsional — App 2 Phase 2

| ID | Deskripsi Kebutuhan | Prioritas |
|---|---|---|
| RF-PM-101 | Sistem menghasilkan laporan ringkasan proyek yang dapat diekspor ke PDF | Tinggi |
| RF-PM-102 | Sistem mengirim notifikasi email untuk event kritis yang dikonfigurasi pengguna | Tinggi |
| RF-PM-103 | Tersedia tampilan Gantt Chart untuk proyek dengan lebih dari 5 milestone | Sedang |

---

### PHASE 3 · RAG Knowledge Base

> Mengaktifkan pencarian semantik berbasis AI atas seluruh arsip dokumen. Engineer dapat mencari referensi dari pekerjaan masa lalu menggunakan pertanyaan dalam bahasa alami.

#### 3.12 Gambaran Phase 3 — App 2

Phase 3 memanfaatkan dokumen yang terkumpul selama operasional Phase 1 sebagai sumber pengetahuan. Teknologi **RAG (Retrieval-Augmented Generation)** dikombinasikan dengan penyimpanan vektor di **pgvector** memungkinkan engineer mengajukan pertanyaan kontekstual seperti:

> *"Bagaimana cara kita menangani masalah latensi sensor di proyek sebelumnya?"*

**Prasyarat Phase 3:** volume dokumen yang cukup dari operasional Phase 1 (estimasi minimal **3–6 bulan operasional**) dan proses ekstraksi teks yang sudah berjalan stabil.

#### 3.13 Deskripsi Fitur Phase 3 — App 2

- Pengindeksan otomatis setiap dokumen teks baru yang diunggah (PDF, DOCX, MD, TXT) ke dalam vector database
- Antarmuka pencarian semantik: input pertanyaan dalam bahasa alami, sistem mencari berdasarkan **makna** bukan kata kunci
- Hasil pencarian menampilkan kutipan teks relevan beserta sumber dokumen yang dapat diklik langsung
- Filter hasil berdasarkan proyek, tipe dokumen, divisi, dan rentang waktu
- Integrasi dengan Proposal Generator App 1: AI merujuk dokumen relevan saat menyusun proposal

#### 3.14 Kebutuhan Fungsional — App 2 Phase 3

| ID | Deskripsi Kebutuhan | Prioritas |
|---|---|---|
| RF-RAG-001 | Dokumen teks yang diunggah diindeks ke vector database dalam waktu 10 menit setelah unggah | Wajib |
| RF-RAG-002 | Antarmuka pencarian semantik tersedia di halaman Document Management | Wajib |
| RF-RAG-003 | Hasil pencarian menampilkan kutipan teks relevan beserta nama dan tautan dokumen sumber | Wajib |
| RF-RAG-004 | Pengguna dapat memfilter hasil pencarian berdasarkan proyek, tipe dokumen, dan rentang waktu | Tinggi |
| RF-RAG-005 | Dokumen non-teks (DWG, foto, video) disimpan tetapi tidak diindeks dengan notifikasi yang sesuai | Sedang |

---

## 4. Integrasi Antar Aplikasi

### 4.1 Integration Point: Tender Menang → Proyek Baru

Satu-satunya titik integrasi antara App 1 dan App 2 terjadi saat tender dinyatakan berhasil dimenangkan. Proses ini bersifat **satu arah** (App 1 → App 2).

**Alur Proses:**

```
PM update status tender → 'Menang'
        ↓
Formulir "Buat Proyek" muncul (sudah terisi sebagian dari data tender)
        ↓
PM melengkapi: nama proyek, PM penanggung jawab, tanggal mulai/selesai
        ↓
Sistem membuat record proyek baru di App 2 (referensi ke ID tender asal)
        ↓
PM & anggota tim mendapat notifikasi proyek baru
```

**Ketentuan:**

- Konversi hanya dapat dilakukan **satu kali** per tender — tender yang sudah dikonversi tidak dapat dikonversi ulang
- Pembatalan proyek di App 2 tidak mengubah status tender di App 1 secara otomatis
- Data yang ditransfer: nama tender, klien, estimasi budget, dokumen tender yang telah diunggah

### 4.2 Infrastruktur Bersama

| Komponen | Deskripsi | Digunakan Oleh |
|---|---|---|
| PostgreSQL 16 + pgvector | Satu database untuk seluruh data relasional kedua aplikasi, ditambah ekstensi pgvector untuk Phase 3 | App 1 + App 2 |
| MinIO (Object Storage) | Penyimpanan file self-hosted kompatibel S3 untuk semua dokumen, template, dan proposal | App 1 + App 2 |
| Redis + BullMQ | Cache dan message broker untuk antrian job: scraping, pengindeksan, dan generasi AI | App 1 + App 2 |
| Auth Service (JWT) | Autentikasi terpusat berbasis JWT dengan dual-token: satu akun untuk akses kedua aplikasi | App 1 + App 2 |

### 4.3 Autentikasi & Otorisasi

- Staf internal login sekali dan dapat berpindah antara App 1 dan App 2 tanpa login ulang **(shared session)**
- Klien menggunakan token berbasis proyek yang dibuat PM, terpisah dari akun internal
- Token klien bersifat terbatas: hanya untuk proyek tertentu, dapat memiliki tanggal kedaluwarsa, dan dapat dicabut oleh PM
- Seluruh akses dan perubahan data dicatat di tabel `audit_logs` untuk keperluan keamanan dan kepatuhan

---

## 5. Roadmap & Urutan Pengembangan

### 5.1 Ringkasan Fase

| Fase | Aplikasi | Deliverable Utama | Kondisi Selesai |
|---|---|---|---|
| Phase 1 | App 1 | Scraping otomatis, KBLI matching, tender tracking | Tim bisa menemukan dan mengelola tender tanpa cek manual |
| Phase 1 | App 2 | Project management, document management, client portal | Semua proyek aktif terkelola dalam satu sistem |
| Phase 2 | App 1 | Proposal AI Generator dengan manajemen template | Draft proposal tersedia dalam hitungan menit |
| Phase 2 | App 2 | Laporan analitik, notifikasi email, Gantt Chart | Pelaporan dan monitoring lebih komprehensif |
| Phase 3 | App 2 | RAG Knowledge Base dan pencarian semantik | Engineer dapat menemukan referensi masa lalu via AI |

### 5.2 Urutan Pengembangan yang Direkomendasikan

| Urutan | Yang Dibangun | Alasan Prioritas |
|---|---|---|
| 1 | Database schema (ERD) + Auth + RBAC | Fondasi mutlak — semua modul bergantung pada ini |
| 2 | App 2: Project Management core (tanpa DM & Portal) | Dapat segera diuji oleh tim internal dengan data nyata |
| 3 | App 2: Document Management module | Menambah nilai nyata ke proyek yang sudah berjalan di langkah 2 |
| 4 | App 1: Scraping Engine + KBLI Matching | Berdiri sendiri, dapat diuji secara terpisah dari App 2 |
| 5 | App 1: Tender Tracking UI | Frontend App 1 — membutuhkan scraping engine yang sudah berjalan |
| 6 | App 2: Client Portal module | Membutuhkan PM dan DM yang sudah stabil serta data proyek yang ada |
| 7 | Integration: Tender Won → Project | Menghubungkan dua app yang sudah berjalan sendiri-sendiri |
| 8 | App 1: Proposal AI Generator (Phase 2) | Bergantung pada DM App 2 untuk template — setelah Phase 1 stabil |
| 9 | App 2: RAG Knowledge Base (Phase 3) | Bergantung pada volume dokumen dari operasional Phase 1 (3–6 bulan) |

### 5.3 Dependensi Kritis

> ⚠️ Perhatikan urutan ini — perubahan di luar urutan berisiko tinggi menyebabkan rework.

- **ERD database harus final** sebelum coding modul apapun — perubahan schema di tengah pembangunan sangat mahal
- **Auth & RBAC harus selesai** sebelum modul apapun di-deploy ke lingkungan staging
- **Document Management (App 2) harus berjalan stabil** sebelum Proposal Generator (App 1 Phase 2) dikerjakan
- **RAG Phase 3 membutuhkan minimal 3–6 bulan operasional** Phase 1 untuk menghasilkan volume dokumen yang cukup

### 5.4 Pertanyaan Terbuka

> Keputusan berikut perlu dijawab sebelum atau selama pengembangan Phase 1.

| # | Pertanyaan | Dampak |
|---|---|---|
| 1 | Berapa LPSE instance yang menjadi target Phase 1? | Menentukan scope dan kompleksitas scraper LPSE |
| 2 | App 1 dan App 2 di subdomain terpisah atau path berbeda? | Mempengaruhi konfigurasi CORS, auth, dan routing |
| 3 | Apakah notifikasi email diperlukan di Phase 1 atau bisa Phase 2? | Menentukan apakah perlu setup SMTP di Phase 1 |
| 4 | Kapasitas MinIO yang dibutuhkan untuk 12 bulan pertama? | Menentukan spesifikasi server yang perlu dipersiapkan |
| 5 | Berapa jumlah maksimal user klien yang dapat diundang per proyek? | Mempengaruhi desain tabel `client_portal_access` |

---

*Cliste PRD v1.0 — Dokumen Rahasia Internal — Tidak untuk Disebarluaskan*