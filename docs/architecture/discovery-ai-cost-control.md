# Discovery AI Cost-Control Parity (Sprint 12)

Closes the gap the Sprint 12 audit found (§22–§30): Tarot, Numerology, and Natal Chart each had a
daily *reading-count* ceiling but zero rate limiting, zero concurrency protection, and zero
`AIUsage`/`ProviderLog` visibility on their AI interpretation calls — while Companion has had all
three since Sprint 2B. This generalizes Companion's proven infrastructure across all four AI
surfaces rather than building three divergent copies.

## Control flow

Mirrors Companion's own ordering, adapted for Discovery's single-shot (not two-phase
message-then-stream) shape:

```
authenticate (JwtAuthGuard)
  → rate limit (DiscoveryThrottlerGuard, :id/interpret only)
  → ownership check (findOwned)
  → cost eligibility (CostControlService.checkBudget — GLOBAL per user)
  → concurrency lock (GenerationLockService.tryAcquireDiscovery — per feature+user+reading)
  → provider orchestration (ProviderOrchestratorService.stream, with attribution)
    → ProviderLog written for every attempt (success or failure) — ObservabilityService
  → AIUsage recorded once, only on a real completed generation — CostControlService.record
  → persist interpretation (or leave null — never blocks the deterministic result)
  → release lock (finally)
```

Split across two layers per surface, mirroring Companion's own `ConversationService`
(budget)/`StreamService` (lock + recording) split:

- **`{Tarot,Numerology,NatalChart}RecordService.generateInterpretation`** — owns the budget check
  and the concurrency lock acquire/release. Called from both `draw()`/`calculate()`/`create()`
  (the initial, best-effort inline attempt) and `retryInterpretation()` (the user-facing retry,
  and the confirmed abuse vector — audit §30).
- **`{Tarot,Numerology,NatalChart}InterpretationService.interpret()`** — owns the actual provider
  call, forwards `feature`/`sourceId` attribution to the orchestrator, and records `AIUsage` +
  logs usage once a real `done` chunk is received (regardless of whether the output was ultimately
  safety-refused or, for Natal Chart, failed structured-JSON parsing — a real token cost was
  incurred either way).

## Feature attribution

New `AIFeature` enum (`COMPANION | TAROT | NUMEROLOGY | NATAL_CHART`, Prisma schema) and its
TypeScript mirror (`companion/providers/ai-feature.types.ts`, lowercase union — `'companion' |
'tarot' | 'numerology' | 'natal_chart'`, mapped via `toPrismaAIFeature()` exactly like
`AIProviderName`/`toPrismaProviderName()` already worked for providers). `AIUsage`/`ProviderLog`
each gained `feature` (`@default(COMPANION)` — safe and factually accurate for every pre-Sprint-12
row, since Companion was the sole writer of both tables before this sprint) and `sourceId`
(unenforced `String?`, mirroring this schema's existing `sourceType`/`sourceId` precedent used by
`MemorySourceType`/`JournalSourceType`/`ReflectionSourceType`/etc. — Discovery readings live in
separate tables per surface, so this stays a plain reference, not an FK). Migration:
`20260816134552_sprint12_ai_feature_attribution`, additive-only, verified against real data (113
pre-existing `AIUsage` rows, 70 `ProviderLog` rows, all correctly backfilled `COMPANION`, zero data
loss).

## Budget semantics — deliberately GLOBAL per user

`CostControlService.checkBudget(userId)` is **unchanged** — no `feature` parameter, no per-feature
limit. The query has no `feature` filter and never gained one: it aggregates every `AIUsage` row
for a user regardless of which surface produced it. This is a security decision, not an oversight:
adding Discovery attribution must not let a user quadruple their effective AI spend ceiling by
switching features. A user's daily-request/daily-token/monthly-token budget is shared across
Companion + Tarot + Numerology + Natal Chart combined, exactly as it was (implicitly, since
Companion was the only writer) before this sprint. `record()` gained a required `feature` param
purely for attribution — it never affects what `checkBudget()` reads.

## Rate limiting

One shared `discovery`/`discovery-ip` throttler bucket pair (`app.module.ts`, mirrors
`companion`/`companion-ip`'s own registration), applied via `DiscoveryThrottlerGuard`
(`common/guards/discovery-throttler.guard.ts`) to exactly the three `:id/interpret` retry
endpoints — the confirmed abuse vector (audit §30), not every deterministic read endpoint.
Defaults: `DISCOVERY_RATE_LIMIT_MAX=10`/60s per user, `DISCOVERY_RATE_LIMIT_IP_MAX=50`/60s per IP —
tighter than Companion's 20/60s, since a Discovery interpret call is one heavier single-shot
generation, not a chat message. One shared bucket across all three surfaces (not three separate
buckets) since they carry the same abuse profile and cost shape; per-surface distinction lives in
`AIUsage`/`ProviderLog` attribution instead.

Isolation: every other controller using a `ThrottlerGuard` (`auth`, `companion`,
`payment`/checkout, `notifications`, the three export controllers) now also
`@SkipThrottle({ ..., discovery: true, 'discovery-ip': true })`, mirroring the exact isolation
`f8fcba1` established for `auth` vs `companion` — a new named throttler is checked against every
guarded route by default, not just the route(s) that name it in their own `@Throttle()`.

## Concurrency lock

`GenerationLockService` generalized (not rewritten) with `tryAcquireDiscovery`/`releaseDiscovery`,
alongside the original `tryAcquire`/`release` (untouched, still Companion-only, key prefix
`companion:concurrency:*`). Discovery's key: `discovery:concurrency:{feature}:{userId}:{sourceId}`
— scoped per `(feature, user, reading)`, not per-user-globally like Companion's own lock. This is
deliberate: Companion's single global slot per user makes sense for a live-chat UX where "only one
reply in flight" is a real product constraint; Discovery has no equivalent constraint. A lock that
broad here would mean a Tarot retry blocks a Numerology calculation for no reason, or two different
Tarot readings block each other for no reason — neither is the actual abuse vector. Scoping to the
exact reading being retried closes the real vector (rapid-fire retries against the *same* reading)
without any unnecessary cross-feature or cross-reading blocking. Same fail-open/TTL-self-heal
semantics as Companion (reuses `AI_MAX_CONCURRENT_GENERATIONS_PER_USER`/`AI_CONCURRENCY_LOCK_TTL_MS`
— same mechanism, different namespace, no new config needed).

## Failure semantics

A budget-exceeded or lock-rejected generation attempt is treated **identically to a provider
failure** from the caller's perspective: logged server-side (`Tarot interpretation skipped for
reading=... : daily_request_limit` / `... concurrent generation already in flight`), the reading's
`interpretation` stays `null`, and `retryInterpretation()` still returns `200` with the unchanged
reading — never a `429`/error response. This is deliberate scope discipline, not an oversight: the
existing "Interpretation isn't ready yet" + retry UX already covers this state honestly, and
inventing a new error/toast/UI state for budget-exceeded or lock-rejected would mean redesigning
Discovery UX this sprint is explicitly not supposed to touch. The rate limiter (a real `429`) is
the user-visible "too fast" signal; the budget check and lock are invisible backend cost/
concurrency protection layered underneath it.

Failed provider calls never create phantom `AIUsage` rows — `record()` is only ever called after a
real `done` chunk was received from the orchestrator (see each `interpret()`'s `usage && provider`
gate). `ProviderLog` rows are written for every attempt, success or failure (unchanged Companion
behavior, now attributed by feature) — that table has always recorded attempts, not just
successes.

## Verified

- Full backend unit suite: 104 suites / 999 tests, including new coverage for cost/lock/
  attribution parity across all three Discovery surfaces.
- Full backend e2e suite against real Postgres + Redis: 18 suites / 239 tests, including
  `tarot.e2e-spec.ts`/`numerology.e2e-spec.ts`/`natal-chart.e2e-spec.ts`.
- Migration verified against real pre-existing data (113 `AIUsage` + 70 `ProviderLog` rows,
  correctly backfilled, zero loss).
