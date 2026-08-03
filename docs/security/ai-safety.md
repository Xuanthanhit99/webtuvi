# Companion Core: AI Safety

This document covers the safety design of Companion Core (Sprint 2B) — the behavioral contract
enforced on the model, the layered input/output moderation, and what is and isn't logged. For the
system's overall architecture, see `docs/architecture/companion-core.md`.

## System prompt rules

Every generation includes a fixed system prompt (`prompt/system-prompt.ts`) that is the single source
of the Companion's behavioral contract — no other code path hand-writes safety or tone instructions.
The hard rules, sent to the model on every single turn:

- Never manipulate, guilt, pressure, or use dark patterns to keep someone engaged.
- Never pretend to remember something that wasn't actually provided in this conversation or the
  context passed to it. If it's missing, say so or ask — don't guess and present it as fact.
- Never diagnose a mental health condition, medical condition, or disorder.
- Never claim to be a therapist, doctor, or licensed professional, or imply guidance replaces one.
- Never fabricate memories, facts about the person, or events that weren't told to it.
- Take real distress seriously and gently, without diagnosing, and without acting like it's the
  person's only support.

These rules are prompt-level instructions to the model, not a hard technical guarantee — they are
backed by the output-moderation layer below for the one case that's both detectable and high-stakes
(fabricated sensitive data), but are not a substitute for it.

## Layered safety checks (`safety/safety.service.ts`)

### Input moderation (`checkInput`, before any provider is called)

Checked in order, first match wins — none of these ever reach a provider:

1. **Length** — over `MAX_INPUT_LENGTH` (4000 chars) is refused with a plain "too long" message. This
   is defense-in-depth alongside the DTO's own `@MaxLength` validation, not a duplicate of it.
2. **Crisis language** (`crisis-detector.ts`) — heuristic, keyword-based pattern matching for
   suicide/self-harm language (e.g. "kill myself", "no reason to live", "self-harm"). On a match, the
   user's message is still persisted, but generation is skipped entirely and a pre-written response
   with crisis resources (988 in the US, general guidance elsewhere) is persisted and returned
   immediately — `requiresGeneration: false`. This is intentionally not an LLM-based classifier: no
   provider round-trip happens before it's established that it's even safe to call one, and it's fast
   and deterministic. It's one layer of defense, not a clinical tool, and false negatives are possible.
3. **Prompt injection** (`prompt-injection-detector.ts`) — narrow, high-confidence patterns only
   ("ignore previous instructions", "reveal your system prompt", "developer mode", "jailbreak", "DAN",
   "do anything now"). Deliberately kept narrow to avoid false-positiving on ordinary emotional
   language like "pretend everything's fine".

### Output moderation (`checkOutput`, after generation, before persisting the reply)

- **Fabricated sensitive data** (`pii-detector.ts`'s `detectHighConfidenceFabrication`) — checks the
  model's own output for SSN-shaped or credit-card-shaped strings. If found, the reply is not shown;
  a message explaining the model noticed it was about to state something it was never given is shown
  instead. This check is deliberately narrow: email and phone number *shapes* alone are too common in
  ordinary legitimate conversation to block on (a user sharing their own contact info is fine), so
  only SSN/credit-card patterns trigger a refusal. The broader `detectPii` helper (also flags
  email/phone) exists for potential future use but is not used to gate output today.

### Refusal policy

A refusal (input or output) never silently fails — it always returns a specific, calm, pre-written
message appropriate to the category (crisis resources, "I can't do that", length guidance, or the
fabrication notice). The user is never shown a generic error for a safety refusal, and a crisis refusal
always still persists the user's own message, so the conversation record isn't silently incomplete.

### Token limit and timeout

- Input length is capped at `MAX_INPUT_LENGTH` (4000 chars) as above.
- Each provider call is bounded by `AI_TIMEOUT_MS` (default 30000ms); a timeout is treated as a
  retryable error by the orchestrator (see `companion-core.md` "Retry and fallback").

## Observability: what is and isn't recorded

`observability/observability.service.ts` logs, per provider call attempt (structured log line + a
persisted `ProviderLog` row): provider name, model, latency, success/failure, error code, retry count,
stream duration.

**Never logged or persisted, anywhere in Companion Core: conversation content, PII, passwords, or
email addresses.** The `ConversationMessage.metadata` JSON field is reserved for non-sensitive
generation facts (provider, model, cancelled/safety-refused flags) — never raw provider request or
response bodies, and never the message text itself (that lives only in `ConversationMessage.content`,
which is not part of the observability trail). Safety refusals are logged by category only
(`SafetyService.logRefusal`) — the offending text itself is never included in a log line.

A failure to write a `ProviderLog` row is caught and logged, but is never allowed to break the actual
conversation flow — observability is best-effort and must not become a new failure mode for the
product.

## Provider-unavailable / all-providers-down behavior

If every provider in the configured chain fails before emitting any content, the stream ends with a
single retryable `error` chunk, `code: 'PROVIDER_UNAVAILABLE'` ("All AI providers are currently
unavailable. Please try again shortly.") rather than a raw exception or a silent hang. **No assistant
message is persisted and no `AIUsage` row is written for this** — the user is never shown, and never
charged for, a reply that didn't actually happen. See `companion-core.md` "Retry and fallback" for the
full chain/backoff design.

## Mock provider: never reachable in production (Sprint 2B audit Finding 1)

An earlier version of this sprint unconditionally appended the deterministic `MockProvider` to the end
of every fallback chain, in every environment — including, in principle, production, if every real
provider happened to fail. That meant a production outage of every configured real provider could have
silently resolved to a fabricated, canned reply presented as a real one, directly contradicting the
rule above. This has been closed with two independent, defense-in-depth layers:

1. **Registration gate** (`providers/provider-registry.service.ts`): `MockProvider` is only ever
   constructed/registered when `NODE_ENV !== 'production'`, or `AI_ENABLE_MOCK_PROVIDER=true` is
   explicitly set (default `false`). In production, it is simply never in the registry — `has('mock')`
   returns `false` — so nothing downstream can select it even if misconfigured to try.
2. **Boot-time validation** (`config/env.validation.ts`): in production, boot fails fast if
   `DEFAULT_AI_PROVIDER=mock`, `FALLBACK_PROVIDER=mock`, or `AI_ENABLE_MOCK_PROVIDER=true` is set —
   the dangerous configuration can never even reach the registry.
3. **No unconditional chain append**: `ProviderOrchestratorService.chain()` no longer appends `'mock'`
   to the fallback chain by default under any circumstance. `mock` only ever appears in the chain if
   it was explicitly configured as `DEFAULT_AI_PROVIDER`/`FALLBACK_PROVIDER` *and* it's actually
   registered — both of which are already excluded in production by (1) and (2) above.

If all configured real providers fail, production now correctly surfaces `PROVIDER_UNAVAILABLE`
(above) instead of silently falling back to Mock. Outside production, `mock` remains the default and
is registered automatically — no behavior change for local dev/CI/tests.

## Rate limiting, concurrent-generation limit, and usage budget (Sprint 2B audit Finding 2)

Companion generation was previously unbounded: any authenticated user could send unlimited messages,
each potentially triggering a real, billed provider call, with no per-user cap. Three independent,
complementary controls now apply:

- **Request rate limit** (`common/guards/companion-throttler.guard.ts`, applied to
  `POST /companion/conversations/:id/messages`): a per-user bucket (`AI_RATE_LIMIT_MAX` per
  `AI_RATE_LIMIT_WINDOW_MS`, default 20/60s) plus a looser secondary per-IP bucket
  (`AI_RATE_LIMIT_IP_MAX`, default 100/60s) as defense against one IP spread across many accounts.
  Reuses the Sprint 2A Redis-backed `ThrottlerModule` infrastructure (cross-instance-safe, fails open
  if Redis is unreachable — same trade-off as the existing auth rate limiter). Exceeding either
  returns `429` with a normalized `{code: 'RATE_LIMITED', message}` body and a `Retry-After` header.
- **Concurrent-generation limit** (`companion/concurrency/generation-lock.service.ts`, enforced in
  `StreamService.generate()`): caps how many generations one user can have in flight at once
  (`AI_MAX_CONCURRENT_GENERATIONS_PER_USER`, default 1) via an atomic Redis counter. Acquired before
  a provider is ever called and released in a `finally` block covering every exit path — success,
  provider error, cancellation, client disconnect, timeout — so a lock is never left held past its
  turn. A safety-net TTL (`AI_CONCURRENCY_LOCK_TTL_MS`, default 120s) self-expires the counter if a
  release is ever missed (e.g. a process crash). Rejected attempts get a `stream_error` with
  `code: 'CONCURRENT_GENERATION'`, no provider call, nothing persisted.
- **Usage budget** (`companion/cost/cost-control.service.ts`'s `checkBudget`, enforced in
  `ConversationService.sendMessage` before anything is persisted): a coarse daily/monthly ceiling —
  `AI_DAILY_REQUEST_LIMIT` (default 50 completed generations/day), `AI_DAILY_TOKEN_LIMIT` (default
  200,000 tokens/day), `AI_MONTHLY_TOKEN_LIMIT` (default 2,000,000 tokens/month) — read from
  already-persisted, billable `AIUsage` rows only (never from in-flight or failed attempts, which are
  tracked separately via `ProviderLog` and never reach `AIUsage`). Exceeding any of these returns `429`
  with `{code: 'AI_BUDGET_EXCEEDED', message}`, before the user's message is even persisted.

**Counting rules, stated explicitly:**
- `AIUsage` (billable/final usage) is written exactly once per completed generation, only from
  `StreamService`'s `'done'` branch — never for a retried attempt, a fallback attempt, or a total
  chain failure. Retries and per-attempt failures are recorded separately, in `ProviderLog`
  (observability), which is never read for budget purposes.
- Neither the rate limit, the concurrency lock, nor the budget check ever falls back to Mock —
  exceeding any of them is a clean, normalized rejection, not a degraded-but-successful response.

**Residual risk**: the rate limit and budget checks fail open if Redis/Postgres are briefly
unreachable (consistent with the existing Sprint 2A availability-over-strictness trade-off for rate
limiting) — a short infrastructure outage could theoretically let a burst of requests through
unthrottled rather than blocking the whole product. This is an accepted, disclosed trade-off, not an
oversight.

## Prompt versioning

`prompt/system-prompt.ts` exports `PROMPT_VERSION` (currently `'companion-core-v1'`), recorded in the
`metadata` of every persisted assistant `ConversationMessage`. Bump it whenever the system prompt's
rules or fact-assembly logic change materially, so a future behavior shift in stored conversations can
be correlated back to a specific prompt revision instead of being unattributable.
