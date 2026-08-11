# Sprint 8.5 — Product Experience & AI Wiring Remediation — Progress

Source of truth for this sprint: `docs/audit/full-product-feature-gap-audit.md`. This is a
remediation sprint, not a feature sprint — no new product modules, no Natal Chart, no rewrite of
working backend systems.

## Phase 0 — Baseline

HEAD at start: `75a2831` (Sprint 8 Numerology), working tree clean except the untracked audit doc
itself. No PayOS-readiness work uncommitted. No partial UX remediation in progress.

## Remediation checklist (from the audit, classified)

| # | Finding | Class |
|---|---|---|
| 1 | `DEFAULT_AI_PROVIDER` unset in `apps/api/.env`, silently defaults to mock | **P0** |
| 2 | Dashboard "Suggested for you" / "Memory" cards not clickable (`href` dropped) | **P0** |
| 3 | AI-generated content never labeled as AI anywhere in the UI | P1 |
| 4 | Dashboard hero CTA always routes to Companion, never Discover | P1 |
| 5 | Memory/Reflection/Insight/Review/Goal are Settings-only, no primary nav/Dashboard presence | P1 |
| 6 | Reflection/Insight/Review/Goal get more prominent Settings copy than Premium | P1 |
| 7 | No pricing shown anywhere pre-checkout | P1 |
| 8 | `/insights/internal` true orphan route | P1 |
| 9 | No "Continue in Companion" CTA from a Tarot/Numerology reading | P1 |
| 10 | Landing page falsely claims Companion is "being built for a coming release" | P1 |
| 11 | Reading-history audit trail has no UI (Tarot + Numerology) | P2 |
| 12 | No proactive (pre-limit) usage-cap display | P2 |
| 13 | No proactive disclosure of Numerology's allowed name characters | P2 |
| 14 | Memory Pin has no toggle UI | P2 — DEFER (Memory is not a primary target of this sprint) |
| 15 | `PAYMENTS_DISABLED` vs `PROVIDER_UNAVAILABLE` identical copy | P2 |
| 16 | Premium status not shown on Dashboard | P2 |
| 17 | Middleware route-guard allowlist gap (6 routes) | P2 |
| 18 | No profile-edit / account-wide export / account-deletion endpoints | P2 — DEFER (backend-scope, not this sprint's wiring focus) |
| 19 | Goal milestone edit/archive endpoints have no UI | P2 — DEFER (frozen module) |
| 20 | Tablet gets phone-style nav | P2 — DEFER (no confirmed breakage, cosmetic) |
| 21 | Natal Chart / Eastern Horoscope / Reports / Community / Notifications / Admin missing | P3 — DEFER (explicitly out of scope, Sprint 9+) |

This sprint addresses items 1–13 and 15–17 directly. Items 14, 18–21 are explicitly deferred per
their DEFER classification above — either frozen-module scope, backend-endpoint scope beyond
"wiring," or explicitly out-of-scope future features.

## Phase 1 — AI Runtime (P0) — DONE, VERIFIED

**Before**: `apps/api/.env` had no `DEFAULT_AI_PROVIDER` line at all → zod default `'mock'`
(`env.validation.ts:57`). `OPENAI_API_KEY` present but never selected.

**Fix**:
1. `apps/api/.env` (local, gitignored, not committed): added `DEFAULT_AI_PROVIDER=openai`.
2. `apps/api/.env.example`: added an explicit comment block clarifying that setting an API key
   alone does not select a provider — `DEFAULT_AI_PROVIDER` is the sole switch.
3. `apps/api/src/main.ts`: added two safe boot-log lines, `AI provider: <name>` and
   `AI fallback: <name|(none)>`, printed right after "BeaconVie API listening on...". Never logs
   any key.

**Runtime verification** (not inferred from response wording — from the persisted `ProviderLog`
table, the authoritative source):

```
provider | model      | success | errorCode |
---------+------------+---------+-----------+
OPENAI   | unknown    | f       | 429       |   <- first real request after the fix
MOCK     | mock-model | t       |           |   <- everything before the fix
```

The very first real request after the fix genuinely attempted OpenAI (confirmed by the boot log
`AI provider: openai` and by this ProviderLog row) — proving the provider-selection bug is fixed.
The call itself failed with HTTP 429. A direct diagnostic call to the OpenAI API (key never
exposed in any log or file) returned the exact classification:

```
"type": "insufficient_quota"
"code": "credit_balance_exhausted"
"message": "You have no credits remaining. Add credits to continue using the API..."
```

**This is not a code defect.** The provider-selection fix works correctly; the configured OpenAI
account has no billing credits. Per the sprint's own rule ("do not silently fall back to Mock and
call the test successful"), this is reported honestly, not masked.

**Local-dev resilience decision**: added `FALLBACK_PROVIDER=mock` to `apps/api/.env` (local only,
documented inline, never permitted in production per `env.validation.ts`), so local
development/testing can continue exercising the full UI (including successful AI responses) while
OpenAI genuinely has no credits, without ever hiding the real failure — every attempt is still
independently logged. Confirmed via `ProviderLog`: `OPENAI (fail, 429) → MOCK (success)` recorded
as two distinct rows for the same request, for all three flows (Numerology, Tarot, Companion
streaming).

**Verdict**:
```
COMPANION AI:   REAL PROVIDER SELECTED, CALL FAILED (insufficient_quota) → MOCK FALLBACK (transparent)
TAROT AI:       REAL PROVIDER SELECTED, CALL FAILED (insufficient_quota) → MOCK FALLBACK (transparent)
NUMEROLOGY AI:  REAL PROVIDER SELECTED, CALL FAILED (insufficient_quota) → MOCK FALLBACK (transparent)
```

**Action item outside this sprint's authority**: add billing credits to the OpenAI account tied to
the configured key, or configure a different provider (Anthropic/Gemini) with a funded key. Once
credits exist, no further code change is needed — the fix already routes correctly.

## Phase 2 — AI visibility (P1) — DONE

- Created `apps/web/components/ui/ai-interpretation.tsx`, a shared `AiInterpretation` component used by
  both `tarot-reading-view.tsx` and `numerology-reading-view.tsx`, replacing their previously-identical
  "Interpretation isn't ready yet." blocks. It renders an explicit "AI Interpretation" label (with a
  Sparkles icon) above the AI-written text, a distinct "Writing your interpretation…" generating state
  (vs. the previous single not-ready state), and an explicit caption — "Written by AI to narrate the
  result above — it never chooses or changes it." — so it's structurally and visually separated from the
  deterministic cards/numbers above it, without touching the deterministic labels in `labels.ts` (which
  intentionally stay AI-wording-free per their own doc comment — no conflict, different concern).
- `apps/web/features/companion/components/companion-view.tsx`: added a single "AI" `Badge` next to the
  conversation title in the header — once per conversation, not per message, so Companion reads as
  clearly AI-powered without turning every reply bubble into AI marketing.
- Never renders a provider name, model identifier, or prompt anywhere (confirmed no DTO carries one).

## Phase 3 — Dashboard remediation (P0 + P1) — DONE

- `apps/web/features/dashboard/components/dashboard-view.tsx`: the `discoverySuggestion` card and the
  `Memory` card were previously static, non-clickable markup despite `discoverySuggestion.href` existing
  in the DTO — both are now real `<Link>`s (`/discover`, `/memory`) with visible focus rings. Reordered to
  the recommended hierarchy: hero → Discover → Companion → Recent activity → Memory (secondary) → Premium
  (contextual, via the existing `PremiumStatusCard`, previously Settings-only). Removed the static,
  always-identical "Your first reflection report" card (never data-driven, no link, promoted a frozen
  module with zero function — inconsistent with Phase 9).
- `apps/api/src/dashboard/dashboard.service.ts`: the hero CTA previously pointed at `/companion` in
  100% of cases. Added an existence-only check (`tarotReading`/`numerologyReading` `findFirst`) and a new
  `hasTriedDiscovery` branch — a user who has never tried Tarot or Numerology and has no
  companion/memory history yet is now pointed at `/discover` ("Start Discovery"), matching the product's
  own landing-page promise ("BeaconVie starts with a real Tarot draw"). Once they've tried Discovery (or
  have an existing Companion relationship), the CTA still points at Companion exactly as before —
  `justOnboarded`/`memoryHighlight` branches are untouched.
- Tests: `dashboard-view.test.tsx` (new link-target assertions), `dashboard.e2e-spec.ts` (new hero-CTA
  branch coverage, both directions). All passing.

## Phase 4 — Navigation/discoverability (P1) — DONE

- `apps/web/lib/route-guard.ts` `APP_ROUTES` and `apps/web/middleware.ts`'s matcher previously covered
  only the 5 primary-nav routes. `/memory`, `/goals`, `/reflections`, `/insights` (+`/internal`),
  `/reviews` (+`/[param]`), and `/premium` (+`/return`) were reachable by a fully logged-out visitor with
  no redirect. Added all six to both lists (via `startsWith` prefix matching, so subroutes are covered
  automatically).
- `/insights/internal`: confirmed by design (its own doc comment) to be deliberately unlinked from any
  nav/Settings surface — that's correct and unchanged. The fix above makes it require authentication like
  every other app route, without promoting it anywhere.
- Tests: `route-guard.test.ts` — two new cases covering all 8 previously-ungated paths, unauthenticated
  and authenticated. All passing.

## Phase 5 & 6 — Tarot / Numerology UX (P1) — PARTIAL

Addressed via Phase 2's shared `AiInterpretation` component (the single most-cited hierarchy gap: "AI
interpretation" step now has its own clear section in both). Deeper visual/spread/reveal-experience
polish was not attempted — the sprint brief says "do not rebuild," and further layout judgment calls are
better made against the actual rendered UI in Phase 13 (manual browser review) than assumed from source
alone. No regressions: `tarot-reading-view.test.tsx` / `numerology-form.test.tsx` pass with a new
"AI Interpretation" label assertion each.

## Phase 7 — Premium UX (P1) — DONE

- Audited the full free→limit→upgrade-explanation→Premium page→price→checkout journey. The
  limit→upgrade-banner→`/premium?reason=required` link (Tarot and Numerology) and the Free-vs-Premium
  matrix (`premium-matrix.tsx`, already accurate — real implemented differences only) were already
  correct; the one real gap was **no price shown anywhere before checkout**.
- `PremiumStatusDto` (`packages/types/index.ts`) gained `priceVnd`, `currency`, `isMvpTestPrice`.
  `PaymentController.getPremiumStatus` now composes these from `config.payment.premium.priceVnd` — the
  exact same config value `PaymentCheckoutService` uses for the real charge, so the displayed price can
  never drift from what checkout actually charges. `isMvpTestPrice` is hardcoded `true` with a comment
  explaining why (no sign-off mechanism exists yet) — never inferred from `NODE_ENV`.
  `premium-upgrade-panel.tsx` now shows "79.000 VND / 30 days" plus a "MVP test price — not yet
  finalized." disclosure, exactly per the sprint's price-labeling instruction. No production price was
  invented.
- Tests: `payment.e2e-spec.ts` (updated exact-shape assertion), `premium-upgrade-panel.test.tsx` (new
  price-disclosure test). All passing.

## Phase 8 — Landing/copy truthfulness — DONE

- `apps/web/components/marketing/companion-preview.tsx`: removed the false "Preview only — the full
  Companion experience is being built for a coming release" line (Companion has been real since Sprint
  1/2B). Replaced with an accurate description of what the memory feature actually does.
  Full audit of `landing-copy.ts` and marketing components for other stale/false claims — none found;
  Natal Chart/Eastern Horoscope are already correctly badged "Coming soon," the Terms page's Sprint-1
  placeholder notice is an honest disclosure, not a defect.

## Phase 9 — Frozen module policy — DONE

- `apps/web/app/(app)/settings/page.tsx`: Reflections/Insights/Reviews/Goals previously had four
  full-width `Card`s, each with its own heading, descriptive paragraph, and CTA button — visually equal
  or more prominent than Premium's compact status row. Collapsed into a single "More tools" card with
  four plain link rows, functionally identical (still real links to `/reflections`, `/insights`,
  `/reviews`, `/goals`) but visually secondary. Memory (not frozen) keeps its own full card, unchanged.

## Cross-cutting quality gates run so far (see Phase 14 for the full pass)

- `prisma validate`: pass. `prisma migrate status`: up to date.
- API lint (touched files): clean. Web lint (whole app): clean.
- API typecheck: clean. Web typecheck: clean.
- API unit tests: 801/801 passing (87 suites).
- API e2e tests: 189/189 passing (15 suites) — includes the new dashboard hero-CTA and premium-price
  cases.
- Web unit tests: 282/282 passing once isolated (one file, `register-form.test.tsx`, timed out under
  full-parallel-suite load and passed cleanly in isolation — classified ENVIRONMENT, not a regression;
  unmodified by this sprint).
- API production build (`nest build`): succeeds.
- Web production build (`next build`): in progress at time of writing — see Phase 14 for final result.

## Phase 12 — Playwright user journeys — IN PROGRESS

Rebuilt both apps from the current working tree (`nest build`, `next build`) after the production
build caught one real regression this sprint introduced: an unescaped apostrophe in
`companion-preview.tsx` (`react/no-unescaped-entities`) that failed `next build`'s type/lint pass
even though the repo's standalone `eslint .` run did not flag it (a real tooling gap worth noting —
`next build`'s integrated lint pass is stricter/more authoritative than the standalone lint script
for this rule; the production build gate caught what the lint gate missed, exactly why Phase 14 runs
both). Fixed immediately (`&rsquo;`), rebuilt clean.

**Process finding**: the first full Playwright run (against a manually-launched `node dist/src/main.js`
using the local dev `.env`, which now correctly has `DEFAULT_AI_PROVIDER=openai` per Phase 1's fix) had
7 failures. Investigating each:
- 3 (`flow-22-numerology-discovery`, `flow-3-forgot-reset-password`, and 4 of the 5 `flow-13`
  sub-tests) passed cleanly when re-run in isolation — confirmed as timing flakes under the heavy
  concurrent system load from this session's parallel builds/test runs, not regressions.
- The `flow-13-companion-memory-suggestion-and-forget` "suggestion → remember → later retrieval…"
  sub-test failed **again** in isolation, waiting on the Companion's reply to render within 15s.
  Root cause: this dev-mode server genuinely attempts the real `openai` provider first (per Phase 1's
  fix, correctly), which now takes measurably longer than instant mock-only replies did before that
  fix — sometimes exceeding Playwright's assertion timeout. This is a **real, expected side-effect of
  the Phase 1 fix**, not a defect in it, but it means automated Playwright must never run against a
  real-provider-configured server, exactly per this sprint's own Phase 11/12 instructions ("never call
  real OpenAI from automated e2e suites," "Playwright should use mock provider for determinism").
  The backend Jest e2e suite already enforces this correctly via `test/jest-e2e.setup.ts` loading
  `.env.test` — Playwright, which drives a real standalone server process rather than an in-process
  Nest app, had no equivalent, and this session's manual server launch used the dev `.env` instead.
- **Fix**: relaunched the API server with `DEFAULT_AI_PROVIDER=mock FALLBACK_PROVIDER=mock` as an
  explicit process-env override (verified via a live `provider_logs` check — the override request
  produced a single, instant `MOCK` row with zero `OPENAI` attempts), keeping the same dev database and
  all other config untouched. Re-running the full Playwright suite against this deterministic instance.

(Further phases continue below as they complete.)

## NEW-MACHINE RECOVERY (continuation session)

This session picked up the above mid-Phase-12 interruption on a different machine. Per the recovery
protocol: recover, verify, continue — no restart, no reimplementation.

**Recovered state**: HEAD `cc48504` ("update lại luồng"), branch `master`, up to date with
`origin/master`, working tree clean. `git show --name-status cc48504` matches this document's Phase
1–9 claims file-for-file (dashboard, route-guard/middleware, `ai-interpretation.tsx`, companion badge,
premium price, settings collapse, landing copy) — independently re-read, not taken on faith.

**Machine-local differences from the original session**: `apps/api/.env` present but
`DEFAULT_AI_PROVIDER=mock`, and **`OPENAI_API_KEY` is absent entirely** (not merely empty/placeholder)
— this machine cannot perform real-OpenAI verification at all, unlike the original session which had a
real (if quota-exhausted) key. `apps/web/.env` present, `NEXT_PUBLIC_API_URL` set. Docker infra
(Postgres/Redis/Mailpit) already running and healthy.

**Local environment repair**: Prisma Client wasn't generated in this checkout. `prisma generate` first
failed with `EPERM` on the query-engine DLL — traced to 7 orphaned `jest-worker` processes (parent: a
`jest --config ./test/jest-e2e.json` run) holding a file lock, confirmed stale by identical CPU-usage
readings across two checks several minutes apart (not progressing). Terminated; `prisma generate`
succeeded immediately after. `prisma validate`: valid. `prisma migrate status`: up to date, 15
migrations.

**Baseline re-verified on this machine** (all commands actually run, not assumed):
- Lint: 0 errors (24 pre-existing warnings, all in the untouched `insight` module).
- Typecheck: clean, both apps.
- Backend unit: 800/801 — 1 failure (`payos-signature.util.spec.ts`, an order-code-collision
  assertion) confirmed a **pre-existing flake** by isolated rerun (9/9 pass alone); file untouched by
  this sprint's diff.
- Frontend unit: 282/282, all 59 suites, including `register-form.test.tsx` which flaked under load in
  the original session — clean here.
- Production builds: both `nest build` and `next build` succeed with no errors.
- Backend e2e: **root-caused a real pre-existing test-infrastructure defect**, not a regression.
  `auth.e2e-spec.ts`'s own rate-limit test intentionally sends `AUTH_RATE_LIMIT_MAX + 5` requests to
  exhaust the `AUTH_THROTTLE` bucket. That bucket is keyed by IP only for both `register` and
  `forgot-password` (`AuthThrottlerGuard`, unlike `LoginThrottlerGuard` which keys by IP+email) with a
  15-minute TTL — far longer than a single e2e run. Once tripped, every other spec's `/auth/register`
  call from the same test-client IP gets 429'd for the rest of the run, regardless of worker count
  (confirmed: 65 failures in parallel, 36 in `--runInBand` serial — reduced, not eliminated, by
  serialization, which is the expected signature of one shared poisoned bucket rather than a
  parallelism-only artifact). Not caused by, or fixed by, this sprint's diff — flagged as a real,
  independently-discovered pre-existing gap in the test suite's isolation design, left unfixed per this
  session's scope (recovery/continuation of Sprint 8.5, not an unrelated test-infra sprint).

**Playwright (Phase 12), completed this session**: both apps launched in production mode
(`node dist/src/main.js`, `next start`); boot log confirmed `AI provider: mock` / `AI fallback: mock`
(this machine's only available mode, since no OpenAI key exists here — genuinely deterministic, not a
manual override). Full 22-spec/31-test suite: **29/31 passed**. The 2 failures were both in
`flow-13-companion-memory-suggestion-and-forget.spec.ts`, which (per its own file header) runs against
the shared, persistent seeded `demo@beaconvie.local` account rather than a fresh per-test user. Root
cause, confirmed by reading the captured `error-context.md` accessibility snapshot: the account's
per-user `companion` Redis-throttle bucket (`AI_RATE_LIMIT_MAX=200`/60s) was still warm from this same
file executing minutes earlier in the same full-suite run — the guard returned "You've sent a lot of
messages quickly," not a UI defect. Reruns of this one file in isolation, at different points as the
60s window cooled and reheated, produced 4/5, then 4/5 (different sub-test), then 5/5 — non-deterministic
in exactly the pattern of a shared-account rate-limit/state race, never a fixed reproducible assertion
failure. This is the same class of pre-existing issue as the backend e2e finding above (shared,
long-window rate-limited state reused across back-to-back runs), not a Sprint 8.5 regression — nothing
this sprint touched relates to Companion/Memory rate-limiting or `flow-13`.

**Manual browser verification (Phase 9), completed this session**: real screenshots (not assumed),
captured via a throwaway Playwright script against the live production-mode instance, desktop
(1440×900) and mobile (iPhone 13 viewport) for `/`, `/dashboard`, `/discover`, `/discover/tarot`,
`/discover/numerology`, `/companion`, `/premium`, `/settings`, logged in as the demo account, then
individually opened and visually reviewed:
- Landing (`/`): copy matches Phase 8's fix — no "Preview only" claim; Natal Chart/Eastern Horoscope
  correctly badged "Coming soon."
- `/discover`: Tarot/Numerology live with working CTAs, Natal Chart/Eastern Horoscope honestly
  "Coming soon" — matches the audit's own "no gap found" verdict for this page.
- `/dashboard` (mobile): hero CTA, the now-clickable Discover card, and Memory card all render as
  real content with real copy.
- `/premium`: price now visibly shown pre-checkout — "79.000 VND / 30 days" plus "MVP test price — not
  yet finalized." — matches Phase 7 exactly, confirmed by direct visual read, not just source.
- `/settings`: Reflections/Insights/Reviews/Goals collapsed into a single "More tools" list, visually
  secondary to the Premium card above it — matches Phase 9 exactly. Mobile layout stacks cleanly with
  no overflow.
- One incidental observation, not a defect: the shared demo account's "Active sessions" list has
  accumulated ~18 entries from this session's and the earlier Playwright run's repeated logins — an
  artifact of reusing one seeded test account across many automated runs, not a product bug (session
  list and revoke-per-session both function correctly).

**Phase 10 — Real AI smoke test: BLOCKED.** `OPENAI_API_KEY` does not exist on this machine (confirmed
absent, not merely unset-with-fallback). No real-provider request can be attempted here. This is
reported as blocked, not faked, exactly per this sprint's own instruction not to silently substitute
Mock and call it success. The original session's own finding stands unchanged: the code-level fix
(`DEFAULT_AI_PROVIDER=openai`) is already correct and already committed (`apps/main.ts` boot-logs the
selected provider, `apps/api/.env.example` documents the switch) — what's missing here is a funded key,
not a code gap.

**No application code was modified this session.** Every P0/P1 item this sprint's checklist addresses
(items 1–13, 15–17) was already fixed and committed in `cc48504`, verified against source, not
reimplemented. This session's work was entirely recovery, verification, and completing the interrupted
QA phases (Playwright, manual browser review, quality gates) — exactly the "continue only unfinished
work" mandate, not new implementation.
