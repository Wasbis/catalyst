export default function Label({ className = "", ...props }) {
  return (
    <label
      className={`block text-sm font-medium text-foreground-muted ${className}`}
      {...props}
    />
  );
}
