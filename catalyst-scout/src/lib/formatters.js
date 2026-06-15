const MS_PER_DAY = 1000 * 60 * 60 * 24;

const SOURCE_LABELS = {
  civd: "CIVD",
  geodipa: "GeoDipa",
  gep: "GEP",
  lpse: "LPSE",
  manual: "Manual",
};

export const STATUS_LABELS = {
  DITEMUKAN: "Ditemukan",
  DITINJAU: "Ditinjau",
  DIKEJAR: "Dikejar",
  DISERAHKAN: "Diserahkan",
  MENANG: "Menang",
  KALAH: "Kalah",
  BATAL: "Batal",
};

export function formatCurrency(value) {
  if (value == null) return "—";
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export function formatDate(dateLike) {
  if (!dateLike) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateLike));
}

// Timestamp lengkap: "Senin, 15 Juni 2026 08:47" — dipakai untuk createdAt/updatedAt/scrapedAt dll
export function formatDateTime(dateLike) {
  if (!dateLike) return "—";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateLike));
  // Kapitalisasi nama hari (Intl id-ID return lowercase, mis. "senin, 15 Juni 2026 08.47")
  return (formatted.charAt(0).toUpperCase() + formatted.slice(1)).replace(/(\d{2})\.(\d{2})$/, "$1:$2");
}

export function formatDeadline(dateLike) {
  if (!dateLike) return { label: "—", isUrgent: false };

  const deadline = new Date(dateLike);
  const today = new Date();
  const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((deadlineDay - todayDay) / MS_PER_DAY);

  let label;
  if (diffDays < 0) label = "Lewat tenggat";
  else if (diffDays === 0) label = "Hari ini";
  else if (diffDays === 1) label = "Besok";
  else label = `${diffDays} hari lagi`;

  return { label, isUrgent: diffDays <= 7 };
}

export function formatSource(source) {
  if (!source) return "—";
  return SOURCE_LABELS[source.toLowerCase()] ?? source.toUpperCase();
}

const RECENT_SCRAPE_MINUTES = 15;

export function isRecentlyScraped(dateLike, minutes = RECENT_SCRAPE_MINUTES) {
  if (!dateLike) return false;
  const diffMs = Date.now() - new Date(dateLike).getTime();
  return diffMs >= 0 && diffMs <= minutes * 60 * 1000;
}

export function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
