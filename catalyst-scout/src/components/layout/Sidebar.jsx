"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Opportunities",
    items: [
      { href: "/tenders", label: "Tenders", Icon: TendersIcon },
      { href: "/projects/leads", label: "Direct Appointment", Icon: DirectAppointmentIcon },
    ],
  },
  {
    label: "Execution",
    items: [
      { href: "/projects", label: "Projects", Icon: ProjectsIcon },
      { href: "/documents", label: "Documents", Icon: DocumentsIcon },
    ],
  },
  {
    label: "Master Data",
    items: [
      { href: "/kbli", label: "KBLI", Icon: KbliIcon },
      { href: "/hr", label: "Karyawan", Icon: HrIcon },
      { href: "/settings/document-categories", label: "Doc Categories", Icon: DocCategoriesIcon },
      { href: "/settings/document-templates", label: "Document Templates", Icon: DocCategoriesIcon },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/activity-log", label: "Activity Log", Icon: ActivityLogIcon, adminOnly: true },
      { href: "/scraper/log", label: "Scraper Log", Icon: ScraperLogIcon },
      { href: "/settings", label: "Settings", Icon: SettingsIcon },
    ],
  },
];

const ALL_HREFS = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));

function isItemActive(pathname, href) {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // Jika ada href lain yang lebih spesifik (mis. /projects/leads vs /projects), itu yang menang.
  return !ALL_HREFS.some((other) => other !== href && other.startsWith(href) && pathname.startsWith(other));
}

export default function Sidebar({ collapsed, onToggleCollapse, user }) {
  const pathname = usePathname();
  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || user?.role === "admin"),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={`h-screen flex flex-col bg-surface border-r border-border overflow-hidden flex-shrink-0 transition-[width] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? "w-16" : "w-60"}`}
    >
      {/* Logo zone */}
      <div className={`h-14 flex items-center gap-2.5 border-b border-border flex-shrink-0 ${collapsed ? "justify-center px-0" : "px-3"}`}>
        <div className="w-[26px] h-[26px] rounded-[7px] bg-accent text-white font-medium text-sm flex items-center justify-center flex-shrink-0">
          C
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-[13px] font-medium text-foreground whitespace-nowrap">Catalyst</div>
            <div className="text-[11px] text-foreground-muted whitespace-nowrap">Project Maker by Cliste</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-3 flex flex-col gap-5 ${collapsed ? "px-2" : "px-2.5"}`}>
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {!collapsed && (
              <div className="px-3 mb-1 text-[10px] font-normal uppercase tracking-wider text-foreground-subtle whitespace-nowrap overflow-hidden">
                {group.label}
              </div>
            )}
            {group.items.map(({ href, label, Icon }) => {
              const isActive = isItemActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative h-[38px] flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-120 ease-out ${collapsed ? "justify-center px-0" : "px-3"} ${
                    isActive
                      ? "bg-accent-active text-accent dark:text-accent-400 font-medium"
                      : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <Icon />
                  {!collapsed && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-lg bg-surface border border-border px-2.5 py-1.5 text-xs text-foreground opacity-0 shadow-sm transition-opacity duration-120 group-hover:opacity-100">
                      {label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-border flex-shrink-0 flex flex-col gap-2 ${collapsed ? "p-2 items-center" : "p-3"}`}>
        {!collapsed && (
          <div className="flex items-center gap-1.5 rounded-[9px] bg-surface-hover px-2.5 py-1.5 text-[11px] text-foreground-muted overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            <span className="truncate">Server Tailscale · 100.112.188.84</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`flex items-center gap-2 rounded-lg text-xs font-normal text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors duration-120 ease-out ${collapsed ? "p-2 justify-center w-full" : "px-2.5 py-2 w-full"}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}

function TendersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M3 4h18M3 9h18M3 14h12M3 19h8" /></svg>;
}
function DirectAppointmentIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M8.5 14.5 11 12l2.5 2.5L19 9M3 12l3-3 3 3M3 12v6a2 2 0 0 0 2 2h6M3 12V6a2 2 0 0 1 2-2h6" /><path d="M19 9v6a2 2 0 0 1-2 2h-6" /></svg>;
}
function ProjectsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
function KbliIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M3 5v6.5a2 2 0 0 0 .59 1.42l7.5 7.5a2 2 0 0 0 2.82 0l5.6-5.6a2 2 0 0 0 0-2.82l-7.5-7.5A2 2 0 0 0 11.5 4H5a2 2 0 0 0-2 2z M8 8h.01" /></svg>;
}
function HrIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function ActivityLogIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M3 3v18h18" /><path d="M18.7 8a8 8 0 0 0-14.5 3.5" /><path d="M12 8v5l3 3" /></svg>;
}
function ScraperLogIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function DocumentsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function DocCategoriesIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.18l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 13a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.18-2.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.18l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 11a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
