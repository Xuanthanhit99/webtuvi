# Companion Core (Sprint 2B)

Companion Core is the production AI conversation layer behind `/companion`. It replaces Sprint 1's
rule-based Companion in place — same route, same nav entry, same Dashboard preview — with a real,
provider-backed, streaming conversation system.

**In scope:** conversation persistence, streaming, provider abstraction, prompt building, context
building, safety, retry/fallback, cost tracking, observability.

**Explicitly out of scope (do not add here):** embeddings, vector search, semantic memory
extraction, RAG, report generation, tarot, astrology, community features. Those belong to later
sprints and a separate Memory Engine, not to this module — this remains true after Sprint 3C's
memory integration below, which calls Memory Intelligence's existing deterministic retrieval
rather than adding any embedding/semantic capability here.

## Module layout

```
apps/api/src/companion/
  conversation/     Conversation + ConversationMessage persistence, the two REST endpoints
  stream/            SSE endpoint + generation orchestration for one turn
  providers/         AIProvider interface, OpenAI/Anthropic/Gemini/Mock implementations,
                      registry, retry+fallback orchestrator, pricing, token estimation
  prompt/            System prompt text + PromptBuilderService (assembles the full message array)
  context/           ContextBuilderService (profile/preferences/onboarding/activity/time — no memory engine)
  safety/            Input/output moderation, crisis detection, prompt-injection detection, PII heuristics
  cost/               CostControlService (per-user usage aggregates + daily/monthly budget enforcement)
  concurrency/       GenerationLockService (Redis-backed per-user concurrent-generation cap)
  observability/     ObservabilityService (structured logs + ProviderLog persistence)
  memory/            Sprint 3C — MemoryContextAssembler/MemoryExplanationService/
                      MemorySuggestionService/CompanionForgetService: the sole integration point
                      with Memory Intelligence (calls MemoryRetrievalService.recommend(), never
                      reads the Memory Prisma model directly). See
                      docs/architecture/companion-memory-integration.md.
```

`common/guards/companion-throttler.guard.ts` (outside this module, alongside the other request guards)
applies the per-user + per-IP request rate limit to the message-send endpoint.

## Request flow

1. `POST /companion/conversations` creates a `Conversation` row for the caller.
2. `POST /companion/conversations/:id/messages` is guarded by `CompanionThrottlerGuard` (per-user +
   per-IP rate limit — see "Rate limiting, concurrency, and usage budget" below). If it passes,
   `ConversationService.sendMessage` first checks the caller's usage budget
   (`CostControlService.checkBudget`) — if exceeded, a normalized `429 AI_BUDGET_EXCEEDED` is returned
   and nothing is persisted. Otherwise `SafetyService.checkInput` runs — if it refuses (crisis, prompt
   injection, over length), a safe pre-written reply is persisted immediately and
   `requiresGeneration: false` is returned; no provider is ever called. Otherwise
   `requiresGeneration: true` is returned and the client opens the stream next.
3. `GET /companion/conversations/:id/messages/stream` (SSE, `@Sse()`) is the only place a provider is
   actually called. `StreamService.generate()`:
   - acquires a per-user concurrency lock (`GenerationLockService.tryAcquire`) — if another generation
     for this user is already active, ends immediately with a `stream_error`
     (`code: 'CONCURRENT_GENERATION'`), no provider call, nothing persisted,
   - builds context (`ContextBuilderService`) and the full prompt (`PromptBuilderService`),
   - calls `ProviderOrchestratorService.stream(...)`,
   - forwards `token` chunks as they arrive,
   - on `done`, persists the assistant `ConversationMessage` (tagged with `PROMPT_VERSION`), records
     cost (`CostControlService`), and logs the call (`ObservabilityService`),
   - runs `SafetyService.checkOutput` before the final content is persisted, refusing only on
     high-confidence fabricated-sensitive-data patterns,
   - releases the concurrency lock in a `finally` block covering every exit path (success, provider
     error, cancellation, client disconnect, timeout).
4. Cancellation is just the browser closing the `EventSource`. The controller's `AbortController` is
   wired through the RxJS teardown into `StreamService` and down into the active provider's `stream()`
   call, so an aborted request stops mid-generation rather than finishing server-side unseen.

## Provider abstraction

`providers/ai-provider.interface.ts` defines `AIProvider`:

```ts
interface AIProvider {
  readonly name: AIProviderName; // 'openai' | 'anthropic' | 'gemini' | 'mock'
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;
  stream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk>;
  countTokens(text: string): number;
  estimateCost(promptTokens: number, completionTokens: number, model: string): number;
  supportsStreaming(): boolean;
  supportsJson(): boolean;
  supportsVision(): boolean;
}
```

(An earlier `health(): Promise<boolean>` method was removed — Sprint 2B audit Finding 7 — it was
never called anywhere in the request path; nothing currently needs a standalone reachability check
outside of actually attempting a generation.)

- **OpenAI, Anthropic, Gemini** are implemented against their REST APIs directly with native `fetch`
  (no vendor SDKs) — Chat Completions SSE for OpenAI, the Messages API's `content_block_delta` events
  for Anthropic, and the Generative Language API's `alt=sse` streaming for Gemini.
- **Mock** returns deterministic canned streamed text with no network call. It is the default for
  local dev, CI, and every automated test (`DEFAULT_AI_PROVIDER=mock`). Since the Sprint 2B audit
  (Finding 1), it is registered only outside production (or behind `AI_ENABLE_MOCK_PROVIDER=true`,
  itself rejected in production at boot) and is **never** appended to the fallback chain
  automatically — see `docs/security/ai-safety.md` "Mock provider: never reachable in production" for
  the full reasoning.
- Provider selection is entirely environment-driven (`DEFAULT_AI_PROVIDER`, `FALLBACK_PROVIDER`) —
  never hard-coded in application code.
- Token counts are estimated with a chars/4 heuristic (`providers/token-estimate.util.ts`), a
  deliberate simplification over a real tokenizer to avoid a WASM/native dependency; it's adequate
  for cost estimation, not for hard token-limit enforcement.

## Retry and fallback (`provider-orchestrator.service.ts`)

- **Chain**: `DEFAULT_AI_PROVIDER` → `FALLBACK_PROVIDER` (if set, different, and registered). `mock`
  only appears here if it was explicitly configured as one of those two *and* it's actually
  registered (never true in production — see "Mock provider" above). At most 3 distinct providers are
  ever tried for one turn.
- **Retry**: exponential backoff with jitter (`500ms * 2^attempt`, capped at 8s, ±20% jitter), up to
  `AI_MAX_RETRIES` attempts per provider, only for errors marked `retryable` (429, 5xx, timeout).
- **Fallback boundary**: falling through to the next provider is only allowed if no token has been
  emitted yet for the current attempt. Once streaming content has reached the caller, a later failure
  ends the turn with a retryable `error` chunk (`code: 'GENERATION_INTERRUPTED'`) instead of silently
  switching providers mid-reply — switching voices mid-answer would be confusing and worse than just
  stopping.
- **Exhaustion**: if every provider in the chain fails without emitting a token, the turn ends with a
  single retryable `error` chunk, `code: 'PROVIDER_UNAVAILABLE'`. No assistant message is persisted,
  no `AIUsage` row is written.
- The chain is always finite; there is no path that can loop indefinitely.

## Rate limiting, concurrency, and usage budget (Sprint 2B audit Finding 2)

Full design and reasoning in `docs/security/ai-safety.md` — summary here:

- **Request rate limit**: `CompanionThrottlerGuard`, per-user (`AI_RATE_LIMIT_MAX` /
  `AI_RATE_LIMIT_WINDOW_MS`) + per-IP (`AI_RATE_LIMIT_IP_MAX`), on `POST .../messages`. Reuses the
  Sprint 2A Redis-backed `ThrottlerModule`. Returns `429 RATE_LIMITED` with `Retry-After`.
- **Concurrent-generation limit**: `GenerationLockService`, an atomic Redis counter capping
  `AI_MAX_CONCURRENT_GENERATIONS_PER_USER` active generations per user, acquired/released around
  `StreamService.generate()`'s entire body (`try`/`finally`), with a `AI_CONCURRENCY_LOCK_TTL_MS`
  safety-net TTL. Rejected attempts get `stream_error`, `code: 'CONCURRENT_GENERATION'`.
- **Usage budget**: `CostControlService.checkBudget`, checked in `ConversationService.sendMessage`
  before anything is persisted — `AI_DAILY_REQUEST_LIMIT`, `AI_DAILY_TOKEN_LIMIT`,
  `AI_MONTHLY_TOKEN_LIMIT`, read from already-persisted `AIUsage` rows only. Returns
  `429 AI_BUDGET_EXCEEDED`.

None of these three ever falls back to Mock — each is a clean, normalized rejection.

## Prompt Builder (`prompt/prompt-builder.service.ts`)

Builds the exact message array sent to a provider: one `system` message (from
`buildSystemPrompt(context)`, see `ai-safety.md`) + capped conversation history, in order + the new
user message last. History is capped (`MAX_HISTORY_TURNS`) so a very long conversation doesn't grow
the prompt unbounded. It is a small, pure, independently unit-tested class — no prompt text is
hand-written inline in `StreamService` or elsewhere.

## Context Builder (`context/context-builder.service.ts`)

Gathers, via direct Prisma reads only (no embeddings, no inference):

- User profile (display name, timezone, locale, pronouns)
- Preferences (memory preference, reflection frequency)
- Onboarding completion state
- Recent activity labels (via the existing `ActivitiesService`, last 5)
- Up to 3 other recent conversations' last-message excerpts, for continuity without a memory engine
- Current time, formatted in the user's timezone (falls back to UTC for an invalid/unknown zone)

## Cost control (`cost/cost-control.service.ts`)

One `AIUsage` row is written per completed generation (provider, model, prompt/completion tokens,
estimated USD cost from `providers/pricing.ts`) — never for a cancelled/failed one, see "Retry and
fallback" above. `usageForUser`, `dailyUsageForUser`, and `monthlyUsageForUser` aggregate these for
reporting. `checkBudget` (added in the Sprint 2B audit remediation — Finding 2) enforces
`AI_DAILY_REQUEST_LIMIT`/`AI_DAILY_TOKEN_LIMIT`/`AI_MONTHLY_TOKEN_LIMIT` against these same
aggregates, called from `ConversationService.sendMessage` before anything is persisted. This is still
recording/estimation, not a billing system — there is no billing integration and `estimatedCostUsd`
is not an invoice line item — but usage is no longer unbounded.

## Observability (`observability/observability.service.ts`)

Every provider call attempt is logged (structured log line + a `ProviderLog` row): provider, model,
latency, success/failure, error code, retry count, stream duration. **Conversation content, PII,
passwords, and email addresses are never logged or persisted here** — see `docs/security/ai-safety.md`
for the full rule and reasoning. A failure to write a `ProviderLog` row is caught and logged but never
allowed to break the actual conversation flow.

## Data model

- `Conversation` (`conversations`): one per thread, `ACTIVE`/`ARCHIVED` status, belongs to a `User`.
- `ConversationMessage` (`conversation_messages`): `SYSTEM`/`USER`/`ASSISTANT` role, `content`, and a
  `metadata` JSON field reserved for non-sensitive generation facts (provider, model,
  cancelled/safety-refused flags) — never raw provider request/response payloads.
- `AIUsage` (`ai_usages`): one row per completed/cancelled generation, the basis for cost aggregates.
- `ProviderLog` (`provider_logs`): one row per provider call attempt, the basis for observability.

## Replacing Sprint 1's rule-based Companion

Sprint 1's Companion was an intentionally temporary, rule-based implementation. Per an explicit
product decision, Sprint 2B replaced it **in place**:

- The public route stays `/companion`; the Dashboard's "Companion" nav entry is unchanged.
- The old `CompanionController`/`CompanionService`/`companion-script.ts` (rule-based reply generation)
  are deleted — there are no two parallel Companion systems.
- The Dashboard's Companion preview panel (`dashboard.service.ts`) now reads the 3 most recent messages
  from the caller's latest `Conversation` instead of the old `CompanionMessage` table.
- Existing `CompanionMessage` rows (`context: 'COMPANION'`) are **not deleted**. A one-time data
  migration (in the same Prisma migration as the new tables) copies compatible rows into the new
  `Conversation`/`ConversationMessage` model, grouped by user, preserving timestamps and role mapping.
  The old table itself is kept (onboarding still writes `CompanionMessage` rows with
  `context: 'ONBOARDING'`, which is unrelated to the old rule-based Companion and was never touched).

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | Provider credentials | unset (optional unless that provider is selected) |
| `DEFAULT_AI_PROVIDER` | `openai` \| `anthropic` \| `gemini` \| `mock` | `mock` |
| `FALLBACK_PROVIDER` | Same enum, optional | unset |
| `AI_TIMEOUT_MS` | Per-request timeout | `30000` |
| `AI_MAX_RETRIES` | Retries per provider before falling back | `2` |
| `AI_ENABLE_MOCK_PROVIDER` | Explicit opt-in for the Mock provider to be registered at all | `false` |
| `AI_RATE_LIMIT_MAX` / `AI_RATE_LIMIT_WINDOW_MS` | Per-user request rate limit on `POST .../messages` | `20` / `60000` |
| `AI_RATE_LIMIT_IP_MAX` | Secondary per-IP rate limit ceiling, same window | `100` |
| `AI_MAX_CONCURRENT_GENERATIONS_PER_USER` | Concurrent-generation cap per user | `1` |
| `AI_CONCURRENCY_LOCK_TTL_MS` | Safety-net TTL on the Redis concurrency-lock counter | `120000` |
| `AI_DAILY_REQUEST_LIMIT` | Max completed generations per user per day | `50` |
| `AI_DAILY_TOKEN_LIMIT` | Max total tokens per user per day | `200000` |
| `AI_MONTHLY_TOKEN_LIMIT` | Max total tokens per user per month | `2000000` |

`mock` is rejected as `DEFAULT_AI_PROVIDER`, `FALLBACK_PROVIDER`, or (via `AI_ENABLE_MOCK_PROVIDER`)
as a registrable provider at all, in production at boot (env validation fails fast) — see
`docs/security/ai-safety.md` "Mock provider: never reachable in production". Selecting any real
provider without its API key also fails fast, in every environment.
