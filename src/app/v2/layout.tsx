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
      <body className="terminal-body">{children}</body>
    </html>
  );
}
