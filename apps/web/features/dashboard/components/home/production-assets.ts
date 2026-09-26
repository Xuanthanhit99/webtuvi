/**
 * Home production art (2026-08-28 asset board, founder-approved, text-free). Source folder:
 * apps/web/public/assets/menh-vi-home-production-webp — see its README.md/DATA_MAPPING.md.
 * All files carry real alpha transparency (verified via sharp — min=0/max~253 on every layer).
 * Do not crop or regenerate any of these; compose with CSS (object-position, mask-image, opacity)
 * only, matching the technique already used for the Discovery feature-art masks below.
 *
 * ================================================================================================
 * HD REPLACEMENT CONTRACT (2026-08-28 audit) — read this before swapping any file below.
 * ================================================================================================
 * Every current file here is well below the resolution it's actually displayed at on a large
 * desktop shell (verified live against the running `/_next/image` endpoint, not assumed — see the
 * Home visual-fidelity report): Next.js correctly never upscales past a source's native size, so
 * the softness on screen is the source file, not a code bug. Nothing here fakes sharpness (no CSS
 * filter/contrast/sharpen, no canvas upscale, no `image-rendering` hack) — the only real fix is
 * replacing the file at the SAME path below with a higher-resolution master. Every consumer uses
 * `fill` + `object-cover`/`object-contain` against a layout-determined container size (never the
 * image's own intrinsic dimensions), so a same-path swap needs zero component changes.
 *
 * Target master sizes (replace in place, keep the exact filename):
 *   - HOME_BACKGROUND.hero          — current replacement 1896×830
 *   - HOME_BACKGROUND.journeyBanner — current replacement 1672×941
 *   - FEATURE_ART_ASSET.*           — current replacements ~1414×1112 each
 *   - ARTICLE_COVER_ASSET.*         — current dedicated replacements 1659×948 each
 *   - HOME_MOBILE_VISUALS.*         — production replacements are present; keep target ≥800×1600 for future swaps
 *
 * Operational note: the built-in Next.js image optimizer caches generated variants; a same-path
 * file swap should be picked up on the next build/deploy, but front-end/CDN caches downstream of
 * it may keep serving the old bytes until their own TTL expires — plan a cache purge alongside the
 * asset swap rather than assuming it's instant.
 *
 * Do NOT claim this is "fixed" until the files above are actually replaced with HD masters.
 */
const BASE = '/assets/menh-vi-home-production-webp';

export type DiscoveryModuleKey = 'tu_vi' | 'tarot' | 'natal_chart' | 'numerology';

export const HOME_BACKGROUND = {
  /** Full hero scene — mountains, lake, moon, pagodas, the celestial wheel in the sky. */
  hero: `${BASE}/backgrounds/hero-home.webp`,
  /** Wide landscape strip — cranes, lotus, lanterns — used behind "Gợi ý cho bạn hôm nay". */
  journeyBanner: `${BASE}/backgrounds/journey-banner.webp`,
} as const;

/** Portrait module artwork for the 4 Discovery cards. Target master ≥1000×800 — see the HD
    replacement contract above. */
export const FEATURE_ART_ASSET: Record<DiscoveryModuleKey, string> = {
  tu_vi: `${BASE}/feature-art/tu-vi.webp`,
  tarot: `${BASE}/feature-art/tarot.webp`,
  natal_chart: `${BASE}/feature-art/ban-do-sao.webp`,
  numerology: `${BASE}/feature-art/than-so-hoc.webp`,
};

/** Dedicated editorial 16:9 covers — separate from Discovery feature art so Home does not repeat
    the same visuals in two adjacent sections. */
export const ARTICLE_COVER_ASSET: Record<DiscoveryModuleKey, string> = {
  tu_vi: `${BASE}/article-covers/tu-vi-ram-thang-7.webp`,
  tarot: `${BASE}/article-covers/tarot-78-la.webp`,
  natal_chart: `${BASE}/article-covers/astrology-planets.webp`,
  numerology: `${BASE}/article-covers/numerology-intro.webp`,
};

/** Small circular module-identity badges, used next to each Discovery card's title. */
export const FEATURE_BADGE_ASSET: Record<DiscoveryModuleKey, string> = {
  tu_vi: `${BASE}/hero-overlays/tu-vi-wheel.webp`,
  tarot: `${BASE}/hero-overlays/tarot-stack.webp`,
  natal_chart: `${BASE}/hero-overlays/astrology-wheel.webp`,
  numerology: `${BASE}/hero-overlays/numerology-orb.webp`,
};

export const HOME_DECOR = {
  cranes: `${BASE}/decor/cranes.webp`,
  lotus: `${BASE}/decor/lotus.webp`,
  lanterns: `${BASE}/decor/lanterns.webp`,
  moonPlanets: `${BASE}/decor/moon-planets.webp`,
} as const;

/** Phone-mockup device renders — used only by the "mobile app" promo section. Target master
    ≥800×1600 each. */
export const HOME_MOBILE_VISUALS = {
  home: `${BASE}/mobile-visuals/home.webp`,
  tarot: `${BASE}/mobile-visuals/tarot.webp`,
  astrology: `${BASE}/mobile-visuals/astrology.webp`,
  numerology: `${BASE}/mobile-visuals/numerology.webp`,
  appPromo: `${BASE}/mobile-visuals/app-promo.webp`,
} as const;
