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

If every provider in the configured chain (including the always-present `mock` fallback) fails before
emitting any content, the stream ends with a single retryable `error` chunk
("All AI providers are currently unavailable. Please try again shortly.") rather than a raw exception
or a silent hang. See `companion-core.md` "Retry and fallback" for the full chain/backoff design.
