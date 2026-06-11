"use client";

import { useEffect, useRef } from "react";

const SCORE_OPTIONS = [
  { value: "", label: "Semua Skor" },
  { value: "KEJAR",  label: "KEJAR (≥70)" },
  { value: "TINJAU", label: "TINJAU (40–69)" },
  { value: "LEWATI", label: "LEWATI (<40)" },
];

const DEADLINE_OPTIONS = [
  { value: "",        label: "Semua Tenggat" },
  { value: "urgent",  label: "Mendesak (≤7 hari)" },
  { value: "overdue", label: "Lewat Tenggat" },
];

const SOURCE_OPTIONS = [
  { value: "",         label: "Semua Sumber" },
  { value: "civd",     label: "CIVD · SKK Migas" },
  { value: "geodipa",  label: "GeoDipa" },
  { value: "manual",   label: "Input Manual" },
];

export default function KanbanToolbar({
  search, onSearch,
  scoreFilter, onScoreFilter,
  deadlineFilter, onDeadlineFilter,
  sourceFilter, onSourceFilter,
  hideEmpty, onToggleHideEmpty,
  density, onDensityToggle,
  isFullscreen, onFullscreen,
  activeFilters, onDismissFilter,
}) {
  const searchRef = useRef(null);

  // Keyboard shortcut: F = focus search
  useEffect(() => {
    function handleKey(e) {
      const tag = document.activeElement?.tagName;
      if (e.key === "f" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
      {/* Main filter row */}
      <div className="filterbar" style={{ gap: 10 }}>
        {/* Search */}
        <div className="search-box" style={{ minWidth: 220, flex: 1, maxWidth: 340 }}>
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--fg-muted)", width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 1116.65 16.65z" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari tender… (F)"
          />
        </div>

        {/* Score filter */}
        <div className="select-wrap" style={{ minWidth: 140 }}>
          <select
            className="input select"
            style={{ padding: "7px 32px 7px 12px", fontSize: 13 }}
            value={scoreFilter}
            onChange={(e) => onScoreFilter(e.target.value)}
          >
            {SCORE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <svg className="select-chev" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Deadline filter */}
        <div className="select-wrap" style={{ minWidth: 160 }}>
          <select
            className="input select"
            style={{ padding: "7px 32px 7px 12px", fontSize: 13 }}
            value={deadlineFilter}
            onChange={(e) => onDeadlineFilter(e.target.value)}
          >
            {DEADLINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <svg className="select-chev" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Source filter */}
        <div className="select-wrap" style={{ minWidth: 150 }}>
          <select
            className="input select"
            style={{ padding: "7px 32px 7px 12px", fontSize: 13 }}
            value={sourceFilter}
            onChange={(e) => onSourceFilter(e.target.value)}
          >
            {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <svg className="select-chev" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Right controls */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Hide empty toggle */}
          <button
            onClick={onToggleHideEmpty}
            className="btn btn-sm btn-secondary"
            style={hideEmpty ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : {}}
            title="Sembunyikan kolom kosong"
          >
            Kolom kosong
          </button>

          {/* Density toggle */}
          <button
            onClick={onDensityToggle}
            className="btn btn-sm btn-secondary"
            title="Toggle kepadatan card"
          >
            {density === "compact" ? "Compact" : "Normal"}
          </button>

          {/* Fullscreen */}
          <button
            onClick={onFullscreen}
            className="icon-btn"
            title={isFullscreen ? "Keluar fullscreen" : "Fullscreen (F11)"}
          >
            {isFullscreen ? (
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h5M4 4v5m11-5l5 5M20 4h-5m5 0v5M4 20l5-5M4 20h5m11 0l-5-5M20 20h-5v0" />
              </svg>
            ) : (
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {activeFilters.map((chip) => (
            <span
              key={chip.key}
              className="badge badge-violet"
              style={{ gap: 6 }}
            >
              {chip.label}
              <button
                onClick={() => onDismissFilter(chip.key)}
                style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", padding: "0 1px", display: "flex", alignItems: "center" }}
                aria-label={`Hapus filter ${chip.label}`}
              >
                <svg style={{ width: 10, height: 10 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
