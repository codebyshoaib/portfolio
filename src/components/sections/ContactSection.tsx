import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";
import { BookACallButton } from "../BookACallButton";
import WorldMapWrapper from "../world-map-wrapper";
import { ContactForm } from "./ContactForm";

const PROFILE_QUERY = defineQuery(`*[_id == "singleton-profile"][0]{
  email,
  phone,
  location,
  socialLinks,
  calLink
}`);

export async function ContactSection() {
  const { data: profile } = await sanityFetch({ query: PROFILE_QUERY });

  if (!profile) {
    return null;
  }

  return (
    <Section id="contact">
      <WorldMapWrapper />

      <SectionHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Wherever you are in the world, let's work together on your next project."
      />

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        {/* Invitation copy + contact facts */}
        <div>
          <p className="max-w-[48ch] leading-relaxed text-muted-foreground">
            Have a project in mind, a role to fill, or just want to compare
            notes? Send a message and I'll get back to you.
          </p>

          <div className="mt-8 space-y-4">
            {profile.email && (
              <div className="flex items-center gap-3">
                <MailIcon className="h-4 w-4 flex-shrink-0 text-brand" />
                <Link
                  href={`mailto:${profile.email}`}
                  className="font-mono text-[13px] text-muted-foreground transition-colors hover:text-brand"
                >
                  {profile.email}
                </Link>
              </div>
            )}

            {profile.phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-4 w-4 flex-shrink-0 text-brand" />
                <Link
                  href={`tel:${profile.phone}`}
                  className="font-mono text-[13px] text-muted-foreground transition-colors hover:text-brand"
                >
                  {profile.phone}
                </Link>
              </div>
            )}

            {profile.location && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-4 w-4 flex-shrink-0 text-brand" />
                <span className="font-mono text-[13px] text-muted-foreground">
                  {profile.location}
                </span>
              </div>
            )}
          </div>

          {profile.calLink && (
            <div className="mt-8">
              <BookACallButton calLink={profile.calLink} />
              <p className="mt-2 text-sm text-muted-foreground">
                Prefer to talk? Grab a slot on my calendar.
              </p>
            </div>
          )}

          {profile.socialLinks && (
            <div className="mt-8">
              <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Follow me
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.socialLinks.github && (
                  <Link
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                  >
                    GitHub
                  </Link>
                )}
                {profile.socialLinks.linkedin && (
                  <Link
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                  >
                    LinkedIn
                  </Link>
                )}
                {profile.socialLinks.twitter && (
                  <Link
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                  >
                    Twitter
                  </Link>
                )}
                {profile.socialLinks.website && (
                  <Link
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                  >
                    Website
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Form */}
        <ContactForm />
      </div>
    </Section>
  );
}
