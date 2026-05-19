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
  *[_type == "decision" && published == true] | order(date desc) {
    "slug": slug.current,
    title,
    date,
    summary,
    status,
    tags
  }
`);

interface DecisionListItem {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly status: string | null;
  readonly tags: readonly (string | null)[] | null;
}

const STATUS_LABEL: Record<string, string> = {
  accepted: "accepted",
  proposed: "proposed",
  deprecated: "deprecated",
  superseded: "superseded",
};

export default async function DecisionsIndexPage() {
  const res = await sanityFetch({ query: DECISIONS_QUERY });
  const decisions = (res.data ?? []) as readonly DecisionListItem[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8 sm:py-24">
      <header className="border-b border-border pb-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          /decisions
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Engineering decisions log
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground">
          Public ADRs. Every entry is a real engineering decision I made under
          real constraints — context, options, trade-offs, and the signal that
          would force me to revisit.
        </p>
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          <Link
            href="/decisions/feed.xml"
            className="underline-offset-4 hover:underline"
          >
            RSS →
          </Link>
        </p>
      </header>

      {decisions.length === 0 ? (
        <p className="mt-16 text-muted-foreground">
          No decisions published yet. Check back soon.
        </p>
      ) : (
        <ol className="mt-12 space-y-10">
          {decisions
            .filter((d) => d.slug && d.title)
            .map((d) => (
              <li
                key={d.slug}
                className="border-l-2 border-border pl-6 transition-colors hover:border-foreground/60"
              >
                <Link href={`/decisions/${d.slug}`} className="group block">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <time className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {d.date?.slice(0, 10) ?? "—"}
                    </time>
                    {d.status && d.status !== "accepted" ? (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        [{STATUS_LABEL[d.status] ?? d.status}]
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-xl font-medium leading-snug tracking-tight transition-colors group-hover:text-foreground sm:text-2xl">
                    {d.title}
                  </h2>
                  {d.summary ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {d.summary}
                    </p>
                  ) : null}
                  {d.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {d.tags
                        .filter((t): t is string => Boolean(t))
                        .map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                          >
                            #{t}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
        </ol>
      )}
    </main>
  );
}
