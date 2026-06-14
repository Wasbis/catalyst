import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectLeadById } from "@/actions/projectActions";
import { toJSONSafe } from "@/lib/serialize";
import LeadDetailClient from "@/components/projects/leads/LeadDetailClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const lead = await getProjectLeadById(id);
  return { title: lead ? `${lead.name} — Project Maker by Catalyst` : "Lead tidak ditemukan" };
}

export default async function ProjectLeadDetailPage({ params }) {
  const { id } = await params;
  const lead = await getProjectLeadById(id);
  if (!lead) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/projects/leads" style={{ fontSize: 12.5, color: "var(--foreground-muted)", textDecoration: "none" }}>← Leads</Link>
      <LeadDetailClient lead={toJSONSafe(lead)} />
    </div>
  );
}
