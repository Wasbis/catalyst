"""
api/models/database.py

Strategi naming:
  - Tabel MasterKbli & DataMasking sudah ada di DB via Prisma (camelCase columns).
    SQLAlchemy memetakan ke Python attribute snake_case menggunakan
    Column("namaKolomAsli", ...) sehingga tidak perlu migration data.
  - Tabel TenderResult adalah tabel baru murni Python — pakai snake_case penuh.
"""

import os
from dotenv import load_dotenv

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
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
    # SQLite butuh flag ini agar bisa dipakai lintas thread (dev only)
    connect_args=(
        {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    ),
    # Connection pool — turunkan kalau pakai SQLite, naikkan untuk Postgres
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------------------------
# MasterKbli
# Tabel ini sudah dibuat Prisma → pakai nama kolom asli (camelCase) di DB,
# tapi expose sebagai snake_case di Python.
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
# id di Prisma bertipe String (CUID); di sini kita biarkan String
# agar tidak perlu migration, tapi tambah auto-generate default di level app.
# ---------------------------------------------------------------------------
class DataMasking(Base):
    __tablename__ = "DataMasking"

    id = Column(String, primary_key=True, index=True)
    keyword = Column("keyword", String(500), unique=True, nullable=False)
    replacement = Column("replacement", String(500), nullable=False)
    category = Column("category", String(100), nullable=True)

    # Kolom baru — tambahkan via Prisma migration atau Alembic kalau belum ada
    is_regex = Column(
        "isRegex", Boolean, default=False, nullable=False, server_default="false"
    )
    is_active = Column(
        "isActive", Boolean, default=True, nullable=False, server_default="true"
    )
    created_at = Column("createdAt", DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<DataMasking '{self.keyword}' → '{self.replacement}'>"


# ---------------------------------------------------------------------------
# TenderResult
# Tabel baru — murni Python/SQLAlchemy, tidak ada di Prisma schema.
# Semua nama pakai snake_case.
# ---------------------------------------------------------------------------
class TenderResult(Base):
    __tablename__ = "tender_results"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)  # geodipa|civd|gep
    title = Column(Text, nullable=False)
    agency = Column(String(255), nullable=True)

    # URL — kosong ("") untuk CIVD karena tidak ada halaman detail terpisah
    detail_url = Column(Text, nullable=True, index=True)

    # Teks gabungan untuk AI matching (title + bidang usaha + syarat, dst)
    tender_text = Column(Text, nullable=True)

    # Dokumen lampiran
    doc_url = Column(Text, nullable=True)
    doc_files_json = Column(Text, nullable=True)  # JSON list attachment

    # Hasil AI matching
    matched_kbli = Column(String(10), nullable=True)
    match_score = Column(Float, nullable=True)
    is_masked = Column(Boolean, default=False)

    # Field khusus CIVD
    announcement_type = Column(Integer, nullable=True)  # 1=PQ, 2=tender
    announcement_type_label = Column(Text, nullable=True)  # VARCHAR(100) → Text
    golongan_usaha_json = Column(Text, nullable=True)  # JSON list
    jenis_pengadaan = Column(Text, nullable=True)       # VARCHAR(50) → Text (data CIVD bisa panjang)
    bidang_usaha_json = Column(Text, nullable=True)  # JSON list

    # Waktu
    deadline_text = Column(String(100), nullable=True)
    publish_date = Column(String(50), nullable=True)

    # Dedup — MD5 hash dari title+agency+source/type
    fingerprint = Column(String(64), unique=True, index=True, nullable=True)

    # Audit
    scraped_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

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
    jadi Base.metadata.create_all hanya akan membuat TenderResult
    (dan tabel lain yang belum ada) tanpa menyentuh yang sudah ada.
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
