import Badge from "@/components/ui/Badge";

const RECOMMENDATION_CLASSES = {
  KEJAR: "bg-score-high/10 text-score-high",
  TINJAU: "bg-score-mid/10 text-score-mid",
  LEWATI: "bg-score-low/10 text-score-low",
};

function recommendationFromScore(score) {
  if (score >= 70) return "KEJAR";
  if (score >= 40) return "TINJAU";
  return "LEWATI";
}

export default function ScoreBadge({ score, recommendation }) {
  if (score == null) {
    return <Badge className="bg-surface-hover text-foreground-subtle">—</Badge>;
  }

  const label = recommendation ?? recommendationFromScore(score);

  return (
    <Badge className={RECOMMENDATION_CLASSES[label] ?? "bg-surface-hover text-foreground-subtle"}>
      {score} · {label}
    </Badge>
  );
}
