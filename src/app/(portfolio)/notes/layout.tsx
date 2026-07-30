import "../editorial.css";

// Same editorial stylesheet as /decisions. The two surfaces are deliberately
// one design system with two contents — a note that looked like a different
// site would read as a different author.
export default function NotesLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <div className="editorial-root">{children}</div>;
}
