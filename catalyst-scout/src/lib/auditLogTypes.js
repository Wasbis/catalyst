export const ENTITY_TYPE_LABELS = {
  Project: "Project",
  ProjectLead: "Direct Appointment",
  ProjectPhase: "Fase Project",
  ProjectChecklistItem: "Checklist Project",
  DocumentRecord: "Dokumen",
  DocumentCategory: "Kategori Dokumen",
  Employee: "Karyawan",
  EmployeeDocument: "Dokumen Karyawan",
};

export const ACTION_LABELS = {
  create: "Dibuat",
  update: "Diperbarui",
  delete: "Dihapus",
  status_change: "Ubah Status",
};

export const ACTION_BADGE_VARIANT = {
  create: "active",
  update: "neutral",
  status_change: "tinjau",
  delete: "lewati",
};

export function getEntityLink(entityType, entityId, metadata) {
  switch (entityType) {
    case "Project":
      return `/projects/${entityId}`;
    case "ProjectLead":
      return `/projects/leads/${entityId}`;
    case "ProjectPhase":
    case "ProjectChecklistItem":
      return metadata?.projectId ? `/projects/${metadata.projectId}` : null;
    case "Employee":
      return `/hr/${entityId}`;
    case "EmployeeDocument":
      return metadata?.employeeId ? `/hr/${metadata.employeeId}` : null;
    case "DocumentRecord":
      return "/documents";
    case "DocumentCategory":
      return "/settings/document-categories";
    default:
      return null;
  }
}
