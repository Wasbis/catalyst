"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createDocumentCategory, updateDocumentCategory, deactivateDocumentCategory } from "@/actions/documentCategoryActions";
import { useToast } from "@/components/ui/ToastProvider";
import { DOCUMENT_CATEGORY_GROUPS, DOCUMENT_CATEGORY_GROUP_LABELS } from "@/lib/documentTypes";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const TABLE_HEADERS = ["Label", "Slug", "Grup", "Jumlah Dokumen", "Status", "Aksi"];

export default function DocumentCategoryManager({ categories }) {
  const { addToast } = useToast();
  const [editTarget, setEditTarget] = useState(null);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);

    const result = editTarget
      ? await updateDocumentCategory(editTarget?.id, fd)
      : await createDocumentCategory(fd);

    setPending(false);

    if (result.success) {
      addToast(editTarget ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan", "success");
      setEditTarget(null);
      setAdding(false);
    } else {
      addToast(result.error ?? "Gagal menyimpan", "error");
    }
  }

  async function handleToggle(category) {
    const result = await deactivateDocumentCategory(category.id);
    if (result.success) {
      addToast(category.isActive ? "Kategori dinonaktifkan" : "Kategori diaktifkan kembali", "success");
    } else {
      addToast(result.error ?? "Gagal mengubah status", "error");
    }
  }

  const showForm = adding || !!editTarget;

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setEditTarget(null); setAdding(true); }}>
          <Plus size={15} strokeWidth={2.2} />
          Tambah Kategori
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="dc-name">Slug (name) *</Label>
              <Input id="dc-name" name="name" required defaultValue={editTarget?.name} placeholder="kontrak" />
            </div>
            <div>
              <Label htmlFor="dc-label">Label *</Label>
              <Input id="dc-label" name="label" required defaultValue={editTarget?.label} placeholder="Kontrak" />
            </div>
            <div>
              <Label htmlFor="dc-group">Grup</Label>
              <Select id="dc-group" name="group" defaultValue={editTarget?.group ?? ""}>
                <option value="">— Tanpa grup —</option>
                {DOCUMENT_CATEGORY_GROUPS.map((g) => <option key={g} value={g}>{DOCUMENT_CATEGORY_GROUP_LABELS[g]}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="dc-sortOrder">Urutan</Label>
              <Input id="dc-sortOrder" name="sortOrder" type="number" defaultValue={editTarget?.sortOrder ?? 0} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="neutral" onClick={() => { setAdding(false); setEditTarget(null); }}>Batal</Button>
            <Button type="submit" loading={pending}>
              {editTarget ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </div>
        </form>
      )}

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
              {categories.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-foreground-subtle">Belum ada kategori dokumen.</td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="px-4 py-3 align-top font-medium text-foreground">{c.label}</td>
                    <td className="px-4 py-3 align-top text-foreground-muted">{c.name}</td>
                    <td className="px-4 py-3 align-top">{c.group ? DOCUMENT_CATEGORY_GROUP_LABELS[c.group] ?? c.group : "—"}</td>
                    <td className="px-4 py-3 align-top">{c._count?.documents ?? 0}</td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={c.isActive ? "active" : "neutral"}>
                        {c.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <Button variant="neutral" size="sm" className="mr-1.5" onClick={() => { setAdding(false); setEditTarget(c); }}>Edit</Button>
                      <Button variant="neutral" size="sm" onClick={() => handleToggle(c)}>{c.isActive ? "Nonaktifkan" : "Aktifkan"}</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
