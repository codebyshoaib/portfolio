"use client";

import { IconCalendarEvent } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { calFallbackUrl, loadCal } from "@/lib/cal";

/**
 * Cal.com "Book a call" entry points.
 *
 * One hook (useBookACall) owns the open-modal logic so the dock action and the
 * contact-section button share it (DRY). The embed snippet is imported at module
 * top, but embed.js itself is only injected on the FIRST click (loadCal), so the
 * heavy Cal core stays out of the initial render path.
 *
 *   click ──> loadCal() [injects embed.js once, idempotent]
 *              ├── Cal("ui", { theme })      sync to active light/dark theme
 *              └── Cal("modal", { calLink }) open booking modal in-place
 *            └── on failure ──> window.open(https://cal.com/<calLink>)  [new tab]
 */

export function useBookACall(calLink: string | null | undefined) {
  const { resolvedTheme } = useTheme();
  const [pending, setPending] = useState(false);
  // Guard against double-injection races if a user double-clicks before the
  // first load resolves. loadCal is itself idempotent, but this avoids two
  // concurrent in-flight opens.
  const openingRef = useRef(false);

  const openModal = useCallback(async () => {
    if (!calLink || openingRef.current) {
      return;
    }
    openingRef.current = true;
    setPending(true);
    try {
      // loadCal dynamic-imports the snippet (kept out of the initial bundle) and
      // injects embed.js on first call. Awaited so a slow chunk fetch shows the
      // pending state rather than appearing to do nothing.
      const cal = await loadCal();
      const theme = resolvedTheme === "dark" ? "dark" : "light";
      // Re-applying ui on each open keeps the modal themed to the CURRENT theme,
      // so toggling light/dark between opens is reflected. config.theme on the
      // modal call themes the booking iframe itself.
      cal("ui", { theme });
      cal("modal", { calLink, config: { theme } });
    } catch (err) {
      // Embed failed to load (network, blocked script). Fall back to a new tab
      // so booking still works rather than silently dying.
      console.error("Cal embed failed, falling back to new tab", err);
      window.open(calFallbackUrl(calLink), "_blank", "noopener,noreferrer");
    } finally {
      setPending(false);
      openingRef.current = false;
    }
  }, [calLink, resolvedTheme]);

  return { openModal, pending, enabled: Boolean(calLink) };
}

interface BookACallButtonProps {
  calLink: string | null | undefined;
  className?: string;
}

/**
 * Labeled variant for the contact section. Renders nothing when calLink is empty.
 */
export function BookACallButton({ calLink, className }: BookACallButtonProps) {
  const { openModal, pending, enabled } = useBookACall(calLink);

  if (!enabled) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={openModal}
      disabled={pending}
      aria-busy={pending}
      className={className}
    >
      <IconCalendarEvent className="size-4" aria-hidden="true" />
      {pending ? "Opening…" : "Book a call"}
    </Button>
  );
}
