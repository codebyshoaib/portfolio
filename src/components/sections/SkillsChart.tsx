"use client";

import { useMemo } from "react";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Skill {
  name: string | null;
  category: string | null;
  proficiency: string | null;
  percentage: number | null;
  yearsOfExperience: number | null;
  color: string | null;
}

interface SkillsChartProps {
  serializedGroupedSkills: string;
}

export function SkillsChart({ serializedGroupedSkills }: SkillsChartProps) {
  // Parse and memoize grouped skills to prevent re-computation
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

        // Format category for display using original category name
        const displayLabel = originalCategory
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
          .replace(/\bAi\b/gi, "AI")
          .replace(/\bMl\b/gi, "ML");

        // Prepare chart data and config
        const chartData = categorySkills.map((skill) => ({
          name: skill.name || "Unknown",
          proficiency: skill.percentage || 0,
          fill: skill.color || "var(--color-default)",
        }));

        const chartConfig = {
          proficiency: {
            label: "Proficiency",
            color: "hsl(var(--primary))",
          },
          default: {
            color: "hsl(var(--primary))",
          },
        } satisfies ChartConfig;

        // Calculate dynamic height based on number of skills
        const chartHeight = Math.max(140, categorySkills.length * 32);

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

            {/* Chart */}
            <div className="p-4">
              <ChartContainer
                id={`skills-chart-${normalizedCategory}`}
                config={chartConfig}
                className="w-full"
                style={{ height: `${chartHeight}px` }}
              >
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  layout="vertical"
                  margin={{
                    left: 0,
                    right: 28,
                    top: 5,
                    bottom: 5,
                  }}
                >
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={8}
                    axisLine={false}
                    width={85}
                    className="text-xs"
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        nameKey="proficiency"
                        labelFormatter={(value) => value}
                      />
                    }
                  />
                  <Bar dataKey="proficiency" radius={[0, 6, 6, 0]} barSize={18}>
                    <LabelList
                      dataKey="proficiency"
                      position="right"
                      offset={4}
                      className="fill-foreground text-[10px] font-medium"
                      formatter={(value: number) => `${value}%`}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
