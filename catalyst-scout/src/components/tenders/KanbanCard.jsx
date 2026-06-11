"use client";

import { useState } from "react";
import Link from "next/link";
import ScoreBadge from "@/components/tenders/ScoreBadge";
import { formatDeadline, formatCurrency, formatSource } from "@/lib/formatters";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { STATUS_LABELS } from "@/lib/formatters";

function countNotes(notesStr) {
  if (!notesStr) return 0;
  return notesStr.split("\n---\n").filter(Boolean).length;
}

const SOURCE_CHIP_CLASS = {
  civd: "src-civd",
  geodipa: "src-geodipa",
  manual: "src-manual",
};

export default function KanbanCard({ tender, density = "normal", onStatusChange, dimmed = false, isDragging = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deadline = formatDeadline(tender.deadlineDate);
  const notesCount = countNotes(tender.notes);
  const srcClass = SOURCE_CHIP_CLASS[tender.source?.toLowerCase()] ?? "src-manual";

  return (
    <div
      data-card-id={tender.id}
      className={`kanban-card group ${isDragging ? "dragging" : ""}`}
      style={{ opacity: dimmed ? 0.35 : 1, transition: "opacity 0.15s" }}
    >
      {/* Top row: source chip + score */}
      <div className="kc-top">
        <span className={`source-chip ${srcClass}`}>{formatSource(tender.source)}</span>
        <ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} />
      </div>

      {/* Title */}
      <Link
        href={`/tenders/${tender.id}`}
        className="kc-title hover:text-accent transition-colors block"
        onClick={(e) => e.stopPropagation()}
      >
        {tender.title}
      </Link>

      {/* Agency */}
      {tender.agency && density !== "compact" && (
        <div className="kc-meta">
          <span>
            <svg className="inline h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {tender.agency}
          </span>
        </div>
      )}

      {/* KBLI Match */}
      {tender.kbliMatchedJson && JSON.parse(tender.kbliMatchedJson).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {JSON.parse(tender.kbliMatchedJson).slice(0, 2).map((k, i) => (
            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-hover text-foreground-subtle border border-border">
              {k.kbli_code}
            </span>
          ))}
          {JSON.parse(tender.kbliMatchedJson).length > 2 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-hover text-foreground-subtle border border-border">
              +{JSON.parse(tender.kbliMatchedJson).length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="kc-foot">
        {tender.budgetEstimated != null ? (
          <span className="kc-budget">{formatCurrency(tender.budgetEstimated)}</span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {/* Notes count */}
          {notesCount > 0 && (
            <span className="kc-dl">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3z" />
              </svg>
              {notesCount}
            </span>
          )}

          {/* Deadline */}
          {tender.deadlineDate && (
            <span className={`kc-dl ${deadline.isUrgent ? "urgent" : ""}`}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {deadline.label}
            </span>
          )}

          {/* ⋯ Menu */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="icon-btn w-5! h-5!"
              aria-label="Menu kartu"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <CardMenu
                tender={tender}
                onStatusChange={onStatusChange}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardMenu({ tender, onStatusChange, onClose }) {
  const others = VALID_TENDER_STATUSES.filter((s) => s !== tender.status);
  return (
    <div
      className="status-menu"
      style={{ right: 0, left: "auto", width: 180, top: 24 }}
      onMouseLeave={onClose}
    >
      <Link
        href={`/tenders/${tender.id}`}
        className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
        onClick={onClose}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Lihat Detail
      </Link>
      <div style={{ borderTop: "1px solid var(--border)", padding: "4px 0" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: ".04em", padding: "4px 12px" }}>
          Pindah ke
        </p>
        {others.map((s) => (
          <button
            key={s}
            onClick={() => { onStatusChange(tender.id, s); onClose(); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "7px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--fg)", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {STATUS_LABELS[s] ?? s}
          </button>
        ))}
      </div>
    </div>
  );
}
