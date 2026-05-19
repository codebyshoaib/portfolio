#!/usr/bin/env tsx

/**
 * ADR importer: reads markdown files with YAML frontmatter from
 * content/decisions/*.md, converts them to Sanity `decision` documents,
 * and upserts them via createOrReplace.
 *
 * Run:
 *   pnpm decisions:import                       # imports every .md in content/decisions
 *   pnpm decisions:import path/to/file.md       # imports a single file
 *   pnpm decisions:import --dry-run             # parses + validates, no Sanity write
 *
 * Required env: SANITY_API_WRITE_TOKEN (a Sanity API token with "Editor" or "Maintainer" role).
 */

import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import matter from "gray-matter";
import { markdownToPortableText } from "./markdown-to-portable-text";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_DIR = path.join(REPO_ROOT, "content", "decisions");

const ALLOWED_STATUS = [
  "proposed",
  "accepted",
  "deprecated",
  "superseded",
] as const;
type Status = (typeof ALLOWED_STATUS)[number];

const ALLOWED_IMPACT = ["S", "M", "L"] as const;
type Impact = (typeof ALLOWED_IMPACT)[number];

interface Frontmatter {
  readonly title: string;
  readonly slug: string;
  readonly date: string;
  readonly status?: Status;
  readonly impact?: Impact;
  readonly domain?: string;
  readonly summary: string;
  readonly context?: string;
  readonly decision?: string;
  readonly tradeoffs?: string;
  readonly revisitTrigger?: string;
  readonly takeaways?: readonly string[];
  readonly options?: readonly {
    readonly label: string;
    readonly summary?: string;
  }[];
  readonly tags?: readonly string[];
  readonly published?: boolean;
}

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function parseFrontmatter(
  file: string,
  raw: matter.GrayMatterFile<string>,
): Frontmatter {
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
  return fm as unknown as Frontmatter;
}

function buildDoc(fm: Frontmatter, body: string) {
  const _id = `decision-${fm.slug}`;
  return {
    _id,
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

async function loadFiles(arg?: string): Promise<string[]> {
  if (arg) {
    const abs = path.resolve(process.cwd(), arg);
    return [abs];
  }
  const entries = await readdir(DEFAULT_DIR);
  return entries
    .filter((e) => e.endsWith(".md") || e.endsWith(".mdx"))
    .map((e) => path.join(DEFAULT_DIR, e));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find((a) => !a.startsWith("--"));

  const files = await loadFiles(fileArg);
  if (!files.length) {
    console.error(`No .md files found in ${DEFAULT_DIR}`);
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
      const fm = parseFrontmatter(file, parsed);
      const doc = buildDoc(fm, parsed.content);
      if (dryRun) {
        console.log(
          `[dry-run] ${path.basename(file)} -> ${doc._id} (${doc.body.length} body blocks, status=${doc.status})`,
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

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
