"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteDocument } from "@/actions/documentActions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDateTime } from "@/lib/formatters";
import { DOCUMENT_ENTITY_TYPE_LABELS } from "@/lib/documentTypes";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import DocumentFormModal from "./DocumentFormModal";

const ENTITY_PATH_PREFIX = {
  TenderResult: "/tenders",
  Project: "/projects",
  ProjectPhase: "/projects",
  ProjectChecklistItem: "/projects",
  ProjectLead: "/projects/leads",
};

const GROUP_CLASSES = {
  teknis: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  komersial: "bg-success/15 text-success",
  legal: "bg-warning/15 text-warning",
  hr: "bg-accent-soft text-accent-400 dark:text-accent-300",
};

const THEAD_CLASS = "sticky top-0 z-10 border-b border-border bg-surface-hover text-xs font-medium uppercase tracking-wide text-foreground-subtle";

export default function DocumentTable({ data, categories, scrollable = false }) {
  const { addToast } = useToast();
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDocument(deleteTarget?.id);
    setDeleting(false);
    if (result.success) {
      addToast("Dokumen berhasil dihapus", "success");
      setDeleteTarget(null);
    } else {
      addToast(result.error ?? "Gagal menghapus dokumen", "error");
    }
  }

  const columns = [
    {
      key: "title",
      header: "Judul",
      render: (doc) => (
        <>
          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:text-accent">
            {doc.title}
          </a>
          {doc.isReference && <Badge variant="info" className="ml-2">Referensi</Badge>}
          {doc.tags && <div className="mt-1 text-xs text-foreground-subtle">{doc.tags}</div>}
        </>
      ),
    },
    {
      key: "category",
      header: "Kategori",
      render: (doc) =>
        doc.category ? (
          <Badge className={GROUP_CLASSES[doc.category.group] ?? "bg-surface-hover text-foreground-muted"}>
            {doc.category.label}
          </Badge>
        ) : (
          <span className="text-foreground-subtle">—</span>
        ),
    },
    {
      key: "client",
      header: "Client",
      cellClassName: "px-4 py-3 align-top text-foreground-muted",
      render: (doc) => doc.client ?? "—",
    },
    {
      key: "entity",
      header: "Terkait",
      render: (doc) => {
        const entityPrefix = ENTITY_PATH_PREFIX[doc.entityType];
        return doc.entityType && entityPrefix ? (
          <Link href={`${entityPrefix}/${doc.entityId}`} className="text-accent hover:underline">
            {DOCUMENT_ENTITY_TYPE_LABELS[doc.entityType] ?? doc.entityType} #{doc.entityId}
          </Link>
        ) : (
          <span className="text-foreground-subtle">—</span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Diupload",
      cellClassName: "px-4 py-3 align-top text-foreground-muted",
      render: (doc) => `${formatDateTime(doc.createdAt)}${doc.uploadedBy ? ` · ${doc.uploadedBy.name}` : ""}`,
    },
    {
      key: "actions",
      header: "Aksi",
      headerClassName: "px-4 py-3 font-medium text-right",
      cellClassName: "px-4 py-3 align-top text-right",
      render: (doc) => (
        <>
          <Button variant="neutral" size="sm" className="mr-1.5" onClick={() => setEditTarget(doc)}>Edit</Button>
          <Button variant="neutral" size="sm" onClick={() => setDeleteTarget(doc)}>Hapus</Button>
        </>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        data={data}
        scrollable={scrollable}
        sticky={scrollable}
        theadClassName={scrollable ? THEAD_CLASS : undefined}
        emptyState={<EmptyState title="Belum ada dokumen yang sesuai filter." />}
      />

      {editTarget && (
        <DocumentFormModal open={!!editTarget} onClose={() => setEditTarget(null)} categories={categories} doc={editTarget} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Dokumen"
        message={`Yakin ingin menghapus dokumen "${deleteTarget?.title}"? File yang sudah diupload juga akan dihapus.`}
        confirmLabel="Ya, hapus"
        loading={deleting}
      />
    </>
  );
}
