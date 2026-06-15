"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Building2 } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { VALID_PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projectStatus";
import KanbanCardMenu from "@/components/ui/kanban/KanbanCardMenu";

const SOURCE_TYPE_LABELS = {
  tender: "Tender",
  non_tender: "Non-Tender",
};

const SOURCE_TYPE_CHIP_CLASS = {
  tender: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  non_tender: "bg-surface-hover text-foreground-muted",
};

export default function ProjectKanbanCard({ project, dimmed = false, isDragging = false, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const srcClass = SOURCE_TYPE_CHIP_CLASS[project.sourceType] ?? SOURCE_TYPE_CHIP_CLASS.non_tender;

  return (
    <div
      data-card-id={project.id}
      className={`group relative cursor-pointer rounded-[10px] border border-border p-3 transition-[opacity,border-color] duration-120 ease-out hover:border-foreground-subtle/40 ${
        isDragging ? "opacity-40" : dimmed ? "opacity-35" : ""
      }`}
    >
      {/* Top row: source chip + menu */}
      <div className="mb-2 flex items-center justify-between">
        <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium ${srcClass}`}>
          {SOURCE_TYPE_LABELS[project.sourceType] ?? project.sourceType}
        </span>

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
              detailHref={`/projects/${project.id}`}
              currentStatus={project.status}
              statuses={VALID_PROJECT_STATUSES}
              statusLabels={PROJECT_STATUS_LABELS}
              onSelect={(s) => onStatusChange(project.id, s)}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Title */}
      <Link
        href={`/projects/${project.id}`}
        className="mb-2 line-clamp-2 block text-[13px] font-medium leading-snug text-foreground transition-colors duration-120 ease-out group-hover:text-accent"
        onClick={(e) => e.stopPropagation()}
      >
        {project.name}
      </Link>

      {/* Client */}
      {project.client && (
        <div className="mb-2 flex min-w-0 items-center gap-1.5 text-xs text-foreground-muted">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{project.client}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
        {project.poSoNumber ? (
          <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground">
            {project.poSoNumber}
          </span>
        ) : <span />}

        <span className="min-w-0 truncate text-[11px] text-foreground-subtle">
          {formatDateTime(project.createdAt)}
        </span>
      </div>
    </div>
  );
}
