"use client";

import type { Plate } from "@/content/plates";

export function PlateIndex({ plates }: { plates: Plate[] }) {
  return (
    <ol className="m-0 list-none border-t border-[rgba(43,39,33,0.14)] p-0">
      {plates.map((p, i) => (
        <li key={`${p.title}-${i}`}>
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
  );
}
