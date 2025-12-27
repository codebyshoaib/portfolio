import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NextGen Portfolio Studioi",
  description: "Sanity Studio for NextGen Portfolio",
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

export default Layout;
