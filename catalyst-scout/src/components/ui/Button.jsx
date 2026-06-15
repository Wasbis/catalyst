import { Loader2 } from "lucide-react";

const VARIANT_CLASSES = {
  primary: "bg-accent text-white hover:opacity-[0.92] focus-visible:ring-accent/40",
  outline: "bg-transparent text-accent border border-accent hover:bg-accent-soft focus-visible:ring-accent/30",
  ghost: "bg-accent-soft text-accent hover:opacity-80 focus-visible:ring-accent/30",
  neutral: "bg-surface-hover text-foreground-muted border border-border hover:text-foreground hover:border-foreground-subtle focus-visible:ring-accent/30",
  danger: "bg-red-500/10 text-red-600 hover:bg-red-500/15 focus-visible:ring-red-500/30",
  "danger-solid": "bg-danger text-white hover:opacity-[0.92] focus-visible:ring-danger/40",
};

const SIZE_CLASSES = {
  sm: "h-[30px] px-3 text-xs gap-1",
  default: "h-9 px-4 text-[13px] gap-1.5",
  lg: "h-[42px] px-5 text-sm gap-1.5",
};

export default function Button({
  variant = "primary",
  size = "default",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium select-none cursor-pointer whitespace-nowrap transition-all duration-120 ease-out active:scale-[0.97] active:opacity-[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}
