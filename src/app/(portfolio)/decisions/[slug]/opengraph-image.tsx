import { ImageResponse } from "next/og";
import { defineQuery } from "next-sanity";
import { SITE_URL } from "@/lib/site";
import { client } from "@/sanity/lib/client";
import { ADR_NUMBER_PROJECTION } from "@/sanity/lib/decisionOrder";

export const alt = "Engineering decision — Shoaib Ud Din";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const OG_QUERY = defineQuery(`
  *[_type == "decision" && slug.current == $slug && published == true][0] {
    title,
    date,
    status,
    ${ADR_NUMBER_PROJECTION}
  }
`);

interface OgDecision {
  readonly title: string | null;
  readonly date: string | null;
  readonly status: string | null;
  readonly adrNumber: number | null;
}

/* Flattened from the site's oklch tokens — satori has no oklch() or CSS
 * custom-property support, so the dark-theme palette is inlined here.
 * Keep in sync with globals.css / editorial.css if the brand moves. */
const GROUND = "#0A0F10"; // --background (dark)
const INK = "#E2E8E7"; // --foreground (dark)
const BRAND = "#71C6BA"; // --brand (dark)
const MUTED = "rgba(226, 232, 231, 0.62)";
const HAIRLINE = "rgba(226, 232, 231, 0.14)";

const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

const STATUS_COLOR: Record<string, string> = {
  accepted: "#39c684",
  proposed: "#7097db",
  deprecated: "#db6857",
  superseded: "#efac39",
};

/** Schema allows titles up to 160 chars; three steps keep the longest clear of
 *  the footer rule. */
function titleSize(title: string): number {
  if (title.length > 110) return 44;
  if (title.length > 72) return 58;
  return 70;
}

function isoDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // A missing or unpublished slug must still produce an image — the OG route is
  // hit by crawlers on stale links, and throwing here would 500 the metadata.
  let decision: OgDecision | null = null;
  try {
    decision = await client.fetch<OgDecision | null>(
      OG_QUERY,
      { slug },
      { stega: false },
    );
  } catch (error) {
    console.error("[decisions/og] fetch failed for slug", slug, error);
  }

  const title = decision?.title ?? "Engineering decisions";
  const status = (decision?.status ?? "accepted").toUpperCase();
  const statusColor =
    STATUS_COLOR[decision?.status ?? "accepted"] ?? STATUS_COLOR.accepted;
  const adr = decision?.adrNumber
    ? `ADR-${String(decision.adrNumber).padStart(3, "0")}`
    : "DECISION LOG";
  const date = isoDate(decision?.date ?? null);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: GROUND,
        padding: "72px 80px",
        // A single brand rule down the left edge — the same device the
        // decision block uses on the page.
        borderLeft: `10px solid ${BRAND}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            color: BRAND,
          }}
        >
          {adr}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: titleSize(title),
            fontWeight: 600,
            lineHeight: 1.15,
            color: INK,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: 28,
          fontSize: 24,
          letterSpacing: 3,
          color: MUTED,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 14,
            height: 14,
            borderRadius: 7,
            background: statusColor,
            marginRight: 14,
          }}
        />
        <div style={{ display: "flex", color: statusColor }}>{status}</div>
        {/* Separator gets margins, not spaces — satori trims leading and
            trailing whitespace inside a text node. */}
        {date ? (
          <>
            <div style={{ display: "flex", margin: "0 12px" }}>·</div>
            <div style={{ display: "flex" }}>{date}</div>
          </>
        ) : null}
        <div style={{ display: "flex", marginLeft: "auto", color: MUTED }}>
          {`${SITE_HOST}/decisions`}
        </div>
      </div>
    </div>,
    size,
  );
}
