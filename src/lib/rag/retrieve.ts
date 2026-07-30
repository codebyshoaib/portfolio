/**
 * Vector store and retrieval.
 *
 * The "store" is a JSON file committed to the repo. At this corpus size that is
 * the honest choice: the whole index is a few hundred KB, it loads once per
 * lambda, and a scan over it costs microseconds. A hosted vector DB would add a
 * network hop and an availability dependency to beat a linear scan over ~100
 * rows — it would be slower and less reliable, not faster.
 *
 * Revisit at roughly 10k chunks, where the linear scan and the memory cost
 * start to matter and an ANN index earns its keep.
 */

import type { Chunk } from "./chunk";
import { embedQuery, MissingEmbeddingKeyError } from "./embed";

export interface IndexedChunk extends Chunk {
  readonly vector: readonly number[];
}

export interface RagIndex {
  readonly model: string;
  readonly dimensions: number;
  /** ISO date of the last `pnpm rag:index` run, for staleness debugging. */
  readonly builtAt: string;
  readonly chunks: readonly IndexedChunk[];
}

export interface Retrieved extends Chunk {
  readonly score: number;
}

/**
 * Cosine similarity. Both sides arrive L2-normalised from the embedding API,
 * so the dot product *is* the cosine — no magnitude division needed.
 */
export function score(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Below this, a chunk is noise. Injecting the nearest-but-irrelevant chunk is
 * worse than injecting nothing: it invites the model to answer a question the
 * corpus does not actually cover.
 *
 * This number is a property of the embedding model, not of the corpus, and it
 * does not survive a model swap — cosine scores are only comparable within one
 * vector space. Re-derive it after any change to EMBEDDING_MODEL by running
 * `pnpm rag:query` with questions the corpus cannot answer and reading where
 * the noise tops out.
 *
 * Measured for jina-embeddings-v3 over this corpus:
 *   noise  — capital of France 0.073, sourdough 0.089, pizza 0.108, Tokyo 0.205
 *   signal — 8b tradeoffs 0.441, embedded-browser auth 0.502, django 0.511
 * 0.30 sits in the gap, with roughly 2x margin over the worst noise.
 *
 * The same corpus wanted ~0.50 under bge-small-en-v1.5 and ~0.25 under
 * all-MiniLM-L6-v2 — carrying a floor across models silently disables it. bge
 * also separated far worse (0.460 noise against 0.518 signal); the wide gap
 * here is v3's task adapters doing their job.
 */
export const MIN_SCORE = 0.3;

/** Ranks chunks against an already-embedded query. Pure — tests drive it directly. */
export function topK(
  queryVector: readonly number[],
  chunks: readonly IndexedChunk[],
  k: number,
  minScore = MIN_SCORE,
): Retrieved[] {
  return chunks
    .map(({ vector, ...chunk }) => ({
      ...chunk,
      score: score(queryVector, vector),
    }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Caps how much of any single document can win. Without this, a question about
 * one decision retrieves that decision's summary, context, choice and
 * trade-offs — four chunks saying nearly the same thing — and crowds out the
 * job or project that would have rounded out the answer.
 */
export function diversify(
  results: readonly Retrieved[],
  maxPerTitle: number,
): Retrieved[] {
  const seen = new Map<string, number>();
  const kept: Retrieved[] = [];
  for (const r of results) {
    const count = seen.get(r.title) ?? 0;
    if (count >= maxPerTitle) continue;
    seen.set(r.title, count + 1);
    kept.push(r);
  }
  return kept;
}

let cached: RagIndex | null = null;

/**
 * Loads the committed index once per process. Returns null when the index is
 * absent or was built by a different embedding model — a stale index silently
 * scored against mismatched vectors would degrade answers with no error, so it
 * is treated as no index at all and the caller falls back.
 */
export async function loadIndex(
  expectedModel: string,
): Promise<RagIndex | null> {
  if (cached) return cached;
  try {
    const data = (await import("./index.json")).default as unknown as RagIndex;
    if (!data?.chunks?.length) return null;
    if (data.model !== expectedModel) {
      console.warn(
        `RAG index built with ${data.model}, expected ${expectedModel} — ignoring it. Run: pnpm rag:index`,
      );
      return null;
    }
    cached = data;
    return cached;
  } catch {
    // No index committed yet. The caller degrades to the static prompt.
    return null;
  }
}

export interface RetrieveResult {
  readonly chunks: readonly Retrieved[];
  /** Why retrieval produced nothing, when it produced nothing. */
  readonly reason?: "no-index" | "no-key" | "no-match" | "error";
}

/**
 * Embeds the question and returns the best-matching chunks.
 *
 * Never throws: every failure path degrades to an empty result so the twin
 * answers from its static profile rather than showing the visitor an error.
 */
export async function retrieve(
  question: string,
  k: number,
  maxPerTitle: number,
): Promise<RetrieveResult> {
  const { EMBEDDING_MODEL } = await import("./embed");
  const index = await loadIndex(EMBEDDING_MODEL);
  if (!index) return { chunks: [], reason: "no-index" };

  try {
    const queryVector = await embedQuery(question);
    if (!queryVector) return { chunks: [], reason: "error" };

    const hits = diversify(topK(queryVector, index.chunks, k * 2), maxPerTitle);
    const chunks = hits.slice(0, k);
    return chunks.length > 0 ? { chunks } : { chunks: [], reason: "no-match" };
  } catch (error) {
    if (error instanceof MissingEmbeddingKeyError) {
      return { chunks: [], reason: "no-key" };
    }
    console.error("RAG retrieval failed:", error);
    return { chunks: [], reason: "error" };
  }
}
