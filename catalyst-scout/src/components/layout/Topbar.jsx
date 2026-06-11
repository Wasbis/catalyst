"use client";

import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/authActions";
import BellNotification from "./BellNotification";

const PAGE_TITLES = {
  "/tenders": "Tenders",
  "/kbli": "KBLI",
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
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">
        <BellNotification />
        <div className="user-info" style={{ textAlign: "right" }}>
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{role}</div>
        </div>
        <div className="avatar-circle">{initials}</div>
        <form action={logoutAction}>
          <button type="submit" style={{ fontSize: 12.5, color: "var(--foreground-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
