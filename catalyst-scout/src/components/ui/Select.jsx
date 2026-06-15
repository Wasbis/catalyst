export default function Select({ className = "", ...props }) {
  return (
    <select
      className={`block w-full h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground transition-colors duration-150 hover:border-foreground-subtle focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_var(--accent-active)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
