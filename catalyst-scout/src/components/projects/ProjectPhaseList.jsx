"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectPhase, updateProjectPhase } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { VALID_PHASE_STATUSES, PHASE_STATUS_LABELS } from "@/lib/projectStatus";
import ChecklistPanel from "@/components/projects/ChecklistPanel";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export default function ProjectPhaseList({ projectId, phases, project, activeDocumentTypes = [] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);
    const res = await createProjectPhase(projectId, fd);
    setPending(false);
    if (res.success) {
      addToast("Fase ditambahkan", "success");
      e.target.reset();
      setFormOpen(false);
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal menambah fase", "error");
    }
  }

  async function handleStatusChange(phase, status) {
    const fd = new FormData();
    fd.set("status", status);
    const res = await updateProjectPhase(phase.id, fd);
    if (res.success) router.refresh();
    else addToast(res.error ?? "Gagal mengubah status fase", "error");
  }

  return (
    <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Fase / Siklus Pencairan (CTR)</h3>
        <Button variant="neutral" size="sm" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Tutup" : "Tambah Fase"}
        </Button>
      </div>

      {phases.length === 0 ? (
        <p className="text-[13px] text-foreground-subtle">Belum ada fase yang dicatat.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {phases.map((phase) => (
            <div key={phase.id} className="flex flex-col gap-2 rounded-[10px] border border-border px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-medium text-foreground">{phase.label}</span>
                <Select
                  value={phase.status}
                  onChange={(e) => handleStatusChange(phase, e.target.value)}
                  className="h-7.5 w-32.5 text-xs"
                >
                  {VALID_PHASE_STATUSES.map((s) => <option key={s} value={s}>{PHASE_STATUS_LABELS[s]}</option>)}
                </Select>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-foreground-muted">
                <span>Periode: {formatDate(phase.startDate)} – {formatDate(phase.endDate)}</span>
                <span>
                  Pencairan: {phase.disbursementAmount != null ? formatCurrency(phase.disbursementAmount) : "—"}
                  {phase.disbursementStatus ? ` (${phase.disbursementStatus})` : ""}
                </span>
                {phase.dataCompleteness === "summary" && <Badge variant="tinjau">Data Ringkasan</Badge>}
              </div>

              <button
                onClick={() => setExpandedId((id) => id === phase.id ? null : phase.id)}
                className="cursor-pointer self-start border-0 bg-transparent p-0 text-left text-xs font-medium text-accent"
              >
                {expandedId === phase.id ? "Tutup checklist fase" : `Checklist fase (${phase.checklistItems?.length ?? 0})`}
              </button>

              {expandedId === phase.id && (
                <ChecklistPanel
                  projectId={projectId}
                  phaseId={phase.id}
                  items={phase.checklistItems ?? []}
                  title={`Checklist — ${phase.label}`}
                  project={project}
                  phase={phase}
                  activeDocumentTypes={activeDocumentTypes}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleAdd} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="phase-label">Label Fase *</Label>
            <Input id="phase-label" name="label" required placeholder="CTR-1" />
          </div>
          <div>
            <Label htmlFor="phase-sequence">Urutan</Label>
            <Input id="phase-sequence" name="sequence" type="number" placeholder="1" />
          </div>
          <div>
            <Label htmlFor="phase-start">Mulai</Label>
            <Input id="phase-start" name="startDate" type="date" />
          </div>
          <div>
            <Label htmlFor="phase-end">Selesai</Label>
            <Input id="phase-end" name="endDate" type="date" />
          </div>
          <div>
            <Label htmlFor="phase-amount">Nominal Pencairan (Rp)</Label>
            <Input id="phase-amount" name="disbursementAmount" type="number" min="0" />
          </div>
          <div>
            <Label htmlFor="phase-disb-status">Status Pencairan</Label>
            <Input id="phase-disb-status" name="disbursementStatus" placeholder="belum_cair / proses / cair" />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" loading={pending}>
              Simpan Fase
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
