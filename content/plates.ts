export type PlateMotif =
  | "sun"
  | "arches"
  | "waves"
  | "grid"
  | "orbit"
  | "peaks"
  | "bloom";

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
  /** body paragraph for the left page */
  body: string;
  /** accent wash colour for this spread */
  accent: string;
  /** generative line-art motif */
  motif: PlateMotif;
  /** optional portrait/artwork for the left page (public/ path) */
  image?: string;
  /** caption under the image */
  imageCaption?: string;
  /** folio number, computed at render */
  folio?: string;
}

/**
 * Phase-2 content: B V Manoj — AI/ML undergraduate building
 * production-grade GenAI & LLM applications.
 * Source: E:\resume\data\Resume_Manoj.pdf
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
    sub: "B.Tech AI & Data Science · GPA 9.2/10",
    body: "AI, Machine Learning & Data Science undergraduate building production-grade Generative AI and LLM applications, RAG systems and RL environments. Five deployed projects spanning multi-LLM orchestration, video AI tooling, component risk analysis and autonomous news intelligence.",
    accent: "#5d7a6b",
    motif: "arches",
  },
  {
    title: "Craft",
    place: "Toolbox",
    kicker: "How I work",
    headline: "Python to prod, TypeScript to ship",
    sub: "PyTorch · RAG · Next.js · FastAPI",
    body: "Python, TypeScript, SQL. PyTorch, HuggingFace, multi-LLM fallback chains, RAG over FAISS and LangChain. FastAPI backends, Next.js front-ends, Docker and CI/CD on AWS, Cloud Run and Vercel.",
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
  },
  {
    title: "Journey",
    place: "Timeline",
    kicker: "Where I've been",
    headline: "Discipline by day, hackathons by night",
    sub: "B.Tech SIMATS 9.2 · HSC 95.6% · SSC 85%",
    body: "Saveetha School of Engineering (2024–present), SR Junior College, Z.P. High School. 1st prize at Vel Tech Hackathon 2024, national finalist at Smart India Hackathon 2025 (Top 50 of 15,000+), core member of the SIMATS Hackathon Club running 5+ events for 200+ builders.",
    accent: "#9a6a3e",
    motif: "sun",
  },
  {
    title: "Contact",
    place: "Last page",
    kicker: "Write to me",
    headline: "Let's build something that ships",
    sub: "bvmanoj61@gmail.com — replies within a day",
    body: "Tap any plate in the index below to jump straight to it. Best viewed with a cursor (the loupe needs one), but fully usable by touch and keyboard. Fluent in English, native in Telugu, conversational in Hindi.",
    accent: "#2b2721",
    motif: "arches",
  },
];

export const LANDING_INDEX = 0;
