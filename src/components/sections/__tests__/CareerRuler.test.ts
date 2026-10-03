import { describe, expect, it } from "vitest";
import { layoutRuler, roleAnchor } from "../CareerRuler";

const now = new Date("2026-01-15T00:00:00Z");

describe("layoutRuler", () => {
  it("starts the axis at January of the first year and ends at now", () => {
    const { bars, years } = layoutRuler(
      [
        { key: "b", company: "B", start: "2024-01-01", current: true },
        { key: "a", company: "A", start: "2022-06-01", end: "2023-12-01" },
      ],
      now,
    );
    expect(years[0]).toEqual({ year: 2022, left: 0 });
    expect(bars[0].key).toBe("a");
    expect(bars[0].left).toBeGreaterThan(0);
    expect(bars[1].left + bars[1].width).toBeCloseTo(100);
    expect(bars[1].current).toBe(true);
  });

  it("stops an overlapped role where the next one starts", () => {
    const { bars } = layoutRuler(
      [
        { key: "old", company: "O", start: "2024-01-01", end: "2025-05-01" },
        { key: "new", company: "N", start: "2025-03-01", current: true },
      ],
      now,
    );
    const [old, next] = bars;
    expect(old.left + old.width).toBeCloseTo(next.left);
  });

  it("draws the longer of two roles starting the same month", () => {
    const { bars } = layoutRuler(
      [
        { key: "long", company: "L", start: "2025-03-01", end: "2026-01-01" },
        { key: "short", company: "S", start: "2025-03-01", end: "2025-11-01" },
        { key: "first", company: "F", start: "2024-01-01", end: "2025-01-01" },
      ],
      now,
    );
    expect(bars.map((b) => b.key)).toEqual(["first", "long"]);
  });

  it("ignores roles without a start date", () => {
    expect(
      layoutRuler([{ key: "x", company: "X", start: "" }], now).bars,
    ).toEqual([]);
  });
});

describe("roleAnchor", () => {
  it("makes a URL-safe id", () => {
    expect(roleAnchor("MetaVision, Islamabad-Dev-2025-03-01")).toBe(
      "role-metavision-islamabad-dev-2025-03-01",
    );
  });
});
