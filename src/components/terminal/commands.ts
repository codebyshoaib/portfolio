export interface CommandContext {
  readonly profile: TerminalProfile;
  readonly history: readonly string[];
  readonly clear: () => void;
  readonly run: (raw: string) => void;
}

export interface TerminalProfile {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly headline?: string;
  readonly shortBio?: string;
  readonly location?: string;
  readonly yearsOfExperience?: number;
  readonly email?: string;
  readonly availability?: string;
  readonly socialLinks?: {
    readonly github?: string;
    readonly linkedin?: string;
    readonly twitter?: string;
  };
  readonly projects?: readonly TerminalProject[];
  readonly experience?: readonly TerminalExperience[];
  readonly decisions?: readonly TerminalDecision[];
}

export interface TerminalProject {
  readonly title: string;
  readonly tagline?: string;
  readonly metrics?: string;
  readonly stack?: readonly string[];
  readonly url?: string;
  readonly github?: string;
}

export interface TerminalExperience {
  readonly title: string;
  readonly company: string;
  readonly period: string;
  readonly impact?: readonly string[];
}

export interface TerminalDecision {
  readonly slug: string;
  readonly title: string;
  readonly date: string;
  readonly summary: string;
}

export type CommandOutput =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "html"; readonly value: string }
  | { readonly kind: "error"; readonly value: string }
  | { readonly kind: "ascii"; readonly value: string }
  | { readonly kind: "clear" };

export interface Command {
  readonly name: string;
  readonly description: string;
  readonly aliases?: readonly string[];
  readonly run: (
    args: readonly string[],
    ctx: CommandContext,
  ) => CommandOutput | readonly CommandOutput[];
}

const escape = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const link = (href: string, label: string): string =>
  `<a class="term-link-btn" href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;

const internalLink = (href: string, label: string): string =>
  `<a class="term-link-btn" href="${escape(href)}">${escape(label)}</a>`;

const dim = (s: string): string =>
  `<span style="color: var(--term-fg-dim)">${escape(s)}</span>`;
const accent = (s: string): string =>
  `<span style="color: var(--term-accent)">${escape(s)}</span>`;
const prompt = (s: string): string =>
  `<span style="color: var(--term-prompt)">${escape(s)}</span>`;
const serif = (s: string): string =>
  `<span class="term-serif" style="font-size: 1.4em">${escape(s)}</span>`;

export const commands: Record<string, Command> = {
  help: {
    name: "help",
    description: "show available commands",
    aliases: ["?", "h"],
    run: () => ({
      kind: "html",
      value: [
        dim("Available commands —"),
        "",
        `  ${accent("whoami")}              who I am, in one breath`,
        `  ${accent("ls projects")}         production systems I've shipped`,
        `  ${accent("cat experience")}      where I've worked`,
        `  ${accent("cat decisions")}       public engineering ADRs`,
        `  ${accent("ask")} ${dim('"<question>"')}      ask the codebase anything ${dim("(coming soon)")}`,
        `  ${accent("stack")}               languages, runtimes, tools`,
        `  ${accent("now")}                 what I'm working on this week`,
        `  ${accent("uses")}                hardware + software setup`,
        `  ${accent("contact")}             email · linkedin · github`,
        `  ${accent("book")}                schedule a 15-min call`,
        `  ${accent("download cv")}         resume.pdf`,
        `  ${accent("recruiter")}           static, scan-friendly view`,
        `  ${accent("clear")}               clear the screen ${dim("(Ctrl+L)")}`,
        "",
        dim(
          "Tips: ↑/↓ for history · Tab to complete · click any underlined word",
        ),
      ].join("\n"),
    }),
  },

  whoami: {
    name: "whoami",
    description: "who I am",
    run: (_args, { profile }) => {
      const name = `${profile.firstName ?? "Shoaib"} ${profile.lastName ?? "Ud Din"}`;
      const lines = [
        "",
        `<div style="margin: 4px 0 14px"><span class="term-serif" style="font-size: 2.2em; color: var(--term-fg)">${escape(name)}</span></div>`,
        profile.headline
          ? `${escape(profile.headline)}`
          : "Full-stack engineer. Production AI. Systems thinking.",
        "",
        `${dim("years")}        ${profile.yearsOfExperience ?? 6}`,
        `${dim("location")}     ${escape(profile.location ?? "Lahore, PK")} ${dim("· UTC+5 · remote-first")}`,
        `${dim("status")}       <span class="term-status-dot"></span>${accent(profile.availability ?? "available · senior+ roles")}`,
        `${dim("reply")}        within 24h`,
        "",
        profile.shortBio
          ? `${escape(profile.shortBio)}`
          : "I ship AI to production, not just demos. I write ADRs publicly. I care about p95 latency more than line counts.",
        "",
        `${dim("Try:")} ${accent("ls projects")} · ${accent("cat decisions")} · ${accent("contact")}`,
      ];
      return { kind: "html", value: lines.join("\n") };
    },
  },

  ls: {
    name: "ls",
    description: "list things",
    run: (args, { profile }) => {
      const target = args[0]?.replace(/\/$/, "");
      if (!target || target === "projects") {
        if (!profile.projects?.length) {
          return {
            kind: "html",
            value: dim("no projects indexed yet — check back soon"),
          };
        }
        const lines = [
          dim(`total ${profile.projects.length}`),
          "",
          ...profile.projects.map((p) => {
            const metrics = p.metrics ? accent(`[${p.metrics}]`) : dim("[—]");
            const tagline = p.tagline ? `  ${dim(p.tagline)}` : "";
            return `  ${accent("▸")} ${escape(p.title.padEnd(24))} ${metrics}${tagline}`;
          }),
          "",
          dim("Tip: append a name to see details — e.g. ") +
            accent(
              `open ${profile.projects[0]?.title.toLowerCase().split(" ")[0] ?? "project"}`,
            ),
        ];
        return { kind: "html", value: lines.join("\n") };
      }
      if (target === "decisions") {
        return commands.cat.run(["decisions"], {
          profile,
          history: [],
          clear: () => {},
          run: () => {},
        });
      }
      return {
        kind: "error",
        value: `ls: cannot access '${escape(target)}': try 'ls projects' or 'ls decisions'`,
      };
    },
  },

  cat: {
    name: "cat",
    description: "read a file",
    run: (args, { profile }) => {
      const target = args[0];
      if (!target) {
        return {
          kind: "error",
          value:
            "cat: missing operand. Try 'cat experience' or 'cat decisions'",
        };
      }
      if (target === "experience" || target === "experience.md") {
        if (!profile.experience?.length) {
          return { kind: "html", value: dim("no experience indexed yet") };
        }
        const lines = [
          serif("Where I've worked"),
          "",
          ...profile.experience.flatMap((e) => [
            `${accent(e.title)} ${dim("@")} ${escape(e.company)}`,
            `${dim(e.period)}`,
            ...(e.impact ?? []).map((i) => `  ${accent("›")} ${escape(i)}`),
            "",
          ]),
        ];
        return { kind: "html", value: lines.join("\n") };
      }
      if (target === "decisions" || target === "decisions.md") {
        const decisions = profile.decisions ?? [
          {
            slug: "postgres-vs-dynamo",
            title:
              "Why we picked Postgres over DynamoDB for partitioned event logs",
            date: "2026-04-14",
            summary:
              "Range queries across 50M rows. Single-region writes acceptable. Citus is the escape hatch.",
          },
          {
            slug: "rate-limit-strategy",
            title: "Sliding window vs token bucket for the chat API",
            date: "2026-03-22",
            summary:
              "Bursts dominate steady-state. Token bucket with Redis-free sliding fallback.",
          },
          {
            slug: "groq-vs-anthropic",
            title: "Groq for latency, Anthropic for depth — when to switch",
            date: "2026-02-08",
            summary:
              "Latency budget under 400ms → Groq. Reasoning required → Claude. Auto-route by intent.",
          },
        ];
        const lines = [
          serif("Engineering decisions log"),
          "",
          dim(
            "Public ADRs. Every entry is a real decision I made under constraint.",
          ),
          "",
          ...decisions.flatMap((d) => [
            `${accent(d.date)}  ${escape(d.title)}`,
            `             ${dim(d.summary)}`,
            "",
          ]),
          dim("Full log → ") + internalLink("/decisions", "/decisions"),
        ];
        return { kind: "html", value: lines.join("\n") };
      }
      return {
        kind: "error",
        value: `cat: ${escape(target)}: No such file. Try 'help'.`,
      };
    },
  },

  stack: {
    name: "stack",
    description: "tech stack",
    run: () => ({
      kind: "html",
      value: [
        serif("Stack"),
        "",
        `${dim("daily")}        ${accent("TypeScript")} · ${accent("Go")} · ${accent("Postgres")} · ${accent("Next.js")} · ${accent("React")}`,
        `${dim("ai")}           ${accent("Groq")} · ${accent("Anthropic")} · ${accent("OpenAI")} · ${accent("Vercel AI SDK")} · eval harnesses`,
        `${dim("infra")}        ${accent("Vercel")} · ${accent("Cloudflare")} · ${accent("Docker")} · ${accent("Sanity")}`,
        `${dim("tooling")}      ${accent("Claude Code")} · ${accent("dmux")} · beads · pnpm · biome`,
        `${dim("watching")}     Bun · Hono · Effect · Inngest · Trigger.dev`,
        "",
        dim("Not interested in:") +
          " pure frontend work · agency · anything without ownership",
      ].join("\n"),
    }),
  },

  now: {
    name: "now",
    description: "current focus",
    run: () => ({
      kind: "html",
      value: [
        serif("Now"),
        dim(`Updated ${new Date().toISOString().slice(0, 10)}`),
        "",
        `${accent("›")} Eval harness v2 for production AI agents at Taleemabad`,
        `${accent("›")} Shipping an open-source rate limiter for Next.js Fluid Compute`,
        `${accent("›")} Writing the decisions log — 4 entries down, target is one per week`,
        `${accent("›")} Reading: ${escape("Designing Data-Intensive Applications")} (re-read), Antirez's blog archive`,
        "",
        dim("This page updates monthly. Inspired by ") +
          link("https://nownownow.com", "nownownow.com") +
          ".",
      ].join("\n"),
    }),
  },

  uses: {
    name: "uses",
    description: "hardware + software",
    run: () => ({
      kind: "html",
      value: [
        serif("What I use"),
        "",
        `${dim("editor")}       Claude Code + Zed · vim bindings · Berkeley Mono`,
        `${dim("shell")}        zsh · starship · dmux for sessions`,
        `${dim("machine")}      MacBook Pro M-series · external 4K · Logi MX`,
        `${dim("os")}           macOS daily · Linux (Ubuntu) on side machine`,
        `${dim("browser")}      Arc + Chrome DevTools · Firefox for testing`,
        `${dim("notes")}        Obsidian + beads for project tracking`,
        `${dim("ai")}           Claude (Opus + Haiku) · Groq · GPT-5 occasionally`,
        "",
        dim("Full setup → ") + internalLink("/uses", "/uses"),
      ].join("\n"),
    }),
  },

  contact: {
    name: "contact",
    description: "get in touch",
    run: (_args, { profile }) => ({
      kind: "html",
      value: [
        serif("Get in touch"),
        "",
        `${dim("email")}        ${link(`mailto:${profile.email ?? "shoaib@example.com"}`, profile.email ?? "shoaib@example.com")}`,
        `${dim("github")}       ${profile.socialLinks?.github ? link(profile.socialLinks.github, profile.socialLinks.github.replace(/^https?:\/\//, "")) : dim("—")}`,
        `${dim("linkedin")}     ${profile.socialLinks?.linkedin ? link(profile.socialLinks.linkedin, profile.socialLinks.linkedin.replace(/^https?:\/\//, "")) : dim("—")}`,
        `${dim("twitter")}      ${profile.socialLinks?.twitter ? link(profile.socialLinks.twitter, profile.socialLinks.twitter.replace(/^https?:\/\//, "")) : dim("—")}`,
        "",
        `${dim("Prefer a meeting?")} ${accent("book")} to grab a 15-min slot.`,
        `${dim("Need the resume?")} ${accent("download cv")}`,
      ].join("\n"),
    }),
  },

  book: {
    name: "book",
    description: "schedule a call",
    run: () => ({
      kind: "html",
      value: [
        serif("Schedule a 15-minute call"),
        "",
        dim(
          "Best for: senior+ roles, technical co-founder conversations, infra/AI work.",
        ),
        "",
        link(
          "https://cal.com/shoaibuddin/intro",
          "→ cal.com/shoaibuddin/intro",
        ),
        "",
        dim("Reply SLA: 24h on weekdays."),
      ].join("\n"),
    }),
  },

  download: {
    name: "download",
    description: "download resume",
    run: (args) => {
      if (args[0] === "cv" || args[0] === "resume") {
        return {
          kind: "html",
          value: [
            dim("Initializing download..."),
            "",
            `${accent("→")} ${internalLink("/api/resume", "resume.pdf")} ${dim("· also available as ")} ${internalLink("/api/resume?format=md", "markdown")} ${dim("·")} ${internalLink("/api/resume?format=json", "json-resume")}`,
            "",
            dim("ATS-friendly. One-page and two-page variants available."),
          ].join("\n"),
        };
      }
      return { kind: "error", value: "download: try 'download cv'" };
    },
  },

  recruiter: {
    name: "recruiter",
    description: "static scan view",
    run: () => ({
      kind: "html",
      value: [
        dim("Switching to the scan-friendly view..."),
        "",
        `${accent("→")} ${internalLink("/v2?view=recruiter", "Open recruiter view")}`,
        "",
        dim(
          "No animations. Tagged stack. Years, location, availability, resume — all visible at once.",
        ),
      ].join("\n"),
    }),
  },

  ask: {
    name: "ask",
    description: "ask the codebase",
    run: (args) => {
      if (!args.length) {
        return {
          kind: "html",
          value: [
            dim("Usage: ") + accent('ask "<question>"'),
            "",
            dim("Examples:"),
            `  ${accent("›")} ask "how did you handle rate limiting?"`,
            `  ${accent("›")} ask "why postgres over dynamodb?"`,
            `  ${accent("›")} ask "show me your testing philosophy"`,
            "",
            dim(
              "This will be a RAG agent grounded in my code + decisions + posts. Coming soon.",
            ),
          ].join("\n"),
        };
      }
      const q = args.join(" ").replace(/^"|"$/g, "");
      return {
        kind: "html",
        value: [
          dim(`> ${escape(q)}`),
          "",
          dim(
            "[Codebase-aware agent not yet wired up. Tier 1.3 in the roadmap.]",
          ),
          "",
          dim("In the meantime, try ") +
            accent("cat decisions") +
            dim(" or email me directly."),
        ].join("\n"),
      };
    },
  },

  clear: {
    name: "clear",
    description: "clear screen",
    aliases: ["cls"],
    run: () => ({ kind: "clear" }),
  },

  echo: {
    name: "echo",
    description: "echo text",
    run: (args) => ({ kind: "text", value: args.join(" ") }),
  },

  open: {
    name: "open",
    description: "open a project",
    run: (args, { profile }) => {
      const name = args[0]?.toLowerCase();
      if (!name) {
        return {
          kind: "error",
          value: "open: missing project name. Try 'ls projects'.",
        };
      }
      const proj = profile.projects?.find(
        (p) =>
          p.title.toLowerCase().split(" ")[0] === name ||
          p.title.toLowerCase().includes(name),
      );
      if (!proj) {
        return {
          kind: "error",
          value: `open: project '${escape(name)}' not found. Try 'ls projects'.`,
        };
      }
      const lines = [
        `<div>${serif(proj.title)}</div>`,
        proj.tagline ? `${dim(proj.tagline)}` : "",
        "",
        proj.metrics ? `${dim("impact")}       ${accent(proj.metrics)}` : "",
        proj.stack?.length
          ? `${dim("stack")}        ${proj.stack.map((s) => accent(s)).join(" · ")}`
          : "",
        proj.url ? `${dim("live")}         ${link(proj.url, proj.url)}` : "",
        proj.github
          ? `${dim("source")}       ${link(proj.github, proj.github)}`
          : "",
      ].filter(Boolean);
      return { kind: "html", value: lines.join("\n") };
    },
  },

  banner: {
    name: "banner",
    description: "ascii banner",
    run: () => ({
      kind: "ascii",
      value: [
        "  ███████ ██   ██  ██████   █████  ██ ██████",
        "  ██      ██   ██ ██    ██ ██   ██ ██ ██   ██",
        "  ███████ ███████ ██    ██ ███████ ██ ██████",
        "       ██ ██   ██ ██    ██ ██   ██ ██ ██   ██",
        "  ███████ ██   ██  ██████  ██   ██ ██ ██████",
      ].join("\n"),
    }),
  },
};

const aliasMap: Record<string, string> = Object.fromEntries(
  Object.values(commands).flatMap((c) =>
    (c.aliases ?? []).map((a) => [a, c.name]),
  ),
);

export function resolveCommand(name: string): Command | undefined {
  const canonical = aliasMap[name] ?? name;
  return commands[canonical];
}

export function allCommandNames(): readonly string[] {
  return [...Object.keys(commands), ...Object.keys(aliasMap)].sort();
}

export function suggest(prefix: string): readonly string[] {
  const lower = prefix.toLowerCase();
  return allCommandNames().filter((c) => c.startsWith(lower));
}
