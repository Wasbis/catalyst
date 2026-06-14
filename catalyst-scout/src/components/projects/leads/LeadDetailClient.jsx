"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProjectLeadStatus, createProjectFromLead } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import { VALID_LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/projectStatus";
import LeadStatusBadge from "@/components/projects/leads/LeadStatusBadge";
import LeadForm from "@/components/projects/leads/LeadForm";

export default function LeadDetailClient({ lead }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [convertPending, setConvertPending] = useState(false);

  async function handleStatusChange(newStatus) {
    setStatusMenuOpen(false);
    const res = await updateProjectLeadStatus(lead.id, newStatus);
    if (res.success) {
      addToast(`Status → ${LEAD_STATUS_LABELS[newStatus] ?? newStatus}`, "success");
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal mengubah status", "error");
    }
  }

  async function handleConvert(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setConvertPending(true);
    const res = await createProjectFromLead(lead.id, fd);
    setConvertPending(false);
    if (res.success) {
      addToast("Lead dikonversi ke Project", "success");
      router.push(`/projects/${res.data.id}`);
    } else {
      addToast(res.error ?? "Gagal mengonversi lead", "error");
    }
  }

  const otherStatuses = VALID_LEAD_STATUSES.filter((s) => s !== lead.status && s !== "converted");

  return (
    <div className="detail-grid">
      <div className="detail-main">
        <LeadForm lead={lead} />
      </div>

      <div className="detail-side">
        <div className="panel action-panel">
          <div className="panel-head"><h3>Status</h3></div>
          <div className="current-status">
            <span style={{ fontSize: 12, color: "var(--foreground-muted)", fontWeight: 600 }}>Status saat ini</span>
            <LeadStatusBadge status={lead.status} />
          </div>

          {lead.status !== "converted" && (
            <div style={{ position: "relative" }}>
              <button className="status-picker-btn" onClick={() => setStatusMenuOpen((v) => !v)}>
                Ubah status
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
              </button>
              {statusMenuOpen && (
                <div className="status-menu" style={{ top: 46, left: 0, right: 0 }}>
                  {otherStatuses.map((s) => (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--foreground)", cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      {LEAD_STATUS_LABELS[s] ?? s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {lead.status === "converted" && lead.projectId && (
            <Link href={`/projects/${lead.projectId}`} className="btn btn-secondary btn-md full" style={{ gap: 8, marginTop: 8 }}>
              Lihat Proyek
            </Link>
          )}
        </div>

        {lead.status === "quotation" && (
          <form onSubmit={handleConvert} className="panel">
            <div className="panel-head"><h3>Konversi ke Proyek</h3></div>
            <p style={{ fontSize: 12.5, color: "var(--foreground-muted)", marginBottom: 12 }}>
              Lead siap dikonversi menjadi Proyek aktif (non-tender).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="field">
                <label className="field-label">Nama Proyek</label>
                <input name="name" defaultValue={lead.name} className="input" />
              </div>
              <div className="field">
                <label className="field-label">Client</label>
                <input name="client" defaultValue={lead.client} className="input" />
              </div>
              <div className="field">
                <label className="field-label">No. PO/SO</label>
                <input name="poSoNumber" className="input" />
              </div>
              <div className="field">
                <label className="field-label">Tanggal PO/SO</label>
                <input name="poSoDate" type="date" className="input" />
              </div>
              <button type="submit" disabled={convertPending} className="btn btn-primary btn-md full">
                {convertPending ? "Mengonversi…" : "Konversi ke Proyek"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
