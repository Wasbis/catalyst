"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { formatSource } from "@/lib/formatters";

const POLL_INTERVAL_MS = 5_000;

export default function ScrapeStatusBar() {
  const router = useRouter();
  const [status, setStatus] = useState(null);
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

  const running = Boolean(status?.running);
  const lastStats = !running ? status?.last_stats : null;

  if (!running && !lastStats && !status?.last_error) return null;

  return (
    <Card className="flex flex-wrap items-center gap-3 p-3">
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

      {!running && lastStats && (
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span>
            Scrape {formatSource(status.last_source)} selesai
            {status.last_duration_seconds != null && ` · ${Math.round(status.last_duration_seconds)}s`}
            {" · "}
            {lastStats.saved} baru, {lastStats.updated} diupdate,{" "}
            {lastStats.scraper_duplicate ?? 0} duplikat
            {lastStats.scraper_skipped_closed > 0 && `, ${lastStats.scraper_skipped_closed} dilewati (tutup)`}
            {" · "}
            total {lastStats.total_scanned ?? lastStats.total_from_scraper} dipindai
            {lastStats.failed > 0 && (
              <span className="text-danger">{`, ${lastStats.failed} gagal disimpan`}</span>
            )}
          </span>
        </div>
      )}

      {!running && !lastStats && status?.last_error && (
        <p className="text-sm text-danger">Scrape terakhir gagal: {status.last_error}</p>
      )}
    </Card>
  );
}
