import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { defineQuery } from "next-sanity";
import { Section, SectionHeader } from "@/components/sections/Section";
import { sanityFetch } from "@/sanity/lib/live";

const CERTIFICATIONS_QUERY =
  defineQuery(`*[_type == "certification"] | order(issueDate desc){
  name,
  issuer,
  issueDate,
  expiryDate,
  credentialId,
  credentialUrl,
  logo,
  description,
  skills[]->{name, category},
  order
}`);

export async function CertificationsSection() {
  const { data: certifications } = await sanityFetch({
    query: CERTIFICATIONS_QUERY,
  });

  if (!certifications || certifications.length === 0) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <Section id="certifications">
      <SectionHeader eyebrow="Certifications" title="Certifications" />

      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
          {certifications.map((cert) => (
            <div
              key={`${cert.issuer}-${cert.name}-${cert.issueDate}`}
              className="rounded-[10px] border border-border bg-card p-5 transition-colors hover:border-foreground/25"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                  {cert.name}
                </h3>
                {cert.issueDate && (
                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums text-muted-foreground">
                    {formatDate(cert.issueDate)}
                  </span>
                )}
              </div>

              <p className="mt-1 text-brand">{cert.issuer}</p>

              {cert.description && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {cert.description}
                </p>
              )}

              {cert.skills && cert.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {cert.skills.slice(0, 6).map((skill, idx) => {
                    const skillData =
                      skill && typeof skill === "object" && "name" in skill
                        ? skill
                        : null;
                    return skillData?.name ? (
                      <span
                        key={`${cert.name}-skill-${idx}`}
                        className="rounded-[6px] border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {skillData.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {(cert.expiryDate || cert.credentialId || cert.credentialUrl) && (
                <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  {cert.expiryDate && (
                    <p className="text-muted-foreground">
                      Valid until{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(cert.expiryDate)}
                        {isExpired(cert.expiryDate) && " (Expired)"}
                      </span>
                    </p>
                  )}
                  {cert.credentialId && (
                    <p className="font-mono text-[11px] text-muted-foreground break-all">
                      ID: {cert.credentialId}
                    </p>
                  )}
                  {cert.credentialUrl && (
                    <Link
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-brand hover:opacity-80"
                    >
                      Verify credential
                      <IconExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
