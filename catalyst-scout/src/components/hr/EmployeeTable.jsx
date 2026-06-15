"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import EmployeeDocumentBadge from "@/components/hr/EmployeeDocumentBadge";
import { HR_DOC_TYPES } from "@/lib/hrTypes";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";

const COLUMNS = [
  {
    key: "name",
    header: "Nama",
    cellClassName: "px-4 py-3 max-w-[220px]",
    render: (employee) => (
      <Link href={`/hr/${employee.id}`} className="font-medium text-foreground hover:underline truncate block">
        {employee.name}
      </Link>
    ),
  },
  {
    key: "position",
    header: "Posisi",
    cellClassName: "px-4 py-3 text-foreground-muted truncate max-w-[180px]",
    render: (employee) => employee.position || "—",
  },
  {
    key: "status",
    header: "Status",
    render: (employee) => (
      <Badge variant={employee.isActive ? "active" : "neutral"} size="sm">
        {employee.isActive ? "Aktif" : "Nonaktif"}
      </Badge>
    ),
  },
  {
    key: "documents",
    header: "Dokumen",
    render: (employee) => (
      <div className="flex flex-wrap gap-1.5">
        {HR_DOC_TYPES.map((docType) => (
          <EmployeeDocumentBadge key={docType} docType={docType} status={employee.docStatusMap[docType]} />
        ))}
      </div>
    ),
  },
];

export default function EmployeeTable({ data, scrollable = false }) {
  return (
    <Table
      variant="panel"
      scrollable={scrollable}
      sticky={scrollable}
      columns={COLUMNS}
      data={data}
      getRowProps={(employee) => ({
        className: "cursor-pointer",
        onClick: () => { window.location.href = `/hr/${employee.id}`; },
      })}
      emptyState={
        <EmptyState
          icon={Users}
          title="Belum ada karyawan"
          description="Tambahkan data karyawan untuk mulai mengelola dokumen pribadi (KTP, BPJS, Ijazah, KK, NPWP)."
        />
      }
    />
  );
}
