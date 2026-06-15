import { getDocuments } from "@/actions/documentActions";
import { getDocumentCategories } from "@/actions/documentCategoryActions";
import { toJSONSafe } from "@/lib/serialize";
import DocumentFilterBar from "@/components/documents/DocumentFilterBar";
import DocumentTable from "@/components/documents/DocumentTable";
import Pagination from "@/components/ui/Pagination";

export const metadata = { title: "Documents — Project Maker by Catalyst" };

export default async function DocumentsPage({ searchParams }) {
  const sp = await searchParams;
  const { categoryId, group, entityType, client, keyword, isReference, page } = sp;

  const [result, categories] = await Promise.all([
    getDocuments({
      categoryId: categoryId || undefined,
      group: group || undefined,
      entityType: entityType || undefined,
      client: client || undefined,
      keyword: keyword || undefined,
      isReference: isReference === "true" ? true : isReference === "false" ? false : undefined,
      page: page ? Number(page) : 1,
    }),
    getDocumentCategories({ activeOnly: true }),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <h2 className="m-0 text-base font-medium text-foreground">Document Hub</h2>
        <p className="mt-1 text-[13px] text-foreground-muted">{result.total} dokumen tersimpan</p>
      </div>

      <div className="shrink-0">
        <DocumentFilterBar searchParams={sp} categories={toJSONSafe(categories)} totalCount={result.total} />
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[14px] border border-border bg-surface">
        <DocumentTable data={toJSONSafe(result.data)} categories={toJSONSafe(categories)} scrollable />
      </div>

      <div className="shrink-0">
        <Pagination page={result.page} totalPages={result.totalPages} searchParams={sp} />
      </div>
    </div>
  );
}
