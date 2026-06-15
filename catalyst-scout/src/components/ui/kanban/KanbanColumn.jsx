"use client";

import { ChevronLeft } from "lucide-react";

export default function KanbanColumn({
  cards,
  label,
  dotClassName = "bg-foreground-muted",
  labelClassName = "text-foreground-muted",
  isDragOver,
  onDragOver,
  onDrop,
  isCollapsed = false,
  onToggleCollapse,
  headerExtra,
  renderCard,
  emptyText = "Tarik kartu ke sini",
}) {
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        title={`Buka kolom ${label}`}
        className="flex w-11 shrink-0 flex-col items-center gap-2.5 rounded-xl border border-border bg-surface py-3 cursor-pointer transition-colors duration-120 ease-out hover:bg-surface-hover"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClassName}`} />
        <span className={`rotate-180 text-[11px] font-medium tracking-wide [writing-mode:vertical-rl] ${labelClassName}`}>
          {label}
        </span>
        <span className="rounded-full border border-border bg-elevated px-2 py-px text-[10px] text-foreground-muted [writing-mode:horizontal-tb]">
          {cards.length}
        </span>
      </button>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex min-h-0 min-w-70 max-w-[320px] flex-none flex-col rounded-xl border p-2 transition-colors duration-150 ${
        isDragOver ? "border-dashed border-accent/30 bg-elevated" : "border-border bg-surface"
      }`}
    >
      <div className="flex h-10 items-center gap-2 border-b border-border px-1 pb-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClassName}`} />
        <span className={`flex-1 text-[13px] font-medium ${labelClassName}`}>{label}</span>
        <span className="rounded-full border border-border bg-elevated px-2 py-px text-[10px] text-foreground-muted">
          {cards.length}
        </span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Lipat kolom"
            className="flex h-5.5 w-5.5 items-center justify-center rounded text-foreground-muted hover:bg-surface-hover hover:text-foreground cursor-pointer transition-colors duration-120 ease-out"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
        )}
      </div>

      {headerExtra}

      <div className={`flex flex-1 min-h-0 flex-col gap-1.5 overflow-y-auto px-0.5 ${headerExtra ? "" : "pt-1.5"}`}>
        {cards.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border py-6 text-center text-xs text-foreground-subtle">
            {emptyText}
          </div>
        ) : (
          cards.map((card) => renderCard(card))
        )}
      </div>
    </div>
  );
}
