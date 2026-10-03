/**
 * Public open-source contributions, read from GitHub's search API.
 *
 * Unauthenticated search only ever returns public repositories, so client and
 * employer work in private repos can never leak onto the page. Own repos and
 * own orgs are excluded in the query: this section is for work on other
 * people's projects.
 */

export const GITHUB_USER = "codebyshoaib";
const OWN_OWNERS = ["codebyshoaib", "devynor", "Orenda-Project"];

/** Contributions left off the page on purpose (placeholder titles). */
const HIDDEN = new Set([
  "https://github.com/buildswithadnan/pdf-signer-plugin/pull/1",
  "https://github.com/buildswithadnan/pdf-signer-plugin/pull/2",
]);

export type SearchItem = {
  html_url: string;
  title: string;
  state: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  repository_url: string;
  pull_request?: { merged_at: string | null };
};

export type Status = "merged" | "open" | "closed";

export type Contribution = {
  url: string;
  title: string;
  kind: "pr" | "issue";
  status: Status;
  date: string;
};

export type RepoGroup = { repo: string; items: Contribution[] };

export function statusOf(item: SearchItem): Status {
  if (item.pull_request?.merged_at) return "merged";
  return item.state === "open" ? "open" : "closed";
}

/**
 * Pure: search items -> repositories, most recent activity first, each with
 * its contributions newest first. Closed-unmerged PRs are dropped: they did
 * not land, so they are not contributions.
 */
export function groupContributions(items: SearchItem[]): RepoGroup[] {
  const groups = new Map<string, Contribution[]>();
  for (const item of items) {
    if (HIDDEN.has(item.html_url)) continue;
    const kind = item.pull_request ? "pr" : "issue";
    const status = statusOf(item);
    if (kind === "pr" && status === "closed") continue;
    const repo = item.repository_url.split("/repos/")[1];
    if (!repo || OWN_OWNERS.includes(repo.split("/")[0])) continue;
    const list = groups.get(repo) ?? [];
    list.push({
      url: item.html_url,
      title: item.title.trim(),
      kind,
      status,
      date: item.pull_request?.merged_at ?? item.created_at,
    });
    groups.set(repo, list);
  }
  return [...groups]
    .map(([repo, list]) => ({
      repo,
      items: list.sort((a, b) => b.date.localeCompare(a.date)),
    }))
    .sort((a, b) => b.items[0].date.localeCompare(a.items[0].date));
}

const DAY = 60 * 60 * 24;

/** Null when GitHub is unreachable or rate-limited: the section hides itself. */
export async function getOpenSource(): Promise<RepoGroup[] | null> {
  const owners = OWN_OWNERS.map((o) => `-user:${o}`).join(" ");
  const q = `author:${GITHUB_USER} is:public ${owners}`;
  try {
    const res = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=100`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: DAY },
      },
    );
    if (!res.ok) return null;
    const { items } = (await res.json()) as { items: SearchItem[] };
    return groupContributions(items);
  } catch {
    return null;
  }
}
