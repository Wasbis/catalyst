export default function Skeleton({ className = "", ...props }) {
  return <div className={`animate-shimmer rounded ${className}`} {...props} />;
}

export function SkeletonText({ width = "100%", className = "" }) {
  return <Skeleton className={`h-3 rounded ${className}`} style={{ width }} />;
}

export function SkeletonAvatar({ size = 32, className = "" }) {
  return <Skeleton className={`rounded-full shrink-0 ${className}`} style={{ width: size, height: size }} />;
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`rounded-[10px] border border-border bg-surface p-4 flex flex-col gap-2.5 ${className}`}>
      <SkeletonText width="40%" />
      <SkeletonText width="80%" />
      <SkeletonText width="60%" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 4 }) {
  return (
    <div className="flex items-center gap-4 h-12 px-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonText key={i} width={i === 0 ? "30%" : "16%"} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}
