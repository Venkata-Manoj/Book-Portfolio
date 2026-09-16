"use client";

import type { MutableRefObject } from "react";
import { N_STRIPS, SPAN, type TurnDir } from "@/lib/book-physics";
import type { Plate } from "@/content/plates";

interface Props {
  dir: TurnDir;
  from: Plate;
  to: Plate;
  folioFrom: string;
  folioTo: string;
  stripRefs: MutableRefObject<(HTMLDivElement | null)[]>;
}

/**
 * The bending leaf: N nested strips. Each strip rotates a fraction of the
 * total curl so the surface arcs instead of hinging.
 *
 * Redesign note vs the original: the original slices full-spread PNGs as
 * background-images per strip (cheap on GPU). Slicing live React text the
 * same way would mount 36 full spreads per turn — heavy and illegible
 * mid-bend. So faces here carry the plate's paper + wash + folio, while the
 * full text lives on the static halves underneath. Same geometry, same
 * lighting math, calmer DOM.
 */
export function CurlLeaf({ dir, from, to, folioFrom, folioTo, stripRefs }: Props) {
  return (
    <div
      className={`curl ${dir}`}
      style={{ ["--n" as string]: N_STRIPS, ["--span" as string]: SPAN } as React.CSSProperties}
    >
      <StripNode
        depth={0}
        dir={dir}
        from={from}
        to={to}
        folioFrom={folioFrom}
        folioTo={folioTo}
        stripRefs={stripRefs}
      />
    </div>
  );
}

function StripNode({
  depth,
  dir,
  from,
  to,
  folioFrom,
  folioTo,
  stripRefs,
}: Omit<Props, "stripRefs"> & { depth: number; stripRefs: Props["stripRefs"] }) {
  const isEdge = depth === N_STRIPS - 1;
  return (
    <div
      ref={(n) => {
        stripRefs.current[depth] = n;
      }}
      className={`strip${isEdge ? " edge" : ""}`}
    >
      <div className="face front" style={{ background: paperWash(from.accent) }}>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-serif italic"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            color: "rgba(43,39,33,0.28)",
            fontSize: "clamp(10px, 2vw, 20px)",
            opacity: depth > N_STRIPS - 5 ? 1 : 0,
          }}
        >
          {folioFrom}
        </span>
        <div className="sh" />
        <div className="gl" />
      </div>
      <div className="face back" style={{ background: paperWash(to.accent) }}>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-serif italic"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            color: "rgba(43,39,33,0.28)",
            fontSize: "clamp(10px, 2vw, 20px)",
            opacity: depth > N_STRIPS - 5 ? 1 : 0,
          }}
        >
          {folioTo}
        </span>
        <div className="sh" />
        <div className="gl" />
      </div>
      {depth + 1 < N_STRIPS && (
        <StripNode
          depth={depth + 1}
          dir={dir}
          from={from}
          to={to}
          folioFrom={folioFrom}
          folioTo={folioTo}
          stripRefs={stripRefs}
        />
      )}
    </div>
  );
}

function paperWash(accent: string) {
  return `linear-gradient(180deg, #f6f1e6 0%, #efe8d8 100%), radial-gradient(80% 60% at 50% 30%, ${accent}26 0%, transparent 70%)`;
}
