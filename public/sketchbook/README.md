# public/sketchbook/ — your plate assets

Drop your own images here and reference them from `content/plates.ts` as
`/sketchbook/<file>`.

## Rules that matter for this book

| Rule | Why |
|---|---|
| **Long edge 1400–1800 px** | The loupe magnifies up to **3.45×** (MAG 2.3 × zoom 1.5), so the left-page photo is shown up to ~960 CSS px wide. Smaller goes soft, bigger just costs bytes. |
| **≤ 250 KB per file** | During a page turn the spread renders up to 3× (two halves + the loupe copy). |
| **`.webp`** for photos/screenshots, **`.svg`** for diagrams, QR codes, timelines | SVG stays crisp at any magnification — ideal for the loupe. |
| **kebab-case, no spaces** | URL-safe. |
| **Exact case matters** | Windows is case-insensitive, Vercel/Linux is not: `/Manoj.jpeg` ≠ `/manoj.jpeg`. |
| **Frames are `object-cover`** | A single `image` is cropped into a **4:5** frame — export portraits at 4:5 (e.g. 1400×1750) so nothing important is cut. Gallery tiles default to **1:1**; override with `aspect`, e.g. `aspect: "16/10"` for screenshots. |

## Prepare files with ffmpeg / cwebp (verified)

```bash
# keep width ≤1500px, webp quality 80
ffmpeg -y -i in.jpg -vf "scale='min(1500,iw)':-2" -c:v libwebp -quality 80 -compression_level 6 out.webp

# or, portrait-aware: cap the long edge at 1500px
cwebp -q 80 -resize 1500 0 in.jpg -o out.webp
```

## After adding files

```bash
npm run check:assets   # every referenced path must exist (fails if not)
npm run dev            # then drag the loupe over the plate to check sharpness
```

## Suggested filenames (replace with your own shots)

```
cover-portrait.webp          plate 0  — you, 4:5
craft-toolchain.svg          plate 2  — diagram of your stack
videoreverse-cli.webp        plate 3
videoreverse-frames.webp     plate 3
newsbot-card.webp            plate 4  — mask any phone numbers
whatif-report.webp           plate 5
forage-report.webp           plate 6
journey-timeline.svg         plate 7
contact-qr.svg               plate 8  — QR to your site / vCard
```
