"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import ListKanbanToggle from "@/components/ui/ListKanbanToggle";

export function ProjectViewToggle({ currentView, searchParams }) {
  const router = useRouter();

  function setView(v) {
    const p = new URLSearchParams(searchParams ?? {});
    p.set("view", v);
    p.delete("page");
    router.push(`/projects?${p.toString()}`);
  }

  return <ListKanbanToggle currentView={currentView} onChange={setView} />;
}

export function DirectAppointmentLink() {
  return (
    <Link
      href="/projects/leads"
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-foreground-muted no-underline transition-colors duration-120 ease-out hover:text-foreground hover:border-foreground-subtle"
    >
      <Users size={14} />
      Direct Appointment
    </Link>
  );
}

export function ProjectCount({ totalCount }) {
  if (totalCount == null) return null;
  return (
    <span className="whitespace-nowrap text-[12.5px] font-medium text-foreground-subtle">
      {totalCount} proyek
    </span>
  );
}
