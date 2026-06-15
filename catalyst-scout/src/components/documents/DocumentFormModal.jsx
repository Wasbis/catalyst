"use client";

import { useState } from "react";
import { createDocument, updateDocument } from "@/actions/documentActions";
import { useToast } from "@/components/ui/ToastProvider";
import { VALID_DOCUMENT_ENTITY_TYPES, DOCUMENT_ENTITY_TYPE_LABELS } from "@/lib/documentTypes";
import Modal from "@/components/ui/Modal";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export default function DocumentFormModal({ open, onClose, categories, doc = null, presetEntityType, presetEntityId, onSaved }) {
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);
  const isEdit = !!doc;

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);

    try {
      let fileUrl = doc?.fileUrl ?? "";
      const file = fd.get("file");

      if (file && file.size > 0) {
        const uploadFd = new FormData();
        uploadFd.set("file", file);
        const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: uploadFd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          addToast(uploadData.error ?? "Gagal upload file", "error");
          setPending(false);
          return;
        }
        fileUrl = uploadData.fileUrl;
      }

      if (!isEdit && !fileUrl) {
        addToast("File wajib diupload.", "error");
        setPending(false);
        return;
      }

      fd.set("fileUrl", fileUrl);
      fd.delete("file");

      const result = isEdit ? await updateDocument(doc?.id, fd) : await createDocument(fd);

      if (result.success) {
        addToast(isEdit ? "Dokumen berhasil diperbarui" : "Dokumen berhasil diupload", "success");
        onSaved?.();
        onClose();
      } else {
        addToast(result.error ?? "Gagal menyimpan", "error");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? "Edit Dokumen" : "Upload Dokumen"}
      size="lg"
    >
      <p className="-mt-2 mb-4 text-xs text-foreground-muted">
        {isEdit ? "Perbarui metadata dokumen" : "Tambah dokumen baru ke Document Hub"}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="df-title">Judul Dokumen *</Label>
            <Input id="df-title" name="title" required defaultValue={doc?.title} placeholder="Contoh: Kontrak Kerjasama PT XYZ 2026" />
          </div>

          <div>
            <Label htmlFor="df-category">Kategori</Label>
            <Select id="df-category" name="categoryId" defaultValue={doc?.categoryId ?? ""}>
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </div>

          <div>
            <Label htmlFor="df-client">Client</Label>
            <Input id="df-client" name="client" defaultValue={doc?.client ?? ""} placeholder="PT Pertamina Hulu Mahakam" />
          </div>

          {!isEdit && presetEntityType && presetEntityId && (
            <>
              <input type="hidden" name="entityType" value={presetEntityType} />
              <input type="hidden" name="entityId" value={presetEntityId} />
              <div className="sm:col-span-2">
                <Label>Terkait</Label>
                <p className="m-0 text-[13px] text-foreground">{DOCUMENT_ENTITY_TYPE_LABELS[presetEntityType] ?? presetEntityType} #{presetEntityId}</p>
              </div>
            </>
          )}

          {!isEdit && !presetEntityType && (
            <>
              <div>
                <Label htmlFor="df-entityType">Terkait Entitas</Label>
                <Select id="df-entityType" name="entityType" defaultValue="">
                  <option value="">— Tidak terkait —</option>
                  {VALID_DOCUMENT_ENTITY_TYPES.map((t) => <option key={t} value={t}>{DOCUMENT_ENTITY_TYPE_LABELS[t]}</option>)}
                </Select>
              </div>

              <div>
                <Label htmlFor="df-entityId">ID Entitas</Label>
                <Input id="df-entityId" name="entityId" type="number" min="1" placeholder="123" />
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <Label htmlFor="df-tags">Tags</Label>
            <Input id="df-tags" name="tags" defaultValue={doc?.tags ?? ""} placeholder="pisahkan dengan koma, contoh: feed, 2026, migas" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="df-file">{isEdit ? "Ganti File (opsional)" : "File *"}</Label>
            <Input id="df-file" name="file" type="file" />
            {isEdit && doc?.fileUrl && (
              <p className="mt-1 text-xs text-foreground-muted">
                File saat ini: <a href={doc?.fileUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">{doc?.fileUrl.split("/").pop()}</a>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="df-isReference"
              name="isReference"
              type="checkbox"
              defaultChecked={doc?.isReference ?? false}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <Label htmlFor="df-isReference" className="mb-0">Jadikan dokumen referensi (bisa dipakai ulang di entitas lain)</Label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="neutral" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={pending}>
            {isEdit ? "Simpan Perubahan" : "Upload"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
