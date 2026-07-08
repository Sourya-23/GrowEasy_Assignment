import Papa from "papaparse";

export interface CsvPreview {
  headers: string[];
  rows: Record<string, string>[];
  truncated: boolean;
}

/**
 * Client-side preview parse. Reads only the first `limit` rows so a huge file
 * previews instantly. NO AI here; this is purely for the preview table.
 */
export function previewCsv(file: File, limit = 50): Promise<CsvPreview> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      preview: limit + 1, // read one extra to detect truncation
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const headers = (res.meta.fields ?? []).map((h) => h.trim()).filter(Boolean);
        const all = (res.data ?? [])
          .map((r) => {
            const o: Record<string, string> = {};
            for (const key of headers) {
              const v = (r as Record<string, unknown>)[key];
              o[key] = v == null ? "" : String(v).trim();
            }
            return o;
          })
          .filter((r) => Object.values(r).some((v) => v !== ""));
        resolve({
          headers,
          rows: all.slice(0, limit),
          truncated: all.length > limit,
        });
      },
      error: (err) => reject(err),
    });
  });
}
