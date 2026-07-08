import { describe, it, expect } from "vitest";
import { createRateLimiter } from "./rateLimiter.js";

describe("createRateLimiter", () => {
  it("spaces concurrent task starts by at least the interval", async () => {
    const limit = createRateLimiter(50);
    const t0 = Date.now();
    const starts: number[] = [];
    await Promise.all([0, 1, 2].map(() => limit(async () => { starts.push(Date.now() - t0); })));
    const sorted = [...starts].sort((a, b) => a - b);
    expect(sorted).toHaveLength(3);
    expect(sorted[1]).toBeGreaterThanOrEqual(45);
    expect(sorted[2]).toBeGreaterThanOrEqual(95);
  });

  it("adds no delay when the interval is 0", async () => {
    const limit = createRateLimiter(0);
    const t0 = Date.now();
    await Promise.all([0, 1, 2, 3].map(() => limit(async () => {})));
    expect(Date.now() - t0).toBeLessThan(40);
  });
});
