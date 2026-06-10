import { getTenders } from "@/actions/tenderActions";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import FilterBar from "@/components/tenders/FilterBar";
import ScrapeStatusBar from "@/components/tenders/ScrapeStatusBar";
import TenderTable from "@/components/tenders/TenderTable";

export default async function TendersPage({ searchParams }) {
  const sp = await searchParams;
  const { source, status, minScore, keyword, page } = sp;

  const result = await getTenders({
    source: source || undefined,
    status: status || undefined,
    minScore: minScore ? Number(minScore) : undefined,
    keyword: keyword || undefined,
    page: page ? Number(page) : 1,
  });

  console.log("Tender data", result);
  return (
    <div className="space-y-4">
      <ScrapeStatusBar />
      <FilterBar />
      <Card>
        <TenderTable data={result.data} />
      </Card>
      <Pagination page={result.page} totalPages={result.totalPages} searchParams={sp} />
    </div>
  );
}
