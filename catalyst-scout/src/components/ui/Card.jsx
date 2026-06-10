export default function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-sm ${className}`}
      {...props}
    />
  );
}
