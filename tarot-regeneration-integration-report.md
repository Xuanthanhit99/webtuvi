# Tarot Regeneration Integration

Date: 2026-08-23

## New candidate assets

Found: 4 PNG candidates in `apps/web/public/assets/tarot-card`

Approved: 4

Rejected: 0

Non-target: 0

| Source file | Identified card | Canonical ID | Current top marker | Bottom title | Frame OK? | Content OK? | Confidence | Status |
|---|---|---|---|---|---|---|---|---|
| NINE OF PENTACLES.png | Nine of Pentacles | pentacles-09 | IX | NINE OF PENTACLES | Yes | Yes | High | APPROVED_REPLACEMENT |
| ACE OF SWORDS.png | Ace of Swords | swords-ace | A | ACE OF SWORDS | Yes | Yes | High | APPROVED_REPLACEMENT |
| ChatGPT Image Aug 23, 2026, 05_10_13 PM.png | Knight of Cups | cups-knight | Blank | KNIGHT OF CUPS | Yes | Yes | High | APPROVED_REPLACEMENT |
| ChatGPT Image Aug 23, 2026, 05_25_07 PM.png | King of Cups | cups-king | K | KING OF CUPS | Yes | Yes | High | APPROVED_REPLACEMENT |

No Queen of Cups candidate was found or used.

## Replaced production cards

- `pentacles-09.webp`
- `swords-ace.webp`
- `cups-knight.webp`
- `cups-king.webp`

Backup created: `apps/web/public/assets/tarot-card-remediation-backup-20260823-173121`

Before-replacement SHA-256 baseline: `tarot-artwork-before-replacement-sha256.json`

After validation details: `tarot-artwork-after-replacement-validation.json`

## P1 progress

DONE: 4 / 19

WAITING_FOR_NEW_ART: 15 / 19

REJECTED: 0

REVIEW: 0

Progress ledger: `tarot-regeneration-progress.md`

## Integrity

Canonical WebP: 78/78

Unexpected changes: 0

Manifest: PASS

Deck counts: PASS

- Major Arcana: 22
- Wands: 14
- Cups: 14
- Swords: 14
- Pentacles: 14

Decode check: PASS, 78/78

SHA comparison:

- INTENTIONALLY_CHANGED: `cups-king.webp`, `cups-knight.webp`, `pentacles-09.webp`, `swords-ace.webp`
- UNEXPECTEDLY_CHANGED: 0
- Missing files after replacement: 0
- Extra canonical WebPs after replacement: 0

## Tests

Tarot tests: PASS, 5 suites / 31 tests

Typecheck: PASS

Lint: PASS

Unit: PASS, 103 suites / 542 tests

Build: BLOCKED after successful compile/static generation by Windows symlink permission error while copying standalone traced files (`EPERM: operation not permitted, symlink`). No code or asset failure was reported before the standalone copy step.

Runtime: PARTIAL PASS

- Local app served at `http://localhost:3000`.
- `/discover/tarot` redirected to `/login` in this browser session, so real single-card and multi-card draw creation could not be completed without an authenticated session.
- Direct runtime asset checks passed for all four replaced cards:
  - `/assets/tarot-card/pentacles-09.webp` -> 200, `image/webp`, browser image complete, 1024x1536
  - `/assets/tarot-card/swords-ace.webp` -> 200, `image/webp`, browser image complete, 1024x1536
  - `/assets/tarot-card/cups-knight.webp` -> 200, `image/webp`, browser image complete, 1024x1536
  - `/assets/tarot-card/cups-king.webp` -> 200, `image/webp`, browser image complete, 1024x1536
- Browser console image errors: 0 for direct image checks.

## Contact sheet

78 cards reviewed: Yes

Contact sheet: `tarot-card-contact-sheet-after-remediation.png`

New wrong mappings: 0

New style outliers: 0

New broken images: 0

Special attention was given to `pentacles-09`, `swords-ace`, `cups-knight`, and `cups-king`; all four are in the correct manifest/order positions and match the expected card identity.

## Final status

PASS_PARTIAL_REMEDIATION

Four of the 19 P1 artwork defects now have verified regenerated replacements integrated into the canonical production deck. The remaining 15 P1 cards still require new artwork and were not touched.

