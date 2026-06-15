import Link from "next/link";

export default function Pagination({ page, totalPages, searchParams = {} }) {
  if (totalPages <= 1) return null;

  function buildHref(targetPage) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value == null || value === "") continue;
      params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  }

  return (
    <nav className="flex items-center justify-between px-1">
      <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
        Sebelumnya
      </PageLink>
      <span className="text-sm text-foreground-muted">
        Halaman {page} dari {totalPages}
      </span>
      <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
        Berikutnya
      </PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, children }) {
  if (disabled) {
    return (
      <span className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground-subtle">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors duration-120 ease-out active:scale-[0.97]"
    >
      {children}
    </Link>
  );
}
