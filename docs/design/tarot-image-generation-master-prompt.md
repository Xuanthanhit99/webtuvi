# Tarot 78-Card Image Generation — Master Prompt

Immutable global style prefix, applied to every one of the 77 remaining card generations. Derived
directly from measured characteristics of the two approved references (`major-17-the-star.webp`,
`card-back.webp`) — see `docs/design/tarot-78-art-bible.md` for the full analysis this prompt
summarizes into generation-ready language.

**Do not modify this prefix per-card.** Only the card-specific block
(`docs/design/tarot-78-card-prompts.md`) changes between cards. This is what keeps 78
independently-produced images reading as one deck.

---

## GLOBAL_ART_STYLE (prepend to every card generation)

```
Premium celestial tarot card illustration, portrait orientation, 768x1280px, aspect ratio 3:5.

Palette: deep midnight navy-purple background transitioning to cosmic violet and amethyst in the
sky/atmosphere; warm antique metallic gold for all linework, frame, ornamentation, and jewelry
(never silver, bronze, or copper); small amethyst/deep-purple gem accents used sparingly; soft
warm-white-gold starlight for the brightest highlights only.

Frame: rounded-rectangle border with a double gold line (outer line near the edge, thin dark gap,
inner line), corner radius approximately 3% of the short dimension, ornamental gold corner motifs
(circular star medallion or scrollwork), subtle inward vignette giving the frame physical depth.

Celestial motifs present in the environment: radiant 6-8 point stars, thin gold constellation lines
connecting star points, crescent or phase moons, soft nebula-cloud atmosphere, night sky.

Lighting: one dominant warm gold/white-gold light source per scene, casting highlights on the
nearest surfaces, while the ambient environment stays cool purple — high contrast between the warm
focal light and cool ambient shadow, never flat or shadowless.

Rendering style: semi-realistic painterly illustration with soft blended brushwork in skin and
fabric, crisp sharp gold linework for frame and jewelry details. Figures (where present) wear
flowing semi-sheer fabric with subtle celestial patterning and gold jewelry matching the frame's
metal treatment.

Do NOT render any text, numerals, or title lettering in the image — text is added separately
afterward. Leave the top ~12% and bottom ~12% of the frame relatively clear of critical detail for
this purpose.
```

## GLOBAL_NEGATIVE_RULES (append to every card generation)

```
Do not include: cartoon style, anime style, chibi style, Pixar-style rendering, flat vector
illustration, cheap mobile-game aesthetic, generic medieval fantasy unrelated to tarot symbolism,
horror or gore, random unrelated occult symbols, photorealistic modern photography, watermarks,
artist signatures, any text or lettering, malformed anatomy (extra or missing fingers, duplicated
limbs, incorrect hand poses), inappropriate sexualization, random logos, silver or bronze metal
(gold only), any base color outside the purple/violet/navy family.
```

## OUTPUT_CONSTRAINTS

```
Output dimensions: exactly 768x1280px (3:5 portrait). Format: WebP. Single card, no collage, no
multiple variations in one image, no border/frame cropped or cut off at image edges.
```

## Composition formula (hard requirement — see the production brief's own §27)

Every card-specific prompt is assembled as:

```
GLOBAL_ART_STYLE
+
[card-specific composition block — see tarot-78-card-prompts.md]
+
GLOBAL_NEGATIVE_RULES
+
OUTPUT_CONSTRAINTS
```

Never substitute, shorten, or paraphrase the global blocks between cards — copy them verbatim each
time. Only the bracketed card-specific block changes.

## Text overlay (applied after generation, not part of the image-generation prompt)

Per the Art Bible's §C/§R typography strategy: once a card's artwork is generated (without text),
the canonical numeral/suit-symbol (top) and English title (bottom, exactly matching
`TarotCard.name`) are added as a deterministic code-level overlay — not re-prompted into the image
model. This step is not built by this pass (no generated art exists yet to overlay onto) but is
documented here so whoever runs generation knows the full pipeline: **generate → QA the image →
overlay text deterministically → final QA → place at the contract path.**
