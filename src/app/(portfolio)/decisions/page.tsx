import type { Metadata } from "next";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

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
  *[_type == "decision" && published == true] | order(date asc) {
    "slug": slug.current,
    title,
    date,
    summary,
    status,
    tags
  }
`);

interface ListItem {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly status: string | null;
  readonly tags: readonly (string | null)[] | null;
}

interface NumberedItem extends ListItem {
  readonly adrNumber: number;
}

const MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTH[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
}

function groupByYear(items: readonly NumberedItem[]) {
  const buckets = new Map<string, NumberedItem[]>();
  for (const it of items) {
    const y = it.date?.slice(0, 4) ?? "—";
    const list = buckets.get(y) ?? [];
    list.push(it);
    buckets.set(y, list);
  }
  return [...buckets.entries()].sort(([a], [b]) => b.localeCompare(a));
}

export default async function DecisionsIndexPage() {
  const res = await sanityFetch({ query: DECISIONS_QUERY });
  const ascending = ((res.data ?? []) as readonly ListItem[]).filter(
    (d) => d.slug && d.title,
  );
  // Assign stable ADR numbers in chronological order (oldest = ADR-001)
  const numbered: NumberedItem[] = ascending.map((d, i) => ({
    ...d,
    adrNumber: i + 1,
  }));
  // Display newest first
  const display = [...numbered].reverse();
  const grouped = groupByYear(display);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8 sm:py-24">
      <header className="border-b border-foreground/10 pb-12">
        <p className="mono-meta text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          /decisions · ENGR ADR LOG
        </p>
        <h1 className="display-serif mt-4 text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Engineering
          <br />
          decisions log
        </h1>
        <p className="body-serif mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">
          Every entry is a real engineering decision made under real constraints
          — context, options, trade-offs, and the signal that would force me to
          revisit. Most ADRs live inside companies; this one's public on
          purpose.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 mono-meta text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>
            {ascending.length} {ascending.length === 1 ? "entry" : "entries"} ·{" "}
            {grouped.length} {grouped.length === 1 ? "year" : "years"}
          </span>
          <Link href="/decisions/feed.xml" className="hover:text-foreground">
            RSS →
          </Link>
        </div>
      </header>

      {display.length === 0 ? (
        <p className="body-serif mt-16 italic text-muted-foreground">
          No decisions published yet. Check back soon.
        </p>
      ) : (
        <div className="mt-16 space-y-20">
          {grouped.map(([year, entries]) => (
            <section key={year} className="relative">
              <div className="pointer-events-none absolute -top-6 right-0 select-none year-ribbon">
                {year}
              </div>

              <ol className="space-y-12">
                {entries.map((d) => {
                  const statusVisible = d.status && d.status !== "accepted";
                  return (
                    <li key={d.slug} className="group">
                      <Link href={`/decisions/${d.slug}`} className="block">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mono-meta text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <span>
                            ADR-{String(d.adrNumber).padStart(3, "0")}
                          </span>
                          <span className="text-foreground/40">·</span>
                          <time>{fmtDate(d.date)}</time>
                          {statusVisible ? (
                            <>
                              <span className="text-foreground/40">·</span>
                              <span
                                className="status-pill"
                                data-status={d.status ?? undefined}
                              >
                                {d.status}
                              </span>
                            </>
                          ) : null}
                        </div>
                        <h2 className="display-serif mt-3 text-3xl leading-[1.1] tracking-tight transition-colors group-hover:text-foreground sm:text-[2.25rem]">
                          {d.title}
                        </h2>
                        {d.summary ? (
                          <p className="body-serif mt-3 max-w-prose text-[17px] leading-relaxed text-muted-foreground">
                            {d.summary}
                          </p>
                        ) : null}
                        {d.tags?.length ? (
                          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 mono-meta text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            {d.tags
                              .filter((t): t is string => Boolean(t))
                              .map((t) => (
                                <span key={t}>#{t}</span>
                              ))}
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-32 border-t border-foreground/10 pt-8 mono-meta text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <p>
          Inspired by{" "}
          <a
            href="https://adr.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            adr.github.io
          </a>{" "}
          · authored by Shoaib Ud Din
        </p>
      </footer>
    </main>
  );
}
