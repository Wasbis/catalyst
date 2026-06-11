"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/tenders",     label: "Tenders",    Icon: TendersIcon },
  { href: "/kbli",        label: "KBLI",       Icon: KbliIcon },
  { href: "/scraper/log", label: "Scraper Log", Icon: ScraperLogIcon },
  { href: "/settings",    label: "Settings",   Icon: SettingsIcon },
];

export default function Sidebar({ collapsed, onToggleCollapse }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">C</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-name">Catalyst</div>
          <div className="sidebar-sub">by Cliste</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? "active" : ""}`}>
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="env-pill">
          <span className="env-dot" />
          <span className="env-label">Server Tailscale · 100.112.188.84</span>
        </div>
        <button className="collapse-btn" onClick={onToggleCollapse}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
          </svg>
          <span className="collapse-text">{collapsed ? "Buka" : "Ciutkan"}</span>
        </button>
      </div>
    </aside>
  );
}

function TendersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18M3 9h18M3 14h12M3 19h8" /></svg>;
}
function KbliIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v6.5a2 2 0 0 0 .59 1.42l7.5 7.5a2 2 0 0 0 2.82 0l5.6-5.6a2 2 0 0 0 0-2.82l-7.5-7.5A2 2 0 0 0 11.5 4H5a2 2 0 0 0-2 2z M8 8h.01" /></svg>;
}
function ScraperLogIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function SettingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.18l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 13a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.18-2.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.18l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 11a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
