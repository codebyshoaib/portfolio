import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the rate limiter
vi.mock("@/lib/rate-limit", () => ({
  chatRateLimiter: {
    check: vi.fn().mockReturnValue({ success: true, remaining: 9 }),
  },
}));

// Mock fetch (Groq API)
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock env
vi.stubEnv("GROQ_API_KEY", "test-key");

const { POST } = await import("../chat/route");

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(
      new Response("data: done", {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );
  });

  it("returns 400 when messages is missing", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });

  it("returns 400 when message content exceeds 500 chars", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "a".repeat(501) }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit exceeded", async () => {
    const { chatRateLimiter } = await import("@/lib/rate-limit");
    vi.mocked(chatRateLimiter.check).mockReturnValue({
      success: false,
      remaining: 0,
    });

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hello" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("calls Groq and streams response for valid input", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hello" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
