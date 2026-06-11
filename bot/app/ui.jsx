/* ============================================================
   Catalyst :: Icons + UI primitives
   ============================================================ */
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

/* ---------------- Icons (stroke, 1.6) ---------------- */
const PATHS = {
  tenders: "M3 4h18M3 9h18M3 14h12M3 19h8",
  kanban: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v7h-4z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  tag: "M3 5v6.5a2 2 0 0 0 .59 1.42l7.5 7.5a2 2 0 0 0 2.82 0l5.6-5.6a2 2 0 0 0 0-2.82l-7.5-7.5A2 2 0 0 0 11.5 4H5a2 2 0 0 0-2 2z M8 8h.01",
  activity: "M3 12h4l3 8 4-16 3 8h4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.18l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 13a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.18-2.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.18l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 11a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54z",
  chevDown: "M6 9l6 6 6-6",
  chevRight: "M9 6l6 6-6 6",
  chevLeft: "M15 6l-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  building: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-3 M9 9v.01M9 12v.01M9 15v.01M9 18v.01",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3",
  ai: "M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  dots: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  drag: "M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  zap: "M13 2L3 14h9l-1 8 10-12h-9z",
  trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z",
  doc: "M9 13h6m-6 4h6M9 9h1 M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  layers: "M12 2L2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  trendUp: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  calendar: "M8 2v4M16 2v4M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};
function Icon({ name, size = 18, className = "", style = {} }) {
  const d = PATHS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {d.split(" M").map((seg, i) => <path key={i} d={(i ? "M" : "") + seg} />)}
    </svg>
  );
}

/* ---------------- Button ---------------- */
function Button({ variant = "primary", size = "md", icon, iconRight, children, className = "", ...rest }) {
  const cls = `btn btn-${variant} btn-${size} ${className}`;
  return (
    <button {...rest} className={cls}>
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 15 : 17} />}
    </button>
  );
}

/* ---------------- Badge ---------------- */
function Badge({ tone = "slate", children, dot = false, className = "" }) {
  return (
    <span className={`badge badge-${tone} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

function ScoreBadge({ score, size = "md" }) {
  const tone = window.CATALYST.scoreTone(score);
  const reco = window.CATALYST.scoreReco(score);
  if (score == null) return <span className="score-empty">—</span>;
  return (
    <span className={`score score-${tone} score-${size}`}>
      <span className="score-num">{score}</span>
      <span className="score-reco">{reco}</span>
    </span>
  );
}

function StatusBadge({ status }) {
  const tone = window.CATALYST.STATUS_TONE[status];
  const label = window.CATALYST.STATUS_LABELS[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

/* ---------------- Card ---------------- */
function Card({ children, className = "", ...rest }) {
  return <div {...rest} className={`card ${className}`}>{children}</div>;
}

/* ---------------- Inputs ---------------- */
function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
function Input(props) { return <input className="input" {...props} />; }
function Textarea(props) { return <textarea className="input textarea" {...props} />; }
function Select({ children, ...props }) {
  return (
    <div className="select-wrap">
      <select className="input select" {...props}>{children}</select>
      <Icon name="chevDown" size={15} className="select-chev" />
    </div>
  );
}

/* ---------------- Modal ---------------- */
function Modal({ open, onClose, title, subtitle, children, footer, width = 560 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup"><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Toast ---------------- */
const ToastCtx = createContext(null);
function useToast() { return useContext(ToastCtx); }
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, tone = "default") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon name={t.tone === "success" ? "check" : t.tone === "error" ? "x" : "zap"} size={16} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Confirm dialog ---------------- */
function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = "Hapus", tone = "danger" }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={440}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button>
      </>}>
      <p className="muted" style={{ lineHeight: 1.6 }}>{body}</p>
    </Modal>
  );
}

/* ---------------- Pagination ---------------- */
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <Icon name="chevLeft" size={15} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => onPage(p)}>{p}</button>
      ))}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        <Icon name="chevRight" size={15} />
      </button>
    </div>
  );
}

/* ---------------- Empty state ---------------- */
function EmptyState({ icon = "search", title, body }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={26} /></div>
      <h4>{title}</h4>
      {body && <p>{body}</p>}
    </div>
  );
}

/* ---------------- Avatar ---------------- */
function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials}</div>;
}

Object.assign(window, {
  Icon, Button, Badge, ScoreBadge, StatusBadge, Card, Field, Input, Textarea, Select,
  Modal, ToastProvider, useToast, ConfirmDialog, Pagination, EmptyState, Avatar,
});
