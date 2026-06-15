"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Building2 } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { VALID_PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projectStatus";
import { updateProjectStatus, updateProject } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import ChecklistPanel from "@/components/projects/ChecklistPanel";
import ProjectPhaseList from "@/components/projects/ProjectPhaseList";
import ProjectTaskList from "@/components/projects/ProjectTaskList";
import DocumentUploadPanel from "@/components/documents/DocumentUploadPanel";
import CommentThread from "@/components/comments/CommentThread";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

const TONE_CLASSES = {
  slate:  "bg-[#eef2f7] text-[#475569]",
  blue:   "bg-[#e8efff] text-[#1d4ed8]",
  violet: "bg-[#f1ebfe] text-[#6d28d9]",
  amber:  "bg-[#fdf2e0] text-[#b45309]",
  green:  "bg-[#e7f6ed] text-[#15803d]",
  red:    "bg-[#fdeaef] text-[#be123c]",
};

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

const SOURCE_TYPE_CHIP_CLASS = {
  tender: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  non_tender: "bg-surface-hover text-foreground-muted",
};

export default function ProjectDetailClient({ project, currentUserId, activeDocumentTypes = [] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  async function handleSaveInfo(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setSavingInfo(true);
    const res = await updateProject(project.id, fd);
    setSavingInfo(false);
    if (res.success) {
      addToast("Info proyek tersimpan", "success");
      setEditingInfo(false);
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal menyimpan info proyek", "error");
    }
  }

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
  const sourceLead = project.leads?.[0];
  const headerTone = TONE_CLASSES[STATUS_TONE[project.status] ?? "slate"];
  const sourceChip = SOURCE_TYPE_CHIP_CLASS[project.sourceType] ?? SOURCE_TYPE_CHIP_CLASS.non_tender;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
      {/* ── MAIN COLUMN ── */}
      <div className="flex flex-col gap-4">
        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium ${sourceChip}`}>
              {SOURCE_TYPE_LABELS[project.sourceType] ?? project.sourceType}
            </span>
            <Link href="/projects" className="text-[12.5px] text-foreground-muted no-underline hover:text-foreground">← Projects</Link>
            <div className="flex-1" />
            {sourceTender && (
              <Link href={`/tenders/${sourceTender.id}`} className="flex items-center gap-1 text-[12.5px] text-accent no-underline hover:underline">
                Lihat Tender Asal
                <ExternalLink size={13} />
              </Link>
            )}
            {sourceLead && (
              <Link href={`/projects/leads/${sourceLead.id}`} className="flex items-center gap-1 text-[12.5px] text-accent no-underline hover:underline">
                Lihat Direct Appointment Asal
                <ExternalLink size={13} />
              </Link>
            )}
            {!editingInfo && (
              <button
                type="button"
                onClick={() => setEditingInfo(true)}
                className="flex items-center gap-1 border-0 bg-transparent p-0 text-[12.5px] text-accent cursor-pointer hover:underline"
              >
                Edit Info Proyek
              </button>
            )}
          </div>

          {editingInfo ? (
            <form onSubmit={handleSaveInfo} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="project-name">Nama Proyek</Label>
                  <Input id="project-name" name="name" defaultValue={project.name} required />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="project-client">Client</Label>
                  <Input id="project-client" name="client" defaultValue={project.client} required />
                </div>
                <div>
                  <Label htmlFor="project-posonum">No. PO/SO</Label>
                  <Input id="project-posonum" name="poSoNumber" defaultValue={project.poSoNumber ?? ""} />
                </div>
                <div>
                  <Label htmlFor="project-posodate">Tanggal PO/SO</Label>
                  <Input
                    id="project-posodate" name="poSoDate" type="date"
                    defaultValue={project.poSoDate ? new Date(project.poSoDate).toISOString().slice(0, 10) : ""}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="neutral" onClick={() => setEditingInfo(false)}>Batal</Button>
                <Button type="submit" loading={savingInfo}>Simpan</Button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="m-0 mb-2 text-[22px] font-medium leading-[1.3] text-foreground">{project.name}</h2>
              <div className="mb-4 flex items-center gap-1.5 text-[13px] text-foreground-muted">
                <Building2 size={15} />
                {project.client}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 border-t border-border pt-3.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">No. PO/SO</span>
                  <span className="text-sm font-medium text-foreground">{project.poSoNumber || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">Tanggal PO/SO</span>
                  <span className="text-sm font-medium text-foreground">{formatDate(project.poSoDate)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">Dibuat</span>
                  <span className="text-sm font-medium text-foreground">{formatDateTime(project.createdAt)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">Diperbarui</span>
                  <span className="text-sm font-medium text-foreground">{formatDateTime(project.updatedAt)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <ChecklistPanel
          projectId={project.id}
          items={projectChecklist}
          title="Checklist Dokumen Proyek"
          project={project}
          activeDocumentTypes={activeDocumentTypes}
        />
        <ProjectPhaseList projectId={project.id} phases={project.phases} project={project} activeDocumentTypes={activeDocumentTypes} />
        <ProjectTaskList projectId={project.id} tasks={project.tasks} />
        <DocumentUploadPanel entityType="Project" entityId={project.id} />

        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3.5">
            <h3 className="text-sm font-medium text-foreground">Komentar Tim</h3>
          </div>
          <CommentThread
            entityType="project"
            entityId={project.id}
            currentUserId={currentUserId}
            revalidatePathTarget={`/projects/${project.id}`}
          />
        </div>
      </div>

      {/* ── SIDE COLUMN ── */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-0">
        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3.5"><h3 className="text-sm font-medium text-foreground">Status &amp; Aksi</h3></div>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Status saat ini</span>
            <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.75 text-xs font-medium ${headerTone}`}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {PROJECT_STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusMenuOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-[10px] border border-border bg-surface-hover px-3 py-2.5 text-[13px] font-medium text-foreground transition-colors duration-120 ease-out hover:border-accent"
            >
              Ubah status
              <ChevronDown size={15} />
            </button>
            {statusMenuOpen && (
              <div className="animate-panel-in absolute inset-x-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-[11px] border border-border bg-surface p-1.5 shadow-[0_18px_48px_rgba(4,19,46,0.20)]">
                {VALID_PROJECT_STATUSES.filter((s) => s !== project.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors duration-120 ease-out hover:bg-surface-hover"
                  >
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
