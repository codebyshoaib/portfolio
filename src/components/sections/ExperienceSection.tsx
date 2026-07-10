import { PortableText } from "@portabletext/react";
import { IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";

const EXPERIENCE_QUERY =
  defineQuery(`*[_type == "experience"] | order(startDate desc){
  company,
  position,
  employmentType,
  location,
  startDate,
  endDate,
  current,
  description,
  responsibilities,
  achievements,
  technologies[]->{name, category},
  companyLogo,
  companyWebsite
}`);

export async function ExperienceSection() {
  const { data: experiences } = await sanityFetch({ query: EXPERIENCE_QUERY });

  if (!experiences || experiences.length === 0) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Section id="experience">
      <SectionHeader
        eyebrow="Experience"
        title="Work Experience"
        description="A record of the roles, teams, and problems I've worked on."
      />

      <div>
        {experiences.map((exp) => (
          <article
            key={`${exp.company}-${exp.position}-${exp.startDate}`}
            className="grid gap-3 border-t border-border py-8 md:grid-cols-[140px_1fr_auto] md:gap-8"
          >
            {/* Date range + logo — left gutter */}
            <div className="font-mono text-[13px] tabular-nums text-muted-foreground">
              <span>
                {exp.startDate && formatDate(exp.startDate)} &ndash;{" "}
                {exp.current
                  ? "Present"
                  : exp.endDate
                    ? formatDate(exp.endDate)
                    : "N/A"}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold text-foreground">
                {exp.position}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-brand">{exp.company}</span>
                {exp.employmentType && (
                  <>
                    <span aria-hidden className="text-muted-foreground">
                      &middot;
                    </span>
                    <span className="text-muted-foreground">
                      {exp.employmentType}
                    </span>
                  </>
                )}
                {exp.location && (
                  <>
                    <span aria-hidden className="text-muted-foreground">
                      &middot;
                    </span>
                    <span className="text-muted-foreground">
                      {exp.location}
                    </span>
                  </>
                )}
                {exp.companyWebsite && (
                  <Link
                    href={exp.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${exp.company} website`}
                    className="text-muted-foreground hover:text-brand"
                  >
                    <IconExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {exp.description && (
                <div className="mt-3 max-w-[68ch] leading-relaxed text-muted-foreground">
                  <PortableText value={exp.description} />
                </div>
              )}

              {exp.responsibilities && exp.responsibilities.length > 0 && (
                <ul className="mt-3 max-w-[68ch] list-disc list-outside space-y-1 pl-5 leading-relaxed text-muted-foreground">
                  {exp.responsibilities.map((resp, idx) => (
                    <li key={`${exp.company}-resp-${idx}`}>{resp}</li>
                  ))}
                </ul>
              )}

              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="mt-3 max-w-[68ch] list-disc list-outside space-y-1 pl-5 leading-relaxed text-muted-foreground">
                  {exp.achievements.map((achievement, idx) => (
                    <li key={`${exp.company}-achievement-${idx}`}>
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}

              {exp.technologies && exp.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {exp.technologies.map((tech, techIdx) => {
                    const techData =
                      tech && typeof tech === "object" && "name" in tech
                        ? tech
                        : null;
                    return techData?.name ? (
                      <span
                        key={`${exp.company}-tech-${techIdx}`}
                        className="rounded border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {techData.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Company logo — right rail */}
            {exp.companyLogo && (
              <Image
                src={urlFor(exp.companyLogo).width(240).fit("max").url()}
                alt={exp.companyLogo.alt || exp.company || ""}
                width={96}
                height={96}
                className="order-first h-20 w-20 rounded-lg border border-border bg-white object-contain p-2.5 md:order-none md:h-24 md:w-24"
              />
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
