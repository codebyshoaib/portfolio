#!/usr/bin/env tsx

/**
 * Builds the retrieval index for the AI twin.
 *
 * Reads the same file-first content the importer uses (content/decisions,
 * content/notes) plus the CMS records that only live in Sanity (experience,
 * projects, skills, education), chunks all of it, embeds each chunk once, and
 * writes src/lib/rag/index.json.
 *
 * The index is committed. It is derived data, but it is small, it needs an API
 * key to regenerate, and committing it means a deploy can never ship a site
 * whose twin has no memory. Rebuild it in the same breath as an import:
 *
 *   pnpm decisions:import && pnpm rag:index
 *
 * Run:
 *   pnpm rag:index              # rebuild from content/ + Sanity
 *   pnpm rag:index --dry-run    # chunk and report, no embedding calls, no write
 *
 * Required env: OPENAI_API_KEY (embeddings), plus the Sanity vars already in
 * .env.local for the CMS half of the corpus.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import matter from "gray-matter";
import {
  type Chunk,
  type ContentDoc,
  chunkContentDoc,
  chunkProfile,
} from "../../src/lib/rag/chunk";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  embed,
} from "../../src/lib/rag/embed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUT_FILE = path.join(REPO_ROOT, "src", "lib", "rag", "index.json");

const CONTENT_DIRS = [
  { dir: path.join(REPO_ROOT, "content", "decisions"), source: "decision" },
  { dir: path.join(REPO_ROOT, "content", "notes"), source: "note" },
] as const;

/** OpenAI accepts far more per call, but small batches give clearer failures. */
const BATCH_SIZE = 64;

/** Vectors are noise past 5 decimals and it halves the committed file. */
const round = (n: number) => Math.round(n * 1e5) / 1e5;

async function readContentChunks(): Promise<Chunk[]> {
  const chunks: Chunk[] = [];

  for (const { dir, source } of CONTENT_DIRS) {
    let files: string[];
    try {
      files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
    } catch {
      console.warn(`  (no ${source} directory at ${dir}, skipping)`);
      continue;
    }

    for (const file of files.sort()) {
      const raw = await readFile(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);

      // Unpublished drafts are not on the site; the twin must not quote them.
      if (data.published === false) {
        console.log(`  skip ${file} (published: false)`);
        continue;
      }

      const docChunks = chunkContentDoc(data as ContentDoc, content, source);
      if (docChunks.length === 0) {
        console.warn(`  skip ${file} (no title/slug in frontmatter)`);
        continue;
      }
      chunks.push(...docChunks);
      console.log(`  ${file} → ${docChunks.length} chunks`);
    }
  }

  return chunks;
}

const PROFILE_QUERY = `{
  "experience": *[_type == "experience"] | order(startDate desc){
    jobTitle, company, location, startDate, endDate, current, description,
    achievements[], "technologies": technologies[]->{name}
  },
  "projects": *[_type == "project"] | order(order asc){
    title, tagline, category, liveUrl, githubUrl,
    "technologies": technologies[]->{name}
  },
  "skills": *[_type == "skill"] | order(name asc){ name, category },
  "education": *[_type == "education"] | order(endDate desc){
    degree, field, institution, endDate, description
  }
}`;

async function readProfileChunks(): Promise<Chunk[]> {
  const projectId =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
  const dataset =
    process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;

  if (!projectId || !dataset) {
    console.warn("  (no Sanity credentials, skipping CMS chunks)");
    return [];
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: true,
  });

  const sources = await client.fetch(PROFILE_QUERY);
  const chunks = chunkProfile(sources);
  console.log(
    `  Sanity → ${chunks.length} chunks (${sources.experience?.length ?? 0} jobs, ${
      sources.projects?.length ?? 0
    } projects, ${sources.skills?.length ?? 0} skills)`,
  );
  return chunks;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("Reading content/…");
  const contentChunks = await readContentChunks();
  console.log("Reading Sanity…");
  const profileChunks = await readProfileChunks();

  const chunks = [...profileChunks, ...contentChunks];
  if (chunks.length === 0) {
    console.error("No chunks produced — refusing to write an empty index.");
    process.exit(1);
  }

  const duplicates = chunks.length - new Set(chunks.map((c) => c.id)).size;
  if (duplicates > 0) {
    console.error(`${duplicates} duplicate chunk id(s) — ids must be unique.`);
    process.exit(1);
  }

  const totalChars = chunks.reduce((sum, c) => sum + c.text.length, 0);
  console.log(
    `\n${chunks.length} chunks, ${totalChars} chars, ~${Math.round(totalChars / 4)} tokens to embed`,
  );

  if (dryRun) {
    console.log("\n--dry-run: no embeddings requested, no file written.");
    for (const c of chunks.slice(0, 5)) {
      console.log(`  [${c.id}] ${c.text.slice(0, 90)}…`);
    }
    return;
  }

  console.log(
    `\nEmbedding with ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}d)…`,
  );
  const vectors: number[][] = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    vectors.push(...(await embed(batch.map((c) => c.text))));
    console.log(
      `  ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`,
    );
  }

  const index = {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    builtAt: new Date().toISOString(),
    chunks: chunks.map((chunk, i) => ({
      ...chunk,
      vector: vectors[i].map(round),
    })),
  };

  await writeFile(OUT_FILE, `${JSON.stringify(index)}\n`, "utf8");
  const kb = Math.round(JSON.stringify(index).length / 1024);
  console.log(`\nWrote ${path.relative(REPO_ROOT, OUT_FILE)} — ${kb} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
