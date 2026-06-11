import { prisma } from "@/lib/prisma";

export const metadata = { title: "Scraper Log — Catalyst" };

async function getStats() {
  try {
    const [total, today] = await Promise.all([
      prisma.tenderResult.count(),
      prisma.tenderResult.count({
        where: { scrapedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);
    const bySource = await prisma.tenderResult.groupBy({
      by: ["source"],
      _count: { id: true },
    });
    return { total, today, bySource };
  } catch { return { total: 0, today: 0, bySource: [] }; }
}

const MOCK_LOGS = [
  { time: "2026-06-11 00:12", source: "CIVD", event: "Scrape selesai", count: 12, status: "ok" },
  { time: "2026-06-10 12:08", source: "CIVD", event: "Scrape selesai", count: 8, status: "ok" },
  { time: "2026-06-10 00:10", source: "GeoDipa", event: "Scrape selesai", count: 5, status: "ok" },
  { time: "2026-06-09 12:15", source: "CIVD", event: "Connection timeout", count: 0, status: "error" },
  { time: "2026-06-09 00:11", source: "GeoDipa", event: "Scrape selesai", count: 3, status: "ok" },
];

export default async function ScraperLogPage() {
  const { total, today, bySource } = await getStats();

  const civdCount = bySource.find((s) => s.source === "civd")?._count?.id ?? 0;
  const geodipaCount = bySource.find((s) => s.source === "geodipa")?._count?.id ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Source status cards */}
      <div className="source-cards">
        {[
          { name: "CIVD · SKK Migas", count: civdCount, interval: "tiap 12 jam", ok: true },
          { name: "GeoDipa", count: geodipaCount, interval: "tiap 24 jam", ok: true },
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
            {MOCK_LOGS.map((log, i) => (
              <tr key={i}>
                <td>{log.time}</td>
                <td>{log.source}</td>
                <td>{log.event}</td>
                <td>{log.count > 0 ? `+${log.count} tender` : "—"}</td>
                <td className={log.status === "ok" ? "log-ok" : "log-err"}>{log.status === "ok" ? "✓ OK" : "✗ Error"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
