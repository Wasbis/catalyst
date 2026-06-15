"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink, ChevronDown, CircleDot, CalendarDays, Building2,
  Wallet, Tag, FileText, Paperclip, Download, MessageSquare, Target,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import ScoreBadge from "@/components/tenders/ScoreBadge";
import StatusBadge from "@/components/tenders/StatusBadge";
import TenderTextBlock from "@/components/tenders/TenderTextBlock";
import { getTenderDetailForDrawer, updateTenderStatus } from "@/actions/tenderActions";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { STATUS_LABELS, formatCurrency, formatDate, formatDeadline, formatSource } from "@/lib/formatters";
import { useToast } from "@/components/ui/ToastProvider";

const SOURCE_CHIP_CLASSES = {
  civd: "bg-[#e8efff] text-[#1d4ed8]",
  geodipa: "bg-[#e7f6ed] text-[#15803d]",
  manual: "bg-[#eef2f7] text-[#475569]",
};

const STATUS_DOT_CLASSES = {
  DITEMUKAN: "text-stage-ditemukan",
  DITINJAU: "text-stage-ditinjau",
  DIKEJAR: "text-stage-dikejar",
  DISERAHKAN: "text-stage-diserahkan",
  MENANG: "text-stage-menang",
  KALAH: "text-stage-kalah",
  BATAL: "text-stage-batal",
};

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-foreground-subtle shrink-0" />
      <span className="w-32 shrink-0 text-sm text-foreground-muted">{label}</span>
      <div className="text-sm text-foreground font-medium">{children}</div>
    </div>
  );
}

export default function TenderDetailDrawer({ tenderId, initialData, onClose }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [detail, setDetail] = useState(null);
  const [statusOverride, setStatusOverride] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");
  const [isPending, startTransition] = useTransition();
  const [prevTenderId, setPrevTenderId] = useState(tenderId);

  if (tenderId !== prevTenderId) {
    setPrevTenderId(tenderId);
    setDetail(null);
    setStatusOverride(null);
    setShowStatusMenu(false);
    setActiveTab("detail");
  }

  useEffect(() => {
    if (!tenderId) return;
    getTenderDetailForDrawer(tenderId).then(setDetail);
  }, [tenderId]);

  if (!tenderId || !initialData) {
    return <Drawer isOpen={false} onClose={onClose} />;
  }

  const tender = { ...initialData, ...(detail ?? {}) };
  const status = statusOverride ?? tender.status;
  const deadline = formatDeadline(tender.deadlineDate);
  const kbliMatches = tender.kbliMatchedJson ? JSON.parse(tender.kbliMatchedJson) : [];
  const docFiles = tender.docFilesJson ? JSON.parse(tender.docFilesJson) : [];
  const notes = (tender.notes ?? "").split("\n---\n").filter((n) => n.trim());

  function handleStatusChange(newStatus) {
    if (newStatus === status) {
      setShowStatusMenu(false);
      return;
    }
    startTransition(async () => {
      const result = await updateTenderStatus(tender.id, newStatus);
      if (result.success) {
        setStatusOverride(newStatus);
        addToast(`Status diubah ke "${STATUS_LABELS[newStatus] ?? newStatus}"`, "success");
      } else {
        addToast(result.error ?? "Gagal mengubah status", "error");
      }
      setShowStatusMenu(false);
    });
  }

  return (
    <Drawer
      isOpen={!!tenderId}
      onClose={onClose}
      title={
        <span className="flex items-center gap-1.5 text-xs text-foreground-subtle font-medium">
          <span className={`rounded-[5px] px-2 py-0.75 font-mono text-[11px] font-medium tracking-tight ${SOURCE_CHIP_CLASSES[(tender.source ?? "manual").toLowerCase()] ?? SOURCE_CHIP_CLASSES.manual}`}>
            {formatSource(tender.source)}
          </span>
          <span>/</span>
          <span>{STATUS_LABELS[status] ?? status}</span>
        </span>
      }
      headerActions={
        <Link
          href={`/tenders/${tender.id}`}
          className="rounded-md p-1 text-foreground-muted hover:bg-surface-hover hover:text-accent transition-colors"
          title="Buka halaman penuh"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      }
      footer={
        <>
          <Button variant="neutral" onClick={onClose}>Batal</Button>
          <Button onClick={() => router.push(`/tenders/${tender.id}`)}>Buka Detail</Button>
        </>
      }
    >
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground leading-snug mb-3">{tender.title}</h2>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("detail")}
          className={`flex items-center gap-1.5 px-1 pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "detail" ? "border-accent text-foreground" : "border-transparent text-foreground-subtle hover:text-foreground"}`}
        >
          Detail
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-1.5 px-1 pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "notes" ? "border-accent text-foreground" : "border-transparent text-foreground-subtle hover:text-foreground"}`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Catatan
          <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 rounded-full bg-surface-hover text-[10px] px-1">
            {notes.length}
          </span>
        </button>
      </div>

      {activeTab === "detail" && (
      <>
      {/* Info rows */}
      <div className="divide-y divide-border border-y border-border mb-4">
        <div className="relative">
          <InfoRow icon={CircleDot} label="Status">
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              disabled={isPending}
              className="flex items-center gap-1.5 hover:text-accent transition-colors disabled:opacity-50"
            >
              <CircleDot className={`h-3.5 w-3.5 ${STATUS_DOT_CLASSES[status] ?? ""}`} fill="currentColor" />
              {STATUS_LABELS[status] ?? status}
              <ChevronDown className="h-3.5 w-3.5 text-foreground-subtle" />
            </button>
          </InfoRow>
          {showStatusMenu && (
            <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
              {VALID_TENDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isPending}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-surface-hover ${s === status ? "bg-surface-hover font-medium" : ""}`}
                >
                  <StatusBadge status={s} />
                  {s === status && (
                    <span className="ml-auto text-foreground-subtle text-[10px]">Saat ini</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <InfoRow icon={CalendarDays} label="Tenggat">
          <span className={deadline.isUrgent ? "text-danger" : ""}>
            {deadline.label}
            {tender.deadlineDate && (
              <span className="ml-1 text-foreground-subtle text-xs font-normal">({formatDate(tender.deadlineDate)})</span>
            )}
          </span>
        </InfoRow>

        <InfoRow icon={Building2} label="Agency">
          {tender.agency || "—"}
        </InfoRow>

        <InfoRow icon={Wallet} label="Estimasi Anggaran">
          {formatCurrency(tender.budgetEstimated)}
        </InfoRow>

        <InfoRow icon={Target} label="Skor Relevansi">
          <ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} />
        </InfoRow>

        {kbliMatches.length > 0 && (
          <InfoRow icon={Tag} label="KBLI Match">
            <div className="flex flex-wrap gap-1.5">
              {kbliMatches.map((k, i) => (
                <span key={i} className="rounded-[5px] bg-[#eaf0fa] px-2 py-0.5 font-mono text-[12.5px] font-medium tracking-tight text-primary">{k.kbli_code}</span>
              ))}
            </div>
          </InfoRow>
        )}
      </div>

      {/* Description */}
      {(tender.tenderText || tender.description) && (
        <div className="mb-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground-subtle mb-1.5">
            <FileText className="h-3.5 w-3.5" />
            Deskripsi / Requirement
          </p>
          <div className="rounded-lg border border-border bg-surface-hover px-3 py-2.5">
            <TenderTextBlock text={tender.tenderText || tender.description} />
          </div>
        </div>
      )}

      {/* Attachments */}
      {docFiles.length > 0 && (
        <div className="mb-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground-subtle mb-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Lampiran ({docFiles.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {docFiles.map((doc, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs">
                <FileText className="h-4 w-4 text-accent shrink-0" />
                <span className="truncate text-foreground flex-1">{doc.file_name}</span>
                {doc.download_url && (
                  <a href={doc.download_url} target="_blank" rel="noreferrer" className="text-foreground-subtle hover:text-accent shrink-0" title="Unduh">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      </>
      )}

      {/* Notes */}
      {activeTab === "notes" && (
        <div className="flex flex-col gap-1.5">
          {notes.length === 0 ? (
            <p className="text-sm text-foreground-subtle text-center py-6">Belum ada catatan.</p>
          ) : (
            notes.map((n, i) => (
              <p key={i} className="text-sm text-foreground-muted whitespace-pre-wrap rounded-lg bg-surface-hover px-3 py-2">
                {n.trim()}
              </p>
            ))
          )}
        </div>
      )}
    </Drawer>
  );
}
