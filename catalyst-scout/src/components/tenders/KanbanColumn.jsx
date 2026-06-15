"use client";

import BaseKanbanColumn from "@/components/ui/kanban/KanbanColumn";
import KanbanCardShell from "@/components/ui/kanban/KanbanCardShell";
import KanbanCard from "@/components/tenders/KanbanCard";
import { STATUS_LABELS, formatCurrency } from "@/lib/formatters";

const STATUS_COLOR = {
  DITEMUKAN: "text-[var(--stage-ditemukan)]",
  DITINJAU: "text-[var(--stage-ditinjau)]",
  DIKEJAR: "text-[var(--stage-dikejar)]",
  DISERAHKAN: "text-[var(--stage-diserahkan)]",
  MENANG: "text-[var(--stage-menang)]",
  KALAH: "text-[var(--stage-kalah)]",
  BATAL: "text-[var(--stage-batal)]",
};

const DOT_COLOR = {
  DITEMUKAN: "bg-[var(--stage-ditemukan)]",
  DITINJAU: "bg-[var(--stage-ditinjau)]",
  DIKEJAR: "bg-[var(--stage-dikejar)]",
  DISERAHKAN: "bg-[var(--stage-diserahkan)]",
  MENANG: "bg-[var(--stage-menang)]",
  KALAH: "bg-[var(--stage-kalah)]",
  BATAL: "bg-[var(--stage-batal)]",
};

export default function KanbanColumn({
  status,
  cards,
  density,
  isCollapsed,
  onToggleCollapse,
  onStatusChange,
  onOpenDetail,
  searchText,
  onDragOver,
  onDrop,
  isDragOver,
}) {
  const label = STATUS_LABELS[status] ?? status;
  const colorClass = STATUS_COLOR[status] ?? "text-foreground-muted";
  const dotClass = DOT_COLOR[status] ?? "bg-foreground-muted";
  const totalValue = cards.reduce((s, t) => s + (t.budgetEstimated || 0), 0);

  return (
    <BaseKanbanColumn
      label={label}
      cards={cards}
      dotClassName={dotClass}
      labelClassName={colorClass}
      isDragOver={isDragOver}
      onDragOver={onDragOver}
      onDrop={onDrop}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      headerExtra={
        <div className="my-1.5 px-1 font-mono text-[11px] font-medium text-foreground-subtle">
          {totalValue ? formatCurrency(totalValue) : "—"}
        </div>
      }
      renderCard={(tender) => {
        const dimmed =
          searchText.trim() !== "" &&
          !tender.title?.toLowerCase().includes(searchText.toLowerCase()) &&
          !tender.agency?.toLowerCase().includes(searchText.toLowerCase());

        return (
          <KanbanCardShell key={tender.id} id={tender.id}>
            {({ isDragging }) => (
              <KanbanCard
                tender={tender}
                density={density}
                dimmed={dimmed}
                isDragging={isDragging}
                onStatusChange={onStatusChange}
                onOpenDetail={onOpenDetail}
              />
            )}
          </KanbanCardShell>
        );
      }}
    />
  );
}
