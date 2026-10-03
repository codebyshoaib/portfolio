import { Section, SectionHeader } from "@/components/sections/Section";
import { GITHUB_USER, getOpenSource, type Status } from "@/lib/open-source";

const LABEL: Record<Status, string> = {
  merged: "Merged",
  open: "Open",
  closed: "Closed",
};

/** Shape carries the status as well as colour: solid = merged, ring = open, faint = closed. */
const DOT: Record<Status, string> = {
  merged: "bg-brand",
  open: "border border-brand",
  closed: "bg-muted-foreground/40",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export async function OpenSourceSection() {
  const groups = await getOpenSource();
  if (!groups || groups.length === 0) return null;

  const merged = groups
    .flatMap((g) => g.items)
    .filter((i) => i.status === "merged").length;

  return (
    <Section id="open-source">
      <SectionHeader
        eyebrow="Open source"
        title="Open source"
        description={`Pull requests and issues on other people's projects. ${merged} merged so far.`}
      />

      <div className="space-y-10">
        {groups.map((group) => (
          <section
            key={group.repo}
            aria-labelledby={`os-${group.repo}`}
            className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-8"
          >
            <h3
              id={`os-${group.repo}`}
              className="font-sans text-[15px] font-medium leading-snug text-foreground sm:pt-3"
            >
              <a
                href={`https://github.com/${group.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words underline-offset-4 hover:underline"
              >
                {group.repo}
              </a>
            </h3>

            <ul className="divide-y divide-border border-t border-border sm:border-t-0">
              {group.items.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-[3px] px-3 py-3 transition-colors hover:bg-accent"
                  >
                    <span className="text-sm leading-snug text-foreground text-pretty">
                      {item.title}
                    </span>
                    <span className="row-span-2 whitespace-nowrap pt-px text-[13px] tabular-nums text-muted-foreground">
                      {fmt(item.date)}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <span
                        aria-hidden
                        className={`inline-block size-2 rounded-full ${DOT[item.status]}`}
                      />
                      {LABEL[item.status]}{" "}
                      {item.kind === "pr" ? "pull request" : "issue"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 text-[13px] text-muted-foreground">
        <a
          href={`https://github.com/${GITHUB_USER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          More on GitHub
        </a>
      </p>
    </Section>
  );
}
