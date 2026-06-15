"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const VARIANT = {
  success: { Icon: CheckCircle, color: "text-success", border: "border-l-success", bar: "bg-success" },
  warning: { Icon: AlertTriangle, color: "text-warning", border: "border-l-warning", bar: "bg-warning" },
  error: { Icon: XCircle, color: "text-danger", border: "border-l-danger", bar: "bg-danger" },
  info: { Icon: Info, color: "text-accent-400", border: "border-l-accent", bar: "bg-accent" },
};

const DEFAULT_DURATION = { success: 4000, warning: 4000, error: 6000, info: 4000 };

function ToastItem({ toast, onDismiss }) {
  const { Icon, color, border, bar } = VARIANT[toast.type] ?? VARIANT.info;

  return (
    <div
      className={`relative w-80 overflow-hidden rounded-[10px] border border-l-2 border-border ${border} bg-surface px-3.5 py-3 animate-toast-in`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`shrink-0 mt-0.5 ${color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground leading-snug">{toast.message}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-foreground-muted leading-snug">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 text-foreground-subtle hover:text-foreground transition-colors duration-120 ease-out cursor-pointer"
          aria-label="Tutup notifikasi"
        >
          <X size={14} />
        </button>
      </div>
      <div
        key={toast.id}
        className={`absolute bottom-0 left-0 h-0.5 ${bar} animate-[toast-progress_linear_forwards]`}
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", options = {}) => {
      const duration = options.duration ?? DEFAULT_DURATION[type] ?? 4000;
      const id = ++counterRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, type, duration, description: options.description }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
