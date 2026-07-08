import type { CrmRecord, SkippedRow } from "@groweasy/shared";
import { crmRecordSchema, hasContact } from "@groweasy/shared";

export interface ValidationOutput {
  records: CrmRecord[];
  skipped: SkippedRow[];
}

/**
 * Phase 3: the deterministic guarantee. Every raw record from the model is
 * re-validated here. Enums are coerced, dates checked, newlines escaped. Rows
 * that fail validation, or that have neither email nor mobile, become skips
 * with a human-readable reason. `null` marks a row whose AI batch failed.
 */
export function validateRecords(
  rawRecords: (Record<string, unknown> | null)[],
  originalRows: Record<string, string>[]
): ValidationOutput {
  const records: CrmRecord[] = [];
  const skipped: SkippedRow[] = [];

  rawRecords.forEach((raw, i) => {
    const original = originalRows[i] ?? {};

    if (raw === null) {
      skipped.push({
        rowIndex: i + 1,
        reason: "AI extraction failed for this row's batch after retries",
        raw: original,
      });
      return;
    }

    const parsed = crmRecordSchema.safeParse(raw);
    if (!parsed.success) {
      skipped.push({
        rowIndex: i + 1,
        reason: `Validation failed: ${parsed.error.issues[0]?.message ?? "unknown"}`,
        raw: original,
      });
      return;
    }

    const record = parsed.data as CrmRecord;
    if (!hasContact(record)) {
      skipped.push({
        rowIndex: i + 1,
        reason: "No email or mobile number present",
        raw: original,
      });
      return;
    }

    records.push(record);
  });

  return { records, skipped };
}
