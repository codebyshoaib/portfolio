import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";

interface DecisionCard {
  slug: string | null;
  title: string | null;
  summary: string | null;
  status: string | null;
  impact: string | null;
  domain: string | null;
  tags: (string | null)[] | null;
}

const DECISIONS_QUERY = defineQuery(`
  *[_type == "decision" && published == true] | order(date desc)[0...3]{
    "slug": slug.current,
    title,
    summary,
    status,
    impact,
    domain,
    tags
  }
`);

export async function DecisionsSection() {
  const { data } = await sanityFetch({ query: DECISIONS_QUERY });
  const decisions = (data ?? []) as DecisionCard[];

  if (decisions.length === 0) {
    return null;
  }

  return (
    <Section id="decisions">
      <SectionHeader
        eyebrow="Decisions"
        title="What I chose, and the bill it ran up"
        description="A public log of engineering decisions made under real constraints — the call, the alternatives I rejected, and the trade-off I accepted."
        action={
          <Link
            href="/decisions"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand hover:opacity-80 whitespace-nowrap"
          >
            View all →
          </Link>
        }
      />

      <div className="space-y-5">
        {decisions.map((d) => {
          const domain =
            d.domain?.toUpperCase() ||
            d.tags?.find(Boolean)?.toUpperCase() ||
            null;
          return (
            <Link
              key={d.slug}
              href={`/decisions/${d.slug}`}
              className="group block rounded-[10px] border border-border bg-card p-6 transition-colors hover:border-foreground/25"
            >
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="border border-border rounded px-2 py-0.5">
                  {(d.status ?? "accepted").toUpperCase()}
                </span>
                {d.impact && (
                  <span className="border border-border rounded px-2 py-0.5">
                    Impact · {d.impact}
                  </span>
                )}
                {domain && <span className="ml-auto text-brand">{domain}</span>}
              </div>

              <h3 className="mt-4 font-serif text-lg font-semibold group-hover:text-brand transition-colors">
                {d.title || "Untitled decision"}
              </h3>

              {d.summary && (
                <p className="mt-2 text-muted-foreground leading-relaxed line-clamp-3">
                  {d.summary}
                </p>
              )}

              <span className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-brand">
                Read →
              </span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
