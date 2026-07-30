import { PortableText } from "@portabletext/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import { CopyPermalink } from "@/components/CopyPermalink";
import { portableTextComponents } from "@/components/PortableTextBody";
import {
  countAllWords,
  countPortableTextWords,
  readingMinutes,
} from "@/lib/reading-time";
import { SITE_URL } from "@/lib/site";
import { sanityFetch } from "@/sanity/lib/live";

export const revalidate = 3600;

/**
 * Neighbours in the index's total order: date desc, then _id asc as the
 * tie-break. Both halves of the pair have to encode that same order or two
 * notes filed on one day give you a "newer" link that points backwards.
 */
const NOTE_QUERY = defineQuery(`
  *[_type == "note" && slug.current == $slug && published == true][0] {
    "slug": slug.current,
    title,
    date,
    summary,
    body,
    tags,
    "newer": *[
      _type == "note" && published == true &&
      (date > ^.date || (date == ^.date && _id < ^._id))
    ] | order(date asc, _id desc)[0] { "slug": slug.current, title },
    "older": *[
      _type == "note" && published == true &&
      (date < ^.date || (date == ^.date && _id > ^._id))
    ] | order(date desc, _id asc)[0] { "slug": slug.current, title }
  }
`);

type PortableTextValue = readonly Record<string, unknown>[];

interface NeighbourRef {
  readonly slug: string | null;
  readonly title: string | null;
}

interface Note {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly body: PortableTextValue | null;
  readonly tags: readonly (string | null)[] | null;
  readonly newer: NeighbourRef | null;
  readonly older: NeighbourRef | null;
}

interface PageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await sanityFetch({ query: NOTE_QUERY, params: { slug } });
  const n = res.data as Note | null;
  if (!n?.title) return { title: "Note not found" };
  return {
    title: `${n.title} — Notes`,
    description: n.summary ?? undefined,
    openGraph: {
      title: n.title,
      description: n.summary ?? undefined,
      type: "article",
      publishedTime: n.date ?? undefined,
    },
    alternates: { canonical: `/notes/${n.slug}` },
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

export default async function NoteDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const res = await sanityFetch({ query: NOTE_QUERY, params: { slug } });
  const n = res.data as Note | null;
  if (!n?.title) notFound();

  const tags = (n.tags ?? []).filter((t): t is string => Boolean(t));
  const { iso: dateIso, weekday } = isoCompact(n.date);
  const topic = tags[0]?.toUpperCase() ?? null;

  const words =
    countAllWords([n.summary]) + countPortableTextWords(n.body ?? null);
  const minutes = readingMinutes(words);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: n.title,
    description: n.summary ?? undefined,
    datePublished: n.date ?? undefined,
    dateModified: n.date ?? undefined,
    wordCount: words,
    keywords: tags.length ? tags.join(", ") : undefined,
    url: `${SITE_URL}/notes/${n.slug}`,
    author: { "@type": "Person", name: "Shoaib Ud Din", url: SITE_URL },
    publisher: { "@type": "Person", name: "Shoaib Ud Din" },
  };

  return (
    // max-w-3xl, not the decisions page's max-w-6xl: that width exists to hold
    // the section TOC in the right margin, and a note has no sections to index.
    // Keeping it here left the reading measure hugging the left edge with a
    // third of the page empty.
    <main className="mx-auto max-w-3xl px-6 pt-14 pb-24 md:px-10 md:pt-20">
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
        <span>shoaib /notes</span>
        <span className="chrome-right">
          <Link href="/">HOME</Link>
          <Link href="/decisions">DECISIONS</Link>
          <Link href="/notes/feed.xml">RSS</Link>
          <Link href="/notes/feed.json">JSON</Link>
        </span>
      </div>

      {/* Breadcrumb */}
      <nav className="mt-10 flex items-center justify-between gap-4">
        <p className="breadcrumb">
          <Link href="/notes" className="inline-flex items-center gap-2">
            <span aria-hidden>←</span>
            <span>/NOTES</span>
          </Link>
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

      {topic ? (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="domain-tag">{topic}</span>
        </div>
      ) : null}

      {/* Title + lede */}
      <h1 className="editorial-title mt-6">{n.title}</h1>
      {n.summary ? <p className="editorial-lede mt-7">{n.summary}</p> : null}

      <div className="mt-14">
        <article className="body-serif">
          <PortableText
            value={(n.body ?? []) as never}
            components={portableTextComponents}
          />
        </article>

        {tags.length ? (
          <div className="hashtags mt-14">
            {tags.map((t) => (
              <Link key={t} href={`/notes?tag=${encodeURIComponent(t)}`}>
                #{t}
              </Link>
            ))}
          </div>
        ) : null}

        <footer className="mt-16 border-t border-foreground/10 pt-6">
          <div className="signed-off-row">
            <span>
              Shoaib
              <span className="mx-2 opacity-70">·</span>
              {dateIso}
            </span>
            <CopyPermalink url={`${SITE_URL}/notes/${n.slug}`} subject="note" />
          </div>

          {n.older?.slug || n.newer?.slug ? (
            <nav className="adr-nav mt-8" aria-label="Adjacent notes">
              {n.older?.slug ? (
                <Link
                  href={`/notes/${n.older.slug}`}
                  className="adr-nav-link"
                  data-dir="prev"
                >
                  <span className="adr-nav-dir">
                    <span aria-hidden>←</span> Older
                  </span>
                  <span className="adr-nav-title">{n.older.title}</span>
                </Link>
              ) : null}
              {n.newer?.slug ? (
                <Link
                  href={`/notes/${n.newer.slug}`}
                  className="adr-nav-link"
                  data-dir="next"
                >
                  <span className="adr-nav-dir">
                    Newer <span aria-hidden>→</span>
                  </span>
                  <span className="adr-nav-title">{n.newer.title}</span>
                </Link>
              ) : null}
            </nav>
          ) : null}
        </footer>
      </div>
    </main>
  );
}
