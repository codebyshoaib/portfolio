---
title: What I'm working on day to day
published: false
---

<!--
  Context documents feed the AI twin without becoming a page.

  Use this for what is true but not publishable as a decision or a note: what
  you actually do in a week, what a team owns, tools you reach for daily,
  things you have opinions about that nobody wrote an ADR for.

  How it works:
    - copy this file to content/context/<something>.md
    - set `published: true` (or delete the line — only `false` is skipped)
    - every `##` heading becomes one retrieval chunk, so give each one a
      question's worth of content and a heading that names what it answers
    - `pnpm rag:index` to embed, `pnpm rag:query "..."` to check it retrieves
    - commit src/lib/rag/index.json — the lambda reads it from the repo

  Nothing here is private. Every chunk can be quoted verbatim by the twin to
  anyone who asks the right question, and this repo is public. Write it the way
  you would say it to a stranger who asked.
-->

## What I actually do in a week

Replace this. Two or three sentences on the shape of the work — what lands on
you, what you own, what a typical week looks like.

## What I reach for by default

Replace this. The stack you pick without thinking about it, and why.
