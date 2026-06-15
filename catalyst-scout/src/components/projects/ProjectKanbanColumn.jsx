"use client";

import KanbanColumn from "@/components/ui/kanban/KanbanColumn";
import KanbanCardShell from "@/components/ui/kanban/KanbanCardShell";
import ProjectKanbanCard from "@/components/projects/ProjectKanbanCard";
import { PROJECT_STATUS_LABELS } from "@/lib/projectStatus";
import { TONE_CLASSES, PROJECT_STATUS_TONE } from "@/lib/kanbanTones";

export default function ProjectKanbanColumn({
  status,
  cards,
  searchText,
  onStatusChange,
  onDragOver,
  onDrop,
  isDragOver,
}) {
  const label = PROJECT_STATUS_LABELS[status] ?? status;
  const toneClass = TONE_CLASSES[PROJECT_STATUS_TONE[status] ?? "slate"];

  return (
    <KanbanColumn
      label={label}
      cards={cards}
      dotClassName={`bg-current ${toneClass}`}
      labelClassName={toneClass}
      isDragOver={isDragOver}
      onDragOver={onDragOver}
      onDrop={onDrop}
      renderCard={(project) => {
        const dimmed =
          searchText.trim() !== "" &&
          !project.name?.toLowerCase().includes(searchText.toLowerCase()) &&
          !project.client?.toLowerCase().includes(searchText.toLowerCase());

        return (
          <KanbanCardShell key={project.id} id={project.id} className="cursor-grab">
            {({ isDragging }) => (
              <ProjectKanbanCard
                project={project}
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
