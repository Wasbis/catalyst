import Link from "next/link";
import LeadForm from "@/components/projects/leads/LeadForm";

export const metadata = { title: "Lead Baru — Project Maker by Catalyst" };

export default function NewProjectLeadPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <Link href="/projects/leads" style={{ fontSize: 12.5, color: "var(--foreground-muted)", textDecoration: "none" }}>← Leads</Link>
      <LeadForm />
    </div>
  );
}
