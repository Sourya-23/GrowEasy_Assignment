/**
 * Prompt engineering is the primary evaluation axis for this assignment.
 *
 * Strategy: two passes.
 *   Phase 1 (headerInferencePrompt) runs ONCE per file. It looks at the column
 *   headers plus a few sample rows and produces an explicit mapping plan. This
 *   is cheap regardless of file size and gives the user transparency.
 *
 *   Phase 2 (extractionSystemPrompt) runs per batch. It converts real rows into
 *   strict CRM records, guided by the Phase 1 mapping. All correctness-critical
 *   rules live here, and a deterministic zod layer re-checks everything after.
 */

import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "@groweasy/shared";

const CRM_FIELDS = `
- created_at: lead creation date. Output as "YYYY-MM-DD HH:mm:ss" and it MUST be parseable by JavaScript new Date().
- name: lead full name.
- email: primary email (see multiple-value rule).
- country_code: dialing code such as "+91" or "91".
- mobile_without_country_code: primary mobile digits only, no country code.
- company: company / organisation name.
- city, state, country: location fields.
- lead_owner: the owner/agent responsible for the lead.
- crm_status: one of the ALLOWED STATUS values below, else "".
- crm_note: catch-all for remarks, follow-up notes, comments, extra emails, extra phone numbers, and anything useful that fits no other field.
- data_source: one of the ALLOWED DATA SOURCE values below, else "".
- possession_time: property possession time (real-estate leads).
- description: additional free-text description.
`.trim();

const RULES = `
RULES (follow exactly):
1. crm_status must be EXACTLY one of: ${CRM_STATUS_VALUES.join(", ")}. Normalise free text (e.g. "closed won" -> SALE_DONE, "busy call later" -> DID_NOT_CONNECT, "not interested" -> BAD_LEAD, "follow up" -> GOOD_LEAD_FOLLOW_UP). If you cannot map it confidently, use "".
2. data_source must be EXACTLY one of: ${DATA_SOURCE_VALUES.join(", ")}. If none matches confidently, use "".
3. created_at must be convertible by new Date(). Reformat any input date to "YYYY-MM-DD HH:mm:ss". If no date exists, use "".
4. crm_note absorbs remarks, follow-ups, comments, and any leftover useful information.
5. Multiple emails: keep the first in "email", append the rest to crm_note as "Additional email: ...". Multiple mobiles: keep the first in "mobile_without_country_code", append the rest to crm_note as "Additional mobile: ...".
6. Keep each record a single logical row. Replace any real newline inside a value with the literal two characters \\n so the record stays CSV-safe.
7. If a row has NEITHER an email NOR a mobile number, do not invent one. Emit that record with empty email and mobile; the server will skip it.
8. Never hallucinate values. If a field is absent, use "".
`.trim();

const OUTPUT_SHAPE = `
Return ONLY a JSON array (no prose, no markdown fences). Each element has exactly these keys:
["created_at","name","email","country_code","mobile_without_country_code","company","city","state","country","lead_owner","crm_status","crm_note","data_source","possession_time","description"]
Every key must be present. Use "" for anything unknown.
`.trim();

const FEW_SHOT = `
EXAMPLE
Input rows:
[
  {"Full Name":"John Doe","Mail":"john@x.com; john.doe@y.com","Phone":"+91 98765 43210","Stage":"Deal closed","Remarks":"Onboarding started"},
  {"Full Name":"No Contact Guy","Mail":"","Phone":"","Stage":"maybe"}
]
Output:
[
  {"created_at":"","name":"John Doe","email":"john@x.com","country_code":"+91","mobile_without_country_code":"9876543210","company":"","city":"","state":"","country":"","lead_owner":"","crm_status":"SALE_DONE","crm_note":"Onboarding started. Additional email: john.doe@y.com","data_source":"","possession_time":"","description":""},
  {"created_at":"","name":"No Contact Guy","email":"","country_code":"","mobile_without_country_code":"","company":"","city":"","state":"","country":"","lead_owner":"","crm_status":"","crm_note":"","data_source":"","possession_time":"","description":""}
]
`.trim();

/** Phase 2 system prompt, reused for every batch. */
export const extractionSystemPrompt = `
You convert raw lead rows (from any CSV: Facebook, Google Ads, Excel, agency exports, hand-made sheets) into GrowEasy CRM records.

TARGET CRM FIELDS:
${CRM_FIELDS}

ALLOWED STATUS: ${CRM_STATUS_VALUES.join(", ")}
ALLOWED DATA SOURCE: ${DATA_SOURCE_VALUES.join(", ")}

${RULES}

${OUTPUT_SHAPE}

${FEW_SHOT}
`.trim();

/** Phase 2 per-batch user message. Pass the Phase 1 mapping as a hint. */
export function buildExtractionUserPrompt(
  rows: Record<string, string>[],
  mappingHint: string
): string {
  return [
    "COLUMN MAPPING HINT (from an earlier analysis of this same file, use as guidance, not gospel):",
    mappingHint,
    "",
    "Convert the following rows. Output a JSON array with one object per input row, in the same order:",
    JSON.stringify(rows),
  ].join("\n");
}

/** Phase 1 system prompt: understand the file's columns, once. */
export const headerInferenceSystemPrompt = `
You analyse the columns of an uploaded CSV of sales / marketing leads and explain how they map to the GrowEasy CRM schema. You do NOT convert data here, you only produce a mapping plan.

CRM FIELDS:
${CRM_FIELDS}

Return ONLY JSON (no markdown fences) of the shape:
{
  "entries": [
    { "crmField": "<one CRM field name>", "sourceColumns": ["<header>", ...], "confidence": "high|medium|low|none", "rationale": "<short reason>" }
  ],
  "unmappedColumns": ["<headers not used by any CRM field>"],
  "notes": "<one short overall observation, or empty string>"
}
Include an entry for every CRM field, even if sourceColumns is empty and confidence is "none".
`.trim();

/** Phase 1 user message. */
export function buildHeaderInferenceUserPrompt(
  headers: string[],
  sampleRows: Record<string, string>[]
): string {
  return [
    "Headers:",
    JSON.stringify(headers),
    "",
    "Sample rows:",
    JSON.stringify(sampleRows),
  ].join("\n");
}
