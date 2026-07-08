import type { ColumnMapping } from "@groweasy/shared";
import { env } from "../config/env.js";
import { mapWithConcurrency, chunk } from "../utils/concurrency.js";
import { generateJson } from "./geminiClient.js";
import { extractionSystemPrompt, buildExtractionUserPrompt } from "./prompts.js";
import { summarizeMapping } from "./mappingService.js";

export type BatchProgress = (completed: number, total: number, failed: number) => void;

export interface ExtractionResult {
  rows: (Record<string, unknown> | null)[];
  batchesTotal: number;
  batchesFailed: number;
}

/** Extract a single batch of rows into raw record objects. */
async function extractBatch(
  rows: Record<string, string>[],
  mappingHint: string
): Promise<Record<string, unknown>[]> {
  const result = await generateJson<Record<string, unknown>[]>({
    system: extractionSystemPrompt,
    user: buildExtractionUserPrompt(rows, mappingHint),
    temperature: 0.1,
  });
  if (!Array.isArray(result)) throw new Error("Extraction batch did not return an array");
  return result;
}

/**
 * Phase 2: batch the rows, run them through the model with a bounded worker
 * pool, and report progress. A batch that fails all retries yields `null` for
 * each of its rows (kept index-aligned) so those rows are skipped downstream
 * with a clear reason rather than silently lost.
 */
export async function extractAll(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  onBatch: BatchProgress
): Promise<ExtractionResult> {
  const batches = chunk(rows, env.AI_BATCH_SIZE);
  const total = batches.length;
  const mappingHint = summarizeMapping(mapping);

  let completed = 0;
  let failed = 0;

  const perBatch = await mapWithConcurrency(
    batches,
    env.AI_MAX_CONCURRENCY,
    async (batch) => {
      try {
        const recs = await extractBatch(batch, mappingHint);
        // keep output length aligned to input length
        const aligned = batch.map((_, i) => recs[i] ?? {});
        completed += 1;
        onBatch(completed, total, failed);
        return aligned as (Record<string, unknown> | null)[];
      } catch {
        failed += 1;
        completed += 1;
        onBatch(completed, total, failed);
        return batch.map(() => null);
      }
    }
  );

  return { rows: perBatch.flat(), batchesTotal: total, batchesFailed: failed };
}
