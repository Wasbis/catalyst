"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { GENERATED_DOCUMENT_TYPES, GENERATED_DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import TemplateUploadForm from "./TemplateUploadForm";
import TemplateList from "./TemplateList";

export default function DocumentTemplateManager({ templates }) {
  const [filter, setFilter] = useState("");
  const [uploading, setUploading] = useState(false);

  const filtered = filter ? templates.filter((t) => t.document_type === filter) : templates;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs">
          <option value="">Semua Jenis Dokumen</option>
          {GENERATED_DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>{GENERATED_DOCUMENT_TYPE_LABELS[t]}</option>
          ))}
        </Select>
        <Button onClick={() => setUploading((v) => !v)}>
          <Plus size={15} strokeWidth={2.2} />
          {uploading ? "Tutup" : "Upload Template"}
        </Button>
      </div>

      {uploading && <TemplateUploadForm onDone={() => setUploading(false)} />}

      <TemplateList templates={filtered} />
    </>
  );
}
