import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectLeadById } from "@/actions/projectActions";
import { getCurrentUser } from "@/lib/auth";
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
  const user = await getCurrentUser();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <Link href="/projects/leads" className="text-[12.5px] text-foreground-muted no-underline hover:text-foreground">← Direct Appointment</Link>
      <LeadDetailClient lead={toJSONSafe(lead)} currentUserId={user?.id} />
    </div>
  );
}
