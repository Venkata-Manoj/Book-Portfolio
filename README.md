# B V Manoj — Book Portfolio

A production Next.js page-flipping sketchbook inspired by [MengTo/sketchbook](https://github.com/MengTo/sketchbook)
(concept origin: [matthewyuart/personalportfolio](https://github.com/matthewyuart/personalportfolio)).

**9 spreads · portrait cover · drag-to-turn · brass magnifier · zero animation deps**

---

## Motion Systems

Every animation in this project is hand-rolled — no GSAP, no Framer Motion, no CSS keyframe libraries.
The entire motion engine lives in `lib/book-physics.ts` (pure math) and `components/Sketchbook.tsx` (rAF loop).

### 1. Page Turn — Spring Physics

The page is a chain of **18 nested strips**. Each strip rotates a fraction of the total curl, so the paper
arcs instead of hinging. The curl follows a tangent sweep: `θ(t) = πt + β·sin(πt)` where `β = 0.60`.

```
t=0.0        t=0.25       t=0.5        t=0.75       t=1.0
  |            |            |            |            |
  |  ╭───╮     |  ╭────╮    |  ╭─────╮   |  ╭──────╮  |
  |  │   │     |  │    │    |  │     │   |  │      │  |
  |  │   │     │  │    │    │  │     │   │  │      │  |
  |──┤   ├──   │──┤    ├──  │──┤     ├── │──┤      ├──
  |  │   │     │  │    │    │  │     │   │  │      │  |
  |  ╰───╯     │  ╰────╯    │  ╰─────╯   │  ╰──────╯  |
  flat         curling      peak curl     curling      flat
```

**Spring constants** (imperative, per-frame — no React re-render):

| Phase | Stiffness `k` | Damping `c` | Feel |
|---|---|---|---|
| Commit (turn completes) | 170 | 26 | Snappy, slight overshoot |
| Cancel (falls back) | 150 | 24 | Softer return |
| Tilt lerp | — | 0.14 | Smooth cursor lean |

**Drag → turn mapping:** `t = ±dx / (w × 0.62)`. A drag past **42%** of the page width commits;
below that it springs back. A tap (< 6px) always turns.

### 2. Tilt — Cursor Lean

The book leans toward the cursor, max **4.5° on X** / **7° on Y**, eased with `lerp = 0.14` per frame.
Frozen during drag so the page doesn't slide under your pointer.

```
        cursor
          ↓
    ╭───────────╮
    │  ╭─────╮  │  ← book rotates toward
    │  │     │  │    cursor position
    │  ╰─────╯  │
    ╰───────────╯
```

### 3. Loupe — Brass Magnifier

A desk-space copy of the book, scaled **2.3×** about the page point under the glass. The copy is
projected with the page's **exact homography** (built from the live `matrix3d` + perspective), so it
stays in register at any tilt, zoom, or rotation.

```
   drag glass →  ╭─────╮
                 │ 2.3×│  magnified copy
                 │  ●  │  (homography-projected)
                 ╰─────╯
   fade:  ████████████████░░░░░░░░  ← opacity ramps over ~0.55R
          on-page              off-page
```

- **Size:** `clamp(165, bookWidth × 0.235, 262)` px — scales with the book, not the zoom
- **Fade:** smooth opacity ramp as the glass crosses the page edge
- **Shove:** on page turn, the glass eases aside (lerp 0.17) so the page doesn't sweep it
- **Grab:** preserves the exact point you grabbed — no centre-snap

### 4. Intro Riffle

On load (desktop only), the book flicks through every spread and lands back on the cover.
Each step uses a **bell-curve duration**: `0.26 − 0.19 × bell` where `bell = sin(π × step / (M−1))`.

```
step:  0    1    2    3    4    5    6    7    8
dur:  0.26 0.24 0.21 0.17 0.16 0.17 0.21 0.24 0.26
       ▁    ▃    ▅    ▇    █    ▇    ▅    ▃    ▁
       slow ─────────────────────────── slow
              (fast in the middle)
```

Skipped on touch devices, `prefers-reduced-motion`, or `?nointro` in the URL.

### 5. Caption Crossfade

The old spread title leaves before the new one arrives — they never overlap.

```
old:  ████████████████░░░░░░░░░░░░  (out: t 0.10 → 0.38)
new:  ░░░░░░░░░░░░████████████████  (in:  t 0.56 → 0.86)
```

### 6. Zoom

Buttons divide/multiply zoom by **1.16** per click, clamped to `[0.9, 1.5]`. The glass re-fits on
every zoom frame so the magnified copy stays registered.

### 7. Cue Breathe

The down-arrow below the book breathes: `opacity 0.15 → 0.7 → 0.15` over **2.6s**, infinite.
Disappears permanently after first interaction.

### 8. Contact Form

- **Validation:** name, email (regex), message (min 10 chars) — inline error messages per field
- **States:** idle → sending → sent (with "Send another" + "Download resume" buttons)
- **Focus:** `outline-2` in brand colour `#9a6a3e`

---

## Tech Stack

- **Next.js 15 App Router + React 19 + TypeScript strict** — SSG, metadata/OG, image optimisation
- **Tailwind CSS v4** — utility layout; custom CSS only for the 3D engine
- **Zero runtime animation deps** — spring/rAF engine is hand-rolled
- **Self-hosted fonts** via `next/font` — Instrument Serif + Newsreader
- **Vercel-ready** — `next build` passes, no env vars, no external requests

## Run

```bash
npm install

npm run dev          # dev server (Turbopack) — http://localhost:3000
npm run dev:webpack  # fallback if Turbopack misbehaves
npm run build        # production build
npm run start        # serve production build
```

Useful extras:

```bash
npm run typecheck    # tsc --noEmit
npm run check        # typecheck + asset guard
npm run check:assets # verify all referenced images exist
npm run clean        # delete .next (kill the dev server first)
```

### Hydration mismatch?

If you see *"Hydration failed because the server rendered text didn't match the client"*:

- `- ...` lines = **server** HTML
- `+ ...` lines = **client** bundle

If the `-` line is correct, your **browser has a stale client chunk**. Fix:

```bash
# stop the dev server (Ctrl+C) — never run two at once
npm run clean
npm run dev
```

Then hard-reload (`Ctrl+Shift+R`) or clear site data. A text-rewriting browser extension
(translators, grammar tools) can also cause this — test in a private window.

## Make It Yours

### Content

| File | What to edit |
|---|---|
| `content/plates.ts` | all 9 spreads — copy, accent, motif, images, stack, metrics, links |
| `app/page.tsx` | hero tagline, About paragraphs, Contact block, social links, index list |
| `app/layout.tsx` | `<title>`, description, OG tags, `metadataBase` |
| `public/sketchbook/` | your images (see `public/sketchbook/README.md` for sizing rules) |

### Plate fields

Required: `title`, `place`, `kicker`, `headline`, `sub`, `body`, `accent`, `motif`.

Optional (all rendered by `components/Spread.tsx`):

| Field | Effect |
|---|---|
| `image` + `imageCaption` (+ `imageAlt`) | one framed photo on the left page (4:5, `object-cover`) |
| `images: PlateImage[]` | 2–4 image contact sheet — hero at 62%, tiles at 28% (default 1:1). Wins over `image` |
| `stack: string[]` | small-caps chips (tools/languages) |
| `metrics: {value,label}[]` | two-column metric table above the body copy |
| `link` / `links[]` | outbound links (repo · live demo · paper), rendered at `z-[61]` so drag zones don't swallow clicks |
| `subLink` | makes the `sub` line clickable (e.g. `mailto:`) |

`PlateImage` fields: `src` (public path), `caption`, `alt`, `aspect` (CSS ratio, e.g. `"16/10"`;
defaults to 4:5 for the hero and 1:1 for tiles).

### Content budget (at 900px book width)

| Layout | Result |
|---|---|
| single image + caption + body | fits |
| motif-only plate | fits |
| gallery(3) + chips(3) + metrics(2) + link(1) + body 232 chars | ±1 px — at the limit |
| gallery(3) + chips(4) + metrics(4) + links(2) + body 232 chars | **+23 px clipped** |
| gallery(3) + metrics(2) + body 464 chars | **+76 px clipped** |

Rule of thumb: with a 3-image gallery keep `body` ≤ ~200 chars, `stack` ≤ 3, `metrics` ≤ 2, `links` ≤ 1.

### Image specs

Long edge **1400–1800 px**, **≤ 250 KB**, `.webp` for photos/screenshots and `.svg` for diagrams/QR.
Frames are `object-cover` — export a single `image` at 4:5 so nothing important is cropped.
Exact filename case matters (Vercel/Linux is case-sensitive).

### Deploy

Push to GitHub → Import in Vercel → Deploy (no env vars, no config needed).

`metadataBase` uses Vercel's auto-injected `VERCEL_PROJECT_PRODUCTION_URL`, so the OG preview
image resolves to the real domain with zero configuration. Set `NEXT_PUBLIC_SITE_URL` only if you
later attach a custom domain.

## Structure

```
app/            layout (fonts + metadata), page (hero/about/plates/contact), globals.css (3D engine CSS)
content/        plates.ts — ALL your copy lives here
lib/            book-physics.ts — pure math: springs, drag, homography, lens fit
components/     Sketchbook.tsx (state machine + rAF), CurlLeaf.tsx, Spread.tsx, Motif.tsx,
                SiteChrome.tsx, ContactForm.tsx
public/         images, favicons, og-image.png, Resume_Manoj.pdf
```
