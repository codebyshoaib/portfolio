import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { buildDoc, parseFrontmatter } from "../import";

const NOTE_MD = `---
title: "Sanity webhooks fire before the CDN purges"
slug: "sanity-webhook-cdn-purge"
date: "2026-07-30"
summary: "The revalidate call lands before the new document is readable."
tags: ["sanity", "nextjs"]
---

The webhook fires on commit, not on propagation.
`;

const DECISION_IN_A_NOTE_MD = `---
title: "Picked Groq over OpenAI"
slug: "groq-over-openai"
date: "2026-07-30"
summary: "Latency won."
status: "accepted"
options:
  - label: "OpenAI"
    summary: "Slower per token."
---

Body.
`;

describe("note import", () => {
  it("builds a note document with a note- prefixed id", () => {
    const parsed = matter(NOTE_MD);
    const fm = parseFrontmatter("note.md", "note", parsed);
    const doc = buildDoc("note", fm, parsed.content);

    expect(doc._id).toBe("note-sanity-webhook-cdn-purge");
    expect(doc._type).toBe("note");
    expect(doc.published).toBe(true);
    expect(doc.body.length).toBeGreaterThan(0);
  });

  it("carries no decision fields onto a note document", () => {
    const parsed = matter(NOTE_MD);
    const doc = buildDoc(
      "note",
      parseFrontmatter("note.md", "note", parsed),
      parsed.content,
    );

    for (const field of [
      "status",
      "impact",
      "domain",
      "context",
      "decision",
      "tradeoffs",
      "revisitTrigger",
      "takeaways",
      "optionsConsidered",
    ]) {
      expect(doc[field]).toBeUndefined();
    }
  });

  it("rejects a decision filed as a note rather than dropping its fields", () => {
    const parsed = matter(DECISION_IN_A_NOTE_MD);
    expect(() => parseFrontmatter("stray.md", "note", parsed)).toThrow(
      /decision-only keys \(status, options\)/,
    );
  });

  it("still builds decisions with every field intact", () => {
    const parsed = matter(DECISION_IN_A_NOTE_MD);
    const doc = buildDoc(
      "decision",
      parseFrontmatter("d.md", "decision", parsed),
      parsed.content,
    );

    expect(doc._id).toBe("decision-groq-over-openai");
    expect(doc.status).toBe("accepted");
    expect(doc.optionsConsidered).toHaveLength(1);
  });
});
