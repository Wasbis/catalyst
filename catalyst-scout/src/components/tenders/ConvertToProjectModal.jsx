"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function ConvertToProjectModal({ tenderId, tenderTitle }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="border-stage-menang/30 bg-stage-menang/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🏆</span>
          <p className="text-xs font-semibold text-stage-menang uppercase tracking-wide">
            Tender Menang
          </p>
        </div>
        <p className="text-xs text-foreground-muted mb-3 leading-relaxed">
          Tender ini berstatus <strong>Menang</strong>. Konversikan ke Proyek untuk memulai tahap pelaksanaan.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          Konversi ke Proyek
        </Button>
      </Card>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Konversi ke Proyek"
        size="sm"
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-surface-hover px-4 py-3 text-xs text-foreground-muted leading-relaxed">
            <p className="font-medium text-foreground mb-1">{tenderTitle}</p>
            <p>
              Fitur <strong>Konversi ke Proyek</strong> akan tersedia ketika modul{" "}
              <strong>App 2 — Internal Workspace</strong> sudah siap (RF-T-011).
            </p>
            <p className="mt-2 text-foreground-subtle">
              Saat ini catat tender ini secara manual ke sistem proyek yang ada.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Tutup
          </Button>
        </div>
      </Modal>
    </>
  );
}
