import { PortableText } from "@portabletext/react";
import { IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";

const SERVICES_QUERY =
  defineQuery(`*[_type == "service"] | order(order asc, _createdAt desc){
  title,
  slug,
  icon,
  shortDescription,
  fullDescription,
  features,
  technologies[]->{name, category},
  deliverables,
  pricing,
  timeline,
  featured,
  order
}`);

export async function ServicesSection() {
  const { data: services } = await sanityFetch({ query: SERVICES_QUERY });

  if (!services || services.length === 0) {
    return null;
  }

  const formatPrice = (pricing: {
    startingPrice?: number;
    priceType?: string;
    description?: string;
  }) => {
    if (!pricing) return null;

    const { startingPrice, priceType, description } = pricing;

    const priceTypeLabels: Record<string, string> = {
      hourly: "/hour",
      project: "/project",
      monthly: "/month",
      custom: "",
    };

    if (priceType === "custom") {
      return (
        <span className="font-serif font-semibold text-brand">
          Custom Quote
        </span>
      );
    }

    return (
      <div>
        {startingPrice && (
          <span className="font-serif text-lg font-semibold text-brand">
            ${startingPrice.toLocaleString()}
            {priceType && priceTypeLabels[priceType]}
          </span>
        )}
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    );
  };

  // Featured services lead the grid; the rest follow in their query order.
  const ordered = [
    ...services.filter((s) => s.featured),
    ...services.filter((s) => !s.featured),
  ];

  return (
    <Section id="services">
      <SectionHeader
        eyebrow="Services"
        title="What I do"
        description="Ways we can work together, from focused builds to end-to-end delivery."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ordered.map((service) => (
          <div
            key={service.slug?.current || service.title}
            className="flex flex-col rounded-[10px] border border-border bg-card p-5 transition-colors hover:border-foreground/25"
          >
            {service.icon && (
              <div className="relative mb-4 h-8 w-8 text-brand">
                <Image
                  src={urlFor(service.icon).width(48).height(48).url()}
                  alt={service.title || "Service"}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            <h3 className="font-serif text-lg font-semibold text-foreground">
              {service.title}
            </h3>

            {service.shortDescription && (
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {service.shortDescription}
              </p>
            )}

            {service.fullDescription && (
              <div className="prose prose-sm dark:prose-invert mt-3 max-w-none text-muted-foreground">
                <PortableText value={service.fullDescription} />
              </div>
            )}

            {service.features && service.features.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {service.features.slice(0, 4).map((feature, idx) => (
                  <li
                    key={`${service.title}-feature-${idx}`}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {service.technologies && service.technologies.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {service.technologies.map((tech, idx) => {
                  const techData =
                    tech && typeof tech === "object" && "name" in tech
                      ? tech
                      : null;
                  return techData?.name ? (
                    <span
                      key={`${service.title}-tech-${idx}`}
                      className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {techData.name}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {(service.pricing || service.timeline) && (
              <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
                {service.pricing && <div>{formatPrice(service.pricing)}</div>}
                {service.timeline && (
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {service.timeline}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
