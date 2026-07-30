/**
 * The one place that talks to an embedding provider.
 *
 * Groq — which serves the chat model — has no embeddings endpoint, so this is
 * the only part of the twin that needs a second provider. Swapping vendors
 * means rewriting this file and re-running `pnpm rag:index`; nothing else in
 * the codebase knows which model produced the vectors. `loadIndex()` refuses an
 * index whose `model` does not match, so a forgotten rebuild fails loudly
 * instead of scoring against a foreign vector space.
 *
 * Running the model in-process was tried first — transformers.js with
 * bge-small-en-v1.5 — and works well locally: no key, 4-15ms per query. It does
 * not survive deployment. onnxruntime-node ships 211MB of per-platform native
 * binaries that Next cannot bundle and Vercel's file tracing does not follow,
 * so the lambda got the JS wrapper with no library behind it and every request
 * died on `libonnxruntime.so.1: cannot open shared object file`. Shipping it
 * anyway means force-tracing ~70MB of binaries and weights through globs pinned
 * to pnpm's internal directory names. A single fetch is the smaller thing.
 *
 * 512 dimensions rather than the native 1024: jina-embeddings-v3 is
 * Matryoshka-trained, so a truncated vector stays meaningful, and it halves the
 * committed index.
 */

export const EMBEDDING_MODEL = "jina-embeddings-v3";
export const EMBEDDING_DIMENSIONS = 512;

/**
 * Retrieval is asymmetric — a short question has to match a long passage, and
 * the two are not the same kind of text. v3 carries a separate LoRA adapter for
 * each side; using one adapter for both is the single biggest quality loss
 * available here, so the task is a required argument rather than a default.
 */
export type EmbeddingTask = "retrieval.query" | "retrieval.passage";

export class MissingEmbeddingKeyError extends Error {
  constructor() {
    super("JINA_API_KEY is not set — retrieval is unavailable");
    this.name = "MissingEmbeddingKeyError";
  }
}

async function request(
  texts: readonly string[],
  task: EmbeddingTask,
): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new MissingEmbeddingKeyError();

  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      // L2-normalised, which is what lets `score()` use a plain dot product
      // instead of dividing by magnitudes on every comparison.
      normalized: true,
      task,
      input: texts,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Embedding request failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as {
    data: Array<{ index: number; embedding: number[] }>;
  };

  // The API may return items out of order; index is authoritative.
  const ordered = new Array<number[]>(texts.length);
  for (const item of json.data) ordered[item.index] = item.embedding;
  return ordered;
}

/** Embeds indexed passages, preserving input order. Used by `pnpm rag:index`. */
export async function embed(texts: readonly string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return request(texts, "retrieval.passage");
}

/** Embeds a question. The only caller that may use the query adapter. */
export async function embedQuery(question: string): Promise<number[]> {
  const [vector] = await request([question], "retrieval.query");
  return vector;
}
