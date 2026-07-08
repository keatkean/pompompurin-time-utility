// One-off: rasterize public/pompompurin.svg into the PWA icon set, and
// public/pudding.svg into the custom-cursor PNG (src/assets/cursor-pudding.png).
// Run with `node scripts/generate-icons.mjs`. Requires sharp (dev-only).
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const svg = readFileSync(join(pub, 'pompompurin.svg'));
const CREAM = { r: 255, g: 248, b: 220, alpha: 1 }; // #FFF8DC (manifest background_color)

const render = (size) => sharp(svg, { density: 384 }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

// Full-bleed transparent icons for purpose:'any'.
await render(192).png().toFile(join(pub, 'pwa-192x192.png'));
await render(512).png().toFile(join(pub, 'pwa-512x512.png'));

// iOS home-screen icon: opaque background (iOS doesn't honour transparency).
await render(180).flatten({ background: CREAM }).png().toFile(join(pub, 'apple-touch-icon.png'));

// Maskable: mascot scaled into the central ~80% safe zone on a cream canvas so
// Android adaptive cropping doesn't clip the artwork.
const inner = await render(410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: CREAM } })
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile(join(pub, 'pwa-maskable-512x512.png'));

// Pudding cursor: browsers want cursor images ≤ 32px. Transparent background;
// referenced by the cursor rule in src/index.css (Vite inlines it as data:).
const pudding = readFileSync(join(pub, 'pudding.svg'));
await sharp(pudding, { density: 384 })
  .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(join(root, 'src', 'assets', 'cursor-pudding.png'));

console.log('icons written to public/, cursor to src/assets/');
