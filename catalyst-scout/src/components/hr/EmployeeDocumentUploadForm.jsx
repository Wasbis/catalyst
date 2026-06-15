"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { upsertEmployeeDocument } from "@/actions/hrActions";
import { HR_DOC_TYPE_LABELS } from "@/lib/hrTypes";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export default function EmployeeDocumentUploadForm({ employeeId, docType, existingDoc, onClose }) {
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const file = form.file.files[0];
    const expiryDate = form.expiryDate.value;

    if (!file) {
      addToast("File wajib diupload.", "error");
      return;
    }

    setPending(true);

    try {
      const uploadFd = new FormData();
      uploadFd.set("file", file);
      const uploadRes = await fetch("/api/hr/upload", { method: "POST", body: uploadFd });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? "Gagal upload file.");
      }

      const fd = new FormData();
      fd.set("fileUrl", uploadData.fileUrl);
      if (expiryDate) fd.set("expiryDate", expiryDate);

      const result = await upsertEmployeeDocument(employeeId, docType, fd);

      if (result.success) {
        addToast("Dokumen berhasil diupload", "success");
        onClose();
      } else {
        addToast(result.error ?? "Gagal menyimpan dokumen", "error");
      }
    } catch (err) {
      addToast(err.message ?? "Gagal upload file", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <Label htmlFor={`doc-file-${docType}`}>
          File {HR_DOC_TYPE_LABELS[docType]} *
        </Label>
        <Input id={`doc-file-${docType}`} name="file" type="file" required />
      </div>
      <div>
        <Label htmlFor={`doc-expiry-${docType}`}>Tanggal Expired (opsional)</Label>
        <Input
          id={`doc-expiry-${docType}`}
          name="expiryDate"
          type="date"
          defaultValue={existingDoc?.expiryDate ? existingDoc.expiryDate.slice(0, 10) : ""}
        />
      </div>

      <div className="mt-1 flex justify-end gap-2.5">
        <Button type="button" variant="neutral" onClick={onClose}>Batal</Button>
        <Button type="submit" loading={pending} className="min-w-30">
          {existingDoc ? "Ganti File" : "Upload"}
        </Button>
      </div>
    </form>
  );
}
