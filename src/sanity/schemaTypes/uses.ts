import { defineField, defineType } from "sanity";

export default defineType({
  name: "uses",
  title: "Uses (hardware + software)",
  type: "document",
  description:
    "Singleton. Hardware/software setup rendered in the v2 `uses` command.",
  fields: [
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [
        {
          type: "object",
          name: "category",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              description: "E.g. editor, shell, machine, browser, ai.",
              validation: (Rule) => Rule.required().max(40),
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              description:
                "One-line description. E.g. 'Claude Code + Zed · vim bindings · Berkeley Mono'.",
              validation: (Rule) => Rule.required().max(200),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(16),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Uses" };
    },
  },
});
