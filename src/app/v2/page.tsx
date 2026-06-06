import { defineQuery } from "next-sanity";
import type {
  TerminalDecision,
  TerminalExperience,
  TerminalNow,
  TerminalProfile,
  TerminalProject,
  TerminalTrustLogo,
  TerminalUses,
} from "@/components/terminal/commands";
import { Terminal } from "@/components/terminal/Terminal";
import { sanityFetch } from "@/sanity/lib/live";
import { RecruiterView } from "./RecruiterView";

export const revalidate = 3600;

const V2_PROFILE_QUERY = defineQuery(`*[_id == "singleton-profile"][0] {
  firstName,
  lastName,
  headline,
  shortBio,
  location,
  yearsOfExperience,
  email,
  availability,
  socialLinks,
}`);

const V2_PROJECTS_QUERY =
  defineQuery(`*[_type == "project"] | order(featured desc, _createdAt desc)[0...8] {
  title,
  tagline,
  metrics,
  liveUrl,
  githubUrl,
  "stack": technologies[]->name
}`);

const V2_EXPERIENCE_QUERY =
  defineQuery(`*[_type == "experience"] | order(startDate desc)[0...5] {
  jobTitle,
  company,
  startDate,
  endDate,
  current,
  achievements
}`);

const V2_DECISIONS_QUERY =
  defineQuery(`*[_type == "decision" && published == true] | order(date desc)[0...12] {
  "slug": slug.current,
  title,
  date,
  summary,
  status
}`);

const NOW_QUERY = defineQuery(`*[_id == "singleton-now"][0] {
  month,
  items,
  reading
}`);

const USES_QUERY = defineQuery(`*[_id == "singleton-uses"][0] {
  categories
}`);

const SITE_SETTINGS_QUERY = defineQuery(`*[_id == "singleton-siteSettings"][0] {
  trustLogos[] {
    name,
    url,
    "logoAlt": logo.alt
  }
}`);

interface PageProps {
  readonly searchParams: Promise<{ readonly view?: string }>;
}

export default async function V2Page({ searchParams }: PageProps) {
  const { view } = await searchParams;

  const [
    profileRes,
    projectsRes,
    experienceRes,
    decisionsRes,
    nowRes,
    usesRes,
    settingsRes,
  ] = await Promise.all([
    sanityFetch({ query: V2_PROFILE_QUERY }),
    sanityFetch({ query: V2_PROJECTS_QUERY }),
    sanityFetch({ query: V2_EXPERIENCE_QUERY }),
    sanityFetch({ query: V2_DECISIONS_QUERY }),
    sanityFetch({ query: NOW_QUERY }),
    sanityFetch({ query: USES_QUERY }),
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
  ]);

  interface RawProject {
    readonly title?: string | null;
    readonly tagline?: string | null;
    readonly metrics?: string | null;
    readonly liveUrl?: string | null;
    readonly githubUrl?: string | null;
    readonly stack?: readonly (string | null)[] | null;
  }
  interface RawExperience {
    readonly jobTitle?: string | null;
    readonly company?: string | null;
    readonly startDate?: string | null;
    readonly endDate?: string | null;
    readonly current?: boolean | null;
    readonly achievements?: readonly (string | null)[] | null;
  }
  interface RawProfile {
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly headline?: string | null;
    readonly shortBio?: string | null;
    readonly location?: string | null;
    readonly yearsOfExperience?: number | null;
    readonly email?: string | null;
    readonly availability?: string | null;
    readonly socialLinks?: {
      readonly github?: string | null;
      readonly linkedin?: string | null;
      readonly twitter?: string | null;
    } | null;
  }
  interface RawDecision {
    readonly slug?: string | null;
    readonly title?: string | null;
    readonly date?: string | null;
    readonly summary?: string | null;
    readonly status?: string | null;
  }
  interface RawNow {
    readonly month?: string | null;
    readonly items?: readonly (string | null)[] | null;
    readonly reading?: string | null;
  }
  interface RawUses {
    readonly categories?:
      | readonly {
          readonly label?: string | null;
          readonly value?: string | null;
        }[]
      | null;
  }
  interface RawTrustLogo {
    readonly name?: string | null;
    readonly url?: string | null;
    readonly logoAlt?: string | null;
  }
  interface RawSettings {
    readonly trustLogos?: readonly RawTrustLogo[] | null;
  }

  const sanityProfile = profileRes.data as RawProfile | null;
  const sanityProjects = (projectsRes.data ?? []) as readonly RawProject[];
  const sanityExperience = (experienceRes.data ??
    []) as readonly RawExperience[];
  const sanityDecisions = (decisionsRes.data ?? []) as readonly RawDecision[];
  const sanityNow = nowRes.data as RawNow | null;
  const sanityUses = usesRes.data as RawUses | null;
  const sanitySettings = settingsRes.data as RawSettings | null;

  const projects: readonly TerminalProject[] = sanityProjects.map((p) => ({
    title: p.title ?? "Untitled",
    tagline: p.tagline ?? undefined,
    metrics: p.metrics ?? undefined,
    url: p.liveUrl ?? undefined,
    github: p.githubUrl ?? undefined,
    stack: (p.stack ?? []).filter((s): s is string => Boolean(s)),
  }));

  const experience: readonly TerminalExperience[] = sanityExperience.map(
    (e) => {
      const start = e.startDate
        ? new Date(e.startDate).getFullYear().toString()
        : "?";
      const end = e.current
        ? "present"
        : e.endDate
          ? new Date(e.endDate).getFullYear().toString()
          : "?";
      return {
        title: e.jobTitle ?? "Engineer",
        company: e.company ?? "—",
        period: `${start} → ${end}`,
        impact: (e.achievements ?? [])
          .slice(0, 3)
          .filter((a): a is string => Boolean(a)),
      };
    },
  );

  const decisions: readonly TerminalDecision[] = sanityDecisions
    .map((d) => {
      const allowed = [
        "proposed",
        "accepted",
        "deprecated",
        "superseded",
      ] as const;
      const status =
        d.status && (allowed as readonly string[]).includes(d.status)
          ? (d.status as (typeof allowed)[number])
          : undefined;
      return {
        slug: d.slug ?? "",
        title: d.title ?? "",
        date: d.date ?? "",
        summary: d.summary ?? "",
        status,
      };
    })
    .filter((d) => d.title && d.slug);

  const now: TerminalNow | undefined = sanityNow
    ? {
        month: sanityNow.month ?? undefined,
        items: (sanityNow.items ?? []).filter((i): i is string => Boolean(i)),
        reading: sanityNow.reading ?? undefined,
      }
    : undefined;

  const uses: TerminalUses | undefined = sanityUses?.categories?.length
    ? {
        categories: sanityUses.categories
          .map((c) => ({
            label: c.label ?? "",
            value: c.value ?? "",
          }))
          .filter((c) => c.label && c.value),
      }
    : undefined;

  const trustLogos: readonly TerminalTrustLogo[] = (
    sanitySettings?.trustLogos ?? []
  )
    .map((t) => ({
      name: t.name ?? "",
      url: t.url ?? undefined,
      alt: t.logoAlt ?? undefined,
    }))
    .filter((t) => t.name);

  const profile: TerminalProfile = {
    firstName: sanityProfile?.firstName ?? undefined,
    lastName: sanityProfile?.lastName ?? undefined,
    headline: sanityProfile?.headline ?? undefined,
    shortBio: sanityProfile?.shortBio ?? undefined,
    location: sanityProfile?.location ?? undefined,
    yearsOfExperience: sanityProfile?.yearsOfExperience ?? undefined,
    email: sanityProfile?.email ?? undefined,
    availability: sanityProfile?.availability ?? undefined,
    socialLinks: sanityProfile?.socialLinks
      ? {
          github: sanityProfile.socialLinks.github ?? undefined,
          linkedin: sanityProfile.socialLinks.linkedin ?? undefined,
          twitter: sanityProfile.socialLinks.twitter ?? undefined,
        }
      : undefined,
    projects,
    experience,
    decisions,
    now,
    uses,
    trustLogos,
  };

  if (view === "recruiter") {
    return <RecruiterView profile={profile} />;
  }

  return (
    <>
      {/* SSR-first fallback: visible to crawlers + JS-disabled visitors.
          Hidden via CSS when JS is enabled (so screen-reader users on JS-enabled
          sessions don't get double-read of the same content). */}
      <div className="v2-ssr-fallback">
        <RecruiterView profile={profile} />
      </div>
      <Terminal profile={profile} autoRun={["whoami"]} />
    </>
  );
}
