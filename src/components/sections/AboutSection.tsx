import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";

const ABOUT_QUERY = defineQuery(`*[_id == "singleton-profile"][0]{
  firstName,
  lastName,
  fullBio,
  yearsOfExperience,
  stats,
  email,
  phone,
  location
}`);

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

      {profile.fullBio && (
        <div className="max-w-[68ch]">
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
        </div>
      )}

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
