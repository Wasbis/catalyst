"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "max-w-[360px]",
  md: "max-w-[480px]",
  lg: "max-w-[600px]",
  xl: "max-w-[720px]",
};

export default function Modal({ isOpen, onClose, title, children, footer, size = "md" }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay-in bg-black/40 dark:bg-black/60"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-[14px] border border-border bg-surface animate-panel-in ${SIZE_CLASSES[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 shrink-0">
          <h2 id="modal-title" className="text-base font-medium text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors duration-120 ease-out cursor-pointer"
            aria-label="Tutup modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
