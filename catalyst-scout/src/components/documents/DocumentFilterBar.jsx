"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { VALID_DOCUMENT_ENTITY_TYPES, DOCUMENT_ENTITY_TYPE_LABELS, DOCUMENT_CATEGORY_GROUPS, DOCUMENT_CATEGORY_GROUP_LABELS } from "@/lib/documentTypes";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FilterBar from "@/components/ui/FilterBar";
import DocumentFormModal from "./DocumentFormModal";

export default function DocumentFilterBar({ searchParams, categories, totalCount }) {
  const router = useRouter();
  const sp = searchParams ?? {};
  const [modalOpen, setModalOpen] = useState(false);

  function push(key, val) {
    const p = new URLSearchParams(sp);
    if (val) p.set(key, val); else p.delete(key);
    p.delete("page");
    router.push(`/documents?${p.toString()}`);
  }

  return (
    <>
      <FilterBar>
        <div className="relative min-w-40 max-w-70 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            type="search"
            placeholder="Cari judul, tag, atau client…"
            defaultValue={sp.keyword}
            onKeyDown={(e) => e.key === "Enter" && push("keyword", e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="w-35 shrink-0">
          <Select value={sp.categoryId ?? ""} onChange={(e) => push("categoryId", e.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </div>

        <div className="w-35 shrink-0">
          <Select value={sp.group ?? ""} onChange={(e) => push("group", e.target.value)}>
            <option value="">Semua grup</option>
            {DOCUMENT_CATEGORY_GROUPS.map((g) => <option key={g} value={g}>{DOCUMENT_CATEGORY_GROUP_LABELS[g]}</option>)}
          </Select>
        </div>

        <div className="w-35 shrink-0">
          <Select value={sp.entityType ?? ""} onChange={(e) => push("entityType", e.target.value)}>
            <option value="">Semua entitas</option>
            {VALID_DOCUMENT_ENTITY_TYPES.map((t) => <option key={t} value={t}>{DOCUMENT_ENTITY_TYPE_LABELS[t]}</option>)}
          </Select>
        </div>

        <div className="w-35 shrink-0">
          <Select value={sp.isReference ?? ""} onChange={(e) => push("isReference", e.target.value)}>
            <option value="">Semua dokumen</option>
            <option value="true">Hanya referensi</option>
            <option value="false">Non-referensi</option>
          </Select>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          {totalCount != null && (
            <span className="whitespace-nowrap text-[12.5px] font-medium text-foreground-subtle">{totalCount} dokumen</span>
          )}

          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} strokeWidth={2.2} />
            Upload Dokumen
          </Button>
        </div>
      </FilterBar>

      <DocumentFormModal open={modalOpen} onClose={() => setModalOpen(false)} categories={categories} />
    </>
  );
}
