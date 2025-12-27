import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import dynamic from "next/dynamic";
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
  }
);
import { ThemeProvider } from "@/components/ThemeProvider";
import { FloatingButtons } from "@/components/FloatingButtons";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SanityLive } from "@/sanity/lib/live";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
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
  authors: [
    { name: "Shoaib Ud Din", url: "https://shoaib-fullstack-dev.vercel.app/" },
  ],
  creator: "Shoaib Ud Din",
  publisher: "Shoaib Ud Din",
  openGraph: {
    title: "Shoaib Ud Din - Full Stack Engineer",
    description: "Shoaib Ud Din - Full Stack Engineer",
    url: "https://shoaib-fullstack-dev.vercel.app/",
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
    canonical: "https://shoaib-fullstack-dev.vercel.app/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}
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
            </SidebarProvider>

            <SanityLive />

            {(await draftMode()).isEnabled && (
              <>
                <VisualEditing />
                <DisableDraftMode />
              </>
            )}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
