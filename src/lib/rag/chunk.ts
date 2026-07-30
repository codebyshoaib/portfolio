/**
 * Turns portfolio content into retrieval chunks.
 *
 * Chunking is semantic, not fixed-width: these documents already have a
 * structure worth respecting. A decision's `tradeoffs` is a self-contained
 * answer to "what did that cost you?", so it becomes its own chunk rather than
 * being sliced at an arbitrary 500 characters. Fixed-width windows would split
 * a trade-off from the decision it belongs to and retrieve half an argument.
 *
 * Pure on purpose — the index script and the tests share it.
 */

export type ChunkSource =
  | "experience"
  | "project"
  | "skills"
  | "education"
  | "decision"
  | "note";

export interface Chunk {
  /** Stable id, so a rebuild produces a diffable index rather than churn. */
  readonly id: string;
  readonly source: ChunkSource;
  /** Document this came from, used to cite a link back to the site. */
  readonly title: string;
  /** Which part of the document — "tradeoffs", "body: Why it broke", … */
  readonly section: string;
  /** Where a visitor can read the whole thing, when one exists. */
  readonly url?: string;
  /** The text that gets embedded and, on a hit, injected into the prompt. */
  readonly text: string;
}

/** Frontmatter fields worth retrieving, in the order they read naturally. */
const DECISION_FIELDS = [
  "context",
  "decision",
  "tradeoffs",
  "revisitTrigger",
] as const;

export interface ContentDoc {
  readonly title?: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly context?: string;
  readonly decision?: string;
  readonly tradeoffs?: string;
  readonly revisitTrigger?: string;
  readonly takeaways?: readonly string[];
  readonly options?: ReadonlyArray<{ label?: string; summary?: string }>;
  readonly tags?: readonly string[];
}

const clean = (s: unknown): string =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";

/**
 * Prefixing each chunk with its document title is what makes retrieval work on
 * short fields. "Weaker on open-ended reasoning." embeds almost identically to
 * every other trade-off in the corpus; with the title attached it lands near
 * questions about *that* decision.
 */
const withTitle = (title: string, label: string, body: string) =>
  `${title} — ${label}: ${body}`;

/** Split a markdown body on `##` headings, keeping each heading with its prose. */
export function splitMarkdownSections(
  body: string,
): Array<{ heading: string; text: string }> {
  const withoutFrontmatter = body.replace(/^---[\s\S]*?\n---\n/, "");
  const parts = withoutFrontmatter.split(/^##\s+(.+)$/m);

  const sections: Array<{ heading: string; text: string }> = [];
  // parts[0] is the prose before the first heading; odd indices are headings.
  const intro = clean(parts[0]);
  if (intro) sections.push({ heading: "intro", text: intro });

  for (let i = 1; i < parts.length; i += 2) {
    const heading = clean(parts[i]);
    const text = clean(parts[i + 1]);
    if (text) sections.push({ heading, text });
  }
  return sections;
}

/**
 * A decision or note becomes several chunks: one per meaningful frontmatter
 * field, one for the options it weighed, one for its takeaways, and one per
 * body section.
 */
export function chunkContentDoc(
  doc: ContentDoc,
  body: string,
  source: "decision" | "note",
): Chunk[] {
  const title = clean(doc.title);
  const slug = clean(doc.slug);
  if (!title || !slug) return [];

  const url = source === "decision" ? `/decisions/${slug}` : `/notes/${slug}`;
  const chunks: Chunk[] = [];
  const push = (section: string, text: string) => {
    if (!text) return;
    chunks.push({
      id: `${source}:${slug}:${section}`,
      source,
      title,
      section,
      url,
      text: withTitle(title, section, text),
    });
  };

  push("summary", clean(doc.summary));
  for (const field of DECISION_FIELDS) push(field, clean(doc[field]));

  const options = (doc.options || [])
    .map((o) => [clean(o.label), clean(o.summary)].filter(Boolean).join(" — "))
    .filter(Boolean);
  if (options.length > 0) push("options considered", options.join(" | "));

  const takeaways = (doc.takeaways || []).map(clean).filter(Boolean);
  if (takeaways.length > 0) push("takeaways", takeaways.join(" "));

  for (const section of splitMarkdownSections(body)) {
    push(`body: ${section.heading}`, section.text);
  }

  return chunks;
}

export interface ProfileSources {
  readonly experience?: ReadonlyArray<{
    jobTitle?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements?: readonly string[];
    technologies?: ReadonlyArray<{ name?: string }>;
  }>;
  readonly projects?: ReadonlyArray<{
    title?: string;
    tagline?: string;
    category?: string;
    liveUrl?: string;
    githubUrl?: string;
    technologies?: ReadonlyArray<{ name?: string }>;
  }>;
  readonly skills?: ReadonlyArray<{ name?: string; category?: string }>;
  readonly education?: ReadonlyArray<{
    degree?: string;
    field?: string;
    institution?: string;
    endDate?: string;
    description?: string;
  }>;
}

const techList = (tech?: ReadonlyArray<{ name?: string }>) =>
  (tech || [])
    .map((t) => clean(t.name))
    .filter(Boolean)
    .join(", ");

/**
 * CMS records become one chunk each. A job is already the right retrieval unit:
 * splitting its achievements from its title would strand "reduced load time by
 * 50%" with nothing to say where it happened.
 */
export function chunkProfile(sources: ProfileSources): Chunk[] {
  const chunks: Chunk[] = [];

  (sources.experience || []).forEach((exp, i) => {
    const role = [clean(exp.jobTitle), clean(exp.company)]
      .filter(Boolean)
      .join(" at ");
    if (!role) return;
    const when = exp.current
      ? `${clean(exp.startDate)}-present`
      : [clean(exp.startDate), clean(exp.endDate)].filter(Boolean).join("-");
    const wins = (exp.achievements || []).map(clean).filter(Boolean).join("; ");
    const tech = techList(exp.technologies);
    chunks.push({
      id: `experience:${i}`,
      source: "experience",
      title: role,
      section: "role",
      text: [
        `Job: ${role}${when ? ` (${when})` : ""}.`,
        clean(exp.location) && `Location: ${clean(exp.location)}.`,
        clean(exp.description),
        wins && `Achievements: ${wins}.`,
        tech && `Technologies: ${tech}.`,
      ]
        .filter(Boolean)
        .join(" "),
    });
  });

  (sources.projects || []).forEach((proj, i) => {
    const title = clean(proj.title);
    if (!title) return;
    const tech = techList(proj.technologies);
    chunks.push({
      id: `project:${i}`,
      source: "project",
      title,
      section: "project",
      url: clean(proj.liveUrl) || clean(proj.githubUrl) || undefined,
      text: [
        `Project: ${title}.`,
        clean(proj.tagline),
        clean(proj.category) && `Category: ${clean(proj.category)}.`,
        tech && `Built with: ${tech}.`,
      ]
        .filter(Boolean)
        .join(" "),
    });
  });

  // Skills group by category: nobody asks about one skill, they ask "do you
  // know backend?" — so the category is the unit that matches the question.
  const byCategory = new Map<string, string[]>();
  (sources.skills || []).forEach((skill) => {
    const name = clean(skill.name);
    if (!name) return;
    const category = clean(skill.category) || "Other";
    byCategory.set(category, [...(byCategory.get(category) || []), name]);
  });
  for (const [category, names] of byCategory) {
    chunks.push({
      id: `skills:${category.toLowerCase()}`,
      source: "skills",
      title: `${category} skills`,
      section: "skills",
      text: `Skills — ${category}: ${names.join(", ")}.`,
    });
  }

  (sources.education || []).forEach((edu, i) => {
    const degree = [clean(edu.degree), clean(edu.field)]
      .filter(Boolean)
      .join(" in ");
    if (!degree) return;
    chunks.push({
      id: `education:${i}`,
      source: "education",
      title: degree,
      section: "education",
      text: [
        `Education: ${degree}, ${clean(edu.institution)}${
          clean(edu.endDate) ? ` (${clean(edu.endDate)})` : ""
        }.`,
        clean(edu.description),
      ]
        .filter(Boolean)
        .join(" "),
    });
  });

  return chunks;
}
