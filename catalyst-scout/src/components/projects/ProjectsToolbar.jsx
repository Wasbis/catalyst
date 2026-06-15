"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { VALID_PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projectStatus";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/ui/SearchInput";
import FilterBar from "@/components/ui/FilterBar";
import { ProjectViewToggle, DirectAppointmentLink, ProjectCount } from "@/components/projects/ProjectToolbarControls";

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

  return (
    <FilterBar>
      <ProjectViewToggle currentView={currentView} searchParams={sp} />
      <DirectAppointmentLink />

      <SearchInput
        wrapperClassName="min-w-40 max-w-80 flex-1"
        placeholder="Cari nama proyek atau client…"
        defaultValue={sp.keyword}
        onKeyDown={(e) => e.key === "Enter" && push("keyword", e.target.value)}
      />

      <div className="relative min-w-30 max-w-55 flex-1">
        <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <Input
          type="search"
          placeholder="Filter client…"
          defaultValue={sp.client}
          onKeyDown={(e) => e.key === "Enter" && push("client", e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="w-35 shrink-0">
        <Select value={sp.sourceType ?? ""} onChange={(e) => push("sourceType", e.target.value)}>
          {SOURCE_TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <div className="w-35 shrink-0">
        <Select value={sp.status ?? ""} onChange={(e) => push("status", e.target.value)}>
          <option value="">Semua status</option>
          {VALID_PROJECT_STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
        </Select>
      </div>

      <div className="ml-auto shrink-0">
        <ProjectCount totalCount={totalCount} />
      </div>
    </FilterBar>
  );
}
