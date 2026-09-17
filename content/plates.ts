export type PlateMotif =
  | "sun"
  | "arches"
  | "waves"
  | "grid"
  | "orbit"
  | "peaks"
  | "bloom";

/** One framed image on a spread. `src` is a public/ path, e.g. "/sketchbook/whatif-report.webp". */
export interface PlateImage {
  src: string;
  /** italic caption printed under the frame */
  caption?: string;
  /** accessibility text; falls back to caption, then to the plate title */
  alt?: string;
  /**
   * CSS aspect-ratio for the frame. Defaults to "4/5" for the first image
   * (the hero) and "1/1" for the small tiles beside it.
   */
  aspect?: string;
}

export interface PlateLink {
  label: string;
  href: string;
}

export interface PlateMetric {
  value: string;
  label: string;
}

export interface Plate {
  /** short title shown under the book + in the index */
  title: string;
  /** right-aligned meta shown in the index */
  place: string;
  /** small caps kicker painted on the spread */
  kicker: string;
  /** big serif headline painted on the right page */
  headline: string;
  /** supporting line */
  sub: string;
  /** body paragraph for the left page — keep under ~240 characters */
  body: string;
  /** accent wash colour for this spread */
  accent: string;
  /** generative line-art motif (used when the plate has no image) */
  motif: PlateMotif;
  /** single left-page image (public/ path) */
  image?: string;
  /** caption under the single image */
  imageCaption?: string;
  /** alt text for the single image; falls back to imageCaption, then title */
  imageAlt?: string;
  /** 2–4 image contact sheet — when present it wins over `image` */
  images?: PlateImage[];
  /** small-caps chips printed under the media, e.g. ["PyTorch", "FAISS"] */
  stack?: string[];
  /** small metrics table printed above the body copy */
  metrics?: PlateMetric[];
  /** primary outbound link (repo, live demo, paper) */
  link?: PlateLink;
  /** extra outbound links rendered beside `link` */
  links?: PlateLink[];
  /** bare repo path, e.g. "github.com/Venkata-Manoj/WhatIF" */
  repo?: string;
  /** bare live host/path, e.g. "what-if-henna.vercel.app" */
  live?: string;
  /** folio number, computed at render */
  folio?: string;
}

/**
 * Phase-2 content: B V Manoj — AI/ML undergraduate building
 * production-grade GenAI & LLM applications.
 * Source: E:\resume\data\Resume_Manoj.pdf
 *
 * ── How to add your own material ─────────────────────────────────────────────
 * Every spread is one object in PLATES below. Only `title`, `place`, `kicker`,
 * `headline`, `sub`, `body`, `accent` and `motif` are required; the rest light
 * up as soon as you provide them:
 *
 *   image / imageCaption      one framed photo on the left page
 *   images[]                  2–4 image contact sheet (wins over `image`)
 *   stack[]                   small-caps chips, e.g. tech you used
 *   metrics[]                 small two-column table above the body copy
 *   link / links[]            outbound links (repo · live demo · paper)
 *
 * Assets live in public/. Put your files in public/sketchbook/ (see
 * public/sketchbook/README.md for the size/format rules) and reference them
 * with an absolute path. `npm run check:assets` fails the build if a path is
 * wrong or the file name case doesn't match exactly.
 *
 * Example of a fully loaded project plate:
 *
 *   {
 *     title: "videoreverse",
 *     place: "Video AI · CLI",
 *     kicker: "Selected work 01",
 *     headline: "Videos, deconstructed into prompts",
 *     sub: "OpenCV · −70% prompt-engineering time",
 *     body: "…≤240 characters so it fits the left page at 900px…",
 *     accent: "#b0563a",
 *     motif: "waves",
 *     images: [
 *       { src: "/sketchbook/videoreverse-cli.webp", caption: "Batch run", aspect: "16/10" },
 *       { src: "/sketchbook/videoreverse-frames.webp", caption: "Keyframes" },
 *       { src: "/sketchbook/videoreverse-scenes.webp", caption: "Scene map" },
 *     ],
 *     stack: ["Python", "OpenCV", "CLI"],
 *     metrics: [
 *       { value: "100+", label: "videos/run" },
 *       { value: "+45%", label: "relevance" },
 *     ],
 *     link: { label: "GitHub", href: "https://github.com/Venkata-Manoj" },
 *   }
 */
export const PLATES: Plate[] = [
  {
    title: "Cover",
    place: "Vol. 01",
    kicker: "Portfolio · 2026",
    headline: "B V Manoj",
    sub: "AI undergrad — production-grade GenAI & LLM apps",
    body: "This sketchbook is a working book of my work. Drag a page to turn it. Drag the brass glass to read the ink up close. Five deployed projects, inside.",
    accent: "#9a6a3e",
    motif: "sun",
    image: "/Manoj.jpeg",
    imageCaption: "Builder, in person",
  },
  {
    title: "About",
    place: "Chapter 01",
    kicker: "Hello — start here",
    headline: "I ship AI that survives contact with users",
    sub: "AI Engineer · Data Scientist · Full-Stack Developer",
    body: "B V Manoj — an AI & Data Science engineering student at SIMATS, class of 2028. I build intelligent systems: RAG pipelines and multi-LLM agent workflows on one end, full-stack applications deployed at scale on the other. Open to AI/ML internships and research collaborations.",
    accent: "#5d7a6b",
    motif: "arches",
  },
  {
    title: "Craft",
    place: "Toolbox",
    kicker: "How I work",
    headline: "Python to prod, TypeScript to ship",
    sub: "PyTorch · RAG · Next.js · FastAPI",
    body: "Languages — Python, TypeScript, SQL, C++. AI/ML — PyTorch, TensorFlow, HuggingFace, RAG over FAISS and LangChain, OpenCV. Systems — FastAPI, Next.js, Docker and CI/CD on AWS, Cloud Run and Vercel.",
    accent: "#7a6a9a",
    motif: "grid",
  },
  {
    title: "videoreverse",
    place: "Video AI · CLI",
    kicker: "Selected work 01",
    headline: "Videos, deconstructed into prompts",
    sub: "OpenCV · −70% prompt-engineering time",
    body: "A tool that deconstructs videos into production-ready prompts for video AI models. Frame-extraction pipeline in OpenCV, scene detection with keyframe selection lifting output relevance 45%, and a batch CLI clearing 100+ videos a session.",
    accent: "#b0563a",
    motif: "waves",
    repo: "github.com/Venkata-Manoj/videoreverse",
  },
  {
    title: "AI-News-Bot",
    place: "Agents · Live",
    kicker: "Selected work 02",
    headline: "News intelligence that never sleeps",
    sub: "6-LLM fallback · 99.2% uptime over 30 days",
    body: "Autonomous news intelligence scraping 6 sources and delivering Telegram cards every 45 minutes. A 6-LLM fallback chain across OpenAI, Anthropic and Ollama holds 99.2% uptime; dedup cuts noise 60% across 500+ articles a day for 200+ subscribers.",
    accent: "#3a7a8c",
    motif: "peaks",
    repo: "github.com/Venkata-Manoj/AI-News-Bot",
  },
  {
    title: "WhatIF",
    place: "Web AI · Genkit",
    kicker: "Selected work 03",
    headline: "Every component, risk-checked",
    sub: "15+ risk categories · under 3 seconds",
    body: "AI-powered UI component analyzer for React, Vue and HTML with exportable PDF reports. A Genkit engine flags accessibility, performance and security risks; Firebase sessions scaled to 500+ analyses in the first month, cutting manual review effort 80%.",
    accent: "#4e7a6b",
    motif: "bloom",
    repo: "github.com/Venkata-Manoj/WhatIF",
    live: "what-if-henna.vercel.app",
  },
  {
    title: "Capstone-Forage",
    place: "RAG · FastAPI",
    kicker: "Selected work 04",
    headline: "Compliance, generated",
    sub: "FAISS · 92% retrieval accuracy",
    body: "RAG-powered report generator ingesting PDFs, DOCX and images into institution-compliant capstone reports. A FAISS store over 10k+ chunks retrieves at 92%; local Ollama inference cuts cloud cost 100% and every report passes compliance checks.",
    accent: "#8c6a3a",
    motif: "orbit",
    repo: "github.com/Venkata-Manoj/Capstone-Forage",
  },
  {
    title: "Journey",
    place: "Timeline",
    kicker: "Where I've been",
    headline: "Discipline by day, hackathons by night",
    sub: "B.Tech SIMATS 9.2 · HSC 95.6% · SSC 85%",
    body: "B.Tech at Saveetha School of Engineering, 2024–2028; SR Junior College, Vijayawada before that. 1st prize at Vel Tech Hackathon 2024 for an AI healthcare solution; national finalist at Smart India Hackathon 2025 (Top 50 of 15,000+); core member of the SIMATS Hackathon Club. Sealed with DataCamp LLM, RAG and multi-step-chain certifications plus Anthropic prompt engineering.",
    accent: "#9a6a3e",
    motif: "sun",
  },
  {
    title: "Contact",
    place: "Last page",
    kicker: "Write to me",
    headline: "Let's build something that ships",
    sub: "bvmanoj61@gmail.com — replies within a day",
    body: "Tap any plate below to jump straight to it. bvmanoj61@gmail.com · GitHub Venkata-Manoj · LinkedIn venkata-manoj. Fluent in English, native in Telugu, conversational in Hindi & Tamil.",
    accent: "#2b2721",
    motif: "arches",
  },
  {
    title: "Field notes",
    place: "Appendix",
    kicker: "More from the bench",
    headline: "Small builds, sharp lessons",
    sub: "RL · Vision · Shipped tools",
    body: "Resilience-Ops-Env — a Gym-style RL world where agents triage simulated infra incidents. Sign-Language-TTS — realtime sign recognition with LSTM, MediaPipe and speech output. IdeaForge_2k26 — live e-certificate issuance and verification, glassmorphism UI included.",
    accent: "#4e6b5d",
    motif: "orbit",
  },
];

export const LANDING_INDEX = 0;
