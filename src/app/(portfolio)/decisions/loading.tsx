import { IndexBreadcrumb, IndexHeadline, IndexLede } from "./masthead";

/**
 * The route group's loading.tsx is a full-viewport spinner, which throws away
 * every bit of this surface's identity on navigation.
 *
 * Everything above the entries is static, so it renders for real — only the
 * entries appear to load. The `index-grid` wrapper and the sidebar block matter
 * as much as the bars do: without them the layout snaps from one column to two
 * at >=768px the moment data lands.
 */
export default function DecisionsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16">
      <div className="chrome-bar">
        <span>shoaib /decisions</span>
        <span className="chrome-right">
          <span>RSS</span>
          <span>JSON</span>
        </span>
      </div>

      <IndexBreadcrumb />
      <IndexHeadline as="div" />
      <IndexLede />

      <div className="index-grid mt-14" aria-hidden>
        <div className="index-col-main">
          {/* Month divider — the real page always opens with one. */}
          <div className="month-divider">
            <div className="skeleton-bar" style={{ width: "8rem" }} />
            <span className="rule-line" />
            <div className="skeleton-bar" style={{ width: "4rem" }} />
          </div>

          <div className="mt-8 space-y-12">
            {["a", "b", "c"].map((key) => (
              <div key={key} className="skeleton-entry">
                <div>
                  <div className="skeleton-bar" style={{ width: "4rem" }} />
                  <div
                    className="skeleton-bar mt-3"
                    style={{ height: "2.4rem", width: "3.5rem" }}
                  />
                </div>
                <div>
                  <div className="skeleton-bar" style={{ width: "9rem" }} />
                  <div
                    className="skeleton-bar mt-4"
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

        {/* Sidebar — real labels, skeleton values, so the column has its width. */}
        <div className="index-col-sidebar">
          <div className="sidebar-block">
            <p className="sidebar-label">Filter by tag</p>
            <div className="filter-cloud">
              {["4rem", "5.5rem", "4.5rem", "6rem", "3.5rem"].map((w) => (
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

      <p className="sr-only">Loading decisions</p>
    </main>
  );
}
