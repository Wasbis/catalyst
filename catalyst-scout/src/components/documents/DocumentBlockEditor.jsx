"use client";

import { useState } from "react";
import { RefreshCw, Download, X } from "lucide-react";
import {
  updateDocumentBlock,
  regenerateDocumentBlock,
  exportDocument,
} from "@/actions/generatedDocumentActions";
import { useToast } from "@/components/ui/ToastProvider";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const SOURCE_BADGE = {
  data: "neutral",
  ai: "active",
  manual: "tinjau",
};

const SOURCE_LABEL = {
  data: "Data",
  ai: "AI",
  manual: "Manual",
};

function downloadBase64(filename, base64) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function BlockRow({ block, onUpdated }) {
  const { addToast } = useToast();
  const [content, setContent] = useState(block.content);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);
    const res = await updateDocumentBlock(block.id, { content });
    setPending(false);
    if (res.success) {
      addToast("Section tersimpan", "success");
      setEditing(false);
      onUpdated(res.data);
    } else {
      addToast(res.error ?? "Gagal menyimpan section", "error");
    }
  }

  async function handleRegenerate() {
    setPending(true);
    const res = await regenerateDocumentBlock(block.id);
    setPending(false);
    if (res.success) {
      addToast("Section di-generate ulang", "success");
      setContent(res.data.content);
      onUpdated(res.data);
    } else {
      addToast(res.error ?? "Gagal regenerate section", "error");
    }
  }

  return (
    <div className="rounded-[10px] border border-border px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-medium text-foreground">{block.title}</span>
        <div className="flex items-center gap-1.5">
          <Badge variant={SOURCE_BADGE[block.source] ?? "neutral"}>{SOURCE_LABEL[block.source] ?? block.source}</Badge>
          {block.source === "ai" && (
            <Button variant="neutral" size="sm" onClick={handleRegenerate} loading={pending}>
              <RefreshCw size={13} strokeWidth={2.2} />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {block.source === "data" ? (
        <p className="whitespace-pre-wrap text-[13px] text-foreground-muted">{block.content}</p>
      ) : editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex justify-end gap-1.5">
            <Button variant="neutral" size="sm" onClick={() => { setEditing(false); setContent(block.content); }}>Batal</Button>
            <Button size="sm" onClick={handleSave} loading={pending}>Simpan</Button>
          </div>
        </div>
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="cursor-text whitespace-pre-wrap text-[13px] text-foreground-muted hover:text-foreground"
          title="Klik untuk edit"
        >
          {content || "(kosong — klik untuk isi)"}
        </p>
      )}
    </div>
  );
}

export default function DocumentBlockEditor({ document: doc, onClose, onExported }) {
  const { addToast } = useToast();
  const [blocks, setBlocks] = useState(doc.blocks ?? []);
  const [exporting, setExporting] = useState(false);

  function handleBlockUpdated(updated) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  async function handleExport() {
    setExporting(true);
    const res = await exportDocument(doc.id);
    setExporting(false);
    if (res.success) {
      downloadBase64(res.data.filename, res.data.base64);
      addToast("Dokumen berhasil di-export", "success");
      onExported?.();
    } else {
      addToast(res.error ?? "Gagal export dokumen", "error");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="m-0 text-sm font-medium text-foreground">{doc.tender_title ?? "Dokumen"}</h4>
        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={handleExport} loading={exporting}>
            <Download size={13} strokeWidth={2.2} />
            Export .docx
          </Button>
          {onClose && (
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-surface-hover hover:text-foreground cursor-pointer" aria-label="Tutup">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {blocks.length === 0 ? (
          <p className="text-[13px] text-foreground-subtle">Belum ada section.</p>
        ) : (
          blocks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((b) => <BlockRow key={b.id} block={b} onUpdated={handleBlockUpdated} />)
        )}
      </div>
    </div>
  );
}
