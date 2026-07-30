import { describe, expect, it } from "vitest";
import {
  chunkContentDoc,
  chunkContextDoc,
  chunkProfile,
  splitMarkdownSections,
} from "../chunk";
import { diversify, type IndexedChunk, score, topK } from "../retrieve";

const DECISION = {
  title: "Run the AI twin on 8b, not 70b",
  slug: "groq-8b-over-70b",
  summary: "An 8B model is enough for grounded factual Q&A.",
  context: "The twin answers narrow questions about my background.",
  decision: "Use 8b-instant with a tightly-scoped system prompt.",
  tradeoffs: "Weaker on open-ended, multi-step reasoning.",
  revisitTrigger: "If visitors ask reasoning questions it fumbles.",
  options: [
    { label: "70b-versatile", summary: "Better prose, slower first token." },
    { label: "8b-instant", summary: "Fast and near-free." },
  ],
  takeaways: ["Match model size to the job."],
};

const BODY = `Some intro prose.

## Why it mattered

Latency is a feature.

## What broke

The second question always 429'd.
`;

describe("chunkContentDoc", () => {
  it("splits a decision into one chunk per meaningful field", () => {
    const chunks = chunkContentDoc(DECISION, BODY, "decision");
    const sections = chunks.map((c) => c.section);

    expect(sections).toContain("summary");
    expect(sections).toContain("tradeoffs");
    expect(sections).toContain("options considered");
    expect(sections).toContain("takeaways");
    expect(sections).toContain("body: Why it mattered");
    expect(sections).toContain("body: What broke");
  });

  it("prefixes every chunk with the document title so short fields stay findable", () => {
    const tradeoff = chunkContentDoc(DECISION, BODY, "decision").find(
      (c) => c.section === "tradeoffs",
    );
    // Without the title, "Weaker on open-ended reasoning" is unattributable.
    expect(tradeoff?.text).toContain("Run the AI twin on 8b, not 70b");
    expect(tradeoff?.text).toContain("Weaker on open-ended");
  });

  it("links decisions and notes to their own routes", () => {
    expect(chunkContentDoc(DECISION, "", "decision")[0].url).toBe(
      "/decisions/groq-8b-over-70b",
    );
    expect(chunkContentDoc(DECISION, "", "note")[0].url).toBe(
      "/notes/groq-8b-over-70b",
    );
  });

  it("produces stable ids so a rebuild diffs cleanly", () => {
    const a = chunkContentDoc(DECISION, BODY, "decision").map((c) => c.id);
    const b = chunkContentDoc(DECISION, BODY, "decision").map((c) => c.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });

  it("drops documents with no title or slug rather than indexing junk", () => {
    expect(chunkContentDoc({ summary: "orphan" }, BODY, "note")).toEqual([]);
  });
});

describe("splitMarkdownSections", () => {
  it("keeps each heading with its prose", () => {
    const sections = splitMarkdownSections(BODY);
    expect(sections.map((s) => s.heading)).toEqual([
      "intro",
      "Why it mattered",
      "What broke",
    ]);
    expect(sections[1].text).toBe("Latency is a feature.");
  });

  it("strips frontmatter that survived into the body", () => {
    const withFm = `---\ntitle: "x"\n---\n\n## H\n\nbody text\n`;
    const sections = splitMarkdownSections(withFm);
    expect(sections.some((s) => s.text.includes("title:"))).toBe(false);
  });
});

describe("chunkContextDoc", () => {
  const DOC = { title: "Day to day at Taleemabad" };

  it("carries no url, because context documents have no page to link to", () => {
    const chunks = chunkContextDoc(DOC, BODY, "2026-07-31-day-to-day");
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) expect(chunk.url).toBeUndefined();
  });

  it("keeps the title on every chunk so a bare section stays attributable", () => {
    const [first] = chunkContextDoc(DOC, BODY, "slug");
    expect(first.text).toContain("Day to day at Taleemabad");
  });

  it("drops a document with no title rather than indexing junk", () => {
    expect(chunkContextDoc({}, BODY, "slug")).toEqual([]);
  });

  it("drops a document with no body, since the title alone retrieves nothing", () => {
    expect(chunkContextDoc(DOC, "", "slug")).toEqual([]);
  });
});

describe("chunkProfile", () => {
  it("keeps a job's achievements attached to the job", () => {
    const [chunk] = chunkProfile({
      experience: [
        {
          jobTitle: "Engineer",
          company: "MetaVision",
          startDate: "2025-03",
          endDate: "2025-11",
          achievements: ["Cut API response times 20%"],
          technologies: [{ name: "Django" }],
        },
      ],
    });
    expect(chunk.text).toContain("Engineer at MetaVision");
    expect(chunk.text).toContain("Cut API response times 20%");
    expect(chunk.text).toContain("Django");
  });

  it("marks a current role as present rather than leaving the range open", () => {
    const [chunk] = chunkProfile({
      experience: [
        {
          jobTitle: "Dev",
          company: "Taleemabad",
          startDate: "2025-11",
          current: true,
        },
      ],
    });
    expect(chunk.text).toContain("2025-11-present");
  });

  it("groups skills by category, since that is the unit people ask about", () => {
    const chunks = chunkProfile({
      skills: [
        { name: "React", category: "Frontend" },
        { name: "Next.js", category: "Frontend" },
        { name: "Docker", category: "Devops" },
      ],
    });
    expect(chunks).toHaveLength(2);
    const frontend = chunks.find((c) => c.title === "Frontend skills");
    expect(frontend?.text).toContain("React, Next.js");
  });

  it("skips records too empty to be worth retrieving", () => {
    expect(chunkProfile({ projects: [{ tagline: "no title" }] })).toEqual([]);
  });
});

describe("score", () => {
  it("is 1 for identical unit vectors and 0 for orthogonal ones", () => {
    expect(score([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    expect(score([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
  });
});

const chunk = (id: string, title: string, vector: number[]): IndexedChunk => ({
  id,
  source: "decision",
  title,
  section: id,
  text: id,
  vector,
});

describe("topK", () => {
  const chunks = [
    chunk("near", "A", [1, 0, 0]),
    chunk("mid", "B", [0.6, 0.8, 0]),
    chunk("far", "C", [0, 0, 1]),
  ];

  it("ranks by similarity, closest first", () => {
    const hits = topK([1, 0, 0], chunks, 3, 0);
    expect(hits.map((h) => h.id)).toEqual(["near", "mid", "far"]);
  });

  it("drops chunks below the relevance floor instead of padding the prompt", () => {
    // "far" is orthogonal — injecting it would invite an answer the corpus
    // does not support.
    const hits = topK([1, 0, 0], chunks, 3, 0.5);
    expect(hits.map((h) => h.id)).toEqual(["near", "mid"]);
  });

  it("honours k", () => {
    expect(topK([1, 0, 0], chunks, 1, 0)).toHaveLength(1);
  });

  it("never leaks raw vectors into the prompt payload", () => {
    const [hit] = topK([1, 0, 0], chunks, 1, 0);
    expect(hit).not.toHaveProperty("vector");
  });
});

describe("diversify", () => {
  it("stops one document from monopolising the results", () => {
    const results = [
      { id: "a1", title: "Doc A", score: 0.9 },
      { id: "a2", title: "Doc A", score: 0.88 },
      { id: "a3", title: "Doc A", score: 0.86 },
      { id: "b1", title: "Doc B", score: 0.5 },
    ].map((r) => ({
      ...r,
      source: "decision" as const,
      section: "s",
      text: r.id,
    }));

    const kept = diversify(results, 2);
    expect(kept.map((k) => k.id)).toEqual(["a1", "a2", "b1"]);
  });

  it("preserves score order", () => {
    const results = [
      { id: "x", title: "A", score: 0.9 },
      { id: "y", title: "B", score: 0.7 },
    ].map((r) => ({ ...r, source: "note" as const, section: "s", text: r.id }));
    expect(diversify(results, 5).map((k) => k.score)).toEqual([0.9, 0.7]);
  });
});
