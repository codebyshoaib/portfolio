/**
 * The detail route needs its OWN fallback.
 *
 * `decisions/loading.tsx` is a segment-level Suspense boundary, so it wraps this
 * child segment as well — without this file a visitor opening a decision gets
 * the *index* skeleton streamed at them, headline and all, which also puts a
 * second <h1> in the document.
 */
export default function DecisionLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16">
      <div className="chrome-bar">
        <span>shoaib /decisions</span>
        <span className="chrome-right">
          <span>RSS</span>
          <span>JSON</span>
        </span>
      </div>

      <div
        className="mt-10 flex items-center justify-between gap-4"
        aria-hidden
      >
        <div className="skeleton-bar" style={{ width: "10rem" }} />
        <div className="skeleton-bar" style={{ width: "7rem" }} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2" aria-hidden>
        <div className="skeleton-bar" style={{ width: "5.5rem" }} />
        <div className="skeleton-bar" style={{ width: "6rem" }} />
      </div>

      <div className="mt-6 space-y-3" aria-hidden>
        <div
          className="skeleton-bar"
          style={{ height: "2.75rem", width: "min(100%, 34rem)" }}
        />
        <div
          className="skeleton-bar"
          style={{ height: "2.75rem", width: "min(100%, 26rem)" }}
        />
      </div>

      <div className="tufte-grid mt-14">
        <div className="tufte-body space-y-12" aria-hidden>
          {["a", "b", "c"].map((key) => (
            <div key={key}>
              <div className="skeleton-bar" style={{ width: "9rem" }} />
              <div className="mt-4 space-y-2">
                <div className="skeleton-bar" style={{ width: "100%" }} />
                <div className="skeleton-bar" style={{ width: "94%" }} />
                <div className="skeleton-bar" style={{ width: "72%" }} />
              </div>
            </div>
          ))}
        </div>
        <nav className="tufte-right" aria-hidden>
          <div className="margin-toc">
            <p className="margin-toc-label">Sections</p>
            {["a", "b", "c", "d"].map((key) => (
              <div
                key={key}
                className="skeleton-bar"
                style={{ height: "1.35rem", width: "80%" }}
              />
            ))}
          </div>
        </nav>
      </div>

      <p className="sr-only">Loading decision</p>
    </main>
  );
}
