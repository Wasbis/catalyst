import { getDocumentTemplates } from "@/actions/documentTemplateActions";
import DocumentTemplateManager from "@/components/document-templates/DocumentTemplateManager";

export const metadata = { title: "Document Templates — Project Maker by Catalyst" };

export default async function DocumentTemplatesPage() {
  const result = await getDocumentTemplates();
  const templates = result.success ? result.data : [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="m-0 text-base font-medium text-foreground">Document Templates</h2>
          <p className="mt-1 text-[13px] text-foreground-muted">
            Kelola template .docx untuk Document Generator (Proposal, Surat Kerja, BAST, Invoice, Kontrak, Laporan CTR)
          </p>
        </div>

        <DocumentTemplateManager templates={templates} />
      </div>
    </div>
  );
}
