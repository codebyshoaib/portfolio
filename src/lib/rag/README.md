# Retrieval for the AI twin

## Why this exists

The chat route used to rebuild the entire portfolio into the system prompt on
every turn — every job, project, skill, and decision, whether or not the
question touched them. Measured: **4397 prompt tokens per request**.

Groq's free tier allows **6000 tokens/minute**. Turn 1 (~4600 with the
completion) plus turn 2 (~4900) always blew the budget, so Groq returned 429,
the route flattened it to a 500, and the visitor saw *"Sorry, I encountered an
error."* on their second question, every time.

Trimming the prompt to 1406 tokens fixed the crash. Retrieval is the structural
version of the same fix: send the ~6 chunks that answer *this* question instead
of the whole corpus, and stay flat as the corpus grows.

## How it works

```
content/decisions/*.md ─┐
content/notes/*.md      ├─> pnpm rag:index ─> src/lib/rag/index.json (committed)
Sanity (jobs, projects, │      chunk + embed
skills, education)     ─┘
                                    │
question ─> embed ─> cosine top-k ──┴─> ~6 chunks ─> system prompt ─> Groq
```

| File | Job |
| --- | --- |
| `chunk.ts` | Splits content into retrieval units. Pure — the index script and tests share it. |
| `embed.ts` | The only provider-specific file. Swap vendors here, then reindex. |
| `retrieve.ts` | Loads the index, scores, ranks, filters. |
| `index.json` | The vector store. Generated, committed. |
| `../../scripts/rag/build-index.ts` | `pnpm rag:index` |

Three decisions worth knowing:

- **Chunks are semantic, not fixed-width.** A decision's `tradeoffs` is a
  complete answer to "what did that cost you?", so it is its own chunk. A
  500-character window would split a trade-off from the decision it belongs to
  and retrieve half an argument.
- **Every chunk is prefixed with its document title.** "Weaker on open-ended
  reasoning." embeds almost identically to every other trade-off in the corpus;
  with the title attached it lands near questions about *that* decision.
- **The store is a JSON file scanned linearly.** At 78 chunks, a hosted vector
  DB would add a network hop and an availability dependency to lose to a
  microsecond scan. Revisit around 10k chunks.

Retrieval never throws. No index, no API key, or nothing above the relevance
floor all degrade to the previous static prompt — the twin answers at
summary level rather than showing an error.

## Setup

Groq serves the chat model but has **no embeddings endpoint**, so this needs a
second provider. Currently Jina `jina-embeddings-v3` at 512 dimensions, whose
free tier is ~1000x this corpus.

1. Add the key to `.env.local` and to the Vercel project env:

   ```
   JINA_API_KEY=jina_...
   ```

2. Build the index:

   ```bash
   pnpm rag:index              # ~7k tokens to embed, free tier
   pnpm rag:index --dry-run    # chunk and report only, no API calls
   ```

3. Commit the result — it must be in the repo for the deployed lambda to load it:

   ```bash
   git add src/lib/rag/index.json && git commit -m "chore(rag): rebuild index"
   ```

Without step 1 the site still works; it just falls back to the static prompt.

## What the twin can know

Three sources, and they are updated differently:

| Source | Lives in | Published at | How to update |
| --- | --- | --- | --- |
| decisions | `content/decisions/*.md` | `/decisions/<slug>` | `/decision`, then `pnpm decisions:import` |
| notes | `content/notes/*.md` | `/notes/<slug>` | `/note`, then `pnpm notes:import` |
| profile | Sanity only | the portfolio sections | edit in `/studio`, then `pnpm rag:index` |
| context | `content/context/*.md` | **nowhere** | write the file, then `pnpm rag:index` |

**Context documents** are the answer to "the twin should know this, but it isn't
a decision, a note, or a CV line" — day-to-day work, how a team operates, what
you reach for by default. They are indexed and quotable but have no route, so
their chunks carry no `url` and the twin cites them without a link. Copy
`content/context/_template.md` to start one; every `##` heading becomes one
chunk, so each heading should answer a question.

Nothing in the corpus is private. Every chunk is a candidate for being quoted
verbatim to a stranger, and this repo is public. `published: false` in
frontmatter keeps a file out of the index entirely.

## Rebuilding

The index is derived data and goes stale silently — nothing errors, the twin
just keeps answering from the old corpus.

The imports rebuild it for you:

```bash
pnpm decisions:import   # imports, then re-embeds
pnpm notes:import       # same
```

`prebuild` also rebuilds it on every `pnpm build`, which is what covers Sanity
edits — those change the corpus without touching the repo, so nothing local
would otherwise know to re-embed. It is deliberately non-fatal: if Jina or
Sanity is down, the build keeps the committed index and warns loudly rather
than failing the deploy. `builtAt` in `index.json` is the staleness check.

Everything else is a manual `pnpm rag:index` plus a commit of `index.json` —
the lambda imports it from the repo.

Changing the embedding model is also a rebuild — `retrieve.ts` compares the
index's recorded model against the configured one and ignores a mismatched
index rather than scoring against incompatible vectors.

## Tuning

| Constant | Where | Meaning |
| --- | --- | --- |
| `RETRIEVE_K` | `api/chat/route.ts` | Chunks injected per question (6). |
| `MAX_CHUNKS_PER_DOC` | `api/chat/route.ts` | Caps how much one document can dominate (2). |
| `MIN_SCORE` | `retrieve.ts` | Relevance floor (0.30). Below it, a chunk is noise — injecting it invites the model to answer a question the corpus doesn't cover. |
| `EMBEDDING_DIMENSIONS` | `embed.ts` | 512. Changing it requires a rebuild. |

`MIN_SCORE` belongs to the **model**, not the corpus, and does not survive a
model swap — cosine scores are only comparable inside one vector space. The same
78 chunks wanted 0.30 under jina-v3, 0.50 under bge-small, and 0.25 under
MiniLM. Carried over unchanged, a floor stops rejecting anything and every
off-topic question quietly gets a chunk injected.

Re-derive it with `pnpm rag:query`, which prints scores with the floor disabled
so you can see what it *would* reject:

```bash
pnpm rag:query "how do I bake sourdough bread?"   # noise — read where it tops out
pnpm rag:query "have you worked with django?"     # signal — read where it starts
```

Put the floor in the gap. It is also the tool for "why did the twin answer that?"
— a bad answer is almost always retrieval, not the model.

Watch the server logs for `RAG fell back to the static prompt: <reason>` —
`no-key`, `no-index`, `no-match`, or `error`.

## Related chat fixes

Shipped alongside, same root cause or found on the way:

- Model is `llama-3.3-70b-versatile`, not `llama-3.1-8b-instant`: 12000 TPM
  instead of 6000, and it actually obeys the length rules the 8b ignored.
  **The ADR at `/decisions/groq-8b-over-70b-for-ai-twin` now contradicts the
  code and needs revisiting.**
- `MessageSchema` capped *every* message at 500 chars, including our own replies
  being replayed by the client — which 400'd the second turn of any conversation
  whose first answer ran long. The cap now applies to user turns only.
- Only the last 6 turns are replayed to Groq.
- A Groq 429 is surfaced as a retryable 429 with `Retry-After`, not a generic
  500. The response body is logged; `statusText` alone is what hid the rate
  limit in the first place.
