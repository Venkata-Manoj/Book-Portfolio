import type { Metadata } from "next";
import { Instrument_Serif, Newsreader } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Newsreader({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "B V Manoj — Portfolio Sketchbook",
  description:
    "AI/ML undergraduate building production-grade GenAI & LLM apps. A page-flipping sketchbook: drag a page to turn it, drag the brass glass to read the ink up close.",
  openGraph: {
    title: "B V Manoj — Portfolio Sketchbook",
    description: "Drag the page to turn · Drag the glass across it",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        className="min-h-screen"
        style={{ fontFamily: "var(--font-body), Georgia, serif" }}
      >
        {children}
      </body>
    </html>
  );
}
