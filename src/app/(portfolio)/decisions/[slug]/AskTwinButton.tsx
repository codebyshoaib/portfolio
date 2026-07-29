"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { dispatchAskTwin, seedPromptForDecision } from "@/lib/ask-twin";

/**
 * Hands the current decision to the AI twin: opens the chat sidebar and seeds
 * its input with a question about this ADR. It stops at seeding — the visitor
 * presses send. That keeps the interaction honest (nothing fires off a request
 * they didn't ask for) and sidesteps a setState race, since Chat's submit
 * handler reads from state that would not have flushed yet.
 *
 * The label sits in the reading voice, not the 11px uppercase mono register this
 * surface reserves for non-interactive metadata — the page's only action
 * shouldn't read as a caption with a box round it. The line beneath says what
 * pressing it actually does, because the label alone discloses none of it.
 */
export function AskTwinButton({ title }: { readonly title: string }) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  const handleClick = () => {
    // Idempotent: opening an already-open sidebar is a no-op, and a repeat click
    // re-parks the same prompt (Chat won't overwrite a draft in progress).
    if (isMobile) setOpenMobile(true);
    else setOpen(true);
    dispatchAskTwin(seedPromptForDecision(title));
  };

  return (
    <button type="button" className="ask-twin" onClick={handleClick}>
      <span className="ask-twin-label">
        Ask my AI twin about this decision
        <span aria-hidden> →</span>
      </span>
      <span className="ask-twin-hint">
        Opens the chat with the question pre-typed. You press send.
      </span>
    </button>
  );
}
