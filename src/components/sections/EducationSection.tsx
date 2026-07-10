import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";

const EDUCATION_QUERY =
  defineQuery(`*[_type == "education"] | order(endDate desc, startDate desc){
  institution,
  degree,
  fieldOfStudy,
  startDate,
  endDate,
  current,
  gpa,
  description,
  achievements,
  logo,
  website,
  order
}`);

export async function EducationSection() {
  const { data: education } = await sanityFetch({ query: EDUCATION_QUERY });

  if (!education || education.length === 0) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Section id="education">
      <SectionHeader eyebrow="Education" title="Education" />

      <div>
        {education.map((edu) => (
          <div
            key={`${edu.institution}-${edu.degree}-${edu.startDate}`}
            className="grid gap-x-8 gap-y-3 border-t border-border py-8 md:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                {edu.degree}
              </h3>
              <p className="mt-1 flex items-center gap-2 text-brand">
                {edu.website ? (
                  <Link
                    href={edu.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:opacity-80"
                  >
                    {edu.institution}
                    <IconExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  edu.institution
                )}
              </p>
              {edu.fieldOfStudy && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {edu.fieldOfStudy}
                </p>
              )}
              {edu.description && (
                <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                  {edu.description}
                </p>
              )}
              {edu.achievements && edu.achievements.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {edu.achievements.map((achievement, idx) => (
                    <li
                      key={`${edu.institution}-achievement-${idx}`}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span aria-hidden className="text-brand">
                        &#8250;
                      </span>
                      <span className="flex-1">{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums text-muted-foreground md:text-right">
              <span>
                {edu.startDate && formatDate(edu.startDate)} &ndash;{" "}
                {edu.current
                  ? "Present"
                  : edu.endDate
                    ? formatDate(edu.endDate)
                    : "N/A"}
              </span>
              {edu.gpa && (
                <span className="mt-2 block text-brand">GPA {edu.gpa}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
