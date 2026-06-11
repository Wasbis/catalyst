/* ============================================================
   Catalyst :: Tenders — List, Kanban, ScrapeBar, ManualInput
   ============================================================ */
const { useState: useStateT, useMemo: useMemoT, useEffect: useEffectT, useRef: useRefT } = React;

/* ---------------- Scrape status bar ---------------- */
function ScrapeStatusBar({ onDone }) {
  const C = window.CATALYST;
  const toast = useToast();
  const [job, setJob] = useStateT(null); // {source, found, saved, elapsed}
  const timer = useRefT(null);

  const start = (source) => {
    if (job) return;
    let elapsed = 0, found = 0, saved = 0;
    setJob({ source, found: 0, saved: 0, elapsed: 0 });
    timer.current = setInterval(() => {
      elapsed += 1;
      found += Math.floor(Math.random() * 4) + 1;
      if (elapsed > 2) saved += Math.random() > 0.6 ? 1 : 0;
      setJob({ source, found, saved, elapsed });
      if (elapsed >= 7) {
        clearInterval(timer.current);
        setTimeout(() => {
          setJob(null);
          toast(`Scrape ${C.SOURCE_SHORT[source] || "selesai"} selesai — ${found} ditemukan, ${saved} baru`, "success");
          onDone && onDone();
        }, 700);
      }
    }, 600);
  };
  useEffectT(() => () => clearInterval(timer.current), []);

  if (job) {
    const pct = Math.min(100, (job.elapsed / 7) * 100);
    return (
      <div className="scrape-bar running">
        <div className="scrape-spinner" />
        <div className="scrape-info">
          <div className="scrape-row">
            <strong>Scraping {C.SOURCE_SHORT[job.source]}…</strong>
            <span className="muted">{job.elapsed}s · {job.found} ditemukan · {job.saved} baru</span>
          </div>
          <div className="scrape-track"><div className="scrape-fill" style={{ width: pct + "%" }} /></div>
        </div>
      </div>
    );
  }
  return (
    <div className="scrape-bar">
      <div className="scrape-idle">
        <Icon name="refresh" size={16} />
        <span>Scraper otomatis · CIVD tiap 12 jam · GeoDipa tiap 24 jam</span>
        <span className="dot-sep">·</span>
        <span className="muted">terakhir 3 jam lalu</span>
      </div>
      <div className="scrape-actions">
        <Button size="sm" variant="ghost" onClick={() => start("GEODIPA")}>GeoDipa</Button>
        <Button size="sm" variant="ghost" onClick={() => start("CIVD")}>CIVD</Button>
        <Button size="sm" variant="primary" icon="zap" onClick={() => start("ALL")}>Trigger Scrape</Button>
      </div>
    </div>
  );
}

/* ---------------- Filter bar ---------------- */
function FilterBar({ filters, setFilters, count }) {
  const C = window.CATALYST;
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () => setFilters({ source: "", status: "", minScore: 0, q: "" });
  const dirty = filters.source || filters.status || filters.minScore > 0 || filters.q;
  return (
    <div className="filterbar">
      <div className="search-box">
        <Icon name="search" size={16} />
        <input placeholder="Cari judul atau instansi…" value={filters.q}
          onChange={(e) => set("q", e.target.value)} />
      </div>
      <Select value={filters.source} onChange={(e) => set("source", e.target.value)}>
        <option value="">Semua sumber</option>
        <option value="CIVD">CIVD · SKK Migas</option>
        <option value="GEODIPA">GeoDipa</option>
        <option value="MANUAL">Input Manual</option>
      </Select>
      <Select value={filters.status} onChange={(e) => set("status", e.target.value)}>
        <option value="">Semua status</option>
        {C.STATUS_ORDER.map((s) => <option key={s} value={s}>{C.STATUS_LABELS[s]}</option>)}
      </Select>
      <div className="score-filter">
        <span className="muted">Skor min</span>
        <input type="range" min="0" max="100" step="5" value={filters.minScore}
          onChange={(e) => set("minScore", +e.target.value)} />
        <span className="score-filter-val">{filters.minScore}</span>
      </div>
      {dirty && <button className="link-btn" onClick={clear}>Reset</button>}
      <span className="filter-count">{count} tender</span>
    </div>
  );
}

/* ---------------- Tender table ---------------- */
function TenderTable({ tenders, navigate, onPromote }) {
  const C = window.CATALYST;
  if (!tenders.length) {
    return <Card><EmptyState title="Tidak ada tender cocok" body="Coba ubah filter atau jalankan scrape baru." /></Card>;
  }
  return (
    <Card className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Sumber</th><th>Tender</th><th>KBLI</th><th>Skor</th>
            <th>Tenggat</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {tenders.map((t) => {
            const dl = C.formatDeadline(t.deadline);
            const topKbli = t.kbliMatched[0];
            return (
              <tr key={t.id} onClick={() => navigate({ name: "detail", tenderId: t.id })}>
                <td><span className={`source-chip src-${t.source.toLowerCase()}`}>{C.SOURCE_SHORT[t.source]}</span></td>
                <td className="cell-title">
                  <div className="t-title">{t.title}</div>
                  <div className="t-agency"><Icon name="building" size={12} />{t.agency} · {C.formatCurrency(t.budget)}</div>
                </td>
                <td>{topKbli ? <span className="kbli-code">{topKbli.kbli_code}</span> : <span className="muted">—</span>}</td>
                <td><ScoreBadge score={t.score} size="sm" /></td>
                <td>
                  <span className={`deadline ${dl.urgent ? "urgent" : ""} ${dl.passed ? "passed" : ""}`}>
                    {dl.text}
                    {dl.urgent && <span className="dl-days">{dl.days}h lagi</span>}
                  </span>
                </td>
                <td><StatusBadge status={t.status} /></td>
                <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                  <div className="action-wrap">
                    {t.status === "DITEMUKAN" && (
                      <Button size="sm" variant="ghost" icon="arrowRight"
                        onClick={() => onPromote(t.id)}>Promote</Button>
                    )}
                    <button className="icon-btn" onClick={() => navigate({ name: "detail", tenderId: t.id })}>
                      <Icon name="chevRight" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/* ---------------- Kanban ---------------- */
function KanbanBoard({ tenders, navigate, onMove }) {
  const C = window.CATALYST;
  const [dragId, setDragId] = useStateT(null);
  const [overCol, setOverCol] = useStateT(null);
  const cols = C.STATUS_ORDER;

  return (
    <div className="kanban">
      {cols.map((col) => {
        const items = tenders.filter((t) => t.status === col);
        const value = items.reduce((s, t) => s + (t.budget || 0), 0);
        return (
          <div key={col}
            className={`kanban-col ${overCol === col ? "drop-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
            onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
            onDrop={() => { if (dragId) onMove(dragId, col); setDragId(null); setOverCol(null); }}>
            <div className={`kanban-head head-${C.STATUS_TONE[col]}`}>
              <span className="kanban-dot" />
              <span className="kanban-name">{C.STATUS_LABELS[col]}</span>
              <span className="kanban-num">{items.length}</span>
            </div>
            <div className="kanban-value">{value ? C.formatCurrency(value) : "—"}</div>
            <div className="kanban-cards">
              {items.map((t) => {
                const dl = C.formatDeadline(t.deadline);
                return (
                  <div key={t.id} className={`kanban-card ${dragId === t.id ? "dragging" : ""}`}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onClick={() => navigate({ name: "detail", tenderId: t.id })}>
                    <div className="kc-top">
                      <span className={`source-chip src-${t.source.toLowerCase()}`}>{C.SOURCE_SHORT[t.source]}</span>
                      <ScoreBadge score={t.score} size="sm" />
                    </div>
                    <div className="kc-title">{t.title}</div>
                    <div className="kc-meta">
                      <span><Icon name="building" size={12} />{t.agency}</span>
                    </div>
                    <div className="kc-foot">
                      <span className="kc-budget">{C.formatCurrency(t.budget)}</span>
                      <span className={`kc-dl ${dl.urgent ? "urgent" : ""}`}>
                        <Icon name="clock" size={12} />{dl.text}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!items.length && <div className="kanban-empty">Tarik kartu ke sini</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Manual input modal ---------------- */
function ManualInputModal({ open, onClose, onCreate }) {
  const C = window.CATALYST;
  const [f, setF] = useStateT({ title: "", agency: "", source: "MANUAL", budget: "", deadline: "", url: "", text: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.title || !f.agency) return;
    onCreate(f); onClose();
    setF({ title: "", agency: "", source: "MANUAL", budget: "", deadline: "", url: "", text: "" });
  };
  return (
    <Modal open={open} onClose={onClose} title="Input Tender Manual" width={620}
      subtitle="Tambahkan tender yang tidak terjaring scraper otomatis."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" icon="plus" disabled={!f.title || !f.agency} onClick={submit}>Simpan Tender</Button>
      </>}>
      <div className="form-grid">
        <div className="span-2">
          <Field label="Judul Tender *">
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="mis. Jasa Konsultansi Engineering Design…" />
          </Field>
        </div>
        <Field label="Instansi / Agency *">
          <Input value={f.agency} onChange={(e) => set("agency", e.target.value)} placeholder="mis. PT Pertamina EP" />
        </Field>
        <Field label="Sumber">
          <Select value={f.source} onChange={(e) => set("source", e.target.value)}>
            <option value="MANUAL">Input Manual</option>
            <option value="CIVD">CIVD · SKK Migas</option>
            <option value="GEODIPA">GeoDipa</option>
          </Select>
        </Field>
        <Field label="Estimasi Nilai (Rp)">
          <Input type="number" value={f.budget} onChange={(e) => set("budget", e.target.value)} placeholder="2000000000" />
        </Field>
        <Field label="Tenggat">
          <Input type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </Field>
        <div className="span-2">
          <Field label="URL Sumber (opsional)">
            <Input value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Requirement / Deskripsi">
            <Textarea rows={4} value={f.text} onChange={(e) => set("text", e.target.value)}
              placeholder="Tempel ringkasan kerangka acuan kerja (KAK) di sini — akan dianalisis untuk matching KBLI." />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Stats row ---------------- */
function StatsRow({ tenders }) {
  const C = window.CATALYST;
  const s = C.computeStats(tenders);
  const cards = [
    { icon: "layers", label: "Tender aktif", value: s.active, tone: "violet", sub: `${s.total} total terindeks` },
    { icon: "zap", label: "Skor tinggi (KEJAR)", value: s.highScore, tone: "green", sub: "skor ≥ 70" },
    { icon: "trendUp", label: "Nilai pipeline", value: C.formatCurrency(s.pipelineValue), tone: "blue", sub: "tender aktif", big: true },
    { icon: "trophy", label: "Win rate", value: s.winRate + "%", tone: "amber", sub: `${s.won} dimenangkan` },
  ];
  return (
    <div className="stats-row">
      {cards.map((c, i) => (
        <Card key={i} className="stat-card">
          <div className={`stat-icon stat-${c.tone}`}><Icon name={c.icon} size={18} /></div>
          <div className="stat-body">
            <div className="stat-label">{c.label}</div>
            <div className={`stat-value ${c.big ? "stat-value-sm" : ""}`}>{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Tenders screen ---------------- */
function TendersScreen({ tenders, navigate, view, setView, onPromote, onMove, onCreate }) {
  const C = window.CATALYST;
  const toast = useToast();
  const [filters, setFilters] = useStateT({ source: "", status: "", minScore: 0, q: "" });
  const [page, setPage] = useStateT(1);
  const [manualOpen, setManualOpen] = useStateT(false);
  const perPage = 8;

  const filtered = useMemoT(() => {
    return tenders.filter((t) => {
      if (filters.source && t.source !== filters.source) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.minScore && (t.score == null || t.score < filters.minScore)) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.agency.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tenders, filters]);

  useEffectT(() => setPage(1), [filters]);
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handlePromote = (id) => { onPromote(id); toast("Tender dipromosikan ke Ditinjau", "success"); };
  const handleMove = (id, col) => { onMove(id, col); toast(`Status → ${C.STATUS_LABELS[col]}`, "success"); };

  return (
    <div className="screen">
      <StatsRow tenders={tenders} />
      <ScrapeStatusBar onDone={() => toast("Data tender diperbarui", "default")} />

      <div className="toolbar">
        <div className="view-toggle">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <Icon name="list" size={16} />List
          </button>
          <button className={view === "kanban" ? "active" : ""} onClick={() => setView("kanban")}>
            <Icon name="kanban" size={16} />Kanban
          </button>
        </div>
        <Button variant="secondary" icon="plus" onClick={() => setManualOpen(true)}>Input Manual</Button>
      </div>

      {view === "list" ? (
        <>
          <FilterBar filters={filters} setFilters={setFilters} count={filtered.length} />
          <TenderTable tenders={paged} navigate={navigate} onPromote={handlePromote} />
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      ) : (
        <KanbanBoard tenders={tenders} navigate={navigate} onMove={handleMove} />
      )}

      <ManualInputModal open={manualOpen} onClose={() => setManualOpen(false)}
        onCreate={(f) => { onCreate(f); toast("Tender manual ditambahkan", "success"); }} />
    </div>
  );
}

Object.assign(window, { TendersScreen, ScrapeStatusBar, FilterBar, TenderTable, KanbanBoard, ManualInputModal, StatsRow });
