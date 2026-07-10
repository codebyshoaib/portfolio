import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";

const SKILLS_QUERY =
  defineQuery(`*[_type == "skill"] | order(category asc, order asc){
  name,
  category,
  proficiency,
  color
}`);

// Normalize category for consistent grouping (server-side)
const normalizeCategory = (category: string | null | undefined): string => {
  if (!category || typeof category !== "string") {
    return "other";
  }
  return (
    category
      .toLowerCase()
      .trim()
      .replace(/[/_]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "other"
  );
};

// Group skills by category on the server side
type SkillData = {
  name: string | null;
  category: string | null;
  proficiency: string | null;
  color: string | null;
};

type GroupedSkillCategory = {
  normalizedCategory: string;
  originalCategory: string;
  skills: SkillData[];
};

function groupSkillsByCategory(skills: SkillData[]): GroupedSkillCategory[] {
  const groups = new Map<
    string,
    {
      originalCategory: string;
      skills: SkillData[];
    }
  >();

  for (const skill of skills) {
    if (!skill) continue;
    const normalizedCategory = normalizeCategory(skill.category);
    const originalCategory = skill.category?.trim() || "Other";

    const existing = groups.get(normalizedCategory);
    if (existing) {
      existing.skills.push(skill);
    } else {
      groups.set(normalizedCategory, {
        originalCategory,
        skills: [skill],
      });
    }
  }

  return Array.from(groups.entries()).map(
    ([normalizedCategory, data]): GroupedSkillCategory => ({
      normalizedCategory,
      originalCategory: data.originalCategory,
      skills: data.skills,
    }),
  );
}

// Proficiency tiers, strongest first — drives ordering and which chips read
// as top-tier. The tier itself is the signal; no percentages, no bars.
const TIER_ORDER: Record<string, number> = {
  expert: 0,
  advanced: 1,
  intermediate: 2,
  beginner: 3,
};

function tierKey(proficiency: string | null): string {
  const k = (proficiency || "").toLowerCase().trim();
  return k in TIER_ORDER ? k : "intermediate";
}

// Prettify a normalized category slug into an editorial label.
function formatCategoryLabel(originalCategory: string): string {
  return originalCategory
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(/\bAi\b/gi, "AI")
    .replace(/\bMl\b/gi, "ML");
}

export async function SkillsSection() {
  const { data: skills } = await sanityFetch({ query: SKILLS_QUERY });

  if (!skills || skills.length === 0) {
    return null;
  }

  const groupedSkills = groupSkillsByCategory(skills);

  return (
    <Section id="skills">
      <SectionHeader
        eyebrow="Skills"
        title="Tools & technologies"
        description="Grouped by discipline, ordered by depth — the strongest work sits first in each set."
      />

      <div className="border-t border-border">
        {groupedSkills.map((categoryData) => {
          const {
            normalizedCategory,
            originalCategory,
            skills: categorySkills,
          } = categoryData;

          if (!categorySkills || categorySkills.length === 0) return null;

          // Strongest skills first within each category.
          const sortedSkills = [...categorySkills].sort(
            (a, b) =>
              TIER_ORDER[tierKey(a.proficiency)] -
              TIER_ORDER[tierKey(b.proficiency)],
          );

          return (
            <div
              key={normalizedCategory}
              className="grid grid-cols-1 gap-4 border-b border-border py-6 md:grid-cols-[16rem_1fr] md:gap-8"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:pt-1">
                {formatCategoryLabel(originalCategory)}
              </div>

              <ul className="flex flex-wrap gap-2">
                {sortedSkills.map((skill, idx) => {
                  const isTopTier = tierKey(skill.proficiency) === "expert";
                  return (
                    <li
                      key={skill.name || `${normalizedCategory}-${idx}`}
                      className={`rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
                        isTopTier
                          ? "border-brand/40 text-brand"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {skill.name || "Unknown"}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
