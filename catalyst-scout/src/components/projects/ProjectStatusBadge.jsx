import Badge from "@/components/ui/Badge";
import { PROJECT_STATUS_LABELS } from "@/lib/projectStatus";

const STATUS_CLASSES = {
  Approval: "bg-stage-project-approval/10 text-stage-project-approval",
  KickOff: "bg-stage-project-kickoff/10 text-stage-project-kickoff",
  POSOIssued: "bg-stage-project-posoissued/10 text-stage-project-posoissued",
  Pelaksanaan: "bg-stage-project-pelaksanaan/10 text-stage-project-pelaksanaan",
  Invoicing: "bg-stage-project-invoicing/10 text-stage-project-invoicing",
  Closed: "bg-stage-project-closed/10 text-stage-project-closed",
};

export default function ProjectStatusBadge({ status }) {
  return (
    <Badge className={STATUS_CLASSES[status] ?? "bg-surface-hover text-foreground-subtle"}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
