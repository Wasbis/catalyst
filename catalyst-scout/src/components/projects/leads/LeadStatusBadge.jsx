import Badge from "@/components/ui/Badge";
import { LEAD_STATUS_LABELS } from "@/lib/projectStatus";

const STATUS_CLASSES = {
  lead: "bg-stage-lead-lead/10 text-stage-lead-lead",
  proposal: "bg-stage-lead-proposal/10 text-stage-lead-proposal",
  quotation: "bg-stage-lead-quotation/10 text-stage-lead-quotation",
  converted: "bg-stage-lead-converted/10 text-stage-lead-converted",
  cancelled: "bg-stage-lead-cancelled/10 text-stage-lead-cancelled",
};

export default function LeadStatusBadge({ status }) {
  return (
    <Badge className={STATUS_CLASSES[status] ?? "bg-surface-hover text-foreground-subtle"}>
      {LEAD_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
