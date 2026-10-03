import Image from "next/image";

export type RulerRole = {
  key: string;
  company: string;
  start: string;
  end?: string | null;
  current?: boolean | null;
  /** Already-sized image URL, so this file stays free of the Sanity client. */
  logo?: string | null;
};

export type RulerBar = {
  key: string;
  left: number;
  width: number;
  current: boolean;
};

const monthIndex = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

/** DOM id of a role's row, so a bar can link to it. */
export const roleAnchor = (key: string) =>
  `role-${key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

/**
 * Pure layout on one lane: each role is a bar in percent of the span from
 * January of the first year to `now`. When roles overlap, the later one takes
 * over and the earlier bar stops where it starts; of two roles starting the
 * same month the longer one is drawn. The list below carries every role in
 * full, so the ruler only has to show the shape of the career.
 * ponytail: a short side gig inside a long role cuts the long role's tail off
 * the strip; move to lanes if that ever matters.
 */
export function layoutRuler(roles: RulerRole[], now: Date) {
  const nowEnd = monthIndex(now) + 1;
  const spans = roles
    .filter((r) => r.start)
    .map((r) => {
      const start = monthIndex(new Date(r.start));
      const live = Boolean(r.current || !r.end);
      const end = live
        ? nowEnd
        : Math.min(monthIndex(new Date(r.end as string)) + 1, nowEnd);
      return { key: r.key, start, end: Math.max(end, start + 1), live };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (spans.length === 0) return { bars: [], years: [] };

  const from = Math.floor(spans[0].start / 12) * 12;
  const at = (m: number) => ((m - from) / (nowEnd - from)) * 100;

  const bars: RulerBar[] = [];
  spans.forEach((s, i) => {
    const drawnEnd = Math.min(s.end, spans[i + 1]?.start ?? s.end);
    if (drawnEnd <= s.start) return;
    bars.push({
      key: s.key,
      left: at(s.start),
      width: at(drawnEnd) - at(s.start),
      current: s.live,
    });
  });

  const years: { year: number; left: number }[] = [];
  for (let y = from / 12; y * 12 < nowEnd; y++) {
    years.push({ year: y, left: at(y * 12) });
  }

  return { bars, years };
}

const fmt = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

/** Year labels past this point would collide with "Now". */
const LABEL_EDGE = 88;

export function CareerRuler({
  roles,
  now = new Date(),
}: {
  roles: RulerRole[];
  now?: Date;
}) {
  const { bars, years } = layoutRuler(roles, now);
  if (bars.length < 2) return null;
  const byKey = new Map(roles.map((r) => [r.key, r]));

  return (
    <nav aria-label="Career timeline" className="mb-10">
      <ol className="relative h-[30px]">
        {bars.map((bar) => {
          const role = byKey.get(bar.key);
          if (!role) return null;
          return (
            <li
              key={bar.key}
              className="absolute top-0"
              style={{
                left: `calc(${bar.left}% + 1px)`,
                width: `calc(${bar.width}% - 2px)`,
              }}
            >
              <a
                href={`#${roleAnchor(bar.key)}`}
                aria-label={`${role.company}, ${fmt(role.start)} to ${
                  bar.current ? "now" : fmt(role.end as string)
                }`}
                className="group block rounded-[3px]"
              >
                {role.logo ? (
                  <Image
                    src={role.logo}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 rounded-[4px] bg-white object-contain"
                  />
                ) : (
                  <span aria-hidden className="block size-4" />
                )}
                <span
                  aria-hidden
                  className={`mt-1.5 block h-[5px] rounded-full transition-colors duration-150 ${
                    bar.current
                      ? "bg-brand"
                      : "bg-foreground/20 group-hover:bg-foreground/60"
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ol>

      <div
        aria-hidden
        className="relative mt-1 h-6 border-t border-border text-[13px] tabular-nums text-muted-foreground"
      >
        {years
          .filter((y) => y.left <= LABEL_EDGE)
          .map((y) => (
            <span
              key={y.year}
              className="absolute top-1.5 pl-1.5 leading-none"
              style={{ left: `${y.left}%` }}
            >
              <span className="absolute -top-1.5 left-0 h-[9px] w-px bg-border" />
              {y.year}
            </span>
          ))}
        <span className="absolute top-1.5 right-0 leading-none">Now</span>
      </div>
    </nav>
  );
}
