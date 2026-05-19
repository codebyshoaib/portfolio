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
        "Headline form: 'Why we picked Postgres over DynamoDB for partitioned event logs'.",
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
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Proposed", value: "proposed" },
          { title: "Accepted", value: "accepted" },
          { title: "Deprecated", value: "deprecated" },
          { title: "Superseded", value: "superseded" },
        ],
        layout: "radio",
      },
      initialValue: "accepted",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "impact",
      title: "Impact",
      type: "string",
      description:
        "Optional. Visual chip on the index/detail page. S = local fix; M = team-wide; L = product-wide / incident-driven.",
      options: {
        list: [
          { title: "S — small", value: "S" },
          { title: "M — medium", value: "M" },
          { title: "L — large", value: "L" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "domain",
      title: "Domain",
      type: "string",
      description:
        "Optional. One-word area badge shown next to the entry (e.g. MOBILE, FRONTEND, AUTH). Falls back to the first tag, uppercased.",
    }),
    defineField({
      name: "supersededBy",
      title: "Superseded by",
      type: "reference",
      to: [{ type: "decision" }],
      description:
        "If this decision was overturned, link to the decision that replaced it.",
      hidden: ({ document }) => document?.status !== "superseded",
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description:
        "One- or two-sentence outcome rendered in `cat decisions` and on the index page. Lead with the verdict, not the prose.",
      validation: (Rule) => Rule.required().max(320),
    }),
    defineField({
      name: "context",
      title: "Context",
      type: "text",
      rows: 5,
      description:
        "The constraint that forced the decision: numbers, signal, what we'd already tried.",
    }),
    defineField({
      name: "optionsConsidered",
      title: "Options considered",
      type: "array",
      description: "Each option we evaluated before landing on the decision.",
      of: [
        {
          type: "object",
          name: "option",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required().max(120),
            }),
            defineField({
              name: "summary",
              title: "Why we rejected (or accepted) it",
              type: "text",
              rows: 2,
              validation: (Rule) => Rule.max(400),
            }),
          ],
          preview: { select: { title: "label", subtitle: "summary" } },
        },
      ],
    }),
    defineField({
      name: "decision",
      title: "Decision",
      type: "text",
      rows: 4,
      description: "What was actually chosen and why.",
    }),
    defineField({
      name: "tradeoffs",
      title: "Trade-offs accepted",
      type: "text",
      rows: 3,
      description: "The cost we explicitly took on. Be honest.",
    }),
    defineField({
      name: "revisitTrigger",
      title: "What we'd revisit",
      type: "text",
      rows: 3,
      description:
        "The signal that would force us to reopen this — '10x write volume', 'Capacitor patches the bridge', etc.",
    }),
    defineField({
      name: "takeaways",
      title: "Takeaways",
      type: "array",
      description: "Short, durable lessons. Each takeaway is one sentence.",
      of: [{ type: "string", validation: (Rule) => Rule.max(280) }],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: "body",
      title: "Full write-up",
      type: "array",
      description:
        "Long-form narrative. Portable Text supports headings, lists, code blocks, links.",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" },
            ],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    type: "url",
                    validation: (Rule) =>
                      Rule.uri({ scheme: ["http", "https", "mailto"] }),
                  }),
                ],
              },
            ],
          },
        },
        {
          type: "object",
          name: "codeBlock",
          title: "Code block",
          fields: [
            defineField({
              name: "language",
              title: "Language",
              type: "string",
              options: {
                list: [
                  "ts",
                  "tsx",
                  "js",
                  "jsx",
                  "go",
                  "rust",
                  "py",
                  "sh",
                  "sql",
                  "json",
                  "yaml",
                  "java",
                  "kotlin",
                  "swift",
                  "text",
                ],
              },
              initialValue: "ts",
            }),
            defineField({
              name: "code",
              title: "Code",
              type: "text",
              rows: 12,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "language", subtitle: "caption" },
          },
        },
      ],
    }),
    defineField({
      name: "relatedProjects",
      title: "Related projects",
      type: "array",
      of: [{ type: "reference", to: [{ type: "project" }] }],
      description: "Link this decision to the projects it touched.",
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Free-form tags: 'mobile', 'capacitor', 'postgres', etc.",
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: true,
      description: "Unpublished entries are hidden from the public site.",
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
    {
      title: "Status",
      name: "status",
      by: [{ field: "status", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", date: "date", status: "status" },
    prepare({ title, date, status }) {
      const d = date
        ? new Date(date as string).toISOString().slice(0, 10)
        : "—";
      return {
        title,
        subtitle: `${d} · ${status ?? "accepted"}`,
      };
    },
  },
});
