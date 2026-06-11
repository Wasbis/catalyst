// ============================================================
// Catalyst — Mock Data & Constants
// ============================================================

const STATUSES = ["DITEMUKAN", "DITINJAU", "DIKEJAR", "DISERAHKAN", "MENANG", "KALAH", "BATAL"];

const STATUS_LABELS = {
  DITEMUKAN: "Ditemukan",
  DITINJAU: "Ditinjau",
  DIKEJAR: "Dikejar",
  DISERAHKAN: "Diserahkan",
  MENANG: "Menang",
  KALAH: "Kalah",
  BATAL: "Batal",
};

const STATUS_DESC = {
  DITEMUKAN: "Baru ditemukan scraper, belum ditinjau",
  DITINJAU: "Sedang dianalisis kelayakannya",
  DIKEJAR: "Diputuskan untuk diikuti — proposal disiapkan",
  DISERAHKAN: "Proposal sudah disubmit, menunggu hasil",
  MENANG: "Tender dimenangkan",
  KALAH: "Tender tidak dimenangkan",
  BATAL: "Dibatalkan / tidak relevan",
};

const SOURCES = {
  CIVD: { label: "CIVD", full: "CIVD — SKK Migas", color: "#0e7490" },
  GEODIPA: { label: "GeoDipa", full: "PT Geo Dipa Energi", color: "#b45309" },
  MANUAL: { label: "Manual", full: "Input Manual", color: "#64748b" },
};

function recoFromScore(score) {
  if (score == null) return null;
  if (score >= 70) return "KEJAR";
  if (score >= 40) return "TINJAU";
  return "LEWATI";
}

// ---- KBLI master ----
const KBLI_MASTER = [
  { code: "71102", description: "Aktivitas Keinsinyuran dan Konsultasi Teknis YBDI", active: true },
  { code: "71202", description: "Analisis dan Uji Teknis", active: true },
  { code: "09100", description: "Aktivitas Penunjang Pertambangan Minyak Bumi dan Gas Alam", active: true },
  { code: "42915", description: "Konstruksi Bangunan Sipil Elektrikal", active: true },
  { code: "43221", description: "Instalasi Saluran Air (Plumbing)", active: true },
  { code: "62019", description: "Aktivitas Pemrograman Komputer Lainnya", active: true },
  { code: "62029", description: "Aktivitas Konsultasi Komputer dan Manajemen Fasilitas Komputer Lainnya", active: true },
  { code: "71101", description: "Aktivitas Arsitektur", active: true },
  { code: "33131", description: "Reparasi Alat Ukur, Alat Uji, Alat Navigasi dan Kontrol", active: true },
  { code: "43210", description: "Instalasi Sistem Kelistrikan", active: true },
  { code: "35202", description: "Distribusi Gas Alam dan Buatan", active: false },
  { code: "08910", description: "Pertambangan Mineral, Bahan Kimia dan Bahan Pupuk", active: false },
];

// ---- Notes generator helper ----
let _noteId = 100;
function mkNote(author, body, daysAgo) {
  return { id: ++_noteId, author, body, at: daysFromNow(-daysAgo) };
}

// ---- date helpers ----
function daysFromNow(d) {
  const t = new Date("2026-06-10T09:00:00");
  t.setDate(t.getDate() + d);
  return t.toISOString();
}

// ---- KBLI match builders ----
function km(code, score) {
  const found = KBLI_MASTER.find((k) => k.code === code);
  return { kbli_code: code, description: found ? found.description : "—", score };
}

// ============================================================
// TENDERS
// ============================================================
const TENDERS = [
  {
    id: "t-2401",
    title: "Jasa Konsultansi Detail Engineering Design (DED) Fasilitas Produksi Lapangan Gas Bumi Blok Mahakam",
    agency: "SKK Migas",
    operator: "PT Pertamina Hulu Mahakam",
    source: "CIVD",
    status: "DIKEJAR",
    score: 88,
    budget: 14500000000,
    deadline: daysFromNow(6),
    publishedAt: daysFromNow(-9),
    location: "Kalimantan Timur",
    hps: "Rp 14.500.000.000",
    method: "Pelelangan Umum",
    contractType: "Lumpsum",
    url: "https://civd.skkmigas.go.id/tender/2401",
    kbli: [km("71102", 0.91), km("71202", 0.78), km("09100", 0.71)],
    tenderText:
      "Pekerjaan jasa konsultansi untuk penyusunan Detail Engineering Design (DED) fasilitas produksi gas bumi mencakup process engineering, piping & instrumentation diagram (P&ID), plot plan, struktur baja, sistem perpipaan, instrumentasi & kontrol, serta sistem kelistrikan. Penyedia wajib memiliki pengalaman sejenis di sektor hulu migas minimal 5 tahun, sertifikasi keinsinyuran, dan tim ahli bersertifikat. Lingkup termasuk koordinasi dengan tim operator, HAZOP study, dan penyusunan dokumen tender konstruksi.",
    notes: [mkNote("Andi Pratama", "Sudah hubungi tim teknis, kapasitas tim cukup untuk Q3. Lanjut siapkan proposal.", 2), mkNote("Rina Kusuma", "HPS cukup besar, margin sehat. Prioritas KEJAR.", 4)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-9), by: "Sistem (Scraper CIVD)" },
      { status: "DITINJAU", at: daysFromNow(-7), by: "Rina Kusuma" },
      { status: "DIKEJAR", at: daysFromNow(-4), by: "Andi Pratama" },
    ],
  },
  {
    id: "t-2402",
    title: "Pengadaan Jasa FEED Study Pengembangan Lapangan Panas Bumi Unit 2 Dieng",
    agency: "PT Geo Dipa Energi",
    operator: "PT Geo Dipa Energi (Persero)",
    source: "GEODIPA",
    status: "DITINJAU",
    score: 76,
    budget: 8900000000,
    deadline: daysFromNow(11),
    publishedAt: daysFromNow(-5),
    location: "Banjarnegara, Jawa Tengah",
    hps: "Rp 8.900.000.000",
    method: "Pelelangan Terbatas",
    contractType: "Lumpsum",
    url: "https://eproc.geodipa.co.id/tender/2402",
    kbli: [km("71102", 0.82), km("71202", 0.74)],
    tenderText:
      "Front End Engineering Design (FEED) untuk pengembangan unit pembangkit listrik tenaga panas bumi (PLTP) kapasitas 55 MW. Lingkup mencakup conceptual design, basic engineering, steam field gathering system, power plant interface, dan estimasi biaya kelas-3 (AACE). Penyedia harus memiliki pengalaman geothermal dan tenaga ahli proses bersertifikat.",
    notes: [mkNote("Budi Santoso", "Geothermal — kompetensi kita pas. Cek ketersediaan ahli geothermal.", 1)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-5), by: "Sistem (Scraper GeoDipa)" },
      { status: "DITINJAU", at: daysFromNow(-3), by: "Budi Santoso" },
    ],
  },
  {
    id: "t-2403",
    title: "Jasa Inspeksi dan Sertifikasi Pipa Penyalur Gas (Pipeline Integrity Assessment)",
    agency: "SKK Migas",
    operator: "PT Medco E&P Indonesia",
    source: "CIVD",
    status: "DISERAHKAN",
    score: 81,
    budget: 6200000000,
    deadline: daysFromNow(-2),
    publishedAt: daysFromNow(-22),
    location: "Sumatra Selatan",
    hps: "Rp 6.200.000.000",
    method: "Pelelangan Umum",
    contractType: "Unit Price",
    url: "https://civd.skkmigas.go.id/tender/2403",
    kbli: [km("71202", 0.88), km("33131", 0.69), km("09100", 0.66)],
    tenderText:
      "Pekerjaan inspeksi integritas pipa penyalur gas sepanjang 142 km mencakup in-line inspection (ILI), close interval potential survey (CIPS), direct current voltage gradient (DCVG), dan penilaian sisa umur pakai. Dokumen wajib: sertifikat inspektur NDT level II, peralatan terkalibrasi, dan metodologi sesuai API 1160.",
    notes: [mkNote("Andi Pratama", "Proposal sudah disubmit 8 Juni. Menunggu pengumuman.", 2), mkNote("Sari Wulandari", "Dokumen administrasi lengkap, sudah double-check.", 5)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-22), by: "Sistem (Scraper CIVD)" },
      { status: "DITINJAU", at: daysFromNow(-20), by: "Sari Wulandari" },
      { status: "DIKEJAR", at: daysFromNow(-16), by: "Andi Pratama" },
      { status: "DISERAHKAN", at: daysFromNow(-2), by: "Andi Pratama" },
    ],
  },
  {
    id: "t-2404",
    title: "Pengembangan Sistem Informasi Manajemen Aset Terintegrasi (SIMA) Berbasis Web",
    agency: "PT Geo Dipa Energi",
    operator: "PT Geo Dipa Energi (Persero)",
    source: "GEODIPA",
    status: "MENANG",
    score: 72,
    budget: 3400000000,
    deadline: daysFromNow(-18),
    publishedAt: daysFromNow(-48),
    location: "Jakarta",
    hps: "Rp 3.400.000.000",
    method: "Pelelangan Terbatas",
    contractType: "Lumpsum",
    url: "https://eproc.geodipa.co.id/tender/2404",
    kbli: [km("62019", 0.86), km("62029", 0.8)],
    tenderText:
      "Pengembangan aplikasi web manajemen aset (asset lifecycle, maintenance scheduling, dashboard KPI) terintegrasi dengan sistem ERP existing. Mencakup analisis kebutuhan, perancangan UI/UX, pengembangan, migrasi data, pelatihan, dan pemeliharaan 12 bulan.",
    notes: [mkNote("Dewi Lestari", "MENANG! Kontrak sedang difinalisasi. Siap konversi ke proyek App 2.", 1)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-48), by: "Sistem (Scraper GeoDipa)" },
      { status: "DITINJAU", at: daysFromNow(-45), by: "Dewi Lestari" },
      { status: "DIKEJAR", at: daysFromNow(-40), by: "Dewi Lestari" },
      { status: "DISERAHKAN", at: daysFromNow(-30), by: "Dewi Lestari" },
      { status: "MENANG", at: daysFromNow(-3), by: "Dewi Lestari" },
    ],
  },
  {
    id: "t-2405",
    title: "Jasa Konsultansi Pengawasan Konstruksi Stasiun Kompresor Gas",
    agency: "SKK Migas",
    operator: "PT Pertamina Gas",
    source: "CIVD",
    status: "DITEMUKAN",
    score: 64,
    budget: 4800000000,
    deadline: daysFromNow(9),
    publishedAt: daysFromNow(-2),
    location: "Jawa Barat",
    hps: "Rp 4.800.000.000",
    method: "Pelelangan Umum",
    contractType: "Lumpsum",
    url: "https://civd.skkmigas.go.id/tender/2405",
    kbli: [km("71102", 0.71), km("42915", 0.6)],
    tenderText:
      "Jasa pengawasan (supervisi) pekerjaan konstruksi stasiun kompresor gas, mencakup pengawasan mutu, kuantitas, jadwal, dan K3LL selama masa konstruksi 14 bulan. Penyedia menyediakan site engineer, QA/QC inspector, dan HSE officer di lapangan.",
    notes: [],
    history: [{ status: "DITEMUKAN", at: daysFromNow(-2), by: "Sistem (Scraper CIVD)" }],
  },
  {
    id: "t-2406",
    title: "Studi Kelayakan Pemanfaatan Brine Panas Bumi untuk Ekstraksi Mineral",
    agency: "PT Geo Dipa Energi",
    operator: "PT Geo Dipa Energi (Persero)",
    source: "GEODIPA",
    status: "DITEMUKAN",
    score: 58,
    budget: 2100000000,
    deadline: daysFromNow(15),
    publishedAt: daysFromNow(-1),
    location: "Dieng, Jawa Tengah",
    hps: "Rp 2.100.000.000",
    method: "Seleksi Sederhana",
    contractType: "Lumpsum",
    url: "https://eproc.geodipa.co.id/tender/2406",
    kbli: [km("71202", 0.62), km("08910", 0.55)],
    tenderText:
      "Studi kelayakan teknis dan ekonomis pemanfaatan brine (air sisa panas bumi) untuk ekstraksi mineral bernilai ekonomi (silica, lithium). Mencakup karakterisasi brine, technology screening, pilot plant concept, dan analisis keekonomian.",
    notes: [mkNote("Budi Santoso", "Menarik tapi di luar core kita. Perlu partner. Tinjau dulu.", 0)],
    history: [{ status: "DITEMUKAN", at: daysFromNow(-1), by: "Sistem (Scraper GeoDipa)" }],
  },
  {
    id: "t-2407",
    title: "Pengadaan Jasa Manajemen Konstruksi Proyek Revitalisasi Fasilitas Onshore Receiving Facility",
    agency: "SKK Migas",
    operator: "PT Pertamina Hulu Energi",
    source: "CIVD",
    status: "DIKEJAR",
    score: 79,
    budget: 11200000000,
    deadline: daysFromNow(4),
    publishedAt: daysFromNow(-12),
    location: "Jawa Timur",
    hps: "Rp 11.200.000.000",
    method: "Pelelangan Umum",
    contractType: "Lumpsum",
    url: "https://civd.skkmigas.go.id/tender/2407",
    kbli: [km("71102", 0.83), km("42915", 0.72), km("43210", 0.61)],
    tenderText:
      "Jasa manajemen konstruksi (construction management) untuk revitalisasi onshore receiving facility (ORF), mencakup perencanaan, pengawasan multidisiplin, manajemen kontraktor, cost control, dan commissioning support. Durasi 18 bulan.",
    notes: [mkNote("Andi Pratama", "Deadline mepet (4 hari). Tim proposal harus sprint.", 1)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-12), by: "Sistem (Scraper CIVD)" },
      { status: "DITINJAU", at: daysFromNow(-10), by: "Rina Kusuma" },
      { status: "DIKEJAR", at: daysFromNow(-6), by: "Andi Pratama" },
    ],
  },
  {
    id: "t-2408",
    title: "Jasa Audit Energi dan Optimasi Efisiensi Sistem Pembangkit",
    agency: "PT Geo Dipa Energi",
    operator: "PT Geo Dipa Energi (Persero)",
    source: "GEODIPA",
    status: "KALAH",
    score: 67,
    budget: 1850000000,
    deadline: daysFromNow(-25),
    publishedAt: daysFromNow(-55),
    location: "Patuha, Jawa Barat",
    hps: "Rp 1.850.000.000",
    method: "Seleksi Sederhana",
    contractType: "Lumpsum",
    url: "https://eproc.geodipa.co.id/tender/2408",
    kbli: [km("71202", 0.7), km("71102", 0.64)],
    tenderText:
      "Audit energi menyeluruh pada sistem pembangkit panas bumi dan rekomendasi optimasi efisiensi termal & kelistrikan. Mencakup pengukuran lapangan, analisis termodinamika, dan business case improvement.",
    notes: [mkNote("Dewi Lestari", "Kalah tipis di harga. Kompetitor banting harga 18%.", 3)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-55), by: "Sistem (Scraper GeoDipa)" },
      { status: "DITINJAU", at: daysFromNow(-52), by: "Dewi Lestari" },
      { status: "DIKEJAR", at: daysFromNow(-48), by: "Dewi Lestari" },
      { status: "DISERAHKAN", at: daysFromNow(-40), by: "Dewi Lestari" },
      { status: "KALAH", at: daysFromNow(-25), by: "Dewi Lestari" },
    ],
  },
  {
    id: "t-2409",
    title: "Pekerjaan Survei Topografi dan Pemetaan Detail Area Pengembangan Lapangan",
    agency: "SKK Migas",
    operator: "PT Energi Mega Persada",
    source: "CIVD",
    status: "DITINJAU",
    score: 55,
    budget: 3100000000,
    deadline: daysFromNow(13),
    publishedAt: daysFromNow(-4),
    location: "Riau",
    hps: "Rp 3.100.000.000",
    method: "Pelelangan Umum",
    contractType: "Unit Price",
    url: "https://civd.skkmigas.go.id/tender/2409",
    kbli: [km("71102", 0.58), km("71202", 0.52)],
    tenderText:
      "Survei topografi dan pemetaan detail (skala 1:1000) area pengembangan seluas 850 ha menggunakan kombinasi GNSS-RTK dan fotogrametri drone. Output: peta kontur, DEM, dan model 3D area.",
    notes: [],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-4), by: "Sistem (Scraper CIVD)" },
      { status: "DITINJAU", at: daysFromNow(-2), by: "Rina Kusuma" },
    ],
  },
  {
    id: "t-2410",
    title: "Konsultansi Penyusunan Dokumen AMDAL Pengembangan Lapangan Panas Bumi",
    agency: "PT Geo Dipa Energi",
    operator: "PT Geo Dipa Energi (Persero)",
    source: "GEODIPA",
    status: "DITEMUKAN",
    score: 43,
    budget: 1650000000,
    deadline: daysFromNow(18),
    publishedAt: daysFromNow(-1),
    location: "Candi Umbul, Jawa Tengah",
    hps: "Rp 1.650.000.000",
    method: "Seleksi Sederhana",
    contractType: "Lumpsum",
    url: "https://eproc.geodipa.co.id/tender/2410",
    kbli: [km("71202", 0.46), km("71102", 0.41)],
    tenderText:
      "Penyusunan dokumen Analisis Mengenai Dampak Lingkungan (AMDAL) lengkap (ANDAL, RKL-RPL) untuk pengembangan lapangan panas bumi. Memerlukan tenaga ahli bersertifikat AMDAL (KTPA/ATPA).",
    notes: [mkNote("Budi Santoso", "Butuh ahli AMDAL bersertifikat — tidak ada in-house. Pertimbangkan lewati.", 0)],
    history: [{ status: "DITEMUKAN", at: daysFromNow(-1), by: "Sistem (Scraper GeoDipa)" }],
  },
  {
    id: "t-2411",
    title: "Jasa Konsultansi Manajemen Risiko dan Asuransi Aset Fasilitas Produksi",
    agency: "SKK Migas",
    operator: "PT Pertamina Hulu Rokan",
    source: "CIVD",
    status: "BATAL",
    score: 38,
    budget: 950000000,
    deadline: daysFromNow(-8),
    publishedAt: daysFromNow(-30),
    location: "Riau",
    hps: "Rp 950.000.000",
    method: "Seleksi Sederhana",
    contractType: "Lumpsum",
    url: "https://civd.skkmigas.go.id/tender/2411",
    kbli: [km("71202", 0.4)],
    tenderText:
      "Jasa konsultansi penyusunan kerangka manajemen risiko enterprise dan kajian asuransi aset fasilitas produksi migas. Lingkup di luar core engineering perusahaan.",
    notes: [mkNote("Rina Kusuma", "Di luar bidang kita (manajemen risiko/asuransi). Batalkan.", 4)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-30), by: "Sistem (Scraper CIVD)" },
      { status: "DITINJAU", at: daysFromNow(-28), by: "Rina Kusuma" },
      { status: "BATAL", at: daysFromNow(-27), by: "Rina Kusuma" },
    ],
  },
  {
    id: "t-2412",
    title: "Pengadaan Jasa Commissioning dan Start-up Assistance Unit Pemrosesan Gas",
    agency: "SKK Migas",
    operator: "PT Pertamina Hulu Mahakam",
    source: "CIVD",
    status: "DIKEJAR",
    score: 84,
    budget: 7600000000,
    deadline: daysFromNow(8),
    publishedAt: daysFromNow(-7),
    location: "Kalimantan Timur",
    hps: "Rp 7.600.000.000",
    method: "Pelelangan Umum",
    contractType: "Lumpsum",
    url: "https://civd.skkmigas.go.id/tender/2412",
    kbli: [km("71102", 0.87), km("33131", 0.7), km("43210", 0.64)],
    tenderText:
      "Jasa pendampingan commissioning dan start-up unit pemrosesan gas baru, mencakup pre-commissioning, mechanical completion verification, commissioning procedure, dan start-up support hingga performance test. Tim multidisiplin proses/mekanikal/instrumentasi.",
    notes: [mkNote("Andi Pratama", "Skor tinggi, scope cocok. Sudah masuk pipeline KEJAR.", 1)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-7), by: "Sistem (Scraper CIVD)" },
      { status: "DITINJAU", at: daysFromNow(-5), by: "Rina Kusuma" },
      { status: "DIKEJAR", at: daysFromNow(-3), by: "Andi Pratama" },
    ],
  },
  {
    id: "t-2413",
    title: "Implementasi SCADA dan Sistem Telemetri Jaringan Distribusi Gas Kota",
    agency: "Input Manual",
    operator: "PT Perusahaan Gas Negara",
    source: "MANUAL",
    status: "DITINJAU",
    score: 69,
    budget: 5300000000,
    deadline: daysFromNow(20),
    publishedAt: daysFromNow(-3),
    location: "Jawa Barat",
    hps: "Rp 5.300.000.000",
    method: "Pelelangan Terbatas",
    contractType: "Lumpsum",
    url: "",
    kbli: [km("43210", 0.74), km("62019", 0.66), km("33131", 0.6)],
    tenderText:
      "Implementasi sistem SCADA dan telemetri untuk monitoring jaringan distribusi gas kota, mencakup RTU, komunikasi, HMI, historian, dan integrasi dengan control center. Diinput manual dari informasi tim BD.",
    notes: [mkNote("Sari Wulandari", "Diinput manual dari kontak BD. Verifikasi dokumen tender resmi.", 1)],
    history: [
      { status: "DITEMUKAN", at: daysFromNow(-3), by: "Sari Wulandari (Manual)" },
      { status: "DITINJAU", at: daysFromNow(-2), by: "Sari Wulandari" },
    ],
  },
  {
    id: "t-2414",
    title: "Jasa Konsultansi Perencanaan Sistem Proteksi Katodik Fasilitas Offshore",
    agency: "SKK Migas",
    operator: "PT Pertamina Hulu Energi ONWJ",
    source: "CIVD",
    status: "DITEMUKAN",
    score: 73,
    budget: 4200000000,
    deadline: daysFromNow(10),
    publishedAt: daysFromNow(0),
    location: "Laut Jawa",
    hps: "Rp 4.200.000.000",
    method: "Pelelangan Umum",
    contractType: "Lumpsum",
    url: "https://civd.skkmigas.go.id/tender/2414",
    kbli: [km("71102", 0.79), km("71202", 0.71), km("43210", 0.62)],
    tenderText:
      "Perencanaan dan desain sistem proteksi katodik (cathodic protection) untuk struktur dan pipa fasilitas offshore, mencakup survei, perhitungan desain ICCP/SACP, spesifikasi material, dan dokumen instalasi sesuai DNV-RP-B401.",
    notes: [],
    history: [{ status: "DITEMUKAN", at: daysFromNow(0), by: "Sistem (Scraper CIVD)" }],
  },
];

// ============================================================
// SCRAPER LOG (ScrapingJob)
// ============================================================
const SCRAPER_LOGS = [
  { id: 5, source: "CIVD", status: "SUCCESS", startedAt: daysFromNow(-0.02), durationSec: 184, found: 31, new: 3, updated: 5, error: null },
  { id: 4, source: "GEODIPA", status: "SUCCESS", startedAt: daysFromNow(-0.4), durationSec: 96, found: 14, new: 2, updated: 1, error: null },
  { id: 3, source: "CIVD", status: "SUCCESS", startedAt: daysFromNow(-0.52), durationSec: 201, found: 28, new: 4, updated: 3, error: null },
  { id: 2, source: "GEODIPA", status: "FAILED", startedAt: daysFromNow(-1.4), durationSec: 42, found: 0, new: 0, updated: 0, error: "Timeout saat fetch detail page (eproc.geodipa.co.id) — retry 3x gagal" },
  { id: 1, source: "CIVD", status: "SUCCESS", startedAt: daysFromNow(-1.52), durationSec: 176, found: 30, new: 6, updated: 2, error: null },
];

// ============================================================
// NOTIFICATIONS
// ============================================================
const NOTIFICATIONS = [
  { id: 9, type: "high_score", title: "Tender skor tinggi baru", body: "“Jasa Perencanaan Proteksi Katodik Offshore” — skor 73 (KEJAR)", at: daysFromNow(-0.02), read: false, tenderId: "t-2414" },
  { id: 8, type: "high_score", title: "Tender skor tinggi baru", body: "“Commissioning Unit Pemrosesan Gas” — skor 84 (KEJAR)", at: daysFromNow(-0.3), read: false, tenderId: "t-2412" },
  { id: 7, type: "scraper_fail", title: "Scraper gagal 2x berturut", body: "GeoDipa: timeout fetch detail page. Periksa koneksi.", at: daysFromNow(-1.4), read: false, tenderId: null },
  { id: 6, type: "won", title: "Tender dimenangkan 🎉", body: "“Sistem Informasi Manajemen Aset (SIMA)” — siap konversi ke proyek", at: daysFromNow(-3), read: true, tenderId: "t-2404" },
  { id: 5, type: "deadline", title: "Tenggat mendekat", body: "“Manajemen Konstruksi ORF” — tutup dalam 4 hari", at: daysFromNow(-0.6), read: true, tenderId: "t-2407" },
];

// ============================================================
// USERS
// ============================================================
const USERS = [
  { id: 1, name: "Andi Pratama", email: "andi@cliste.co.id", role: "admin", active: true, lastLogin: daysFromNow(-0.01) },
  { id: 2, name: "Rina Kusuma", email: "rina@cliste.co.id", role: "manager", active: true, lastLogin: daysFromNow(-0.2) },
  { id: 3, name: "Budi Santoso", email: "budi@cliste.co.id", role: "engineer", active: true, lastLogin: daysFromNow(-1.1) },
  { id: 4, name: "Dewi Lestari", email: "dewi@cliste.co.id", role: "manager", active: true, lastLogin: daysFromNow(-0.5) },
  { id: 5, name: "Sari Wulandari", email: "sari@cliste.co.id", role: "engineer", active: false, lastLogin: daysFromNow(-14) },
];

const ROLE_LABELS = { admin: "Admin", manager: "Manajer", engineer: "Engineer" };

// ============================================================
// DATA MASKING
// ============================================================
const MASKING = [
  { id: 1, category: "client", pattern: "GeoDipa", replacement: "[CLIENT_GEODIPA]" },
  { id: 2, category: "client", pattern: "PT Geo Dipa Energi", replacement: "[CLIENT_GEODIPA]" },
  { id: 3, category: "client", pattern: "SKK Migas", replacement: "[CLIENT_SKKMIGAS]" },
  { id: 4, category: "client", pattern: "CIVD", replacement: "[PLATFORM_CIVD]" },
  { id: 5, category: "internal_name", pattern: "PT Cliste Rekayasa Indonesia", replacement: "[COMPANY]" },
  { id: 6, category: "internal_name", pattern: "Cliste", replacement: "[COMPANY]" },
];

const MASKING_BUILTIN = [
  { label: "EMAIL", example: "andi@cliste.co.id → [EMAIL]" },
  { label: "PHONE", example: "+62 812-xxxx → [PHONE]" },
  { label: "CURRENCY", example: "Rp 14.500.000.000 → [CURRENCY]" },
  { label: "ACCOUNT", example: "No. rekening → [ACCOUNT]" },
];

// ============================================================
// PROPOSAL TEMPLATES + sample draft
// ============================================================
const PROPOSAL_TEMPLATES = [
  { id: 1, name: "Template Konsultansi Engineering (DED/FEED)", file: "tpl_engineering_v3.docx", sizeKb: 7240, updatedAt: daysFromNow(-12), sections: ["Executive Summary", "Pemahaman Lingkup Kerja", "Metodologi & Pendekatan", "Organisasi & Tim Ahli", "Jadwal Pelaksanaan", "Duration & Commercial"] },
  { id: 2, name: "Template Jasa Inspeksi & Sertifikasi", file: "tpl_inspeksi_v2.docx", sizeKb: 5180, updatedAt: daysFromNow(-30), sections: ["Executive Summary", "Lingkup Inspeksi", "Metodologi NDT", "Peralatan & Sertifikasi", "Jadwal", "Duration & Commercial"] },
  { id: 3, name: "Template Pengembangan Sistem (IT)", file: "tpl_it_system_v1.docx", sizeKb: 4620, updatedAt: daysFromNow(-60), sections: ["Executive Summary", "Pemahaman Kebutuhan", "Arsitektur Solusi", "Metodologi Pengembangan", "Tim & Jadwal", "Duration & Commercial"] },
];

const SAMPLE_PROPOSAL_BLOCKS = [
  { id: "b1", section: "Executive Summary", approved: true, content: "[COMPANY] dengan bangga mengajukan proposal untuk Detail Engineering Design (DED) Fasilitas Produksi Gas Bumi. Dengan pengalaman lebih dari satu dekade di sektor hulu migas dan tim ahli keinsinyuran bersertifikat, kami menawarkan solusi engineering terintegrasi yang andal, sesuai standar internasional (API, ASME), dan tepat waktu." },
  { id: "b2", section: "Pemahaman Lingkup Kerja", approved: true, content: "Kami memahami bahwa pekerjaan ini mencakup penyusunan DED lengkap meliputi process engineering, P&ID, plot plan, struktur baja, sistem perpipaan, instrumentasi & kontrol, serta sistem kelistrikan. Pekerjaan menuntut koordinasi erat dengan tim operator [CLIENT_SKKMIGAS], pelaksanaan HAZOP study, dan penyusunan dokumen tender konstruksi." },
  { id: "b3", section: "Metodologi & Pendekatan", approved: false, content: "Pendekatan kami terbagi dalam 4 fase: (1) Data Gathering & Basis of Design, (2) Process & Detail Engineering, (3) HAZOP & Design Review, (4) Finalisasi Dokumen Tender. Setiap fase dilengkapi gate review untuk memastikan kualitas deliverable sebelum lanjut ke fase berikutnya." },
  { id: "b4", section: "Organisasi & Tim Ahli", approved: false, content: "Tim proyek dipimpin oleh seorang Project Manager bersertifikat, didukung Lead Process Engineer, Piping Engineer, Structural Engineer, Instrument & Control Engineer, dan Electrical Engineer — seluruhnya memiliki pengalaman sejenis di proyek hulu migas." },
  { id: "b5", section: "Jadwal Pelaksanaan", approved: false, content: "Pekerjaan direncanakan selesai dalam 8 bulan kalender, dengan milestone utama: Basis of Design (M1), 30% Design Review (M3), 60% Design Review (M5), HAZOP (M6), dan Final Issue for Construction (M8)." },
];

// expose
Object.assign(window, {
  STATUSES, STATUS_LABELS, STATUS_DESC, SOURCES, recoFromScore,
  KBLI_MASTER, TENDERS, SCRAPER_LOGS, NOTIFICATIONS, USERS, ROLE_LABELS,
  MASKING, MASKING_BUILTIN, PROPOSAL_TEMPLATES, SAMPLE_PROPOSAL_BLOCKS,
  daysFromNow,
});
