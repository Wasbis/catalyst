Markdown
# 🚀 DEPLOYMENT GUIDELINE (Catalyst Ecosystem)

## A. ATURAN MAIN DI LOCAL (LAPTOP)
Saat development di laptop, kita menjalankan aplikasi secara "terpisah" (tanpa Docker untuk aplikasinya, tapi Docker hanya untuk Database).

1. Database
Hanya nyalakan PostgreSQL via Docker:
docker-compose up -d postgres-db

2. Environment Variables (.env)
Perhatikan penggunaan localhost karena aplikasi di-run langsung di OS laptop lo.

catalyst-scout: DATABASE_URL="postgresql://user:pass@localhost:5432/catalyst_db?schema=public"

scraper-engine: DATABASE_URL="postgresql://user:pass@localhost:5432/catalyst_db"

3. Cara Menjalankan
Buka dua terminal terpisah:

Terminal 1 (Next.js):

Bash
cd catalyst-scout && npm run dev
Terminal 2 (Python):

Bash
cd scraper-engine && source .venv/bin/activate && uvicorn api.main:app --reload --port 8000

## B. ATURAN MAIN DI PRODUCTION (SERVER)
Saat dipindah ke server produksi, semua aplikasi (Database, Next.js, Python) akan dibungkus dan dijalankan di dalam Docker Container secara bersamaan.

1. Environment Variables (.env)
Ubah localhost menjadi nama service Docker!

catalyst-scout: DATABASE_URL="postgresql://user:pass@postgres-db:5432/catalyst_db?schema=public"

scraper-engine: DATABASE_URL="postgresql://user:pass@postgres-db:5432/catalyst_db"

⚠️ PENTING: Jika Next.js mau nge-hit API Python, gunakan http://scraper-engine:8000 bukan localhost:8000.

2. Cara Menjalankan
Cukup satu perintah sakti di folder root (/Catalyst):

Bash
docker-compose up -d --build
3. Database Migration (Wajib!)
Saat pertama kali deploy ke production, tabel di database Docker server pasti masih kosong. Lo harus push strukturnya dari dalam container Next.js:

Bash
docker exec -it catalyst-scout-container npx prisma db push

## C. ATURAN MAIN DI HOME SERVER (DEVELOPMENT MODE)
Ketika database di-host di home server dan diakses via Tailscale untuk development:

### Architecture
```
Developer Device (Windows/Linux)
    ↓ (via Tailscale VPN)
Fedora Server 100.112.188.84
    ↓ (port 5432)
Docker Container PostgreSQL
```

1. Universal Database Connection (ACTIVE)
Database PostgreSQL sudah running di Docker container di Fedora Server.
Developer cukup connect via Tailscale IP:

IP Tailscale: `100.112.188.84`
Port: `5432` (expose dari container)
Username: `diya-catalyst`
Password: `Abid090300`
Database: `catalystDB`

2. Environment Variables (.env)
Gunakan IP Tailscale + port 5432:

catalyst-scout: DATABASE_URL="postgresql://diya-catalyst:Abid090300@100.112.188.84:5432/catalystDB?schema=public"

scraper-engine: DATABASE_URL="postgresql://diya-catalyst:Abid090300@100.112.188.84:5432/catalystDB"

⚠️ Port 5432 mapping dari Docker container sudah configured. Tinggal connect.

3. Server Status (FYI - Di Fedora Server)
Database PostgreSQL sudah terinstall dan running di Docker:

```bash
# Check Docker container
docker ps | grep postgres

# View logs
docker logs -f <container_id>

# Access psql dari server lokal
docker exec -it <container_id> psql -U diya-catalyst -d catalystDB
```

4. Test Connection dari Developer Device

**Sebelum test, pastikan:**
- ✅ Tailscale sudah connected (`tailscale status`)
- ✅ Bisa ping server: `ping 100.112.188.84`

**Windows PowerShell:**
```powershell
# Option 1: Test via Node.js (Fastest)
cd catalyst-scout
npm install pg

@"
const {Client} = require('pg');
const client = new Client({
  host: '100.112.188.84',
  user: 'diya-catalyst',
  password: 'Abid090300',
  database: 'catalystDB',
  port: 5432,
});
client.connect()
  .then(() => { 
    console.log('✅ Connected ke Docker PostgreSQL di server!');
    client.end(); 
  })
  .catch(err => { 
    console.error('❌', err.message); 
    process.exit(1); 
  });
"@ | Out-File test-db.js

node test-db.js

# Option 2: Install psql
choco install postgresql
psql -h 100.112.188.84 -U diya-catalyst -d catalystDB
```

**Linux:**
```bash
# Install PostgreSQL Client
sudo apt install postgresql-client      # Ubuntu/Debian
# OR
sudo dnf install postgresql             # Fedora

# Test connection
psql -h 100.112.188.84 -U diya-catalyst -d catalystDB
# Password: Abid090300
```

Jika berhasil, akan muncul prompt:
```
catalystDB=>
```

5. First Time: Push Prisma Schema

**Windows PowerShell:**
```powershell
cd catalyst-scout
npm install  # (jika belum)
npx prisma db push
```

**Linux Terminal:**
```bash
cd catalyst-scout
npm install  # (jika belum)
npx prisma db push
```

Confirm "Y" ketika ditanya. Schema akan di-migrate ke database server.

6. Run Development Servers (Connected to Remote Database)

Setelah `npx prisma db push` berhasil, database schema sudah push ke server. Sekarang tinggal jalankan aplikasi:

**Windows PowerShell (Terminal 1 - Next.js):**
```powershell
cd catalyst-scout
npm run dev
# Akses: http://localhost:3000
# Data dibaca dari: 100.112.188.84 via Tailscale
```

**Windows PowerShell (Terminal 2 - Python API):**
```powershell
cd scrapper-engine
python -m venv .venv  # jika belum ada venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
# Akses: http://localhost:8000/docs
# Data dibaca dari: 100.112.188.84 via Tailscale
```

---

**Linux Terminal (Terminal 1 - Next.js):**
```bash
cd catalyst-scout
npm run dev
# Akses: http://localhost:3000
# Data dibaca dari: 100.112.188.84 via Tailscale
```

**Linux Terminal (Terminal 2 - Python API):**
```bash
cd scrapper-engine
python3 -m venv .venv  # jika belum ada venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
# Akses: http://localhost:8000/docs
# Data dibaca dari: 100.112.188.84 via Tailscale
```

---

**ℹ️ Catatan:**
- Semua developer device (Windows/Linux) akan **share data yang sama** dari database server
- Data real-time synchronized via Tailscale VPN
- Seamless collaboration tanpa perlu setup database lokal

## E. TROUBLESHOOTING

### Windows - Cannot Connect to 100.112.188.84
**Error:** `timeout` atau `connection refused`

**Checklist (in order):**
```powershell
# 1. Ping server
ping 100.112.188.84
# Expected: Reply dari 100.112.188.84

# 2. Check Tailscale status
tailscale status
# Expected: Connected status

# 3. Verify Windows Firewall tidak blocking
# Windows Defender Firewall → Inbound Rules → Allow PostgreSQL port 5432

# 4. Test via psql jika sudah install
psql -h 100.112.188.84 -U diya-catalyst -d catalystDB
```

### Cannot Connect to Docker Container
**Error:** `psql: could not translate host name "100.112.188.84" to address`

**Possible causes:**
- Tailscale tidak connected
- Server PostgreSQL di Docker belum running

**Solution:**
```powershell
# 1. Connect Tailscale
tailscale up

# 2. Ping server
ping 100.112.188.84

# 3. Check server status (SSH ke server Fedora)
ssh diya@100.112.188.84
docker ps | grep postgres
```

### Database Connection Success ✅
Jika sudah terhubung ke Docker PostgreSQL di server:
```powershell
cd catalyst-scout
npx prisma db push  # Push schema ke server
npm run dev         # Start Next.js dev server
```

---

## F. QUICK REFERENCE

**Connection String:** `postgresql://diya-catalyst:Abid090300@100.112.188.84:5432/catalystDB`

**Server:** Fedora Server + Docker PostgreSQL  
**Developer:** Windows / Linux via Tailscale VPN  
**Port:** 5432 (exposed dari Docker container)  
**Database:** catalystDB  

---

## G. CHECKLIST SEBELUM PUSH KE PRODUCTION

### Developer Setup (Windows / Linux)
- [ ] Tailscale connected: `tailscale status`
- [ ] Bisa ping server: `ping 100.112.188.84`
- [ ] Test connection (Node.js): `node test-db.js` atau `psql -h 100.112.188.84 ...`
- [ ] Run `npx prisma db push` di catalyst-scout (push schema ke Docker DB di server)
- [ ] .env files sudah correct dengan DATABASE_URL pointing ke 100.112.188.84
- [ ] Pastikan file .env tidak ter-commit ke Git
- [ ] npm install & pip install -r requirements.txt sudah done
- [ ] Test jalankan aplikasi lokal (Next.js + Python API)
- [ ] Pastikan fitur Masking berjalan normal agar data sensitif tidak bocor ke OpenAI

### Server (Fedora Server - Prerequisite)
- [x] Docker installed dan running
- [x] PostgreSQL container running di port 5432
- [x] Database `catalystDB` dan user `diya-catalyst` sudah dibuat
- [x] Port 5432 expose dari container
- [x] Firewall allow port 5432 dari Tailscale network