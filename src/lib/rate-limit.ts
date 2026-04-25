interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export function rateLimit({ limit, windowMs }: RateLimitOptions) {
  const store = new Map<string, WindowEntry>();
  let callCount = 0;

  function sweep() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }

  function check(key: string): RateLimitResult {
    callCount += 1;
    if (callCount % 100 === 0) sweep();

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0 };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
  }

  return { check };
}

// Singleton for the chat API — 10 requests per minute per IP
export const chatRateLimiter = rateLimit({ limit: 10, windowMs: 60_000 });
