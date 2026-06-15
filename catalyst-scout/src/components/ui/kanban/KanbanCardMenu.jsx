"use client";

import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";

export default function KanbanCardMenu({ detailHref, currentStatus, statuses, statusLabels, onSelect, onClose }) {
  const others = statuses.filter((s) => s !== currentStatus);

  return (
    <div
      className="absolute right-0 top-6 z-30 w-45 rounded-[10px] border border-border bg-surface p-1.5"
      onMouseLeave={onClose}
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        href={detailHref}
        className="flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-xs text-foreground transition-colors duration-120 ease-out hover:bg-surface-hover"
        onClick={onClose}
      >
        <Eye className="h-3.5 w-3.5" />
        Lihat Detail
      </Link>
      <div className="mt-1 border-t border-border pt-1">
        <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">
          Pindah ke
        </p>
        {others.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { onSelect(s); onClose(); }}
            className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12.5px] text-foreground transition-colors duration-120 ease-out hover:bg-surface-hover cursor-pointer"
          >
            <ArrowRight className="h-3.5 w-3.5 text-foreground-subtle" />
            {statusLabels[s] ?? s}
          </button>
        ))}
      </div>
    </div>
  );
}
