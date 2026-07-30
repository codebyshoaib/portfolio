import Link from "next/link";

/**
 * A renamed slug is the likely way anyone arrives here, so the 404 keeps the
 * log's chrome and points back at the index rather than dropping the visitor on
 * the bare framework page.
 */
export default function DecisionNotFound() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16">
      <div className="chrome-bar">
        <span>shoaib /decisions</span>
        <span className="chrome-right">
          <Link href="/">HOME</Link>
          <Link href="/notes">NOTES</Link>
          <Link href="/decisions/feed.xml">RSS</Link>
          <Link href="/decisions/feed.json">JSON</Link>
        </span>
      </div>

      <p className="breadcrumb mt-10">/DECISIONS · NOT FOUND</p>

      <h1 className="editorial-title mt-6">No decision at this address.</h1>
      <p className="editorial-lede mt-7">
        It may have been renamed, or never published.
      </p>

      <p className="breadcrumb mt-12">
        <Link href="/decisions" className="inline-flex items-center gap-2">
          <span aria-hidden>←</span>
          <span>/DECISIONS</span>
        </Link>
      </p>
    </main>
  );
}
