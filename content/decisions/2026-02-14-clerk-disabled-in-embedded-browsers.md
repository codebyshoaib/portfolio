---
title: "Disable Clerk auth entirely inside embedded browsers"
slug: "clerk-disabled-in-embedded-browsers"
date: "2026-02-14"
status: "accepted"
impact: "M"
domain: "AUTH"
summary: "Portfolio links get opened inside in-app WebViews (LinkedIn, Instagram, X) where OAuth popup/redirect flows silently break. Rather than fight the WebView, I detect it and skip Clerk entirely, serving the full public portfolio with auth-gated surfaces hidden."
context: "A large share of traffic to a portfolio arrives from social apps, which open links in in-app WebViews. Clerk's sign-in depends on popup/redirect OAuth flows that these WebViews block or mangle, leaving a visitor stranded on a broken sign-in screen before they ever see the work."
decision: "ConditionalClerkProvider detects embedded browsers via user-agent and mounts the Clerk provider only in standalone browsers. Embedded visitors render the complete public portfolio; the dashboard and sign-in are simply absent for them. A useSafeClerk hook keeps components crash-free when Clerk isn't mounted."
tradeoffs: "Visitors inside embedded browsers cannot sign in or reach the dashboard at all. That's acceptable: the public portfolio is the product, and the dashboard exists only for me."
revisitTrigger: "If Clerk ships a WebView-safe auth flow, or if a real end-user audience ever needs to authenticate from inside a WebView, revisit the skip-entirely approach."
options:
  - label: "Force auth everywhere"
    summary: "Simplest, but strands every WebView visitor on a broken OAuth flow. The default visitor to a portfolio is unauthenticated — this fails them."
  - label: "Detect embedded browser, skip Clerk"
    summary: "A ConditionalClerkProvider checks the UA and mounts Clerk only in real browsers. WebView visitors get the full public site; auth-only surfaces are hidden."
  - label: "Build custom popup-free auth"
    summary: "Solves the WebView case but is a large amount of work and attack surface for a personal site whose auth only gates my own dashboard."
takeaways:
  - "In-app WebViews are a hostile environment for OAuth — detect and degrade gracefully rather than fighting the platform."
  - "A portfolio's default visitor is unauthenticated; auth should never stand between a visitor and the content."
  - "Guarding every Clerk hook behind a safe wrapper keeps the tree from crashing when the provider is intentionally absent."
tags:
  - "auth"
  - "clerk"
  - "webview"
  - "nextjs"
published: true
---

## The problem

Most people who click a portfolio link are inside a social app — LinkedIn, Instagram, X. Those apps open links in an in-app WebView, not the system browser. Clerk's OAuth relies on popup and redirect flows that WebViews routinely block, so a visitor coming from social hit a broken sign-in wall before seeing a single project.

## The call

Detect the embedded browser from the user-agent and never mount Clerk there. Real browsers get the full authenticated experience; WebView visitors get the entire public portfolio with the dashboard and sign-in simply not present. A useSafeClerk hook makes components that reference Clerk safe to render when the provider isn't there.

## Why not just force auth

Because the default visitor to a portfolio is unauthenticated and always will be. Auth here gates exactly one thing — my own dashboard. Letting it break the experience for a large slice of real traffic to protect a page only I use is the wrong trade.
