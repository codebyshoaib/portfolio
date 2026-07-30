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
  beforeEach(async () => {
    vi.clearAllMocks();
    // clearAllMocks clears calls but keeps implementations, so the rate-limit
    // test's `success: false` leaked into every test after it. Restore the
    // default explicitly rather than relying on declaration order.
    const { chatRateLimiter } = await import("@/lib/rate-limit");
    vi.mocked(chatRateLimiter.check).mockReturnValue({
      success: true,
      remaining: 9,
    });
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

  const chat = (messages: Array<{ role: string; content: string }>) =>
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({
        messages,
        profileData: {
          profile: { firstName: "Shoaib", lastName: "Ud Din" },
          experience: [{ jobTitle: "Engineer", company: "Taleemabad" }],
        },
      }),
    });

  const sentSystemPrompt = () => {
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    return body.messages.find((m: { role: string }) => m.role === "system")
      .content;
  };

  it("still answers when retrieval is unavailable, using the static profile", async () => {
    // No index is committed with real vectors in CI, so this is the fallback
    // path — it must produce a working prompt, not an error.
    const res = await POST(chat([{ role: "user", content: "hello" }]));
    expect(res.status).toBe(200);
    expect(sentSystemPrompt()).toContain("Shoaib");
  });

  it("keeps the brevity and no-invention rules on every path", async () => {
    await POST(chat([{ role: "user", content: "what are your skills" }]));
    const prompt = sentSystemPrompt();
    expect(prompt).toContain("HARD CAP: 3 sentences");
    expect(prompt).toContain("Never invent");
  });

  it("accepts a long prior assistant reply on the second turn", async () => {
    // The 500-char cap applies to what a visitor types, not to our own replies
    // being replayed — this is what used to 400 every second question.
    const res = await POST(
      chat([
        { role: "user", content: "tell me about your projects" },
        { role: "assistant", content: "x".repeat(900) },
        { role: "user", content: "what is your experience" },
      ]),
    );
    expect(res.status).toBe(200);
  });

  it("only replays the tail of a long conversation", async () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `message ${i}`,
    }));
    await POST(chat(messages));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // system + at most MAX_HISTORY_MESSAGES
    expect(body.messages.length).toBeLessThanOrEqual(7);
    expect(body.messages.at(-1).content).toBe("message 19");
  });

  it("surfaces a Groq throttle as a retryable 429, not a generic failure", async () => {
    mockFetch.mockResolvedValue(
      new Response('{"error":{"code":"rate_limit_exceeded"}}', { status: 429 }),
    );
    const res = await POST(chat([{ role: "user", content: "hello" }]));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect((await res.json()).error).toMatch(/few seconds/i);
  });
});
