"use client";

import { useEffect, useRef } from "react";
import { Search, Maximize2, Minimize2, X } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FilterBar from "@/components/ui/FilterBar";
import { TenderViewToggle, TenderActions } from "@/components/tenders/TenderToolbarControls";

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
  currentView, searchParams, totalCount,
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
    <div className="mb-3.5 flex flex-col gap-2.5">
      {/* Main filter row */}
      <FilterBar>
        <TenderViewToggle currentView={currentView} searchParams={searchParams} />

        {/* Search */}
        <div className="relative min-w-40 max-w-80 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari tender… (F)"
            className="pl-9"
          />
        </div>

        {/* Score filter */}
        <div className="w-35 shrink-0">
          <Select value={scoreFilter} onChange={(e) => onScoreFilter(e.target.value)}>
            {SCORE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>

        {/* Deadline filter */}
        <div className="w-40 shrink-0">
          <Select value={deadlineFilter} onChange={(e) => onDeadlineFilter(e.target.value)}>
            {DEADLINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>

        {/* Source filter */}
        <div className="w-37.5 shrink-0">
          <Select value={sourceFilter} onChange={(e) => onSourceFilter(e.target.value)}>
            {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <TenderActions totalCount={totalCount} />

          {/* <Button
            type="button"
            variant={hideEmpty ? "ghost" : "neutral"}
            size="sm"
            onClick={onToggleHideEmpty}
            title="Sembunyikan kolom kosong"
          >
            Kolom kosong
          </Button>

          <Button
            type="button"
            variant="neutral"
            size="sm"
            onClick={onDensityToggle}
            title="Toggle kepadatan card"
          >
            {density === "compact" ? "Compact" : "Normal"}
          </Button>

          <button
            type="button"
            onClick={onFullscreen}
            title={isFullscreen ? "Keluar fullscreen" : "Fullscreen (F11)"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-120 ease-out hover:bg-surface-hover hover:text-foreground cursor-pointer active:scale-[0.97]"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button> */}
        </div>
      </FilterBar>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((chip) => (
            <Badge key={chip.key} variant="kejar" className="gap-1.5">
              {chip.label}
              <button
                type="button"
                onClick={() => onDismissFilter(chip.key)}
                className="flex items-center text-inherit cursor-pointer"
                aria-label={`Hapus filter ${chip.label}`}
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
