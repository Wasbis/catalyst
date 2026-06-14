import { getProjects } from "@/actions/projectActions";
import { toJSONSafe } from "@/lib/serialize";
import ProjectTable from "@/components/projects/ProjectTable";
import ProjectKanbanBoard from "@/components/projects/ProjectKanbanBoard";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import Pagination from "@/components/ui/Pagination";

export const metadata = { title: "Projects — Project Maker by Catalyst" };

export default async function ProjectsPage({ searchParams }) {
  const sp = await searchParams;
  const { sourceType, status, keyword, page, view } = sp;
  const isKanban = view === "kanban";

  const result = await getProjects({
    sourceType: sourceType || undefined,
    status: status || undefined,
    keyword: keyword || undefined,
    page: isKanban ? 1 : (page ? Number(page) : 1),
    pageSize: isKanban ? 500 : 20,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ProjectsToolbar currentView={view ?? "list"} searchParams={sp} totalCount={result.total} />

      {isKanban ? (
        <ProjectKanbanBoard initialProjects={toJSONSafe(result.data)} />
      ) : (
        <>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <ProjectTable data={result.data} />
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} searchParams={sp} />
        </>
      )}
    </div>
  );
}
