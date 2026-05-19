import { defineField, defineType } from "sanity";

export default defineType({
  name: "now",
  title: "Now page (monthly focus)",
  type: "document",
  description:
    "Singleton. One entry per month describing current focus, inspired by nownownow.com.",
  fields: [
    defineField({
      name: "month",
      title: "Month",
      type: "date",
      description:
        "Pick any day in the month — only the year + month is shown in the UI.",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "items",
      title: "Bullets",
      type: "array",
      description: "Short bullet points. 3–6 entries reads best.",
      of: [{ type: "string", validation: (Rule) => Rule.max(160) }],
      validation: (Rule) => Rule.required().min(1).max(8),
    }),
    defineField({
      name: "reading",
      title: "Reading",
      type: "string",
      description: "Books, blogs, or papers in heavy rotation right now.",
    }),
  ],
  preview: {
    select: { month: "month", items: "items" },
    prepare({ month, items }) {
      const ym = month
        ? new Date(month as string).toISOString().slice(0, 7)
        : "—";
      return {
        title: `Now · ${ym}`,
        subtitle: ((items as string[]) ?? []).slice(0, 1).join(" · "),
      };
    },
  },
});
