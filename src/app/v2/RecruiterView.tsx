import type { TerminalProfile } from "@/components/terminal/commands";

interface Props {
  readonly profile: TerminalProfile;
}

export function RecruiterView({ profile }: Props) {
  const name = `${profile.firstName ?? "Shoaib"} ${profile.lastName ?? "Ud Din"}`;
  return (
    <main
      style={{
        maxWidth: "780px",
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 64px)",
        color: "var(--term-fg)",
      }}
    >
      <a
        href="/v2"
        className="term-link-btn"
        style={{ fontSize: "12px", color: "var(--term-fg-dim)" }}
      >
        ← interactive view
      </a>

      <header style={{ marginTop: "32px", marginBottom: "40px" }}>
        <h1
          className="term-serif"
          style={{
            fontSize: "clamp(40px, 7vw, 64px)",
            margin: 0,
            color: "var(--term-fg)",
          }}
        >
          {name}
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "16px",
            color: "var(--term-fg-dim)",
          }}
        >
          {profile.headline ?? "Full-stack engineer. Production AI."}
        </p>
      </header>

      <section style={{ marginBottom: "32px" }}>
        <Field
          label="Experience"
          value={`${profile.yearsOfExperience ?? 6} years`}
        />
        <Field
          label="Location"
          value={`${profile.location ?? "Lahore, PK"} · remote-first · open to relocation`}
        />
        <Field
          label="Status"
          value={
            <>
              <span className="term-status-dot" />
              {profile.availability ?? "Available for senior+ roles"}
            </>
          }
        />
        <Field label="Reply SLA" value="within 24 hours" />
      </section>

      <Section title="Stack">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            "TypeScript",
            "Go",
            "Postgres",
            "Next.js",
            "React",
            "Groq",
            "Anthropic",
            "Vercel",
            "Sanity",
            "Docker",
          ].map((t) => (
            <span
              key={t}
              style={{
                padding: "4px 10px",
                border: "1px solid var(--term-border)",
                fontSize: "12px",
                color: "var(--term-fg)",
                borderRadius: "2px",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Section>

      {profile.trustLogos?.length ? (
        <Section title="Trusted by">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 20px",
              alignItems: "center",
            }}
          >
            {profile.trustLogos.map((logo) => {
              const label = logo.alt ?? logo.name;
              const labelNode = (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--term-fg-dim)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {logo.name}
                </span>
              );
              if (logo.url) {
                return (
                  <a
                    key={logo.name}
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="term-link-btn"
                    aria-label={label}
                  >
                    {labelNode}
                  </a>
                );
              }
              return (
                <span key={logo.name} title={label}>
                  {labelNode}
                </span>
              );
            })}
          </div>
        </Section>
      ) : null}

      <Section title="Experience">
        {profile.experience?.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {profile.experience.map((e) => (
              <li
                key={`${e.title}-${e.company}`}
                style={{ marginBottom: "20px" }}
              >
                <div style={{ fontWeight: 500 }}>
                  {e.title}{" "}
                  <span style={{ color: "var(--term-fg-dim)" }}>·</span>{" "}
                  {e.company}
                </div>
                <div style={{ color: "var(--term-fg-dim)", fontSize: "13px" }}>
                  {e.period}
                </div>
                {e.impact?.length ? (
                  <ul
                    style={{
                      marginTop: "6px",
                      paddingLeft: "16px",
                      fontSize: "13px",
                    }}
                  >
                    {e.impact.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--term-fg-dim)" }}>—</p>
        )}
      </Section>

      <Section title="Selected projects">
        {profile.projects?.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {profile.projects.map((p) => (
              <li key={p.title} style={{ marginBottom: "14px" }}>
                <div style={{ fontWeight: 500 }}>{p.title}</div>
                {p.tagline ? (
                  <div
                    style={{ color: "var(--term-fg-dim)", fontSize: "13px" }}
                  >
                    {p.tagline}
                  </div>
                ) : null}
                {p.stack?.length ? (
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "var(--term-fg-faint)",
                    }}
                  >
                    {p.stack.join(" · ")}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--term-fg-dim)" }}>—</p>
        )}
      </Section>

      <Section title="Contact">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {profile.email && (
            <a className="term-link-btn" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          )}
          {profile.socialLinks?.github && (
            <a
              className="term-link-btn"
              href={profile.socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.socialLinks.github.replace(/^https?:\/\//, "")}
            </a>
          )}
          {profile.socialLinks?.linkedin && (
            <a
              className="term-link-btn"
              href={profile.socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.socialLinks.linkedin.replace(/^https?:\/\//, "")}
            </a>
          )}
          <a className="term-link-btn" href="/api/resume">
            resume.pdf
          </a>
          <a
            className="term-link-btn"
            href="https://cal.com/shoaibuddin/intro"
            target="_blank"
            rel="noopener noreferrer"
          >
            book a 15-min call
          </a>
        </div>
      </Section>
    </main>
  );
}

function Field({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        padding: "8px 0",
        borderBottom: "1px solid var(--term-border)",
        fontSize: "14px",
      }}
    >
      <span style={{ color: "var(--term-fg-dim)" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "var(--term-fg-dim)",
          marginBottom: "16px",
          fontWeight: 500,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
