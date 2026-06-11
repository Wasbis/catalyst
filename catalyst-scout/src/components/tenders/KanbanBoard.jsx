"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { STATUS_LABELS } from "@/lib/formatters";
import { updateTenderStatus } from "@/actions/tenderActions";
import { useToast } from "@/components/ui/ToastProvider";
import KanbanColumn from "@/components/tenders/KanbanColumn";
import KanbanToolbar from "@/components/tenders/KanbanToolbar";

/* ── filter helpers ──────────────────────────── */
function matchesScore(t, f) {
  if (!f) return true;
  const r = t.recommendation;
  const s = t.matchScore;
  if (f === "KEJAR")  return r === "KEJAR"  || (s != null && s >= 70);
  if (f === "TINJAU") return r === "TINJAU" || (s != null && s >= 40 && s < 70);
  if (f === "LEWATI") return r === "LEWATI" || s == null || s < 40;
  return true;
}

function matchesDeadline(t, f) {
  if (!f) return true;
  if (!t.deadlineDate) return false;
  const diff = Math.round((new Date(t.deadlineDate) - Date.now()) / 86400000);
  if (f === "urgent")  return diff >= 0 && diff <= 7;
  if (f === "overdue") return diff < 0;
  return true;
}

function matchesSource(t, f) {
  return !f || (t.source ?? "").toLowerCase() === f.toLowerCase();
}

function buildCardMap(tenders) {
  const map = {};
  VALID_TENDER_STATUSES.forEach((s) => { map[s] = []; });
  tenders.forEach((t) => {
    const s = VALID_TENDER_STATUSES.includes(t.status) ? t.status : "DITEMUKAN";
    map[s].push(t);
  });
  return map;
}

/* ── main board ──────────────────────────────── */
export default function KanbanBoard({ initialTenders }) {
  const { addToast } = useToast();
  const [tenders, setTenders] = useState(initialTenders);
  const undoStack = useRef([]);

  // view state
  const [search,         setSearch]         = useState("");
  const [scoreFilter,    setScoreFilter]    = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [sourceFilter,   setSourceFilter]   = useState("");
  const [hideEmpty,      setHideEmpty]      = useState(false);
  const [density,        setDensity]        = useState("normal");
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [collapsedCols,  setCollapsedCols]  = useState({});
  const [dragOverCol,    setDragOverCol]    = useState(null);

  /* Keyboard shortcuts */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && undoStack.current.length) {
        e.preventDefault();
        setTenders(undoStack.current.pop());
        addToast("Status dikembalikan (Undo)", "info");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen, addToast]);

  /* Derived */
  const filteredTenders = tenders.filter(
    (t) => matchesScore(t, scoreFilter) && matchesDeadline(t, deadlineFilter) && matchesSource(t, sourceFilter)
  );
  const cardMap = buildCardMap(filteredTenders);

  let visibleStatuses = VALID_TENDER_STATUSES;
  if (hideEmpty) visibleStatuses = visibleStatuses.filter((s) => cardMap[s].length > 0);

  const activeFilters = [
    scoreFilter    && { key: "score",    label: `Skor: ${scoreFilter}` },
    deadlineFilter && { key: "deadline", label: `Tenggat: ${deadlineFilter === "urgent" ? "Mendesak" : "Lewat"}` },
    sourceFilter   && { key: "source",   label: `Sumber: ${sourceFilter.toUpperCase()}` },
  ].filter(Boolean);

  function dismissFilter(key) {
    if (key === "score")    setScoreFilter("");
    if (key === "deadline") setDeadlineFilter("");
    if (key === "source")   setSourceFilter("");
  }

  /* Status change: optimistic + API call */
  const handleStatusChange = useCallback(async (tenderId, newStatus) => {
    const id = Number(tenderId);
    const current = tenders.find((t) => t.id === id);
    if (!current || current.status === newStatus) return;

    undoStack.current.push([...tenders]);

    // Optimistic update
    setTenders((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));

    const result = await updateTenderStatus(id, newStatus);
    if (!result.success) {
      setTenders(undoStack.current.pop());
      addToast(result.error ?? "Gagal mengubah status", "error");
    } else {
      addToast(`Status → ${STATUS_LABELS[newStatus] ?? newStatus}`, "success");
    }
  }, [tenders, addToast]);

  /* HTML5 native drag handlers */
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
    <div
      className={isFullscreen ? "fixed inset-0 z-40 bg-background overflow-auto p-6" : ""}
    >
      <KanbanToolbar
        search={search}               onSearch={setSearch}
        scoreFilter={scoreFilter}     onScoreFilter={setScoreFilter}
        deadlineFilter={deadlineFilter} onDeadlineFilter={setDeadlineFilter}
        sourceFilter={sourceFilter}   onSourceFilter={setSourceFilter}
        hideEmpty={hideEmpty}         onToggleHideEmpty={() => setHideEmpty((v) => !v)}
        density={density}             onDensityToggle={() => setDensity((v) => v === "compact" ? "normal" : "compact")}
        isFullscreen={isFullscreen}   onFullscreen={() => setIsFullscreen((v) => !v)}
        activeFilters={activeFilters} onDismissFilter={dismissFilter}
      />

      {/* Board */}
      <div
        className="kanban"
        style={{ gridAutoColumns: "minmax(260px, 1fr)" }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null);
        }}
      >
        {visibleStatuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            cards={cardMap[status]}
            density={density}
            isCollapsed={!!collapsedCols[status]}
            onToggleCollapse={() => setCollapsedCols((p) => ({ ...p, [status]: !p[status] }))}
            onStatusChange={handleStatusChange}
            searchText={search}
            isDragOver={dragOverCol === status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
          />
        ))}
      </div>
    </div>
  );
}
