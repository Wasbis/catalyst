"use client";

import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/authActions";
import BellNotification from "./BellNotification";

const PAGE_TITLES = [
  { href: "/tenders", title: "Tenders" },
  { href: "/kbli", title: "KBLI" },
  { href: "/scraper/log", title: "Scraper Log" },
  { href: "/settings", title: "Settings" },
];

function getPageTitle(pathname) {
  return PAGE_TITLES.find(({ href }) => pathname.startsWith(href))?.title ?? "Dashboard";
}

export default function Topbar({ user }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <BellNotification />
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-foreground-subtle">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium text-foreground-muted hover:text-foreground"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
