"use client";

import { useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/tenders/StatusBadge";
import { updateTenderStatus } from "@/actions/tenderActions";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { STATUS_LABELS, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/ToastProvider";

export default function StatusHistory({ tender }) {
  const [currentStatus, setCurrentStatus] = useState(tender.status);
  const [showSelect, setShowSelect] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleChange(newStatus) {
    if (newStatus === currentStatus) {
      setShowSelect(false);
      return;
    }
    startTransition(async () => {
      const result = await updateTenderStatus(tender.id, newStatus);
      if (result.success) {
        setCurrentStatus(newStatus);
        addToast(`Status diubah ke "${STATUS_LABELS[newStatus] ?? newStatus}"`, "success");
      } else {
        addToast(result.error ?? "Gagal mengubah status", "error");
      }
      setShowSelect(false);
    });
  }

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle mb-3">
        Status Pipeline
      </p>

      <div className="flex items-center justify-between">
        <StatusBadge status={currentStatus} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSelect((v) => !v)}
          disabled={isPending}
        >
          {isPending ? "Menyimpan..." : "Ubah"}
        </Button>
      </div>

      {tender.updatedAt && (
        <p className="mt-1.5 text-[10px] text-foreground-subtle">
          Diperbarui {formatDate(tender.updatedAt)}
        </p>
      )}

      {showSelect && (
        <div className="mt-3 rounded-lg border border-border bg-surface overflow-hidden">
          {VALID_TENDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              disabled={isPending}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-surface-hover ${s === currentStatus ? "bg-surface-hover font-medium" : ""}`}
            >
              <StatusBadge status={s} />
              {s === currentStatus && (
                <span className="ml-auto text-foreground-subtle text-[10px]">Saat ini</span>
              )}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
