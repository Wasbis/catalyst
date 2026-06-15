"use client";

import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { getProposalDraft, updateProposalBlock, importTimeline } from "@/actions/aiActions";
import Button from "@/components/ui/Button";

export default function ProposalEditor({ draftId }) {
  const [draft, setDraft] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingBlockId, setSavingBlockId] = useState(null);

  const fileInputRef = useRef(null);
  const [isUploadingTimeline, setIsUploadingTimeline] = useState(false);

  async function loadDraft() {
    setIsLoading(true);
    const res = await getProposalDraft(draftId);
    if (res.success && res.data) {
      setDraft(res.data.draft);
      setBlocks(res.data.blocks || []);
    } else {
      alert("Gagal memuat draft proposal.");
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (draftId) setTimeout(loadDraft, 0);
  }, [draftId]);

  const handleBlockChange = (blockId, newContent) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b));
  };

  const handleSaveBlock = async (blockId, content) => {
    setSavingBlockId(blockId);
    const res = await updateProposalBlock(blockId, { content });
    setSavingBlockId(null);
    if (!res.success) {
      alert("Gagal menyimpan blok: " + res.error);
    }
  };

  const handleImportTimeline = async (e) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    setIsUploadingTimeline(true);
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);

    const res = await importTimeline(draftId, formData);
    setIsUploadingTimeline(false);

    if (res.success) {
      alert("Timeline berhasil diimpor.");
      fileInputRef.current.value = "";
      loadDraft();
    } else {
      alert("Gagal impor timeline: " + res.error);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-foreground-muted">Memuat editor proposal...</div>;
  }

  if (!draft) {
    return <div className="py-12 text-center text-danger">Draft tidak ditemukan.</div>;
  }

  return (
    <div className="mx-auto mt-4 flex max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground">Review Proposal</h2>
          <p className="mt-1 text-sm text-foreground-muted">Status: {draft.status} | Dibuat: {new Date(draft.created_at).toLocaleString("id-ID")}</p>
        </div>
        <a href={`/api/proposals/${draftId}/export`} download target="_blank" rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-medium text-white transition-all duration-120 ease-out hover:opacity-92 active:scale-[0.97]">
          <Download size={16} strokeWidth={2} />
          Download DOCX
        </a>
      </div>

      <div className="rounded-[14px] border border-border border-l-4 border-l-accent bg-accent-soft p-6">
        <h3 className="mb-2 font-medium text-foreground">Import Timeline Excel</h3>
        <p className="mb-4 text-sm text-foreground-muted">
          Anda dapat menyusun jadwal secara offline menggunakan Excel dan mengimpornya kembali. Data akan disisipkan secara otomatis saat *download* DOCX.
        </p>
        <div className="flex items-center gap-4">
          <a href="/api/proposals/timeline-template" download
            className="inline-flex h-7.5 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground">
            Download Template Excel
          </a>
          <form onSubmit={handleImportTimeline} className="flex items-center gap-2">
            <input type="file" accept=".xlsx" ref={fileInputRef} className="cursor-pointer text-sm file:mr-4 file:rounded file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-accent" />
            <Button type="submit" size="sm" loading={isUploadingTimeline}>
              Import
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {blocks.map(block => (
          <div key={block.id} className="rounded-[14px] border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium text-accent">{block.section_name}</h4>
              <button
                onClick={() => handleSaveBlock(block.id, block.content)}
                className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-white"
                disabled={savingBlockId === block.id}
              >
                {savingBlockId === block.id ? "Menyimpan..." : "Simpan Blok"}
              </button>
            </div>
            <textarea
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/12"
              rows={Math.max(5, (block.content || "").split("\n").length)}
              value={block.content || ""}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
