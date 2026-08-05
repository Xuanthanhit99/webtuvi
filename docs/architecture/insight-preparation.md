# Insight Preparation Engine (Sprint 4C)

Insight Preparation prepares deterministic **Insight Candidates** from existing **Reflection
Candidates** (Sprint 4B). It does not generate user-facing insights, summaries, coaching, or
reports — it prepares the structured evidence a future Sprint 5 will need. Explicitly **not** AI:
no LLM-generated insights, no AI summaries/coaching, no weekly/monthly reports, no
recommendations, no embeddings, no vector database, no semantic search, no RAG, no autonomous
agents, no prompt optimization anywhere in this sprint.

See `docs/progress/sprint-4c-progress.md` for the Phase 0 audit that preceded this sprint.

## Relationship to Reflection Foundation

Insight Preparation is layered **strictly on top of** Reflection Foundation — it reads only
`ReflectionCandidate` rows (and, transitively, the real `ReflectionSourceRef`s and cited `Memory`
rows those already reference), never Journal/Activity/Companion data directly. `InsightGeneration
Service.ensureGenerated()` re-runs Reflection's own regenerate-then-revalidate pass first
(`ReflectionGenerationService.ensureGenerated()` + `ReflectionValidityService.revalidateForUser()`
— the same pair `ReflectionRecordService.ensureFresh()` already calls), so Insight Preparation
never reads a stale or not-yet-generated Reflection layer.

### "Goals" — same precedent as Sprint 4B

There is still no dedicated `Goal` model in this repository. Insight Preparation's `GOAL`
category and "goal relevance" priority factor both derive from `ReflectionCandidate.category ===
'GOAL'` (itself derived from `MemoryType.GOAL`/`ACHIEVEMENT`/`CHALLENGE` — see
reflection-foundation.md) — never a fabricated source.

## Domain model

```
apps/api/src/insight/
  insight.types.ts              InsightUserData / InsightPriorityHints
  insight.mappers.ts             toInsightCandidateDto — the one shape every surface renders
  test-fixtures.ts               shared factories for ReflectionCandidate/ReflectionSourceRef
  sources/                       InsightDataSourceService — bounded ReflectionCandidate fetch
  relationships/                 insight-relationship.util.ts (pure) + InsightRelationshipService
  clustering/                    insight-clustering.util.ts — pure union-find connected components
  priority/                      insight-priority.calculator.ts (pure) + InsightPriorityService
  readiness/                     insight-readiness.util.ts — pure NOT_READY/READY/INSUFFICIENT_EVIDENCE
  generation/                    InsightGenerationService — orchestrates + Phase 8 reconciliation
  record/                        InsightRecordService — list/detail/statistics/archive
  dto/                           query DTOs (class-validator)
  insight.controller.ts          Phase 6 API
  insight.module.ts
```

Prisma migration: `20260805082937_insight_preparation` (additive only — 4 new enums, 3 new
tables; `ReflectionCandidate` gained back-relations only).

### Enums

- **`InsightCategory`**: the same 7 values as `ReflectionCategory` (`GOAL`/`TOPIC`/`JOURNAL`/
  `WELLBEING`/`ALIGNMENT`/`MISMATCH`/`INACTIVITY`) — an insight's category is always the *dominant*
  category among its evidence, never a separately-invented taxonomy.
- **`InsightStatus`**: exactly `NOT_READY`/`READY`/`INSUFFICIENT_EVIDENCE`/`ARCHIVED` — the four
  values this sprint's brief specifies, no fifth `EXPIRED` state (see "Readiness Engine" below for
  why source invalidation doesn't need one).
- **`InsightWindow`**: `DAY`/`WEEK`/`MONTH`/`CUSTOM` — same shape and reasoning as
  `ReflectionWindow`.
- **`InsightRelationshipType`**: `SUPPORTS`/`CONTRADICTS`/`CONTINUES`/`REPEATS`/`IMPROVES`/
  `REGRESSES`/`STAGNATES` — exactly the seven this sprint's brief specifies.

### Models

- **`InsightCandidate`** — `category`, `status`, `window`/`windowStart`/`windowEnd`,
  `ruleExplanation` (plain-language, deterministically templated), `priority`/`priorityFactors`
  (mirrors `ReflectionCandidate.score`/`scoreFactors`), `dedupeKey` (`category:anchorReflectionId`
  — see "Generation" below).
- **`InsightEvidence`** — one row per real `ReflectionCandidate` an `InsightCandidate` cites,
  with a plain-language `contribution` string. Uses a **real Prisma FK** to `ReflectionCandidate`
  (unlike `ReflectionSourceRef`'s plain cross-module string reference) because both models live in
  the same schema and module boundary — there's no cross-module reason to weaken the reference.
- **`InsightRelationship`** — a pairwise edge between two of the caller's own
  `ReflectionCandidate`s, computed by the Relationship Engine, independent of whether it currently
  belongs to a formed cluster (`insightCandidateId` is nullable, `SetNull` on the candidate's
  removal — the edge is a standalone, independently-computed fact).

`InsightPriority` and the confidence/rule explanations are **embedded fields, not separate
tables** — exactly like `ReflectionCandidate.score`/`scoreFactors`, a priority is 1:1 with its
candidate.

## Relationship Engine (Phase 2)

`classifyRelationship(a, b)` (`relationships/insight-relationship.util.ts`, pure) — **no semantic
similarity**: every comparison is structural (`category`/`trigger`/`groupKey`/`score`/`window`/
`state`), against fixed thresholds and a fixed table of "contradicting trigger" pairs.

Two branches, first match wins:

1. **Same `groupKey` and same `trigger`** (the pair is about the *exact same underlying pattern*,
   observed at two points in time):
   - `REPEATS` — the older one is `DISMISSED`/`ARCHIVED` (the pattern returned after being
     resolved).
   - `STAGNATES` — score delta < 8 (the "stagnation band") — persistent, unchanged.
   - `IMPROVES` — score rose by >= 10.
   - `REGRESSES` — score fell by >= 10.
   - `CONTINUES` — none of the above (an ongoing, roughly-stable pattern).
2. **Same `category`, different `groupKey`, within 21 days of each other** (independent evidence
   on the same theme):
   - `CONTRADICTS` — the pair's triggers are a fixed "opposite direction" pair (`POSITIVE_STREAK`/
     `NEGATIVE_STREAK`, `REPEATED_GOAL`/`GOAL_REGRESSION`, `REPEATED_GOAL`/
     `GOAL_ACTIVITY_MISMATCH`).
   - `SUPPORTS` — otherwise.
3. Anything else → no relationship (`null`).

`InsightRelationshipService.detectForUser()` is compute-on-read (no background job — mirrors
`MemoryConflictService`/`MemoryDuplicateService`'s own precedent exactly, including grouping
candidates by category first to bound the pairwise scan, since both branches above require a
category match).

## Clustering

`clusterReflections()` (`clustering/insight-clustering.util.ts`, pure) — a plain union-find over
the relationship graph, restricted to `ReflectionCandidate`s in the current fetched snapshot (an
edge referencing a reflection outside the snapshot, e.g. one that has since expired, is silently
ignored). Every connected component of size >= 2 becomes a cluster. A single, unconnected
reflection becomes its own one-member cluster only if its own `score` meets `SINGLETON_MIN_SCORE`
(70) — a single very strong signal is still worth preparing, mirroring the same judgment
Reflection Foundation's own single-source rules (`LONG_INACTIVITY`, `GOAL_ACTIVITY_MISMATCH`)
already make. No semantic clustering — the relationship graph itself, computed above, is the only
signal.

## Evidence Engine (Phase 3)

Every `InsightCandidate` is created with >= 1 `InsightEvidence` row; `InsightGenerationService`
never creates a candidate with zero evidence — structurally enforced the same way Reflection
Foundation enforces "never fabricate sources": an evidence row can only ever be created from a
`ReflectionCandidate` id already present in the fetched, `userId`-scoped snapshot. Each evidence
row's `contribution` is a deterministic template
(`"${reflection.reason} (score ${score}, observed ${date})."`) — never free-text generation.
`ruleExplanation` on the candidate itself describes which relationships formed the cluster (e.g.
`"3 reflections connected by CONTINUES, REPEATS relationships."`) or, for a singleton, why the
single reflection was strong enough on its own.

## Priority Engine (Phase 4)

`calculateInsightPriority()` (`priority/insight-priority.calculator.ts`, pure) — documented,
weighted arithmetic, mirroring `ReflectionScoreService`'s own style:

| Factor | Weight | Input |
|---|---|---|
| Frequency | +6 per evidence reflection beyond the first, capped at +24 | `evidenceCount` |
| Consistency (strong) | +15 | the cluster contains a `CONTINUES` or `REPEATS` edge |
| Consistency (weak fallback) | +6 | no `CONTINUES`/`REPEATS`, but >= 2 evidence share a category |
| Reflection score | up to +30 | `round(averageReflectionScore * 0.3)` |
| Goal relevance | +15 | the cluster's category is `GOAL`, or any evidence reflection is |
| Activity | +10 | any evidence reflection cites a real `ACTIVITY` source |
| Journal density | +4 per journal-backed evidence, capped at +16 | `journalBackedEvidenceCount` |
| Memory importance | up to +20 | `round(averageMemoryImportance * 0.2)` — only when >= 1 evidence reflection cites a Memory source |

Total clamped to [0, 100]. `explainInsightPriorityFactors()` converts the non-zero factor map into
plain-language sentences ordered by contribution descending — the single source both the API DTO
(`priorityExplanation`) and the frontend use, so wording never drifts. **The frontend never renders
the raw priority number without this array alongside it.**

## Readiness Engine (Phase 5)

`determineInsightReadiness(priority, evidenceCount, maxReflectionScore)` — exactly the four states
this sprint's brief specifies:

```
if evidenceCount === 0        -> NOT_READY
if priority < 40              -> NOT_READY
if evidenceCount < 2
   AND maxReflectionScore < 70 -> INSUFFICIENT_EVIDENCE
else                           -> READY
```

`ARCHIVED` is never computed here — it is set only by an explicit user action
(`POST /insight-candidates/:id/archive`) and, once set, is never recomputed; the generation
service skips an already-archived candidate's `dedupeKey` entirely on every later pass, the same
"never resurrect a resolved decision" precedent `ReflectionGenerationService` already follows.

**No fifth `EXPIRED` state.** Source invalidation (Phase 8) is handled by recomputing readiness
from only the still-valid evidence on every read: `InsightDataSourceService` excludes `EXPIRED`
`ReflectionCandidate`s from the outset, so a cluster that included one naturally excludes it on
regeneration. `InsightGenerationService.reconcileStaleCandidates()` additionally handles the case
where an *existing* candidate's cluster wasn't touched by the current pass (e.g. its only partner
reflection expired, so the pair no longer forms a cluster at all) — it strips the now-invalid
`InsightEvidence` row(s) and recomputes `priority`/`status` from whatever real evidence remains,
falling back to `NOT_READY` if none remains.

## Generation (compute-on-read)

`InsightGenerationService.ensureGenerated(userId)`: refresh Reflection Foundation first → fetch
bounded `ReflectionCandidate`s (`InsightDataSourceService`, excludes `EXPIRED`, 180-day lookback,
200-row bound — same order of magnitude as every prior sprint's own bounds) → detect relationships
→ cluster → for each cluster, compute priority/readiness/rule-explanation → upsert by `dedupeKey`
(`category:anchorReflectionId`, where the anchor is the cluster's **most recently created**
member — stable while cluster membership is unchanged, so regeneration still updates the same row
in place, but deliberately *not* stable when genuinely new evidence joins) → replace the
candidate's `InsightEvidence` rows → link the cluster's `InsightRelationship` edges to the
candidate → reconcile any existing, untouched candidates (Phase 8).

**Why the anchor is the newest member, not the oldest.** An earlier version of this design
anchored on the cluster's oldest (lexicographically-smallest id) member, on the theory that it
would be the most stable choice. Verified via this sprint's own Playwright flow against the
shared demo account's real accumulated history, that choice has a real failure mode: `SUPPORTS`
relationships form between *any* two same-category reflections within 21 days, so a long-lived
account's `JOURNAL`-category history can snowball into one large, ever-growing cluster. Once a
user archives that cluster, any *new* evidence that later joins it transitively (same category,
recent) computes the *same* `dedupeKey` (same old anchor) and collides with the already-archived
row — which `ensureGenerated()` correctly never resurrects, per Phase 5 — silently discarding
genuinely new evidence forever. Anchoring on the newest member instead means new evidence changes
the anchor, which changes the `dedupeKey`, which lets it "roll forward" into a fresh candidate
rather than being trapped behind an old archive decision. See
`docs/progress/sprint-4c-progress.md` for the verification trail.

## API (Phase 6)

`InsightController` (`@Controller('insight-candidates')`) — exactly the four endpoints this
sprint's brief specifies, no more:

| Method | Path | Purpose |
|---|---|---|
| GET | `/insight-candidates/statistics` | counts by status/category, average priority (registered before `:id`) |
| GET | `/insight-candidates` | list/filter/paginate |
| GET | `/insight-candidates/:id` | detail (evidence + relationships + priority explanation) |
| POST | `/insight-candidates/:id/archive` | archive (terminal, never resurrected) |

Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every underlying query is
`userId`-scoped. No feed/timeline/groups/export surfaces this sprint — Insight Preparation is not
a second user-facing product surface, it prepares evidence for Sprint 5.

## Frontend (Phase 7)

`apps/web/features/insight/` — `/insights/internal`: a list (with a status filter) + `?item=<id>`
detail view (evidence, priority explanation, relationships, timeline window), matching the
established Memory/Journal/Reflection "open detail in place" pattern. **Deliberately not linked
from global nav or Settings** — reachable only by direct URL, an internal-facing view of Insight
Preparation's output, not a polished end-user surface (Sprint 5 owns that). No "create" action:
candidates are only ever generated deterministically. No AI wording anywhere in the copy.

## Privacy / Security (Phase 8)

- **Ownership**: every `InsightCandidate`/`InsightRelationship` query is `userId`-scoped;
  `findOwned()` (via `InsightRecordService`) 404s identically for cross-user access and
  non-existence.
- **Consent**: inherited transitively — `InsightDataSourceService` only ever reads
  `ReflectionCandidate`s, which Reflection Foundation itself already consent-filters (both at
  generation and revalidation time, including Memory consent re-checks). Insight Preparation adds
  no separate consent gate, and re-runs Reflection's own freshness pass first so it can never read
  a stale consent decision.
- **Deleted/expired source invalidation**: see "Readiness Engine" and
  `reconcileStaleCandidates()` above — a candidate citing an expired Reflection Candidate loses
  that evidence and has its priority/status recomputed on the very next read, never left stale.
- **Cross-user isolation**: every service method takes `userId` and scopes every Prisma query by
  it; `InsightRelationship` rows are also `userId`-scoped directly (not only reachable via a
  candidate).
- **Stale references**: `dedupeKey`'s per-user uniqueness constraint prevents a regenerated
  cluster from ever creating a duplicate row for the same anchor; an archived candidate is never
  resurrected.
- **CSRF**: the one mutating route (`POST /insight-candidates/:id/archive`) sits behind the
  project-wide `CsrfGuard`.

## Observability

Structured, content-free `Logger` calls only (reflection/cluster/created/updated counts,
relationship counts, generation latency) — mirroring Reflection Foundation's own precedent.
**Never logged**: any `ruleExplanation`, `contribution`, or relationship `reason` text.

## Known limitations (disclosed, not hidden)

- **Bounded, not exhaustive**: 180-day lookback, 200-reflection bound, same order of magnitude as
  every prior sprint's own disclosed bounds.
- **Clustering is a plain connected-components graph**, not a weighted/ranked one — a cluster with
  one weak edge and many strong ones is treated identically to a cluster held together by that one
  weak edge.
- **The 21-day cross-groupKey relation window and the contradicting-trigger-pair table are fixed,
  hand-authored heuristics**, not exhaustive — a real contradiction outside that table (or outside
  21 days) will not be classified as `CONTRADICTS`/`SUPPORTS`.
- **Memory importance is dropped (not re-derived) during stale-candidate reconciliation** — a
  conservative, never-overstated approximation rather than an extra fetch on every reconciliation
  pass.
- **No restore for archived candidates** — mirrors Reflection Foundation's own choice for the same
  reason: nothing here has editable content to "come back to."
