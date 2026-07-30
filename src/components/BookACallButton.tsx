"use client";

import { IconCalendarEvent } from "@tabler/icons-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { calBookingUrl } from "@/lib/cal";

/**
 * Cal.com "Book a call" entry points.
 *
 * One hook (useBookACall) owns the open logic so the dock action and the
 * contact-section button share it (DRY).
 *
 *   click ──> window.open(https://cal.com/<calLink>)  [new tab]
 *
 * Not the Cal modal embed: Cloudflare blocks it from inside a third-party
 * iframe, which broke booking outright. See src/lib/cal.ts for the evidence.
 */

export function useBookACall(calLink: string | null | undefined) {
  const openBooking = useCallback(() => {
    if (calLink) {
      window.open(calBookingUrl(calLink), "_blank", "noopener,noreferrer");
    }
  }, [calLink]);

  return { openBooking, enabled: Boolean(calLink) };
}

interface BookACallButtonProps {
  calLink: string | null | undefined;
  className?: string;
  /**
   * "default" — shadcn filled Button (contact section).
   * "bare" — plain <button> taking className verbatim, so it can match a
   *   surrounding custom button row (e.g. the hero's ghost-style links).
   */
  variant?: "default" | "bare";
  /** Show the calendar icon. Off by default for "bare" to match plain rows. */
  showIcon?: boolean;
}

/**
 * "Book a call" button. Renders nothing when calLink is empty.
 */
export function BookACallButton({
  calLink,
  className,
  variant = "default",
  showIcon = variant === "default",
}: BookACallButtonProps) {
  const { openBooking, enabled } = useBookACall(calLink);

  if (!enabled) {
    return null;
  }

  const label = "Book a call";
  const icon = showIcon ? (
    <IconCalendarEvent className="size-4" aria-hidden="true" />
  ) : null;

  if (variant === "bare") {
    return (
      <button type="button" onClick={openBooking} className={className}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Button type="button" onClick={openBooking} className={className}>
      {icon}
      {label}
    </Button>
  );
}
