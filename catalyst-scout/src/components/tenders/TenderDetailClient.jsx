"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDeadline, formatDate, formatSource, STATUS_LABELS } from "@/lib/formatters";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { updateTenderStatus, addTenderNote } from "@/actions/tenderActions";
import { useToast } from "@/components/ui/ToastProvider";
import ScoreBadge from "@/components/tenders/ScoreBadge";

const STATUS_TONE = {
  DITEMUKAN: "slate", DITINJAU: "blue", DIKEJAR: "amber",
  DISERAHKAN: "violet", MENANG: "green", KALAH: "red", BATAL: "zinc",
};

// Parse notes string → array of note objects
function parseNotes(notesStr) {
  if (!notesStr) return [];
  return notesStr.split("\n---\n").filter(Boolean).map((entry) => {
    const match = entry.match(/^\[(.+?)\] (.+?): (.+)$/s);
    if (match) return { time: match[1], author: match[2], text: match[3].trim() };
    return { time: "", author: "Tim", text: entry.trim() };
  });
}

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function TenderDetailClient({ tender }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [notesPending, setNotesPending] = useState(false);
  const [proposalView, setProposalView] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const deadline = formatDeadline(tender.deadlineDate);
  const notes = parseNotes(tender.notes);

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
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal mengubah status", "error");
    }
  }

  async function handleAddNote() {
    if (!noteDraft.trim()) return;
    setNotesPending(true);
    const res = await addTenderNote(tender.id, noteDraft.trim());
    setNotesPending(false);
    if (res.success) {
      addToast("Catatan ditambahkan", "success");
      setNoteDraft("");
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal menyimpan catatan", "error");
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
    return <ProposalView tender={tender} onBack={() => setProposalView(false)} />;
  }

  return (
    <div className="detail-grid">
      {/* ── MAIN COLUMN ── */}
      <div className="detail-main">
        {/* Header card */}
        <div className="panel">
          <div className="dh-top">
            <span className={`source-chip src-${(tender.source ?? "manual").toLowerCase()}`}>
              {formatSource(tender.source)}
            </span>
            {tender.sourceId && <span className="mono-id">TND-{tender.sourceId}</span>}
            <Link href="/tenders" style={{ fontSize: 12.5, color: "var(--foreground-muted)", textDecoration: "none" }}>← Tenders</Link>
            {tender.sourceUrl && (
              <a className="ext-link" href={tender.sourceUrl} target="_blank" rel="noreferrer">
                Buka sumber
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
              </a>
            )}
          </div>
          <h2 className="dh-title">{tender.title}</h2>
          {tender.agency && (
            <div className="dh-agency">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>
              {tender.agency}
            </div>
          )}
          <div className="dh-meta">
            <div className="dh-meta-item">
              <span className="meta-label">Estimasi Nilai</span>
              <span className="meta-val">{formatCurrency(tender.budgetEstimated)}</span>
            </div>
            <div className="dh-meta-item">
              <span className="meta-label">Tenggat</span>
              <span className={`meta-val ${deadline.isUrgent ? "text-danger" : ""}`}>
                {deadline.label}
              </span>
            </div>
            <div className="dh-meta-item">
              <span className="meta-label">Skor Relevansi</span>
              <span className="meta-val"><ScoreBadge score={tender.matchScore} recommendation={tender.recommendation} /></span>
            </div>
            <div className="dh-meta-item">
              <span className="meta-label">Ditemukan</span>
              <span className="meta-val">{formatDate(tender.scrapedAt)}</span>
            </div>
            {sourceMetadata.tkdn_percentage != null && (
              <div className="dh-meta-item">
                <span className="meta-label text-success">Kadar TKDN</span>
                <span className="meta-val text-success">{sourceMetadata.tkdn_percentage}%</span>
              </div>
            )}
          </div>
        </div>

        {/* KBLI Matching */}
        <div className="panel">
          <div className="panel-head">
            <h3>Pencocokan KBLI</h3>
            <span className="ai-tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>
              AI semantic match
            </span>
          </div>
          <div className="kbli-matches">
            {kbliMatched.length === 0 ? (
              <p className="text-sm text-foreground-subtle" style={{ margin: 0 }}>
                Belum ada KBLI yang cocok. Jalankan Ekstraksi PDF pada lampiran dokumen untuk mendeteksi kode KBLI.
              </p>
            ) : (
              kbliMatched.map((m) => {
                const scoreVal = m.score != null ? m.score : 0;
                const pct = Math.round(scoreVal * 100);
                const tone = pct >= 70 ? "high" : pct >= 40 ? "mid" : "low";
                return (
                  <div key={m.kbli_code || m.kbliCode} className="kbli-match">
                    <span className="kbli-code">{m.kbli_code || m.kbliCode}</span>
                    <div className="kbli-match-body">
                      <div className="kbli-desc">{m.description}</div>
                      <div className="kbli-bar"><div className={`kbli-fill fill-${tone}`} style={{ width: pct + "%" }} /></div>
                    </div>
                    <span className={`kbli-pct pct-${tone}`}>{pct}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attachment files & deep PDF extraction */}
        {docFiles.length > 0 && (
          <div className="panel">
            <div className="panel-head">
              <h3>Lampiran Dokumen ({docFiles.length})</h3>
              <button
                onClick={handleExtractPdf}
                disabled={extracting}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6 }}
              >
                {extracting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengekstrak...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    Ekstrak KBLI & TKDN
                  </>
                )}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {docFiles.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface-hover)",
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--foreground)", maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.file_name}
                  </span>
                  {doc.download_url && (
                    <a
                      href={doc.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "4px 10px", fontSize: 12 }}
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
          <div className="panel">
            <div className="panel-head"><h3>Deskripsi &amp; Persyaratan</h3></div>
            <p className="tender-text" style={{ whiteSpace: "pre-line" }}>{tender.description}</p>
          </div>
        )}

        {/* Notes */}
        <div className="panel">
          <div className="panel-head">
            <h3>Catatan Tim</h3>
            <span style={{ fontSize: 13, color: "var(--foreground-subtle)", fontWeight: 700 }}>{notes.length}</span>
          </div>
          <div className="notes-list">
            {notes.length === 0 && <p style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>Belum ada catatan. Tambahkan diskusi tim di bawah.</p>}
            {notes.map((n, i) => (
              <div key={i} className="note">
                <div className="note-avatar">{getInitials(n.author)}</div>
                <div className="note-body">
                  <div className="note-meta">
                    <strong>{n.author}</strong>
                    {n.time && <span className="note-time">{n.time}</span>}
                  </div>
                  <p className="note-text">{n.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="note-compose">
            <textarea
              className="input" rows={2} value={noteDraft} placeholder="Tulis catatan…"
              onChange={(e) => setNoteDraft(e.target.value)}
              style={{ resize: "none", fontFamily: "inherit", fontSize: 13 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleAddNote} disabled={!noteDraft.trim() || notesPending} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                {notesPending ? "Menyimpan…" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SIDE COLUMN ── */}
      <div className="detail-side">
        {/* Status & Aksi */}
        <div className="panel action-panel">
          <div className="panel-head"><h3>Status &amp; Aksi</h3></div>
          <div className="current-status">
            <span style={{ fontSize: 12, color: "var(--foreground-muted)", fontWeight: 600 }}>Status saat ini</span>
            <span className={`badge badge-${STATUS_TONE[tender.status] ?? "slate"}`} style={{ gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {STATUS_LABELS[tender.status] ?? tender.status}
            </span>
          </div>

          {/* Status picker */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <button className="status-picker-btn" onClick={() => setStatusMenuOpen((v) => !v)}>
              Ubah status
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
            </button>
            {statusMenuOpen && (
              <div className="status-menu" style={{ top: 46, left: 0, right: 0 }}>
                {VALID_TENDER_STATUSES.filter((s) => s !== tender.status).map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--foreground)", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    {STATUS_LABELS[s] ?? s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button className="btn btn-primary btn-md full" onClick={() => setProposalView(true)} style={{ gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15h6" /></svg>
              Generate Proposal
            </button>
            {tender.status === "DITEMUKAN" && (
              <button className="btn btn-secondary btn-md full" onClick={() => handleStatusChange("DITINJAU")} style={{ gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                Promote ke Lead
              </button>
            )}
          </div>
        </div>

        {/* Riwayat Status */}
        <div className="panel">
          <div className="panel-head"><h3>Riwayat Status</h3></div>
          <div className="timeline">
            {[
              { status: tender.status, at: tender.updatedAt ?? tender.scrapedAt, by: "Sistem" },
              { status: "DITEMUKAN", at: tender.scrapedAt, by: "Scraper" },
            ].map((h, i) => {
              const tone = STATUS_TONE[h.status] ?? "slate";
              return (
                <div key={i} className="tl-item">
                  <span className={`tl-dot tl-${tone}`} />
                  <div>
                    <div className="tl-status">{STATUS_LABELS[h.status] ?? h.status}</div>
                    <div className="tl-meta">{formatDate(h.at)} · {h.by}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Proposal View ── */
function ProposalView({ tender, onBack }) {
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
    <div className="prop-screen">
      {/* Header */}
      <div className="prop-header">
        <div>
          <div className="prop-context-label">Proposal untuk</div>
          <h2 className="prop-tender-title">{tender.title}</h2>
          <p className="prop-tender-meta">{tender.agency} · {formatCurrency(tender.budgetEstimated)}</p>
        </div>
        <button className="btn btn-secondary btn-md" onClick={onBack} style={{ gap: 7, flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          Kembali ke Detail
        </button>
      </div>

      {/* Setup phase */}
      {phase === "setup" && (
        <div className="panel prop-setup">
          <div className="ai-hero">
            <div className="ai-hero-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>
            </div>
            <div>
              <h3>Interactive AI Proposal Generator</h3>
              <p>Sesuaikan persyaratan user, pilih template visual, lalu Catalyst akan membuat draf proposal per-section secara otomatis.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label className="field-label">Pilih Template Proposal</label>
              <div className="select-wrap">
                <select
                  className="input select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  {templates.length === 0 ? (
                    <option value="">Menggunakan default blank template</option>
                  ) : (
                    templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
                <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Nama Perusahaan Pengusul</label>
              <input
                type="text"
                className="input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Mis. PT Cliste Rekayasa Indonesia"
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Panduan / Requirements Tambahan dari User (Opsional)</label>
            <textarea
              className="input"
              rows={3}
              value={userRequirements}
              onChange={(e) => setUserRequirements(e.target.value)}
              placeholder="Mis. Fokuskan pada keahlian FEED laut dalam, sebutkan garansi pemeliharaan 6 bulan, gunakan gaya penulisan formal..."
              style={{ resize: "none", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifycontent: "space-between" }} className="masking-note">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span>Masking data sensitif otomatis diaktifkan untuk menjaga kerahasiaan PII.</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
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
            <button onClick={handleGenerate} className="btn btn-primary btn-md" style={{ gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" /></svg>
              Generate Proposal Draf
            </button>
          </div>
        </div>
      )}

      {/* Generating phase */}
      {phase === "generating" && (
        <div className="panel" style={{ textAlign: "center", padding: "32px 24px" }}>
          <div className="gen-spinner" />
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Sedang Menyusun Proposal…</h3>
          <p style={{ fontSize: 13, color: "var(--foreground-muted)", marginBottom: 20 }}>Silakan tunggu beberapa saat sementara AI menyusun dokumen.</p>
          <div className="gen-steps">
            {GEN_STEPS.map((s, i) => (
              <div key={i} className={`gen-step ${i < genStep ? "done" : i === genStep ? "active" : ""}`}>
                {i < genStep ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : (
                  <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid currentColor", display: "inline-grid", placeItems: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
                )}
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready phase */}
      {phase === "ready" && draft && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Top Actions & Timeline Importer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: "var(--foreground-muted)", marginBottom: 5 }}>
                  Persetujuan Blok: <strong>{approvedCount}</strong> dari {totalBlocks} bagian
                </div>
                <div className="prop-track">
                  <div className="prop-fill" style={{ width: `${totalBlocks > 0 ? (approvedCount / totalBlocks) * 100 : 0}%` }} />
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPhase("setup")} style={{ gap: 6 }}>
                  Konfigurasi Ulang
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleDownloadDocx} style={{ gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  Unduh Dokumen Word (.docx)
                </button>
              </div>
            </div>

            {/* Excel Timeline Importer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 12, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>Timeline Proyek</span>
                <span style={{ fontSize: 11.5, color: "var(--foreground-muted)" }}>
                  (Daftar timeline Excel ter-import otomatis memperbarui tabel jadwal proposal)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a
                  href={`${process.env.NEXT_PUBLIC_SCRAPER_API_URL || "http://localhost:8000"}/api/v1/proposals/timeline-template`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline font-semibold"
                >
                  Unduh Templat Excel
                </a>
                <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", gap: 6 }}>
                  {uploadingTimeline ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      Unggah Timeline Excel (.xlsx)
                    </>
                  )}
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportTimeline} disabled={uploadingTimeline} />
                </label>
              </div>
            </div>
          </div>

          {/* Proposal draft block lists */}
          <div className="prop-blocks">
            {draft.blocks?.map((b) => {
              const bState = editingBlocks[b.id] || { content: b.content, comment: b.user_comment || "", approved: b.is_approved };
              return (
                <div key={b.id} className={`prop-block ${bState.approved ? "approved" : ""}`}>
                  <div className="pb-head">
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)" }}>{b.title}</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {bState.approved && (
                        <span className="approved-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          Disetujui
                        </span>
                      )}
                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30 }}
                        onClick={() => handleBlockChange(b.id, "approved", !bState.approved)}
                        title={bState.approved ? "Batalkan persetujuan" : "Setujui bagian ini"}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={bState.approved ? "#15803d" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                    <div className="field">
                      <label className="field-label" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>Isi Konten Blok</label>
                      <textarea
                        className="input"
                        rows={6}
                        value={bState.content}
                        onChange={(e) => handleBlockChange(b.id, "content", e.target.value)}
                        style={{ fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.6 }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                      <div className="field">
                        <label className="field-label" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>Catatan Penyesuaian Tim / Revisi</label>
                        <input
                          type="text"
                          className="input"
                          value={bState.comment}
                          onChange={(e) => handleBlockChange(b.id, "comment", e.target.value)}
                          placeholder="Tulis catatan revisi untuk audit tim..."
                          style={{ fontSize: 12.5 }}
                        />
                      </div>
                      
                      <button
                        onClick={() => handleSaveBlock(b.id)}
                        disabled={savingBlockId === b.id}
                        className="btn btn-secondary btn-sm"
                        style={{ height: 38, gap: 6 }}
                      >
                        {savingBlockId === b.id ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            Simpan Bagian
                          </>
                        )}
                      </button>
                    </div>
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
