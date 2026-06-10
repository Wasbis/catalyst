export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-hover disabled:text-foreground-subtle ${className}`}
      {...props}
    />
  );
}
