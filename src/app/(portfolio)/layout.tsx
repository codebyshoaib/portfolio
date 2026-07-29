import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { AppSidebar } from "@/components/app-sidebar";
import { DisableDraftMode } from "@/components/DisableDraftMode";

// Lazy load FloatingDock - not critical for initial render
const FloatingDock = dynamic(
  () =>
    import("@/components/FloatingDock").then((mod) => ({
      default: mod.FloatingDock,
    })),
  {
    ssr: true,
    loading: () => null,
  },
);

import { ConditionalClerkProvider } from "@/components/ConditionalClerkProvider";
import { FloatingButtons } from "@/components/FloatingButtons";
import { ScrollDepthTracker } from "@/components/ScrollDepthTracker";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SITE_URL } from "@/lib/site";
import { SanityLive } from "@/sanity/lib/live";

// Source Serif 4 — editorial display face for headings (replaces Space Grotesk).
// Carries the "senior editorial" identity shared with /decisions.
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // Every relative URL in metadata — above all the file-based opengraph-image
  // routes — resolves against this. Without it Next falls back to
  // http://localhost:3000 (or a per-deploy Vercel preview host) and shared links
  // point at nothing.
  // NOTE: this is the `(portfolio)` GROUP root, not the app root — there is no
  // src/app/layout.tsx, and /v2, /dashboard and (sanity) each have their own.
  // Anything added outside this group needs its own metadataBase.
  metadataBase: new URL(SITE_URL),
  title: "Shoaib Ud Din - Full Stack Engineer",
  description: "Shoaib Ud Din - Full Stack Engineer",
  keywords: [
    "Shoaib Ud Din",
    "Full Stack Engineer",
    "Software Engineer",
    "Web Developer",
    "React Developer",
    "Next.js Developer",
    "Node.js Developer",
    "MongoDB Developer",
    "Express Developer",
    "REST API Developer",
    "GraphQL Developer",
    "Docker Developer",
    "Kubernetes Developer",
    "AWS Developer",
    "Azure Developer",
    "GCP Developer",
    "DevOps Engineer",
    "System Administrator",
    "Network Administrator",
    "Security Engineer",
    "Cybersecurity Engineer",
    "Cloud Engineer",
    "Data Engineer",
    "Machine Learning Engineer",
    "Artificial Intelligence Engineer",
    "Blockchain Developer",
    "Smart Contract Developer",
    "Blockchain Security Engineer",
    "Blockchain Architect",
    "Blockchain Consultant",
    "Blockchain Analyst",
    "Blockchain Researcher",
    "Blockchain Developer",
    "Blockchain Security Engineer",
    "Blockchain Architect",
    "Blockchain Consultant",
    "Blockchain Analyst",
    "Blockchain Researcher",
  ],
  authors: [{ name: "Shoaib Ud Din", url: SITE_URL }],
  creator: "Shoaib Ud Din",
  publisher: "Shoaib Ud Din",
  openGraph: {
    title: "Shoaib Ud Din - Full Stack Engineer",
    description: "Shoaib Ud Din - Full Stack Engineer",
    url: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConditionalClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${sourceSerif.variable} ${inter.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider defaultOpen={false}>
              <SidebarInset>{children}</SidebarInset>
              <AppSidebar side="right" />
              <FloatingDock />
              <FloatingButtons />
              <ScrollToTop />
            </SidebarProvider>

            <SanityLive />

            {(await draftMode()).isEnabled && (
              <>
                <VisualEditing />
                <DisableDraftMode />
              </>
            )}
          </ThemeProvider>
          <ScrollDepthTracker />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ConditionalClerkProvider>
  );
}
