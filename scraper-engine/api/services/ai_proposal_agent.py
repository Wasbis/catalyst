import logging
import re
from typing import Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)

# Load model sekali saat import
model = SentenceTransformer("all-MiniLM-L6-v2")


class AIProposalAgent:
    """
    Agent untuk generate draft proposal teknis berdasarkan tender.

    Pipeline:
    1. Parse tender_text untuk ekstrak key requirements, metodologi, timeline
    2. Gunakan semantic similarity untuk cari bagian relevan dari tender
    3. Generate proposal berkualitas dengan struktur standar CRI
    4. Return proposal text yang siap di-review dan di-edit
    """

    def __init__(self):
        self.model = model
        self.logger = logging.getLogger(__name__)

    def generate_proposal(
        self,
        tender_title: str,
        tender_text: str,
        kbli_code: str,
        kbli_description: str,
        company_name: str = "[NAMA PERUSAHAAN]",
    ) -> Dict[str, Any]:
        """
        Generate proposal draft dari tender data.

        Args:
            tender_title: Judul tender
            tender_text: Teks requirement tender (sudah ter-mask kalau perlu)
            kbli_code: Kode KBLI yang sudah di-match
            kbli_description: Deskripsi KBLI
            company_name: Nama perusahaan CRI (untuk personalisasi)

        Returns:
            {
                "proposal_text": "...",
                "status": "success",
                "blocks": [
                    {"title": "Latar Belakang", "content": "..."},
                    ...
                ]
            }
        """
        try:
            self.logger.info(
                f"[AIProposalAgent] Generating proposal for KBLI {kbli_code}..."
            )

            # ── Parse tender untuk ekstrak key info ──────────────────────────
            key_points = self._extract_key_points(tender_text)

            # ── Generate proposal blocks ────────────────────────────────────
            blocks = [
                self._generate_latar_belakang(
                    tender_title, kbli_description, company_name
                ),
                self._generate_analisis_kebutuhan(key_points, tender_text),
                self._generate_metodologi(key_points, kbli_code),
                self._generate_timeline(key_points),
                self._generate_resource_plan(key_points),
                self._generate_kesimpulan(tender_title, company_name),
            ]

            # ── Gabung semua blocks jadi satu proposal text ──────────────────
            proposal_text = "\n\n".join(
                [f"{'='*60}\n{b['title']}\n{'='*60}\n{b['content']}" for b in blocks]
            )

            return {
                "status": "success",
                "proposal_text": proposal_text,
                "blocks": blocks,
                "metadata": {
                    "tender_title": tender_title,
                    "kbli_code": kbli_code,
                    "kbli_description": kbli_description,
                    "company_name": company_name,
                },
            }

        except Exception as e:
            self.logger.error(f"[AIProposalAgent] Error: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "proposal_text": "",
                "blocks": [],
            }

    def _extract_key_points(self, tender_text: str) -> Dict[str, Any]:
        """
        Extract kata kunci penting dari tender text:
        - Scope of work
        - Timeline
        - Budget indicator
        - Location / Regional
        - Qualification requirements
        """
        key_points = {
            "scope": "",
            "timeline": "",
            "budget_indicator": "",
            "location": "",
            "qualifications": [],
        }

        text_lower = tender_text.lower()

        # Ekstrak scope (cari kata kunci)
        scope_keywords = [
            "pekerjaan",
            "jasa",
            "layanan",
            "implementasi",
            "maintenance",
            "support",
        ]
        scope_sentences = [
            s.strip()
            for s in tender_text.split(".")
            if any(kw in s.lower() for kw in scope_keywords)
        ][:2]
        if scope_sentences:
            key_points["scope"] = " ".join(scope_sentences)

        # Ekstrak timeline
        timeline_pattern = r"(\d+\s+(?:hari|bulan|minggu|tahun))"
        timeline_matches = re.findall(timeline_pattern, text_lower)
        if timeline_matches:
            key_points["timeline"] = timeline_matches[0]

        # Ekstrak budget indicator
        budget_pattern = r"(Rp\.?\s*[\d.,]+(?:\s+(?:juta|miliar))?|nilai\s+[\d.,]+)"
        budget_matches = re.findall(budget_pattern, tender_text, re.I)
        if budget_matches:
            key_points["budget_indicator"] = budget_matches[0]

        # Ekstrak location
        location_keywords = [
            "jakarta",
            "surabaya",
            "bandung",
            "medan",
            "semarang",
            "lokasi",
            "tempat",
            "wilayah",
            "regional",
        ]
        location_sentences = [
            s.strip()
            for s in tender_text.split(".")
            if any(kw in s.lower() for kw in location_keywords)
        ][:1]
        if location_sentences:
            key_points["location"] = location_sentences[0]

        # Ekstrak qualifications
        qual_keywords = [
            "berpengalaman",
            "sertifikasi",
            "lisensi",
            "keahlian",
            "standar",
            "iso",
        ]
        qual_sentences = [
            s.strip()
            for s in tender_text.split(".")
            if any(kw in s.lower() for kw in qual_keywords)
        ][:3]
        key_points["qualifications"] = qual_sentences

        return key_points

    def _generate_latar_belakang(
        self, tender_title: str, kbli_description: str, company_name: str
    ) -> Dict[str, str]:
        """Generate bagian Latar Belakang proposal."""
        content = f"""
Dalam menanggapi pengumuman tender untuk "{tender_title}", {company_name} 
dengan bangga menyampaikan proposal teknis ini.

{company_name} adalah perusahaan yang berpengalaman di bidang {kbli_description.lower()}. 
Kami memiliki track record yang solid dalam menyelesaikan proyek-proyek serupa 
dengan kualitas terbaik dan tepat waktu.

Komitmen kami adalah memberikan solusi terbaik yang sesuai dengan kebutuhan 
dan ekspektasi pihak pemberi tender. Proposal ini disusun berdasarkan pemahaman 
mendalam terhadap requirement yang telah kami pelajari dengan seksama.
        """.strip()

        return {"title": "Latar Belakang", "content": content}

    def _generate_analisis_kebutuhan(
        self, key_points: Dict[str, Any], tender_text: str
    ) -> Dict[str, str]:
        """Generate bagian Analisis Kebutuhan."""
        scope_info = key_points.get("scope", "Layanan profesional sesuai requirement")
        timeline_info = key_points.get("timeline", "Sesuai jadwal yang ditetapkan")
        location_info = key_points.get("location", "Lokasi sesuai spesifikasi tender")

        content = f"""
Berdasarkan tender yang kami terima, kami telah mengidentifikasi kebutuhan utama:

1. Ruang Lingkup Pekerjaan (Scope of Work)
   {scope_info}

2. Timeline Pelaksanaan
   {timeline_info}

3. Lokasi/Regional
   {location_info}

4. Deliverables Utama
   - Laporan tertulis berkualitas tinggi
   - Dokumentasi lengkap setiap tahap
   - Review dan quality assurance
   - Handover ke klien dengan training

Kami memahami setiap detail requirement dan siap memenuhi ekspektasi tersebut 
dengan standar internasional.
        """.strip()

        return {"title": "Analisis Kebutuhan", "content": content}

    def _generate_metodologi(
        self, key_points: Dict[str, Any], kbli_code: str
    ) -> Dict[str, str]:
        """Generate bagian Metodologi."""
        content = f"""
Metodologi yang kami terapkan didasarkan pada best practices industri dan 
pengalaman kami dalam proyek-proyek sejenis.

Fase Pelaksanaan:

1. Phase 1: Planning & Kickoff
   - Meeting dengan stakeholder
   - Detail requirement gathering
   - Risk assessment
   - Resource allocation

2. Phase 2: Execution
   - Implementasi sesuai metodologi yang disepakati
   - Quality control di setiap tahap
   - Regular update dan komunikasi dengan klien

3. Phase 3: Testing & Validation
   - UAT (User Acceptance Testing)
   - Performance verification
   - Documentation review

4. Phase 4: Handover & Support
   - Knowledge transfer
   - User training
   - Post-implementation support

Pendekatan kami mengutamakan:
- Transparansi dan komunikasi terbuka
- Quality assurance di setiap milestone
- Adaptasi dengan kebutuhan klien
- Risk management yang proaktif

KBLI: {kbli_code}
        """.strip()

        return {"title": "Metodologi & Pendekatan", "content": content}

    def _generate_timeline(self, key_points: Dict[str, Any]) -> Dict[str, str]:
        """Generate bagian Timeline Pelaksanaan."""
        timeline_info = key_points.get("timeline", "12 minggu")

        content = f"""
Rencana jadwal pelaksanaan proyek:

Timeline Pelaksanaan: {timeline_info}

Breakdown per Phase:
- Phase 1 (Planning & Kickoff)     : 1 minggu
- Phase 2 (Execution)              : {timeline_info}
- Phase 3 (Testing & Validation)   : 2 minggu
- Phase 4 (Handover & Support)     : 1 minggu

Milestone Utama:
• Week 1   : Project kickoff & requirement finalization
• Week 4   : Interim review & status report
• Week 8   : Near completion review
• Week 12+ : Final delivery & handover

Catatan: Jadwal dapat disesuaikan dengan kesepakatan bersama dan kondisi lapangan.
        """.strip()

        return {"title": "Timeline Pelaksanaan", "content": content}

    def _generate_resource_plan(self, key_points: Dict[str, Any]) -> Dict[str, str]:
        """Generate bagian Resource & Team."""
        content = """
Tim yang kami alokasikan untuk proyek ini terdiri dari profesional berpengalaman:

Project Lead / Manager
- Bertanggung jawab keseluruhan project
- Point of contact utama dengan klien
- Koordinasi tim dan resource

Technical Team
- Specialist di bidang sesuai requirement
- Berpengalaman minimal 5+ tahun di industri
- Bersertifikat dan qualified

Quality Assurance Team
- Memastikan quality standard terpenuhi
- Testing dan validation di setiap tahap
- Documentation review

Support Team
- Back-up resources untuk flexibility
- Knowledge sharing dan documentation
- Training delivery

Resources & Tools:
- Infrastructure dan tools sesuai kebutuhan
- Technology stack terkini
- Project management tools untuk transparency
- Dokumentasi dan knowledge base

Keseluruhan team kami dikomitkan untuk memberikan hasil terbaik tepat waktu.
        """.strip()

        return {"title": "Resource & Tim", "content": content}

    def _generate_kesimpulan(
        self, tender_title: str, company_name: str
    ) -> Dict[str, str]:
        """Generate bagian Kesimpulan & Komitmen."""
        content = f"""
Proposal ini merepresentasikan komitmen serius {company_name} untuk 
memberikan solusi berkualitas tinggi dalam "{tender_title}".

Keunggulan Kompetitif Kami:
✓ Pengalaman proven di industri ini
✓ Tim profesional bersertifikat
✓ Metodologi yang teruji dan terstruktur
✓ Quality assurance yang ketat
✓ Komunikasi transparan dan responsif
✓ Ability to meet deadline dan budget

Kami siap untuk diskusi lebih lanjut dan menjawab pertanyaan apapun 
mengenai proposal ini. Hubungi kami kapan saja untuk clarification atau 
detail tambahan.

Terima kasih atas kesempatan ini. Kami yakin bahwa kerjasama dengan {company_name} 
akan membawa nilai tambah signifikan untuk kesuksesan proyek Anda.

---
Proposal ini disusun dengan sepenuh perhatian dan profesionalisme.
Semua informasi akurat sesuai pengetahuan kami pada saat penyusunan.
        """.strip()

        return {"title": "Kesimpulan & Komitmen", "content": content}
