---
title: "Gate the chat with a client-side keyword filter before spending a token"
slug: "client-side-chat-gatekeeper"
date: "2026-04-09"
status: "accepted"
impact: "S"
domain: "AI"
summary: "The chat endpoint costs tokens and is rate-limited, and people will try to use it as a free general-purpose LLM. A cheap client-side keyword check blocks obviously off-topic questions instantly, before any network call; the server rate limit is the real backstop."
context: "A public 'chat with me' box is an open invitation to use it as a free ChatGPT. Every off-topic message costs tokens and eats into the rate limit that protects the endpoint from abuse."
decision: "A keyword gatekeeper in the client checks each question against on-topic and off-topic vocabularies and blocks the clearly-irrelevant ones with a polite redirect — before any network call. On-topic questions proceed to the rate-limited, validated API route."
tradeoffs: "Keyword matching is crude: some off-topic phrasings slip through and some on-topic ones get wrongly blocked. Acceptable for a first-line filter — the server-side rate limit and input validation are the real guardrails."
revisitTrigger: "If false-blocks start frustrating genuine visitors, replace the keyword list with a small, cheap server-side classifier while keeping the instant client check as a pre-filter."
options:
  - label: "Let everything through"
    summary: "Burns budget on off-topic questions and invites the endpoint to be used as a free general-purpose LLM."
  - label: "Server-side LLM classifier"
    summary: "Accurate, but adds a model call per message — paying tokens to decide whether to pay tokens."
  - label: "Client-side keyword gatekeeper"
    summary: "A cheap check in the browser rejects clearly off-topic questions instantly, before any request leaves the client. Free and zero-latency."
takeaways:
  - "Push cheap filtering to the edge; reserve the expensive path for traffic that deserves it."
  - "Crude-but-instant often beats correct-but-costly for a first-line guard — as long as a real backstop (rate limit) sits behind it."
  - "Don't spend a model call to decide whether to spend a model call."
tags:
  - "ai"
  - "cost"
  - "rate-limiting"
  - "frontend"
published: true
---

## Why a filter at all

An open chat box on a public site gets used as a free LLM. Each off-topic message costs tokens and burns the rate limit meant to stop abuse. The cheapest possible defense is to never send the request in the first place.

## Why keywords, not a classifier

A server-side classifier would be more accurate, but it means a model call to decide whether to make a model call. A keyword check in the browser is free and instant. It's crude, so it sits in front of — not instead of — the server rate limit and input validation that are the actual backstop.
