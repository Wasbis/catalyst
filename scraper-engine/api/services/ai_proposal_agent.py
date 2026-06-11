import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

DEFAULT_PROPOSAL_SECTIONS: List[str] = [
    "BACKGROUND",
    "INTRODUCTION",
    "SUMMARY",
    "DURATION & COMMERCIAL",
    "PROPOSED SOLUTION",
    "METHODOLOGY",
]

# Per-section writing guidelines used in the Claude prompt.
# Use {company_name} as a format placeholder where needed.
_SECTION_GUIDELINES: Dict[str, str] = {
    "BACKGROUND": (
        "Context of the client's operational challenges or industry need that makes this project "
        "necessary. Reference the specific domain from the KBLI field."
    ),
    "INTRODUCTION": (
        "Brief introduction of {company_name} and how CRI's capabilities, experience, and expertise "
        "are directly relevant to this specific project."
    ),
    "SUMMARY": (
        "Concise summary of the proposal: scope of work, key deliverables, approach, and timeline. "
        "Use structured bullet points."
    ),
    "DURATION & COMMERCIAL": (
        "Project timeline breakdown by phase with estimated duration per phase. "
        "Include sub-sections for 'Work Duration & Schedule' and 'Terms & Conditions'. "
        "Do NOT include pricing — the pricing table is filled manually."
    ),
    "PROPOSED SOLUTION": (
        "Detailed description of the specific solution {company_name} proposes for this project: "
        "system architecture, key features, modules, or components that directly address the client's needs. "
        "Be specific to the tender — not generic. Include 2–3 sub-sections for major solution components."
    ),
    "METHODOLOGY": (
        "Detailed technical approach: specific phases, methods, tools, and deliverables. "
        "Explain step-by-step how {company_name} will execute this project. "
        "Include sub-sections for each major phase."
    ),
}


class AIProposalAgent:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self._client = None
        if api_key:
            try:
                import anthropic  # type: ignore[import-untyped]
                self._client = anthropic.Anthropic(api_key=api_key)
            except ImportError:
                logger.warning("[AIProposalAgent] anthropic package not installed, using template fallback")

    @property
    def generated_by(self) -> str:
        return "claude-haiku-4-5-20251001" if self._client else "template"

    def generate_proposal(
        self,
        tender_title: str,
        tender_text: str,
        kbli_code: str,
        kbli_description: str,
        company_name: str = "PT Cliste Rekayasa Indonesia",
        sections: Optional[List[str]] = None,
        user_requirements: Optional[str] = None,
    ) -> Dict[str, Any]:
        effective_sections = sections or DEFAULT_PROPOSAL_SECTIONS
        try:
            if self._client:
                return self._generate_with_claude(
                    tender_title, tender_text, kbli_code, kbli_description,
                    company_name, effective_sections, user_requirements,
                )
            logger.warning("[AIProposalAgent] ANTHROPIC_API_KEY tidak di-set, pakai template fallback")
            return self._generate_from_templates(
                tender_title, tender_text, kbli_code, kbli_description,
                company_name, effective_sections,
            )
        except Exception as e:
            logger.error(f"[AIProposalAgent] Error: {e}", exc_info=True)
            return {"status": "error", "error": str(e), "proposal_text": "", "blocks": []}

    # ------------------------------------------------------------------
    # Claude API generation
    # ------------------------------------------------------------------

    def _generate_with_claude(
        self,
        tender_title: str,
        tender_text: str,
        kbli_code: str,
        kbli_description: str,
        company_name: str,
        sections: List[str],
        user_requirements: Optional[str] = None,
    ) -> Dict[str, Any]:
        text_snippet = tender_text[:4000] if len(tender_text) > 4000 else tender_text

        # Build per-section guidelines, substituting {company_name} where needed
        section_guidelines = []
        for s in sections:
            guideline_tmpl = _SECTION_GUIDELINES.get(
                s,
                f"Professional content for the '{s}' section, specific to this tender.",
            )
            section_guidelines.append(
                f"- {s}: {guideline_tmpl.format(company_name=company_name)}"
            )

        # Schema: each block can have optional subsections (Heading 2 level)
        blocks_schema = json.dumps([
            {"title": s, "content": "...", "subsections": []} for s in sections
        ])

        prompt = f"""You are a professional technical consultant at {company_name} writing a formal proposal in English.

Generate a technical proposal for the following tender:

PROJECT TITLE: {tender_title}
FIELD (KBLI): {kbli_code} — {kbli_description}
COMPANY: {company_name}

TENDER REQUIREMENT:
{text_snippet}

Write content for these sections. Be specific to this tender — no generic filler.
Use formal consulting English: "CRI has developed...", "The objective of this phase is to...", "{company_name} proposes..."

Return ONLY valid JSON (no explanation, no code blocks), exact format:
{{
  "blocks": {blocks_schema}
}}

Rules:
- Replace every "..." in "content" with actual text (minimum 150 words per section).
- "subsections" is a list of {{"title": "Sub-heading", "content": "..."}} for Heading-2 level sub-sections.
  Leave "subsections" as [] for sections that don't need them (e.g. BACKGROUND, INTRODUCTION, SUMMARY).
  Include meaningful sub-sections for DURATION & COMMERCIAL, PROPOSED SOLUTION, METHODOLOGY.

Section guidelines:
{chr(10).join(section_guidelines)}"""

        if user_requirements:
            prompt += f"\n\nADDITIONAL USER REQUIREMENTS/CONSTRAINTS (YOU MUST STRICTLY FOLLOW THESE):\n{user_requirements}\n"

        message = self._client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        json_match = re.search(r"\{[\s\S]+\}", raw)
        if not json_match:
            raise ValueError(f"Claude response is not valid JSON: {raw[:300]}")

        blocks = json.loads(json_match.group())["blocks"]

        proposal_text = "\n\n".join(
            f"{'='*60}\n{b['title']}\n{'='*60}\n{b['content']}" for b in blocks
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
                "generated_by": "claude-haiku-4-5-20251001",
            },
        }

    # ------------------------------------------------------------------
    # Template fallback (ANTHROPIC_API_KEY not set)
    # ------------------------------------------------------------------

    def _generate_from_templates(
        self,
        tender_title: str,
        tender_text: str,
        kbli_code: str,
        kbli_description: str,
        company_name: str,
        sections: List[str],
    ) -> Dict[str, Any]:
        key_points = self._extract_key_points(tender_text)

        # Each generator returns (content, subsections_list)
        generators = {
            "BACKGROUND":            lambda: (self._tmpl_background(tender_title, kbli_description, company_name), []),
            "INTRODUCTION":          lambda: (self._tmpl_introduction(tender_title, kbli_description, company_name), []),
            "SUMMARY":               lambda: (self._tmpl_summary(key_points, kbli_code), []),
            "DURATION & COMMERCIAL": lambda: (self._tmpl_duration_overview(key_points), self._tmpl_duration_subsections(key_points)),
            "PROPOSED SOLUTION":     lambda: (self._tmpl_proposed_solution_overview(kbli_description, company_name), self._tmpl_proposed_solution_subsections(kbli_description)),
            "METHODOLOGY":           lambda: (self._tmpl_methodology_overview(key_points, kbli_code), self._tmpl_methodology_subsections()),
        }

        blocks = []
        for s in sections:
            gen = generators.get(s)
            if gen:
                content, subsections = gen()
            else:
                content, subsections = f"[Content for {s} — please fill in manually.]", []
            blocks.append({"title": s, "content": content, "subsections": subsections})

        proposal_text = "\n\n".join(
            f"{'='*60}\n{b['title']}\n{'='*60}\n{b['content']}" for b in blocks
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
                "generated_by": "template",
            },
        }

    # ------------------------------------------------------------------
    # Template content helpers (English, formal consulting style)
    # ------------------------------------------------------------------

    def _extract_key_points(self, text: str) -> Dict[str, Any]:
        scope_kw = ["work", "services", "development", "implementation", "maintenance",
                    "pekerjaan", "jasa", "layanan"]
        scope_sents = [s.strip() for s in text.split(".") if any(k in s.lower() for k in scope_kw)][:2]

        tl = re.search(r"(\d+\s+(?:days|weeks|months|years|hari|minggu|bulan|tahun))", text, re.I)
        budget = re.search(r"(Rp\.?\s*[\d.,]+(?:\s+(?:juta|miliar))?|USD\s*[\d.,]+)", text, re.I)

        return {
            "scope":    " ".join(scope_sents) or "Professional services as per tender requirements",
            "timeline": tl.group(1) if tl else "as per project requirements",
            "budget":   budget.group(1) if budget else "",
        }

    def _tmpl_background(self, tender_title: str, kbli_description: str, company_name: str) -> str:
        return (
            f"In today's rapidly evolving industrial landscape, organizations face increasing pressure "
            f"to optimize their operations through the strategic adoption of advanced technologies and "
            f"professional services. The need for {kbli_description.lower()} has become paramount for "
            f"companies seeking to maintain operational excellence and competitive advantage.\n\n"
            f"This proposal has been prepared by {company_name} in response to the tender for "
            f'"{tender_title}". CRI recognizes the critical importance of this initiative and presents '
            f"a comprehensive solution tailored to meet the specific requirements outlined in the "
            f"tender documentation."
        )

    def _tmpl_introduction(self, tender_title: str, kbli_description: str, company_name: str) -> str:
        return (
            f"PT Cliste Rekayasa Indonesia (CRI) is a professional consulting and engineering firm "
            f"with extensive experience in {kbli_description.lower()} and related technical services. "
            f"CRI has successfully delivered numerous projects of similar scope and complexity to "
            f"leading organizations across various industries in Indonesia and the region.\n\n"
            f'In response to the tender for "{tender_title}", CRI is pleased to present this technical '
            f"proposal. Our team of qualified professionals is fully committed to delivering high-quality "
            f"results that meet and exceed the client's expectations, within the agreed timeline and budget."
        )

    def _tmpl_summary(self, key_points: Dict[str, Any], kbli_code: str) -> str:
        scope = key_points["scope"]
        timeline = key_points["timeline"]
        return (
            f"This proposal covers the following key aspects:\n\n"
            f"• Scope of Work: {scope}\n"
            f"• Estimated Duration: {timeline}\n"
            f"• KBLI Classification: {kbli_code}\n"
            f"• Approach: Phased implementation with quality checkpoints at each milestone\n"
            f"• Deliverables: Comprehensive documentation, reports, and knowledge transfer\n\n"
            f"CRI will deploy a dedicated team of experienced professionals to ensure timely and "
            f"high-quality delivery of all project deliverables."
        )

    def _tmpl_duration_overview(self, key_points: Dict[str, Any]) -> str:
        tl = key_points["timeline"]
        return (
            f"The project duration is estimated at {tl}. The timeline will be influenced by the "
            f"specific needs of the client and will be finalized after project kickoff. "
            f"A detailed schedule including Gantt chart will be provided separately."
        )

    def _tmpl_duration_subsections(self, key_points: Dict[str, Any]) -> List[Dict[str, str]]:
        tl = key_points["timeline"]
        return [
            {
                "title": "Work Duration & Schedule",
                "content": (
                    f"Phase 1 — Kickoff & Requirements Gathering: 1–2 weeks\n"
                    f"Phase 2 — Execution: {tl}\n"
                    f"Phase 3 — Testing & Validation: 2 weeks\n"
                    f"Phase 4 — Handover & Support: 1 week\n\n"
                    f"Note: Final timeline confirmed after kickoff. "
                    f"Detailed schedule provided upon contract award."
                ),
            },
            {
                "title": "Terms & Conditions",
                "content": (
                    "Additional work not previously outlined will be defined via CRI's Change Order (CO) system. "
                    "The indicative schedule assumes all required information is made available to CRI in a timely manner. "
                    "The price includes Withholding Tax (PPh 23) and excludes Value Added Tax (PPN 11%)."
                ),
            },
        ]

    def _tmpl_proposed_solution_overview(self, kbli_description: str, company_name: str) -> str:
        return (
            f"{company_name} proposes a comprehensive solution for {kbli_description.lower()} "
            f"that addresses the client's specific operational needs. Our solution is built on "
            f"proven frameworks and customized to meet the requirements outlined in this tender."
        )

    def _tmpl_proposed_solution_subsections(self, kbli_description: str) -> List[Dict[str, str]]:
        return [
            {
                "title": "Solution Overview",
                "content": (
                    f"CRI's proposed solution for {kbli_description.lower()} encompasses a structured "
                    f"approach combining technical expertise, industry best practices, and a proven "
                    f"delivery methodology. The solution is designed to be scalable, maintainable, "
                    f"and aligned with the client's long-term operational goals."
                ),
            },
            {
                "title": "Key Features & Capabilities",
                "content": (
                    "The solution includes the following key capabilities:\n"
                    "• Compliance with applicable international standards and regulations\n"
                    "• Seamless integration with the client's existing systems and workflows\n"
                    "• Comprehensive documentation and knowledge transfer at each deliverable stage\n"
                    "• Quality assurance checkpoints throughout the project lifecycle"
                ),
            },
        ]

    def _tmpl_methodology_overview(self, key_points: Dict[str, Any], kbli_code: str) -> str:
        scope = key_points.get("scope", "project scope as specified in the tender")
        return (
            f"CRI's methodology for {scope} is based on international best practices and a "
            f"structured, phase-based approach that ensures quality delivery and transparent "
            f"communication with the client throughout the project (KBLI {kbli_code})."
        )

    def _tmpl_methodology_subsections(self) -> List[Dict[str, str]]:
        return [
            {
                "title": "Phase 1 — Planning & Kickoff",
                "content": (
                    "Comprehensive requirements gathering, stakeholder interviews, risk identification, "
                    "resource allocation, and project plan finalization in close collaboration with the client."
                ),
            },
            {
                "title": "Phase 2 — Execution",
                "content": (
                    "Systematic implementation following the agreed work plan. Regular quality control "
                    "checks and progress reports at each milestone. Client review sessions at key stages."
                ),
            },
            {
                "title": "Phase 3 — Testing & Validation",
                "content": (
                    "Independent review and validation of all deliverables against specified requirements. "
                    "User acceptance testing (UAT) incorporating client feedback at each stage."
                ),
            },
            {
                "title": "Phase 4 — Handover & Support",
                "content": (
                    "Complete knowledge transfer, documentation handover, and post-implementation support "
                    "to ensure the client's team can independently operate and maintain all deliverables."
                ),
            },
        ]
