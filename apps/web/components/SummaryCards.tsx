import type { ImportTotals } from "@groweasy/shared";
import { CheckCircle2, SkipForward, Rows3 } from "lucide-react";

export function SummaryCards({ totals }: { totals: ImportTotals }) {
  const cards = [
    { label: "Total rows", value: totals.totalRows, icon: Rows3, fg: "text-ink" },
    { label: "Imported", value: totals.imported, icon: CheckCircle2, fg: "text-status-good" },
    { label: "Skipped", value: totals.skipped, icon: SkipForward, fg: "text-status-neutral" },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map(({ label, value, icon: Icon, fg }) => (
        <div key={label} className="rounded-card border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
            <Icon size={16} className={fg} />
          </div>
          <p className={`mt-2 text-2xl font-bold ${fg}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
