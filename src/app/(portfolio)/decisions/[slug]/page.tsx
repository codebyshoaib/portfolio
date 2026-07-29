import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from "@portabletext/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import {
  countAllWords,
  countPortableTextWords,
  readingMinutes,
} from "@/lib/reading-time";
import { SITE_URL } from "@/lib/site";
import {
  ADR_NUMBER_PROJECTION,
  NEXT_DECISION_PROJECTION,
  PREV_DECISION_PROJECTION,
} from "@/sanity/lib/decisionOrder";
import { sanityFetch } from "@/sanity/lib/live";
import { AskTwinButton } from "./AskTwinButton";
import { CopyPermalink } from "./CopyPermalink";
import { MarginToc } from "./MarginToc";

export const revalidate = 3600;

const DECISION_QUERY = defineQuery(`
  *[_type == "decision" && slug.current == $slug && published == true][0] {
    "slug": slug.current,
    title,
    date,
    status,
    impact,
    domain,
    summary,
    context,
    optionsConsidered[] {
      label,
      summary
    },
    decision,
    tradeoffs,
    revisitTrigger,
    takeaways,
    body,
    tags,
    "supersededBy": supersededBy->{
      "slug": slug.current,
      title
    },
    "relatedProjects": relatedProjects[]->{
      "slug": slug.current,
      title,
      tagline
    },
    ${ADR_NUMBER_PROJECTION},
    ${PREV_DECISION_PROJECTION},
    ${NEXT_DECISION_PROJECTION}
  }
`);

interface OptionRow {
  readonly label: string | null;
  readonly summary: string | null;
}

interface RelatedProject {
  readonly slug: string | null;
  readonly title: string | null;
  readonly tagline: string | null;
}

interface SupersededRef {
  readonly slug: string | null;
  readonly title: string | null;
}

/** Adjacent entry in the chronological log. */
interface NeighbourRef {
  readonly slug: string | null;
  readonly title: string | null;
}

type PortableTextValue = readonly Record<string, unknown>[];

interface Decision {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly status: string | null;
  readonly impact: string | null;
  readonly domain: string | null;
  readonly summary: string | null;
  readonly context: string | null;
  readonly optionsConsidered: readonly OptionRow[] | null;
  readonly decision: string | null;
  readonly tradeoffs: string | null;
  readonly revisitTrigger: string | null;
  readonly takeaways: readonly (string | null)[] | null;
  readonly body: PortableTextValue | null;
  readonly tags: readonly (string | null)[] | null;
  readonly supersededBy: SupersededRef | null;
  readonly relatedProjects: readonly RelatedProject[] | null;
  readonly adrNumber: number | null;
  readonly prev: NeighbourRef | null;
  readonly next: NeighbourRef | null;
}

interface PageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await sanityFetch({
    query: DECISION_QUERY,
    params: { slug },
  });
  const d = res.data as Decision | null;
  if (!d?.title) return { title: "Decision not found" };
  return {
    title: `${d.title} — Decisions`,
    description: d.summary ?? undefined,
    openGraph: {
      title: d.title,
      description: d.summary ?? undefined,
      type: "article",
      publishedTime: d.date ?? undefined,
    },
    alternates: { canonical: `/decisions/${d.slug}` },
  };
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoCompact(iso: string | null): {
  readonly iso: string;
  readonly weekday: string;
} {
  if (!iso) return { iso: "—", weekday: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { iso, weekday: "" };
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return {
    iso: `${yyyy}-${mm}-${dd}`,
    weekday: WEEKDAY_SHORT[d.getUTCDay()],
  };
}

function deriveDomain(d: Decision): string | null {
  if (d.domain) return d.domain.toUpperCase();
  const firstTag = (d.tags ?? []).find((t): t is string => Boolean(t));
  return firstTag ? firstTag.toUpperCase() : null;
}

/** Word count over every field that actually renders on the page. */
function countDecisionWords(d: Decision): number {
  return (
    countAllWords([
      d.summary,
      d.context,
      d.decision,
      d.tradeoffs,
      d.revisitTrigger,
    ]) +
    countAllWords(d.takeaways ?? []) +
    countAllWords(
      (d.optionsConsidered ?? []).flatMap((o) => [o.label, o.summary]),
    ) +
    countPortableTextWords(d.body)
  );
}

const pt: PortableTextComponents = {
  types: {
    codeBlock: ({
      value,
    }: {
      value: { language?: string; code: string; caption?: string };
    }) => (
      <figure className="my-8">
        <pre className="overflow-x-auto rounded border border-foreground/10 bg-foreground/[0.03] p-5">
          <code data-lang={value.language}>{value.code}</code>
        </pre>
        {value.caption ? (
          <figcaption className="mt-2 text-center mono-meta text-[11px] uppercase tracking-[0.18em] text-foreground/65">
            {value.caption}
          </figcaption>
        ) : null}
      </figure>
    ),
  },
  block: {
    // The section label is the h2, so authored subheads nest one level down.
    // Portable Text's `h2`/`h3` styles are authoring intent, not literal levels.
    h2: ({ children }) => (
      <h3 className="display-serif mt-12 scroll-m-20 text-2xl font-semibold leading-tight tracking-tight">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="display-serif mt-9 scroll-m-20 text-xl font-semibold leading-tight tracking-tight">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="pull-quote my-7">{children}</blockquote>
    ),
    normal: ({ children }) => (
      <p className="my-4 text-[17px] leading-[1.7]">{children}</p>
    ),
  },
  marks: {
    code: ({ children }) => (
      <code className="mono-meta rounded bg-foreground/[0.06] px-1.5 py-[1px] text-[0.92em]">
        {children}
      </code>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    link: ({
      value,
      children,
    }: PortableTextMarkComponentProps<{ _type: "link"; href?: string }>) => {
      const href = value?.href ?? "#";
      const external = /^https?:/.test(href);
      return (
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="underline decoration-foreground/45 underline-offset-4 transition-colors hover:decoration-foreground"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.7]">
        {children}
      </ul>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
  },
};

/** Screen-reader expansion for the impact badge — "L" alone decodes to nothing. */
const IMPACT_LABEL: Record<string, string> = {
  S: " — small",
  M: " — medium",
  L: " — large",
};

/**
 * One rendered ADR section. `id` is the TOC anchor target; `label` is the real
 * <h2> text, so the TOC and the heading can never disagree (WCAG 2.4).
 */
interface AdrSection {
  readonly id: string;
  readonly label: string;
  readonly body: React.ReactNode;
}

function headingId(id: string) {
  return `${id}-heading`;
}

export default async function DecisionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const res = await sanityFetch({
    query: DECISION_QUERY,
    params: { slug },
  });
  const d = res.data as Decision | null;
  if (!d?.title) notFound();

  const adr = d.adrNumber
    ? `ADR-${String(d.adrNumber).padStart(3, "0")}`
    : null;
  const tags = (d.tags ?? []).filter((t): t is string => Boolean(t));
  const { iso: dateIso, weekday } = isoCompact(d.date);
  const domain = deriveDomain(d);

  // Letter-prefix the options (A, B, C, …)
  const options = (d.optionsConsidered ?? [])
    .filter((o): o is { label: string; summary: string | null } =>
      Boolean(o.label),
    )
    .map((o, i) => ({ letter: String.fromCharCode(65 + i), ...o }));

  const words = countDecisionWords(d);
  const minutes = readingMinutes(words);

  // ONE source for the sections: the article and the TOC are both rendered from
  // this array, so a section can never exist without a TOC entry (or vice
  // versa) and the labels are the same strings by construction.
  const sectionCandidates: readonly (AdrSection | null)[] = [
    d.context
      ? {
          id: "context",
          label: "Context",
          body: (
            <div className="section-body mt-4 whitespace-pre-line">
              {d.context}
            </div>
          ),
        }
      : null,
    options.length > 0
      ? {
          id: "options",
          label: "Options considered",
          body: (
            <ol className="options-list mt-5">
              {options.map((o) => (
                <li key={o.letter} className="option-row">
                  <span className="option-letter">{o.letter}</span>
                  <p className="option-body">
                    <strong className="font-semibold">{o.label}</strong>
                    {o.summary ? (
                      <span className="text-foreground/70">
                        {" — "}
                        {o.summary}
                      </span>
                    ) : null}
                  </p>
                </li>
              ))}
            </ol>
          ),
        }
      : null,
    d.decision
      ? {
          id: "decision",
          label: "Decision",
          body: (
            <div className="decision-block mt-5 whitespace-pre-line">
              {d.decision}
            </div>
          ),
        }
      : null,
    d.tradeoffs
      ? {
          id: "tradeoffs",
          label: "Trade-offs",
          body: (
            <div className="section-body mt-4 whitespace-pre-line">
              {d.tradeoffs}
            </div>
          ),
        }
      : null,
    d.revisitTrigger
      ? {
          id: "revisit",
          label: "Revisit trigger",
          body: (
            <div className="section-body mt-4 whitespace-pre-line">
              {d.revisitTrigger}
            </div>
          ),
        }
      : null,
    (d.takeaways?.length ?? 0) > 0
      ? {
          id: "takeaways",
          label: "Takeaways",
          body: (
            <ol className="mt-5 space-y-5">
              {(d.takeaways ?? [])
                .filter((t): t is string => Boolean(t))
                .map((t, i) => (
                  <li key={t} className="flex gap-4">
                    <span className="mono-meta shrink-0 pt-2 text-[11px] uppercase tracking-[0.18em] text-foreground/65">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="section-body">{t}</p>
                  </li>
                ))}
            </ol>
          ),
        }
      : null,
    (d.body?.length ?? 0) > 0
      ? {
          id: "writeup",
          label: "Full write-up",
          body: (
            <div className="body-serif mt-4">
              <PortableText value={d.body as never} components={pt} />
            </div>
          ),
        }
      : null,
    d.supersededBy?.slug
      ? {
          id: "superseded",
          label: "Superseded by",
          body: (
            <p className="section-body mt-4">
              <Link
                href={`/decisions/${d.supersededBy.slug}`}
                className="underline decoration-foreground/45 underline-offset-4 hover:decoration-foreground"
              >
                {d.supersededBy.title ?? "View successor →"}
              </Link>
            </p>
          ),
        }
      : null,
    (d.relatedProjects?.length ?? 0) > 0
      ? {
          id: "related",
          label: "Related projects",
          body: (
            <ul className="mt-4 space-y-2 section-body">
              {(d.relatedProjects ?? [])
                .filter(
                  (
                    rp,
                  ): rp is RelatedProject & { slug: string; title: string } =>
                    Boolean(rp.slug && rp.title),
                )
                .map((rp) => (
                  <li key={rp.slug}>
                    <Link
                      href={`/projects/${rp.slug}`}
                      className="underline decoration-foreground/45 underline-offset-4 hover:decoration-foreground"
                    >
                      {rp.title}
                    </Link>
                  </li>
                ))}
            </ul>
          ),
        }
      : null,
  ];
  const sections = sectionCandidates.filter(
    (section): section is AdrSection => section !== null,
  );

  // Below 3 entries a sticky TOC reads as broken rather than useful, and with a
  // minimal decision (only title/date/status/summary are schema-required) it
  // would be empty entirely.
  const showToc = sections.length > 2;

  // ADR numbers are positions in DECISION_ORDER and prev/next are the immediate
  // neighbours in that same total order, so ±1 names them exactly. Both sides
  // come from src/sanity/lib/decisionOrder.ts — see the note there about why the
  // _id tie-break is load-bearing.
  const prevAdr = d.adrNumber ? d.adrNumber - 1 : null;
  const nextAdr = d.adrNumber ? d.adrNumber + 1 : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: d.title,
    description: d.summary ?? undefined,
    datePublished: d.date ?? undefined,
    dateModified: d.date ?? undefined,
    wordCount: words,
    keywords: tags.length ? tags.join(", ") : undefined,
    url: `${SITE_URL}/decisions/${d.slug}`,
    author: {
      "@type": "Person",
      name: "Shoaib Ud Din",
      url: SITE_URL,
    },
    publisher: { "@type": "Person", name: "Shoaib Ud Din" },
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16">
      <script
        type="application/ld+json"
        // React escapes text children, which would corrupt the JSON, so the
        // payload goes in raw with `<` escaped — it can never open a tag.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD, no user HTML
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Terminal chrome */}
      <div className="chrome-bar">
        <span>shoaib /decisions</span>
        <span className="chrome-right">
          <Link href="/decisions/feed.xml">RSS</Link>
          <Link href="/decisions/feed.json">JSON</Link>
        </span>
      </div>

      {/* Breadcrumb */}
      <nav className="mt-10 flex items-center justify-between gap-4">
        <p className="breadcrumb">
          <Link href="/decisions" className="inline-flex items-center gap-2">
            <span aria-hidden>←</span>
            <span>/DECISIONS</span>
          </Link>
          {adr ? (
            <>
              <span className="mx-2 opacity-70">/</span>
              <span>{adr}</span>
            </>
          ) : null}
        </p>
        <p className="breadcrumb">
          {dateIso}
          {weekday ? (
            <>
              <span className="mx-2 opacity-70">·</span>
              <span>{weekday}</span>
            </>
          ) : null}
          <span className="mx-2 opacity-70">·</span>
          <span>{minutes} min read</span>
        </p>
      </nav>

      {/* Status row */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span
          className="badge badge--status"
          data-status={d.status ?? "accepted"}
        >
          {(d.status ?? "accepted").toUpperCase()}
        </span>
        {d.impact ? (
          <span className="badge badge--impact" data-impact={d.impact}>
            Impact · {d.impact}
            <span className="sr-only">{IMPACT_LABEL[d.impact] ?? ""}</span>
          </span>
        ) : null}
        {domain ? (
          <span className="domain-tag ml-auto">Domain · {domain}</span>
        ) : null}
      </div>

      {/* Title + lede */}
      <h1 className="editorial-title mt-6">{d.title}</h1>
      {d.summary ? <p className="editorial-lede mt-7">{d.summary}</p> : null}

      {/* Layout: wide body (2 cols) | sections TOC (1 col) */}
      <div className="tufte-grid mt-14">
        {/* Right margin: TOC. Placed before the body in source order so keyboard
            users reach it first; grid-template-areas pins it visually right. */}
        {showToc ? (
          <nav className="tufte-right" aria-labelledby="toc-label">
            <div className="margin-toc">
              <p className="margin-toc-label" id="toc-label">
                Sections
              </p>
              <MarginToc
                items={sections.map(({ id, label }) => ({ id, label }))}
              />
            </div>
          </nav>
        ) : null}

        {/* Body */}
        <div className="tufte-body">
          {/* Editorial sections — rendered from `sections`, see above */}
          <article className="space-y-12">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={headingId(section.id)}
              >
                <header className="section-header">
                  <h2 id={headingId(section.id)} className="section-label">
                    {section.label}
                  </h2>
                  <span className="section-rule" aria-hidden />
                </header>
                {section.body}
              </section>
            ))}
          </article>

          {/* Tags */}
          {tags.length ? (
            <div className="hashtags mt-14">
              {tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          ) : null}

          {/* Hand this decision to the AI twin */}
          <div className="mt-12">
            <AskTwinButton title={d.title} />
          </div>

          {/* Footer */}
          <footer className="mt-16 border-t border-foreground/10 pt-6">
            <div className="signed-off-row">
              <span>
                Signed off
                <span className="mx-2 opacity-70">·</span>
                Shoaib
                <span className="mx-2 opacity-70">·</span>
                {dateIso}
              </span>
              <CopyPermalink url={`${SITE_URL}/decisions/${d.slug}`} />
            </div>

            {d.prev?.slug || d.next?.slug ? (
              <nav className="adr-nav mt-8" aria-label="Adjacent decisions">
                {d.prev?.slug ? (
                  <Link
                    href={`/decisions/${d.prev.slug}`}
                    className="adr-nav-link"
                    data-dir="prev"
                  >
                    <span className="adr-nav-dir">
                      <span aria-hidden>←</span> Older
                      {prevAdr ? (
                        <>
                          <span className="mx-2 opacity-70">·</span>
                          {`ADR-${String(prevAdr).padStart(3, "0")}`}
                        </>
                      ) : null}
                    </span>
                    <span className="adr-nav-title">{d.prev.title}</span>
                  </Link>
                ) : null}
                {d.next?.slug ? (
                  <Link
                    href={`/decisions/${d.next.slug}`}
                    className="adr-nav-link"
                    data-dir="next"
                  >
                    <span className="adr-nav-dir">
                      Newer <span aria-hidden>→</span>
                      {nextAdr ? (
                        <>
                          <span className="mx-2 opacity-70">·</span>
                          {`ADR-${String(nextAdr).padStart(3, "0")}`}
                        </>
                      ) : null}
                    </span>
                    <span className="adr-nav-title">{d.next.title}</span>
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </footer>
        </div>
        {/* /tufte-body */}
      </div>
      {/* /tufte-grid */}
    </main>
  );
}
