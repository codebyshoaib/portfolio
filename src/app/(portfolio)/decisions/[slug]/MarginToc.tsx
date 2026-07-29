"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  readonly id: string;
  readonly label: string;
}

/**
 * Marginalia table of contents.
 *
 * The anchors are plain `href="#id"` links rendered on the server, so the TOC
 * navigates with JavaScript disabled — the client half only adds the "you are
 * here" marker. Jumps are native (no smooth scrolling), which is already
 * reduced-motion safe; `scroll-margin-top` on the target sections keeps the
 * headers clear of the viewport edge.
 */
export function MarginToc({ items }: { readonly items: readonly TocItem[] }) {
  // Default to the first item: at scroll 0 the observer has nothing to report
  // yet, and a TOC that loads with nothing marked looks broken.
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // The band skims the top of the viewport so the marker tracks what is being
    // read. The bottom margin stays shallow on purpose: trimmed too far, a short
    // final section can never enter the band at maximum scroll and its TOC entry
    // never lights up.
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // First in document order wins; if the band is empty (between sections)
        // keep the previous mark rather than flickering to nothing.
        const first = items.find((item) => visible.has(item.id));
        if (first) setActiveId(first.id);
      },
      { rootMargin: "-10% 0px -20% 0px" },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="margin-toc-item"
            data-active={active ? "true" : undefined}
            aria-current={active ? "location" : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </>
  );
}
