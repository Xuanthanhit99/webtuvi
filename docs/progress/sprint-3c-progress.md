# Sprint 3C — Companion + Memory Integration: Progress

Status: **READY FOR SPRINT 4** — superseded by `docs/progress/sprint-3c-final-report.md`, written
during a subsequent release-closure session that started Docker, ran the full backend e2e suite
and full Playwright suite against a live stack (each closing a real coverage gap this document's
own session had left open — no Sprint 3C e2e/Playwright spec existed at all before that session),
performed a real-browser manual smoke test, and completed the Sprint 3C-scoped security re-audit
(zero Blocker/High findings). The "Runtime-unverified items" section below is accordingly
historical — see the final report for what was actually run and its exact results.

## Recovered state (this continuation session)

`git status --short` was clean at the start of this session — everything from the prior session
was already committed (commit `5e90ce8 [update][commit] sprint 3`, ~7300 insertions across 91
files, bundling Sprint 3B's Memory Intelligence and Sprint 3C's Companion+Memory Integration
together). `git diff --check` and `git log --oneline -10` were used for recovery, per the
continuation instructions; no uncommitted work existed to preserve.

Recovery method: read `docs/progress/sprint-3c-progress.md` (this file, as it stood at session
start — it only documented Phase 0's audit, not the very substantial implementation actually
already committed), then inspected the actual committed source under `apps/api/src/companion/`,
`apps/api/src/memory/`, and `apps/web/features/companion/` directly, since the progress file was
stale relative to git history.

**Finding**: almost the entire backend pipeline (Phases 1–9, 11–13 backend) and almost the entire
set of frontend components (Phase 6, 10) already existed, fully implemented and unit-tested, in
that commit. Two things were genuinely incomplete:

1. **The frontend memory UI components were built but never rendered anywhere** —
   `MemoryUsedSection`, `MemorySuggestionCard`, `ForgetSuggestionCard` existed as complete,
   tested-in-isolation-by-design components and `useCompanionConversation` already exposed
   `pendingMemorySuggestion`/`pendingForgetSuggestion`/`lastTurnMemoryUsage`, but
   `message-item.tsx` and `companion-view.tsx` (the actual `/companion` render tree) never
   imported or rendered any of them. This was Phase 10's real interruption point — the backend
   and the components were done; the last wiring step was not.
2. **`docs/architecture/companion-memory-integration.md`** (Phase 14, referenced by name from the
   in-progress `sprint-3c-progress.md`, `companion-memory-api.ts`, `companion-memory.controller.ts`,
   and several other files' own comments) did not exist.
3. **The generated Prisma client was stale relative to `schema.prisma`** — `pnpm typecheck` for
   `apps/api` failed with ~50 errors (`Property 'importanceScore' does not exist...`, `Module
   "@prisma/client" has no exported member 'MemoryConflict'`, etc.) because `prisma generate` had
   never been re-run after the Sprint 3B/3C schema changes were committed (most likely because
   Docker/Postgres was unavailable in the interrupted session, so `prisma migrate dev` — which
   also regenerates the client — never ran). This was a real, previously-undetected compilation
   blocker, not a documentation gap.

## Work completed in this continuation

1. **Wired the three existing memory UI components into the live Companion conversation view**
   (no new components — only rendering the ones that already existed):
   - `apps/web/features/companion/components/message-item.tsx` — assistant messages now render
     `MemoryUsedSection` using the message's persisted `memoryUsed` (available on reload) plus,
     for the message that was just generated, the ephemeral `skipped` list via a new optional
     `memoryUsage` prop.
   - `apps/web/features/companion/components/companion-view.tsx` — now destructures
     `pendingMemorySuggestion`/`clearMemorySuggestion`/`pendingForgetSuggestion`/
     `clearForgetSuggestion`/`lastTurnMemoryUsage` from `useCompanionConversation` (already
     exposed, previously unused by this component) and renders `MemorySuggestionCard`/
     `ForgetSuggestionCard` inline in the message log right after the turn that produced them,
     clearing them via `onResolved` — never automatically.
2. **Regenerated the Prisma client** (`npx prisma generate` in `apps/api`) — resolves the backend
   typecheck failures described above. No schema change was made; this is purely bringing the
   generated client back in sync with the already-committed, already-`prisma validate`-passing
   schema.
3. **Wrote `docs/architecture/companion-memory-integration.md`** — the design doc referenced but
   missing, covering the retrieval pipeline, memory references, explanation, suggestions, forget
   flow, memory cards, prompt assembly, explainability, privacy/consent enforcement, Companion UI
   integration, observability, security, and the "no new Prisma migration" scope decision, written
   directly from the actual committed source (not aspirational).
4. **Refreshed stale cross-references** in `docs/architecture/companion-core.md`,
   `docs/architecture/memory-engine.md`, `docs/architecture/memory-intelligence.md`,
   `docs/security/ai-safety.md`, `docs/security/memory-privacy.md` — these previously said things
   like "not wired into a live Companion prompt (that's Sprint 3C)," which became false the moment
   3C's wiring was committed. Updated in place with short, linked notes; none of these documents
   were rewritten wholesale, and no historical Sprint 3A/3B claims about that sprint's own
   completeness were altered.
5. **Added frontend tests** for the newly-wired UI (none existed for these three components before
   this session, despite the components themselves being complete):
   - `message-item.test.tsx` — extended with cases for: no "Memory used" control when nothing was
     used; a populated `memoryUsed` reference expanding into a real `MemoryCard` (mocking
     `memoryApi.get`); no control at all when `conversationId` is absent (matches the
     "Remember this" button's own never-on-an-assistant-reply guard pattern).
   - `memory-suggestion-card.test.tsx` (new) — nothing is called on render; Remember
     proposes+accepts (and correctly does *not* call accept when the candidate comes back
     `PENDING_CONSENT`); Not now dismisses and resolves even if the dismiss call fails; Never
     remember this type calls `updateType(type, 'DENY_TYPE')`.
   - `forget-suggestion-card.test.tsx` (new) — nothing is called on render; single- and
     multi-candidate confirm-delete send every listed memory id (never a silently narrowed
     subset); `NEVER_REMEMBER_TYPE` goes through consent, never deletion; Cancel calls no API;
     the no-candidates state exposes no destructive action.

## Phases already complete (as recovered, unchanged by this session except where noted)

- **Phase 0 — Audit**: done in the prior session (see the original audit notes below, retained).
- **Phase 1 — Memory Retrieval Pipeline**: `MemoryContextAssembler` → `MemoryRetrievalService.recommend()`
  (Sprint 3B, now actually called), `MemoryExplanationService`. Complete.
- **Phase 2 — Memory References**: `MemoryReferenceDto` carries all required fields. Complete.
- **Phase 3 — Memory Explanation**: `MemoryExplanationService.explain()`/`.explainSkip()`, never
  fabricates, never says "I always remember." Complete.
- **Phase 4 — Memory Suggestions**: `memory-suggestion-detector.ts` + `MemorySuggestionService`,
  reuses Sprint 3A propose+accept/consent, never auto-saves. Complete (this session added the
  missing UI wiring + tests).
- **Phase 5 — Forget Flow**: `forget-intent-detector.ts` + `CompanionForgetService`, explicit
  confirmation only, bounded/scored `DELETE_ABOUT` matching, no silent deletion. Complete (this
  session added the missing UI wiring + tests).
- **Phase 6 — Memory Cards**: `MemoryCard` — real data via `GET /memory/:id`, View/Edit/Forget.
  Complete (was already rendered from `MemoryUsedSection`/suggestion flows; this session made
  those reachable from the actual conversation view).
- **Phase 7 — Prompt Assembly**: `PromptBuilderService.build()` appends a bounded, count-capped
  (`MAX_MEMORIES_PER_TURN = 5`), budget-fitted block to the system message only. Complete.
- **Phase 8 — Explainability**: SSE `done` event's ephemeral `memoryUsage.used/skipped`, each
  merged with a real explanation. Complete.
- **Phase 9 — Privacy**: enforced entirely by reusing `MemoryRetrievalService`'s existing
  status/consent filtering (`ACCEPTED` only, live consent re-check, `HEALTH` gate, userId
  scoping) — no separate/duplicate enforcement was added or needed. Complete.
- **Phase 11 — Observability**: `MemoryRetrievalLog` now fires on real Companion turns (Sprint 3B
  infrastructure, no new metrics pipeline needed); suggestion/forget actions reuse
  `MemoryAuditService`'s existing actions. No memory/prompt/response content, email, or secrets
  logged anywhere in `companion/memory/*` (verified by direct read of every `Logger.log` call
  site in this session). Complete.
- **Phase 12 — Security**: covered by reused infrastructure (ownership scoping, consent
  re-check, CSRF guard, no second deletion/consent path) — see the new architecture doc's
  "Security" section for the specific claim-by-claim mapping. Complete as designed;
  **not** re-verified against a live attack surface this session (no Docker — see below).
- **Phase 13 — Tests (backend)**: all backend unit + one controller test already existed and pass
  (see "Commands and results"). **Tests (frontend)**: three components had zero tests before this
  session; added this session (see above). Backend e2e / Playwright: not runnable, see below.
- **Phase 14 — Documentation**: `companion-memory-integration.md` written this session (was
  missing); `companion-core.md`/`memory-engine.md`/`memory-intelligence.md`/`ai-safety.md`/
  `memory-privacy.md` refreshed in place this session; `.env.example` needs no change (no new
  Sprint 3C config surface — `MAX_MEMORIES_PER_TURN` is a hardcoded constant, and the memory
  context-budget env vars are pre-existing Sprint 3B config already used identically); Swagger is
  generated at runtime from `@ApiTags`/`@ApiOperation` decorators already present on
  `CompanionMemoryController` — no static OpenAPI file exists in this repo to hand-edit.

## Interrupted phase found

**Phase 10 (Companion UI)**, specifically: components complete, hook state complete, only the
final render-tree wiring was missing. Resolved this session (see "Work completed" above).

## Files changed this session

- `apps/web/features/companion/components/message-item.tsx` (modified — memory-used wiring)
- `apps/web/features/companion/components/companion-view.tsx` (modified — suggestion/forget card wiring)
- `apps/web/features/companion/components/message-item.test.tsx` (modified — extended coverage)
- `apps/web/features/companion/components/memory-suggestion-card.test.tsx` (new)
- `apps/web/features/companion/components/forget-suggestion-card.test.tsx` (new)
- `docs/architecture/companion-memory-integration.md` (new)
- `docs/architecture/companion-core.md` (modified — module layout note)
- `docs/architecture/memory-engine.md` (modified — stale "not wired" claims corrected)
- `docs/architecture/memory-intelligence.md` (modified — stale "not wired" claims corrected)
- `docs/security/ai-safety.md` (modified — added Sprint 3C prompt-context note)
- `docs/security/memory-privacy.md` (modified — added Sprint 3C reuse note)
- `docs/progress/sprint-3c-progress.md` (this file)
- Prisma client regenerated (`node_modules/.pnpm/@prisma+client@5.22.0.../node_modules/@prisma/client`)
  — generated artifact, not a repo source file; no `schema.prisma` change.

No files were staged or committed (per instructions).

## Commands executed and exact results

| Command | Result |
|---|---|
| `git status --short` / `git diff --stat` / `git diff --check` / `git log --oneline -10` | Clean tree at session start; no whitespace errors at session end (only CRLF/LF line-ending advisories, not errors) |
| `npx prisma generate` (apps/api) | PASS — client regenerated against existing schema |
| `npx prisma validate` (apps/api) | PASS — "The schema at prisma\schema.prisma is valid" |
| `pnpm lint` | PASS — both `apps/api` and `apps/web` |
| `pnpm typecheck` | **PASS** (was FAIL before `prisma generate`, ~50 stale-client errors in `apps/api`; 0 errors after) |
| `pnpm --filter api test` | PASS — 42 suites, 339 tests, 0 failures |
| `pnpm --filter web test` | PASS — 28 suites, 142 tests, 0 failures (19 of them new/extended this session) |
| `pnpm build` | PASS — `nest build` (api) then `next build` (web), exit 0. `/companion` route: 11.8 kB (127 kB First Load JS). All 21 routes generated. |
| Secret scan (pattern grep over this session's diff + new files) | No matches for API keys, tokens, private keys, or hardcoded secrets |

## Runtime-unverified items (Docker not running this session)

- `docker info` → not running. Postgres/Redis/Mailpit unreachable.
- `prisma migrate status` / `prisma migrate deploy` — not run. No new migration exists this
  sprint to deploy (see "no new Prisma migration" scope decision in the architecture doc); the
  existing `20260804120000_memory_intelligence` migration's deploy status against a live database
  remains unverified from Sprint 3B onward, unchanged by this session.
- Backend e2e (`test:e2e`) — not run; requires a live Postgres.
- Playwright (`Conversation → suggestion → accept → later retrieval → explanation → forget →
  confirm-no-later-retrieval`, plus consent-disabled/rejected-suggestion/ambiguous-forget
  variants) — not run; requires a live full stack. **This is the single largest verification gap**
  for Sprint 3C specifically, since Phase 13's e2e/Playwright list is the one place this sprint's
  actual end-to-end behavior (as opposed to each layer in isolation) gets exercised.
- Manual browser verification of the newly-wired UI (Memory Used expand/collapse, suggestion
  card buttons, forget card buttons) against a live backend — not performed, for the same reason.

**Superseded**: all of the above was subsequently completed in the release-closure session — see
`docs/progress/sprint-3c-final-report.md` §§11–15 for exact results (Docker started, both
migrations applied and additionally verified from-clean, backend e2e run twice, a genuinely
missing `companion-memory.e2e-spec.ts` written and passing, Playwright run three times with a
genuinely missing `flow-13` spec written and passing, and a real manual browser smoke test
performed with screenshots).

## Blockers

None. Superseded — see the final report §16 (security) and §20 (Sprint 4 entry criteria); no
Blocker or High finding exists.

## Exact next action

Superseded — see the final report §20 "Sprint 4 entry criteria."

## Estimated completion percentage

**Superseded — see the final report.** As of the release-closure session: code-complete and
verification-complete at every layer (unit, integration/e2e, browser) against a live stack.

---

## Phase 0 — Audit (from the original session, retained verbatim)

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
  `apps/api/src/companion/`. *(Superseded by this session: as of the actual committed
  implementation, `StreamService`/`ConversationService` now do call into Memory via
  `MemoryContextAssembler`/`MemorySuggestionService`/`CompanionForgetService` — this note is kept
  for historical accuracy of what the audit found at that point in time.)*
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
  Companion**. *(Superseded: now called from Companion via `MemoryContextAssembler`.)*
  `MemoryAuditService` already has every action this sprint needs
  (`ACCEPTED`/`REJECTED`/`DELETED`/`CONSENT_CHANGED`) for suggestion-accept, suggestion-dismiss,
  and forget tracking — no new audit actions are needed.

### Sprint 3C's actual job, given the above

Sprint 3C is **wiring and transparency**, not new storage or new algorithms — see
`docs/architecture/companion-memory-integration.md` for the as-built design (written this
session, superseding the plan described in the original audit).

### Deliberate scope decision: no new Prisma migration this sprint

Confirmed still true after this session: every piece of new Sprint 3C state is either (a)
computed per-request and never persisted, (b) stored in the existing `ConversationMessage.metadata`
JSON column, or (c) an existing Sprint 3A mutation/audit action reused as-is. `schema.prisma` was
not touched this session; only the generated client was brought back in sync with it.
