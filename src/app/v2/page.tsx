import { defineQuery } from "next-sanity";
import type {
  TerminalExperience,
  TerminalProfile,
  TerminalProject,
} from "@/components/terminal/commands";
import { Terminal } from "@/components/terminal/Terminal";
import { sanityFetch } from "@/sanity/lib/live";
import { RecruiterView } from "./RecruiterView";

export const revalidate = 3600;

const PROFILE_QUERY = defineQuery(`*[_id == "singleton-profile"][0] {
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

const PROJECTS_QUERY =
  defineQuery(`*[_type == "project"] | order(featured desc, _createdAt desc)[0...8] {
  title,
  tagline,
  liveUrl,
  githubUrl,
  "stack": technologies[]->name
}`);

const EXPERIENCE_QUERY =
  defineQuery(`*[_type == "experience"] | order(startDate desc)[0...5] {
  jobTitle,
  company,
  startDate,
  endDate,
  current,
  achievements
}`);

interface PageProps {
  readonly searchParams: Promise<{ readonly view?: string }>;
}

export default async function V2Page({ searchParams }: PageProps) {
  const { view } = await searchParams;

  const [profileRes, projectsRes, experienceRes] = await Promise.all([
    sanityFetch({ query: PROFILE_QUERY }),
    sanityFetch({ query: PROJECTS_QUERY }),
    sanityFetch({ query: EXPERIENCE_QUERY }),
  ]);

  interface RawProject {
    readonly title?: string | null;
    readonly tagline?: string | null;
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

  const sanityProfile = profileRes.data as RawProfile | null;
  const sanityProjects = (projectsRes.data ?? []) as readonly RawProject[];
  const sanityExperience = (experienceRes.data ??
    []) as readonly RawExperience[];

  const projects: readonly TerminalProject[] = sanityProjects.map((p) => ({
    title: p.title ?? "Untitled",
    tagline: p.tagline ?? undefined,
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
  };

  if (view === "recruiter") {
    return <RecruiterView profile={profile} />;
  }

  return <Terminal profile={profile} autoRun={["whoami"]} />;
}
