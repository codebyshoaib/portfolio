import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.mock("@/sanity/lib/client", () => ({
  client: { fetch: (...args: unknown[]) => mockFetch(...args) },
}));

const { GET } = await import("../resume/route");

const CDN = "https://cdn.sanity.io/files/p/develop/abc.pdf";

describe("GET /api/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects a bare request to the active resume", async () => {
    mockFetch.mockResolvedValue({
      url: CDN,
      originalFilename: "Shoaib Resume.pdf",
    });

    const res = await GET(new Request("http://localhost/api/resume"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${CDN}?dl=Shoaib%20Resume.pdf`);
  });

  it("404s when no resume document has a file", async () => {
    mockFetch.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/resume"));

    expect(res.status).toBe(404);
  });

  it("returns the asset URL as JSON when assetId is given", async () => {
    mockFetch.mockResolvedValue({
      url: CDN,
      originalFilename: "cv.pdf",
      mimeType: "application/pdf",
    });

    const res = await GET(
      new Request("http://localhost/api/resume?assetId=file-abc-pdf"),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      url: CDN,
      filename: "cv.pdf",
      mimeType: "application/pdf",
    });
  });

  it("404s on an unknown assetId", async () => {
    mockFetch.mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/resume?assetId=file-missing-pdf"),
    );

    expect(res.status).toBe(404);
  });
});
