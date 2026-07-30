import type { Metadata } from "next";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";
import { IndexBreadcrumb, IndexHeadline, IndexLede } from "./masthead";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Notes — Shoaib Ud Din",
  description:
    "Working notes on building software: how things work, what bit me, what I'd do next time. The stuff that isn't a decision.",
  openGraph: {
    title: "Notes",
    description:
      "Working notes on building software — how things work, what bit me, what I'd do next time.",
    type: "website",
  },
  alternates: {
    canonical: "/notes",
    types: { "application/rss+xml": "/notes/feed.xml" },
  },
};

const NOTES_QUERY = defineQuery(`
  *[_type == "note" && published == true] | order(date desc, _id asc) {
    "slug": slug.current,
    title,
    date,
    summary,
    tags
  }
`);

interface ListItem {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly tags: readonly (string | null)[] | null;
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

function groupByMonth(items: readonly ListItem[]) {
  const buckets = new Map<string, { label: string; entries: ListItem[] }>();
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

function deriveTopic(item: ListItem): string | null {
  const firstTag = (item.tags ?? []).find((t): t is string => Boolean(t));
  return firstTag ? firstTag.toUpperCase() : null;
}

interface PageProps {
  readonly searchParams: Promise<{ readonly tag?: string }>;
}

export default async function NotesIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeTag = sp.tag?.toLowerCase() ?? null;

  const res = await sanityFetch({ query: NOTES_QUERY });
  const notes = ((res.data ?? []) as readonly ListItem[]).filter(
    (n) => n.slug && n.title,
  );

  const filtered = activeTag
    ? notes.filter((n) =>
        (n.tags ?? []).some(
          (t) => typeof t === "string" && t.toLowerCase() === activeTag,
        ),
      )
    : notes;
  const grouped = groupByMonth(filtered);

  const tagSet = new Set<string>();
  for (const n of notes) {
    for (const t of n.tags ?? []) if (t) tagSet.add(t);
  }
  const allTags = [...tagSet].sort();
  // A hand-typed ?tag=foo that matches nothing should still show #all as
  // current rather than leaving every chip unmarked.
  const knownActiveTag =
    activeTag !== null && allTags.some((t) => t.toLowerCase() === activeTag);

  const recentThree = notes.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16">
      {/* Terminal chrome */}
      <div className="chrome-bar">
        <span>shoaib /notes</span>
        <span className="chrome-right">
          <Link href="/decisions">DECISIONS</Link>
          <Link href="/notes/feed.xml">RSS</Link>
          <Link href="/notes/feed.json">JSON</Link>
        </span>
      </div>

      {/* Shared with loading.tsx so the skeleton can't drift out of geometric
          step with the real page. */}
      <IndexBreadcrumb />
      <IndexHeadline />
      <IndexLede />

      <div className="index-grid mt-14">
        {/* ── Main entry column ── */}
        <div className="index-col-main">
          {filtered.length === 0 ? (
            <p className="body-serif mt-16 italic text-foreground/70">
              {activeTag ? (
                <>
                  {`No notes tagged #${activeTag}. `}
                  <Link href="/notes" className="underline underline-offset-4">
                    Show all
                  </Link>
                  .
                </>
              ) : (
                "No notes published yet."
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
                      {g.entries.length === 1 ? "note" : "notes"}
                    </span>
                  </header>

                  <ol className="mt-8 space-y-12">
                    {g.entries.map((n) => {
                      const parsed = parseISO(n.date);
                      const topic = deriveTopic(n);
                      return (
                        <li key={n.slug}>
                          <Link
                            href={`/notes/${n.slug}`}
                            className="entry-card group block"
                            aria-labelledby={`note-${n.slug}-title`}
                          >
                            <div className="entry-gutter">
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
                              {topic ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="domain-tag ml-auto">
                                    {topic}
                                  </span>
                                </div>
                              ) : null}

                              <h3
                                className="entry-title mt-4"
                                id={`note-${n.slug}-title`}
                              >
                                {n.title}
                              </h3>

                              {n.summary ? (
                                <p className="entry-summary mt-3">
                                  {n.summary}
                                </p>
                              ) : null}

                              {n.tags?.length ? (
                                <div className="hashtags mt-4">
                                  {n.tags
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
          {allTags.length ? (
            <div className="sidebar-block">
              <p className="sidebar-label">Filter by tag</p>
              <div className="filter-cloud">
                <Link
                  href="/notes"
                  className="filter-chip filter-label"
                  data-active={activeTag === null || !knownActiveTag}
                >
                  #all
                </Link>
                {allTags.map((t) => (
                  <Link
                    key={t}
                    href={`/notes?tag=${encodeURIComponent(t)}`}
                    className="filter-chip"
                    data-active={activeTag === t.toLowerCase()}
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="sidebar-block sidebar-stats">
            <p className="sidebar-label">Stats</p>
            <dl className="sidebar-stat-list">
              <div>
                <dt>Total</dt>
                <dd>{notes.length}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>{allTags.length}</dd>
              </div>
            </dl>
          </div>

          {recentThree.length > 0 && (
            <div className="sidebar-block">
              <p className="sidebar-label">Recent</p>
              <ol className="sidebar-recent-list">
                {recentThree.map((n) => (
                  <li key={n.slug}>
                    <Link
                      href={`/notes/${n.slug}`}
                      className="sidebar-recent-link"
                    >
                      <span className="sidebar-recent-title">{n.title}</span>
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
          Decisions live at{" "}
          <Link href="/decisions" className="hover:text-foreground">
            /decisions
          </Link>
        </p>
      </footer>
    </main>
  );
}
