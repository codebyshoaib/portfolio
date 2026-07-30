import { defineField, defineType } from "sanity";
import { longFormBody } from "./portableText";

/**
 * A note is everything I write that isn't binding on a codebase.
 *
 * The discriminator against `decision`: was there an option I rejected, and
 * would reversing this force a code change? Both yes → decision. Anything else
 * → note. That's why there's no `status`, no `optionsConsidered`, no
 * `tradeoffs`, and no `revisitTrigger` here. The absence is the whole point:
 * a note forced to fill those fields is a fabricated ADR, and one fabricated
 * ADR discredits the entire decision log.
 */
export default defineType({
  name: "note",
  title: "Notes",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description:
        "One or two sentences shown on the index and in the feeds. Say what the reader gets, not what the note is 'about'.",
      validation: (Rule) => Rule.required().max(320),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      description:
        "The note itself. Portable Text supports headings, lists, code blocks, links.",
      of: longFormBody,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: true,
      description: "Unpublished notes are hidden from the public site.",
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
          : "—",
      };
    },
  },
});
