/* ============================================================
   Catalyst :: KBLI, Scraper Log, Settings, Login
   ============================================================ */
const { useState: useStateO } = React;

/* ================= LOGIN ================= */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useStateO("dewi@cliste.co.id");
  const [pw, setPw] = useStateO("ChangeMe123!");
  const [loading, setLoading] = useStateO(false);
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => onLogin(email), 700);
  };
  return (
    <div className="login-screen">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark lg">C</div>
          <div>
            <div className="login-name">Catalyst</div>
            <div className="login-sub">Tender Platform · Cliste</div>
          </div>
        </div>
        <h1 className="login-title">Masuk ke workspace</h1>
        <p className="login-desc">Platform pengelolaan tender end-to-end — dari penemuan peluang hingga proposal.</p>
        <form onSubmit={submit} className="login-form">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Kata sandi">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          </Field>
          <Button variant="primary" className="full" type="submit" disabled={loading}>
            {loading ? "Memverifikasi…" : "Masuk"}
          </Button>
        </form>
        <div className="login-foot">
          <Icon name="shield" size={13} />
          Registrasi user hanya melalui admin · JWT httpOnly session
        </div>
      </div>
    </div>
  );
}

/* ================= KBLI ================= */
function KbliScreen() {
  const C = window.CATALYST;
  const toast = useToast();
  const [list, setList] = useStateO(C.KBLI_MASTER);
  const [q, setQ] = useStateO("");
  const [formOpen, setFormOpen] = useStateO(false);
  const [importOpen, setImportOpen] = useStateO(false);
  const [editItem, setEditItem] = useStateO(null);
  const [confirmDel, setConfirmDel] = useStateO(null);

  const filtered = list.filter((k) => !q || k.code.includes(q) || k.desc.toLowerCase().includes(q.toLowerCase()));

  const save = (item) => {
    if (editItem) setList((l) => l.map((k) => k.code === editItem.code ? item : k));
    else setList((l) => [item, ...l]);
    setFormOpen(false); setEditItem(null);
    toast(editItem ? "KBLI diperbarui" : "KBLI ditambahkan", "success");
  };
  const toggle = (code) => setList((l) => l.map((k) => k.code === code ? { ...k, active: !k.active } : k));
  const remove = (code) => { setList((l) => l.filter((k) => k.code !== code)); setConfirmDel(null); toast("KBLI dihapus", "success"); };
  const onImport = (rows) => { setList((l) => [...rows, ...l]); setImportOpen(false); toast(`${rows.length} KBLI diimpor dari PDF`, "success"); };

  return (
    <div className="screen">
      <div className="screen-intro">
        <p className="muted">Master kode KBLI yang dipakai mesin pencocokan AI untuk menilai relevansi tender terhadap bidang usaha Cliste.</p>
      </div>
      <div className="toolbar">
        <div className="search-box wide">
          <Icon name="search" size={16} />
          <input placeholder="Cari kode atau deskripsi…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="toolbar-right">
          <Button variant="secondary" icon="upload" onClick={() => setImportOpen(true)}>Import PDF (NIB)</Button>
          <Button variant="primary" icon="plus" onClick={() => { setEditItem(null); setFormOpen(true); }}>Tambah KBLI</Button>
        </div>
      </div>

      <Card className="table-card">
        <table className="data-table">
          <thead><tr><th>Kode</th><th>Deskripsi</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map((k) => (
              <tr key={k.code}>
                <td><span className="kbli-code lg">{k.code}</span></td>
                <td>{k.desc}</td>
                <td>
                  <button className={`toggle ${k.active ? "on" : ""}`} onClick={() => toggle(k.code)}>
                    <span className="toggle-knob" />
                  </button>
                  <span className="muted small" style={{ marginLeft: 8 }}>{k.active ? "Aktif" : "Nonaktif"}</span>
                </td>
                <td className="cell-actions">
                  <div className="action-wrap">
                    <button className="icon-btn" onClick={() => { setEditItem(k); setFormOpen(true); }}><Icon name="edit" size={15} /></button>
                    <button className="icon-btn danger-hover" onClick={() => setConfirmDel(k)}><Icon name="trash" size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <KbliFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} onSave={save} item={editItem} />
      <PdfImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={onImport} />
      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => remove(confirmDel.code)}
        title="Hapus kode KBLI?" body={confirmDel ? `Kode ${confirmDel.code} akan dihapus dari master. Tender lama yang sudah dicocokkan tidak terpengaruh.` : ""} />
    </div>
  );
}

function KbliFormModal({ open, onClose, onSave, item }) {
  const [code, setCode] = useStateO("");
  const [desc, setDesc] = useStateO("");
  React.useEffect(() => { if (open) { setCode(item?.code || ""); setDesc(item?.desc || ""); } }, [open, item]);
  return (
    <Modal open={open} onClose={onClose} title={item ? "Edit KBLI" : "Tambah KBLI"} width={520}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" disabled={!code || !desc} onClick={() => onSave({ code, desc, active: item?.active ?? true })}>Simpan</Button>
      </>}>
      <div className="form-grid">
        <Field label="Kode KBLI"><Input value={code} disabled={!!item} onChange={(e) => setCode(e.target.value)} placeholder="mis. 71102" /></Field>
        <div className="span-2"><Field label="Deskripsi"><Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi bidang usaha…" /></Field></div>
      </div>
    </Modal>
  );
}

function PdfImportModal({ open, onClose, onImport }) {
  const [stage, setStage] = useStateO("upload"); // upload | parsing | preview
  const [rows, setRows] = useStateO([]);
  const PARSED = [
    { code: "42911", desc: "Konstruksi Bangunan Sipil Lainnya YTDL", active: true, keep: true },
    { code: "46599", desc: "Perdagangan Besar Mesin, Peralatan dan Perlengkapan Lainnya", active: true, keep: true },
    { code: "71209", desc: "Analisis dan Uji Teknis Lainnya", active: true, keep: true },
    { code: "72104", desc: "Penelitian dan Pengembangan Rekayasa dan Teknologi", active: true, keep: true },
  ];
  React.useEffect(() => { if (open) { setStage("upload"); setRows([]); } }, [open]);

  const doParse = () => {
    setStage("parsing");
    setTimeout(() => { setRows(PARSED); setStage("preview"); }, 1400);
  };
  const toggleKeep = (i) => setRows((r) => r.map((x, idx) => idx === i ? { ...x, keep: !x.keep } : x));
  const commit = () => onImport(rows.filter((r) => r.keep).map(({ keep, ...r }) => r));

  return (
    <Modal open={open} onClose={onClose} title="Import KBLI dari PDF" width={640}
      subtitle="Unggah dokumen NIB/OSS. Hasil parsing bisa direview & dikoreksi sebelum disimpan."
      footer={stage === "preview" ? <>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" icon="check" onClick={commit}>Simpan {rows.filter((r) => r.keep).length} kode</Button>
      </> : null}>
      {stage === "upload" && (
        <div className="upload-zone" onClick={doParse}>
          <div className="upload-icon"><Icon name="upload" size={28} /></div>
          <strong>Klik untuk unggah PDF</strong>
          <span className="muted small">NIB / dokumen OSS · maks 10 MB</span>
          <span className="upload-sample">contoh: nibcri.pdf</span>
        </div>
      )}
      {stage === "parsing" && (
        <div className="parsing-state">
          <div className="gen-spinner" />
          <strong>Mem-parsing tabel PDF…</strong>
          <span className="muted small">Mengekstrak kode & deskripsi KBLI via cell-based parsing</span>
        </div>
      )}
      {stage === "preview" && (
        <div className="import-preview">
          <div className="import-banner"><Icon name="check" size={15} />{rows.length} kode KBLI berhasil di-parse. Hilangkan centang untuk mengecualikan.</div>
          <table className="data-table compact">
            <thead><tr><th>Simpan</th><th>Kode</th><th>Deskripsi</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.keep ? "" : "row-off"}>
                  <td><input type="checkbox" checked={r.keep} onChange={() => toggleKeep(i)} /></td>
                  <td><span className="kbli-code">{r.code}</span></td>
                  <td>{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

/* ================= SCRAPER LOG ================= */
function ScraperLogScreen() {
  const C = window.CATALYST;
  const failing = C.SCRAPER_LOG.filter((j) => j.status === "failed").length;
  const toneFor = { success: "green", failed: "red", partial: "amber" };
  const labelFor = { success: "Sukses", failed: "Gagal", partial: "Sebagian" };
  return (
    <div className="screen">
      <div className="screen-intro">
        <p className="muted">Riwayat eksekusi scraper otomatis per platform. Scheduler berjalan in-process (CIVD 12 jam, GeoDipa 24 jam) dengan retry maksimal 3x.</p>
      </div>

      {failing >= 1 && (
        <div className="alert-banner">
          <Icon name="shield" size={18} />
          <div>
            <strong>GeoDipa gagal pada 2 run terakhir berturut-turut</strong>
            <span>Timeout HTTP 504 saat memuat halaman detail. Periksa ketersediaan sumber atau koneksi jaringan.</span>
          </div>
          <Button variant="ghost" size="sm" icon="refresh">Jalankan ulang</Button>
        </div>
      )}

      <div className="scraper-stats">
        {[
          { p: "CIVD", label: "CIVD · SKK Migas", interval: "tiap 12 jam", last: "3 jam lalu", ok: true },
          { p: "GEODIPA", label: "GeoDipa", interval: "tiap 24 jam", last: "gagal", ok: false },
        ].map((s) => (
          <Card key={s.p} className="scraper-stat">
            <div className="ss-head">
              <span className={`source-chip src-${s.p.toLowerCase()}`}>{C.SOURCE_SHORT[s.p]}</span>
              <span className={`ss-status ${s.ok ? "ok" : "bad"}`}><span className="ss-dot" />{s.ok ? "Sehat" : "Perlu perhatian"}</span>
            </div>
            <div className="ss-name">{s.label}</div>
            <div className="ss-meta"><span className="muted small">Jadwal {s.interval}</span><span className="muted small">Run terakhir: {s.last}</span></div>
          </Card>
        ))}
      </div>

      <Card className="table-card">
        <table className="data-table">
          <thead><tr><th>Job</th><th>Platform</th><th>Mulai</th><th>Durasi</th><th>Ditemukan</th><th>Baru / Update</th><th>Status</th></tr></thead>
          <tbody>
            {C.SCRAPER_LOG.map((j) => (
              <tr key={j.id}>
                <td><span className="mono-id">{j.id}</span></td>
                <td><span className={`source-chip src-${j.platform.toLowerCase()}`}>{C.SOURCE_SHORT[j.platform]}</span></td>
                <td className="muted">{C.formatDateTime(j.startedAt)}</td>
                <td>{j.durationSec}s</td>
                <td>{j.found}</td>
                <td><span className="badge badge-green">+{j.new}</span> <span className="badge badge-blue">~{j.updated}</span></td>
                <td>
                  <Badge tone={toneFor[j.status]} dot>{labelFor[j.status]}</Badge>
                  {j.error && <div className="job-error">{j.error}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ================= SETTINGS ================= */
function SettingsScreen({ user }) {
  const C = window.CATALYST;
  const toast = useToast();
  const [tab, setTab] = useStateO("users");
  const [users, setUsers] = useStateO(C.USERS);
  const [addOpen, setAddOpen] = useStateO(false);

  const TABS = [
    { key: "users", label: "Pengguna", icon: "user" },
    { key: "masking", label: "Data Masking", icon: "shield" },
    { key: "templates", label: "Template Proposal", icon: "doc" },
    { key: "scraper", label: "Scraper", icon: "activity" },
  ];

  return (
    <div className="screen">
      <div className="settings-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`settings-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            <Icon name={t.icon} size={16} />{t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <Card className="panel">
          <div className="panel-head">
            <h3>Manajemen Pengguna</h3>
            {user.role === "admin"
              ? <Button size="sm" variant="primary" icon="plus" onClick={() => setAddOpen(true)}>Tambah User</Button>
              : <span className="rbac-note"><Icon name="shield" size={13} />Hanya admin yang dapat menambah user</span>}
          </div>
          <table className="data-table">
            <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Login terakhir</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><div className="user-cell"><Avatar name={u.name} size={30} /><strong>{u.name}</strong></div></td>
                  <td className="mono-id">{u.email}</td>
                  <td><Badge tone={u.role === "admin" ? "violet" : u.role === "manager" ? "blue" : "slate"}>{C.ROLE_LABELS[u.role]}</Badge></td>
                  <td className="muted">{C.relativeTime(u.lastLogin)}</td>
                  <td><span className="ss-status ok"><span className="ss-dot" />Aktif</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "masking" && (
        <Card className="panel">
          <div className="panel-head"><h3>Aturan Data Masking</h3><span className="ai-tag"><Icon name="shield" size={13} />pre-prod AI</span></div>
          <p className="muted small" style={{ marginBottom: 16 }}>Pola ini menyamarkan data sensitif sebelum teks dikirim ke model AI (matching & proposal), lalu di-unmask pada hasilnya.</p>
          <table className="data-table">
            <thead><tr><th>Kategori</th><th>Pola</th><th>Token</th></tr></thead>
            <tbody>
              {C.MASKING.map((m) => (
                <tr key={m.id}>
                  <td><Badge tone={m.category === "builtin" ? "slate" : "violet"}>{m.category}</Badge></td>
                  <td>{m.pattern}</td>
                  <td><span className="mask-token">{m.token}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "templates" && (
        <Card className="panel">
          <div className="panel-head"><h3>Template Proposal (.docx)</h3><Button size="sm" variant="primary" icon="upload" onClick={() => toast("Form unggah template dibuka", "default")}>Unggah</Button></div>
          <div className="template-list">
            {C.TEMPLATES.map((t) => (
              <div key={t.id} className="template-item">
                <span className="tpl-ico"><Icon name="doc" size={18} /></span>
                <div className="tpl-body">
                  <strong>{t.name}</strong>
                  <span className="muted small">{t.sections} bagian · {t.size} · diperbarui {C.formatDate(t.updatedAt)}</span>
                </div>
                <button className="icon-btn"><Icon name="download" size={16} /></button>
                <button className="icon-btn danger-hover"><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "scraper" && (
        <Card className="panel">
          <div className="panel-head"><h3>Konfigurasi Scraper</h3></div>
          <div className="scraper-config">
            {[
              { p: "CIVD · SKK Migas", interval: 12, on: true },
              { p: "GeoDipa", interval: 24, on: true },
            ].map((s, i) => (
              <div key={i} className="config-row">
                <div><strong>{s.p}</strong><span className="muted small">Scrape otomatis tiap {s.interval} jam</span></div>
                <button className={`toggle on`}><span className="toggle-knob" /></button>
              </div>
            ))}
            <div className="config-row">
              <div><strong>Politeness delay</strong><span className="muted small">Jeda antar-request untuk menghormati sumber</span></div>
              <span className="config-val">2.5 detik</span>
            </div>
            <div className="config-row">
              <div><strong>Retry maksimal</strong><span className="muted small">Percobaan ulang saat request gagal</span></div>
              <span className="config-val">3×</span>
            </div>
          </div>
        </Card>
      )}

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)}
        onAdd={(u) => { setUsers((us) => [...us, { ...u, id: "U" + (us.length + 1), active: true, lastLogin: C.TODAY.toISOString() }]); setAddOpen(false); toast("User ditambahkan", "success"); }} />
    </div>
  );
}

function AddUserModal({ open, onClose, onAdd }) {
  const [f, setF] = useStateO({ name: "", email: "", role: "engineer" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  React.useEffect(() => { if (open) setF({ name: "", email: "", role: "engineer" }); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Tambah Pengguna" width={500}
      subtitle="User baru dibuat oleh admin — tidak ada registrasi publik."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" disabled={!f.name || !f.email} onClick={() => onAdd(f)}>Buat User</Button>
      </>}>
      <div className="form-grid">
        <div className="span-2"><Field label="Nama lengkap"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
        <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@cliste.co.id" /></Field>
        <Field label="Peran">
          <Select value={f.role} onChange={(e) => set("role", e.target.value)}>
            <option value="engineer">Engineer</option>
            <option value="manager">Manager</option>
            <option value="admin">Administrator</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

Object.assign(window, { LoginScreen, KbliScreen, ScraperLogScreen, SettingsScreen });
