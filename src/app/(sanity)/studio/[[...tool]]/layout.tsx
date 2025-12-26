import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NextGen Portfolio Studioi",
  description: "Sanity Studio for NextGen Portfolio",
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default Layout;
