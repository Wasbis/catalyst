"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { createEmployee, updateEmployee } from "@/actions/hrActions";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export default function EmployeeFormModal({ isOpen, onClose, employee }) {
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);
  const isEdit = !!employee;

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);

    const result = isEdit
      ? await updateEmployee(employee.id, fd)
      : await createEmployee(fd);

    setPending(false);

    if (result.success) {
      addToast(isEdit ? "Karyawan berhasil diperbarui" : "Karyawan berhasil ditambahkan", "success");
      onClose();
    } else {
      addToast(result.error ?? "Gagal menyimpan", "error");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Karyawan" : "Tambah Karyawan"} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="emp-name">Nama *</Label>
          <Input id="emp-name" name="name" required defaultValue={employee?.name} placeholder="Nama lengkap" />
        </div>
        <div>
          <Label htmlFor="emp-position">Posisi</Label>
          <Input id="emp-position" name="position" defaultValue={employee?.position ?? ""} placeholder="Jabatan / posisi" />
        </div>

        <div className="mt-1 flex justify-end gap-2.5">
          <Button type="button" variant="neutral" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={pending}>
            {isEdit ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
