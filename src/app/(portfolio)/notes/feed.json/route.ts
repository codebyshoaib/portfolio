import { defineQuery } from "next-sanity";
import { SITE_URL } from "@/lib/site";
import { sanityFetch } from "@/sanity/lib/live";

export const revalidate = 3600;
export const dynamic = "force-static";

const NOTES_FEED_JSON_QUERY = defineQuery(`
  *[_type == "note" && published == true] | order(date desc)[0...50] {
    "slug": slug.current,
    title,
    date,
    summary,
    tags
  }
`);

interface FeedItem {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly tags: readonly (string | null)[] | null;
}

const SITE = SITE_URL;

export async function GET() {
  const res = await sanityFetch({ query: NOTES_FEED_JSON_QUERY });
  const items = (res.data ?? []) as readonly FeedItem[];

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Notes — Shoaib Ud Din",
    home_page_url: `${SITE}/notes`,
    feed_url: `${SITE}/notes/feed.json`,
    description:
      "Working notes on building software — how something works, what bit me, what I'd do next time.",
    authors: [{ name: "Shoaib Ud Din", url: SITE }],
    language: "en",
    items: items
      .filter((it): it is FeedItem & { slug: string; title: string } =>
        Boolean(it.slug && it.title),
      )
      .map((it) => ({
        id: `${SITE}/notes/${it.slug}`,
        url: `${SITE}/notes/${it.slug}`,
        title: it.title,
        summary: it.summary ?? undefined,
        content_text: it.summary ?? "",
        date_published: it.date ?? undefined,
        tags: (it.tags ?? []).filter((t): t is string => Boolean(t)),
      })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
