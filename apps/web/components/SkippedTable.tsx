import type { SkippedRow } from "@groweasy/shared";

export function SkippedTable({ skipped }: { skipped: SkippedRow[] }) {
  if (skipped.length === 0) {
    return <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-soft">Nothing was skipped. Every row made it in.</p>;
  }
  return (
    <div className="overflow-auto rounded-card border border-line bg-surface" style={{ maxHeight: "32rem" }}>
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr>
            <th className="border-b border-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Row</th>
            <th className="border-b border-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Reason</th>
            <th className="border-b border-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Original data</th>
          </tr>
        </thead>
        <tbody>
          {skipped.map((s) => (
            <tr key={s.rowIndex} className="align-top hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">#{s.rowIndex}</td>
              <td className="px-4 py-3 text-status-bad">{s.reason}</td>
              <td className="px-4 py-3 text-ink-soft">
                <code className="block max-w-md truncate text-xs">{JSON.stringify(s.raw)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
