"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { toggleEmployeeActive } from "@/actions/hrActions";
import EmployeeFormModal from "@/components/hr/EmployeeFormModal";
import EmployeeDocumentList from "@/components/hr/EmployeeDocumentList";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function EmployeeDetailClient({ employee }) {
  const { addToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleToggleActive() {
    setPending(true);
    const result = await toggleEmployeeActive(employee.id);
    setPending(false);

    if (result.success) {
      addToast(employee.isActive ? "Karyawan dinonaktifkan" : "Karyawan diaktifkan kembali", "success");
    } else {
      addToast(result.error ?? "Gagal mengubah status", "error");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/hr"
            className="mt-0.5 inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-border bg-surface-hover text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-base font-medium text-foreground">{employee.name}</h2>
              <Badge variant={employee.isActive ? "active" : "neutral"} size="sm">
                {employee.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-foreground-muted">
              {employee.position || "Posisi belum diisi"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="neutral" onClick={() => setShowEditModal(true)}>
            <Pencil size={14} strokeWidth={2} />
            Edit
          </Button>
          <Button variant="neutral" disabled={pending} onClick={handleToggleActive}>
            {employee.isActive ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">Dokumen Pribadi</h3>
        <EmployeeDocumentList employeeId={employee.id} documents={employee.documents} docStatusMap={employee.docStatusMap} />
      </div>

      <EmployeeFormModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} employee={employee} />
    </div>
  );
}
