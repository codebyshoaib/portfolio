#!/usr/bin/env tsx

/**
 * Content importer: reads markdown files with YAML frontmatter from
 * content/<type>s/*.md, converts them to Sanity documents, and upserts them
 * via createOrReplace.
 *
 * Two document types share this script because they share a body format and a
 * publish workflow — only the frontmatter contract differs.
 *
 * Run:
 *   pnpm decisions:import                       # every .md in content/decisions
 *   pnpm notes:import                           # every .md in content/notes
 *   pnpm notes:import path/to/file.md           # a single file
 *   pnpm notes:import --dry-run                 # parses + validates, no Sanity write
 *
 * Required env: SANITY_API_WRITE_TOKEN (a Sanity API token with "Editor" or "Maintainer" role).
 */

import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import matter from "gray-matter";
import {
  markdownToPortableText,
  type PortableTextNode,
} from "./markdown-to-portable-text";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const DOC_TYPES = ["decision", "note"] as const;
type DocType = (typeof DOC_TYPES)[number];

const CONTENT_DIR: Record<DocType, string> = {
  decision: path.join(REPO_ROOT, "content", "decisions"),
  note: path.join(REPO_ROOT, "content", "notes"),
};

const ALLOWED_STATUS = [
  "proposed",
  "accepted",
  "deprecated",
  "superseded",
] as const;
type Status = (typeof ALLOWED_STATUS)[number];

const ALLOWED_IMPACT = ["S", "M", "L"] as const;
type Impact = (typeof ALLOWED_IMPACT)[number];

/** Fields every content type requires. */
interface BaseFrontmatter {
  readonly title: string;
  readonly slug: string;
  readonly date: string;
  readonly summary: string;
  readonly tags?: readonly string[];
  readonly published?: boolean;
}

interface DecisionFrontmatter extends BaseFrontmatter {
  readonly status?: Status;
  readonly impact?: Impact;
  readonly domain?: string;
  readonly context?: string;
  readonly decision?: string;
  readonly tradeoffs?: string;
  readonly revisitTrigger?: string;
  readonly takeaways?: readonly string[];
  readonly options?: readonly {
    readonly label: string;
    readonly summary?: string;
  }[];
}

/**
 * A note deliberately has no status, options, trade-offs, or revisit trigger —
 * see src/sanity/schemaTypes/note.ts. Frontmatter carrying those keys is a
 * decision filed in the wrong drawer, so the parser rejects it rather than
 * dropping them on the floor.
 */
type NoteFrontmatter = BaseFrontmatter;

const DECISION_ONLY_KEYS = [
  "status",
  "impact",
  "domain",
  "context",
  "decision",
  "tradeoffs",
  "revisitTrigger",
  "options",
] as const;

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export function parseFrontmatter(
  file: string,
  docType: DocType,
  raw: matter.GrayMatterFile<string>,
): DecisionFrontmatter | NoteFrontmatter {
  const fm = raw.data as Record<string, unknown>;
  assert(
    typeof fm.title === "string" && fm.title.length,
    `${file}: missing title`,
  );
  assert(
    typeof fm.slug === "string" && fm.slug.length,
    `${file}: missing slug`,
  );
  assert(typeof fm.date === "string", `${file}: missing date`);
  assert(
    typeof fm.summary === "string" && fm.summary.length,
    `${file}: missing summary`,
  );

  if (docType === "note") {
    const strays = DECISION_ONLY_KEYS.filter((k) => fm[k] !== undefined);
    assert(
      strays.length === 0,
      `${file}: note frontmatter has decision-only keys (${strays.join(", ")}). ` +
        `If there was a rejected option and reversing it forces a code change, ` +
        `file it under content/decisions instead.`,
    );
    return fm as unknown as NoteFrontmatter;
  }

  if (fm.status !== undefined) {
    assert(
      ALLOWED_STATUS.includes(fm.status as Status),
      `${file}: invalid status '${String(fm.status)}'`,
    );
  }
  if (fm.impact !== undefined) {
    assert(
      ALLOWED_IMPACT.includes(fm.impact as Impact),
      `${file}: invalid impact '${String(fm.impact)}' (use S, M, or L)`,
    );
  }
  return fm as unknown as DecisionFrontmatter;
}

function buildDecisionDoc(fm: DecisionFrontmatter, body: string) {
  return {
    _id: `decision-${fm.slug}`,
    _type: "decision" as const,
    title: fm.title,
    slug: { _type: "slug" as const, current: fm.slug },
    date: fm.date,
    status: fm.status ?? "accepted",
    ...(fm.impact ? { impact: fm.impact } : {}),
    ...(fm.domain ? { domain: fm.domain } : {}),
    summary: fm.summary,
    ...(fm.context ? { context: fm.context } : {}),
    ...(fm.decision ? { decision: fm.decision } : {}),
    ...(fm.tradeoffs ? { tradeoffs: fm.tradeoffs } : {}),
    ...(fm.revisitTrigger ? { revisitTrigger: fm.revisitTrigger } : {}),
    ...(fm.takeaways?.length ? { takeaways: [...fm.takeaways] } : {}),
    ...(fm.options?.length
      ? {
          optionsConsidered: fm.options.map((o) => ({
            _key: key(),
            _type: "option",
            label: o.label,
            ...(o.summary ? { summary: o.summary } : {}),
          })),
        }
      : {}),
    ...(fm.tags?.length ? { tags: [...fm.tags] } : {}),
    published: fm.published !== false,
    body: markdownToPortableText(body),
  };
}

function buildNoteDoc(fm: NoteFrontmatter, body: string) {
  return {
    _id: `note-${fm.slug}`,
    _type: "note" as const,
    title: fm.title,
    slug: { _type: "slug" as const, current: fm.slug },
    date: fm.date,
    summary: fm.summary,
    ...(fm.tags?.length ? { tags: [...fm.tags] } : {}),
    published: fm.published !== false,
    body: markdownToPortableText(body),
  };
}

/**
 * The two builders return different field sets, and a bare union of them makes
 * `createOrReplace` infer from the first member only. The shared shape is what
 * the Sanity client actually needs.
 */
interface ImportedDoc {
  readonly _id: string;
  readonly _type: DocType;
  readonly body: PortableTextNode[];
  readonly [field: string]: unknown;
}

export function buildDoc(
  docType: DocType,
  fm: DecisionFrontmatter | NoteFrontmatter,
  body: string,
): ImportedDoc {
  return docType === "note"
    ? buildNoteDoc(fm as NoteFrontmatter, body)
    : buildDecisionDoc(fm as DecisionFrontmatter, body);
}

async function loadFiles(docType: DocType, arg?: string): Promise<string[]> {
  if (arg) {
    return [path.resolve(process.cwd(), arg)];
  }
  const dir = CONTENT_DIR[docType];
  // An empty content dir is the normal state for a brand-new type, so it gets a
  // real message rather than a raw ENOENT stack.
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.endsWith(".md") || e.endsWith(".mdx"))
    .map((e) => path.join(dir, e));
}

function parseDocType(args: readonly string[]): DocType {
  const flag = args.find((a) => a.startsWith("--type="));
  if (!flag) return "decision";
  const value = flag.slice("--type=".length);
  assert(
    DOC_TYPES.includes(value as DocType),
    `invalid --type='${value}' (use ${DOC_TYPES.join(" or ")})`,
  );
  return value as DocType;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const docType = parseDocType(args);
  const fileArg = args.find((a) => !a.startsWith("--"));

  const files = await loadFiles(docType, fileArg);
  if (!files.length) {
    console.error(`No .md files found in ${CONTENT_DIR[docType]}`);
    process.exit(1);
  }

  // Lazy-load env so --dry-run works without a token
  let client: ReturnType<typeof createClient> | null = null;
  if (!dryRun) {
    const projectId =
      process.env.SANITY_PROJECT_ID ??
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset =
      process.env.SANITY_DATASET ??
      process.env.NEXT_PUBLIC_SANITY_DATASET ??
      "production";
    const token = process.env.SANITY_API_WRITE_TOKEN;
    assert(
      projectId,
      "SANITY_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID) is required",
    );
    assert(
      token,
      "SANITY_API_WRITE_TOKEN is required (create one at https://www.sanity.io/manage)",
    );
    client = createClient({
      projectId,
      dataset,
      apiVersion: "2024-10-01",
      token,
      useCdn: false,
    });
  }

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const raw = await readFile(file, "utf-8");
      const parsed = matter(raw);
      const fm = parseFrontmatter(file, docType, parsed);
      const doc = buildDoc(docType, fm, parsed.content);
      if (dryRun) {
        console.log(
          `[dry-run] ${path.basename(file)} -> ${doc._id} (${doc.body.length} body blocks)`,
        );
      } else if (client) {
        await client.createOrReplace(doc);
        console.log(`[ok]      ${path.basename(file)} -> ${doc._id}`);
      }
      ok++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[fail]    ${path.basename(file)}: ${msg}`);
    }
  }

  console.log("");
  console.log(`${ok} imported, ${failed} failed`);
  if (failed) process.exit(1);
}

// Only run when invoked as a script — the parser and doc builders are imported
// directly by scripts/content/__tests__/import.test.ts.
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.stack : String(err));
    process.exit(1);
  });
}
