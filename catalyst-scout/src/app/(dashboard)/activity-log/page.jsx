import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLogs, getAuditLogUsers } from "@/actions/auditLogActions";
import { toJSONSafe } from "@/lib/serialize";
import ActivityLogFilterBar from "@/components/activity-log/ActivityLogFilterBar";
import ActivityLogTable from "@/components/activity-log/ActivityLogTable";

export const metadata = { title: "Activity Log — Project Maker by Cliste" };

export default async function ActivityLogPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/tenders");

  const sp = await searchParams;

  const [result, users] = await Promise.all([
    getAuditLogs({
      entityType: sp.entityType || undefined,
      userId: sp.userId || undefined,
      dateFrom: sp.dateFrom || undefined,
      dateTo: sp.dateTo || undefined,
      page: sp.page ? Number(sp.page) : 1,
    }),
    getAuditLogUsers(),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <h2 className="m-0 text-base font-medium text-foreground">Activity Log</h2>
        <p className="mt-1 text-[13px] text-foreground-muted">
          Riwayat perubahan data — siapa mengubah apa dan kapan
        </p>
      </div>

      <div className="shrink-0">
        <ActivityLogFilterBar searchParams={sp} users={toJSONSafe(users)} />
      </div>

      <ActivityLogTable data={toJSONSafe(result.data)} scrollable />

      {result.totalPages > 1 && (
        <div className="shrink-0">
          <PaginationBar page={result.page} totalPages={result.totalPages} searchParams={sp} />
        </div>
      )}
    </div>
  );
}

function PaginationBar({ page, totalPages, searchParams }) {
  const makeHref = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", p);
    return `/activity-log?${params.toString()}`;
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
