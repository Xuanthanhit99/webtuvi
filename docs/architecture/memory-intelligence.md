# Memory Intelligence (Sprint 3B)

Turns Memory Foundation (Sprint 3A) from a storage layer into a deterministic decision layer:
importance scoring, duplicate detection, conflict detection, merge suggestions, a retrieval
policy, ranking, and context token budgeting. Explicitly **not** semantic: no embeddings, no
vector database, no Pinecone/Chroma/Qdrant/Weaviate, no LangChain memory, no RAG, no knowledge
graph, no LLM-based extraction or decisions anywhere in this sprint. Every algorithm below is
plain arithmetic and string matching over fields already in the `Memory` row — reproducible,
inspectable, and (per the Product Bible's "always explain" creed) always shown to the user with
its reasoning, never as a bare number or an unexplained flag.

This document assumes docs/architecture/memory-engine.md's schema/consent/candidate-lifecycle
design (Sprint 3A) and only covers what's new. See docs/progress/sprint-3b-progress.md for the
audit that preceded this sprint and the environment constraints under which it was built.

## Module layout

```
apps/api/src/memory/
  shared/text-normalization.util.ts   normalizeText/tokenize/jaccardSimilarity/deepEqualJson — shared by importance/duplicate/conflict
  importance/                         MemoryImportanceCalculator (pure) + ImportanceScoringService (persists)
  duplicate/                          classifyDuplicate (pure) + MemoryDuplicateService (persists MemoryDuplicate)
  conflict/                           classifyConflict (pure) + MemoryConflictService (persists MemoryConflict)
  merge/                              MemoryMergeSuggestionService (generates/accepts/rejects MemoryMergeSuggestion)
  retrieval/                          memory-ranking.util.ts (pure) + MemoryRetrievalService (policy + budget + persistence)
  budget/                             ContextBudgetService (token estimation + budgeting)
  evaluation/                         MemoryEvaluationService + fixtures + run-evaluation.ts CLI script
  intelligence/                       MemoryIntelligenceController (Phase 9 endpoints)
```

## Domain model additions

On `Memory`: `importanceScore` (Int, 0-100, default 0), `importanceFactors` (Json, the weighted
breakdown), `pinned` (Boolean, the one direct-user-action input), `referencedCount` (Int, bumped
by retrieval selection). `lastReferencedAt` (declared in Sprint 3A, unused until now) is bumped
by the same retrieval selection.

New models: `MemoryDuplicate` (pairwise, `matchType`/`similarity`/`status`), `MemoryConflict`
(pairwise, `status: CONFLICT | SUPERSEDED` — see "Conflict policy" for why there is no third
"resolved" status this sprint), `MemoryMergeSuggestion` (pairwise, `confidence`/`reason`/
`status: PENDING | ACCEPTED | REJECTED`), `MemoryRetrievalLog` (observability only — structural
counts and latency, never memory content or even memory ids).

## Importance algorithm

`MemoryImportanceCalculator.calculate()` (pure, `apps/api/src/memory/importance/memory-importance.calculator.ts`)
sums a fixed set of weights, then clamps to \[0, 100\]:

| Factor | Weight | Trigger |
|---|---|---|
| Manual pin | +35 | `memory.pinned === true` |
| Explicit user emphasis | +15 | `sourceType === 'USER_EXPLICIT'` or `structuredPayload.emphasis === true` |
| Future relevance | +12 | `type` is `GOAL`/`DECISION`, or `structuredPayload.futureRelevance === true` |
| Recurrence | +4 per reinforcing memory, capped at +16 | count of other ACCEPTED memories of the same `type` whose significant-token Jaccard overlap with this one is ≥ 0.3 |
| Goal relation | +10 | `type` is `GOAL`/`ACHIEVEMENT`/`CHALLENGE` |
| Preference relation | +6 | `type` is `PREFERENCE`/`INTEREST`/`LOCATION_PREFERENCE` |
| Life event | +14 | `type === 'IMPORTANT_EVENT'` |
| Long-term usefulness | +10 | `type` is `IDENTITY`/`RELATIONSHIP`/`HABIT`/`ROUTINE`/`WORK`/`STUDY`/`PET` |
| Recency | up to +10, −1 per 15-day period since `lastReferencedAt ?? createdAt`, floor 0 | always |
| User-created vs. imported | +8 | `sourceType` is `USER_EXPLICIT`/`COMPANION`/`ONBOARDING` (not `MIGRATED_LEGACY`/`SYSTEM_TEST`) |

**A pinned memory is floored at 80** regardless of its other factors (but can still exceed 80 if
other factors push it higher) — pinning is the one direct user action in this algorithm and must
never be silently out-ranked by inference. All other factors are additive with no floor.

`explainImportanceFactors()` converts the non-zero factor map into plain-language sentences,
ordered by weighted contribution descending — this is the single source both
`ImportanceScoringService` (persisted `MemoryDto.importanceExplanations`) and
`MemoryRetrievalService` (recommendation `whyRecommended`) use, so the wording never drifts
between surfaces. **The frontend never renders the raw score without this array alongside it**
(`ImportanceBadge` — see "Frontend").

`ImportanceScoringService.recompute()`/`recomputeAllForUser()` persist the score; recurrence is
computed by scanning the user's other ACCEPTED memories (bounded to 500, see "Known
limitations"). Recomputation is on-demand (called by the recommendation endpoint's underlying
data, and available to re-run per-memory or per-user) — there is no background scheduler.

## Duplicate policy

`classifyDuplicate()` (pure, `duplicate/memory-duplicate.util.ts`) checks two memories of the
**same type** in a fixed priority order, first match wins:

1. **EXACT** — identical raw `title`+`summary` text.
2. **NORMALIZED** — identical after `normalizeText()` (lowercase, punctuation stripped,
   whitespace collapsed) — e.g. `"I like coffee."` vs `"I like coffee"`.
3. **STRUCTURED** — both have a `structuredPayload`, share at least one key, and every shared
   key's value matches exactly (deep-equal, key-order-independent).
4. **TYPE_SPECIFIC** — same type, no match above, but raw-text token (Jaccard) overlap ≥ 60%.

Different types are **never** flagged as duplicates by this sprint's definition, even with
identical text — a duplicate restates the same fact, and type is part of what makes it "the same
fact." `MemoryDuplicateService.detectForUser()` runs this over all pairs within each type group
of the user's ACCEPTED memories (bounded to 200, grouped by type first to reduce the effective
O(n²) cost), upserts `MemoryDuplicate` rows, and — critically — **never resurrects a pair the
user already resolved** (`DISMISSED`/`MERGED` rows are left alone) while cleaning up stale
`PENDING` rows whose pair no longer matches (e.g. after a title edit). This is compute-on-read,
not a background job, following Sprint 3A's export-service precedent for "no new async
infrastructure this sprint."

## Conflict policy

`classifyConflict()` (pure, `conflict/memory-conflict.util.ts`) takes an `(older, newer)` pair
already known to be the same type and **not** a duplicate (duplicates are excluded first —
restating a fact isn't a contradiction), and returns `null` unless:

- the type is one of a fixed **single-valued-type** set — `LOCATION_PREFERENCE`, `WORK`,
  `STUDY`, `RELATIONSHIP`, `IDENTITY` — treated as describing one evolving "slot" per user
  (current city, current job, etc.), **or**
- both memories have a `structuredPayload` sharing a key whose values differ.

When eligible, the newer memory's text is checked against a fixed, literal
**supersession-keyword list** (`"moved to"`, `"no longer"`, `"used to"`, `"switched to"`, …-
substring matching only, never a classifier). A match means **SUPERSEDED** (a clear replacement,
e.g. "I live in Tokyo" → "I moved to Osaka"); no match means a plain **CONFLICT** (an unresolved
contradiction, e.g. two different `structuredPayload.targetDate` values on two `GOAL` memories).

`NONE` is never a stored value — the absence of a `MemoryConflict` row *is* "no conflict."
**Neither memory is ever edited, archived, or deleted by detection** — `MemoryConflictService`
only ever creates/updates/deletes rows in its own table. This sprint ships **detection only**:
`GET /memory/conflicts` is read-only (Phase 9's exact endpoint list has no conflict-resolve
mutation), so the schema deliberately has no third "resolved" status or resolution reason this
sprint — adding one now, unused, would be speculative infrastructure; a future sprint that adds
explicit conflict resolution should extend the model then.

## Merge policy

`MemoryMergeSuggestionService.generateForUser()` refreshes duplicate detection, then creates one
`MemoryMergeSuggestion` per `PENDING` duplicate pair that doesn't already have a suggestion (in
either primary/duplicate order) — a previously accepted/rejected suggestion for the same pair is
never regenerated. `confidence` (0-100) is derived deterministically from the underlying match
type: `EXACT` → 99, `NORMALIZED` → 95, `STRUCTURED` → 75, `TYPE_SPECIFIC` → `min(85, similarity)`.
`primary`/`duplicate` roles are assigned deterministically (higher `importanceScore` wins, then
`pinned`, then older `createdAt`, then `id`) so regenerating for the same pair is idempotent.

**Nothing is ever merged automatically.** `accept()` is the one explicit user action that follows
from a finding: it marks the suggestion `ACCEPTED`, marks the underlying duplicate `MERGED`, and
**archives** (Sprint 3A's existing, reversible `MemoryRecordService.archive()` — never a hard
delete, never a content rewrite) the duplicate memory, keeping the primary untouched. `reject()`
marks the suggestion `REJECTED` and the underlying duplicate `DISMISSED`, so it won't be
re-suggested. This sprint does not synthesize merged content — there is no "combine these two
summaries" step anywhere, which would require exactly the LLM-generation this sprint excludes.

## Retrieval algorithm

`MemoryRetrievalService.recommend()` (`retrieval/memory-retrieval.service.ts`) is the deterministic
policy behind `GET /memory/recommendations`:

1. **Hard exclusion** (never retrieve deleted/archived/rejected/candidate/pending): the base
   query is `where: { userId, status: 'ACCEPTED' }` — structurally, every other status is
   excluded by construction, not by a filter that could be forgotten at a call site.
2. **Consent re-check**: for each distinct `type` present, `MemoryConsentService.canAccept()` is
   called against the user's *current* settings (not the snapshot at acceptance time) — a type
   the user has since set to `DENY_TYPE`/`DISABLED`, or a `HEALTH` memory without its explicit
   `ALLOW_TYPE` override, is excluded from recommendations even though the row itself remains
   fully visible elsewhere in the product (Sprint 3A's disclosed, intentional distinction between
   "existing memory stays visible to its owner" and "this decision layer won't surface it").
3. **Optional context filter**: if a free-text `context` hint is given, memories sharing no
   significant token with it are deprioritized — but if the filter would match *nothing*, it is
   not applied at all (falls back to ranking every consented candidate), so an unmatched or
   unrecognized context never produces an empty result.
4. **Ranking**: `rankMemories()` (`retrieval/memory-ranking.util.ts`, pure) sorts the filtered
   set with this fixed, documented tie-break chain:
   1. Manual pin (pinned always outranks unpinned).
   2. `importanceScore`, descending.
   3. Goal relation (`GOAL`/`ACHIEVEMENT`/`CHALLENGE` outrank others at equal importance).
   4. Recency — `lastReferencedAt ?? createdAt`, descending.
   5. Frequency — `referencedCount`, descending.
   6. `id`, ascending — final, arbitrary-but-stable tiebreaker so the result never depends on
      input order and is identical across repeated calls with the same data.
5. **Budget**: `ContextBudgetService.fitToBudget()` greedily includes ranked memories (allowing a
   later, smaller one to fill a gap left by an earlier one that didn't fit) until the memory
   token budget (see "Context budget algorithm") is exhausted; an optional `limit` further caps
   the count.
6. Included memories get `referencedCount` incremented and `lastReferencedAt` bumped (feeds
   future ranking); a `MemoryRetrievalLog` row is written (see "Observability").

**As originally written this sprint (3B), this was not wired into any live Companion conversation**
— `GET /memory/recommendations` was a standalone, read-only transparency surface (also rendered
in the Memory page's Insights tab) showing what the policy *would* surface. Sprint 3C wired this
same `recommend()` call into `StreamService.generate()` via `MemoryContextAssembler` — no change
to the algorithm itself, only a second caller. See
docs/architecture/companion-memory-integration.md "Retrieval pipeline." Embedding/semantic-based
retrieval remains explicitly out of scope for both sprints.

## Context budget algorithm

`ContextBudgetService.computeBudget()` splits a configured total context window
(`MEMORY_CONTEXT_WINDOW_TOKENS`, default 8000) into: a fixed **reserved output** allocation
(`MEMORY_CONTEXT_RESERVED_OUTPUT_TOKENS`, default 1024 — reserved first, since a generation that
can't finish because its own reply had no room left is worse than a shorter prompt), the actual
estimated cost of the system prompt and user input text given, the conversation text capped at
`MEMORY_CONTEXT_CONVERSATION_MAX_TOKENS` (default 3000), and whatever remains — capped at
`MEMORY_CONTEXT_MEMORY_MAX_TOKENS` (default 1500) — goes to memory.

**Token counts are an estimate**: `estimateTokens()` is `Math.ceil(text.length / 4)`, the common
rough English-text heuristic, not a real tokenizer. This is disclosed, not hidden — see "Known
limitations." All four budget constants are environment-configurable
(`apps/api/src/config/env.validation.ts`/`configuration.ts`, `app.memory.contextBudget`).

## Ranking

Covered above under "Retrieval algorithm" — `rankMemories()` is a standalone, pure, exported
function (`retrieval/memory-ranking.util.ts`) so it can be (and is, in `MemoryEvaluationService`)
exercised independently of the database.

## Evaluation methodology

`MemoryEvaluationService` (`evaluation/memory-evaluation.service.ts`) runs the actual production
algorithms — `classifyDuplicate`, `classifyConflict`, `rankMemories`, `filterByContext`,
`ContextBudgetService` — against small, hand-labeled, checked-in fixtures
(`evaluation/evaluation.fixtures.ts`), **not** live production data. This was a deliberate choice
for this sprint, not an oversight: no live database was reachable this session (see
docs/progress/sprint-3b-progress.md "Environment note"), and no production usage data exists yet
for features that didn't exist before this sprint. Fixture-based evaluation answers "does the
algorithm behave the way its own design says it should" — it does **not** answer "how well does
this perform against real, messy user data," which requires a follow-up evaluation once this
ships and accumulates real usage.

Metrics computed (`run-evaluation.ts` exports the full report as JSON):

- **Precision/recall** per retrieval scenario, and averaged — did the ranked+budgeted result
  match the fixture's hand-labeled expected set.
- **Duplicate rate** — fraction of labeled pairs `classifyDuplicate` flags as a duplicate.
- **Duplicate/conflict accuracy against labels** — a bonus check beyond what Phase 8 explicitly
  asked for, since the fixtures already carry an expected true/false per pair.
- **Merge suggestion rate** — `suggestionsGenerated / duplicatesFound`. Given this sprint's 1:1
  generation rule (one suggestion per fresh pending duplicate, see "Merge policy"), this is
  definitionally 1.0 whenever any duplicates exist and 0 otherwise under fresh fixtures — a real,
  disclosed fact about the current design, not a discriminating metric yet.
- **Retrieval latency** — wall-clock (`performance.now()`) around the pure ranking+budgeting
  call per scenario (no I/O in the fixture path, so this measures algorithm cost only, not a
  real end-to-end request).
- **Average retrieved memory count** and **average context token usage ratio**
  (`tokenUsed / memoryTokens`) per scenario.

The actual numbers from this session's run are checked in at
`docs/progress/sprint-3b-evaluation-report.json` — see the final Sprint 3B report for the
headline figures.

## Observability

Every new service logs structured, content-free lines (memory/duplicate/conflict counts, token
budget/used, latency) via NestJS `Logger`, mirroring Companion Core's `ObservabilityService`
discipline (`docs/security/ai-safety.md`). `MemoryRetrievalLog` additionally **persists**
`candidateCount`/`retrievedCount`/`tokenBudget`/`tokenUsed`/`latencyMs` per call — the one metric
this sprint gives a durable, queryable table to, since it's the one most likely to matter
operationally once retrieval feeds a live prompt (it now does, as of Sprint 3C — this table fires
on every Companion turn that retrieves, not only `GET /memory/recommendations` calls). **No memory id, title, summary,
or structured payload is ever logged or persisted in an observability row** — grepped every
`this.logger.*` call site in `memory/importance|duplicate|conflict|merge|retrieval` at review
time; only counts and structural facts appear.

## Security

- **No retrieval bypass**: the retrieval base query is `status: 'ACCEPTED'` only — deleted rows
  can't exist (Sprint 3A hard-deletes), and archived/rejected/candidate/pending rows are
  structurally excluded, not filtered out after the fact.
- **No consent bypass**: re-checked against current settings at retrieval time (see "Retrieval
  algorithm" step 2), not just the acceptance-time snapshot.
- **No cross-user leakage**: every new service method takes `userId` and scopes every Prisma
  query by it; the two mutating endpoints (`merge-suggestions/:id/accept|reject`) use the same
  `findFirst({ where: { id, userId } })` → `NotFoundException` pattern as the rest of Memory
  Foundation, so a suggestion belonging to another user 404s identically to one that doesn't
  exist (no enumeration difference, matching docs/security/memory-privacy.md's established
  convention).
- **CSRF**: all mutating routes (`POST /memory/merge-suggestions/:id/accept|reject`) are covered
  by the project-wide `CsrfGuard` (`APP_GUARD`) — no per-route opt-out in this controller.
- **No dead/speculative mutation surface**: an earlier draft of this sprint added a
  `MemoryConflictService.resolve()` method and a `RESOLVED` status/resolution reason that no
  endpoint ever called — removed during review (see "Conflict policy") rather than shipped
  unused, since Phase 9's endpoint list is read-only for conflicts.

## Known limitations (disclosed, not hidden)

- **O(n²) pairwise scans**, bounded to 200 (duplicates/conflicts) or 500 (importance recurrence,
  retrieval candidates) memories per user. Fine at this sprint's expected scale; would need a
  smarter candidate-generation step (still deterministic, not necessarily embeddings) if a
  single user's memory count grows far past that.
- **Conflict detection's single-valued-type list is a real simplification** — it will
  false-positive for legitimately-plural facts within the same type (e.g. two distinct
  `IDENTITY` facts that aren't actually contradictory) and false-negative for contradictions
  across different types it doesn't consider "single-valued."
- **Supersession detection is a fixed keyword list**, not language understanding — it will miss
  paraphrased replacements ("I'm in Osaka these days" without "moved") and could rarely
  false-positive on an unrelated sentence that happens to contain a listed phrase.
- **Token counts are estimated** (`chars/4`), not from a real tokenizer — the context budget is
  an approximation, disclosed as such, not exact.
- **Merge suggestion rate is definitionally 1.0-or-0.0 under this sprint's 1:1 generation rule**
  — not yet a discriminating metric; would need either a lower-confidence non-suggestion path or
  real usage data (dismissal rates) to become one.
- **Evaluation is fixture-based, not against live production data** — see "Evaluation
  methodology." A follow-up evaluation against real usage is warranted once this ships.
- **No live Companion integration as of Sprint 3B** — retrieval, ranking, and budgeting existed
  and were correct in isolation, but nothing in 3B changed what the Companion actually saw in a
  conversation. Sprint 3C closed this gap (see docs/architecture/companion-memory-integration.md);
  anything semantic/embedding-based remains out of scope for both sprints.

## Sprint 3C entry criteria

1. This sprint's migration (`20260804120000_memory_intelligence`) is deployed and verified
   against a real database — it was hand-authored and schema-validated
   (`prisma validate`/`generate`) this session but never deployed (`prisma migrate deploy`/
   `status`) for lack of a reachable database; see docs/progress/sprint-3b-progress.md.
2. Backend e2e (`test:e2e`) and Playwright suites — not runnable this session for the same
   reason — are run at least once against live Postgres/Redis and pass, following Sprint 3A's
   own precedent of treating "code-complete" and "runtime-verified" as distinct claims.
3. A decision is made on whether/how retrieval feeds a live Companion prompt (the actual Sprint
   3C scope), informed by real evaluation data once this sprint's features see production usage.

No other blockers — importance scoring, duplicate/conflict detection, merge suggestions,
retrieval policy, ranking, and context budgeting are all code-complete, unit-tested (backend and
frontend), and security-reviewed as of this sprint.
