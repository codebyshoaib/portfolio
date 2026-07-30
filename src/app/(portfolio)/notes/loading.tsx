import { IndexBreadcrumb, IndexHeadline, IndexLede } from "./masthead";

/**
 * Same contract as the decisions skeleton: everything above the entries is
 * static so it renders for real, and the grid + sidebar are present so the
 * layout doesn't snap from one column to two when the data lands.
 */
export default function NotesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16">
      <div className="chrome-bar">
        <span>shoaib /notes</span>
        <span className="chrome-right">
          <span>HOME</span>
          <span>DECISIONS</span>
          <span>RSS</span>
          <span>JSON</span>
        </span>
      </div>

      <IndexBreadcrumb />
      <IndexHeadline as="div" />
      <IndexLede />

      <div className="index-grid mt-14" aria-hidden>
        <div className="index-col-main">
          <div className="month-divider">
            <div className="skeleton-bar" style={{ width: "8rem" }} />
            <span className="rule-line" />
            <div className="skeleton-bar" style={{ width: "4rem" }} />
          </div>

          <div className="mt-8 space-y-12">
            {["a", "b", "c"].map((key) => (
              <div key={key} className="skeleton-entry">
                <div>
                  <div
                    className="skeleton-bar"
                    style={{ height: "2.4rem", width: "3.5rem" }}
                  />
                </div>
                <div>
                  <div
                    className="skeleton-bar"
                    style={{ height: "1.6rem", width: "min(100%, 30rem)" }}
                  />
                  <div
                    className="skeleton-bar mt-3"
                    style={{ width: "min(100%, 24rem)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="index-col-sidebar">
          <div className="sidebar-block">
            <p className="sidebar-label">Filter by tag</p>
            <div className="filter-cloud">
              {["4rem", "5.5rem", "4.5rem", "6rem"].map((w) => (
                <div key={w} className="skeleton-bar" style={{ width: w }} />
              ))}
            </div>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Stats</p>
            <div className="space-y-2">
              {["a", "b"].map((k) => (
                <div
                  key={k}
                  className="skeleton-bar"
                  style={{ width: "100%" }}
                />
              ))}
            </div>
          </div>
          <div className="sidebar-block">
            <p className="sidebar-label">Recent</p>
            <div className="space-y-3">
              {["a", "b", "c"].map((k) => (
                <div
                  key={k}
                  className="skeleton-bar"
                  style={{ width: "90%" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only">Loading notes</p>
    </main>
  );
}
