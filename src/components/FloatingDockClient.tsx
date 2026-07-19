"use client";

import { IconCalendarEvent, IconLogout, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSafeClerk } from "@/hooks/use-safe-clerk";
import { cn } from "@/lib/utils";
import { useBookACall } from "./BookACallButton";
import { DynamicIcon } from "./DynamicIcon";

interface NavItem {
  title?: string | null;
  href?: string | null;
  icon?: string | null;
  isExternal?: boolean | null;
}

interface FloatingDockClientProps {
  navItems: NavItem[];
  calLink?: string | null;
}

// Same-page section anchors (href contains "#") become the scroll-spy index;
// everything external (socials, off-site links) drops to the footer icon row.
const isSectionAnchor = (item: NavItem) =>
  !item.isExternal && Boolean(item.href?.includes("#"));

const sectionIdOf = (href?: string | null) => href?.split("#")[1] ?? "";

/**
 * Side index rail — a fixed vertical section index on the left edge.
 *
 * Resting state is just tick marks + the active section's label, so the rail's
 * footprint stays inside the left gutter and never collides with the centered
 * content measure (max-w-6xl), regardless of how long CMS labels get. Hovering
 * or focusing the rail expands the full labels, the "Book a call" CTA, and the
 * social links. Below xl the rail is replaced by a top-left menu sheet.
 *
 * Vocabulary (mono eyebrow · hairline tick · brand accent) mirrors the editorial
 * Section system so the nav reads as part of the same identity.
 */
export function FloatingDockClient({
  navItems,
  calLink,
}: FloatingDockClientProps) {
  const { isSignedIn, signOut } = useSafeClerk();
  const { openModal: openBooking, enabled: bookingEnabled } =
    useBookACall(calLink);

  const sections = navItems.filter(isSectionAnchor);
  const socials = navItems.filter((i) => i.isExternal);

  const [activeId, setActiveId] = useState(() =>
    sectionIdOf(sections[0]?.href),
  );
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll-spy: the section whose middle is nearest the viewport middle wins.
  useEffect(() => {
    const ids = sections.map((s) => sectionIdOf(s.href)).filter(Boolean);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const ratios = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        let best = "";
        let max = -1;
        for (const id of ids) {
          const r = ratios.get(id) ?? 0;
          if (r > max) {
            max = r;
            best = id;
          }
        }
        if (best) setActiveId(best);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [sections]);

  // Close the mobile sheet on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (sections.length === 0 && socials.length === 0 && !bookingEnabled) {
    return null;
  }

  const bookAction = bookingEnabled ? (
    <button
      type="button"
      onClick={() => {
        openBooking();
        setMenuOpen(false);
      }}
      className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 font-sans text-[13px] font-semibold text-brand-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
    >
      <IconCalendarEvent className="size-4" aria-hidden="true" />
      Book a call
    </button>
  ) : null;

  const socialLinks = socials.map((item) => (
    <Link
      key={`${item.title}-${item.href}`}
      href={item.href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.title || "External link"}
      title={item.title || undefined}
      className="text-muted-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
    >
      <DynamicIcon iconName={item.icon || "IconLink"} className="size-[18px]" />
    </Link>
  ));

  const signOutButton =
    isSignedIn && signOut ? (
      <button
        type="button"
        onClick={() => signOut()}
        aria-label="Sign out"
        title="Sign out"
        className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
      >
        <IconLogout className="size-[18px]" aria-hidden="true" />
      </button>
    ) : null;

  return (
    <>
      {/* ---------- Desktop: side index rail (xl+) ---------- */}
      <nav
        aria-label="Section navigation"
        className="group/rail fixed left-8 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-start gap-0.5 xl:flex"
      >
        {sections.map((item) => {
          const id = sectionIdOf(item.href);
          const active = id === activeId;
          return (
            <a
              key={`${item.title}-${item.href}`}
              href={item.href || "#"}
              aria-current={active ? "true" : undefined}
              className="group/item flex items-center gap-3 py-1.5 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "h-px rounded-full transition-all duration-300 ease-out motion-reduce:transition-none",
                  active
                    ? "w-9 bg-brand"
                    : "w-4 bg-muted-foreground/40 group-hover/item:w-6 group-hover/item:bg-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "font-mono text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ease-out motion-reduce:transition-none",
                  // Resting: only the active label shows. Hover/focus the rail
                  // reveals the rest.
                  active
                    ? "text-foreground opacity-100"
                    : "-translate-x-1 text-muted-foreground opacity-0 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 group-hover/item:text-foreground",
                )}
              >
                {item.title}
              </span>
            </a>
          );
        })}

        {/* Footer: CTA + socials, revealed with the rail */}
        {(bookAction || socialLinks.length > 0 || signOutButton) && (
          <div className="mt-5 flex flex-col items-start gap-4 opacity-0 transition-opacity duration-300 ease-out group-hover/rail:opacity-100 group-focus-within/rail:opacity-100 motion-reduce:transition-none">
            {bookAction}
            {(socialLinks.length > 0 || signOutButton) && (
              <div className="flex items-center gap-3.5 pl-0.5">
                {socialLinks}
                {signOutButton}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ---------- Mobile / tablet: top-left menu sheet (< xl) ---------- */}
      <div className="fixed left-4 top-4 z-40 xl:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="rail-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex size-11 items-center justify-center rounded-full border border-border bg-background/70 text-foreground shadow-sm backdrop-blur-xl transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
        >
          {menuOpen ? (
            <IconX className="size-5" aria-hidden="true" />
          ) : (
            <MenuGlyph />
          )}
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              className="fixed inset-0 -z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div
              id="rail-menu"
              className="absolute left-0 top-14 flex w-56 flex-col gap-1 rounded-2xl border border-border bg-popover p-3 shadow-xl"
            >
              {sections.map((item) => {
                const id = sectionIdOf(item.href);
                const active = id === activeId;
                return (
                  <a
                    key={`${item.title}-${item.href}-m`}
                    href={item.href || "#"}
                    aria-current={active ? "true" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors motion-reduce:transition-none",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-px w-4 rounded-full",
                        active ? "bg-brand" : "bg-muted-foreground/40",
                      )}
                    />
                    {item.title}
                  </a>
                );
              })}

              {(bookAction || socialLinks.length > 0 || signOutButton) && (
                <div className="mt-2 flex flex-col gap-3 border-t border-border pt-3">
                  {bookAction}
                  {(socialLinks.length > 0 || signOutButton) && (
                    <div className="flex items-center gap-4 px-1">
                      {socialLinks}
                      {signOutButton}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Two hairline bars — an index glyph that matches the rail's tick language
// rather than a generic hamburger.
function MenuGlyph() {
  return (
    <span className="flex flex-col items-start gap-1.5" aria-hidden="true">
      <span className="h-px w-5 rounded-full bg-current" />
      <span className="h-px w-3.5 rounded-full bg-current" />
    </span>
  );
}
