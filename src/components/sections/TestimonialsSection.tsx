import Image from "next/image";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";

const TESTIMONIALS_QUERY =
  defineQuery(`*[_type == "testimonial" && featured == true] | order(order asc){
  name,
  position,
  company,
  testimonial,
  rating,
  date,
  avatar,
  companyLogo,
  linkedinUrl
}`);

export async function TestimonialsSection() {
  const { data: testimonials } = await sanityFetch({
    query: TESTIMONIALS_QUERY,
  });

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <Section id="testimonials">
      <SectionHeader
        eyebrow="Testimonials"
        title="What people say"
        description="Words from the people I've built with, managed, and shipped for."
      />

      <div className="grid gap-px overflow-hidden rounded-[10px] border border-border bg-border sm:grid-cols-2">
        {testimonials.map((testimonial) => {
          const name = testimonial.name || "Anonymous";
          const role = testimonial.company
            ? testimonial.position
              ? `${testimonial.position}, ${testimonial.company}`
              : testimonial.company
            : testimonial.position || "";
          const avatarUrl = testimonial.avatar
            ? urlFor(testimonial.avatar).width(80).height(80).url()
            : null;

          return (
            <figure
              key={`${name}-${role}`}
              className="flex flex-col bg-card p-6 md:p-8"
            >
              <blockquote className="relative flex-1">
                <span
                  aria-hidden
                  className="absolute -left-1 -top-3 font-serif text-4xl leading-none text-brand/40 select-none"
                >
                  &ldquo;
                </span>
                <p className="font-serif text-lg leading-relaxed text-foreground">
                  {testimonial.testimonial}
                </p>
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                {avatarUrl && (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    width={40}
                    height={40}
                    className="h-10 w-10 flex-none rounded-full object-cover"
                  />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{name}</div>
                  {role && (
                    <div className="truncate text-sm text-muted-foreground">
                      {role}
                    </div>
                  )}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Section>
  );
}
