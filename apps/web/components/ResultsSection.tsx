"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import type { ImportResult } from "@groweasy/shared";
import { SummaryCards } from "./SummaryCards";
import { MappingPanel } from "./MappingPanel";
import { ResultsTable } from "./ResultsTable";
import { SkippedTable } from "./SkippedTable";
import { Button } from "./ui/Button";

type Tab = "imported" | "skipped";

export function ResultsSection({ result, onReset }: { result: ImportResult; onReset: () => void }) {
  const [tab, setTab] = useState<Tab>("imported");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Import complete</h2>
          <p className="text-sm text-ink-soft">{result.filename}</p>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <Upload size={16} /> Import another file
        </Button>
      </div>

      <SummaryCards totals={result.totals} />
      <MappingPanel mapping={result.mapping} />

      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === "imported"} onClick={() => setTab("imported")}>
          Imported ({result.totals.imported})
        </TabButton>
        <TabButton active={tab === "skipped"} onClick={() => setTab("skipped")}>
          Skipped ({result.totals.skipped})
        </TabButton>
      </div>

      {tab === "imported" ? (
        <ResultsTable records={result.records} />
      ) : (
        <SkippedTable skipped={result.skipped} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
        active ? "border-brand-teal text-brand-teal" : "border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
