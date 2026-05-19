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
    }
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

// Portable Text input is intentionally loose — Sanity returns a mix of
// block and custom-object nodes; we only care about a few discriminated
// fields below.
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

const pt: PortableTextComponents = {
  types: {
    codeBlock: ({
      value,
    }: {
      value: { language?: string; code: string; caption?: string };
    }) => (
      <figure className="my-6">
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed">
          <code data-lang={value.language}>{value.code}</code>
        </pre>
        {value.caption ? (
          <figcaption className="mt-2 text-center font-mono text-xs text-muted-foreground">
            {value.caption}
          </figcaption>
        ) : null}
      </figure>
    ),
  },
  block: {
    h2: ({ children }) => (
      <h2 className="mt-12 scroll-m-20 text-2xl font-semibold tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-border pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="my-4 leading-relaxed">{children}</p>
    ),
  },
  marks: {
    code: ({ children }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.92em]">
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
          className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-4 list-disc space-y-1 pl-6">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
};

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </h2>
      <div className="mt-3 whitespace-pre-line leading-relaxed">{children}</div>
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8 sm:py-24">
      <nav className="mb-10 font-mono text-xs uppercase tracking-[0.18em]">
        <Link
          href="/decisions"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← /decisions
        </Link>
      </nav>

      <header className="border-b border-border pb-10">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <time>{d.date?.slice(0, 10) ?? "—"}</time>
          {d.status ? <span>· status: {d.status}</span> : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {d.title}
        </h1>
        {d.summary ? (
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {d.summary}
          </p>
        ) : null}
        {d.supersededBy?.slug ? (
          <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Superseded by{" "}
            <Link
              href={`/decisions/${d.supersededBy.slug}`}
              className="underline-offset-4 hover:underline"
            >
              {d.supersededBy.title ?? d.supersededBy.slug} →
            </Link>
          </p>
        ) : null}
        {d.tags?.length ? (
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {d.tags
              .filter((t): t is string => Boolean(t))
              .map((t) => (
                <span key={t}>#{t}</span>
              ))}
          </div>
        ) : null}
      </header>

      <div className="mt-12 space-y-10">
        {d.context ? <Field label="Context">{d.context}</Field> : null}

        {d.optionsConsidered?.length ? (
          <section className="border-t border-border pt-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Options considered
            </h2>
            <ol className="mt-3 space-y-4">
              {d.optionsConsidered
                .filter((o): o is { label: string; summary: string | null } =>
                  Boolean(o.label),
                )
                .map((o) => (
                  <li key={o.label} className="leading-relaxed">
                    <strong className="font-medium">{o.label}</strong>
                    {o.summary ? (
                      <span className="ml-2 text-muted-foreground">
                        — {o.summary}
                      </span>
                    ) : null}
                  </li>
                ))}
            </ol>
          </section>
        ) : null}

        {d.decision ? <Field label="Decision">{d.decision}</Field> : null}
        {d.tradeoffs ? (
          <Field label="Trade-offs accepted">{d.tradeoffs}</Field>
        ) : null}
        {d.revisitTrigger ? (
          <Field label="What I'd revisit">{d.revisitTrigger}</Field>
        ) : null}

        {d.takeaways?.length ? (
          <section className="border-t border-border pt-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Takeaways
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {d.takeaways
                .filter((t): t is string => Boolean(t))
                .map((t) => (
                  <li key={t} className="leading-relaxed">
                    {t}
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        {d.body?.length ? (
          <section className="border-t border-border pt-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Full write-up
            </h2>
            <article className="mt-4 text-[15px]">
              <PortableText value={d.body as never} components={pt} />
            </article>
          </section>
        ) : null}

        {d.relatedProjects?.length ? (
          <section className="border-t border-border pt-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Related projects
            </h2>
            <ul className="mt-3 space-y-2">
              {d.relatedProjects
                .filter(
                  (p): p is RelatedProject & { slug: string; title: string } =>
                    Boolean(p.slug && p.title),
                )
                .map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {p.title}
                    </Link>
                    {p.tagline ? (
                      <span className="ml-2 text-muted-foreground">
                        — {p.tagline}
                      </span>
                    ) : null}
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </div>

      <footer className="mt-20 border-t border-border pt-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Link
          href="/decisions"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          ← back to /decisions
        </Link>
      </footer>
    </main>
  );
}
