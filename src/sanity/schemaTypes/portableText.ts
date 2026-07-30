import { defineField } from "sanity";

/**
 * Long-form body config shared by `decision` and `note`.
 *
 * Both surfaces render through the same Portable Text components
 * (src/components/PortableTextBody.tsx) and are authored through the same
 * markdown importer, so the block set has to be one definition — a heading or
 * mark that exists in one schema but not the other is a body that imports
 * cleanly and renders as nothing.
 */
export const longFormBody = [
  {
    type: "block" as const,
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
    type: "object" as const,
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
];
