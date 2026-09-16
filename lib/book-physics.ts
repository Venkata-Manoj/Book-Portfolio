/**
 * Book physics — a faithful TypeScript port of the MengTo/sketchbook engine,
 * refactored for readability so Phase-2 customization is safe.
 *
 * ORIGINAL IDEA (preserved 1:1):
 * - The turning leaf is NOT a flat panel. It is a chain of N nested strips
 *   whose tangent sweeps an arc (peak curl BETA). That is what makes paper
 *   bend instead of pivoting like a door.
 * - Lighting per strip: facing = |cos(angle)|, shade alphas derived from it.
 * - Motion: rAF loop with two spring kinds — `spring` (commit/cancel) and
 *   `tween` (fixed-tempo intro riffle).
 * - Tilt: book leans toward cursor (max 4.5° X / 7° Y), eased with lerp.
 * - Loupe: lives in UNTRANSFORMED desk space above the tilt; shows a second
 *   copy of the book scaled about the page point under the glass (MAG 2.3x).
 */

export const N_STRIPS = 18;
export const SPAN = 0.449; // gutter -> outer edge, as fraction of book width
export const BETA = 0.6; // peak curl, radians
export const MAG = 2.3;

export const TILT_X = 4.5;
export const TILT_Y = 7;
export const ZOOM_MIN = 0.9;
export const ZOOM_MAX = 1.5;

export type TurnDir = "next" | "prev";

export interface TurnState {
  dir: TurnDir;
  from: number;
  to: number;
  t: number; // 0..1 progress
}

/** Total leaf rotation + per-strip delta, in degrees, for a given t. */
export function leafAngles(t: number): { tt: number; td: number; shade: number } {
  const th = Math.PI * t;
  const beta = BETA * Math.sin(Math.PI * t); // flat at both ends
  const D = 180 / Math.PI;
  return {
    tt: (th + beta) * D,
    td: ((2 * beta) / N_STRIPS) * D,
    shade: Math.sin(Math.PI * t),
  };
}

/** Per-strip lighting for strip i (0 = spine side). */
export function stripLight(ttDeg: number, tdDeg: number, i: number) {
  const D = Math.PI / 180;
  const tt = ttDeg * D;
  const td = tdDeg * D;
  const l1 = Math.abs(Math.cos(tt - i * td));
  const l2 = Math.abs(Math.cos(tt - (i + 1) * td));
  return {
    lit: l1,
    a1: (1 - l1) * 0.62,
    a2: (1 - l2) * 0.62,
  };
}

/** Drag distance -> page progress. Mirrors original: dx / (w * 0.62). */
export function dragToT(dx: number, width: number, dir: TurnDir): number {
  const raw = (dir === "next" ? -dx : dx) / (width * 0.62);
  return Math.max(0, Math.min(1, raw));
}

/** Should a released drag commit (vs fall back)? */
export function shouldCommit(t: number, velocity: number, movedPx: number): boolean {
  if (movedPx < 6) return true; // a tap always turns
  return t > 0.42 || velocity > 1.1;
}

export function nextIndex(i: number, m: number): number {
  return (i + 1) % m;
}
export function prevIndex(i: number, m: number): number {
  return (i - 1 + m) % m;
}

/** Caption crossfade: old title leaves before the new one arrives. */
export function captionOpacities(t: number): { out: number; inn: number } {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  return {
    out: 1 - clamp01((t - 0.1) / 0.28),
    inn: clamp01((t - 0.56) / 0.3),
  };
}
