import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ScoreBadge from "@/components/tenders/ScoreBadge";
import StatusBadge from "@/components/tenders/StatusBadge";
import PromoteButton from "@/components/tenders/PromoteButton";
import { formatCurrency, formatDeadline, formatSource, isRecentlyScraped } from "@/lib/formatters";

const TABLE_HEADERS = ["Sumber", "Tender", "KBLI", "Skor", "Tenggat", "Status", "Aksi"];

export default function TenderTable({ data }) {
  if (data.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-foreground-muted">
        Belum ada tender yang cocok dengan filter ini.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            {TABLE_HEADERS.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((tender) => (
            <TenderRow key={tender.id} tender={tender} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TenderRow({ tender }) {
  const kbliMatches = tender.kbliMatchedJson ? JSON.parse(tender.kbliMatchedJson) : [];
  const deadline = formatDeadline(tender.deadlineDate);
  const isNew = isRecentlyScraped(tender.scrapedAt);

  return (
    <tr className={`border-b border-border last:border-0 hover:bg-surface-hover ${isNew ? "bg-accent/5" : ""}`}>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col items-start gap-1">
          <Badge className="bg-surface-hover text-foreground-muted">
            {formatSource(tender.source)}
          </Badge>
          {isNew && <Badge className="bg-accent/15 text-accent">Baru</Badge>}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <Link href={`/tenders/${tender.id}`} className="font-medium text-foreground hover:text-accent">
          {tender.title}
        </Link>
        {tender.agency && <p className="mt-0.5 text-foreground-muted">{tender.agency}</p>}
        {tender.budgetEstimated != null && (
          <p className="mt-0.5 text-xs text-foreground-subtle">{formatCurrency(tender.budgetEstimated)}</p>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {kbliMatches.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {kbliMatches.slice(0, 2).map((k, i) => (
              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-surface-hover text-foreground-subtle border border-border">
                {k.kbli_code}
              </span>
            ))}
            {kbliMatches.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-surface-hover text-foreground-subtle border border-border">
                +{kbliMatches.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-foreground-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} />
      </td>
      <td className={`px-4 py-3 align-top ${deadline.isUrgent ? "text-danger" : "text-foreground-muted"}`}>
        {deadline.label}
      </td>
      <td className="px-4 py-3 align-top">
        <StatusBadge status={tender.status} />
      </td>
      <td className="px-4 py-3 align-top">
        {tender.status === "DITEMUKAN" && <PromoteButton id={tender.id} />}
      </td>
    </tr>
  );
}
