import { describe, expect, it } from "vitest";
import {
  countAllWords,
  countPortableTextWords,
  countWords,
  readingMinutes,
} from "../reading-time";

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("collapses newlines and runs of whitespace", () => {
    expect(countWords("one\n\n  two\tthree \n")).toBe(3);
  });

  it("returns 0 for absent or blank text", () => {
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
    expect(countWords("   \n ")).toBe(0);
  });
});

describe("countAllWords", () => {
  it("sums across fields and ignores holes", () => {
    expect(countAllWords(["a b", null, "c", undefined, ""])).toBe(3);
  });
});

describe("countPortableTextWords", () => {
  it("counts text spans across blocks", () => {
    const blocks = [
      { _type: "block", children: [{ _type: "span", text: "one two" }] },
      {
        _type: "block",
        children: [
          { _type: "span", text: "three" },
          { _type: "span", text: "four five" },
        ],
      },
    ];
    expect(countPortableTextWords(blocks)).toBe(5);
  });

  it("skips blocks with no children array, e.g. code blocks", () => {
    const blocks = [
      { _type: "codeBlock", code: "const a = 1; const b = 2;" },
      { _type: "block", children: [{ _type: "span", text: "prose here" }] },
    ];
    expect(countPortableTextWords(blocks)).toBe(2);
  });

  it("tolerates malformed spans", () => {
    const blocks = [
      { _type: "block", children: [null, { _type: "span" }, { text: 42 }] },
    ];
    expect(countPortableTextWords(blocks)).toBe(0);
  });

  it("returns 0 for an absent body", () => {
    expect(countPortableTextWords(null)).toBe(0);
    expect(countPortableTextWords(undefined)).toBe(0);
  });
});

describe("readingMinutes", () => {
  it("rounds to the nearest minute at 200wpm", () => {
    expect(readingMinutes(400)).toBe(2);
    expect(readingMinutes(441)).toBe(2);
    expect(readingMinutes(914)).toBe(5);
  });

  it("never returns less than one minute", () => {
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(12)).toBe(1);
  });
});
