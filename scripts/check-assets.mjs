/**
 * Asset guard — every image path referenced by real data must exist in public/.
 *
 * Catches the two classic deploy bugs for this book:
 *   - a typo'd path (the page quietly falls back to the line-art motif)
 *   - a case mismatch ("/Manoj.jpeg" vs "/manoj.jpeg") which works on Windows
 *     but 404s on Vercel/Linux
 *
 * Comments are stripped first, so documentation examples such as
 * `images: [{ src: "/sketchbook/example.webp" }]` inside a /** *\/ block do not
 * produce false alarms. Examples must therefore live in block comments.
 *
 * Run: npm run check:assets
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const SCANNED = ["content/plates.ts", "app/page.tsx", "app/layout.tsx"];
try {
  for (const f of readdirSync(join(root, "components"))) {
    if (f.endsWith(".tsx")) SCANNED.push(`components/${f}`);
  }
} catch {
  // components/ unreadable — fall back to the base list
}

/** Strip block comments and whole-line // comments, but never touch URLs inside strings. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

const refs = new Set();
for (const rel of SCANNED) {
  let src;
  try {
    src = readFileSync(join(root, rel), "utf8");
  } catch {
    continue;
  }
  for (const m of stripComments(src).matchAll(/\/[A-Za-z0-9._/-]+\.(?:jpe?g|png|webp|avif|svg|gif)/g)) {
    refs.add(m[0]);
  }
}

let missing = 0;
for (const p of [...refs].sort()) {
  const ok = existsSync(resolve(root, "public", p.replace(/^\//, "")));
  if (!ok) missing++;
  console.log(`${ok ? "ok  " : "MISS"}  ${p}`);
}

console.log(`\n${refs.size} image path(s) referenced in ${SCANNED.join(", ")}, ${missing} missing.`);
if (missing) {
  console.error("Fix the paths above (or drop the files into public/) before deploying.");
  process.exit(1);
}
