"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocumentsForEntity } from "@/actions/documentActions";
import { getDocumentCategories } from "@/actions/documentCategoryActions";
import { deleteDocument } from "@/actions/documentActions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDateTime } from "@/lib/formatters";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import DocumentFormModal from "./DocumentFormModal";
import DocumentReferencePicker from "./DocumentReferencePicker";

// Panel embeddable di halaman detail tender/project — list dokumen milik entity ini +
// upload baru + pakai dokumen referensi yang sudah ada.
export default function DocumentUploadPanel({ entityType, entityId }) {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [docs, cats] = await Promise.all([
      getDocumentsForEntity(entityType, entityId),
      getDocumentCategories({ activeOnly: true }),
    ]);
    setDocuments(docs);
    setCategories(cats);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    setTimeout(refresh, 0);
  }, [refresh]);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDocument(deleteTarget?.id);
    setDeleting(false);
    if (result.success) {
      addToast("Dokumen berhasil dihapus", "success");
      setDeleteTarget(null);
      refresh();
    } else {
      addToast(result.error ?? "Gagal menghapus dokumen", "error");
    }
  }

  return (
    <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Dokumen ({documents.length})</h3>
        <div className="flex gap-2">
          <Button variant="neutral" size="sm" onClick={() => setPickerOpen(true)}>Pakai Referensi</Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>Upload</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-foreground-subtle">Memuat dokumen...</p>
      ) : documents.length === 0 ? (
        <p className="text-[13px] text-foreground-subtle">Belum ada dokumen untuk entitas ini.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-[10px] border border-border bg-surface-hover px-3.5 py-2.5">
              <div className="min-w-0">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[13.5px] font-medium text-foreground hover:text-accent">
                  {doc.title}
                </a>
                <div className="mt-0.5 text-xs text-foreground-subtle">
                  {doc.category?.label ?? "Tanpa kategori"} · {formatDateTime(doc.createdAt)}
                </div>
              </div>
              <Button variant="neutral" size="sm" onClick={() => setDeleteTarget(doc)}>Hapus</Button>
            </div>
          ))}
        </div>
      )}

      {uploadOpen && (
        <DocumentFormModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          categories={categories}
          presetEntityType={entityType}
          presetEntityId={entityId}
          onSaved={refresh}
        />
      )}

      {pickerOpen && (
        <DocumentReferencePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          entityType={entityType}
          entityId={entityId}
          onAttached={refresh}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Dokumen"
        message={`Yakin ingin menghapus dokumen "${deleteTarget?.title}"?`}
        confirmLabel="Ya, hapus"
        loading={deleting}
      />
    </div>
  );
}
