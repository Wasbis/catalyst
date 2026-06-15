const VARIANT_CLASSES = {
  kejar: "bg-accent-soft text-accent-400 dark:text-accent-300",
  tinjau: "bg-warning/15 text-warning",
  lewati: "bg-danger/15 text-danger",
  active: "bg-success/15 text-success",
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  neutral: "bg-surface-hover text-foreground-muted",
  outline: "bg-transparent border border-border text-foreground-muted",
};

const SIZE_CLASSES = {
  default: "px-2 py-[3px] rounded-[5px] text-[11px]",
  sm: "px-1.5 py-0.5 rounded-[4px] text-[10.5px]",
};

export default function Badge({ variant, size = "default", className = "", ...props }) {
  const colorClasses = variant ? VARIANT_CLASSES[variant] : "";
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium leading-none ${SIZE_CLASSES[size]} ${colorClasses} ${className}`}
      {...props}
    />
  );
}
