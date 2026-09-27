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
  homographyFrom4,
  leafAngles,
  lensFit,
  mat3Invert,
  mat3ToCss,
  nextIndex,
  prevIndex,
  shouldCommit,
  stripLight,
  type Mat3,
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

  // loupe state (refs for 60fps, useState only for UI chrome).
  // loupeXY is in SCREEN pixels: the book is tilted/zoomed, so the only honest
  // space to reason about is whatever getBoundingClientRect actually reports.
  const loupeXY = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  // `ox/oy` is the offset from the grab point to the glass centre, so the glass
  // keeps the spot you actually took hold of instead of snapping centre-under-cursor.
  const loupeGrab = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const loupeTarget = useRef<{ x: number; y: number } | null>(null);
  const pageMapRef = useRef<{
    sig: string;
    maps: { H: Mat3; Hinv: Mat3; w: number; h: number };
  } | null>(null);
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

  // Re-place once the toggle has actually committed. Doing it in the click
  // handler ran a frame early, while loupeOnRef still held the old value, so
  // the glass and its copy disagreed about being on.
  useEffect(() => {
    if (loupeOn && loupeXY.current.x === null) restLoupe();
    else placeLoupe();
  }, [loupeOn]);

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
    // The glass does not move when the book leans, but the page underneath it
    // does — so the copy has to be re-projected on every view frame, not just
    // when the zoom changes. Clamp only when the box actually resized.
    const resized = v.z !== lastZ.current;
    lastZ.current = v.z;
    syncLoupe(resized);
  }, []);

  const kick = useCallback(() => {
    if (raf.current === null) {
      last.current = performance.now();
      raf.current = requestAnimationFrame(tick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- loupe ----------------
     The glass lives in screen space and is positioned from the book's real
     visual rect, so zoom, tilt and perspective are all accounted for without
     being modelled. `.zoomwrap` (the magnified copy) and `.loupe` (the brass)
     are both written here from the same gx/gy/r, which is what stops them
     drifting apart. */

  const loupeSize = useCallback(() => {
    const book = bookRef.current;
    if (!book) return 220;
    // Layout width, not visual width: a real magnifier keeps its physical size
    // when you zoom the page underneath it.
    return Math.round(Math.max(165, Math.min(262, book.clientWidth * 0.235)));
  }, []);

  function bookRect() {
    const book = bookRef.current;
    if (!book) return null;
    const r = book.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  }

  /**
   * The book's exact page-to-screen homography, plus its inverse.
   *
   * Built from the rendered transform rather than from tilt angles: read the
   * live `matrix3d` off `.sb-tilt` and apply the stage's perspective to it. That
   * means the copy registers against the *actual* projection, so it stays put
   * under lean instead of only being right when the book is flat.
   *
   * Cached on a signature of everything that can change it, so dragging the
   * glass does not re-solve the system every frame.
   */
  function pageMaps(): { H: Mat3; Hinv: Mat3; w: number; h: number } | null {
    const tilt = tiltRef.current;
    const box = boxRef.current;
    const book = bookRef.current;
    if (!tilt || !box || !book) return null;

    const bw = book.clientWidth;
    const bh = book.clientHeight;
    const csBox = getComputedStyle(box);
    const persp = csBox.perspective === "none" ? 0 : parseFloat(csBox.perspective) || 0;
    // perspective-origin and transform-origin both resolve against their OWN
    // element's box, which are different elements here — read each from the
    // element it belongs to rather than assuming they match.
    const po = (csBox.perspectiveOrigin || "0 0").trim().split(/\s+/).map(parseFloat);
    const ox = po[0] || 0;
    const oy = po[1] || 0;
    const csTilt = getComputedStyle(tilt);
    const org = (csTilt.transformOrigin || "0 0").trim().split(/\s+/).map(parseFloat);
    const sig = `${csTilt.transform}|${csTilt.transformOrigin}|${persp}|${ox}|${oy}|${bw}|${bh}`;

    if (pageMapRef.current && pageMapRef.current.sig === sig) return pageMapRef.current.maps;

    const m = new DOMMatrixReadOnly(
      csTilt.transform && csTilt.transform !== "none" ? csTilt.transform : "matrix(1,0,0,1,0,0)",
    );
    // Fold transform-origin into the matrix so the result maps book-local
    // coordinates directly, with no implicit centre.
    const total = new DOMMatrix()
      .translate(org[0] || 0, org[1] || 0)
      .multiply(m)
      .translate(-(org[0] || 0), -(org[1] || 0));

    // Project into .sb-3d-LOCAL space (the frame .zoomwrap is rendered in), not
    // viewport space: the lens and the copy are both children of .sb-3d, so
    // mixing in the box's screen offset is what desynchronised them.
    const project = (x: number, y: number) => {
      const p = new DOMPoint(x, y, 0).matrixTransform(total);
      if (!persp) return { x: p.x, y: p.y };
      const k = persp / (persp - p.z); // perspective divide about the origin
      return { x: ox + (p.x - ox) * k, y: oy + (p.y - oy) * k };
    };

    const H = homographyFrom4(
      [
        { x: 0, y: 0 },
        { x: bw, y: 0 },
        { x: 0, y: bh },
        { x: bw, y: bh },
      ],
      [project(0, 0), project(bw, 0), project(0, bh), project(bw, bh)],
    );
    const Hinv = H ? mat3Invert(H) : null;
    if (!H || !Hinv) return null;

    const maps = { H, Hinv, w: bw, h: bh };
    pageMapRef.current = { sig, maps };
    return maps;
  }

  /** Park the glass at the bottom-right of the page, in screen space. */
  function restLoupe() {
    const br = bookRect();
    if (!br) return;
    const R = loupeSize() / 2;
    loupeXY.current = { x: br.right - R - R * 0.18, y: br.bottom - R - R * 0.1 };
    placeLoupe();
  }

  /** Keep the glass within reach of the page after a resize or a re-place. */
  function clampLoupe() {
    const p = loupeXY.current;
    const br = bookRect();
    if (p.x === null || p.y === null || !br) return;
    const R = loupeSize() / 2;
    p.x = Math.max(br.left - R * 0.7, Math.min(br.right + R * 0.7, p.x));
    p.y = Math.max(br.top - R * 0.7, Math.min(br.bottom + R * 0.7, p.y));
  }

  /**
   * The glass lives in screen space, so it has to be re-fitted whenever the
   * book's on-screen box moves. `reclamp` is for genuine size changes (resize,
   * zoom); scrolling only needs a re-fit, never a clamp, or a glass parked
   * deliberately off the edge would be dragged back on every scroll tick.
   */
  function syncLoupe(reclamp: boolean) {
    const p = loupeXY.current;
    if (p.x === null || p.y === null) {
      restLoupe();
      return;
    }
    if (reclamp) clampLoupe();
    placeLoupe();
  }

  function placeLoupe() {
    const loupe = loupeRef.current;
    const zw = zoomWrapRef.current;
    const zi = zoomInnerRef.current;
    const box = boxRef.current;
    const { x: gx, y: gy } = loupeXY.current;
    if (gx === null || gy === null || !loupe || !zw || !zi || !box) return;
    const br = bookRect();
    if (!br) return;

    const book = bookRef.current!;
    const R = loupeSize() / 2;
    const d = R * 2;

    loupe.style.setProperty("--lr", `${d}px`);
    zw.style.setProperty("--lr", `${d}px`);
    loupe.classList.toggle("on", loupeOnRef.current);

    // loupeXY is in viewport pixels. The glass and the copy are both children of
    // .sb-3d, so everything below works in .sb-3d-LOCAL space: subtract the
    // box's screen origin once, here, and never mix frames again.
    const boxRect = box.getBoundingClientRect();
    const gxl = gx - boxRect.left;
    const gyl = gy - boxRect.top;
    const lx = gxl - R;
    const ly = gyl - R;

    // Both elements share this transform, so the copy sits exactly in the glass.
    const place = `translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0)`;
    loupe.style.transform = place;
    zw.style.transform = place;

    const fit = lensFit(gx, gy, R, br, book.clientWidth, book.clientHeight, MAG);

    // Project the copy with the book's own homography and magnify by MAG about
    // the page point under the glass.
    //
    // A homography maps POINTS, not vectors, so the whole thing collapses to a
    // single scale-then-project plus one translation. Since H(pg) is by
    // definition the glass centre, that translation is just (R - MAG*centre):
    //
    //   p  ->  centre + MAG * H * (p - pg)
    //
    // Getting this wrong (applying H to a vector, or double-counting the box
    // origin) shows up as a constant offset equal to the glass position, which
    // is exactly the desync this replaces.
    const maps = pageMaps();
    if (maps) {
      zi.style.width = `${maps.w}px`;
      zi.style.height = `${maps.h}px`;
      // .zoominner is positioned at left:0/top:0 inside .zoomwrap, which is
      // itself at left:0/top:0 inside .sb-3d — so the chain shares .sb-3d's
      // origin and the projection below needs no extra frame shift.
      zi.style.transform =
        `translate(${(R - MAG * gxl).toFixed(2)}px,${(R - MAG * gyl).toFixed(2)}px)` +
        ` scale(${MAG})` +
        ` ${mat3ToCss(maps.H)}`;
    } else {
      // Degenerate transform (zero-size book, singular matrix): fall back to the
      // axis-aligned fit so the glass still works instead of vanishing.
      const f = lensFit(gx, gy, R, br, book.clientWidth, book.clientHeight, MAG);
      zi.style.width = `${book.clientWidth}px`;
      zi.style.height = `${book.clientHeight}px`;
      zi.style.transform =
        `translate(${(R - MAG * gxl).toFixed(2)}px,${(R - MAG * gyl).toFixed(2)}px)` +
        ` scale(${f.sx.toFixed(4)},${f.sy.toFixed(4)})`;
    }

    // Written unconditionally: a stale mask/transform is what made the glass
    // flash the wrong region when it came back onto the page.
    zw.style.opacity = (loupeOnRef.current ? fit.k : 0).toFixed(3);
  }

  /** Slide the glass aside so a page turn does not sweep it. */
  function shoveLoupe(dir: TurnDir) {
    if (!loupeOnRef.current) return;
    const p = loupeXY.current;
    if (p.x === null || p.y === null || loupeGrab.current) return;
    const br = bookRect();
    if (!br) return;
    const R = loupeSize() / 2;
    loupeTarget.current = {
      x: dir === "next" ? br.left + R * 0.55 : br.right - R * 0.55,
      y: br.bottom - R * 0.55,
    };
    kick();
  }

  function loupeEase(): boolean {
    const t = loupeTarget.current;
    if (!t) return false;
    if (loupeGrab.current) {
      loupeTarget.current = null;
      return false;
    }
    const p = loupeXY.current;
    if (p.x === null || p.y === null) return false;
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      loupeXY.current = { x: t.x, y: t.y };
      loupeTarget.current = null;
      placeLoupe();
      return false;
    }
    loupeXY.current = { x: p.x + dx * 0.17, y: p.y + dy * 0.17 };
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
    const p = loupeXY.current;
    if (p.x !== null && p.y !== null) {
      loupeGrab.current = {
        px: e.clientX,
        py: e.clientY,
        ox: p.x - e.clientX,
        oy: p.y - e.clientY,
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
    // Pointer + the offset captured at grab time: the glass stays under the
    // same spot of the grip you took hold of.
    loupeXY.current = { x: e.clientX + g.ox, y: e.clientY + g.oy };
    clampLoupe();
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
      syncLoupe(true);
    };
    window.addEventListener("resize", onResize);

    /* The book can move on screen without a resize firing: scrolling, web-font
       swap, or a layout shift above it. Screen-space glass desyncs silently in
       those cases, so watch the box itself. ResizeObserver catches size/zoom
       changes; the scroll listener catches position changes. */
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => syncLoupe(true)) : null;
    if (ro && bookRef.current) ro.observe(bookRef.current);
    const onScroll = () => syncLoupe(false);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, { capture: true });
      ro?.disconnect();
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
          className={`sb-loupe-btn inline-flex h-7 w-7 items-center justify-center rounded-full border-0 transition-colors ${loupeOn ? "bg-[rgba(154,106,62,0.16)] text-[#9a6a3e]" : "bg-transparent text-[rgba(43,39,33,0.58)] hover:bg-[rgba(255,252,244,0.9)] hover:text-[#2b2721]"}`}
          aria-label="magnifier"
          aria-pressed={loupeOn}
          onClick={() => setLoupeOn((v) => !v)}
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
