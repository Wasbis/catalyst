/* ============================================================
   Catalyst — Tender Platform :: Mock data + helpers
   Single source of truth for the prototype.
   ============================================================ */

/* ---------- Pipeline stages ---------- */
const STATUS_ORDER = [
  "DITEMUKAN",
  "DITINJAU",
  "DIKEJAR",
  "DISERAHKAN",
  "MENANG",
  "KALAH",
  "BATAL",
];

const STATUS_LABELS = {
  DITEMUKAN: "Ditemukan",
  DITINJAU: "Ditinjau",
  DIKEJAR: "Dikejar",
  DISERAHKAN: "Diserahkan",
  MENANG: "Menang",
  KALAH: "Kalah",
  BATAL: "Batal",
};

// stage token -> css var suffix (defined in HTML :root)
const STATUS_TONE = {
  DITEMUKAN: "slate",
  DITINJAU: "blue",
  DIKEJAR: "violet",
  DISERAHKAN: "amber",
  MENANG: "green",
  KALAH: "red",
  BATAL: "zinc",
};

const SOURCE_LABELS = {
  CIVD: "CIVD · SKK Migas",
  GEODIPA: "GeoDipa",
  MANUAL: "Input Manual",
};

const SOURCE_SHORT = { CIVD: "CIVD", GEODIPA: "GeoDipa", MANUAL: "Manual" };

/* ---------- Score helpers ---------- */
function scoreTone(score) {
  if (score == null) return "none";
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}
function scoreReco(score) {
  if (score == null) return "—";
  if (score >= 70) return "KEJAR";
  if (score >= 40) return "TINJAU";
  return "LEWATI";
}

/* ---------- Formatters ---------- */
function formatCurrency(v) {
  if (v == null) return "—";
  if (v >= 1e12) return "Rp " + (v / 1e12).toFixed(1).replace(".0", "") + " T";
  if (v >= 1e9) return "Rp " + (v / 1e9).toFixed(1).replace(".0", "") + " M";
  if (v >= 1e6) return "Rp " + (v / 1e6).toFixed(0) + " jt";
  return "Rp " + v.toLocaleString("id-ID");
}

const TODAY = new Date("2026-06-10T09:00:00+07:00");

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T23:59:59+07:00");
  return Math.ceil((d - TODAY) / 86400000);
}
function formatDeadline(dateStr) {
  if (!dateStr) return { text: "—", urgent: false, passed: false, days: null };
  const days = daysUntil(dateStr);
  const d = new Date(dateStr + "T00:00:00+07:00");
  const text = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return { text, urgent: days != null && days >= 0 && days <= 7, passed: days < 0, days };
}
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function relativeTime(dateStr) {
  const d = new Date(dateStr);
  const diff = (TODAY - d) / 1000;
  if (diff < 3600) return Math.max(1, Math.round(diff / 60)) + " menit lalu";
  if (diff < 86400) return Math.round(diff / 3600) + " jam lalu";
  return Math.round(diff / 86400) + " hari lalu";
}

/* ---------- KBLI master ---------- */
const KBLI_MASTER = [
  { code: "71102", desc: "Aktivitas Keinsinyuran dan Konsultasi Teknis YBDI", active: true },
  { code: "62019", desc: "Aktivitas Pemrograman Komputer Lainnya", active: true },
  { code: "62029", desc: "Aktivitas Konsultasi Komputer dan Manajemen Fasilitas Komputer Lainnya", active: true },
  { code: "63111", desc: "Aktivitas Pengolahan Data", active: true },
  { code: "09100", desc: "Aktivitas Penunjang Pertambangan Minyak Bumi dan Gas Alam", active: true },
  { code: "71204", desc: "Jasa Sertifikasi", active: true },
  { code: "33131", desc: "Reparasi Alat Ukur, Alat Uji, Alat Navigasi dan Kontrol", active: true },
  { code: "43211", desc: "Instalasi Listrik", active: true },
  { code: "74909", desc: "Aktivitas Profesional, Ilmiah dan Teknis Lainnya YTDL", active: true },
  { code: "71101", desc: "Aktivitas Arsitektur", active: false },
  { code: "26511", desc: "Industri Alat Ukur, Alat Uji, Alat Navigasi dan Kontrol", active: true },
  { code: "70209", desc: "Aktivitas Konsultasi Manajemen Lainnya", active: true },
];

/* ---------- Notes per tender ---------- */
const NOTE_SEED = {
  "TND-2041": [
    { author: "Rangga P.", role: "Engineer", at: "2026-06-09T14:20:00", text: "Sudah cek dokumen pengadaan — scope FEED match dengan portfolio kita di Mahakam. Worth dikejar." },
    { author: "Dewi S.", role: "Manager", at: "2026-06-10T08:05:00", text: "Setuju. Tolong siapkan letter of intent dan cek kapasitas tim minggu depan." },
  ],
  "TND-2038": [
    { author: "Rangga P.", role: "Engineer", at: "2026-06-08T10:12:00", text: "Budget agak tipis untuk scope NDT sebesar ini. Perlu klarifikasi ke panitia." },
  ],
  "TND-2025": [
    { author: "Bagas W.", role: "Engineer", at: "2026-06-05T16:40:00", text: "Proposal sudah submit via portal CIVD. Nunggu pengumuman evaluasi teknis." },
  ],
};

/* ---------- Status history per tender ---------- */
function histFor(status, baseDate) {
  const idx = STATUS_ORDER.indexOf(status);
  const flow = ["DITEMUKAN", "DITINJAU", "DIKEJAR", "DISERAHKAN"];
  const out = [];
  let day = new Date(baseDate);
  const reach = idx <= 3 ? idx : 3;
  for (let i = 0; i <= reach; i++) {
    out.push({
      status: flow[i],
      at: new Date(day).toISOString().slice(0, 19),
      by: i === 0 ? "Sistem (Scraper)" : ["Rangga P.", "Dewi S.", "Bagas W."][i % 3],
    });
    day.setDate(day.getDate() + 2 + i);
  }
  if (["MENANG", "KALAH", "BATAL"].includes(status)) {
    out.push({ status, at: new Date(day).toISOString().slice(0, 19), by: "Dewi S." });
  }
  return out;
}

/* ---------- Tenders ---------- */
const AGENCIES = {
  PHM: "PT Pertamina Hulu Mahakam",
  PHR: "PT Pertamina Hulu Rokan",
  MEDCO: "Medco E&P Indonesia",
  PEP: "PT Pertamina EP",
  HCML: "Husky-CNOOC Madura Ltd.",
  GEODIPA: "PT Geo Dipa Energi (Persero)",
  BP: "BP Berau Ltd.",
  ENI: "ENI Indonesia",
  PCJ: "PetroChina International Jabung",
  MUBADALA: "Mubadala Energy",
};

function kbli(code, score) {
  const m = KBLI_MASTER.find((k) => k.code === code);
  return { kbli_code: code, description: m ? m.desc : "", score };
}

const RAW_TENDERS = [
  ["TND-2041","CIVD","Jasa Konsultansi Front End Engineering Design (FEED) Fasilitas Produksi Lapangan Mahakam","PHM",[["71102",0.94],["09100",0.71]],88,"2026-06-15",4_850_000_000,"DIKEJAR"],
  ["TND-2038","CIVD","Jasa Inspeksi & Non-Destructive Testing (NDT) Pipa Penyalur Onshore","PHR",[["71204",0.82],["33131",0.55]],74,"2026-06-13",1_920_000_000,"DITINJAU"],
  ["TND-2046","GEODIPA","Pengadaan Jasa Konsultansi Manajemen Proyek (PMC) Pengembangan PLTP Unit 3","GEODIPA",[["70209",0.9],["71102",0.78]],91,"2026-06-22",6_300_000_000,"DITEMUKAN"],
  ["TND-2044","CIVD","Pengembangan Sistem Informasi Manajemen Aset Terintegrasi (EAM)","MEDCO",[["62019",0.92],["62029",0.8]],85,"2026-06-19",2_450_000_000,"DITEMUKAN"],
  ["TND-2031","CIVD","Jasa Pemeliharaan Sistem Instrumentasi & Kontrol Plant","PEP",[["33131",0.79],["43211",0.6]],68,"2026-06-12",1_350_000_000,"DIKEJAR"],
  ["TND-2025","CIVD","Pengembangan Dashboard Monitoring Produksi Real-time","HCML",[["62019",0.88],["63111",0.74]],81,"2026-06-09",980_000_000,"DISERAHKAN"],
  ["TND-2019","CIVD","Jasa Sertifikasi & Kalibrasi Alat Ukur Custody Transfer","BP",[["71204",0.86],["33131",0.62]],77,"2026-05-30",640_000_000,"MENANG"],
  ["TND-2049","GEODIPA","Studi Geoteknik & Survei Topografi Area Pengembangan Panas Bumi","GEODIPA",[["71102",0.71],["74909",0.5]],63,"2026-06-25",1_120_000_000,"DITEMUKAN"],
  ["TND-2012","CIVD","Pengadaan Perangkat Lunak SCADA & Integrasi Sistem Telemetri","PCJ",[["62029",0.83],["33131",0.58]],72,"2026-05-28",3_100_000_000,"KALAH"],
  ["TND-2052","CIVD","Jasa Audit Keselamatan Proses (Process Safety Management)","ENI",[["74909",0.68],["71102",0.55]],59,"2026-06-28",1_780_000_000,"DITEMUKAN"],
  ["TND-2035","CIVD","Jasa Engineering, Procurement & Construction (EPC) Wellpad","MUBADALA",[["71102",0.81],["43211",0.66]],76,"2026-06-16",12_500_000_000,"DITINJAU"],
  ["TND-2009","CIVD","Pengadaan Jasa Cleaning Service & Pengelolaan Gedung Kantor","PEP",[["74909",0.31]],28,"2026-05-24",420_000_000,"BATAL"],
  ["TND-2047","GEODIPA","Pengadaan Jasa Pemetaan Digital & GIS Wilayah Kerja","GEODIPA",[["63111",0.7],["62019",0.52]],64,"2026-06-21",890_000_000,"DITINJAU"],
  ["TND-2042","CIVD","Jasa Konsultansi Lingkungan & Penyusunan Dokumen AMDAL","BP",[["74909",0.62],["70209",0.48]],55,"2026-06-18",1_460_000_000,"DITEMUKAN"],
  ["TND-2028","CIVD","Pengembangan Aplikasi Mobile Field Data Capture","PHM",[["62019",0.9],["62029",0.71]],83,"2026-06-11",1_240_000_000,"DIKEJAR"],
  ["TND-2003","CIVD","Pengadaan Jasa Katering & Akomodasi Site Office","HCML",[["74909",0.22]],19,"2026-05-20",780_000_000,"KALAH"],
  ["TND-2054","CIVD","Jasa Konsultansi Reliability Engineering Rotating Equipment","MEDCO",[["71102",0.86],["33131",0.6]],79,"2026-06-30",2_050_000_000,"DITEMUKAN"],
  ["TND-2021","CIVD","Pengadaan & Instalasi Sistem Proteksi Katodik Pipa","PEP",[["43211",0.74],["33131",0.55]],66,"2026-06-08",1_680_000_000,"DISERAHKAN"],
  ["TND-2016","CIVD","Jasa Migrasi & Modernisasi Sistem ERP Korporat","PHR",[["62029",0.87],["62019",0.7]],80,"2026-05-26",4_200_000_000,"MENANG"],
  ["TND-2050","GEODIPA","Pengadaan Jasa Konsultansi Drilling Engineering Sumur Eksplorasi","GEODIPA",[["71102",0.82],["09100",0.68]],75,"2026-06-24",3_650_000_000,"DITEMUKAN"],
  ["TND-2033","CIVD","Jasa Penyusunan Dokumen Studi Kelayakan (FS) Fasilitas LNG","ENI",[["71102",0.77],["70209",0.6]],71,"2026-06-14",2_900_000_000,"DITINJAU"],
  ["TND-2007","CIVD","Pengadaan ATK & Perlengkapan Kantor Tahunan","PCJ",[["74909",0.15]],12,"2026-05-18",160_000_000,"BATAL"],
  ["TND-2055","CIVD","Jasa Konsultansi Digital Twin Fasilitas Produksi","PHM",[["62029",0.88],["71102",0.75]],86,"2026-07-02",5_400_000_000,"DITEMUKAN"],
  ["TND-2026","CIVD","Pengadaan Jasa Pemeliharaan Jaringan & Infrastruktur IT","MUBADALA",[["62029",0.81],["63111",0.6]],70,"2026-06-10",1_050_000_000,"DIKEJAR"],
  ["TND-2018","CIVD","Jasa Inspeksi Bawah Air (Underwater Inspection) Struktur Offshore","BP",[["71204",0.7],["09100",0.58]],62,"2026-05-29",2_350_000_000,"KALAH"],
  ["TND-2048","GEODIPA","Pengadaan Jasa Commissioning & Start-up Unit Pembangkit","GEODIPA",[["71102",0.79],["43211",0.64]],73,"2026-06-23",3_950_000_000,"DITINJAU"],
  ["TND-2014","CIVD","Pengembangan Portal Manajemen Dokumen Teknik (EDMS)","MEDCO",[["62019",0.85],["63111",0.72]],78,"2026-05-27",1_620_000_000,"MENANG"],
  ["TND-2056","CIVD","Jasa Konsultansi Carbon Capture Utilization & Storage (CCUS)","ENI",[["71102",0.8],["74909",0.6]],82,"2026-07-04",7_800_000_000,"DITEMUKAN"],
];

const TENDERS = RAW_TENDERS.map(([id, source, title, agK, kblis, score, deadline, budget, status]) => {
  const kbliMatched = kblis.map(([c, s]) => kbli(c, s));
  const baseDate = new Date(deadline);
  baseDate.setDate(baseDate.getDate() - 24);
  return {
    id,
    source,
    title,
    agency: AGENCIES[agK],
    kbliMatched,
    score,
    deadline,
    budget,
    status,
    notes: NOTE_SEED[id] || [],
    history: histFor(status, baseDate),
    foundAt: baseDate.toISOString().slice(0, 19),
    url: source === "MANUAL" ? null : "https://civd.skkmigas.go.id/tender/" + id.toLowerCase(),
    tenderText:
      "Dengan ini diumumkan pelaksanaan pengadaan untuk paket \u201C" + title + "\u201D oleh " +
      AGENCIES[agK] + ". Penyedia jasa wajib memiliki kualifikasi yang sesuai serta pengalaman pada pekerjaan sejenis dalam 3 tahun terakhir. Lingkup pekerjaan mencakup penyediaan tenaga ahli, peralatan, dan pelaporan sesuai dengan kerangka acuan kerja (KAK) yang ditetapkan. Penyedia harus memenuhi persyaratan administrasi, teknis, dan finansial. Jaminan penawaran sebesar 3% dari nilai HPS. Masa berlaku penawaran 90 hari kalender sejak batas akhir pemasukan dokumen.",
    requirements: [
      "Memiliki Sertifikat Badan Usaha (SBU) bidang yang sesuai dan masih berlaku",
      "Pengalaman pekerjaan sejenis minimal 3 paket dalam 3 tahun terakhir",
      "Menyediakan tenaga ahli bersertifikat sesuai posisi yang dipersyaratkan",
      "Melampirkan metodologi pelaksanaan dan jadwal kerja terperinci",
      "Jaminan penawaran 3% dari nilai HPS dari bank umum nasional",
    ],
  };
});

/* ---------- Scraper job log ---------- */
const SCRAPER_LOG = [
  { id: "JOB-318", platform: "CIVD", status: "success", startedAt: "2026-06-10T06:00:12", durationSec: 184, found: 42, new: 6, updated: 3, error: null },
  { id: "JOB-317", platform: "GEODIPA", status: "success", startedAt: "2026-06-10T03:00:08", durationSec: 96, found: 11, new: 2, updated: 1, error: null },
  { id: "JOB-316", platform: "CIVD", status: "success", startedAt: "2026-06-09T18:00:05", durationSec: 176, found: 41, new: 4, updated: 5, error: null },
  { id: "JOB-315", platform: "GEODIPA", status: "failed", startedAt: "2026-06-09T03:00:11", durationSec: 38, found: 0, new: 0, updated: 0, error: "Timeout saat memuat halaman detail (HTTP 504) setelah 3x retry" },
  { id: "JOB-314", platform: "CIVD", status: "success", startedAt: "2026-06-09T06:00:09", durationSec: 169, found: 40, new: 3, updated: 2, error: null },
  { id: "JOB-313", platform: "GEODIPA", status: "failed", startedAt: "2026-06-08T03:00:07", durationSec: 41, found: 0, new: 0, updated: 0, error: "Timeout saat memuat halaman detail (HTTP 504) setelah 3x retry" },
  { id: "JOB-312", platform: "CIVD", status: "partial", startedAt: "2026-06-08T18:00:14", durationSec: 201, found: 39, new: 5, updated: 4, error: "2 item gagal di-parse (struktur halaman berubah)" },
  { id: "JOB-311", platform: "CIVD", status: "success", startedAt: "2026-06-08T06:00:03", durationSec: 172, found: 38, new: 2, updated: 1, error: null },
];

/* ---------- Notifications ---------- */
const NOTIFICATIONS = [
  { id: "N1", type: "score", read: false, at: "2026-06-10T06:03:00", title: "Tender skor tinggi baru", body: "PMC Pengembangan PLTP Unit 3 — skor 91 (KEJAR)", tenderId: "TND-2046" },
  { id: "N2", type: "score", read: false, at: "2026-06-10T06:03:00", title: "Tender skor tinggi baru", body: "Konsultansi Digital Twin Fasilitas Produksi — skor 86", tenderId: "TND-2055" },
  { id: "N3", type: "error", read: false, at: "2026-06-09T03:00:50", title: "Scraper GeoDipa gagal 2x berturut", body: "Timeout HTTP 504 — periksa koneksi sumber", tenderId: null },
  { id: "N4", type: "deadline", read: true, at: "2026-06-09T08:00:00", title: "Tenggat mendekat", body: "FEED Fasilitas Produksi Mahakam — 5 hari lagi", tenderId: "TND-2041" },
  { id: "N5", type: "status", read: true, at: "2026-06-08T15:20:00", title: "Tender dimenangkan", body: "Migrasi & Modernisasi ERP Korporat — status: MENANG", tenderId: "TND-2016" },
];

/* ---------- Users (Settings) ---------- */
const USERS = [
  { id: "U1", name: "Dewi Saraswati", email: "dewi@cliste.co.id", role: "manager", active: true, lastLogin: "2026-06-10T08:02:00" },
  { id: "U2", name: "Rangga Pratama", email: "rangga@cliste.co.id", role: "engineer", active: true, lastLogin: "2026-06-10T07:45:00" },
  { id: "U3", name: "Bagas Wicaksono", email: "bagas@cliste.co.id", role: "engineer", active: true, lastLogin: "2026-06-09T16:30:00" },
  { id: "U4", name: "Admin Catalyst", email: "admin@catalyst.local", role: "admin", active: true, lastLogin: "2026-06-10T05:58:00" },
];

const ROLE_LABELS = { admin: "Administrator", manager: "Manager", engineer: "Engineer" };

/* ---------- Data masking entries ---------- */
const MASKING = [
  { id: "M1", category: "client", pattern: "GeoDipa | PT Geo Dipa Energi", token: "[CLIENT_GEODIPA]" },
  { id: "M2", category: "client", pattern: "SKK Migas", token: "[CLIENT_SKKMIGAS]" },
  { id: "M3", category: "client", pattern: "CIVD", token: "[PLATFORM_CIVD]" },
  { id: "M4", category: "internal_name", pattern: "PT Cliste Rekayasa Indonesia", token: "[COMPANY]" },
  { id: "M5", category: "builtin", pattern: "Alamat email (regex)", token: "[EMAIL]" },
  { id: "M6", category: "builtin", pattern: "Nomor telepon (regex)", token: "[PHONE]" },
];

/* ---------- Proposal templates ---------- */
const TEMPLATES = [
  { id: "T1", name: "Proposal Teknis — Jasa Konsultansi.docx", size: "182 KB", updatedAt: "2026-05-20", sections: 7 },
  { id: "T2", name: "Proposal EPC — Standar Cliste.docx", size: "246 KB", updatedAt: "2026-04-12", sections: 9 },
  { id: "T3", name: "Proposal Pengembangan Software.docx", size: "138 KB", updatedAt: "2026-05-30", sections: 6 },
];

/* ---------- Proposal draft (blocks) ---------- */
const PROPOSAL_BLOCKS = [
  { id: "B1", heading: "Ringkasan Eksekutif", approved: true, content: "PT Cliste Rekayasa Indonesia dengan bangga mengajukan penawaran untuk paket Front End Engineering Design (FEED) Fasilitas Produksi. Dengan pengalaman lebih dari 12 tahun pada proyek hulu migas, kami menawarkan pendekatan engineering yang terintegrasi, efisien, dan sesuai standar internasional." },
  { id: "B2", heading: "Pemahaman Lingkup Pekerjaan", approved: true, content: "Kami memahami bahwa lingkup pekerjaan mencakup studi FEED menyeluruh meliputi process design, equipment sizing, plot plan, P&ID, serta penyusunan dokumen tender EPC. Pendekatan kami menekankan constructability review sejak fase awal untuk meminimalkan perubahan di tahap konstruksi." },
  { id: "B3", heading: "Metodologi & Pendekatan Teknis", approved: false, content: "Pelaksanaan dibagi ke dalam 4 fase: (1) Data Gathering & Basis of Design, (2) Conceptual Engineering, (3) Front End Engineering, (4) Tender Package Preparation. Setiap fase ditutup dengan design review bersama owner untuk memastikan keselarasan." },
  { id: "B4", heading: "Organisasi & Tenaga Ahli", approved: false, content: "Tim inti terdiri dari Project Manager (PMP, 15 thn), Lead Process Engineer (12 thn), Lead Mechanical, Lead Instrument & Control, dan Lead Civil/Structure. Seluruh tenaga ahli bersertifikat dan berpengalaman pada fasilitas produksi onshore." },
  { id: "B5", heading: "Jadwal Pelaksanaan", approved: false, content: "Total durasi pelaksanaan 6 bulan kalender. Lihat tabel timeline terperinci pada bagian Durasi & Komersial." },
  { id: "B6", heading: "Durasi & Komersial", approved: false, content: "Nilai penawaran disusun berbasis man-hour rate yang kompetitif sesuai standar SKK Migas. Rincian biaya dan jadwal pembayaran terlampir pada tabel komersial." },
  { id: "B7", heading: "Pengalaman & Referensi", approved: false, content: "Daftar proyek sejenis: FEED Fasilitas Produksi (2024), Detail Engineering Wellpad (2023), serta PMC Pembangunan Fasilitas Gas (2022)." },
];

/* ---------- Dashboard metrics (derived) ---------- */
function computeStats(tenders) {
  const active = tenders.filter((t) => !["MENANG", "KALAH", "BATAL"].includes(t.status));
  const won = tenders.filter((t) => t.status === "MENANG");
  const decided = tenders.filter((t) => ["MENANG", "KALAH"].includes(t.status));
  const highScore = tenders.filter((t) => t.score != null && t.score >= 70);
  const winRate = decided.length ? Math.round((won.length / decided.length) * 100) : 0;
  const pipelineValue = active.reduce((s, t) => s + (t.budget || 0), 0);
  return {
    total: tenders.length,
    active: active.length,
    highScore: highScore.length,
    won: won.length,
    winRate,
    pipelineValue,
  };
}

window.CATALYST = {
  STATUS_ORDER, STATUS_LABELS, STATUS_TONE, SOURCE_LABELS, SOURCE_SHORT,
  scoreTone, scoreReco,
  formatCurrency, formatDeadline, formatDate, formatDateTime, relativeTime, daysUntil,
  KBLI_MASTER, TENDERS, SCRAPER_LOG, NOTIFICATIONS, USERS, ROLE_LABELS, MASKING,
  TEMPLATES, PROPOSAL_BLOCKS, AGENCIES, computeStats, TODAY,
};
