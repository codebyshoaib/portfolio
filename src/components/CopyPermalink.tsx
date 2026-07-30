"use client";

import { useEffect, useRef, useState } from "react";

const CONFIRM_MS = 2000;

type State = "idle" | "copied" | "failed";

/**
 * Replaces the old "Permalink ↗" link, which pointed at the page you were
 * already on — a dead control with a glyph promising navigation. Copying the
 * canonical URL is the affordance a reader of a citable ADR actually wants.
 *
 * Two things the obvious version gets wrong:
 *  - `navigator.clipboard` is undefined on insecure origins and can be
 *    permission-blocked, so the happy path is not guaranteed. Failing silently
 *    leaves a button that does nothing when clicked, which is worse than saying
 *    so — hence the `failed` state, which reveals the URL to copy by hand.
 *  - the visible label must not be the accessible name, or the name changes to
 *    "Copied" after a click and the control announces a status where its label
 *    should be. The name is fixed on the button; the status lives in its own
 *    polite live region.
 */
export function CopyPermalink({
  url,
  subject = "page",
}: {
  readonly url: string;
  /** Names the thing being linked in the button's accessible name. */
  readonly subject?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Focus the fallback when it appears. Done here rather than with `autoFocus`
  // so focus only ever moves as the direct result of the reader's own click.
  useEffect(() => {
    if (state === "failed") fallbackRef.current?.select();
  }, [state]);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      ok = false;
    }
    setState(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    // The failure state stays put — it holds the URL the reader still needs.
    if (ok) timer.current = setTimeout(() => setState("idle"), CONFIRM_MS);
  };

  return (
    <span className="permalink-wrap">
      <button
        type="button"
        className="permalink"
        onClick={copy}
        aria-label={`Copy link to this ${subject}`}
      >
        {state === "copied" ? "Copied" : "Copy link"}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied"
          ? "Link copied to clipboard"
          : state === "failed"
            ? "Couldn't copy automatically. The link is shown for manual copying."
            : ""}
      </span>
      {state === "failed" ? (
        <input
          ref={fallbackRef}
          className="permalink-fallback"
          readOnly
          value={url}
          aria-label={`${subject} link, copy manually`}
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : null}
    </span>
  );
}
