# Weekly & Monthly Reviews (Sprint 5B)

Reviews deterministically aggregate Insight Experience's (Sprint 5A) and Insight Preparation's
(Sprint 4C) already-materialized `InsightCandidate`/`ReflectionCandidate` rows — plus real
`JournalEntry`/`Memory`/`ActivityEvent`/`Conversation` counts for statistics — over a `WEEK`/
`MONTH`/`CUSTOM` time window into a persisted `Review` document. This sprint **generates no new
`InsightCandidate`/`ReflectionCandidate` rows** — it is strictly a read/aggregate layer, one further
step out from Insight Experience the same way Insight Experience was one step out from Insight
Preparation. Explicitly **not** AI: no LLM, no coaching, no recommendations, no generated advice, no
embeddings, no vector database, no semantic search, no autonomous agents, no prompt optimization, no
conversational reports.

See `docs/progress/sprint-5b-progress.md` for the Phase 0 audit that preceded this sprint.

## Relationship to prior sprints

- Every read endpoint calls `InsightGenerationService.ensureGenerated()` first (exported from
  `InsightModule` specifically for this), which itself re-runs Reflection Foundation's own
  regenerate pass — the same transitive-freshness chain Insight Experience already established one
  layer down. A Review is never built from a stale Insight/Reflection snapshot.
- Nothing here re-derives a category, priority, relationship, or evidence membership Insight/
  Reflection Foundation already computed. `ReviewableItem.category`/`priority`/`reason` are always
  copied straight from `InsightCandidate.category`/`priority`/`ruleExplanation` or
  `ReflectionCandidate.category`/`score`/`reason` — never recomputed.
- Priority tiers reuse Insight Experience's own thresholds (`priorityTierFor()`, 40/70) via a direct
  import from `insight/presentation/insight-renderer.ts` — never a separately-invented cutoff.

## "Study streak" and "Completed sessions" — disclosed substitutions

Confirmed during this sprint's own audit: **this product has no study-session or streak-tracking
feature**. `ActivityType` is `ACCOUNT_CREATED`/`ONBOARDING_COMPLETED`/`PREFERENCE_UPDATED`/
`MEMORY_CREATED`/`EMAIL_VERIFIED`/`PASSWORD_CHANGED`/`SESSION_REVOKED`/`LOGOUT_ALL` — nothing about
studying or sessions. Per this codebase's own "never fabricate a new entity, map to the closest real
one and disclose it" discipline (the same one Sprint 4B/4C already applied to "Goals" -> `Memory`
rows of type `GOAL`/`ACHIEVEMENT`/`CHALLENGE`):

- **"Study streak" -> Journaling streak**: consecutive calendar days (UTC), ending on the real
  point-in-time the review was generated (`asOf`, see below) and counting backward, with >= 1
  `PUBLISHED` `JournalEntry`. Computed the same way `ReflectionRuleEngine`'s own `POSITIVE_STREAK`/
  `NEGATIVE_STREAK` rules already compute mood streaks, generalized to "any journal entry."
- **"Completed sessions" -> Companion conversation count**: real `Conversation` rows created in the
  window. A "session" maps to a Companion conversation — the only session-shaped concept that
  actually exists in this product.

Both are labeled honestly in the API/UI using their real names ("Journaling streak", "Companion
conversations") — never mislabeled "study" or a fabricated "session" concept.

## Domain model (Phase 1)

```
apps/api/src/review/
  review.types.ts              ReviewUserData / ReviewableItem / ReviewStatistics / ReviewBuildResult
  review.mappers.ts             toReviewSummaryDto — the one shape every surface renders
  review-window.util.ts         resolveReviewWindow() / buildReviewDedupeKey() (pure)
  builder/                      review-builder.util.ts (pure) — Phase 2
  statistics/                   review-statistics.util.ts (pure) — Phase 3
  sources/                      ReviewDataSourceService — bounded fetch
  generation/                   ReviewGenerationService — orchestrates + upserts
  record/                       ReviewRecordService — list/detail/archive + Phase 6 filters
  export/                       ReviewExportService — Phase 7
  dto/                          query DTOs (class-validator)
  review.controller.ts          Phases 5/6/7/8 API
  review.module.ts
```

Prisma migrations: `20260806084832_review_engine` + `20260806090106_review_evidence_category_priority`
(additive only — 4 new enums, 3 new tables; `User` gained a back-relation only).

### Enums

- **`ReviewWindow`**: `WEEK`/`MONTH`/`CUSTOM` — mirrors `ReflectionWindow`/`InsightWindow`'s own
  three/four-value shape.
- **`ReviewState`**: `NOT_READY`/`READY`/`ARCHIVED` — no fifth invented state, same reasoning as
  `InsightStatus`'s own "no `EXPIRED`" precedent (a Review regenerates fresh on every read up until
  archived).
- **`ReviewSectionType`**: `HIGHLIGHTS`/`CHANGES`/`ACHIEVEMENTS`/`CHALLENGES` — Overview is a
  top-level `Review.overview` field, not its own section row.
- **`ReviewEvidenceSourceType`**: `INSIGHT`/`REFLECTION`/`JOURNAL`/`MEMORY` — real source tables
  only. `ACTIVITY`/`COMPANION` are never cited as direct evidence (only via a `ReflectionCandidate`'s
  own sources, or as Phase 3 statistics counts).

### Models

- **`Review`** — `window`/`windowStart`/`windowEnd`/`state`, `overview` (plain-language,
  deterministically templated), `statistics` (embedded JSON, mirrors
  `InsightCandidate.priorityFactors`'s own "embedded, not a separate table" precedent — a review's
  statistics are 1:1 with the review itself), `dedupeKey` (`window:windowStart:windowEnd`, unique
  per user).
- **`ReviewSection`** — one row per non-empty section; a section with no qualifying evidence is
  simply not created, never a fabricated empty placeholder.
- **`ReviewEvidence`** — one row per real Insight/Reflection/Journal/Memory record a section cites,
  with `category`/`priority` persisted as real columns (not only embedded in `contribution`'s text)
  so Phase 6's filters are real, indexed queries, never a text-parse.

## Calendar windows, not rolling windows (Phase 1)

`WEEK`/`MONTH` resolve to a **stable calendar period** (`resolveReviewWindow()`,
`review-window.util.ts`) — the containing ISO week (Monday-Sunday) or calendar month — not a
rolling "last 7/30 days from now." This is what makes `ensureGenerated()` idempotent within the same
period: regenerating on Wednesday of a given week reuses the exact same `windowStart`/`windowEnd`
(and therefore `dedupeKey`) a regeneration on Friday of that week would, converging on one row that
gets richer as the week's real evidence accumulates — the same "upsert by a stable fingerprint"
discipline every prior engine in this codebase uses. A rolling window would instead mint a new row
on every single read. `CUSTOM` requires both `from` and `to` from the caller, never guessed
(`REVIEW_WINDOW_RANGE_REQUIRED`/`REVIEW_WINDOW_RANGE_INVALID`, mirroring Insight Timeline's own
custom-range validation).

**A real bug found and fixed during this sprint's own manual verification**: the journaling streak
was initially anchored on `windowEnd`, which for an *in-progress* `WEEK`/`MONTH` is the calendar
period's future end — a date that never has journal entries yet, so the streak always computed 0.
Fixed by computing an `asOf = min(windowEnd, now)` in `ReviewDataSourceService.fetch()` and anchoring
the streak there instead — confirmed via manual verification against the shared demo account (0 ->
1, correctly reflecting a real same-day entry) and covered by a dedicated regression unit test.

## Renderer / Builder (Phase 2)

`builder/review-builder.util.ts` — pure functions only, no DB access, no randomness, no LLM:

- **`classifySection(category)`** — a fixed, documented category -> section mapping, no
  re-weighting, no scoring model:

  | Category | Section |
  |---|---|
  | `MISMATCH`, `INACTIVITY` | Challenges |
  | `GOAL` | Achievements |
  | `WELLBEING`, `ALIGNMENT` | Changes |
  | `TOPIC`, `JOURNAL` (everything else) | Highlights |

- **`buildContribution(item)`** — a fixed template: `"${sourceLabel}: ${reason} (${metric}
  ${priority}).${evidenceNote}"`. `reason`/`priority` are always copied verbatim from the real
  `InsightCandidate`/`ReflectionCandidate`/`Memory`/`JournalEntry` row — never rewritten.
- **`buildSections(items)`** — groups classified items into non-empty sections, sorted by priority
  descending, bounded to 20 items/section (same order-of-magnitude discipline every prior sprint's
  own bounds use).
- **`buildOverview(window, statistics, sections)`** — a fixed template over already-computed
  statistics and section counts. Never a generated summary sentence; every number is real.
- **`buildReview(window, items, statistics)`** — the orchestrator. `state` is `NOT_READY` only when
  there is truly nothing to show (no sections *and* every statistic is zero) — a brand-new account's
  own `ACCOUNT_CREATED` activity event, for example, is real activity and correctly yields `READY`
  with empty sections, not a hardcoded `NOT_READY`.

Verified by `review-builder.util.spec.ts` (24 assertions, including a determinism check).

### Evidence sources beyond Insight/Reflection (real, never arbitrary)

The mission requires consuming Journal and Memory directly, not only via a `ReflectionSourceRef`.
Two narrow, deterministic, real-flag-gated additions in `ReviewGenerationService`/
`ReviewDataSourceService` satisfy this without ever picking evidence arbitrarily:

- **Achievement Memories**: real `Memory` rows of `type: 'ACHIEVEMENT'`, `status: 'ACCEPTED'`,
  created in the window — classified as `GOAL` (the same "achievement/goal are goal-relation types"
  precedent Reflection/Insight Foundation already establish), landing in Achievements via the
  *unmodified* `classifySection()` rule.
- **Pinned Journal entries**: real, user-`pinned`, `PUBLISHED` `JournalEntry` rows in the window —
  the pin is the user's own explicit importance signal (priority `70`, reusing
  `reflection-score.calculator.ts`'s own "manual pin floors the total at 70" constant verbatim
  rather than inventing a new one), landing in Highlights.

Both are gated on a real, already-existing flag (`Memory.type`, `JournalEntry.pinned`) — never an
arbitrary "most interesting" pick.

## Statistics (Phase 3)

`statistics/review-statistics.util.ts` — pure, real counts only:

| Statistic | Source |
|---|---|
| Journal entries | `JournalEntry` count, `state: PUBLISHED`, in window |
| Memories saved | `Memory` count, `status: ACCEPTED`, in window |
| Reflections | `ReflectionCandidate` count, `state != EXPIRED`, in window |
| Insights | `InsightCandidate` count, `status IN (READY, ARCHIVED)`, in window |
| Activity events | `ActivityEvent` count, in window |
| Journaling streak (days) | see "Calendar windows" above |
| Companion conversations | `Conversation` count, in window |

Verified by `review-statistics.util.spec.ts`.

## Evidence View (Phase 4)

Every `ReviewEvidence` links back to its real source, mirroring Insight Experience's own
`ReflectionSourceViewer`/evidence-link precedent so wording/linking never drifts across surfaces:
`INSIGHT` -> `/insights?item=id`, `REFLECTION` -> `/reflections?item=id` (both always resolve — a
real detail view exists for any state), `JOURNAL` -> `/journal?item=id`, `MEMORY` ->
`/memory?item=id`.

## Timeline / Dashboard (Phase 4/5)

`/reviews` — quick entry points to the current Weekly/Monthly review plus a reverse-chronological
Review Timeline of past reviews (`GET /reviews`), the same `?item=<id>` "open detail in place"
pattern every other module in this product already uses. `/reviews/:param` disambiguates a single
dynamic route segment by its own value: `week`/`weekly`/`month`/`monthly` resolve to the current
period (`ReviewWindowView`); anything else is treated as a real review id (`ReviewDetail`) — the
same single-segment route shape the sprint brief specifies, without a separate route tree.

## Filters (Phase 6)

- **List-level** (`GET /reviews`): `window`, `state`, and a date range on `windowStart` —
  straightforward DB-level filtering, the same shape Insight Experience's own `cards()` filters use.
- **Detail-level** (`GET /reviews/:id`): `category` and `priorityTier`, applied in-memory to an
  already-fetched review's sections/evidence (no second DB round-trip) — a section left with zero
  matching evidence after filtering is dropped, never shown empty. Reuses `priorityTierFor()`
  directly, never a separately-invented threshold.

## Export (Phase 7)

Markdown and JSON only. **No PDF**: confirmed (again) during this sprint's own audit that no PDF
library exists anywhere in this repository — `journal-foundation.md`'s own "Export" section already
disclosed this for Sprint 4A's export surface. Adding one now would be new infrastructure for a
single format, not a deterministic-review concern; disclosed as out of scope rather than silently
dropped. Mirrors `JournalExportService`'s exact response shape (`{ filename, content }` for
Markdown, downloaded client-side as a Blob — never a raw HTTP file-stream response, keeping every
route inside the same envelope-wrapped response convention every other endpoint in this codebase
uses).

## API

`ReviewController` (`@Controller('reviews')`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/reviews` | list/filter, paginated |
| GET | `/reviews/custom` | generate/return a custom-range review (registered before `:id`) |
| GET | `/reviews/current/:window` | generate/return the current week/month review |
| GET | `/reviews/:id` | detail, with optional `category`/`priorityTier` evidence filters |
| POST | `/reviews/:id/archive` | archive (never resurrected by later regeneration) |
| GET | `/reviews/:id/export/markdown` | Markdown export |
| GET | `/reviews/:id/export/json` | JSON export |

`GET /reviews/custom` is registered before `GET /reviews/:id` for the same route-ordering reason
every other controller in this codebase documents (a literal single-segment path must win over a
same-shape `:id` param route). Every route sits behind `JwtAuthGuard` + the project-wide
`CsrfGuard`; every underlying query is `userId`-scoped.

## Security (Phase 8)

- **Ownership**: every route is `userId`-scoped or does an explicit post-fetch ownership check
  (`findOwned()`) that 404s identically for nonexistent vs. cross-user ids — verified in both
  `review-record.service.spec.ts` and `review.e2e-spec.ts` (including export routes).
- **Archived evidence stays viewable**: archiving only ever sets `state`/`resolvedAt` — sections and
  evidence are never touched or deleted, verified end-to-end (an archived review's evidence count
  is asserted identical before/after archiving).
- **Deleted evidence**: `JournalEntry`/`Memory` deletion in this product is a soft delete
  (`state: DELETED` / `status: DELETED`, row retained) — a Review's evidence link to a since-deleted
  Journal/Memory resolves to that record's own existing detail view, which already handles a
  deleted/inaccessible row gracefully (existing Journal/Memory precedent, not duplicated here). A
  Review is a point-in-time document of a period that already happened; unlike Insight Experience's
  live dashboard, it does not re-validate every evidence link on every view.
- **Cross-user isolation**: verified end-to-end — a second user's `current/:window` review is a
  different id, and never appears in the first user's own list.
- **No content logging**: grepped every `Logger`/`logger.*` call site under `apps/api/src/review/`
  — every log line is structured and content-free (`id`, `format`, counts only). No `overview`,
  `contribution`, journal, memory, or reflection text is ever logged.
- **No hidden LLM/provider call**: grepped `apps/api/src/review/` for
  `openai|anthropic|gemini|fetch\(|axios|http.request` — zero matches (the one "fetch" hit is
  `ReviewDataSourceService.fetch()`, a Prisma method name, not a network call).
- **CSRF**: `POST /reviews/:id/archive` rejected with `CSRF_TOKEN_MISSING` when the header is
  omitted (e2e-tested).

## Tests (Phase 9)

- **Backend**: `review-builder.util.spec.ts` (24), `review-statistics.util.spec.ts` (6),
  `review-window.util.spec.ts` (9), `review-record.service.spec.ts` (11 — ownership, archive
  idempotency/evidence-preservation, list filters, detail filters), plus `review.e2e-spec.ts` (13 —
  generation/statistics against real accumulated data, custom-window validation, Phase 6 filters,
  archive lifecycle, export, ownership/cross-user isolation) against a real HTTP surface and
  database.
- **Frontend**: `review-statistics-panel.test.tsx`, `review-evidence-list.test.tsx`,
  `review-card.test.tsx`, `review-timeline.test.tsx`, `review-content.test.tsx` (18 tests total).
- **Playwright** (`flow-18-review-engine.spec.ts`): seeds the same deterministic
  two-journal-theme -> `REPEATED_JOURNAL_THEME` -> `SUPPORTS` `InsightCandidate` pattern flow-16/
  flow-17 already establish, then drives the real `/reviews` UI end-to-end — dashboard entry points,
  the weekly review's overview/statistics/sections/evidence, category filtering, a real Markdown
  file download, and archive -> Archived filter. A second test confirms the Monthly review route
  renders its own real statistics.

## Observability

Structured, content-free `Logger` calls only (generation counts/latency, archive/export
id+format) — mirroring every prior engine's own precedent. **Never logged**: `overview`,
`contribution`, or any journal/memory/reflection/insight text.

## Known limitations (disclosed, not hidden)

- **Bounded, not exhaustive**: same order-of-magnitude bounds as Insight Preparation (200
  insights/300 reflections per window, 60-day streak lookback).
- **Topic/category classification is a fixed lookup table**, not a weighted model — an item's
  section is entirely determined by its own real `category`, never re-scored.
- **Evidence links are not re-validated on every view** — a Review documents a period that already
  happened; see "Security" above for why this is a deliberate, disclosed choice rather than an
  oversight.
- **No PDF export** — disclosed above, matches Sprint 4A's own precedent.
- **No calendar-picker UI for custom windows** — the frontend's custom-range entry point exists at
  the API level (`GET /reviews/custom`) but has no dedicated UI control yet in this sprint; reachable
  via `/reviews/custom` query params directly, same disclosed limitation Insight Experience's own
  Timeline carries forward for the same reason (no calendar/range-picker component exists in this
  codebase to reuse).
