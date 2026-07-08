/**
 * Robustly extract JSON from an LLM response. Handles clean JSON, markdown
 * fences, and stray prose around a JSON object/array.
 */
export function extractJson(text: string): unknown {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  try {
    return JSON.parse(t);
  } catch {
    // fall through to salvage
  }
  const candidates = [t.indexOf("{"), t.indexOf("[")].filter((i) => i >= 0);
  if (candidates.length === 0) throw new Error("No JSON found in model output");
  const start = Math.min(...candidates);
  const closeChar = t[start] === "{" ? "}" : "]";
  const end = t.lastIndexOf(closeChar);
  if (end <= start) throw new Error("Malformed JSON in model output");
  return JSON.parse(t.slice(start, end + 1));
}
