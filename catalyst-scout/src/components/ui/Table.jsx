const VARIANT_WRAPPER = {
  plain: "overflow-x-auto",
  panel: "overflow-hidden rounded-[14px] border border-border bg-surface",
};

const VARIANT_WRAPPER_SCROLLABLE = {
  plain: "flex-1 min-h-0 overflow-auto",
  panel: "flex-1 min-h-0 overflow-y-auto rounded-[14px] border border-border bg-surface",
};

const VARIANT_TABLE = {
  plain: "w-full text-left text-sm",
  panel: "w-full border-collapse text-[13px]",
};

const VARIANT_THEAD_ROW = {
  plain: "border-b border-border text-xs font-medium uppercase tracking-wide text-foreground-subtle",
  panel: "bg-surface-hover border-b border-border",
};

const VARIANT_TH = {
  plain: "px-4 py-3 font-medium",
  panel: "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-foreground-muted",
};

const VARIANT_TD = {
  plain: "px-4 py-3 align-top",
  panel: "px-4 py-3",
};

const VARIANT_TR = {
  plain: "border-b border-border last:border-0 hover:bg-surface-hover",
  panel: "border-b border-border last:border-0 hover:bg-surface-hover transition-colors duration-100",
};

/**
 * Generic table shell shared by list/panel-style tables.
 * `columns`: [{ key, header, headerClassName?, cellClassName?, render(row, index) }]
 * `getRowProps(row)` may return extra <tr> props; `className` from it is merged with the variant default.
 */
export default function Table({
  columns,
  data,
  rowKey = (row) => row.id,
  getRowProps,
  variant = "plain",
  sticky = false,
  scrollable = false,
  theadClassName,
  emptyState,
}) {
  const wrapperClass = scrollable ? VARIANT_WRAPPER_SCROLLABLE[variant] : VARIANT_WRAPPER[variant];

  if (!data || data.length === 0) {
    if (variant === "panel" || scrollable) {
      return <div className={wrapperClass}>{emptyState}</div>;
    }
    return emptyState;
  }

  const table = (
    <table className={VARIANT_TABLE[variant]}>
      <thead className={sticky ? "sticky top-0 z-10" : undefined}>
        <tr className={theadClassName ?? VARIANT_THEAD_ROW[variant]}>
          {columns.map((col) => (
            <th key={col.key} className={col.headerClassName ?? VARIANT_TH[variant]}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const { className: extraClassName, ...rowProps } = getRowProps?.(row) ?? {};
          return (
            <tr key={rowKey(row)} className={`${VARIANT_TR[variant]} ${extraClassName ?? ""}`} {...rowProps}>
              {columns.map((col) => (
                <td key={col.key} className={col.cellClassName ?? VARIANT_TD[variant]}>
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (variant === "panel") {
    return (
      <div className={wrapperClass}>
        <div className="overflow-hidden rounded-[10px] border border-border">{table}</div>
      </div>
    );
  }

  return <div className={wrapperClass}>{table}</div>;
}
