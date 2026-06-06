"use client";

import { useMemo } from "react";

interface Skill {
  name: string | null;
  category: string | null;
  proficiency: string | null;
  color: string | null;
}

interface SkillsChartProps {
  serializedGroupedSkills: string;
}

// Proficiency tiers, strongest first. Drives ordering + visual weight.
const TIER_ORDER: Record<string, number> = {
  expert: 0,
  advanced: 1,
  intermediate: 2,
  beginner: 3,
};

const TIER_LABEL: Record<string, string> = {
  expert: "Expert",
  advanced: "Advanced",
  intermediate: "Intermediate",
  beginner: "Beginner",
};

// Tier styling — expert reads strongest, beginner most muted. No percentages,
// no bars: the tier itself is the signal.
const TIER_STYLE: Record<string, string> = {
  expert: "border-primary/40 bg-primary/10 text-foreground",
  advanced: "border-primary/25 bg-primary/5 text-foreground",
  intermediate: "border-border bg-muted/40 text-muted-foreground",
  beginner: "border-border bg-muted/20 text-muted-foreground",
};

function tierKey(proficiency: string | null): string {
  const k = (proficiency || "").toLowerCase().trim();
  return k in TIER_ORDER ? k : "intermediate";
}

export function SkillsChart({ serializedGroupedSkills }: SkillsChartProps) {
  const groupedSkills = useMemo(() => {
    try {
      return JSON.parse(serializedGroupedSkills) as Array<{
        normalizedCategory: string;
        originalCategory: string;
        skills: Skill[];
      }>;
    } catch (error) {
      console.error("[SkillsChart] Failed to parse grouped skills:", error);
      return [];
    }
  }, [serializedGroupedSkills]);

  if (!groupedSkills || groupedSkills.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {groupedSkills.map((categoryData) => {
        const {
          normalizedCategory,
          originalCategory,
          skills: categorySkills,
        } = categoryData;

        if (!categorySkills || categorySkills.length === 0) return null;

        const displayLabel = originalCategory
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
          .replace(/\bAi\b/gi, "AI")
          .replace(/\bMl\b/gi, "ML");

        // Strongest skills first within each category.
        const sortedSkills = [...categorySkills].sort(
          (a, b) =>
            TIER_ORDER[tierKey(a.proficiency)] -
            TIER_ORDER[tierKey(b.proficiency)],
        );

        return (
          <div
            key={normalizedCategory}
            className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
          >
            {/* Category Header */}
            <div className="border-b bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{displayLabel}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {categorySkills.length}
                </span>
              </div>
            </div>

            {/* Skill chips — name + proficiency tier, no percentages */}
            <div className="p-4 flex flex-wrap gap-2">
              {sortedSkills.map((skill) => {
                const key = tierKey(skill.proficiency);
                return (
                  <span
                    key={skill.name || Math.random().toString()}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${TIER_STYLE[key]}`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: skill.color || "var(--primary)",
                      }}
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      {skill.name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {TIER_LABEL[key]}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
