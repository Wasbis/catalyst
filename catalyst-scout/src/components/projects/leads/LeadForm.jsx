"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectLead, updateProjectLead } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";

export default function LeadForm({ lead = null }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);
  const isEdit = !!lead;

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);
    const res = isEdit ? await updateProjectLead(lead.id, fd) : await createProjectLead(fd);
    setPending(false);
    if (res.success) {
      addToast(isEdit ? "Lead diperbarui" : "Lead berhasil dibuat", "success");
      if (isEdit) router.refresh();
      else router.push(`/projects/leads/${res.data.id}`);
    } else {
      addToast(res.error ?? "Gagal menyimpan lead", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel">
      <div className="panel-head"><h3>{isEdit ? "Edit Lead" : "Lead Baru"}</h3></div>
      <div className="form-grid">
        <div className="field span-2">
          <label className="field-label">Nama Lead / Proyek *</label>
          <input name="name" required defaultValue={lead?.name} className="input" placeholder="Mis. Studi Kelayakan Fasilitas Produksi X" />
        </div>
        <div className="field span-2">
          <label className="field-label">Client *</label>
          <input name="client" required defaultValue={lead?.client} className="input" placeholder="Nama klien / perusahaan" />
        </div>
        <div className="field">
          <label className="field-label">Estimasi Nilai (Rp)</label>
          <input name="estimatedValue" type="number" min="0" defaultValue={lead?.estimatedValue ?? ""} className="input" placeholder="500000000" />
        </div>
        <div className="field span-2">
          <label className="field-label">Deskripsi</label>
          <textarea name="description" defaultValue={lead?.description ?? ""} className="input" rows={3} style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} placeholder="Ringkasan kebutuhan / scope..." />
        </div>
        <div className="field span-2">
          <label className="field-label">Catatan</label>
          <textarea name="notes" defaultValue={lead?.notes ?? ""} className="input" rows={3} style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} placeholder="Catatan internal..." />
        </div>
      </div>
      <div className="modal-foot" style={{ borderTop: "none", paddingTop: 14 }}>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary btn-md">Batal</button>
        <button type="submit" disabled={pending} className="btn btn-primary btn-md">
          {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Buat Lead"}
        </button>
      </div>
    </form>
  );
}
