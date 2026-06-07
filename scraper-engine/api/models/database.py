"""
api/models/database.py

Strategi naming:
  - Tabel MasterKbli & DataMasking sudah ada di DB via Prisma (camelCase columns).
    SQLAlchemy memetakan ke Python attribute snake_case menggunakan
    Column("namaKolomAsli", ...) sehingga tidak perlu migration data.
  - Tabel TenderResult & ScrapingJob adalah tabel baru murni Python — pakai snake_case penuh.
"""

import os
from dotenv import load_dotenv

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

# ---------------------------------------------------------------------------
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL belum di-set. "
        "Tambahkan ke file .env atau environment variable."
    )

engine = create_engine(
    DATABASE_URL,
    connect_args=(
        {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    ),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------------------------
# MasterKbli
# Tabel ini sudah dibuat Prisma → pakai nama kolom asli (camelCase) di DB.
# ---------------------------------------------------------------------------
class MasterKbli(Base):
    __tablename__ = "MasterKbli"

    id = Column(Integer, primary_key=True, index=True)
    kbli_code = Column("kbliCode", String, unique=True, index=True, nullable=False)
    description = Column("description", Text, nullable=False)
    category = Column("category", String(100), nullable=True)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    created_at = Column("createdAt", DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<MasterKbli {self.kbli_code}: {self.description[:40]}>"


# ---------------------------------------------------------------------------
# DataMasking
# Tabel ini sudah dibuat Prisma → sama, pakai alias kolom.
# ---------------------------------------------------------------------------
class DataMasking(Base):
    __tablename__ = "DataMasking"

    id = Column(String, primary_key=True, index=True)
    keyword = Column("keyword", String(500), unique=True, nullable=False)
    replacement = Column("replacement", String(500), nullable=False)
    category = Column("category", String(100), nullable=True)
    is_regex = Column("isRegex", Boolean, default=False, nullable=False, server_default="false")
    is_active = Column("isActive", Boolean, default=True, nullable=False, server_default="true")
    created_at = Column("createdAt", DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<DataMasking '{self.keyword}' → '{self.replacement}'>"


# ---------------------------------------------------------------------------
# ScrapingJob
# Log setiap job scraping — untuk RF-T-012 (logging) dan RF-T-013 (deteksi 2x gagal).
# Harus didefinisikan sebelum TenderResult karena TenderResult punya FK ke sini.
# ---------------------------------------------------------------------------
class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)     # civd|lpse|geodipa
    trigger = Column(String(20), default="scheduled")           # scheduled|manual
    status = Column(String(20), default="running", nullable=False)  # running|success|failed
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    tenders_found = Column(Integer, default=0)
    tenders_new = Column(Integer, default=0)
    tenders_updated = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    # RF-T-013: hitung berapa kali gagal berturut-turut per source
    consecutive_failures = Column(Integer, default=0, nullable=False)

    def __repr__(self) -> str:
        return f"<ScrapingJob [{self.source}] {self.status} @ {self.started_at}>"


# ---------------------------------------------------------------------------
# TenderResult
# Tabel baru murni Python/SQLAlchemy — tidak ada di Prisma schema.
# Semua nama pakai snake_case.
#
# CATATAN MIGRASI: kalau tabel tender_results sudah ada di DB dengan schema lama,
# jalankan: DROP TABLE tender_results; lalu restart server agar dibuat ulang.
# ---------------------------------------------------------------------------
class TenderResult(Base):
    __tablename__ = "tender_results"

    # === Identity ===
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)     # civd|lpse|geodipa

    # === Core fields (RF-T-003) ===
    title = Column(Text, nullable=False)
    agency = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    budget_estimated = Column(BigInteger, nullable=True)         # RF-T-003, RF-T-005
    deadline_text = Column(String(100), nullable=True)           # raw string dari scraper
    deadline_date = Column(Date, nullable=True)                  # parsed, untuk sort/filter/change detection
    source_url = Column(Text, nullable=True)                     # URL halaman detail (kosong untuk CIVD)

    # === Deduplication (RF-T-004) ===
    # MD5 hash dari kombinasi unik per source (title+agency+type untuk CIVD)
    fingerprint = Column(String(64), unique=True, index=True, nullable=False)

    # === AI Matching & Scoring (RF-T-006, RF-T-007) ===
    tender_text = Column(Text, nullable=True)                    # teks gabungan untuk embedding
    kbli_codes_json = Column(Text, nullable=True)               # JSON list: kode KBLI extracted dari teks tender
    kbli_matched_json = Column(Text, nullable=True)             # JSON list: KBLI yang cocok dengan profil Cliste
    match_score = Column(Integer, nullable=True)                 # 0-100
    recommendation = Column(String(10), nullable=True)           # KEJAR|TINJAU|LEWATI

    # === Status Manajemen (RF-T-009) ===
    status = Column(String(20), default="DITEMUKAN", nullable=False)
    # DITEMUKAN → DITINJAU → DIKEJAR → DISERAHKAN → MENANG / KALAH / BATAL

    # === User Actions (RF-T-010, RF-T-011) ===
    notes = Column(Text, nullable=True)
    converted_to_project = Column(Boolean, default=False, nullable=False)
    project_id = Column(Integer, nullable=True)                  # ref ke project App 2 setelah konversi

    # === Attachments ===
    doc_files_json = Column(Text, nullable=True)                 # JSON list of {file_id, file_name, download_url, ...}

    # === Source-specific metadata ===
    # Semua field yang spesifik per platform masuk sini sebagai JSON.
    # Contoh CIVD: {announcement_type, announcement_type_label, golongan_usaha, jenis_pengadaan, bidang_usaha}
    source_metadata_json = Column(Text, nullable=True)
    is_masked = Column(Boolean, default=False, nullable=False)

    # === Audit ===
    scraped_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    scraping_job_id = Column(Integer, ForeignKey("scraping_jobs.id"), nullable=True)

    def __repr__(self) -> str:
        return f"<TenderResult [{self.source}] {self.title[:50]}>"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def init_db() -> None:
    """
    Buat semua tabel yang belum ada.
    Dipanggil di startup event FastAPI.

    Catatan: MasterKbli dan DataMasking sudah dibuat Prisma,
    jadi Base.metadata.create_all hanya akan membuat tabel baru
    (TenderResult, ScrapingJob) tanpa menyentuh yang sudah ada.
    """
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    Dependency injection untuk FastAPI endpoint.

    Usage:
        @app.get("/something")
        def route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
