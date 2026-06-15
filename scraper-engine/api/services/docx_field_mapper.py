"""
docx_field_mapper.py

Backend untuk "Template Field Mapper" (Methodology 2 / docxtpl) — lihat
document-templates/proposal-generator-strategy-v2.md §5.

Dua operasi:

1. `scan_template(file_path)`:
   Buka .docx sebagai zip, scan SETIAP paragraf (`<w:p>`) di
   `word/document.xml` (termasuk isi `txbxContent`/text box & tabel) dan
   `word/header*.xml` / `word/footer*.xml`. Untuk setiap paragraf, gabungkan
   semua `<w:t>` run jadi satu string (menghindari caveat run-splitting —
   lihat strategy doc §5/§7).

   Untuk memangkas jumlah candidate yang perlu direview user (GOKP template
   punya ~650 paragraf mentah):
   - Group "body" (paragraf di bawah Heading 1) DIKECUALIKAN — sudah jadi
     tanggung jawab Methodology 1 (`aiSections`), bukan scope Field Mapper.
   - Candidate dengan (group, text) yang SAMA di-dedupe jadi satu entry
     dengan daftar `ids` (semua occurrence) — supaya 1 klasifikasi berlaku
     untuk semua occurrence sekaligus (mis. nama client yang muncul di cover
     + header + footer).

2. `apply_field_mapping(file_path, mappings, output_path)`:
   Tulis ulang .docx (dari copy asli) — untuk setiap mapping dengan
   classification "data"/"ai", replace teks paragraf (full atau substring) di
   SEMUA `ids` pada mapping tersebut dengan tag Jinja2 (`{{ var }}` /
   `{% for %} ... {% endfor %}`). Replace dilakukan di run pertama paragraf,
   run lain dikosongkan — supaya tetap benar walau teks aslinya terpecah jadi
   beberapa run.
"""

import io
import zipfile
from pathlib import Path
from typing import Dict, List, Optional

from lxml import etree

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NSMAP = {"w": W_NS}

# Bagian .docx yang relevan untuk Field Mapper (cover/textbox ada di
# document.xml, header/footer per section di header*.xml/footer*.xml)
_RELEVANT_PART_PREFIXES = ("word/document.xml", "word/header", "word/footer")


def _is_relevant_part(name: str) -> bool:
    return name == "word/document.xml" or (
        name.startswith(("word/header", "word/footer")) and name.endswith(".xml")
    )


def _direct_t_elements(p_el) -> List:
    """<w:t> milik paragraf ini saja (bukan dari paragraf bersarang).

    `.//w:t` juga akan menangkap run dari paragraf bersarang (mis. di dalam
    `mc:AlternateContent` Choice/Fallback duplikat untuk satu text box) —
    setiap <w:t> dicek dulu, hanya diambil kalau <w:p> terdekatnya adalah
    p_el sendiri, supaya tidak duplikat/concat dengan teks paragraf anak.
    """
    result = []
    for t in p_el.findall(".//w:t", NSMAP):
        owner = t.getparent()
        while owner is not None and etree.QName(owner).localname != "p":
            owner = owner.getparent()
        if owner is p_el:
            result.append(t)
    return result


def _merged_text(p_el) -> str:
    """Gabungkan <w:t> milik paragraf ini jadi satu string."""
    return "".join(t.text or "" for t in _direct_t_elements(p_el))


def _classify_group(part: str, p_el) -> str:
    if part != "word/document.xml":
        return "header_footer"
    for ancestor in p_el.iterancestors():
        tag = etree.QName(ancestor).localname
        if tag == "txbxContent":
            return "cover"
        if tag == "tbl":
            return "table"
    return "body"


def _post_heading1_table_paragraphs(root) -> set:
    """Paragraf di dalam tabel yang muncul SETELAH Heading 1 pertama.

    Tabel semacam ini (mis. "Table III.1 Deliverables", roadmap tables) sudah
    jadi bagian body section — di luar scope Field Mapper sama seperti
    paragraf body biasa. Tabel SEBELUM Heading 1 pertama (Document Info,
    Project Info, Revision table) tetap masuk group "table".
    """
    body = root.find("w:body", NSMAP)
    if body is None:
        return set()
    excluded: set = set()
    seen_h1 = False
    for child in body:
        tag = etree.QName(child).localname
        if tag == "p":
            if _heading_level(child) == 1:
                seen_h1 = True
        elif tag == "tbl" and seen_h1:
            excluded.update(child.findall(".//w:p", NSMAP))
    return excluded


def _heading_level(p_el) -> Optional[int]:
    pPr = p_el.find("w:pPr", NSMAP)
    if pPr is None:
        return None
    pStyle = pPr.find("w:pStyle", NSMAP)
    if pStyle is None:
        return None
    val = pStyle.get(f"{{{W_NS}}}val", "")
    if val == "Heading1":
        return 1
    if val == "Heading2":
        return 2
    return None


def scan_template(file_path: str) -> List[dict]:
    """Scan candidate strings dari .docx (cover/header/footer/tabel — group
    "body" dikecualikan), dedupe by (group, text).

    Returns list of:
        {id, ids, group, text, headingLevel, occurrences}
        - id  = ids[0], dipakai sebagai React key di UI
        - ids = semua "<part>#<paragraphIndex>" dengan (group, text) sama
    """
    raw: List[dict] = []

    with zipfile.ZipFile(file_path, "r") as zin:
        for part in zin.namelist():
            if not _is_relevant_part(part):
                continue
            xml_bytes = zin.read(part)
            root = etree.fromstring(xml_bytes)

            excluded_table_paragraphs = (
                _post_heading1_table_paragraphs(root) if part == "word/document.xml" else set()
            )

            for idx, p_el in enumerate(root.findall(".//w:p", NSMAP)):
                if p_el in excluded_table_paragraphs:
                    continue
                text = _merged_text(p_el).strip()
                if not text:
                    continue
                group = _classify_group(part, p_el)
                if group == "body":
                    continue
                raw.append({
                    "id": f"{part}#{idx}",
                    "group": group,
                    "text": text,
                    "headingLevel": _heading_level(p_el),
                })

    deduped: Dict[tuple, dict] = {}
    for c in raw:
        key = (c["group"], c["text"])
        entry = deduped.setdefault(key, {
            "ids": [],
            "group": c["group"],
            "text": c["text"],
            "headingLevel": c["headingLevel"],
        })
        entry["ids"].append(c["id"])

    return [
        {"id": entry["ids"][0], "ids": entry["ids"], "group": entry["group"],
         "text": entry["text"], "headingLevel": entry["headingLevel"],
         "occurrences": len(entry["ids"])}
        for entry in deduped.values()
    ]


def apply_field_mapping(file_path: str, mappings: List[dict], output_path: str) -> None:
    """Tulis ulang .docx (copy dari file_path) dengan tag Jinja2 sesuai mapping.

    mappings: list of
        {
          "ids": ["word/document.xml#12", "word/header2.xml#1", ...],  # "<part>#<paragraphIndex>"
          "classification": "static" | "data" | "ai",
          "search": Optional[str],        # substring yang diganti (None = full paragraph)
          "jinjaTag": str,                 # mis. "{{ client_name }}"
        }

    Mapping dengan classification "static" diabaikan. Semua occurrence di
    `ids` (lintas part) diganti dengan tag/search yang sama.
    """
    by_part: Dict[str, Dict[int, dict]] = {}
    for m in mappings:
        if m.get("classification") == "static":
            continue
        for ref in m["ids"]:
            part, idx_str = ref.rsplit("#", 1)
            by_part.setdefault(part, {})[int(idx_str)] = m

    with zipfile.ZipFile(file_path, "r") as zin:
        names = zin.namelist()
        contents = {name: zin.read(name) for name in names}

    for part, idx_map in by_part.items():
        if part not in contents:
            continue
        root = etree.fromstring(contents[part])

        for idx, p_el in enumerate(root.findall(".//w:p", NSMAP)):
            mapping = idx_map.get(idx)
            if mapping is None:
                continue

            t_els = _direct_t_elements(p_el)
            if not t_els:
                continue

            original = _merged_text(p_el)
            search = mapping.get("search")
            jinja_tag = mapping["jinjaTag"]
            new_text = original.replace(search, jinja_tag) if search else jinja_tag

            t_els[0].text = new_text
            t_els[0].set(f"{{{'http://www.w3.org/XML/1998/namespace'}}}space", "preserve")
            for t_el in t_els[1:]:
                t_el.text = ""

        contents[part] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, data in contents.items():
            zout.writestr(name, data)
