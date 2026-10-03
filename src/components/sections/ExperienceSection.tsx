import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { CareerRuler, roleAnchor } from "@/components/sections/CareerRuler";
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

const monthIndex = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
};

/** "1 yr 7 mos" for a finished role, counting both end months. */
function tenure(start: string, end: string) {
  const months = monthIndex(end) - monthIndex(start) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [
    years ? `${years} ${years === 1 ? "yr" : "yrs"}` : "",
    rest ? `${rest} ${rest === 1 ? "mo" : "mos"}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

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

      <CareerRuler
        roles={experiences.map((exp) => ({
          key: `${exp.company}-${exp.position}-${exp.startDate}`,
          company: exp.company ?? "",
          start: exp.startDate ?? "",
          end: exp.endDate,
          current: exp.current,
          logo: exp.companyLogo
            ? urlFor(exp.companyLogo).width(32).fit("max").url()
            : null,
        }))}
      />

      <ol className="divide-y divide-border border-t border-border">
        {experiences.map((exp) => {
          const key = `${exp.company}-${exp.position}-${exp.startDate}`;
          const until = exp.current
            ? "Now"
            : exp.endDate
              ? formatDate(exp.endDate)
              : null;
          const length =
            !exp.current && exp.startDate && exp.endDate
              ? tenure(exp.startDate, exp.endDate)
              : null;
          const details = [
            ...(exp.responsibilities ?? []),
            ...(exp.achievements ?? []),
          ].filter(Boolean);
          // Sanity lists can repeat a technology; show (and key) each once.
          const stack = [
            ...new Set(
              (exp.technologies ?? [])
                .map((t) =>
                  t && typeof t === "object" && "name" in t ? t.name : null,
                )
                .filter((name): name is string => Boolean(name)),
            ),
          ];

          return (
            <li
              key={key}
              id={roleAnchor(key)}
              className="grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)] gap-x-4 py-6 sm:gap-x-5"
            >
              <span className="relative mt-0.5 block size-8 shrink-0 overflow-hidden rounded-[9px] bg-white outline outline-1 -outline-offset-1 outline-foreground/10">
                {exp.companyLogo ? (
                  <Image
                    src={urlFor(exp.companyLogo).width(64).fit("max").url()}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-contain p-0.5"
                  />
                ) : null}
              </span>

              <div className="grid min-w-0 gap-x-6 sm:grid-cols-[minmax(0,1fr)_auto]">
                <h3 className="text-balance font-sans text-base font-medium leading-snug tracking-tight text-foreground">
                  {exp.position}
                </h3>

                <p className="mt-0.5 flex flex-wrap gap-x-2.5 text-[13px] sm:col-start-1">
                  {exp.companyWebsite ? (
                    <Link
                      href={exp.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {exp.company}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">
                      {exp.company}
                    </span>
                  )}
                  {exp.location && (
                    <span className="text-muted-foreground">
                      {exp.location}
                    </span>
                  )}
                  {exp.employmentType && (
                    <span className="text-muted-foreground">
                      {exp.employmentType}
                    </span>
                  )}
                </p>

                <p className="mt-2 flex flex-wrap gap-x-2.5 text-[13px] tabular-nums text-muted-foreground sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:flex-col sm:items-end sm:gap-y-0.5 sm:pt-px">
                  <span className="whitespace-nowrap">
                    {exp.startDate && formatDate(exp.startDate)}
                    {until && <> &ndash; {until}</>}
                  </span>
                  {length && (
                    <span className="whitespace-nowrap text-muted-foreground/70">
                      {length}
                    </span>
                  )}
                </p>

                {(exp.description ||
                  details.length > 0 ||
                  stack.length > 0) && (
                  <div className="mt-3.5 max-w-[68ch] text-sm leading-relaxed text-muted-foreground sm:col-span-2">
                    {exp.description && (
                      <div className="[&_p+p]:mt-2">
                        <PortableText value={exp.description} />
                      </div>
                    )}
                    {details.length > 0 && (
                      <ul
                        className={`space-y-1.5 ${exp.description ? "mt-3" : ""}`}
                      >
                        {details.map((item) => (
                          <li
                            key={item}
                            className="relative pl-4 before:absolute before:top-[0.8em] before:left-0 before:h-px before:w-2 before:bg-muted-foreground/60"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {stack.length > 0 && (
                      <p className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1 text-[13px] text-muted-foreground/70">
                        {stack.map((name) => (
                          <span key={name}>{name}</span>
                        ))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
