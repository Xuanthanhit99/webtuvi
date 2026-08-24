# TAROT PRODUCTION INTEGRATION

Date: 2026-08-23
Scope: wire the validated 78-card canonical deck (`apps/web/public/assets/tarot-card`) into the live application, then run full production-level QA.

## Mapping

Application cards: 78 (from `apps/api/prisma/data/tarot-deck.ts` → `TAROT_DECK`, the single source of truth consumed by both the Prisma seed and the draw engine)
Canonical mappings: 78 / 78
Missing: 0
Duplicates: 0

The app identifies cards by a DB `slug` (e.g. `major-17-the-star`, `wands-01-ace-of-wands`) that does **not** textually match the canonical asset filenames (`17-the-star`, `wands-ace`). Rather than rename the Prisma seed data (no compelling architectural reason to touch the DB identity), the mapping is computed explicitly in `resolveCanonicalCardId()`:
- **Major**: `imageSlug.replace(/^major-/, '')` — verified by inspection to exactly reproduce all 22 canonical IDs.
- **Minor**: `${suit.toLowerCase()}-${RANK_TOKEN[number]}`, where `RANK_TOKEN` maps rank 1→`ace`, 2–10→`02`…`10`, 11→`page`, 12→`knight`, 13→`queen`, 14→`king`.

This was validated two ways: (1) a Jest test (`artwork.test.ts`) that reconstructs all 78 real card shapes and asserts every resolved file exists on disk with no ID collisions; (2) an independent Node script cross-referencing the actual `TAROT_DECK` export (dumped via `ts-node`) against the 78 files on disk — 78/78 pass, 0 duplicate canonical IDs, 0 orphaned canonical files.

## Assets

Major: 22/22
Wands: 14/14
Cups: 14/14
Swords: 14/14
Pentacles: 14/14
Total: 78/78

## Integration

**Resolver updated:** `apps/web/features/tarot/artwork.ts` — the single centralized `resolveTarotArtworkSrc()` now returns `/assets/tarot-card/<canonicalId>.webp` instead of the old `/assets/tarot/cards/{major|minor/<suit>}/<imageSlug>.webp` scheme. It has exactly one call site in the whole app (`tarot-reading-view.tsx`, used for both a fresh draw result and the saved-reading detail view), so no paths were scattered across components. No other file needed touching — confirmed by grepping the whole `apps/web` tree for `resolveTarotArtworkSrc`/`TAROT_CARD_BACK_SRC` usage (2 call sites total, both already using the shared resolver/constant).

**Legacy resolver remaining:** none — the old `/assets/tarot/cards/...` path format is no longer produced by any code path. The legacy directory itself (`apps/web/public/assets/tarot/cards/major/major-17-the-star.webp`) is left on disk untouched, per instructions — it's simply unreferenced now.

**Broken references:** 0 (verified via `artwork.test.ts`'s exhaustive existence check, and via live network requests during runtime QA — every image request returned 200).

**Card back:** untouched. `TAROT_CARD_BACK_SRC = '/assets/tarot/card-back.webp'` still points at the existing shared card-back asset (used only in the pre-draw spread-type selector UI, not per-card). It is not part of the 78-card manifest and was never at risk of being counted as card #79 — the manifest and the mapping/validation logic only ever iterate the 78 face cards.

**Manifest:** `apps/web/public/assets/tarot-card/manifest.json` — 78 entries, unchanged structurally from the prior pass. (Note: the app itself doesn't read this manifest — it derives paths from the DB card directly via the resolver above. The manifest remains a useful standalone asset inventory / contract record.)

## Visual QA

**Cards visually checked:** all 78, via a purpose-built 6-image contact-sheet grid (13 cards each) generated with the exact same `arcana`/`suit`/`number` → canonical-ID logic as `artwork.ts`, rendering each card's real thumbnail next to its app name, DB slug, and canonical filename. Additionally spot-verified full-resolution: `17-the-star.webp`, `pentacles-queen.webp` (crop review), `swords-08.webp`, and — after the fix below — `pentacles-ace.webp`.

**Wrong mappings found: 1 (found and fixed during this pass).**
- `pentacles-ace.webp` was showing **Ace of Swords** artwork (title "ACE OF SWORDS", numeral XVII/XXIX depending on source) instead of Ace of Pentacles. Root cause: in the prior QA pass, the source file `Gemini_Generated_Image_fb2saifb2saifb2s.png` was misidentified by a visual-QA agent as "Ace of Pentacles" when it is actually a third Ace-of-Swords render. Direct re-inspection of the backup source confirmed the error, and located the genuine Ace of Pentacles art at `Gemini_Generated_Image_39bjxt39bjxt39bj (2).png` (previously filed as a "duplicate alternate," itself mislabeled). **Fixed**: `pentacles-ace.webp` was re-converted from the correct source (no new artwork generated — reused existing backup content); `swords-ace`'s alternates list was corrected to record the found file as a 3rd Ace-of-Swords duplicate. Re-validated: typecheck, lint, and the artwork test suite (which asserts all 78 files exist) all pass; the corrected file was independently re-viewed and confirmed to show "ACE OF PENTACLES."
- No other wrong mappings found across the remaining 77 cards — every title bar visible in the contact-sheet grids matches its app-assigned name exactly.

**Broken images:** 0 (all 78 decode via sharp; all requested images during runtime QA returned HTTP 200 with `complete: true` and correct non-zero natural dimensions).

**Crop issues:** 1 by design — `pentacles-queen.webp`, see the dedicated section below. No unintended crops found elsewhere.

**Aspect-ratio issues:** 1 pre-existing dimension outlier already documented in the original audit (a *rejected* Knight of Cups alternate at 1536×2752, never used in production). All 78 **production** files use one of the deck's standard aspect ratios (~0.56–0.6); no production file is visually stretched or squashed.

## Artwork warnings

**P0 (wrong card identity / unusable):** 1 found — `pentacles-ace` (Ace of Swords art mapped to Ace of Pentacles). **Status: FIXED during this pass**, see above. 0 remaining after fix.

**P1 (highly visible incorrect Tarot information — a real, legible Roman numeral that is either a different valid Major Arcana number or clearly out of any valid range):**
| Card | Visible top marking | Expected marking | Note |
|---|---|---|---|
| swords-ace (Ace of Swords) | XVII | none (Ace) | Collides with Major Arcana "The Star" |
| cups-king (King of Cups) | XVII | none (court) | Collides with "The Star" |
| cups-knight (Knight of Cups) | XIII | none (court) | Collides with "Death" |
| cups-06 (Six of Cups) | XII | VI or none | Collides with "The Hanged Man" |
| wands-09 (Nine of Wands) | XVI | IX or none | Collides with "The Tower" |
| wands-king (King of Wands) | XIV | none (court) | Collides with "Temperance" |
| wands-knight (Knight of Wands) | I | none (court) | Duplicates its own suit's Ace |
| cups-page (Page of Cups) | XXVI | none (court) | Exceeds valid 0–XXI range |
| pentacles-page (Page of Pentacles) | XXXIX | none (court) | Exceeds valid range |
| swords-02 (Two of Swords) | XXX | II or none | Exceeds valid range |
| swords-03 (Three of Swords) | XXXI | III or none | Exceeds valid range |
| swords-04 (Four of Swords) | XXXII | IV or none | Exceeds valid range |
| swords-08 (Eight of Swords) | XXXVI | VIII or none | Exceeds valid range |
| swords-09 (Nine of Swords) | XXXVII | IX or none | Exceeds valid range |
| swords-10 (Ten of Swords) | XXXVIII | X or none | Exceeds valid range |
| swords-king (King of Swords) | XXVIII | none (court) | Exceeds valid range |
| swords-page (Page of Swords) | XXV | none (court) | Exceeds valid range |
| swords-queen (Queen of Swords) | XXVII | none (court) | Exceeds valid range |
| pentacles-09 (Nine of Pentacles) | "X IX X" (garbled) | IX or none | Illegible/malformed text render |

19 cards. These are unchanged from the original audit — re-confirmed still present and not touched (artwork was not edited per instructions). Every one of these cards is still correctly *identifiable* by its title text and artwork/suit symbolism; the defect is confined to the decorative numeral banner. A user who knows Rider-Waite conventions would likely notice these as visibly wrong; a casual user would likely just notice an inconsistently large/odd number relative to other cards in the same deck.

**P2 (cosmetic inconsistency — not factually wrong, just inconsistent styling):**
| Card | Marking | Issue |
|---|---|---|
| pentacles-ace | "A" | Letter marker instead of the deck's usual Roman numeral style |
| pentacles-king | "K" | Letter marker |
| pentacles-knight | "K" | Letter marker |
| pentacles-queen | "Q" | Letter marker |
| swords-knight | "K" | Letter marker |
| swords-king | — | Title reads "KING OF Swords" (mixed case) |
| swords-queen | — | Title reads "QUEEN OF Swords" (mixed case) |
| swords-page | — | Title reads "PAGE OF Swords" (mixed case) |

**P3 (negligible):**
- `pentacles-08` (Eight of Pentacles): background display rack shows 9 pentacle disks, not 8.
- `cups-09` (Nine of Cups): cup count in the fanned arc is ambiguous (~7 clearly countable).
- Six cards show **no numeral at all** (`cups-03`, `cups-ace`, `cups-queen`, `wands-02`, `wands-page`, `wands-queen`) — this is not a defect; it's the most Rider-Waite-authentic treatment in the deck (aces/courts traditionally carry no Major-style numeral).

No new artwork was edited, redrawn, or regenerated to address any of the above — per instructions, these are reported, not silently fixed or hidden.

## Queen of Pentacles

Special review requested because this card's only source was a 2816×1536 outpainted canvas, cropped down to `pentacles-queen.webp` (915×1525) in the prior pass.

- **Crop verification:** re-inspected the full-resolution production file directly. The crop boundary sits cleanly inside the outpainted canvas — no part of the real card art, border, or text is cut off.
- **Border:** intact — full gold ornate frame visible on all four sides, corner medallions complete.
- **Title:** intact — "QUEEN OF PENTACLES" fully legible in the bottom banner.
- **Rank:** intact — "Q" glyph fully legible in the top banner.
- **Clipping:** none found.
- **Aspect ratio vs. deck:** 915×1525 → ratio ≈ 0.600, matching the deck's dominant 800×1333 / 1600×2666 ratio (also 0.600) almost exactly — not a visible outlier next to other cards.
- **Visually acceptable at actual UI size:** confirmed live in the running app — this exact card was drawn during runtime QA (a real Daily Draw pulled Queen of Pentacles reversed) and rendered correctly at the app's 126×190 display size with `object-fit: cover`, no distortion, full image loaded (`complete: true`, natural size 915×1525 as expected).
- **Result: PASS.**

**Pentacles cards with sword-like decorative details** (as previously flagged, re-confirmed present, not fixed — cosmetic/compositional only, not a wrong-card issue):
- `pentacles-10` (Ten of Pentacles): the decorative arch framing the family is built from crossed sword-like shapes rather than pentacle/coin motifs.
- `pentacles-page` (Page of Pentacles): small floating swords are visible in the background, incongruous with the Pentacles suit.

## Responsive

- **375px:** 3 cards (three-card spread) rendered at fixed 126×190 each, `object-fit: cover`, no offscreen/clipped cards, no horizontal overflow (`document.body.scrollWidth === innerWidth`). Card-detail dialog (native `<dialog>`) fits exactly within the viewport (375×547, no overflow right/bottom).
- **390px:** same — no overflow, all 3 card images on-screen.
- **768px:** no overflow.
- **1024px:** no overflow (`bodyScrollWidth` 1009 < 1024).
- **1440px:** no overflow; cards laid out in a single centered row.

Card artwork renders at one fixed pixel size (126×190, from the `TarotCardVisual` "md" size class) at every breakpoint tested — the responsive behavior here is the flex-wrap container reflowing, not the card itself scaling. This is pre-existing component design, not something this integration pass changed or was asked to redesign. No clipping, stretching, missing borders, or missing titles were found at any breakpoint. Mobile reveal interaction: the app has no separate "flip" gesture — a completed draw is already revealed; this matches the existing draw-flow design (see Runtime QA note below) and was not something to test as a distinct mobile-only interaction.

## Performance

- **Total deck size:** 20.60 MB (78 WebP files)
- **Average card size:** 270.4 KB
- **Largest:** `pentacles-king.webp` — 506.3 KB
- **Smallest:** `pentacles-05.webp` — 177.5 KB
- **Top 10 largest:** pentacles-king (506.3 KB), pentacles-knight (466.5 KB), pentacles-03 (463.4 KB), pentacles-06 (420.9 KB), 03-the-empress (332.3 KB), 10-wheel-of-fortune (330.5 KB), cups-ace (321.2 KB), 19-the-sun (316.8 KB), 21-the-world (313.2 KB), cups-09 (312.1 KB)
- **Initial page load behavior:** confirmed via live network inspection — the Tarot dashboard, draw panel, and history list **never** request all 78 images. `TarotHistoryList` renders history rows as plain text (no thumbnails at all). The draw-type selector shows only the single shared `card-back.webp` (not per-card art). Only the 1 or 3 cards belonging to the *currently displayed* reading are ever requested — confirmed by watching the network log across a Daily Draw and a Three-Card Spread: exactly 1 and 3 `tarot-card` image requests respectively, nothing more. **No performance issue found; no change needed.**

## Tests

- **Typecheck:** PASS (`pnpm --filter @beaconvie/web typecheck` — 0 errors)
- **Lint:** PASS (`pnpm --filter @beaconvie/web lint` — 0 errors/warnings)
- **Unit (full web suite):** PASS — 103 suites, 542 tests, 0 failures
- **Tarot-specific:** PASS — `artwork.test.ts` (5/5, rewritten to test the new canonical-path contract and assert all 78 files exist on disk), `tarot-card-face.test.tsx` (9/9), `tarot-draw-panel.test.tsx` (6/6), `tarot-reading-view.test.tsx` (7/7), `tarot-dashboard.test.tsx` (1/1) — 28 tests total, all passing after the resolver change and after the `pentacles-ace` fix
- **Build:** PASS (`pnpm --filter @beaconvie/web build` — compiled successfully, `/discover/tarot` route built at 9.57 kB / 212 kB First Load JS, 53/53 static pages generated)
- **Runtime:** PASS — see below

### Runtime verification (live, in-browser)

Ran the actual dev server against the real API/DB and exercised the real Tarot flow as an authenticated user:
1. `/discover/tarot` landing page — loads, shows deck intro and draw panel. ✅
2. Deck/card-type selection — Daily Draw, Single Card, Three Card Spread selector all interactive. ✅
3. Card back — the shared `/assets/tarot/card-back.webp` renders correctly in the type-selector preview (200 OK). ✅
4. Draw interaction — clicking "Draw" triggers the real `POST /tarot/draw` (201 Created), a "Shuffling…" pacing state, then the real persisted result. ✅ *(Note: the app has no flip/reveal animation — the draw is a deterministic, already-computed backend result with a fixed ~700ms pacing delay before showing it; there is no face-down→face-up transition to test, by design — see `tarot-draw-panel.tsx`'s own comment.)*
5. Revealed card face — a real Daily Draw pulled **Queen of Pentacles (reversed)**; artwork loaded correctly (`GET /assets/tarot-card/pentacles-queen.webp → 200`, `complete: true`, 915×1525). ✅
6. Multi-card spread — a real Three Card Spread pulled **Two of Swords / Page of Cups / Knight of Cups**; all three images loaded correctly and independently (`swords-02.webp`, `cups-page.webp`, `cups-knight.webp`, all 200 OK, all `complete: true`). ✅
7. Reading/result screen — AI interpretation text rendered below the cards, correctly labeled "Written by AI to narrate the result above — it never chooses or changes it." ✅
8. History/detail screen — clicking a history row navigates to `/discover/tarot?item=<id>`, which reuses the same `TarotReadingView` and re-renders the same correct artwork (verified for both readings). ✅
9. Card-detail dialog — clicking a card face opens the meaning dialog (name, arcana, suit, element, upright/reversed meaning, reflection prompts) — correctly shows no artwork here by design (dialog is text-only). ✅

One pre-existing, unrelated console error was observed (`401 Unauthorized` on an early request during initial page hydration) — not connected to any Tarot asset request (all `tarot-card`/`tarot` asset requests were 200 OK) and not something introduced by this change; not investigated further as out of scope.

## Legacy assets

**Can old `/assets/tarot/cards` directory be removed: NOT YET.**

Reasoning:
- Per instructions, legacy removal is explicitly deferred to a later cleanup phase regardless of integration success.
- The directory is now fully unreferenced by application code (confirmed: 0 remaining call sites resolve to `/assets/tarot/cards/...`), so removing it later is a pure cleanup with no functional risk once approved.
- `apps/web/public/assets/tarot/card-back.webp` (sibling file, NOT under `cards/`) must be kept regardless — it's the active, still-used card-back asset and is unrelated to the 78-card front-artwork contract.
- Only `apps/web/public/assets/tarot/cards/major/major-17-the-star.webp` (the single legacy sample file) is now dead weight; it was left untouched this pass per explicit instruction.

## FINAL STATUS

**PASS**

All 78 cards are correctly identified, mapped through one centralized resolver, converted, present on disk, and — critically — verified rendering as the correct artwork inside the real, running application (not just filesystem existence). One P0 wrong-card-identity bug (`pentacles-ace` showing Ace of Swords art) was found during this pass's visual QA and fixed using already-existing backup artwork (no new art generated). Typecheck, lint, the full unit suite (542 tests), the build, and live runtime QA (including a real draw that happened to land on the newly-fixed Queen of Pentacles crop and a real three-card spread) all pass. Remaining warnings (19 P1 numeral inconsistencies, 8 P2 cosmetic inconsistencies, a few P3 nitpicks) are pre-existing source-art defects, explicitly not fixed per instructions not to regenerate or hide artwork — they are fully enumerated above for a future art-correction pass.
