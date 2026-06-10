const VARIANT_CLASSES = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-hover focus-visible:outline-accent",
  secondary: "bg-surface text-foreground border border-border hover:bg-surface-hover focus-visible:outline-border",
  danger: "bg-danger text-white shadow-sm hover:bg-danger-hover focus-visible:outline-danger",
  ghost: "bg-transparent text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-border",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
