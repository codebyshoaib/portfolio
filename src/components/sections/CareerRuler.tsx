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

export type RulerGap = { left: number; width: number; label: string };

/** An empty stretch this long between bars gets marked on the strip. */
const MIN_GAP_MONTHS = 6;
// ponytail: one fixed label; derive per-gap labels from Sanity education entries if gaps ever mean different things.
const GAP_LABEL = "Study gap";

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

  if (spans.length === 0) return { bars: [], gaps: [], years: [] };

  const from = Math.floor(spans[0].start / 12) * 12;
  const at = (m: number) => ((m - from) / (nowEnd - from)) * 100;

  const bars: RulerBar[] = [];
  const gaps: RulerGap[] = [];
  let prevEnd: number | null = null;
  spans.forEach((s, i) => {
    const drawnEnd = Math.min(s.end, spans[i + 1]?.start ?? s.end);
    if (drawnEnd <= s.start) return;
    if (prevEnd !== null && s.start - prevEnd >= MIN_GAP_MONTHS) {
      gaps.push({
        left: at(prevEnd),
        width: at(s.start) - at(prevEnd),
        label: GAP_LABEL,
      });
    }
    prevEnd = drawnEnd;
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

  return { bars, gaps, years };
}

const fmt = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

/** Year labels past this point would collide with "Now". */
const LABEL_EDGE = 88;
/** Below this width (percent) "Study gap" would overflow its stretch. */
const GAP_LABEL_MIN_WIDTH = 8;

export function CareerRuler({
  roles,
  now = new Date(),
}: {
  roles: RulerRole[];
  now?: Date;
}) {
  const { bars, gaps, years } = layoutRuler(roles, now);
  if (bars.length < 2) return null;
  const byKey = new Map(roles.map((r) => [r.key, r]));

  return (
    <nav aria-label="Career timeline" className="mb-10">
      <ol className="relative h-9">
        {gaps.map((gap) => (
          <li
            key={gap.left}
            aria-hidden
            className="absolute top-0"
            style={{
              left: `calc(${gap.left}% + 1px)`,
              width: `calc(${gap.width}% - 2px)`,
            }}
          >
            {/* The 22px logo slot holds the label; the line sits on the bars' centre (22px + 8px). */}
            <span className="block h-[22px] truncate text-center text-[11px] leading-[22px] text-muted-foreground">
              {gap.width >= GAP_LABEL_MIN_WIDTH ? gap.label : null}
            </span>
            <span className="mt-2 block border-t border-dashed border-foreground/25" />
          </li>
        ))}
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
                    width={22}
                    height={22}
                    className="size-[22px] rounded-[5px] bg-white object-contain"
                  />
                ) : (
                  <span aria-hidden className="block size-[22px]" />
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
