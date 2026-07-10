import Image from "next/image";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";

const PROJECTS_QUERY =
  defineQuery(`*[_type == "project" && featured == true] | order(order asc)[0...6]{
  title,
  slug,
  tagline,
  category,
  liveUrl,
  githubUrl,
  coverImage,
  technologies[]->{name, category, color}
}`);

export async function ProjectsSection() {
  const { data: projects } = await sanityFetch({ query: PROJECTS_QUERY });

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <Section id="projects">
      <SectionHeader
        eyebrow="Projects"
        title="Selected work"
        description="Some of my best work"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.slug?.current}
            className="group rounded-[10px] border border-border bg-card overflow-hidden transition-colors hover:border-foreground/25"
          >
            {project.coverImage && (
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={urlFor(project.coverImage).width(600).height(375).url()}
                  alt={project.title || "Project image"}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="p-6">
              {project.category && (
                <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {project.category}
                </div>
              )}

              <h3 className="font-serif text-lg font-semibold group-hover:text-brand transition-colors">
                {project.title || "Untitled Project"}
              </h3>

              {project.tagline && (
                <p className="mt-2 text-muted-foreground leading-relaxed line-clamp-3">
                  {project.tagline}
                </p>
              )}

              {project.technologies && project.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 4).map((tech, idx) => {
                    const techData =
                      tech && typeof tech === "object" && "name" in tech
                        ? tech
                        : null;
                    return techData?.name ? (
                      <span
                        key={`${project.slug?.current}-tech-${idx}`}
                        className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground border border-border rounded px-2 py-0.5"
                      >
                        {techData.name}
                      </span>
                    ) : null;
                  })}
                  {project.technologies.length > 4 && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground border border-border rounded px-2 py-0.5">
                      +{project.technologies.length - 4}
                    </span>
                  )}
                </div>
              )}

              {(project.liveUrl || project.githubUrl) && (
                <div className="mt-5 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
                  {project.liveUrl && (
                    <Link
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:opacity-80"
                    >
                      Live
                    </Link>
                  )}
                  {project.githubUrl && (
                    <Link
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:opacity-80"
                    >
                      Repo
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
