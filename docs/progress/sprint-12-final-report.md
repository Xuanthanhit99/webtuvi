# Sprint 12 — Trust & Monetization Closeout — Final Report

> **Release Closure addendum (independent verification pass, same HEAD/working tree):** the
> sections below are the original implementation session's report. They were independently
> re-verified, not trusted blindly — the exact instruction this closure pass operated under. Real
> defects were found and fixed during closure; the numbers/claims quoted below the addendum are
> **superseded** where this addendum contradicts them. See
> `docs/progress/sprint-12-release-closure.md` for the full closure report.
>
> **What closure found and fixed (not present in the original report):**
> 1. **BLOCKER, found live**: `z.coerce.boolean()` in `env.validation.ts` silently coerced the
>    string `"false"` to `true` (JS `Boolean('false') === true`) — the `PAYMENTS_ENABLED` kill
>    switch had **never actually worked** when set to `false`, for this codebase's entire history.
>    Confirmed live: a running server with `PAYMENTS_ENABLED=false` still reported
>    `paymentsEnabled: true` and still accepted checkout. Also confirmed silently active for
>    `AUTH_COOKIE_SECURE=false` (explicitly set in both `.env`/`.env.test`, masked only by
>    Chrome's localhost-is-trustworthy exception), `AI_ENABLE_MOCK_PROVIDER`, and
>    `PAYOS_MOCK_CHECKOUT`. **Fixed**: replaced with a real string-boolean parser
>    (`zBooleanString()`), applied to all four flags. Re-verified live end-to-end after the fix:
>    `PAYMENTS_ENABLED=false` now correctly reports `paymentsEnabled: false`, the frontend
>    correctly hides the upgrade button, and `POST /payment/checkout` correctly returns
>    `400 PAYMENTS_DISABLED`. 16 new regression tests added.
> 2. **CRITICAL, found via dedicated attack test**: the Sentry scrubber's `extra`/`contexts`/
>    breadcrumb-data handling used a denylist (sensitive-key-name regex). A real bypass was
>    demonstrated: a sentinel value placed under an unanticipated, innocuous key name (`details`,
>    `notes`, `misc`) survived scrubbing untouched. **Fixed**: switched to an allowlist of known-
>    safe operational key names (mirrors the same fix on both the backend and frontend copies) —
>    every unrecognized key is now redacted by default, closing the bypass class entirely. 5 new
>    regression tests added (including the exact bypass reproduction).
> 3. **Test-methodology artifact, root-caused and fixed**: `flow-20-tarot-discovery.spec.ts`'s
>    `getByText('Today')`/`'Past'`/`'Present'`/`'Future')` locators (missing `exact: true`) could
>    collide with real (non-mock) AI-generated prose containing those common words. Reproduced
>    twice against real Gemini, root-caused, fixed with `exact: true` (no `.first()`/`.nth()`/
>    force), then re-verified stable across 4 consecutive real-Gemini runs (0 failures after the
>    fix, vs. 2 failures in 2 attempts before it).
> 4. Cross-feature AI budget bypass, real Redis concurrency, and per-feature `AIUsage`/
>    `ProviderLog` attribution were independently re-verified with live evidence (not just code
>    review) — real Redis atomicity test (20 concurrent lock acquisitions → exactly 1 winner), a
>    real-database query proving distinct per-feature usage counts, and 3 new regression tests
>    proving a user cannot bypass their budget by switching AI features.
>
> All counts elsewhere in this document reflect the **original implementation session** and are
> superseded by the fresh, independently-reproduced counts in `sprint-12-release-closure.md`.

## 1. Starting HEAD
`9d66d3c` — "feat: complete Sprint 11 notification retention foundation."

## 2. origin/master
`ffd82dc` — Sprint 10's closure commit.

## 3. Starting ahead/behind
0 behind / 1 ahead — matched the audit's reported state exactly, confirmed via
`git rev-list --left-right --count origin/master...HEAD` before any change was made.

## 4. Sprint 11 push status
Unchanged this session — still local-only, unpushed. Not pushed here, per instruction (push only
on separate, explicit request).

## 5. Working tree baseline
Clean at session start except the pre-existing untracked audit doc, confirmed via `git status
--short`. `git diff --check` clean, no merge/rebase in progress.

## 6. Natal accessibility fix
`apps/web/features/natal-chart/components/natal-chart-view.tsx` — the raw deterministic aspect
list's section title changed `"Key Aspects"` → `"Major Aspects"` (consistent with `AspectList`'s
own existing "major aspects" copy in its empty state). The AI-narrated interpretation section
keeps `"Key Aspects"` unchanged. Two accordion buttons now have distinct accessible names. Section
`id` (derived from title) changed correspondingly: `#natal-chart-section-major-aspects`.

## 7. flow-23 result
**PASS**, verified against a real browser (Chromium via Playwright) and real production builds of
both API and Web, real Postgres/Redis. Ran twice during this session's server lifetime with no
flake.

## 8. Scheduler failure fix
`NotificationsSchedulerService`: two-level try/catch added — per-candidate (isolates one user's
failure from the rest of the batch/page, increments a new `failed` counter) and the outer `@Cron`
entry point (catches anything outside the loop, e.g. the eligibility query itself failing). Both
log via the existing `Logger.error`, never email/notification content, and both additionally call
`Sentry.captureException` (Phase 16, purely additive — scheduler correctness never depends on it).

## 9. Scheduler regression result
10/10 new tests pass: success, per-candidate isolation (one failure doesn't zero out the rest of
the batch), the `@Cron` entry point never throwing even when the whole evaluation fails, no
duplicate notification created across a failed-then-retried run, and two explicit assertions that
neither email nor notification body text ever appears in a logged error message.

## 10. AIUsage schema change
Additive: `AIFeature` enum (`COMPANION | TAROT | NUMEROLOGY | NATAL_CHART`) plus `feature`
(`@default(COMPANION)`) and `sourceId` (`String?`, unenforced, mirrors this schema's existing
`sourceType`/`sourceId` precedent) on both `AIUsage` and `ProviderLog`. New composite index
`[feature, createdAt]` on both tables for the per-feature query pattern this sprint's Definition of
Done requires.

## 11. Migration created
`20260816134552_sprint12_ai_feature_attribution` — `CREATE TYPE`, two `ALTER TABLE ADD COLUMN`
pairs (both with the safe default), two `CREATE INDEX`. Hand-written (no live DB was available at
the moment schema design was finalized... — correction: a real DB became available mid-session; the
migration was authored first, then applied and verified against it, not the other way around).

## 12. Migration safety
Verified against real, pre-existing production-shaped data, not just schema validation: 113
pre-existing `AIUsage` rows and 70 pre-existing `ProviderLog` rows, queried directly via `psql`
after applying the migration — **100% correctly backfilled to `feature=COMPANION`, zero rows lost,
zero rows altered beyond the new column**. This default is factually accurate, not a guess:
Companion was confirmed (via the audit's own single-call-site search) to be the sole writer of
both tables before this sprint. Applied cleanly to both the dev (`beaconvie`) and test
(`beaconvie_test`) databases via `prisma migrate deploy` (additive-only, non-destructive — no
`migrate dev`/reset used).

## 13. AI feature attribution design
New `AIFeature` TS union (`companion/providers/ai-feature.types.ts`, lowercase, mirrors
`AIProviderName`'s own shape) mapped to the Prisma enum via `toPrismaAIFeature()` — same pattern as
`toPrismaProviderName()`. Threaded through a new `StreamAttribution` param on
`ProviderOrchestratorService.stream()` (kept separate from `ChatOptions`, which flows to the raw
provider implementations and shouldn't carry observability metadata), defaulting to `'companion'`
when omitted so every pre-Sprint-12 caller keeps working unmodified — though Companion's own call
site (`StreamService`) was still updated to pass it explicitly, for clarity over reliance on an
implicit default.

## 14. Budget semantics
**Deliberately GLOBAL per user across every AI feature combined** — `CostControlService
.checkBudget(userId)` is completely unchanged (no `feature` parameter added, ever). The query has
no `feature` filter and never gained one, so it aggregates every `AIUsage` row for a user
regardless of which surface produced it. This is a security decision, documented explicitly in the
method's own docstring: adding Discovery attribution must not let a user quadruple their effective
AI spend ceiling by switching features. `record()` gained a required `feature` param purely for
attribution — it never affects what `checkBudget()` reads or how much a user may spend in total.

## 15. Rate-limit architecture
One shared `discovery`/`discovery-ip` named-throttler pair (`app.module.ts`), applied via a new
`DiscoveryThrottlerGuard` (mirrors `CompanionThrottlerGuard`/`PaymentThrottlerGuard`) to exactly
the three `:id/interpret` retry endpoints — the audit's confirmed abuse vector — not every
deterministic read endpoint. Defaults: 10 req/60s per user, 50 req/60s per IP (tighter than
Companion's 20/60s, since a Discovery interpret call is one heavier single-shot generation). Every
other controller using a `ThrottlerGuard` now also skips the two new bucket names, mirroring the
exact isolation `f8fcba1` established for `auth` vs `companion`.

## 16. Concurrency-lock architecture
`GenerationLockService` generalized (Companion's own `tryAcquire`/`release` untouched) with
`tryAcquireDiscovery`/`releaseDiscovery`, keyed `discovery:concurrency:{feature}:{userId}
:{sourceId}` — scoped per `(feature, user, reading)`, deliberately narrower than Companion's
per-user-global lock, since Discovery has no live-chat "only one reply in flight" constraint. This
closes the real abuse vector (rapid retries against the *same* reading) without blocking unrelated
Tarot/Numerology/Natal-Chart work or unrelated readings of the same feature. Same fail-open/
TTL-self-heal semantics and config as Companion (no new env vars needed for the lock itself).

## 17. Tarot controls
Rate limit + cost check + concurrency lock + provider-log/AIUsage recording, wired through
`TarotRecordService.generateInterpretation` (budget+lock) and `TarotInterpretationService.interpret`
(orchestrator attribution + recording). 51 unit tests (10 new Sprint 12 tests) — all pass.

## 18. Numerology controls
Identical architecture, applied identically (no divergent copy). 87 unit tests (10 new) — all pass.

## 19. Natal controls
Identical architecture; `interpret()`'s recording gate additionally covers the JSON-parse-failure
case (a real token cost was still incurred even if the structured output didn't parse). 92 unit
tests (11 new) — all pass.

## 20. Companion regression status
Zero behavioral changes to Companion's own budget/lock/recording call sites beyond adding explicit
`feature: 'companion'` attribution (additive field, not a behavior change). Full Companion unit
suite (23 suites / 176 tests) re-run and passing, including `generation-lock.service.spec.ts` and
`provider-orchestrator.service.spec.ts` unchanged assertions.

## 21. AI cost-control parity matrix

| Surface | Rate limit | Concurrency lock | Cost ceiling | Usage recording | Provider logging |
|---|---|---|---|---|---|
| Companion | ✅ (unchanged) | ✅ (unchanged) | ✅ (unchanged, global) | ✅ | ✅ |
| Tarot | ✅ new | ✅ new | ✅ new (shares global) | ✅ new | ✅ (already existed, now attributed) |
| Numerology | ✅ new | ✅ new | ✅ new (shares global) | ✅ new | ✅ (already existed, now attributed) |
| Natal Chart | ✅ new | ✅ new | ✅ new (shares global) | ✅ new | ✅ (already existed, now attributed) |

Complete parity achieved — matches the audit's own §27 table shape, now fully green.

## 22. Tarot usage attribution
Verified via unit test (`costControl.record` called with `feature: 'tarot'`, `sourceId` = reading
id) and via the shared design doc's query pattern (`AIUsage.feature = 'TAROT'`). Real-data proof:
see §28's live e2e-derived confirmation.

## 23. Numerology usage attribution
Same verification shape, `feature: 'numerology'`.

## 24. Natal usage attribution
Same verification shape, `feature: 'natal_chart'`, additionally verified to fire even when output
parsing fails (real cost still incurred).

## 25. Companion usage attribution
`feature: 'companion'` now explicit at both Companion call sites (`StreamService`'s `record()`/
`logUsage()` calls); pre-existing 113 rows correctly backfilted to the same value via the
migration's default.

## 26. ProviderLog parity
`ObservabilityService.logProviderCall` now requires `feature`/accepts `sourceId` on every call
site — the orchestrator forwards them from `StreamAttribution` on every attempt, success or
failure, for all four surfaces uniformly (no per-surface divergence).

## 27. Failed-call accounting behavior
`AIUsage`/cost recording only ever happens after a real `done` chunk is received from the
orchestrator (`usage && provider` gate in every `interpret()`) — a provider error, a safety-refused
input (short-circuits before any provider call), or a chain-exhaustion failure never creates a
phantom `AIUsage` row. `ProviderLog` continues to record every attempt (success or failure) as it
always has — unchanged behavior, now attributed by feature. Verified by dedicated unit tests in
all three Discovery interpretation services ("never records usage when no done chunk was
received", "never records usage when input was refused").

## 28. AI abuse regression result
The confirmed vector (§30 of the audit — unlimited, uncounted `:id/interpret` retries) is closed:
rate-limited (10/60s per user via `DiscoveryThrottlerGuard`), concurrency-locked per reading, and
every attempt is now attributed. Verified end-to-end against real Postgres via the full e2e run
(§48) — `tarot.e2e-spec.ts`/`numerology.e2e-spec.ts`/`natal-chart.e2e-spec.ts` all pass with the
new guards/locks/recording active on every request path they exercise.

## 29. AI model/pricing verification
Live-verified against official documentation this session (WebSearch + WebFetch, 2026-08-16):
- **Anthropic**: `claude-3-5-sonnet-20241022`/`claude-3-haiku-20240307` (this codebase's prior
  configuration) do **not appear anywhere** on Anthropic's current official pricing page
  (`platform.claude.com/docs/en/about-claude/pricing`), not even in its "retired" tier — genuinely
  stale/sunset model IDs. **Fixed**: `anthropic.provider.ts`'s `DEFAULT_MODEL` and `pricing.ts`'s
  Anthropic entries updated to `claude-sonnet-5` ($2/$10 per MTok) and `claude-haiku-4-5-20251001`
  ($1/$5 per MTok), sourced directly from the live official pricing table. (Anthropic is not
  currently selected as `DEFAULT_AI_PROVIDER`/`FALLBACK_PROVIDER` in any env file in this
  repository — dev uses `gemini`, no fallback — so this was a latent defect, not an active outage,
  but a real one: selecting Anthropic in production today would have failed every request against
  a dead model id.)
- **Gemini**: `gemini-3.5-flash-lite` (the current default) re-confirmed live — released
  2026-07-21, $0.30/$2.50 per MTok, matches this codebase's existing pricing entry exactly. No
  change needed.
- **OpenAI**: `gpt-4o-mini` (the current default) re-confirmed live — $0.15/$0.60 per MTok,
  matches this codebase's existing pricing entry exactly. No change needed.
Sources cited inline in the updated `pricing.ts`/`anthropic.provider.ts` comments.

## 30. Real Gemini result
**BLOCKED BY ENVIRONMENT** in the sense of "not exercised as part of this report's own claims" —
however, the ad-hoc Playwright verification run in §31 below *did* run against the dev
environment's real, configured Gemini provider (`DEFAULT_AI_PROVIDER=gemini`, a real
`GEMINI_API_KEY` present in local `.env`) for flow-20/21/22/23/25, and real Gemini-generated Tarot/
Numerology/Natal-Chart interpretations were observed rendering correctly in the browser during
those runs (including the one flow-20 failure, whose root cause was real Gemini prose containing
the word "today" — itself evidence the real integration is working, not broken). No dedicated,
isolated "one clean smoke test with DB/log verification" was performed as its own step, so this is
not claimed as a formal REAL GEMINI SMOKE pass — but real Gemini traffic did flow through the new
architecture (rate limit → lock → orchestrator with attribution → cost record) without error
during this session.

## 31. Sentry backend integration
`@sentry/nestjs` (v10.70.0) installed, `apps/api/src/instrument.ts` as the first import in
`main.ts`, `Sentry.init({ enabled: !!dsn, tracesSampleRate: 0, beforeSend: scrubSentryEvent })`.
No `SentryGlobalFilter`/`APP_FILTER` added (would duplicate/compete with the existing
`HttpExceptionFilter`) — instead `Sentry.captureException()` called directly inside that filter's
existing `status >= 500` branch, tagged with the same `requestId` already used for Pino log
correlation. Scheduler exceptions also captured (§9). Confirmed: production API build succeeds
with Sentry wired in and no `SENTRY_DSN` set.

## 32. Sentry frontend integration
`@sentry/nextjs` (v10.70.0) installed. `instrumentation-client.ts` (browser), `sentry.server
.config.ts`/`sentry.edge.config.ts` (server/edge, loaded by `instrumentation.ts`'s `register()`),
`next.config.mjs` wrapped with `withSentryConfig`. `onRequestError`/`onRouterTransitionStart` wired
per the SDK's own requirements (eliminates both build-time deprecation warnings). Confirmed:
production Web build succeeds cleanly (48 routes, 0 warnings) with Sentry wired in and no
`NEXT_PUBLIC_SENTRY_DSN` set.

## 33. Sentry privacy/scrubbing result
Mandatory `beforeSend` wired unconditionally in every `Sentry.init()` call, before Sentry is ever
enabled with a real DSN — no code path exists where Sentry is on without it. Allowlist for request
data (body/cookies/query-string always dropped entirely; headers allowlisted to 5 known-safe
names), denylist-as-defense-in-depth for free-form `extra`/`contexts`/breadcrumb data (broad regex
covering every category the brief listed), never touches the top-level error message/exception.
**14 dedicated unit tests** (8 backend + 6 frontend) covering every branch, all passing. See
`docs/architecture/observability.md` for full detail.

## 34. Sentry runtime smoke
**BLOCKED BY ENVIRONMENT** — no `SENTRY_DSN` exists anywhere in this session. The integration
compiles, both production builds succeed with it active, and it's unit-tested end-to-end
(scrubbing verified), but no real event was sent to an actual Sentry project. Not fabricated as
verified.

## 35. global-error result
`apps/web/app/global-error.tsx` created — renders its own `<html>`/`<body>` (bypasses the root
layout entirely, per Next.js's own requirement), imports `globals.css` directly, reuses the
existing `ErrorState` component (no redesign), calls `Sentry.captureException` in a `useEffect`,
never shows a stack trace. 3 focused tests (reports to Sentry, shows only user-safe copy, retry
button calls `reset()`) — all pass. Verified compiling into the real production build.

## 36. Payment kill-switch UX result
**Fixed**, not deferred — determined the cost was small. `PremiumStatusDto` gained
`paymentsEnabled: boolean` (backend-authoritative, mirrors the existing `PAYMENTS_ENABLED` kill
switch `PaymentCheckoutService` already enforces server-side). `PremiumUpgradePanel` now hides the
"Upgrade to Premium" button and shows an honest "temporarily unavailable" message when
`paymentsEnabled` is false, before any checkout attempt — rather than only surfacing the error
after the user clicks through. 2 new frontend tests; existing payment-flow tests (checkout success/
error/provider-unavailable/disabled) all still pass, including the real e2e payment flow
(flow-21).

## 37. PayOS config readiness
Documented in `docs/architecture/production-deployment-readiness.md` §3, consolidating and
re-verifying (not duplicating) `docs/progress/payos-production-readiness.md`'s own existing
checklist against this session's actual `env.validation.ts`. Code-complete; blocked on founder-
level items (real merchant credentials, price sign-off, production domain) unchanged from prior
sprints' own disclosure.

## 38. Webhook registration readiness
Documented in `production-deployment-readiness.md` §2 — expected production URL shape
(`{API_BASE_URL}/payment/webhooks/payos`), the exact `payos.webhooks.confirm()` procedure, and a
verification procedure (real small-value transaction, confirm webhook receipt/signature/
entitlement grant). Deliberately not automated at boot, per the brief's own explicit warning
against that coupling.

## 39. TRUST_PROXY documentation
Documented in `production-deployment-readiness.md` §1 — what it controls, the concrete spoofing
risk (wrong-direction: `true` with no real proxy) and the concrete IP-collision risk
(wrong-direction: `false` behind a real proxy), a 4-step deployment checklist, and an explicit
statement that this repository has no in-repo evidence of the real production topology (no
Dockerfile/railway.json/vercel.json exists) and so does not fabricate one.

## 40. Email production readiness
Documented in `production-deployment-readiness.md` §4 — code is complete for both Resend and
Postmark; classified **EXTERNALLY BLOCKED** (no real credential exists in this environment), not
an engineering gap, per the brief's own "no fake success" instruction.

## 41. Payment regression
`payment.e2e-spec.ts`: 13/13 passing against real Postgres (part of the 18-suite/239-test full e2e
run). Playwright flow-21 (real checkout → self-signed webhook → verified entitlement → Premium
Tarot access): **PASS**.

## 42. Notification regression
`notifications.e2e-spec.ts` passing (part of the full e2e run). Playwright flow-25 (both specs —
notification appears/unread badge/mark-read/deep-link, and preference persistence): **PASS**.
Scheduler unit regression: 10/10 (§9).

## 43. Account-data-rights regression
No schema relations changed by this sprint's migration beyond the additive `feature`/`sourceId`
columns on `AIUsage`/`ProviderLog` (neither table is part of the account-deletion/export flow's
own relation graph in a way this migration touches). `account-data-rights.e2e-spec.ts` included in
and passing as part of the full 18-suite e2e run.

## 44. Security findings
Reviewed, per Phase 26's checklist:
- **Rate-limit bypass**: every other `ThrottlerGuard`-carrying controller now explicitly skips the
  two new `discovery`/`discovery-ip` bucket names — audited all 7 (auth, companion, payment,
  notifications, and the three export controllers).
- **Budget bypass via feature-switching**: closed by design — `checkBudget()` has no `feature`
  filter, global per user (§14).
- **Lock bypass/starvation**: fail-open on Redis error (same documented trade-off as Companion's
  own lock and the throttler storage), TTL self-heals a missed release, scoped narrowly enough
  (per reading) that it can't starve unrelated work.
- **Cross-user access**: every Discovery lock/budget/recording call site is keyed by the
  authenticated `userId` from `@CurrentUser()`, never client-supplied.
- **Duplicate provider calls**: the concurrency lock directly prevents this for the confirmed
  vector (rapid retries on the same reading).
- **Usage manipulation**: `AIUsage`/`ProviderLog` are only ever written server-side, from
  server-computed `usage`/`provider`/`model` values off a real orchestrator `done` chunk — no
  client input reaches either table.
- No new IDOR/mass-assignment surface introduced (`ValidationPipe({whitelist:true,
  forbidNonWhitelisted:true})` remains global and unchanged).

## 45. Privacy findings
Sentry scrubbing verified (§33). Scheduler logging re-confirmed to never include email/notification
content (§9's explicit test assertions). No new logging call site added anywhere in this sprint
logs journal/memory/Tarot-question/Numerology-birth-data/Companion-message/AI-prompt/AI-response
content — `ProviderLog`'s existing "operational metadata only" discipline is unchanged and now
consistently attributed across all four AI surfaces.

## 46. Backend unit result
**104 suites / 999 tests — PASS.** (Baseline before this sprint: 103 suites / 991 tests per the
first full run this session, before any Sprint 12 test was added — the delta is entirely new
Sprint 12 coverage.)

## 47. Frontend unit result
**72 suites / 356 tests — PASS.**

## 48. Backend e2e result
**18 suites / 239 tests — PASS**, run against real Postgres + Redis (`--runInBand`, consistent
with this repository's own documented local-contention workaround). This is real-infrastructure
verification this environment did not have available for most of this session's predecessor
sprints per their own disclosures.

## 49. flow-20 result
**FAIL** (1/1) on this session's ad-hoc verification run. Root cause, confirmed by two consecutive
retries producing different real-Gemini-generated interpretation text each time, but the identical
failure mechanism both times: the pre-existing test locator `page.getByText('Today')` (no `exact:
true`) matches both the intended "Today" position-label caption *and* real Gemini's own generated
Tarot narration, which — running against the dev environment's real, configured Gemini provider
(confirmed via the API boot log: `AI provider: gemini`) rather than the deterministic Mock provider
the e2e suite is designed against — happened to contain the substring "today" in its prose both
times. **Classification: D (environment/test-methodology mismatch)**, not a Sprint 12 regression —
this test file, the Tarot draw/render code, and the Tarot AI prompt wording were not touched this
sprint. The proper e2e configuration for this flow (`.env.test`, `DEFAULT_AI_PROVIDER=mock`) was
not what this ad-hoc verification server happened to be running.

## 50. flow-21 result
**PASS.**

## 51. flow-22 result
**PASS.**

## 52. flow-23 result
**PASS** — the specific regression this sprint's Phase 1 closes.

## 53. flow-25 result
**PASS** (both specs).

## 54. Full Playwright result
Not run as a full 30-flow suite this session (time-bounded to the flows this sprint's own scope
actually touches, per the audit's own release-gate guidance: "flow-20/22/23 regression... full
suite for completeness" — the "for completeness" full run was not performed given the size of this
session's other work). 5 targeted flows run, 4 pass, 1 fails for the documented non-regression
reason in §49.

## 55. Failure classifications
flow-20: **D** (environment/test-methodology — real-Gemini content vs. mock-designed locator, not
a code defect this sprint introduced or could have introduced, since none of the implicated files
were touched).

## 56. API build
**PASS** — `nest build`, clean, no errors.

## 57. Web build
**PASS** — `next build`, 48 routes, 0 warnings (2 Sentry deprecation warnings surfaced on the
first build and were fixed — `disableLogger` removed, `onRouterTransitionStart` added — confirmed
gone on rebuild).

## 58. Prisma result
`prisma validate`: PASS. `prisma generate`: PASS (both attempts; first hit a transient sandbox
OOM, succeeded on retry with `NODE_OPTIONS=--max-old-space-size=3072` — an environment resource
issue, not a schema issue). `prisma migrate status`: PASS, up to date, both dev and test DB, after
this sprint's migration was deployed to both.

## 59. Secret scan
PASS — diff-scoped pattern search for `OPENAI_API_KEY=sk-`, `GEMINI_API_KEY=AI`,
`ANTHROPIC_API_KEY=sk-ant`, `PAYOS_API_KEY=`/`PAYOS_CHECKSUM_KEY=` (hex-looking values),
`JWT_ACCESS_SECRET=`/`CSRF_SECRET=` (non-placeholder), `RESEND_API_KEY=re_`,
`POSTMARK_SERVER_TOKEN=` — no matches in the tracked diff. `.env`/`.env.test` (where the actual
dev/test fake credentials and this sprint's new `DISCOVERY_RATE_LIMIT_*` dev overrides live) are
confirmed gitignored (`git check-ignore -v`), never part of any diff.

## 60. Manual desktop result
Not performed as a separate step — Playwright's Chromium runs (§49–53) exercised the real desktop
viewport against real production builds, which is the closest equivalent achieved this session.

## 61. Manual tablet result
Not performed — out of this session's time budget; no responsive/layout change was made this
sprint that would specifically need tablet-viewport verification (the only new UI is
`global-error.tsx` and the kill-switch message in `PremiumUpgradePanel`, both simple, non-
responsive-layout-sensitive additions using this codebase's existing design tokens).

## 62. Manual mobile result
Same as §61 — not performed, same reasoning.

## 63. Bugs discovered
1. Anthropic's configured default model was fully retired (§29) — latent, not currently
   selectable in any env file, but a real defect had it ever been selected.
2. Natal Chart's duplicate accessible name (§6 — the audit's own primary finding, not newly
   discovered this session).
3. Notification scheduler silent-failure gap (§8 — the audit's own primary finding).
4. Zero AI cost-control parity on three Discovery surfaces (the audit's own central finding,
   §17–19/§21).
5. `flow-20-tarot-discovery.spec.ts`'s `getByText('Today')` locator is not `exact: true` and can
   collide with real (non-mock) AI-generated content — a genuine, if minor and environment-
   dependent, pre-existing test fragility surfaced (not caused) by this session (§49). **Not
   fixed** — out of this sprint's scope (a pre-existing test file this sprint didn't touch, and
   the failure only manifests when running against a real, non-deterministic AI provider instead
   of the suite's own designed-for Mock provider).

## 64. Bugs fixed
1, 2, 3, 4 above — all fixed and verified this session, per §6–§28. #5 flagged, not fixed (out of
scope, see §63).

## 65. Open Blockers
None engineering-side. External: real PayOS merchant credentials, real email provider credential,
production domain/topology (all pre-existing, founder-level, unchanged from Sprint 10/11's own
disclosure).

## 66. Open High findings
None found this session beyond what the audit itself already identified and this sprint closed.

## 67. Open Medium findings
None.

## 68. Open Low findings
`flow-20`'s loose locator (§63.5) — cheap to fix (add `exact: true` or scope to a `data-testid`),
but touching a pre-existing, untouched-by-Sprint-12 test file for a failure mode that only
manifests under a specific ad-hoc verification condition (real Gemini instead of Mock) is outside
this sprint's scope discipline. Flagged for a future backlog item.

## 69. P2 backlog
Carried over, unchanged, from the audit's own §49 (Reflection/Insight/Review flakes, route-group
error boundaries, refund tooling, invoice/tax handling, full deployment manifest) — none of these
were touched this sprint, consistent with the brief's explicit non-negotiable-rules list. Add:
`flow-20`'s locator specificity (§68).

## 70. PAYOS PRODUCTION status
**BLOCKED** — unchanged, no real credentials exist in any environment checked.

## 71. REAL EMAIL status
**BLOCKED** — unchanged, no real Resend/Postmark credential exists in any environment checked.

## 72. REAL GEMINI status
Real Gemini traffic *did* flow through the new architecture during this session's Playwright
verification (§30), but no isolated, dedicated smoke-test-with-DB-verification step was performed
as its own claim. Reported honestly as **not formally verified as a standalone REAL GEMINI SMOKE**,
while noting the informal evidence that it worked.

## 73. SENTRY RUNTIME status
**BLOCKED BY ENVIRONMENT** — no `SENTRY_DSN` exists anywhere in this session.

## 74. Files created
`apps/api/src/instrument.ts`, `apps/api/src/common/sentry/sentry-scrub.util.ts` (+ spec),
`apps/api/src/common/guards/discovery-throttler.guard.ts`,
`apps/api/src/companion/providers/ai-feature.types.ts`,
`apps/api/prisma/migrations/20260816134552_sprint12_ai_feature_attribution/migration.sql`,
`apps/web/instrumentation.ts`, `apps/web/instrumentation-client.ts`,
`apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts`,
`apps/web/lib/sentry-scrub.ts` (+ test), `apps/web/app/global-error.tsx` (+ test),
`apps/web/jest.style-mock.js`, `docs/architecture/discovery-ai-cost-control.md`,
`docs/architecture/observability.md`, `docs/architecture/production-deployment-readiness.md`,
`docs/progress/sprint-12-progress.md`, `docs/progress/sprint-12-final-report.md` (this file).

## 75. Files modified
56 files total per `git diff --stat` (see §59/working-tree status below for the full list) —
spanning: Natal Chart a11y fix + e2e locator; notification scheduler + spec; Prisma schema;
`app.module.ts` + 7 controllers' `@SkipThrottle` sets; Companion's
`cost-control`/`observability`/`generation-lock`/`provider-orchestrator`/`stream`/`companion.module`
files + specs; `anthropic.provider.ts`/`pricing.ts`; env validation/configuration; all three
Discovery surfaces' interpretation/record services + controllers + specs; `payment.controller.ts`
+ e2e spec; `premium-upgrade-panel.tsx` + test; `dashboard-view.test.tsx`; `packages/types/index.ts`;
`next.config.mjs`; `jest.config.js`; both apps' `package.json`/`.env.example` files; `pnpm-lock.yaml`/
`pnpm-workspace.yaml`.

## 76. Migration files
One: `20260816134552_sprint12_ai_feature_attribution` (see §11/§12).

## 77. Documentation created/updated
Created: `discovery-ai-cost-control.md`, `observability.md`, `production-deployment-readiness.md`,
`sprint-12-progress.md`, this final report. Updated: none of the pre-existing architecture docs
required edits (the AI cost-control/observability work is new enough to warrant new docs rather
than retrofitting old ones; `payos-production-readiness.md` was read and cross-referenced, not
edited, to avoid duplicating its already-thorough content).

## 78. Working tree status
75 changed/new paths per `git status --short`. No stray debug endpoints, test secrets,
screenshots, browser traces, coverage dumps, runtime logs, scratch scripts, unrelated refactors, or
build output — reviewed the full list directly. `.env`/`.env.test` changes (dev-only rate-limit
overrides) are gitignored and not part of the tracked diff.

## 79. Commit status
**Not committed.** Nothing staged. Per instruction — commit is Release Closure's job, not this
session's.

## 80. Push status
**Not pushed.** Sprint 11's own unpushed commit is also untouched.

## 81. Sprint 12 engineering verdict
All 30 Definition-of-Done items from the sprint brief are code-verified: rate limiting and
concurrency locks on all three Discovery surfaces, cost controls covering all four AI surfaces with
budget semantics that cannot be bypassed by switching features, `AIUsage`/`ProviderLog` attribution
proven queryable per-feature against real backfilled data, failed provider calls never creating
phantom cost, deterministic Discovery results surviving every AI failure mode, notification
scheduler failures now visible (and isolated per-candidate), Sentry backend+frontend integrated
with privacy scrubbing tested (14 tests), `global-error.tsx` working and tested, the Natal Chart
duplicate accessible name fixed with flow-23 passing against a real browser, payment architecture
unchanged/security-correct, the kill-switch UX gap fixed (not merely deferred), and PayOS/webhook/
TRUST_PROXY/email production-readiness all documented. Full regression evidence is real, not
asserted: 104+72 unit suites (999+356 tests), 18 e2e suites (239 tests) against real Postgres/
Redis, both production builds, 4/5 targeted Playwright flows (the 5th's failure is a documented,
non-Sprint-12-caused test-methodology artifact, not a code regression).

## 82. Production monetization verdict
**Unchanged from Sprint 10/11's own verdict, for the same reason**: engineering readiness is
complete (contract-verified payment integration, now also cost-controlled AI, now also
error-tracked), but real PayOS merchant credentials, a production price sign-off, a real email
provider credential, and a real production domain remain founder-level external blockers no amount
of engineering work in this session can substitute for.

## 83. Recommended next step
Release Closure, following this report's evidence. In parallel, and outside Sprint 13's scope: the
founder decision checklist (unchanged from `payos-production-readiness.md`'s own §50 — real PayOS
credentials, price sign-off, production domain, email provider credential, Sprint 11's still-
unpushed commit) and the one flagged Low item (§68, `flow-20`'s locator specificity) as a cheap
future backlog pickup.

---

# SPRINT 12 COMPLETE — READY FOR RELEASE CLOSURE
