/**
 * The one place that talks to an embedding provider.
 *
 * Groq — which serves the chat model — has no embeddings endpoint, so this is
 * the only part of the twin that needs a second provider. Swapping vendors
 * means rewriting `embed()` and re-running `pnpm rag:index`; nothing else in
 * the codebase knows which model produced the vectors.
 *
 * 256 dimensions rather than the default 1536: text-embedding-3-small is
 * Matryoshka-trained, so a truncated vector stays meaningful, and it keeps the
 * committed index small enough to read in a diff.
 */

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 256;

export class MissingEmbeddingKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not set — retrieval is unavailable");
    this.name = "MissingEmbeddingKeyError";
  }
}

/**
 * Embeds one or more texts, preserving input order.
 *
 * Vectors come back L2-normalised, which is what lets `score()` use a plain dot
 * product instead of dividing by magnitudes on every comparison.
 */
export async function embed(texts: readonly string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new MissingEmbeddingKeyError();

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
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
