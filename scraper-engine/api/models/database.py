"""
api/models/database.py

Strategi naming:
  - Tabel MasterKbli & DataMasking sudah ada di DB via Prisma (camelCase columns).
    SQLAlchemy memetakan ke Python attribute snake_case menggunakan
    Column("namaKolomAsli", ...) sehingga tidak perlu migration data.
  - Tabel TenderResult & ScrapingJob adalah tabel baru murni Python — pakai snake_case penuh.
"""

import os
import uuid
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
from sqlalchemy.orm import relationship
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
# Notification
# Tabel ini sudah dibuat Prisma (model `Notification`, default table name sama
# dengan nama model karena tidak ada @@map) → pakai alias kolom camelCase.
# Dipakai untuk RF-T-008 (notif skor tinggi) & RF-T-013 (notif kegagalan scraper).
# ---------------------------------------------------------------------------
class Notification(Base):
    __tablename__ = "Notification"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column("title", String, nullable=False)
    message = Column("message", Text, nullable=False)
    action_link = Column("actionLink", Text, nullable=True)
    is_read = Column("isRead", Boolean, default=False, nullable=False)
    created_at = Column("createdAt", DateTime(timezone=True), server_default=func.now())
    user_id = Column("userId", String, nullable=True)

    def __repr__(self) -> str:
        return f"<Notification '{self.title}' read={self.is_read}>"


# ---------------------------------------------------------------------------
# AppSetting
# Tabel Key-Value untuk pengaturan aplikasi
# ---------------------------------------------------------------------------
class AppSetting(Base):
    __tablename__ = "AppSetting"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column("updatedAt", DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<AppSetting '{self.key}'>"


# ---------------------------------------------------------------------------
# ScraperSetting
# Konfigurasi scraper schedule dan target
# ---------------------------------------------------------------------------
class ScraperSetting(Base):
    __tablename__ = "ScraperSetting"

    id = Column(Integer, primary_key=True, index=True)
    target_name = Column("targetName", String, nullable=False)
    target_url = Column("targetUrl", Text, nullable=False)
    cron_schedule = Column("cronSchedule", String, nullable=False)
    is_active = Column("isActive", Boolean, default=True)
    last_run_at = Column("lastRunAt", DateTime(timezone=True), nullable=True)
    last_count = Column("lastCount", Integer, nullable=True)
    last_error = Column("lastError", Text, nullable=True)
    updated_at = Column("updatedAt", DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<ScraperSetting '{self.target_name}'>"


# ---------------------------------------------------------------------------
# ScrapingJob
# Log setiap job scraping — untuk RF-T-012 (logging) dan RF-T-013 (deteksi 2x gagal).
# Harus didefinisikan sebelum TenderResult karena TenderResult punya FK ke sini.
# ---------------------------------------------------------------------------
class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)     # civd|geodipa
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
    source = Column(String(50), nullable=False, index=True)     # civd|geodipa

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
# ProposalTemplate
# Python-managed table. Simpan .docx template yang diupload user.
# ---------------------------------------------------------------------------
class ProposalTemplate(Base):
    __tablename__ = "proposal_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    # Type of proposal this template is for, e.g. "IT Project", "Engineering Services"
    proposal_type = Column(String(100), nullable=True)
    # JSON list of section heading names to replace for this template type.
    # Overrides DEFAULT_PROPOSAL_SECTIONS when this template is used.
    default_sections_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drafts = relationship("ProposalDraft", back_populates="template")

    def __repr__(self) -> str:
        return f"<ProposalTemplate '{self.name}' type={self.proposal_type}>"


# ---------------------------------------------------------------------------
# ProposalDraft
# Draft proposal hasil generate AI, linked ke TenderResult.
# ---------------------------------------------------------------------------
class ProposalDraft(Base):
    __tablename__ = "proposal_drafts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tender_result_id = Column(Integer, ForeignKey("tender_results.id"), nullable=True, index=True)
    tender_title = Column(Text, nullable=False)
    kbli_code = Column(String(20), nullable=True)
    kbli_description = Column(Text, nullable=True)
    company_name = Column(String(255), nullable=True)
    template_id = Column(String, ForeignKey("proposal_templates.id"), nullable=True)
    status = Column(String(20), default="draft", nullable=False)  # draft | review | final
    generated_by = Column(String(100), nullable=True)  # claude-haiku | template
    # JSON list of {phase, activities, duration, notes} imported from Excel timeline
    timeline_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    blocks = relationship(
        "ProposalBlock",
        back_populates="draft",
        order_by="ProposalBlock.order",
        cascade="all, delete-orphan",
    )
    template = relationship("ProposalTemplate", back_populates="drafts")

    def __repr__(self) -> str:
        return f"<ProposalDraft '{self.tender_title[:40]}' {self.status}>"


# ---------------------------------------------------------------------------
# ProposalBlock
# Satu bagian/section di dalam ProposalDraft. User bisa edit per-block.
# ---------------------------------------------------------------------------
class ProposalBlock(Base):
    __tablename__ = "proposal_blocks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    draft_id = Column(String, ForeignKey("proposal_drafts.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    # JSON list of {title, content} sub-sections (Heading 2 level)
    subsections_json = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    user_comment = Column(Text, nullable=True)

    draft = relationship("ProposalDraft", back_populates="blocks")

    def __repr__(self) -> str:
        return f"<ProposalBlock '{self.title}' order={self.order}>"


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
