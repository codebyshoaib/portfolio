import { defineField, defineType } from "sanity";

export default defineType({
  name: "decision",
  title: "Engineering decisions (ADRs)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Decision title",
      type: "string",
      description:
        "Headline form: 'Why we picked Postgres over DynamoDB for partitioned event logs'",
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      description: "When the decision was made.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description:
        "One- or two-sentence outcome rendered in `cat decisions`. Avoid prose; lead with the verdict.",
      validation: (Rule) => Rule.required().max(280),
    }),
    defineField({
      name: "context",
      title: "Context",
      type: "text",
      rows: 4,
      description: "The constraint that forced the decision.",
    }),
    defineField({
      name: "decision",
      title: "Decision",
      type: "text",
      rows: 4,
      description: "What was actually chosen and why.",
    }),
    defineField({
      name: "consequences",
      title: "Consequences",
      type: "text",
      rows: 4,
      description:
        "What this trade-off costs us, including the explicit escape hatch.",
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", date: "date" },
    prepare({ title, date }) {
      return {
        title,
        subtitle: date
          ? new Date(date as string).toISOString().slice(0, 10)
          : "",
      };
    },
  },
});
