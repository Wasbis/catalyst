"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 30_000;

export default function BellNotification() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Diam-diam gagal — bell tetap tampil tanpa data, polling berikutnya coba lagi
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-foreground">
            Notifikasi
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-foreground-muted">
                Belum ada notifikasi
              </li>
            )}
            {notifications.map((notification) => (
              <li key={notification.id} className="border-b border-border last:border-0">
                <NotificationItem notification={notification} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification }) {
  const content = (
    <div className={`px-4 py-3 text-sm ${notification.isRead ? "" : "bg-accent/5"}`}>
      <p className="font-medium text-foreground">{notification.title}</p>
      <p className="mt-0.5 text-foreground-muted">{notification.message}</p>
      <p className="mt-1 text-xs text-foreground-subtle">
        {new Date(notification.createdAt).toLocaleString("id-ID")}
      </p>
    </div>
  );

  if (notification.actionLink) {
    return (
      <a href={notification.actionLink} className="block hover:bg-surface-hover">
        {content}
      </a>
    );
  }

  return content;
}

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}
