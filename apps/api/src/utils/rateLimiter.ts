/**
 * Paces the START of async tasks so consecutive starts are at least
 * `minIntervalMs` apart, no matter how much concurrency sits above it. This
 * keeps outbound model calls under a provider's requests-per-minute quota
 * (e.g. Gemini's free tier), which is the main reason large imports otherwise
 * get most of their batches rejected with HTTP 429.
 *
 * A single import shares one limiter, so 200 batches drain at a safe rate
 * instead of stampeding the API all at once.
 */
export function createRateLimiter(minIntervalMs: number) {
  let last = 0;
  let chain: Promise<void> = Promise.resolve();

  return function schedule<T>(fn: () => Promise<T>): Promise<T> {
    const ready = chain.then(async () => {
      if (minIntervalMs <= 0) return;
      const wait = last + minIntervalMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
    });
    // keep the chain alive even if a gate step throws
    chain = ready.catch(() => undefined);
    return ready.then(fn);
  };
}
