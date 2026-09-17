"use client";

import { PLATES } from "@/content/plates";
import { Sketchbook } from "@/components/Sketchbook";
import { ContactForm } from "@/components/ContactForm";
import { Botany, Rule, SectionLabel, TopBar } from "@/components/SiteChrome";

export default function Page() {
  return (
    <>
      <div className="wash" aria-hidden="true" />
      <TopBar />
      <main>
        <section id="sketchbook" className="relative grid min-h-[100svh] content-center justify-items-center overflow-anchor-none px-0 pt-[clamp(112px,13svh,152px)] pb-[clamp(72px,10svh,120px)] select-none">
          <Botany />
          <p className="z-[2] mx-0 mt-0 mb-[clamp(22px,3.4vh,40px)] text-center text-[12px] tracking-[0.24em] text-[rgba(43,39,33,0.58)] uppercase max-sm:text-[10.5px] max-sm:tracking-[0.16em]">
            AI / ML Undergraduate · GenAI & LLM Builder · India
          </p>
          <div className="relative z-[2] grid w-full justify-items-center">
            <Sketchbook plates={PLATES} landing={0} />
          </div>
          <a
            href="#about"
            aria-label="scroll to about"
            className="absolute bottom-[30px] left-1/2 z-[3] -translate-x-1/2 animate-[cue-breathe_2.6s_ease-in-out_infinite] px-3.5 py-2.5 text-[#2b2721] hover:animate-none motion-reduce:animate-none motion-reduce:opacity-50"
          >
            <svg viewBox="0 0 44 22" width="34" height="17" fill="none" aria-hidden="true">
              <polyline points="3,3 22,11 41,3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="3,11 22,19 41,11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <style>{`@keyframes cue-breathe{0%,100%{opacity:.15}50%{opacity:.7}}`}</style>
        </section>

        <Rule />

        <section id="about" className="mx-auto grid max-w-[1080px] scroll-mt-28 grid-cols-[minmax(0,1fr)_auto] items-start gap-[clamp(24px,5vw,60px)] px-[clamp(20px,5vw,48px)] max-md:grid-cols-1">
          <div>
            <SectionLabel>About</SectionLabel>
            <p className="m-0 max-w-[56ch] text-[clamp(17px,1.7vw,20px)] leading-[1.74] font-light tracking-[0.005em]">
              I&apos;m B V Manoj — an AI &amp; Data Science engineering student at SIMATS, class
              of 2028. I build intelligent systems: RAG pipelines and multi-LLM agent workflows on
              one end, full-stack applications deployed at scale on the other.
            </p>
            <p className="m-0 mt-[1.1em] max-w-[56ch] text-[clamp(17px,1.7vw,20px)] leading-[1.74] font-light tracking-[0.005em]">
              Every project starts from the same philosophy — production-grade quality from day
              one. This book keeps the proof like plates in a sketchbook: drag the pages above, or
              jump straight in from the index below. I&apos;m currently open to AI/ML internships
              and research collaborations.
            </p>
          </div>
          <svg viewBox="0 0 200 200" aria-hidden="true" className="w-[clamp(150px,17vw,260px)] self-center opacity-90 select-none max-md:w-[170px] max-md:justify-self-center">
            <g fill="none" stroke="#9a6a3e" strokeWidth="1.1" opacity="0.85">
              {[0, 60, 120].map((r) => (
                <ellipse key={r} cx="100" cy="86" rx="16" ry="42" transform={`rotate(${r} 100 86)`} />
              ))}
              <circle cx="100" cy="86" r="7" />
              <path d="M100 128 Q 100 158 78 176 M100 128 Q 104 156 128 168" />
              <path d="M40 176 Q 100 162 160 176" opacity="0.5" />
            </g>
          </svg>
        </section>

        <Rule short />

        <section id="plates" className="mx-auto max-w-[1080px] scroll-mt-28 px-[clamp(20px,5vw,48px)]">
          <SectionLabel>Plates — tap to open</SectionLabel>
          <ol className="m-0 list-none border-t border-[rgba(43,39,33,0.14)] p-0">
            {PLATES.map((p, i) => (
              <li key={p.title}>
                <button
                  className="plate grid w-full cursor-pointer grid-cols-[3.4em_minmax(0,1fr)_auto] items-baseline gap-[18px] border-0 border-b border-[rgba(43,39,33,0.14)] bg-transparent px-1 py-[15px] text-left text-inherit transition-all hover:bg-[rgba(255,252,244,0.5)] hover:pl-3 aria-[current=true]:bg-[rgba(255,252,244,0.5)] aria-[current=true]:pl-3"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("sketchbook:goto", { detail: i }));
                    document.getElementById("sketchbook")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <span className="text-[12px] tracking-[0.06em] text-[rgba(43,39,33,0.36)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[clamp(19px,2.1vw,26px)]" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                    {p.title}
                  </span>
                  <span className="text-right text-[12.5px] tracking-[0.08em] text-[rgba(43,39,33,0.36)] uppercase">
                    {p.place}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <Rule short />

        <section id="contact" className="mx-auto max-w-[1080px] scroll-mt-28 px-[clamp(20px,5vw,48px)]">
          <SectionLabel>Contact</SectionLabel>
          <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-start gap-[clamp(24px,4vw,48px)] max-md:grid-cols-1">
            <ContactForm />
            <div>
              <p className="m-0 max-w-[56ch] text-[clamp(17px,1.7vw,20px)] leading-[1.74] font-light">
                Write at{" "}
                <a
                  href="mailto:bvmanoj61@gmail.com"
                  className="text-[#2b2721] underline decoration-[rgba(43,39,33,0.28)] underline-offset-4 transition-colors hover:decoration-[#2b2721]"
                >
                  bvmanoj61@gmail.com
                </a>
                . I read everything, and I answer most of it.
              </p>
              <p className="mt-5 mb-0 flex flex-wrap gap-[22px] text-[12px] tracking-[0.24em] uppercase">
                <a className="underline decoration-[rgba(43,39,33,0.28)] underline-offset-4 hover:decoration-[#2b2721]" href="https://github.com/Venkata-Manoj" target="_blank" rel="me noopener">
                  GitHub
                </a>
                <a className="underline decoration-[rgba(43,39,33,0.28)] underline-offset-4 hover:decoration-[#2b2721]" href="https://linkedin.com/in/venkata-manoj" target="_blank" rel="me noopener">
                  LinkedIn
                </a>
                <a className="underline decoration-[rgba(43,39,33,0.28)] underline-offset-4 hover:decoration-[#2b2721]" href="mailto:bvmanoj61@gmail.com">
                  Email
                </a>
              </p>
              <p className="mt-5 mb-0 text-[12px] leading-[1.8] tracking-[0.24em] text-[rgba(43,39,33,0.5)] uppercase">
                Replies within a day · India · Open to AI/ML internships
              </p>
            </div>
          </div>
        </section>

        <p className="mt-[clamp(48px,7vh,84px)] pb-11 text-center text-[11.5px] tracking-[0.24em] text-[rgba(43,39,33,0.36)] uppercase">
          India · Sketchbook · Vol. 01
        </p>
      </main>
    </>
  );
}
