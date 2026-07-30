/**
 * Convert a narrow subset of Markdown into Sanity Portable Text blocks
 * that match the decision schema (block, codeBlock).
 *
 * Supported:
 *  - Paragraphs
 *  - H2 (##), H3 (###)
 *  - Blockquotes (>)
 *  - Bulleted lists (-, *)
 *  - Fenced code blocks (```lang ... ```)
 *  - Inline: **bold**, *em*, `code`, [text](url)
 *
 * Not supported: tables, images, ordered lists, nested lists, HTML inline.
 * Add support only when an ADR actually needs it.
 */

import { randomUUID } from "node:crypto";

interface Mark {
  readonly _key: string;
  readonly _type: string;
  readonly href?: string;
}

interface Span {
  readonly _type: "span";
  readonly _key: string;
  readonly text: string;
  readonly marks: string[];
}

interface BlockNode {
  readonly _type: "block";
  readonly _key: string;
  readonly style: "normal" | "h2" | "h3" | "blockquote";
  readonly listItem?: "bullet";
  readonly level?: number;
  readonly markDefs: Mark[];
  readonly children: Span[];
}

interface CodeBlockNode {
  readonly _type: "codeBlock";
  readonly _key: string;
  readonly language: string;
  readonly code: string;
  readonly caption?: string;
}

export type PortableTextNode = BlockNode | CodeBlockNode;

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);

function parseInline(text: string): { children: Span[]; markDefs: Mark[] } {
  const markDefs: Mark[] = [];
  const children: Span[] = [];

  // Tokens: [text, marks[]]
  type Token = { text: string; marks: string[] };
  let tokens: Token[] = [{ text, marks: [] }];

  const splitOn = (
    re: RegExp,
    transform: (m: RegExpExecArray) => { text: string; addMark: string },
  ) => {
    const next: Token[] = [];
    for (const t of tokens) {
      if (t.marks.includes("__frozen")) {
        next.push(t);
        continue;
      }
      let last = 0;
      const r = new RegExp(re.source, re.flags);
      let m = r.exec(t.text);
      while (m) {
        if (m.index > last) {
          next.push({ text: t.text.slice(last, m.index), marks: t.marks });
        }
        const { text: innerText, addMark } = transform(m);
        next.push({ text: innerText, marks: [...t.marks, addMark] });
        last = m.index + m[0].length;
        m = r.exec(t.text);
      }
      if (last < t.text.length) {
        next.push({ text: t.text.slice(last), marks: t.marks });
      }
    }
    tokens = next;
  };

  // Links — must run before * and _ so labels with emphasis still work.
  splitOn(/\[([^\]]+)\]\(([^)]+)\)/g, (m) => {
    const _key = key();
    markDefs.push({ _key, _type: "link", href: m[2] });
    return { text: m[1], addMark: _key };
  });

  // Inline code (freeze content so we don't re-parse bold inside)
  const codeTokens: Token[] = [];
  for (const t of tokens) {
    let last = 0;
    const r = /`([^`]+)`/g;
    let m = r.exec(t.text);
    while (m) {
      if (m.index > last) {
        codeTokens.push({ text: t.text.slice(last, m.index), marks: t.marks });
      }
      codeTokens.push({
        text: m[1],
        marks: [...t.marks, "code", "__frozen"],
      });
      last = m.index + m[0].length;
      m = r.exec(t.text);
    }
    if (last < t.text.length) {
      codeTokens.push({ text: t.text.slice(last), marks: t.marks });
    }
  }
  tokens = codeTokens;

  splitOn(/\*\*([^*]+)\*\*/g, (m) => ({ text: m[1], addMark: "strong" }));
  splitOn(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (m) => ({
    text: m[1],
    addMark: "em",
  }));

  for (const t of tokens) {
    if (!t.text) continue;
    children.push({
      _type: "span",
      _key: key(),
      text: t.text,
      marks: t.marks.filter((m) => m !== "__frozen"),
    });
  }

  return { children, markDefs };
}

function paragraph(
  text: string,
  style: BlockNode["style"] = "normal",
  listItem?: "bullet",
): BlockNode {
  const { children, markDefs } = parseInline(text);
  const node: BlockNode = {
    _type: "block",
    _key: key(),
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  };
  return node;
}

export function markdownToPortableText(md: string): PortableTextNode[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: PortableTextNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip blanks
    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code
    const fence = line.match(/^```(\w+)?\s*(.*)?$/);
    if (fence) {
      const language = (fence[1] ?? "text").toLowerCase();
      const caption = fence[2]?.trim() || undefined;
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      out.push({
        _type: "codeBlock",
        _key: key(),
        language,
        code: buf.join("\n"),
        ...(caption ? { caption } : {}),
      });
      continue;
    }

    // Headings
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      out.push(paragraph(h2[1], "h2"));
      i++;
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      out.push(paragraph(h3[1], "h3"));
      i++;
      continue;
    }

    // Blockquote (single line at a time)
    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      const buf = [bq[1]];
      i++;
      while (i < lines.length) {
        const m = lines[i].match(/^>\s?(.*)$/);
        if (!m) break;
        buf.push(m[1]);
        i++;
      }
      out.push(paragraph(buf.join(" ").trim(), "blockquote"));
      continue;
    }

    // Bulleted list
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      while (i < lines.length) {
        const m = lines[i].match(/^[-*]\s+(.+)$/);
        if (!m) break;
        out.push(paragraph(m[1], "normal", "bullet"));
        i++;
      }
      continue;
    }

    // Paragraph: consume until a blank line or block boundary
    const buf = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (!next.trim()) break;
      if (/^(##\s|###\s|>\s|[-*]\s|```)/.test(next)) break;
      buf.push(next);
      i++;
    }
    out.push(paragraph(buf.join(" ").trim()));
  }

  return out;
}
