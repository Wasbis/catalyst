"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ManualInputModal from "@/components/tenders/ManualInputModal";

const SOURCE_OPTS = [
  { value: "", label: "Semua sumber" },
  { value: "civd",    label: "CIVD" },
  { value: "geodipa", label: "GeoDipa" },
  { value: "manual",  label: "Manual" },
];
const STATUS_OPTS = [
  { value: "", label: "Semua status" },
  { value: "DITEMUKAN",  label: "Ditemukan" },
  { value: "DITINJAU",   label: "Ditinjau" },
  { value: "DIKEJAR",    label: "Dikejar" },
  { value: "DISERAHKAN", label: "Diserahkan" },
  { value: "MENANG",     label: "Menang" },
  { value: "KALAH",      label: "Kalah" },
];

export default function TendersToolbar({ currentView, searchParams, totalCount }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const sp = searchParams ?? {};

  function push(key, val) {
    const p = new URLSearchParams(sp);
    if (val) p.set(key, val); else p.delete(key);
    p.delete("page");
    router.push(`/tenders?${p.toString()}`);
  }

  function setView(v) {
    const p = new URLSearchParams(sp);
    p.set("view", v);
    p.delete("page");
    router.push(`/tenders?${p.toString()}`);
  }

  return (
    <>
      {/* View toggle + input manual row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {/* List / Kanban toggle */}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden", background: "var(--surface)" }}>
          {["list", "kanban"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: "7px 18px", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
                border: "none", cursor: "pointer", transition: "all .14s",
                background: currentView === v ? "var(--accent)" : "transparent",
                color: currentView === v ? "#fff" : "var(--foreground-muted)",
                display: "flex", alignItems: "center", gap: 7,
              }}>
              {v === "list"
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v7h-4z" /></svg>
              }
              {v === "list" ? "List" : "Kanban"}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Count */}
        {totalCount != null && (
          <span style={{ fontSize: 12.5, color: "var(--foreground-subtle)", fontWeight: 600 }}>
            {totalCount} tender
          </span>
        )}

        {/* Input Manual */}
        <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-md" style={{ gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Input Manual
        </button>
      </div>

      {/* Filter bar (only on list view) */}
      {currentView !== "kanban" && (
        <div className="filterbar" style={{ marginBottom: 4 }}>
          {/* Search */}
          <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--foreground-muted)", flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
            <input type="search" placeholder="Cari judul atau instansi…" defaultValue={sp.keyword}
              onKeyDown={(e) => e.key === "Enter" && push("keyword", e.target.value)} />
          </div>

          {/* Source */}
          <div className="select-wrap">
            <select className="input select" style={{ padding: "7px 32px 7px 12px", fontSize: 13 }}
              value={sp.source ?? ""} onChange={(e) => push("source", e.target.value)}>
              {SOURCE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          {/* Status */}
          <div className="select-wrap">
            <select className="input select" style={{ padding: "7px 32px 7px 12px", fontSize: 13 }}
              value={sp.status ?? ""} onChange={(e) => push("status", e.target.value)}>
              {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          {/* Min score */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--foreground-muted)" }}>
            <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>Skor min</span>
            <input type="range" min="0" max="100" step="5"
              defaultValue={sp.minScore ?? 0}
              style={{ width: 90 }}
              onMouseUp={(e) => push("minScore", e.target.value === "0" ? "" : e.target.value)} />
            <span style={{ fontWeight: 700, minWidth: 24 }}>{sp.minScore ?? 0}</span>
          </div>
        </div>
      )}

      <ManualInputModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
