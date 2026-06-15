import { getProjects } from "@/actions/projectActions";
import { toJSONSafe } from "@/lib/serialize";
import ProjectTable from "@/components/projects/ProjectTable";
import ProjectKanbanBoard from "@/components/projects/ProjectKanbanBoard";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import Pagination from "@/components/ui/Pagination";

export const metadata = { title: "Projects — Project Maker by Catalyst" };

export default async function ProjectsPage({ searchParams }) {
  const sp = await searchParams;
  const { sourceType, status, client, keyword, page, view } = sp;
  const isKanban = view === "kanban";

  const result = await getProjects({
    sourceType: sourceType || undefined,
    status: status || undefined,
    client: client || undefined,
    keyword: keyword || undefined,
    page: isKanban ? 1 : (page ? Number(page) : 1),
    pageSize: isKanban ? 500 : 20,
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      {isKanban ? (
        <ProjectKanbanBoard
          initialProjects={toJSONSafe(result.data)}
          currentView={view ?? "list"}
          searchParams={sp}
          totalCount={result.total}
        />
      ) : (
        <>
          <div className="shrink-0">
            <ProjectsToolbar currentView={view ?? "list"} searchParams={sp} totalCount={result.total} />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="h-full overflow-y-auto">
              <ProjectTable data={result.data} sticky />
            </div>
          </div>
          <div className="shrink-0">
            <Pagination page={result.page} totalPages={result.totalPages} searchParams={sp} />
          </div>
        </>
      )}
    </div>
  );
}
