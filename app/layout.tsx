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

/**
 * Absolute base for social preview URLs. Vercel injects
 * VERCEL_PROJECT_PRODUCTION_URL automatically, so link previews resolve to the
 * real domain with zero configuration. Set NEXT_PUBLIC_SITE_URL to override —
 * only needed if you later attach a custom domain.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "B V Manoj Book Portfolio",
  description:
    "AI/ML undergraduate building production-grade GenAI & LLM apps. A page-flipping sketchbook: drag a page to turn it, drag the brass glass to read the ink up close.",
  openGraph: {
    title: "B V Manoj Book Portfolio",
    description: "Drag the page to turn · Drag the glass across it",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "B.V Manoj Book Portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "B V Manoj Book Portfolio",
    description: "Drag the page to turn · Drag the glass across it",
    images: ["/og-image.png"],
  },
  icons: {
    // Regenerate this set from public/favicon.png with: python3 scripts/make-icons.py
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
