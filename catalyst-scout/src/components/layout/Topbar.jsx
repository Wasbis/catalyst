"use client";

import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/authActions";
import BellNotification from "./BellNotification";
import ThemeToggle from "@/components/ui/ThemeToggle";

const PAGE_TITLES = {
  "/tenders": "Tenders",
  "/kbli": "KBLI",
  "/activity-log": "Activity Log",
  "/scraper/log": "Scraper Log",
  "/settings": "Settings",
};

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getRole(email = "") {
  if (email.includes("manager") || email.includes("admin")) return "Manager";
  return "Engineer";
}

export default function Topbar({ user }) {
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES).find(([href]) => pathname.startsWith(href))?.[1] ?? "Dashboard";
  const initials = getInitials(user?.name ?? "");
  const role = user?.role ?? getRole(user?.email ?? "");

  return (
    <header className="h-14 flex items-center justify-between px-6 flex-shrink-0 bg-background border-b border-border">
      <h1 className="text-base font-medium text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <BellNotification />
        <div className="text-right mr-1">
          <div className="text-[13px] font-medium text-foreground leading-tight">{user?.name}</div>
          <div className="text-xs text-foreground-muted leading-tight">{role}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-xs text-foreground-muted hover:text-foreground transition-colors duration-120 ease-out bg-transparent border-0 cursor-pointer font-sans ml-1"
          >
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
