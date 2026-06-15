"use client";

import { useState } from "react";
import { ExternalLink, Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmployeeDocumentBadge from "@/components/hr/EmployeeDocumentBadge";
import EmployeeDocumentUploadForm from "@/components/hr/EmployeeDocumentUploadForm";
import { formatDate } from "@/lib/formatters";
import { HR_DOC_TYPES, HR_DOC_TYPE_LABELS } from "@/lib/hrTypes";
import Button from "@/components/ui/Button";

export default function EmployeeDocumentList({ employeeId, documents, docStatusMap }) {
  const [uploadTarget, setUploadTarget] = useState(null);

  const docByType = {};
  for (const doc of documents) docByType[doc.docType] = doc;

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
      <div className="overflow-hidden rounded-[10px] border border-border">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-hover border-b border-border">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-foreground-muted">Dokumen</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-foreground-muted">Status</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-foreground-muted">Tanggal Expired</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-foreground-muted">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {HR_DOC_TYPES.map((docType, idx) => {
              const doc = docByType[docType];
              const status = docStatusMap[docType];

              return (
                <tr key={docType} className={`hover:bg-surface-hover transition-colors duration-100 ${idx !== HR_DOC_TYPES.length - 1 ? "border-b border-border" : ""}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{HR_DOC_TYPE_LABELS[docType]}</td>
                  <td className="px-4 py-3">
                    <EmployeeDocumentBadge docType={docType} status={status} />
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {doc?.expiryDate ? formatDate(doc.expiryDate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc && (
                        <a
                          href={`/api/hr/files/${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7.5 items-center justify-center gap-1 rounded-lg border border-border bg-surface-hover px-3 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
                        >
                          <ExternalLink size={14} />
                          Lihat
                        </a>
                      )}
                      <Button variant="neutral" size="sm" onClick={() => setUploadTarget(docType)}>
                        <Upload size={14} />
                        {doc ? "Ganti" : "Upload"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!uploadTarget}
        onClose={() => setUploadTarget(null)}
        title={`Upload ${uploadTarget ? HR_DOC_TYPE_LABELS[uploadTarget] : ""}`}
        size="sm"
      >
        {uploadTarget && (
          <EmployeeDocumentUploadForm
            employeeId={employeeId}
            docType={uploadTarget}
            existingDoc={docByType[uploadTarget]}
            onClose={() => setUploadTarget(null)}
          />
        )}
      </Modal>
    </div>
  );
}
