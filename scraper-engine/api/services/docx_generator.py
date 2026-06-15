"""
docx_generator.py

Tiga mode generate .docx (generik untuk semua documentType — proposal, surat
kerja, BAST, invoice, kontrak, laporan CTR, dll — lihat document-templates/*.md):

1. Section-based (auto-detect default):
   Cari Heading 1 yang namanya ada di sections_to_replace (= aiSections dari
   DocumentTemplate), hapus paragraf teks di bawahnya (preserve tabel &
   gambar), sisipkan konten AI/data + sub-sections sebagai Heading 2. Cocok
   untuk upload template Word existing.

2. Placeholder mode:
   Cari & ganti {{PLACEHOLDER}} di seluruh dokumen. Aktif otomatis jika
   template mengandung placeholder. Placeholder untuk metadata/entity_data
   dibentuk otomatis dari key dict (`{{KEY_UPPER}}`), plus alias legacy di
   METADATA_PLACEHOLDERS untuk proposal. Placeholder untuk block dibentuk dari
   judul section (`{{JUDUL_DENGAN_UNDERSCORE}}`), plus alias legacy di
   BLOCK_PLACEHOLDERS.

3. From-scratch (fallback tanpa template):
   Generate dokumen Word baru dengan heading + paragraf + sub-sections.

Timeline table:
  Jika timeline_data diberikan ke generate(), tabel jadwal akan disisipkan
  di section `timeline_section` (default "DURATION & COMMERCIAL") setelah
  konten AI/data.
"""

import io
import logging
import re
from typing import Dict, List, Optional

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

logger = logging.getLogger(__name__)

_DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"

# Alias legacy untuk template Proposal existing yang sudah ditulis dengan
# placeholder ini (lihat document-templates/proposal.md §5). Section/field
# baru tidak perlu didaftarkan di sini — placeholder-nya dibentuk otomatis
# oleh _normalize_placeholder_name().
BLOCK_PLACEHOLDERS: Dict[str, str] = {
    "BACKGROUND":            "{{BACKGROUND}}",
    "INTRODUCTION":          "{{INTRODUCTION}}",
    "SUMMARY":               "{{SUMMARY}}",
    "DURATION & COMMERCIAL": "{{DURATION_COMMERCIAL}}",
    "PROPOSED SOLUTION":     "{{PROPOSED_SOLUTION}}",
    "METHODOLOGY":           "{{METHODOLOGY}}",
}

METADATA_PLACEHOLDERS: Dict[str, str] = {
    "tender_title":     "{{PROJECT_TITLE}}",
    "company_name":     "{{COMPANY_NAME}}",
    "kbli_code":        "{{KBLI_CODE}}",
    "kbli_description": "{{KBLI_DESCRIPTION}}",
}

# Section name that receives the timeline table when timeline_data is provided
TIMELINE_SECTION = "DURATION & COMMERCIAL"


def _normalize_placeholder_name(name: str) -> str:
    """'DURATION & COMMERCIAL' -> 'DURATION_COMMERCIAL', 'scope_of_work' -> 'SCOPE_OF_WORK'."""
    cleaned = re.sub(r"[^A-Za-z0-9]+", " ", name).strip().upper()
    return "_".join(cleaned.split())


def _build_metadata_replacements(metadata: Dict[str, str]) -> Dict[str, str]:
    """Bangun map placeholder -> value dari entity_data.

    Legacy keys (tender_title, company_name, kbli_code, kbli_description)
    tetap pakai alias METADATA_PLACEHOLDERS untuk backward-compat dengan
    template proposal existing. Key lain dibentuk otomatis jadi
    `{{KEY_UPPER}}` (lihat document-templates/*.md mapping table).
    """
    replacements: Dict[str, str] = {}
    for key, value in metadata.items():
        if value is None:
            continue
        ph = METADATA_PLACEHOLDERS.get(key) or "{{" + _normalize_placeholder_name(key) + "}}"
        replacements[ph] = str(value)
    return replacements


class DocxGenerator:
    def generate(
        self,
        blocks: List[Dict],
        metadata: Dict[str, str],
        template_path: Optional[str] = None,
        sections_to_replace: Optional[List[str]] = None,
        timeline_data: Optional[List[Dict]] = None,
        timeline_section: str = TIMELINE_SECTION,
    ) -> bytes:
        """
        Args:
            blocks:              list of {"title", "content", "subsections": [...]}
            metadata:            entity_data flat dict (mis. tender_title, company_name,
                                 kbli_code, kbli_description, project_name, client_name, dst —
                                 lihat document-templates/*.md per documentType)
            template_path:       path ke .docx template (None → from scratch)
            sections_to_replace: heading names yang akan diisi/diganti (= aiSections dari
                                 DocumentTemplate untuk section "ai"/"data"; section "static"
                                 tidak dimasukkan ke list ini)
            timeline_data:       list of {phase, activities, duration, notes} from Excel import
            timeline_section:    nama section (Heading 1) yang menerima tabel timeline
        """
        if template_path:
            try:
                return self._fill_template(
                    template_path, blocks, metadata, sections_to_replace, timeline_data, timeline_section
                )
            except Exception as e:
                logger.warning(f"[DocxGenerator] Template fill gagal: {e}. Fallback ke from-scratch.")
        return self._generate_from_scratch(blocks, metadata, timeline_data, timeline_section)

    # ------------------------------------------------------------------
    # Smart template fill
    # ------------------------------------------------------------------

    def _fill_template(
        self,
        template_path: str,
        blocks: List[Dict],
        metadata: Dict[str, str],
        sections_to_replace: Optional[List[str]],
        timeline_data: Optional[List[Dict]],
        timeline_section: str = TIMELINE_SECTION,
    ) -> bytes:
        doc = Document(template_path)
        all_text = "\n".join(p.text for p in doc.paragraphs)
        has_placeholders = any(ph in all_text for ph in BLOCK_PLACEHOLDERS.values())
        has_meta = any(ph in all_text for ph in METADATA_PLACEHOLDERS.values())
        has_dynamic_ph = bool(re.search(r"\{\{[A-Z0-9_]+\}\}", all_text))

        if has_placeholders or has_meta or has_dynamic_ph:
            logger.info("[DocxGenerator] Placeholder mode.")
            return self._fill_by_placeholders(template_path, blocks, metadata)

        logger.info("[DocxGenerator] Section-based mode.")
        effective = sections_to_replace or [b["title"].upper() for b in blocks]
        return self._fill_by_sections(template_path, blocks, metadata, effective, timeline_data, timeline_section)

    # ------------------------------------------------------------------
    # Mode 1 — Section-based
    # ------------------------------------------------------------------

    def _fill_by_sections(
        self,
        template_path: str,
        blocks: List[Dict],
        metadata: Dict[str, str],
        sections_to_replace: List[str],
        timeline_data: Optional[List[Dict]],
        timeline_section: str = TIMELINE_SECTION,
    ) -> bytes:
        doc = Document(template_path)
        body = doc.element.body

        content_map: Dict[str, Dict] = {
            b["title"].strip().upper(): b for b in blocks
        }
        replace_set = {s.strip().upper() for s in sections_to_replace}

        body_para_map = {
            p._element: p
            for p in doc.paragraphs
            if p._element.getparent() is body
        }

        def _has_image(el) -> bool:
            return (
                el.find(f".//{{{_DRAWING_NS}}}inline") is not None
                or el.find(f".//{{{_DRAWING_NS}}}anchor") is not None
            )

        # Phase 1 — identify elements to remove + locate heading elements
        current_section: Optional[str] = None
        to_remove: List = []
        section_heading_els: Dict[str, object] = {}

        for child in list(body):
            tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if tag == "p" and child in body_para_map:
                para = body_para_map[child]
                if para.style.name == "Heading 1":
                    txt = para.text.strip().upper()
                    if txt in replace_set:
                        current_section = txt
                        section_heading_els[txt] = child
                    else:
                        current_section = None
                elif current_section is not None and not _has_image(child):
                    to_remove.append(child)

        # Phase 2 — remove marked elements
        for el in to_remove:
            body.remove(el)

        # Phase 3 — insert AI content after each heading
        for section_name, heading_el in section_heading_els.items():
            block = content_map.get(section_name, {})
            insert_pos = list(body).index(heading_el) + 1
            offset = 0

            # Main content paragraphs
            for line in _split_lines(block.get("content", "")):
                body.insert(insert_pos + offset, self._make_paragraph(line))
                offset += 1

            # Sub-sections (Heading 2 + content)
            for sub in block.get("subsections", []):
                body.insert(insert_pos + offset, self._make_heading(sub["title"], level=2))
                offset += 1
                for line in _split_lines(sub.get("content", "")):
                    body.insert(insert_pos + offset, self._make_paragraph(line))
                    offset += 1

            # Timeline table goes into the configured timeline section
            if section_name == timeline_section.strip().upper() and timeline_data:
                tbl_el = self._make_timeline_table(doc, timeline_data)
                body.insert(insert_pos + offset, tbl_el)
                offset += 1

        # Phase 4 — metadata placeholder replacement (cover page, etc.)
        self._apply_replacements(doc, _build_metadata_replacements(metadata))

        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf.read()

    # ------------------------------------------------------------------
    # Mode 2 — Placeholder
    # ------------------------------------------------------------------

    def _fill_by_placeholders(
        self,
        template_path: str,
        blocks: List[Dict],
        metadata: Dict[str, str],
    ) -> bytes:
        doc = Document(template_path)
        replacements: Dict[str, str] = _build_metadata_replacements(metadata)
        for block in blocks:
            key = block.get("title", "").strip().upper()
            ph = BLOCK_PLACEHOLDERS.get(key) or "{{" + _normalize_placeholder_name(key) + "}}"
            if ph:
                # Flatten content + subsections into single string for placeholder mode
                parts = [block.get("content", "")]
                for sub in block.get("subsections", []):
                    parts.append(f"\n{sub['title']}\n{sub['content']}")
                replacements[ph] = "\n\n".join(p for p in parts if p)

        self._apply_replacements(doc, replacements)
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf.read()

    def _apply_replacements(self, doc: Document, replacements: Dict[str, str]) -> None:
        for para in doc.paragraphs:
            self._replace_in_paragraph(para, replacements)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for para in cell.paragraphs:
                        self._replace_in_paragraph(para, replacements)

    def _replace_in_paragraph(self, para, replacements: Dict[str, str]) -> None:
        full = "".join(r.text for r in para.runs)
        new = full
        for ph, val in replacements.items():
            new = new.replace(ph, val)
        if new == full:
            return
        for i, run in enumerate(para.runs):
            run.text = new if i == 0 else ""

    # ------------------------------------------------------------------
    # Mode 3 — From scratch
    # ------------------------------------------------------------------

    def _generate_from_scratch(
        self,
        blocks: List[Dict],
        metadata: Dict[str, str],
        timeline_data: Optional[List[Dict]] = None,
        timeline_section: str = TIMELINE_SECTION,
    ) -> bytes:
        doc = Document()
        doc.add_heading(metadata.get("tender_title", "Technical Proposal"), level=0)

        if metadata.get("company_name"):
            doc.add_paragraph(f"Company: {metadata['company_name']}")
        kbli = metadata.get("kbli_code", "")
        if kbli:
            suffix = f" — {metadata['kbli_description']}" if metadata.get("kbli_description") else ""
            doc.add_paragraph(f"KBLI: {kbli}{suffix}")
        doc.add_paragraph("")

        for block in blocks:
            doc.add_heading(block.get("title", ""), level=1)
            for chunk in _split_lines(block.get("content", "")):
                doc.add_paragraph(chunk)

            for sub in block.get("subsections", []):
                doc.add_heading(sub["title"], level=2)
                for chunk in _split_lines(sub.get("content", "")):
                    doc.add_paragraph(chunk)

            # Append timeline table to the configured timeline section
            if block.get("title", "").strip().upper() == timeline_section.strip().upper() and timeline_data:
                self._append_timeline_table(doc, timeline_data)

        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf.read()

    # ------------------------------------------------------------------
    # Timeline table helpers
    # ------------------------------------------------------------------

    def _make_timeline_table(self, doc, timeline_data: List[Dict]):
        """Create a timeline table, detach from doc, return raw XML element."""
        tbl = self._append_timeline_table(doc, timeline_data)
        tbl_el = tbl._tbl
        tbl_el.getparent().remove(tbl_el)
        return tbl_el

    def _append_timeline_table(self, doc, timeline_data: List[Dict]):
        """Append timeline table to end of doc and return the Table object."""
        headers = ["No.", "Phase / Activity", "Duration", "Notes"]
        table = doc.add_table(rows=1 + len(timeline_data), cols=len(headers))
        try:
            table.style = "Table Grid"
        except Exception:
            pass

        hdr_cells = table.rows[0].cells
        for i, h in enumerate(headers):
            hdr_cells[i].text = h

        for ri, item in enumerate(timeline_data):
            cells = table.rows[ri + 1].cells
            cells[0].text = str(item.get("phase", ri + 1))
            cells[1].text = item.get("activities", "")
            cells[2].text = item.get("duration", "")
            cells[3].text = item.get("notes", "")

        return table

    # ------------------------------------------------------------------
    # XML element factories
    # ------------------------------------------------------------------

    @staticmethod
    def _make_paragraph(text: str):
        """Bare Normal paragraph element for body.insert()."""
        p = OxmlElement("w:p")
        r = OxmlElement("w:r")
        t = OxmlElement("w:t")
        t.text = text
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        r.append(t)
        p.append(r)
        return p

    @staticmethod
    def _make_heading(text: str, level: int = 2):
        """Heading paragraph element (level 2 or 3) for body.insert()."""
        p = OxmlElement("w:p")
        pPr = OxmlElement("w:pPr")
        pStyle = OxmlElement("w:pStyle")
        pStyle.set(qn("w:val"), f"Heading{level}")
        pPr.append(pStyle)
        p.append(pPr)
        r = OxmlElement("w:r")
        t = OxmlElement("w:t")
        t.text = text
        r.append(t)
        p.append(r)
        return p


# ------------------------------------------------------------------
# Module-level helpers
# ------------------------------------------------------------------

def _split_lines(text: str) -> List[str]:
    """Split text into non-empty lines for paragraph-level insertion."""
    return [ln.strip() for ln in text.split("\n") if ln.strip()]
