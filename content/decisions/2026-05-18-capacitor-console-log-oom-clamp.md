---
title: "Clamp every console.log argument before it crosses the Capacitor JS↔native bridge"
slug: "capacitor-console-log-oom-clamp"
date: "2026-05-18"
status: "accepted"
impact: "L"
domain: "mobile"
summary: "1,900 OOM crashes/week on low-RAM Android, all from the same Crashlytics signature, were caused by Capacitor's Android bridge running String.format on every console.log payload before any log-level guard. Fixed with a runtime guard that clamps any log argument to 8 KB before crossing the bridge, layered with build-time stripping and an agent safety rule."
context: |
  We saw 1,900 OutOfMemoryError crashes in a 7-day window from a single Crashlytics signature.
  One user hit the same crash 13 times in a row. Every crash tried to allocate the exact same 266 MB block.
  Only on TECNO, Vivo, and Infinix — the low-RAM Android devices a large share of our users actually carry.
  Two days of guessing — images, leaks, IndexedDB, Dexie — all wrong.
decision: |
  Defense in depth across four layers:
  (1) Terser strips console.* calls in production builds.
  (2) A runtime guard wraps console.* and clamps any single argument to 8 KB before it can be marshalled across the JS-to-native bridge.
  (3) An agent safety rule rejects new code that logs raw response/record/err objects.
  (4) Fixed a separate Terser config issue that had been stripping Crashlytics breadcrumbs in prod.
tradeoffs: |
  Engineers lose the ability to console.log a raw 1 MB object. They now have to log shape — `console.log("saved", { id, status })` instead of `console.log(response)`. Minor DX cost; we measured zero developer-velocity impact in the week after rollout.
revisitTrigger: |
  If Capacitor patches its String.format usage on the Android bridge — or if we move off Capacitor entirely — the runtime clamp can be relaxed back to a simple level guard. Build-time stripping and the agent rule stay regardless.
options:
  - label: "Leave it (won't-fix)"
    summary: "1,900 crashes/week on the devices our actual users carry. Not an option."
  - label: "Strip console.log at build only (Terser)"
    summary: "Already in place — and the Terser config had quietly regressed, which also stripped our Crashlytics breadcrumbs. One layer is not enough; build config drift is silent."
  - label: "Runtime clamp at the bridge"
    summary: "Wrap console.* and truncate any argument over 8 KB before it crosses the bridge. Survives Terser regressions and works in dev builds too."
  - label: "Abandon Capacitor"
    summary: "Too expensive for a bug this localized. Re-evaluate only if the bridge keeps producing structural failures."
takeaways:
  - "Read the SDK source. Third-party libraries feel like black boxes until you open them — the production issue costing you thousands of crashes may sit in 40 lines of code nobody on the team has ever read."
  - "console.log(object) in a mobile WebView is structurally dangerous, not stylistic. Prefer console.log('saved', { id, status }); avoid console.log(response) / console.log(record) / console.log(err)."
  - "Defense in depth wins. Any one layer (build-strip, runtime guard, agent rule, breadcrumbs) can regress. All of them together stay resilient."
  - "On low-RAM Android (TECNO/Vivo/Infinix) the WebView heap tops out around ~192 MB. Treat that as a hard ceiling for any data that crosses the JS-native bridge."
tags:
  - "mobile"
  - "android"
  - "capacitor"
  - "performance"
  - "production-incident"
published: true
---

## What I blamed first (and got wrong)

Two days, three wrong hypotheses:

- Image handling — overzealous bitmap caching.
- Memory leaks — long-lived references in a Dexie subscriber.
- IndexedDB / Dexie — too-large records pulled into memory.

Every assumption was wrong. The crashes all tried to allocate the same 266 MB block, and the only signal connecting them was the device class — TECNO, Vivo, Infinix. Nothing in our JS code path touched that much memory.

## What cracked it open

I stopped guessing and read the Capacitor source. The bridge runs Java's `String.format` on every `console.log` message **before** any log-level or production guard kicks in. So when JS does:

```ts
console.log(response);
```

…and `response` is a large Dexie object with embedded base64 audio, Java tries to materialize the entire thing across the JS↔native bridge. On low-RAM devices the WebView heap caps around 192 MB. The 266 MB allocation goes through `String.format`, OOMs, and the app dies instantly.

The whole story was sitting in ~40 lines of Java that nobody on the team had ever opened.

## The fix

Four layers, intentionally:

```ts
// Runtime guard installed at app entry, before any feature code runs.
const MAX_ARG_BYTES = 8 * 1024;
const truncate = (arg: unknown): unknown => {
  if (typeof arg !== "string") {
    try {
      arg = JSON.stringify(arg);
    } catch {
      return "[unserializable]";
    }
  }
  const s = arg as string;
  if (s.length <= MAX_ARG_BYTES) return s;
  return `${s.slice(0, MAX_ARG_BYTES)} … TRUNCATED ${s.length - MAX_ARG_BYTES} chars`;
};

for (const level of ["log", "info", "warn", "error", "debug"] as const) {
  const original = console[level].bind(console);
  console[level] = (...args: unknown[]) => original(...args.map(truncate));
}
```

Plus:

- **Build-time stripping**: Terser drops `console.log` / `console.debug` in production. (And we fixed the config regression that had been silently dropping our Crashlytics breadcrumbs.)
- **Agent safety rule**: PRs that introduce `console.log(<raw object>)` get flagged automatically.
- **Test on the actual device class**: A Vivo Y21 with a 100 MB string logged on purpose. No crash. No ANR. App stayed responsive. Logcat: `TRUNCATED 99997952 chars`.

## Result

Crashlytics signature dropped to zero in the following release. The same 1 KB of runtime code closes a long-tail crash that was eating ~270 users every week.

## If you ship Capacitor, Cordova, or any JS-to-native shell

Check your `console.*` calls before you look anywhere else. The bridge is your most underestimated allocation site.
