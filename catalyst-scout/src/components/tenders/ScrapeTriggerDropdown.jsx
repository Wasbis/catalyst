"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ChevronDown, Building2, Mountain, Layers } from "lucide-react";
import Button from "@/components/ui/Button";

const POLL_INTERVAL_MS = 5_000;

const TRIGGER_OPTIONS = [
  { value: "all", label: "Semua Sumber", icon: Layers },
  { value: "civd", label: "CIVD", icon: Building2 },
  { value: "geodipa", label: "GeoDipa", icon: Mountain },
];

export default function ScrapeTriggerDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const wasRunningRef = useRef(false);
  const menuRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/proxy-scraper");
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
      if (wasRunningRef.current && !data.running) router.refresh();
      wasRunningRef.current = Boolean(data.running);
    } catch {
      // diam-diam gagal, polling berikutnya coba lagi
    }
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(fetchStatus, 0);
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchStatus]);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleTrigger(source) {
    setOpen(false);
    setTriggering(true);
    try {
      const res = await fetch("/api/proxy-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      if (res.ok) await fetchStatus();
    } finally {
      setTriggering(false);
    }
  }

  const running = Boolean(status?.running);
  const disabled = running || triggering;

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="neutral" onClick={() => setOpen((v) => !v)} disabled={disabled}>
        <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
        Trigger Scrape
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>

      {open && (
        <div className="animate-panel-in absolute right-0 top-[calc(100%+4px)] z-30 min-w-40 overflow-hidden rounded-[11px] border border-border bg-surface p-1.5 shadow-[0_18px_48px_rgba(4,19,46,0.20)]">
          {TRIGGER_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleTrigger(value)}
              disabled={disabled}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground transition-colors duration-120 ease-out hover:bg-surface-hover disabled:opacity-50"
            >
              <Icon className="h-3.5 w-3.5 text-foreground-subtle" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
