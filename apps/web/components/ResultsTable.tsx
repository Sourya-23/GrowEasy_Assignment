"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CrmRecord } from "@groweasy/shared";
import { StatusBadge } from "./StatusBadge";

// Shared column template so the header and every row line up. The table stays
// at least MIN_W wide, so on narrow screens the container scrolls horizontally.
const COLS =
  "minmax(140px,1.2fr) minmax(190px,1.6fr) minmax(150px,1.2fr) minmax(160px,1.2fr) minmax(120px,1fr) 120px 130px 72px";
const MIN_W = 980;
const HEADERS = ["Lead Name", "Email", "Contact", "Date Created", "Company", "Status", "Source", ""];

/**
 * Virtualized results table. Only the rows in view are mounted, so a large
 * import (thousands of rows) stays smooth. Rows expand to reveal every field
 * including crm_note; the virtualizer re-measures expanded rows automatically.
 */
export function ResultsTable({ records }: { records: CrmRecord[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49,
    overscan: 10,
  });

  if (records.length === 0) {
    return (
      <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-soft">
        No records were imported.
      </p>
    );
  }

  return (
    <div
      ref={parentRef}
      className="overflow-auto rounded-card border border-line bg-surface"
      style={{ maxHeight: "32rem" }}
    >
      <div style={{ minWidth: MIN_W }}>
        <div
          className="sticky top-0 z-10 grid items-center border-b border-line bg-surface px-4 py-3"
          style={{ gridTemplateColumns: COLS }}
        >
          {HEADERS.map((c, i) => (
            <div key={i} className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
              {c}
            </div>
          ))}
        </div>

        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((vi) => {
            const r = records[vi.index];
            const expanded = open === vi.index;
            return (
              <div
                key={vi.key}
                data-index={vi.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full border-b border-line"
                style={{ transform: `translateY(${vi.start}px)` }}
              >
                <div
                  className="grid items-center px-4 py-3 text-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  style={{ gridTemplateColumns: COLS }}
                >
                  <Cell className="font-medium text-ink">{r.name || "-"}</Cell>
                  <Cell className="text-ink-soft">{r.email || "-"}</Cell>
                  <Cell className="text-ink-soft">
                    {[r.country_code, r.mobile_without_country_code].filter(Boolean).join(" ") || "-"}
                  </Cell>
                  <Cell className="text-ink-soft">{r.created_at || "-"}</Cell>
                  <Cell className="text-ink-soft">{r.company || "-"}</Cell>
                  <div><StatusBadge status={r.crm_status} /></div>
                  <Cell className="text-ink-soft">{r.data_source || "-"}</Cell>
                  <div>
                    <button
                      onClick={() => setOpen(expanded ? null : vi.index)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline"
                    >
                      More
                      <ChevronDown size={14} className={`transition ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="bg-black/[0.02] px-4 py-4 dark:bg-white/[0.03]">
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Detail label="Note" value={r.crm_note} wide />
                      <Detail label="City" value={r.city} />
                      <Detail label="State" value={r.state} />
                      <Detail label="Country" value={r.country} />
                      <Detail label="Lead owner" value={r.lead_owner} />
                      <Detail label="Possession time" value={r.possession_time} />
                      <Detail label="Description" value={r.description} wide />
                    </dl>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Cell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`truncate pr-3 ${className}`}>{children}</div>;
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">
        {value ? value : <span className="text-ink-soft">-</span>}
      </dd>
    </div>
  );
}
