import { getTenders } from "@/actions/tenderActions";
import { toJSONSafe } from "@/lib/serialize";
import ScrapeStatusBar from "@/components/tenders/ScrapeStatusBar";
import TenderTable from "@/components/tenders/TenderTable";
import KanbanBoard from "@/components/tenders/KanbanBoard";
import TendersToolbar from "@/components/tenders/TendersToolbar";

export const metadata = { title: "Tenders — Catalyst" };

export default async function TendersPage({ searchParams }) {
  const sp = await searchParams;
  const { source, status, minScore, keyword, page, view } = sp;
  const isKanban = view === "kanban";

  const result = await getTenders({
    source: source || undefined,
    status: status || undefined,
    minScore: minScore ? Number(minScore) : undefined,
    keyword: keyword || undefined,
    page: isKanban ? 1 : (page ? Number(page) : 1),
    pageSize: isKanban ? 500 : 20,
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      {/* Scrape status bar (hanya tampil saat ada aktivitas) */}
      <div className="shrink-0">
        <ScrapeStatusBar />
      </div>

      {/* Content */}
      {isKanban ? (
        <KanbanBoard
          initialTenders={toJSONSafe(result.data)}
          currentView={view ?? "list"}
          searchParams={sp}
          totalCount={result.total}
        />
      ) : (
        <>
          <div className="shrink-0">
            <TendersToolbar currentView={view ?? "list"} searchParams={sp} totalCount={result.total} />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="h-full overflow-y-auto">
              <TenderTable data={toJSONSafe(result.data)} />
            </div>
          </div>
          {result.totalPages > 1 && (
            <div className="shrink-0">
              <PaginationBar page={result.page} totalPages={result.totalPages} searchParams={sp} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Inline simple pagination
function PaginationBar({ page, totalPages, searchParams }) {
  const makeHref = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", p);
    return `/tenders?${params.toString()}`;
  };
  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <a
          key={p}
          href={makeHref(p)}
          className={`inline-grid h-8.5 w-8.5 place-items-center rounded-[9px] border text-[13px] font-medium no-underline transition-colors duration-120 ease-out ${
            p === page
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-foreground-muted hover:border-foreground-subtle hover:text-foreground"
          }`}
        >
          {p}
        </a>
      ))}
    </div>
  );
}
