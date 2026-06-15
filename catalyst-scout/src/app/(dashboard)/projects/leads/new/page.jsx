import Link from "next/link";
import LeadForm from "@/components/projects/leads/LeadForm";

export const metadata = { title: "Direct Appointment Baru — Project Maker by Catalyst" };

export default function NewProjectLeadPage() {
  return (
    <div className="flex h-full max-w-190 flex-col gap-4 overflow-y-auto">
      <Link href="/projects/leads" className="text-[12.5px] text-foreground-muted no-underline hover:text-foreground">← Direct Appointment</Link>
      <LeadForm />
    </div>
  );
}
