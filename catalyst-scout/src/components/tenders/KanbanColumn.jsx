"use client";

import { useState } from "react";
import KanbanCard from "@/components/tenders/KanbanCard";
import { STATUS_LABELS, formatCurrency } from "@/lib/formatters";

const STATUS_TONE = {
  DITEMUKAN:  "slate",
  DITINJAU:   "blue",
  DIKEJAR:    "amber",
  DISERAHKAN: "violet",
  MENANG:     "green",
  KALAH:      "red",
  BATAL:      "zinc",
};

export default function KanbanColumn({
  status,
  cards,
  density,
  isCollapsed,
  onToggleCollapse,
  onStatusChange,
  searchText,
  onDragOver,
  onDrop,
  isDragOver,
}) {
  const label = STATUS_LABELS[status] ?? status;
  const tone = STATUS_TONE[status] ?? "slate";
  const totalValue = cards.reduce((s, t) => s + (t.budgetEstimated || 0), 0);

  /* ── Collapsed view ─────────────────────────────── */
  if (isCollapsed) {
    return (
      <div
        className="card"
        style={{
          width: 44,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0",
          gap: 10,
          cursor: "pointer",
          minHeight: 120,
        }}
        onClick={onToggleCollapse}
        title={`Buka kolom ${label}`}
      >
        <div className={`kanban-dot`} style={{ background: `var(--${tone})` }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: `var(--${tone})`,
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            letterSpacing: ".03em",
          }}
        >
          {label}
        </span>
        <span className="kanban-num" style={{ writingMode: "horizontal-tb" }}>
          {cards.length}
        </span>
      </div>
    );
  }

  /* ── Expanded view ──────────────────────────────── */
  return (
    <div
      className={`kanban-col ${isDragOver ? "drop-over" : ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={(e) => {
        // only fire if leaving the column itself, not a child
        if (!e.currentTarget.contains(e.relatedTarget)) onDrop(null);
      }}
      style={{ minWidth: 260, flex: "0 0 270px" }}
    >
      {/* Column header */}
      <div
        className={`kanban-head head-${tone}`}
        style={{ marginBottom: 0, paddingBottom: 4 }}
      >
        <span className="kanban-dot" style={{ background: `var(--${tone})` }} />
        <span className="kanban-name" style={{ flex: 1 }}>{label}</span>
        <span className="kanban-num">{cards.length}</span>
        {/* Collapse btn */}
        <button
          onClick={onToggleCollapse}
          className="icon-btn"
          style={{ width: 22, height: 22, marginLeft: 4 }}
          title="Lipat kolom"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Total value */}
      <div className="kanban-value">
        {totalValue ? formatCurrency(totalValue) : "—"}
      </div>

      {/* Cards */}
      <div className="kanban-cards">
        {cards.length === 0 ? (
          <div className="kanban-empty">Tarik kartu ke sini</div>
        ) : (
          cards.map((tender) => {
            const dimmed =
              searchText.trim() !== "" &&
              !tender.title?.toLowerCase().includes(searchText.toLowerCase()) &&
              !tender.agency?.toLowerCase().includes(searchText.toLowerCase());

            return (
              <DraggableCard
                key={tender.id}
                tender={tender}
                density={density}
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

function DraggableCard({ tender, density, dimmed, onStatusChange }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(tender.id));
        e.dataTransfer.effectAllowed = "move";
        // slight delay so ghost renders first
        setTimeout(() => setDragging(true), 0);
      }}
      onDragEnd={() => setDragging(false)}
      style={{ cursor: "grab" }}
    >
      <KanbanCard
        tender={tender}
        density={density}
        dimmed={dimmed}
        isDragging={dragging}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
