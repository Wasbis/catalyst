"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProjectFromTender } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";

export default function ConvertToProjectModal({ tender }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (tender.convertedToProject && tender.projectId) {
    return (
      <div className="panel action-panel" style={{ borderColor: "var(--stage-menang)" }}>
        <div className="panel-head"><h3>Proyek</h3></div>
        <p style={{ fontSize: 12.5, color: "var(--foreground-muted)", marginBottom: 12 }}>
          Tender ini sudah dikonversi menjadi Proyek.
        </p>
        <Link href={`/projects/${tender.projectId}`} className="btn btn-secondary btn-md full">
          Lihat Proyek
        </Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);
    const res = await createProjectFromTender(tender.id, fd);
    setPending(false);
    if (res.success) {
      addToast("Tender dikonversi ke Proyek", "success");
      router.push(`/projects/${res.data.id}`);
    } else {
      addToast(res.error ?? "Gagal mengonversi tender", "error");
    }
  }

  return (
    <div className="panel action-panel">
      <div className="panel-head"><h3>🏆 Tender Menang</h3></div>
      <p style={{ fontSize: 12.5, color: "var(--foreground-muted)", marginBottom: 12 }}>
        Tender ini berstatus <strong>Menang</strong>. Konversikan ke Proyek untuk memulai tahap pelaksanaan.
      </p>
      {!open ? (
        <button className="btn btn-primary btn-md full" onClick={() => setOpen(true)}>
          Konversi ke Proyek
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="field">
            <label className="field-label">Nama Proyek</label>
            <input name="name" defaultValue={tender.title} className="input" />
          </div>
          <div className="field">
            <label className="field-label">Client</label>
            <input name="client" defaultValue={tender.agency ?? ""} className="input" />
          </div>
          <div className="field">
            <label className="field-label">No. PO/SO</label>
            <input name="poSoNumber" className="input" />
          </div>
          <div className="field">
            <label className="field-label">Tanggal PO/SO</label>
            <input name="poSoDate" type="date" className="input" />
          </div>
          <div className="modal-foot" style={{ borderTop: "none", paddingTop: 0 }}>
            <button type="button" className="btn btn-secondary btn-md" onClick={() => setOpen(false)}>Batal</button>
            <button type="submit" disabled={pending} className="btn btn-primary btn-md">
              {pending ? "Mengonversi…" : "Konversi"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
