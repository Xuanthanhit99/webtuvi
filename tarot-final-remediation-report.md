# TAROT FINAL REMEDIATION

Date: 2026-08-23

## New source candidates

Found: 14 new PNG candidates for the remaining P1 cards.

Approved: 14

Rejected: 0

| Source file | Identified card | Canonical ID | Top marker | Bottom title | External canvas? | Card border complete? | Confidence | Status |
|---|---|---|---|---|---|---|---|---|
| Gemini_Generated_Image_1jiilg1jiilg1jii.png | Nine of Wands | wands-09 | IX | NINE OF WANDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_1jiilg1jiilg1jii (1).png | King of Wands | wands-king | K | KING OF WANDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_1jiilg1jiilg1jii (2).png | Knight of Wands | wands-knight | KN | KNIGHT OF WANDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_1jiilg1jiilg1jii (3).png | Page of Cups | cups-page | P | PAGE OF CUPS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_1jiilg1jiilg1jii (4).png | Page of Pentacles | pentacles-page | P | PAGE OF PENTACLES | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_n3ftl0n3ftl0n3ft.png | Two of Swords | swords-02 | II | TWO OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_n3ftl0n3ftl0n3ft (1).png | Three of Swords | swords-03 | III | THREE OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_n3ftl0n3ftl0n3ft (2).png | Four of Swords | swords-04 | IV | FOUR OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_n3ftl0n3ftl0n3ft (3).png | Eight of Swords | swords-08 | VIII | EIGHT OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_8mbvud8mbvud8mbv.png | Nine of Swords | swords-09 | IX | NINE OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_8mbvud8mbvud8mbv (1).png | Ten of Swords | swords-10 | X | TEN OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_8mbvud8mbvud8mbv (2).png | King of Swords | swords-king | K | KING OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_8mbvud8mbvud8mbv (3).png | Page of Swords | swords-page | P | PAGE OF SWORDS | Yes, side canvas | Yes | High | APPROVED |
| Gemini_Generated_Image_8mbvud8mbvud8mbv (4).png | Queen of Swords | swords-queen | Q | QUEEN OF SWORDS | Yes, side canvas | Yes | High | APPROVED |

The external canvas was removed with a side crop from `2816x1536` to the centered card rectangle `1024x1536`. No top, bottom, border, title panel, medallion, corner ornament, or card artwork area was cropped.

## Replacements

- `wands-09.webp`
- `wands-king.webp`
- `wands-knight.webp`
- `cups-page.webp`
- `pentacles-page.webp`
- `swords-02.webp`
- `swords-03.webp`
- `swords-04.webp`
- `swords-08.webp`
- `swords-09.webp`
- `swords-10.webp`
- `swords-king.webp`
- `swords-page.webp`
- `swords-queen.webp`

Backup created: `apps/web/public/assets/tarot-card-final-remediation-backup-20260823-183406`

Before SHA: `tarot-final-remediation-before-sha256.json`

After SHA: `tarot-final-remediation-after-sha256.json`

Validation details: `tarot-final-remediation-validation.json`

## P1

Original: 19

Previously fixed: 5

Fixed this pass: 14

Remaining: 0

Progress tracker: `tarot-regeneration-progress.md`

## Deck

Major: 22/22

Wands: 14/14

Cups: 14/14

Swords: 14/14

Pentacles: 14/14

Total: 78/78

Manifest: PASS, 78 entries, no duplicate IDs, no duplicate image paths, every manifest image exists.

Decode: PASS, 78/78 canonical WebPs decode, no zero-byte files.

## Image QA

External gray canvas removed: 14/14

Crop failures: 0

Wrong markers: 0

Wrong titles: 0

Wrong mappings: 0

Broken frames: 0

Replacement dimensions: 14/14 at `1024x1536`

Contact sheet: `tarot-card-contact-sheet-final.png`

The final contact sheet was inspected across all 78 cards. The 14 replaced cards are in the correct canonical positions, show the expected marker/title/suit, have no gray canvas, and have complete visible frames. The 5 previously fixed cards remained protected and byte-identical during this pass.

## Integrity

Expected changed: 14

Actual changed: 14

Unexpected changed: 0

Unchanged: 64

Protected already-fixed cards changed: 0

Changed files:

- `cups-page.webp`
- `pentacles-page.webp`
- `swords-02.webp`
- `swords-03.webp`
- `swords-04.webp`
- `swords-08.webp`
- `swords-09.webp`
- `swords-10.webp`
- `swords-king.webp`
- `swords-page.webp`
- `swords-queen.webp`
- `wands-09.webp`
- `wands-king.webp`
- `wands-knight.webp`

## Tests

Tarot: PASS, 5 suites / 31 tests

Typecheck: PASS

Lint: PASS

Unit: PASS, 103 suites / 542 tests

Build: PASS through compile, validation, and static page generation; WARN at standalone trace copy due to known Windows `EPERM` symlink permission issue. This is not classified as a Tarot asset failure.

Runtime: PARTIAL PASS

- Local app started at `http://localhost:3000`.
- Representative replaced assets served successfully:
  - `wands-09.webp` -> 200, `image/webp`, `1024x1536`
  - `cups-page.webp` -> 200, `image/webp`, `1024x1536`
  - `swords-02.webp` -> 200, `image/webp`, `1024x1536`
  - `swords-10.webp` -> 200, `image/webp`, `1024x1536`
  - `swords-king.webp` -> 200, `image/webp`, `1024x1536`
  - `swords-queen.webp` -> 200, `image/webp`, `1024x1536`
- `/discover/tarot` redirected to `/login` in this browser session, so authenticated Single Card and multi-card draw execution could not be completed here.

## Final status

PASS_WITH_WARNINGS

All 19 P1 Tarot artwork remediations are complete in the canonical production deck. The warnings are limited to the known Windows standalone build symlink packaging issue and the unauthenticated browser session blocking live draw execution.

