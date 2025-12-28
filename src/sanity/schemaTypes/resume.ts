import { defineField, defineType } from "sanity";

export default defineType({
  name: "resume",
  title: "Resume",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Resume Title",
      type: "string",
      description:
        "e.g., 'Software Engineer Resume 2024' or 'Full Stack Developer CV'",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "resumeFile",
      title: "Resume File (PDF)",
      type: "file",
      options: {
        accept: ".pdf",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "version",
      title: "Version",
      type: "string",
      description: "Version identifier (e.g., 'v2.1', '2024-Q1')",
    }),
    defineField({
      name: "isActive",
      title: "Active Resume",
      type: "boolean",
      description:
        "Mark as active to make this the default resume for download",
      initialValue: false,
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description: "Brief description of this resume version",
    }),
    defineField({
      name: "uploadDate",
      title: "Upload Date",
      type: "date",
      description: "When was this resume uploaded/created",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "previewImage",
      title: "Preview Image",
      type: "image",
      description: "Optional preview thumbnail of the resume",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first (newest resumes first)",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "version",
      media: "previewImage",
      active: "isActive",
    },
    prepare(selection) {
      const { title, subtitle, media, active } = selection;
      return {
        title: active ? `${title} (Active)` : title,
        subtitle: subtitle ? `Version: ${subtitle}` : "No version",
        media: media,
      };
    },
  },
  orderings: [
    {
      title: "Active First",
      name: "activeFirst",
      by: [{ field: "isActive", direction: "desc" }],
    },
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Newest First",
      name: "dateDesc",
      by: [{ field: "uploadDate", direction: "desc" }],
    },
  ],
});
