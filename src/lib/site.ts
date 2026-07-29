/**
 * Canonical public origin. Single source of truth for anything that has to emit
 * an absolute URL — sitemap, robots, RSS/JSON feeds, OG tags.
 *
 * Overridable per-environment so preview deploys don't advertise production URLs.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://shoaib-fullstack-dev.vercel.app"
).replace(/\/$/, "");
