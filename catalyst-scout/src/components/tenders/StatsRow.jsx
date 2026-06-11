export default function StatsRow({ stats }) {
  const { totalActive, highScore, pipelineValue, winRate, totalFound } = stats;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-icon blue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h18M3 9h18M3 14h12M3 19h8" />
          </svg>
        </div>
        <div>
          <div className="stat-value">{totalActive}</div>
          <div className="stat-label">Tender aktif</div>
          <div className="stat-sub">{totalFound} total terindeks</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" />
          </svg>
        </div>
        <div>
          <div className="stat-value">{highScore}</div>
          <div className="stat-label">Skor tinggi (KEJAR)</div>
          <div className="stat-sub">skor ≥ 70</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon violet">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div>
          <div className="stat-value">{pipelineValue}</div>
          <div className="stat-label">Nilai pipeline</div>
          <div className="stat-sub">tender aktif</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon amber">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z" />
          </svg>
        </div>
        <div>
          <div className="stat-value">{winRate}</div>
          <div className="stat-label">Win rate</div>
          <div className="stat-sub">dari tender diserahkan</div>
        </div>
      </div>
    </div>
  );
}
