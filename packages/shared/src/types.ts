import type { CrmStatus, DataSource } from "./enums";

/**
 * The GrowEasy CRM record. This is the output contract of the whole pipeline.
 * Fields the AI cannot fill confidently are "" (empty string), never null,
 * so the shape stays stable and CSV export stays clean.
 */
export interface CrmRecord {
  created_at: string; // must satisfy: !isNaN(new Date(created_at).getTime())
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus | "";
  crm_note: string;
  data_source: DataSource | "";
  possession_time: string;
  description: string;
}

/** A row that was dropped, with a human-readable reason. */
export interface SkippedRow {
  rowIndex: number; // 1-based index within the original data rows
  reason: string; // e.g. "No email or mobile number present"
  raw: Record<string, string>; // the original row, for debugging / display
}

/**
 * Phase 1 output: how the AI understood the uploaded file's columns.
 * Surfaced to the user for transparency ("here is how we read your file").
 */
export interface ColumnMappingEntry {
  crmField: string; // a CrmRecord field name (kept as string; it is model-provided)
  sourceColumns: string[]; // header names that feed this field (may be empty)
  confidence: "high" | "medium" | "low" | "none";
  rationale: string;
}

export interface ColumnMapping {
  entries: ColumnMappingEntry[];
  unmappedColumns: string[]; // source headers not used by any CRM field
  notes: string; // any overall observation about the file
}

export interface ImportTotals {
  totalRows: number;
  imported: number;
  skipped: number;
}

/** The final payload returned by POST /api/import. */
export interface ImportResult {
  importId: string;
  filename: string;
  mapping: ColumnMapping;
  records: CrmRecord[];
  skipped: SkippedRow[];
  totals: ImportTotals;
}

/** Server-Sent Events streamed during processing. */
export type ImportProgressEvent =
  | { type: "parsed"; totalRows: number }
  | { type: "mapping"; mapping: ColumnMapping }
  | { type: "batch"; completed: number; total: number; failed: number }
  | { type: "done"; result: ImportResult }
  | { type: "error"; message: string };
