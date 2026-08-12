# Mệnh Vi — Asset Requirements

All assets below are consumed by an isolated `/menh-vi` exploration route
(`apps/web/features/menh-vi/*`, `apps/web/app/menh-vi/*`) and do not affect BeaconVie's existing
UI. Until an asset is supplied, its slot renders a clearly-labeled `ASSET REQUIRED` development
placeholder — never a fabricated substitute — so nothing ships looking finished when it isn't.

Global art direction for all assets: **Eastern Destiny × Modern Lifestyle**, premium consumer
app — not admin dashboard, not gaming, not crypto, not a dated Vietnamese fortune-telling site.
Palette: deep indigo/navy background (`#080B14`–`#101323`), mystical violet (`#7765FF`/`#9A83FF`),
champagne gold (`#D9BC78`) as the only bright accent. Lighting should feel soft, luminous,
starlit — never neon, never garish. No text baked into any image (all text is rendered in code).

---

## Asset 01 — Tử Vi Lá Số feature card illustration

**Purpose:** Artwork inside the "Tử Vi Lá Số" destiny-tool card on the Mệnh Vi home page.
**Filename:** `feature-tu-vi.webp`
**Target path:** `apps/web/public/assets/menh-vi/features/feature-tu-vi.webp`
**Dimensions:** 480×480px source (rendered ~96–140px in the card).
**Aspect ratio:** 1:1
**Background:** Transparent.
**Visual description:** A modernized Vietnamese Tử Vi chart motif — a stylized 12-house square
astrolabe diagram seen at a slight angle, with faint gold linework tracing the grid, one or two
small star glyphs glowing at chart intersections. Should read as "personal destiny chart," not
generic Western zodiac wheel.
**Art direction:** Line-art style over a soft violet glow, gold linework accents, thin strokes,
no heavy shading. Should feel like a refined icon-illustration hybrid, not a photo-real object.
**Composition constraints:** Subject centered with ~15% transparent margin on all sides so it sits
cleanly inside a rounded card without touching edges or card copy below it.
**Do NOT include:** Text, Western zodiac wheel, tarot cards, photorealistic rendering, clutter.
**UI usage:** `next/image`, fixed small square inside `DestinyToolCard`, lazy-loaded.
**Priority:** P0

---

## Asset 02 — Tarot feature card illustration

**Purpose:** Artwork inside the "Tarot" destiny-tool card.
**Filename:** `feature-tarot.webp`
**Target path:** `apps/web/public/assets/menh-vi/features/feature-tarot.webp`
**Dimensions:** 480×480px
**Aspect ratio:** 1:1
**Background:** Transparent.
**Visual description:** Two or three tarot cards fanned slightly, card backs facing out, glowing
faint gold star pattern on the backs (do not depict any specific named Major Arcana card here —
this is the generic category icon, not a deck card).
**Art direction:** Same violet/gold luminous line-art treatment as Asset 01, consistent material
language across all four feature cards.
**Composition constraints:** Centered, 15% margin, fits a square card slot.
**Do NOT include:** Legible tarot card names/numbers, text, photoreal card stock texture.
**UI usage:** `next/image`, `DestinyToolCard`.
**Priority:** P0

---

## Asset 03 — Bản Đồ Sao feature card illustration

**Purpose:** Artwork inside the "Bản Đồ Sao" destiny-tool card.
**Filename:** `feature-star-map.webp`
**Target path:** `apps/web/public/assets/menh-vi/features/feature-star-map.webp`
**Dimensions:** 480×480px
**Aspect ratio:** 1:1
**Background:** Transparent.
**Visual description:** A small armillary-sphere / astrolabe motif — thin concentric rings at
different angles suggesting a celestial globe, a few star points along the rings.
**Art direction:** Same line-art-over-glow treatment, gold rings on violet glow.
**Composition constraints:** Centered, 15% margin.
**Do NOT include:** Text, planets rendered as photoreal spheres, saturn-like ring textures.
**UI usage:** `next/image`, `DestinyToolCard`.
**Priority:** P0

---

## Asset 04 — Thần Số Học feature card illustration

**Purpose:** Artwork inside the "Thần Số Học" destiny-tool card.
**Filename:** `feature-numerology.webp`
**Target path:** `apps/web/public/assets/menh-vi/features/feature-numerology.webp`
**Dimensions:** 480×480px
**Aspect ratio:** 1:1
**Background:** Transparent.
**Visual description:** A small cluster of glowing numerals (e.g. 3, 7, 9) arranged loosely like
scattered stars, gold gradient fill, faint violet glow behind them.
**Art direction:** Consistent with Assets 01–03.
**Composition constraints:** Centered, 15% margin.
**Do NOT include:** Full numeral sequences/dates, text labels, calculator/spreadsheet imagery.
**UI usage:** `next/image`, `DestinyToolCard`.
**Priority:** P0

---

## Asset 05 — Star-map CTA illustration (home page right rail)

**Purpose:** Larger illustrative banner behind "KHÁM PHÁ BẢN ĐỒ SAO" CTA card at the bottom of the
home page right rail.
**Filename:** `star-map-banner.webp`
**Target path:** `apps/web/public/assets/menh-vi/banners/star-map-banner.webp`
**Dimensions:** 900×560px source.
**Aspect ratio:** 16:10
**Background:** Opaque (this is a full banner background, not an overlay).
**Visual description:** A wide, atmospheric night-sky scene — sparse bright stars, one soft
glowing nebula-like violet cloud, a thin gold constellation line connecting a few stars into an
abstract shape (not a real named constellation). Calm, spacious, not busy.
**Art direction:** Deep navy/indigo base (`#080B14`→`#15182B` gradient feel), violet glow bloom
in one corner, gold star points, soft depth-of-field — premium editorial night-sky photography
style rather than cartoon illustration.
**Composition constraints:** Keep the bottom-left ~40% of the frame darker/emptier — card title
and CTA button are overlaid there in code.
**Do NOT include:** Text, human figures, zodiac wheel, photoreal planets, lens flares.
**UI usage:** CSS `background-image` on the CTA card, `object-fit: cover`, lazy-loaded below the
fold.
**Priority:** P1

---

## Asset 06 — Tarot card back

**Purpose:** Face-down deck card and shuffle/pick interaction in the Tarot teaser and future full
Tarot flow.
**Filename:** `tarot-card-back.webp`
**Target path:** `apps/web/public/assets/menh-vi/tarot/tarot-card-back.webp`
**Dimensions:** 768×1280px source.
**Aspect ratio:** 4:5 (portrait tarot card ratio, rendered ~2:3 to 4:5 depending on slot)
**Background:** Opaque (fills the whole card face).
**Visual description:** A symmetric, ornamental card-back pattern — central compass/star glyph
echoing the Mệnh Vi brand mark, surrounded by a fine gold linework border and small repeating
star motifs, on a deep violet-to-navy gradient field.
**Art direction:** Elegant, symmetrical, printable-tarot-deck quality; gold on deep violet;
restrained ornamentation, not busy or cluttered.
**Composition constraints:** Full-bleed card design with a visible thin gold border inset ~3% from
each edge; must look correct at both small (deck stack, ~80px wide) and large (flip reveal,
~320px wide) render sizes.
**Do NOT include:** Text, specific Major Arcana imagery (this is the universal back, used for
every card before it's revealed).
**UI usage:** `next/image`, deck stack + flip-card component (`TarotCardFlip`), shown before
reveal.
**Priority:** P0

---

## Asset 07 — The Star (Major Arcana face)

**Purpose:** The single revealed card shown in the home page's "Một lá bài dành cho bạn" teaser
and in the mobile Tarot preview.
**Filename:** `tarot-the-star.webp`
**Target path:** `apps/web/public/assets/menh-vi/tarot/tarot-the-star.webp`
**Dimensions:** 768×1280px source.
**Aspect ratio:** 4:5
**Background:** Opaque.
**Visual description:** A modern, restrained interpretation of The Star tarot card — a serene
figure kneeling beside water under a large glowing star and a scatter of smaller stars, rendered
in the Mệnh Vi violet/gold palette rather than traditional Rider-Waite colors.
**Art direction:** Soft, hopeful, luminous; linework-and-glow style consistent with the feature
card illustrations (Assets 01–04) rather than a fully painterly/photoreal tarot illustration, so
the deck reads as one coherent product rather than stock tarot art.
**Composition constraints:** Same border/frame treatment as Asset 06 (card back) for visual
pairing; leave the bottom ~10% slightly darker/simpler in case a small label chip is overlaid in
code.
**Do NOT include:** Text/card name baked into the image (rendered in code beneath/over the card),
nudity beyond traditional tarot symbolism's minimal figure silhouette treated tastefully and
non-explicitly.
**UI usage:** `next/image`, revealed state of `TarotCardFlip`, and the "LÁ BÀI DÀNH CHO BẠN"
mobile panel.
**Priority:** P0 (this is the only face card needed for the home-page teaser; the rest of the
Major Arcana — Fool, Magician, Lovers, Moon, Sun, etc. — are **P2**, needed only once a full
Tarot draw flow beyond the home teaser is built)

---

## Asset 08 — Mệnh Vi signature mark (refined variant)

**Purpose:** Optional refined brand glyph for the top nav and marketing touches. A simple SVG
compass/star mark is implemented in code now (see reference breakdown §8) and is sufficient for
launch; this asset is only for a more illustrated variant if desired later.
**Filename:** `menh-vi-mark.svg` (vector preferred over webp for a logo)
**Target path:** `apps/web/public/assets/menh-vi/brand/menh-vi-mark.svg`
**Dimensions:** 256×256px artboard.
**Aspect ratio:** 1:1
**Background:** Transparent.
**Visual description:** An eight-point compass star crossed with a subtle crescent, in the brand
gold, refined enough to work at 24px in the nav bar and larger on marketing surfaces.
**Art direction:** Single-color gold line mark, minimal, geometric, timeless — not illustrative.
**Composition constraints:** Must remain legible at 20–24px; avoid fine detail that disappears at
small sizes.
**Do NOT include:** Gradients that break at small sizes, text, color beyond a single gold tone.
**UI usage:** `Logo` component swap-in, nav bar, favicon candidate.
**Priority:** P2

---

## Asset 09 — Hero background celestial texture

**Purpose:** Subtle background texture behind the greeting/Destiny Orbit hero band, layered under
the CSS-generated stars/gradient.
**Filename:** `hero-celestial-texture.webp`
**Target path:** `apps/web/public/assets/menh-vi/backgrounds/hero-celestial-texture.webp`
**Dimensions:** 1920×960px source.
**Aspect ratio:** 2:1
**Background:** Opaque, designed to sit behind semi-transparent CSS gradient overlays.
**Visual description:** Very faint layered mountain/horizon silhouette at the bottom edge (echoing
the small planet/mountain shapes in the reference) fading into open starry sky above — extremely
subtle, low-contrast, meant to be seen only as ambient depth, never competing with foreground
text or the Destiny Orbit.
**Art direction:** Near-monochrome deep navy/violet, very low contrast, soft grain, no bright
highlights except a handful of small star points.
**Composition constraints:** Bottom 20% can carry the horizon silhouette; keep the center-top 60%
(where the Destiny Orbit and headline sit) nearly empty/flat so the CSS orbit and text stay the
clear focal point.
**Do NOT include:** Any bright focal object that competes with the orbit, text, sharp edges,
visible horizon line that looks like a literal landscape photo.
**UI usage:** CSS `background-image` on the hero section, behind existing CSS star/gradient
layers, `background-size: cover`.
**Priority:** P2 (CSS gradients + SVG stars are an acceptable substitute per the brief's own
"avoid excessive particle effects" and CODE-first guidance; this asset is purely a polish pass)

---

## Priority summary

**P0 — required before final visual QA of the home page:**
- Asset 01 — `feature-tu-vi.webp`
- Asset 02 — `feature-tarot.webp`
- Asset 03 — `feature-star-map.webp`
- Asset 04 — `feature-numerology.webp`
- Asset 06 — `tarot-card-back.webp`
- Asset 07 — `tarot-the-star.webp`

**P1 — recommended, meaningfully improves fidelity:**
- Asset 05 — `star-map-banner.webp`

**P2 — optional polish, later pass:**
- Asset 08 — `menh-vi-mark.svg`
- Asset 09 — `hero-celestial-texture.webp`
- Remaining Major Arcana faces (Fool, Magician, Lovers, Moon, Sun, etc.) once a full Tarot draw
  flow is built beyond the home-page teaser.

Until each file exists at its target path, its component renders a visible `ASSET REQUIRED —
{filename} — {dimensions}` placeholder box at the correct aspect ratio, never a fabricated stand-in.
