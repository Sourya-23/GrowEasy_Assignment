import { randomUUID } from "node:crypto";
import type { ImportProgressEvent, ImportResult } from "@groweasy/shared";
import { parseCsv } from "./csvService.js";
import { inferColumnMapping } from "../ai/mappingService.js";
import { extractAll } from "../ai/extractionService.js";
import { validateRecords } from "./validationService.js";
import { persistImport } from "./supabaseService.js";

export type ProgressReporter = (event: ImportProgressEvent) => void;

const noop: ProgressReporter = () => {};

/**
 * The whole pipeline, wired together and instrumented for progress events:
 *   parse -> Phase 1 mapping -> Phase 2 batch extraction -> Phase 3 validation
 *   -> persist -> result.
 */
export async function runImport(
  filename: string,
  content: string,
  onProgress: ProgressReporter = noop
): Promise<ImportResult> {
  const importId = randomUUID();

  const { headers, rows } = parseCsv(content);
  onProgress({ type: "parsed", totalRows: rows.length });

  if (rows.length === 0) {
    const empty: ImportResult = {
      importId,
      filename,
      mapping: { entries: [], unmappedColumns: headers, notes: "No data rows found." },
      records: [],
      skipped: [],
      totals: { totalRows: 0, imported: 0, skipped: 0 },
    };
    onProgress({ type: "done", result: empty });
    return empty;
  }

  const mapping = await inferColumnMapping(headers, rows.slice(0, 5));
  onProgress({ type: "mapping", mapping });

  const extraction = await extractAll(rows, mapping, (completed, total, failed) =>
    onProgress({ type: "batch", completed, total, failed })
  );

  // If EVERY batch failed, this is a systemic problem (missing/invalid API key,
  // quota, or model outage), not a per-row issue. Surface it clearly instead of
  // returning a result where every row is silently skipped.
  if (extraction.batchesTotal > 0 && extraction.batchesFailed === extraction.batchesTotal) {
    throw new Error(
      "The AI could not process any batch. This usually means the AI API key is missing or invalid, the quota is exhausted, or the model is unavailable. Check GEMINI_API_KEY and try again."
    );
  }

  const { records, skipped } = validateRecords(extraction.rows, rows);

  const result: ImportResult = {
    importId,
    filename,
    mapping,
    records,
    skipped,
    totals: {
      totalRows: rows.length,
      imported: records.length,
      skipped: skipped.length,
    },
  };

  // Persistence must never break the response.
  try {
    await persistImport(result);
  } catch (err) {
    console.error("[importService] persistImport failed:", (err as Error).message);
  }

  onProgress({ type: "done", result });
  return result;
}
