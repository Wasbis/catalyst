# Security Checklist — Catalyst (catalyst-scout + scraper-engine)

> Checklist ini berdasarkan kondisi codebase per 2026-06-13. Status `✅` = sudah
> diimplementasi dan diverifikasi dari kode, `⚠️` = belum ada / perlu ditambahkan,
> `🔵` = catatan/keputusan desain (bukan kekurangan, tapi perlu diingat).
>
> Update checklist ini setiap kali ada perubahan terkait auth, storage, atau
> integrasi eksternal — supaya tetap jadi referensi yang akurat, bukan dokumen
> mati.

---

## 1. Auth & Session (catalyst-scout)

- [x] ✅ **Session token JWT** — `src/lib/auth.js`, signed `HS256` dengan `JWT_SECRET`
      dari env, `setExpirationTime("7d")`.
- [x] ✅ **Cookie session aman** — `httpOnly: true`, `secure: NODE_ENV === "production"`,
      `sameSite: "lax"`, `maxAge` 7 hari. Sudah sesuai best practice, **tidak perlu
      diubah**.
- [x] ✅ **Password hashing** — bcrypt, cost factor 10 (`hashPassword`/`verifyPassword`).
- [ ] ⚠️ **Rate limiting / lockout pada `loginAction`** — saat ini (`authActions.js`)
      tidak ada pembatasan jumlah percobaan login. Rawan brute-force/credential
      stuffing terhadap endpoint `/login`. Rekomendasi: tambah rate limit per
      IP+email (mis. 5x gagal → lock 15 menit), bisa pakai in-memory/Redis counter
      atau middleware Next.js.
- [ ] ⚠️ **JWT_SECRET rotation policy** — belum ada dokumentasi/prosedur rotasi
      `JWT_SECRET`. Kalau secret di-rotate, semua session aktif invalid sekaligus
      (acceptable, tapi perlu SOP: rotate saat low-traffic, beri tahu user re-login).
- [ ] 🔵 **Session duration 7 hari tanpa refresh** — kalau ke depan butuh
      "remember me" vs sesi pendek untuk data sensitif (HR/PII), pertimbangkan
      JWT lifetime lebih pendek + refresh token terpisah. Tidak urgent untuk MVP.

---

## 2. File Upload & Storage

### 2.1 Fase 2 — Work-Experience (`public/uploads/work-experience/`)
- [ ] ⚠️ **Validasi file upload** (`app/api/work-experience/upload/route.js`) —
      pastikan validasi: ekstensi whitelist (`.pdf`, `.docx`, `.jpg`, `.png`),
      cek `mimetype` aktual (bukan cuma ekstensi nama file — bisa di-spoof), dan
      batas ukuran file (mis. max 10MB) sebelum disimpan.
- [x] 🔵 **Random filename** — sudah direncanakan pakai `crypto.randomUUID()` prefix
      untuk hindari collision/overwrite & path traversal via nama file user.
- [ ] 🔵 **Public access ke kontrak/BAST** — file di `public/uploads/` bisa diakses
      tanpa auth oleh siapapun yang punya link. Acceptable untuk MVP (kontrak
      kerja bukan data paling sensitif), tapi **revisit kalau ada kontrak
      confidential/NDA** — pindahkan ke pola non-public seperti §2.2.

### 2.2 Fase 3 — HR Documents (`storage/hr/`, PII)
- [x] 🔵 **Non-public storage** — `storage/hr/` (gitignored), **bukan** di `public/`,
      karena isi `EmployeeDocument` adalah data PII (KTP, NPWP, KK, BPJS, Ijazah).
- [ ] ⚠️ **Auth-gated file route** (`app/api/hr/files/[...path]/route.js`) — wajib
      cek session (401 kalau belum login) **dan role** (mis. hanya HR/Admin yang
      boleh akses dokumen karyawan lain — bukan semua user login). Pastikan juga
      validasi path untuk cegah path traversal (`../../`) di parameter `[...path]`.
- [ ] ⚠️ **Validasi file upload HR** — sama seperti §2.1: whitelist ekstensi
      (KTP/KK/Ijazah biasanya `.pdf`/`.jpg`/`.png`), cek mimetype aktual, limit
      ukuran.
- [ ] ⚠️ **Encryption at rest** — kalau server/disk `storage/hr/` di luar kontrol
      penuh (shared hosting, snapshot backup ke 3rd party), pertimbangkan enkripsi
      disk-level (LUKS/BitLocker) atau enkripsi file individual sebelum simpan.
      Untuk Postgres: kalau field PII (NIK, NPWP) disimpan sebagai kolom
      terstruktur (bukan cuma file scan), pertimbangkan `pgcrypto` atau
      app-level encryption untuk kolom tersebut.

---

## 3. API & CORS (scraper-engine)

- [ ] ⚠️ **CORS belum dikonfigurasi** — grep `scraper-engine/api/main.py` untuk
      `CORSMiddleware`/`allow_origins` = 0 hasil. Saat ini FastAPI **tidak**
      mengizinkan request cross-origin dari browser manapun (default deny), yang
      sebenarnya **aman** karena semua call ke scraper-engine dilakukan
      server-to-server dari catalyst-scout (lewat `SCRAPER_API_URL`), bukan dari
      browser client.
      - 🔵 **Jangan tambahkan CORS permisif** (`allow_origins=["*"]`) kecuali ada
        kebutuhan konkret memanggil scraper-engine langsung dari browser.
      - ⚠️ Jika suatu saat scraper-engine perlu dipanggil dari browser (mis.
        dashboard terpisah), tambahkan `CORSMiddleware` dengan `allow_origins`
        **terbatas** ke domain catalyst-scout (env var), jangan wildcard.
- [ ] ⚠️ **Auth pada endpoint scraper-engine** — pastikan endpoint
      `/api/v1/*` (scrape trigger, proposal generate, dll) tidak bisa diakses
      publik tanpa kredensial — minimal shared-secret header/API key antara
      catalyst-scout ↔ scraper-engine, terutama untuk endpoint yang trigger
      scraping (resource-intensive) atau panggil AI (biaya token).

---

## 4. Service-to-Service Tokens (Fase 4 — Integrasi Project App)

> Lihat `integration-contract-project-app.md` §3, §7.

- [ ] ⚠️ **`PROJECT_APP_SERVICE_TOKEN` / `{SERVICE_TOKEN}`** — saat mekanisme ini
      diimplementasi (Fase 4, masih blocked):
      - Simpan token di env var, **bukan** hardcode/commit ke repo.
      - Tentukan rotasi periodik (mis. tiap 90 hari) — catat di SOP deployment.
      - Token harus scoped minimal (hanya endpoint integrasi `/api/integrations/*`,
        bukan token admin umum).
      - Endpoint callback `POST /api/integrations/project-status` di sisi Catalyst
        (§4 contract) wajib validasi `Authorization: Bearer {SERVICE_TOKEN}` —
        jangan terima webhook tanpa auth.

---

## 5. Database — Least Privilege

- [ ] ⚠️ **Role Postgres terpisah** — saat ini kemungkinan catalyst-scout
      (Prisma) dan scraper-engine (SQLAlchemy) pakai 1 user/role Postgres yang
      sama dengan akses penuh. Rekomendasi jangka menengah:
      - Role Prisma: full akses ke schema (karena ini yang owning migration).
      - Role scraper-engine: akses terbatas hanya ke tabel yang ditulis scraper
        (tabel tender/scraping result), bukan tabel `User`, `Employee`,
        `EmployeeDocument`, `AuditLog`.
      - Tidak urgent untuk MVP single-developer, tapi penting kalau scraper-engine
        ter-expose lebih luas atau ada kontributor lain.

---

## 6. Dependency Audit

- [ ] ⚠️ **`npm audit`** (catalyst-scout) dan **`pip-audit`**/`safety`
      (scraper-engine) — jalankan periodik (mis. sebelum tiap release/deploy),
      terutama untuk dependency yang berkaitan dengan auth (`jose`, `bcrypt`),
      file parsing (`python-docx`, PDF libs — sering jadi target CVE), dan
      HTTP client scraping.
- [ ] 🔵 Catat hasil audit & exception (kalau ada vuln yang sengaja di-skip
      karena tidak exploitable di konteks ini) di sini atau di `guideline.md`.

---

## 7. AI / Masking (existing feature — jangan rusak)

- [x] ✅ **Masking sebelum kirim ke OpenAI/Claude** — fitur masking data sensitif
      (di `ai_proposal_agent.py` / pipeline proposal) **sudah ada dan wajib tetap
      berjalan** — ini flagged sebagai pre-prod requirement di deployment
      checklist. Saat membangun Fase 6 (Document Generator), pastikan masking
      tetap dipanggil di semua jalur yang kirim data ke AI, tidak hanya jalur
      proposal yang sudah ada.
- [ ] ⚠️ **Audit coverage masking** — saat Fase 6 menggeneralisasi
      `ai_proposal_agent.py` untuk banyak `documentType`, pastikan field yang
      di-mask (NIK, harga internal, dll) konsisten across semua document type —
      jangan ada document type baru yang lupa apply masking.

---

## 8. Audit Trail & Observability (Fase 5)

- [ ] 🔵 **`AuditLog` (Fase 5)** — begitu Fase 5 jalan, log mutasi data sensitif
      (`EmployeeDocument`, `User`, `AuditLog` itu sendiri tidak boleh bisa
      di-delete oleh role non-admin) jadi sumber forensik utama kalau terjadi
      insiden (mis. siapa yang akses/ubah dokumen HR kapan).
- [ ] ⚠️ **Login attempt logging** — terkait §1, pertimbangkan log percobaan
      login gagal (email + timestamp + IP) terpisah dari `AuditLog` mutasi data,
      untuk deteksi brute-force.

---

## 9. Ringkasan Prioritas (untuk MVP saat ini)

Urutan rekomendasi kalau waktu terbatas:

1. **Rate limiting login** (§1) — murah, dampak besar terhadap brute-force.
2. **Validasi file upload** (§2.1, §2.2) — mencegah upload file berbahaya
   (mis. `.php`/`.exe` menyamar sebagai `.pdf`).
3. **Auth + path-traversal guard** pada `/api/hr/files/[...path]` (§2.2) — data
   PII karyawan, paling sensitif di seluruh sistem saat ini.
4. Sisanya (CORS, service token, DB least-privilege, encryption at rest,
   dependency audit) bisa menyusul seiring Fase 3/4/5 berjalan — sudah dicatat
   sebagai item per-fase di `todo.md` masing-masing.
