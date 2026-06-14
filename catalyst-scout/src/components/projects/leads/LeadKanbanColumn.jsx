"use client";

import { useState } from "react";
import LeadKanbanCard from "@/components/projects/leads/LeadKanbanCard";
import { LEAD_STATUS_LABELS } from "@/lib/projectStatus";

const STATUS_TONE = {
  lead: "slate",
  proposal: "blue",
  quotation: "amber",
  converted: "green",
  cancelled: "zinc",
};

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
  const tone = STATUS_TONE[status] ?? "slate";

  return (
    <div
      className={`kanban-col ${isDragOver ? "drop-over" : ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onDrop(null);
      }}
      style={{ minWidth: 260, flex: "0 0 270px" }}
    >
      <div className={`kanban-head head-${tone}`} style={{ marginBottom: 0, paddingBottom: 4 }}>
        <span className="kanban-dot" style={{ background: `var(--${tone})` }} />
        <span className="kanban-name" style={{ flex: 1 }}>{label}</span>
        <span className="kanban-num">{cards.length}</span>
      </div>

      <div className="kanban-cards" style={{ marginTop: 8 }}>
        {cards.length === 0 ? (
          <div className="kanban-empty">Tarik kartu ke sini</div>
        ) : (
          cards.map((lead) => {
            const dimmed =
              searchText.trim() !== "" &&
              !lead.name?.toLowerCase().includes(searchText.toLowerCase()) &&
              !lead.client?.toLowerCase().includes(searchText.toLowerCase());

            return (
              <DraggableCard
                key={lead.id}
                lead={lead}
                dimmed={dimmed}
                onStatusChange={onStatusChange}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead, dimmed, onStatusChange }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(lead.id));
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => setDragging(true), 0);
      }}
      onDragEnd={() => setDragging(false)}
      style={{ cursor: "grab" }}
    >
      <LeadKanbanCard
        lead={lead}
        dimmed={dimmed}
        isDragging={dragging}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
