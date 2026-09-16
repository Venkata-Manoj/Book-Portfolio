# B V Manoj — Portfolio Sketchbook · Vol. 01

A production Next.js page-flipping sketchbook inspired by [MengTo/sketchbook](https://github.com/MengTo/sketchbook)
(concept origin: [matthewyuart/personalportfolio](https://github.com/matthewyuart/personalportfolio)).

Phase 1: studied the original single-file engine, then redesigned it from scratch to understand
the code, motion, structure, design and movement — not copy-pasted.
Phase 2 (done): filled it with B V Manoj's real resume content — 9 spreads, portrait cover,
email + GitHub/LinkedIn throughout. Source: `E:\resume\data\Resume_Manoj.pdf`.

## What I learned from the original

| Layer | Original | This rebuild |
|---|---|---|
| Page turn | Chain of 18 nested strips, tangent sweep `th + β`, `β = 0.60·sin(πt)`, flat at both ends | Same math, ported to `lib/book-physics.ts` (`leafAngles`, `stripLight`) |
| Lighting | Per-strip `|cos(angle)|` → `--lit / --a1 / --a2`, specular `.gl` opacity `shade·lit²·0.20` | Identical, applied imperatively via refs (no React re-render per frame) |
| Motion | rAF loop: `spring` (commit k170/c26, cancel k150/c24) + `tween` (riffle fixed tempo) | Same, in `components/Sketchbook.tsx` |
| Drag | `t = ±dx / (w·0.62)`, commit if `t>0.42` or `v>1.1`, tap (<6px) always turns | Same (`dragToT`, `shouldCommit`) |
| Tilt | Lean toward cursor, max 4.5°/7°, lerp 0.14, frozen during drag | Same |
| Loupe | Desk-space copy of book scaled `MAG 2.3×` about page point under glass, fades off-paper, shoved aside on turn | Same geometry; copy is a React `<Spread>` instead of `cloneNode` |
| Intro | Riffle `M+LAND` steps, bell-curve durations `0.26−0.19·bell`, SVG motion-blur filters | Same, full-loop riffle landing back on cover |
| Captions | Old title out `t 0.10→0.38`, new in `0.56→0.86` so they never overlap | Same (`captionOpacities`) |
| A11y | Loupe hidden on touch, tap-to-turn fallback, `prefers-reduced-motion` skips riffle | Same + keyboard arrows, aria-current index, focus-visible zones |

## Deliberate redesign differences

- **No copied artwork.** The original's 9 Singapore watercolours are generated PNGs. This version
  paints 8 portfolio spreads procedurally (`Spread.tsx` + `Motif.tsx` line-art) — yours to replace.
- **Curl faces are paper, not sliced text.** Slicing live React text across 36 faces per turn is heavy
  and illegible mid-bend. Faces carry the plate wash + folio; full text lives on the static halves
  (rendered with the original 200%-width half trick). Same bend, calmer DOM.
- **Self-hosted fonts via `next/font`.** Instrument Serif + Newsreader, subset automatically.
- **Tailwind v4 + CSS vars** for the 3D custom properties (`--tt/--td/--shade/--bw/--rx/--ry/--zoom`).

## Tech stack (production-verified, deploy-ready)

- **Next.js 15 App Router + React 19 + TypeScript strict** — SSR/SSG, metadata/OG, image optimization ready
- **Tailwind CSS v4** — utility layout, custom CSS only for the 3D engine
- **Zero runtime animation deps** — the spring/rAF engine is hand-rolled (ported), so no version churn
- **Vercel-ready** — `next build` passes, no env vars, no external requests

## Run

```bash
npm install

# dev server (Turbopack) — http://localhost:3000
npm run dev

# if Turbopack ever misbehaves, use the classic webpack dev server
npm run dev:webpack

# production sanity check
npm run build && npm start
```

Useful extras:

```bash
npm run typecheck   # tsc --noEmit
npm run clean       # delete .next (kill the dev server first)
npm run lint
```

### If you ever see "Hydration failed because the server rendered text didn't match the client"

React prints two lines per mismatch:

- `+ ...` is what the **client JS bundle** rendered
- `- ...` is what the **server HTML** rendered

If the `- ` line is the correct/new text, the server is fine and your **browser is
still executing a stale client chunk**. That is a cache problem, not a code problem.
Recover with:

```bash
# stop the dev server (Ctrl+C) — never run two dev servers on this folder at once
npm run clean
npm run dev
```

then in the browser hard-reload (`Ctrl+Shift+R`, or DevTools → Application →
Storage → "Clear site data"), or open the site in a private window.

Note: a browser extension that rewrites page text (translators, grammar tools)
can also cause this exact error — test in a private window with extensions off.

## Make it yours (Phase 2)

1. Edit `content/plates.ts` — 8 entries, each = one open spread. Change title/place/kicker/headline/sub/body/accent/motif.
2. Edit `app/page.tsx` About + Contact + social links, `app/layout.tsx` title/OG URL.
3. Optional: drop real scans into `public/sketchbook/` and render them inside `Spread.tsx`
   (keep the procedural version as the loupe-safe fallback).
4. Deploy: push to GitHub → Import in Vercel → Deploy (no config needed).

## Structure

```
app/            layout (fonts+metadata), page (hero/about/plates/contact), globals.css (3D engine CSS)
content/        plates.ts — ALL your copy lives here
lib/            book-physics.ts — pure math, unit-testable
components/     Sketchbook.tsx (state machine + rAF), CurlLeaf.tsx, Spread.tsx, Motif.tsx, SiteChrome.tsx
```
