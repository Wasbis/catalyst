"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowRight } from "lucide-react";
import { updateProjectLeadStatus, createProjectFromLead } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import { VALID_LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/projectStatus";
import LeadStatusBadge from "@/components/projects/leads/LeadStatusBadge";
import LeadForm from "@/components/projects/leads/LeadForm";
import CommentThread from "@/components/comments/CommentThread";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export default function LeadDetailClient({ lead, currentUserId }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [convertPending, setConvertPending] = useState(false);

  async function handleStatusChange(newStatus) {
    setStatusMenuOpen(false);
    const res = await updateProjectLeadStatus(lead.id, newStatus);
    if (res.success) {
      addToast(`Status → ${LEAD_STATUS_LABELS[newStatus] ?? newStatus}`, "success");
      if (res.data?.projectCreated) {
        addToast("Proyek otomatis dibuat dari Direct Appointment ini", "success");
      }
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
      addToast("Direct Appointment dikonversi ke Project", "success");
      router.push(`/projects/${res.data.id}`);
    } else {
      addToast(res.error ?? "Gagal mengonversi Direct Appointment", "error");
    }
  }

  const otherStatuses = VALID_LEAD_STATUSES.filter((s) => s !== lead.status && s !== "converted");

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
      {/* ── MAIN COLUMN ── */}
      <div className="flex flex-col gap-4">
        <LeadForm lead={lead} />

        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3.5">
            <h3 className="text-sm font-medium text-foreground">Komentar Tim</h3>
          </div>
          <CommentThread
            entityType="project_lead"
            entityId={lead.id}
            currentUserId={currentUserId}
            revalidatePathTarget={`/projects/leads/${lead.id}`}
          />
        </div>
      </div>

      {/* ── SIDE COLUMN ── */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-0">
        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3.5"><h3 className="text-sm font-medium text-foreground">Status</h3></div>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Status saat ini</span>
            <LeadStatusBadge status={lead.status} />
          </div>

          {lead.status !== "converted" && (
            <div className="relative mb-3">
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
                  {otherStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors duration-120 ease-out hover:bg-surface-hover"
                    >
                      {LEAD_STATUS_LABELS[s] ?? s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {lead.projectId && (
            <Link
              href={`/projects/${lead.projectId}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-hover px-4 py-2 text-[13px] font-medium text-foreground no-underline transition-colors duration-120 ease-out hover:border-foreground-subtle"
            >
              Lihat Proyek
            </Link>
          )}
        </div>

        {lead.status === "quotation" && !lead.projectId && (
          <form onSubmit={handleConvert} className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
            <div className="mb-3.5"><h3 className="text-sm font-medium text-foreground">Konversi ke Proyek</h3></div>
            <p className="mb-3 text-[12.5px] text-foreground-muted">
              Direct Appointment siap dikonversi menjadi Proyek aktif (non-tender).
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <Label htmlFor="convert-name">Nama Proyek</Label>
                <Input id="convert-name" name="name" defaultValue={lead.name} />
              </div>
              <div>
                <Label htmlFor="convert-client">Client</Label>
                <Input id="convert-client" name="client" defaultValue={lead.client} />
              </div>
              <div>
                <Label htmlFor="convert-posonum">No. PO/SO</Label>
                <Input id="convert-posonum" name="poSoNumber" />
              </div>
              <div>
                <Label htmlFor="convert-posodate">Tanggal PO/SO</Label>
                <Input id="convert-posodate" name="poSoDate" type="date" />
              </div>
              <Button type="submit" loading={convertPending} className="w-full">
                <ArrowRight size={16} />
                {convertPending ? "Mengonversi…" : "Konversi ke Proyek"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
