"use client";

import { useState } from "react";
import { VALID_PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projectStatus";
import { updateProjectStatus } from "@/actions/projectActions";
import { useKanbanBoard, buildCardMap } from "@/components/ui/kanban/useKanbanBoard";
import SearchInput from "@/components/ui/SearchInput";
import FilterBar from "@/components/ui/FilterBar";
import ProjectKanbanColumn from "@/components/projects/ProjectKanbanColumn";
import { ProjectViewToggle, DirectAppointmentLink, ProjectCount } from "@/components/projects/ProjectToolbarControls";

export default function ProjectKanbanBoard({ initialProjects, currentView, searchParams, totalCount }) {
  const [search, setSearch] = useState("");
  const {
    items: projects,
    dragOverCol,
    handleStatusChange,
    handleDragOver,
    handleDrop,
    handleDragLeave,
  } = useKanbanBoard({
    initialItems: initialProjects,
    updateStatusAction: updateProjectStatus,
    statusLabels: PROJECT_STATUS_LABELS,
  });

  const cardMap = buildCardMap(projects, VALID_PROJECT_STATUSES, "Approval");

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <FilterBar className="mb-2.5">
        <ProjectViewToggle currentView={currentView} searchParams={searchParams} />
        <DirectAppointmentLink />

        <SearchInput
          wrapperClassName="min-w-40 max-w-80 flex-1"
          placeholder="Cari nama proyek atau client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="ml-auto shrink-0">
          <ProjectCount totalCount={totalCount} />
        </div>
      </FilterBar>

      <div
        className="flex flex-1 min-h-0 gap-3.5 overflow-x-auto overflow-y-hidden pb-4"
        onDragLeave={handleDragLeave}
      >
        {VALID_PROJECT_STATUSES.map((status) => (
          <ProjectKanbanColumn
            key={status}
            status={status}
            cards={cardMap[status]}
            searchText={search}
            onStatusChange={handleStatusChange}
            isDragOver={dragOverCol === status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
          />
        ))}
      </div>
    </div>
  );
}
