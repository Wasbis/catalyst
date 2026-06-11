/* ============================================================
   Catalyst :: Tender Detail + Proposal Generator
   ============================================================ */
const { useState: useStateD, useEffect: useEffectD } = React;

/* ---------------- Notes panel ---------------- */
function NotesPanel({ notes, onAdd }) {
  const C = window.CATALYST;
  const [draft, setDraft] = useStateD("");
  return (
    <Card className="panel">
      <div className="panel-head"><h3>Catatan Tim</h3><span className="muted">{notes.length}</span></div>
      <div className="notes-list">
        {notes.length === 0 && <p className="muted small">Belum ada catatan. Tambahkan diskusi tim di bawah.</p>}
        {notes.map((n, i) => (
          <div key={i} className="note">
            <Avatar name={n.author} size={30} />
            <div className="note-body">
              <div className="note-meta">
                <strong>{n.author}</strong><span className="role-tag">{n.role}</span>
                <span className="muted small">{C.relativeTime(n.at)}</span>
              </div>
              <p>{n.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="note-compose">
        <Textarea rows={2} value={draft} placeholder="Tulis catatan…"
          onChange={(e) => setDraft(e.target.value)} />
        <Button variant="primary" size="sm" icon="plus" disabled={!draft.trim()}
          onClick={() => { onAdd(draft.trim()); setDraft(""); }}>Tambah</Button>
      </div>
    </Card>
  );
}

/* ---------------- Status history ---------------- */
function StatusHistory({ history }) {
  const C = window.CATALYST;
  return (
    <Card className="panel">
      <div className="panel-head"><h3>Riwayat Status</h3></div>
      <div className="timeline">
        {history.slice().reverse().map((h, i) => (
          <div key={i} className="tl-item">
            <span className={`tl-dot tl-${C.STATUS_TONE[h.status]}`} />
            <div className="tl-body">
              <div className="tl-status">{C.STATUS_LABELS[h.status]}</div>
              <div className="muted small">{C.formatDateTime(h.at)} · {h.by}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Convert to project modal ---------------- */
function ConvertToProjectModal({ open, onClose, tender, onConfirm }) {
  const C = window.CATALYST;
  return (
    <Modal open={open} onClose={onClose} title="Konversi ke Proyek" width={520}
      subtitle="Tender yang dimenangkan akan diteruskan ke Internal Workspace (App 2)."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" icon="arrowRight" onClick={onConfirm}>Buat Proyek</Button>
      </>}>
      <div className="convert-preview">
        <div className="cp-row"><span className="muted">Tender</span><strong>{tender.title}</strong></div>
        <div className="cp-row"><span className="muted">Klien</span><span>{tender.agency}</span></div>
        <div className="cp-row"><span className="muted">Nilai kontrak</span><span>{C.formatCurrency(tender.budget)}</span></div>
        <div className="cp-row"><span className="muted">Project owner</span><span>Dewi Saraswati</span></div>
      </div>
      <div className="cp-note">
        <Icon name="layers" size={15} />
        <span>Proyek baru akan dibuat dengan Kanban task, milestone, dan dokumen kontrak terhubung otomatis.</span>
      </div>
    </Modal>
  );
}

/* ---------------- KBLI match list ---------------- */
function KbliMatches({ matches }) {
  return (
    <Card className="panel">
      <div className="panel-head">
        <h3>Pencocokan KBLI</h3>
        <span className="ai-tag"><Icon name="ai" size={13} />AI semantic match</span>
      </div>
      <div className="kbli-matches">
        {matches.map((m, i) => {
          const pct = Math.round(m.score * 100);
          const tone = pct >= 70 ? "high" : pct >= 40 ? "mid" : "low";
          return (
            <div key={i} className="kbli-match">
              <span className="kbli-code lg">{m.kbli_code}</span>
              <div className="kbli-match-body">
                <div className="kbli-desc">{m.description}</div>
                <div className="kbli-bar"><div className={`kbli-fill fill-${tone}`} style={{ width: pct + "%" }} /></div>
              </div>
              <span className={`kbli-pct pct-${tone}`}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- Tender detail screen ---------------- */
function DetailScreen({ tender, navigate, onStatusChange, onAddNote }) {
  const C = window.CATALYST;
  const toast = useToast();
  const [convertOpen, setConvertOpen] = useStateD(false);
  const [statusMenu, setStatusMenu] = useStateD(false);
  const dl = C.formatDeadline(tender.deadline);

  return (
    <div className="screen detail-screen">
      <div className="detail-grid">
        {/* Main column */}
        <div className="detail-main">
          <Card className="detail-header">
            <div className="dh-top">
              <span className={`source-chip src-${tender.source.toLowerCase()}`}>{C.SOURCE_LABELS[tender.source]}</span>
              <span className="mono-id">{tender.id}</span>
              {tender.url && (
                <a className="ext-link" href={tender.url} target="_blank" rel="noreferrer">
                  Buka sumber <Icon name="external" size={13} />
                </a>
              )}
            </div>
            <h2 className="dh-title">{tender.title}</h2>
            <div className="dh-agency"><Icon name="building" size={15} />{tender.agency}</div>
            <div className="dh-meta">
              <div className="dh-meta-item">
                <span className="muted small">Estimasi Nilai</span>
                <strong>{C.formatCurrency(tender.budget)}</strong>
              </div>
              <div className="dh-meta-item">
                <span className="muted small">Tenggat</span>
                <strong className={dl.urgent ? "text-danger" : ""}>{dl.text}{dl.urgent ? ` · ${dl.days}h` : ""}</strong>
              </div>
              <div className="dh-meta-item">
                <span className="muted small">Skor relevansi</span>
                <ScoreBadge score={tender.score} size="sm" />
              </div>
              <div className="dh-meta-item">
                <span className="muted small">Ditemukan</span>
                <strong>{C.formatDate(tender.foundAt)}</strong>
              </div>
            </div>
          </Card>

          <KbliMatches matches={tender.kbliMatched} />

          <Card className="panel">
            <div className="panel-head"><h3>Deskripsi & Persyaratan</h3></div>
            <p className="tender-text">{tender.tenderText}</p>
            <div className="req-title">Persyaratan utama</div>
            <ul className="req-list">
              {tender.requirements.map((r, i) => (
                <li key={i}><Icon name="check" size={14} />{r}</li>
              ))}
            </ul>
          </Card>

          <NotesPanel notes={tender.notes} onAdd={(text) => { onAddNote(tender.id, text); toast("Catatan ditambahkan", "success"); }} />
        </div>

        {/* Side column */}
        <div className="detail-side">
          <Card className="panel action-panel">
            <div className="panel-head"><h3>Status & Aksi</h3></div>
            <div className="current-status">
              <span className="muted small">Status saat ini</span>
              <StatusBadge status={tender.status} />
            </div>
            <div className="status-picker">
              <button className="status-picker-btn" onClick={() => setStatusMenu((s) => !s)}>
                Ubah status <Icon name="chevDown" size={15} />
              </button>
              {statusMenu && (
                <div className="status-menu">
                  {C.STATUS_ORDER.map((s) => (
                    <button key={s} className={s === tender.status ? "active" : ""}
                      onClick={() => { onStatusChange(tender.id, s); setStatusMenu(false); toast(`Status → ${C.STATUS_LABELS[s]}`, "success"); }}>
                      <span className={`status-menu-dot dot-${C.STATUS_TONE[s]}`} />{C.STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="action-buttons">
              <Button variant="primary" icon="doc" className="full"
                onClick={() => navigate({ name: "proposal", tenderId: tender.id })}>
                Generate Proposal
              </Button>
              {tender.status === "MENANG" && (
                <Button variant="secondary" icon="layers" className="full" onClick={() => setConvertOpen(true)}>
                  Konversi ke Proyek
                </Button>
              )}
              {tender.status === "DITEMUKAN" && (
                <Button variant="secondary" icon="arrowRight" className="full"
                  onClick={() => { onStatusChange(tender.id, "DITINJAU"); toast("Dipromosikan ke Ditinjau", "success"); }}>
                  Promote ke Lead
                </Button>
              )}
            </div>
          </Card>

          <StatusHistory history={tender.history} />
        </div>
      </div>

      <ConvertToProjectModal open={convertOpen} onClose={() => setConvertOpen(false)} tender={tender}
        onConfirm={() => { setConvertOpen(false); toast("Proyek baru dibuat di Internal Workspace", "success"); }} />
    </div>
  );
}

/* ---------------- Proposal Generator ---------------- */
function ProposalScreen({ tender, navigate }) {
  const C = window.CATALYST;
  const toast = useToast();
  const [template, setTemplate] = useStateD(C.TEMPLATES[0].id);
  const [phase, setPhase] = useStateD("setup"); // setup | generating | ready
  const [blocks, setBlocks] = useStateD(C.PROPOSAL_BLOCKS);
  const [editing, setEditing] = useStateD(null);
  const [genStep, setGenStep] = useStateD(0);

  const GEN_STEPS = [
    "Memuat template & data tender…",
    "Masking data sensitif (klien, PII)…",
    "Menghasilkan konten via Claude Haiku…",
    "Menyusun blok proposal…",
  ];

  const generate = () => {
    setPhase("generating"); setGenStep(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1; setGenStep(i);
      if (i >= GEN_STEPS.length) { clearInterval(t); setTimeout(() => setPhase("ready"), 500); }
    }, 850);
  };

  const toggleApprove = (id) => setBlocks((bs) => bs.map((b) => b.id === id ? { ...b, approved: !b.approved } : b));
  const saveBlock = (id, content) => { setBlocks((bs) => bs.map((b) => b.id === id ? { ...b, content } : b)); setEditing(null); toast("Blok disimpan", "success"); };
  const approvedCount = blocks.filter((b) => b.approved).length;

  return (
    <div className="screen proposal-screen">
      <div className="prop-context">
        <div>
          <span className="muted small">Proposal untuk</span>
          <h2 className="prop-tender-title">{tender.title}</h2>
          <span className="muted">{tender.agency} · {C.formatCurrency(tender.budget)}</span>
        </div>
        <Button variant="ghost" icon="chevLeft" onClick={() => navigate({ name: "detail", tenderId: tender.id })}>Kembali</Button>
      </div>

      {phase === "setup" && (
        <Card className="prop-setup">
          <div className="ai-hero">
            <div className="ai-hero-icon"><Icon name="ai" size={26} /></div>
            <div>
              <h3>Generate proposal dengan AI</h3>
              <p className="muted">Pilih template, lalu Catalyst akan menyusun draft per-section yang bisa kamu edit & approve.</p>
            </div>
          </div>
          <Field label="Template proposal">
            <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {C.TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.sections} bagian</option>)}
            </Select>
          </Field>
          <div className="masking-note">
            <Icon name="shield" size={15} />
            <span>Data klien & PII otomatis di-masking sebelum dikirim ke model AI, lalu di-unmask pada hasil.</span>
          </div>
          <Button variant="primary" icon="ai" onClick={generate}>Generate Proposal</Button>
        </Card>
      )}

      {phase === "generating" && (
        <Card className="prop-generating">
          <div className="gen-spinner" />
          <h3>Menyusun proposal…</h3>
          <div className="gen-steps">
            {GEN_STEPS.map((s, i) => (
              <div key={i} className={`gen-step ${i < genStep ? "done" : i === genStep ? "active" : ""}`}>
                <span className="gen-step-ico">{i < genStep ? <Icon name="check" size={13} /> : <span className="gen-num">{i + 1}</span>}</span>
                {s}
              </div>
            ))}
          </div>
        </Card>
      )}

      {phase === "ready" && (
        <div className="prop-editor">
          <div className="prop-toolbar">
            <div className="prop-progress">
              <span className="muted small">{approvedCount}/{blocks.length} blok disetujui</span>
              <div className="prop-track"><div className="prop-fill" style={{ width: (approvedCount / blocks.length * 100) + "%" }} /></div>
            </div>
            <div className="prop-toolbar-actions">
              <Button variant="ghost" size="sm" icon="upload" onClick={() => toast("Form import timeline Excel dibuka", "default")}>Import Timeline</Button>
              <Button variant="secondary" size="sm" icon="ai" onClick={generate}>Regenerate</Button>
              <Button variant="primary" size="sm" icon="download" onClick={() => toast("Mengunduh proposal .docx…", "success")}>Download .docx</Button>
            </div>
          </div>

          <div className="prop-blocks">
            {blocks.map((b) => (
              <Card key={b.id} className={`prop-block ${b.approved ? "approved" : ""}`}>
                <div className="pb-head">
                  <h4>{b.heading}</h4>
                  <div className="pb-actions">
                    {b.approved && <span className="approved-tag"><Icon name="check" size={12} />Disetujui</span>}
                    <button className="icon-btn" onClick={() => setEditing(editing === b.id ? null : b.id)} title="Edit"><Icon name="edit" size={15} /></button>
                    <button className={`icon-btn ${b.approved ? "active-check" : ""}`} onClick={() => toggleApprove(b.id)} title="Setujui"><Icon name="check" size={16} /></button>
                  </div>
                </div>
                {editing === b.id ? (
                  <BlockEditor block={b} onSave={saveBlock} onCancel={() => setEditing(null)} />
                ) : (
                  <p className="pb-content">{b.content}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockEditor({ block, onSave, onCancel }) {
  const [val, setVal] = useStateD(block.content);
  return (
    <div className="block-editor">
      <Textarea rows={5} value={val} onChange={(e) => setVal(e.target.value)} />
      <div className="block-editor-actions">
        <Button variant="ghost" size="sm" onClick={onCancel}>Batal</Button>
        <Button variant="primary" size="sm" icon="check" onClick={() => onSave(block.id, val)}>Simpan</Button>
      </div>
    </div>
  );
}

Object.assign(window, { DetailScreen, ProposalScreen, NotesPanel, StatusHistory, KbliMatches });
