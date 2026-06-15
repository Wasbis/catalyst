// Document Management Hub (Fase 2) — entityType bukan enum Prisma (polymorphic),
// validasi terhadap whitelist ini di server action supaya gampang nambah entity baru
// tanpa migration.
export const VALID_DOCUMENT_ENTITY_TYPES = [
  "TenderResult",
  "Project",
  "ProjectPhase",
  "ProjectChecklistItem",
  "ProjectLead",
];

export const DOCUMENT_ENTITY_TYPE_LABELS = {
  TenderResult: "Tender",
  Project: "Project",
  ProjectPhase: "Fase Project",
  ProjectChecklistItem: "Checklist Project",
  ProjectLead: "Lead",
};

export const DOCUMENT_CATEGORY_GROUPS = ["teknis", "komersial", "legal", "hr"];

export const DOCUMENT_CATEGORY_GROUP_LABELS = {
  teknis: "Teknis",
  komersial: "Komersial",
  legal: "Legal",
  hr: "HR",
};

// Fase 6 — Document Generator / Template Engine. `documentType` di sini adalah
// kolom DocumentTemplate.documentType / GeneratedDocument.documentType (scraper-engine,
// snake_case). Lihat document-templates/*.md untuk dissection struktur per type.
export const GENERATED_DOCUMENT_TYPES = [
  "proposal",
  "surat_kerja",
  "bast",
  "invoice",
  "kontrak",
  "laporan_ctr",
];

export const GENERATED_DOCUMENT_TYPE_LABELS = {
  proposal: "Proposal",
  surat_kerja: "Surat Kerja",
  bast: "BAST",
  invoice: "Invoice",
  kontrak: "Kontrak",
  laporan_ctr: "Laporan CTR",
};

// Bangun entity_data (flat dict, key snake_case -> jadi placeholder {{KEY_UPPER}}
// di docx_generator) dari Project (+ ProjectPhase kalau ada). Dipakai
// ChecklistPanel saat trigger generateDocument.
export function buildEntityData(project, phase = null) {
  const data = {
    project_name: project.name,
    client_name: project.client,
    po_so_number: project.poSoNumber ?? "",
    po_so_date: project.poSoDate ? new Date(project.poSoDate).toLocaleDateString("id-ID") : "",
    project_status: project.status,
  };

  if (phase) {
    data.phase_label = phase.label;
    data.phase_start_date = phase.startDate ? new Date(phase.startDate).toLocaleDateString("id-ID") : "";
    data.phase_end_date = phase.endDate ? new Date(phase.endDate).toLocaleDateString("id-ID") : "";
    data.disbursement_amount = phase.disbursementAmount != null ? String(phase.disbursementAmount) : "";
    data.disbursement_status = phase.disbursementStatus ?? "";
  }

  return data;
}

// Mapping ProjectChecklistItem.label (bebas teks dari user) -> documentType
// generator. Dicocokkan case-insensitive di ChecklistPanel — kalau label tidak
// match salah satu key di sini, tombol "Generate Document" tidak ditampilkan.
export const CHECKLIST_LABEL_TO_DOCUMENT_TYPE = {
  "surat kerja": "surat_kerja",
  "bast": "bast",
  "invoice": "invoice",
  "kontrak": "kontrak",
  "laporan ctr": "laporan_ctr",
  "proposal": "proposal",
};
