import { getTenders, getTenderStats } from "@/actions/tenderActions";
import { toJSONSafe } from "@/lib/serialize";
import StatsRow from "@/components/tenders/StatsRow";
import ScrapeStatusBar from "@/components/tenders/ScrapeStatusBar";
import TenderTable from "@/components/tenders/TenderTable";
import KanbanBoard from "@/components/tenders/KanbanBoard";
import TendersToolbar from "@/components/tenders/TendersToolbar";

export const metadata = { title: "Tenders — Catalyst" };

export default async function TendersPage({ searchParams }) {
  const sp = await searchParams;
  const { source, status, minScore, keyword, page, view } = sp;
  const isKanban = view === "kanban";

  const [result, stats] = await Promise.all([
    getTenders({
      source: source || undefined,
      status: status || undefined,
      minScore: minScore ? Number(minScore) : undefined,
      keyword: keyword || undefined,
      page: isKanban ? 1 : (page ? Number(page) : 1),
      pageSize: isKanban ? 500 : 20,
    }),
    getTenderStats(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Scrape status bar */}
      <ScrapeStatusBar />

      {/* Toolbar: list/kanban toggle + filters + input manual */}
      <TendersToolbar currentView={view ?? "list"} searchParams={sp} totalCount={result.total} />

      {/* Content */}
      {isKanban ? (
        <KanbanBoard initialTenders={toJSONSafe(result.data)} />
      ) : (
        <>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <TenderTable data={result.data} />
          </div>
          {result.totalPages > 1 && (
            <PaginationBar page={result.page} totalPages={result.totalPages} searchParams={sp} />
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
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", paddingTop: 8 }}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <a key={p} href={makeHref(p)}
          style={{
            display: "inline-grid", placeItems: "center",
            width: 34, height: 34, borderRadius: 9,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            background: p === page ? "var(--accent)" : "var(--surface)",
            color: p === page ? "#fff" : "var(--foreground-muted)",
            border: `1px solid ${p === page ? "var(--accent)" : "var(--border)"}`,
          }}
        >{p}</a>
      ))}
    </div>
  );
}
