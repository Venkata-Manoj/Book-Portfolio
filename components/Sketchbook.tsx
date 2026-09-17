"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAG,
  N_STRIPS,
  SPAN,
  TILT_X,
  TILT_Y,
  ZOOM_MAX,
  ZOOM_MIN,
  captionOpacities,
  dragToT,
  leafAngles,
  nextIndex,
  prevIndex,
  shouldCommit,
  stripLight,
  type TurnDir,
} from "@/lib/book-physics";
import type { Plate } from "@/content/plates";
import { Spread } from "./Spread";
import { CurlLeaf } from "./CurlLeaf";

interface Spring {
  kind: "spring" | "tween";
  // spring
  v?: number;
  target?: number;
  k?: number;
  c?: number;
  // tween
  from?: number;
  dur?: number;
  e?: number;
  done?: (() => void) | null;
}

interface Props {
  plates: Plate[];
  landing?: number;
  onSpreadChange?: (i: number) => void;
}

const folio = (i: number) => String(i + 1).padStart(2, "0");

const STORAGE_KEY = "sketchbook:index";

function readSavedIndex(total: number): number | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw.trim() === "") return null;
    const n = Number(raw);
    if (!Number.isInteger(n)) return null;
    if (n < 0 || n >= total) return null;
    return n;
  } catch {
    return null;
  }
}

function saveIndex(i: number) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(i));
  } catch {
    // ignore (private mode / quota)
  }
}

/** Left/right static half — mirrors the original .sb-half 200%-width trick. */
function Half({ plate, folio: f, side }: { plate: Plate; folio: string; side: "left" | "right" }) {
  return (
    <div
      className={`absolute top-0 bottom-0 w-1/2 overflow-hidden ${side === "left" ? "left-0" : "left-1/2"}`}
      aria-hidden="true"
    >
      <div className={`h-full w-[200%] ${side === "right" ? "-ml-[100%]" : ""}`}>
        <Spread plate={plate} folio={f} />
      </div>
      <div className={`gutter-shade ${side}`} />
    </div>
  );
}

export function Sketchbook({ plates, landing = 0, onSpreadChange }: Props) {
  const M = plates.length;
  const [idx, setIdx] = useState(landing);
  const [turn, setTurn] = useState<{ dir: TurnDir; from: number; to: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null); // sb-3d
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const capOutRef = useRef<HTMLParagraphElement>(null);
  const capInRef = useRef<HTMLParagraphElement>(null);
  const capSingleRef = useRef<HTMLParagraphElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);
  const zoomWrapRef = useRef<HTMLDivElement>(null);
  const zoomInnerRef = useRef<HTMLDivElement>(null);

  const turnT = useRef(0);
  const turnRef = useRef<{ dir: TurnDir; from: number; to: number } | null>(null);
  const idxRef = useRef(landing);
  const spring = useRef<Spring | null>(null);
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const drag = useRef<{ dir: TurnDir; x0: number; w: number; moved: number; vel: number; tPrev: number } | null>(null);
  const view = useRef({ rx: 0, ry: 0, z: 1, trx: 0, try_: 0, tz: 1 });
  const viewActive = useRef(false);
  const lastZ = useRef(1);
  const introOn = useRef(false);
  const riffle = useRef<{ bell: number; dur: number }[]>([]);
  const riffleAt = useRef(0);

  // loupe state (refs for 60fps, useState only for UI chrome)
  const loupeXY = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const loupeGrab = useRef<{ cx: number; cy: number; lx0: number; ly0: number } | null>(null);
  const loupeTarget = useRef<{ x: number; y: number } | null>(null);
  const [loupeOn, setLoupeOn] = useState(true);
  const loupeOnRef = useRef(true);
  const [zoomRead, setZoomRead] = useState("100%");
  const [zoomed, setZoomed] = useState({ out: false, in: false });
  const [hintGone, setHintGone] = useState(false);
  const [introClass, setIntroClass] = useState("");
  const reduced = useRef(false);
  const [, forceZoomPaint] = useState(0);

  // Mirror state into the per-frame refs after every render (never during render).
  useEffect(() => {
    turnRef.current = turn;
    idxRef.current = idx;
    loupeOnRef.current = loupeOn;
  });

  const folioOf = useCallback((i: number) => folio(i), []);

  /* ---------------- core paint helpers (imperative, per-frame cheap) ---------------- */

  const applyTurn = useCallback((t: number) => {
    const box = boxRef.current;
    if (!box) return;
    const { tt, td, shade } = leafAngles(t);
    box.style.setProperty("--tt", `${tt.toFixed(2)}deg`);
    box.style.setProperty("--td", `${td.toFixed(3)}deg`);
    box.style.setProperty("--shade", shade.toFixed(3));
    const { out, inn } = captionOpacities(t);
    if (capOutRef.current) capOutRef.current.style.opacity = out.toFixed(3);
    if (capInRef.current) capInRef.current.style.opacity = inn.toFixed(3);
    for (let i = 0; i < stripRefs.current.length; i++) {
      const s = stripRefs.current[i];
      if (!s) continue;
      const { lit, a1, a2 } = stripLight(tt, td, i);
      s.style.setProperty("--lit", lit.toFixed(3));
      s.style.setProperty("--a1", a1.toFixed(3));
      s.style.setProperty("--a2", a2.toFixed(3));
    }
  }, []);

  const layout = useCallback(() => {
    const book = bookRef.current;
    const box = boxRef.current;
    if (!book || !box) return;
    box.style.setProperty("--bw", `${book.clientWidth}px`);
  }, []);

  const applyView = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const v = view.current;
    box.style.setProperty("--rx", `${v.rx.toFixed(2)}deg`);
    box.style.setProperty("--ry", `${v.ry.toFixed(2)}deg`);
    box.style.setProperty("--zoom", v.z.toFixed(3));
    if (v.z !== lastZ.current) {
      lastZ.current = v.z;
      placeLoupe();
    }
  }, []);

  const kick = useCallback(() => {
    if (raf.current === null) {
      last.current = performance.now();
      raf.current = requestAnimationFrame(tick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- loupe ---------------- */

  const loupeSize = useCallback(() => {
    const book = bookRef.current;
    if (!book) return 220;
    return Math.round(Math.max(165, Math.min(262, book.clientWidth * 0.235)));
  }, []);

  function bookDims() {
    const book = bookRef.current;
    if (!book) return { w: 0, h: 0 };
    return { w: book.clientWidth, h: book.clientHeight };
  }

  function restLoupe() {
    const { w, h } = bookDims();
    if (!w) return;
    loupeXY.current = { x: w * 0.88, y: h * 0.855 };
    placeLoupe();
  }

  function placeLoupe() {
    const loupe = loupeRef.current;
    const zw = zoomWrapRef.current;
    const zi = zoomInnerRef.current;
    const { x: lx, y: ly } = loupeXY.current;
    if (lx === null || ly === null || !loupe || !zw || !zi) return;
    const { w: bw, h: bh } = bookDims();
    if (!bw) return;
    const R = loupeSize() / 2;
    const bez = R * 2 * 0.058;
    loupe.style.setProperty("--lr", `${R * 2}px`);
    loupe.style.transform = `translate3d(${(lx - R).toFixed(1)}px,${(ly - R).toFixed(1)}px,0)`;
    loupe.classList.toggle("on", loupeOnRef.current);

    const z = view.current.z;
    const cx = bw / 2;
    const cy = bh / 2;
    const x0 = cx - (bw / 2) * z;
    const x1 = cx + (bw / 2) * z;
    const y0 = cy - (bh / 2) * z;
    const y1 = cy + (bh / 2) * z;
    const nx = Math.max(x0, Math.min(lx, x1));
    const ny = Math.max(y0, Math.min(ly, y1));
    const inside =
      lx > x0 && lx < x1 && ly > y0 && ly < y1
        ? Math.min(lx - x0, x1 - lx, ly - y0, y1 - ly)
        : -Math.hypot(lx - nx, ly - ny);
    const k = Math.max(0, Math.min(1, (inside + R * 0.3) / (R * 0.55)));
    zw.style.opacity = (loupeOnRef.current ? k : 0).toFixed(3);
    if (k <= 0.002) return;
    const r = (R - bez).toFixed(1);
    const mask = `radial-gradient(circle ${r}px at ${lx.toFixed(1)}px ${ly.toFixed(1)}px,#000 calc(100% - 1px),transparent 100%)`;
    (zw.style as CSSStyleDeclaration).webkitMaskImage = mask;
    zw.style.maskImage = mask;
    const px = cx + (lx - cx) / z;
    const py = cy + (ly - cy) / z;
    const s = MAG * z;
    zi.style.transform = `translate(${(lx - px * s).toFixed(1)}px,${(ly - py * s).toFixed(1)}px) scale(${s.toFixed(4)})`;
  }

  function shoveLoupe(dir: TurnDir) {
    if (!loupeOnRef.current) return;
    const { x: lx, y: ly } = loupeXY.current;
    if (lx === null || ly === null || loupeGrab.current) return;
    const { w, h } = bookDims();
    if (!w) return;
    const nx = (w / 2 + (lx - w / 2) / view.current.z) / w;
    const ny = (h / 2 + (ly - h / 2) / view.current.z) / h;
    if (nx < 0.02 || nx > 0.98 || ny < 0.02 || ny > 0.98) return;
    loupeTarget.current = { x: w * (dir === "next" ? 0.12 : 0.88), y: h * 0.855 };
    kick();
  }

  function loupeEase(): boolean {
    const t = loupeTarget.current;
    if (!t) return false;
    if (loupeGrab.current) {
      loupeTarget.current = null;
      return false;
    }
    const { x: lx, y: ly } = loupeXY.current;
    if (lx === null || ly === null) return false;
    const dx = t.x - lx;
    const dy = t.y - ly;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      loupeXY.current = { x: t.x, y: t.y };
      loupeTarget.current = null;
      placeLoupe();
      return false;
    }
    loupeXY.current = { x: lx + dx * 0.17, y: ly + dy * 0.17 };
    placeLoupe();
    return true;
  }

  /* Shared loupe-grab handlers — grip and ring must never drift apart.
     Single grab ref, single move, single drop. */
  function onLoupeDown(e: React.PointerEvent) {
    if (!loupeOnRef.current || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    loupeTarget.current = null;
    if (loupeXY.current.x !== null && loupeXY.current.y !== null) {
      loupeGrab.current = {
        cx: e.clientX,
        cy: e.clientY,
        lx0: loupeXY.current.x,
        ly0: loupeXY.current.y,
      };
    }
    loupeRef.current?.classList.add("held");
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setHintGone(true);
  }

  function onLoupeMove(e: React.PointerEvent) {
    const g = loupeGrab.current;
    if (!g) return;
    e.stopPropagation();
    const { w, h } = bookDims();
    const R = loupeSize() / 2;
    loupeXY.current = {
      x: Math.max(-R * 0.7, Math.min(w + R * 0.7, g.lx0 + (e.clientX - g.cx))),
      y: Math.max(-R * 0.7, Math.min(h + R * 1.0, g.ly0 + (e.clientY - g.cy))),
    };
    placeLoupe();
  }

  function onLoupeDrop(e: React.PointerEvent) {
    if (!loupeGrab.current) return;
    e.stopPropagation();
    loupeGrab.current = null;
    loupeRef.current?.classList.remove("held");
  }

  /* ---------------- rAF loop ---------------- */

  function viewSpring(): boolean {
    const v = view.current;
    const e = 0.14;
    let moved = false;
    const pairs: [keyof typeof v, keyof typeof v][] = [["rx", "trx"], ["ry", "try_"], ["z", "tz"]];
    for (const [k, t] of pairs) {
      const d = (v[t] as number) - (v[k] as number);
      if (Math.abs(d) > 0.0006) {
        (v[k] as number) = (v[k] as number) + d * e;
        moved = true;
      } else {
        (v[k] as number) = v[t] as number;
      }
    }
    if (moved) applyView();
    viewActive.current = moved;
    return moved;
  }

  function tick(now: number) {
    raf.current = null;
    const dt = Math.min(0.032, (now - last.current) / 1000 || 0.016);
    last.current = now;
    const s = spring.current;
    const t = turnRef.current;
    if (s && t) {
      if (s.kind === "tween") {
        s.e = (s.e ?? 0) + dt;
        const k = Math.min(1, (s.e ?? 0) / (s.dur ?? 0.2));
        turnT.current = (s.from ?? 0) + ((s.target ?? 1) - (s.from ?? 0)) * k;
        applyTurn(turnT.current);
        if (k >= 1) {
          spring.current = null;
          const d = s.done;
          if (d) d();
        }
      } else {
        const x = turnT.current - (s.target ?? 1);
        s.v = (s.v ?? 0) + (-(s.k ?? 150) * x - (s.c ?? 22) * (s.v ?? 0)) * dt;
        turnT.current += (s.v ?? 0) * dt;
        if (Math.abs(turnT.current - (s.target ?? 1)) < 0.002 && Math.abs(s.v ?? 0) < 0.02) {
          turnT.current = s.target ?? 1;
          spring.current = null;
          applyTurn(turnT.current);
          const d = s.done;
          if (d) d();
        } else {
          applyTurn(turnT.current);
        }
      }
    }
    viewSpring();
    const lmoved = loupeEase();
    if ((spring.current || viewActive.current || lmoved) && raf.current === null) {
      raf.current = requestAnimationFrame(tick);
    }
  }

  function animateTo(target: number, onDone: (() => void) | null, stiff?: number, damp?: number) {
    spring.current = { kind: "spring", v: 0, target, done: onDone, k: stiff || 150, c: damp || 22 };
    kick();
  }
  function tweenTo(target: number, dur: number, onDone: (() => void) | null) {
    spring.current = { kind: "tween", from: turnT.current, target, dur, e: 0, done: onDone };
    kick();
  }

  /* ---------------- turns ---------------- */

  const startTurn = useCallback(
    (dir: TurnDir, t: number) => {
      spring.current = null;
      let from = idxRef.current;
      if (turnRef.current) {
        from = turnRef.current.to;
        setTurn(null);
        turnRef.current = null;
        setIdx(from);
        idxRef.current = from;
      }
      shoveLoupe(dir);
      const to = dir === "next" ? nextIndex(from, M) : prevIndex(from, M);
      turnT.current = t || 0;
      stripRefs.current = [];
      const nt = { dir, from, to };
      turnRef.current = nt;
      setTurn(nt);
      // apply on next paint via effect; also force zoom copy refresh
      forceZoomPaint((v) => v + 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [M]
  );

  const commit = useCallback(() => {
    const t = turnRef.current;
    if (!t) return;
    if (reduced.current) {
      setIdx(t.to);
      setTurn(null);
      turnRef.current = null;
      onSpreadChange?.(t.to);
      saveIndex(t.to);
      forceZoomPaint((v) => v + 1);
      return;
    }
    animateTo(1, () => {
      setIdx(t.to);
      setTurn(null);
      turnRef.current = null;
      onSpreadChange?.(t.to);
      saveIndex(t.to);
      forceZoomPaint((v) => v + 1);
    }, 170, 26);
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [M]);

  const cancel = useCallback(() => {
    if (!turnRef.current) return;
    animateTo(0, () => {
      setTurn(null);
      turnRef.current = null;
      forceZoomPaint((v) => v + 1);
    }, 150, 24);
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = useCallback(
    (dir: TurnDir) => {
      if (introOn.current) endIntro();
      if (turnRef.current) {
        const to = turnRef.current.to;
        setTurn(null);
        turnRef.current = null;
        setIdx(to);
        idxRef.current = to;
      }
      startTurn(dir, 0);
      // commit after paint
      requestAnimationFrame(() => commit());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startTurn, commit]
  );

  const goTo = useCallback(
    (i: number) => {
      spring.current = null; // kill any in-flight tween/spring so it can't overwrite this jump
      if (introOn.current) endIntro();
      if (i === idxRef.current && !turnRef.current) return;
      if (turnRef.current) {
        const to = turnRef.current.to;
        setTurn(null);
        turnRef.current = null;
        setIdx(to);
        idxRef.current = to;
      }
      const cur = idxRef.current;
      const fwd = (i - cur + M) % M;
      const back = (cur - i + M) % M;
      if (Math.min(fwd, back) === 1) {
        step(fwd === 1 ? "next" : "prev");
        return;
      }
      setIdx(i);
      onSpreadChange?.(i);
      saveIndex(i);
      forceZoomPaint((v) => v + 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [M, step]
  );

  /* ---------------- view / tilt / zoom ---------------- */

  const setView = useCallback(
    (rx: number, ry: number, z: number) => {
      const v = view.current;
      v.trx = Math.max(-TILT_X, Math.min(TILT_X, rx));
      v.try_ = Math.max(-TILT_Y, Math.min(TILT_Y, ry));
      v.tz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
      viewActive.current = true;
      kick();
      setZoomRead(`${Math.round(v.tz * 100)}%`);
      setZoomed({ out: v.tz <= ZOOM_MIN + 0.001, in: v.tz >= ZOOM_MAX - 0.001 });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const tiltTo = useCallback(
    (cx: number, cy: number) => {
      if (drag.current || loupeGrab.current) return;
      const book = bookRef.current;
      if (!book) return;
      const r = book.getBoundingClientRect();
      if (!r.width) return;
      const nx = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width * 0.62)));
      const ny = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height * 0.9)));
      setView(-ny * TILT_X, nx * TILT_Y, view.current.tz);
    },
    [setView]
  );

  /* ---------------- intro riffle ---------------- */

  function endIntro() {
    introOn.current = false;
    setIntroClass("");
  }

  function riffleStep() {
    const s = riffle.current[riffleAt.current];
    if (!s) {
      endIntro();
      return;
    }
    setIntroClass(s.bell > 0.55 ? "intro b2" : "intro");
    startTurn("next", 0);
    // wait a frame so CurlLeaf mounts before tweening
    requestAnimationFrame(() => {
      tweenTo(1, s.dur, () => {
        const t = turnRef.current;
        if (!t) return;
        setIdx(t.to);
        setTurn(null);
        turnRef.current = null;
        onSpreadChange?.(t.to);
        riffleAt.current += 1;
        forceZoomPaint((v) => v + 1);
        if (introOn.current && riffleAt.current < riffle.current.length) {
          // let React paint the settled spread, then continue
          requestAnimationFrame(() => riffleStep());
        } else {
          endIntro();
          forceZoomPaint((v) => v + 1);
        }
      });
      kick();
    });
  }

  function startIntro() {
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
    const params =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    if (coarse || reduced.current || params?.has("nointro")) {
      // Preserve a restored position; `landing` is only the default when nothing was saved.
      setIdx(idxRef.current);
      return;
    }
    const steps = M; // one full flick through the book, landing back on cover
    const arr: { bell: number; dur: number }[] = [];
    for (let r = 0; r < steps; r++) {
      const bell = Math.sin((Math.PI * r) / (steps - 1 || 1));
      arr.push({ bell, dur: 0.26 - 0.19 * bell });
    }
    riffle.current = arr;
    riffleAt.current = 0;
    introOn.current = true;
    setIntroClass("intro");
    riffleStep();
  }

  /* ---------------- effects: boot, layout, global listeners ---------------- */

  // keep view readout in sync + report index
  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    layout();
    applyView();
    setZoomRead("100%");
    setZoomed({ out: false, in: false });
    restLoupe();
    // resume-on-reload: restore the settled spread (SSR-safe: inside effect only).
    // `landing` stays the default when nothing valid was saved.
    const saved = readSavedIndex(M);
    if (saved !== null) {
      setIdx(saved);
      idxRef.current = saved;
    }
    onSpreadChange?.(idxRef.current);
    const t = setTimeout(() => {
      // Reopened on a saved spread: settle directly, don't replay the intro riffle.
      if (saved !== null) return;
      startIntro();
    }, 350);
    const onResize = () => {
      layout();
      const { w, h } = bookDims();
      if (loupeXY.current.x === null && w) {
        restLoupe();
      } else {
        placeLoupe();
      }
      void h;
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // after every paint: re-measure, reset caption fade, re-seat loupe
  useEffect(() => {
    layout();
    const box = boxRef.current;
    if (box) box.style.setProperty("--shade", turn ? String(Math.sin(Math.PI * turnT.current)) : "0");
    if (!turn) {
      if (capSingleRef.current) capSingleRef.current.style.opacity = "1";
    } else {
      applyTurn(turnT.current);
    }
    placeLoupe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, turn]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tiltTo(e.clientX, e.clientY);
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) setView(0, 0, view.current.tz);
    };
    const onBlur = () => setView(0, 0, view.current.tz);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      setHintGone(true);
      step(e.key === "ArrowRight" ? "next" : "prev");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut as EventListener);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut as EventListener);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKey);
    };
  }, [tiltTo, setView, step]);

  /* ---------------- stage pointer (drag to turn) ---------------- */

  const onStageDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Second+ click of a multi-click: let onDoubleClick reset zoom instead of turning again.
    if (e.detail > 1) return;
    // A loupe grab owns the pointer: never start a page turn from the glass,
    // even if a loupe pointerdown ever bubbles up to the stage.
    if (loupeGrab.current) return;
    if ((e.target as HTMLElement).closest?.(".loupe")) return;
    e.preventDefault();
    const zone = (e.target as HTMLElement).closest(".sb-zone");
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setHintGone(true);
    if (!zone || introOn.current) return;
    const book = bookRef.current;
    if (!book) return;
    const r = book.getBoundingClientRect();
    const dir: TurnDir = (e.clientX - r.left) / r.width > 0.5 ? "next" : "prev";
    startTurn(dir, 0);
    requestAnimationFrame(() => applyTurn(0));
    drag.current = { dir, x0: e.clientX, w: r.width, moved: 0, vel: 0, tPrev: performance.now() };
  };

  const onStageMove = (e: React.PointerEvent) => {
    if (loupeGrab.current) return;
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    d.moved = Math.max(d.moved, Math.abs(dx));
    const t = dragToT(dx, d.w, d.dir);
    const now = performance.now();
    d.vel = (t - turnT.current) / Math.max(0.001, (now - d.tPrev) / 1000);
    d.tPrev = now;
    turnT.current = t;
    applyTurn(t);
  };

  const endStageDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (loupeGrab.current) return;
    if (!d || !turnRef.current) return;
    if (shouldCommit(turnT.current, d.vel, d.moved)) commit();
    else cancel();
  };

  /* ---------------- render ---------------- */

  const cur = turn ? turn.to : idx;
  const curPlate = plates[cur];
  const fromPlate = turn ? plates[turn.from] : null;
  const toPlate = turn ? plates[turn.to] : null;

  // zoom copy: show the spread the book is settling on
  const zoomPlate = turn ? plates[turnT.current >= 0.5 ? turn.to : turn.from] ?? plates[turn.to] : plates[idx];

  return (
    <div ref={wrapRef} className={`grid w-full justify-items-center gap-5 ${introClass}`}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="sb-mblur-1">
          <feGaussianBlur stdDeviation="5 0" />
        </filter>
        <filter id="sb-mblur-2">
          <feGaussianBlur stdDeviation="14 0" />
        </filter>
      </svg>

      <div
        ref={stageRef}
        className="relative flex w-full items-center justify-center [touch-action:pan-y]"
        onPointerDown={onStageDown}
        onPointerMove={onStageMove}
        onPointerUp={endStageDrag}
        onPointerCancel={endStageDrag}
        onDragStart={(e) => e.preventDefault()}
        onDoubleClick={() => setView(view.current.trx, view.current.try_, 1)}
      >
        <button
          className="z-[8] inline-flex flex-none cursor-pointer items-center justify-center border-0 bg-transparent px-0.5 py-1.5 text-[rgba(43,39,33,0.36)] transition-colors hover:text-[#2b2721] max-sm:absolute max-sm:top-1/2 max-sm:left-0.5 max-sm:-translate-y-1/2 max-sm:z-[70] max-sm:px-1.5 max-sm:py-3"
          aria-label="previous page"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            step("prev");
          }}
        >
          <svg viewBox="0 0 14 44" width="14" height="44" fill="none" aria-hidden="true">
            <polyline points="11,3 3,22 11,41" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div ref={boxRef} className="sb-3d" style={{ ["--span" as string]: SPAN, ["--n" as string]: N_STRIPS } as React.CSSProperties}>
          <div ref={tiltRef} className="sb-tilt">
            <div className="sb-cast ambient" aria-hidden="true" />
            <div className="sb-cast contact" aria-hidden="true" />
            <div className="sb-cast hair" aria-hidden="true" />
            <div ref={bookRef} className="sb-book select-none">
              {!turn ? (
                <div className="absolute inset-0">
                  <Spread plate={plates[idx]} folio={folioOf(idx)} />
                </div>
              ) : (
                <>
                  <Half plate={plates[turn.from]} folio={folioOf(turn.from)} side={turn.dir === "next" ? "left" : "right"} />
                  <Half plate={plates[turn.to]} folio={folioOf(turn.to)} side={turn.dir === "next" ? "right" : "left"} />
                  {fromPlate && toPlate && (
                    <CurlLeaf
                      dir={turn.dir}
                      from={fromPlate}
                      to={toPlate}
                      folioFrom={folioOf(turn.from)}
                      folioTo={folioOf(turn.to)}
                      stripRefs={stripRefs}
                    />
                  )}
                </>
              )}
              <button className="sb-zone sb-prev" aria-label="previous page" />
              <button className="sb-zone sb-next" aria-label="next page" />
            </div>
          </div>

          {/* magnified copy lives OUTSIDE the tilt so leaning never drags the glass */}
          <div ref={zoomWrapRef} className="zoomwrap" aria-hidden="true">
            <div ref={zoomInnerRef} className="zoominner">
              <div className="h-full w-full">
                <Spread plate={zoomPlate} folio={folioOf(turn ? turn.to : idx)} />
              </div>
            </div>
          </div>

          <div ref={loupeRef} className="loupe" id="loupe">
            <span
              className="grip"
              onPointerDown={onLoupeDown}
              onPointerMove={onLoupeMove}
              onPointerUp={onLoupeDrop}
              onPointerCancel={onLoupeDrop}
            />
            <span
              className="ring"
              onPointerDown={onLoupeDown}
              onPointerMove={onLoupeMove}
              onPointerUp={onLoupeDrop}
              onPointerCancel={onLoupeDrop}
            >
              <span className="lens" />
            </span>
          </div>
        </div>

        <button
          className="z-[8] inline-flex flex-none cursor-pointer items-center justify-center border-0 bg-transparent px-0.5 py-1.5 text-[rgba(43,39,33,0.36)] transition-colors hover:text-[#2b2721] max-sm:absolute max-sm:top-1/2 max-sm:right-0.5 max-sm:-translate-y-1/2 max-sm:z-[70] max-sm:px-1.5 max-sm:py-3"
          aria-label="next page"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            step("next");
          }}
        >
          <svg viewBox="0 0 14 44" width="14" height="44" fill="none" aria-hidden="true">
            <polyline points="3,3 11,22 3,41" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid justify-items-center [&>*]:col-start-1 [&>*]:row-start-1">
        {!turn ? (
          <p ref={capSingleRef} className="sb-caption">
            {plates[idx].title}
          </p>
        ) : (
          <>
            <p ref={capOutRef} className="sb-caption">
              {plates[turn.from].title}
            </p>
            <p ref={capInRef} className="sb-caption">
              {plates[turn.to].title}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-[rgba(43,39,33,0.14)] bg-[rgba(250,246,238,0.62)] px-1.5 py-1 backdrop-blur-md" role="group" aria-label="view controls">
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent text-[rgba(43,39,33,0.58)] transition-colors hover:bg-[rgba(255,252,244,0.9)] hover:text-[#2b2721] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="zoom out"
          disabled={zoomed.out}
          onClick={() => {
            setView(view.current.trx, view.current.try_, view.current.tz / 1.16);
            setHintGone(true);
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="block h-[15px] w-[15px]">
            <circle cx="8.6" cy="8.6" r="5.6" />
            <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8" />
          </svg>
        </button>
        <span className="min-w-10 text-center text-[11px] tracking-[0.1em] text-[rgba(43,39,33,0.36)] tabular-nums">{zoomRead}</span>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent text-[rgba(43,39,33,0.58)] transition-colors hover:bg-[rgba(255,252,244,0.9)] hover:text-[#2b2721] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="zoom in"
          disabled={zoomed.in}
          onClick={() => {
            setView(view.current.trx, view.current.try_, view.current.tz * 1.16);
            setHintGone(true);
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="block h-[15px] w-[15px]">
            <circle cx="8.6" cy="8.6" r="5.6" />
            <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8M8.6 6.2v4.8" />
          </svg>
        </button>
        <span className="mx-0.5 h-[17px] w-px bg-[rgba(43,39,33,0.14)]" aria-hidden="true" />
        <button
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-0 transition-colors ${loupeOn ? "bg-[rgba(154,106,62,0.16)] text-[#9a6a3e]" : "bg-transparent text-[rgba(43,39,33,0.58)] hover:bg-[rgba(255,252,244,0.9)] hover:text-[#2b2721]"}`}
          aria-label="magnifier"
          aria-pressed={loupeOn}
          onClick={() => {
            const next = !loupeOn;
            setLoupeOn(next);
            if (next && loupeXY.current.x === null) restLoupe();
            else placeLoupe();
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="block h-[15px] w-[15px]">
            <circle cx="8.8" cy="8.8" r="5.8" />
            <path d="M13 13l4.4 4.4" />
            <path d="M6.4 7.2a3.2 3.2 0 0 1 2.4-1.4" opacity=".55" />
          </svg>
        </button>
      </div>

      <p className={`m-0 text-[11px] uppercase tracking-[0.14em] text-[rgba(43,39,33,0.36)] transition-opacity duration-300 max-sm:px-4 max-sm:text-center ${hintGone ? "opacity-0" : ""}`}>
        Drag the page to turn · Drag the glass across it
      </p>

      {/* expose imperative jump for the index list */}
      <JumpBridge goTo={goTo} current={cur} plateTitle={curPlate.title} />
    </div>
  );
}

/** Hidden bridge so index buttons can request jumps via DOM event (works across server/client). */
export const jumpBus: { go?: (i: number) => void } = {};
function JumpBridge({ goTo, current, plateTitle }: { goTo: (i: number) => void; current: number; plateTitle: string }) {
  useEffect(() => {
    jumpBus.go = goTo;
    const onGoto = (e: Event) => {
      const i = (e as CustomEvent<number>).detail;
      if (typeof i === "number") goTo(i);
    };
    window.addEventListener("sketchbook:goto", onGoto);
    return () => {
      jumpBus.go = undefined;
      window.removeEventListener("sketchbook:goto", onGoto);
    };
  }, [goTo]);
  useEffect(() => {
    document.querySelectorAll(".plate").forEach((b, i) => b.setAttribute("aria-current", i === current ? "true" : "false"));
  }, [current, plateTitle]);
  return null;
}
