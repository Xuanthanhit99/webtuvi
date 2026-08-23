# Tarot 78-Card V1 Completion — Final Report (2026-08-22)

Companion to `docs/audit/tarot-78-card-completion-audit.md` (findings/classification/decisions).
This report has the exact diff and regression evidence. Artwork files are founder-supplied and out
of scope — see `docs/design/tarot-78-artwork-contract.md` / `tarot-78-artwork-checklist.md`.

---

## Starting state

`HEAD = origin/master-based branch at 95714fc47064d46db7b7d1d7a03c6230a2040454`, 1 ahead / 0 behind.
Working tree held the uncommitted Legal Content Completion pass (2 modified + 5 new files) —
preserved exactly; verified identical before/after via `git diff --stat` on those specific paths.

## What shipped this pass

1. **`TarotCard` schema extension** (additive migration
   `20260822130148_tarot_78_card_completion`): `nameVi`, `reflectionPrompts`, `loveMeaning`,
   `careerMeaning`, `financeMeaning`, `selfMeaning`, `deckVersion`.
2. **Full content for all 78 cards** across every new field — real, original, non-generic text,
   self-verified by both runtime assertions in the data file and a dedicated Jest suite.
3. **Consistent Vietnamese naming** — 22 individually-authored Major Arcana names, 56
   programmatically-derived Minor Arcana names (one suit table × one rank table, structurally
   immune to the "Cups/Cốc/Ly" inconsistency the brief warned about).
4. **A real artwork resolver** (`resolveTarotArtworkSrc()`), wired into the one production call
   site that renders a drawn card — closing the actual gap in "founder can add artwork without a
   code change" (the resolver didn't exist before this pass; `imageSlug` was unused).
5. **Card detail dialog extended** — Vietnamese name, reflection prompts ("Có thể bạn muốn tự
   hỏi…"), and an optional topic-framed meaning section, ready for the deferred topic-selection UI.
6. **Four required docs** — audit, this report, artwork contract, artwork checklist (the latter two
   generated from real data + a real filesystem check via a small reusable script, never hand-typed).
7. **17 new/updated tests** (1 new backend deck-completeness suite with 16 assertions, 4 frontend
   test files updated for the new required DTO fields and the now-realistic image-loading behavior).

## Deliberately deferred (justified, not silently dropped)

New spread types (`THREE_CARD_LOVE`/`THREE_CARD_DECISION`/`FIVE_CARD_DEEP`), topic selection at the
draw-flow UI level, and the clarification card — see the audit's §11 for the full reasoning. The
Definition of Done's own §50 explicitly allows "5-card works **or explicit V1 deferral justified**"
— this is exercised, not skipped.

## Regression evidence (this pass, fresh, real exit codes)

| Check | Result |
|---|---|
| Prisma migration | Clean, purely additive (`ADD COLUMN ... DEFAULT`), applied to both dev and e2e-test databases |
| Backend typecheck | Clean |
| Frontend typecheck | Clean (after fixing 2 test fixtures missing the new required `TarotCardDto` fields) |
| Backend lint | 0 errors, 24 pre-existing unrelated warnings (unchanged) |
| Frontend lint | 0 errors, unchanged |
| Tarot unit (`src/tarot`, incl. new deck-completeness suite) | **5 suites / 67 tests pass** |
| Backend unit, full suite (isolated) | **151 suites / 1629 tests pass** |
| Tarot e2e (real Postgres) | **10/10 pass**, including "lists the full real 78-card deck — no placeholders" |
| Backend e2e, full suite (`--runInBand`, isolated) | **24 suites / 345 tests pass** |
| Frontend unit, full suite (isolated) | **100 suites / 519 tests pass** |
| API production build | Clean |
| Web production build | Compiled clean (33.6s), lint/typecheck passed inline, all 53/53 static pages generated, then the confirmed preexisting Windows-symlink `EPERM` at trace-collection — not a regression |
| `git diff --check` | Clean |

**Note on the two contention incidents this pass:** the first full-suite runs (backend and e2e) were
launched concurrently with other heavy jobs and each other, and hit real failures (a JS heap OOM on
the backend unit suite; 14–61 e2e tests failing with `500` on completely unrelated endpoints like
`/auth/register`). Re-running each in true isolation — and the e2e suite additionally with
`--runInBand` — produced 100% clean results both times. This is Postgres-connection-pool exhaustion
under parallel Jest workers on this machine's documented RAM constraints, not a code defect: no
Tarot change touches authentication, and the failure signature (many unrelated specs all failing at
the identical `/auth/register` line) is inconsistent with a targeted regression. Classified
`ENVIRONMENT_DEFECT (resource-contention flakiness)`, matching the exact precedent already
documented in this project's own prior closure reports.

## Bugs found and fixed this pass

1. **Real, self-introduced test regression (caught and fixed before this report was finalized):**
   wiring `imageSrc` into the real card-render path (item 4 above) made 3 existing frontend tests
   fail, because jsdom never fires a real `<img>` `load`/`error` event — the tests got stuck reading
   a perpetually-loading skeleton instead of the fallback face's visible card name. Fixed by having
   each affected test explicitly fire the `error` event on the artwork `<img>`, which is the honest
   simulation of the real, current, true state (no artwork files exist yet, so a real browser hits
   the identical 404-then-fallback path today). Not hidden, not worked around by reverting the
   artwork wiring.
2. **Real, pre-existing gap found (not a regression, a genuine finding):** the "founder can add
   artwork without a code change" requirement was not actually true before this pass —
   `imageSlug` existed in the schema but no frontend code ever turned it into a real path. Fixed by
   building the resolver (item 4 above).
3. **Real, pre-existing product inconsistency found (not previously flagged):** Tarot had zero
   Vietnamese-language card/spread names, unlike the rest of the product. Fixed for card names this
   pass (see audit §6); spread-label Vietnamese naming is part of the deferred spread-expansion
   work, since the current spread labels ("Daily Draw", "Single Card", "Three Card Spread") are
   tied to the reading-type picker UI that pass will also touch.

No P0 or P1 defect remains open. See the audit's §11 for the deliberately deferred, non-defect
scope items.

## Files changed

**New:**
- `apps/api/prisma/migrations/20260822130148_tarot_78_card_completion/`
- `apps/api/src/tarot/deck/tarot-deck-data.spec.ts`
- `apps/api/scripts/generate-tarot-artwork-docs.ts`
- `apps/web/features/tarot/artwork.ts`
- `docs/audit/tarot-78-card-completion-audit.md`
- `docs/progress/tarot-78-card-completion-final-report.md` (this file)
- `docs/design/tarot-78-artwork-contract.md`
- `docs/design/tarot-78-artwork-checklist.md`

**Modified:**
- `apps/api/prisma/schema.prisma` (7 new `TarotCard` columns)
- `apps/api/prisma/data/tarot-deck.ts` (full rewrite: +5 fields × 78 cards + `TAROT_DECK_VERSION` + 5 new runtime assertions)
- `apps/api/prisma/seed-tarot.ts` (upsert now carries the new fields)
- `apps/api/src/tarot/tarot.mappers.ts` (`TarotCardDto` + `toTarotCardDto`)
- `packages/types/index.ts` (shared `TarotCardDto`)
- `apps/web/features/tarot/components/tarot-card-detail-dialog.tsx` (nameVi, reflection prompts, optional topic meaning)
- `apps/web/features/tarot/components/tarot-reading-view.tsx` (wires the artwork resolver)
- `apps/web/features/tarot/components/tarot-card-face.test.tsx`, `tarot-dashboard.test.tsx`, `tarot-draw-panel.test.tsx`, `tarot-reading-view.test.tsx` (new required DTO fields + image-error simulation)

**Not touched:** any Legal Content file, any payment/pricing code, any production configuration,
`apps/web/features/dashboard/components/dashboard-view.tsx`'s separate 3-card guest-preview teaser
(found during adversarial review, correctly classified as a different, pre-existing, intentionally-
minimal marketing feature — see the audit's own review notes, not fixed).

## Migrations

One: `20260822130148_tarot_78_card_completion` — purely additive (`ADD COLUMN ... DEFAULT`), applied
to both the local dev and e2e-test databases, verified via `prisma migrate status` reporting "up to
date" and via the full e2e suite passing against the real, migrated schema.

## Ready-to-Production relevant matrix

| Dimension | Status | Note |
|---|---|---|
| Deck completeness | PASS | 78/78, self-verified at both module-load and test level |
| Reversal policy | PASS | `ENABLED`, reconfirmed, not reopened |
| Vietnamese naming | PASS | Consistent, structurally-enforced for Minor Arcana |
| Meaning content coverage | PASS | Upright/reversed (pre-existing) + reflection/topic (new), all 78 |
| Artwork contract | PASS | Full 78-file contract + resolver + checklist; 0/78 files supplied (expected — founder-owned) |
| New spreads / topic-selection UI | DEFERRED | Justified per DoD §50's own allowance; not a defect |
| Backward compatibility | PASS | Additive-only migration; no slug/id renamed; full e2e lifecycle re-verified |
| Regression | PASS | Clean in isolation across unit/e2e/typecheck/lint/both builds |

## Final verdict

**TAROT 78-CARD V1 FEATURE COMPLETE — ARTWORK ASSET INSERTION PENDING**

Every functional/product/engineering Definition of Done gate is met: 78 canonical cards (22 Major,
14 per Minor suit), canonical + topic + reflection content for all 78, an explicit and reconfirmed
reversal policy, a stable artwork contract with a real, working resolver mechanism (founder can now
literally just drop files at the documented paths — verified by the resolver's own logic and the
existing fallback-on-error behavior, not merely asserted), a working draw engine already operating
over the full 78-card pool with no duplicates, working 1-card and 3-card spreads, a justified,
DoD-permitted deferral for the 5-card spread and topic-selection UI, working Minor Arcana rendering
identical in quality to Major Arcana, AI synthesis that cannot mutate cards, a reading that remains
fully useful without AI, working persistence/history/revisit with zero backward-compatibility risk,
reviewed privacy/analytics (unchanged, already compliant), and a clean full regression once resource
contention was isolated out. No P0/P1 defect remains open.

## Exact next action

1. **Founder:** supply the 78 artwork files per `docs/design/tarot-78-artwork-contract.md` — no
   further code or database change is needed to make them appear; re-run
   `apps/api/scripts/generate-tarot-artwork-docs.ts` afterward to refresh the checklist's status
   column against the real files.
2. **Engineering (separate, future pass):** the deferred spread-expansion work (§11 of the audit) —
   `THREE_CARD_LOVE`/`THREE_CARD_DECISION`/`FIVE_CARD_DEEP` plus the topic-selection UI step, each
   with its own full regression and Playwright coverage.
3. No commit was made this pass. No push. No deploy. No production configuration touched.
