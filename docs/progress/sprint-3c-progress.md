# Sprint 3C — Companion + Memory Integration: Progress

Status: **in progress**. See the final report delivered at the end of the session for the
authoritative PASS/FAIL summary and runtime-verification caveats.

## Phase 0 — Audit

Read: `docs/architecture/companion-core.md`, `docs/architecture/memory-engine.md`,
`docs/architecture/memory-intelligence.md`, `docs/security/ai-safety.md`,
`docs/security/memory-privacy.md`, `docs/progress/sprint-3b-progress.md`, plus the actual
Companion module source (`apps/api/src/companion/**`) and the Companion frontend
(`apps/web/features/companion/**`).

### What already exists (nothing here is rewritten)

- **Companion Core (2B)**: `StreamService.generate()` is the one place that calls a provider —
  it builds `ConversationContext` (`ContextBuilderService`, direct Prisma reads only: profile,
  preferences, recent activity, recent-conversation excerpts, time), then
  `PromptBuilderService.build()` assembles `[system, ...history, user]`, then
  `ProviderOrchestratorService.stream()`. `ConversationService.sendMessage()` persists the user
  message, checks budget/safety first. Neither of these reads the `Memory` model *at all* today
  — confirmed by grep, zero references to `Memory`/`memoryCandidate`/etc. anywhere under
  `apps/api/src/companion/`.
- **Memory Foundation (3A)**: consent engine, candidate lifecycle, CRUD, versioning, audit,
  timeline, export. `MemoryCandidateService.propose()`/`.accept()` is the exact mechanism
  `RememberThisButton` already uses today (propose from a real, owned, `role: 'USER'` message,
  then immediately accept) — this sprint's "Remember" suggestion button reuses this verbatim,
  it does not invent a new creation path.
- **Memory Intelligence (3B)**: `MemoryRetrievalService.recommend()` already implements almost
  exactly Phase 1's required pipeline shape — hard status exclusion (`ACCEPTED` only), live
  consent re-check (`MemoryConsentService.canAccept`), optional context-token filter, ranking
  (`rankMemories`), and budget-fitting (`ContextBudgetService`) — but it is currently only
  wired to the standalone `GET /memory/recommendations` endpoint, **never called from
  Companion**. `MemoryAuditService` already has every action this sprint needs
  (`ACCEPTED`/`REJECTED`/`DELETED`/`CONSENT_CHANGED`) for suggestion-accept, suggestion-dismiss,
  and forget tracking — no new audit actions are needed.

### Sprint 3C's actual job, given the above

Sprint 3C is **wiring and transparency**, not new storage or new algorithms:

1. Call `MemoryRetrievalService.recommend()` from `StreamService.generate()` (via a new
   Companion-side `MemoryContextAssembler`), instead of never calling it.
2. Extend `MemoryRetrievalService`'s result to also report *skipped* candidates (budget/consent
   exclusions) with a reason — Sprint 3B's endpoint never needed this since it only returns what
   it recommends; Sprint 3C's explainability requirement (Phase 8) does.
3. Format the retrieved memories into a clearly-labeled, budget-respecting block appended to the
   system prompt (`PromptBuilderService`) — never all memories, never unbounded.
4. Persist a structural-only `memoryUsage` record on the assistant `ConversationMessage.metadata`
   (memoryId/title/type/reason/retrievalType/importance/timestamp/sourceConversationId — no new
   content, matching the existing `metadata` field's established use for
   provider/model/promptVersion/safety flags).
5. Add two new **deterministic, non-LLM heuristics** (in the same spirit as
   `crisis-detector.ts`/`prompt-injection-detector.ts`, both already in this codebase): a memory
   *suggestion* detector (never auto-saves) and a *forget-intent* detector (never auto-deletes —
   always requires confirmation through the existing Memory API).
6. Everything a suggestion/forget button does maps to **existing** Sprint 3A/3B mutations
   (`propose`+`accept`, `updateType` consent, `remove`) — no new mutation logic is invented for
   memory itself, only new UI and new deterministic triggers.

### Deliberate scope decision: no new Prisma migration this sprint

Given (5) and (6) above, Sprint 3C introduces **no new database models or columns**. Every piece
of new state is either (a) computed per-request and never persisted (retrieval, suggestion
detection, forget-intent detection, "skipped" explanations), (b) stored in the existing
`ConversationMessage.metadata` JSON column (memory-usage references for a completed turn), or
(c) an existing Sprint 3A mutation/audit action reused as-is (accept/reject/delete/consent
update). This is disclosed explicitly, not an oversight — an integration sprint that reuses the
previous two sprints' infrastructure rather than adding new storage is the intended shape of
this sprint's mission ("this sprint is NOT about improving memory quality").

### Environment note (unchanged from Sprint 3B)

Docker Desktop is not running this session — Postgres/Redis/Mailpit are unreachable. Backend
unit tests (Prisma fully mocked, the established project convention) run for real; backend e2e,
Playwright, and `prisma migrate deploy/status` do not apply this sprint in the same way they
didn't for 3B (there is no new migration to deploy, but e2e/Playwright still require a live
stack and are not runnable this session). Disclosed in the final report's "Runtime-unverified
items," not glossed over.

## Scope for this sprint

See `docs/architecture/companion-memory-integration.md` (written at the end of this sprint) for
the full design: retrieval pipeline, memory references, explanation, suggestions, forget flow,
memory cards, prompt assembly, explainability, privacy, UI, observability, security.
