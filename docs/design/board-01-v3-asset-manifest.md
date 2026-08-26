# Board 01 V3 — Home + Global Shell Asset Manifest

Founder reopened Board 01 for a visual rebuild of the existing, already-functionally-complete Home
(see `docs/design/ui-asset-mapping.md` "Notes — Board 01" for the first pass's data-honesty
decisions, unchanged here). This manifest tracks every major Home V3 visual against its real
implementation. Board 02/03/04 are untouched — see `git diff --stat` for the exact file list, all
under `apps/web/features/dashboard/components/`.

**Revision 2 (founder correction pass)** addressed a "vertically bloated / oversized dashboard
widgets" review: Discovery went from a 1-dominant+3-stacked layout back to 4 equal, fixed-height
(272px desktop) cards; the guest "Bắt đầu từ đâu?" row went from a 1.3fr/1fr split to three
near-equal columns; Editorial gained a fixed ~460–530px total height (magazine cover treatment
instead of aspect-ratio-driven blowout); Trust became 3 compact icon pillars instead of a padded
text block; Final CTA gained mountain/star/cloud-line layers instead of being a blank panel; the
hero headline shrank (~15% smaller clamp, narrower column) while the Destiny Orbit grew from 460px
to 520px on desktop and gained a secondary inner glyph ring plus brighter strokes; the guest hero
context panel shrank from a full paragraph card to a 3-line glass panel so it stops competing with
the Orbit; and section-to-section rhythm widened from 32px to 56–64px gaps.

**Revision 3 (founder polish pass) — root cause found and fixed.** The founder reported the Hero
had regressed (tiny headline, dead sky, Orbit "dropped low", guest personal panel "became a
full-width horizontal strip") and that "Dành cho bạn" had "become three full-width horizontal
slabs." Reproduced directly: at 1024px width (a documented target breakpoint — see the founder's
own Board 01 spec: "Tablet 1024px/768px" — distinct from "Desktop 1440px+/1536px"), both the Hero's
3-column grid and the guest-try 3-column grid were gated behind a single `desktop:` (≥1280px)
Tailwind breakpoint with **no intermediate tablet composition**, so anything between 768–1279px fell
back to one full-width stacked column. Confirmed with real measurements before the fix: the guest
context card rendered **895px wide × 129px tall** at 1024px — a literal full-width strip, exactly
matching the report. Fix: both grids now have an explicit tablet-tier layout (`tablet:` 768px+)
instead of jumping straight from mobile-stacked to desktop-3-column — Hero becomes a proper 2-column
[copy | Orbit] with the context card explicitly grid-placed under the Orbit column at ≤260px wide;
guest-try becomes Tarot-full-width-on-top + Numerology/Tử-Vi 2-up below. The desktop 3-column Hero
grid itself was also rebalanced to the founder's literal percentage targets (measured at 1440px:
headline column 461px/33.5%, Orbit column 500px/36.3%, context column 256px/18.6% — all within or
touching the requested 34–38% / 38–42% / 18–22% split), the headline clamp restored to
`clamp(2.4rem, 4.6vw, 4.5rem)` (measures 66px at 1440px, inside the requested 56–68px), the Orbit
grew to 500×500px and had its outer-bezel/secondary-ring stroke opacities raised into the requested
0.55–0.75 / 0.25–0.45 bands, Discovery cards grew to 296px tall with a 128px (43%) visual zone and
enlarged/enriched SVG artwork (soft radial glow behind each, taller viewBox, more ornamental detail),
and Final CTA gained a faint circular celestial-geometry SVG layer behind the headline without any
height increase (confirmed still 338px). Editorial (528px) and Trust (155px) were **not**
restructured, per the explicit "KEEP IT" instruction — confirmed unchanged.

**Revision 4 (founder final polish pass) — additive richness only, no structural changes.**
Explicitly scoped to "elevate visual richness, depth, and premium finish" without touching layout.
Confirmed structurally identical before/after via DOM measurement: Hero 720px, Discovery cards
296px×4, Editorial 528px, Final CTA 338px — only Trust grew slightly (155→169px) from larger icon
badges and padding, still compact. Changes: Destiny Orbit gained a double-line outer bezel, 120
graduated ticks (was 60), four fixed cardinal "strut" accents, richer alternating diamond/dot inner
glyph ring, and four static mid-radius marker points; the four Discovery SVGs gained soft glow
gradients, extra orbital/constellation linework, and (Tarot only) a local indigo atmosphere tint
that never leaves that one card; Discovery cards and all three guest-try cards gained a shared
`CardTexture` (faint star-dot pattern + corner gold falloff) for visual consistency, and their hover
interaction changed from whole-card lift to artwork-only lift (2–4px) so the card itself stays still
while the illustration responds; the guest Numerology form was compacted from a 3-row stacked form
to a single input+button row so it no longer reads as a dominant web form; Editorial's gradient,
border opacity, hover-scale (1.05→1.03), and category-label color were unified; Trust icons moved
into a bordered badge circle with heavier stroke weight. No route, API, data, or engine code was
touched — see `git diff --stat`, unchanged from prior revisions in scope.

**Revision 5 (founder art-direction correction) — SVG is no longer the main visual; real
illustrations replace it.** The founder correctly identified that the hand-drawn line-art SVGs
(however enriched in revision 4) still read as technical/wireframe rather than premium mystical
artwork, and asked for a re-audit of every raster asset before defaulting back to more SVG. That
re-audit found **five previously unused, purpose-built assets** that had never been wired into any
page:

| File | Classification | Decision |
|---|---|---|
| `menh-vi/features/feature-tu-vi.webp` | HIGH_QUALITY_REUSE | Now the Discovery **and** guest-try Tử Vi illustration — a commissioned painting of a palace chart with astrolabe/scroll ornaments, transparent background |
| `menh-vi/features/feature-tarot.webp` | HIGH_QUALITY_REUSE | Now the Discovery **and** guest-try Tarot illustration — a 3-card fan with celestial detail, transparent background |
| `menh-vi/features/feature-star-map.webp` | HIGH_QUALITY_REUSE | Now the Discovery Bản đồ sao illustration — an armillary-sphere/orbital painting |
| `menh-vi/features/feature-numerology.webp` | HIGH_QUALITY_REUSE | Now the Discovery **and** guest-try Numerology illustration — a numbered mandala |
| `menh-vi/home/ChatGPT Image Aug 21…10_14_23 PM.png` | HIGH_QUALITY_REUSE | Now the Final CTA's real background layer (was a synthetic SVG ring+stars+mountain approximation) — an actual painted mountain/lake/celestial-orbit landscape |
| `menh-vi/home/ChatGPT Image Aug 21…10_14_38 PM.png` | HIGH_QUALITY_REUSE (OVERLAY_REUSE) | Now an additional Hero atmosphere layer at 40% opacity — real painted eastern cloud-line ornament with mist, replacing the corner accent's reliance on hand-SVG alone (`CloudLines` SVG is kept, still used in the Final CTA) |
| `menh-vi/home/ChatGPT Image Aug 21…10_14_26 PM.png` | REJECT | Broken chroma-key extraction — visible yellow/red fringing artifacts around every edge. Not production quality. |
| `menh-vi/home/ChatGPT Image Aug 21…10_15_09 PM.png`, `…10_15_44 PM.png` | REJECT (as sliceable assets) | Full-page design-reference mockup boards for the archived "Mệnh Vi" exploration, complete with fabricated data (78/100 energy score, fake community counts, fake calendar events) baked into the image itself — not a component asset. Kept only as confirmation that the already-in-use `article-*.png` images were sourced from this same coherent illustration pass. |
| `apps/web/public/assets/tarot/card-back.webp` (existing production asset) | HIGH_QUALITY_REUSE (considered) | The real, already-shipping Tarot card back — confirmed as an option for future Tarot-preview art, but `feature-tarot.webp`'s 3-card fan was used instead since it already composes multiple cards in one asset. Read-only; not modified. |

A known tension, disclosed rather than hidden: `feature-tarot.webp`, `feature-star-map.webp`, and
`feature-numerology.webp` all carry a purple/indigo cosmic-mist rendering as part of their painted
style (not a UI accent choice) — visually heavier than the "no global purple" rule from revision 1
anticipated. Kept anyway because (a) the purple is inherent to the artwork's nebula texture, not an
accent color applied to a UI surface, (b) each is paired with its own distinct warm-gold radial glow
behind it so the card reads gold-forward, and (c) the founder's own explicit instruction this pass —
"Do not reject good raster art merely because SVG is easier" and "Would this still look premium
shown alone at 400px? If no, it is not production artwork" — both argue for keeping genuinely
premium commissioned art over a schematic SVG redraw. Flagged here for founder review rather than
silently resolved.

**Not done, and why:** section 10's "background chapters" (a distinct atmosphere per major section,
implemented as separate background containers) was intentionally not built — every prior founder
note this Board has insisted "DO NOT redesign the page layout," and adding a new background
container per section is a structural change to how each section is composed, not a presentation
change within the existing one. Instead, richness was concentrated inside each section's existing
content (Hero atmosphere layers, Discovery/guest-try real art + per-card tint, Trust per-pillar tint,
Final CTA real background) without adding new wrapping containers.

| Element | Reference purpose | Type | Source | Implementation | Responsive strategy | Animation | Status |
|---|---|---|---|---|---|---|---|
| Destiny Orbit | Hero signature visual | GENERATE_SVG (extends existing) | `home/destiny-orbit.tsx` | 6 concentric SVG layers: outer ornamental bezel (new), counter-rotating secondary ring, tick ring, inner orbit, static Earthly-Branch compass, breathing center star | `max-w-[260px]` mobile → `[380px]` tablet → fills a `460px` hero column on desktop | outer bezel 190s cw, secondary ring 150s ccw, tick ring 120s cw, inner orbit 70s cw, center glow 5s breathe, sparse star twinkle 4s | READY |
| Mountain silhouette | Atmospheric hero backdrop | REUSE_EXISTING_ASSET | `apps/web/public/assets/menh-vi/home/hero-mountains.png` | `next/image fill`, `priority`, `object-cover object-bottom`, 70% opacity | same crop scales via `fill` at all breakpoints | static | READY |
| Mist / depth layer | Atmosphere between mountains and sky | REUSE_EXISTING_ASSET | `hero-mist.png` | `next/image fill`, now `priority` (was lazy — could disappear above the fold on a non-compositing/slow paint; matches `hero-mountains`' treatment) | same | static | READY |
| Background starfield | "BACKGROUND: subtle starfield" per brief | REUSE_EXISTING_ASSET | `hero-stars.png` | `next/image fill`, 16% opacity, `hidden tablet:block` (too dense/bright to show at full mobile size) | desktop/tablet only | static | READY |
| Eastern cloud-line motif | Thin gold cloud-line accents | CODE_GENERATED_VISUAL | existing hand-authored `CloudLines` SVG (unchanged), now mirrored to both hero corners | inline SVG, `currentColor` | `hidden tablet:block` (top-right), `hidden desktop:block` (bottom-left, mirrored) | static | READY |
| `cloud-lines.png` | Candidate cloud-line raster | REQUIRES_RASTER_ARTWORK → REJECTED | `apps/web/public/assets/menh-vi/home/cloud-lines.png` | — | — | — | REJECTED — visually audited: a fiery orange/red glow with a gold hex-grid at the bottom, wrong mood and palette entirely (reads as fire/industrial, not eastern cloud-line calligraphy). Kept the code-generated `CloudLines` SVG instead. |
| Discovery section | 1 dominant + 3 supporting portals | CODE_GENERATED_VISUAL + REAL_API | `dashboard-view.tsx` `FeatureCard` (`dominant` prop) | `desktop:grid-cols-[1.35fr_1fr]`; supporting 3 collapse to `tablet:grid-cols-3` below desktop, single column on mobile | card hover lift (pre-existing) | READY |
| Personal strip (auth) | Lighter modular row, not 3 heavy boxes | REAL_API | `ForYouSection` / `StripItem` | one bordered container, `divide-x` on tablet+, `divide-y` stacked on mobile | none | READY |
| Personal strip (guest) | "Bắt đầu từ đâu?" | REAL_INTERACTIVE (client-only trial, no backend/AI call) | `GuestTrySection` | Tarot trial dominant (`1.3fr`), Numerology + Tử Vi boundary stacked in the `1fr` column | none | READY |
| Editorial | 1 featured + 3 supporting articles | STATIC_EDITORIAL + REUSE_EXISTING_ASSET | `EditorialSection`, `article-*.png` | `desktop:grid-cols-[1.5fr_1fr]`, featured article full-width on mobile, supporting list stacks below | image hover zoom (pre-existing) | READY |
| Trust section | "Tính toán trước. AI giải thích sau." | STATIC_EDITORIAL | new `TrustSection` | 3-column on tablet+, stacked on mobile | none | READY (new) |
| Final CTA | Spacious closing section | STATIC_EDITORIAL | new `FinalCta` | centered, single column at all sizes | none | READY (new) |
| Guest header scroll behavior | Transparent at top, blurred after scroll | CODE_GENERATED_VISUAL | `home-route.tsx` `GuestHeader` | passive `scroll` listener toggles border/blur classes | n/a | READY (new; guest-only, not shared with Board 02/03/04) |

## Revision 6 (Board 01 V4 — art system rebuild)

The founder rejected revision 5's raster illustrations outright — "purple/fantasy raster
illustrations" are explicitly banned as primary artwork this round, in favor of a hand-built SVG
illustration system in a new bronze/gold/jade/ink-blue palette (purple/violet banned as a primary
color). This is a real, honest accounting of what was rebuilt at genuine craftsmanship this pass
versus the full 39-section brief, which asked for the scope of a commissioned illustration studio
engagement (20-layer orbit, 4 fully painted feature scenes, a full page-wide atmospheric background
system, per-breakpoint SVG detail modes) — more than one pass can deliver at senior-illustrator
fidelity. Prioritized the highest-impact, most load-bearing pieces:

**Done at real depth:**
- **Destiny Orbit rebuilt** with material-differentiated gradients (`bronzeSweep`/`goldSweep`
  linear gradients simulating engraved metal, `jadeNode`/`sealRed` radial gradients for distinct
  "materials"), a `feGaussianBlur` bloom filter on the center star, a `<symbol>`/`<use>` star-point
  glyph reused via reference (not duplicated per-instance), and a new 10 Heavenly Stems ring
  (Thiên Can — culturally the correct decorative counterpart to the existing 12 Earthly Branches,
  still purely decorative/fixed, never chart-bound) — 15 layers total, ~280 nodes, well under the
  1500-node budget.
- **All four Discovery illustrations rebuilt as SVG** (`TuViIllustration`, `TarotIllustration`,
  `NatalIllustration`, `NumerologyIllustration`) — the revision-5 raster art (`feature-*.webp`) is
  now **fully removed from visual use** (confirmed: `document.querySelectorAll('img')` inside both
  the Discovery section and the guest-try section returns 0 — zero raster images remain as primary
  artwork). Each uses shared gradient defs (`IllustrationDefs`) for a consistent gold/bronze/jade
  material language, and each is reused verbatim at both Discovery scale (~160px) and guest-preview
  scale (~90px) — genuinely responsive since it's vector, not a raster asset scaled up/down.
- **Global star field + film grain**, Home-scoped only (`PageAtmosphere`, lives inside
  `DashboardView`, never touches `styles/globals.css`) — a negative-z-index layer behind every
  section so the gaps between cards read as continuous night sky rather than flat black, plus a
  near-invisible `feTurbulence` grain layer.
- **Cloud ornament enriched** — `CloudLines` gained a soft filled ruyi-cloud mist shape underneath
  the existing thin gold linework, instead of thin lines alone.
- **Card atmosphere tints corrected** — the Tarot and Natal Discovery cards' background tint was
  slate-blue/indigo-purple in revision 5; both now use the new ink-blue/jade palette instead.

**Not done at full brief depth, disclosed rather than silently skipped:**
- Section 9's full 10-layer hero background rebuild (distant vector mountain silhouettes as a
  distinct SVG layer, three-zone directional lighting) was **not** built — the existing raster
  mountains/mist/stars remain the primary hero atmosphere (already high quality per the section 11
  allowance: "if existing raster mountains are high quality, they may remain as one layer"), with
  the new star field/grain and cloud-scroll art layered on top rather than a ground-up rebuild.
- Section 15's request for guest-try illustrations "flowing behind content" via masks (rather than a
  corner glyph) was not implemented — the three illustrations remain corner-positioned at ~90px, now
  real SVG instead of raster, but not yet a full masked background treatment.
- Section 16's page-wide "no obvious rectangular section colors" background system (distinct
  atmosphere per section transition) was not built as a structural change — consistent with every
  prior round's "do not redesign the page layout" constraint, richness was added within existing
  containers (the new star/grain layer, per-card tints) rather than by introducing new per-section
  background containers.
- Section 28's responsive "detail modes" (hiding tertiary ornament at tablet, simplifying further at
  mobile) — the Orbit and 4 illustrations currently scale as complete vector art at every breakpoint
  rather than progressively simplifying; this reads fine (SVG remains crisp and readable smaller) but
  doesn't reduce node count on mobile.
- Sections 20 (Editorial regrading) and 21 (Trust glyphs rebuilt from the new SVG system) were left
  as revision-4 state — Editorial's imagery/layout was explicitly "acceptable, keep it" as recently
  as the art-direction-correction round, and Trust's glyphs, while not literally derived from the new
  Orbit gradient system, already use gold/bronze/jade tones consistent with the new palette.

## Revision 7 (Board 01 V4.1 — material + atmosphere final pass)

**A real bug found and fixed, not just polish.** The founder reported the hero cloud ornament
visibly crossing the headline — reproduced immediately: the round-6 cloud raster used `fill`
(covering the *entire* hero, including the headline column) at 40% opacity with `object-top`
cropping, landing its corner swirl directly over the text. Fixed with a hard geometric constraint,
not a lower opacity: the cloud image now lives inside a wrapper sized to `38%` width at tablet width
(2-column grid, where the headline occupies a full 50% column) and `58%` at desktop width (3-column
grid, where the headline is only ~35%) — confirmed by measuring actual rendered rectangles at every
required breakpoint (768/1024/1280/1440/1536) that the cloud's left edge never crosses the
headline's right edge, with 60–130px of margin at every one. The first attempt at this fix (a single
58% width for all breakpoints ≥768px) still overlapped at exactly 1024px — caught by measuring
rather than assuming, and corrected.

**A second real bug found while integrating the illustrations into the guest-try cards**: since
`TuViIllustration`/`TarotIllustration`/`NumerologyIllustration` now render in *two* places at once
for a guest (once in Discovery, once in the guest-try card) with hardcoded gradient ids (`tv-glow`,
`tr-glow`, etc.), two simultaneous instances would emit duplicate DOM ids — invalid, and fragile if
one instance unmounts while the other's `url(#...)` reference still points at it. Fixed with
`useId()` so every instance gets a unique gradient namespace; verified via
`document.querySelectorAll('[id]')` that duplicate-id count is 0 across the full page.

**Material work on the Orbit**: replaced the bezel's repeating gradient sweep with a single-
direction cast-metal gradient (bright upper-left, dark lower-right, `bezelMetal`), added a masked
`feTurbulence` wear texture confined to the bezel ring's own stroke only (not applied per-element),
added a distinct "primary ring" (r=163, thicker, brighter gold) so the eye has one clear anchor
instead of many equally-weighted lines, gave the jade nodes a dark edge ring + a small highlight dot,
and pushed the Heavenly Stems ring one visual plane back (lower opacity, muted color) relative to the
Earthly Branch labels in front of it.

**Discovery/guest-try embedding**: added a card-wide inner-shadow vignette and a bottom mask-fade on
the illustration container so artwork blends into the card rather than sitting on it with a hard
edge; the three guest-try illustrations moved from small corner glyphs to larger (176–224px),
radially-masked background elements behind the copy, matching the "card fan ~30–35% of visual field"
request without changing the 3-column layout or any control's position.

**Page atmosphere**: extended the existing `PageAtmosphere` layer (still Home-scoped, still
`-z-10`, still zero new containers) with four broad percentage-positioned tonal washes approximating
the requested Hero→Discovery→Personal→Editorial→Trust→CTA journey — deliberately soft/diffuse rather
than pinned to exact section pixel boundaries, since those boundaries shift with content/auth state.

**Not changed**, per explicit instruction: Hero grid, Discovery 4-card row, Personal 3-card row,
Editorial layout, Trust layout, CTA layout — confirmed via the same before/after height measurements
used in every prior revision (Discovery cards still exactly 308px, unchanged).

## Revision 8 (Board 01 V5 — visual rebuild)

The founder's critique of V4.1 was fair: those changes were real but individually small (a gradient
direction, a mask, an id fix). This pass targeted **measurable, structural** differences instead —
listed here as explicit before → after values, not implementation descriptions, per the founder's
own instruction not to call micro-adjustments a redesign.

**1. Base palette — the single highest-leverage change.** Every card/section background actually
changed color (not just gained an overlay):

| Surface | Before (hex) | After (hex) | Δ per channel |
|---|---|---|---|
| Hero/CTA base | `#070b12` | Hero `#0c1420`, CTA `#132030` (CTA now visibly lighter than Hero, as requested — "calmer and brighter") | +5 to +25 |
| Discovery/feature cards | `#101827`→`#0b1220` | `#1c2c46`→`#101d30` | R +12–16, G +19–15, B +19–8 |
| Guest-try cards, Premium rail, Trust background | `#101827` | `#1c2c46` | +12/+19/+19 |
| Hero context card | `#0b1220` opaque-ish (75%) | `#241d14` warm bronze-charcoal (40–45%, more translucent, so the Hero scene behind it actually shows through) | full hue shift, cool→warm |
| StripItem/Trust containers | `#0b1220` | `#16233a` | +11/+13/+16 |

Confirmed via `getComputedStyle` after render: Discovery card background now computes to
`linear-gradient(rgb(28,44,70), rgb(16,29,48))`, Hero to `rgb(12,20,32)`, CTA to `rgb(19,32,48)` —
these are real, different colors, not the same near-black with a new gradient drawn on top.

**2. Page background — actual scenery, not four radial gradients.** `PageAtmosphere` gained a
second SVG layer (a 1000×2600 virtual canvas stretched to the page's real height) containing two
filled ink-wash mountain ridges, two large barely-visible celestial rings (r=340–480, anchored near
the Discovery and Trust/CTA regions), a soft cloud-bank shape, and a returning horizon line near the
CTA — plus the existing chapter-tint washes had their opacity roughly tripled (e.g. 0.05→0.16) and a
5-stop vertical gradient (`#0c1420`→`#101c2e`→`#0f1c2c`→`#0d1826`→`#0c1420`) was added as the actual
base fill behind every gap between cards, replacing flat near-black.

**3. Destiny Orbit — a physical chassis, not a diagram.** The outer ring's stroke width went from
**2.4px to 20px** — an 8× increase — with a bright bevel line on its inner edge, a dark bevel on its
outer edge, and 16 rivets around the band. The canvas grew from 440×440 to 480×480 to fit it without
clipping. Graduated ticks were reduced from 120 to 60 (each now individually legible instead of
blurring into a band, per the founder's "reduce meaningless micro-lines" note).

**4. The four Discovery illustrations were redrawn as scenes, not diagrams.** Concretely: Tử Vi
gained a filled two-tone mountain silhouette background, a parchment-colored manuscript with a red
tassel and a bronze compass overlapping its corner (previously: a bare circle-and-grid on transparent
background). Tarot gained a low reading table, an incense-smoke wisp, a moon disc, and a hanging
tassel around the card fan (previously: three cards floating alone). Bản đồ sao gained a mountain-
observatory silhouette and its rings went from 0.9–1.4px strokes to 2–4px bands. Thần số học gained a
tilted calculation-tablet background and compass-square construction lines behind the number ring.
The visual container itself grew from 128–144px to 160–176px (57% of the 308px card, within the
requested 55–65% band, up from ~52%).

**5. Hero**: the cloud-headline collision was re-verified fixed (still 0 overlap, measured at all 8
breakpoints); the gold haze behind the Orbit was replaced with a distinctly brighter, larger
"celestial opening" (ivory-core radial gradient, 3 color stops instead of 1, noticeably lighter
center); the context card's color and opacity both changed as described in item 1.

**Honestly flagged as still incomplete against the full 39-point brief**: the four illustrations,
while now scenes rather than diagrams, are still SVG line/shape art, not editorial-illustration-
grade rendering — a genuinely painted look (as in the founder-supplied `feature-*.webp` art from
revision 5, since rejected for being purple) is not achievable by hand-coding SVG paths at this
fidelity. Per-breakpoint "detail modes" (simplifying ornament on mobile) were still not built. I
could not visually confirm any of this myself — `computer.screenshot` failed identically to every
prior round — so "immediately obvious at first glance" is asserted here from code-level evidence
(measured color deltas, stroke-width deltas, container-size deltas) rather than a look at the
rendered page.

## Revision 9 (Board 01 V6 — illustration composition pass, driven by an actual screenshot review)

This round is different from every prior one: the founder had actually looked at the rendered V5
page and named three concrete, structural causes of the "SaaS template" look, not aesthetic taste.
Each was traced to a specific root cause and fixed there, not painted over:

**1. "All four cards look like the same template" → traced to `CardTexture`.** A single shared
component (`CardTexture`) drew an identical dotted-grid + corner-glow pattern on all four Discovery
cards and all three guest-try cards — literally one visual template stamped seven times. **Removed
entirely** (component and all 7 call sites deleted), rather than tuned down.

**2. "Background reads as solid black" → traced to opaque cards sitting on top of it.**
`PageAtmosphere`'s scenery was real but only visible in the ~56px gaps *between* cards — everywhere
a card actually sat, its solid `bg-[#1c2c46]` fill blocked it completely, which on a normal monitor
is nearly the entire page. Fixed at the cause: **every card surface changed from an opaque fill to a
real translucent gradient** (alpha 0.6–0.92, confirmed via `getComputedStyle` — e.g. Discovery cards
now compute to `rgba(58,42,21,0.62)…rgba(16,13,9,0.8)`, not a solid color), so the page's own
scenery shows through every surface, not just the gaps. The scenery itself was also independently
strengthened: mountain silhouettes changed from flat dark fills (invisible against an already-dark
page) to rim-lit gradients (bright bronze/jade edge fading to dark body, so they read by contrast
regardless of what's behind them), celestial ring opacity roughly tripled (0.07→0.22+), and a cloud
bank and manuscript-fragment arcs were added.

**3. "Four identical navy cards" → each Discovery card now has a genuinely different color family**,
not a shared navy with a small corner accent: Tử Vi = warm bronze-brown, Tarot = cool ink-indigo,
Bản đồ sao = steel-blue, Thần số học = jade-green — all translucent gradients, confirmed as 4
distinct `getComputedStyle` values.

**4. "Guest-preview art looks like watermark icons" → traced to the mask + opacity combination.**
The prior treatment used a 40–45%-opacity radial mask fading in all directions, which is definitionally
a watermark. Replaced with linear masks that keep ~55–90% of the illustration at full opacity (fading
only over the text corner), opacity raised to 75–90%, and size roughly doubled (from ~176×224px to
210–260px) — Tarot's fan now genuinely emerges from the right edge, the Numerology mandala and Tử Vi
instrument now sit large and mostly-opaque behind their cards, fading only where the heading sits.

**5. Illustrations redrawn as asymmetric, wider scenes.** All four viewBoxes changed from square
200×200 to a wide 260×190, with the main subject moved off-center (manuscript left/compass
upper-right for Tử Vi; sphere shifted right for Natal; tablet left for Numerology; fan shifted right
for Tarot) instead of one object centered on a circular glow. Added real material gradients: a
`paper` gradient (warm highlight → shadowed edge) for the manuscript/tablet surfaces, a 3-stop
`bronze` gradient (light/mid/dark, not a flat repeating sweep) for compass/ring fills, a `jade`
gradient with reduced fill-opacity so it reads as translucent rather than solid green, and a
`shadow` radial gradient dropped beneath every standing object (compass, cards, sphere, tablet) for
a contact shadow. The illustration container itself grew to 62% of the card (up from 57%) and now
bleeds to the card's literal edge via negative margins, rather than sitting inset within padding.

**Verified this round**: all 4 Discovery cards' computed `backgroundImage` values are genuinely
distinct (not 1 shared value); computed alpha values on cards are all <1 (real transparency, not
just visually-similar-but-opaque colors); Discovery card heights unchanged (308px — layout
untouched); zero duplicate ids; zero horizontal overflow at all 8 required widths; 15/15 tests
passing; typecheck and lint clean.

**Stated limitation, not hidden**: I still cannot see the rendered page myself —
`computer.screenshot` failed identically again this round. Every claim above is verified via
`getComputedStyle`/`getBoundingClientRect` (real alpha values, real distinct colors, real pixel
positions), which is strong evidence the *mechanism* of each named problem was fixed, but it is not
the same as a human confirming the result looks like an illustration rather than an icon. The
founder's own visual judgment on the actual rendered page remains the real acceptance test, per
their explicit instruction that passing checks is not visual acceptance. If, on inspection, the
compositions still read as vector diagrams rather than illustrations, that would point to an
inherent ceiling of hand-coded SVG paths versus commissioned illustration — a real limitation this
pass cannot fully close by iterating further in the same medium.

## Rejected / out-of-scope visuals

- **Fabricated score widgets** (career/love/finance/health numbers, "78/100" dials) shown in the
  reference board's other panels: not implemented anywhere, no backing API exists, explicitly
  prohibited by the brief. Not added.
- **`MvDestinyOrbit` / `MvHero` code** from the archived `apps/web/features/menh-vi/**` prototype:
  visually similar technique, but its energy-score is fabricated mock data and its accent color is
  violet (would make the global Home purple, which the brief explicitly forbids — Tarot purple is
  local-only). Only the raster art was reused; the component code was not.
- **Notifications entry point on Home**: Sprint 11 already established one notification entry point
  (the bell in `AppHeader`) to avoid competing entry points — a second one on Home was deliberately
  not added.

## Visual gap table (revision 2, founder correction pass)

Screenshots could not be captured this session (see "Verification performed" below), so "After" is
computed DOM/layout data, not a pixel read. Treat MATCH/PARTIAL as provisional until a human looks
at `http://localhost:3000`.

| Element | Reference | Before (rev 1) | After (rev 2) | Remaining gap | Verdict |
|---|---|---|---|---|---|
| Discovery card height | ~260–310px, 4-across | Tử Vi card ~807px tall, 3 others stacked | 4 cards, each exactly 272px, single row at desktop | none measured; final pixel density (icon/text balance) unverified | PARTIAL (pending pixel check) |
| Discovery card identity | Distinct SVG per system | Same 4 SVGs, cramped into unequal frames | Same 4 SVGs enlarged, Tarot now 3 overlapping cards, Tử Vi gained pagoda linework | icons are simple line art, not painterly — acceptable per "SVG for presentation" | MATCH |
| Guest "Bắt đầu từ đâu?" | ~3 near-equal columns, Tarot slightly larger | 1.3fr dominant + 2 stacked in remaining column (uneven heights) | `1.12fr/1fr/1fr` 3-column, each a self-contained card with its own glyph | Tarot card height still varies once a card is drawn (result box appends) — expected, capped by "up to 1.3×" | MATCH |
| Editorial total height | ~420–520px, magazine layout | Aspect-ratio driven, ~590px+ implied, sparse right column | Fixed `desktop:h-[460px]`, right column `grid-rows-3` fills full height | measured 528px — 8px over the stated ceiling | PARTIAL (negligible) |
| Hero headline footprint | ~35–40% of hero width | clamp up to 4.6rem, `max-w-xl` (576px) column | clamp reduced ~15% (max 3.9rem), `max-w-md` (448px), narrower grid share | rendered text measured ~28% of hero width (more reduced than the 35–40% target, but headline remains 3 lines / large / legible, never "small") | PARTIAL — reduced further than the target range, but directionally correct and still prominent |
| Destiny Orbit | Dominant, premium astronomical instrument | 460×460 desktop, 6 layers | 520×520 desktop, 7 layers (added secondary inner glyph ring), brighter gold strokes throughout | still SVG line art, not a painted illustration — inherent medium limit given "SVG only, no fabricated raster" | MATCH |
| Guest hero context panel | Small, doesn't compete with Orbit | Full paragraph card, ~280px column | 3-line glass panel + "Đăng nhập" link, 240px column, confirmed not overlapping the Orbit at any width incl. 390px | none found | MATCH |
| Trust section | 3 compact pillars with symbols | One padded text block, 3 paragraph columns | 3 pillars, each with a custom SVG glyph, single-line description, tight `py` | none found | MATCH |
| Final CTA | Cinematic closing chapter | Plain radial-gradient panel | Added sparse stars, mirrored cloud-lines, and an SVG mountain-ridge silhouette at the base | none found | MATCH |
| Section rhythm | 56–80px between chapters, 20–28px heading→content | 32px between all sections, 16px heading→content | 56px (64px desktop) between sections; 20px heading→content | within target | MATCH |

## Verification performed this pass

- `pnpm --filter @beaconvie/web typecheck` — clean.
- `pnpm --filter @beaconvie/web lint` — clean.
- `pnpm --filter @beaconvie/web test -- dashboard-view destiny-orbit home-route` — 15/15 passing
  (three assertions updated for intentional copy shortening, not behavior changes).
- Browser-driven DOM/computed-layout checks at 1536/1440/1280/1024/768/390/375px: **zero horizontal
  overflow at every width**. At 1440: hero 800px tall, Orbit 520×520px, all 4 Discovery cards exactly
  272px tall, Editorial section 528px, Trust 155px, Final CTA 338px. At 390px: Orbit 260×260px,
  guest context panel sits below it with no overlap, Discovery cards compact at 177px wide (2-up).
  Single `<h1>` confirmed at every width; all decorative SVGs remain `aria-hidden`.
- Pixel screenshots could not be captured in this session — `computer.screenshot` timed out with
  "the Browser pane is not displayed, so the page is not compositing frames," reproduced consistently
  across multiple attempts and viewport sizes. This is a session/environment limitation, not
  something fixable from inside the agent. DOM/computed-layout inspection substituted for the pixel
  gap-analysis the brief calls for — **a human pixel review at `http://localhost:3000` (dev server
  already running) is still required before this can be called founder-approved.**
- Board 02/03/04 regression: `git diff --stat` confirms only
  `apps/web/features/dashboard/components/{dashboard-view.tsx,dashboard-view.test.tsx,home-route.tsx,home/destiny-orbit.tsx}`
  plus this doc changed — no file under `apps/web/features/{tu-vi,tarot,natal-chart,numerology}` or
  the shared `AppShell`/`Sidebar`/`AppHeader` was touched. Guest navigation to `/discover/*` correctly
  redirects to `/login` (pre-existing, unauthenticated-route behavior, unaffected by this pass).
- Authenticated Home was **not** independently re-inspected this pass (no running API/DB session
  was available to log in) — its layout shares the same `DashboardView` component tree, so every
  structural fix (Discovery, Editorial, Trust, Final CTA, Orbit, rhythm) applies identically, but
  the auth-only hero context panel (`HeroContextPanel`'s non-guest branch) and `ForYouSection` strip
  were not re-styled this pass beyond the column-width change — they were not flagged as bloated in
  the correction brief, which focused on Discovery/Guest-try/Editorial/Trust/Final-CTA/hero.
