"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import EmployeeFormModal from "@/components/hr/EmployeeFormModal";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import FilterBar from "@/components/ui/FilterBar";

const ACTIVE_OPTS = [
  { value: "", label: "Semua status" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];

export default function EmployeeFilterBar({ searchParams }) {
  const router = useRouter();
  const sp = searchParams ?? {};
  const [showAddModal, setShowAddModal] = useState(false);

  function push(key, val) {
    const p = new URLSearchParams(sp);
    if (val) p.set(key, val); else p.delete(key);
    p.delete("page");
    router.push(`/hr?${p.toString()}`);
  }

  return (
    <>
      <FilterBar>
        <SearchInput
          wrapperClassName="min-w-40 max-w-80 flex-1"
          placeholder="Cari nama atau posisi…"
          defaultValue={sp.keyword}
          onKeyDown={(e) => e.key === "Enter" && push("keyword", e.target.value)}
        />

        <div className="w-35 shrink-0">
          <Select value={sp.isActive ?? ""} onChange={(e) => push("isActive", e.target.value)}>
            {ACTIVE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>

        <div className="ml-auto shrink-0">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={15} strokeWidth={2.2} />
            Tambah Karyawan
          </Button>
        </div>
      </FilterBar>

      <EmployeeFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </>
  );
}
