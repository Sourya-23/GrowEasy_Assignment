"use client";

import { useState } from "react";
import { ChevronDown, Wand2 } from "lucide-react";
import type { ColumnMapping } from "@groweasy/shared";

const confTone: Record<string, string> = {
  high: "text-status-good",
  medium: "text-brand-teal",
  low: "text-status-neutral",
  none: "text-ink-soft",
};

export function MappingPanel({ mapping }: { mapping: ColumnMapping }) {
  const [open, setOpen] = useState(false);
  const mapped = mapping.entries.filter((e) => e.sourceColumns.length > 0);

  if (mapped.length === 0) return null;

  return (
    <div className="rounded-card border border-line bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Wand2 size={16} className="text-brand-teal" />
          How we read your file
        </span>
        <ChevronDown size={18} className={`text-ink-soft transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-line px-4 py-3">
          <ul className="space-y-2 text-sm">
            {mapped.map((e) => (
              <li key={e.crmField} className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs text-ink dark:bg-white/10">
                  {e.crmField}
                </code>
                <span className="text-ink-soft">from</span>
                <span className="text-ink">{e.sourceColumns.join(", ")}</span>
                <span className={`text-xs ${confTone[e.confidence]}`}>({e.confidence})</span>
              </li>
            ))}
          </ul>
          {mapping.notes && <p className="mt-3 text-xs text-ink-soft">{mapping.notes}</p>}
        </div>
      )}
    </div>
  );
}
