import { prisma } from "@/lib/prisma";

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

export default async function ScraperLogPage() {
  const { total, today, bySource, latestJobs, jobs } = await getStats();

  const civdCount = bySource.find((s) => s.source === "civd")?._count?.id ?? 0;
  const geodipaCount = bySource.find((s) => s.source === "geodipa")?._count?.id ?? 0;
  const [latestCivd, latestGeodipa] = latestJobs;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Source status cards */}
      <div className="source-cards">
        {[
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
        ].map((src) => (
          <div key={src.name} className="source-card">
            <div className="source-card-head">
              <span className={src.ok ? "source-status-ok" : "source-status-err"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {src.ok ? <path d="M20 6L9 17l-5-5" /> : <path d="M18 6L6 18M6 6l12 12" />}
                </svg>
              </span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>{src.name}</span>
              <span className={`badge ${src.ok ? "badge-green" : "badge-red"}`} style={{ marginLeft: "auto" }}>{src.ok ? "Online" : "Error"}</span>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div><div style={{ fontSize: 22, fontWeight: 800 }}>{src.count}</div><div style={{ fontSize: 12, color: "var(--foreground-muted)" }}>tender tersimpan</div></div>
              <div><div style={{ fontSize: 14, fontWeight: 700 }}>{src.interval}</div><div style={{ fontSize: 12, color: "var(--foreground-muted)" }}>jadwal scrape</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall stats */}
      <div style={{ display: "flex", gap: 14 }}>
        {[
          { label: "Total tender", value: total },
          { label: "Ditambahkan hari ini", value: today },
        ].map((s) => (
          <div key={s.label} className="panel" style={{ flex: 1, padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: "var(--foreground-muted)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontWeight: 800, fontSize: 14 }}>Log Aktivitas Scraper</div>
        <table className="log-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Waktu</th><th>Sumber</th><th>Event</th><th>Hasil</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "20px 0", color: "var(--foreground-muted)" }}>
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
                <tr key={job.id}>
                  <td>{formatDateTime(job.startedAt)}</td>
                  <td>{SOURCE_LABELS[job.source] ?? job.source}</td>
                  <td>{event}</td>
                  <td>{result}</td>
                  <td className={job.status === "failed" ? "log-err" : job.status === "running" ? "" : "log-ok"}>
                    {job.status === "failed" ? "✗ Error" : job.status === "running" ? "⏳ Berjalan" : "✓ OK"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
