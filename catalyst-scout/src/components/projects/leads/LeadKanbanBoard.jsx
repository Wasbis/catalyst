"use client";

import { useCallback, useRef, useState } from "react";
import { VALID_LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/projectStatus";
import { updateProjectLeadStatus } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import LeadKanbanColumn from "@/components/projects/leads/LeadKanbanColumn";

function buildCardMap(leads) {
  const map = {};
  VALID_LEAD_STATUSES.forEach((s) => { map[s] = []; });
  leads.forEach((l) => {
    const s = VALID_LEAD_STATUSES.includes(l.status) ? l.status : "lead";
    map[s].push(l);
  });
  return map;
}

export default function LeadKanbanBoard({ initialLeads }) {
  const { addToast } = useToast();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [dragOverCol, setDragOverCol] = useState(null);
  const undoStack = useRef([]);

  const cardMap = buildCardMap(leads);

  const handleStatusChange = useCallback(async (leadId, newStatus) => {
    const id = Number(leadId);
    const current = leads.find((l) => l.id === id);
    if (!current || current.status === newStatus) return;

    undoStack.current.push([...leads]);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l));

    const result = await updateProjectLeadStatus(id, newStatus);
    if (!result.success) {
      setLeads(undoStack.current.pop());
      addToast(result.error ?? "Gagal mengubah status", "error");
    } else {
      addToast(`Status → ${LEAD_STATUS_LABELS[newStatus] ?? newStatus}`, "success");
    }
  }, [leads, addToast]);

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  }

  function handleDrop(e, status) {
    e.preventDefault();
    setDragOverCol(null);
    if (!e || !status) return;
    const id = e.dataTransfer?.getData("text/plain");
    if (id) handleStatusChange(id, status);
  }

  return (
    <div>
      <div className="search-box" style={{ maxWidth: 320, marginBottom: 10 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--foreground-muted)", flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
        <input type="search" placeholder="Cari nama lead atau client…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div
        className="kanban"
        style={{ gridAutoColumns: "minmax(260px, 1fr)" }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null);
        }}
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
