export default function TenderTextBlock({ text }) {
  // Collapsible for long texts
  const MAX_LINES = 10;
  const lines = text.split("\n");
  const isLong = lines.length > MAX_LINES;

  return (
    <details className="group">
      <summary className={`text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap cursor-pointer list-none ${isLong ? "" : "pointer-events-none"}`}>
        {isLong
          ? lines.slice(0, MAX_LINES).join("\n") + "\n..."
          : text}
      </summary>
      {isLong && (
        <div className="mt-2 text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      )}
      {isLong && (
        <span className="mt-1 text-xs text-accent cursor-pointer group-open:hidden">
          Tampilkan selengkapnya
        </span>
      )}
    </details>
  );
}
