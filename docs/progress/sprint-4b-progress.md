# Sprint 4B — Reflection Foundation: Progress / Audit

## Phase 0 audit

Read: `docs/architecture/memory-engine.md`, `docs/architecture/memory-intelligence.md`,
`docs/architecture/companion-memory-integration.md`, `docs/architecture/journal-foundation.md`,
`docs/progress/sprint-4a-final-report.md`, and the live `apps/api/prisma/schema.prisma`.

### What exists today (facts, not assumptions)

- **Memory** (Sprint 3A/3B): `Memory` rows have `type` (`MemoryType`, 18 values including `GOAL`,
  `ACHIEVEMENT`, `CHALLENGE`), `status` (effectively `ACCEPTED`/`ARCHIVED` in practice),
  `importanceScore`/`importanceFactors`/`pinned`/`referencedCount`, `sourceType`. Deterministic
  duplicate/conflict detection already exists (`MemoryDuplicateService`, `MemoryConflictService`,
  compute-on-read, no background job) and a shared text-normalization util
  (`memory/shared/text-normalization.util.ts`: `normalizeText`/`tokenize`/`significantTokens`/
  `jaccardSimilarity`/`similarityScore`) this sprint reuses directly rather than reimplementing.
- **Journal** (Sprint 4A): `JournalEntry` rows have `state` (`DRAFT`/`PUBLISHED`/`ARCHIVED`/
  `DELETED`, soft-delete), `mood` (`JournalMood`, self-selected only), `tags: String[]`, `pinned`,
  soft-delete via `state` (row never disappears). Ownership pattern: `findOwned()` throws an
  identical 404 for "doesn't exist" vs. "belongs to someone else."
- **Activity**: `ActivityEvent` (`type: ActivityType`, `metadata: Json?`, `createdAt`) — a flat,
  minimal, non-sensitive event log (`ACCOUNT_CREATED`, `ONBOARDING_COMPLETED`,
  `PREFERENCE_UPDATED`, `MEMORY_CREATED`, `EMAIL_VERIFIED`, `PASSWORD_CHANGED`,
  `SESSION_REVOKED`, `LOGOUT_ALL`). No journal- or reflection-specific activity types exist yet.
- **Companion history**: `Conversation` / `ConversationMessage` (Sprint 2B). User-authored turns
  are `role: 'USER'`. This sprint never adds a detector on message content into the live
  send-message pipeline (see "Companion integration" below for the scope decision).
- **No `Goal` model exists anywhere in this repository.** The mission brief lists "Goals" as a
  data source alongside Journal/Memory/Activity/Companion, but there is no dedicated `Goal`
  entity, table, or module (confirmed: no `apps/api/src/goals` directory, no `Goal` model in
  `schema.prisma`). Memory Intelligence (Sprint 3B) already treats `MemoryType.GOAL` (plus
  `ACHIEVEMENT`/`CHALLENGE`) as "goal-relation" memories for its importance algorithm. Sprint 4B
  follows that same precedent: **"Goals" as a Reflection data source means `Memory` rows of type
  `GOAL`/`ACHIEVEMENT`/`CHALLENGE`, not a fabricated new entity.** This is disclosed here, not
  discovered as a gap later — inventing a `Goal` model this sprint would violate "never fabricate
  sources" at the schema level before a single rule even runs.
- **Export/privacy model**: Memory hard-deletes; Journal soft-deletes (`state: DELETED`, row
  persists). Both patterns matter for Phase 11 (Privacy): a Reflection Candidate referencing a
  hard-deleted Memory must detect the row is *gone*; one referencing a soft-deleted Journal entry
  must detect `state === 'DELETED'` even though the row still exists.

### Deliberate scope decisions (disclosed up front)

1. **"Goals" = `Memory` type `GOAL`/`ACHIEVEMENT`/`CHALLENGE`.** See above.
2. **No background job / scheduler.** Every Sprint 3A–4A precedent (duplicate detection, merge
   suggestions, export) computes deterministically on read, never via a queue/cron. Reflection
   generation follows the same pattern: `ReflectionGenerationService.ensureGenerated(userId)` runs
   synchronously inside every read endpoint (`list`/`feed`/`timeline`/`groups`/`statistics`),
   upserting candidates. It never resurrects a candidate the user already `DISMISSED`/`ARCHIVED`
   for the same rule+group+window fingerprint (mirrors `MemoryDuplicateService`'s own "never
   resurrects a pair the user already resolved" policy).
3. **Companion integration is a standalone read endpoint, not a change to the message-turn
   pipeline.** Sprint 2B/3C/4A's `ConversationService.sendMessage()` already runs three
   deterministic detectors (crisis, memory-suggestion, forget-intent) plus journal-suggestion
   inline on every turn, and its response shape is exercised by a large existing test surface.
   Reflection's brief only requires Companion to be able to say "you may want to reflect on
   this" **when a candidate exists** — it does not require detecting anything from the message
   text itself (there is nothing to detect; existence of a `READY` candidate is the only
   condition). A new, narrow `GET /companion/reflection-hint` endpoint plus a small banner in the
   existing `/companion` view satisfies this literally without touching the higher-risk streaming
   pipeline. Documented as a deliberate, lower-risk integration shape, not an oversight.
4. **`ReflectionReason` and `ReflectionScore` are embedded fields, not separate tables.** Exactly
   like `Memory.importanceScore`/`importanceFactors` (Sprint 3B) — a reason/score is 1:1 with its
   candidate, never independently queried, so a join table would be speculative infrastructure.
5. **`ReflectionGroup` is a computed key (`groupKey`), not a membership join table.** Mirrors
   Journal's own "tags are a `String[]`, not a join table" precedent — deterministic grouping only
   needs a stable string to `GROUP BY`, not a normalized relation.
6. **`ReflectionSource` is a real table** (`ReflectionSourceRef`), one row per source record a
   candidate cites — this is the one place a join table is justified, since "never fabricate
   sources" requires an auditable, queryable list of exactly which real rows backed a candidate,
   and a candidate can cite more than one source record.

## Phase 1+ implementation log

See `docs/architecture/reflection-foundation.md` for the full design (domain model, rule engine,
grouping, scoring, timeline, feed, privacy) and `docs/progress/sprint-4b-final-report.md` for the
closure report (commands run, PASS/FAIL, known limitations, residual risks, Sprint 4C entry
criteria).
