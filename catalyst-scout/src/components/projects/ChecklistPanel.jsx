"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChecklistItem, updateChecklistItem, deleteChecklistItem } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  VALID_CHECKLIST_CATEGORIES,
  CHECKLIST_CATEGORY_LABELS,
  VALID_CHECKLIST_STATUSES,
  CHECKLIST_STATUS_LABELS,
} from "@/lib/projectStatus";

const STATUS_BADGE = {
  belum: "badge-zinc",
  sudah: "badge-green",
  expired: "badge-red",
};

export default function ChecklistPanel({ projectId, phaseId = null, items, title = "Checklist Dokumen" }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);

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
    <div className="panel">
      <div className="panel-head"><h3>{title}</h3></div>

      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>Belum ada item checklist.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-slate" style={{ textTransform: "uppercase", fontSize: 10 }}>
                  {CHECKLIST_CATEGORY_LABELS[item.category] ?? item.category}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{item.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => handleCycleStatus(item)}
                  className={`badge ${STATUS_BADGE[item.status] ?? "badge-zinc"}`}
                  style={{ border: "none", cursor: "pointer" }}
                  title="Klik untuk ubah status"
                >
                  {CHECKLIST_STATUS_LABELS[item.status] ?? item.status}
                </button>
                <button onClick={() => handleDelete(item)} className="icon-btn" style={{ width: 26, height: 26 }} aria-label="Hapus item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <label className="field-label">Nama Dokumen</label>
          <input name="label" required className="input" placeholder="Surat Kerja, BAST, dst" />
        </div>
        <div className="field" style={{ width: 160 }}>
          <label className="field-label">Kategori</label>
          <div className="select-wrap">
            <select name="category" className="input select" defaultValue="teknis">
              {VALID_CHECKLIST_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CHECKLIST_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary btn-md">
          {pending ? "Menyimpan…" : "Tambah"}
        </button>
      </form>
    </div>
  );
}
