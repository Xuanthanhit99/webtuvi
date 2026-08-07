# Goal System & Progress Engine (Sprint 5C)

First-class, deterministic learning and life goals: CRUD, milestones, a deterministic progress
engine, and real evidence citing Memory/Journal/Reflection/Insight/Review rows. Explicitly **not**
AI: no LLM, no coaching, no recommendations, no embeddings, no vector database, no semantic search,
no RAG, no autonomous agents, no predictive analytics. This sprint introduces the **first**
dedicated `Goal` model in this repository — `Memory.type: GOAL/ACHIEVEMENT/CHALLENGE`,
`ReflectionCategory.GOAL`, and `InsightCategory.GOAL` are all untouched; a `Goal` cites them as
evidence, it does not replace or rewrite them.

See `docs/progress/sprint-5c-progress.md` for the Phase 0 audit that preceded this sprint.

## Relationship to prior sprints

- `Goal` is a new, independent entity. It does not migrate, rename, or take over
  `Memory.type: GOAL`/`ACHIEVEMENT`/`CHALLENGE` rows, `ReflectionCategory.GOAL` candidates, or
  `InsightCategory.GOAL` candidates — all four continue to exist exactly as Sprint 4B/4C/5B left
  them.
- Integration is one-directional by design: `GoalDataSourceService` reads real
  Journal/Memory/Reflection/Insight/Review rows as evidence; none of those modules were changed to
  add a reverse `goalId` pointer. See `sprint-5c-progress.md` #10 for the full reasoning.
- Companion is the one module with a genuine two-way touch: a short, read-only, deterministic
  "active goals" line in its system prompt (see "Companion integration" below).

## Domain model (Phase 1)

```
apps/api/src/goal/
  goal.types.ts                 GoalUserData / GoalProgressInput / GoalProgressResult
  goal.mappers.ts                toGoalSummaryDto — the one shape every surface renders
  progress/                      goal-progress.util.ts (pure) + goal-progress-engine.service.ts
  sources/                       GoalDataSourceService — bounded, tag-matched evidence fetch
  record/                        GoalRecordService — CRUD + every explicit lifecycle transition
  milestone/                     GoalMilestoneService — milestone CRUD + manual complete/fail
  relationship/                  GoalRelationshipService — goal-to-goal links
  dto/                           request DTOs (class-validator)
  goal.controller.ts             Phases 2/5/6/7/8 API
  goal.module.ts
```

Migration: `20260807030820_goal_system` (additive only — 11 new enums, 6 new tables; `User` gained
a back-relation only).

### Enums

- **`GoalCategory`**: `LEARNING`/`CAREER`/`HEALTH`/`HABIT`/`RELATIONSHIP`/`FINANCIAL`/`CREATIVE`/
  `PERSONAL`/`OTHER` — a real, user-selected category, not inferred.
- **`GoalType`**: `MILESTONE_BASED`/`METRIC_BASED`/`BINARY` — determines which one fixed,
  documented completion formula `GoalProgressEngine` uses (see "Progress formulas" below). Fixed at
  creation; never changed by `update()` (changing it mid-flight would silently invalidate every
  `GoalProgress`/`GoalEvidence` row already computed).
- **`GoalDifficulty`**: `EASY`/`MEDIUM`/`HARD` — user-selected only, never affects scoring.
- **`GoalStatus`**: `ACTIVE`/`PAUSED`/`COMPLETED`/`ABANDONED`/`ARCHIVED`/`DELETED`. Every
  transition is an explicit user action — see "Status transitions are always explicit" below.
- **`GoalVisibility`**: `PRIVATE`/`COMPANION_VISIBLE` — mirrors Memory's own PRIVATE/
  COMPANION_ALLOWED precedent exactly. Defaults to `PRIVATE`.
- **`GoalMilestoneType`**: `AUTOMATIC`/`MANUAL`.
- **`GoalMilestoneStatus`**: `PENDING`/`COMPLETED`/`FAILED`/`ARCHIVED`.
- **`GoalTrend`**: `NEW`/`IMPROVING`/`STABLE`/`DECLINING` — derived by comparing
  `GoalProgress.completionPercent` against its own `previousCompletionPercent`, never a forecast.
- **`GoalEvidenceSourceType`**: `JOURNAL`/`MEMORY`/`REFLECTION`/`INSIGHT`/`REVIEW`/`ACTIVITY` — real
  source tables only. `ACTIVITY` exists on the enum per the brief's own explicit list, but no
  automatic evidence is ever created from it (no goal-specific `ActivityType` exists in this
  product — disclosed, see "Evidence linking" below).
- **`GoalHistoryAction`**: mirrors `MemoryAuditAction`'s own event-list precedent.
- **`GoalRelationshipType`**: `PARENT_CHILD` (directional) / `RELATED` (symmetric).

### Models

- **`Goal`** — `title`/`description`/`category`/`type`/`difficulty`/`status`/`visibility`/
  `linkedTag`, optional `targetValue`/`targetUnit`/`targetDate` (METRIC_BASED only),
  `previousStatus` (mirrors `JournalEntry.previousState` — set only when transitioning into
  ARCHIVED/DELETED, restore always returns to exactly this state).
- **`GoalMilestone`** — a checkpoint within a Goal. `AUTOMATIC` milestones carry a `targetCount`
  and are recomputed every progress-engine pass; `MANUAL` milestones only change via an explicit
  user action (`complete()`/`fail()`).
- **`GoalProgress`** — the **current, recomputed-in-place** progress snapshot, one row per goal
  (`goalId` unique). Mirrors `Memory.importanceScore`/`importanceFactors`'s own "recompute and
  overwrite, never append" precedent (Sprint 3B) rather than a window-keyed append table — a Goal
  has no natural time window the way a Review does. `previousCompletionPercent`/
  `previousComputedAt` are captured just before being overwritten, which is what makes `GoalTrend`
  derivable without a second history table.
- **`GoalEvidence`** — one row per real Memory/Journal/Reflection/Insight/Review record cited by
  the *current* `GoalProgress` computation. Deleted and recreated fresh on every recompute — the
  same discipline `ReviewGenerationService`/`InsightGenerationService` already use for their own
  evidence tables.
- **`GoalHistory`** — append-only lifecycle event log, mirrors `MemoryAudit`'s own precedent.
  Survives regardless of the Goal's current status.
- **`GoalRelationship`** — a real, explicit, user-created link between two of the caller's own
  Goals.

## Status transitions are always explicit (Phase 2)

Every transition — `pause`/`resume`/`complete`/`abandon`/`archive`/`delete`/`restore` — is its own
named method in `GoalRecordService`, gated by a fixed `ALLOWED_TRANSITIONS` table (never a generic
`setStatus` the client could call with an arbitrary value). Crucially, **reaching 100% completion
never auto-completes a goal** — even for `METRIC_BASED`/`MILESTONE_BASED` goals whose progress has
mathematically reached 100%, the user still calls `POST /goals/:id/complete`. This keeps every
status change attributable to a real action, and avoids a silent side effect where crossing a
threshold changes status without the user asking it to. `archive`/`delete` mirror Journal
Foundation's own reversible-archive + soft-delete precedent (`previousStatus` + `archivedAt`/
`deletedAt`, both restorable via `POST /goals/:id/restore`) — not Memory's harder, privacy-driven
hard delete, since a Goal is the user's own authored planning content, not a consent-gated
extracted fact.

## Evidence linking (Phase 3/4) — tag/category equality only, never semantic

Every `Goal` has a required `linkedTag` — the same real string-tag concept `JournalEntry.tags` and
Reflection's `groupKey` already use (Reflection's own `REPEATED_JOURNAL_THEME` trigger already
matches by tag equality, never semantic similarity — this sprint reuses that exact discipline).
`GoalDataSourceService.fetch()` gathers evidence deterministically:

| Source | Matching rule |
|---|---|
| **JOURNAL** | `PUBLISHED` `JournalEntry` rows whose `tags` array contains `linkedTag`. |
| **MEMORY** | `ACCEPTED` `Memory` rows of type `GOAL`/`ACHIEVEMENT`/`CHALLENGE` whose `title` or `summary` contains `linkedTag` as a case-insensitive **substring** — disclosed explicitly as a substring match, not semantic similarity, the same "heuristic, not semantic" disclosure Reflection's own `GOAL_ACTIVITY_MISMATCH` rule carries. |
| **REFLECTION** | `ReflectionCandidate` rows (`state != EXPIRED`) whose `groupKey` contains `linkedTag`, or whose `category` is `GOAL`. |
| **INSIGHT** | `InsightCandidate` rows (`status IN (READY, ARCHIVED)`, category `GOAL`) evidenced by a matching `ReflectionCandidate` above. |
| **REVIEW** | `ReviewEvidence` rows (category `GOAL`) belonging to a `Review` created after the goal's `startedAt` — cited coarsely (the Review row, not its own already-real underlying evidence a second time) to avoid double-counting the same Insight/Reflection through two paths. |
| **ACTIVITY** | Never produces a `GoalEvidence` row this sprint — no goal-specific `ActivityType` exists in this product (confirmed during this sprint's own audit, the same finding Review Engine's own "Study streak" disclosure already made). |

## Progress formulas (Phase 3) — one fixed formula per `GoalType`, never a weighted model

`progress/goal-progress.util.ts` — pure, deterministic, no AI:

- **`MILESTONE_BASED`**: `completedMilestones / totalMilestones * 100`.
- **`METRIC_BASED`**: `clamp(currentValue / targetValue * 100, 0, 100)`, where `currentValue` is
  the goal's own real evidence count — never an inferred quantity.
- **`BINARY`**: `0` until `status` is explicitly `COMPLETED`, then `100` — no partial credit, since
  a binary goal has no partial-completion concept by definition.

`GoalTrend` compares the freshly-computed `completionPercent` against the *previous* computation's
value: `IMPROVING`/`STABLE`/`DECLINING`, or `NEW` with no prior computation.

Verified by `goal-progress.util.spec.ts` (15 assertions, including a determinism check).

## Milestones (Phase 5)

`AUTOMATIC` milestones carry a real `targetCount` and are recomputed by the exact same
`GoalProgressEngineService` pass that recomputes `GoalProgress` — once the goal's real evidence
count reaches `targetCount`, the milestone transitions to `COMPLETED` deterministically. A
`PENDING` milestone is the only status this can happen from; a `FAILED`/`ARCHIVED` milestone is
never resurrected by a later recompute (same "resolved decisions aren't re-litigated" precedent
every prior engine in this codebase uses). `MANUAL` milestones only ever change via
`POST .../complete` or `POST .../fail`, both of which reject a non-`MANUAL` or non-`PENDING`
milestone — the API structurally cannot let a client force-complete an `AUTOMATIC` milestone.

## Companion integration (Phase 7)

A goal's `linkedTag` and progress **never** reach Companion. Only the titles of the user's own
`ACTIVE`, `COMPANION_VISIBLE` goals are read (bounded to 10, same "never inject an unbounded list"
discipline `MemoryContextAssembler`'s `MAX_MEMORIES_PER_TURN` already applies) — a direct, bounded
Prisma query in `ContextBuilderService` (the same "profile/conversation reads happen directly, no
assembler needed for a plain field list" precedent that service already uses for
`recentActivityLabels`), rendered into the system prompt by `system-prompt.ts` with an explicit
instruction never to invent progress or a plan. `GoalVisibility` defaults to `PRIVATE` — a goal is
never referenced unless the user explicitly opts in (the "Let Companion know about this goal"
checkbox at creation, or toggled later via `PATCH /goals/:id`).

## API

`GoalController` (`@Controller('goals')`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/goals` | list/filter, paginated |
| POST | `/goals` | create |
| GET | `/goals/:id` | detail — recomputes progress first |
| PATCH | `/goals/:id` | update descriptive fields |
| GET | `/goals/:id/history` | lifecycle history |
| POST | `/goals/:id/pause` \| `/resume` \| `/complete` \| `/abandon` \| `/archive` | explicit lifecycle transitions |
| DELETE | `/goals/:id` | soft delete |
| POST | `/goals/:id/restore` | restore from archived/deleted |
| POST | `/goals/:id/milestones` | create a milestone |
| PATCH | `/goals/:id/milestones/:milestoneId` | update descriptive fields |
| POST | `/goals/:id/milestones/:milestoneId/complete` \| `/fail` \| `/archive` | manual milestone transitions |
| GET/POST | `/goals/:id/relationships` | list/create relationships |
| DELETE | `/goals/:id/relationships/:relationshipId` | delete a relationship |

Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every underlying query is
`userId`-scoped.

## Frontend (Phase 6)

`/goals` — list + `?item=<id>` "open detail in place" pattern every other module in this product
already uses (Memory/Insight/Review). No week/month-style quick-entry cards — a Goal has no
calendar-window analog. Detail view: overview, Progress (completion/milestone percentages, trend,
a plain-language factors breakdown), Milestones (create + manual complete/fail), Evidence (deep
links back to the real Journal/Memory/Reflection/Insight/Review record), History, and every
lifecycle action gated to only the transitions the current status allows.

## Security (Phase 8)

- **Ownership**: every route resolves through owner-scoped lookups that 404 identically for
  nonexistent vs. cross-user ids — verified in both unit tests and `goal.e2e-spec.ts`. Milestone
  endpoints check `milestone.goalId !== goalId` *before* trusting `milestoneId`, then separately
  verify `goalId` belongs to the caller — a milestone from one goal can never be paired with a
  different `goalId`.
- **Cross-user evidence isolation**: every query in `GoalDataSourceService` is directly
  `userId`-scoped, including the two relation-joined queries (Insight via
  `insightCandidate: { userId }`, Review via `reviewSection: { review: { userId } }`).
- **Milestone auto-completion trust**: `UpdateMilestoneDto` exposes no `status`/`type`/
  `targetCount` field — a client can never force-complete an `AUTOMATIC` milestone or bypass
  `assertManualPending()`.
- **Mass assignment**: `CreateGoalDto`/`UpdateGoalDto` never expose `status`, `userId`, or any
  computed progress field; every status transition happens only through its own named,
  transition-gated method.
- **No hidden LLM/provider call**: `apps/api/src/goal/` contains no provider/network calls of its
  own.

A dedicated security review of this sprint's code found no high-confidence, exploitable findings.

## Tests (Phase 9)

- **Backend**: `goal-progress.util.spec.ts` (15), `goal-record.service.spec.ts` (14),
  `goal-milestone.service.spec.ts` (8) — 37 unit assertions — plus `goal.e2e-spec.ts` (12 —
  real tag-based evidence gathering, automatic vs. manual milestone completion, full lifecycle,
  CSRF, ownership/cross-user isolation for both goals and relationships) against a real HTTP
  surface and database.
- **Frontend**: `goal-progress-panel.test.tsx`, `goal-evidence-list.test.tsx`, `goal-card.test.tsx`,
  `goal-detail.test.tsx` (13 tests total).
- **Playwright** (`flow-19-goal-system.spec.ts`): creates a real goal via the UI, tags real
  published journal entries with its `linkedTag`, confirms progress/evidence update from that real
  data, adds and completes a manual milestone, and exercises the pause/resume/archive lifecycle.

## Known limitations (disclosed, not hidden)

- **Evidence linking is tag/substring matching, not semantic** — a goal's `linkedTag` must
  actually appear (as a tag, or as a title/summary substring) in the source row; this sprint does
  not attempt to infer relevance any other way, by design (no embeddings, no semantic search).
- **`GoalRelationship` has no automatic detection** — only explicit, user-created links; automatic
  relationship detection would require semantic comparison between goals, out of scope.
- **`ACTIVITY` never produces real `GoalEvidence`** — disclosed above; no goal-specific
  `ActivityType` exists in this product.
- **No calendar-window concept** — unlike Review, a Goal's evidence is gathered from its entire
  lifetime (since `startedAt`), not a rolling or calendar period.
