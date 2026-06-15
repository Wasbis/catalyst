"""
testing/field_mapper_llm_poc.py

POC: LLM-assisted classification untuk "Template Field Mapper" (Methodology 2).

Daripada user define classification + Jinja tag satu-per-satu untuk setiap
candidate dari `docx_field_mapper.scan_template()`, script ini kirim SEMUA
candidate (sudah di-mask via `MaskingService`) dalam SATU batch prompt ke
OpenAI, lalu minta LLM saranin per candidate:
  - classification: "static" | "data" | "ai"
  - jinjaTag       : nama variable Jinja2 (mis. "{{ client_legal_name }}")
  - fieldHint      : field DB yang relevan (kalau classification == "data")
  - reason         : alasan singkat (untuk user review)

Output (saran, bukan apply) disimpan ke
`testing/test_output_field_mapper_llm.json` untuk direview manual sebelum
dipakai prefill `FieldMapperEditor.jsx`.

Usage:
    python testing/field_mapper_llm_poc.py
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.models.database import SessionLocal
from api.services.docx_field_mapper import scan_template
from api.services.masking_services import MaskingService

SOURCE = (
    Path(__file__).resolve().parents[2]
    / "storage/proposal_templates/260310_CRI2602P100-Rev_00_Proposal_Excellence_CMMS_-_GOKP_(1).docx"
)
OUTPUT = Path(__file__).resolve().parent / "test_output_field_mapper_llm.json"

# Harga per 1M token (USD) — sesuaikan kalau model/pricing berubah.
_PRICING_PER_1M = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4o": {"input": 2.50, "output": 10.00},
}

# Field DB yang tersedia untuk classification="data" — lihat
# catalyst-scout/prisma/schema.prisma (Client, Employee, ProposalRevision,
# GeneratedDocument, Project).
AVAILABLE_DB_FIELDS = """
- client.name             : nama tampil client, mis. "GOKP"
- client.legalName        : nama legal lengkap, mis. "Genting Oil Kasuri PTE. LTD."
- client.shortName        : singkatan, mis. "GOKPL"
- client.address          : alamat client
- client.picName          : nama PIC client
- client.picTitle         : jabatan PIC client
- document.proposalReferenceNumber : nomor referensi proposal, mis. "CRI2603P100-Rev 00"
- document.classification : klasifikasi dokumen, mis. "Confidential"
- document.tenderTitle    : judul project/tender
- document.companyName    : nama perusahaan CRI
- employee.name           : nama pegawai (author/reviewer/approver dokumen)
- employee.position       : jabatan pegawai
- revisions[].revisionNumber / .date / .description / .author.name / .reviewedBy.name / .approvedBy.name
  : baris tabel revisi (loop {% for rev in revisions %})
- project.poSoNumber       : nomor PO/SO project
""".strip()


def build_prompt(masked_candidates: list[dict]) -> str:
    items = "\n".join(
        f'{i}. [{c["group"]}] "{c["text"]}" (occurrences={c["occurrences"]})'
        for i, c in enumerate(masked_candidates)
    )
    return f"""You are helping configure a "Field Mapper" for a Word proposal template.
For each numbered candidate text below (extracted from the template's cover,
header/footer, and info tables), decide:

1. "classification":
   - "static"  -> boilerplate text, identical for every client/project, leave unchanged.
   - "data"    -> should be replaced by a Jinja2 variable sourced from the database.
   - "ai"      -> should be replaced by a Jinja2 variable filled by an AI writer
                  (use only for free-text/narrative content, not short labels/values).
2. "jinjaTag": Jinja2 variable name to use, e.g. "{{{{ client_legal_name }}}}".
   Use "" for "static". Use snake_case variable names. For repeating table rows
   use loop syntax referencing "revisions" (e.g. "{{{{ rev.revisionNumber }}}}").
3. "fieldHint": for "data", which DB field from the list below it most likely maps to
   (or "" if uncertain / needs a new field not yet in the schema).
4. "description": ONE short sentence in Bahasa Indonesia describing WHAT this field
   represents in the document (not why you classified it), e.g. "Nama entitas klien",
   "Total durasi pengerjaan", "Nomor referensi proposal". For "static" text, briefly
   describe its role, e.g. "Judul proposal (boilerplate)".

Available DB fields:
{AVAILABLE_DB_FIELDS}

Candidates (some sensitive values are already masked as [PLACEHOLDER] — that's
intentional, classify based on the surrounding text/group, not the exact value):
{items}

Return ONLY a JSON array (no explanation, no markdown code block), one object
per candidate IN ORDER, exact format:
[{{"index": 0, "classification": "...", "jinjaTag": "...", "fieldHint": "...", "description": "..."}}, ...]"""


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Template not found: {SOURCE}")

    candidates = scan_template(str(SOURCE))
    print(f"scan_template: {len(candidates)} candidates")

    db = SessionLocal()
    try:
        masking = MaskingService.from_db(db)
    finally:
        db.close()

    masked_candidates = [
        {**c, "text": masking.mask_text(c["text"])} for c in candidates
    ]
    print(f"masking: {masking.stats}")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY tidak di-set di .env")

    import openai

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = openai.OpenAI(api_key=api_key)

    prompt = build_prompt(masked_candidates)

    response = client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    usage = response.usage
    pricing = _PRICING_PER_1M.get(model)
    cost_str = ""
    if pricing:
        cost = (
            usage.prompt_tokens * pricing["input"]
            + usage.completion_tokens * pricing["output"]
        ) / 1_000_000
        cost_str = f" (~${cost:.5f})"

    print(
        f"token usage: prompt={usage.prompt_tokens}, "
        f"completion={usage.completion_tokens}, "
        f"total={usage.total_tokens}{cost_str}"
    )

    raw = response.choices[0].message.content.strip()
    suggestions = json.loads(raw[raw.index("["): raw.rindex("]") + 1])

    results = []
    for c, s in zip(candidates, suggestions):
        # Unmask any placeholders that leaked into jinjaTag/reason (display only).
        results.append({
            "id": c["id"],
            "ids": c["ids"],
            "group": c["group"],
            "text": c["text"],
            "occurrences": c["occurrences"],
            "classification": s.get("classification", "static"),
            "jinjaTag": masking.unmask_text(s.get("jinjaTag", "")),
            "fieldHint": s.get("fieldHint", ""),
            "description": masking.unmask_text(s.get("description", "")),
        })

    OUTPUT.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"saved {len(results)} suggestions -> {OUTPUT}")

    for r in results:
        print(f"[{r['group']:<13}] {r['classification']:<6} {r['jinjaTag']:<30} "
              f"{r['description']:<40} {r['text'][:40]!r}")


if __name__ == "__main__":
    main()
