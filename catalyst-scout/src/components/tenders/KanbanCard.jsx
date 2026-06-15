"use client";

import { useState } from "react";
import { Building2, MessageSquare, Clock, MoreHorizontal } from "lucide-react";
import ScoreBadge from "@/components/tenders/ScoreBadge";
import { formatDeadline, formatCurrency, formatSource, isRecentlyScraped } from "@/lib/formatters";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { STATUS_LABELS } from "@/lib/formatters";
import KanbanCardMenu from "@/components/ui/kanban/KanbanCardMenu";

function countNotes(notesStr) {
  if (!notesStr) return 0;
  return notesStr.split("\n---\n").filter(Boolean).length;
}

const SOURCE_CHIP_CLASS = {
  civd: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  geodipa: "bg-success/15 text-success",
  manual: "bg-surface-hover text-foreground-muted",
};

export default function KanbanCard({ tender, density = "normal", onStatusChange, onOpenDetail, dimmed = false, isDragging = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deadline = formatDeadline(tender.deadlineDate);
  const notesCount = countNotes(tender.notes);
  const srcClass = SOURCE_CHIP_CLASS[tender.source?.toLowerCase()] ?? SOURCE_CHIP_CLASS.manual;
  const isNew = isRecentlyScraped(tender.scrapedAt);
  const kbliMatches = tender.kbliMatchedJson ? JSON.parse(tender.kbliMatchedJson) : [];

  return (
    <div
      data-card-id={tender.id}
      className={`group relative cursor-pointer rounded-[10px] border  p-3 transition-[opacity,border-color] duration-120 ease-out hover:border-foreground-subtle/40 ${
        isDragging ? "opacity-40" : dimmed ? "opacity-35" : ""
      } ${isNew ? "ring-1 ring-accent" : "border-border"}`}
      onClick={() => onOpenDetail?.(tender.id)}
    >
      {/* Top row: source chip + score */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-medium ${srcClass}`}>
            {formatSource(tender.source)}
          </span>
          {isNew && (
            <span className="rounded-[4px] bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-400 dark:text-accent-300">
              Baru
            </span>
          )}
        </div>

        {/* Menu */}
        <div className="relative opacity-0 transition-opacity duration-120 ease-out group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="flex h-5 w-5 items-center justify-center rounded text-foreground-muted hover:bg-surface-hover hover:text-foreground cursor-pointer"
            aria-label="Menu kartu"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <KanbanCardMenu
              detailHref={`/tenders/${tender.id}`}
              currentStatus={tender.status}
              statuses={VALID_TENDER_STATUSES}
              statusLabels={STATUS_LABELS}
              onSelect={(s) => onStatusChange(tender.id, s)}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Title */}
      <p className="mb-2 line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition-colors duration-120 ease-out group-hover:text-accent">
        {tender.title}
      </p>

      {/* Agency */}
      {tender.agency && density !== "compact" && (
        <div className="mb-2 flex min-w-0 items-center gap-1.5 text-xs text-foreground-muted">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{tender.agency}</span>
        </div>
      )}

      {/* KBLI Match */}
      {kbliMatches.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {kbliMatches.slice(0, 2).map((k, i) => (
            <span key={i} className="rounded-[4px] border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground-subtle">
              {k.kbli_code}
            </span>
          ))}
          {kbliMatches.length > 2 && (
            <span className="rounded-[4px] border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground-subtle">
              +{kbliMatches.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} />
          {tender.budgetEstimated != null && (
            <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground">
              {formatCurrency(tender.budgetEstimated)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          {notesCount > 0 ? (
            <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] text-foreground-muted">
              <MessageSquare className="h-3 w-3" />
              {notesCount}
            </span>
          ) : <span />}

          {tender.deadlineDate && (
            <span className={`inline-flex min-w-0 items-center gap-1 truncate text-[11px] ${deadline.isUrgent ? "text-danger" : "text-foreground-subtle"}`}>
              <Clock className="h-3 w-3" />
              {deadline.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
