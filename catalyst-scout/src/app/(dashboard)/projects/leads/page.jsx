import Link from "next/link";
import { getProjectLeads } from "@/actions/projectActions";
import { toJSONSafe } from "@/lib/serialize";
import LeadKanbanBoard from "@/components/projects/leads/LeadKanbanBoard";

export const metadata = { title: "Leads — Project Maker by Catalyst" };

export default async function ProjectLeadsPage() {
  const result = await getProjectLeads({ pageSize: 200 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/projects" style={{ fontSize: 12.5, color: "var(--foreground-muted)", textDecoration: "none" }}>← Projects</Link>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: "var(--foreground-subtle)", fontWeight: 600 }}>{result.total} lead</span>
        <Link href="/projects/leads/new" className="btn btn-primary btn-md" style={{ gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Lead Baru
        </Link>
      </div>

      <LeadKanbanBoard initialLeads={toJSONSafe(result.data)} />
    </div>
  );
}
