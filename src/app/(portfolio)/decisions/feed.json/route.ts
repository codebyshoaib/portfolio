import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

export const revalidate = 3600;
export const dynamic = "force-static";

const FEED_JSON_QUERY = defineQuery(`
  *[_type == "decision" && published == true] | order(date desc)[0...50] {
    "slug": slug.current,
    title,
    date,
    summary,
    status,
    impact,
    domain,
    tags
  }
`);

interface FeedItem {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly status: string | null;
  readonly impact: string | null;
  readonly domain: string | null;
  readonly tags: readonly (string | null)[] | null;
}

const SITE = "https://shoaib-fullstack-dev.vercel.app";

export async function GET() {
  const res = await sanityFetch({ query: FEED_JSON_QUERY });
  const items = (res.data ?? []) as readonly FeedItem[];

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Engineering decisions log — Shoaib Ud Din",
    home_page_url: `${SITE}/decisions`,
    feed_url: `${SITE}/decisions/feed.json`,
    description:
      "Public engineering decisions log — real ADRs from production work. Context, options, trade-offs, and the signal that would force a revisit.",
    authors: [{ name: "Shoaib Ud Din", url: SITE }],
    language: "en",
    items: items
      .filter((it): it is FeedItem & { slug: string; title: string } =>
        Boolean(it.slug && it.title),
      )
      .map((it) => ({
        id: `${SITE}/decisions/${it.slug}`,
        url: `${SITE}/decisions/${it.slug}`,
        title: it.title,
        summary: it.summary ?? undefined,
        content_text: it.summary ?? "",
        date_published: it.date ?? undefined,
        tags: (it.tags ?? []).filter((t): t is string => Boolean(t)),
        _meta: {
          status: it.status ?? "accepted",
          impact: it.impact ?? null,
          domain: it.domain ?? null,
        },
      })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
