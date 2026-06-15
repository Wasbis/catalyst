export default function Input({ className = "", error = false, ...props }) {
  return (
    <input
      className={`block w-full h-9 rounded-lg border px-3 text-[13px] text-foreground placeholder:text-foreground-subtle bg-surface transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        error
          ? "border-danger/60 focus:border-danger/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
          : "border-border hover:border-foreground-subtle focus:border-accent/50 focus:shadow-[0_0_0_3px_var(--accent-active)]"
      } ${className}`}
      {...props}
    />
  );
}
