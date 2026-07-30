import Link from "next/link";

/**
 * A renamed slug is the likely way anyone arrives here, so the 404 keeps the
 * surface's chrome and points back at the index rather than dropping the
 * visitor on the bare framework page.
 */
export default function NoteNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-14 pb-24 md:px-10 md:pt-20">
      <div className="chrome-bar">
        <span>shoaib /notes</span>
        <span className="chrome-right">
          <Link href="/">HOME</Link>
          <Link href="/decisions">DECISIONS</Link>
          <Link href="/notes/feed.xml">RSS</Link>
          <Link href="/notes/feed.json">JSON</Link>
        </span>
      </div>

      <p className="breadcrumb mt-10">/NOTES · NOT FOUND</p>

      <h1 className="editorial-title mt-6">No note at this address.</h1>
      <p className="editorial-lede mt-7">
        It may have been renamed, or never published.
      </p>

      <p className="breadcrumb mt-12">
        <Link href="/notes" className="inline-flex items-center gap-2">
          <span aria-hidden>←</span>
          <span>/NOTES</span>
        </Link>
      </p>
    </main>
  );
}
