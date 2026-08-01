# Companion Core (Sprint 2B)

Companion Core is the production AI conversation layer behind `/companion`. It replaces Sprint 1's
rule-based Companion in place — same route, same nav entry, same Dashboard preview — with a real,
provider-backed, streaming conversation system.

**In scope:** conversation persistence, streaming, provider abstraction, prompt building, context
building, safety, retry/fallback, cost tracking, observability.

**Explicitly out of scope (do not add here):** embeddings, vector search, semantic memory
extraction, RAG, report generation, tarot, astrology, community features. Those belong to later
sprints and a separate Memory Engine, not to this module.

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
  cost/               CostControlService (per-user usage aggregates, no billing)
  observability/     ObservabilityService (structured logs + ProviderLog persistence)
```

## Request flow

1. `POST /companion/conversations` creates a `Conversation` row for the caller.
2. `POST /companion/conversations/:id/messages` persists the user's message. `SafetyService.checkInput`
   runs first — if it refuses (crisis, prompt injection, over length), a safe pre-written reply is
   persisted immediately and `requiresGeneration: false` is returned; no provider is ever called.
   Otherwise `requiresGeneration: true` is returned and the client opens the stream next.
3. `GET /companion/conversations/:id/messages/stream` (SSE, `@Sse()`) is the only place a provider is
   actually called. `StreamService.generate()`:
   - builds context (`ContextBuilderService`) and the full prompt (`PromptBuilderService`),
   - calls `ProviderOrchestratorService.stream(...)`,
   - forwards `token` chunks as they arrive,
   - on `done`, persists the assistant `ConversationMessage`, records cost (`CostControlService`),
     and logs the call (`ObservabilityService`),
   - runs `SafetyService.checkOutput` before the final content is persisted, refusing only on
     high-confidence fabricated-sensitive-data patterns.
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
  health(): Promise<boolean>;
  supportsStreaming(): boolean;
  supportsJson(): boolean;
  supportsVision(): boolean;
}
```

- **OpenAI, Anthropic, Gemini** are implemented against their REST APIs directly with native `fetch`
  (no vendor SDKs) — Chat Completions SSE for OpenAI, the Messages API's `content_block_delta` events
  for Anthropic, and the Generative Language API's `alt=sse` streaming for Gemini.
- **Mock** returns deterministic canned streamed text with no network call. It is the default for
  local dev, CI, and every automated test (`DEFAULT_AI_PROVIDER=mock`) and is always appended to the
  fallback chain as a last resort, so the app never hard-fails purely because every real provider is
  down.
- Provider selection is entirely environment-driven (`DEFAULT_AI_PROVIDER`, `FALLBACK_PROVIDER`) —
  never hard-coded in application code.
- Token counts are estimated with a chars/4 heuristic (`providers/token-estimate.util.ts`), a
  deliberate simplification over a real tokenizer to avoid a WASM/native dependency; it's adequate
  for cost estimation, not for hard token-limit enforcement.

## Retry and fallback (`provider-orchestrator.service.ts`)

- **Chain**: `DEFAULT_AI_PROVIDER` → `FALLBACK_PROVIDER` (if set and different) → `mock` (always
  appended if not already present). At most 3 distinct providers are ever tried for one turn.
- **Retry**: exponential backoff with jitter (`500ms * 2^attempt`, capped at 8s, ±20% jitter), up to
  `AI_MAX_RETRIES` attempts per provider, only for errors marked `retryable` (429, 5xx, timeout).
- **Fallback boundary**: falling through to the next provider is only allowed if no token has been
  emitted yet for the current attempt. Once streaming content has reached the caller, a later failure
  ends the turn with a retryable `error` chunk instead of silently switching providers mid-reply —
  switching voices mid-answer would be confusing and worse than just stopping.
- The chain is always finite; there is no path that can loop indefinitely.

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

One `AIUsage` row is written per completed or cancelled generation (provider, model, prompt/completion
tokens, estimated USD cost from `providers/pricing.ts`). `usageForUser`, `dailyUsageForUser`, and
`monthlyUsageForUser` aggregate these for reporting. This is recording and estimation only — there is
no billing integration and no hard spend cap in this sprint.

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

`mock` is rejected as `DEFAULT_AI_PROVIDER` in production at boot (env validation fails fast), and
selecting any real provider without its API key also fails fast, in every environment.
