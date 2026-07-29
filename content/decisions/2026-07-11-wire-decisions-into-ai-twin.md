---
title: "Feed the engineering-decision log into the AI twin's system prompt"
slug: "wire-decisions-into-ai-twin"
date: "2026-07-11"
status: "accepted"
impact: "S"
domain: "AI"
summary: "The strongest senior signal on the site — this decision log — was invisible to the AI twin. A visitor asking the chatbot about a hard trade-off got nothing. The chat now pulls the structured fields of the most recent published decisions into its system prompt and points deeper questions at /decisions."
context: "This decision log is the highest-signal content on the site, but it lived entirely at /decisions. The AI twin's system prompt was built only from profile, experience, projects, skills, and education — so a visitor who asked the chatbot 'walk me through a hard technical trade-off' got nothing, despite a whole reasoned log existing feet away."
decision: "The chat query now fetches the most recent published decisions' structured fields, and buildSystemMessage renders up to 8 of them into the system prompt with a guideline to name the constraint, the rejected option, and the accepted trade-off — and to point visitors to /decisions for the full log."
tradeoffs: "Capped at 8 decisions to protect the 8B context window, so older entries aren't in the prompt. They remain one link away at /decisions."
revisitTrigger: "If the log grows past what 8 entries can represent, switch from inlining to retrieval — embed each decision and fetch only the ones relevant to the visitor's question."
options:
  - label: "Leave them separate"
    summary: "The log stays at /decisions and the chat answers only bio questions. Simplest, but the best content stays invisible to the surface where visitors ask about exactly this."
  - label: "Inline every ADR fully"
    summary: "Maximum context, but the full Portable Text bodies would blow the 8B model's context window as the log grows."
  - label: "Inline the top-N structured fields"
    summary: "Pull the structured fields (context, options, trade-off, takeaways) of the most recent N decisions into the prompt, and link deeper questions to /decisions."
takeaways:
  - "Content is only an asset if it's wired into every surface that can use it — a great log nobody's tools can reach is dead weight."
  - "A cap is a ceiling, not a limit: name the upgrade path (retrieval) at the moment you take the shortcut (top-8 inline)."
  - "The chat is the natural place a visitor asks 'why did you choose X' — that's exactly where the decision log belongs."
tags:
  - "ai"
  - "groq"
  - "rag"
  - "portfolio"
published: true
---

## The gap

A visitor's most senior question — 'tell me about a hard trade-off you made' — lands in the chat box. But the chat's system prompt knew nothing about the decision log. The best content on the site was unreachable from the surface built to surface it.

## The fix, and its ceiling

Pull the structured fields of the most recent published decisions into the system prompt, capped at eight to protect the small model's context window, and link deeper questions to the full log. The cap is a known ceiling: once the log outgrows eight entries, the upgrade is retrieval — embed the decisions and fetch only the relevant ones per question.
