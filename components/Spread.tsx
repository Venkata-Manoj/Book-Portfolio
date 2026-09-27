"use client";

import type { Plate } from "@/content/plates";
import { Motif } from "./Motif";

/**
 * One full open spread. Pure presentational — no interaction state.
 * Left page = field notes, right page = plate.
 * Designed to be legible at 900px and still hold up at 2.3x loupe zoom.
 */
const FRAME =
  "rounded-[3px] border border-[rgba(43,39,33,0.2)] object-cover p-[3px] shadow-[0_6px_16px_rgba(58,44,26,0.25)]";
const CAPTION = "mt-[3%] text-[clamp(8px,1.3vw,12px)] italic";
const CAPTION_STYLE_EXTRA = { fontFamily: "var(--font-display), Georgia, serif" };

/**
 * Left-page media, in priority order: contact sheet → single image → generative
 * motif. A gallery is a 62%-wide hero plus 28%-wide tiles (default 1:1) beside
 * it, so 2–4 shots read as a scrapbook page instead of a slideshow.
 */
function PlateMedia({ plate }: { plate: Plate }) {
  if (plate.images?.length) {
    return (
      <div className="mt-[5%] flex flex-wrap items-start gap-x-[4%] gap-y-[3%]">
        {plate.images.map((im, i) => (
          <figure key={im.src} className={`m-0 ${i === 0 ? "w-[62%]" : "w-[28%]"}`}>
            <img
              src={im.src}
              alt={im.alt ?? im.caption ?? plate.title}
              draggable={false}
              className={`w-full ${i === 0 ? "rotate-[-1.5deg]" : "rotate-[1.2deg]"} ${FRAME}`}
              style={{
                background: "#fbf8f0",
                aspectRatio: im.aspect ?? (i === 0 ? "4/5" : "1/1"),
              }}
            />
            {im.caption && (
              <figcaption className={CAPTION} style={{ ...CAPTION_STYLE_EXTRA, color: plate.accent }}>
                {im.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    );
  }

  if (plate.image) {
    return (
      <figure className="m-0 mt-[5%]">
        <img
          src={plate.image}
          alt={plate.imageAlt ?? plate.imageCaption ?? plate.title}
          draggable={false}
          className={`aspect-[4/5] w-[62%] rotate-[-1.5deg] ${FRAME}`}
          style={{ background: "#fbf8f0" }}
        />
        {plate.imageCaption && (
          <figcaption className={CAPTION} style={{ ...CAPTION_STYLE_EXTRA, color: plate.accent }}>
            {plate.imageCaption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div className="mt-[6%] opacity-80">
      <Motif motif={plate.motif} accent={plate.accent} />
    </div>
  );
}

/** Small-caps chips for the tools/languages used on this plate. */
function PlateStack({ plate }: { plate: Plate }) {
  if (!plate.stack?.length) return null;
  return (
    <ul className="m-0 mt-[4%] flex list-none flex-wrap gap-x-[3%] gap-y-[0.6em] p-0 text-[clamp(7px,1.05vw,10px)] tracking-[0.16em] text-[rgba(43,39,33,0.5)] uppercase">
      {plate.stack.map((s) => (
        <li key={s} className="rounded-full border border-[rgba(43,39,33,0.14)] px-[3.2%] py-[0.35em]">
          {s}
        </li>
      ))}
    </ul>
  );
}

/** Two-column metric table (dl > div > dt/dd is valid HTML5). */
function PlateMetrics({ plate }: { plate: Plate }) {
  if (!plate.metrics?.length) return null;
  return (
    <dl className="m-0 mb-[1em] grid grid-cols-2 gap-x-[6%] text-[clamp(7px,1.05vw,10px)] tracking-[0.14em] uppercase">
      {plate.metrics.map((m) => (
        <div
          key={m.label}
          className="flex items-baseline justify-between gap-[0.5em] border-b border-[rgba(43,39,33,0.12)] py-[0.3em]"
        >
          <dt className="m-0 text-[rgba(43,39,33,0.5)]">{m.label}</dt>
          <dd className="m-0" style={{ color: plate.accent }}>
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Outbound links. They sit at z-[61] — above the `.sb-zone` drag buttons (z-60)
 * — and stop pointerdown so tapping one never starts a page turn, the same
 * pattern the nav arrows and the loupe grip use. Copies inside the aria-hidden
 * mirrors (turn halves, loupe copy) are neutralised by the `.plate-link` rule
 * in globals.css.
 */
function PlateLinks({ plate }: { plate: Plate }) {
  const links = [...(plate.link ? [plate.link] : []), ...(plate.links ?? [])];
  if (!links.length) return null;
  return (
    <p className="relative z-[61] mt-[0.8em] mb-0 flex flex-wrap gap-x-[6%] gap-y-[0.4em] text-[clamp(7px,1.1vw,10.5px)] tracking-[0.18em] uppercase">
      {links.map((l) => (
        <a
          key={`${l.label}-${l.href}`}
          href={l.href}
          target="_blank"
          rel="me noopener"
          onPointerDown={(e) => e.stopPropagation()}
          className="plate-link pointer-events-auto underline decoration-[rgba(43,39,33,0.28)] underline-offset-4 transition-colors hover:decoration-[#2b2721]"
          style={{ color: plate.accent }}
        >
          {l.label}
        </a>
      ))}
    </p>
  );
}

/** Parse [text](url) inline links in body copy. */
function renderBody(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a
        key={k++}
        href={m[2]}
        target="_blank"
        rel="me noopener"
        onPointerDown={(e) => e.stopPropagation()}
        className="pointer-events-auto underline decoration-[rgba(43,39,33,0.28)] underline-offset-2 transition-colors hover:decoration-[#2b2721]"
      >
        {m[1]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

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
          <PlateMedia plate={plate} />
          <PlateStack plate={plate} />
        </div>
        <div>
          <PlateMetrics plate={plate} />
          <p
            className="max-w-[34ch] text-[clamp(8px,1.35vw,13.5px)] font-light leading-[1.7]"
            style={{ color: "rgba(43,39,33,0.82)" }}
          >
            {renderBody(plate.body)}
          </p>
          <PlateLinks plate={plate} />
          <p className="mt-[5%] text-[clamp(6px,1vw,9px)] uppercase tracking-[0.2em] text-[rgba(43,39,33,0.36)]">
            {plate.place}
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
            {plate.subLink ? (
              <a
                href={plate.subLink}
                onPointerDown={(e) => e.stopPropagation()}
                className="pointer-events-auto underline decoration-[rgba(43,39,33,0.28)] underline-offset-2 transition-colors hover:decoration-[#2b2721]"
              >
                {plate.sub}
              </a>
            ) : (
              plate.sub
            )}
          </p>
          <div className="mt-[5%] flex justify-end">
            <span className="block h-px w-[38%]" style={{ background: plate.accent, opacity: 0.7 }} />
          </div>
        </div>
        <p className="relative text-[clamp(9px,1.6vw,15px)] italic" style={{ fontFamily: "var(--font-display), Georgia, serif", color: plate.accent }}>
          {plate.title}
        </p>
        {plate.repo && (
          <p className="relative z-[61] mt-[2%] text-[11px] tracking-[0.18em] text-[rgba(43,39,33,0.5)] uppercase">
            <a
              href={`https://${plate.repo}`}
              target="_blank"
              rel="noopener"
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto hover:underline"
            >
              {plate.repo}
            </a>
            {plate.live && (
              <>
                {" · "}
                <a
                  href={`https://${plate.live}`}
                  target="_blank"
                  rel="noopener"
                  onPointerDown={(e) => e.stopPropagation()}
                  className="pointer-events-auto hover:underline"
                >
                  Live ↗
                </a>
              </>
            )}
          </p>
        )}
      </div>

      {/* page edge highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-8px_18px_rgba(120,90,50,0.08)]" />
    </div>
  );
}
