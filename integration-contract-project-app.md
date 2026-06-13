# Integration Contract — Catalyst ↔ Project App

> Draft 2026-06-13. Dokumen ini adalah **boundary contract** antara Catalyst ("Project
> Maker") dan Project App (tim lain) — bukan dokumentasi internal masing-masing sistem.
>
> Tujuan: mendefinisikan titik kontak minimal yang stabil, supaya kedua tim bisa
> mengembangkan model data & flow internal masing-masing tanpa perlu koordinasi ulang,
> selama contract ini tidak berubah.
>
> Status: **placeholder** — banyak nilai di bawah masih perlu dikonfirmasi dengan tim
> Project App. Lihat §6 Open Items.

---

## 1. Scope

Dokumen ini **hanya** mengatur:
- Data apa yang dikirim Catalyst → Project App, dan kapan.
- Data apa yang dikembalikan Project App → Catalyst.
- Mekanisme auth untuk komunikasi server-to-server.
- (Opsional) event/webhook untuk sinkronisasi status.

Dokumen ini **tidak** mengatur:
- Struktur task/sprint/board internal Project App.
- Struktur `ProjectPhase`, `WorkExperienceRecord`, HR module, dll di Catalyst — semua itu
  internal Catalyst (lihat `project-maker-roadmap.md`).
- Auth user-facing / SSO (lihat dokumen "Shared Auth Template" terpisah).

---

## 2. Entity yang dipertukarkan

### 2.1 Create Project — Catalyst → Project App

Dikirim saat `Project` di Catalyst mencapai status **Approval** (atau **KickOff** —
*to be confirmed*, lihat §6).

| Field          | Tipe     | Wajib | Keterangan                                   |
|----------------|----------|-------|-----------------------------------------------|
| name           | string   | ya    | Nama project                                   |
| client         | string   | ya    | Nama klien                                     |
| sourceType     | enum     | ya    | `"tender"` \| `"non_tender"`                   |
| poSoNumber     | string   | tidak | Nomor PO/SO, kalau sudah ada saat create       |
| poSoDate       | date     | tidak | Tanggal PO/SO                                  |
| catalystRefId  | int      | ya    | ID `Project` di Catalyst, untuk callback (§4)  |

### 2.2 Response — Project App → Catalyst

| Field              | Tipe   | Wajib | Keterangan                                  |
|--------------------|--------|-------|-----------------------------------------------|
| externalProjectId  | string | ya    | ID project di sisi Project App                |
| externalProjectUrl | string | ya    | Link langsung ke project tsb (utk deep-link)  |

Catalyst menyimpan kedua field ini di `Project.externalProjectId` /
`Project.externalProjectUrl`.

---

## 3. Endpoint

```
POST {PROJECT_APP_URL}/api/integrations/projects
Authorization: Bearer {SERVICE_TOKEN}
Content-Type: application/json
```

- `{PROJECT_APP_URL}` — *to be confirmed* (base URL Project App).
- `{SERVICE_TOKEN}` — *to be confirmed*: API key atau service-account token, **bukan**
  session/cookie user. Mekanisme penerbitan & rotasi token ini perlu disepakati terpisah
  dari Shared Auth Template (yang mengatur user session, bukan service-to-service call).

**Contoh request body:**
```json
{
  "name": "Pembangunan Sistem Monitoring X",
  "client": "PT Klien ABC",
  "sourceType": "tender",
  "poSoNumber": "PO-2026-001",
  "poSoDate": "2026-06-10",
  "catalystRefId": 42
}
```

**Contoh response:**
```json
{
  "externalProjectId": "PRJ-9081",
  "externalProjectUrl": "https://project-app.example.com/projects/9081"
}
```

---

## 4. Event Callback (opsional) — Project App → Catalyst

Kalau Project App bisa mengirim event saat status project berubah di sisi mereka:

```
POST {CATALYST_URL}/api/integrations/project-status
Authorization: Bearer {SERVICE_TOKEN}
Content-Type: application/json
```

```json
{
  "catalystRefId": 42,
  "externalProjectId": "PRJ-9081",
  "status": "closed"
}
```

Catalyst akan mapping `status` dari Project App ke status `Project` internal (mapping
detail — *to be confirmed*, lihat §6).

---

## 5. Phase / CTR (opsional, future)

Catalyst punya konsep `ProjectPhase` (siklus pencairan & reporting per termin/CTR) di
bawah `Project`. Kalau Project App punya konsep "phase"/"sprint"/"epic" yang align dengan
ini, bisa ditambahkan endpoint serupa (`create phase`, dengan `externalPhaseId` balik) —
**namun ini tidak blocking** untuk integrasi level Project di atas, dan baru dibahas
setelah §2-4 disepakati.

---

## 6. Reporting Reference — S-Curve / Timesheet per Phase

Project App ("Task by Cliste") sudah punya view **S-Curve** (Planned vs Actual progress %)
dan **Timesheet**, dengan filter rentang tanggal (`Day/Week/Month` + date picker) dan
tombol **Export Excel**. Daripada Catalyst membangun reporting progress sendiri, laporan
per-`ProjectPhase` (CTR) bisa **mereferensikan view ini langsung**, di-filter ke rentang
tanggal fase tersebut.

**Pipeline:**

1. **Prasyarat**: `Project.externalProjectId` sudah terisi (hasil §2-3).
2. `ProjectPhase` (CTR) punya `startDate`/`endDate`.
3. Saat `ProjectChecklistItem` kategori "Laporan CTR-X" dibuat (otomatis dari template fase
   baru, atau manual), Catalyst generate **deep-link URL** ke S-Curve/Timesheet Task by
   Cliste, di-filter ke rentang tanggal fase:
   ```
   {PROJECT_APP_URL}/projects/{externalProjectId}/s-curve?from={phase.startDate}&to={phase.endDate}
   ```
   *(path & query param exact — to be confirmed, lihat §7 Open Items)*
4. URL disimpan sebagai `ProjectChecklistItem.fileUrl` (field yang sama dipakai untuk link,
   bukan cuma file upload).
5. User klik link dari Catalyst → terbuka view Task by Cliste yang sudah ke-filter sesuai
   periode CTR. Karena session login lokal per-app (lihat Shared Auth Template), user
   mungkin perlu login terpisah di Task by Cliste kecuali SSO Entra sudah aktif di kedua
   app dan session Entra masih hidup.
6. **(Opsional, arsip)** — saat fase `closed`, ambil snapshot **Export Excel** untuk
   rentang tanggal tersebut dan simpan sebagai file statis (arsip laporan final CTR-X yang
   tidak berubah lagi), terpisah dari live link di langkah 4-5 (yang datanya bisa terus
   ter-update kalau dilihat sebelum fase closed).

---

## 7. Open Items — perlu dikonfirmasi dengan tim Project App

- [ ] `{PROJECT_APP_URL}` — base URL endpoint integrasi.
- [ ] Mekanisme & penerbitan `{SERVICE_TOKEN}` (API key vs service account, rotasi, dll).
- [ ] Trigger timing: create project dipanggil saat status `Approval` atau `KickOff`?
- [ ] Apakah Project App bisa kirim webhook callback (§4)? Kalau tidak, Catalyst perlu
      polling atau update status manual.
- [ ] Mapping status: daftar status di Project App ↔ status `Project` di Catalyst
      (`Approval | KickOff | POSOIssued | Pelaksanaan | Invoicing | Closed`).
- [ ] Apakah Project App punya konsep "phase"/"sprint" yang align dengan `ProjectPhase`
      (CTR) di Catalyst? (§5 — non-blocking, didiskusikan belakangan)
- [ ] **§6**: Apakah S-Curve/Timesheet Task by Cliste punya URL deep-link yang support
      filter `from`/`to` per project — dan apakah URL itu bisa diakses tanpa login
      terpisah (atau perlu session Task by Cliste sendiri)?
- [ ] **§6**: Apakah ada API export Excel (bukan cuma tombol UI) untuk snapshot per
      rentang tanggal, agar arsip laporan CTR bisa diambil otomatis saat fase closing?
- [ ] **§9**: Skema A (email) vs Skema B (`globalSubject`) untuk matching identitas user
      antar sistem — pilih satu/kombinasi, dan kapan mulai capture `globalSubject` di kedua
      sistem.

---

## 8. Versioning

Perubahan pada field/endpoint di dokumen ini perlu disepakati kedua tim sebelum deploy ke
production — karena ini adalah contract bersama, bukan dokumentasi satu pihak.

---

## 9. Lampiran — User Identity Matching (Topik Diskusi Lanjutan)

> Di luar scope formal §1 (yang fokus ke entity `Project`), tapi relevan karena fitur yang
> butuh cross-reference "user" antar sistem — misal nentuin siapa PIC yang berhak akses
> deep-link S-Curve/Timesheet di §6, atau assignee project — perlu cara mencocokkan identitas
> user Catalyst ↔ Project App. Dua skema di bawah adalah bahan diskusi dengan tim Project App,
> belum keputusan final.

### Skema A — Matching by Email

- **Key**: alamat email kerja (`namalengkap@cliste.co.id`).
- **Plus**: data sudah ada di kedua sistem sejak awal (termasuk data project historis di
  Project App), tidak butuh ubah flow login yang sudah jalan, mudah dibaca/di-debug manual.
- **Minus** (best-practice Shared Auth Template — "Common Mistake"): email bukan identifier
  yang dijamin permanen — bisa berubah (resign, typo, rename) atau di-recycle (akun lama
  dipakai ulang untuk orang baru).
- **Konteks Cliste**: format email = `namalengkap@domain`, skala tim kecil → risiko
  collision/reuse rendah secara praktis. Realistis untuk dipakai sekarang, terutama untuk
  link ke data historis.

### Skema B — Matching by `globalSubject` (Entra `oid`/`sub`)

- **Key**: `globalSubject` — GUID stabil per-user dari claim `oid`/`sub` token Microsoft
  Entra, sesuai Shared Auth Template.
- **Plus**: tidak berubah meski nama/email user berubah, sesuai rekomendasi best-practice,
  "gratis" karena sudah tersedia di token yang sama saat login Entra.
- **Minus**: data project historis di Project App kemungkinan belum menyimpan
  `globalSubject` — baru efektif untuk record baru setelah mulai di-capture.

### Rekomendasi awal (bahan diskusi, belum final)

1. Jangka pendek: pakai **Skema A (email)** untuk matching/link data existing.
2. Jangka panjang: kedua sistem mulai **capture `globalSubject`** sebagai kolom tambahan
   (non-breaking) setiap kali user login via Entra, supaya tersedia sebagai fallback/migration
   path kalau Skema A bermasalah di kemudian hari.
3. Timeline & detail capture `globalSubject` perlu disepakati bareng tim Project App — lihat
   §7 Open Items.
