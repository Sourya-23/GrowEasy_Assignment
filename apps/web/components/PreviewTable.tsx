interface Props {
  headers: string[];
  rows: Record<string, string>[];
  maxHeight?: string;
}

/** Scrollable table with sticky header. Used for the raw preview. */
export function PreviewTable({ headers, rows, maxHeight = "20rem" }: Props) {
  return (
    <div className="overflow-auto rounded-card border border-line" style={{ maxHeight }}>
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap border-b border-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
              {headers.map((h) => (
                <td key={h} className="whitespace-nowrap border-b border-line px-4 py-3 text-ink">
                  {row[h] || <span className="text-ink-soft">-</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
