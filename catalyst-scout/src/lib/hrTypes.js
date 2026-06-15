// HR Module (Fase 3) — docType fixed set per project-maker-roadmap
export const HR_DOC_TYPES = ["ktp", "bpjs", "ijazah", "kk", "npwp"];

export const HR_DOC_TYPE_LABELS = {
  ktp: "KTP",
  bpjs: "BPJS",
  ijazah: "Ijazah",
  kk: "KK",
  npwp: "NPWP",
};

export const HR_DOC_STATUS_LABELS = {
  valid: "Valid",
  expiring_soon: "Akan Expired",
  expired: "Expired",
  missing: "Belum Ada",
};

const EXPIRY_WARNING_DAYS = 30;

// Dokumen tanpa expiryDate (ijazah/kk/npwp) dianggap valid selamanya.
export function computeDocStatus(expiryDate) {
  if (!expiryDate) return "valid";

  const now = new Date();
  const expiry = new Date(expiryDate);
  const warningThreshold = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 86400000);

  if (expiry < now) return "expired";
  if (expiry <= warningThreshold) return "expiring_soon";
  return "valid";
}
