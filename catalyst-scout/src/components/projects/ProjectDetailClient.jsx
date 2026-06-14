"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatters";
import { VALID_PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projectStatus";
import { updateProjectStatus } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import ChecklistPanel from "@/components/projects/ChecklistPanel";
import ProjectPhaseList from "@/components/projects/ProjectPhaseList";
import ProjectTaskList from "@/components/projects/ProjectTaskList";

const STATUS_TONE = {
  Approval: "slate",
  KickOff: "blue",
  POSOIssued: "violet",
  Pelaksanaan: "amber",
  Invoicing: "red",
  Closed: "green",
};

const SOURCE_TYPE_LABELS = {
  tender: "Tender",
  non_tender: "Non-Tender",
};

export default function ProjectDetailClient({ project }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  async function handleStatusChange(newStatus) {
    setStatusMenuOpen(false);
    const res = await updateProjectStatus(project.id, newStatus);
    if (res.success) {
      addToast(`Status → ${PROJECT_STATUS_LABELS[newStatus] ?? newStatus}`, "success");
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal mengubah status", "error");
    }
  }

  const projectChecklist = project.checklistItems.filter((c) => c.phaseId == null);
  const sourceTender = project.tenderResults?.[0];

  return (
    <div className="detail-grid">
      {/* ── MAIN COLUMN ── */}
      <div className="detail-main">
        <div className="panel">
          <div className="dh-top">
            <span className="source-chip src-manual">
              {SOURCE_TYPE_LABELS[project.sourceType] ?? project.sourceType}
            </span>
            <Link href="/projects" style={{ fontSize: 12.5, color: "var(--foreground-muted)", textDecoration: "none" }}>← Projects</Link>
            {sourceTender && (
              <Link href={`/tenders/${sourceTender.id}`} className="ext-link">
                Lihat Tender Asal
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
              </Link>
            )}
          </div>
          <h2 className="dh-title">{project.name}</h2>
          <div className="dh-agency">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>
            {project.client}
          </div>
          <div className="dh-meta">
            <div className="dh-meta-item">
              <span className="meta-label">No. PO/SO</span>
              <span className="meta-val">{project.poSoNumber || "—"}</span>
            </div>
            <div className="dh-meta-item">
              <span className="meta-label">Tanggal PO/SO</span>
              <span className="meta-val">{formatDate(project.poSoDate)}</span>
            </div>
            <div className="dh-meta-item">
              <span className="meta-label">Dibuat</span>
              <span className="meta-val">{formatDate(project.createdAt)}</span>
            </div>
            <div className="dh-meta-item">
              <span className="meta-label">Diperbarui</span>
              <span className="meta-val">{formatDate(project.updatedAt)}</span>
            </div>
          </div>
        </div>

        <ChecklistPanel projectId={project.id} items={projectChecklist} title="Checklist Dokumen Proyek" />
        <ProjectPhaseList projectId={project.id} phases={project.phases} />
        <ProjectTaskList projectId={project.id} tasks={project.tasks} />
      </div>

      {/* ── SIDE COLUMN ── */}
      <div className="detail-side">
        <div className="panel action-panel">
          <div className="panel-head"><h3>Status &amp; Aksi</h3></div>
          <div className="current-status">
            <span style={{ fontSize: 12, color: "var(--foreground-muted)", fontWeight: 600 }}>Status saat ini</span>
            <span className={`badge badge-${STATUS_TONE[project.status] ?? "slate"}`} style={{ gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {PROJECT_STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <button className="status-picker-btn" onClick={() => setStatusMenuOpen((v) => !v)}>
              Ubah status
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
            </button>
            {statusMenuOpen && (
              <div className="status-menu" style={{ top: 46, left: 0, right: 0 }}>
                {VALID_PROJECT_STATUSES.filter((s) => s !== project.status).map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--foreground)", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    {PROJECT_STATUS_LABELS[s] ?? s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
