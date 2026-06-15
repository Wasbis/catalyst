"use client";

import { useEffect, useState } from "react";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { STATUS_LABELS } from "@/lib/formatters";
import { updateTenderStatus } from "@/actions/tenderActions";
import { useToast } from "@/components/ui/ToastProvider";
import { useKanbanBoard, buildCardMap } from "@/components/ui/kanban/useKanbanBoard";
import KanbanColumn from "@/components/tenders/KanbanColumn";
import KanbanToolbar from "@/components/tenders/KanbanToolbar";
import TenderDetailDrawer from "@/components/tenders/TenderDetailDrawer";

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

/* ── main board ──────────────────────────────── */
export default function KanbanBoard({ initialTenders, currentView, searchParams, totalCount }) {
  const { addToast } = useToast();
  const {
    items: tenders,
    dragOverCol,
    handleStatusChange,
    handleDragOver,
    handleDrop,
    handleDragLeave,
    undo,
  } = useKanbanBoard({
    initialItems: initialTenders,
    updateStatusAction: updateTenderStatus,
    statusLabels: STATUS_LABELS,
  });

  // view state
  const [search,         setSearch]         = useState("");
  const [scoreFilter,    setScoreFilter]    = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [sourceFilter,   setSourceFilter]   = useState("");
  const [hideEmpty,      setHideEmpty]      = useState(false);
  const [density,        setDensity]        = useState("normal");
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [collapsedCols,  setCollapsedCols]  = useState({});
  const [selectedTenderId, setSelectedTenderId] = useState(null);
  const [selectedTender,   setSelectedTender]   = useState(null);

  /* Keyboard shortcuts */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (undo()) addToast("Status dikembalikan (Undo)", "info");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen, addToast, undo]);

  /* Derived */
  const filteredTenders = tenders.filter(
    (t) => matchesScore(t, scoreFilter) && matchesDeadline(t, deadlineFilter) && matchesSource(t, sourceFilter)
  );
  const cardMap = buildCardMap(filteredTenders, VALID_TENDER_STATUSES, "DITEMUKAN");

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

  function handleOpenDetail(id) {
    const t = tenders.find((t) => t.id === id);
    setSelectedTender(t ?? null);
    setSelectedTenderId(id);
  }

  return (
    <div
      className={isFullscreen ? "fixed inset-0 z-40 bg-background p-6 flex flex-col" : "flex flex-1 min-h-0 flex-col"}
    >
      <KanbanToolbar
        currentView={currentView}     searchParams={searchParams}    totalCount={totalCount}
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
        className="flex flex-1 min-h-0 gap-3.5 overflow-x-auto overflow-y-hidden pb-4"
        onDragLeave={handleDragLeave}
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
            onOpenDetail={handleOpenDetail}
          />
        ))}
      </div>

      <TenderDetailDrawer
        tenderId={selectedTenderId}
        initialData={selectedTender}
        onClose={() => setSelectedTenderId(null)}
      />
    </div>
  );
}
