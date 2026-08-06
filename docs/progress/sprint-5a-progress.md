# Sprint 5A — Insight Experience: Progress / Audit

## Phase 0 audit

### Insight Preparation (Sprint 4C, the entire input surface for this sprint)

`apps/api/src/insight/` (`docs/architecture/insight-preparation.md`) already produces
`InsightCandidate` rows deterministically from `ReflectionCandidate` clusters — this sprint's
mission is explicit: "Transform existing `InsightCandidate` objects into a user-facing Insight
Experience... must NOT generate new insights... consumes only existing deterministic
`InsightCandidate`s." Confirmed during this audit:

- `InsightCandidate`: `category` (7 values, isomorphic to `ReflectionCategory`), `status`
  (`NOT_READY`/`READY`/`INSUFFICIENT_EVIDENCE`/`ARCHIVED`), `window`/`windowStart`/`windowEnd`,
  `ruleExplanation` (plain-language, templated), `priority` (0-100)/`priorityFactors`, `dedupeKey`.
  **No `pinned` field** — Sprint 4C's own schema comment explicitly disclosed this ("Insight
  Candidates have no pinned field — Phase 1 doesn't ask for one"). This sprint's Phase 5 dashboard
  needs a "Pinned" section, which is a real user action on an existing row (the same shape as
  `ReflectionCandidate.pinned`/`Memory.pinned`), not new insight generation — see "Deliberate scope
  decisions" below.
- `InsightEvidence`: one row per real `ReflectionCandidate` cited, FK-linked, with a templated
  `contribution` string. This is the only evidence chain — an `InsightCandidate` never references
  Journal/Memory/Activity/Companion directly.
- `InsightRelationship`: pairwise, structural (`SUPPORTS`/`CONTRADICTS`/`CONTINUES`/`REPEATS`/
  `IMPROVES`/`REGRESSES`/`STAGNATES`), independent of cluster membership.
- Generation is compute-on-read (`InsightGenerationService.ensureGenerated()`), which also owns
  Phase 8 reconciliation: any existing candidate's evidence referencing a since-expired
  `ReflectionCandidate` is stripped and priority/status recomputed on every read. **This means, by
  the time any Sprint 5A surface reads an `InsightCandidate`, its evidence is already guaranteed
  current** — the Insight Experience never needs to re-implement staleness detection, only render
  what's already true.
- Existing API (`InsightController`, `insight-candidates` route): `GET statistics`, `GET` (list),
  `GET :id`, `POST :id/archive`. Existing frontend: `apps/web/features/insight/` at
  `/insights/internal` — deliberately unlisted from nav, an internal verification surface for
  Sprint 4C's own output, explicitly **not** the polished end-user surface ("Sprint 5 owns that").
  This sprint builds the real `/insights` surface; `/insights/internal` is left untouched.

### Reflection Foundation (Sprint 4B) — the evidence chain one level down

`ReflectionCandidate.sources: ReflectionSourceRef[]` cites real `JOURNAL`/`MEMORY`/`ACTIVITY`/
`COMPANION` rows (`sourceType`/`sourceId`/`sourceTimestamp`). The existing
`ReflectionSourceViewer` frontend component (`apps/web/features/reflection/components/`)
establishes the exact evidence-linking precedent this sprint's Phase 3 (Evidence View) follows:
`JOURNAL`/`MEMORY` sources deep-link to their own real detail views (`/journal?item=id`,
`/memory?item=id`); `ACTIVITY`/`COMPANION` sources have no standalone detail view in this product,
so they render as plain, non-clickable evidence rows rather than a link to nowhere. Sprint 5A's
Evidence View reuses this same rule one layer up: an Insight's evidence *is* a `ReflectionCandidate`
(always linkable — `/reflections?item=id` exists for any state), and each of those reflections'
own `ReflectionSourceRef`s resolve to Memory/Journal (linkable) or Activity/Companion (not
linkable) exactly as Reflection's own viewer already established.

`ReflectionValidityService.revalidateForUser()` (called by `InsightGenerationService` before every
generation pass) expires any `ReflectionCandidate` whose cited Memory/Journal source was deleted or
lost consent — combined with Insight's own reconciliation (above), this is why Sprint 5A's Evidence
View can render every `InsightEvidence` row's underlying reflection sources without a second
staleness check of its own: an `InsightCandidate` can never cite an evidence reflection whose own
sources are currently invalid.

### Journal Foundation (Sprint 4A) / Companion + Memory Integration (Sprint 3C)

Confirmed unchanged, read for the deep-link/rendering precedent only: `JournalEntry` has a real
detail view at `/journal?item=id`; Memory has one at `/memory?item=id`; `ActivityEvent` and
`ConversationMessage` (Companion) have no standalone detail view in this product. Sprint 5A adds no
new reads of these tables directly — evidence resolution stays layered through
`ReflectionSourceRef`, consistent with Insight Preparation's own "never re-derive from raw data a
second time" rule.

### Confirmed: no drift since Sprint 4C closure

`git log` head is `547536b`, working tree clean before this sprint's changes. Schema and the
`insight/`/`reflection/` modules match `docs/architecture/insight-preparation.md` and
`docs/architecture/reflection-foundation.md` exactly.

## Deliberate scope decisions (disclosed up front)

1. **Presentation-only, additive schema change.** `InsightCandidate.pinned` (Boolean, default
   false) is added because Phase 5's dashboard needs a real "Pinned" section and pinning is a
   direct user action on an existing row — the same precedent `ReflectionCandidate.pinned`/
   `Memory.pinned` already set. This is not new insight generation: pinning changes no `category`/
   `priority`/`evidence`, only a user-set display flag.
2. **The Renderer (Phase 2) lives on the backend**, as pure functions
   (`insight/presentation/insight-renderer.ts`) mapping an already-persisted `InsightCandidate` (+
   its `evidence`/`relationships`) to `InsightCard`/`InsightEvidenceCard`/`InsightTimelineCard`.
   Every field is copied or deterministically templated from data already on the row (or, for
   evidence, from the cited `ReflectionCandidate`/`ReflectionSourceRef` rows) — never generated
   text. Priority tiers (`LOW`/`MEDIUM`/`HIGH`) reuse this codebase's own existing thresholds (40 =
   the readiness cutoff already in `insight-readiness.util.ts`, 70 = `SINGLETON_MIN_SCORE` already
   in `insight-clustering.util.ts`) rather than inventing new ones.
3. **Evidence View resolves one layer down (Insight -> Reflection -> real source), never re-fetches
   Journal/Memory/Activity directly** — reuses `ReflectionSourceViewer`'s own deep-link/no-link
   rules (see above) so wording and linking behavior can never drift between the two surfaces.
4. **Timeline "topic" grouping** uses each candidate's dominant evidence reflection's own
   `groupKey` (already fetched via the existing `evidence.reflectionCandidate` include, zero extra
   queries) — a real, already-computed structural field, never a new taxonomy or semantic
   clustering.
5. **No new insight generation anywhere.** All Sprint 5A endpoints call
   `InsightGenerationService.ensureGenerated()` (already required for currency, same as every
   Sprint 4C endpoint) and then only read/render/filter/paginate/pin/archive already-materialized
   rows.
6. **`/insights` is not added to the fixed five-item global nav** (`nav-items.ts`'s own documented
   Product Bible constraint — Dashboard/Companion/Journal/Discover/Settings). Follows the same
   precedent Reflection (Sprint 4B) set: reachable from Settings and from a Dashboard entry point,
   not a sixth nav slot.

## Phase 1+ implementation log

Implemented as designed above. See `docs/architecture/insight-experience.md` for the full design,
including a real bug found and fixed during this sprint's own visual verification (Sprint 4C's
`reconcileStaleCandidates()` wasn't persisting the recomputed `ruleExplanation`/`category`/`window`
alongside `status`/`priority`, leaving a reconciled candidate's headline stale relative to its own
evidence count — narrow fix, with a regression test, in `insight-generation.service.ts`).

Final counts: 65 backend test suites / 543 tests passing (53 new), 40 frontend test suites / 196
tests passing (27 new), 1 new Playwright flow (`flow-17-insight-experience.spec.ts`) passing against
live Postgres/Redis/the real dev servers. `pnpm lint` / `pnpm typecheck` clean on both apps.
