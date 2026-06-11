/* ============================================================
   Catalyst :: Layout shell — Sidebar, Topbar, BellNotification
   ============================================================ */
const { useState: useStateL, useRef: useRefL, useEffect: useEffectL } = React;

const NAV = [
  { key: "tenders", label: "Tenders", icon: "tenders" },
  { key: "kbli", label: "KBLI", icon: "tag" },
  { key: "scraper", label: "Scraper Log", icon: "activity" },
  { key: "settings", label: "Settings", icon: "settings" },
];

function Sidebar({ route, navigate, collapsed, onToggle, user }) {
  const C = window.CATALYST;
  const active = (route.name === "detail" || route.name === "proposal") ? "tenders" : route.name;
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">C</div>
        {!collapsed && (
          <div className="brand-text">
            <div className="brand-name">Catalyst</div>
            <div className="brand-sub">by Cliste</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <button key={n.key}
            className={`nav-item ${active === n.key ? "active" : ""}`}
            onClick={() => navigate({ name: n.key })}
            title={collapsed ? n.label : undefined}>
            <Icon name={n.icon} size={19} />
            {!collapsed && <span>{n.label}</span>}
            {n.key === "tenders" && !collapsed && (
              <span className="nav-count">{C.computeStats(C.TENDERS).active}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        {!collapsed && (
          <div className="env-pill">
            <span className="env-dot" /> Server Tailscale · 100.112.188.84
          </div>
        )}
        <button className="collapse-btn" onClick={onToggle} title="Lebar sidebar">
          <Icon name={collapsed ? "chevRight" : "chevLeft"} size={16} />
          {!collapsed && <span>Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}

const ROUTE_TITLES = {
  tenders: "Tenders", kbli: "Master KBLI", scraper: "Riwayat Scraping",
  settings: "Pengaturan", detail: "Detail Tender", proposal: "Proposal Generator",
};

function Topbar({ route, navigate, user, onLogout }) {
  const title = ROUTE_TITLES[route.name] || "Catalyst";
  const crumbs = [];
  if (route.name === "detail") crumbs.push({ label: "Tenders", to: { name: "tenders" } });
  if (route.name === "proposal") {
    crumbs.push({ label: "Tenders", to: { name: "tenders" } });
    crumbs.push({ label: route.tenderId, to: { name: "detail", tenderId: route.tenderId } });
  }
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <span key={i} className="crumb-link" onClick={() => navigate(c.to)}>
              {c.label}<Icon name="chevRight" size={13} />
            </span>
          ))}
          <h1 className="page-title">{title}</h1>
        </div>
      </div>
      <div className="topbar-right">
        <BellNotification navigate={navigate} />
        <div className="topbar-user">
          <Avatar name={user.name} size={34} />
          <div className="user-meta">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{window.CATALYST.ROLE_LABELS[user.role]}</span>
          </div>
          <button className="icon-btn" onClick={onLogout} title="Keluar"><Icon name="logout" size={17} /></button>
        </div>
      </div>
    </header>
  );
}

function BellNotification({ navigate }) {
  const C = window.CATALYST;
  const [open, setOpen] = useStateL(false);
  const [notifs, setNotifs] = useStateL(C.NOTIFICATIONS);
  const ref = useRefL(null);
  const unread = notifs.filter((n) => !n.read).length;

  useEffectL(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const markAll = () => setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
  const iconFor = { score: "zap", error: "shield", deadline: "clock", status: "trophy" };
  const toneFor = { score: "violet", error: "red", deadline: "amber", status: "green" };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="icon-btn bell-btn" onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" size={19} />
        {unread > 0 && <span className="bell-count">{unread}</span>}
      </button>
      {open && (
        <div className="bell-panel">
          <div className="bell-head">
            <span>Notifikasi</span>
            {unread > 0 && <button className="link-btn" onClick={markAll}>Tandai dibaca</button>}
          </div>
          <div className="bell-list">
            {notifs.map((n) => (
              <button key={n.id}
                className={`bell-item ${n.read ? "" : "unread"}`}
                onClick={() => { if (n.tenderId) { navigate({ name: "detail", tenderId: n.tenderId }); setOpen(false); }
                  setNotifs((ns) => ns.map((x) => x.id === n.id ? { ...x, read: true } : x)); }}>
                <span className={`bell-ico bell-ico-${toneFor[n.type]}`}><Icon name={iconFor[n.type]} size={15} /></span>
                <span className="bell-body">
                  <span className="bell-title">{n.title}</span>
                  <span className="bell-text">{n.body}</span>
                  <span className="bell-time">{C.relativeTime(n.at)}</span>
                </span>
                {!n.read && <span className="bell-unread-dot" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppShell({ route, navigate, user, onLogout, children }) {
  const [collapsed, setCollapsed] = useStateL(false);
  return (
    <div className={`shell ${collapsed ? "shell-collapsed" : ""}`}>
      <Sidebar route={route} navigate={navigate} collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)} user={user} />
      <div className="main">
        <Topbar route={route} navigate={navigate} user={user} onLogout={onLogout} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, BellNotification, AppShell });
