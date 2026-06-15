"use client";

import { useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import ScoreBadge from "@/components/tenders/ScoreBadge";
import StatusBadge from "@/components/tenders/StatusBadge";
import PromoteButton from "@/components/tenders/PromoteButton";
import TenderDetailDrawer from "@/components/tenders/TenderDetailDrawer";
import { formatCurrency, formatDeadline, formatSource, isRecentlyScraped } from "@/lib/formatters";

const THEAD_CLASS = "border-b border-border bg-surface-hover text-[11px] font-medium uppercase tracking-[0.06em] text-foreground-subtle";

const COLUMNS = [
  {
    key: "source",
    header: "Sumber",
    render: (tender) => {
      const isNew = isRecentlyScraped(tender.scrapedAt);
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge className="bg-surface-hover text-foreground-muted">{formatSource(tender.source)}</Badge>
          {isNew && <Badge className="bg-accent/15 text-accent">Baru</Badge>}
        </div>
      );
    },
  },
  {
    key: "tender",
    header: "Tender",
    render: (tender) => (
      <>
        <p className="font-medium text-foreground line-clamp-1 max-w-[320px]">{tender.title}</p>
        {tender.agency && <p className="mt-0.5 text-foreground-muted">{tender.agency}</p>}
        {tender.budgetEstimated != null && (
          <p className="mt-0.5 text-xs text-foreground-subtle">{formatCurrency(tender.budgetEstimated)}</p>
        )}
      </>
    ),
  },
  {
    key: "kbli",
    header: "KBLI",
    render: (tender) => {
      const kbliMatches = tender.kbliMatchedJson ? JSON.parse(tender.kbliMatchedJson) : [];
      if (kbliMatches.length === 0) return <span className="text-foreground-muted">—</span>;
      return (
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
      );
    },
  },
  {
    key: "score",
    header: "Skor",
    render: (tender) => <ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} />,
  },
  {
    key: "deadline",
    header: "Tenggat",
    cellClassName: "px-4 py-3 align-top",
    render: (tender) => {
      const deadline = formatDeadline(tender.deadlineDate);
      return (
        <span className={`inline-flex items-center gap-1.5 ${deadline.isUrgent ? "text-danger" : "text-foreground-muted"}`}>
          <Clock className="h-3.5 w-3.5" />
          {deadline.label}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    render: (tender) => <StatusBadge status={tender.status} />,
  },
  {
    key: "actions",
    header: "Aksi",
    render: (tender) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {tender.status === "DITEMUKAN" && <PromoteButton id={tender.id} />}
        <ChevronRight className="h-4 w-4 text-foreground-subtle" />
      </div>
    ),
  },
];

export default function TenderTable({ data }) {
  const [selectedTenderId, setSelectedTenderId] = useState(null);
  const [selectedTender, setSelectedTender] = useState(null);

  if (data.length === 0) {
    return <EmptyState title="Belum ada tender yang cocok dengan filter ini." />;
  }

  function handleOpenDetail(tender) {
    setSelectedTender(tender);
    setSelectedTenderId(tender.id);
  }

  return (
    <>
      <Table
        columns={COLUMNS}
        data={data}
        sticky
        theadClassName={THEAD_CLASS}
        getRowProps={(tender) => ({
          className: `cursor-pointer ${isRecentlyScraped(tender.scrapedAt) ? "bg-accent/5" : ""}`,
          onClick: () => handleOpenDetail(tender),
        })}
      />

      <TenderDetailDrawer
        tenderId={selectedTenderId}
        initialData={selectedTender}
        onClose={() => setSelectedTenderId(null)}
      />
    </>
  );
}
