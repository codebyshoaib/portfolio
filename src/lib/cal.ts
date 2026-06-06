/**
 * Cal.com embed loader.
 *
 * @calcom/embed-snippet injects embed.js idempotently (it guards on `Cal.loaded`
 * internally) and returns the global `window.Cal` function. We wrap it so callers
 * get a typed handle without each component re-declaring the global.
 *
 *   await loadCal()                 // dynamic-imports snippet, injects embed.js once
 *     ├── Cal("ui", { theme })      // theme sync (light/dark)
 *     └── Cal("modal", { calLink }) // open the booking modal
 *
 * The snippet is dynamic-imported INSIDE loadCal (not at module top) so neither
 * the snippet nor embed.js ships in the initial bundle — both load only when a
 * user first clicks "Book a call". embed.js itself is fetched from app.cal.com
 * at runtime by the snippet, never bundled.
 *
 * We deliberately use the vanilla snippet, NOT @calcom/embed-react, because the
 * React package pins peer deps to React 18.2 and this app is on React 19 — the
 * SDK would force --legacy-peer-deps and risk CI build failures. The snippet is
 * framework-agnostic with zero React peer deps.
 */

// Minimal shape of the global Cal function. @calcom/embed-core ships no types,
// so we declare only what we call. Cal is a variadic command dispatcher:
// Cal("modal", { calLink }), Cal("ui", { theme }), etc.
type CalApi = ((action: string, options?: Record<string, unknown>) => void) & {
  loaded?: boolean;
};

/**
 * Dynamic-import the snippet, inject embed.js (once), and return the global Cal
 * command function. Rejects if called server-side or if the snippet fails to
 * produce `window.Cal`.
 */
export async function loadCal(): Promise<CalApi> {
  if (typeof window === "undefined") {
    throw new Error("loadCal must run in the browser");
  }
  const { default: EmbedSnippet } = await import("@calcom/embed-snippet");
  const cal = EmbedSnippet() as CalApi | undefined;
  if (!cal) {
    throw new Error("Cal embed failed to load");
  }
  return cal;
}

/**
 * Build the public fallback URL for a Cal link (path form, e.g. "user/30min").
 * Used when the embed fails to load — booking still works in a new tab.
 */
export function calFallbackUrl(calLink: string): string {
  return `https://cal.com/${calLink}`;
}
