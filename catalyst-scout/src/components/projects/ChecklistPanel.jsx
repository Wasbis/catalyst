"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, FileText } from "lucide-react";
import { createChecklistItem, updateChecklistItem, deleteChecklistItem } from "@/actions/projectActions";
import { generateDocument } from "@/actions/generatedDocumentActions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  VALID_CHECKLIST_CATEGORIES,
  CHECKLIST_CATEGORY_LABELS,
  VALID_CHECKLIST_STATUSES,
  CHECKLIST_STATUS_LABELS,
} from "@/lib/projectStatus";
import { CHECKLIST_LABEL_TO_DOCUMENT_TYPE, GENERATED_DOCUMENT_TYPE_LABELS, buildEntityData } from "@/lib/documentTypes";
import DocumentBlockEditor from "@/components/documents/DocumentBlockEditor";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const STATUS_BADGE = {
  belum: "neutral",
  sudah: "active",
  expired: "lewati",
};

export default function ChecklistPanel({ projectId, phaseId = null, items, title = "Checklist Dokumen", project = null, phase = null, activeDocumentTypes = [] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (phaseId != null) fd.set("phaseId", String(phaseId));
    setPending(true);
    const res = await createChecklistItem(projectId, fd);
    setPending(false);
    if (res.success) {
      addToast("Item checklist ditambahkan", "success");
      e.target.reset();
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal menambah item", "error");
    }
  }

  async function handleCycleStatus(item) {
    const idx = VALID_CHECKLIST_STATUSES.indexOf(item.status);
    const next = VALID_CHECKLIST_STATUSES[(idx + 1) % VALID_CHECKLIST_STATUSES.length];
    const res = await updateChecklistItem(item.id, { status: next });
    if (res.success) router.refresh();
    else addToast(res.error ?? "Gagal mengubah status", "error");
  }

  async function handleGenerate(item, documentType) {
    if (!project) return;
    setGeneratingId(item.id);
    const res = await generateDocument({
      documentType,
      entityType: phase ? "ProjectPhase" : "Project",
      entityId: phase ? phase.id : project.id,
      entityData: buildEntityData(project, phase),
    });
    setGeneratingId(null);
    if (res.success) {
      addToast("Dokumen berhasil di-generate", "success");
      setActiveDocument({ item, document: res.data });
    } else {
      addToast(res.error ?? "Gagal generate dokumen", "error");
    }
  }

  async function handleDelete(item) {
    const res = await deleteChecklistItem(item.id);
    if (res.success) {
      addToast("Item checklist dihapus", "success");
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal menghapus item", "error");
    }
  }

  return (
    <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
      <div className="mb-3.5"><h3 className="text-sm font-medium text-foreground">{title}</h3></div>

      {items.length === 0 ? (
        <p className="text-[13px] text-foreground-subtle">Belum ada item checklist.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const documentType = CHECKLIST_LABEL_TO_DOCUMENT_TYPE[item.label.trim().toLowerCase()];
            const templateActive = documentType && activeDocumentTypes.includes(documentType);
            return (
              <div key={item.id} className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="neutral" className="uppercase">
                    {CHECKLIST_CATEGORY_LABELS[item.category] ?? item.category}
                  </Badge>
                  <span className="text-[13.5px] font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {documentType && (
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => handleGenerate(item, documentType)}
                      loading={generatingId === item.id}
                      disabled={!templateActive}
                      title={templateActive ? `Generate ${GENERATED_DOCUMENT_TYPE_LABELS[documentType]}` : `Belum ada template aktif untuk ${GENERATED_DOCUMENT_TYPE_LABELS[documentType]}`}
                    >
                      <FileText size={13} strokeWidth={2.2} />
                      Generate Document
                    </Button>
                  )}
                  <button onClick={() => handleCycleStatus(item)} title="Klik untuk ubah status" className="cursor-pointer">
                    <Badge variant={STATUS_BADGE[item.status] ?? "neutral"}>
                      {CHECKLIST_STATUS_LABELS[item.status] ?? item.status}
                    </Badge>
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex h-6.5 w-6.5 items-center justify-center rounded text-foreground-muted hover:bg-surface-hover hover:text-foreground cursor-pointer"
                    aria-label="Hapus item"
                  >
                    <Trash2 className="h-3.25 w-3.25" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeDocument && (
        <div className="mt-3">
          <DocumentBlockEditor
            document={activeDocument.document}
            onClose={() => setActiveDocument(null)}
            onExported={async () => {
              await updateChecklistItem(activeDocument.item.id, { status: "sudah" });
              router.refresh();
            }}
          />
        </div>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-45 flex-1">
          <Label htmlFor="checklist-label">Nama Dokumen</Label>
          <Input id="checklist-label" name="label" required placeholder="Surat Kerja, BAST, dst" />
        </div>
        <div className="w-40">
          <Label htmlFor="checklist-category">Kategori</Label>
          <Select id="checklist-category" name="category" defaultValue="teknis">
            {VALID_CHECKLIST_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CHECKLIST_CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" loading={pending}>
          Tambah
        </Button>
      </form>
    </div>
  );
}
