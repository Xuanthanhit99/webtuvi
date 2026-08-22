# Tử Vi Depth Completion — Final Report (2026-08-22)

Companion to `docs/audit/tu-vi-depth-completion-audit.md` (findings/verdict) and
`docs/domain/tu-vi/tu-vi-depth-v1-decision.md` (decision summary). This report has the exact
file-by-file diff and test evidence.

**Not committed. Not pushed. Not deployed.** Left as reviewable working-tree state, per policy.

---

## 1. What shipped

### Miếu/Vượng/Đắc/Hãm — full stack

**New files:**
- `apps/api/src/tu-vi/engine/tu-vi-dignity.ts` — `DIGNITY_TABLE` (all 14 Chính Tinh), `getDignity()`,
  `annotateDignity()`. Full source citation and extraction-discipline notes in the module doc
  comment.
- `apps/api/src/tu-vi/engine/tu-vi-dignity.spec.ts` — 13 tests: table completeness (every star ×
  every branch resolves), partition invariant (12 branches, no gap/overlap), Tử Vi/Thiên Phủ's
  no-Hãm property, 8 spot-checks against the primary source, error-on-unknown-input, annotation
  correctness.

**Modified:**
- `apps/api/src/tu-vi/engine/tu-vi-chart.ts` — `mainStars` now `ChinhTinhDignityPlacement[]`; new
  `TUVI_DIGNITY_VERSION` constant and `dignityVersion` on `TuViVersionBundle`; `validateTuViChart`
  gained 1 new invariant (every main star's dignity is one of the 5 canonical states).
- `apps/api/src/tu-vi/tu-vi.mappers.ts` — `TuViChartDto.mainStars` type updated;
  `dignityVersion` threaded through `toTuViChartDto`/`toCreateData`.
- `apps/api/prisma/schema.prisma` — new `dignityVersion String` column on `TuViChart`.
- `apps/api/prisma/migrations/20260822032932_tu_vi_dignity_version/migration.sql` — hand-edited
  after `prisma migrate dev --create-only` (13 existing local-dev rows required a backfill default,
  not real user data — this feature has never been deployed): adds the column with a temporary
  default, then drops the default so future inserts must set it explicitly.
- `packages/types/index.ts` — new `TuViDignityValue`, `TuViMainStarPlacementDto`;
  `TuViChartDto.mainStars` retyped; `versions.dignityVersion` added.
- `apps/web/features/tu-vi/tu-vi-projection.ts` — `PalaceCell.mainStars` now carries `{star,
  dignity}` instead of a bare string.
- `apps/web/features/tu-vi/components/tu-vi-palace-grid.tsx` — renders a compact dignity badge next
  to each main star (e.g. "Tử Vi (Miếu)"), with a full-term `aria-label`.
- `apps/web/features/tu-vi/labels.ts` — new `DIGNITY_SHORT_LABEL` map.
- Fixture/assertion updates for the new required fields: `apps/api/src/tu-vi/engine/tu-vi-chart.spec.ts`
  (4 new tests, 1 updated), `apps/api/src/tu-vi/record/tu-vi-record.service.spec.ts` (interface
  field added), `apps/web/features/tu-vi/tu-vi-projection.test.ts` (fixture + 1 assertion),
  `apps/web/features/tu-vi/components/tu-vi-dashboard.test.tsx` (fixture).

### Đại Vận (Đại Hạn) — engine layer

**New files:**
- `apps/api/src/tu-vi/engine/tu-vi-dai-van.ts` — `calculateDaiVan()`, producing all 12 decade cycles.
  Reuses the already-tested `addPalaceOffset`/`PALACE_ROLES_FROM_MENH` primitives and the same
  Can-yin-yang × sex boolean pattern already established for CORE_13's Hỏa Tinh/Linh Tinh.
- `apps/api/src/tu-vi/engine/tu-vi-dai-van.spec.ts` — 7 tests: the primary worked example, 2
  independent cross-check worked examples (from unrelated pages), nghịch-direction case, all 4
  sex×polarity combinations, 12-cycle contiguity/completeness, ring-wraparound boundary.

**Modified:** `tu-vi-chart.ts` — `TuViChart.daiVan: ReadonlyArray<DaiVanCycle>`, computed in
`buildTuViChart()`; `validateTuViChart` gained 2 new invariants (12 contiguous cycles; every
cycle's position is a valid branch).

**Deliberately NOT modified:** Prisma schema, DTOs, mappers, frontend — engine-layer only this pass.

### Tiểu Hạn — engine layer

**New files:**
- `apps/api/src/tu-vi/engine/tu-vi-tieu-han.ts` — `calculateTieuHanStart()`, `getTieuHanPalace()`
  (adults only, age ≥ 13 — throws `RangeError` below that, rather than silently computing a wrong
  answer for the unimplemented child system).
- `apps/api/src/tu-vi/engine/tu-vi-tieu-han.spec.ts` — 6 tests: the primary worked example (first 3
  annual steps), the nghịch (female) case, starting-palace table completeness, all 12 branch→start
  mappings individually, 12-year cycle periodicity, age<13 rejection.

**Modified:** `tu-vi-chart.ts` — `TuViChart.tieuHanStart: TieuHanStart`, computed in
`buildTuViChart()`; `validateTuViChart` gained 1 new invariant (start palace is a valid branch).

**Deliberately NOT modified:** same as Đại Vận — engine-layer only.

## 2. Local environment fixes (not product code)

- `apps/api/.env`, `apps/api/.env.test` — changed `DATABASE_URL`/`REDIS_URL` host from `localhost`
  to `127.0.0.1`, matching a previously-documented fix for this machine's Docker Desktop WSL2 IPv6
  resolution hang (`sprint-18b-final-report.md`). Gitignored, local-only, not committed to product
  history.
- Docker Desktop containers (`beaconvie-postgres`, `beaconvie-redis`, `beaconvie-mailpit`) were not
  running at session start; started via `docker compose up -d`.
- Applied the new migration to both the dev database (13 pre-existing local rows backfilled) and the
  e2e test database (`beaconvie_test`, via `prisma migrate deploy`).

## 3. Test/build evidence (this session, freshly run)

| Check | Result |
|---|---|
| New dignity/Đại Vận/Tiểu Hạn unit tests | **26/26 pass** |
| Full `src/tu-vi` engine suite (`apps/api`) | **378/378 pass** (23 suites — up from 338 before this pass) |
| Full backend unit suite | **1587/1587 pass** (148 suites — up from 1546) |
| Backend typecheck | clean |
| Backend lint | clean |
| Tử Vi e2e (real HTTP + real Postgres, `test/tu-vi.e2e-spec.ts`) | **18/18 pass**, including the calculation→persist→GET round-trip, confirming `dignityVersion` and per-star `dignity` survive a real database round-trip, not just an in-memory mock |
| API production build (`nest build`) | clean |
| Frontend `features/tu-vi` unit tests | **16/16 pass** |
| Frontend typecheck | clean |
| Frontend lint | clean |
| Web production build | see note below |

**Web build note:** started in the background; if this report was generated before it finished, the
result is reported separately in the session's final message to the user rather than guessed here.

## 4. Domain research method (for future sessions to build on)

**Access method that works:** `archive.org` `_djvu.txt`/`.pdf` URLs must use the exact filename from
`archive.org/metadata/<item-id>` (not a guessed `dv01.pdf`-style pattern) and be fetched via direct
`curl -sL` download — `WebFetch` against these URLs silently returns an AI-generated summary instead
of raw content, discovered and worked around this session.

**PDF page-image viewing without Poppler:** this Windows machine has no `pdftoppm`/`poppler-utils`,
but has Python 3.13 with `pymupdf` (`fitz`) already installed — `python -c "import fitz; ...
page.get_pixmap(dpi=200).save(...)"` renders any page to PNG, which can then be read directly
(multimodal) to independently re-verify OCR-derived tables against the actual scan. Page-index-to-
printed-page offset must be confirmed per-file (varies by front-matter length) by rendering a
candidate page and checking its printed page-number footer before trusting any citation.

## 5. Deliberately not implemented (with specific reasons, not blanket caution)

| Item | Reason |
|---|---|
| Lưu Đại Hạn (annual sub-cycle) | Real, sourced, documented mechanism (`tu-vi-dai-van.ts`'s doc comment has the full rule) — deferred to bound this pass's scope, not an evidence gap |
| Tiểu Hạn child system (age < 13) | Newly-discovered table; OCR reconstruction of ages 5–12 flagged uncertain, not independently visually re-verified |
| Lưu Niên auxiliary "Lưu" stars | Genuinely incomplete extraction (2 of 3+ star groups transcribed, one star's rule never located) |
| Đại Vận/Tiểu Hạn persistence/API/frontend | Explicit scope boundary this pass — engine + tests only, to keep the shipped surface area reviewable in one pass |
| AI-grounding update (feeding dignity/vận into interpretation prompts) | Not required for correctness; a real, available follow-up |

## 6. Files changed (this pass only — see the prior session's competitive-gap-audit report for the
brand-fix/trust-section file list, unaffected by this pass)

**New:** `apps/api/src/tu-vi/engine/tu-vi-dignity.ts`, `tu-vi-dignity.spec.ts`, `tu-vi-dai-van.ts`,
`tu-vi-dai-van.spec.ts`, `tu-vi-tieu-han.ts`, `tu-vi-tieu-han.spec.ts`,
`apps/api/prisma/migrations/20260822032932_tu_vi_dignity_version/migration.sql`,
`docs/audit/tu-vi-depth-completion-audit.md`, `docs/domain/tu-vi/tu-vi-depth-v1-decision.md`,
`docs/progress/tu-vi-depth-completion-final-report.md` (this file).

**Modified:** `apps/api/src/tu-vi/engine/tu-vi-chart.ts`, `tu-vi-chart.spec.ts`,
`apps/api/src/tu-vi/tu-vi.mappers.ts`, `apps/api/src/tu-vi/record/tu-vi-record.service.spec.ts`,
`apps/api/prisma/schema.prisma`, `packages/types/index.ts`,
`apps/web/features/tu-vi/tu-vi-projection.ts`, `tu-vi-projection.test.ts`,
`apps/web/features/tu-vi/components/tu-vi-palace-grid.tsx`, `tu-vi-dashboard.test.tsx`,
`apps/web/features/tu-vi/labels.ts`, `docs/domain/tu-vi/domain-decision-register.md` (additive
addenda to DECISION-11/12), `apps/api/.env`, `apps/api/.env.test` (local-only, gitignored).

## 7. Commit / push / deployment status

Not committed, not pushed, not deployed — left as reviewable working-tree state per policy. Request
a commit once reviewed, including the founder's answer to the one disclosed judgment call (DECISION-
11's inclusion question — see the decision record).

---

## Addendum (2026-08-22, Final Live Release QA pass)

DECISION-11's founder answer arrived (`TUVI_STAR_DIGNITY_V1 = ENABLED`, recorded in
`domain-decision-register.md`) and this feature — together with the later Time Cycles work — went
through a full live browser QA pass. Full detail: `docs/progress/tu-vi-depth-time-cycles-final-release-qa.md`.
Dignity itself required one additional fix beyond what this report originally described: a historical-
chart-compatibility bug in `tu-vi.mappers.ts` (a chart persisted before this feature shipped had
`mainStars` entries with no `dignity` key at all; now healed live via the same tested `getDignity()`
lookup, since dignity is a pure function of `(star, position)`, both always present) — found via direct
database inspection during that later pass, fixed, and covered by 3 new mapper tests. Still not
committed, not pushed, not deployed.
