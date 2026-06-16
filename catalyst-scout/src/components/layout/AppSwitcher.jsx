"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Check, ExternalLink } from "lucide-react";
import CatalystLogo from "./CatalystLogo";
import { useNavigationLoading } from "@/lib/useNavigationLoading";

const APPS = [
  {
    id: "catalyst",
    name: "Catalyst",
    description: "Project Maker by Cliste",
    href: "/tenders",
    badgeClassName: "bg-accent text-white",
    current: true,
  },
  {
    id: "task",
    name: "Task",
    description: "task.cliste.id",
    href: "https://task.cliste.id",
    badge: "T",
    badgeClassName: "bg-success text-white",
  },
  {
    id: "admin",
    name: "Admin Website",
    description: "admin.cliste.id",
    href: "https://admin.cliste.id",
    badge: "A",
    badgeClassName: "bg-warning text-white",
  },
];

export default function AppSwitcher({ collapsed }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const currentApp = APPS.find((app) => app.current) ?? APPS[0];
  const isNavigating = useNavigationLoading();

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative border-b border-border flex-shrink-0 ${collapsed ? "p-2" : "p-3"}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`group flex w-full items-center justify-between rounded-xl border p-2 text-left transition-colors duration-120 ease-out ${
          open
            ? "border-accent/50 bg-accent-active"
            : "border-border bg-surface hover:border-accent/30 hover:bg-surface-hover"
        } ${collapsed ? "justify-center" : ""}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${currentApp.badgeClassName}`}>
            {currentApp.id === "catalyst" ? (
              <CatalystLogo size={20} animate={isNavigating} />
            ) : (
              <span className="text-sm font-medium">{currentApp.badge}</span>
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden text-left">
              <div className="text-[13px] font-medium text-foreground whitespace-nowrap">{currentApp.name}</div>
              <div className="text-[11px] text-foreground-muted whitespace-nowrap">{currentApp.description}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <ChevronsUpDown size={15} className="flex-shrink-0 text-foreground-subtle transition-colors group-hover:text-foreground-muted" />
        )}
      </button>

      <div
        className={`absolute z-50 mt-1.5 w-64 origin-top rounded-xl border border-border bg-surface p-1.5 shadow-lg transition-all duration-150 ease-out ${
          open ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"
        } ${collapsed ? "left-full top-0 ml-2" : "left-3 right-3 top-full"}`}
      >
        <div className="mb-1 px-2 py-1 text-[10px] font-normal uppercase tracking-wider text-foreground-subtle">
          Pindah Aplikasi
        </div>
        <div className="flex flex-col gap-0.5">
          {APPS.map((app) => (
            <a
              key={app.id}
              href={app.href}
              target={app.current ? undefined : "_blank"}
              rel={app.current ? undefined : "noopener noreferrer"}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg p-2 text-sm transition-colors duration-120 ease-out ${
                app.current ? "bg-accent-active" : "hover:bg-surface-hover"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${app.badgeClassName}`}>
                {app.id === "catalyst" ? (
                  <CatalystLogo size={17} />
                ) : (
                  <span className="text-xs font-medium">{app.badge}</span>
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <div className={`whitespace-nowrap ${app.current ? "text-accent dark:text-accent-400 font-medium" : "text-foreground"}`}>
                  {app.name}
                </div>
                <div className="text-[11px] text-foreground-muted whitespace-nowrap">{app.description}</div>
              </div>
              {app.current ? (
                <Check size={15} className="flex-shrink-0 text-accent dark:text-accent-400" />
              ) : (
                <ExternalLink size={13} className="flex-shrink-0 text-foreground-subtle" />
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
