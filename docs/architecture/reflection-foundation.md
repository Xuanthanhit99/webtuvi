# Reflection Foundation (Sprint 4B)

Reflection Foundation builds BeaconVie's deterministic Reflection layer: a rule engine that turns
existing user-owned data (Journal, Memory, Activity, Companion) into **Reflection Candidates** —
never AI-generated. Explicitly **not** AI: no LLM-generated reflections, no AI summaries, no AI
coaching, no weekly/monthly reports, no mood/habit prediction, no embeddings, no pgvector, no
vector database, no semantic search, no RAG, no knowledge graph, no autonomous agents anywhere in
this sprint. Every rule, grouping key, and score weight below is fixed, documented, arithmetic —
reproducible and inspectable, per the same "always explain" discipline Memory Intelligence
(Sprint 3B) established.

See `docs/progress/sprint-4b-progress.md` for the Phase 0 audit that preceded this sprint,
including the "Goals" data-source reconciliation below.

## Relationship to prior sprints

Reflection Foundation is architecturally the same *shape* of problem Memory Foundation (3A) and
Memory Intelligence (3B) already solved — deterministic decisions over existing data, always
explained, always tracing to real sources — and reuses their patterns and, in one case, their
code directly:

- Ownership: `findOwned()` returns an identical 404 for "doesn't exist" and "belongs to someone
  else," same as Memory/Journal.
- Text similarity: `GoalRegressionRule` doesn't reimplement contradiction detection — it calls
  Sprint 3B's own `MemoryConflictService.detectForUser()` and interprets goal-related `CONFLICT`
  rows as regression evidence. `RepeatedTopicRule`/`RepeatedGoalRule`/`MemoryJournalAlignmentRule`/
  `GoalActivityMismatchRule` reuse Memory Intelligence's shared, pure text-normalization utility
  (`memory/shared/text-normalization.util.ts`: `significantTokens`/`jaccardSimilarity`) rather than
  reimplementing tokenization.
- Compute-on-read, no background job: exactly like `MemoryDuplicateService`/
  `MemoryMergeSuggestionService`, `ReflectionGenerationService.ensureGenerated()` runs
  synchronously inside every read endpoint, upserting candidates — no queue, no cron.

### "Goals" data source

This repository has **no dedicated `Goal` model** (confirmed during this sprint's Phase 0 audit —
no `apps/api/src/goals` module, no `Goal` table in `schema.prisma`). Memory Intelligence already
treats `MemoryType` `GOAL`/`ACHIEVEMENT`/`CHALLENGE` as "goal-relation" memories for its importance
algorithm; this sprint follows that same precedent rather than fabricating a new entity. Every
"goal" a rule below reasons about is a real `Memory` row of one of those three types — never a
fabricated source type.

## Domain model

```
apps/api/src/reflection/
  reflection.types.ts              ReflectionUserData / ReflectionRuleFinding / score-hint types
  reflection.mappers.ts            toReflectionCandidateDto — the one shape every surface renders
  test-fixtures.ts                 shared factories for JournalEntry/Memory/ActivityEvent/etc.
  sources/                         ReflectionDataSourceService — Phase 2 bounded data fetch
  rules/                           reflection-rules.ts (9 pure rules) + ReflectionRuleEngine
  scoring/                         reflection-score.calculator.ts (pure) + ReflectionScoreService
  generation/                      ReflectionGenerationService — orchestrates fetch->rules->score->persist
  validity/                        ReflectionValidityService — Phase 11 source revalidation
  record/                          ReflectionRecordService — list/feed/timeline/groups/statistics/archive/dismiss
  hint/                            ReflectionHintService — Companion's one read-only surface
  dto/                             query DTOs (class-validator)
  reflection.controller.ts         Phase 8 API
  reflection.module.ts
apps/api/src/companion/reflection/
  companion-reflection.controller.ts   GET /companion/reflection-hint
```

Prisma migration: `20260805013035_reflection_foundation` (additive only — no existing table
touched).

### Enums

- **`ReflectionCategory`**: `GOAL` / `TOPIC` / `JOURNAL` / `WELLBEING` / `ALIGNMENT` / `MISMATCH` /
  `INACTIVITY` — the life area a candidate is about; drives Phase 4 grouping and feed/timeline
  filtering.
- **`ReflectionTrigger`**: one value per rule (see "Rule Engine" below) — a candidate's `trigger`
  says exactly which deterministic rule produced it.
- **`ReflectionState`**: `NEW` / `READY` / `DISMISSED` / `ARCHIVED` / `EXPIRED`. `NEW` is reserved
  on the shared enum for forward-compatibility with the literal spec — mirroring `MemoryStatus`'s
  own disclosed "values that exist for forward-compatibility, not assigned this sprint" precedent
  (memory-engine.md). In practice a candidate is created directly as `READY`: rule execution and
  scoring are synchronous, so there is no window where a "not yet scored" holding state is needed.
  `DISMISSED`/`ARCHIVED` are explicit user actions; `EXPIRED` is the one state a candidate can
  reach without any user action, when a cited source becomes invalid (Phase 11).
- **`ReflectionWindow`**: `DAY` / `WEEK` / `MONTH` / `CUSTOM` — the time span the rule's evidence
  spans, computed once at generation. Distinct from the Timeline's own read-time Today/This
  week/Last week/Last month grouping (`bucketFor()`, computed live from `createdAt`, the same
  pattern `groupFor()` uses in Memory's timeline).
- **`ReflectionVisibility`**: `PRIVATE` / `COMPANION_VISIBLE` (default). Mirrors Memory's
  `PRIVATE`/`COMPANION_ALLOWED` precedent — gates whether Companion's hint (Phase 10) may notice
  this candidate exists. Never gates the owner's own access; every candidate is fully visible to
  its owner in `/reflections` regardless of this value.
- **`ReflectionSourceType`**: `JOURNAL` / `MEMORY` / `ACTIVITY` / `COMPANION` — real source tables
  only. There is no `GOAL` value; see "Goals data source" above.

### Models

- **`ReflectionCandidate`** — `category`, `trigger`, `state`, `window`/`windowStart`/`windowEnd`,
  `reason` (plain-language, deterministically templated), `score`/`scoreFactors` (mirrors
  `Memory.importanceScore`/`importanceFactors`), `groupKey` (deterministic grouping string, see
  "Grouping"), `visibility`, `pinned`, `dedupeKey` (unique per user — see "Generation").
- **`ReflectionSourceRef`** — one row per real source record a candidate cites
  (`sourceType`/`sourceId`/`sourceTimestamp`, plain unenforced references across modules, same
  reasoning as `Memory.sourceConversationId`). This is the one place a join table is justified in
  this sprint: "never fabricate sources" requires an auditable, queryable list of exactly which
  real rows backed a candidate, and one candidate can cite more than one source.

`ReflectionReason` and `ReflectionScore` are **not** separate tables — they're embedded fields
(`reason`, `score`/`scoreFactors`) on `ReflectionCandidate`, exactly like `Memory.importanceScore`/
`importanceFactors` — a reason/score is 1:1 with its candidate, never independently queried.
`ReflectionGroup` is **not** a membership join table — `groupKey` is a computed, deterministic
string; `GET /reflections/groups` aggregates in application code by that key, mirroring Journal's
own "tags are a `String[]`, not a join table" precedent of avoiding a relation the read pattern
doesn't need.

## Data sources (Phase 2)

`ReflectionDataSourceService.fetch(userId)` returns one bounded, consistent `ReflectionUserData`
snapshot every rule sees:

- **Journal**: `state: 'PUBLISHED'` entries only — a `DRAFT` is unfinished work, not something the
  user has actually said yet.
- **Memory**: `status: 'ACCEPTED'` only (mirrors `MemoryRetrievalService`'s own hard exclusion).
  `goalMemories` is a filtered view (`type` in `GOAL`/`ACHIEVEMENT`/`CHALLENGE`) — not a separate
  fetch.
- **Activity**: `ActivityEvent` rows, unfiltered by type.
- **Companion**: `ConversationMessage` rows with `role: 'USER'` only — never an assistant reply.
- **Goal conflicts**: `MemoryConflictService.detectForUser()` (Sprint 3B, reused), filtered to
  `status: 'CONFLICT'` pairs where both memories are goal-related.

All five are bounded to a 180-day lookback and a fixed row cap (500 memories, 300 each of
journals/activity/companion messages — same order of magnitude as Memory Intelligence's own 200/
500 bounds) to keep generation a fixed-cost read. See "Known limitations."

## Rule Engine (Phase 3)

`ReflectionRuleEngine.run(data)` calls all nine pure rule functions
(`rules/reflection-rules.ts`) and concatenates their findings; a rule that throws is logged and
skipped, never taking down the others. Every rule returns zero or more
`ReflectionRuleFinding`s, each carrying its own `reason` (the "why it fired" sentence) and
`sources` (real, already-fetched records — never fabricated).

| Trigger | Category | Fires when | Cites |
|---|---|---|---|
| `REPEATED_TOPIC` | `TOPIC` | >= 3 journal entries/memories share >= 30% significant-token overlap | all clustered items |
| `REPEATED_GOAL` | `GOAL` | >= 2 goal-related memories share >= 50% significant-token overlap | the goal memories |
| `LONG_INACTIVITY` | `INACTIVITY` | the most recent signal across every source is >= 10 days old | that one most-recent signal |
| `GOAL_REGRESSION` | `GOAL` | an existing Sprint 3B `MemoryConflict` (status `CONFLICT`) links two goal-related memories | both memories |
| `POSITIVE_STREAK` | `WELLBEING` | >= 3 consecutive calendar days of `GREAT`/`GOOD` journal mood | the streak's journal entries |
| `NEGATIVE_STREAK` | `WELLBEING` | >= 3 consecutive calendar days of `LOW`/`DIFFICULT` journal mood | the streak's journal entries |
| `REPEATED_JOURNAL_THEME` | `JOURNAL` | the same tag appears on >= 3 journal entries | those journal entries |
| `MEMORY_JOURNAL_ALIGNMENT` | `ALIGNMENT` | a memory and journal entry within 7 days share >= 30% token overlap | the memory + the journal entry |
| `GOAL_ACTIVITY_MISMATCH` | `MISMATCH` | a goal-related memory is >= 14 days old with no matching journal/Companion signal in the last 14 days | the goal memory only — absence of evidence is never represented by a fabricated source |

All thresholds are fixed constants documented at the top of `reflection-rules.ts`. Clustering
(topic/goal rules) is a simple, deterministic "compare each new item to its cluster's first
member" pass — order-dependent on fetch order (itself deterministic, `createdAt desc`), never a
semantic/embedding clustering.

## Grouping (Phase 4)

No semantic clustering. Each rule computes its own deterministic `groupKey` string at the moment
it fires (e.g. `TOPIC:<token>:<anchorId>`, `GOAL:<memoryId>`, `JOURNAL:tag:<tag>`,
`INACTIVITY:<userId>`, `ALIGNMENT:<memoryId>:<journalId>`, `MISMATCH:<memoryId>`,
`GOAL:conflict:<conflictId>`). `GET /reflections/groups` aggregates active (`NEW`/`READY`)
candidates by this key in application code — count, average score, top score, and the latest
candidate's full DTO — never a second query shape that could drift from `list()`.

## Scoring (Phase 5)

`ReflectionScoreService`/`reflection-score.calculator.ts` — pure arithmetic, documented weights,
mirroring `MemoryImportanceCalculator`'s own table style:

| Factor | Weight | Input |
|---|---|---|
| Frequency | +6 per source beyond the first, capped at +24 | `sourceCount` |
| Recency | up to +20, -2 per day since the evidence window ended, floor 0 | `daysSinceWindowEnd` |
| Importance | up to +20 | `round(avg cited Memory.importanceScore * 0.2)` |
| Goal relevance | +15 | the finding's evidence involves a goal-related memory |
| Journal density | +4 per distinct journal source, capped at +16 | `journalSourceCount` |
| Activity | +10 | an `ActivityEvent` is among the cited sources |
| Manual pin | floors the total at 70 (never lowers an already-higher score) | `pinned === true` |

Total is clamped to [0, 100]. `explainReflectionScoreFactors()` converts the non-zero factor map
into plain-language sentences ordered by contribution descending — the single source both the API
DTO (`scoreExplanation`) and the frontend (`ReflectionScoreExplanation`) use, so wording never
drifts between surfaces. **The frontend never renders the raw score without this array alongside
it.**

## Generation (compute-on-read)

`ReflectionGenerationService.ensureGenerated(userId)` runs on every read endpoint: fetch data ->
run rules -> score -> upsert. `dedupeKey` (`trigger:groupKey:windowStart`) makes this idempotent
and — critically — **never resurrects a `DISMISSED`/`ARCHIVED`/`EXPIRED` candidate** for the same
fingerprint, mirroring `MemoryDuplicateService`'s own "never resurrects a pair the user already
resolved" policy.

One additional, disclosed step: `LONG_INACTIVITY` describes a *current* state (an ongoing gap),
not a fixed historical fact the way every other trigger does. If a fresh pass no longer finds that
rule firing (the user became active again), any previously open (`NEW`/`READY`) `LONG_INACTIVITY`
candidate is transitioned to `EXPIRED` — the gap it asserted has genuinely ended. No other trigger
gets this treatment; a `REPEATED_TOPIC` from three weeks ago stays a true historical fact even
after the topic stops recurring.

## Timeline (Phase 6)

`GET /reflections/timeline` — Today/This week/Last week/Last month/Earlier, computed live from
`createdAt` (`bucketFor()`, same pattern as Memory's `groupFor()`), or a custom `from`/`to` range.
Sort: `score` / `recency` / `category`. Excludes only `EXPIRED` by default — unlike the Feed,
resolved (`DISMISSED`/`ARCHIVED`) candidates stay visible here, so a user can see what they
previously acted on.

## Feed (Phase 7)

`GET /reflections/feed` — only `READY` candidates, ranked by score descending then recency. Every
item shows the Reflection Candidate, its `reason`, its `sources` (evidence), and its `score` +
`scoreExplanation`. No AI wording anywhere in the DTO or the frontend copy — `ReflectionHome`'s own
subhead states this explicitly ("never AI-generated, never a guess at how you feel"). The system
never claims to understand emotions; mood-related rules (`POSITIVE_STREAK`/`NEGATIVE_STREAK`) only
ever restate the user's own self-selected `JournalMood` values back to them.

## API (Phase 8)

`ReflectionController` (`@Controller('reflections')`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/reflections/timeline` | grouped timeline (registered before `:id`, same footgun Memory/Journal document) |
| GET | `/reflections/feed` | active candidates ranked by score |
| GET | `/reflections/groups` | deterministic grouping |
| GET | `/reflections/statistics` | counts by state/category/trigger, dismissal/archive rates |
| GET | `/reflections` | list/filter/paginate |
| GET | `/reflections/:id` | detail (sources + score explanation) |
| POST | `/reflections/:id/archive` | archive (reversible in the sense the record stays visible in Timeline; not "restorable" the way Memory's `archive()` is — there is no `restore()` this sprint, since Reflection has no editable content to return to) |
| POST | `/reflections/:id/dismiss` | dismiss |

Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every underlying query is
`userId`-scoped. `CompanionReflectionController` (`GET /companion/reflection-hint`) is the one
additional, narrow endpoint Phase 10 needs — see "Companion integration."

## Frontend (Phase 9)

`apps/web/features/reflection/`:

- `reflection-home.tsx` — `/reflections`'s shell: Feed/Timeline/Groups section switcher plus the
  same `?item=<id>` "open detail in place" pattern `MemoryView`/`JournalHome` already use.
- `reflection-feed.tsx`, `reflection-timeline.tsx`, `reflection-groups.tsx` — loading (`Skeleton`),
  empty (`EmptyState`), and error (`ErrorState` with retry) states throughout, matching the
  established Memory/Journal component discipline.
- `reflection-detail.tsx` — reason, category/trigger/state badges, `ReflectionScoreExplanation`,
  `ReflectionSourceViewer`, and Dismiss/Archive actions (hidden once already resolved).
- `reflection-score-explanation.tsx` — never renders the bare number.
- `reflection-source-viewer.tsx` — renders exactly the cited sources; `MEMORY`/`JOURNAL` sources
  deep-link to their own real detail view (`/memory?item=id` / `/journal?item=id`);
  `ACTIVITY`/`COMPANION` sources (no standalone detail view in this product) render as plain,
  non-clickable evidence rows rather than a link to nowhere.

No global-nav entry was added — `docs/architecture` and `nav-items.ts`'s own comment document the
Product Bible's fixed five-destination IA (Dashboard/Companion/Journal/Discover/Settings), the
same reasoning Memory (Sprint 3A) already followed by staying reachable from Settings/Dashboard/
Companion instead. `/reflections` is reachable from Settings ("View my reflections") and from
Companion's reflection hint banner.

There is deliberately no "create" action anywhere in this UI — candidates are only ever generated
deterministically from data the user already owns; there is nothing for a user to directly author
here (unlike Memory's `RememberThisButton` or Journal's own editor).

## Companion integration (Phase 10)

Companion may say exactly one fixed sentence — **"You may want to reflect on this."** — rendered
by `ReflectionHintBanner` only when `GET /companion/reflection-hint` reports a real, currently
`READY`, `COMPANION_VISIBLE` candidate exists. `ReflectionHintService.getHint()` returns only
`{ available, reflectionId, category }` — never the candidate's `reason`, `sources`, or
`scoreExplanation`; those are only ever fetched once the user clicks through to `/reflections`
themselves. Companion never generates a reflection on demand, never fabricates one, never
summarizes, never coaches.

**Deliberate scope decision**: this is a standalone, narrow read endpoint, not a change to
`ConversationService.sendMessage()`'s existing three-detector pipeline (crisis, memory-suggestion,
forget-intent) plus journal-suggestion. That pipeline's response shape is exercised by a large
existing test surface across Sprint 2B/3C/4A; Phase 10's actual requirement — "say this fixed
sentence when a candidate exists" — has no message-content detection component (there is nothing
to detect in the user's text; existence of a `READY` candidate is the only condition), so a
separate endpoint satisfies the requirement without touching the higher-risk streaming pipeline.

## Privacy (Phase 11)

Reflection inherits ownership/consent/visibility/deletion from its sources rather than
reimplementing any of it:

- **Ownership**: every `ReflectionCandidate` is `userId`-scoped; `findOwned()` 404s identically for
  "doesn't exist" and "belongs to someone else."
- **Deletion propagation**: `ReflectionValidityService.revalidateForUser()` runs before every read,
  checking every `NEW`/`READY` candidate's cited `MEMORY`/`JOURNAL` sources against current data —
  a hard-deleted `Memory` row (missing entirely) or a soft-deleted `JournalEntry`
  (`state: 'DELETED'`) transitions the candidate to `EXPIRED`. `ACTIVITY`/`COMPANION` sources have
  no deletion pathway in this codebase today, so nothing is checked for them — asserting a
  guarantee the schema doesn't need yet would be dead code, not defense-in-depth.
- **Consent revocation propagation** (added during Sprint 4B release closure, Step 5): both
  `ReflectionDataSourceService.fetch()` and `ReflectionValidityService.revalidateForUser()`
  re-check `MemoryConsentService.canAccept()` for every distinct `MemoryType` present — the exact
  per-distinct-type pattern `MemoryRetrievalService.filterByCurrentConsent()` already uses for
  Companion context assembly. A memory whose type has since been set to `DENY_TYPE`/`DISABLED` (or,
  for `HEALTH`, lost its explicit `ALLOW_TYPE`) can never seed a *new* Reflection finding, and any
  *existing* `NEW`/`READY` candidate still citing it is expired on the next read — the same
  disclosed distinction Memory Intelligence already draws ("existing memory stays visible to its
  owner, this decision layer won't surface it").
- **Already-resolved candidates are not revalidated** — once `DISMISSED`/`ARCHIVED`, a candidate's
  state is only ever a record of what the user decided, not re-litigated by later data changes.
- **Archive/dismiss are terminal** — there is no `restore()` this sprint (unlike Memory's own
  archive/restore pair) because a reflection has no editable content to "come back to"; the record
  simply stays visible in Timeline.

## Observability (Phase 12)

Structured, content-free `Logger` calls only (candidate counts, created/updated counts, rule
trigger names, generation latency, expiry counts) — mirroring Journal Foundation's own precedent
of "Logger-only observability, no new persisted metrics table" (Journal never fed a live prompt
either, unlike Memory's `MemoryRetrievalLog`, which exists specifically because retrieval feeds
Companion on every turn — Reflection's hint endpoint returns only a boolean + id, not a ranked
result worth its own durable table this sprint). **Never logged**: journal content, memory
content, conversation content, or any candidate's `reason`/`scoreFactors` text — grepped every
`Logger.*` call site under `reflection/` at review time.

## Security (Phase 13)

- **IDOR**: every `ReflectionCandidate` query in `ReflectionRecordService` is `userId`-scoped;
  `findOwned()` 404s identically for cross-user access and non-existence.
- **Consent**: Reflection reads no user-authored content directly into anything user-facing beyond
  what the source record itself already exposes to its owner — a candidate's `reason` never quotes
  raw journal/memory/message text, only plain-language templates referencing counts, tags, and
  titles the same owner already sees elsewhere.
- **Deleted source handling**: covered under Privacy above — verified in both unit tests
  (`reflection-validity.service.spec.ts`) and a full-stack Playwright flow (delete a source journal
  entry -> revisit the candidate -> `EXPIRED`).
- **Stale references**: `dedupeKey`'s uniqueness constraint prevents a regenerated finding from
  ever creating a second row for the same rule+group+window; a resolved or expired row is never
  silently reactivated.
- **Cross-user access**: no endpoint accepts a raw `userId`; every read is scoped from
  `@CurrentUser()`.
- **CSRF**: all mutating routes (`POST /reflections/:id/archive|dismiss`) sit behind the
  project-wide `CsrfGuard` — no per-route opt-out.
- **Rule abuse**: rules are pure, read-only functions over already-fetched data — there is no
  user-controllable input that reaches a rule directly (all inputs are the user's own, already
  ownership-checked, database rows).

## Tests (Phase 14)

- **Backend unit** (51 new, part of the full 441/441 suite): `reflection-rules.spec.ts` (all nine
  rules, including "never fabricates a source" assertions), `reflection-score.calculator.spec.ts`
  (every weight, the pin floor, clamping), `reflection-record.service.spec.ts` (ownership,
  archive/dismiss idempotency, list/feed/timeline/groups/statistics), `reflection-generation.
  service.spec.ts` (create/update-in-place/never-resurrect/currency-sensitive-expiry),
  `reflection-validity.service.spec.ts` (Memory hard-delete, Journal soft-delete, no-op for
  Activity/Companion sources).
- **Frontend** (13 new, part of the full 169/169 suite): `reflection-feed.test.tsx`,
  `reflection-detail.test.tsx` (dismiss/archive/resolved-state rendering),
  `reflection-score-explanation.test.tsx`, `reflection-hint-banner.test.tsx` (never renders before
  data loads, never fabricates a nudge).
- **Playwright** (`flow-15-reflection-foundation.spec.ts`, 2 tests, run against live
  Postgres/Redis/the real dev servers): Journal -> `REPEATED_JOURNAL_THEME` candidate -> Feed ->
  Dismiss -> Archive -> Timeline (verifying both resolved states render correctly there), plus a
  second test for Phase 11: deleting one of three cited journal entries expires the still-active
  candidate and removes it from the Feed.

## Known limitations (disclosed, not hidden)

- **Bounded, not exhaustive**: 180-day lookback, capped row counts per source (mirrors Memory
  Intelligence's own disclosed O(n²)/bounded-scan limitations). A user with far more data than
  these bounds would not have every possible pattern surfaced — a smarter candidate-generation
  step (still deterministic) would be needed at much larger scale.
- **Clustering is order-dependent-but-deterministic**, not globally optimal — the "compare to the
  cluster's first member only" approach (shared with the spirit of Memory's own duplicate
  detection) can occasionally miss a valid three-way cluster where item A and C are similar but
  neither is similar enough to whichever item became the cluster anchor first.
- **`GOAL_ACTIVITY_MISMATCH`'s absence-of-evidence check is a token-overlap heuristic**, not
  language understanding — a goal genuinely being worked on in ways that don't share vocabulary
  with its own memory text could still surface a mismatch candidate.
- **No restore for archived/dismissed reflections** — a deliberate difference from Memory, see
  "Privacy" above; disclosed, not an oversight.
