import { describe, expect, it } from "vitest";
import { groupContributions, type SearchItem } from "../open-source";

const item = (o: Partial<SearchItem> & { repo: string }): SearchItem => ({
  html_url: `https://github.com/${o.repo}/pull/${Math.random()}`,
  title: "t",
  state: "closed",
  created_at: "2026-01-01T00:00:00Z",
  closed_at: null,
  repository_url: `https://api.github.com/repos/${o.repo}`,
  ...o,
});

describe("groupContributions", () => {
  it("groups by repo, newest activity first, and labels status", () => {
    const groups = groupContributions([
      item({
        repo: "a/x",
        pull_request: { merged_at: "2026-03-01T00:00:00Z" },
      }),
      item({ repo: "b/y", state: "open", created_at: "2026-05-01T00:00:00Z" }),
      item({
        repo: "a/x",
        state: "open",
        pull_request: { merged_at: null },
        created_at: "2026-04-01T00:00:00Z",
      }),
    ]);
    expect(groups.map((g) => g.repo)).toEqual(["b/y", "a/x"]);
    expect(groups[0].items[0]).toMatchObject({ kind: "issue", status: "open" });
    expect(groups[1].items.map((i) => i.status)).toEqual(["open", "merged"]);
  });

  it("drops closed-unmerged PRs but keeps closed issues", () => {
    const groups = groupContributions([
      item({ repo: "a/x", pull_request: { merged_at: null } }),
      item({ repo: "a/x" }),
    ]);
    expect(groups[0].items).toEqual([
      expect.objectContaining({ kind: "issue", status: "closed" }),
    ]);
  });

  it("never lists own repos or orgs", () => {
    expect(
      groupContributions([
        item({ repo: "codebyshoaib/portfolio" }),
        item({ repo: "devynor/sellpredator" }),
        item({ repo: "Orenda-Project/compliancetracker" }),
      ]),
    ).toEqual([]);
  });
});
