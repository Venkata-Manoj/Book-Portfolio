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

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** An on-screen rectangle, in viewport pixels. */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LensFit {
  /** 0..1 — how much of the lens sits over the page; drives the copy's opacity. */
  k: number;
  /**
   * Per-axis scale for the desk-space copy of the spread. Tilt foreshortens the
   * visual width by cos(ry) and the height by cos(rx), so a single scalar
   * cannot register both axes — the copy would sit a few px off under lean.
   * The two differ by well under 1% at the engine's tilt limits, which reads as
   * correct, whereas a few px of misregistration reads as broken.
   */
  sx: number;
  sy: number;
  /** Translate applied *before* the scale, in lens-local pixels. */
  tx: number;
  ty: number;
  /** Book-local normalized coords under the glass centre (0..1 while over the page). */
  u: number;
  v: number;
}

/**
 * Fit the magnified copy so whatever is under the glass fills the lens.
 *
 * `rect` is the book's *visual* on-screen rect, so zoom, tilt and perspective
 * are already folded in — no need to model them here. `bookW/bookH` are the
 * book's layout size, so `scale` is the true on-screen magnification.
 *
 * The returned translate is lens-local: it places the copy inside a box of
 * side `2r` whose top-left is the glass origin. That keeps the copy's
 * transform independent of where the glass happens to be.
 */
export function lensFit(
  gx: number,
  gy: number,
  r: number,
  rect: Rect,
  bookW: number,
  bookH: number,
  mag: number,
): LensFit {
  const w = rect.width > 0 ? rect.width : 1;
  const h = rect.height > 0 ? rect.height : 1;
  const u = (gx - rect.left) / w;
  const v = (gy - rect.top) / h;

  // Signed distance to the nearest page edge in px: positive over the page,
  // negative once the glass hangs off it. Fades the copy out over ~R*0.55.
  const edge = Math.min(
    Math.min(u, 1 - u) * w,
    Math.min(v, 1 - v) * h,
  );
  const k = clamp01((edge + r * 0.3) / (r * 0.55));

  const sx = mag * (w / (bookW > 0 ? bookW : 1));
  const sy = mag * (h / (bookH > 0 ? bookH : 1));

  return {
    k,
    sx,
    sy,
    // Place book-local (u*bookW, v*bookH) — the point under the glass — at the
    // lens centre (r, r).
    tx: r - u * bookW * sx,
    ty: r - v * bookH * sy,
    u,
    v,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Projective helpers for the loupe.

   The book is drawn with rotateX/rotateY/scale inside an element that has
   `perspective`, so the page does NOT map to an axis-aligned rectangle: the
   projected quad is a trapezoid. Anything that assumes
   `screen = bbox.origin + frac * bbox.size` is wrong away from the centre —
   measured at up to ~25px at the corners, which is why the glass appeared to
   drift when the book leaned.

   A plane-to-plane projective map is a 3x3 homography, which CSS can express
   exactly as `matrix3d`. So: build the book's homography, invert it to find the
   true page point under the glass, and hand the same homography to the
   magnified copy. Registration then holds at every pose, not just centred.
   ──────────────────────────────────────────────────────────────────────────── */

/** Row-major 3x3: [a b c; d e f; g h i]. */
export type Mat3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

/** Map a point through a homography, applying the perspective divide. */
export function mat3Apply(m: Mat3, x: number, y: number): { x: number; y: number } {
  const w = m[6] * x + m[7] * y + m[8];
  if (w === 0) return { x: 0, y: 0 };
  return { x: (m[0] * x + m[1] * y + m[2]) / w, y: (m[3] * x + m[4] * y + m[5]) / w };
}

/** Closed-form inverse. Returns null when singular. */
export function mat3Invert(m: Mat3): Mat3 | null {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (!det || !Number.isFinite(det)) return null;
  const k = 1 / det;
  return [
    A * k, (c * h - b * i) * k, (b * f - c * e) * k,
    B * k, (a * i - c * g) * k, (c * d - a * f) * k,
    C * k, (b * g - a * h) * k, (a * e - b * d) * k,
  ];
}

/**
 * Render a homography as a CSS `matrix3d` acting on the z = 0 plane.
 * Column-major, so the string is the transpose of the row-major triple.
 */
export function mat3ToCss(m: Mat3): string {
  const [a, b, c, d, e, f, g, h, i] = m;
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,${i})`;
}

type Pt = { x: number; y: number };

/**
 * Solve for the homography taking `src` to `dst` (4 correspondences, h33 = 1)
 * via Gaussian elimination with partial pivoting.
 */
export function homographyFrom4(src: readonly Pt[], dst: readonly Pt[]): Mat3 | null {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: X, y: Y } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }
  const n = 8;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    }
    if (Math.abs(A[piv][col]) < 1e-12) return null;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let c2 = col; c2 < n; c2++) A[r][c2] -= f * A[col][c2];
      b[r] -= f * b[col];
    }
  }
  const h = b.map((v, i) => v / A[i][i]);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}
