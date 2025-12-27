import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";
import { SkillsChart } from "./SkillsChart";

const SKILLS_QUERY =
  defineQuery(`*[_type == "skill"] | order(category asc, order asc){
  name,
  category,
  proficiency,
  percentage,
  yearsOfExperience,
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
      .replace(/[\/_]/g, "-")
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
  percentage: number | null;
  yearsOfExperience: number | null;
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
    })
  );
}

export async function SkillsSection() {
  const { data: skills } = await sanityFetch({ query: SKILLS_QUERY });

  if (!skills || skills.length === 0) {
    return null;
  }

  // Group skills on the server side and serialize to prevent visual editing interference
  const groupedSkills = groupSkillsByCategory(skills);
  const serializedGroupedSkills = JSON.stringify(groupedSkills);

  return (
    <section id="skills" className="py-20 px-6 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Skills & Expertise
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive overview of my technical proficiencies and tools I
            work with daily
          </p>
        </div>

        <SkillsChart serializedGroupedSkills={serializedGroupedSkills} />
      </div>
    </section>
  );
}
