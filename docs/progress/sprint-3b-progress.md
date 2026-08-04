# Sprint 3B — Memory Intelligence: Progress

Status: **code-complete, unit-tested, not runtime-deployed** (Docker/Postgres/Redis unreachable
this session — see "Environment note" below). See the final report delivered at the end of the
session for the authoritative PASS/FAIL summary, exact commands run, and runtime-unverified
items. Full design: docs/architecture/memory-intelligence.md.

## Phase 0 — Audit of Memory Foundation (Sprint 3A)

Read: `docs/architecture/memory-engine.md`, `docs/security/memory-privacy.md`,
`docs/progress/sprint-3a-final-report.md`, `apps/api/prisma/schema.prisma`, and the current
`apps/api/src/memory/**` implementation.

**Existing schema** (`apps/api/prisma/schema.prisma`, Sprint 3A section):
- `Memory` — the trusted record. Fields relevant to 3B: `type` (18-value `MemoryType` enum),
  `status` (`MemoryStatus`: CANDIDATE/PENDING_CONSENT/ACCEPTED/REJECTED/ARCHIVED/EXPIRED/DELETED
  — in practice only ACCEPTED/ARCHIVED exist on a row, since delete is a hard delete),
  `consentState`, `visibility`, `sourceType` (`MemorySourceType`), `sourceConversationId`/
  `sourceMessageId` (plain strings, not FKs), `version`, `lastReferencedAt` (declared, unused,
  reserved for "a later sprint's" Companion context-assembly reads — that's this sprint),
  `createdAt`/`updatedAt`/`archivedAt`/`deletedAt`.
- `MemoryVersion` — full content snapshot per change, cascades with `Memory`.
- `MemoryAudit` — event trail only, `memoryId` deliberately not an FK (survives deletion).
- `MemoryConsentSetting` / `MemoryTypeConsent` — global + per-type consent, `HEALTH` never
  auto-allowed.
- `MemoryCandidate` — CANDIDATE/PENDING_CONSENT lifecycle, resolves to `resultingMemoryId`.

**Current retrieval**: none in the intelligence sense. `MemoryRecordService.list()` and
`.timeline()` are plain `createdAt`-ordered, filterable by type/status/date range — "no semantic
ranking, no importance ranking," by explicit Sprint 3A design. Nothing reads `Memory` rows into a
Companion prompt anywhere in the codebase today (confirmed: no reference to the `Memory` model
inside `apps/api/src/companion/**`). `lastReferencedAt` is written nowhere.

**Candidate lifecycle**: `propose()` → (`accept()`|`reject()`), consent-gated at both proposal and
acceptance time, source-message-ownership enforced structurally (real, `role: 'USER'`
`ConversationMessage` the caller owns). `createDirect()` is the onboarding-only equivalent.
Unchanged by this sprint — 3B does not touch candidate creation.

**Consent model**: `MemoryConsentService.canAccept()` is the single gate; `HEALTH` requires its
own explicit `ALLOW_TYPE` row. 3B's retrieval/recommendation surfaces must never bypass this —
see "Retrieval policy" below and Phase 11.

**What Sprint 3A explicitly deferred to 3B/3C** (per `memory-engine.md` line 1 and
`sprint-3a-final-report.md`'s "Exact Sprint 3B entry criteria"): embeddings, vector database,
semantic search, RAG, knowledge graph, LLM extraction, importance/duplicate/merge/conflict
automation, semantic retrieval into Companion prompts. This sprint (3B) delivers the
**deterministic** half of that list only — importance scoring, duplicate detection, conflict
detection, merge suggestions (never auto-applied), a retrieval *policy* (rule-based selection, not
semantic), ranking, and context budgeting. It does **not** wire retrieval into the live Companion
prompt (that integration, plus anything embedding-based, is explicitly out of scope per the
sprint brief and remains Sprint 3C's job) and introduces no vector storage of any kind.

**Sprint 3B entry criteria from the 3A report** — re-checked: (1) the two 3A closure commits are
merged (`5027d16` on `master`, confirmed by `git log`); (2) the Mailpit parallel-load e2e flake is
a disclosed, accepted CI quirk, not a blocker; (3) no new `MemoryNote` writes — still true, no
code path creates one (grep confirms `MemoryService.createNote()` has zero callers). No blockers.

## Scope for this sprint (see docs/architecture/memory-intelligence.md for the full design)

1. Deterministic importance scoring (0–100, documented weights).
2. Duplicate detection (exact / normalized / structured / type-specific), no embeddings.
3. Conflict detection (NONE / CONFLICT / SUPERSEDED), never auto-overwrite.
4. Merge suggestions (confidence + reason), never auto-merged.
5. Retrieval policy (rule-based selection: type, importance, goal relation, recency, pin, status,
   consent) with a hard exclusion list (deleted/archived/rejected/pending never retrievable).
6. Context token budgeting (system / conversation / memory / user-input split, reserved output).
7. Ranking with documented tie-break rules.
8. Evaluation tooling (precision/recall/duplicate rate/merge-suggestion rate/latency/etc.) with an
   exportable JSON report.
9. Read-only recommendation/conflict/duplicate/merge-suggestion API, plus the two merge-suggestion
   accept/reject mutations.
10. Frontend: importance badge (with a plain-language "why," never a raw score alone), conflicts,
    duplicates, merge suggestions, and a recommendations panel on `/memory`.

## Environment note (affects §13/§14 of the final report)

Docker Desktop is not running in this session (`docker ps` fails to reach the daemon). This means
Postgres/Redis/Mailpit are unreachable, so:
- `prisma migrate dev`/`deploy`/`status` against a real database, backend e2e tests, and the
  Playwright suite cannot be executed this session — the new migration is handwritten (following
  the same pattern as the Sprint 3A migration) and validated with `prisma validate`/`generate`
  (schema-only, no DB needed), not deployed.
- Backend/frontend **unit** tests (Jest, Prisma fully mocked — the existing project convention,
  see `memory-record.service.spec.ts`) do not need a live database and are run for real.
- This is disclosed explicitly in the final report's "Runtime-unverified items," not glossed over.

## Completion summary

All 14 phases implemented:

1. **Importance scoring** — `MemoryImportanceCalculator` (pure, documented weight table) +
   `ImportanceScoringService` (persistence, recurrence computation).
2. **Duplicate detection** — `classifyDuplicate()` (EXACT/NORMALIZED/STRUCTURED/TYPE_SPECIFIC) +
   `MemoryDuplicateService` (on-demand, cached findings, respects prior dismissals).
3. **Conflict detection** — `classifyConflict()` (single-valued-type + structured-field rules,
   supersession-keyword list) + `MemoryConflictService`. Detection-only this sprint — no resolve
   mutation, no third "resolved" status (removed during review; see memory-intelligence.md
   "Security").
4. **Merge suggestions** — `MemoryMergeSuggestionService`, confidence derived from match type,
   accept archives (never deletes/rewrites), reject dismisses the pair permanently.
5/7. **Retrieval policy + ranking** — `MemoryRetrievalService` + `rankMemories()`, hard status
   exclusion, live consent re-check, optional context filter with safe fallback, documented
   tie-break chain.
6. **Context budget** — `ContextBudgetService`, configurable via `MEMORY_CONTEXT_*` env vars.
8. **Evaluation** — `MemoryEvaluationService` + checked-in fixtures + `run-evaluation.ts` CLI,
   actually run this session (`docs/progress/sprint-3b-evaluation-report.json`).
9. **API** — `MemoryIntelligenceController`: `GET /memory/recommendations|conflicts|duplicates|merge-suggestions`,
   `POST /memory/merge-suggestions/:id/accept|reject`.
10. **Frontend** — `ImportanceBadge` (score never shown without explanation), `RecommendationPanel`,
    `ConflictsSection`, `DuplicatesSection`, `MergeSuggestionsPanel`, wired into `/memory`'s new
    "Insights" tab; `ImportanceBadge` also added to the existing timeline and detail views.
11. **Security** — ownership scoping verified on every new query/mutation, consent re-checked at
    retrieval time, CSRF coverage confirmed, one piece of dead/speculative code (conflict
    `resolve()`) found and removed during review.
12. **Observability** — structured, content-free log lines on every new service; `MemoryRetrievalLog`
    persists retrieval counts/latency/token usage.
13. **Tests** — 255/255 backend unit tests pass (full suite, not just this sprint's), 128/128
    frontend unit tests pass (full suite). Backend e2e and Playwright not run — no reachable
    database this session.
14. **Docs** — this file, docs/architecture/memory-intelligence.md (new), a pointer added to
    docs/architecture/memory-engine.md.

See the final Sprint 3B report (delivered in the session, not a file) for the complete
PASS/FAIL table, exact commands, residual risks, and Sprint 3C entry criteria.
