"use client";

import type { PlateMotif } from "@/content/plates";

/** Generative line-art motifs — our own ornaments, not copies of the original. */
export function Motif({ motif, accent }: { motif: PlateMotif; accent: string }) {
  const stroke = accent;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 1.1,
    strokeLinecap: "round" as const,
    opacity: 0.75,
  };
  switch (motif) {
    case "sun":
      return (
        <svg viewBox="0 0 200 140" className="h-auto w-full" aria-hidden="true">
          <circle cx="100" cy="70" r="26" {...common} />
          <circle cx="100" cy="70" r="34" {...common} opacity={0.35} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * 42}
                y1={70 + Math.sin(a) * 42}
                x2={100 + Math.cos(a) * 54}
                y2={70 + Math.sin(a) * 54}
                {...common}
              />
            );
          })}
          <path d="M20 118 Q 60 104 100 112 T 180 108" {...common} opacity={0.4} />
        </svg>
      );
    case "arches":
      return (
        <svg viewBox="0 0 200 140" className="h-auto w-full" aria-hidden="true">
          {[30, 60, 90, 120, 150].map((x, i) => (
            <path key={x} d={`M${x - 18} 118 L${x - 18} 66 Q${x} 40 ${x + 18} 66 L${x + 18} 118`} {...common} opacity={0.35 + i * 0.1} />
          ))}
          <line x1="10" y1="118" x2="190" y2="118" {...common} />
        </svg>
      );
    case "waves":
      return (
        <svg viewBox="0 0 200 140" className="h-auto w-full" aria-hidden="true">
          {[40, 62, 84, 106].map((y, i) => (
            <path key={y} d={`M10 ${y} Q 40 ${y - 12} 70 ${y} T 130 ${y} T 190 ${y}`} {...common} opacity={0.4 + i * 0.12} />
          ))}
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 200 140" className="h-auto w-full" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={24 + c * 22} cy={22 + r * 18} r={2.1} fill={stroke} opacity={0.28 + ((r + c) % 3) * 0.18} />
            ))
          )}
        </svg>
      );
    case "peaks":
      return (
        <svg viewBox="0 0 200 140" className="h-auto w-full" aria-hidden="true">
          <path d="M8 112 L64 44 L96 84 L126 52 L192 112 Z" {...common} />
          <path d="M64 44 L74 58 L60 62 Z" fill={stroke} opacity={0.3} stroke="none" />
          <path d="M8 112 H192" {...common} />
        </svg>
      );
    case "orbit":
      return (
        <svg viewBox="0 0 200 140" className="h-auto w-full" aria-hidden="true">
          <circle cx="100" cy="70" r="8" fill={stroke} opacity={0.7} stroke="none" />
          <ellipse cx="100" cy="70" rx="62" ry="26" {...common} />
          <ellipse cx="100" cy="70" rx="62" ry="26" {...common} transform="rotate(38 100 70)" opacity={0.4} />
          <circle cx="158" cy="62" r="3.4" fill={stroke} opacity={0.8} stroke="none" />
        </svg>
      );
    case "bloom":
      return (
        <svg viewBox="0 0 200 140" className="h-auto w-full" aria-hidden="true">
          <g {...common}>
            {[0, 45, 90, 135].map((r) => (
              <ellipse key={r} cx="100" cy="62" rx="12" ry="30" transform={`rotate(${r} 100 62)`} />
            ))}
          </g>
          <circle cx="100" cy="62" r="5" fill={stroke} opacity={0.6} stroke="none" />
          <path d="M100 92 Q 100 112 84 124 M100 92 Q 104 110 120 118" {...common} />
        </svg>
      );
  }
}
