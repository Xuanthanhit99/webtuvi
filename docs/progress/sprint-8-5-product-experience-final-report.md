# Sprint 8.5 Final Report — Product Experience & AI Wiring Remediation

## 1. Executive Summary

Sprint 8.5 was commissioned by `docs/audit/full-product-feature-gap-audit.md` to fix wiring,
labeling, and runtime-configuration gaps discovered across an otherwise substantially complete
product — not to build new features. Implementation (commit `cc48504`) addressed all 16 in-scope
findings (audit items 1–13, 15–17): the AI-provider selection bug, dead Dashboard links, missing AI
labeling, a stale landing-page claim, no pre-checkout Premium price, a middleware allowlist gap, and
the frozen-module visual-hierarchy issue in Settings. That implementation session was interrupted
mid-Phase-12 (Playwright) on a different machine; this report closes out the remaining verification
phases (Playwright, manual browser review, full quality gates) on the new machine, per the recovery
protocol — no code was reimplemented, and no application code was changed in this continuation
session.

## 2. Recovered Git Baseline

HEAD at continuation-session start: `cc48504` ("update lại luồng"), branch `master`, up to date with
`origin/master`, working tree clean. Verified genuine — not assumed from documentation — by directly
re-reading `git show --name-status cc48504` and its full diffs for every touched file, cross-checked
line-for-line against this sprint's own progress doc
(`docs/progress/sprint-8-5-product-experience-remediation.md`), which itself cuts off mid-sentence at
the start of Phase 12, consistent with a genuinely interrupted session rather than a fabricated one.

## 3. What Was Already Done (Verified, Not Reimplemented)

| Area | Status | Evidence |
|---|---|---|
| AI provider configuration (code) | DONE | `DEFAULT_AI_PROVIDER=openai`/`.env.example` docs, boot-log lines in `main.ts` — all present in `cc48504` |
| Dashboard clickable cards + hero CTA | DONE | `dashboard-view.tsx`/`dashboard.service.ts` diffs re-read; confirmed live via screenshot |
| AI visibility (Tarot/Numerology label, Companion badge) | DONE | `ai-interpretation.tsx` (new, shared component), `companion-view.tsx` badge diff re-read |
| Navigation/middleware allowlist | DONE | `route-guard.ts`/`middleware.ts` diffs re-read — 6 routes added |
| Premium pre-checkout price | DONE | `PremiumStatusDto` + `payment.controller.ts` diff re-read; confirmed live via screenshot: "79.000 VND / 30 days — MVP test price — not yet finalized." |
| Landing copy (Companion preview) | DONE | `companion-preview.tsx` diff re-read; confirmed live via screenshot |
| Frozen-module visual hierarchy (Settings) | DONE | `settings/page.tsx` diff re-read; confirmed live via screenshot — "More tools" collapsed list, visually secondary to Premium |
| Tarot/Numerology UX | PARTIAL (as originally scoped — sprint brief said "do not rebuild") | Shared `AiInterpretation` component addresses the single most-cited gap; deeper layout polish explicitly deferred, unchanged this session |

## 4. Continuation Work Performed This Session

No application code was modified. This session's work was entirely recovery, verification, and
completing the interrupted QA phases:

1. Recovered and independently verified the git/doc state (§2).
2. Repaired local environment: cleared 7 orphaned `jest-worker` processes locking the Prisma engine
   DLL (confirmed stale via static CPU across two checks), ran `prisma generate`/`validate`/
   `migrate status` (clean, up to date).
3. Re-ran full quality gates: lint (0 errors), typecheck (clean), backend unit (800/801, 1
   pre-existing flake confirmed by isolation), frontend unit (282/282), production builds (both
   clean).
4. Root-caused a real pre-existing backend e2e defect (not a Sprint 8.5 regression): a
   self-poisoning IP-keyed auth rate-limit bucket shared between a rate-limit test and every other
   spec's `/auth/register` calls (§6).
5. Completed Phase 12 (Playwright): both apps launched in production mode, full 22-spec suite run
   (29/31 passing; the 2 failures root-caused to a shared-account rate-limit race, not a defect —
   §6).
6. Completed Phase 9/manual-browser-verification: real screenshots captured and individually
   reviewed at desktop and mobile viewports across 8 key routes (§8).
7. Documented Phase 10 (real AI smoke test) as genuinely BLOCKED on this machine — no
   `OPENAI_API_KEY` present at all (§7) — rather than substituting Mock and reporting success.

## 5. Machine-Local Configuration

| Variable | Status |
|---|---|
| `OPENAI_API_KEY` | **MISSING** (this machine only — different from the original session's machine, which had a real but quota-exhausted key) |
| `DEFAULT_AI_PROVIDER` | PRESENT (`mock`, the only viable value here) |
| `FALLBACK_PROVIDER` | PRESENT (`mock`) |
| `DATABASE_URL` | PRESENT |
| `REDIS_URL` | PRESENT |
| `NEXT_PUBLIC_API_URL` | PRESENT |

Docker infra (Postgres, Redis, Mailpit) was already running and healthy at session start.

## 6. Pre-Existing Test-Infrastructure Findings (Not Sprint 8.5 Regressions)

Two related, previously-undocumented defects were found and root-caused, not fixed (out of this
session's recovery/continuation scope, and unrelated to any file this sprint touched):

1. **Backend e2e — shared IP-keyed auth-throttle bucket.** `auth.e2e-spec.ts`'s own rate-limit test
   deliberately exhausts `AUTH_THROTTLE` (IP-only tracker, 15-minute TTL, shared by `register` and
   `forgot-password` via `AuthThrottlerGuard`). Every other spec's registration calls after that test
   runs get 429'd for the rest of the run. Confirmed structural (36 failures even fully serialized
   with `--runInBand`, not just a parallelism artifact).
2. **Playwright — shared seeded demo account's companion rate-limit bucket.** `flow-13-*.spec.ts`
   logs into the persistent `demo@beaconvie.local` account (by design, per its own file header) rather
   than a fresh per-test user. Back-to-back runs against that same account exhaust its per-user
   `companion` Redis-throttle bucket (`AI_RATE_LIMIT_MAX=200`/60s), producing non-deterministic
   failures that clear once the window cools (confirmed: 2 failures → 4 failures → 1 failure → 0
   failures across four reruns spaced by varying real-world delay).

Recommendation for a future test-infrastructure task: give `AuthThrottlerGuard` a per-test-run-scoped
tracker (or flush the `auth` bucket specifically after the intentional rate-limit test), and consider
giving `flow-13` its own registered user like the other 21 flows rather than the shared demo account.

## 7. Final Product Questions

1. **Is Companion using real OpenAI in the verified local runtime?** *(Updated — see §12, real
   verification performed after a key was provisioned on this machine.)* The provider chain
   genuinely selects and calls OpenAI; the call itself fails on OpenAI's side with `insufficient_quota`
   (no billing credits on the configured account) — a credentials/billing gap, not a code gap. Mock is
   never silently substituted (confirmed: `FALLBACK_PROVIDER` unset, interpretation/reply stayed empty
   on failure rather than being filled by Mock).
2. **Is Tarot interpretation using real OpenAI?** Same as Companion — real attempt, same
   `insufficient_quota` failure, no Mock substitution.
3. **Is Numerology interpretation using real OpenAI?** Same as Companion — real attempt, same
   `insufficient_quota` failure, no Mock substitution.
4. **Can a new user discover Tarot without knowing its URL?** Yes — `/discover` (primary nav) → Tarot
   card → `/discover/tarot`; also Dashboard's Discover card (now a real link, confirmed via
   screenshot).
5. **Can a new user discover Numerology without knowing its URL?** Yes — same path, Numerology card.
6. **Can users distinguish deterministic results from AI interpretation?** Yes — `AiInterpretation`
   component renders a distinct "AI Interpretation" labeled section with a Sparkles icon and an
   explicit "never chooses or changes it" caption, visually separated from the deterministic
   cards/numbers above it. Companion shows an "AI" badge once per conversation header.
7. **Are Dashboard cards actionable?** Yes — Discover and Memory cards are real `<Link>`s now
   (confirmed via screenshot and source diff), not static markup.
8. **Is the Dashboard discovery-first enough for the current product?** Materially improved — hero CTA
   now branches to `/discover` for users who haven't tried either Discovery system yet, rather than
   always pointing at Companion.
9. **Is Premium discoverable?** Improved — `PremiumStatusCard` now appears on the Dashboard itself
   (previously Settings-only), and the price is now shown pre-checkout.
10. **Does the public site advertise only functionality that actually exists?** Yes — the one known
    false claim (Companion "being built for a coming release") is fixed; Natal Chart/Eastern Horoscope
    remain honestly "Coming soon," confirmed via screenshot.
11. **Are Reflection/Insight/Review/Goal secondary?** Yes — collapsed into a single visually-secondary
    "More tools" list in Settings, confirmed via screenshot; not promoted to primary nav or Dashboard,
    per the frozen-module policy.
12. **Are any true orphan user-facing routes left?** `/insights/internal` remains deliberately
    unlinked by design (confirmed in its own doc comment) but is now behind auth middleware like every
    other app route — no longer reachable by a logged-out visitor either.
13. **Are important backend capabilities still missing a frontend surface?** Per the original audit,
    yes in a few P2-classified, explicitly-deferred cases (Memory Pin toggle, Goal milestone
    edit/archive UI, reading-history audit-trail UI) — unchanged this sprint by design (see the
    original doc's DEFER classifications).
14. **Are there any P0 findings left?** No — both P0 items (AI provider config, dead Dashboard links)
    are done and independently re-verified this session.
15. **Are there any P1 findings that should block Natal Chart?** No unresolved P1s from this sprint's
    scope. The two test-infrastructure findings in §6 are real but are test-suite defects, not product
    defects, and don't block product work.

## 8. Manual Browser Verification (Real Screenshots, Reviewed)

Captured via a throwaway Playwright script against the live production-mode instance (not `next dev`),
desktop (1440×900) and mobile (iPhone 13 viewport), logged in as the demo account, across `/`,
`/dashboard`, `/discover`, `/discover/tarot`, `/discover/numerology`, `/companion`, `/premium`,
`/settings`. Individually opened and reviewed (not merely captured):

- Landing, Discover, Premium, and Settings pages all confirmed pixel-level accurate to this sprint's
  documented fixes (see §3 table for specifics).
- Mobile layouts stack cleanly with no horizontal overflow on Dashboard and Settings.
- One incidental, non-defect observation: the shared demo account's Active Sessions list has ~18
  entries from repeated automated logins across this and the prior session's test runs — an artifact
  of reusing one seeded account for many automated runs, not a product bug.
- Tablet viewport was not captured this session (time-scoped to desktop/mobile); the original audit
  already flagged tablet nav as a P2/cosmetic, non-blocking item.

## 9. Quality Gate Results

| Gate | Result |
|---|---|
| `prisma validate` | Pass |
| `prisma migrate status` | Up to date (15 migrations) |
| API lint | 0 errors (pre-existing warnings only, untouched `insight` module) |
| Web lint | Clean |
| API typecheck | Clean |
| Web typecheck | Clean |
| Backend unit | 800/801 (1 pre-existing flake, confirmed via isolation — `payos-signature.util.spec.ts`) |
| Frontend unit | 282/282 |
| Backend e2e | Passes cleanly per-file; full-suite run affected by the pre-existing shared-throttle-bucket defect in §6, not a Sprint 8.5 regression |
| API production build | Succeeds |
| Web production build | Succeeds |
| Playwright (production mode, mock provider) | 29/31 on first full run; root-caused the 2 failures to the shared-account rate-limit race in §6, confirmed via reruns clearing to 0 failures once the window cooled |

## 10. Remaining Items (Explicitly Out of This Sprint's Scope)

- Real-OpenAI runtime verification: **performed** in a follow-up pass on this machine after a key was
  provisioned — see §12. Result: the provider chain is genuinely wired to OpenAI end-to-end; the
  configured OpenAI account has no billing credits (`insufficient_quota`), which is an account/billing
  gap, not a code gap.
- The two test-infrastructure findings in §6: real, root-caused, documented, deliberately not fixed
  (outside this recovery/continuation session's scope — recommend a small follow-up task).
- All P2/P3 items the original audit explicitly deferred (Memory Pin toggle, Goal milestone UI,
  reading-history audit-trail UI, tablet-specific nav layout, profile-edit/account-export/deletion
  backend endpoints, Natal Chart and other P3 future modules) remain deferred by design, unchanged.

## 12. REAL OPENAI RUNTIME VERIFICATION

Performed as a follow-up pass after §7's original BLOCKED finding, once a rotated `OPENAI_API_KEY` was
provisioned in `apps/api/.env` on this machine. Method matches this sprint's own standard: provider
identity is read from safe runtime metadata (the `provider_logs` table and the app's own boot/request
logs), never inferred from response wording, and the key itself was never printed, logged, or included
in any output at any point in this process.

**Configuration change (schema-supported, not invented)**: `env.validation.ts` documents
`FALLBACK_PROVIDER` as `.optional()` — "no explicit fallback attempted if unset. Mock is never appended
automatically anymore." `provider-orchestrator.service.ts`'s `chain()` method confirms this in code: it
only appends a fallback provider if `config.fallbackProvider` is explicitly set. So `FALLBACK_PROVIDER`
was commented out (left unset) rather than set to an invented value like `"none"` — the schema already
has a real, supported way to express "no fallback," and that's the one used.

**Restart discipline**: the existing `node dist/src/main.js` process (PID confirmed via
`Win32_Process`) was stopped, port 4000 confirmed clear via `netstat`, then a single fresh process was
started and confirmed as the sole listener on port 4000 (both the IPv4 and IPv6 listen entries resolved
to the same PID). Boot log printed `AI provider: openai` / `AI fallback: (none)` — no key value in
either line.

**Per-surface verification**, one real request each, provider identity read from `provider_logs`
(never from response wording):

- **Companion**: created a conversation, sent one message, opened the SSE reply stream. Stream ended
  with a `stream_error` event, `PROVIDER_UNAVAILABLE` — no reply text was ever produced, real or Mock.
  `provider_logs`: `provider=OPENAI, success=false, errorCode=429`. Confirmed independently from the
  API's own structured log line: `provider=openai model=unknown latencyMs=3587 success=false
  retryCount=2 errorCode=429` — no key or request content in that line.
- **Tarot**: drew a real Single Card reading first (`King of Swords`, reversed) — confirmed
  deterministic, computed before any AI call, entirely unaffected by what follows. Called
  `POST /tarot/readings/:id/interpret`: `interpretation` stayed `null` in the response (not
  silently filled by Mock). `provider_logs`: two new `OPENAI`/`429` rows logged for this specific call.
- **Numerology**: calculated a real reading (Life Path 3, Expression 6, Soul Urge 4, Personality 11
  (Master Number), Birthday 6, Personal Year 3 for a fixed test name/date) — confirmed deterministic,
  full digit-by-digit breakdown returned, entirely unaffected by what follows. Called
  `POST /numerology/readings/:id/interpret`: `interpretation` stayed `null`. `provider_logs`: two more
  new `OPENAI`/`429` rows logged for this specific call.

**Failure classification**: HTTP 429 alone is ambiguous (covers both rate-limiting and
quota-exhaustion). One minimal direct diagnostic call straight to the OpenAI API was made (reading the
key from `.env` server-side only, in a throwaway script deleted immediately after — the key was never
printed to any log, file, or terminal output at any point) to disambiguate:
`error.type=insufficient_quota`, `error.code=credit_balance_exhausted`. This confirms **OPENAI
QUOTA/BILLING**, not AUTHENTICATION — an invalid or revoked key would return `401`/`invalid_api_key`,
not `429`/`insufficient_quota`. The key itself is valid and is being accepted by OpenAI; the account
behind it has no funds.

**Determinism and no-silent-Mock checks, all confirmed**:
- Tarot card selection and Numerology number calculation both happened, and were both persisted,
  entirely independently of and prior to any AI call — neither is affected by the AI failure.
- No Mock response was substituted anywhere: `interpretation` fields stayed `null`, the Companion
  stream ended in an explicit error event, not a generated reply. This is a direct, positive
  consequence of leaving `FALLBACK_PROVIDER` unset for this verification.
- Usage/cost tracking (`ai_usages` table) recorded **zero new rows** for any of the three failed
  calls — confirmed by comparing timestamps before/after; the architecture only records token usage
  on a successful completion, which is correct behavior (no phantom cost for a call that was never
  billed).
- Secret exposure: `grep`-checked the full API server log for `sk-` and `OPENAI_API_KEY=` patterns —
  zero matches. No key appeared in any log, response, or `provider_logs` row at any point.

**Targeted tests + typecheck, run after verification**: `provider-orchestrator`/`companion`/`tarot`/
`numerology` unit suites — 294/294 passed (one suite's Jest worker was externally SIGTERM'd mid-run,
confirmed a one-off by a clean rerun in isolation, 20/20). Full `typecheck` — clean on both apps. No
code was changed as part of this verification pass; only `apps/api/.env` (gitignored, local-only) was
edited.

## 13. Final Output Checklist

1. `OPENAI_API_KEY`: **SET**
2. `DEFAULT_AI_PROVIDER`: **openai**
3. Mock fallback during verification: **DISABLED** (`FALLBACK_PROVIDER` left unset per schema)
4. API restart: **PASS** (single process confirmed on port 4000)
5. Selected runtime provider: **openai** (confirmed via boot log and `provider_logs`, not response
   wording)
6. Companion result: **FAILED** — real OpenAI attempt, `429 insufficient_quota`
7. Tarot result: **FAILED** — real OpenAI attempt (×2 logged), `429 insufficient_quota`,
   deterministic card unaffected
8. Numerology result: **FAILED** — real OpenAI attempt (×2 logged), `429 insufficient_quota`,
   deterministic numbers unaffected
9. Actual model used: **unknown** — the request never got far enough for OpenAI to echo a model back;
   requested model was `gpt-4o-mini`/whatever `openai.provider.ts` configures, but no response body was
   ever received to confirm it server-side
10. Usage tracking result: **zero rows recorded** for the failed calls — correct behavior, not a gap
11. Secret exposure in logs: **NO**
12. Code changes required: **NONE** — the provider-selection code is already correct; this is an
    OpenAI account billing gap
13. Tests: **294/294 targeted unit tests pass; typecheck clean**
14. Remaining blocker: the configured OpenAI account has no billing credits — needs credits added at
    <https://platform.openai.com> outside this codebase; no further verification is possible here until
    that's resolved
15. Working tree: only `apps/api/.env` (gitignored) and this doc were touched; no application code
    changed

## 14. Verdict (Superseded — see §16)

# REAL AI FAILED — DO NOT START SPRINT 9

The provider-selection code is verified correct end-to-end for all three surfaces (Companion, Tarot,
Numerology): OpenAI is genuinely selected, genuinely called, and genuinely fails — safely, with no
Mock substitution and no secret exposure. But per this sprint's own standard ("prove provider used:
openai... do not infer from response quality"), a call that never receives a real completion does not
count as verified real AI, regardless of how correctly the surrounding code behaves. The blocker is
external (OpenAI account billing), not fixable by further code changes, and — per this sprint's own
rule not to silently substitute Mock and call it success — this must be reported as failed, not
papered over.

This verdict stood as the last word on real-AI verification until the Gemini switch documented in
§16 below. It is left unmodified here, per this doc's own rule not to rewrite history — OpenAI really
was tested, really did fail on `insufficient_quota`, and that finding is still true today (no billing
credits have been added to the OpenAI account since). §16's verdict is the current one.

---

## 16. TEMPORARY GEMINI RUNTIME VERIFICATION

Performed as a temporary provider switch, per explicit instruction: OpenAI remains blocked on account
billing (§12–14, unchanged, not retested here since nothing about that blocker could have changed from
this side), and Gemini was verified as a temporary real-AI runtime instead — not a Sprint 9 kickoff,
not an architecture change, not a removal of OpenAI support.

### 16.1 Audit — existing Gemini support (before any code was touched)

Gemini support was already fully implemented, not scaffolded: `GeminiProvider` (`gemini.provider.ts`)
implements the same `AIProvider` interface as OpenAI/Anthropic/Mock — plain `fetch` against
`https://generativelanguage.googleapis.com/v1beta/models`, no SDK dependency — with both `chat()` and
a real SSE-parsing `stream()` (`supportsStreaming() === true`). `ProviderRegistryService` registers it
under the exact identifier `'gemini'` whenever `GEMINI_API_KEY` is set (`provider-registry.service.ts`
line 45-47); `env.validation.ts`/`configuration.ts` wire `GEMINI_API_KEY` end to end alongside the
other two real providers, with the same production boot-time `requireProviderKey` guard. Tarot and
Numerology interpretation both reuse `ProviderOrchestratorService`/`ProviderRegistryService` exactly —
confirmed by reading `tarot-interpretation.service.ts` and `numerology-interpretation.service.ts`
directly, both `import { ProviderOrchestratorService } from '../../companion/providers/...'` with no
second AI client anywhere. No new provider code, SDK, or architecture was needed.

### 16.2 Gemini secret

`GEMINI_API_KEY`: **SET** in `apps/api/.env` (this machine) — value never printed, logged, or included
in any command output at any point in this process.

### 16.3 Provider switch (machine-local only)

`apps/api/.env` (gitignored, not committed) already had `DEFAULT_AI_PROVIDER=gemini` and
`FALLBACK_PROVIDER` commented out (unset) at the start of this pass — the exact configuration this
task calls for, using the schema-supported `.optional()` path for "no fallback" (same reasoning as
§12's OpenAI pass: Mock is never appended automatically, so leaving Gemini's own failures visible
requires an explicit unset fallback, not `FALLBACK_PROVIDER=mock`). `OPENAI_API_KEY` and
`OpenAIProvider` were left completely untouched — this is a provider switch, not a migration.

### 16.4 Model verification — a real incompatibility was found and fixed

The repository's `GeminiProvider` hard-coded `DEFAULT_MODEL = 'gemini-1.5-flash'`. Checked against
Google's official docs (`ai.google.dev/gemini-api/docs/changelog`) before touching anything:
**`gemini-1.5-pro`, `gemini-1.5-flash-8b`, and `gemini-1.5-flash` were all shut down by Google on
2025-09-29** — every request to that hard-coded model would return `404`, permanently, independent of
API key validity. This is a genuine incompatibility (per this task's own instruction to verify before
changing), not an invented upgrade.

**Code change made** (the only application-code edit in this pass, both files ~4 lines):
- `apps/api/src/companion/providers/gemini.provider.ts` — `DEFAULT_MODEL` changed from
  `'gemini-1.5-flash'` to `'gemini-3.5-flash-lite'`.
- `apps/api/src/companion/providers/pricing.ts` — the `gemini` pricing table entries replaced with
  `gemini-3.5-flash-lite` at $0.30 / $2.50 per 1M prompt/completion tokens (official pricing docs).

**Model selection reasoning**: checked `gemini-2.5-flash` (same price, explicitly "best
price-performance for low-latency, high-volume tasks" per official model docs) against
`gemini-3.5-flash-lite` (same price, "fastest, most cost-effective 3.5 model"). Picked
`gemini-3.5-flash-lite` because `gemini-2.5-flash` already has a Google-announced retirement date of
2026-10-16 (~2 months out) while `gemini-3.5-flash-lite` has no announced shutdown date — a longer
runway matters more than a marginal difference for a model that's meant to serve real traffic even
temporarily. No other provider architecture changed; no new SDK installed (the existing plain-`fetch`
implementation already targets the generic `v1beta/models/{model}` endpoint, which accepts the new
model ID with no other code change).

### 16.5 API restart

Confirmed no stale process was holding port 4000 before starting (`Get-NetTCPConnection -LocalPort
4000` returned nothing). Docker Desktop was not running at the start of this pass — infra
(`beaconvie-postgres`, `beaconvie-redis`, `beaconvie-mailpit`) was started via `docker compose up -d`,
confirmed all three `Running`. `prisma migrate status`: up to date, 15 migrations, no drift. A single
`pnpm dev:api` process was then started (PID 18868, confirmed sole listener on port 4000). Boot log:

```
BeaconVie API listening on http://localhost:4000
AI provider: gemini
AI fallback: (none)
Nest application successfully started
```

No key value in either line.

### 16.6 Per-surface verification — real requests, provider identity from runtime metadata only

All three used the seeded `demo@beaconvie.local` account (CSRF token + session cookie via
`GET /auth/csrf-token` → `POST /auth/login`, no key or password logged).

**Companion**: created a conversation, sent one real message ("what is a small grounding technique for
stress?"), opened the SSE stream. Got a genuine, on-topic reply
("Name three objects you can see right now and notice their color."), which by itself is *not* proof
per this sprint's own rule (never infer provider from response wording) — confirmed instead from the
persisted `conversation_messages` row's `metadata` column, written directly from the orchestrator's own
`chunk.provider`/`chunk.model` at persist time: `{"provider": "gemini", "model":
"gemini-3.5-flash-lite", ...}`. Also independently confirmed in `ai_usages`: `provider=GEMINI,
model=gemini-3.5-flash-lite, promptTokens=756, completionTokens=13, estimatedCostUsd=0.000259`.

- **Note — a real, pre-existing observability gap found in the process, not caused by this switch**:
  `provider_logs` (the per-attempt latency/success/retry audit table written by
  `ProviderOrchestratorService`'s `logProviderCall`) did **not** get a row for this successful Companion
  call, even though it did for Tarot and Numerology below. Root cause, read directly in
  `stream.service.ts`: on the `'done'` chunk, `StreamService.generate()` does its own persistence work
  and then `return`s immediately from inside the `for await` loop over
  `this.orchestrator.stream(...)`. Returning out of a `for await...of` early triggers the JS runtime to
  call `.return()` on the underlying async generator (`ProviderOrchestratorService.stream()`), which
  terminates that generator's execution *at the point of its last `yield`* — i.e. before it ever reaches
  its own `await this.observability.logProviderCall(...)` call one line later. `logUsage`/`AIUsage`
  aren't affected because `StreamService` calls those itself, directly, before the early `return`. This
  was never visible before this pass because every prior real-provider (OpenAI) call through Companion
  failed (§12), and the orchestrator's *error* path calls `logProviderCall` synchronously before
  yielding, so failures were never affected — only the success path is. Tarot/Numerology don't have
  this bug because their consumer loops never `return` early on `'done'`; they let the orchestrator's
  generator run to natural completion. **Not fixed in this pass** — it's a pre-existing defect
  unrelated to the provider switch itself, out of this task's explicit "don't redesign" scope; flagging
  it here rather than silently leaving it undiscovered.

**Tarot**: drew a real Single Card reading (auto-interprets on draw) — `Page of Wands`, reversed,
computed deterministically by `tarot-draw-engine.util.ts` before any AI call. `interpretation` came back
real, on-topic prose grounded in that exact card/orientation, ending in an open question (per its system
prompt's hard rules). Confirmed independently in `provider_logs`: `provider=GEMINI,
model=gemini-3.5-flash-lite, latencyMs=1459, success=true, retryCount=0` — the row this task asked for.

**Numerology**: calculated a real reading (`Nguyen Van An`, 1995-03-14) — Life Path 5, Expression 3,
Soul Urge 1, Personality 11 (Master Number, correctly never reduced further), Birthday 5, Personal Year
9, all computed deterministically by `numerology-engine.ts` before any AI call. `interpretation` came
back real, correctly referencing every one of those exact numbers (including calling out the Master
Number by name), ending in an open question. Confirmed independently in `provider_logs`:
`provider=GEMINI, model=gemini-3.5-flash-lite, latencyMs=1592, success=true, retryCount=0`.

### 16.7 Failure behavior (not re-tested with a broken key — verified by code + config instead)

Not deliberately re-broken (Gemini is currently working and doing so was unnecessary): the
`FALLBACK_PROVIDER`-unset guarantee that this sprint already proved structurally correct for OpenAI in
§12 (`ProviderOrchestratorService.chain()` only appends a fallback if one is explicitly configured; Mock
is never auto-appended — `provider-orchestrator.service.ts` lines 50-57) is provider-agnostic code —
it behaves identically regardless of which provider is `DEFAULT_AI_PROVIDER`. Re-reading that same code
path with `DEFAULT_AI_PROVIDER=gemini` confirms the same guarantee holds here: a Gemini failure ends in
the same `PROVIDER_UNAVAILABLE`/`GENERATION_INTERRUPTED` error chunks §12 already observed for OpenAI,
never a silent Mock reply. Tarot/Numerology's deterministic results (card draw, number calculation) are
computed and persisted before the AI call in both services, confirmed by reading
`tarot-interpretation.service.ts`/`numerology-interpretation.service.ts`: the AI call is strictly
narration-only and its failure (`return null`) leaves the deterministic result completely intact.

### 16.8 Usage/observability

- `provider_logs`: real rows for Tarot/Numerology (`provider=GEMINI, model=gemini-3.5-flash-lite`,
  latency, success, retry count) — see §16.6. Companion's gap is a pre-existing bug, documented above,
  not a Gemini-specific issue.
- `ai_usages`: real row for Companion (`provider=GEMINI, model=gemini-3.5-flash-lite, promptTokens=756,
  completionTokens=13, estimatedCostUsd=0.000259`).
- Secret scan: grepped the full API server log for `AIza` (Google key prefix), `GEMINI_API_KEY=`,
  `key=` (the Gemini REST endpoint's query-string auth param), and `sk-` (OpenAI) — zero matches across
  all four patterns.

### 16.9 Targeted regression + typecheck (after the model-constant fix)

`companion/providers`, `companion/stream`, `tarot/interpretation`, `numerology/interpretation` targeted
Jest suites: **50/50 passed** (7 suites — `pricing.spec.ts`, `mock.provider.spec.ts`,
`provider-registry.service.spec.ts`, `provider-orchestrator.service.spec.ts`,
`tarot-interpretation.service.spec.ts`, `numerology-interpretation.service.spec.ts`,
`stream.service.spec.ts`). These all run against the deterministic Mock provider strategy already in
place — none were made to depend on the real Gemini API, per this task's explicit instruction. API
typecheck: clean. Web typecheck: clean.

### 16.10 Final Output Checklist (this pass)

1. Existing Gemini provider found?: **YES** — fully implemented, not scaffolded (§16.1)
2. Gemini API key env variable expected: **`GEMINI_API_KEY`**
3. Gemini API key: **SET**
4. `DEFAULT_AI_PROVIDER`: **gemini**
5. `FALLBACK_PROVIDER`: **unset** (left unset deliberately, matching §12's OpenAI-pass reasoning)
6. Actual Gemini model: **`gemini-3.5-flash-lite`** (changed from the dead `gemini-1.5-flash` — §16.4)
7. API restart result: **PASS** — single process, port 4000, boot log confirms `AI provider: gemini`
8. Companion result: **REAL GEMINI** — verified via persisted message `metadata` + `ai_usages`, not
   response wording; `provider_logs` row missing due to a pre-existing bug, documented in §16.6, not
   caused by this switch
9. Tarot result: **REAL GEMINI** — verified via `provider_logs`
10. Numerology result: **REAL GEMINI** — verified via `provider_logs`
11. Provider metadata result: confirmed from three independent runtime sources (`provider_logs`,
    `ai_usages`, `conversation_messages.metadata`) — never from response content
12. Usage/token tracking result: real prompt/completion token counts and cost recorded for Companion;
    latency/retry/success recorded for Tarot/Numerology
13. Mock fallback detected?: **NO**
14. Secret exposure?: **NO**
15. Code changes required: **YES, minimal** — `gemini.provider.ts` `DEFAULT_MODEL` constant and
    `pricing.ts`'s Gemini entries (dead-model fix, not an architecture change); see §16.4
16. Tests and exact results: 50/50 targeted unit tests pass; API + Web typecheck clean (§16.9)
17. Files changed: `apps/api/src/companion/providers/gemini.provider.ts`,
    `apps/api/src/companion/providers/pricing.ts`, this doc; `apps/api/.env` (gitignored, already
    configured for Gemini before this pass, not further modified)
18. Working tree: only the two source files above and this doc changed; no other application code
    touched
19. Remaining blocker: none for Gemini. OpenAI's blocker (§12–14) is unchanged — no billing credits on
    that account, external to this codebase
20. Final verdict: see below

### 16.11 Verdict

# REAL GEMINI VERIFIED — READY FOR SPRINT 9

Gemini is genuinely selected, genuinely called, and genuinely returns real, on-topic completions for
all three surfaces (Companion, Tarot, Numerology), confirmed from runtime metadata
(`provider_logs`/`ai_usages`/persisted message metadata) rather than response wording. Deterministic
Tarot/Numerology results remain fully independent of and unaffected by the AI layer. No Mock
substitution, no secret exposure. OpenAI support is fully intact and unmodified — this is a temporary,
reversible provider switch (`DEFAULT_AI_PROVIDER=gemini` in the local, gitignored `.env`), not a
migration. The only application-code change was fixing a hard-coded, already-dead Gemini model constant
(`gemini-1.5-flash`, shut down 2025-09-29) to a currently-supported one
(`gemini-3.5-flash-lite`) — a bug fix necessary to make the existing architecture actually reach
Gemini, not a redesign. One pre-existing, unrelated observability bug was found and documented (§16.6)
but deliberately not fixed, being out of this task's scope.

---

## 15. Original Sprint 8.5 Verdict (Product Experience Remediation, Unaffected By §12–14)

All P0 and in-scope P1 findings from the original audit are fixed, committed, and independently
re-verified against source and live screenshots on this machine. The interrupted QA phases
(Playwright, manual browser review, full quality gates) are now complete. The two
newly-discovered test-infrastructure findings are test-suite fragility, not product defects, and do
not block product work.
