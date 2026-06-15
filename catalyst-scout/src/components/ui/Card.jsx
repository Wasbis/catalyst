const VARIANT_CLASSES = {
  surface: "border-border",
  interactive: "border-border hover:border-foreground-subtle/40 cursor-pointer transition-colors duration-120 ease-out",
  selected: "border-[1.5px] border-accent bg-accent/5",
  danger: "border-danger/20 bg-danger/5",
};

const PADDING_CLASSES = {
  compact: "p-3",
  default: "p-4",
  spacious: "p-5",
};

export default function Card({ variant = "surface", padding = "default", className = "", ...props }) {
  return (
    <div
      className={`rounded-[10px] border bg-surface ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ divider = false, className = "", ...props }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${divider ? "pb-3 mb-3 -mx-4 px-4 border-b border-border" : ""} ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return <h3 className={`text-sm font-medium text-foreground ${className}`} {...props} />;
}

export function CardSubtitle({ className = "", ...props }) {
  return <p className={`text-xs text-foreground-muted mt-0.5 ${className}`} {...props} />;
}
