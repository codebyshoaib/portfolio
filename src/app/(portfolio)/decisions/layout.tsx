import "./decisions.css";

// metadataBase lives on the root layout — it is a site-wide concern, and scoping
// it here would mean the next OG image added anywhere else silently ships
// localhost URLs.

// Fonts are inherited from the site (--font-serif / --font-mono set on the
// portfolio <body>), so the decisions pages read as the same site's long-form
// reading mode rather than a separate design system.
export default function DecisionsLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <div className="decisions-root">{children}</div>;
}
