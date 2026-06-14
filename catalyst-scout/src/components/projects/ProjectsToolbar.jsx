"use client";

import { useRouter } from "next/navigation";
import { VALID_PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projectStatus";

const SOURCE_TYPE_OPTS = [
  { value: "", label: "Semua sumber" },
  { value: "tender", label: "Tender" },
  { value: "non_tender", label: "Non-Tender" },
];

export default function ProjectsToolbar({ currentView, searchParams, totalCount }) {
  const router = useRouter();
  const sp = searchParams ?? {};

  function push(key, val) {
    const p = new URLSearchParams(sp);
    if (val) p.set(key, val); else p.delete(key);
    p.delete("page");
    router.push(`/projects?${p.toString()}`);
  }

  function setView(v) {
    const p = new URLSearchParams(sp);
    p.set("view", v);
    p.delete("page");
    router.push(`/projects?${p.toString()}`);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
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

        <div style={{ flex: 1 }} />

        {totalCount != null && (
          <span style={{ fontSize: 12.5, color: "var(--foreground-subtle)", fontWeight: 600 }}>
            {totalCount} proyek
          </span>
        )}
      </div>

      {currentView !== "kanban" && (
        <div className="filterbar" style={{ marginBottom: 4 }}>
          <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--foreground-muted)", flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
            <input type="search" placeholder="Cari nama proyek atau client…" defaultValue={sp.keyword}
              onKeyDown={(e) => e.key === "Enter" && push("keyword", e.target.value)} />
          </div>

          <div className="select-wrap">
            <select className="input select" style={{ padding: "7px 32px 7px 12px", fontSize: 13 }}
              value={sp.sourceType ?? ""} onChange={(e) => push("sourceType", e.target.value)}>
              {SOURCE_TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          <div className="select-wrap">
            <select className="input select" style={{ padding: "7px 32px 7px 12px", fontSize: 13 }}
              value={sp.status ?? ""} onChange={(e) => push("status", e.target.value)}>
              <option value="">Semua status</option>
              {VALID_PROJECT_STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
            </select>
            <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      )}
    </>
  );
}
