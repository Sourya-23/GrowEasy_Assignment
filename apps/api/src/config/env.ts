import "dotenv/config";
import { z } from "zod";

/**
 * Env is parsed once and validated. Missing GEMINI_API_KEY does not throw at
 * import time (so tests can load modules) but the Gemini client throws a clear
 * error the moment it is actually used without a key.
 */
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default("*"),

  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),

  AI_BATCH_SIZE: z.coerce.number().min(1).default(40),
  AI_MAX_CONCURRENCY: z.coerce.number().min(1).default(3),
  AI_MAX_RETRIES: z.coerce.number().min(0).default(5),
  // Minimum gap between outbound model calls. ~4s => ~15 requests/min, which
  // fits the Gemini free tier. Set to 0 on a paid key for full speed.
  AI_MIN_REQUEST_INTERVAL_MS: z.coerce.number().min(0).default(4000),

  MAX_FILE_SIZE_MB: z.coerce.number().min(1).default(5),

  SUPABASE_URL: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
});

export const env = schema.parse(process.env);

export const supabaseConfigured = Boolean(
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
);
