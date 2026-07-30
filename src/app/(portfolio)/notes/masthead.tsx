/**
 * The index's masthead copy, shared by the real page and its loading skeleton,
 * for the same reason as the decisions one: any drift between them shows up as
 * a layout jump when the entries land.
 */
export function IndexBreadcrumb() {
  return (
    <p className="breadcrumb mt-10">
      /NOTES <span className="opacity-60">·</span> WORKING NOTES
    </p>
  );
}

/** `as="div"` is for the loading skeleton — see the decisions masthead. */
export function IndexHeadline({
  as: Tag = "h1",
}: {
  readonly as?: "h1" | "div";
}) {
  return (
    <Tag className="editorial-headline mt-5">
      <span>What I learned,</span>
      <span className="accent">before I forget it.</span>
    </Tag>
  );
}

export function IndexLede() {
  return (
    <p className="body-serif mt-7 max-w-prose text-[17px] leading-[1.55] text-foreground/70">
      Things worth writing down that aren&rsquo;t binding on a codebase — how
      something works, what bit me, what I&rsquo;d do next time. No status, no
      rejected alternatives, no revisit trigger. When a note has those, it
      belongs in the{" "}
      <a
        href="/decisions"
        className="underline decoration-foreground/45 underline-offset-4 hover:decoration-foreground"
      >
        decision log
      </a>{" "}
      instead.
    </p>
  );
}
