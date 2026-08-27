# Board 01 — High-Resolution Feature Art Brief

Prepared for an external art-generation pipeline. This document does **not** change any
code, CSS, layout, or currently-live assets — it only specifies what the four replacement
files need to be so they can be dropped in later with a single one-line code change per
asset (see "Integration mapping" below).

## Why this exists

The four Discovery/guest-preview feature illustrations currently in production are too
low-resolution for retina displays (measured live, see table below — up to ~2.9× upscale
at 2×DPR). The repository also contains a 480×480 alternative set
(`menh-vi/features/feature-*.webp`), but those were inspected and rejected: they are in a
glossy purple/violet "AI fantasy art" style that conflicts with Board 01's established
visual language. **Do not use them as a substitute or a style reference.**

## Style lock — non-negotiable

All four illustrations must belong to one family, matching the existing production art
(the current `06/07/09/10_feature_*.webp` files and the hand-built `DestinyOrbit` SVG
component are the actual in-repo style anchors — inspect those, not a generic mood board):

- **Palette:** deep navy / transparent base, antique gold (`#d5ad62`/`#e6c980`/`#f3d998`
  family) linework, muted bronze, warm ivory highlights. Jade or seal-red only as a tiny,
  restrained accent, and only where the Board 01 reference itself shows one.
- **Forbidden:** purple, violet, magenta, cyan, neon, rainbow bloom, fantasy nebula, glossy
  3D/game-art rendering, cartoon treatment, any generic "AI astrology" look.
- **Feel:** premium, precise, celestial, Eastern, restrained, fine-line, editorial,
  architectural — not painterly/photoreal, not a mascot/icon.
- **Sharpness:** clean line edges at 100% zoom, small gold geometry stays readable, no
  bloom obscuring detail, no blur, no compression noise, no halo around transparent edges.

## Per-feature subject requirements

| Feature | Current file | Current size | Subject (must include) | Must NOT be |
|---|---|---|---|---|
| Tử Vi | `07_feature_tuvi_pagoda.webp` | 320×350 | Eastern pagoda/pavilion architecture + fine Tử Vi palace-grid geometry + celestial construction lines + subtle star points | A scroll/parchment icon, a generic compass, a colorful fantasy palace |
| Tarot | `06_feature_tarot_cards.webp` | 290×245 | Small fan/set of tarot card backs, dark card bodies, fine gold celestial linework, star/constellation detail, subtle overlap depth | Purple card art, existing production tarot *face* artwork, a bright nebula, large moons/clouds not in the Board 01 reference |
| Bản đồ sao | `09_feature_natal_orbit.webp` | 365×360 | Circular celestial/orbital construction, thin orbital arcs, radial divisions, small planetary/star nodes, warm central focal point | A generic solar-system icon, a sci-fi radar, a bright blue planet UI |
| Thần số học | `10_feature_numerology.webp` | 265×345 | Arranged numerical composition, fine geometric construction, gold lines, restrained celestial detail | A giant circular 1-9 infographic, a calculator icon, a colorful mandala |

## Target file spec (per asset)

- **Minimum:** 1024×1024px master. **Prefer:** 1536×1536px if detail benefits.
- **Master format:** lossless PNG, transparent background where the composition allows it
  (no baked-in card/UI chrome, no baked-in text/labels).
- **Runtime format:** high-quality WebP exported from the master (matches how every
  existing Board 01 asset is already shipped — see `manifest.json` in this same directory).
- **Composition:** design for the *existing* card viewports below — don't design a giant
  square poster. Keep the important subject matter inside a safe central region; leave
  enough transparent/dark breathing room at the edges that the existing CSS mask-fade and
  `overflow-hidden` crop can do their job without cutting into critical detail.

## Where each asset actually renders (composition safe-zones)

All four usages live in `apps/web/features/dashboard/components/dashboard-view.tsx`.

1. **Discovery card ("Khám phá nhanh")** — used by all 4 features.
   - Card box: 336×284px (desktop). Artwork zone: right ~52% of the card, full card height,
     `object-fit: contain`, anchored to **bottom**. Left edge fades via
     `mask-image: linear-gradient(to left, black 45%, transparent 92%)`.
   - Each asset also gets a small optical-scale correction today (`FEATURE_ART_SCALE`:
     tu_vi 0.97×, tarot 1.25×, natal_chart 1.07×, numerology 0.81×) to equalize visual
     footprint — once real, consistently-composed art lands, this correction should very
     likely be re-tuned or removed; don't assume it stays as-is.
2. **Guest "Rút một lá cho hôm nay" card (Tarot only)** — artwork zone: right 46% of card,
   full height, `object-fit: contain`, anchored **right**. Left-edge mask fade at 42%→90%.
3. **Guest "Tính nhanh con số chủ đạo" card (Thần số học only)** — artwork zone: right 48%
   of card, full height, `object-fit: contain`, centered (no anchor override). Left-edge
   mask fade at 40%→90%.
4. **Guest "Xem trước cách lập lá số" card (Tử Vi only)** — artwork zone: bottom-right
   corner, 58% width × 92% height, `object-fit: contain`, anchored **bottom**. Diagonal
   mask fade (`linear-gradient(128deg, transparent 6%→22%, black 55%)`).
   - Note: Bản đồ sao has **no** guest-preview card — it only appears in the Discovery card.

## Naming convention for delivery

Drop new files into this same directory (`apps/web/public/assets/menh_vi_board01_generated_assets/`)
using these exact names — **do not overwrite the current production files**:

| Feature | Master (PNG) | Runtime (WebP) |
|---|---|---|
| Tử Vi | `07_feature_tuvi_pagoda_hd_master.png` | `07_feature_tuvi_pagoda_hd.webp` |
| Tarot | `06_feature_tarot_cards_hd_master.png` | `06_feature_tarot_cards_hd.webp` |
| Bản đồ sao | `09_feature_natal_orbit_hd_master.png` | `09_feature_natal_orbit_hd.webp` |
| Thần số học | `10_feature_numerology_hd_master.png` | `10_feature_numerology_hd.webp` |

## Integration mapping (for later — not done now)

When the four `_hd.webp` runtime files exist, the only code change needed is updating the
four string values in `FEATURE_ART_ASSET` (`dashboard-view.tsx`, currently around line 65):

```ts
const FEATURE_ART_ASSET: Record<'tu_vi' | 'tarot' | 'natal_chart' | 'numerology', string> = {
  tu_vi: `${BOARD01_ASSET_BASE}/07_feature_tuvi_pagoda_hd.webp`,
  tarot: `${BOARD01_ASSET_BASE}/06_feature_tarot_cards_hd.webp`,
  natal_chart: `${BOARD01_ASSET_BASE}/09_feature_natal_orbit_hd.webp`,
  numerology: `${BOARD01_ASSET_BASE}/10_feature_numerology_hd.webp`,
};
```

At that point, re-measure each image's rendered footprint (per the safe-zones above) and
re-tune or remove `FEATURE_ART_SCALE` — the current multipliers were calibrated against
the *current* low-res files' specific aspect ratios and will not be correct for different
source art.

## QA checklist for delivered assets (before integration)

- [ ] File dimensions meet the 1024×1024 minimum (1536×1536 preferred)
- [ ] Transparent background, no baked-in UI chrome or text
- [ ] No purple/violet/magenta/cyan/neon in the palette
- [ ] No blur, bloom-obscured detail, or compression noise at 100% zoom
- [ ] Subject matches the Board 01 reference exactly (not a reinterpretation)
- [ ] Important detail sits inside a safe central region, not at the image edges
- [ ] Master is lossless PNG; runtime WebP is a high-quality export of the same master
