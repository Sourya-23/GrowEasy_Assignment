import type { ColumnMapping } from "@groweasy/shared";
import { columnMappingSchema } from "@groweasy/shared";
import { generateJson } from "./geminiClient.js";
import {
  headerInferenceSystemPrompt,
  buildHeaderInferenceUserPrompt,
} from "./prompts.js";

/**
 * Phase 1: one cheap call per file. Understands the columns and returns a
 * mapping plan. If the model output is malformed we degrade gracefully to an
 * empty-but-valid mapping rather than failing the whole import.
 */
export async function inferColumnMapping(
  headers: string[],
  sampleRows: Record<string, string>[]
): Promise<ColumnMapping> {
  try {
    const raw = await generateJson({
      system: headerInferenceSystemPrompt,
      user: buildHeaderInferenceUserPrompt(headers, sampleRows),
      temperature: 0,
    });
    const parsed = columnMappingSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  } catch {
    // fall through to fallback
  }
  return {
    entries: [],
    unmappedColumns: headers,
    notes: "Automatic column analysis was unavailable; extraction proceeded without a mapping hint.",
  };
}

/** Compact, prompt-friendly summary of the mapping for Phase 2. */
export function summarizeMapping(mapping: ColumnMapping): string {
  const lines = mapping.entries
    .filter((e) => e.sourceColumns.length > 0 && e.confidence !== "none")
    .map((e) => `${e.crmField} <- ${e.sourceColumns.join(", ")} (${e.confidence})`);
  if (lines.length === 0) return "No confident column mapping was inferred; use your best judgement.";
  return lines.join("\n");
}
