import * as React from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting and reacts to changes.
 *
 * Use this to gate JS-driven motion that a CSS media query can't reach —
 * canvas requestAnimationFrame loops, setInterval carousels, etc. Components
 * built on motion/react should prefer that library's own `useReducedMotion`.
 *
 * SSR-safe: returns `false` until mounted, then resolves to the real value, so
 * the first client paint matches the server (no hydration mismatch).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
