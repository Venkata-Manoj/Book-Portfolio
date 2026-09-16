"use client";

import type { Plate } from "@/content/plates";
import { Motif } from "./Motif";

/**
 * One full open spread. Pure presentational — no interaction state.
 * Left page = field notes, right page = plate.
 * Designed to be legible at 900px and still hold up at 2.3x loupe zoom.
 */
export function Spread({ plate, folio }: { plate: Plate; folio: string }) {
  return (
    <div className="paper-grain relative grid h-full w-full grid-cols-2 overflow-hidden rounded-[10px] bg-[#f6f1e6] shadow-[inset_0_0_60px_rgba(120,90,50,0.12)]">
      {/* center gutter */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[7%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[rgba(52,38,20,0.16)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-[rgba(43,39,33,0.18)]" />

      {/* LEFT */}
      <div className="relative flex flex-col justify-between p-[5%] pl-[7%]">
        <div>
          <p className="text-[clamp(7px,1.1vw,10px)] uppercase tracking-[0.24em] text-[rgba(43,39,33,0.5)]">
            {plate.kicker} — {folio}
          </p>
          {plate.image ? (
            <figure className="m-0 mt-[5%]">
              <img
                src={plate.image}
                alt={plate.imageCaption ?? plate.title}
                draggable={false}
                className="aspect-[4/5] w-[62%] rotate-[-1.5deg] rounded-[3px] border border-[rgba(43,39,33,0.2)] object-cover p-[3px] shadow-[0_6px_16px_rgba(58,44,26,0.25)]"
                style={{ background: "#fbf8f0" }}
              />
              {plate.imageCaption && (
                <figcaption
                  className="mt-[3%] text-[clamp(8px,1.3vw,12px)] italic"
                  style={{ fontFamily: "var(--font-display), Georgia, serif", color: plate.accent }}
                >
                  {plate.imageCaption}
                </figcaption>
              )}
            </figure>
          ) : (
            <div className="mt-[6%] opacity-80">
              <Motif motif={plate.motif} accent={plate.accent} />
            </div>
          )}
        </div>
        <div>
          <p
            className="max-w-[34ch] text-[clamp(8px,1.35vw,13.5px)] font-light leading-[1.7]"
            style={{ color: "rgba(43,39,33,0.82)" }}
          >
            {plate.body}
          </p>
          <p className="mt-[5%] text-[clamp(6px,1vw,9px)] uppercase tracking-[0.2em] text-[rgba(43,39,33,0.36)]">
            Ink · wash · {plate.place}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative flex flex-col justify-between p-[5%] pr-[7%] text-right">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ background: `radial-gradient(70% 55% at 70% 30%, ${plate.accent} 0%, transparent 70%)` }}
        />
        <p className="relative text-[clamp(7px,1.1vw,10px)] uppercase tracking-[0.24em] text-[rgba(43,39,33,0.5)]">
          Plate {folio}
        </p>
        <div className="relative">
          <h2
            className="text-[clamp(16px,3.4vw,38px)] leading-[1.02]"
            style={{ fontFamily: "var(--font-display), Georgia, serif", color: "#2b2721" }}
          >
            {plate.headline}
          </h2>
          <p className="mt-[3%] text-[clamp(8px,1.3vw,12.5px)] font-light tracking-wide text-[rgba(43,39,33,0.6)]">
            {plate.sub}
          </p>
          <div className="mt-[5%] flex justify-end">
            <span className="block h-px w-[38%]" style={{ background: plate.accent, opacity: 0.7 }} />
          </div>
        </div>
        <p className="relative text-[clamp(9px,1.6vw,15px)] italic" style={{ fontFamily: "var(--font-display), Georgia, serif", color: plate.accent }}>
          {plate.title}
        </p>
      </div>

      {/* page edge highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-8px_18px_rgba(120,90,50,0.08)]" />
    </div>
  );
}
