import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Phase 0: deterministic parse. Strips BOM, auto-detects the delimiter, honors
 * quoted fields containing commas/newlines, trims values, and drops rows that
 * are entirely empty. No AI here.
 */
export function parseCsv(content: string): ParsedCsv {
  const clean = content.replace(/^\uFEFF/, "");

  const result = Papa.parse<Record<string, unknown>>(clean, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const headers = (result.meta.fields ?? []).map((h) => h.trim()).filter(Boolean);

  const rows = (result.data ?? [])
    .map(normalizeRow)
    .filter((r) => Object.values(r).some((v) => v !== ""));

  return { headers, rows };
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key) continue;
    out[key] = value == null ? "" : String(value).trim();
  }
  return out;
}
