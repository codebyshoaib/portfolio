import { beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = rateLimit({ limit: 3, windowMs: 60_000 });
    expect(limiter.check("ip-1")).toEqual({ success: true, remaining: 2 });
    expect(limiter.check("ip-1")).toEqual({ success: true, remaining: 1 });
    expect(limiter.check("ip-1")).toEqual({ success: true, remaining: 0 });
  });

  it("blocks requests over the limit", () => {
    const limiter = rateLimit({ limit: 2, windowMs: 60_000 });
    limiter.check("ip-2");
    limiter.check("ip-2");
    const result = limiter.check("ip-2");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const limiter = rateLimit({ limit: 1, windowMs: 60_000 });
    limiter.check("ip-3");
    vi.advanceTimersByTime(61_000);
    const result = limiter.check("ip-3");
    expect(result.success).toBe(true);
  });

  it("tracks different IPs independently", () => {
    const limiter = rateLimit({ limit: 1, windowMs: 60_000 });
    limiter.check("ip-a");
    expect(limiter.check("ip-b")).toEqual({ success: true, remaining: 0 });
  });
});
