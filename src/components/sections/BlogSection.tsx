import Image from "next/image";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";

const BLOG_QUERY = defineQuery(`*[_type == "blog"] | order(publishedAt desc){
  title,
  slug,
  excerpt,
  category,
  tags,
  publishedAt,
  readTime,
  featuredImage
}`);

export async function BlogSection() {
  const { data: posts } = await sanityFetch({
    query: BLOG_QUERY,
  });

  if (!posts || posts.length === 0) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Section id="blog">
      <SectionHeader
        eyebrow="Writing"
        title="Latest Writing"
        description="Thoughts, tutorials, and insights on what I'm building and learning."
      />

      <div>
        {posts.map((post) => (
          <article
            key={post.slug?.current}
            className="group grid gap-3 border-t border-border py-8 md:grid-cols-[140px_1fr] md:gap-8"
          >
            {/* Date — mono, tabular */}
            <div className="font-mono text-[13px] tabular-nums text-muted-foreground">
              {post.publishedAt && formatDate(post.publishedAt)}
              {post.readTime && (
                <span className="block mt-1">{post.readTime} min read</span>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0">
              {post.category && (
                <span className="mb-2 inline-block rounded border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {post.category}
                </span>
              )}

              <h3 className="font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-brand">
                <Link href="https://www.linkedin.com/in/shoaibbb/">
                  {post.title}
                </Link>
              </h3>

              {post.featuredImage && (
                <div className="relative mt-3 aspect-video max-w-md overflow-hidden rounded-[10px] border border-border bg-card">
                  <Image
                    src={urlFor(post.featuredImage)
                      .width(600)
                      .height(400)
                      .url()}
                    alt={post.title || "Blog post"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {post.excerpt && (
                <p className="mt-3 max-w-[68ch] leading-relaxed text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={`${post.slug?.current}-${tag}`}
                      className="rounded border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href="https://www.linkedin.com/in/shoaibbb/"
                className="mt-4 inline-flex items-center text-sm font-medium text-brand hover:underline"
              >
                Read more &rarr;
              </Link>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
