import { ImageResponse } from "next/og";
import { defineQuery } from "next-sanity";
import { SITE_URL } from "@/lib/site";
import { client } from "@/sanity/lib/client";

export const alt = "Engineering decisions log — Shoaib Ud Din";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const COUNT_QUERY = defineQuery(
  `count(*[_type == "decision" && published == true])`,
);

/* Flattened from the site's oklch tokens — satori has no oklch() or CSS
 * custom-property support, so the dark-theme palette is inlined here. */
const GROUND = "#0A0F10"; // --background (dark)
const INK = "#E2E8E7"; // --foreground (dark)
const BRAND = "#71C6BA"; // --brand (dark)
const MUTED = "rgba(226, 232, 231, 0.62)";
const HAIRLINE = "rgba(226, 232, 231, 0.14)";

const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

export default async function Image() {
  // The card is legible without the count, so a fetch failure degrades rather
  // than breaking metadata for the whole index.
  let count = 0;
  try {
    count =
      (await client.fetch<number>(COUNT_QUERY, {}, { stega: false })) ?? 0;
  } catch (error) {
    console.error("[decisions/og] count fetch failed", error);
  }

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
          /DECISIONS · CHANGELOG
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
            fontSize: 78,
            fontWeight: 600,
            lineHeight: 1.1,
            color: INK,
          }}
        >
          <div style={{ display: "flex" }}>What I chose,</div>
          <div style={{ display: "flex", color: BRAND }}>
            and the bill it ran up.
          </div>
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
        <div style={{ display: "flex" }}>
          {count === 1 ? "1 PUBLIC ADR" : `${count} PUBLIC ADRS`}
        </div>
        <div style={{ display: "flex", marginLeft: "auto" }}>
          {`${SITE_HOST}/decisions`}
        </div>
      </div>
    </div>,
    size,
  );
}
