# Project Maker — Roadmap & Architecture Notes

> Hasil diskusi 2026-06-13. Dokumen ini adalah ringkasan keputusan arah pengembangan Catalyst
> dari "tender sourcing tool" menjadi **Project Maker** (business/admin/commercial layer
> end-to-end: sourcing → execution admin → invoicing), plus breakdown 4 area kerja.
>
> Status: **discussion notes**, belum masuk implementasi. Dipakai sebagai bahan diskusi lanjutan
> dengan tim Project Management dan sebagai referensi saat breakdown task per area dimulai.

---

## 1. Latar Belakang

Kondisi Catalyst sekarang ("Tenders"):
- Scraping CIVD & GeoDipa → scoring KBLI → kanban pipeline `Ditemukan → Ditinjau → Dikejar →
  Diserahkan → Menang / Kalah / Batal`.
- Berhenti di keputusan menang/kalah — belum menyentuh apa yang terjadi *setelah* menang.

Flow bisnis sebenarnya jauh lebih panjang dari itu:

**Flow tender:**
```
Nyari tender → Daftar prakualifikasi → Prakualifikasi → Pengumuman → Nego → Approval
→ Kick off meeting (teknis & administratif) → PO/SO
→ Pelaksanaan teknis (surat kerja, timesheet, BAST, dll — dokumen sesuai kebutuhan)
→ Invoicing
```

**Flow non-tender:**
```
Anak teknis (komunikasi langsung dgn client) → Proposal → Quotation → PO/SO
→ (sama dengan flow tender dari titik ini)
```

Dua flow ini **konvergen** setelah PO/SO — sama-sama masuk fase eksekusi → invoicing.

Selain itu ada 2 jenis data pendukung yang sifatnya **company-wide** (lintas-project):
- **Data pengalaman kerja** — kontrak & BAST historis, dipakai berulang sebagai lampiran
  dokumen kualifikasi tender baru. Saat ini "masih berantakan, gak jelas disimpan di mana".
- **HR data karyawan** — KTP, BPJS, Ijazah, KK, NPWP per orang. Dibutuhkan untuk lampiran
  personel di dokumen tender/project.

---

## 2. Keputusan Arsitektur

### 2.1 Model: Hybrid
- **Catalyst ("Project Maker")** memegang seluruh **business/admin/commercial lifecycle**:
  sourcing (existing "Tenders") → admin pipeline pasca-menang (Approval → Kickoff → PO/SO →
  Pelaksanaan-admin → Invoicing → Closed) → **HR module** → **Work-Experience library**.
- **Project App (tim lain)** memegang **detail eksekusi teknis per-disiplin** (IT, engineer,
  branding, komunikasi) — task/sprint board, dsb. Catalyst tidak menduplikasi ini.
- Penghubung: `Project` di Catalyst punya `externalRef` (link/ID) ke project yang dibuat di
  Project App tim lain, untuk dijadikan "deep link" dari Catalyst.
- **Document Management & Client Portal** (App 2 Modul B/C di `prdv2.md`) — **dikonfirmasi
  2026-06-13: jadi tanggung jawab Project App**, bukan dibangun ulang di Catalyst. Pola
  integrasinya sama seperti Reporting Reference (lihat
  `integration-contract-project-app.md` §6) — Catalyst simpan/tampilkan deep-link ke
  storage/portal Project App, tanpa implementasi versioning/MinIO/client-portal sendiri.
  `prdv2.md` Bagian 3 Modul B/C tetap berguna sebagai *requirement reference* untuk tim
  Project App, tapi keluar dari scope implementasi Catalyst.

### 2.2 Auth — dua workstream yang TERPISAH

Tim Project App memberi "Shared Auth Template" (Entra SSO). Penting dicatat:

| | Shared Auth Template | Create-Project API Integration |
|---|---|---|
| Mengatur | Identity & session (user login dikenal lintas-app via Entra `globalSubject`) | Server-to-server call Catalyst → Project App untuk bikin project |
| Aktor | Browser/user | Machine/service |
| Auth mechanism | Entra session per-app | API key / service token (beda dari user session) |
| Status | **Belum diprioritaskan** — Catalyst masih pakai JWT_SECRET lokal | **Dibutuhkan untuk Area 4** — perlu API contract dari tim Project App |

> Dokumen Shared Auth Template eksplisit bilang tidak membahas "trusted integration antar
> aplikasi" — jadi dia **tidak** menjawab "data apa yang dikirim saat create project".
> Itu harus didapat dari API spec/contract tim Project App secara terpisah.

Keputusan: **SSO/Entra migration dicatat sebagai item terpisah, tidak masuk 4 area di bawah**
(scope besar, butuh app registration Entra baru + migrasi model `User`).

---

## 3. Unified Pipeline (Project)

```
TENDER PATH:
Ditemukan → Ditinjau → Dikejar → Diserahkan → Menang ─┐
                                                        │
NON-TENDER PATH (ProjectLead, lihat Area 1.2):         │
Lead → Proposal → Quotation ───────────────────────────┤
                                                        ▼
                                          [ Project dibuat ]
                                          sourceType: tender | non_tender
                                                        │
                                          Approval → KickOff → POSOIssued
                                                        │
                                ┌───────────────────────┴───────────────────────┐
                                │                                                 │
                      admin/commercial (Catalyst)                     link → Project App
                      - checklist dokumen per kategori                  (detail teknis per
                        (teknis/eng/IT vs komersial)                     tim: IT/eng/branding/
                      - tracking surat kerja, timesheet,                 komunikasi)
                        BAST (level admin)
                                │
                                ▼
                          Invoicing → Closed
```

> **Update 2026-06-13**: NON-TENDER PATH sebelumnya cuma "manual entry langsung jadi
> Project". Sekarang punya tracking ringan via model `ProjectLead`
> (`status: lead | proposal | quotation | converted | cancelled`) — lihat Area 1.2.
> `converted` → `Project` baru dibuat (`sourceType: "non_tender"`, `status: "Approval"`).

---

## 4. Breakdown 4 Area Kerja + 3 Area Tambahan (Audit, Integrasi Admin Website, & Document Generator)

### Area 1 — Project Pipeline Extension

Tujuan: model & UI untuk lifecycle pasca-menang (atau pasca-quotation untuk non-tender),
sampai invoicing/closed.

**Schema sketch (Prisma):**
```prisma
model Project {
  id              Int      @id @default(autoincrement())
  name            String
  sourceType      String   @db.VarChar(20)   // "tender" | "non_tender"
  tenderResultId  Int?     @map("tender_result_id")
  tenderResult    TenderResult? @relation(fields: [tenderResultId], references: [id])

  client          String
  status          String   @db.VarChar(20)   // Approval | KickOff | POSOIssued | Pelaksanaan | Invoicing | Closed
  poSoNumber      String?  @map("po_so_number")
  poSoDate        DateTime? @map("po_so_date") @db.Date

  description     String?  @db.Text          // Rangkuman project untuk keperluan internal & showcase portfolio
  isShowcased     Boolean  @default(false) @map("is_showcased")

  externalProjectId  String? @map("external_project_id")  // ID di Project App tim lain
  externalProjectUrl String? @map("external_project_url")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime? @map("updated_at")

  tasks           ProjectTask[]
  checklistItems  ProjectChecklistItem[]
}

model ProjectTask {
  id         Int      @id @default(autoincrement())
  projectId  Int      @map("project_id")
  project    Project  @relation(fields: [projectId], references: [id])
  title      String
  dueDate    DateTime? @map("due_date") @db.Date
  assignee   String?
  status     String   @db.VarChar(20)  // todo | in_progress | done
}

model ProjectChecklistItem {
  id         Int      @id @default(autoincrement())
  projectId  Int      @map("project_id")
  project    Project  @relation(fields: [projectId], references: [id])
  phaseId    Int?     @map("phase_id")
  phase      ProjectPhase? @relation(fields: [phaseId], references: [id])
  category   String   @db.VarChar(20)  // "teknis" | "komersial" | ...
  label      String                    // "Surat Kerja", "Timesheet", "BAST", dst
  status     String   @db.VarChar(20)  // belum | sudah | expired
  fileUrl    String?  @map("file_url")
}
```

**UI/halaman:**
- `/projects` — list + kanban (status Approval → Closed), mirror pola kanban `/tenders`.
- `/projects/[id]` — detail: info project, checklist dokumen per kategori, task/timeline,
  daftar phase/CTR (kalau ada), link ke `externalProjectUrl` (Project App).
- Trigger "Buat Project": dari `TenderResult` berstatus `Menang` (existing
  `ConvertToProjectModal` jadi entry point nyata, bukan stub lagi) **atau** dari halaman baru
  "Lead Non-Tender" (proposal/quotation manual entry).

#### Area 1.1 — ProjectPhase (siklus pencairan/reporting bertahap — CTR, dst)

Beberapa project (terutama non-tender jangka panjang, contoh: project berjalan dari 2023
sampai sekarang dengan pencairan & reporting per "CTR") punya banyak fase komersial di
bawah satu `Project`. Ini **generik** — bukan cuma project tertentu — jadi jadi bagian dari
Area 1, bukan area terpisah.

```prisma
model ProjectPhase {
  id              Int      @id @default(autoincrement())
  projectId       Int      @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])

  label           String   // "CTR-1", "CTR-8", dst
  sequence        Int      // urutan utk sorting (1, 2, ... 9)
  startDate       DateTime? @map("start_date") @db.Date
  endDate         DateTime? @map("end_date") @db.Date
  status          String   @db.VarChar(20)  // active | closed | planned

  disbursementAmount BigInt?  @map("disbursement_amount")
  disbursementStatus String?  @map("disbursement_status") // belum_cair | proses | cair

  // "summary" = data arsip/backfill seadanya (CTR lama, sebelum tracking rapi dimulai)
  // "full"    = tracking penuh sejak awal fase (CTR yang berjalan sekarang & seterusnya)
  dataCompleteness String  @default("full") @map("data_completeness")

  checklistItems  ProjectChecklistItem[]
}
```

Catatan desain:
- **`ProjectPhase` ≠ "sprint" di Project App.** Phase/CTR adalah siklus *komersial*
  (pencairan + laporan per termin), beda level dari sprint/iterasi kerja teknis. Tidak perlu
  dipaksa 1:1 — link eksternal tetap di level `Project` (lihat Area 4). Kalau nanti Project
  App juga punya konsep phase yang align dengan CTR, `ProjectPhase.externalPhaseId` bisa
  ditambah belakangan — **incremental, tidak blocking**.
- **Migrasi data historis (CTR lama yang belum terdokumentasi rapi):** jangan dipaksa
  normalisasi penuh. Buat `ProjectPhase` dengan `dataCompleteness: "summary"`, isi field yang
  datanya memang ada (rentang tanggal best-effort, nominal pencairan dari catatan finance
  kalau ada, file dokumen yang masih bisa ditemukan). Fase yang sedang berjalan/baru
  ditandai `dataCompleteness: "full"` dan dapat tracking+checklist penuh.
- Tujuan backfill fase lama bukan operational tracking (sudah closed), tapi continuity
  reporting ("project ini total berjalan dari 2023") — sekaligus jadi kandidat referensi di
  **Document Management Hub (Area 3)**, sbg `DocumentRecord` dengan `entityType: "Project"`.
- `ProjectChecklistItem.phaseId` nullable: `null` = checklist level project (dokumen sekali
  jalan, mis. kontrak induk), terisi = checklist per-fase (laporan/invoice/BAST yang
  recurring per CTR). Pertimbangkan **checklist template per kategori project** supaya tiap
  `ProjectPhase` baru auto-generate daftar dokumen wajibnya.

**Dependensi:** tidak ada dependensi eksternal — bisa mulai duluan.

---

#### Area 1.2 — ProjectLead (Non-Tender Lead Pipeline) _(ditambahkan 2026-06-13)_

NON-TENDER PATH di §3 (`Lead → Proposal → Quotation`) butuh tracking sendiri sebelum jadi
`Project` — sebelumnya cuma direncanakan sebagai 1 form manual entry, sekarang jadi
mini-kanban sendiri, generik (bukan cuma utk satu jenis lead).

```prisma
model ProjectLead {
  id             Int      @id @default(autoincrement())
  name           String
  client         String
  status         String   @db.VarChar(20)  // "lead" | "proposal" | "quotation" | "converted" | "cancelled"
  description    String?  @db.Text
  estimatedValue BigInt?  @map("estimated_value")
  notes          String?  @db.Text

  projectId      Int?     @map("project_id")       // diisi saat convert ke Project
  project        Project? @relation(fields: [projectId], references: [id])

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime? @map("updated_at")

  @@map("project_leads")
}
```

**UI/halaman:**
- `/projects/leads` — mini-kanban `Lead → Proposal → Quotation → Converted/Cancelled`,
  pola sama kanban `/tenders` & `/projects`.
- `/projects/leads/new` — form manual entry.
- `/projects/leads/[id]` — detail + tombol "Convert to Project" (aktif begitu status
  `quotation`) → buat `Project` baru (`sourceType: "non_tender"`, `status: "Approval"`),
  set `ProjectLead.projectId` + `status: "converted"`.

**Dependensi:** tidak ada — bagian dari Fase 1, dikerjakan bersamaan dengan Area 1.

---

### Area 2 — HR Module (Data Karyawan)

Tujuan: master data karyawan + dokumen pribadi dengan tracking masa berlaku.

**Schema sketch:**
```prisma
model Employee {
  id              Int      @id @default(autoincrement())
  name            String
  position        String?
  isActive        Boolean  @default(true) @map("is_active")

  // Placeholder link ke admin website (Area 6) — diisi kalau Employee ini berasal
  // dari pelamar vacancy/scholarship yang di-hire. Nullable, tidak blocking Fase 3.
  originApplicantId String? @map("origin_applicant_id")
  source             String? @db.VarChar(30) // "internal" | "admin_website_vacancy" | "admin_website_scholarship"

  documents EmployeeDocument[]
}

model EmployeeDocument {
  id          Int      @id @default(autoincrement())
  employeeId  Int      @map("employee_id")
  employee    Employee @relation(fields: [employeeId], references: [id])
  docType     String   @db.VarChar(20)  // "ktp" | "bpjs" | "ijazah" | "kk" | "npwp"
  fileUrl     String   @map("file_url")
  expiryDate  DateTime? @map("expiry_date") @db.Date  // null = no expiry (ijazah/npwp/kk)
  status      String   @db.VarChar(20)  // valid | expiring_soon | expired | missing
}
```

**UI/halaman:**
- `/hr` — list karyawan, status kelengkapan dokumen per orang (badge per `docType`).
- `/hr/[id]` — detail karyawan + upload/replace dokumen.
- Reuse sistem `Notification` yang sudah ada untuk reminder dokumen mendekati expiry
  (pola sama seperti `_notify_on_scraper_failure` — cek `expiryDate <= now + 30 hari`).

**Dependensi:** tidak ada — independen, bisa paralel dengan Area 1.

---

### Area 3 — Document Management Hub (Repository & Referensi Dokumen) _(redesain 2026-06-14)_

> **Keputusan 2026-06-14**: rencana "Work-Experience Library" (`WorkExperienceRecord`,
> CRUD kontrak/BAST saja) digabung & diperluas jadi modul **Document Management Hub**
> generik — model tunggal `DocumentRecord` dipakai lintas modul (tender, project, phase,
> lead, dst), dengan kategori dinamis (`DocumentCategory`, dikelola admin). Latar
> belakang: feedback user bahwa (a) halaman tender detail belum punya tempat kelola
> dokumen kerja tim (cuma lampiran hasil scraping yang read-only), (b) butuh satu hub
> pencarian dokumen lintas project untuk referensi lampiran kualifikasi tender baru, dan
> (c) kategori dokumen harus bisa diubah sesuai kebutuhan management, bukan hardcoded
> enum.

**Schema sketch:**
```prisma
model DocumentCategory {
  id        Int      @id @default(autoincrement())
  name      String   @unique @db.VarChar(50)  // slug, mis. "kontrak", "bast", "surat_kerja"
  label     String                            // label tampilan, mis. "Kontrak", "BAST"
  group     String?  @db.VarChar(30)          // "teknis" | "komersial" | "legal" | "hr" — grouping/filter kasar
  isActive  Boolean  @default(true) @map("is_active")
  sortOrder Int      @default(0) @map("sort_order")

  documents DocumentRecord[]
  @@map("document_categories")
}

model DocumentRecord {
  id          Int      @id @default(autoincrement())
  title       String
  fileUrl     String   @map("file_url")

  categoryId  Int?     @map("category_id")
  category    DocumentCategory? @relation(fields: [categoryId], references: [id])

  // sumber dokumen — null = standalone (upload manual ke hub, tanpa entity asal)
  entityType  String?  @map("entity_type") @db.VarChar(30)
    // "TenderResult" | "Project" | "ProjectPhase" | "ProjectChecklistItem" | "ProjectLead" | null
  entityId    String?  @map("entity_id")

  client      String?  // nama client terkait, utk filter "referensi project client X"
  tags        String?  // freeform, comma-separated, utk search

  // boleh dipakai sbg lampiran kualifikasi tender lain (internal, via Reference Picker)
  isReference Boolean  @default(false) @map("is_reference")

  uploadedById String? @map("uploaded_by_id")
  uploadedBy   User?   @relation(fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([entityType, entityId])
  @@index([categoryId])
  @@map("document_records")
}
```

**Catatan desain:**
- **1 file = 1 `DocumentRecord`** — beda dari `WorkExperienceRecord` lama yang 1 record
  menyimpan 2 file (kontrak + BAST). Sekarang kontrak & BAST jadi 2 `DocumentRecord`
  terpisah, sama-sama `entityType: "Project"` + `entityId: <project.id>`.
- **Tidak perlu tabel relasi many-to-many (`ProjectWorkExperience`) lagi** — historical
  project (termasuk CTR lama `dataCompleteness: "summary"`, Area 1.1) sudah punya row
  `Project` sendiri, jadi `entityType`/`entityId` langsung cukup untuk "dokumen ini milik
  project mana". Kalau nanti ada kebutuhan track "tender X memakai dokumen Y sbg
  referensi" secara eksplisit, bisa tambah join table kecil belakangan — tidak blocking.
- **`isReference`** — boleh dipakai tim sbg lampiran kualifikasi tender baru (internal,
  lewat Reference Picker). Beda dari `Project.isShowcased` (Area 1/6.2) yang khusus untuk
  portfolio publik website Cliste — dua flag independen, jangan dicampur.
- **`DocumentCategory` dinamis** — dikelola di `/settings/document-categories` (poin 5
  feedback 2026-06-14), bukan enum hardcode. `group` opsional untuk grouping kasar
  (teknis/komersial/legal/hr) dipakai sbg filter cepat.
- **`ProjectChecklistItem.fileUrl`** (existing, single string) dipertahankan apa adanya
  untuk MVP. Migrasi opsional ke `DocumentRecord` (`entityType: "ProjectChecklistItem"`)
  bisa menyusul belakangan — tidak blocking.

**UI/halaman:**
- `/documents` — hub pusat: search & filter by kategori/group/client/tag/entityType/
  `isReference`; tiap baris link ke entity asal (mis. `Project #42` →
  `/projects/42`) kalau `entityType`/`entityId` terisi.
- `/settings/document-categories` — CRUD `DocumentCategory` (poin 5).
- **`DocumentUploadPanel`** (component, embeddable) — dipasang di `tenders/[id]` &
  `projects/[id]`: upload + list dokumen dengan `entityType`/`entityId` = entity saat
  ini, pilih kategori dari dropdown dinamis. Ini jawab poin 3 feedback 2026-06-14 (tim
  butuh tempat kelola dokumen kerja di halaman tender, bukan cuma lampiran scraping
  read-only).
- **`DocumentReferencePicker`** (component, embeddable) — tombol "Cari Referensi
  Dokumen" di `tenders/[id]` & `projects/[id]`, modal filter by kategori/client/tag,
  browse `DocumentRecord` dengan `isReference: true` dari project lain. Jawab poin 4
  feedback 2026-06-14.

**Dependensi:** butuh model `Project` (Fase 1) untuk `entityType: "Project"` links —
dikerjakan **setelah** Fase 1 (beda dari rencana Work-Experience Library lama yang
independen). Tetap relatif kecil scope-nya (CRUD + search + 2 component embeddable).

---

### Area 4 — Integrasi Project App Eksternal (Create-Project API)

Tujuan: saat `Project` di Catalyst mencapai status tertentu (rekomendasi: **Approval** atau
**KickOff** — bukan langsung saat "Menang", karena belum pasti jalan), Catalyst memanggil
API tim Project App untuk membuat project di sana, lalu simpan `externalProjectId` /
`externalProjectUrl` balik ke `Project`.

**Yang harus didapat dari tim Project App (API contract):**
- Endpoint URL untuk create project (`POST /api/projects` atau sejenisnya).
- Payload schema minimum yang mereka wajibkan (nama project, client, scope/deskripsi,
  tim/disiplin yang terlibat, dll).
- Mekanisme auth untuk service-to-service call (API key / service account token — **bukan**
  user session, sesuai catatan di §2.2).
- Format response (project ID + URL untuk disimpan sebagai `externalProjectId`/
  `externalProjectUrl`).
- (Optional) Apakah ada webhook/callback dari Project App ke Catalyst untuk sync status
  balik (misal project di sana sudah "Closed" → update status di Catalyst)?

**Dependensi:** **blocked** sampai ada API contract dari tim Project App. Area ini paling
realistis dikerjakan **terakhir** dari 4 area — schema `Project.externalProjectId`/
`externalProjectUrl` di Area 1 cukup disiapkan sebagai placeholder kolom, diisi belakangan.

---

### Area 5 — Audit Trail (Activity Log) _(ditambahkan 2026-06-13)_

Tujuan: jawab kebutuhan "log perubahan data per project/file, siapa & kapan" — fondasi
audit trail generik, dipasang ke semua aksi mutasi di Area 1-3 (dan seterusnya).
Page-view tracking + online/offline presence **tidak** termasuk di area ini — dicatat
sebagai item terpisah "Belum berfase" (lihat §5 Fase 5 & catatan di `todo.md`), karena
scope & pertimbangan privasinya beda.

**Schema sketch:**
```prisma
model AuditLog {
  id          Int      @id @default(autoincrement())
  userId      String?  @map("user_id")
  user        User?    @relation(fields: [userId], references: [id])

  action      String   @db.VarChar(30)  // "create" | "update" | "delete" | "status_change"
  entityType  String   @db.VarChar(30)  // "Project" | "ProjectPhase" | "ProjectChecklistItem" |
                                          // "ProjectLead" | "Employee" | "EmployeeDocument" |
                                          // "DocumentRecord" | "DocumentCategory" | ...
  entityId    String                    // simpan sbg string, generic utk Int/String id

  changesJson Json?    @map("changes_json")  // { field: { old, new } }
  metadata    Json?                          // context tambahan (route, dll)

  createdAt   DateTime @default(now()) @map("created_at")

  @@index([entityType, entityId])
  @@index([userId])
  @@map("audit_logs")
}
```

**UI/halaman:**
- `/activity-log` — table, filter by `entityType`, `userId`, rentang tanggal; tiap baris
  link ke entity terkait (mis. `Project #42` → `/projects/42`).

**Implementasi:** helper generik `lib/auditLog.js` (`logActivity({ userId, action,
entityType, entityId, changes, metadata })`), dipanggil dari server actions Area 1-3
(`projectActions.js`, `workExperienceActions.js`, `hrActions.js`) setiap kali ada mutasi.

**Dependensi:** idealnya setelah Area 1-3 actions ada (supaya ada titik panggil), tapi
bisa juga ditambahkan incremental ke actions yang sudah jalan — tidak blocking.

---

### Area 6 — Integrasi Admin Website (Recruitment, Scholarship, & Project Portfolio Showcase) _(ditambahkan 2026-06-13, detail field diisi)_

Admin website (sistem/DB terpisah dari `catalystDB`) punya 2 kebutuhan integrasi dengan
Catalyst. Pola integrasi mengikuti `integration-contract-project-app.md` (boundary
contract terpisah, **bukan** relasi Prisma langsung) — draft lengkap di
`integration-contract-admin-website.md`.

#### Area 6.1 — Recruitment (Applicant → Employee)

Admin website menyimpan data lowongan (**vacancy**) & **scholarship** beserta
pelamar/calon karyawan. Pelamar yang **di-hire** (`status: "accepted"`) jadi `Employee`
di HR module Catalyst (Area 2).

- **Field `Applicant` di admin website** _(dikonfirmasi 2026-06-13)_:
  `applicantName`, `appliedFor`, `education`, `domicile`, `availability`,
  `expectedSalary` (nullable), `submitDate`, `status` (`new_applied` | `review` |
  `interviewed` | `accepted` | `rejected`), `email`, `phone`, `linkedin`, `portfolio`,
  `resumeUrl`/cv.
- **Trigger hired**: `status` berubah jadi `"accepted"`.
- **Auth**: API key/service-token sederhana (analog `{SERVICE_TOKEN}` di
  `integration-contract-project-app.md`), bukan SSO/user session.
- **Dokumen**: pelamar **tidak** punya KTP/ijazah/dll di admin website — dokumen itu baru
  diserahkan setelah resmi jadi pegawai (intern/tetap), di-upload langsung di Catalyst
  (`EmployeeDocument`, Fase 3). Jadi **tidak ada reuse dokumen** dari admin website untuk
  Area 6.1 — beda dari asumsi awal.
- **Placeholder di `Employee`** (Area 2, schema sketch sudah ada): `originApplicantId`
  (String?, ID pelamar di admin website) + `source` (`"internal"` |
  `"admin_website_vacancy"` | `"admin_website_scholarship"`).

#### Area 6.2 — Project Portfolio Showcase (Catalyst → Admin Website) _(ditambahkan 2026-06-13, redesain 2026-06-14)_

`Project` (Area 1) dengan `isShowcased: true` jadi item portfolio di website
Cliste (admin website), supaya tim Cliste gak perlu input ulang data project showcase di
dua tempat.

- **Arah data**: Catalyst → admin website (kebalikan dari Area 6.1). Catalyst expose
  daftar `Project` yang `isShowcased: true` via API; admin website yang render
  tampilannya.
- **Field yang relevan untuk showcase**: `title`, `client`, `category.label`,
  `name`, `client`, `poSoDate` (untuk dirender tahunnya), dan `description` (rangkuman project). **Tidak** mengirimkan lampiran dokumen internal apapun.

**Open items Area 6** (lihat juga `integration-contract-admin-website.md`):
- Endpoint & auth detail Area 6.1 (pull vs push saat status `accepted`).
- Endpoint & auth detail Area 6.2 (apakah admin website pull dari Catalyst, atau Catalyst
  push saat `isShowcased` berubah).
- Apakah `Employee` perlu kolom tambahan (email/phone/dll dari `Applicant`) atau cukup
  simpan snapshot ringkas saat hire-time?

**Status & Dependensi**: draft `integration-contract-admin-website.md` sudah dibuat
(field Area 6.1 sudah jelas dari sisi data), tapi endpoint/auth/arah call tetap perlu
dikonfirmasi dengan tim admin website sebelum implementasi. Tidak masuk Fase 1-6 (lihat
§5), dicatat sebagai "Belum berfase" sampai konfirmasi selesai.

---

### Area 7 — Document Generator (Template Engine) _(ditambahkan 2026-06-13)_

Tujuan: generalisasi backend Proposal Generator (TAHAP 6, sudah jalan tapi frontend-nya
0%) jadi **template engine generik** untuk semua jenis dokumen yang dibutuhkan di Project
Maker — Surat Kerja, BAST, Laporan CTR, Invoice, Kontrak, dst — bukan cuma Proposal. Ini
**bukan sistem baru dari nol**: `docx_generator.py` (3 mode: section-replace/placeholder/
from-scratch), `ai_proposal_agent.py` (Claude Haiku + masking), dan model
`ProposalTemplate`/`ProposalDraft`/`ProposalBlock` di-*rename & generalize* jadi
`DocumentTemplate`/`GeneratedDocument`/`DocumentBlock`.

**Kenapa aman di-rename sekarang**: frontend Proposal Generator (TAHAP 6) masih 0% — belum
ada UI yang depend ke nama model lama, jadi rename tidak memutus apapun yang sudah jalan
di production.

**Schema sketch (Prisma) — generalisasi dari `ProposalTemplate`/`ProposalDraft`/`ProposalBlock`:**
```prisma
model DocumentTemplate {
  id           Int      @id @default(autoincrement())
  documentType String   @db.VarChar(30)  // "proposal" | "surat_kerja" | "bast" |
                                          // "invoice" | "kontrak" | "laporan_ctr"
  name         String
  fileUrl      String   @map("file_url")     // path .docx, storage/document_templates/
  aiSections   Json?    @map("ai_sections")  // daftar heading/placeholder yang perlu AI;
                                              // [] atau null = pure data-fill, 0 token AI
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime? @map("updated_at")

  documents    GeneratedDocument[]
  @@map("document_templates")
}

model GeneratedDocument {
  id           Int      @id @default(autoincrement())
  templateId   Int?     @map("template_id")
  template     DocumentTemplate? @relation(fields: [templateId], references: [id])
  documentType String   @db.VarChar(30)

  // generic link, bukan cuma ke TenderResult — bisa Project, ProjectChecklistItem,
  // ProjectPhase, ProjectLead, DocumentRecord, dst
  entityType   String   @db.VarChar(30)
  entityId     String   @map("entity_id")

  fileUrl      String?  @map("file_url")  // hasil export .docx terakhir
  status       String   @db.VarChar(20)   // "draft" | "exported"

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime? @map("updated_at")

  blocks       DocumentBlock[]
  @@map("generated_documents")
}

model DocumentBlock {
  id                  Int      @id @default(autoincrement())
  generatedDocumentId Int      @map("generated_document_id")
  generatedDocument   GeneratedDocument @relation(fields: [generatedDocumentId], references: [id])

  sectionKey  String   @db.VarChar(50)  // nama heading/placeholder, mis. "SCOPE_OF_WORK"
  content     String   @db.Text
  source      String   @db.VarChar(10)  // "data" | "ai" | "manual"
  approved    Boolean  @default(false)

  @@map("document_blocks")
}
```

**Strategi minimalisasi token AI** (concern utama yang diangkat user):

1. **Default = data-fill, bukan AI.** Mayoritas dokumen (Surat Kerja, BAST, Invoice,
   Laporan CTR) isinya substitusi data terstruktur dari `Project`/`ProjectPhase`/
   `Employee`/`DocumentRecord` ke placeholder `.docx` (`{{CLIENT_NAME}}`,
   `{{PHASE_LABEL}}`, dst) — **0 token AI**. AI hanya dipanggil kalau
   `DocumentTemplate.aiSections` tidak kosong.
2. **AI sections eksplisit per-template.** Saat upload/setup template di panel (lihat
   di bawah), user tandai heading mana yang butuh narasi AI (mis. "SCOPE OF WORK" di
   Kontrak/Proposal). Section lain tetap data-fill. Kebanyakan template (Surat Kerja,
   BAST, Invoice) realistis `aiSections: []`.
3. **Reuse Claude Haiku + masking** — pola sama `ai_proposal_agent.py`
   (`claude-haiku-4-5-20251001`, model termurah, masking data sensitif tetap jalan
   sebelum/после call AI — lihat `security-checklist.md` §7).
4. **Prompt minimal & ter-scope.** Hanya kirim field-field yang relevan ke
   `sectionKey` yang sedang di-generate (mis. untuk "SCOPE OF WORK" cukup kirim
   `project.name`, `project.client`, deskripsi singkat — bukan seluruh `tender_text`
   atau seluruh dokumen).
5. **Generate-once, cache di `DocumentBlock.content`.** Re-export `.docx` (`status:
   "exported"`) **tidak** memanggil AI ulang — pakai `content` yang sudah tersimpan.
   AI hanya dipanggil ulang kalau user klik "Regenerate" per-block (sama pola
   approve/edit `ProposalBlock` yang sudah ada).
6. **Edit manual setelah generate** — `DocumentBlock.source: "manual"` setelah user
   edit, supaya regenerate-all tidak menimpa edit manual tanpa konfirmasi.

**UI/halaman:**
- `/settings/document-templates` — **panel manajemen template** (lihat §5 Fase 6 untuk
  detail): list `DocumentTemplate` per `documentType`, upload `.docx` baru, toggle
  `isActive` (versi lama tetap tersimpan untuk referensi `GeneratedDocument` historis,
  tidak dihapus), edit `aiSections` (centang heading mana yang pakai AI).
- Entry point generate: dari `ProjectChecklistItem` (mis. item "Surat Kerja" di
  `/projects/[id]`) — tombol "Generate Document" → pilih `DocumentTemplate` aktif untuk
  `documentType` terkait → buat `GeneratedDocument` + `DocumentBlock`s → review/edit →
  export `.docx` → `fileUrl` disimpan balik ke `ProjectChecklistItem.fileUrl`.
- Proposal Generator (TAHAP 6 existing) jadi salah satu `documentType: "proposal"`,
  entry point dari `TenderResult` tetap seperti rencana semula
  (`tenders/[id]/proposal/page.jsx`).

**Migrasi dari TAHAP 6:**
- Rename model SQLAlchemy + Prisma: `ProposalTemplate`→`DocumentTemplate` (+
  `documentType: "proposal"` default utk row existing), `ProposalDraft`→
  `GeneratedDocument` (+ `entityType: "TenderResult"`, `entityId:
  tenderResultId.toString()`), `ProposalBlock`→`DocumentBlock`.
- `docx_generator.py`/`ai_proposal_agent.py` — generalisasi parameter dari
  "tender-specific" jadi terima `entityType`/`entityId` + data dict generik,
  logic 3-mode (section-replace/placeholder/from-scratch) tetap sama.
- Endpoint `/api/v1/proposals*` → `/api/v1/documents*` (atau tetap
  `/api/v1/proposals*` untuk `documentType=proposal` sebagai alias — **keputusan
  open**, lihat §6).

**Dependensi:** tidak blocking — backend Proposal Generator (TAHAP 6) sudah ada sebagai
basis, jadi Fase 6 ini sebagian besar *refactor + generalisasi* + panel baru, bukan
bangun dari nol. Realistis dikerjakan **terakhir** (sesuai permintaan user) karena
manfaatnya paling besar setelah `ProjectChecklistItem` (Fase 1), `DocumentRecord`
(Fase 2), dan `Employee` (Fase 3) — sumber data untuk data-fill — sudah ada.

---

## 5. Fase Implementasi

> Urutan ini menggantikan rencana lama "App 2 — Internal Workspace TAHAP A-G" di `todo.md`
> (lihat catatan supersede di sana). Setiap fase punya scope, output, dan dependensi
> sendiri — Fase 1-3 bisa dikerjakan tanpa menunggu pihak luar, Fase 4 blocked.

### Fase 1 — Project Pipeline Extension (Area 1 + 1.1 + 1.2)

- **Scope**: model Prisma `Project`, `ProjectTask`, `ProjectChecklistItem`, `ProjectPhase`,
  `ProjectLead` (+ `npx prisma db push`); halaman `/projects` (list + kanban status
  Approval→Closed), `/projects/[id]` (detail, checklist per kategori, daftar
  `ProjectPhase`), dan `/projects/leads` (mini-kanban Lead→Proposal→Quotation, Area 1.2).
- **Entry point**: `ConvertToProjectModal` (saat ini stub) jadi aktif — dipanggil dari
  `TenderResult` berstatus `Menang`; jalur non-tender lewat `ProjectLead` (Area 1.2) —
  status `quotation` → "Convert to Project".
- **Siapkan untuk Fase 4**: kolom `Project.externalProjectId` / `externalProjectUrl` dibuat
  sebagai placeholder (nullable), belum diisi. `ProjectPhase.externalPhaseId` **tidak**
  ditambah di fase ini — dicatat sebagai open item di Fase 4 saja (lihat Fase 4 & §6).
- **Output**: fondasi — Fase 2-5 semua nempel ke `Project`.
- **Dependensi**: tidak ada — bisa mulai duluan.

### Fase 2 — Document Management Hub (Area 3) _(redesain 2026-06-14)_

- **Scope**: model `DocumentCategory` + `DocumentRecord` (+ `npx prisma db push`);
  halaman `/documents` (hub pusat search/filter), `/settings/document-categories` (CRUD
  kategori dinamis); component `DocumentUploadPanel` & `DocumentReferencePicker`
  dipasang di `tenders/[id]` & `projects/[id]`.
- **Output**: repo dokumen lintas modul + kategori dinamis, sekaligus jadi tempat kelola
  dokumen kerja tim di halaman tender (jawab poin 3 feedback 2026-06-14) dan sumber
  portfolio untuk Area 6.2.
- **Dependensi**: butuh model `Project` (Fase 1) untuk `entityType: "Project"` links —
  dikerjakan setelah Fase 1 (beda dari rencana Work-Experience Library lama yang
  independen).

### Fase 3 — HR Module (Area 2)

- **Scope**: model `Employee`, `EmployeeDocument`; halaman `/hr` (list karyawan + status
  kelengkapan dokumen) dan `/hr/[id]` (detail + upload/replace dokumen).
- **Reuse**: sistem `Notification` yang sudah ada, untuk reminder dokumen mendekati
  `expiryDate` (pola sama seperti `_notify_on_scraper_failure`).
- **Dependensi**: tidak ada — independen, bisa paralel dengan Fase 1-2.

### Fase 4 — Integrasi Project App (Area 4 + Reporting + Identity Matching)

- **Status**: **blocked** — menunggu `integration-contract-project-app.md` disepakati
  dengan tim Project App (lihat §7 Open Items di dokumen tersebut).
- **Scope setelah contract didapat**:
  1. Implement call `POST {PROJECT_APP_URL}/api/integrations/projects` saat `Project`
     mencapai status Approval/KickOff → simpan `externalProjectId`/`externalProjectUrl`
     (integration contract §2-3).
  2. Reporting reference: generate deep-link S-Curve/Timesheet per `ProjectPhase`,
     disimpan di `ProjectChecklistItem.fileUrl` (integration contract §6).
  3. Document Management & Client Portal: link-out ke Project App, bukan implementasi
     baru (lihat §2.1 — keputusan 2026-06-13).
  4. Identity matching: jalankan Skema A (email) untuk link data existing; mulai capture
     `globalSubject` di kedua sistem untuk record baru (integration contract §9) —
     tidak blocking, bisa berjalan paralel begitu SSO/Entra aktif.
- **Dependensi**: blocked sampai API contract ada — realistis dikerjakan terakhir dari
  4 fase, tapi kolom placeholder di Fase 1 sudah siap diisi begitu contract selesai.

### Fase 5 — Audit Trail / Activity Log (Area 5) _(ditambahkan 2026-06-13)_

- **Scope**: model `AuditLog` + helper `lib/auditLog.js` (`logActivity`), terintegrasi ke
  server actions Fase 1-3 (`projectActions.js` termasuk `ProjectLead`,
  `workExperienceActions.js`, `hrActions.js`); halaman `/activity-log` (table + filter
  entityType/user/tanggal).
- **Tidak termasuk**: page-view tracking & online/offline presence — beda scope &
  pertimbangan privasi, dicatat "Belum berfase" di `todo.md` bareng RAG & Area 6.
- **Dependensi**: idealnya setelah Fase 1-3 actions ada (titik panggil `logActivity`),
  tapi bisa dicicil incremental ke actions yang sudah jalan.

### Fase 6 — Document Generator / Template Engine (Area 7) _(ditambahkan 2026-06-13, fase terakhir)_

- **Scope**: rename + generalisasi model `ProposalTemplate`/`ProposalDraft`/
  `ProposalBlock` → `DocumentTemplate`/`GeneratedDocument`/`DocumentBlock` (Prisma +
  SQLAlchemy), generalisasi `docx_generator.py`/`ai_proposal_agent.py` untuk terima
  `entityType`/`entityId` generik; panel `/settings/document-templates` (CRUD template
  per `documentType`, toggle `aiSections`); entry point "Generate Document" dari
  `ProjectChecklistItem`.
- **Token minimization**: default data-fill (0 AI token) untuk dokumen tanpa
  `aiSections`; AI (Claude Haiku) hanya untuk section yang ditandai eksplisit per
  template; generate-once + cache `DocumentBlock.content` (re-export tidak panggil AI
  ulang); masking tetap jalan (lihat `security-checklist.md` §7).
- **Output**: Proposal Generator (TAHAP 6) jadi `documentType: "proposal"` dalam sistem
  generik ini — frontend yang sebelumnya direncanakan khusus proposal otomatis reusable
  untuk Surat Kerja/BAST/Invoice/Kontrak/Laporan CTR.
- **Dependensi**: tidak blocking secara teknis (basis backend sudah ada dari TAHAP 6),
  tapi value paling besar setelah `ProjectChecklistItem` (Fase 1), `DocumentRecord`
  (Fase 2), `Employee` (Fase 3) tersedia sebagai sumber data-fill. **Sengaja ditaruh
  sebagai fase terakhir** sesuai keputusan user 2026-06-13.

## 6. Open Questions

- [x] ~~Konfirmasi naming: apakah app/sidebar benar-benar di-rebrand "Project Maker"~~ —
      **Keputusan 2026-06-13**: ya, rebrand ke "Project Maker". Modul "Tenders" (sourcing)
      tetap ada sebagai sub-bagian. Task aktual (ganti judul/branding sidebar &
      dashboard) dicatat sebagai item Fase 1 (lihat `todo.md` §1.5).
- [ ] API contract create-project dari tim Project App (Fase 4) — lihat
      `integration-contract-project-app.md` §7 Open Items.
- [ ] SSO/Entra migration — kapan diprioritaskan? (dicatat sebagai workstream terpisah,
      di luar 4 fase ini; terkait §9 identity matching di integration contract)
- [x] ~~Many-to-many `Project` ↔ `WorkExperienceRecord`~~ — **Keputusan 2026-06-13**: ya,
      tabel relasi eksplisit (`ProjectWorkExperience`) — karena `WorkExperienceRecord`
      juga jadi showcase portfolio website Cliste (Area 6.2), butuh relasi terstruktur,
      bukan cuma manual notes. **Superseded 2026-06-14**: Area 3 diredesain jadi
      `DocumentRecord` polymorphic (`entityType`/`entityId` langsung ke `Project`) — tabel
      relasi terpisah tidak diperlukan lagi, lihat Area 3.
- [ ] `ProjectPhase.externalPhaseId` (link CTR ↔ phase/sprint di Project App) — apakah
      Project App punya konsep yang align? Tunggu API contract Fase 4, jangan blocking.
      **Keputusan 2026-06-13**: dicatat sebagai open item di Fase 4 saja (todo.md §4.0),
      tidak ditambah sebagai kolom placeholder di Fase 1.
- [x] ~~Sumber data backfill CTR lama~~ — **Keputusan 2026-06-13**: catatan finance/data
      historis CTR1-7 **tersedia lengkap**. Tidak ada blocker untuk pengisian
      `ProjectPhase` dengan `dataCompleteness: "summary"` di Fase 1.1.
- [x] ~~Checklist template per kategori project — siapa yang nentuin daftar dokumen
      wajib?~~ — **Keputusan 2026-06-13**: **tidak ada template fixed per kategori**.
      Dokumen wajib berbeda-beda per pekerjaan — client yang infokan apa saja yang perlu
      diserahkan, lalu tim administratif/management yang input `ProjectChecklistItem`
      secara manual per project (sesuai desain `createChecklistItem`/
      `updateChecklistItem` yang sudah ada di Fase 1, tidak perlu fitur "generate
      checklist dari template kategori").
- [ ] **Area 6** — `integration-contract-admin-website.md` sudah dibuat dengan field
      `Applicant` (Area 6.1) yang sudah jelas, tapi **endpoint/auth/arah call** (pull vs
      push, untuk Area 6.1 & 6.2) masih perlu dikonfirmasi dengan tim admin website.
- [x] ~~**Area 5** — retensi `AuditLog`~~ — **Keputusan 2026-06-13**: tanpa retention
      policy untuk sekarang — simpan permanen ("selamanya mungkin"), direvisit kalau
      volume jadi masalah atau ada kebijakan PII baru.
- [x] ~~**Area 7 (Fase 6)** — endpoint `/api/v1/proposals*` di-rename atau alias?~~ —
      **Keputusan 2026-06-13**: `documentType` jadi **data field** (body/query param),
      bukan path segment — satu set endpoint generik `/api/v1/documents*`
      (`/templates` = management, root `POST` = generator, `/{id}` = ID
      `GeneratedDocument`). `/api/v1/proposals*` existing dipertahankan sebagai alias
      `documentType="proposal"` (lihat Area 7).
- [x] ~~**Area 7 (Fase 6)** — cara user menandai `aiSections`~~ — **Keputusan
      2026-06-13**: scan heading `Heading 1`/`Heading 2` dari `.docx` yang diupload,
      tampilkan sebagai checklist (persis sesuai struktur template), user centang mana
      yang `aiSections`.
