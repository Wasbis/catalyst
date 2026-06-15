import { getProjectLeads } from "@/actions/projectActions";
import { toJSONSafe } from "@/lib/serialize";
import LeadKanbanBoard from "@/components/projects/leads/LeadKanbanBoard";

export const metadata = { title: "Direct Appointment — Project Maker by Catalyst" };

export default async function ProjectLeadsPage() {
  const result = await getProjectLeads({ pageSize: 200 });

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <h1 className="m-0 shrink-0 text-base font-medium text-foreground">Direct Appointment</h1>

      <LeadKanbanBoard initialLeads={toJSONSafe(result.data)} totalCount={result.total} />
    </div>
  );
}
