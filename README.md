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

### Where the content lives

| File | What to edit |
|---|---|
| `content/plates.ts` | all 9 spreads: copy, accent, motif, images, stack, metrics, links (see the field docs + example at the top of the file) |
| `app/page.tsx` | hero tagline, About paragraphs, Contact block, social links, index list |
| `app/layout.tsx` | `<title>`, description, OG tags |
| `public/sketchbook/` | your images — sizing/format rules are in `public/sketchbook/README.md` |

### Plate fields you can fill in

Required: `title`, `place`, `kicker`, `headline`, `sub`, `body`, `accent`, `motif`.
Optional, all rendered by `components/Spread.tsx`:

| Field | Effect |
|---|---|
| `image` + `imageCaption` (+ `imageAlt`) | one framed photo on the left page (4:5, `object-cover`) |
| `images: PlateImage[]` | 2–4 image contact sheet — hero at 62%, tiles at 28% (default 1:1). Wins over `image` |
| `stack: string[]` | small-caps chips (tools/languages) |
| `metrics: {value,label}[]` | two-column metric table above the body copy |
| `link` / `links[]` | outbound links (repo · live demo · paper), rendered at `z-[61]` so the page-drag zones don't swallow the click |

`PlateImage` fields: `src` (public path), `caption`, `alt`, `aspect` (CSS ratio, e.g. `"16/10"`; defaults to 4:5 for the hero and 1:1 for tiles).

### Content budget (measured at the real 900 px book width)

| Layout | Result |
|---|---|
| single image + caption + body | fits |
| motif-only plate | fits |
| gallery(3) + chips(3) + metrics(2) + link(1) + body 232 chars | ±1 px — at the limit |
| gallery(3) + chips(4) + metrics(4) + links(2) + body 232 chars | **+23 px clipped** |
| gallery(3) + metrics(2) + body 464 chars | **+76 px clipped** |

Rule of thumb: with a 3-image gallery keep `body` ≤ ~200 characters, `stack` ≤ 3, `metrics` ≤ 2, `links` ≤ 1. Give up a row of chips or one metric before you give up body copy.

### Image specs

Long edge **1400–1800 px**, **≤ 250 KB**, `.webp` for photos/screenshots and `.svg` for diagrams/QR (SVG stays sharp under the 3.45× loupe). Frames are `object-cover` — export a single `image` at 4:5 so nothing important is cropped. Exact filename case matters (Vercel/Linux is case-sensitive).

```bash
npm run check:assets   # every referenced path must exist — run before deploying
npm run check          # typecheck + asset guard
```

### Deploy

Push to GitHub → Import in Vercel → Deploy (no env vars, no config needed).


## Structure

```
app/            layout (fonts+metadata), page (hero/about/plates/contact), globals.css (3D engine CSS)
content/        plates.ts — ALL your copy lives here
lib/            book-physics.ts — pure math, unit-testable
components/     Sketchbook.tsx (state machine + rAF), CurlLeaf.tsx, Spread.tsx, Motif.tsx, SiteChrome.tsx
```
