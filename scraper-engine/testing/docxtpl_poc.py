"""
POC: Methodology 2 feasibility check (docxtpl/Jinja2 full-document templating).

Verifies that docxtpl can replace dynamic fields across the ENTIRE document
(cover textbox, proprietary notice, header/footer, document-info table,
project-info table) -- not just body paragraphs under Heading-1 like
Methodology 1's `_fill_by_sections`.

Steps:
1. Copy the GOKP proposal template.
2. Insert Jinja2 tags ({{ var }}) by direct string replacement in
   word/document.xml and word/footer2.xml (raw XML inside the .docx zip).
3. Render the tagged copy with docxtpl + a dummy context (values that
   differ from the original template).
4. Re-open the rendered output and assert the dummy values landed in the
   cover textbox, header/footer, and tables.

This is a standalone script -- does not touch docx_generator.py or any
production endpoint.

KNOWN CAVEAT (relevant for the future Field Mapper): Word frequently splits
a single visible string across multiple <w:r><w:t> runs (e.g. due to
revision history / spell-check markers). "CRI2603P100-Rev 00" appears as a
contiguous string only in word/footer2.xml; in footer1/3/4.xml the same
visible text is split across runs, so naive substring replacement misses it
even though python-docx's `paragraph.text` (which concatenates runs) finds
it. A real Field Mapper needs to either (a) merge runs before
matching/replacing, or (b) match against `paragraph.text` and replace at the
run level across run boundaries.
"""

import shutil
import zipfile
from pathlib import Path

from docx import Document
from docxtpl import DocxTemplate

TESTING_DIR = Path(__file__).resolve().parent
SOURCE_TEMPLATE = (
    TESTING_DIR.parent.parent
    / "storage"
    / "proposal_templates"
    / "260310_CRI2602P100-Rev_00_Proposal_Excellence_CMMS_-_GOKP_(1).docx"
)
TAGGED_PATH = TESTING_DIR / "_poc_tagged.docx"
OUTPUT_PATH = TESTING_DIR / "_poc_output.docx"

# (xml part inside the .docx zip, old text, new Jinja2-tagged text)
REPLACEMENTS = [
    ("word/document.xml", "GENTING OIL KASURI PTE. LTD.", "{{ client_name }}"),
    ("word/document.xml", "Genting Oil Kasuri PTE. LTD.", "{{ client_legal_name }}"),
    (
        "word/document.xml",
        'w:rsidR="00265586"><w:t>GOKPL</w:t>',
        'w:rsidR="00265586"><w:t>{{ client_short_name }}</w:t>',
    ),
    ("word/document.xml", "Nadya Friska", "{{ author_name }}"),
    ("word/document.xml", "Confidential", "{{ classification }}"),
    ("word/footer2.xml", "CRI2603P100-Rev 00", "{{ proposal_ref }}"),
]

DUMMY_CONTEXT = {
    "client_name": "PT CONTOH CLIENT BARU",
    "client_legal_name": "PT Contoh Client Baru",
    "client_short_name": "PCCB",
    "author_name": "Budi Santoso",
    "classification": "Internal Use Only",
    "proposal_ref": "CRI2606P200-Rev 00",
}


def tag_template(source: Path, dest: Path, replacements: list[tuple[str, str, str]]) -> None:
    parts: dict[str, str] = {}
    with zipfile.ZipFile(source, "r") as zin:
        names = zin.namelist()
        contents = {name: zin.read(name) for name in names}

    for part_name, old, new in replacements:
        xml = parts.get(part_name)
        if xml is None:
            xml = contents[part_name].decode("utf-8")
        count = xml.count(old)
        if count == 0:
            raise AssertionError(f"'{old}' not found in {part_name}")
        parts[part_name] = xml.replace(old, new)
        print(f"  tagged {count}x '{old[:50]}...' -> '{new}' in {part_name}")

    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, data in contents.items():
            if name in parts:
                data = parts[name].encode("utf-8")
            zout.writestr(name, data)


def dump_textbox_text(docx_path: Path) -> str:
    with zipfile.ZipFile(docx_path, "r") as z:
        return z.read("word/document.xml").decode("utf-8")


def main() -> None:
    if not SOURCE_TEMPLATE.exists():
        raise FileNotFoundError(SOURCE_TEMPLATE)

    print("1. Tagging template copy with Jinja2 placeholders...")
    tag_template(SOURCE_TEMPLATE, TAGGED_PATH, REPLACEMENTS)

    print("\n2. Rendering with docxtpl + dummy context...")
    tpl = DocxTemplate(str(TAGGED_PATH))
    tpl.render(DUMMY_CONTEXT)
    tpl.save(str(OUTPUT_PATH))

    print("\n3. Verifying output...")
    doc_xml = dump_textbox_text(OUTPUT_PATH)
    doc = Document(str(OUTPUT_PATH))

    checks: list[tuple[str, bool]] = []

    # Cover textbox + proprietary notice + project-info (live in document.xml,
    # including txbxContent which python-docx's `doc.paragraphs` can't see)
    checks.append(("cover title -> client_name", DUMMY_CONTEXT["client_name"] in doc_xml))
    checks.append(
        ("cover/notice/project-info -> client_legal_name", DUMMY_CONTEXT["client_legal_name"] in doc_xml)
    )
    checks.append(("proprietary notice -> client_short_name", DUMMY_CONTEXT["client_short_name"] in doc_xml))

    # Document Info table (Author / Classification)
    table0_cells = [c.text for row in doc.tables[0].rows for c in row.cells]
    checks.append(("document info table -> author_name", DUMMY_CONTEXT["author_name"] in table0_cells))
    checks.append(("document info table -> classification", DUMMY_CONTEXT["classification"] in table0_cells))

    # Footer (Ref. No)
    footer_text = "\n".join(p.text for s in doc.sections for p in s.footer.paragraphs)
    first_page_footer_text = "\n".join(p.text for s in doc.sections for p in s.first_page_footer.paragraphs)
    checks.append(
        ("footer -> proposal_ref", DUMMY_CONTEXT["proposal_ref"] in (footer_text + first_page_footer_text))
    )

    # Old values must be GONE from the parts we tagged
    checks.append(("old client name removed", "GENTING OIL KASURI PTE. LTD." not in doc_xml))
    with zipfile.ZipFile(OUTPUT_PATH, "r") as z:
        footer2_xml = z.read("word/footer2.xml").decode("utf-8")
    checks.append(("old ref number removed from footer2.xml", "CRI2603P100-Rev 00" not in footer2_xml))

    print()
    all_ok = True
    for label, ok in checks:
        print(f"  {'OK' if ok else 'FAIL'} - {label}")
        all_ok = all_ok and ok

    print()
    if all_ok:
        print(f"feasibility confirmed. Output saved at {OUTPUT_PATH}")
    else:
        raise SystemExit("one or more checks failed - see above")


if __name__ == "__main__":
    main()
