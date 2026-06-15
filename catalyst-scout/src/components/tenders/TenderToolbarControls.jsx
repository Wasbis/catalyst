"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import ManualInputModal from "@/components/tenders/ManualInputModal";
import ScrapeTriggerDropdown from "@/components/tenders/ScrapeTriggerDropdown";
import ListKanbanToggle from "@/components/ui/ListKanbanToggle";
import Button from "@/components/ui/Button";

export function TenderViewToggle({ currentView, searchParams }) {
  const router = useRouter();

  function setView(v) {
    const p = new URLSearchParams(searchParams ?? {});
    p.set("view", v);
    p.delete("page");
    router.push(`/tenders?${p.toString()}`);
  }

  return <ListKanbanToggle currentView={currentView} onChange={setView} />;
}

export function TenderActions({ totalCount }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {totalCount != null && (
        <span className="whitespace-nowrap text-[12.5px] font-medium text-foreground-subtle">
          {totalCount} tender
        </span>
      )}

      <ScrapeTriggerDropdown />

      <Button onClick={() => setModalOpen(true)}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Input Manual
      </Button>

      <ManualInputModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
