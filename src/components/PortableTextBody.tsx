import type {
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from "@portabletext/react";

/**
 * Portable Text rendering shared by /decisions and /notes.
 *
 * Both surfaces are authored through the same markdown importer and share one
 * schema block config (src/sanity/schemaTypes/portableText.ts), so they render
 * through one component map — otherwise a block type added to the schema
 * renders on one surface and silently vanishes on the other.
 *
 * Heading levels: on a decision the section label is the <h2>, so authored
 * `h2`/`h3` nest one level down. A note has no section labels, so its <h1> is
 * the title and the same shift keeps authored headings at h3/h4 — one level
 * deeper than strictly needed there, but consistent, and the outline stays
 * valid either way.
 */
export const portableTextComponents: PortableTextComponents = {
  types: {
    codeBlock: ({
      value,
    }: {
      value: { language?: string; code: string; caption?: string };
    }) => (
      <figure className="my-8">
        <pre className="overflow-x-auto rounded border border-foreground/10 bg-foreground/[0.03] p-5">
          <code data-lang={value.language}>{value.code}</code>
        </pre>
        {value.caption ? (
          <figcaption className="mt-2 text-center mono-meta text-[11px] uppercase tracking-[0.18em] text-foreground/65">
            {value.caption}
          </figcaption>
        ) : null}
      </figure>
    ),
  },
  block: {
    h2: ({ children }) => (
      <h3 className="display-serif mt-12 scroll-m-20 text-2xl font-semibold leading-tight tracking-tight">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="display-serif mt-9 scroll-m-20 text-xl font-semibold leading-tight tracking-tight">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="pull-quote my-7">{children}</blockquote>
    ),
    normal: ({ children }) => (
      <p className="my-4 text-[17px] leading-[1.7]">{children}</p>
    ),
  },
  marks: {
    code: ({ children }) => (
      <code className="mono-meta rounded bg-foreground/[0.06] px-1.5 py-[1px] text-[0.92em]">
        {children}
      </code>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    link: ({
      value,
      children,
    }: PortableTextMarkComponentProps<{ _type: "link"; href?: string }>) => {
      const href = value?.href ?? "#";
      const external = /^https?:/.test(href);
      return (
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="underline decoration-foreground/45 underline-offset-4 transition-colors hover:decoration-foreground"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.7]">
        {children}
      </ul>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
  },
};
