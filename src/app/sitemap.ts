import type { MetadataRoute } from "next";
import { defineQuery } from "next-sanity";
import { SITE_URL } from "@/lib/site";
import { sanityFetch } from "@/sanity/lib/live";

export const revalidate = 3600;

const SITEMAP_QUERY = defineQuery(`
  *[_type == "decision" && published == true] | order(date desc) {
    "slug": slug.current,
    date,
    _updatedAt
  }
`);

interface SitemapDecision {
  readonly slug: string | null;
  readonly date: string | null;
  readonly _updatedAt: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await sanityFetch({ query: SITEMAP_QUERY });
  const decisions = (res.data ?? []) as readonly SitemapDecision[];

  const entries = decisions
    .filter((d): d is SitemapDecision & { slug: string } => Boolean(d.slug))
    .map((d) => ({
      url: `${SITE_URL}/decisions/${d.slug}`,
      lastModified: new Date(d._updatedAt ?? d.date ?? Date.now()),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));

  // Newest decision doubles as the index's lastModified — the index is a list,
  // so it changes exactly when its newest entry does.
  const newest = entries[0]?.lastModified ?? new Date();

  return [
    {
      url: SITE_URL,
      lastModified: newest,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/decisions`,
      lastModified: newest,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...entries,
  ];
}
