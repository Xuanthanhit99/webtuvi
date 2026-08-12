# Mệnh Vi — Generated Asset Audit

Source: 9 ChatGPT/OpenAI-generated PNGs at `apps/web/temp/menh-vi-generated-assets/asset-01.png`
through `asset-09.png`. Inspected visually (Read tool) and programmatically (`sharp` — dimensions,
color type, real alpha-channel min/max/coverage). Source PNGs are preserved untouched at their
original location; nothing under `apps/web/temp/` ships to production (`temp/` is outside
`apps/web/public/`).

Numbering in the filenames does **not** correspond to the asset-requirements doc's Asset 01–09
numbering — each file was classified purely from its visual content, per instructions.

| Source PNG | Visual Content | Intended Requirement | Suitable? | Final Filename | Priority | Notes |
|---|---|---|---|---|---|---|
| `asset-01.png` | 12-house Tử Vi chart on a scroll, bagua/yin-yang center, armillary sphere, constellations | Asset 01 — `feature-tu-vi.webp` | **Yes** | `feature-tu-vi.webp` | P0 | Real transparency confirmed (alpha 0–255, 52% non-opaque). More painterly/detailed than the spec's "line-art icon" brief, but square, on-palette, no baked text, no checkerboard. Accepted with a noted style deviation (see §Consistency below). |
| `asset-02.png` | Three fanned tarot cards, backs facing out, gold star/moon/compass motifs | Asset 02 — `feature-tarot.webp` | **Yes** | `feature-tarot.webp` | P0 | Real transparency confirmed (56% non-opaque). Same detail level as `asset-01`, forms a consistent pair with it. No baked text. |
| `asset-03.png` | Armillary sphere on a stand, scroll with bagua, dragon-in-lotus orb, floating planets | Closest to Asset 03 — `feature-star-map.webp` | **No** | — | — | Real transparency confirmed, but native 1536×1024 landscape with subject elements (scroll left, dragon-lotus right) spread across the full width — `sharp trim()` found content touching every edge, so a centered 1:1 crop cuts the scroll and dragon-lotus. Does not fit the required square slot without losing composition. Also too ornate/multi-object for the calmer `star-map-banner.webp` (P1) role. **Not used.** |
| `asset-04.png` | Zodiac/constellation wheel with sun-face compass, telescope, moon, ringed planet | Overlaps Asset 03 territory, no numerology content | **No** | — | — | Same wide-composition problem as `asset-03` (real transparency, but content spans full 1536×1024 width). Thematically redundant with `asset-03` rather than distinct. Does not depict numerology despite being generated in this batch. **Not used.** |
| `asset-05.png` | Numerology mandala — numerals 1–9 arranged around a lotus/flower-of-life pattern | Asset 04 — `feature-numerology.webp` | **Content: yes. File: no.** | — | P0 | **Content is an excellent, on-brief match** (better than the spec even — a full 1–9 numerology wheel). But the file is `colorType 2` (RGB, **no alpha channel at all**) with a **checkerboard baked directly into the pixels** to simulate transparency. Per the transparency rule, this must not ship. **REGENERATION REQUIRED** — see §E, keeping this exact concept. |
| `asset-06.png` | Scholar's desk: open scroll, closed book, armillary sphere, incense burner, brush pot | No direct requirement match | **No** | — | — | `colorType 2` (RGB), checkerboard baked in — fake transparency. Content also doesn't map cleanly to any single card/slot (reads as a general "study of destiny" vignette, closest to a life-timeline or about-page mood image, neither of which currently has an asset slot). **Not used.** |
| `asset-07.png` | Ornate treasure chest, open, glowing scroll inside, gem badge + ribbon banner below | None — art-direction violation | **No — reject** | — | — | `colorType 2` (RGB), checkerboard baked in. More importantly, this reads as a **fantasy-RPG loot chest with an achievement ribbon**, which `menh-vi-asset-requirements.md`'s art direction explicitly lists as a thing to avoid ("mobile RPG," "fantasy loot icon"). Rejected on brand grounds independent of the transparency problem. |
| `asset-08.png` | Security/privacy iconography: shield+checkmark, padlock, person, database, lock | None | **No — reject** | — | — | Real transparency confirmed (53% non-opaque), technically clean, but the content (trust/security badges) has no relationship to any Mệnh Vi UI surface — looks generated for an unrelated "data privacy" section. **Not used.** |
| `asset-09.png` | Marketing "benefits" infographic — 4 icon+label pairs (Dễ hiểu, Cá nhân hóa, Dễ áp dụng, Tiết kiệm thời gian) inside a bordered banner with a large baked headline | None | **No — reject** | — | — | Opaque, and contains substantial **baked-in Vietnamese text** duplicating what should be rendered by the frontend (violates the "no text in artwork" rule directly). Reads as a landing-page feature-benefits graphic, not a component asset for any existing Mệnh Vi slot. **Not used.** |

---

## Round 2 — regenerated assets (2026-08-13)

5 new source PNGs were added at `apps/web/temp/menh-vi-generated-assets/`: `feature-star-map.png`,
`feature-numerology.png`, `tarot-card-back.png`, `tarot-the-star.png`, `star-map-banner.png`. A
6th file, `ChatGPT Image Aug 13, 2026, 12_02_22 AM.png`, is a byte-identical duplicate of
`feature-star-map.png` (verified via checksum) — the original export before renaming, not a
distinct 6th asset.

**Filenames were cross-swapped for two files** — verified by visual content, not trusted from the
name:

| Source PNG (as named) | Actual visual content | Real requirement |
|---|---|---|
| `feature-numerology.png` | Ornate tarot card-back design (compass/star glyph, moon phases, gold border) | **This is `tarot-card-back.webp`**, not numerology |
| `tarot-card-back.png` | Numerology mandala — numerals 1–9 around a lotus | **This is `feature-numerology.webp`**, not the card back |

Both are used under their correct role below — the mix-up was in the export filenames only, not
in this audit's mapping.

| Source PNG | Visual Content | Requirement | Suitable? | Final Filename | Notes |
|---|---|---|---|---|---|
| `feature-star-map.png` | Armillary sphere on a stand — single centered subject, square framing | `feature-star-map.webp` | **No — same defect as round 1** | — | Composition is now correct (centered, square, matches `feature-tu-vi`/`feature-tarot` detail level) — a real improvement over `asset-03`/`asset-04`. But `colorType 2` (RGB), **no alpha channel**, checkerboard baked into the pixels. Still fake transparency. **REGENERATION REQUIRED** — keep this exact composition, fix only the transparency method. |
| `feature-numerology.png` (→ mapped as tarot-card-back) | Ornate card-back: central 8-point compass/star, moon-phase column, gold scrollwork border, deep violet field | `tarot-card-back.webp` | **Yes** | `tarot-card-back.webp` | `colorType 2` (RGB, no alpha) — correct, a card back should be opaque full-bleed, not transparent. No baked text. Symmetric, matches the spec's brief almost exactly. 971×1619 (~0.6 ratio, matches the intended 768×1280 render size). |
| `tarot-card-back.png` (→ mapped as numerology) | Numerology mandala — numerals 1–9 around a lotus/flower-of-life | `feature-numerology.webp` | **Yes, after center crop** | `feature-numerology.webp` | Real transparency confirmed (alpha 0–253, 62% non-opaque). Native 1536×1024 landscape; unlike round 1's `asset-03`/`asset-04`, this composition **is** centered — a test crop to 1024×1024 (`left:256`) keeps all 9 numeral circles fully intact with clean margins (verified visually before shipping). Cropped, then resized to 480×480. |
| `tarot-the-star.png` | The Star tarot card — kneeling figure pouring water under a large star, classical pillars, mountains | `tarot-the-star.webp` | **Yes, with a frontend note** | `tarot-the-star.webp` | Opaque (correct for a card face), 971×1619 (~0.6 ratio, matches 768×1280). No checkerboard. **Contains baked text**: "XVII" (top) and "THE STAR" (bottom banner). This violates the original "no text in artwork" rule, but per this round's explicit instruction, baked title/numeral is acceptable as long as the frontend doesn't redundantly re-print it — see integration notes below, where the on-page label was reduced from a large duplicate heading to a small caption. |
| `star-map-banner.png` | Atmospheric night-sky banner — Milky Way band, one constellation, small zodiac-glyph column (top right), distant mountain/lakeside city silhouette with lights, sunrise glow on horizon | `star-map-banner.webp` | **Yes** | `star-map-banner.webp` | Opaque (correct), 1589×989 (≈1.607, matches the spec's 900×560 ≈1.607 almost exactly — no crop needed). No text, no RPG/loot elements. Busier than the spec's "calm, spacious" ask (constellation + skyline + zodiac glyphs together) but reads as premium editorial night photography, not cluttered fantasy-game art. Bottom-left quadrant is dark enough for the overlaid CTA text to stay legible. |

### Round 3 — `feature-star-map.webp` regenerated (2026-08-13)

New source: `feature-star-map.png`, 1024×1536 (portrait, `colorType 6` / RGBA).

**Programmatic alpha verification** (not visual guessing): read the raw pixel buffer and sampled
both corners and a full alpha histogram.
- `alphaMin: 0`, `alphaMax: 254`, 65.6% of pixels non-opaque, 51.1% fully transparent (`alpha=0`).
- All 4 corners plus top-center sample: `RGBA ≈ (0,0,0,0)` / `(1,1,1,0)` — alpha is genuinely 0
  at the background, not 255-with-a-baked-checkerboard. This is real alpha transparency,
  confirmed at the byte level, not inferred from how it looked in a preview.

**Composition:** same armillary-sphere subject as the round-2 attempt, but framed taller
(finial star + sphere/rings + a decorative stand, 1024×1536 instead of square). `sharp.trim()`
found glow extending nearly the full height, so there's no clean gap to isolate just the sphere
automatically — a manual crop test was rendered and inspected before committing to it. A top-aligned
1024×1024 crop (`top: 0, left: 0`) keeps the finial and the complete sphere/rings intact, self-contained,
filling the frame at the same visual density as the other 3 accepted feature icons; only the
lower decorative stand is cropped away, which is acceptable since the sphere/rings is the
identifying "armillary sphere" motif per the original requirement, not the stand.

**Accepted.** Cropped 1024×1024 → resized to 480×480, alpha preserved, `webp` quality 86 /
alphaQuality 100. Ships as `feature-star-map.webp`.

### Round 2 outcome
4 of 5 regenerated assets accepted (after the filename correction). Only `feature-star-map.webp`
remains blocked, and only on the transparency implementation — the composition itself is now
correct and should be reused unchanged in the next regeneration.

## Consistency note (feature-card collection)

`asset-01` and `asset-02` are meaningfully more detailed/painterly (fine shading, multiple
layered objects, soft-focus glow) than the asset-requirements doc's original "restrained
line-art icon" brief. They match each other well, so the two-card subset that exists today reads
as one collection. However, if `feature-star-map.webp` and `feature-numerology.webp` are
regenerated plainly per the original spec text (simpler line art), the four-card row would end up
inconsistent — two ornate, two minimal. The regeneration specs in §E below intentionally ask for
the **same painterly detail level as `asset-01`/`asset-02`**, not the original simpler brief, so
all four end up as one visual family. This is a deliberate update to the art direction for these
two remaining assets, based on what was actually generated and accepted.
