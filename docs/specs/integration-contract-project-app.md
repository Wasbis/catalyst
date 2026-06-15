# Integration Contract — Project Maker ↔ Project Management

> Versi: v3 (human-readable) — 2026-06-15
> Status: **🚫 BLOCKED** — masih ada beberapa hal yang harus dikonfirmasi/disiapkan
> **Project Management** sebelum implementasi bisa dimulai. Lihat §8 & §9.

---

## 1. Latar Belakang — Kenapa Dokumen Ini Ada

Ada dua aplikasi terpisah, dikelola tim berbeda:

| Nama dalam dokumen ini | Aplikasi sebenarnya | Dikelola oleh |
|---|---|---|
| **Project Maker** | Catalyst / "Cliste Tender Platform" | tim kita |
| **Project Management** | "Task by Cliste" (Project App) | tim Project Management |

**Alur bisnisnya secara garis besar:**

1. Project Maker dipakai untuk **mencari & memenangkan tender / kesepakatan kerja**
   (proses tender, direct appointment, sampai approval internal).
2. Begitu sebuah pekerjaan **disetujui untuk dikerjakan** (status `Approval`/`KickOff`
   di Project Maker), pekerjaan itu harus **mulai dieksekusi** — dan eksekusi
   (board/ticket/timeline/progress harian, S-Curve) dilakukan di **Project
   Management**, bukan di Project Maker.
3. Setelah itu, Project Maker tetap jalan terus untuk hal-hal **administratif &
   finansial** (PO/SO, pencairan termin/CTR, invoicing), sampai akhirnya project
   ditutup secara administratif (`Closed`).

Karena dua sistem ini punya database & tim yang berbeda, kita butuh **kontrak
integrasi** — kesepakatan tertulis soal: data apa yang saling dikirim, lewat
endpoint apa, dengan format apa, dan **siapa yang bertanggung jawab membangun
apa**. Itulah isi dokumen ini.

---

## 2. Pembagian Peran (PENTING — baca ini dulu)

### 🟦 Project Maker = **Pemanggil (Caller)**

Project Maker adalah pihak yang **memulai** komunikasi. Ketika sebuah project di
Project Maker siap dieksekusi, **Project Maker akan mengirim request** ke Project
Management untuk membuatkan "ruang kerja" project di sana.

→ **Yang harus dibangun oleh Project Maker**: kode pemanggil (fetch/HTTP client),
penyimpanan hasil response, link-out ke halaman reporting.

### 🟩 Project Management = **Penerima (Receiver)**

Berdasarkan dokumentasi yang sudah dikirim tim Project Management
(`application-workflow-projectmanagement.md` & `database-schema-projectmanagement.md`),
**endpoint penerima sudah ada**: `POST /api/integrations/projects/init`. Jadi
Project Management **tidak perlu membuat endpoint baru untuk ini** — endpoint-nya
sudah jadi.

→ **Yang dibutuhkan dari Project Management**: bukan membangun fitur baru, tapi
**menyediakan akses & informasi konfigurasi** (alamat URL, token, 1 akun service,
dan dokumentasi format link reporting). Detail lengkap di §8.

> Singkatnya: **Project Maker yang ngoding lebih banyak** (karena dia pemanggil),
> **Project Management cukup "membukakan pintu"** (kasih akses + dokumentasi kecil).
> Ini sengaja didesain seperti ini supaya beban kerja ke tim Project Management
> seminimal mungkin.

---

## 3. Gambaran Alur End-to-End

```
┌─────────────────────┐                                  ┌──────────────────────────┐
│   PROJECT MAKER      │                                  │   PROJECT MANAGEMENT      │
│   (Catalyst)         │                                  │   (Task by Cliste)        │
└─────────────────────┘                                  └──────────────────────────┘

[1] Project status → "Approval"/"KickOff"
         │
         │  POST /api/integrations/projects/init
         │  (data project: nama, klien, tanggal, dll — §4)
         ├────────────────────────────────────────────────────────▶
         │                                                  [2] Buat "Project" baru
         │                                                       di workspace mereka
         │   ◀────────────────────────────────────────────────────┤
         │   Response: { externalProjectId, status }
         │
[3] Simpan externalProjectId
    Construct externalProjectUrl sendiri
    (lihat §4.3)
         │
         │   ... (eksekusi project berjalan di Project Management:
         │        board, ticket, progress, S-Curve) ...
         │
[4] User Project Maker mau lihat progress
         │   klik link "Buka S-Curve" → buka tab Project Management
         ├────────────────────────────────────────────────────────▶
         │                                                  [5] Tampilkan S-Curve
         │                                                       project tsb (§6)
         │
[6] Project status → "Closed" (keputusan finansial/admin)
         │   (opsional) POST /api/integrations/projects/close
         ├────────────────────────────────────────────────────────▶
         │                                                  [7] Tandai project
         │                                                       sebagai archived
```

---

## 4. Titik Kontak #1 — Create Project

### 4.1 Kapan ini terjadi?

Saat status `Project` di Project Maker berubah ke **`Approval`** atau **`KickOff`**
(belum final, lihat §9 — Project Management perlu konfirmasi mana yang lebih tepat
sebagai pemicu).

**Yang membangun**: 🟦 **Project Maker** — bikin fungsi yang otomatis terpanggil
saat status project berubah, lalu mengirim data ke Project Management.

### 4.2 Data yang dikirim (Project Maker → Project Management)

| Field | Wajib? | Isinya apa | Kenapa dibutuhkan / Logikanya |
|---|---|---|---|
| `sourceApp` | Ya | Selalu string tetap: `"catalyst-project-maker"` | Ini semacam "nama pengirim" yang konsisten — supaya Project Management tahu request ini datang dari sistem mana. **Bukan** tempat untuk membedakan tender/non-tender. |
| `externalRequestId` | Ya | ID unik per percobaan, format `"catalyst-project-{id}"` (id = ID project di Project Maker) | Ini "nomor resi" — kalau request gagal/timeout dan Project Maker coba kirim ulang dengan ID yang **sama**, Project Management akan tahu "oh ini permintaan yang sama, jangan dibuatkan project baru lagi". Mencegah project duplikat saat retry. |
| `requestedByGlobalSubject` | Ya | 1 nilai tetap, hasil setup akun khusus (lihat §7) | Project Management mewajibkan setiap request punya "identitas pengirim" untuk dicek izin aksesnya. Karena ini panggilan otomatis antar sistem (bukan dari user manusia yang login), kita pakai 1 akun "robot"/service account yang sudah diberi izin oleh Project Management. |
| `title` | Ya | Nama project | Setara field `name` di Project Maker. Project Management menyebutnya `title`. |
| `client` | Ya | Nama klien | Sama persis dengan field `client` di Project Maker. |
| `description` | Tidak | Format: `"[Tender-{kodeTender}] Nama Pekerjaan"` atau `"[Non-Tender] Nama Pekerjaan"` | Project Management tidak punya konsep "sumber project" (tender vs non-tender) di database-nya. Daripada minta mereka tambah kolom baru, info ini cukup "dititipkan" di teks deskripsi — supaya tim Project Management tetap bisa baca konteksnya tanpa perlu ubah struktur data. |
| `startDate` | Ya | Tanggal mulai project | Project Management **mewajibkan** tanggal mulai & selesai untuk setiap project (dipakai untuk timeline & S-Curve mereka). ⚠️ **Saat ini Project Maker belum punya field ini** — perlu ditambahkan dulu (lihat §8). |
| `endDate` | Ya | Tanggal target selesai project | Sama seperti `startDate` — ini jadi **acuan deadline** yang dipakai Project Management untuk menghitung progress rencana (planned) di S-Curve. Karena itu, tanggal ini harus benar-benar mengikuti kesepakatan/proposal asli, bukan asal isi. |

**Data yang SENGAJA TIDAK dikirim** (dan kenapa):
- `poSoNumber`, `poSoDate` — nomor & tanggal PO/SO. Ini murni administrasi internal
  Project Maker, Project Management tidak punya tempat untuk menyimpan ini dan
  tidak butuh tahu.
- `code` (kode unik project) — di Project Management, kode ini **dibuat otomatis
  oleh sistem mereka sendiri** saat project dibuat. Project Maker tidak perlu (dan
  tidak boleh) menentukan kode ini.

**Contoh isi pesan (request):**
```json
{
  "sourceApp": "catalyst-project-maker",
  "externalRequestId": "catalyst-project-42",
  "requestedByGlobalSubject": "catalyst-service-account",
  "title": "Pembangunan Sistem Monitoring X",
  "client": "PT Klien ABC",
  "description": "[Tender-2026001] Pembangunan Sistem Monitoring X",
  "startDate": "2026-07-01",
  "endDate": "2026-12-31"
}
```

### 4.3 Data yang dikembalikan (Project Management → Project Maker)

| Field | Wajib? | Isinya apa | Kenapa dibutuhkan |
|---|---|---|---|
| `externalProjectId` | Ya | ID unik (UUID) project yang baru dibuat di Project Management | Ini "alamat" project tersebut di sistem Project Management. Project Maker simpan ID ini supaya nanti bisa dipakai untuk membuat link (S-Curve, dsb). |
| `status` | Ya | Status pemrosesan request: `pending` / `processing` / `completed` / `failed` | Karena pembuatan project bisa jadi tidak instan (ada proses di belakang), field ini memberi tahu Project Maker apakah project **sudah jadi** atau **masih diproses**. |

**Contoh isi pesan (response):**
```json
{
  "externalProjectId": "b3f1c2a4-1234-4d5e-9a8b-7c6d5e4f3a2b",
  "status": "completed"
}
```

**Apa yang dilakukan Project Maker dengan response ini:**

1. Simpan `externalProjectId` ke kolom `Project.externalProjectId`.
2. **Bangun sendiri** link ke project tersebut, tanpa minta apa pun lagi dari
   Project Management:
   ```
   externalProjectUrl = {PROJECT_APP_URL}/projects/{externalProjectId}
   ```
   Ini bisa dilakukan karena tim Project Management **sudah mendokumentasikan**
   sendiri bahwa pola alamat halaman project mereka adalah
   `/projects/[projectId]`. Jadi Project Maker cukup "menempelkan" ID ke pola URL
   yang sudah publik — tidak perlu Project Management mengembalikan URL secara
   eksplisit.
3. Kalau `status` bukan `"completed"` (masih `pending`/`processing`) → Project
   Maker perlu cek ulang nanti (mekanisme pasti — lihat §9, masih open item).
4. Kalau gagal (`status: "failed"` atau request error) → `externalProjectId`
   tetap kosong, Project Maker tampilkan tombol **"Coba Sync Lagi"** yang akan
   mengulang kirim dengan `externalRequestId` yang **sama** (supaya tidak
   duplikat, lihat §4.2).

---

## 5. Titik Kontak #2 — Notifikasi "Project Ditutup" (Opsional)

### Kenapa ini ada?

Setelah Titik Kontak #1, kedua sistem berjalan agak independen:

- Di Project Maker, status project terus berjalan:
  `Approval → KickOff → POSOIssued → Pelaksanaan → Invoicing → Closed`
- Di Project Management, project tetap "aktif" — board/ticket/S-Curve terus
  dipakai selama pekerjaan berjalan.

Sebagian besar status di atas **tidak perlu** diberitahukan ke Project Management:
- `Pelaksanaan` — wajar, project memang sedang aktif dikerjakan di Project
  Management juga.
- `Invoicing` — ini proses penagihan termin yang **bisa berjalan paralel** dengan
  pekerjaan yang masih lanjut (tidak harus menunggu pekerjaan 100% selesai).

**Tapi** ada 1 titik yang berpotensi penting buat Project Management: saat Project
Maker menyatakan project **`Closed`** (selesai secara administratif/finansial),
idealnya Project Management juga tahu — supaya mereka bisa **menandai project
sebagai selesai/diarsipkan** di sistem mereka (tidak ada lagi pekerjaan baru yang
seharusnya dibuka di project itu).

### Yang diusulkan

**Yang membangun (jika disetujui)**: 🟩 **Project Management** — endpoint baru
(opsional):

```
POST /api/integrations/projects/close
Authorization: Bearer {SERVICE_TOKEN}

{
  "externalProjectId": "<uuid project tsb>",
  "sourceApp": "catalyst-project-maker",
  "externalRequestId": "catalyst-project-42-close"
}
```

Project Management tinggal menandai project tersebut sebagai
`archivedAt`/selesai.

### Kalau Project Management belum sanggup bikin endpoint ini

Tidak masalah — **ini opsional, tidak menghalangi (blocking) apa pun**. Sebagai
gantinya:

**Yang membangun**: 🟦 **Project Maker** — cukup tampilkan pesan pengingat manual
di halaman detail project: *"Project ini sudah Closed di Project Maker — mohon
tandai/arsipkan juga di Task by Cliste"*, dengan link ke project tersebut.

---

## 6. Titik Kontak #3 — Lihat Laporan Progress (S-Curve)

### Konsepnya

Project Management sudah punya halaman **S-Curve** (grafik progress rencana vs
aktual) yang lengkap, termasuk fitur **export ke Excel**. Daripada Project Maker
membangun fitur laporan progress sendiri dari nol (yang akan jadi kerja besar dan
datanya jadi duplikat), **Project Maker cukup menyediakan link langsung** ke
halaman itu.

**Yang membangun**: 🟦 **Project Maker** — generate link, tampilkan sebagai tombol
"Buka S-Curve" di halaman project.

### Alurnya

1. **Syarat**: `externalProjectId` sudah ada (hasil Titik Kontak #1).
2. Setiap kali Project Maker bikin checklist laporan progress untuk suatu periode
   (misal "Laporan CTR-3", dengan tanggal mulai & selesai periode itu), Project
   Maker generate link:
   ```
   {PROJECT_APP_URL}/projects/{externalProjectId}/scurve?<parameter filter tanggal>
   ```
3. Link ini ditempel sebagai tombol "Buka S-Curve periode ini" di checklist
   tersebut.
4. User klik → halaman S-Curve Project Management terbuka, **sudah terfilter** ke
   periode yang relevan.
5. (Opsional, untuk arsip) Saat periode itu ditutup, Project Maker bisa
   mengambil file Excel hasil export dari
   `GET /api/projects/[projectId]/scurve/export` dan menyimpannya sebagai arsip
   laporan — fitur ini **sudah ada** di Project Management.

### Yang masih dibutuhkan dari Project Management

**Yang membangun**: 🟩 **Project Management** — bukan endpoint baru, tapi
**dokumentasi**: parameter apa saja yang diterima halaman `/scurve` untuk
memfilter berdasarkan tanggal (apakah `?from=...&to=...`, atau
`?mode=...&view=...&referenceDate=...`, atau format lain). Tanpa info ini, Project
Maker tidak bisa membuat link yang benar-benar terfilter.

### Soal Timesheet

Halaman `/projects/[projectId]/view-timesheet` di Project Management **masih
berupa placeholder** (belum ada isinya — dikonfirmasi dari dokumentasi mereka
sendiri). Jadi untuk sekarang, **link-out Timesheet ditunda**. Ini tidak menghambat
S-Curve di atas — keduanya independen.

---

## 7. Identitas "Pengirim Otomatis" (Service Account)

### Masalahnya

Setiap request dari Project Maker ke Project Management (Titik Kontak #1) wajib
menyertakan `requestedByGlobalSubject` — semacam "identitas user" yang dipakai
Project Management untuk:
1. Mencatat siapa yang membuat project ini, dan
2. Memastikan "pengirim" punya izin (admin atau punya hak `canCreateProject`).

Normalnya field ini berasal dari login SSO (Microsoft Entra) — tapi Project Maker
**belum punya SSO**, jadi tidak ada "user yang login" secara real-time saat
pengiriman otomatis ini terjadi.

### Solusinya — 1x setup, tidak ada kode baru

**Yang membangun**: 🟩 **Project Management** — buat **1 akun khusus** ("robot
account") di sistem mereka:

1. Buat 1 user baru lewat halaman admin user management mereka, contoh nama:
   `catalyst-integration`.
2. Beri izin `canCreateProject = true` (atau jadikan admin/`isGlobalAdmin = true`).
3. Tetapkan 1 nilai `globalSubject` untuk akun ini — **boleh string apa saja**,
   misal `"catalyst-service-account"` (tidak harus token Microsoft asli, kolom ini
   cukup berupa teks unik).
4. Kirim nilai `globalSubject` itu ke tim Project Maker.

**Yang membangun**: 🟦 **Project Maker** — simpan nilai itu di file konfigurasi
(`.env`) sebagai `PROJECT_APP_SERVICE_SUBJECT`, dan kirim nilai ini di setiap
request Titik Kontak #1.

→ **Tidak ada kode baru** yang perlu ditulis Project Management untuk ini — cukup
membuat 1 akun via halaman admin yang sudah ada.

### Catatan tambahan (di luar scope, untuk masa depan)

Untuk keperluan lain (misal: menampilkan "siapa PIC project ini di Task by
Cliste" di halaman Project Maker), nanti dibutuhkan pencocokan identitas user
**manusia** antar kedua sistem. Untuk jangka pendek, dipakai pencocokan
berdasarkan **email kerja** (`namalengkap@cliste.co.id`) — karena email sudah ada
di kedua sistem. Ini topik terpisah, tidak menghambat Titik Kontak #1-3 di atas.

---

## 8. Checklist Kebutuhan — Siapa Harus Siapkan Apa

### 🟦 Project Maker (Catalyst) — harus disiapkan tim kita

| # | Yang harus disiapkan | Kenapa |
|---|---|---|
| 1 | Tambah field **tanggal mulai & tanggal target selesai** ke data Project | Wajib dikirim di Titik Kontak #1 (§4.2) — Project Management butuh ini untuk timeline & S-Curve. Saat ini belum ada di Project Maker. |
| 2 | Buat modul pemanggil (HTTP client) ke Project Management | Untuk mengirim Titik Kontak #1, baca response, simpan hasil. |
| 3 | Simpan konfigurasi: alamat Project Management, token akses, nilai identitas service account | Disimpan sebagai environment variable, tidak boleh di-hardcode/commit ke git. |
| 4 | Tombol "Coba Sync Lagi" di halaman detail project | Untuk kasus request gagal/`failed` (§4.3). |
| 5 | Generate & tampilkan link S-Curve per periode laporan | Titik Kontak #3 (§6) — setelah format parameter dari Project Management didapat. |
| 6 | (Opsional) Pengingat manual "tandai Closed di Project Management" | Fallback Titik Kontak #2 kalau endpoint close belum ada (§5). |

### 🟩 Project Management (Task by Cliste) — harus disiapkan/dikonfirmasi tim mereka

| # | Yang harus disiapkan | Kenapa | Wajib/Opsional |
|---|---|---|---|
| 1 | **Alamat (URL) server** Project Management yang bisa diakses Project Maker | Project Maker butuh ini untuk mengarahkan semua request & link (§3, §4.3) | **Wajib** |
| 2 | **Token akses** untuk Project Maker (cara generate, dan formatnya) | Supaya endpoint `/api/integrations/projects/init` bisa membedakan "siapa yang boleh memanggil" (§3) | **Wajib** |
| 3 | Konfirmasi: trigger pembuatan project sebaiknya di status `Approval` atau `KickOff`? | Supaya Project Maker memanggil di waktu yang tepat — tidak terlalu cepat (project belum pasti jalan) atau terlalu lambat (eksekusi sudah mulai tapi belum tercatat di Project Management) (§4.1) | **Wajib** |
| 4 | Buat **1 akun service account** + kirim nilai `globalSubject`-nya | Supaya request otomatis dari Project Maker bisa "lolos" pengecekan izin (§7) | **Wajib**, tapi **ringan** (1x klik di halaman admin, bukan coding) |
| 5 | Dokumentasi parameter filter tanggal di halaman `/scurve` | Tanpa ini, link S-Curve dari Project Maker tidak akan otomatis terfilter ke periode yang benar (§6) | **Wajib** untuk Titik Kontak #3, tapi **tidak menghalangi** Titik Kontak #1 |
| 6 | Penjelasan mekanisme `status: pending/processing` — apakah Project Maker perlu polling, atau selalu langsung `completed`? | Supaya Project Maker tahu cara menangani hasil yang belum final (§4.3) | **Wajib** |
| 7 | (Opsional) Endpoint `POST /api/integrations/projects/close` | Supaya saat Project Maker `Closed`, Project Management otomatis tahu (§5) | **Opsional** — ada fallback manual |

---

## 9. Pertanyaan Terbuka untuk Project Management

Daftar ringkas yang perlu dijawab tim Project Management sebelum implementasi
mulai (mengacu ke §8 kolom kanan):

1. URL server Project Management untuk integrasi ini apa?
2. Bagaimana cara kami mendapatkan token akses, dan apakah ada masa berlaku/rotasi?
3. Trigger pembuatan project: saat status kami `Approval` atau `KickOff`?
4. Tolong buatkan 1 akun service account (`canCreateProject`/admin) dan beri kami
   nilai `globalSubject`-nya.
5. Parameter filter tanggal di halaman `/projects/[id]/scurve` itu apa saja?
6. Kalau `status` hasil pembuatan project bukan `completed`, bagaimana kami tahu
   kapan selesai — perlu polling, atau selalu sinkron?
7. Apakah memungkinkan dibuatkan endpoint `POST /api/integrations/projects/close`
   (opsional)?

---

## 10. Status Saat Ini

🚫 **Implementasi belum bisa dimulai** — menunggu jawaban §9 dari tim Project
Management, khususnya poin 1, 2, 3, 4, dan 6 (poin 5 & 7 tidak menghalangi mulainya
Titik Kontak #1).

Begitu jawaban masuk, dokumen ini akan diperbarui dan checklist implementasi teknis
(`todo.md` Fase 4) bisa mulai dijalankan.
