export interface RetryOptions {
  retries: number;
  baseMs?: number;
  onRetry?: (attempt: number, err: unknown) => void;
}

/**
 * Exponential backoff with jitter. An error is retried unless it explicitly
 * sets `retriable === false` (used for non-retryable 4xx responses).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  const base = opts.baseMs ?? 500;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retriable = (err as { retriable?: boolean })?.retriable !== false;
      if (attempt === opts.retries || !retriable) break;
      opts.onRetry?.(attempt + 1, err);
      // Prefer a server-provided delay (e.g. 429 Retry-After) when present.
      const retryAfter = (err as { retryAfterMs?: number })?.retryAfterMs;
      const delay =
        typeof retryAfter === "number" && retryAfter > 0
          ? retryAfter
          : base * 2 ** attempt + Math.random() * 200;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
