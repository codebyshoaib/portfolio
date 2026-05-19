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

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function longDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTH_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
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
          <figcaption className="mt-2 text-center mono-meta text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {value.caption}
          </figcaption>
        ) : null}
      </figure>
    ),
  },
  block: {
    h2: ({ children }) => (
      <h2 className="display-serif mt-14 scroll-m-20 text-3xl leading-tight tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="display-serif mt-10 scroll-m-20 text-2xl leading-tight tracking-tight">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="pull-quote my-8">{children}</blockquote>
    ),
    normal: ({ children }) => (
      <p className="my-5 text-[17px] leading-[1.75]">{children}</p>
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

function MetadataRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  return (
    <div className="border-t border-foreground/10 py-3 first:border-t-0">
      <div className="mono-meta text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground/90">{value}</div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="border-t border-foreground/10 pt-8">
      <h2 className="mono-meta text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </h2>
      <div className="body-serif mt-3 whitespace-pre-line text-[17px] leading-[1.75]">
        {children}
      </div>
    </section>
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-20">
      <nav className="mb-12">
        <Link
          href="/decisions"
          className="mono-meta text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← /decisions
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-[200px_minmax(0,640px)] lg:gap-x-16">
        {/* Marginalia (sticky on lg+) */}
        <aside className="order-2 mt-12 self-start lg:sticky lg:top-24 lg:order-1 lg:mt-0">
          {adr ? (
            <div className="mb-6">
              <div className="display-serif text-4xl leading-none tracking-tight text-foreground/30">
                {adr}
              </div>
            </div>
          ) : null}
          <div>
            <MetadataRow label="Date" value={longDate(d.date)} />
            {d.status ? (
              <MetadataRow
                label="Status"
                value={
                  <span className="status-pill" data-status={d.status}>
                    {d.status}
                  </span>
                }
              />
            ) : null}
            {d.supersededBy?.slug ? (
              <MetadataRow
                label="Superseded by"
                value={
                  <Link
                    href={`/decisions/${d.supersededBy.slug}`}
                    className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
                  >
                    {d.supersededBy.title ?? d.supersededBy.slug}
                  </Link>
                }
              />
            ) : null}
            {tags.length ? (
              <MetadataRow
                label="Tags"
                value={
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mono-meta text-[11px] uppercase tracking-wider text-muted-foreground">
                    {tags.map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </div>
                }
              />
            ) : null}
            {d.relatedProjects?.length ? (
              <MetadataRow
                label="Related projects"
                value={
                  <ul className="space-y-1">
                    {d.relatedProjects
                      .filter(
                        (
                          p,
                        ): p is RelatedProject & {
                          slug: string;
                          title: string;
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
                }
              />
            ) : null}
            <MetadataRow label="Author" value="Shoaib Ud Din" />
          </div>
        </aside>

        {/* Article */}
        <article className="order-1 lg:order-2">
          <header>
            <h1 className="display-serif text-4xl leading-[1.02] tracking-tight sm:text-5xl">
              {d.title}
            </h1>
            {d.summary ? (
              <p className="body-serif lead-paragraph mt-8 text-[20px] leading-[1.6]">
                {d.summary}
              </p>
            ) : null}
          </header>

          <div className="mt-16 space-y-12">
            {d.context ? <Section label="Context">{d.context}</Section> : null}

            {d.optionsConsidered?.length ? (
              <section className="border-t border-foreground/10 pt-8">
                <h2 className="mono-meta text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Options considered
                </h2>
                <ol className="body-serif mt-4 space-y-5 text-[17px] leading-[1.7]">
                  {d.optionsConsidered
                    .filter(
                      (o): o is { label: string; summary: string | null } =>
                        Boolean(o.label),
                    )
                    .map((o) => (
                      <li key={o.label}>
                        <strong className="font-semibold">{o.label}</strong>
                        {o.summary ? (
                          <span className="text-muted-foreground">
                            {" — "}
                            {o.summary}
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ol>
              </section>
            ) : null}

            {d.decision ? (
              <Section label="Decision">{d.decision}</Section>
            ) : null}
            {d.tradeoffs ? (
              <Section label="Trade-offs accepted">{d.tradeoffs}</Section>
            ) : null}
            {d.revisitTrigger ? (
              <Section label="What I'd revisit">{d.revisitTrigger}</Section>
            ) : null}

            {d.takeaways?.length ? (
              <section className="border-t border-foreground/10 pt-8">
                <h2 className="mono-meta text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Takeaways
                </h2>
                <ol className="mt-6 space-y-6">
                  {d.takeaways
                    .filter((t): t is string => Boolean(t))
                    .map((t, i) => (
                      <li key={t} className="flex gap-4">
                        <span className="mono-meta shrink-0 pt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="pull-quote">{t}</p>
                      </li>
                    ))}
                </ol>
              </section>
            ) : null}

            {d.body?.length ? (
              <section className="border-t border-foreground/10 pt-8">
                <h2 className="mono-meta text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Full write-up
                </h2>
                <div className="body-serif mt-4">
                  <PortableText value={d.body as never} components={pt} />
                </div>
              </section>
            ) : null}
          </div>

          <footer className="mt-20 border-t border-foreground/10 pt-8 mono-meta text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <p>
              {adr ? `${adr} · ` : ""}
              {longDate(d.date)} · status: {d.status ?? "accepted"} ·{" "}
              <Link href="/decisions" className="hover:text-foreground">
                ← back to /decisions
              </Link>
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
