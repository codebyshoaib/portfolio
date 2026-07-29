/**
 * The single canonical ordering of the decision log.
 *
 * ADR numbers are positions in this order, so EVERY place that numbers or
 * navigates decisions has to use the same expression — the detail page's
 * `count()`, the index page's array position, and the OG card's `count()`.
 * Three verbatim copies is how they silently disagreed before.
 *
 * `date` is a day-precision Sanity `date` field with no uniqueness rule, and
 * entries are authored as `content/decisions/<date>-<slug>.md`, so two ADRs on
 * one day is entirely plausible. Ordering on `date` alone is therefore not a
 * total order, and the consequences were real:
 *   - `count(date <= ^.date)` returned the SAME number for both same-day docs,
 *     so one ADR number was never rendered;
 *   - the index's array position broke the tie by GROQ's own non-deterministic
 *     order, so a detail page and its index badge could disagree — and flip
 *     between a cached and a fresh response;
 *   - `date < ^.date` meant same-day siblings were never each other's
 *     neighbours, so prev/next skipped one and the ±1 label named the wrong ADR.
 * Adding `_id` as a tie-break makes it a total order and all four go away.
 *
 * NOTE: these are interpolated into `defineQuery` template strings. Sanity
 * typegen only statically analyses literal queries, so it will not emit result
 * types for the queries that use them — every call site already casts its own
 * interface, so nothing depends on generated types here.
 */

/** Sort order for list queries. Must mirror ADR_NUMBER_PROJECTION's comparison. */
export const DECISION_ORDER = "order(date asc, _id asc)";

/** Published-decision filter, shared so the three queries can't drift. */
const PUBLISHED = `_type == "decision" && published == true`;

/**
 * 1-based position of the enclosing document in DECISION_ORDER — i.e. its ADR
 * number. Counts every doc at-or-before self, self included.
 */
export const ADR_NUMBER_PROJECTION = `"adrNumber": count(*[${PUBLISHED} && (date < ^.date || (date == ^.date && _id <= ^._id))])`;

/** Immediate older neighbour: the greatest doc strictly before self. */
export const PREV_DECISION_PROJECTION = `"prev": *[${PUBLISHED} && (date < ^.date || (date == ^.date && _id < ^._id))] | order(date desc, _id desc)[0] {
      "slug": slug.current,
      title
    }`;

/** Immediate newer neighbour: the least doc strictly after self. */
export const NEXT_DECISION_PROJECTION = `"next": *[${PUBLISHED} && (date > ^.date || (date == ^.date && _id > ^._id))] | order(date asc, _id asc)[0] {
      "slug": slug.current,
      title
    }`;
