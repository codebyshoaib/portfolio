/**
 * The index's masthead copy, shared by the real page and its loading skeleton.
 *
 * These three strings were duplicated verbatim across page.tsx and loading.tsx.
 * Since the skeleton's whole job is to be geometrically identical to the page
 * until the entries land, any drift between them shows up as a layout jump —
 * so they get one home rather than a "keep in sync" comment nobody reads.
 */
export function IndexBreadcrumb() {
  return (
    <p className="breadcrumb mt-10">
      /DECISIONS <span className="opacity-60">·</span> CHANGELOG
    </p>
  );
}

/**
 * `as="div"` is for the loading skeleton. A Suspense fallback and its resolved
 * content both land in the streamed HTML, so an <h1> here would put two of them
 * in the response even though only one is ever in the live DOM.
 */
export function IndexHeadline({
  as: Tag = "h1",
}: {
  readonly as?: "h1" | "div";
}) {
  return (
    <Tag className="editorial-headline mt-5">
      <span>What I chose,</span>
      <span className="accent">and the bill it ran up.</span>
    </Tag>
  );
}

export function IndexLede() {
  return (
    <p className="body-serif mt-7 max-w-prose text-[17px] leading-[1.55] text-foreground/70">
      A public log of engineering decisions made under real constraints. Each
      one names the call, the alternatives, the trade I made, and the trigger
      that would force me to revisit. Nothing here is a pattern. All of it is
      contingent.
    </p>
  );
}
