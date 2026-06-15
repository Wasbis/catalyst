import Card from "@/components/ui/Card";

const ICON_COLOR = {
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  green: "bg-success/15 text-success",
  violet: "bg-accent-soft text-accent-400 dark:text-accent-300",
  amber: "bg-warning/15 text-warning",
};

function StatCard({ icon, color, value, label, sub, children }) {
  return (
    <Card className="flex items-center gap-3.5">
      <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] ${ICON_COLOR[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-medium text-foreground leading-none tracking-tight">{value}</div>
        <div className="mt-1 text-xs font-medium text-foreground-muted">{label}</div>
        <div className="mt-0.5 text-[11px] text-foreground-subtle">{sub ?? children}</div>
      </div>
    </Card>
  );
}

export default function StatsRow({ stats }) {
  const { totalActive, highScore, pipelineValue, winRate, totalFound } = stats;

  return (
    <div className="grid grid-cols-1 gap-3.5 mb-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        color="blue"
        value={totalActive}
        label="Tender aktif"
        sub={`${totalFound} total terindeks`}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h18M3 9h18M3 14h12M3 19h8" />
          </svg>
        }
      />

      <StatCard
        color="green"
        value={highScore}
        label="Skor tinggi (KEJAR)"
        sub="skor ≥ 70"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" />
          </svg>
        }
      />

      <StatCard
        color="violet"
        value={pipelineValue}
        label="Nilai pipeline"
        sub="tender aktif"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />

      <StatCard
        color="amber"
        value={winRate}
        label="Win rate"
        sub="dari tender diserahkan"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z" />
          </svg>
        }
      />
    </div>
  );
}
