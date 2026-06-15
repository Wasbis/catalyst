import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Badge from "@/components/ui/Badge";

export const metadata = { title: "Scraper Log — Project Maker by Catalyst" };

async function getStats() {
  try {
    const [total, today, bySource, latestJobs, jobs] = await Promise.all([
      prisma.tenderResult.count(),
      prisma.tenderResult.count({
        where: { scrapedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.tenderResult.groupBy({
        by: ["source"],
        _count: { id: true },
      }),
      Promise.all(
        ["civd", "geodipa"].map((source) =>
          prisma.scrapingJob.findFirst({
            where: { source },
            orderBy: { startedAt: "desc" },
          })
        )
      ),
      prisma.scrapingJob.findMany({
        orderBy: { startedAt: "desc" },
        take: 50,
      }),
    ]);
    return { total, today, bySource, latestJobs, jobs };
  } catch {
    return { total: 0, today: 0, bySource: [], latestJobs: [null, null], jobs: [] };
  }
}

function formatDateTime(dateLike) {
  if (!dateLike) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateLike));
}

const SOURCE_LABELS = { civd: "CIVD", geodipa: "GeoDipa" };

const TRIGGER_LABELS = { manual: "Manual", scheduled: "Terjadwal" };

const TABLE_HEADERS = ["Waktu", "Sumber", "Event", "Hasil", "Status"];

export default async function ScraperLogPage() {
  const { total, today, bySource, latestJobs, jobs } = await getStats();

  const civdCount = bySource.find((s) => s.source === "civd")?._count?.id ?? 0;
  const geodipaCount = bySource.find((s) => s.source === "geodipa")?._count?.id ?? 0;
  const [latestCivd, latestGeodipa] = latestJobs;

  const sources = [
    {
      name: "CIVD · SKK Migas",
      count: civdCount,
      interval: "tiap 12 jam",
      ok: latestCivd ? latestCivd.status !== "failed" : true,
    },
    {
      name: "GeoDipa",
      count: geodipaCount,
      interval: "tiap 24 jam",
      ok: latestGeodipa ? latestGeodipa.status !== "failed" : true,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      {/* Source status cards */}
      <div className="shrink-0 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {sources.map((src) => (
          <div key={src.name} className="rounded-[14px] border border-border bg-surface p-5">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className={src.ok ? "text-success" : "text-danger"}>
                {src.ok ? <CheckCircle2 size={16} strokeWidth={2} /> : <XCircle size={16} strokeWidth={2} />}
              </span>
              <span className="text-sm font-medium text-foreground">{src.name}</span>
              <Badge variant={src.ok ? "active" : "lewati"} className="ml-auto">{src.ok ? "Online" : "Error"}</Badge>
            </div>
            <div className="flex gap-5">
              <div>
                <div className="text-[22px] font-medium text-foreground">{src.count}</div>
                <div className="text-xs text-foreground-muted">tender tersimpan</div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{src.interval}</div>
                <div className="text-xs text-foreground-muted">jadwal scrape</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall stats */}
      <div className="shrink-0 flex gap-3.5">
        {[
          { label: "Total tender", value: total },
          { label: "Ditambahkan hari ini", value: today },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-[14px] border border-border bg-surface px-5 py-4">
            <div className="text-2xl font-medium text-foreground">{s.value}</div>
            <div className="mt-0.5 text-[12.5px] text-foreground-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[14px] border border-border bg-surface">
        <div className="shrink-0 border-b border-border px-4.5 py-3.5 text-sm font-medium text-foreground">Log Aktivitas Scraper</div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-border bg-surface text-foreground-subtle">
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-4 py-2 font-medium">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-center text-foreground-muted">
                    Belum ada riwayat scrape.
                  </td>
                </tr>
              )}
              {jobs.map((job) => {
                const event =
                  job.status === "running"
                    ? "Sedang berjalan"
                    : job.status === "failed"
                    ? job.errorMessage || "Scrape gagal"
                    : `Scrape selesai (${TRIGGER_LABELS[job.trigger] ?? job.trigger ?? "—"})`;
                const result =
                  job.status === "running"
                    ? "—"
                    : `+${job.tendersNew ?? 0} baru / ${job.tendersFound ?? 0} total`;
                return (
                  <tr key={job.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-foreground-muted">{formatDateTime(job.startedAt)}</td>
                    <td className="px-4 py-2">{SOURCE_LABELS[job.source] ?? job.source}</td>
                    <td className="px-4 py-2">{event}</td>
                    <td className="px-4 py-2">{result}</td>
                    <td className={`px-4 py-2 ${job.status === "failed" ? "text-danger" : job.status === "running" ? "text-foreground-muted" : "text-success"}`}>
                      <span className="inline-flex items-center gap-1">
                        {job.status === "failed" ? (
                          <><XCircle size={12} strokeWidth={2} /> Error</>
                        ) : job.status === "running" ? (
                          <><Loader2 size={12} strokeWidth={2} className="animate-spin" /> Berjalan</>
                        ) : (
                          <><CheckCircle2 size={12} strokeWidth={2} /> OK</>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
