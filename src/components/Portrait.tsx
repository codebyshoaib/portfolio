import Image from "next/image";

/**
 * Single, art-directed portrait — duotone toward the brand teal by default,
 * true color on hover. Replaces the auto-rotating ProfileImageCarousel (a
 * rotating gallery of oneself reads junior; one toned image reads considered).
 *
 * The duotone is CSS-only (grayscale image + a brand-colored `color`-blend
 * overlay), so this stays a server component. Both layers transition, so the
 * reduced-motion baseline in globals.css neutralizes them for free.
 */
export function Portrait({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="portrait-duotone relative aspect-square w-full overflow-hidden rounded-[10px] border border-border">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 280px, 320px"
        className="object-cover"
        priority
      />
    </figure>
  );
}
