/**
 * Cal.com booking link.
 *
 * There is deliberately no embed here. The Cal modal embed is broken by Cal's
 * own infrastructure: Cloudflare bot management on app.cal.com challenges every
 * request made from the embedded third-party iframe. Verified 2026-07-31 against
 * the live site over CDP, from inside the embed frame:
 *
 *   GET  https://app.cal.com/api/logo         -> 403, cf-mitigated: challenge
 *   GET  .../app-store/googlevideo/logo.webp  -> 403, cf-mitigated: challenge
 *   POST https://app.cal.com/api/book/event   -> never resolves
 *
 * which is exactly what a visitor sees: broken avatar and app icons, then "Could
 * not book the meeting. Something went wrong while booking." The same URLs in the
 * same browser at top level return 200, and earning cf_clearance by visiting
 * app.cal.com top-level first does NOT fix the framed context — a Cloudflare
 * challenge cannot be solved inside a third-party iframe. No embed config
 * (origin, theme, namespace) can influence this.
 *
 * A top-level navigation passes the challenge normally, so "Book a call" opens
 * the public booking page in a new tab. No embed.js, no snippet dependency.
 */

/** Build the public booking URL for a Cal link (path form, e.g. "user/30min"). */
export function calBookingUrl(calLink: string): string {
  return `https://cal.com/${calLink}`;
}
