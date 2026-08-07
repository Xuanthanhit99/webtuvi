# Sprint 5C — Goal System & Progress Engine: Progress / Audit

## Phase 0 audit

### Review Engine (Sprint 5B, the newest aggregation layer)

`apps/api/src/review/` deterministically aggregates already-materialized `InsightCandidate`/
`ReflectionCandidate` rows plus real `JournalEntry`/`Memory`/`ActivityEvent`/`Conversation` counts
into a persisted `Review` document, compute-on-read via `ensureGenerated()` upserting by
`dedupeKey`. Reused directly for this sprint: the exact "delete old evidence rows, recreate fresh
ones from a real userId-scoped snapshot" pattern (`ReviewGenerationService`), the "recompute-in-
place, structural factors breakdown" pattern already established one layer down by
`Memory.importanceScore`/`importanceFactors` (Sprint 3B), and the "never a fabricated fifth status,
map the brief's own vocabulary to real states" discipline.

### Insight Preparation (Sprint 4C) / Reflection Foundation (Sprint 4B)

Both confirm, and this audit reconfirms: **there is still no dedicated `Goal` model in this
repository.** "Goals" have so far only ever meant `MemoryType.GOAL`/`ACHIEVEMENT`/`CHALLENGE` rows,
surfaced through `ReflectionCategory.GOAL` (triggers `REPEATED_GOAL`/`GOAL_REGRESSION`/
`GOAL_ACTIVITY_MISMATCH`) and `InsightCategory.GOAL`. Sprint 5C is the **first** sprint to introduce
a real, first-class `Goal` entity — this is a deliberate scope evolution, not a replacement: the
existing `Memory.type: GOAL/ACHIEVEMENT/CHALLENGE` rows, `ReflectionCategory.GOAL` candidates, and
`InsightCategory.GOAL` candidates all remain exactly as they are (nothing in Sprint 4B/4C is
rewritten) and become one of several real evidence sources a `Goal` can cite — never fabricated,
never re-scored.

### Journal Foundation (Sprint 4A)

`JournalEntry.tags: String[]` (already real, already used by Reflection's own `REPEATED_JOURNAL_THEME`
trigger via tag equality — never semantic matching) is the mechanism this sprint reuses for
deterministic Goal-evidence linking (see "Evidence linking" below) rather than inventing a new
tagging concept.

### Companion Core (Sprint 2B) / Memory Foundation (3A) / Reflection (4B) / Insight (4C) / Review (5B)

All read-only from this sprint's perspective for evidence-gathering; Companion additionally gets a
narrow, deterministic **read** integration (Phase 7) — surfacing a user's active goals' titles into
context, never writing to Memory/Reflection/Insight/Review, never a second consent mechanism.

## Deliberate scope decisions (disclosed up front, same discipline as Sprint 5B's "Study streak"
disclosure)

1. **`Goal` is a new, real entity — not a rename of `Memory.type: GOAL`.** Both continue to exist
   independently; a `Goal` may cite a goal-relation `Memory` as evidence (see below) but does not
   own, replace, or migrate those rows.
2. **Evidence linking is tag/category equality only — never semantic matching, never AI.** Every
   `Goal` has a required `linkedTag` (the same real string-tag concept `JournalEntry.tags` and
   Reflection's `groupKey` already use). Automatic `GoalEvidence` creation is strictly:
   - **JOURNAL**: `PUBLISHED` `JournalEntry` rows whose `tags` array contains `linkedTag`.
   - **MEMORY**: `ACCEPTED` `Memory` rows of type `GOAL`/`ACHIEVEMENT`/`CHALLENGE` whose `title` or
     `summary` contains `linkedTag` as a case-insensitive **substring** — disclosed explicitly as a
     substring match, not semantic similarity, the same "heuristic, not semantic" disclosure
     Reflection's own `GOAL_ACTIVITY_MISMATCH` rule already carries.
   - **REFLECTION**: `ReflectionCandidate` rows (state `!= EXPIRED`) whose `groupKey` contains
     `linkedTag`, or whose `category` is `GOAL` and cites a matching goal-relation `Memory`.
   - **INSIGHT**: `InsightCandidate` rows (status `READY`/`ARCHIVED`) whose category is `GOAL` and
     whose evidence traces to a matching `ReflectionCandidate` above.
   - **REVIEW**: `ReviewEvidence` rows (category `GOAL`) belonging to a `Review` created after the
     goal's `startedAt` — cited coarsely (the Review row, not re-deriving its own already-real
     evidence a second time) to avoid double-counting the same underlying Insight/Reflection through
     two paths.
   - **ACTIVITY**: confirmed, again, during this audit — no goal-specific `ActivityType` exists
     (`ACCOUNT_CREATED`/`ONBOARDING_COMPLETED`/`PREFERENCE_UPDATED`/`MEMORY_CREATED`/
     `EMAIL_VERIFIED`/`PASSWORD_CHANGED`/`SESSION_REVOKED`/`LOGOUT_ALL` — nothing goal-shaped).
     `GoalEvidenceSourceType.ACTIVITY` exists on the enum per the brief's own explicit list, but no
     automatic `GoalEvidence` row is ever created from it this sprint — disclosed rather than
     fabricating a per-goal activity signal that doesn't exist, exactly Review's own "Study streak"
     precedent for an out-of-scope source.
3. **`GoalProgress` is recomputed-in-place, one row per goal — not an append-only table.** Mirrors
   `Memory.importanceScore`/`importanceFactors`'s own established "recompute and overwrite" pattern
   (Sprint 3B) rather than the window-keyed append pattern `Review`/`InsightCandidate` use (a Goal
   has no natural time-window the way a Review does). `previousCompletionPercent`/
   `previousComputedAt` are captured just before being overwritten, which is what makes `GoalTrend`
   derivable without a second history table. `GoalEvidence` rows belong to the current
   `GoalProgress` and are deleted-and-recreated on every recompute — the exact same discipline
   `ReviewGenerationService`/`InsightGenerationService` already use for their own evidence tables.
4. **Three `GoalType`s, each with one fixed, documented completion formula — never a weighted
   model:**
   - `MILESTONE_BASED`: `completedMilestones / totalMilestones * 100`.
   - `METRIC_BASED`: `clamp(currentValue / targetValue * 100, 0, 100)`, where `currentValue` is the
     goal's own real evidence count (deterministic, see above) — never an inferred quantity.
   - `BINARY`: `0` until the goal's `status` is explicitly set to `COMPLETED` by the user, then
     `100` — no partial credit, since a binary goal has no partial-completion concept by definition.
5. **Status transitions are always explicit user actions — including completion.** Reaching 100%
   completion does not auto-complete a `METRIC_BASED`/`MILESTONE_BASED` goal; the user still calls
   `POST /goals/:id/complete`. This keeps every state transition attributable to a real action
   (consistent with `pause`/`resume`/`archive`/`delete` all being explicit), and avoids a silent
   side effect where crossing a threshold changes status without the user asking it to.
6. **`archive`/`delete` mirror Journal Foundation's own reversible-archive + soft-delete precedent**
   (`previousStatus` + `archivedAt`/`deletedAt`, both restorable) — not Memory's harder, privacy-
   driven hard delete, since a Goal (like a Journal entry) is the user's own authored planning
   content, not a consent-gated extracted fact. No hard-purge endpoint is introduced this sprint.
7. **`GoalMilestone.type: AUTOMATIC` completes deterministically against the goal's own real
   evidence count** (`targetCount`, e.g. "10 pieces of evidence") — recomputed by the same
   `GoalProgressEngine` pass that recomputes `GoalProgress`, never a separate heuristic. `MANUAL`
   milestones are only ever completed/failed by an explicit user action.
8. **`GoalRelationship` is a minimal, real, user-created link** — `PARENT_CHILD` (directional) or
   `RELATED` (symmetric), created and deleted explicitly by the user. No automatic relationship
   detection is implemented (that would require semantic comparison between goals, explicitly out of
   scope) — disclosed as a known limitation, not silently dropped.
9. **Companion integration (Phase 7) is read-only and structural, never generative**: the prompt
   context gains a short, deterministic line listing the user's active goal titles (already-real
   `Goal.title` strings, never rewritten/summarized), mirroring how `MemoryContextAssembler` already
   injects real memory content — never a coaching suggestion, never goal-specific advice.

## Phase 1+ implementation log

10. **Phase 7 "Integration" is one-directional by design: Goal reads Journal/Memory/Reflection/
    Insight/Review, never the other way around.** The mission's own framing — "Goals become the
    center of Memory/Journal/Reflection/Insight/Review" — is satisfied by `GoalDataSourceService`
    actively citing real rows from all four as evidence (see "Evidence linking" above), the same
    way `Review` already sits as a consumer one layer above `Insight`/`Reflection` without those
    modules needing to know Review exists. No migration or API change was made to `JournalEntry`,
    `ReflectionCandidate`, `InsightCandidate`, or `Review` to add a reverse `goalId` field — doing
    so would mean four separate schema changes to already-shipped, already-tested modules for a
    "which goal is this row about" pointer that Goal's own tag-based evidence linking already
    derives without one. Companion is the one module that gets a genuine two-way touch (Phase 7's
    explicit ask): a short, read-only, deterministic "active goals" line in
    `ContextBuilderService`/`system-prompt.ts` (see above) — never a write path, never Companion
    creating/scoring a Goal.

11. **`GoalVisibility` was found unreachable during the Phase 8 security review** — neither
    `CreateGoalDto` nor `UpdateGoalDto` originally exposed a way to set `COMPANION_VISIBLE`,
    meaning Phase 7's own "active goals" Companion integration could never actually fire through
    the real API/UI. Fixed by adding an optional `visibility` field to both DTOs (defaulting to
    `PRIVATE`) and a "Let Companion know about this goal" checkbox in the create dialog — not a
    security defect (the reviewer explicitly flagged it as a functional gap, fails safe), but
    disclosed here since it was found during the security pass rather than earlier.

See `docs/architecture/goal-system.md` for the full design.

## Final counts

Backend unit: `goal-progress.util.spec.ts` (15) + `goal-record.service.spec.ts` (14) +
`goal-milestone.service.spec.ts` (8) = 37 new assertions. Backend e2e: `goal.e2e-spec.ts` (12, real
tag-based evidence, automatic/manual milestones, full lifecycle, CSRF, ownership/cross-user
isolation). Frontend: 13 new tests across 4 component test files. Playwright:
`flow-19-goal-system.spec.ts` (1 test, passing in isolation). A dedicated security review found no
high-confidence findings (see item 11 above for the one functional gap it did catch).
