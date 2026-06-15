import { HR_DOC_TYPE_LABELS, HR_DOC_STATUS_LABELS } from "@/lib/hrTypes";
import Badge from "@/components/ui/Badge";

const STATUS_VARIANT = {
  valid: "active",
  expiring_soon: "tinjau",
  expired: "lewati",
  missing: "neutral",
};

export default function EmployeeDocumentBadge({ docType, status }) {
  const label = HR_DOC_TYPE_LABELS[docType] ?? docType;
  const statusLabel = HR_DOC_STATUS_LABELS[status] ?? status;

  return (
    <Badge variant={STATUS_VARIANT[status] ?? "neutral"} size="sm" title={`${label}: ${statusLabel}`}>
      {label}
    </Badge>
  );
}
