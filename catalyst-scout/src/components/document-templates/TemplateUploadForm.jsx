"use client";

import { useState } from "react";
import { uploadDocumentTemplate } from "@/actions/documentTemplateActions";
import { GENERATED_DOCUMENT_TYPES, GENERATED_DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";
import { useToast } from "@/components/ui/ToastProvider";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import AiSectionsEditor from "./AiSectionsEditor";

export default function TemplateUploadForm({ onDone }) {
  const { addToast } = useToast();
  const [documentType, setDocumentType] = useState(GENERATED_DOCUMENT_TYPES[0]);
  const [file, setFile] = useState(null);
  const [pending, setPending] = useState(false);
  const [uploaded, setUploaded] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", documentType);

    setPending(true);
    const result = await uploadDocumentTemplate(fd);
    setPending(false);

    if (result.success) {
      addToast("Template berhasil diupload", "success");
      setUploaded(result.data);
    } else {
      addToast(result.error ?? "Gagal upload template", "error");
    }
  }

  if (uploaded) {
    return (
      <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4">
        <p className="text-sm text-foreground">
          Template <span className="font-medium">{uploaded.name}</span> berhasil diupload.
        </p>
        <AiSectionsEditor
          templateId={uploaded.id}
          initialSections={uploaded.ai_sections ?? []}
          headingSuggestions={(uploaded.headings ?? []).filter((h) => h.level === 1).map((h) => h.text)}
          onSaved={() => {
            setUploaded(null);
            setFile(null);
            onDone?.();
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="dt-type">Jenis Dokumen *</Label>
          <Select id="dt-type" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            {GENERATED_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{GENERATED_DOCUMENT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="dt-file">File .docx *</Label>
          <input
            id="dt-file"
            type="file"
            accept=".docx"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-surface-hover file:px-2 file:py-1 file:text-[12px] file:text-foreground-muted"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>Upload Template</Button>
      </div>
    </form>
  );
}
