import Badge from "@/components/ui/Badge";
import { STATUS_LABELS } from "@/lib/formatters";

const STATUS_CLASSES = {
  DITEMUKAN: "bg-stage-ditemukan/10 text-stage-ditemukan",
  DITINJAU: "bg-stage-ditinjau/10 text-stage-ditinjau",
  DIKEJAR: "bg-stage-dikejar/10 text-stage-dikejar",
  DISERAHKAN: "bg-stage-diserahkan/10 text-stage-diserahkan",
  MENANG: "bg-stage-menang/10 text-stage-menang",
  KALAH: "bg-stage-kalah/10 text-stage-kalah",
  BATAL: "bg-stage-batal/10 text-stage-batal",
};

export default function StatusBadge({ status }) {
  return (
    <Badge className={STATUS_CLASSES[status] ?? "bg-surface-hover text-foreground-subtle"}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
