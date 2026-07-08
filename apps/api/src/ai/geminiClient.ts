import { env } from "../config/env.js";
import { withRetry } from "../utils/retry.js";
import { extractJson } from "../utils/json.js";
import { createRateLimiter } from "../utils/rateLimiter.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// One shared limiter paces every outbound call under the per-minute quota.
const limit = createRateLimiter(env.AI_MIN_REQUEST_INTERVAL_MS);

/** Pull a retry delay (ms) from a 429's Retry-After header or Gemini's body. */
function parseRetryAfter(header: string | null, body: string): number | undefined {
  if (header) {
    const secs = Number(header);
    if (!Number.isNaN(secs)) return secs * 1000;
  }
  const m = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (m) return Math.ceil(parseFloat(m[1]) * 1000);
  return undefined;
}

export interface GenerateOptions {
  system: string;
  user: string;
  temperature?: number;
}

/**
 * Single low-level call to the Gemini Developer API. Forces JSON output, paces
 * requests under the free-tier quota, retries transient failures (429 / 5xx /
 * network) honoring the server's back-off, and returns parsed JSON. This is the
 * ONLY place that talks to the model, so swapping providers means editing just
 * this file.
 */
export async function generateJson<T = unknown>(opts: GenerateOptions): Promise<T> {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to apps/api/.env (get one from Google AI Studio)."
    );
  }

  const url = `${BASE}/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.1,
      responseMimeType: "application/json",
    },
  };

  const raw = await withRetry(
    () =>
      limit(async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          const err = new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`) as Error & {
            retriable?: boolean;
            retryAfterMs?: number;
          };
          // 429 and 5xx are worth retrying; other 4xx are not.
          err.retriable = res.status === 429 || res.status >= 500;
          if (res.status === 429) {
            err.retryAfterMs = parseRetryAfter(res.headers.get("retry-after"), detail);
          }
          throw err;
        }

        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text =
          data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
          "";
        if (!text) {
          throw Object.assign(new Error("Empty response from Gemini"), {
            retriable: true,
          });
        }
        return text;
      }),
    { retries: env.AI_MAX_RETRIES }
  );

  return extractJson(raw) as T;
}
