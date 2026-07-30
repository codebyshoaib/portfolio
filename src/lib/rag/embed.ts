/**
 * The one place that talks to an embedding model.
 *
 * The model runs in-process. Groq — which serves the chat model — has no
 * embeddings endpoint, so the alternative was a second vendor and a second API
 * key for what is, at this corpus size, a few milliseconds of matrix
 * multiplication. bge-small-en-v1.5 is 33M parameters; quantised to int8 it is
 * ~34MB and embeds a sentence in single-digit milliseconds on a laptop CPU.
 *
 * Swapping models means changing the two constants below and re-running
 * `pnpm rag:index`; nothing else in the codebase knows which model produced the
 * vectors. `loadIndex()` refuses an index whose `model` does not match, so a
 * forgotten rebuild fails loudly instead of scoring against a foreign space.
 *
 * 384 dimensions is the model's native width. Unlike text-embedding-3-small
 * this is not Matryoshka-trained, so the vector cannot be truncated — every
 * dimension carries signal.
 *
 * Retrieval is asymmetric: a short question has to match a long passage, and
 * the two are not the same kind of text. all-MiniLM-L6-v2 was tried first and
 * is trained for symmetric sentence-to-sentence similarity — it ranked a
 * decision's `tradeoffs` chunk outside the top 4 for "what did that cost you?".
 * bge is trained for the asymmetric case and expects queries — only queries —
 * to carry the prefix below.
 */

import type { FeatureExtractionPipeline } from "@huggingface/transformers";

export const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBEDDING_DIMENSIONS = 384;

/**
 * Prepended to questions, never to indexed passages. This is not a prompt — it
 * is a literal string the model was fine-tuned on to mark "this side of the
 * comparison is a query", and it moves the vector into the region the passage
 * embeddings were trained to be found from.
 */
export const QUERY_PREFIX =
  "Represent this sentence for searching relevant passages: ";

let pipe: Promise<FeatureExtractionPipeline> | null = null;

/**
 * Loads the model once per process and reuses it.
 *
 * The import is dynamic so that merely importing this module does not pull
 * onnxruntime into the caller's graph — the chat route imports `retrieve`,
 * which imports this, on every request, but only pays for the runtime when it
 * actually embeds something.
 */
function extractor(): Promise<FeatureExtractionPipeline> {
  if (!pipe) {
    pipe = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: "q8" }),
    );
  }
  return pipe;
}

/**
 * Embeds one or more texts, preserving input order.
 *
 * `normalize: true` returns L2-normalised vectors, which is what lets `score()`
 * use a plain dot product instead of dividing by magnitudes on every
 * comparison. `pooling: "mean"` collapses the per-token output into one vector
 * per input — the standard recipe for this model family.
 */
export async function embed(texts: readonly string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const extract = await extractor();
  const output = await extract(texts as string[], {
    pooling: "mean",
    normalize: true,
  });

  return output.tolist() as number[][];
}

/**
 * Embeds a question. The only caller that should ever apply QUERY_PREFIX —
 * indexing a passage with it would put the whole corpus in the wrong region.
 */
export async function embedQuery(question: string): Promise<number[]> {
  const [vector] = await embed([QUERY_PREFIX + question]);
  return vector;
}
