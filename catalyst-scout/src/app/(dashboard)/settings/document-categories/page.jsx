import { getDocumentCategories } from "@/actions/documentCategoryActions";
import { toJSONSafe } from "@/lib/serialize";
import DocumentCategoryManager from "@/components/documents/DocumentCategoryManager";

export const metadata = { title: "Kategori Dokumen — Project Maker by Catalyst" };

export default async function DocumentCategoriesPage() {
  const categories = await getDocumentCategories({ activeOnly: false });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-base font-medium text-foreground">Kategori Dokumen</h2>
        <p className="mt-1 text-[13px] text-foreground-muted">
          Kelola kategori untuk Document Hub — dipakai saat upload/filter dokumen
        </p>
      </div>

      <DocumentCategoryManager categories={toJSONSafe(categories)} />
    </div>
  );
}
