"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink, Building2, Sparkles, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ArrowRight, FileText, Wand2, Shield, Download, Upload, Save, Loader2,
} from "lucide-react";
import { formatCurrency, formatDeadline, formatDateTime, formatSource, STATUS_LABELS } from "@/lib/formatters";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { updateTenderStatus } from "@/actions/tenderActions";
import { useToast } from "@/components/ui/ToastProvider";
import ScoreBadge from "@/components/tenders/ScoreBadge";
import ConvertToProjectModal from "@/components/tenders/ConvertToProjectModal";
import DocumentUploadPanel from "@/components/documents/DocumentUploadPanel";
import CommentThread from "@/components/comments/CommentThread";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Label from "@/components/ui/Label";

const STATUS_TONE = {
  DITEMUKAN: "slate", DITINJAU: "blue", DIKEJAR: "amber",
  DISERAHKAN: "violet", MENANG: "green", KALAH: "red", BATAL: "zinc",
};

const TONE_CLASSES = {
  slate:  "bg-[#eef2f7] text-[#475569]",
  blue:   "bg-[#e8efff] text-[#1d4ed8]",
  violet: "bg-[#f1ebfe] text-[#6d28d9]",
  amber:  "bg-[#fdf2e0] text-[#b45309]",
  green:  "bg-[#e7f6ed] text-[#15803d]",
  red:    "bg-[#fdeaef] text-[#be123c]",
  zinc:   "bg-[#f1f1f3] text-[#71717a]",
};

const SOURCE_CHIP_CLASSES = {
  civd: "bg-[#e8efff] text-[#1d4ed8]",
  geodipa: "bg-[#e7f6ed] text-[#15803d]",
  manual: "bg-[#eef2f7] text-[#475569]",
};

const KBLI_TONE_CLASSES = {
  high: { fill: "bg-[#22c55e]", text: "text-[#15803d]" },
  mid:  { fill: "bg-[#eab308]", text: "text-[#b45309]" },
  low:  { fill: "bg-[#ef4444]", text: "text-[#be123c]" },
};

export default function TenderDetailClient({ tender, currentUserId }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [proposalView, setProposalView] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const deadline = formatDeadline(tender.deadlineDate);

  // Parse files
  let docFiles = [];
  if (tender.docFilesJson) {
    try {
      docFiles = JSON.parse(tender.docFilesJson);
    } catch (e) {
      console.error("Gagal parse docFilesJson:", e);
    }
  }

  // Parse KBLI
  let kbliMatched = [];
  if (tender.kbliMatchedJson) {
    try {
      kbliMatched = JSON.parse(tender.kbliMatchedJson);
    } catch (e) {
      console.error("Gagal parse kbliMatchedJson:", e);
    }
  }

  // Parse source metadata
  let sourceMetadata = {};
  if (tender.sourceMetadataJson) {
    try {
      sourceMetadata = JSON.parse(tender.sourceMetadataJson);
    } catch (e) {
      console.error("Gagal parse sourceMetadataJson:", e);
    }
  }

  async function handleStatusChange(newStatus) {
    setStatusMenuOpen(false);
    const res = await updateTenderStatus(tender.id, newStatus);
    if (res.success) {
      addToast(`Status → ${STATUS_LABELS[newStatus] ?? newStatus}`, "success");
      if (res.data?.projectCreated) {
        addToast("Proyek otomatis dibuat dari tender ini", "success");
      }
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal mengubah status", "error");
    }
  }

  async function handleExtractPdf() {
    setExtracting(true);
    try {
      const res = await fetch(`/api/tenders/${tender.id}/extract-pdf`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Gagal mengekstrak PDF.");
      }

      const tkdn = resData.data?.tkdn_percentage;
      const kblis = resData.data?.extracted_kblis;

      addToast(
        `Ekstraksi selesai! TKDN: ${tkdn != null ? tkdn + "%" : "-"}, KBLI terdeteksi: ${kblis?.length ? kblis.join(", ") : "tidak ada"}.`,
        "success"
      );
      router.refresh();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setExtracting(false);
    }
  }

  if (proposalView) {
    return <ProposalView tender={tender} currentUserId={currentUserId} onBack={() => setProposalView(false)} />;
  }

  const headerTone = TONE_CLASSES[STATUS_TONE[tender.status]] ?? TONE_CLASSES.slate;
  const sourceChip = SOURCE_CHIP_CLASSES[(tender.source ?? "manual").toLowerCase()] ?? SOURCE_CHIP_CLASSES.manual;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
      {/* ── MAIN COLUMN ── */}
      <div className="flex flex-col gap-4">
        {/* Header card */}
        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`rounded-[5px] px-2 py-0.75 font-mono text-[11px] font-medium tracking-tight ${sourceChip}`}>
                {formatSource(tender.source)}
              </span>
              {tender.sourceId && <span className="font-mono text-xs text-foreground-muted">TND-{tender.sourceId}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/tenders" className="text-[12.5px] text-foreground-muted no-underline hover:text-foreground">← Tenders</Link>
              {tender.sourceUrl && (
                <a className="flex items-center gap-1 text-[12.5px] text-accent no-underline hover:underline" href={tender.sourceUrl} target="_blank" rel="noreferrer">
                  Buka sumber
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[22px] font-medium leading-[1.3] text-foreground">{tender.title}</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.75 text-xs font-medium ${headerTone}`}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {STATUS_LABELS[tender.status] ?? tender.status}
            </span>
          </div>
          {tender.agency && (
            <div className="mb-4 flex items-center gap-1.5 text-[13px] text-foreground-muted">
              <Building2 size={15} />
              {tender.agency}
            </div>
          )}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 border-t border-border pt-3.5">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-subtle">Estimasi Nilai</span>
              <span className="text-sm font-medium text-foreground">{formatCurrency(tender.budgetEstimated)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-subtle">Tenggat</span>
              <span className={`text-sm font-medium ${deadline.isUrgent ? "text-danger" : "text-foreground"}`}>
                {deadline.label}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-subtle">Skor Relevansi</span>
              <span className="text-sm font-medium text-foreground"><ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} /></span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-subtle">Ditemukan</span>
              <span className="text-sm font-medium text-foreground">{formatDateTime(tender.scrapedAt)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-subtle">Diperbarui</span>
              <span className="text-sm font-medium text-foreground">{formatDateTime(tender.updatedAt ?? tender.scrapedAt)}</span>
            </div>
            {sourceMetadata.tkdn_percentage != null && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-success">Kadar TKDN</span>
                <span className="text-sm font-medium text-success">{sourceMetadata.tkdn_percentage}%</span>
              </div>
            )}
          </div>
        </div>

        {/* KBLI Matching */}
        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Pencocokan KBLI</h3>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent">
              <Sparkles size={13} />
              AI semantic match
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {kbliMatched.length === 0 ? (
              <p className="m-0 text-sm text-foreground-subtle">
                Belum ada KBLI yang cocok. Jalankan Ekstraksi PDF pada lampiran dokumen untuk mendeteksi kode KBLI.
              </p>
            ) : (
              kbliMatched.map((m) => {
                const scoreVal = m.score != null ? m.score : 0;
                const pct = Math.round(scoreVal * 100);
                const tone = pct >= 70 ? "high" : pct >= 40 ? "mid" : "low";
                const toneClasses = KBLI_TONE_CLASSES[tone];
                return (
                  <div key={m.kbli_code || m.kbliCode} className="flex items-center gap-2.5">
                    <span className="rounded-[5px] bg-[#eaf0fa] px-2 py-0.5 font-mono text-[12.5px] font-medium tracking-tight text-primary">
                      {m.kbli_code || m.kbliCode}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-[12.5px] font-medium text-foreground">{m.description}</div>
                      <div className="h-1.5 overflow-hidden rounded bg-surface-hover">
                        <div className={`h-full rounded transition-[width] duration-400 ease-out ${toneClasses.fill}`} style={{ width: pct + "%" }} />
                      </div>
                    </div>
                    <span className={`w-9 shrink-0 text-right text-[13px] font-medium ${toneClasses.text}`}>{pct}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attachment files & deep PDF extraction */}
        {docFiles.length > 0 && (
          <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Lampiran Dokumen ({docFiles.length})</h3>
              <Button variant="neutral" size="sm" onClick={handleExtractPdf} disabled={extracting}>
                {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {extracting ? "Mengekstrak..." : "Ekstrak KBLI & TKDN"}
              </Button>
            </div>
            <div className="flex flex-col gap-2.5">
              {docFiles.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-[10px] border border-border bg-surface-hover px-3.5 py-2.5"
                >
                  <span className="max-w-[75%] truncate text-[13.5px] font-medium text-foreground">
                    {doc.file_name}
                  </span>
                  {doc.download_url && (
                    <a
                      href={doc.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground-muted no-underline transition-colors duration-120 ease-out hover:text-foreground hover:border-foreground-subtle"
                    >
                      Unduh
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deskripsi */}
        {tender.description && (
          <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
            <div className="mb-3.5"><h3 className="text-sm font-medium text-foreground">Deskripsi &amp; Persyaratan</h3></div>
            <p className="whitespace-pre-line text-[13.5px] leading-[1.7] text-foreground">{tender.description}</p>
          </div>
        )}

        {/* Comments */}
        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3.5">
            <h3 className="text-sm font-medium text-foreground">Komentar Tim</h3>
          </div>
          <CommentThread
            entityType="tender_result"
            entityId={tender.id}
            currentUserId={currentUserId}
            revalidatePathTarget={`/tenders/${tender.id}`}
          />
        </div>

        <DocumentUploadPanel entityType="TenderResult" entityId={tender.id} />
      </div>

      {/* ── SIDE COLUMN ── */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-0">
        {/* Status & Aksi */}
        <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-3.5"><h3 className="text-sm font-medium text-foreground">Status &amp; Aksi</h3></div>

          {tender.convertedToProject && tender.projectId && (
            <Link
              href={`/projects/${tender.projectId}`}
              className="mb-3 flex items-center gap-1.5 rounded-[10px] border border-[#bbf0d0] bg-[#e7f6ed] px-3 py-2 text-[12.5px] font-medium text-[#15803d] no-underline transition-colors duration-120 ease-out hover:bg-[#d6f5e3]"
            >
              <CheckCircle2 size={14} />
              Sudah dikonversi ke Proyek
              <ArrowRight size={13} className="ml-auto shrink-0" />
            </Link>
          )}

          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Status saat ini</span>
            <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.75 text-xs font-medium ${headerTone}`}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {STATUS_LABELS[tender.status] ?? tender.status}
            </span>
          </div>

          {/* Status picker */}
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
                {VALID_TENDER_STATUSES.filter((s) => s !== tender.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors duration-120 ease-out hover:bg-surface-hover"
                  >
                    {STATUS_LABELS[s] ?? s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => setProposalView(true)}>
              <FileText size={16} />
              Generate Proposal
            </Button>
            {tender.status === "DITEMUKAN" && (
              <Button variant="neutral" className="w-full" onClick={() => handleStatusChange("DITINJAU")}>
                <ArrowRight size={16} />
                Promote ke Lead
              </Button>
            )}
          </div>
        </div>

        {/* Konversi manual: fallback untuk tender MENANG yang belum tersambung ke Project */}
        {tender.status === "MENANG" && !tender.convertedToProject && (
          <ConvertToProjectModal tender={tender} />
        )}
      </div>
    </div>
  );
}

/* ── Proposal View ── */
function ProposalView({ tender, currentUserId, onBack }) {
  const { addToast } = useToast();
  const [phase, setPhase] = useState("setup"); // setup | generating | ready
  const [genStep, setGenStep] = useState(0);

  // Proposal configuration inputs
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [companyName, setCompanyName] = useState("PT Cliste Rekayasa Indonesia");
  const [useMasking, setUseMasking] = useState(true);
  const [userRequirements, setUserRequirements] = useState("");

  // Loaded proposal draft & blocks
  const [draft, setDraft] = useState(null);
  const [savingBlockId, setSavingBlockId] = useState(null);
  const [editingBlocks, setEditingBlocks] = useState({}); // { blockId: { content, comment, approved } }
  const [uploadingTimeline, setUploadingTimeline] = useState(false);

  const GEN_STEPS = [
    "Membuat draf proposal di basis data…",
    "Melakukan masking data sensitif (PII & Klien)…",
    "Menghubungi AI Claude Agent…",
    "Menganalisis KBLI & persyaratan tender…",
    "Menyusun konten proposal per-blok…",
    "Menghubungkan visual & format template…"
  ];

  // Fetch templates listing
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/ai-proposal/templates");
        if (res.ok) {
          const resBody = await res.json();
          const list = resBody.data || [];
          setTemplates(list);
          if (list.length > 0) {
            setSelectedTemplateId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Gagal memuat template:", err);
      }
    }
    loadTemplates();
  }, []);

  async function handleGenerate() {
    setPhase("generating");
    setGenStep(0);

    // Animate loader steps for professional feel
    const stepInterval = setInterval(() => {
      setGenStep((s) => {
        if (s < GEN_STEPS.length - 1) return s + 1;
        return s;
      });
    }, 1200);

    try {
      const res = await fetch("/api/ai-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tender_result_id: tender.id,
          template_id: selectedTemplateId || null,
          company_name: companyName,
          use_masking: useMasking,
          user_requirements: userRequirements || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Gagal membuat proposal.");
      }

      clearInterval(stepInterval);
      setGenStep(GEN_STEPS.length);

      // Load draft details including blocks
      await loadDraftDetails(resData.data.draft_id);
      setPhase("ready");
      addToast("Proposal berhasil di-generate!", "success");
    } catch (err) {
      clearInterval(stepInterval);
      setPhase("setup");
      addToast(err.message, "error");
    }
  }

  async function loadDraftDetails(draftId) {
    try {
      const res = await fetch(`/api/ai-proposal/${draftId}`);
      const resData = await res.json();
      if (res.ok) {
        setDraft(resData.data);

        // Initialize editing state
        const initialEditing = {};
        resData.data.blocks.forEach((b) => {
          initialEditing[b.id] = {
            content: b.content,
            comment: b.user_comment || "",
            approved: b.is_approved,
          };
        });
        setEditingBlocks(initialEditing);
      } else {
        throw new Error(resData.error || "Gagal memuat detail proposal.");
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  const handleBlockChange = (blockId, field, value) => {
    setEditingBlocks((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        [field]: value,
      },
    }));
  };

  const handleSaveBlock = async (blockId) => {
    const blockState = editingBlocks[blockId];
    if (!blockState) return;

    setSavingBlockId(blockId);
    try {
      const res = await fetch(`/api/ai-proposal/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: blockState.content,
          user_comment: blockState.comment,
          is_approved: blockState.approved,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan draf blok.");
      }
      addToast("Konten draf blok berhasil disimpan.", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSavingBlockId(null);
    }
  };

  const handleImportTimeline = async (e) => {
    const file = e.target.files[0];
    if (!file || !draft) return;

    setUploadingTimeline(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/ai-proposal/import-timeline/${draft.id}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal meng-import timeline.");
      }
      addToast("Timeline berhasil di-import! Blok DURATION & COMMERCIAL telah diperbarui.", "success");

      // Reload draft
      await loadDraftDetails(draft.id);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setUploadingTimeline(false);
    }
  };

  const handleDownloadDocx = () => {
    if (!draft) return;
    window.open(`/api/ai-proposal/export/${draft.id}`, "_blank");
  };

  const approvedCount = draft?.blocks?.filter((b) => editingBlocks[b.id]?.approved).length || 0;
  const totalBlocks = draft?.blocks?.length || 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11.5px] font-medium uppercase tracking-wider text-foreground-subtle">Proposal untuk</div>
          <h2 className="m-0 mb-1 text-lg font-medium text-foreground">{tender.title}</h2>
          <p className="m-0 text-[13px] text-foreground-muted">{tender.agency} · {formatCurrency(tender.budgetEstimated)}</p>
        </div>
        <Button variant="neutral" onClick={onBack} className="shrink-0">
          <ChevronLeft size={15} />
          Kembali ke Detail
        </Button>
      </div>

      {/* Setup phase */}
      {phase === "setup" && (
        <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-surface px-5 py-4.5">
          <div className="mb-1 flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-accent text-white">
              <Sparkles size={26} />
            </div>
            <div>
              <h3 className="m-0 mb-1 text-base font-medium text-foreground">Interactive AI Proposal Generator</h3>
              <p className="m-0 text-[13px] text-foreground-muted">Sesuaikan persyaratan user, pilih template visual, lalu Project Maker akan membuat draf proposal per-section secara otomatis.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Pilih Template Proposal</Label>
              <Select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                {templates.length === 0 ? (
                  <option value="">Menggunakan default blank template</option>
                ) : (
                  templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                )}
              </Select>
            </div>

            <div>
              <Label>Nama Perusahaan Pengusul</Label>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Mis. PT Cliste Rekayasa Indonesia"
              />
            </div>
          </div>

          <div>
            <Label>Panduan / Requirements Tambahan dari User (Opsional)</Label>
            <textarea
              className="block w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground placeholder:text-foreground-subtle transition-colors duration-150 hover:border-foreground-subtle focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_var(--accent-active)]"
              rows={3}
              value={userRequirements}
              onChange={(e) => setUserRequirements(e.target.value)}
              placeholder="Mis. Fokuskan pada keahlian FEED laut dalam, sebutkan garansi pemeliharaan 6 bulan, gunakan gaya penulisan formal..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-surface-hover px-3.5 py-2.5 text-[12.5px] text-foreground-muted">
            <div className="flex items-center gap-2">
              <Shield size={15} />
              <span>Masking data sensitif otomatis diaktifkan untuk menjaga kerahasiaan PII.</span>
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={useMasking}
                onChange={(e) => setUseMasking(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              Gunakan Masking
            </label>
          </div>

          <div>
            <Button onClick={handleGenerate}>
              <Sparkles size={16} />
              Generate Proposal Draf
            </Button>
          </div>
        </div>
      )}

      {/* Generating phase */}
      {phase === "generating" && (
        <div className="rounded-[14px] border border-border bg-surface px-6 py-8 text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-accent" />
          <h3 className="mb-2 text-base font-medium text-foreground">Sedang Menyusun Proposal…</h3>
          <p className="mb-5 text-[13px] text-foreground-muted">Silakan tunggu beberapa saat sementara AI menyusun dokumen.</p>
          <div className="mx-auto flex max-w-md flex-col gap-2.5 text-left">
            {GEN_STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[13.5px] ${
                  i < genStep
                    ? "bg-[#e7f6ed] text-[#15803d]"
                    : i === genStep
                    ? "bg-accent-soft font-medium text-foreground"
                    : "bg-surface-hover text-foreground-muted"
                }`}
              >
                {i < genStep ? (
                  <Check size={15} className="shrink-0 text-[#15803d]" />
                ) : (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-current text-[11px] font-medium">
                    {i + 1}
                  </span>
                )}
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready phase */}
      {phase === "ready" && draft && (
        <div className="flex flex-col gap-4">
          {/* Top Actions & Timeline Importer */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-50 flex-1">
                <div className="mb-1.5 text-xs text-foreground-muted">
                  Persetujuan Blok: <span className="font-medium text-foreground">{approvedCount}</span> dari {totalBlocks} bagian
                </div>
                <div className="h-1.5 rounded bg-border">
                  <div
                    className="h-full rounded bg-[#22c55e] transition-[width] duration-300 ease-out"
                    style={{ width: `${totalBlocks > 0 ? (approvedCount / totalBlocks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="neutral" size="sm" onClick={() => setPhase("setup")}>
                  Konfigurasi Ulang
                </Button>
                <Button size="sm" onClick={handleDownloadDocx}>
                  <Download size={14} />
                  Unduh Dokumen Word (.docx)
                </Button>
              </div>
            </div>

            {/* Excel Timeline Importer */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-foreground">Timeline Proyek</span>
                <span className="text-[11.5px] text-foreground-muted">
                  (Daftar timeline Excel ter-import otomatis memperbarui tabel jadwal proposal)
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <a
                  href={`${process.env.NEXT_PUBLIC_SCRAPER_API_URL || "http://localhost:8000"}/api/v1/proposals/timeline-template`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Unduh Templat Excel
                </a>
                <label className="inline-flex h-7.5 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-hover px-3 text-xs font-medium text-foreground-muted transition-colors duration-120 ease-out hover:text-foreground">
                  {uploadingTimeline ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      Unggah Timeline Excel (.xlsx)
                    </>
                  )}
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportTimeline} disabled={uploadingTimeline} />
                </label>
              </div>
            </div>
          </div>

          {/* Proposal draft block lists */}
          <div className="flex flex-col gap-3">
            {draft.blocks?.map((b) => {
              const bState = editingBlocks[b.id] || { content: b.content, comment: b.user_comment || "", approved: b.is_approved };
              return (
                <div key={b.id} className={`rounded-[14px] border-2 p-4.5 ${bState.approved ? "border-[#22c55e] bg-[#f0fdf4]" : "border-border"}`}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h4 className="m-0 text-sm font-medium text-foreground">{b.title}</h4>
                    <div className="flex items-center gap-2">
                      {bState.approved && (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#15803d]">
                          <Check size={12} />
                          Disetujui
                        </span>
                      )}
                      <button
                        onClick={() => handleBlockChange(b.id, "approved", !bState.approved)}
                        title={bState.approved ? "Batalkan persetujuan" : "Setujui bagian ini"}
                        className="grid h-7.5 w-7.5 place-items-center rounded-lg text-foreground-muted transition-colors duration-120 ease-out hover:bg-surface-hover hover:text-foreground"
                      >
                        <Check size={15} className={bState.approved ? "text-[#15803d]" : ""} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col gap-2.5">
                    <div>
                      <Label className="text-[11px]">Isi Konten Blok</Label>
                      <textarea
                        className="block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] leading-[1.6] text-foreground transition-colors duration-150 hover:border-foreground-subtle focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_var(--accent-active)]"
                        rows={6}
                        value={bState.content}
                        onChange={(e) => handleBlockChange(b.id, "content", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <Label className="text-[11px]">Catatan Penyesuaian Tim / Revisi</Label>
                        <Input
                          type="text"
                          value={bState.comment}
                          onChange={(e) => handleBlockChange(b.id, "comment", e.target.value)}
                          placeholder="Tulis catatan revisi untuk audit tim..."
                          className="text-xs"
                        />
                      </div>

                      <Button variant="neutral" size="sm" className="h-9.5" onClick={() => handleSaveBlock(b.id)} disabled={savingBlockId === b.id}>
                        {savingBlockId === b.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save size={13} />
                            Simpan Bagian
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2.5 rounded-[14px] border border-border bg-surface px-5 py-4.5">
                    <div className="mb-3.5">
                      <h3 className="text-[13px] font-medium text-foreground">Komentar</h3>
                    </div>
                    <CommentThread
                      entityType="proposal_block"
                      entityId={b.id}
                      currentUserId={currentUserId}
                      revalidatePathTarget={`/tenders/${tender.id}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
