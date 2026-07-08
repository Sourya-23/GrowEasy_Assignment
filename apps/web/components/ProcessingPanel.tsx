import { Loader2 } from "lucide-react";
import type { Progress } from "../hooks/useImport";

const stageLabel: Record<Progress["stage"], string> = {
  parsing: "Parsing your CSV",
  mapping: "Analyzing columns with AI",
  extracting: "Extracting CRM records",
  done: "Finishing up",
};

export function ProcessingPanel({ progress }: { progress: Progress }) {
  const pct =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : null;

  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-teal/10 text-brand-teal">
        <Loader2 size={26} className="animate-spin" />
      </div>
      <p className="text-base font-bold text-ink">{stageLabel[progress.stage]}</p>
      {progress.totalRows > 0 && (
        <p className="mt-1 text-sm text-ink-soft">{progress.totalRows} rows detected</p>
      )}

      {progress.stage === "extracting" && progress.total > 0 && (
        <div className="mx-auto mt-6 max-w-sm">
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand-teal transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Batch {progress.completed} of {progress.total}
            {progress.failed > 0 && (
              <span className="text-status-bad"> · {progress.failed} retried/failed</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
