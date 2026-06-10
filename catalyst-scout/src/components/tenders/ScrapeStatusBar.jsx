"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatSource } from "@/lib/formatters";

const POLL_INTERVAL_MS = 5_000;

const TRIGGER_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "civd", label: "CIVD" },
  { value: "geodipa", label: "GeoDipa" },
];

export default function ScrapeStatusBar() {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState(null);
  const wasRunningRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/proxy-scraper");
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);

      if (wasRunningRef.current && !data.running) {
        router.refresh();
      }
      wasRunningRef.current = Boolean(data.running);
    } catch {
      // diam-diam gagal, polling berikutnya coba lagi
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleTrigger(source) {
    setTriggering(true);
    setTriggerError(null);
    try {
      const res = await fetch("/api/proxy-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setTriggerError(data?.error ?? "Gagal memulai scrape.");
      }
    } catch {
      setTriggerError("Gagal memulai scrape.");
    } finally {
      await fetchStatus();
      setTriggering(false);
    }
  }

  const running = Boolean(status?.running);

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Trigger Scrape:</span>
        {TRIGGER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="secondary"
            size="sm"
            disabled={running || triggering}
            onClick={() => handleTrigger(option.value)}
          >
            {option.label}
          </Button>
        ))}
        {triggerError && <p className="text-xs text-danger">{triggerError}</p>}
      </div>

      {running && (
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span>
            Scraping {formatSource(status.current_source)}
            {status.elapsed_seconds != null && ` · ${Math.round(status.elapsed_seconds)}s`}
            {" · "}
            ditemukan {status.items_found_so_far ?? 0}, tersimpan {status.items_saved_so_far ?? 0}
            {status.items_failed_so_far > 0 && `, gagal ${status.items_failed_so_far}`}
          </span>
        </div>
      )}
    </Card>
  );
}
