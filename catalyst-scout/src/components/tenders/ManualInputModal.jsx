"use client";

import { useState } from "react";
import { createManualTender } from "@/actions/tenderActions";
import { useToast } from "@/components/ui/ToastProvider";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import Modal from "@/components/ui/Modal";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const SOURCE_OPTIONS = [
  { value: "civd",    label: "CIVD · SKK Migas" },
  { value: "geodipa", label: "GeoDipa" },
  { value: "manual",  label: "Input Manual" },
];

export default function ManualInputModal({ open, onClose, onCreated }) {
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);
    const result = await createManualTender(fd);
    setPending(false);
    if (result.success) {
      addToast("Tender berhasil ditambahkan", "success");
      onCreated?.();
      onClose();
    } else {
      addToast(result.error ?? "Gagal menyimpan", "error");
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Input Manual Tender" size="lg">
      <p className="-mt-2 mb-4 text-xs text-foreground-muted">
        Tambah tender yang tidak terdeteksi oleh scraper otomatis
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="mi-title">Judul Tender *</Label>
            <Input id="mi-title" name="title" required placeholder="Contoh: Jasa Konsultansi FEED Fasilitas Produksi..." />
          </div>

          <div>
            <Label htmlFor="mi-agency">Instansi / Klien *</Label>
            <Input id="mi-agency" name="agency" required placeholder="PT Pertamina Hulu Mahakam" />
          </div>

          <div>
            <Label htmlFor="mi-source">Sumber</Label>
            <Select id="mi-source" name="source" defaultValue="manual">
              {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>

          <div>
            <Label htmlFor="mi-budget">Estimasi Nilai (Rp)</Label>
            <Input id="mi-budget" name="budgetEstimated" type="number" min="0" placeholder="4800000000" />
          </div>

          <div>
            <Label htmlFor="mi-deadline">Tenggat</Label>
            <Input id="mi-deadline" name="deadlineDate" type="date" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="mi-url">URL Sumber</Label>
            <Input id="mi-url" name="sourceUrl" type="url" placeholder="https://..." />
          </div>

          <div>
            <Label htmlFor="mi-status">Status Awal</Label>
            <Select id="mi-status" name="status" defaultValue="DITEMUKAN">
              {VALID_TENDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="mi-desc">Deskripsi / Persyaratan</Label>
            <textarea
              id="mi-desc"
              name="description"
              rows={4}
              className="block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground placeholder:text-foreground-subtle transition-colors duration-150 hover:border-foreground-subtle focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_var(--accent-active)]"
              placeholder="Tuliskan deskripsi singkat dan persyaratan utama tender ini..."
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="neutral" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={pending}>
            {pending ? "Menyimpan..." : "Simpan Tender"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
