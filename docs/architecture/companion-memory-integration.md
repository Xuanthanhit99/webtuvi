# Companion + Memory Integration (Sprint 3C)

This document describes how the Companion (Sprint 2B, `docs/architecture/companion-core.md`)
and Memory (Sprint 3A `memory-engine.md` / Sprint 3B `memory-intelligence.md`) systems are wired
together. Sprint 3C is **wiring and transparency, not new storage or a new retrieval algorithm**:
it calls Memory Intelligence's existing `MemoryRetrievalService.recommend()` from Companion for
the first time, formats the result into the prompt and into user-facing explanations, and adds
deterministic (non-LLM) suggestion/forget-intent detectors that only ever *propose* an action
through the existing Memory API. No embeddings, no vector store, no RAG, no auto-persistence —
see the CLAUDE.md scope note at the top of this sprint.

## Retrieval pipeline

```
ConversationService.sendMessage() / StreamService.generate()
  -> MemoryContextAssembler.assemble()          (companion/memory/memory-context-assembler.service.ts)
       -> MemoryRetrievalService.recommend()    (memory/retrieval/memory-retrieval.service.ts, Sprint 3B)
            -> status filter: ACCEPTED only (never PENDING/REJECTED/ARCHIVED/DELETED)
            -> MemoryConsentService.canAccept()  — re-checked here, at retrieval time, not just at creation time
            -> memory-ranking.util (pinned / context-match / importance)
            -> ContextBudgetService              — fits the ranked list to a token budget
            -> MemoryRetrievalLog                — persisted observability row
       <- { items, skipped, budget, tokenUsed }
  -> promptBlock (bounded, labeled) + used[]/skipped[] reference lists
  -> PromptBuilderService.build()                 appends promptBlock to the one system message
  -> ProviderOrchestratorService.stream()
```

`MemoryContextAssembler` is the **only** place in `companion/` that touches Memory Intelligence;
nothing under `companion/` reads the `Memory` Prisma model directly. It caps every turn at
`MAX_MEMORIES_PER_TURN = 5` on top of the token budget ("never inject all memories" is a hard
count cap, not only a token limit).

`MemoryExplanationService` (`companion/memory/memory-explanation.service.ts`) turns an already-
retrieved/already-skipped reference into the plain-language explanation Phase 3/8 require. It
never infers a new reason — every field it returns traces back to a field already present on the
reference (`reason`, `retrievalType`, `createdAt`, current consent mode, importance score). It
literally cannot say "I always remember" because that string does not exist anywhere in its
templates.

## Memory references (Phase 2)

Every memory the Companion actually used carries (`companion/memory/memory-reference.types.ts`,
`MemoryReferenceDto`):

`memoryId`, `title`, `type`, `reason`, `retrievalType`, `importance {score, explanations}`,
`retrievalTimestamp`, `sourceConversationId`, `createdAt`.

A structural-only copy (`{ used: MemoryReferenceDto[] }`) is persisted on the assistant
`ConversationMessage.metadata` — the same JSON column already used for
`provider`/`model`/`promptVersion`/`safetyRefused`. This is deliberately **not** a content
duplicate: it never stores the memory's `summary`. `GET
/companion/conversations/:id/messages/:id/memory-explanation/:memoryId` recomputes the full
explanation on demand from the *current* memory/consent state, so an old message's "why" always
reflects reality (e.g. if consent was revoked after the reply was generated, `MemoryCard`'s
underlying `GET /memory/:id` fetch will surface that).

Skipped candidates (`MemorySkipReferenceDto` + `MemorySkipExplanationDto`) are **ephemeral,
this-turn-only** — returned on the SSE `done` event, never persisted, so "why I ignored this" is
only available immediately after the generation that produced it, exactly as Phase 8 specifies
("do not fabricate 'why I ignored this' data if no real skip reason exists" — after reload there
is none, so none is shown).

## Memory suggestions (Phase 4)

`memory-suggestion-detector.ts` is a fixed-pattern, non-LLM detector (same style as
`crisis-detector.ts` / `prompt-injection-detector.ts`) run on every user message inside
`ConversationService.sendMessage()`. `HEALTH` is deliberately never a detector rule — even
suggesting a health memory nudges toward capturing sensitive data; the manual "Remember this"
path is untouched for anyone who wants to save one explicitly.

`MemorySuggestionService.evaluate()` wraps the detector with a live consent check: a type already
set to `DENY_TYPE`/`DISABLED` is never suggested again. The frontend's `MemorySuggestionCard`
renders the result and maps its five buttons entirely onto **existing** Sprint 3A mutations —
no second consent/candidate system:

- **Remember** → `memoryApi.candidates.propose()` then, if not `PENDING_CONSENT`,
  `memoryApi.candidates.accept()` — the same propose+accept flow `RememberThisButton` already used.
- **Not now** → `POST /companion/memory-suggestions/dismiss` — records a `REJECTED` audit entry
  (`memoryId: null`, since no candidate was ever created) for observability; touches nothing else.
- **Never remember this type / Always ask / Always remember this type** →
  `memoryApi.consents.updateType()` (`DENY_TYPE` / `ASK_EVERY_TIME` / `ALLOW_TYPE`) — the same
  consent endpoint Settings uses.

## Forget flow (Phase 5)

`forget-intent-detector.ts` recognizes three intent kinds from free text: `FORGET_RECENT`,
`NEVER_REMEMBER_TYPE`, `DELETE_ABOUT`. `CompanionForgetService.evaluate()` maps a detected intent
to **real, owned candidates only**:

- `FORGET_RECENT` → the most recent `ACCEPTED` memory sourced from *this* conversation.
- `NEVER_REMEMBER_TYPE` → no memory lookup, just states the consent change that would happen.
- `DELETE_ABOUT` → a bounded (`SCAN_LIMIT = 300`), Jaccard-similarity match over the user's own
  `ACCEPTED` memories, capped at 5 candidates, with a similarity floor
  (`DELETE_ABOUT_SIMILARITY_THRESHOLD = 0.2`) so a vague topic returns nothing rather than an
  arbitrary guess.

Detection **never deletes or changes consent by itself** — it only returns a `ForgetSuggestionDto`
(`kind`, `message`, `candidates`, `type`). The frontend's `ForgetSuggestionCard` is the one and
only confirmation step: "Cancel" calls no API at all; "Yes, forget" calls
`POST /companion/memory-forget/confirm-delete` (→ `MemoryRecordService.remove()`, userId-scoped —
no cross-user deletion is reachable through this path) or
`POST /companion/memory-forget/confirm-never-remember` (→ `MemoryConsentService.updateType()`,
`DENY_TYPE`). When more than one candidate matches an ambiguous "delete about X," every listed
candidate is shown and only what the user explicitly confirms is deleted — nothing is inferred or
auto-selected.

## Memory Cards (Phase 6)

`memory-card.tsx` (`MemoryCard`) is the one real Memory Card component, used both by
`MemoryUsedSection` (inside a Companion reply) and standalone. It fetches the memory's *current*
state via `GET /memory/:id` (never trusts a stale reference's would-be content) and renders title,
summary, importance (with explanations, via `ImportanceBadge`), created date, and
View/Edit/Forget actions. "Forget" here goes through the same confirm-dialog +
`memoryApi.remove()` path as the standalone Memory view — no second deletion mechanism.

## Prompt assembly (Phase 7)

`PromptBuilderService.build(context, history, userMessage, memoryBlock)` appends
`memoryBlock` (already budget-fitted and count-capped by `MemoryContextAssembler`) to the single
`system` message — never a separate message role, never unfiltered. When nothing was retrieved,
`memoryBlock` is `null` and the prompt is byte-for-byte the same shape as before this sprint (no
empty section padding). `PROMPT_VERSION` (`system-prompt.ts`) is recorded on every persisted
assistant message's metadata regardless of whether memory was used.

Only `ACCEPTED`, currently-consented, non-archived, non-deleted memories can ever reach this
point — enforced upstream by `MemoryRetrievalService`, not re-checked here. Ordering is
deterministic (pinned → context-match → importance-ranked, per `memory-ranking.util.ts`), and a
memory can appear at most once per turn (the retrieval result is already deduplicated by `id`).

## Explainability (Phase 8)

The SSE `done` event carries an ephemeral `memoryUsage: { used, skipped }`, each entry already
merged with its `MemoryExplanationDto`/`MemorySkipExplanationDto` — the frontend never has to
guess or re-derive a reason. `used` is also what gets persisted (structural fields only, no
explanation text) as `message.memoryUsed`, so a reload still shows "Memory used," and clicking
"Why I remembered this" re-fetches a fresh explanation via
`companionMemoryApi.explainUsedMemory()`. No "why I ignored this" data is ever available after
reload, because none is persisted — this is disclosed as the *absence* of a feature, not simulated.

## Privacy and consent enforcement (Phase 9)

`MemoryRetrievalService.recommend()` (Sprint 3B, now actually called from Companion for the first
time) already enforces every exclusion Phase 9 requires, and nothing in this sprint bypasses it:

- Hard status filter: only `Memory` rows with `status: ACCEPTED` are ever candidates — deleted,
  archived, rejected-candidate, and pending-candidate rows are excluded at the query level.
- `MemoryConsentService.canAccept()` is called **at retrieval time**, per distinct type present in
  the candidate set, not only checked once at creation — a type flipped to `DENY_TYPE` after a
  memory was saved stops surfacing on the very next turn.
- `HEALTH` memories are excluded unless `HEALTH` consent specifically allows them, via the same
  per-type consent check (no special-cased bypass for the Companion caller).
- Every read is `userId`-scoped (`findOwned` on the conversation; `WHERE userId` on `Memory`) —
  there is no code path in `companion/memory/` that accepts a memory ID without also checking
  ownership through the authenticated user.

## Companion UI integration (Phase 10)

- `message-item.tsx` renders `MemoryUsedSection` under any assistant message that has
  `memoryUsed` entries (persisted, so this works after reload) and, for the message that was
  *just* generated, also passes the ephemeral `skipped` list via `lastTurnMemoryUsage` from
  `useCompanionConversation`.
- `companion-view.tsx` renders `MemorySuggestionCard`/`ForgetSuggestionCard` inline in the message
  log, right after the turn that produced them (`pendingMemorySuggestion` /
  `pendingForgetSuggestion` from the same hook), and clears them (`onResolved`) the moment the
  user picks any option — never on their own, never automatically.
- Prior Sprint 2B audit UX protections are unchanged by this integration: the streaming node stays
  `aria-hidden` (one `role="status"` announcement, not per-token), the draft is only cleared on a
  genuine terminal outcome, there is still no bot avatar per message (`Logo`, shared across every
  assistant message), and no memory content is ever announced automatically — "Memory used" is a
  disclosed, user-triggered `<button>`, not an automatic recall claim.
- Provider-unavailable, rate-limited, offline, cancelled, and failed-send-with-draft-preserved
  states are unchanged Sprint 2B behavior (`ComposerStatus` in `use-companion-conversation.ts`);
  this sprint adds no new failure states to that machine, only new, purely additive fields
  (`pendingMemorySuggestion`, `pendingForgetSuggestion`, `lastTurnMemoryUsage`).

## Observability (Phase 11)

No new metrics pipeline was needed — Sprint 3B's `MemoryRetrievalLog` (candidate count, retrieved
count, token budget, token used, latency) now fires on every real Companion turn instead of only
the standalone `/memory/recommendations` endpoint, because `MemoryContextAssembler` calls the
same `recommend()`. Suggestion-accept reuses the existing `ACCEPTED` audit action (via
propose+accept), suggestion-dismiss and forget-delete/never-remember use `MemoryAuditService`'s
existing `REJECTED`/`DELETED`/`CONSENT_CHANGED` actions. Nothing under `companion/memory/` logs
memory content, prompt content, response content, email, tokens/secrets, or source message
text — every `Logger.log()` call in this sprint's new files logs only IDs, types, counts, and
timing (see `memory-suggestion.service.ts`, `companion-forget.service.ts`).

## Security

Covered by existing, reused infrastructure rather than new mechanisms:

- **Consent bypass / cross-user retrieval / archived-or-deleted-memory leakage** — structurally
  impossible through this integration because `MemoryContextAssembler` has no code path that
  skips `MemoryRetrievalService`'s status/consent filtering, and every query is `userId`-scoped.
- **Prompt injection attempting memory access** — the retrieved memory block is data appended to
  the *system* prompt by the server, never influenced by user-supplied instructions about which
  memories to include; `prompt-injection-detector.ts` (Sprint 2B, unchanged) still runs on the
  input before any of this.
- **Memory-reference spoofing** — `memory-explanation` endpoint looks up the reference from the
  *server-persisted* `message.metadata`, not from anything the client sends; a client cannot ask
  to "explain" a memory that wasn't actually used in that message (404 `MEMORY_REFERENCE_NOT_FOUND`).
- **Destructive forget ambiguity** — `CompanionForgetService` never auto-selects among multiple
  `DELETE_ABOUT` candidates; deletion only happens for IDs the client explicitly confirms, and
  `confirmDelete`/`confirmNeverRemember` are ordinary authenticated mutations behind the app's
  existing CSRF/session infrastructure (same guard stack as every other mutating Companion/Memory
  endpoint — `JwtAuthGuard` + the app's global CSRF middleware).
- **IDOR** — `confirmDelete` deletes via `MemoryRecordService.remove(userId, memoryId)`, which is
  itself `userId`-scoped; a memory ID belonging to another user 404s the same way the standalone
  Memory API already does.
- **Provider fallback behavior** — unchanged from Sprint 2B (`ProviderOrchestratorService`); this
  sprint does not add or change provider selection logic.

## Tests

Backend unit tests added/covering this sprint's new files: `memory-context-assembler.service.spec.ts`,
`memory-explanation.service.spec.ts`, `forget-intent-detector.spec.ts`,
`memory-suggestion-detector.spec.ts`, `memory-suggestion.service.spec.ts`,
`companion-forget.service.spec.ts`, `companion-memory.controller.spec.ts`, plus updated
`stream.service.spec.ts`, `conversation.service.spec.ts`, `prompt-builder.service.spec.ts`,
`prompt-injection-detector.spec.ts`.

Frontend tests: `message-item.test.tsx` (Memory Used display: no control with no memory, no
control without `conversationId`, expands into a real `MemoryCard` via `memoryApi.get`),
`memory-suggestion-card.test.tsx` (no API call on render; Remember proposes+accepts;
`PENDING_CONSENT` does not auto-accept; Not now dismisses and resolves even on failure; Never
remember this type updates consent), `forget-suggestion-card.test.tsx` (no API call on render;
single-candidate confirm; multi-candidate confirm sends every listed ID, never a silent single
pick; `NEVER_REMEMBER_TYPE` goes through consent, not deletion; Cancel calls nothing; the
no-candidates acknowledgement state has no destructive button).

Backend e2e (`apps/api/test/companion-memory.e2e-spec.ts`, 16 tests) and Playwright
(`apps/web/e2e/flow-13-companion-memory-suggestion-and-forget.spec.ts`, 5 tests) cover the full
Conversation → suggestion → accept → later retrieval → explanation → forget →
confirm-no-later-retrieval flow — both written and run against a live Postgres/Redis/Mailpit
stack during release closure. See `docs/progress/sprint-3c-final-report.md` §§13–14 for exact
results.

## Deliberate scope decision: no new Prisma migration this sprint

Every piece of new state introduced by this sprint is either (a) computed per-request and never
persisted (retrieval, suggestion detection, forget-intent detection, "skipped" explanations),
(b) stored in the existing `ConversationMessage.metadata` JSON column, or (c) an existing Sprint
3A mutation/audit action reused as-is. No new database models or columns were added for Sprint 3C.
