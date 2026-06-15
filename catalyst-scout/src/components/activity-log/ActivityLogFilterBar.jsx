"use client";

import { useRouter } from "next/navigation";
import { ENTITY_TYPE_LABELS } from "@/lib/auditLogTypes";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FilterBar from "@/components/ui/FilterBar";

const ENTITY_TYPE_OPTS = [
  { value: "", label: "Semua entity" },
  ...Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function ActivityLogFilterBar({ searchParams, users }) {
  const router = useRouter();
  const sp = searchParams ?? {};

  function push(key, val) {
    const p = new URLSearchParams(sp);
    if (val) p.set(key, val); else p.delete(key);
    p.delete("page");
    router.push(`/activity-log?${p.toString()}`);
  }

  return (
    <FilterBar>
      <div className="w-35 shrink-0">
        <Select value={sp.entityType ?? ""} onChange={(e) => push("entityType", e.target.value)}>
          {ENTITY_TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <div className="w-35 shrink-0">
        <Select value={sp.userId ?? ""} onChange={(e) => push("userId", e.target.value)}>
          <option value="">Semua user</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <Input type="date" value={sp.dateFrom ?? ""} onChange={(e) => push("dateFrom", e.target.value)} className="w-auto" />
        <span className="text-[13px] text-foreground-muted">—</span>
        <Input type="date" value={sp.dateTo ?? ""} onChange={(e) => push("dateTo", e.target.value)} className="w-auto" />
      </div>
    </FilterBar>
  );
}
