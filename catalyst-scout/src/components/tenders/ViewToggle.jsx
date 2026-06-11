"use client";

import Link from "next/link";

const VIEWS = [
  {
    id: "list",
    label: "List",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: "kanban",
    label: "Kanban",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
];

export default function ViewToggle({ currentView, searchParams }) {
  function buildHref(viewId) {
    const params = new URLSearchParams({ ...searchParams, view: viewId });
    // Reset page when switching views
    params.delete("page");
    return `/tenders?${params.toString()}`;
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 gap-0.5 flex-shrink-0">
      {VIEWS.map(({ id, label, icon }) => {
        const isActive = currentView === id;
        return (
          <Link
            key={id}
            href={buildHref(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-accent text-white shadow-sm"
                : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </div>
  );
}
