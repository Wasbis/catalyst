"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { VALID_LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/projectStatus";
import KanbanCardMenu from "@/components/ui/kanban/KanbanCardMenu";

export default function LeadKanbanCard({ lead, dimmed = false, isDragging = false, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      data-card-id={lead.id}
      className={`group relative cursor-pointer rounded-[10px] border border-border p-3 transition-[opacity,border-color] duration-120 ease-out hover:border-foreground-subtle/40 ${
        isDragging ? "opacity-40" : dimmed ? "opacity-35" : ""
      }`}
    >
      {/* Top row: title + menu */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          href={`/projects/leads/${lead.id}`}
          className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition-colors duration-120 ease-out group-hover:text-accent"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.name}
        </Link>

        <div className="relative shrink-0 opacity-0 transition-opacity duration-120 ease-out group-hover:opacity-100">
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
              detailHref={`/projects/leads/${lead.id}`}
              currentStatus={lead.status}
              statuses={VALID_LEAD_STATUSES}
              statusLabels={LEAD_STATUS_LABELS}
              onSelect={(s) => onStatusChange(lead.id, s)}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Client */}
      {lead.client && (
        <div className="mb-2 flex min-w-0 items-center gap-1.5 text-xs text-foreground-muted">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.client}</span>
        </div>
      )}

      {/* Footer */}
      {lead.estimatedValue != null && (
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground">
            {formatCurrency(lead.estimatedValue)}
          </span>
        </div>
      )}
    </div>
  );
}
