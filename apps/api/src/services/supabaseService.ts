import type { ImportResult } from "@groweasy/shared";
import { env, supabaseConfigured } from "../config/env.js";

/**
 * Persistence is optional. If Supabase env vars are absent, the pipeline still
 * works end to end and simply skips storage. The client is imported lazily so
 * the dependency is only loaded when actually configured.
 */
export async function persistImport(result: ImportResult): Promise<void> {
  if (!supabaseConfigured) return;

  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  await sb.from("imports").insert({
    id: result.importId,
    filename: result.filename,
    total_rows: result.totals.totalRows,
    total_imported: result.totals.imported,
    total_skipped: result.totals.skipped,
    mapping: result.mapping,
    status: "completed",
  });

  if (result.records.length > 0) {
    await sb.from("leads").insert(
      result.records.map((r) => ({ import_id: result.importId, ...r }))
    );
  }

  if (result.skipped.length > 0) {
    await sb.from("skipped_rows").insert(
      result.skipped.map((s) => ({
        import_id: result.importId,
        row_index: s.rowIndex,
        reason: s.reason,
        raw: s.raw,
      }))
    );
  }
}
