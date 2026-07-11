import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from "@portabletext/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

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
    "adrNumber": count(*[_type == "decision" && published == true && date <= ^.date])
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

function buildVersion(iso: string | null, adrCount: number | null): string {
  if (!iso) return "v0000.00.0";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "v0000.00.0";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `v${yyyy}.${mm}.${adrCount ?? 1}`;
}

function deriveDomain(d: Decision): string | null {
  if (d.domain) return d.domain.toUpperCase();
  const firstTag = (d.tags ?? []).find((t): t is string => Boolean(t));
  return firstTag ? firstTag.toUpperCase() : null;
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
          <figcaption className="mt-2 text-center mono-meta text-[11px] uppercase tracking-[0.18em] text-foreground/45">
            {value.caption}
          </figcaption>
        ) : null}
      </figure>
    ),
  },
  block: {
    h2: ({ children }) => (
      <h2 className="display-serif mt-12 scroll-m-20 text-2xl font-semibold leading-tight tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="display-serif mt-9 scroll-m-20 text-xl font-semibold leading-tight tracking-tight">
        {children}
      </h3>
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
          className="underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
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

function SectionHeader({
  num,
  label,
}: {
  readonly num: string;
  readonly label: string;
}) {
  return (
    <header className="section-header">
      <span className="section-num">#{num}</span>
      <span>—</span>
      <span className="section-label">{label}</span>
      <span className="section-rule" aria-hidden />
    </header>
  );
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
  const version = buildVersion(d.date, d.adrNumber);
  const domain = deriveDomain(d);

  // Letter-prefix the options (A, B, C, …)
  const options = (d.optionsConsidered ?? [])
    .filter((o): o is { label: string; summary: string | null } =>
      Boolean(o.label),
    )
    .map((o, i) => ({ letter: String.fromCharCode(65 + i), ...o }));

  let sectionIdx = 0;
  const nextNum = () => String(++sectionIdx).padStart(1, "0");

  return (
    <main className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
      {/* Terminal chrome */}
      <div className="chrome-bar">
        <span>
          shoaib
          <span className="opacity-50"> /decisions</span>
        </span>
        <span className="chrome-right">
          <Link href="/decisions/feed.xml">RSS</Link>
          <Link href="/decisions/feed.json">JSON</Link>
          <span>{version}</span>
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
              <span className="mx-2 opacity-40">/</span>
              <span>{adr}</span>
            </>
          ) : null}
        </p>
        <p className="breadcrumb">
          {dateIso}
          {weekday ? (
            <>
              <span className="mx-2 opacity-40">·</span>
              <span>{weekday}</span>
            </>
          ) : null}
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
          </span>
        ) : null}
        {domain ? (
          <span className="domain-tag ml-auto">
            <span className="opacity-60">Domain · </span>
            {domain}
          </span>
        ) : null}
      </div>

      {/* Title + lede */}
      <h1 className="editorial-title mt-6">{d.title}</h1>
      {d.summary ? <p className="editorial-lede mt-7">{d.summary}</p> : null}

      {/* Layout: wide body (2 cols) | sections TOC (1 col) */}
      <div className="tufte-grid mt-14">
        {/* Body */}
        <div className="tufte-body">
          {/* Editorial sections */}
          <article className="space-y-12">
            {d.context ? (
              <section>
                <SectionHeader num={nextNum()} label="Context" />
                <div className="section-body mt-4 whitespace-pre-line">
                  {d.context}
                </div>
              </section>
            ) : null}

            {options.length ? (
              <section>
                <SectionHeader num={nextNum()} label="Options considered" />
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
              </section>
            ) : null}

            {d.decision ? (
              <section>
                <SectionHeader num={nextNum()} label="Decision" />
                <div className="decision-block mt-5 whitespace-pre-line">
                  {d.decision}
                </div>
              </section>
            ) : null}

            {d.tradeoffs ? (
              <section>
                <SectionHeader num={nextNum()} label="Trade-offs" />
                <div className="section-body mt-4 whitespace-pre-line">
                  {d.tradeoffs}
                </div>
              </section>
            ) : null}

            {d.revisitTrigger ? (
              <section>
                <SectionHeader num={nextNum()} label="Revisit trigger" />
                <div className="section-body mt-4 whitespace-pre-line">
                  {d.revisitTrigger}
                </div>
              </section>
            ) : null}

            {d.takeaways?.length ? (
              <section>
                <SectionHeader num={nextNum()} label="Takeaways" />
                <ol className="mt-5 space-y-5">
                  {d.takeaways
                    .filter((t): t is string => Boolean(t))
                    .map((t, i) => (
                      <li key={t} className="flex gap-4">
                        <span className="mono-meta shrink-0 pt-2 text-[11px] uppercase tracking-[0.18em] text-foreground/50">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="section-body">{t}</p>
                      </li>
                    ))}
                </ol>
              </section>
            ) : null}

            {d.body?.length ? (
              <section>
                <SectionHeader num={nextNum()} label="Full write-up" />
                <div className="body-serif mt-4">
                  <PortableText value={d.body as never} components={pt} />
                </div>
              </section>
            ) : null}

            {d.supersededBy?.slug ? (
              <section>
                <SectionHeader num={nextNum()} label="Superseded by" />
                <p className="section-body mt-4">
                  <Link
                    href={`/decisions/${d.supersededBy.slug}`}
                    className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
                  >
                    {d.supersededBy.title ?? "View successor →"}
                  </Link>
                </p>
              </section>
            ) : null}

            {d.relatedProjects?.length ? (
              <section>
                <SectionHeader num={nextNum()} label="Related projects" />
                <ul className="mt-4 space-y-2 section-body">
                  {d.relatedProjects
                    .filter(
                      (
                        p,
                      ): p is {
                        slug: string;
                        title: string;
                        tagline: string;
                      } => Boolean(p.slug && p.title),
                    )
                    .map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/projects/${p.slug}`}
                          className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}
          </article>

          {/* Tags */}
          {tags.length ? (
            <div className="hashtags mt-14">
              {tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          ) : null}

          {/* Footer */}
          <footer className="mt-16 border-t border-foreground/10 pt-6">
            <div className="signed-off-row">
              <span>
                Signed off
                <span className="mx-2 opacity-40">·</span>
                Shoaib
                <span className="mx-2 opacity-40">·</span>
                {dateIso}
              </span>
              <Link
                href={`/decisions/${d.slug}`}
                className="permalink"
                aria-label="Permalink to this decision"
              >
                Permalink
                <span aria-hidden>↗</span>
              </Link>
            </div>
          </footer>
        </div>
        {/* /tufte-body */}

        {/* Right margin: TOC */}
        <nav className="tufte-right" aria-label="Sections">
          <div className="margin-toc">
            <p className="margin-toc-label">Sections</p>
            {d.context ? (
              <a href="#" className="margin-toc-item">
                Context
              </a>
            ) : null}
            {options.length ? (
              <a href="#" className="margin-toc-item">
                Options
              </a>
            ) : null}
            {d.decision ? (
              <a href="#" className="margin-toc-item">
                Decision
              </a>
            ) : null}
            {d.tradeoffs ? (
              <a href="#" className="margin-toc-item">
                Trade-offs
              </a>
            ) : null}
            {d.revisitTrigger ? (
              <a href="#" className="margin-toc-item">
                Revisit trigger
              </a>
            ) : null}
            {d.relatedProjects?.length ? (
              <a href="#" className="margin-toc-item">
                Related
              </a>
            ) : null}
          </div>
        </nav>
      </div>
      {/* /tufte-grid */}
    </main>
  );
}
