"use client";

import { track } from "@vercel/analytics/react";
import { useEffect } from "react";

const MILESTONES = [25, 50, 75, 100] as const;

/**
 * Fires a Vercel Analytics event when the user crosses 25/50/75/100% of the
 * scrollable height. Each milestone fires at most once per page view, so
 * `v1_scroll_depth` with bucket="100" is the "completion" signal compared
 * against v2's `v2_session_end.completed`.
 */
export function ScrollDepthTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = new Set<number>();
    let ticking = false;

    const computeAndFire = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.min(
        100,
        Math.round(
          ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100,
        ),
      );
      for (const m of MILESTONES) {
        if (pct >= m && !seen.has(m)) {
          seen.add(m);
          track("v1_scroll_depth", { bucket: String(m) });
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(computeAndFire);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Capture initial state on short pages
    computeAndFire();
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
