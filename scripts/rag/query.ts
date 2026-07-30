#!/usr/bin/env tsx

/**
 * Asks the index a question and prints what it would inject into the prompt.
 *
 * This is the only way to see *why* the twin answered the way it did. When an
 * answer is wrong the cause is almost always retrieval, not the model: the
 * right chunk scored below MIN_SCORE, or four near-duplicates from one document
 * crowded it out. Both are visible here and invisible from the chat UI.
 *
 * Run:
 *   pnpm rag:query "what did the groq decision cost you?"
 */

import { EMBEDDING_MODEL, embedQuery } from "../../src/lib/rag/embed";
import {
  diversify,
  loadIndex,
  MIN_SCORE,
  topK,
} from "../../src/lib/rag/retrieve";

const DEFAULT_QUESTIONS = [
  "what did the groq decision cost you?",
  "why is auth turned off inside instagram's browser?",
  "have you worked with django?",
  "what is your favourite pizza topping?",
];

async function main() {
  const questions = process.argv.slice(2);
  const asked = questions.length > 0 ? questions : DEFAULT_QUESTIONS;

  const index = await loadIndex(EMBEDDING_MODEL);
  if (!index) {
    console.error("No usable index. Run: pnpm rag:index");
    process.exit(1);
  }
  console.log(
    `${index.chunks.length} chunks · ${index.model} · built ${index.builtAt}\n`,
  );

  // First call loads the model; time it separately from the per-query cost.
  const cold = performance.now();
  await embedQuery("warmup");
  console.log(`model load: ${Math.round(performance.now() - cold)}ms\n`);

  for (const question of asked) {
    const start = performance.now();
    const vector = await embedQuery(question);
    const ms = performance.now() - start;

    // Floor of 0, not MIN_SCORE: seeing the scores the floor *rejects* is the
    // only way to tell whether the floor is set anywhere near the right place.
    const hits = diversify(topK(vector, index.chunks, 8, 0), 2).slice(0, 4);

    console.log(`Q: ${question}   (embed ${ms.toFixed(1)}ms)`);
    for (const hit of hits) {
      const kept = hit.score >= MIN_SCORE ? " " : "✗";
      console.log(
        `  ${kept} ${hit.score.toFixed(3)}  ${hit.title} › ${hit.section}`,
      );
    }
    console.log();
  }
  console.log(`✗ = below MIN_SCORE (${MIN_SCORE}), dropped before the prompt`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
