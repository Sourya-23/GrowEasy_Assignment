import { z } from "zod";
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "./enums";

/**
 * Phase 3 validation. The AI can return anything; this layer is what actually
 * guarantees correctness. Invalid enum values are coerced to "" rather than
 * rejected, so one bad field never loses an otherwise-good record.
 */

const statusSchema = z.preprocess(
  (v) => {
    if (typeof v !== "string") return "";
    return (CRM_STATUS_VALUES as string[]).includes(v) ? v : "";
  },
  z.union([z.enum(CRM_STATUS_VALUES as [string, ...string[]]), z.literal("")])
);

const dataSourceSchema = z.preprocess(
  (v) => {
    if (typeof v !== "string") return "";
    return (DATA_SOURCE_VALUES as string[]).includes(v) ? v : "";
  },
  z.union([z.enum(DATA_SOURCE_VALUES as [string, ...string[]]), z.literal("")])
);

/**
 * created_at must be parseable by JS `new Date()`. Anything missing or
 * unparseable is coerced to "" rather than failing the record, so a
 * contactable lead is never dropped over a date-formatting quirk. (The skip
 * rule is strictly about missing contact, not dates.)
 */
const createdAtSchema = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return "";
  return Number.isNaN(new Date(v).getTime()) ? "" : v;
}, z.string());

/** Escape any real newlines so a record always stays a single CSV row. */
const csvSafe = (s: unknown) =>
  typeof s === "string" ? s.replace(/\r\n|\r|\n/g, "\\n") : "";

const text = z.preprocess(csvSafe, z.string());

export const crmRecordSchema = z.object({
  created_at: createdAtSchema,
  name: text,
  email: text,
  country_code: text,
  mobile_without_country_code: text,
  company: text,
  city: text,
  state: text,
  country: text,
  lead_owner: text,
  crm_status: statusSchema,
  crm_note: text,
  data_source: dataSourceSchema,
  possession_time: text,
  description: text,
});

/** The skip rule: a record with neither email nor mobile is invalid. */
export const hasContact = (r: { email: string; mobile_without_country_code: string }) =>
  r.email.trim() !== "" || r.mobile_without_country_code.trim() !== "";

export const columnMappingEntrySchema = z.object({
  crmField: z.string(),
  sourceColumns: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low", "none"]),
  rationale: z.string(),
});

export const columnMappingSchema = z.object({
  entries: z.array(columnMappingEntrySchema),
  unmappedColumns: z.array(z.string()),
  notes: z.string(),
});

export type CrmRecordInput = z.input<typeof crmRecordSchema>;
export type CrmRecordParsed = z.output<typeof crmRecordSchema>;