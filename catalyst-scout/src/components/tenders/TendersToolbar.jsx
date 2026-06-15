"use client";

import { useRouter } from "next/navigation";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/ui/SearchInput";
import FilterBar from "@/components/ui/FilterBar";
import { TenderViewToggle, TenderActions } from "@/components/tenders/TenderToolbarControls";

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
  const sp = searchParams ?? {};

  function push(key, val) {
    const p = new URLSearchParams(sp);
    if (val) p.set(key, val); else p.delete(key);
    p.delete("page");
    router.push(`/tenders?${p.toString()}`);
  }

  return (
    <FilterBar>
      <TenderViewToggle currentView={currentView} searchParams={sp} />

      <SearchInput
        wrapperClassName="min-w-40 max-w-80 flex-1"
        placeholder="Cari judul atau instansi…"
        defaultValue={sp.keyword}
        onKeyDown={(e) => e.key === "Enter" && push("keyword", e.target.value)}
      />

      <div className="w-32.5 shrink-0">
        <Select value={sp.source ?? ""} onChange={(e) => push("source", e.target.value)}>
          {SOURCE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <div className="w-32.5 shrink-0">
        <Select value={sp.status ?? ""} onChange={(e) => push("status", e.target.value)}>
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <div className="flex items-center gap-2 shrink-0 text-[13px] text-foreground-muted">
        <span className="whitespace-nowrap font-medium">Skor min</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          defaultValue={sp.minScore ?? 0}
          className="w-22.5 accent-accent"
          onMouseUp={(e) => push("minScore", e.target.value === "0" ? "" : e.target.value)}
        />
        <span className="min-w-6 font-medium text-foreground">{sp.minScore ?? 0}</span>
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <TenderActions totalCount={totalCount} />
      </div>
    </FilterBar>
  );
}
