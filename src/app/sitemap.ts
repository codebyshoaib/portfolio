import type { MetadataRoute } from "next";
import { defineQuery } from "next-sanity";
import { SITE_URL } from "@/lib/site";
import { sanityFetch } from "@/sanity/lib/live";

export const revalidate = 3600;

const SITEMAP_QUERY = defineQuery(`
  {
    "decisions": *[_type == "decision" && published == true] | order(date desc) {
      "slug": slug.current,
      date,
      _updatedAt
    },
    "notes": *[_type == "note" && published == true] | order(date desc) {
      "slug": slug.current,
      date,
      _updatedAt
    }
  }
`);

interface SitemapDoc {
  readonly slug: string | null;
  readonly date: string | null;
  readonly _updatedAt: string | null;
}

interface SitemapData {
  readonly decisions: readonly SitemapDoc[] | null;
  readonly notes: readonly SitemapDoc[] | null;
}

function toEntries(
  docs: readonly SitemapDoc[],
  prefix: string,
): MetadataRoute.Sitemap {
  return docs
    .filter((d): d is SitemapDoc & { slug: string } => Boolean(d.slug))
    .map((d) => ({
      url: `${SITE_URL}${prefix}/${d.slug}`,
      lastModified: new Date(d._updatedAt ?? d.date ?? Date.now()),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await sanityFetch({ query: SITEMAP_QUERY });
  const data = (res.data ?? {}) as Partial<SitemapData>;

  const decisions = toEntries(data.decisions ?? [], "/decisions");
  const notes = toEntries(data.notes ?? [], "/notes");

  // An index is a list, so it changes exactly when its newest entry does. Each
  // index takes its own newest rather than a site-wide one — publishing a note
  // shouldn't tell crawlers the decision log moved.
  const newestDecision = decisions[0]?.lastModified ?? new Date();
  const newestNote = notes[0]?.lastModified ?? new Date();
  const newest = newestDecision > newestNote ? newestDecision : newestNote;

  return [
    {
      url: SITE_URL,
      lastModified: newest,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/decisions`,
      lastModified: newestDecision,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/notes`,
      lastModified: newestNote,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...decisions,
    ...notes,
  ];
}
