import type { Metadata } from "next";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { DECISION_ORDER } from "@/sanity/lib/decisionOrder";
import { sanityFetch } from "@/sanity/lib/live";
import { IndexBreadcrumb, IndexHeadline, IndexLede } from "./masthead";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Engineering decisions log — Shoaib Ud Din",
  description:
    "Public ADRs. Every entry is a real engineering decision made under real constraints — context, options, trade-offs, and what would force me to revisit.",
  openGraph: {
    title: "Engineering decisions log",
    description:
      "Public ADRs. Real engineering decisions, real constraints, real trade-offs.",
    type: "website",
  },
  alternates: {
    canonical: "/decisions",
    types: { "application/rss+xml": "/decisions/feed.xml" },
  },
};

const DECISIONS_QUERY = defineQuery(`
  *[_type == "decision" && published == true] | ${DECISION_ORDER} {
    "slug": slug.current,
    title,
    date,
    summary,
    status,
    impact,
    domain,
    tags
  }
`);

interface ListItem {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly status: string | null;
  readonly impact: string | null;
  readonly domain: string | null;
  readonly tags: readonly (string | null)[] | null;
}

interface NumberedItem extends ListItem {
  readonly adrNumber: number;
}

const MONTH_LONG = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const MONTH_SHORT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/** Screen-reader expansion for the impact badge — "L" alone decodes to nothing. */
const IMPACT_LABEL: Record<string, string> = {
  S: " — small",
  M: " — medium",
  L: " — large",
};

interface ParsedDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function parseISO(iso: string | null): ParsedDate | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
  };
}

function groupByMonth(items: readonly NumberedItem[]) {
  const buckets = new Map<string, { label: string; entries: NumberedItem[] }>();
  for (const it of items) {
    const p = parseISO(it.date);
    if (!p) continue;
    const key = `${p.year}-${String(p.month).padStart(2, "0")}`;
    const label = `${MONTH_LONG[p.month]} ${p.year}`;
    const bucket = buckets.get(key) ?? { label, entries: [] };
    bucket.entries.push(it);
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

function deriveDomain(item: ListItem): string | null {
  if (item.domain) return item.domain.toUpperCase();
  const firstTag = (item.tags ?? []).find((t): t is string => Boolean(t));
  return firstTag ? firstTag.toUpperCase() : null;
}

function buildVersion(latest: ListItem | undefined, count: number): string {
  const p = parseISO(latest?.date ?? null);
  if (!p) return "v0000.00.0";
  return `v${p.year}.${String(p.month + 1).padStart(2, "0")}.${count}`;
}

interface PageProps {
  readonly searchParams: Promise<{ readonly tag?: string }>;
}

export default async function DecisionsIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeTag = sp.tag?.toLowerCase() ?? null;

  const res = await sanityFetch({ query: DECISIONS_QUERY });
  const ascending = ((res.data ?? []) as readonly ListItem[]).filter(
    (d) => d.slug && d.title,
  );
  // ADR number = position in DECISION_ORDER (oldest = ADR-001). The query's sort
  // and the detail page's count() share that order via decisionOrder.ts, so the
  // badge here and the number on the page can't disagree — including for two
  // decisions dated the same day.
  const numbered: NumberedItem[] = ascending.map((d, i) => ({
    ...d,
    adrNumber: i + 1,
  }));
  const newestFirst = [...numbered].reverse();
  const filtered = activeTag
    ? newestFirst.filter((d) =>
        (d.tags ?? []).some(
          (t) => typeof t === "string" && t.toLowerCase() === activeTag,
        ),
      )
    : newestFirst;
  const grouped = groupByMonth(filtered);

  const tagSet = new Set<string>();
  for (const d of numbered) {
    for (const t of d.tags ?? []) if (t) tagSet.add(t);
  }
  const allTags = [...tagSet].sort();
  // A hand-typed ?tag=foo that matches nothing should still show #all as current
  // rather than leaving every chip unmarked.
  const knownActiveTag =
    activeTag !== null && allTags.some((t) => t.toLowerCase() === activeTag);

  const latest = newestFirst[0];
  const version = buildVersion(latest, newestFirst.length);

  const statuses = {
    accepted: numbered.filter((d) => (d.status ?? "accepted") === "accepted")
      .length,
    deprecated: numbered.filter((d) => d.status === "deprecated").length,
    proposed: numbered.filter((d) => d.status === "proposed").length,
  };
  const recentThree = newestFirst.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16">
      {/* Terminal chrome */}
      <div className="chrome-bar">
        <span>shoaib /decisions</span>
        <span className="chrome-right">
          <Link href="/">HOME</Link>
          <Link href="/notes">NOTES</Link>
          <Link href="/decisions/feed.xml">RSS</Link>
          <Link href="/decisions/feed.json">JSON</Link>
          <span>{version}</span>
        </span>
      </div>

      {/* Breadcrumb / headline / lede — shared with loading.tsx so the skeleton
          can't drift out of geometric step with the real page. */}
      <IndexBreadcrumb />
      <IndexHeadline />
      <IndexLede />

      {/* Two-column layout: entries (2/3) + sidebar (1/3) */}
      <div className="index-grid mt-14">
        {/* ── Main entry column ── */}
        <div className="index-col-main">
          {/* Entries */}
          {filtered.length === 0 ? (
            <p className="body-serif mt-16 italic text-foreground/70">
              {activeTag ? (
                <>
                  {`No decisions tagged #${activeTag}. `}
                  <Link
                    href="/decisions"
                    className="underline underline-offset-4"
                  >
                    Show all
                  </Link>
                  .
                </>
              ) : (
                "No decisions published yet."
              )}
            </p>
          ) : (
            <div className="mt-14 space-y-14">
              {grouped.map((g) => (
                <section key={g.label}>
                  <header className="month-divider">
                    <h2 className="month-label">{g.label}</h2>
                    <span className="rule-line" aria-hidden />
                    <span>
                      {g.entries.length}{" "}
                      {g.entries.length === 1 ? "entry" : "entries"}
                    </span>
                  </header>

                  <ol className="mt-8 space-y-12">
                    {g.entries.map((d) => {
                      const parsed = parseISO(d.date);
                      const domain = deriveDomain(d);
                      return (
                        <li key={d.slug}>
                          <Link
                            href={`/decisions/${d.slug}`}
                            className="entry-card group block"
                            aria-labelledby={`adr-${d.adrNumber}-title`}
                          >
                            <div className="entry-gutter">
                              <div className="entry-adr">
                                ADR-{String(d.adrNumber).padStart(3, "0")}
                              </div>
                              <div className="entry-day">
                                {parsed
                                  ? String(parsed.day).padStart(2, "0")
                                  : "—"}
                              </div>
                              <div className="entry-day-mo">
                                {parsed ? MONTH_SHORT[parsed.month] : ""}
                              </div>
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="badge badge--status"
                                  data-status={d.status ?? "accepted"}
                                >
                                  {(d.status ?? "accepted").toUpperCase()}
                                </span>
                                {d.impact ? (
                                  <span
                                    className="badge badge--impact"
                                    data-impact={d.impact}
                                  >
                                    Impact · {d.impact}
                                    <span className="sr-only">
                                      {IMPACT_LABEL[d.impact] ?? ""}
                                    </span>
                                  </span>
                                ) : null}
                                {domain ? (
                                  <span className="domain-tag ml-auto">
                                    {domain}
                                  </span>
                                ) : null}
                              </div>

                              <h3
                                className="entry-title mt-4"
                                id={`adr-${d.adrNumber}-title`}
                              >
                                {d.title}
                              </h3>

                              {d.summary ? (
                                <p className="entry-summary mt-3">
                                  {d.summary}
                                </p>
                              ) : null}

                              {d.tags?.length ? (
                                <div className="hashtags mt-4">
                                  {d.tags
                                    .filter((t): t is string => Boolean(t))
                                    .map((t) => (
                                      <span key={t}>#{t}</span>
                                    ))}
                                </div>
                              ) : null}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="index-col-sidebar">
          {/* Tag filter cloud */}
          {allTags.length ? (
            <div className="sidebar-block">
              <p className="sidebar-label">Filter by tag</p>
              <div className="filter-cloud">
                <Link
                  href="/decisions"
                  className="filter-chip filter-label"
                  data-active={activeTag === null || !knownActiveTag}
                >
                  #all
                </Link>
                {allTags.map((t) => (
                  <Link
                    key={t}
                    href={`/decisions?tag=${encodeURIComponent(t)}`}
                    className="filter-chip"
                    data-active={activeTag === t.toLowerCase()}
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Stats */}
          <div className="sidebar-block sidebar-stats">
            <p className="sidebar-label">Stats</p>
            <dl className="sidebar-stat-list">
              <div>
                <dt>Total</dt>
                <dd>{numbered.length}</dd>
              </div>
              {statuses.accepted > 0 && (
                <div>
                  <dt>Accepted</dt>
                  <dd>{statuses.accepted}</dd>
                </div>
              )}
              {statuses.deprecated > 0 && (
                <div>
                  <dt>Deprecated</dt>
                  <dd>{statuses.deprecated}</dd>
                </div>
              )}
              {statuses.proposed > 0 && (
                <div>
                  <dt>Proposed</dt>
                  <dd>{statuses.proposed}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Impact legend — the badges say "S"/"M"/"L" and nothing else does */}
          <div className="sidebar-block">
            <p className="sidebar-label">Impact</p>
            <dl className="sidebar-stat-list">
              <div>
                <dt>S</dt>
                <dd>Small</dd>
              </div>
              <div>
                <dt>M</dt>
                <dd>Medium</dd>
              </div>
              <div>
                <dt>L</dt>
                <dd>Large</dd>
              </div>
            </dl>
          </div>

          {/* Recent */}
          {recentThree.length > 0 && (
            <div className="sidebar-block">
              <p className="sidebar-label">Recent</p>
              <ol className="sidebar-recent-list">
                {recentThree.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/decisions/${d.slug}`}
                      className="sidebar-recent-link"
                    >
                      <span className="sidebar-recent-adr">
                        ADR-{String(d.adrNumber).padStart(3, "0")}
                      </span>
                      <span className="sidebar-recent-title">{d.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>

      <footer className="mt-24 border-t border-foreground/10 pt-8 mono-meta text-[11px] uppercase tracking-[0.18em] text-foreground/65">
        <p>
          Inspired by{" "}
          <a
            href="https://adr.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            adr.github.io
          </a>
        </p>
      </footer>
    </main>
  );
}
