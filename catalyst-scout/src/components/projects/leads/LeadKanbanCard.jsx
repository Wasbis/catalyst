"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import { VALID_LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/projectStatus";

export default function LeadKanbanCard({ lead, dimmed = false, isDragging = false, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      data-card-id={lead.id}
      className={`kanban-card group ${isDragging ? "dragging" : ""}`}
      style={{ opacity: dimmed ? 0.35 : 1, transition: "opacity 0.15s" }}
    >
      <Link
        href={`/projects/leads/${lead.id}`}
        className="kc-title hover:text-accent transition-colors block"
        onClick={(e) => e.stopPropagation()}
      >
        {lead.name}
      </Link>

      <div className="kc-meta">
        <span>{lead.client}</span>
      </div>

      <div className="kc-foot">
        {lead.estimatedValue != null ? (
          <span className="kc-budget">{formatCurrency(lead.estimatedValue)}</span>
        ) : <span />}

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
              lead={lead}
              onStatusChange={onStatusChange}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CardMenu({ lead, onStatusChange, onClose }) {
  const others = VALID_LEAD_STATUSES.filter((s) => s !== lead.status);
  return (
    <div
      className="status-menu"
      style={{ right: 0, left: "auto", width: 180, top: 24 }}
      onMouseLeave={onClose}
    >
      <Link
        href={`/projects/leads/${lead.id}`}
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
            onClick={() => { onStatusChange(lead.id, s); onClose(); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "7px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--fg)", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {LEAD_STATUS_LABELS[s] ?? s}
          </button>
        ))}
      </div>
    </div>
  );
}
