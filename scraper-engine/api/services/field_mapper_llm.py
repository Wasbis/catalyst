"""
api/services/field_mapper_llm.py

LLM-assisted classification untuk "Template Field Mapper" (Methodology 2) —
lihat document-templates/proposal-generator-strategy-v2.md §5 dan POC di
testing/field_mapper_llm_poc.py.

`suggest_field_mapping(candidates, db)`:
  1. Mask setiap candidate text via `MaskingService.from_db(db)` sebelum
     dikirim ke LLM (wajib — data sensitif tidak boleh keluar mentah).
  2. Satu batch prompt ke OpenAI berisi semua candidate + daftar field DB
     yang tersedia → LLM saranin per candidate: classification, jinjaTag,
     fieldHint, description (Bahasa Indonesia).
  3. Unmask placeholder yang leak ke jinjaTag/description, return suggestion
     list + token usage.

Hasil ini cuma SARAN — user tetap review/edit di `FieldMapperEditor.jsx`
sebelum "Apply".
"""

import json
import logging
import os
from typing import Dict, List

from sqlalchemy.orm import Session

from api.services.masking_services import MaskingService

logger = logging.getLogger(__name__)

# Harga per 1M token (USD) — untuk estimasi cost di response.
_PRICING_PER_1M = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4o": {"input": 2.50, "output": 10.00},
}

# Field DB yang tersedia untuk classification="data" — lihat
# catalyst-scout/prisma/schema.prisma (Client, Employee, ProposalRevision,
# GeneratedDocument, Project).
_AVAILABLE_DB_FIELDS = """
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


def _build_prompt(masked_candidates: List[dict]) -> str:
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
{_AVAILABLE_DB_FIELDS}

Candidates (some sensitive values are already masked as [PLACEHOLDER] — that's
intentional, classify based on the surrounding text/group, not the exact value):
{items}

Return ONLY a JSON array (no explanation, no markdown code block), one object
per candidate IN ORDER, exact format:
[{{"index": 0, "classification": "...", "jinjaTag": "...", "fieldHint": "...", "description": "..."}}, ...]"""


def suggest_field_mapping(candidates: List[dict], db: Session) -> Dict:
    """Return `{"suggestions": [...], "usage": {...}}` atau raise kalau
    OPENAI_API_KEY tidak di-set / response invalid.

    `suggestions[i]` berkorespondensi 1:1 dengan `candidates[i]` (urutan
    sama), berisi `id`, `ids`, `classification`, `jinjaTag`, `fieldHint`,
    `description`.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY tidak di-set.")

    masking = MaskingService.from_db(db)
    masked_candidates = [{**c, "text": masking.mask_text(c["text"])} for c in candidates]

    import openai

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = openai.OpenAI(api_key=api_key)

    prompt = _build_prompt(masked_candidates)
    response = client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.choices[0].message.content.strip()
    parsed = json.loads(raw[raw.index("["): raw.rindex("]") + 1])

    suggestions = []
    for c, s in zip(candidates, parsed):
        suggestions.append({
            "id": c["id"],
            "ids": c["ids"],
            "classification": s.get("classification", "static"),
            "jinjaTag": masking.unmask_text(s.get("jinjaTag", "")),
            "fieldHint": s.get("fieldHint", ""),
            "description": masking.unmask_text(s.get("description", "")),
        })

    usage = response.usage
    pricing = _PRICING_PER_1M.get(model)
    cost_usd = None
    if pricing:
        cost_usd = (
            usage.prompt_tokens * pricing["input"]
            + usage.completion_tokens * pricing["output"]
        ) / 1_000_000

    return {
        "suggestions": suggestions,
        "usage": {
            "model": model,
            "prompt_tokens": usage.prompt_tokens,
            "completion_tokens": usage.completion_tokens,
            "total_tokens": usage.total_tokens,
            "estimated_cost_usd": cost_usd,
        },
    }
