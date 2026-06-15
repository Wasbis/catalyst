"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectFromTender } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import Card, { CardTitle } from "@/components/ui/Card";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ConvertToProjectModal({ tender }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

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
    <Card>
      <CardTitle>🏆 Tender Menang</CardTitle>
      <p className="mt-2 mb-3 text-xs text-foreground-muted">
        Tender ini berstatus <span className="font-medium text-foreground">Menang</span>. Konversikan ke Proyek untuk memulai tahap pelaksanaan.
      </p>
      {!open ? (
        <Button className="w-full" onClick={() => setOpen(true)}>
          Konversi ke Proyek
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label>Nama Proyek</Label>
            <Input name="name" defaultValue={tender.title} />
          </div>
          <div>
            <Label>Client</Label>
            <Input name="client" defaultValue={tender.agency ?? ""} />
          </div>
          <div>
            <Label>No. PO/SO</Label>
            <Input name="poSoNumber" />
          </div>
          <div>
            <Label>Tanggal PO/SO</Label>
            <Input name="poSoDate" type="date" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="neutral" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" loading={pending}>
              {pending ? "Mengonversi…" : "Konversi"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
