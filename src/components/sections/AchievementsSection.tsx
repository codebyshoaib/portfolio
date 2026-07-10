import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";

const ACHIEVEMENTS_QUERY =
  defineQuery(`*[_type == "achievement"] | order(date desc){
  title,
  type,
  issuer,
  date,
  description,
  image,
  url,
  featured,
  order
}`);

export async function AchievementsSection() {
  const { data: achievements } = await sanityFetch({
    query: ACHIEVEMENTS_QUERY,
  });

  if (!achievements || achievements.length === 0) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getTypeLabel = (type: string | null | undefined) => {
    if (!type) return "Achievement";
    const labels: Record<string, string> = {
      award: "Award",
      hackathon: "Hackathon Win",
      publication: "Publication",
      speaking: "Speaking",
      "open-source": "Open Source",
      milestone: "Milestone",
      recognition: "Recognition",
      other: "Other",
    };
    return labels[type] || "Achievement";
  };

  // Featured achievements lead the list; the rest follow in date order.
  const ordered = [
    ...achievements.filter((a) => a.featured),
    ...achievements.filter((a) => !a.featured),
  ];

  return (
    <Section id="achievements">
      <SectionHeader eyebrow="Achievements" title="Milestones & recognitions" />

      <div className="grid gap-4 md:grid-cols-2">
        {ordered.map((achievement) => (
          <div
            key={`${achievement.title}-${achievement.date}`}
            className="flex flex-col rounded-[10px] border border-border bg-card p-5 transition-colors hover:border-foreground/25"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {getTypeLabel(achievement.type)}
              {achievement.date && (
                <>
                  <span aria-hidden className="mx-2">
                    &middot;
                  </span>
                  {formatDate(achievement.date)}
                </>
              )}
            </div>

            <h3 className="mt-3 font-serif text-base font-semibold text-foreground">
              {achievement.title}
            </h3>

            {achievement.issuer && (
              <p className="mt-1 text-sm text-brand">{achievement.issuer}</p>
            )}

            {achievement.description && (
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {achievement.description}
              </p>
            )}

            {achievement.url && (
              <Link
                href={achievement.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand hover:opacity-80"
              >
                Learn more
                <IconExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
