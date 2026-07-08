"use client";

import { useCallback, useState } from "react";
import type { ImportResult } from "@groweasy/shared";
import { previewCsv, type CsvPreview } from "../lib/previewCsv";
import { streamImport } from "../lib/api";

export type Phase = "idle" | "preview" | "processing" | "results" | "error";

export interface Progress {
  stage: "parsing" | "mapping" | "extracting" | "done";
  totalRows: number;
  completed: number;
  total: number;
  failed: number;
}

const MAX_MB = 5;

export function useImport() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback(async (f: File) => {
    setError(null);
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`That file is larger than the ${MAX_MB}MB limit.`);
      return;
    }
    try {
      const p = await previewCsv(f, 50);
      if (p.rows.length === 0) {
        setError("This CSV does not contain any data rows.");
        return;
      }
      setFile(f);
      setPreview(p);
      setPhase("preview");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!file) return;
    setPhase("processing");
    setProgress({ stage: "parsing", totalRows: 0, completed: 0, total: 0, failed: 0 });
    try {
      for await (const ev of streamImport(file)) {
        if (ev.type === "parsed") {
          setProgress((p) => ({ ...(p as Progress), stage: "mapping", totalRows: ev.totalRows }));
        } else if (ev.type === "mapping") {
          setProgress((p) => ({ ...(p as Progress), stage: "extracting" }));
        } else if (ev.type === "batch") {
          setProgress((p) => ({
            ...(p as Progress),
            stage: "extracting",
            completed: ev.completed,
            total: ev.total,
            failed: ev.failed,
          }));
        } else if (ev.type === "done") {
          setResult(ev.result);
          setPhase("results");
        } else if (ev.type === "error") {
          setError(ev.message);
          setPhase("error");
        }
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, [file]);

  const reset = useCallback(() => {
    setPhase("idle");
    setFile(null);
    setPreview(null);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  const backToPreview = useCallback(() => {
    setError(null);
    setPhase(file ? "preview" : "idle");
  }, [file]);

  return {
    phase, file, preview, progress, result, error,
    selectFile, confirmImport, reset, backToPreview,
  };
}
