# Tarot 78-Card Art Bible

**Decision:** `TAROT_ART_DIRECTION_V1 = CELESTIAL_PURPLE_GOLD_V1`

**Primary front reference:** XVII — The Star (`apps/web/public/assets/tarot/cards/major/major-17-the-star.webp`, copied from the founder-approved original at `apps/web/public/assets/menh-vi/tarot/tarot-the-star.webp`)
**Primary back reference:** the shared card back (`apps/web/public/assets/tarot/card-back.webp`, copied from `apps/web/public/assets/menh-vi/tarot/tarot-card-back.webp`)

This document is the single source of truth for producing the remaining 77 front artworks so they
read as one coherent deck, not 77 independent illustrations. Every measurement below was taken by
directly inspecting the two approved reference files — nothing here is described from memory or
generic Tarot convention.

---

## Provenance note

Both reference files were originally produced during the archived `/menh-vi` design exploration
(introduced together in commit `deb7fa4`, "update homepage") and are currently referenced only by
that archived, 404-returning module (`apps/web/features/menh-vi/components/mv-tarot-flow.tsx`,
`mv-tarot-teaser.tsx`). This pass **copied** (did not move) both files to a new canonical location
under `apps/web/public/assets/tarot/` for the live Tử Vi Tarot product — the archived module's own
copies are untouched and still work exactly as before. The founder has now explicitly approved
these same two images as the V1 visual direction for the live, current product, resolving what
would otherwise have been an ambiguous "does this archived-module asset count as live-product art"
question.

---

## A. Palette (measured from both references)

| Role | Description | Where it appears |
|---|---|---|
| Base/ground | Deep midnight navy-purple, near-black at the darkest points | Card background, frame recess |
| Primary purple | Cosmic violet/amethyst, mid-tone | Sky, nebula clouds, background wash |
| Secondary purple | Lighter lavender/orchid | Highlights within clouds, fabric sheen |
| Metallic gold | Warm, slightly antique gold (not bright/lemon yellow) | Every frame line, ornament, star, plaque, jewelry |
| Accent gem | Small amethyst/deep-purple gem tone | Corner ornament insets, small accent jewels only — never a dominant color |
| Starlight white-gold | Soft warm-white with a gold cast | Central star glow, brightest highlights only |

**Rule:** gold is the *only* metal. No silver, no bronze, no copper. Purple is the *only* base hue
family (no teal, no red, no green as a base wash) — suit-specific accent colors (§N) are used
sparingly, layered on top of this base, never replacing it.

## B. Frame

- Rounded-rectangle outer border, corner radius approximately 3% of the card's short dimension.
- **Double-line gold border**: an outer gold line near the card edge, a thin dark gap, then an
  inner gold line — both references use this exact two-line system, not a single thick border.
- Ornamental corner motifs sit just inside the border's corners — on The Star, small circular gold
  medallions with a star/diamond center; on the card back, more elaborate scrollwork with a small
  crescent moon. **Major Arcana and court cards may use either corner-motif style; numbered Minor
  Arcana should use the simpler medallion style** to keep 56 cards from becoming visually noisy.
- Border interior is not flat — a subtle inward vignette (darker near the frame, lighter toward
  center) gives the frame physical depth.

## C. Typography

- **Baked into the artwork itself** on both references (not a separate overlay layer) — The Star
  shows "XVII" in a small gold-outlined oval plaque at top-center, and "THE STAR" in a wider
  gold-outlined rectangular plaque at bottom-center, flanked by small diamond accent marks.
- Typeface character: serif, restrained small-caps or title-case, moderate letter-spacing — reads
  as engraved/embossed gold lettering, not a flat digital font pasted on top.
- **Production strategy for the remaining 77 (see §R "Typography production strategy" below):**
  generate art *without* final text, then overlay the canonical numeral/title deterministically in
  code — safer than relying on an image model to render correct text 77 times in a row, and
  guarantees every card's title is pixel-correct regardless of generation quality. The Star itself
  is the one approved exception (text already baked in, already approved, never regenerated).

## D. Layout

- **Major Arcana:** Roman numeral plaque top-center, main illustration fills the middle ~70% of
  the frame, title plaque bottom-center.
- **Minor Arcana (to be generated):** same frame system; top plaque carries the suit symbol/rank
  pip cluster (traditional Tarot convention — e.g. three cup glyphs for Three of Cups) instead of a
  Roman numeral, since Minor Arcana traditionally aren't numbered with Roman numerals; bottom
  plaque carries the English title exactly as `TarotCard.name` already stores it (e.g. "Three of
  Cups").
- **Court cards:** same bottom-title convention; top plaque may be omitted or replaced with a
  simple suit-symbol motif, since court cards traditionally don't carry a numeral.

## E. Safe zones

- Outer 4% of the card (measured from the edge inward) must stay clear of critical illustration
  detail — this is the border/vignette zone.
- Top 12% and bottom 12% are reserved for the numeral/suit-symbol plaque and title plaque
  respectively — the main illustration must not visually collide with either plaque.
- Central 60% vertical band is the primary illustration zone.

## F. Celestial motifs (shared deck-wide vocabulary)

Stars (radiant, 6–8 point), thin gold constellation lines connecting star points, crescent/phase
moons, soft nebula-cloud washes, circular halo/compass rings, classical pillars (used selectively,
not on every card — The Star uses them, most Minor Arcana should not). These motifs are the "glue"
that makes 78 independently-produced images read as one deck — **every card should include at
least one of: stars, constellation lines, or a moon**, even cards whose core symbolism (e.g. Ten of
Pentacles' material legacy) doesn't obviously call for celestial imagery — treat it as ambient
environment/lighting, not literal subject matter.

## G. Character rendering style

Semi-realistic painterly illustration — not anime, not flat vector, not photorealistic photography.
Soft, blended rendering with visible painterly brushwork in skin/fabric, sharp crisp gold linework
for the frame and jewelry. Figures wear flowing, semi-sheer fabric with subtle star/celestial
patterning, gold jewelry (hairpins, necklaces, cuffs) with the same metallic-gold treatment as the
frame — the jewelry visually "belongs" to the same world as the border ornamentation.

## H. Environment

Night-sky settings by default: purple sky, distant silhouetted mountains, atmospheric depth via
layered cloud washes (lighter near the light source, darker at the card edges). Foreground elements
(plants, rocks, water) rendered in the same purple-gold palette, never a naturalistic green/brown
that would break the cosmic mood.

## I. Lighting

One dominant light source per card (on The Star: the central radiant star), casting warm
gold/white-gold highlights on the nearest surfaces (skin, water, fabric) while the ambient
environment stays cool purple. High contrast between the warm focal light and the cool ambient
purple is the signature lighting relationship of this deck — do not flatten it into even, shadowless
lighting.

## J. Suit differentiation (secondary to the shared palette — §14 of the production brief)

Suit accent colors are layered *on top of* the base purple-gold system as secondary lighting/accent
choices — never a full palette replacement. A Cups card should still read as unmistakably part of
the same deck as a Wands card from three meters away; only up close should the suit accent become
apparent.

| Suit | Element | Accent (secondary, not primary) | Where the accent appears |
|---|---|---|---|
| Wands | Fire | Warm amber / subtle crimson | Secondary light glow, small flame/ember details |
| Cups | Water | Blue / aqua / moonlight | Water reflections, secondary highlight tint |
| Swords | Air | Cool indigo / silver-blue | Air/wind linework, blade/edge highlights — frame metal stays gold, never silver |
| Pentacles | Earth | Emerald / earth tones | Foliage, coin/disc material accents |

## K. Major Arcana rules

Each Major Arcana card is a distinct scene with its own required central subject (see
`docs/design/tarot-78-card-prompts.md` for all 22 individually specified) — not a generic
"beautiful figure in purple" template repeated 22 times. The Star is the executed example of this
principle: it doesn't just look pretty, it specifically depicts the two-vessel water-pouring
gesture, the radiant star-and-constellation sky, and the twin pillars that are XVII The Star's own
traditional iconography.

## L. Minor Arcana rules

Pip cards (Ace–10) should visually reference their traditional count where practical (e.g. Three of
Cups genuinely shows three cups / three figures in celebration, not an unrelated scene with "3" as
a numeral) — the same "communicate meaning before the user reads the explanation" discipline the
production brief requires (§15). Full per-card symbolism: `docs/design/tarot-78-card-prompts.md`.

## M. Court-card rules

- **Page:** youthful figure, exploratory posture, holding/examining the suit's emblem with
  curiosity — early mastery, not full command.
- **Knight:** figure in motion (riding, striding, mid-action) toward the suit's domain — pursuit
  and action.
- **Queen:** seated or standing in quiet authority, receptive/internal mastery of the suit's
  domain — composed, not passive.
- **Court cards across the four suits must not reuse the same face, pose, or throne** — see the
  duplicate-composition audit requirement (§33 of the production brief); each of the 16 court cards
  needs its own distinct figure and composition, varied by suit accent and role.

## N. Negative rules (apply to every one of the 77 remaining cards)

Do not produce: cartoon, anime, chibi, Pixar-style, flat vector, cheap mobile-game aesthetic,
generic medieval fantasy (unrelated to Tarot symbolism), horror/gore, random unrelated occult
symbols, photorealistic modern photography, watermarks, artist signatures, random/garbled text,
malformed anatomy (extra/missing fingers, duplicated limbs), inappropriate sexualization, random
logos. "Beautiful but symbolically incorrect" is an explicit fail condition, not a partial pass.

## O. QA rules

Every generated artwork must pass, before being accepted into the deck: correct card identity,
correct symbolism (matches the card's own required symbols in
`docs/design/tarot-78-card-prompts.md`), correct suit accent (§J), correct frame/border/typography
system (§B–C), correct dimensions/aspect ratio (§P), no watermark/signature/random text, no
malformed anatomy, no inappropriate content. See `docs/design/tarot-78-card-prompts.md`'s per-card
QA checklists for the full, itemized version of this list applied to each specific card.

## P. Canonical dimensions

- `TAROT_ART_MASTER_RATIO = 0.6` (width:height = 768:1280 = 3:5), measured directly from both
  reference files (`ls -la` + `file` confirm 768×1280 WebP for each).
- **Master production dimensions:** 768×1280px (match the reference exactly — do not introduce a
  second master size).
- **Web dimensions:** served as-is at 768×1280; the frontend's largest rendered card size (`lg` =
  160×256px in `tarot-card-face.tsx`) downsamples cleanly from this master with headroom for
  higher-density displays.
- **Format:** `.webp`, matching both references and this repo's existing asset convention.

## Q. Filename / folder convention (kept, not changed)

This pass deliberately **keeps** the already-shipped `imageSlug`-based convention
(`major-17-the-star`, `wands-01-ace-of-wands`, …) rather than adopting a shorter alternative —
`imageSlug` is already a real, seeded database column consumed by the artwork resolver and the
Tarot engineering pass's own contract docs; renaming it now would mean touching the canonical
78-card data file the "do not rebuild" boundary explicitly protects. The engineering pass's own contract (`docs/design/tarot-78-artwork-contract.md`) and the resolver
(`apps/web/features/tarot/artwork.ts`) already use this exact convention — no code, data, or
migration change was needed to make The Star "just work" once copied into place, which is itself
evidence the existing convention was already sound.

## R. Typography production strategy

Confirmed by direct inspection: The Star's numeral/title are baked into the approved reference
image. For the 77 still to be produced, this Art Bible recommends **generating without final text
and overlaying the canonical numeral/suit-symbol and title deterministically** (per §C above) —
this environment has no proven, tested image-generation workflow yet (see the production audit's
capability finding), so there is no "existing workflow already reliably preserves typography" to
rely on, and the production brief's own default (generate-without-text + deterministic overlay)
applies. This is a recommendation for whoever runs the actual generation batches, not something
this pass builds — no overlay-rendering code was added, since no generated art exists yet to
overlay onto.

## S. Deck-back note

The card back is one shared asset (already `READY`) and is **not** re-derived per suit or per card.
Its own motifs (moon-phase chain, central compass/star, symmetric scrollwork) inform the *frame
language* of the front cards (§B) but the back itself never changes.
