"use client";

import { IconArrowUp } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * Scroll-to-top button, fixed bottom-left. Appears once the page is scrolled
 * past a threshold so it stays out of the way at the top. Matches the side
 * rail's top-left menu button styling for a consistent corner language.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      className={`fixed bottom-6 left-6 z-40 flex size-11 items-center justify-center rounded-full border border-border bg-background/70 text-foreground shadow-sm backdrop-blur-xl transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <IconArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
