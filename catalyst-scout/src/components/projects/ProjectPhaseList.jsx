"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectPhase, updateProjectPhase } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { VALID_PHASE_STATUSES, PHASE_STATUS_LABELS } from "@/lib/projectStatus";
import ChecklistPanel from "@/components/projects/ChecklistPanel";

export default function ProjectPhaseList({ projectId, phases }) {
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
    <div className="panel">
      <div className="panel-head">
        <h3>Fase / Siklus Pencairan (CTR)</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Tutup" : "Tambah Fase"}
        </button>
      </div>

      {phases.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>Belum ada fase yang dicatat.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {phases.map((phase) => (
            <div key={phase.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{phase.label}</span>
                <div className="select-wrap" style={{ width: 130 }}>
                  <select
                    className="input select"
                    style={{ fontSize: 12, padding: "4px 26px 4px 10px" }}
                    value={phase.status}
                    onChange={(e) => handleStatusChange(phase, e.target.value)}
                  >
                    {VALID_PHASE_STATUSES.map((s) => <option key={s} value={s}>{PHASE_STATUS_LABELS[s]}</option>)}
                  </select>
                  <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--foreground-muted)", flexWrap: "wrap" }}>
                <span>Periode: {formatDate(phase.startDate)} – {formatDate(phase.endDate)}</span>
                <span>
                  Pencairan: {phase.disbursementAmount != null ? formatCurrency(phase.disbursementAmount) : "—"}
                  {phase.disbursementStatus ? ` (${phase.disbursementStatus})` : ""}
                </span>
                {phase.dataCompleteness === "summary" && <span className="badge badge-amber">Data Ringkasan</span>}
              </div>

              <button
                onClick={() => setExpandedId((id) => id === phase.id ? null : phase.id)}
                style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: 0 }}
              >
                {expandedId === phase.id ? "Tutup checklist fase" : `Checklist fase (${phase.checklistItems?.length ?? 0})`}
              </button>

              {expandedId === phase.id && (
                <ChecklistPanel
                  projectId={projectId}
                  phaseId={phase.id}
                  items={phase.checklistItems ?? []}
                  title={`Checklist — ${phase.label}`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleAdd} className="form-grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label className="field-label">Label Fase *</label>
            <input name="label" required className="input" placeholder="CTR-1" />
          </div>
          <div className="field">
            <label className="field-label">Urutan</label>
            <input name="sequence" type="number" className="input" placeholder="1" />
          </div>
          <div className="field">
            <label className="field-label">Mulai</label>
            <input name="startDate" type="date" className="input" />
          </div>
          <div className="field">
            <label className="field-label">Selesai</label>
            <input name="endDate" type="date" className="input" />
          </div>
          <div className="field">
            <label className="field-label">Nominal Pencairan (Rp)</label>
            <input name="disbursementAmount" type="number" min="0" className="input" />
          </div>
          <div className="field">
            <label className="field-label">Status Pencairan</label>
            <input name="disbursementStatus" className="input" placeholder="belum_cair / proses / cair" />
          </div>
          <div className="field span-2" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={pending} className="btn btn-primary btn-md">
              {pending ? "Menyimpan…" : "Simpan Fase"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
