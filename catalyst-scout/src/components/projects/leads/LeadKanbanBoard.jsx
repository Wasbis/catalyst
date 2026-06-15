"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { VALID_LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/projectStatus";
import { updateProjectLeadStatus } from "@/actions/projectActions";
import { useKanbanBoard, buildCardMap } from "@/components/ui/kanban/useKanbanBoard";
import SearchInput from "@/components/ui/SearchInput";
import FilterBar from "@/components/ui/FilterBar";
import LeadKanbanColumn from "@/components/projects/leads/LeadKanbanColumn";

export default function LeadKanbanBoard({ initialLeads, totalCount }) {
  const [search, setSearch] = useState("");
  const {
    items: leads,
    dragOverCol,
    handleStatusChange,
    handleDragOver,
    handleDrop,
    handleDragLeave,
  } = useKanbanBoard({
    initialItems: initialLeads,
    updateStatusAction: updateProjectLeadStatus,
    statusLabels: LEAD_STATUS_LABELS,
  });

  const cardMap = buildCardMap(leads, VALID_LEAD_STATUSES, "lead");

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <FilterBar className="mb-2.5">
        <SearchInput
          wrapperClassName="min-w-40 max-w-80 flex-1"
          placeholder="Cari nama lead atau client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          {totalCount != null && (
            <span className="whitespace-nowrap text-[12.5px] font-medium text-foreground-subtle">
              {totalCount} entri
            </span>
          )}
          <Link
            href="/projects/leads/new"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-medium text-white no-underline transition-all duration-120 ease-out hover:opacity-92 active:scale-[0.97] active:opacity-88"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Tambah Baru
          </Link>
        </div>
      </FilterBar>

      <div
        className="flex flex-1 min-h-0 gap-3.5 overflow-x-auto overflow-y-hidden pb-4"
        onDragLeave={handleDragLeave}
      >
        {VALID_LEAD_STATUSES.map((status) => (
          <LeadKanbanColumn
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
