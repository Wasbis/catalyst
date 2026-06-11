import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ScoreBadge from "@/components/tenders/ScoreBadge";
import { formatCurrency, formatDate, formatDeadline, formatSource } from "@/lib/formatters";

function InfoRow({ label, children }) {
  return (
    <div className="flex gap-3 py-2 border-b border-border last:border-0">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-foreground-subtle uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <div className="flex-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function TenderDetailPanel({ tender }) {
  const kbliMatches = tender.kbliMatchedJson ? JSON.parse(tender.kbliMatchedJson) : [];
  const deadline = formatDeadline(tender.deadlineDate);

  return (
    <Card>
      {/* Header */}
      <div className="border-b border-border pb-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-base font-semibold text-foreground leading-snug">{tender.title}</h1>
          <ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} />
        </div>
        {tender.agency && (
          <p className="mt-1 text-sm text-foreground-muted">{tender.agency}</p>
        )}
      </div>

      {/* Info rows */}
      <div>
        <InfoRow label="Sumber">
          <Badge className="bg-surface-hover text-foreground-muted">{formatSource(tender.source)}</Badge>
        </InfoRow>

        <InfoRow label="Tenggat">
          <span className={deadline.isUrgent ? "text-danger font-medium" : ""}>
            {deadline.label}
            {tender.deadlineDate && (
              <span className="ml-1.5 text-foreground-subtle text-xs">
                ({formatDate(tender.deadlineDate)})
              </span>
            )}
          </span>
        </InfoRow>

        {tender.budgetEstimated != null && (
          <InfoRow label="Estimasi Anggaran">
            {formatCurrency(tender.budgetEstimated)}
          </InfoRow>
        )}

        {tender.url && (
          <InfoRow label="URL Sumber">
            <a
              href={tender.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline break-all text-xs"
            >
              {tender.url}
            </a>
          </InfoRow>
        )}

        <InfoRow label="Scraped">
          {formatDate(tender.scrapedAt)}
        </InfoRow>
      </div>

      {/* KBLI Matches */}
      {kbliMatches.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle mb-2">
            KBLI Match ({kbliMatches.length})
          </p>
          <div className="space-y-1.5">
            {kbliMatches.map((k, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-surface-hover px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-mono font-medium text-foreground">{k.kbli_code}</span>
                  {k.description && (
                    <span className="ml-2 text-foreground-muted">{k.description}</span>
                  )}
                </div>
                {k.score != null && (
                  <span className="ml-3 text-foreground-subtle flex-shrink-0">
                    {Math.round(k.score * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tender Text / Description */}
      {(tender.tenderText || tender.description) && (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle mb-2">
            Deskripsi / Requirement
          </p>
          <TenderTextBlock text={tender.tenderText || tender.description} />
        </div>
      )}
    </Card>
  );
}

function TenderTextBlock({ text }) {
  // Collapsible for long texts
  const MAX_LINES = 10;
  const lines = text.split("\n");
  const isLong = lines.length > MAX_LINES;

  return (
    <details className="group">
      <summary className={`text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap cursor-pointer list-none ${isLong ? "" : "pointer-events-none"}`}>
        {isLong
          ? lines.slice(0, MAX_LINES).join("\n") + "\n..."
          : text}
      </summary>
      {isLong && (
        <div className="mt-2 text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      )}
      {isLong && (
        <span className="mt-1 text-xs text-accent cursor-pointer group-open:hidden">
          Tampilkan selengkapnya
        </span>
      )}
    </details>
  );
}
