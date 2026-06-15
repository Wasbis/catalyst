export default function FilterBar({ className = "", children }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-[14px] border border-border bg-surface p-2.5 ${className}`}>
      {children}
    </div>
  );
}
