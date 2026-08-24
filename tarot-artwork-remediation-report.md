# TAROT ARTWORK REMEDIATION

Date: 2026-08-23
Scope: resolve the P1–P3 artwork warnings from `tarot-production-integration-report.md` without disturbing any card that already passed QA. No commits made.

## Phase 1 — Remediation table (all 19 P1 cards)

FIX METHOD key: **A** = replace with better existing source · **B** = deterministic crop/resize only · **C** = deterministic image/text correction possible · **D** = requires artwork regeneration · **E** = acceptable / no fix recommended

| Card | File | Current visible defect | Expected | Severity | Fix method | Source available? | Action |
|---|---|---|---|---|---|---|---|
| Ace of Swords | swords-ace | Top medallion reads XVII (collides with The Star) | No numeral | P1 | D | No — both alternates (XXIX, XXIX) also wrong | Report for regeneration |
| King of Cups | cups-king | Top medallion reads XVII (collides with The Star) | No numeral (court) | P1 | D | No — alternate has XIV, also wrong | Report for regeneration |
| Knight of Cups | cups-knight | Top medallion reads XIII (collides with Death) | No numeral (court) | P1 | D | No — 2 alternates have XII and XIII, also wrong | Report for regeneration |
| Six of Cups | cups-06 | Top medallion reads XII (collides with The Hanged Man) | No numeral, or VI | P1 | D | No — alternate has XX, also wrong | Report for regeneration |
| Nine of Wands | wands-09 | Top medallion reads XVI (collides with The Tower) | No numeral, or IX | P1 | D | No alternates | Report for regeneration |
| King of Wands | wands-king | Top medallion reads XIV (collides with Temperance) | No numeral (court) | P1 | D | No alternates | Report for regeneration |
| Knight of Wands | wands-knight | Top medallion reads I (duplicates own suit's Ace) | No numeral (court) | P1 | D | No alternates | Report for regeneration |
| Page of Cups | cups-page | Top medallion reads XXVI (exceeds valid range) | No numeral (court) | P1 | D | No — alternate has XI, also wrong | Report for regeneration |
| Page of Pentacles | pentacles-page | Top medallion reads XXXIX (exceeds valid range) | No numeral (court) | P1 | D | No alternates | Report for regeneration |
| Two of Swords | swords-02 | Top medallion reads XXX (exceeds valid range) | No numeral, or II | P1 | D | No alternates | Report for regeneration |
| Three of Swords | swords-03 | Top medallion reads XXXI (exceeds valid range) | No numeral, or III | P1 | D | No alternates | Report for regeneration |
| Four of Swords | swords-04 | Top medallion reads XXXII (exceeds valid range) | No numeral, or IV | P1 | D | No alternates | Report for regeneration |
| Eight of Swords | swords-08 | Top medallion reads XXXVI (exceeds valid range) | No numeral, or VIII | P1 | D | No alternates | Report for regeneration |
| Nine of Swords | swords-09 | Top medallion reads XXXVII (exceeds valid range) | No numeral, or IX | P1 | D | No alternates | Report for regeneration |
| Ten of Swords | swords-10 | Top medallion reads XXXVIII (exceeds valid range) | No numeral, or X | P1 | D | No alternates | Report for regeneration |
| King of Swords | swords-king | Top medallion reads XXVIII (exceeds range); title "KING OF Swords" mixed case | No numeral; consistent title case | P1 | D | No alternates | Report for regeneration |
| Page of Swords | swords-page | Top medallion reads XXV (exceeds range); title "PAGE OF Swords" mixed case | No numeral; consistent title case | P1 | D | No alternates | Report for regeneration |
| Queen of Swords | swords-queen | Top medallion reads XXVII (exceeds range); title "QUEEN OF Swords" mixed case | No numeral; consistent title case | P1 | D | No alternates | Report for regeneration |
| Nine of Pentacles | pentacles-09 | Garbled/illegible "X IX X" text; **also lacks the deck's standard gold border/frame entirely** (only production card without one) | No numeral, or clean IX; standard ornate frame matching the other 77 cards | P1 | D | No — only other candidate was already rejected as a defective blank-canvas render | Report for regeneration — **highest priority** (frame/border inconsistency, not just a numeral) |

## Phase 2 — Individual re-inspection of all 19 P1 cards

Each of the 19 was re-inspected individually at full resolution (via a purpose-built high-resolution 4-across grid, cross-checked against the live production file for the two most severe cases). None of the prior text descriptions were trusted blindly — every title, suit, rank, and central symbolism was re-verified against the actual pixels.

**Findings, all 19 confirmed as genuinely defective (not false positives):**
- Card identity (title, suit, rank, central symbolism) is **correct on all 19** — the defect is confined to the decorative numeral and, on 3 Swords court cards, title-text casing.
- On 18 of the 19, the incorrect Roman numeral sits inside the **same small circular medallion at the top-center of the card's ornate gold frame** used — correctly — on all Major Arcana and most other Minor Arcana cards. It is not a separate, isolated overlay; it's baked into the frame artwork itself, with the card's own generated star-field/nebula background visible through and around the glyphs.
- `pentacles-09` (Nine of Pentacles) is a distinct case: it has **no gold frame at all** — no border, no corner medallions, no title-banner cartouche — unlike all other 77 production cards. Its garbled "X IX X" text floats directly on the open sky background rather than inside a medallion. This is the most visible outlier in the whole deck.
- No new numbering confusion was found: nothing here is a case of a Minor Arcana card correctly showing its own pip rank (which would be fine/expected) — every one of these 19 numerals is either a real, different Major Arcana number (misleading) or a number with no valid Tarot meaning at all (0–21 is the full valid range; several of these run into the 20s–30s).
- No additional AI generation artifacts (extra fingers, broken anatomy, nonsensical objects) were found beyond what was already reported.

## Phase 3 — Backup search for cleaner candidates

For every one of the 19 defective cards, every candidate source in the untouched backup (`apps/web/public/assets/tarot-card-backup-20260823-151354/`) was re-inspected — not just by filename, but by the actual recorded visual identification from the original 115-file inventory (every one of the 115 source files was individually visually identified in that pass; none were left unreviewed).

- 5 of the 19 cards have a recorded alternate render in the backup (`swords-ace`, `cups-king`, `cups-knight` ×2, `cups-06`, `cups-page`). **Every alternate was re-checked and every one carries its own equally-wrong numeral** (e.g. `swords-ace`'s two alternates read XXIX and XXIX; `cups-knight`'s two alternates read XII and XIII). None is an improvement.
- The other 14 cards have **zero alternates** — only one render of that specific card was ever generated in the source pool.
- `pentacles-09`'s only other candidate (`Gemini_Generated_Image_7j0wig7j0wig7j0w (1).png`) was already excluded in the original audit as a defective, mostly-blank-canvas render — re-confirmed, still not usable.

**Result: no clean existing replacement exists for any of the 19 P1 cards.** Group A (existing-source replacement) is empty.

## Phase 4 — SHA-256 baseline

Recorded before any remediation activity: [tarot-artwork-pre-remediation-sha256.json](tarot-artwork-pre-remediation-sha256.json) — SHA-256 for all 78 production WebP files.

## Phase 5 — P1 remediation groups

**GROUP A (clean replacement exists in backup): 0 cards.**

**GROUP B (fixable deterministically without changing illustration identity): 0 cards.**
Deterministic crop/removal was evaluated and rejected for all 19: the numeral medallion is structurally part of each card's frame (same position/style as the correctly-numbered cards), so cropping it out would either cut off the top of the card entirely (breaking the frame) or require repainting the medallion's local background (stars/nebula/gradient unique to each card) — which is inpainting, not a deterministic operation, and would look visibly patched. This fails Phase 7's explicit bar ("if the correction looks patched, classify it as GROUP C instead").

**GROUP C (requires regeneration): 19 cards — all of them.**
See the exact list and reasons in the Critical Stop Condition section below.

**STOPPING HERE per instructions — no regeneration performed.**

## Phase 6 / 7 — Not applicable

No GROUP A or GROUP B cards exist, so no existing-source replacements or deterministic corrections were made. **Zero production files were touched.**

## Phase 8 — P2 / P3 review

Applied the three-question test (would an ordinary user notice? does it communicate incorrect card identity? does it materially lower perceived quality?) to every P2/P3 item:

| Item | Cards | Notice? | Wrong identity? | Lowers quality? | Decision |
|---|---|---|---|---|---|
| Letter marker ("A"/"K"/"Q") instead of Roman numeral | pentacles-ace, pentacles-king, pentacles-knight, pentacles-queen, swords-knight | Maybe, mildly | No — standard, recognizable abbreviation | No | **Leave alone** |
| Mixed-case title ("KING OF Swords" etc.) | swords-king, swords-queen, swords-page | Only on close reading | No — still clearly reads correctly | Negligible | **Leave alone** (also technically undeliverable without repainting the title banner, same constraint as the P1 numerals) |
| Display rack shows 9 pentacles, not 8 | pentacles-08 | Unlikely (requires counting) | No | No | **Leave alone** |
| Cup count in arc ambiguous (~7 visible) | cups-09 | Unlikely | No | No | **Leave alone** |
| No numeral shown at all | cups-03, cups-ace, cups-queen, wands-02, wands-page, wands-queen | N/A — not a defect | No | No | **Not a defect** — this is the most Rider-Waite-authentic treatment in the deck |
| Sword-like decorative arch / background swords | pentacles-10, pentacles-page | Unlikely for a casual look | No — suit is unambiguous from title + coins | Minor | **Leave alone** |

**Result: every P2 and P3 item is intentionally accepted, unchanged.** None materially misrepresents a card, and fixing the cosmetic ones deterministically isn't possible for the same reason as the P1 numerals (baked into the rendered illustration). Per instructions, polishing was not pursued further.

## Phase 9 — Contact sheet

Not regenerated. No A/B fixes were made in this pass (all 78 production files are byte-identical to the pre-remediation baseline — see Phase 10), so the full 6-grid, 78-card contact sheet from the prior integration pass remains accurate and current. The 19 P1 cards were separately re-inspected in a dedicated high-resolution grid for Phase 2, above.

## Phase 10 — Integrity check

```
INTENTIONALLY CHANGED: (none)
UNCHANGED: 78/78
UNEXPECTEDLY CHANGED: 0
```

Verified by re-hashing all 78 production files and diffing against the Phase 4 baseline: 78/78 match exactly, 0 changed, 0 missing, 0 extra.

## Phase 11 — Regression

- **Typecheck:** PASS (0 errors)
- **Lint:** PASS (0 errors/warnings)
- **Tarot-specific tests:** PASS — 5 suites, 31 tests (`artwork.test.ts`, `tarot-card-face.test.tsx`, `tarot-draw-panel.test.tsx`, `tarot-reading-view.test.tsx`, `tarot-dashboard.test.tsx`)
- **Full web unit suite:** PASS — 103 suites, 542 tests, 0 failures
- **Build:** PASS — production build compiled successfully
- **Runtime:** PASS — ran the real dev server as an authenticated user and drew fresh, real cards:
  - Daily Draw and Three-Card Spread were already at today's free limit (drawn during the prior integration pass — Queen of Pentacles; Two of Swords / Page of Cups / Knight of Cups), still present and rendering correctly in history.
  - Drew a fresh **Single Card** reading live: landed on **King of Swords** — one of the 19 flagged P1 cards. Confirmed it still renders correctly end-to-end (`GET /assets/tarot-card/swords-king.webp → 200`, image `complete: true`), proving the app handles a flagged-but-not-broken card gracefully — it's visually imperfect (wrong numeral) but fully functional and correctly identified everywhere else in the UI (name, meaning, AI interpretation all correct).

## Final counts

Original P0: 1
P0 fixed: 1 *(fixed in the prior integration pass — `pentacles-ace`, confirmed still correct and unchanged in this pass)*

Original P1: 19
P1 fixed with existing source: 0
P1 fixed deterministically: 0
P1 remaining requiring regeneration: 19

Original P2: 8 *(distinct issues across 8 cards, some cards carrying 2 issues)*
P2 fixed: 0
P2 intentionally accepted: 8

P3: 2 flagged items (pentacles-08 count, cups-09 count) + 2 compositional notes (pentacles-10, pentacles-page sword motifs) + 6 "no numeral" non-defects
P3 intentionally accepted: all

Cards modified: 0
Cards byte-identical: 78/78
Unexpected modifications: 0

Tests: PASS (typecheck, lint, 542 unit tests, build)
Runtime: PASS (live draws confirmed, including a flagged P1 card rendering correctly)
Contact sheet: not regenerated (no changes to reflect); full 78-card grid from the prior pass remains valid

## FINAL ARTWORK STATUS

**PASS_WITH_REGEN_REQUIRED**

No card regressed. No clean card was touched. The one P0 defect from the prior pass remains fixed and verified. All 19 P1 numeral/frame defects and all P2/P3 cosmetic items were re-verified as genuine but **not fixable without artwork regeneration** — no deterministic crop/text correction can remove a numeral baked into a card's decorative frame medallion without looking visibly patched, and no clean existing alternate source exists for any of them. Per the critical stop condition, none were regenerated.

---

## CRITICAL STOP CONDITION — 19 cards require new image generation

The following cards cannot be fixed without generating new artwork. For each: current defect, why existing sources can't solve it, the correct expected symbolism, and a recommended priority.

**Priority 1 — frame/border inconsistency (most visible defect in the deck):**

1. **Nine of Pentacles** (`pentacles-09`)
   - Defect: no gold ornate border/frame at all (every other of the 77 production cards has one); garbled "X IX X" floating text instead of a clean numeral or none.
   - Why existing sources can't solve it: only one other render of this card exists in the backup, and it was already rejected as a mostly-blank defective canvas.
   - Expected symbolism: a comfortable, self-possessed figure in an elegant garden setting with a falcon/bird companion and nine glowing pentacle coins arranged around them, framed in the deck's standard gold ornate border with a title banner reading "NINE OF PENTACLES" — matching the deck's Rider-Waite-descended style used by all other Pentacles cards.
   - Recommended priority: **highest** — this is the one card where a user would notice something is wrong even without any Tarot knowledge at all.

**Priority 2 — numeral collides with a real, different Major Arcana card (most misleading to Tarot-literate users):**

2. **Ace of Swords** (`swords-ace`) — shows "XVII" (The Star's number). Expected: no numeral, or a card-consistent Ace marker.
3. **King of Cups** (`cups-king`) — shows "XVII" (The Star's number). Expected: no numeral (court cards are unnumbered).
4. **Knight of Cups** (`cups-knight`) — shows "XIII" (Death's number). Expected: no numeral.
5. **Six of Cups** (`cups-06`) — shows "XII" (The Hanged Man's number). Expected: no numeral, or "VI".
6. **Nine of Wands** (`wands-09`) — shows "XVI" (The Tower's number). Expected: no numeral, or "IX".
7. **King of Wands** (`wands-king`) — shows "XIV" (Temperance's number). Expected: no numeral.
8. **Knight of Wands** (`wands-knight`) — shows "I" (duplicates its own suit's Ace). Expected: no numeral.

For all 7 above: existing sources can't solve it because every recorded alternate (where one exists) carries an equally wrong numeral, and the remaining cards have no alternate at all.

**Priority 3 — numeral has no valid Tarot meaning at all (0–21 is the full range; these run well past it):**

9. **Page of Cups** (`cups-page`) — "XXVI". Expected: no numeral.
10. **Page of Pentacles** (`pentacles-page`) — "XXXIX". Expected: no numeral.
11. **Two of Swords** (`swords-02`) — "XXX". Expected: no numeral, or "II".
12. **Three of Swords** (`swords-03`) — "XXXI". Expected: no numeral, or "III".
13. **Four of Swords** (`swords-04`) — "XXXII". Expected: no numeral, or "IV".
14. **Eight of Swords** (`swords-08`) — "XXXVI". Expected: no numeral, or "VIII".
15. **Nine of Swords** (`swords-09`) — "XXXVII". Expected: no numeral, or "IX".
16. **Ten of Swords** (`swords-10`) — "XXXVIII". Expected: no numeral, or "X".
17. **King of Swords** (`swords-king`) — "XXVIII", plus mixed-case title "KING OF Swords". Expected: no numeral; consistent all-caps title.
18. **Page of Swords** (`swords-page`) — "XXV", plus mixed-case title "PAGE OF Swords". Expected: no numeral; consistent title.
19. **Queen of Swords** (`swords-queen`) — "XXVII", plus mixed-case title "QUEEN OF Swords". Expected: no numeral; consistent title.

For all of the above: no alternates exist in the backup for any of these 11 cards; the illustration itself (composition, suit symbolism, central figure/object count) is already correct in every case — only the numeral (and, for 3 Swords court cards, the title casing) needs correcting, which requires regenerating that card's artwork with the same style/composition and a corrected or omitted numeral.

No regeneration was performed. Waiting on your decision for how these 19 cards should be regenerated (e.g. same prompt/style re-run with corrected numeral instruction, targeted inpainting of just the medallion if a suitable tool is chosen outside this session, etc.).
