/**
 * Reading time for decision entries, derived from the content that actually
 * renders — no stored field to drift out of date.
 */

const WORDS_PER_MINUTE = 200;

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function countAllWords(
  texts: readonly (string | null | undefined)[],
): number {
  return texts.reduce((total, text) => total + countWords(text), 0);
}

/**
 * Word count over a Portable Text body's text spans. Code blocks are skipped
 * deliberately: nobody reads a snippet at prose speed, and counting them
 * inflates the estimate on the most code-heavy entries.
 */
export function countPortableTextWords(
  blocks: readonly Record<string, unknown>[] | null | undefined,
): number {
  if (!blocks) return 0;
  let total = 0;
  for (const block of blocks) {
    const children = block.children;
    if (!Array.isArray(children)) continue;
    for (const child of children) {
      const text = (child as { text?: unknown } | null)?.text;
      if (typeof text === "string") total += countWords(text);
    }
  }
  return total;
}

/** Minutes at 200wpm, never less than 1 — "0 min read" is worse than a lie. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
