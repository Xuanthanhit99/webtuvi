# Sprint 5B — Weekly & Monthly Reviews: Progress / Audit

## Phase 0 audit

### Insight Experience (Sprint 5A, the newest presentation layer)

`apps/api/src/insight/presentation/` renders already-materialized `InsightCandidate` rows into
`InsightCard`/`InsightEvidenceCard`/`InsightTimelineCard` via pure functions
(`insight-renderer.ts`), with filters (priority/category/date/status/source) and a Timeline
(today/week/month/custom, grouped by category/priority/topic). Sprint 5B's own mission — "must
NOT generate new InsightCandidates" — mirrors Insight Experience's own "no new insight generation"
discipline exactly. Reviews are one layer further out: they aggregate over an already-rendered
Insight/Reflection/Journal/Memory/Activity window, they don't compute anything Insight Experience
or Insight Preparation should have computed.

Reused directly: `InsightPresentationService`'s `cards()`/`evidence()` query shapes and its
`priorityTierFor()`/label dictionaries (via the same thresholds — 40/70), so a Review's own
"priority" framing of an insight never drifts from what `/insights` already shows for the same row.

### Insight Preparation (Sprint 4C)

`InsightCandidate` — `category`/`status`/`window`/`windowStart`/`windowEnd`/`ruleExplanation`/
`priority`/`priorityFactors`/`pinned`, evidenced by `InsightEvidence` rows each citing a real
`ReflectionCandidate`. `InsightGenerationService.ensureGenerated()` is compute-on-read; Review
generation calls this first (transitively, via `InsightPresentationService`) so a Review is never
built from a stale Insight snapshot — same discipline Insight Experience itself already follows for
Reflection Foundation.

### Reflection Foundation (Sprint 4B)

`ReflectionCandidate` — `category`/`trigger`/`state`/`window`/`reason`/`score`/`scoreFactors`,
sourced from real `JOURNAL`/`MEMORY`/`ACTIVITY`/`COMPANION` rows via `ReflectionSourceRef`. This is
the layer Sprint 5B's own evidence chain bottoms out at for anything routed through Insight — a
Review's evidence for a "Highlight" or "Achievement" section traces: Review -> InsightCandidate (or
directly a ReflectionCandidate for reviews that want finer granularity than Insight clusters) ->
ReflectionCandidate -> real Journal/Memory/Activity/Companion row. Never re-derives a pattern
Reflection Foundation already computed (e.g. no re-running streak/mismatch detection — Sprint 5B
reads `ReflectionCandidate.category`/`trigger`/`score`, it doesn't recompute them).

### Journal Foundation (Sprint 4A) / Memory Foundation (3A) / Companion Core (2B)

`JournalEntry` (`state`, `createdAt`, `mood`, `tags`), `Memory` (`type`, `status`, `createdAt`),
`Conversation`/`ConversationMessage` (`createdAt`). All read-only from Sprint 5B's perspective, for
Phase 3 statistics only (counts within a window) — never a second write path, never re-deriving
content Journal/Memory/Companion already own.

### Sprint 5A closure (`sprint-5a-final-report.md`)

Confirmed clean baseline: 65 backend suites/543 tests, 40 frontend suites/196 tests, 25/25
Playwright, 124/124 backend e2e (post-maintenance), commit `5d8a9a2` (Sprint 5A) +
`14c00f0` (start-script fix) both intact. No open Sprint 5A blockers carry into 5B. The one
disclosed residual (a legacy demo-account `InsightCandidate` row with a stale headline) is cosmetic,
self-healing, and irrelevant to Review generation (Reviews read `priority`/`category`/`evidenceCount`
fields, never re-render `ruleExplanation` verbatim into a Review's own wording — see Phase 2 below).

## Deliberate scope decisions (disclosed up front)

1. **No "Goal"/"Study"/"Session" entity is fabricated.** This repository has no dedicated `Goal`
   model (Sprint 4B/4C precedent: goals are `Memory` rows of type `GOAL`/`ACHIEVEMENT`/`CHALLENGE`)
   and, confirmed during this audit, **no study-session or streak-tracking feature exists at all**
   (`ActivityType` is `ACCOUNT_CREATED`/`ONBOARDING_COMPLETED`/`PREFERENCE_UPDATED`/
   `MEMORY_CREATED`/`EMAIL_VERIFIED`/`PASSWORD_CHANGED`/`SESSION_REVOKED`/`LOGOUT_ALL` — nothing
   about studying or sessions). Phase 3's brief lists "Study streak" and "Completed sessions" as
   statistics to support; per this codebase's own "never fabricate a new entity, map to the closest
   real one and disclose it" discipline, these are reinterpreted as:
   - **"Study streak" -> Journaling streak**: consecutive calendar days with >= 1 `PUBLISHED`
     `JournalEntry`, computed the same way `ReflectionRuleEngine`'s own `POSITIVE_STREAK`/
     `NEGATIVE_STREAK` rules already compute mood streaks (see `reflection-rules.ts`), generalized
     to "any journal entry" rather than mood-specific. Journaling is this product's real recurring-
     engagement feature; "study" isn't a product concept here.
   - **"Completed sessions" -> Companion conversation count**: real `Conversation` rows created (or
     with >= 1 message) in the window. A "session" maps to a Companion conversation — the only
     session-shaped concept that actually exists in this product.
   Both are labeled honestly in the UI/API using their real names ("Journaling streak", "Companion
   conversations") — never mislabeled as "study" or a fabricated "session" concept.
2. **Reviews are persisted rows, compute-on-read, exactly like Reflection/Insight.** A `Review`
   needs a stable id (`/reviews/:id`), a pin/archive-style lifecycle (`ReviewState`), and export —
   none of that works with a purely-ephemeral, request-scoped computation. `ReviewGenerationService.
   ensureGenerated(userId, window)` upserts by a deterministic `dedupeKey` (window + windowStart),
   the same idempotent-regeneration pattern every prior engine in this codebase uses.
3. **No PDF export.** Confirmed (again) during this audit: no PDF library exists anywhere in this
   repository (`journal-foundation.md`'s own "Export" section already disclosed this for Sprint 4A).
   Adding one now would be new infrastructure for a single export format, not a deterministic-review
   concern — Markdown and JSON are implemented; PDF is disclosed as out of scope, not silently
   dropped.
4. **No semantic ranking of "Highlights" vs "Challenges."** A Reflection/Insight's own `category`
   (already a fixed, real enum) plus its `score`/`priority` (already fixed, documented arithmetic)
   fully determine which Review section it lands in — see Phase 2 for the exact, deterministic
   mapping. No new scoring model, no re-weighting.
5. **Custom window bounds mirror Insight Timeline's own `resolveTimelineRange()`** (`from`/`to`
   both required, `from <= to` validated) — not reinvented.

## Phase 1+ implementation log

Implemented as designed above. See `docs/architecture/review-engine.md` for the full design,
including a real bug found and fixed during manual verification (the journaling streak was anchored
on `windowEnd` — a future date for an in-progress period, so it always read 0 — fixed by anchoring
on `asOf = min(windowEnd, now)` instead) and a DTO validation ordering bug found via the backend e2e
suite (a required-field `class-validator` check on `CustomReviewQueryDto` was short-circuiting
before the more specific `REVIEW_WINDOW_RANGE_REQUIRED` error could ever be reached — fixed by
making the fields `@IsOptional()` and letting `resolveReviewWindow()`'s own check run, mirroring
`InsightTimelineQueryDto`'s own custom-range validation for the same reason).

Two Playwright strict-mode locator bugs were also found and fixed in this sprint's own new spec
(`flow-18-review-engine.spec.ts`) — the same class already disclosed and fixed in `flow-9`/`flow-17`
during the post-Sprint-5A maintenance pass, not a product defect.

Final counts: backend unit (builder 24 + statistics 6 + window 9 + record 11 = 50 new assertions),
backend e2e (13 new, `review.e2e-spec.ts`), frontend (18 new across 5 component test files), 1 new
Playwright flow (`flow-18-review-engine.spec.ts`, 2 tests) passing against live Postgres/Redis/the
real dev servers. `pnpm lint` / `pnpm typecheck` clean on both apps.

## Full verification pass (bug fixes found during DoD confirmation)

Three additional bugs in `flow-18-review-engine.spec.ts` itself (not product code) surfaced only once
the full Definition of Done suite ran repeatedly end-to-end, and are recorded here for completeness:

1. **Missing navigation.** The test asserted on `/reviews` dashboard content without ever calling
   `page.goto('/reviews')` first — it was still on `/journal` from the seeding step. Fixed by adding
   the `goto` before the dashboard assertions.
2. **A second strict-mode collision**, same class as the two already disclosed above:
   `getByText('Journal entries')` (statistics label) collided case-insensitively with the review's own
   overview sentence ("...wrote 114 journal entries..."); fixed with `{ exact: true }`.
3. **Category filter assumed a fixed 'JOURNAL' category.** The shared demo account accumulates other
   Insight data across every prior sprint's e2e runs, so the first `SUPPORTS` evidence link on a given
   run is not guaranteed to be this test's own two-tag journal insight. Fixed by reading the real
   category label directly off the evidence badge and filtering by that (mirrors
   `review.e2e-spec.ts`'s own `anyEvidence.category` pattern, which was already dynamic for the same
   reason).
4. **Archive is one-way** (`review.controller.ts`: "never resurrected by later regeneration"), and the
   "current week" review is one persisted row shared by every run within the same ISO week
   (`dedupeKey` = window + windowStart). A prior run's successful Archive click leaves the button gone
   on every subsequent run that same week. Fixed by only clicking Archive when it is actually visible,
   while still asserting the archived-status filter finds it either way — this exercises the real
   Archive action on a review's first-ever run and degrades gracefully on reruns, rather than hanging
   forever waiting for a button that correctly no longer exists.

A fifth issue was infrastructure, not test code: earlier same-session `EPERM`-driven restarts of
`pnpm --filter @beaconvie/api start:dev` (see Errors item c in the Sprint 5B implementation history)
had left three separate `nest start --watch` processes (and three compiled `dist/src/main` processes)
running simultaneously, all contending for port 4000. That produced an intermittent connection-refused/
flapping API and a runaway "File change detected" restart loop, which in turn caused unrelated,
untouched flows (companion streaming, memory, journal, reflection, insight) to fail on ordinary
navigation/login timeouts in two consecutive full-suite runs. Fixed by killing every stray process and
starting exactly one clean instance; confirmed stable (no restart loop) before re-running.

Separately, a genuinely stray demo-account side effect was found and fixed: an earlier interrupted run
of the pre-existing `flow-3-forgot-reset-password.spec.ts` (unrelated to this sprint) had left the
shared `demo@beaconvie.local` account's password changed to `Demo1234!New` and never reset it back,
which cascaded into every other flow's hardcoded `loginAsDemo('Demo1234!')` failing. Restored via a
one-off script re-hashing the original password with the same `argon2.hash()` call `auth.service.ts`
itself uses, then deleted the script.

After these fixes, `flow-18-review-engine.spec.ts` passed cleanly in isolation (twice) and inside a
full-suite run. The full Playwright suite's remaining, non-Review failures (companion/memory/journal/
reflection/insight flows unrelated to this sprint) trace to auth-rate-limit and shared-demo-account
data-volume exhaustion from this session's own unusually high number of repeated full-suite runs
against the same long-lived dev servers/seed data — not Sprint 5B regressions. Direct API probes
(`/auth/login`, `/auth/register`) both succeeded immediately once each full run finished, and 100% of
the failing spec files are pre-existing flows this sprint never touched. See the Sprint 5B final report
for the full PASS/FAIL breakdown and the recommendation to re-run the suite once, fresh, for a
CI-quality signal outside of this session's accumulated state.
