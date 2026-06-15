"use client";

import KanbanColumn from "@/components/ui/kanban/KanbanColumn";
import KanbanCardShell from "@/components/ui/kanban/KanbanCardShell";
import LeadKanbanCard from "@/components/projects/leads/LeadKanbanCard";
import { LEAD_STATUS_LABELS } from "@/lib/projectStatus";
import { TONE_CLASSES, LEAD_STATUS_TONE } from "@/lib/kanbanTones";

export default function LeadKanbanColumn({
  status,
  cards,
  searchText,
  onStatusChange,
  onDragOver,
  onDrop,
  isDragOver,
}) {
  const label = LEAD_STATUS_LABELS[status] ?? status;
  const toneClass = TONE_CLASSES[LEAD_STATUS_TONE[status] ?? "slate"];

  return (
    <KanbanColumn
      label={label}
      cards={cards}
      dotClassName={`bg-current ${toneClass}`}
      labelClassName={toneClass}
      isDragOver={isDragOver}
      onDragOver={onDragOver}
      onDrop={onDrop}
      renderCard={(lead) => {
        const dimmed =
          searchText.trim() !== "" &&
          !lead.name?.toLowerCase().includes(searchText.toLowerCase()) &&
          !lead.client?.toLowerCase().includes(searchText.toLowerCase());

        return (
          <KanbanCardShell key={lead.id} id={lead.id} className="cursor-grab">
            {({ isDragging }) => (
              <LeadKanbanCard
                lead={lead}
                dimmed={dimmed}
                isDragging={isDragging}
                onStatusChange={onStatusChange}
              />
            )}
          </KanbanCardShell>
        );
      }}
    />
  );
}
