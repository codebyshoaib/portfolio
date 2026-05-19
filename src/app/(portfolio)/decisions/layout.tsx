import {
  Instrument_Serif,
  JetBrains_Mono,
  Source_Serif_4,
} from "next/font/google";
import "./decisions.css";

const serifBody = Source_Serif_4({
  variable: "--font-decisions-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const serifDisplay = Instrument_Serif({
  variable: "--font-decisions-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-decisions-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default function DecisionsLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className={`decisions-root ${serifBody.variable} ${serifDisplay.variable} ${mono.variable}`}
    >
      {children}
    </div>
  );
}
