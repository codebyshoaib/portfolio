import { CheckCircle, MailIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { BookACallButton } from "../BookACallButton";
import { Portrait } from "../Portrait";
import { ResumeDownloadButton } from "../ResumeDownloadButton";

const HERO_QUERY = defineQuery(`*[_id== "singleton-profile"][0] {
  firstName,
  lastName,
  headline,
  headlineStaticText,
  headlineAnimatedWords,
  headlineAnimationDuration,
  shortBio,
  fullBio,
  email,
  phone,
  location,
  availability,
  socialLinks,
  calLink,
  yearsOfExperience,
  profileImage,
  profileImages,
}`);

const LATEST_RESUME_QUERY =
  defineQuery(`*[_type == "resume"] | order(isActive desc, uploadDate desc)[0] {
  _id,
  title,
  resumeFile,
  version,
  isActive,
  uploadDate
}`);

// Shared styles for the editorial link row.
const brandLink =
  "text-[15px] font-medium text-brand border-b-[1.5px] border-brand/50 hover:border-brand pb-0.5 transition-colors";
const plainLink =
  "text-[15px] text-muted-foreground border-b border-border hover:text-foreground hover:border-foreground/40 pb-0.5 transition-colors";

export default async function HeroSection() {
  const [{ data: profile }, { data: latestResume }] = await Promise.all([
    sanityFetch({ query: HERO_QUERY }),
    sanityFetch({ query: LATEST_RESUME_QUERY }),
  ]);

  if (!profile) return null;

  // One art-directed image, not a carousel: take the first available.
  const portraitSource =
    profile.profileImages && profile.profileImages.length > 0
      ? profile.profileImages[0]
      : profile.profileImage;
  const portraitUrl = portraitSource
    ? urlFor(portraitSource).width(680).height(680).url()
    : null;
  const portraitAlt =
    (portraitSource as { alt?: string })?.alt ||
    `${profile.firstName} ${profile.lastName}`;

  return (
    <section id="home" className="w-full">
      <div className="mx-auto max-w-6xl px-6 md:px-10 lg:px-16 pt-14 md:pt-24 pb-14 md:pb-20">
        <div
          className={`grid items-center gap-10 lg:gap-16 ${
            portraitUrl
              ? "lg:grid-cols-[minmax(0,1fr)_320px]"
              : "lg:grid-cols-1"
          }`}
        >
          {/* Identity */}
          <div>
            {profile.headline && (
              <p className="editorial-fade font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-muted-foreground mb-5">
                {profile.headline}
              </p>
            )}

            <h1 className="editorial-fade editorial-fade-2 font-serif font-medium leading-[1.05] tracking-tight text-balance text-4xl md:text-6xl">
              {profile.firstName}{" "}
              <span className="text-brand">{profile.lastName}</span>
            </h1>

            {profile.shortBio && (
              <p className="editorial-fade editorial-fade-3 mt-6 max-w-[56ch] font-serif text-lg md:text-xl leading-relaxed text-muted-foreground">
                {profile.shortBio}
              </p>
            )}

            {/* Editorial link row — decision log promoted as the identity CTA */}
            <div className="editorial-fade editorial-fade-4 mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/decisions" className={brandLink}>
                Read the decision log →
              </Link>
              {profile.calLink && (
                <BookACallButton
                  calLink={profile.calLink}
                  variant="bare"
                  className={`${brandLink} disabled:opacity-60`}
                />
              )}
              {profile.socialLinks?.github && (
                <Link
                  href={profile.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={plainLink}
                >
                  GitHub
                </Link>
              )}
              {profile.socialLinks?.linkedin && (
                <Link
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={plainLink}
                >
                  LinkedIn
                </Link>
              )}
              {latestResume?.resumeFile && (
                <ResumeDownloadButton
                  resumeFile={latestResume.resumeFile}
                  title="Résumé"
                  className={plainLink}
                />
              )}
            </div>

            {/* Facts */}
            <div className="editorial-fade editorial-fade-4 mt-9 pt-5 border-t border-border flex flex-wrap gap-x-7 gap-y-2 font-mono text-[13px] text-muted-foreground">
              {profile.email && (
                <span className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4 text-brand" />
                  {profile.email}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-brand" />
                  {profile.location}
                </span>
              )}
              {profile.availability && (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand" />
                  {profile.availability}
                </span>
              )}
            </div>
          </div>

          {/* Portrait — single, duotone */}
          {portraitUrl && (
            <div className="order-first lg:order-last mx-auto w-full max-w-[260px] lg:max-w-none">
              <Portrait src={portraitUrl} alt={portraitAlt} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
