// One-off asset derivation script for the Mobile Home screen (Phase 01).
//
// Reads from the existing, Codex-owned Web production art board and NEVER writes back into it —
// output goes only to apps/mobile/assets/images/home/. Run with:
//   node scripts/generate-mobile-home-assets.mjs
//
// The hero and journey-banner sources are wide desktop crops (see the HD_REPLACEMENT_CONTRACT
// comment in apps/web/.../production-assets.ts) — this script derives a portrait/near-square crop
// from the SAME master rather than stretching it, matching the web app's own object-position
// focal point (62% horizontal) for the hero. Like the desktop assets, these derivatives are
// resolution-limited by the existing master (1896x830) — a future higher-res master would need
// the same treatment re-run.

import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ASSETS = path.resolve(__dirname, '../../web/public/assets/menh-vi-home-production-webp');
const OUT_DIR = path.resolve(__dirname, '../assets/images/home');

async function main() {
  await mkdir(path.join(OUT_DIR, 'backgrounds'), { recursive: true });
  await mkdir(path.join(OUT_DIR, 'feature-art'), { recursive: true });
  await mkdir(path.join(OUT_DIR, 'hero-overlays'), { recursive: true });
  await mkdir(path.join(OUT_DIR, 'decor'), { recursive: true });

  // Hero — portrait crop at the same 62%-horizontal focal point the web Hero uses
  // (apps/web/.../home/hero.tsx: `object-cover object-[62%_center]`).
  {
    const src = path.join(WEB_ASSETS, 'backgrounds/hero-home.webp');
    const meta = await sharp(src).metadata();
    const targetRatio = 0.8; // 4:5 portrait
    const height = meta.height;
    const width = Math.round(height * targetRatio);
    const centerX = Math.round(meta.width * 0.62);
    const left = Math.min(Math.max(centerX - Math.round(width / 2), 0), meta.width - width);
    await sharp(src)
      .extract({ left, top: 0, width, height })
      .webp({ quality: 90 })
      .toFile(path.join(OUT_DIR, 'backgrounds/hero-home-mobile.webp'));
    console.log(`hero-home-mobile.webp <- ${width}x${height} crop @ left=${left} (source ${meta.width}x${meta.height})`);
  }

  // Journey banner (Today Suggestions) — a milder landscape crop, center-anchored (no documented
  // focal point on the web side for this one).
  {
    const src = path.join(WEB_ASSETS, 'backgrounds/journey-banner.webp');
    const meta = await sharp(src).metadata();
    const targetRatio = 1.4;
    const height = meta.height;
    const width = Math.min(Math.round(height * targetRatio), meta.width);
    const left = Math.round((meta.width - width) / 2);
    await sharp(src)
      .extract({ left, top: 0, width, height })
      .webp({ quality: 90 })
      .toFile(path.join(OUT_DIR, 'backgrounds/journey-banner-mobile.webp'));
    console.log(`journey-banner-mobile.webp <- ${width}x${height} crop @ left=${left} (source ${meta.width}x${meta.height})`);
  }

  // Direct copies — no crop needed, same asset works at mobile card sizes via resizeMode="cover".
  const directCopies = [
    ['feature-art/tu-vi.webp', 'feature-art/tu-vi.webp'],
    ['feature-art/tarot.webp', 'feature-art/tarot.webp'],
    ['feature-art/ban-do-sao.webp', 'feature-art/ban-do-sao.webp'],
    ['feature-art/than-so-hoc.webp', 'feature-art/than-so-hoc.webp'],
    ['hero-overlays/tu-vi-wheel.webp', 'hero-overlays/tu-vi-wheel.webp'],
    ['hero-overlays/tarot-stack.webp', 'hero-overlays/tarot-stack.webp'],
    ['hero-overlays/astrology-wheel.webp', 'hero-overlays/astrology-wheel.webp'],
    ['hero-overlays/numerology-orb.webp', 'hero-overlays/numerology-orb.webp'],
    ['decor/cranes.webp', 'decor/cranes.webp'],
    ['decor/lotus.webp', 'decor/lotus.webp'],
    ['decor/lanterns.webp', 'decor/lanterns.webp'],
  ];
  for (const [from, to] of directCopies) {
    await copyFile(path.join(WEB_ASSETS, from), path.join(OUT_DIR, to));
  }
  console.log(`Copied ${directCopies.length} feature-art/overlay/decor assets as-is.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
