"use client";

import { useState, useEffect, useRef } from "react";
import { getProposalDraft, updateProposalBlock, importTimeline } from "@/actions/aiActions";

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
    if (draftId) loadDraft();
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
    return <div className="text-center py-12 text-foreground-muted">Memuat editor proposal...</div>;
  }

  if (!draft) {
    return <div className="text-center py-12 text-danger">Draft tidak ditemukan.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto mt-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Review Proposal</h2>
          <p className="text-sm text-foreground-muted mt-1">Status: {draft.status} | Dibuat: {new Date(draft.created_at).toLocaleString("id-ID")}</p>
        </div>
        <div className="flex gap-3">
          <a href={`/api/proposals/${draftId}/export`} download className="btn btn-primary" target="_blank" rel="noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
            Download DOCX
          </a>
        </div>
      </div>

      <div className="card p-6 border-l-4 border-l-indigo-500 bg-indigo-50/50">
        <h3 className="font-semibold text-indigo-900 mb-2">Import Timeline Excel</h3>
        <p className="text-sm text-indigo-700 mb-4">
          Anda dapat menyusun jadwal secara offline menggunakan Excel dan mengimpornya kembali. Data akan disisipkan secara otomatis saat *download* DOCX.
        </p>
        <div className="flex items-center gap-4">
          <a href="/api/proposals/timeline-template" download className="btn btn-sm bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50">
            Download Template Excel
          </a>
          <form onSubmit={handleImportTimeline} className="flex gap-2 items-center">
            <input type="file" accept=".xlsx" ref={fileInputRef} className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-100 file:text-indigo-700 cursor-pointer" />
            <button type="submit" disabled={isUploadingTimeline} className="btn btn-sm btn-primary">
              {isUploadingTimeline ? "Mengimpor..." : "Import"}
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {blocks.map(block => (
          <div key={block.id} className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-accent">{block.section_name}</h4>
              <button 
                onClick={() => handleSaveBlock(block.id, block.content)} 
                className="text-xs font-semibold px-3 py-1 bg-accent/10 text-accent rounded-full hover:bg-accent hover:text-white transition-colors"
                disabled={savingBlockId === block.id}
              >
                {savingBlockId === block.id ? "Menyimpan..." : "Simpan Blok"}
              </button>
            </div>
            <textarea 
              className="form-input w-full font-mono text-sm" 
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
