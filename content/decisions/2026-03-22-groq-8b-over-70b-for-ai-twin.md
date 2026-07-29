---
title: "Run the AI twin on llama-3.1-8b-instant, not 70b"
slug: "groq-8b-over-70b-for-ai-twin"
date: "2026-03-22"
status: "accepted"
impact: "S"
domain: "AI"
summary: "The 'chat with me' twin answers short, factual questions grounded in my CMS data. An 8B model, streamed, with a rich grounded system prompt feels instant and costs almost nothing — the job is retrieval and phrasing, not open-ended reasoning."
context: "The AI twin exists to answer a visitor's questions about my background, projects, and decisions. It needs to feel instant on a personal-site budget. The questions are narrow and the answers already live in my CMS — the model's job is to phrase grounded facts, not to reason from scratch."
decision: "Use 8b-instant with streaming and a tightly-scoped system prompt assembled from my real CMS data (profile, experience, projects, skills, decisions). The small model retrieves and phrases rather than reasons, which is exactly what an 8B model is good at."
tradeoffs: "Weaker on open-ended, multi-step reasoning. Mitigated by a keyword gatekeeper that keeps questions on-topic and by a rich, pre-grounded prompt so the model rarely has to reason."
revisitTrigger: "If visitors start asking multi-step reasoning questions the 8B model visibly fumbles, route just those to 70b while keeping 8b as the default."
options:
  - label: "llama-3.1-70b-versatile"
    summary: "Better open-ended prose, but slower first token and materially higher cost per message for a benefit the task barely uses."
  - label: "llama-3.1-8b-instant"
    summary: "Fast first token, near-zero cost, and more than good enough when the system prompt already contains the grounded answer."
  - label: "A hosted frontier model"
    summary: "Overkill for grounded factual Q&A on a portfolio, and the cost/latency profile is wrong for a free public toy."
takeaways:
  - "Match model size to the job — grounded retrieval and phrasing does not need a frontier model."
  - "A strong, pre-grounded system prompt beats a bigger model for a narrow domain."
  - "For a free public feature, first-token latency and cost per message matter as much as answer quality."
tags:
  - "ai"
  - "groq"
  - "llm"
  - "performance"
published: true
---

## The job the model actually does

The twin answers questions like “what's your experience?” or “what have you built?” The answers already exist in my CMS. So the model isn't reasoning — it's selecting the relevant grounded facts and phrasing them in my voice. That's a task an 8B model does well.

## Why not the bigger model

70b writes nicer open-ended prose, but it costs more per message and its first token is slower. For a free public feature the latency and cost matter, and the extra reasoning headroom is capacity the task barely touches. The right lever wasn't a bigger model — it was a better system prompt.
