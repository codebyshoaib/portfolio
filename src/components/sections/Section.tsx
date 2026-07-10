import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial section shell — full-width frame with a top hairline rule; the
 * reading content sits on a centered measure. Shared by every portfolio
 * section so the identity is consistent site-wide. Vocabulary mirrors the
 * /decisions editorial system (mono eyebrow · index · rule · serif title).
 */
export function Section({
  id,
  children,
  className,
  bare = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Drop the top border (e.g. the hero, which is the first block). */
  bare?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("w-full", !bare && "border-t border-border", className)}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10 lg:px-16 py-16 md:py-24">
        {children}
      </div>
    </section>
  );
}

/**
 * Editorial section header: mono eyebrow + optional numeric index + hairline
 * rule, then an optional serif title and description. The index only appears
 * when the content is genuinely a sequence the reader benefits from.
 */
export function SectionHeader({
  eyebrow,
  index,
  title,
  description,
  action,
}: {
  eyebrow: string;
  index?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 md:mb-12">
      <div className="flex items-center gap-4">
        {index && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground/60">
            {index}
          </span>
        )}
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </span>
        <span aria-hidden className="h-px flex-1 bg-border" />
        {action}
      </div>
      {title && (
        <h2 className="mt-5 font-serif text-3xl md:text-4xl font-semibold tracking-tight text-balance max-w-[22ch]">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-3 max-w-[60ch] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
