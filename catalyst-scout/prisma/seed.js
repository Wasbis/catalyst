require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@catalyst.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";

// 38 KBLI hasil ekstraksi nibcri.pdf via pdf_extractor.py (lihat todo.md TAHAP "Matching & KBLI")
const MASTER_KBLI_DATA = [
  { kbliCode: "46592", description: "Perdagangan Besar Alat Transportasi Laut, Suku Cadang Dan Perlengkapannya" },
  { kbliCode: "78200", description: "AKTIVITAS PENYEDIAAN TENAGA KERJA WAKTU TERTENTU" },
  { kbliCode: "46430", description: "Perdagangan Besar Alat Fotografi dan Barang Optik" },
  { kbliCode: "26513", description: "Industri Alat Ukur Dan Alat Uji Elektronik" },
  { kbliCode: "46699", description: "Perdagangan Besar Produk Lainnya YTDL" },
  { kbliCode: "46639", description: "Perdagangan Besar Bahan Konstruksi Lainnya" },
  { kbliCode: "78300", description: "Penyediaan Sumber Daya Manusia dan Manajemen Fungsi Sumber Daya Manusia" },
  { kbliCode: "46594", description: "Perdagangan Besar Alat Transportasi Udara, Suku Cadang Dan Perlengkapannya" },
  { kbliCode: "96990", description: "Aktivitas Jasa Perorangan Lainnya YTDL" },
  { kbliCode: "71204", description: "Jasa Inspeksi Teknik Instalasi" },
  { kbliCode: "46523", description: "Perdagangan Besar Peralatan Telekomunikasi" },
  { kbliCode: "70209", description: "Aktivitas Konsultasi Manajemen Lainnya" },
  { kbliCode: "46599", description: "Perdagangan Besar Mesin, Peralatan Dan Perlengkapan Lainnya" },
  { kbliCode: "46511", description: "Perdagangan Besar Komputer dan Perlengkapan Komputer" },
  { kbliCode: "46900", description: "Perdagangan Besar Berbagai Macam Barang" },
  { kbliCode: "62090", description: "Aktivitas Teknologi Informasi Dan Jasa Komputer Lainnya" },
  { kbliCode: "58200", description: "Penerbitan piranti lunak (Software)" },
  { kbliCode: "62019", description: "Aktivitas Pemrograman Komputer Lainnya" },
  { kbliCode: "46512", description: "Perdagangan Besar Piranti Lunak" },
  { kbliCode: "63990", description: "Aktivitas Jasa Informasi Lainnya YTDL" },
  { kbliCode: "81300", description: "Aktivitas Perawatan dan Pemeliharaan Taman" },
  { kbliCode: "62024", description: "Aktivitas Konsultasi dan Perancangan Internet of Things (IoT)" },
  { kbliCode: "74115", description: "Aktivitas Desain Alat Komunikasi dan Elektronika" },
  { kbliCode: "74114", description: "Aktivitas Desain industri strategis dan pertahanan" },
  { kbliCode: "42104", description: "Konstruksi Terowongan" },
  { kbliCode: "42103", description: "Konstruksi Jalan Rel" },
  { kbliCode: "42102", description: "Konstruksi Bangunan Sipil Jembatan, Jalan Layang, Fly Over, dan Underpass" },
  { kbliCode: "42101", description: "Konstruksi Bangunan Sipil Jalan" },
  { kbliCode: "42917", description: "Konstruksi Bangunan Sipil Panas Bumi" },
  { kbliCode: "42916", description: "Konstruksi Bangunan Sipil Pertambangan" },
  { kbliCode: "42915", description: "Konstruksi Bangunan Sipil Minyak dan Gas Bumi" },
  { kbliCode: "62029", description: "Aktivitas Konsultasi Komputer dan Manajemen Fasilitas Komputer Lainnya" },
  { kbliCode: "62021", description: "Aktivitas Konsultasi Keamanan Informasi" },
  { kbliCode: "62023", description: "Aktivitas Penyediaan Sertifikat Elektronik dan Layanan yang Menggunakan Sertifikat Elektronik" },
  { kbliCode: "71102", description: "Aktivitas Keinsinyuran dan Konsultasi Teknis YBDI" },
  { kbliCode: "71101", description: "Aktivitas Arsitektur" },
  { kbliCode: "71201", description: "Jasa Sertifikasi" },
  { kbliCode: "82200", description: "Aktivitas call centre" },
];

// Starter generic — entitas yang muncul berulang di tender_text/notes & perlu disamarkan
// sebelum dikirim ke Claude. Builtin regex (EMAIL/PHONE/CURRENCY/ACCOUNT) sudah otomatis
// dihandle MaskingService, jadi yang di-seed di sini cuma named entity spesifik.
const DATA_MASKING_DATA = [
  { keyword: "PT Cliste Rekayasa Indonesia", replacement: "[COMPANY]", category: "internal_name" },
  { keyword: "Cliste Rekayasa Indonesia", replacement: "[COMPANY]", category: "internal_name" },
  { keyword: "PT Geo Dipa Energi", replacement: "[CLIENT_GEODIPA]", category: "client" },
  { keyword: "GeoDipa", replacement: "[CLIENT_GEODIPA]", category: "client" },
  { keyword: "SKK Migas", replacement: "[CLIENT_SKKMIGAS]", category: "client" },
  { keyword: "CIVD", replacement: "[PLATFORM_CIVD]", category: "client" },
];

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`User ${ADMIN_EMAIL} sudah ada, skip seeding.`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    },
  });

  console.log(`Admin user dibuat: ${ADMIN_EMAIL} / password: ${ADMIN_PASSWORD}`);
  console.log("Ganti password ini setelah login pertama kali.");
}

async function seedMasterKbli() {
  const result = await prisma.masterKbli.createMany({
    data: MASTER_KBLI_DATA,
    skipDuplicates: true,
  });
  console.log(`MasterKbli: ${result.count} baris baru ditambahkan (dari ${MASTER_KBLI_DATA.length}, skip duplikat).`);
}

async function seedDataMasking() {
  const result = await prisma.dataMasking.createMany({
    data: DATA_MASKING_DATA,
    skipDuplicates: true,
  });
  console.log(`DataMasking: ${result.count} baris baru ditambahkan (dari ${DATA_MASKING_DATA.length}, skip duplikat).`);
}

async function main() {
  await seedAdmin();
  await seedMasterKbli();
  await seedDataMasking();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
