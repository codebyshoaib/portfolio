import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";

const ABOUT_QUERY = defineQuery(`*[_id == "singleton-profile"][0]{
  firstName,
  lastName,
  fullBio,
  quote,
  quoteContext,
  yearsOfExperience,
  stats,
  email,
  phone,
  location
}`);

// Shown until a quote is set in Studio — the approved positioning line.
const FALLBACK_QUOTE =
  "I care most about the parts that don't show up in a demo: the data models, the failure modes, and the trade-offs I chose on purpose.";

export async function AboutSection() {
  const { data: profile } = await sanityFetch({ query: ABOUT_QUERY });

  if (!profile) {
    return null;
  }

  return (
    <Section id="about">
      <SectionHeader
        eyebrow="About"
        title="About"
        description="Get to know me better"
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
        <div className="max-w-[68ch]">
          {profile.fullBio && (
            <PortableText
              value={profile.fullBio}
              components={{
                block: {
                  normal: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-muted-foreground">
                      {children}
                    </p>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-8 mb-4 font-serif text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-6 mb-3 font-serif text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-6 border-l-2 border-brand pl-4 font-serif italic text-foreground">
                      {children}
                    </blockquote>
                  ),
                },
                marks: {
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  link: ({ children, value }) => {
                    const href = value?.href || "";
                    const isExternal = href.startsWith("http");
                    return (
                      <Link
                        href={href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="text-brand hover:opacity-80"
                      >
                        {children}
                      </Link>
                    );
                  },
                },
                list: {
                  bullet: ({ children }) => (
                    <ul className="mb-4 list-disc list-outside space-y-2 pl-5 text-muted-foreground">
                      {children}
                    </ul>
                  ),
                  number: ({ children }) => (
                    <ol className="mb-4 list-decimal list-outside space-y-2 pl-5 text-muted-foreground">
                      {children}
                    </ol>
                  ),
                },
              }}
            />
          )}
        </div>

        {/* Marginal pull-quote — fills the gutter, echoes the /decisions marginalia */}
        <aside className="self-start border-t border-border pt-8 lg:sticky lg:top-24 lg:border-t-0 lg:pt-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {profile.quoteContext || "In practice"}
          </p>
          <span
            aria-hidden="true"
            className="mt-1 block font-serif text-5xl leading-none text-brand/40"
          >
            &ldquo;
          </span>
          <blockquote className="mt-1 text-balance font-serif text-xl md:text-2xl italic leading-snug text-foreground">
            {profile.quote || FALLBACK_QUOTE}
          </blockquote>
        </aside>
      </div>

      {/* Stats from CMS */}
      {profile.stats && profile.stats.length > 0 && (
        <div className="@container mt-10 border-t border-border pt-10">
          <div className="grid grid-cols-2 @lg:grid-cols-4 gap-8">
            {profile.stats
              .filter((stat) => stat.label && stat.value)
              .map((stat, idx) => (
                <div key={`${stat.label}-${idx}`} className="@container/stat">
                  <div className="font-serif text-3xl @md/stat:text-4xl font-semibold tracking-tight text-brand">
                    {stat.value}
                  </div>
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </Section>
  );
}
