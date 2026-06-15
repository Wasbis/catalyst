"use client";

import { useState, useEffect, useCallback } from "react";
import { getReferenceDocuments, createDocument } from "@/actions/documentActions";
import { useToast } from "@/components/ui/ToastProvider";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Modal untuk browse dokumen isReference=true dari entitas lain, lalu "pakai" —
// membuat DocumentRecord baru yang menunjuk ke file yang sama, terkait entitas saat ini.
export default function DocumentReferencePicker({ open, onClose, entityType, entityId, onAttached }) {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attachingId, setAttachingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const docs = await getReferenceDocuments({ excludeEntityType: entityType, excludeEntityId: entityId });
    setDocuments(docs);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    if (open) setTimeout(load, 0);
  }, [open, load]);

  async function handleAttach(doc) {
    setAttachingId(doc.id);
    const fd = new FormData();
    fd.set("title", doc.title);
    fd.set("fileUrl", doc.fileUrl);
    if (doc.categoryId) fd.set("categoryId", String(doc.categoryId));
    if (doc.client) fd.set("client", doc.client);
    if (doc.tags) fd.set("tags", doc.tags);
    fd.set("entityType", entityType);
    fd.set("entityId", String(entityId));

    const result = await createDocument(fd);
    setAttachingId(null);

    if (result.success) {
      addToast("Dokumen referensi berhasil dipakai", "success");
      onAttached?.();
    } else {
      addToast(result.error ?? "Gagal memakai dokumen referensi", "error");
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Pakai Dokumen Referensi"
      size="lg"
      footer={<Button variant="neutral" onClick={onClose}>Tutup</Button>}
    >
      <p className="-mt-2 mb-4 text-xs text-foreground-muted">
        Pilih dokumen referensi dari Document Hub untuk dipakai di entitas ini
      </p>

      {loading ? (
        <p className="text-[13px] text-foreground-subtle">Memuat dokumen referensi...</p>
      ) : documents.length === 0 ? (
        <p className="text-[13px] text-foreground-subtle">Belum ada dokumen referensi tersedia.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-[10px] border border-border px-3.5 py-2.5">
              <div className="min-w-0">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[13.5px] font-medium text-foreground hover:text-accent">
                  {doc.title}
                </a>
                <div className="mt-0.5 text-xs text-foreground-subtle">
                  {doc.category?.label ?? "Tanpa kategori"}{doc.client ? ` · ${doc.client}` : ""}
                </div>
              </div>
              <Button size="sm" disabled={attachingId === doc.id} onClick={() => handleAttach(doc)}>
                {attachingId === doc.id ? "Memproses..." : "Pakai"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
