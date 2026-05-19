import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

export const revalidate = 3600;
export const dynamic = "force-static";

const FEED_QUERY = defineQuery(`
  *[_type == "decision" && published == true] | order(date desc)[0...30] {
    "slug": slug.current,
    title,
    date,
    summary,
    status
  }
`);

interface FeedItem {
  readonly slug: string | null;
  readonly title: string | null;
  readonly date: string | null;
  readonly summary: string | null;
  readonly status: string | null;
}

const SITE = "https://shoaib-fullstack-dev.vercel.app";

const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function toRfc822(dateIso: string): string {
  const d = new Date(dateIso);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const res = await sanityFetch({ query: FEED_QUERY });
  const items = (res.data ?? []) as readonly FeedItem[];

  const now = new Date().toUTCString();
  const channelDescription =
    "Public engineering decisions log — real ADRs from production work. Context, options, trade-offs, and the signal that would force a revisit.";

  const entries = items
    .filter(
      (i): i is FeedItem & { slug: string; title: string; date: string } =>
        Boolean(i.slug && i.title && i.date),
    )
    .map((i) => {
      const url = `${SITE}/decisions/${i.slug}`;
      const description = xmlEscape(i.summary ?? "");
      const statusSuffix =
        i.status && i.status !== "accepted" ? ` [${i.status}]` : "";
      return `    <item>
      <title>${xmlEscape(i.title + statusSuffix)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(i.date)}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shoaib Ud Din — Engineering decisions</title>
    <link>${SITE}/decisions</link>
    <atom:link href="${SITE}/decisions/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${xmlEscape(channelDescription)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
