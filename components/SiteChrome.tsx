"use client";

export function TopBar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[500] flex flex-col items-center gap-2.5 px-4 pt-[18px] pb-16 text-center before:absolute before:inset-0 before:-z-[1] before:bg-gradient-to-b before:from-[rgba(240,236,226,0.94)] before:via-[rgba(240,236,226,0.7)] before:to-transparent before:backdrop-blur-md before:[mask-image:linear-gradient(180deg,#000_46%,transparent)]">
      <a
        href="#"
        className="pointer-events-auto font-[var(--font-display)] text-[clamp(20px,2.4vw,30px)] leading-none whitespace-nowrap"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        B V Manoj
      </a>
      <nav className="pointer-events-auto flex items-center gap-[clamp(14px,2vw,26px)] text-[15px] font-light tracking-[0.06em] max-sm:gap-2.5 max-sm:text-[13px]">
        <a href="#plates" className="text-[rgba(43,39,33,0.58)] transition-colors hover:text-[#2b2721]">
          Journal
        </a>
        <a href="#about" className="text-[rgba(43,39,33,0.58)] transition-colors hover:text-[#2b2721]">
          About
        </a>
        <a href="#contact" className="text-[rgba(43,39,33,0.58)] transition-colors hover:text-[#2b2721]">
          Contact
        </a>
        <div className="ml-0.5 flex items-center gap-3 border-l border-[rgba(43,39,33,0.14)] pl-[clamp(12px,1.6vw,20px)]">
          <a href="https://github.com/Venkata-Manoj" target="_blank" rel="me noopener" aria-label="GitHub" className="p-1 text-[rgba(43,39,33,0.58)] hover:text-[#2b2721]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="block h-4 w-4" aria-hidden="true">
              <path d="M12 .8C5.5.8.8 5.5.8 12c0 4.9 3.2 9.1 7.6 10.6.6.1.8-.2.8-.5v-2c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3 0-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.2a10.4 10.4 0 0 1 5.4 0c2.1-1.5 3-1.2 3-1.2.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.2 11.2 0 0 0 23.2 12C23.2 5.5 18.5.8 12 .8Z" />
            </svg>
          </a>
          <a href="https://linkedin.com/in/venkata-manoj" target="_blank" rel="me noopener" aria-label="LinkedIn" className="p-1 text-[rgba(43,39,33,0.58)] hover:text-[#2b2721]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="block h-4 w-4" aria-hidden="true">
              <path d="M4.9 3.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM3.1 9.3h3.6v11.6H3.1V9.3Zm6 0h3.4v1.6h.05c.48-.9 1.65-1.85 3.4-1.85 3.63 0 4.3 2.35 4.3 5.4v6.45h-3.6v-5.72c0-1.36-.02-3.12-1.92-3.12-1.92 0-2.22 1.48-2.22 3.02v5.82H9.1V9.3Z" />
            </svg>
          </a>
          <a href="mailto:bvmanoj61@gmail.com" aria-label="Email" className="p-1 text-[rgba(43,39,33,0.58)] hover:text-[#2b2721]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="block h-4 w-4" aria-hidden="true">
              <rect x="2.4" y="4.6" width="19.2" height="14.8" rx="2.4" />
              <path d="m3.2 6.4 8.8 6.6 8.8-6.6" />
            </svg>
          </a>
          <a href="/Resume_Manoj.pdf" target="_blank" rel="noopener" aria-label="Resume" className="p-1 text-[rgba(43,39,33,0.58)] hover:text-[#2b2721]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="block h-4 w-4" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="m9 15 3 3 3-3" />
            </svg>
          </a>
        </div>
      </nav>
    </header>
  );
}

export function Rule({ short = false }: { short?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto my-[clamp(30px,6vh,64px)] h-[clamp(26px,4vw,46px)] opacity-50 ${short ? "w-[min(420px,52vw)] opacity-40" : "w-[min(1080px,86vw)]"}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 26'%3E%3Cg fill='none' stroke='%232b2721' stroke-width='1' opacity='0.6'%3E%3Cpath d='M10 13 H250'/%3E%3Cpath d='M350 13 H590'/%3E%3Ccircle cx='300' cy='13' r='4'/%3E%3Cpath d='M272 13 q14 -12 28 0 q-14 12 -28 0 M300 13 q14 -12 28 0 q-14 12 -28 0'/%3E%3Ccircle cx='258' cy='13' r='1.6' fill='%232b2721'/%3E%3Ccircle cx='342' cy='13' r='1.6' fill='%232b2721'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "100% auto",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-[18px] text-[11px] uppercase tracking-[0.24em] text-[rgba(43,39,33,0.36)]">{children}</p>
  );
}

export function Botany() {
  return (
    <>
      <svg viewBox="0 0 200 320" aria-hidden="true" className="pointer-events-none absolute bottom-[2%] left-[clamp(-40px,-1vw,0px)] z-0 w-[clamp(120px,15vw,250px)] opacity-50 select-none max-lg:hidden">
        <g fill="none" stroke="#5d7a6b" strokeWidth="1.2" opacity="0.8">
          <path d="M100 310 C 96 220 92 140 100 20" />
          {[60, 100, 140, 180, 220].map((y, i) => (
            <g key={y}>
              <path d={`M100 ${y} Q ${60 - i * 3} ${y - 26} ${34 - i * 2} ${y - 44}`} />
              <path d={`M100 ${y} Q ${140 + i * 3} ${y - 26} ${166 + i * 2} ${y - 44}`} />
              <ellipse cx={34 - i * 2} cy={y - 46} rx="10" ry="5" transform={`rotate(-32 ${34 - i * 2} ${y - 46})`} />
              <ellipse cx={166 + i * 2} cy={y - 46} rx="10" ry="5" transform={`rotate(32 ${166 + i * 2} ${y - 46})`} />
            </g>
          ))}
        </g>
      </svg>
      <svg viewBox="0 0 160 260" aria-hidden="true" className="pointer-events-none absolute right-[clamp(-30px,0vw,10px)] -bottom-[2%] z-0 w-[clamp(100px,12vw,200px)] opacity-50 select-none max-lg:hidden">
        <g fill="none" stroke="#9a6a3e" strokeWidth="1.2" opacity="0.8">
          <path d="M80 250 C 78 180 76 110 80 16" />
          {[70, 110, 150, 190].map((y) => (
            <g key={y}>
              <circle cx="80" cy={y} r="9" />
              <circle cx="80" cy={y} r="3.5" />
            </g>
          ))}
        </g>
      </svg>
    </>
  );
}
