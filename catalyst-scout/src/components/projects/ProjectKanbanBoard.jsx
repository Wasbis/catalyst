"use client";

import { useCallback, useRef, useState } from "react";
import { VALID_PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projectStatus";
import { updateProjectStatus } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import ProjectKanbanColumn from "@/components/projects/ProjectKanbanColumn";

function buildCardMap(projects) {
  const map = {};
  VALID_PROJECT_STATUSES.forEach((s) => { map[s] = []; });
  projects.forEach((p) => {
    const s = VALID_PROJECT_STATUSES.includes(p.status) ? p.status : "Approval";
    map[s].push(p);
  });
  return map;
}

export default function ProjectKanbanBoard({ initialProjects }) {
  const { addToast } = useToast();
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [dragOverCol, setDragOverCol] = useState(null);
  const undoStack = useRef([]);

  const cardMap = buildCardMap(projects);

  const handleStatusChange = useCallback(async (projectId, newStatus) => {
    const id = Number(projectId);
    const current = projects.find((p) => p.id === id);
    if (!current || current.status === newStatus) return;

    undoStack.current.push([...projects]);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));

    const result = await updateProjectStatus(id, newStatus);
    if (!result.success) {
      setProjects(undoStack.current.pop());
      addToast(result.error ?? "Gagal mengubah status", "error");
    } else {
      addToast(`Status → ${PROJECT_STATUS_LABELS[newStatus] ?? newStatus}`, "success");
    }
  }, [projects, addToast]);

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
        <input type="search" placeholder="Cari nama proyek atau client…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div
        className="kanban"
        style={{ gridAutoColumns: "minmax(260px, 1fr)" }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null);
        }}
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
