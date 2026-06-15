"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Drawer({ isOpen, onClose, title, headerActions, children, footer }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-110 bg-surface border-l border-border flex flex-col animate-drawer-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="drawer-title" className="text-sm font-semibold text-foreground truncate">
            {title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors duration-120 ease-out cursor-pointer"
              aria-label="Tutup drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
