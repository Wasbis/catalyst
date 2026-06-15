"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectLead, updateProjectLead } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

const TEXTAREA_CLASSES =
  "block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground placeholder:text-foreground-subtle transition-colors duration-150 hover:border-foreground-subtle focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_var(--accent-active)]";

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
      addToast(isEdit ? "Direct Appointment diperbarui" : "Direct Appointment berhasil dibuat", "success");
      if (isEdit) router.refresh();
      else router.push(`/projects/leads/${res.data.id}`);
    } else {
      addToast(res.error ?? "Gagal menyimpan Direct Appointment", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[14px] border border-border bg-surface p-4">
      <h3 className="m-0 mb-4 text-[15px] font-medium text-foreground">
        {isEdit ? "Edit Direct Appointment" : "Direct Appointment Baru"}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="lead-name">Nama Direct Appointment / Proyek *</Label>
          <Input id="lead-name" name="name" required defaultValue={lead?.name} placeholder="Mis. Studi Kelayakan Fasilitas Produksi X" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lead-client">Client *</Label>
          <Input id="lead-client" name="client" required defaultValue={lead?.client} placeholder="Nama klien / perusahaan" />
        </div>
        <div>
          <Label htmlFor="lead-value">Estimasi Nilai (Rp)</Label>
          <Input id="lead-value" name="estimatedValue" type="number" min="0" defaultValue={lead?.estimatedValue ?? ""} placeholder="500000000" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lead-description">Deskripsi</Label>
          <textarea id="lead-description" name="description" defaultValue={lead?.description ?? ""} rows={3} className={TEXTAREA_CLASSES} placeholder="Ringkasan kebutuhan / scope..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lead-notes">Catatan</Label>
          <textarea id="lead-notes" name="notes" defaultValue={lead?.notes ?? ""} rows={3} className={TEXTAREA_CLASSES} placeholder="Catatan internal..." />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="neutral" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" loading={pending}>
          {isEdit ? "Simpan Perubahan" : "Buat Direct Appointment"}
        </Button>
      </div>
    </form>
  );
}
