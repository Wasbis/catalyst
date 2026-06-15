"use client";

import { Fragment, useState } from "react";
import { updateDocumentTemplate, deleteDocumentTemplate, getDocumentTemplateHeadings } from "@/actions/documentTemplateActions";
import { GENERATED_DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";
import { useToast } from "@/components/ui/ToastProvider";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AiSectionsEditor from "./AiSectionsEditor";
import FieldMapperEditor from "./FieldMapperEditor";

const TABLE_HEADERS = ["Nama", "Jenis Dokumen", "AI Sections", "Status", "Aksi"];

export default function TemplateList({ templates }) {
  const { addToast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [mappingId, setMappingId] = useState(null);
  const [headingsByTemplate, setHeadingsByTemplate] = useState({});
  const [loadingHeadings, setLoadingHeadings] = useState(false);

  async function handleToggleEdit(t) {
    setMappingId(null);
    if (editingId === t.id) {
      setEditingId(null);
      return;
    }
    setEditingId(t.id);
    if (!headingsByTemplate[t.id]) {
      setLoadingHeadings(true);
      const result = await getDocumentTemplateHeadings(t.id);
      setLoadingHeadings(false);
      if (result.success) {
        setHeadingsByTemplate((prev) => ({ ...prev, [t.id]: result.data }));
      } else {
        addToast(result.error ?? "Gagal memuat daftar heading", "error");
      }
    }
  }

  function handleToggleMapping(t) {
    setEditingId(null);
    setMappingId((prev) => (prev === t.id ? null : t.id));
  }

  async function handleToggleActive(t) {
    const result = await updateDocumentTemplate(t.id, { is_active: !t.is_active });
    if (result.success) {
      addToast(t.is_active ? "Template dinonaktifkan" : "Template diaktifkan", "success");
    } else {
      addToast(result.error ?? "Gagal mengubah status", "error");
    }
  }

  async function handleDelete(t) {
    if (!confirm(`Hapus template '${t.name}'?`)) return;
    const result = await deleteDocumentTemplate(t.id);
    if (result.success) {
      addToast("Template berhasil dihapus", "success");
    } else {
      addToast(result.error ?? "Gagal menghapus template", "error");
    }
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-foreground-subtle">
              {TABLE_HEADERS.map((header) => (
                <th key={header} className={`px-4 py-3 font-medium ${header === "Aksi" ? "text-right" : ""}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-foreground-subtle">Belum ada template.</td></tr>
            ) : (
              templates.map((t) => (
                <Fragment key={t.id}>
                  <tr className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="px-4 py-3 align-top font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-3 align-top">{GENERATED_DOCUMENT_TYPE_LABELS[t.document_type] ?? t.document_type}</td>
                    <td className="px-4 py-3 align-top text-foreground-muted">
                      {t.ai_sections?.length ? t.ai_sections.join(", ") : "— (data-fill)"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={t.is_active ? "active" : "neutral"}>
                        {t.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <Button variant="neutral" size="sm" className="mr-1.5" onClick={() => handleToggleEdit(t)}>
                        {editingId === t.id ? "Tutup" : "Edit AI Sections"}
                      </Button>
                      <Button variant="neutral" size="sm" className="mr-1.5" onClick={() => handleToggleMapping(t)}>
                        {mappingId === t.id ? "Tutup" : "Field Mapper"}
                      </Button>
                      <Button variant="neutral" size="sm" className="mr-1.5" onClick={() => handleToggleActive(t)}>
                        {t.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(t)}>Hapus</Button>
                    </td>
                  </tr>
                  {editingId === t.id && (
                    <tr className="border-b border-border bg-surface-hover last:border-0">
                      <td colSpan={5} className="px-4 py-3">
                        {loadingHeadings && !headingsByTemplate[t.id] ? (
                          <p className="text-sm text-foreground-subtle">Memuat daftar heading...</p>
                        ) : (
                          <AiSectionsEditor
                            templateId={t.id}
                            initialSections={t.ai_sections ?? []}
                            headingSuggestions={(headingsByTemplate[t.id] ?? [])
                              .filter((h) => h.level === 1)
                              .map((h) => h.text)}
                            onSaved={() => setEditingId(null)}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                  {mappingId === t.id && (
                    <tr className="border-b border-border bg-surface-hover last:border-0">
                      <td colSpan={5} className="px-4 py-3">
                        <FieldMapperEditor templateId={t.id} onClose={() => setMappingId(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
