# Integration Contract — Catalyst ↔ Admin Website

> Draft 2026-06-13. Dokumen ini adalah **boundary contract** antara Catalyst ("Project
> Maker") dan Admin Website (sistem/DB terpisah, tempat data lowongan/vacancy,
> scholarship, pelamar, dan showcase portfolio Cliste disimpan) — bukan dokumentasi
> internal masing-masing sistem.
>
> Tujuan: mendefinisikan titik kontak minimal yang stabil untuk 2 kebutuhan integrasi
> (Area 6.1 — Recruitment, Area 6.2 — Work-Experience Showcase), lihat
> `project-maker-roadmap.md` Area 6.
>
> Status: **draft** — field data Area 6.1 sudah dikonfirmasi, tapi endpoint/auth/arah
> call (pull vs push) untuk Area 6.1 & 6.2 masih perlu dikonfirmasi dengan tim Admin
> Website. Lihat §5 Open Items.

---

## 1. Scope

Dokumen ini mengatur:
- **Area 6.1 — Recruitment**: data pelamar (vacancy & scholarship) yang sudah
  `status: "accepted"` → jadi `Employee` di HR module Catalyst (Area 2).
- **Area 6.2 — Work-Experience Showcase**: `WorkExperienceRecord` (`isShowcased: true`)
  di Catalyst → ditampilkan sebagai portfolio di website Cliste (Admin Website).

Dokumen ini **tidak** mengatur:
- Struktur internal Admin Website (vacancy/scholarship management, dll).
- Struktur `Employee`/`EmployeeDocument`/`WorkExperienceRecord` di Catalyst — itu
  internal Catalyst (lihat `project-maker-roadmap.md` Area 2 & 3).
- Auth user-facing / SSO.

---

## 2. Area 6.1 — Recruitment (Applicant → Employee)

### 2.1 Entity `Applicant` (Admin Website)

_Field dikonfirmasi 2026-06-13:_

| Field          | Tipe     | Keterangan                                                  |
|----------------|----------|--------------------------------------------------------------|
| applicantName  | string   | Nama pelamar                                                  |
| appliedFor     | string   | Posisi yang dilamar                                           |
| education      | string   | Pendidikan terakhir                                           |
| domicile       | string   | Domisili                                                      |
| availability   | string   | Ketersediaan mulai kerja                                      |
| expectedSalary | number?  | Opsional                                                       |
| submitDate     | date     | Tanggal apply                                                 |
| status         | enum     | `"new_applied"` \| `"review"` \| `"interviewed"` \| `"accepted"` \| `"rejected"` |
| email          | string   | -                                                              |
| phone          | string   | -                                                              |
| linkedin       | string?  | -                                                              |
| portfolio      | string?  | Link portfolio                                                |
| resumeUrl      | string   | Link/file CV                                                  |

### 2.2 Trigger — "Hired"

Trigger: `Applicant.status` berubah menjadi **`"accepted"`**.

> **Catatan penting** _(dikonfirmasi 2026-06-13)_: pelamar **tidak** membawa dokumen
> KTP/ijazah/KK/NPWP/BPJS dari Admin Website. Dokumen-dokumen tersebut baru diserahkan
> setelah resmi jadi pegawai (intern/tetap), dan diupload **langsung di Catalyst**
> sebagai `EmployeeDocument` (Fase 3) — **tidak ada reuse dokumen** dari Admin Website.

### 2.3 Data yang dipetakan ke `Employee` (Catalyst)

| `Applicant` (Admin Website) | `Employee` (Catalyst)        | Keterangan |
|------------------------------|-------------------------------|------------|
| (id internal Admin Website)  | `originApplicantId`           | Referensi balik ke Admin Website |
| —                             | `source = "admin_website_vacancy"` atau `"admin_website_scholarship"` | Tergantung jenis lamaran |
| `applicantName`               | `name`                         | - |
| `appliedFor`                  | `position`                     | - |
| —                              | `isActive = true`               | Default saat dibuat |

Field lain (`education`, `domicile`, `email`, `phone`, `linkedin`, `portfolio`,
`resumeUrl`, `expectedSalary`, `submitDate`) — **belum** dipetakan ke kolom `Employee`
baru. Lihat §5 Open Items: disimpan sebagai snapshot, atau fetch on-demand via
`originApplicantId`?

### 2.4 Endpoint & Auth

```
GET {ADMIN_WEBSITE_URL}/api/applicants?status=accepted
Authorization: Bearer {ADMIN_WEBSITE_API_TOKEN}
```

- Model **pull**: Catalyst (HR admin, saat input `Employee` baru) memanggil endpoint ini
  untuk lihat daftar pelamar `accepted` yang belum jadi `Employee`, lalu pilih satu untuk
  di-convert.
- `{ADMIN_WEBSITE_URL}` & `{ADMIN_WEBSITE_API_TOKEN}` — *to be confirmed* dengan tim
  Admin Website. Auth cukup API key/token sederhana (bukan SSO/user session), sesuai
  arahan 2026-06-13.
- Alternatif **push** (webhook dari Admin Website saat status → `accepted`) — lihat §5,
  belum diputuskan mana yang dipakai.

---

## 3. Area 6.2 — Work-Experience Showcase (Catalyst → Admin Website)

### 3.1 Entity yang dipertukarkan

`WorkExperienceRecord` (Catalyst, Area 3) dengan `isShowcased: true`:

| Field        | Tipe    | Keterangan                          |
|--------------|---------|----------------------------------------|
| projectName  | string  | -                                        |
| client       | string  | -                                        |
| category     | string? | Jenis pekerjaan                         |
| year         | int?    | -                                        |
| notes        | string? | -                                        |

> `contractFileUrl`/`bastFileUrl` **tidak** termasuk — dokumen internal, bukan untuk
> ditampilkan publik.

### 3.2 Endpoint & Auth — *to be confirmed*

Belum diputuskan arah call:
- **Opsi A (pull)**: Admin Website memanggil `GET {CATALYST_URL}/api/integrations/work-experience-showcase` (auth via service token, analog §2.4) setiap kali render halaman portfolio.
- **Opsi B (push)**: Catalyst memanggil endpoint Admin Website setiap kali
  `WorkExperienceRecord.isShowcased` berubah (create/update/toggle).

Opsi A lebih sederhana dari sisi Catalyst (read-only endpoint, tidak perlu tahu kapan
harus push), tapi keputusan akhir tetap tergantung preferensi tim Admin Website.

---

## 4. Versioning

Perubahan pada field/endpoint di dokumen ini perlu disepakati kedua tim sebelum deploy ke
production — sama seperti `integration-contract-project-app.md`.

---

## 5. Open Items — perlu dikonfirmasi dengan tim Admin Website

- [ ] `{ADMIN_WEBSITE_URL}` & `{ADMIN_WEBSITE_API_TOKEN}` — base URL & token untuk Area 6.1.
- [ ] Area 6.1: pull (Catalyst polling/lookup manual) vs push (webhook saat
      `status → accepted`)?
- [ ] Area 6.1: apakah field `Applicant` (education, domicile, email, phone, linkedin,
      portfolio, resumeUrl, expectedSalary, submitDate) perlu disimpan sebagai snapshot
      di `Employee` (kolom baru/`Json?`), atau cukup fetch on-demand via
      `originApplicantId` kapan dibutuhkan?
- [ ] Area 6.2: arah call (Opsi A pull vs Opsi B push) — lihat §3.2.
- [ ] Area 6.2: endpoint/auth `{CATALYST_URL}/api/integrations/work-experience-showcase`
      (kalau Opsi A) — service token analog `{SERVICE_TOKEN}` di
      `integration-contract-project-app.md`?
