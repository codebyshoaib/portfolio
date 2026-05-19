import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import "./terminal.css";

const mono = JetBrains_Mono({
  variable: "--font-terminal-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-terminal-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "shoaib@portfolio:~$",
  description: "Shoaib Ud Din — full-stack engineer. Production AI.",
};

export default function V2Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mono.variable} ${serif.variable}`}>
      <head>
        {/* SSR-first: when JS is disabled, swap the interactive terminal for
            the recruiter-view fallback. Crawlers without JS see real content. */}
        <noscript>
          <style>
            {
              ".v2-ssr-fallback{display:block!important}.terminal-shell{display:none!important}"
            }
          </style>
        </noscript>
      </head>
      <body className="terminal-body">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
