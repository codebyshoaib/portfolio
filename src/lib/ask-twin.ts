/**
 * Seeding the AI twin's chat from anywhere on the site.
 *
 * The chat lives in the right sidebar (AppSidebar → ChatWrapper → Chat) and
 * keeps `messages`/`input` in local component state. A page that wants to hand
 * it a question shares the SidebarProvider but no state.
 *
 * The protocol is deliberately BOTH push and pull, because whether `Chat` is
 * mounted at dispatch time depends on the viewport:
 *   - desktop (≥768px): the sidebar is a plain collapsible div, so `Chat` is
 *     mounted-but-hidden and already subscribed → the event lands.
 *   - mobile (<768px): the sidebar is a Radix `SheetContent` with no
 *     `forceMount` (ui/sidebar.tsx), so `Chat` does not exist until after the
 *     sheet opens. An event dispatched in the click handler's tick is fired
 *     into the void, and the sidebar opens with an empty input.
 * So `dispatchAskTwin` also parks the prompt in module scope and `Chat`'s mount
 * effect drains it with `takePendingPrompt()`. No timers, and no assumption
 * about Radix mount or effect ordering.
 */
export const ASK_TWIN_EVENT = "ask-twin:seed";

export interface AskTwinDetail {
  readonly prompt: string;
}

/** Parked by dispatch, drained once by whichever Chat mounts next. */
let pendingPrompt: string | null = null;

export function dispatchAskTwin(prompt: string): void {
  // Park first, always. The event is only a wake-up nudge for an already-mounted
  // Chat — the listener drains the parked value rather than reading `detail`, so
  // there is exactly one copy of the prompt and it is consumed exactly once.
  // `detail` is still carried for any future listener that wants it without
  // taking ownership.
  pendingPrompt = prompt;
  const detail: AskTwinDetail = { prompt };
  window.dispatchEvent(new CustomEvent(ASK_TWIN_EVENT, { detail }));
}

/** Read-and-clear, so a parked prompt is never applied twice. */
export function takePendingPrompt(): string | null {
  const prompt = pendingPrompt;
  pendingPrompt = null;
  return prompt;
}

/**
 * Build the seeded question for a decision.
 *
 * IMPORTANT: the wording is load-bearing. Chat runs a client-side gatekeeper
 * (`isQuestionRelevant`) that only lets a question through if it matches a
 * keyword whitelist — "why did", "decide", "options", "trade-off" are all on
 * it. Reword this into something that misses the whitelist and the twin will
 * reject its own suggested prompt.
 *
 * Decision titles are written in the imperative ("Disable Clerk auth inside
 * embedded browsers"), so "decide to <title>" reads as a grammatical question.
 */
export function seedPromptForDecision(title: string): string {
  const lowered = title.charAt(0).toLowerCase() + title.slice(1);
  return `Why did you decide to ${lowered}? Walk me through the options you rejected and the trade-off you accepted.`;
}
