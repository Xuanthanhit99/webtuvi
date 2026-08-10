# Post-Sprint 6 Test Infrastructure Maintenance

Focused maintenance pass following Sprint 6 (Tarot Discovery Foundation, `e763e55`, local/not
pushed, on top of `35417d0` on `origin/master`). Scope: the two release-gate problems disclosed in
Sprint 6's own closure report (`docs/progress/sprint-6-final-report.md` §15) — backend e2e 429s
under the full 13-suite batch, and a Playwright dev-server crash under the full 20-flow/29-test
suite. This is **not** Sprint 7: no Premium/Payment, no Tarot behavior change, no Goal/Reflection/
Insight/Review scope extension, no pushed-history rewrite.

## 1. Starting state

- `git log --oneline -3`: `e763e55` (Sprint 6 final report, local) → `35417d0` (Sprint 5C + Sprint 6
  work, already on `origin/master`) → `87ccd06` (Sprint 5B).
- `git status --short` at session start showed one uncommitted change already sitting in the
  working tree: `apps/api/src/auth/auth.controller.ts`. This was not created by this session — it
  was found in place, with a detailed explanatory comment already attached, apparently drafted in
  an earlier/interrupted session and never committed. It was **not** taken on faith: it was
  temporarily stashed, the failure was reproduced without it, then it was restored and independently
  verified against `app.module.ts`'s `ThrottlerModule` registration and `CompanionThrottlerGuard`'s
  own docstring (see §2) before being trusted as the fix.
- `git diff --check`: clean (one pre-existing LF/CRLF warning from Git's autocrlf setting, not an
  actual conflict marker or trailing-whitespace error).

## 2. Backend e2e — root cause and fix

**Reproduced first, from a clean environment**, before touching anything:

- `tarot.e2e-spec.ts` alone: **10/10 passing** (confirms Sprint 6's own disclosure).
- Full 13-suite batch (`pnpm --filter api test:e2e`), with the pending `auth.controller.ts` change
  stashed out (i.e. the code exactly as `e763e55` left it): **13 suites failed, 138/159 tests
  failed**, all with `expected 2xx, got 429 "Too Many Requests"` on `/auth/register` and friends,
  failing almost immediately (~14s total — far too fast to be the 200-req/15-min `auth` bucket
  actually filling up).

**Root cause (classification: C — a real product-code rate-limit configuration defect, not a test
artifact)**: `ThrottlerModule.forRootAsync` (`apps/api/src/app.module.ts`) registers four named
throttlers — `default` (1000/60s), `auth` (`AUTH_RATE_LIMIT_MAX`/`WINDOW_MS`, 200/15min in both
`.env` and `.env.test`), `companion` (`AI_RATE_LIMIT_MAX`/`WINDOW_MS`, defaults to **20 req/60s**,
tracked per-user-or-IP), and `companion-ip` (`AI_RATE_LIMIT_IP_MAX`, defaults to **100 req/60s**,
per-IP). NestJS's `ThrottlerGuard` checks **every registered throttler against every guarded route**
unless that route explicitly opts out with `@SkipThrottle()`. `CompanionThrottlerGuard`'s own
docstring already documents this exact mechanism from the other side: Companion (AI chat) routes
carry `@SkipThrottle({ auth: true })` so the tight `auth` bucket doesn't leak onto chat traffic. The
auth routes (`register`, `login`, `forgot-password`, `reset-password`, `verify-email`,
`resend-verification`, `change-password`) never carried the mirror-image skip for `companion`/
`companion-ip` — so every auth request was *also* being checked against the 20-req/60s AI-chat
bucket. A single Jest e2e run spins multiple worker processes in parallel, all originating from the
same loopback IP; the combined register/login/forgot-password volume across 13 files trips the
20-req/60s `companion` bucket almost instantly, long before the real `auth` bucket (200/15min) is
anywhere close to full.

**This corrects the original diagnosis.** Sprint 6 §15 and this task's own brief described the
failure as the tests "cumulatively exhaust[ing] a shared authentication rate-limit bucket." That is
imprecise: the bucket being exhausted is not `auth` at all — it's the unrelated `companion`/
`companion-ip` AI-chat throttlers incidentally applying to auth traffic. The real `auth` throttler
was never at risk and is unrelated to this failure.

**Fix** (`apps/api/src/auth/auth.controller.ts`, the pending change described in §1): added
`@SkipThrottle({ companion: true, 'companion-ip': true })` alongside the existing
`@Throttle(AUTH_THROTTLE)` on all seven throttled auth routes. This is the exact symmetric
counterpart of the already-existing `@SkipThrottle({ auth: true })` on Companion routes — not a new
pattern, just applying an existing, already-proven-safe pattern to the one place it was missing.

**Security implications: none negative.** The real `auth` throttler (200 req/15min, IP- or
IP+email-keyed depending on route) is completely untouched and still fully enforced — confirmed by
the existing `auth.e2e-spec.ts` test `rate-limits repeated forgot-password attempts`, which loops
`AUTH_RATE_LIMIT_MAX + 5` requests and asserts a real 429 is eventually returned; this test still
passes unchanged. Only the AI-chat-specific throttlers (a different abuse surface — companion
message spam) no longer incidentally gate registration/login/password-reset traffic, which was never
their intended target.

**Verified — full suite passes, deterministically, three separate clean runs**:

| Run | Result |
|---|---|
| Baseline (fix stashed out) | 13 failed / 138 failed, 21 passed of 159 |
| With fix, run 1 | 13 passed / 159 passed |
| With fix, run 2 | 13 passed / 159 passed |
| With fix, run 3 (final Phase 3 record) | 13 passed / 159 passed |

No test files were modified. No product rate-limiting was weakened or removed.

**Observed but not touched**: `apps/api/.env.test` is missing the `AI_RATE_LIMIT_MAX` /
`AI_RATE_LIMIT_WINDOW_MS` / `AI_RATE_LIMIT_IP_MAX` (and related `AI_*`) overrides that
`.env.test.example` documents and comments as necessary for "a full e2e/Playwright run." Since the
`auth.controller.ts` fix alone fully resolves the reproduced failure (proven by three clean full
runs), this drift was left alone rather than changed speculatively — but it remains a latent gap
worth closing separately, since it means Companion-specific e2e/Playwright tests are currently
running against production-strength AI rate limits rather than the generous test ceilings the
example file describes. Recommended as a follow-up, not fixed here.

## 3. Playwright — root cause and fix

**Reproduced using the repository's own documented procedure**, per the task's explicit instruction
not to default to `next dev` if a production-mode procedure is already established. It is:
`docs/progress/post-sprint-5a-maintenance.md` §5 explicitly ran its Playwright verification "against
the still-running production-mode stack from Sprint 5A's own closure (`node dist/src/main.js` +
`next start`)" and recorded 25/25 passing that way.

**Root cause (classification: B — test/verification-procedure defect, not an application memory
leak)**: Sprint 6's closure pass (`sprint-6-final-report.md` §15) ran the full Playwright suite
against `next dev` (the Next.js *development* server — on-demand per-route compilation, Fast
Refresh/HMR bookkeeping, unminified bundles and source maps all held in memory) instead of the
already-established, already-proven production-mode procedure. Combined with concurrent Docker
containers and (per that report's own account) a second dev server running at the same time, `next
dev` crashed partway through (4/29 tests completed) under sustained memory pressure, and the
remaining 25 tests failed with `ERR_CONNECTION_REFUSED` once the server process died. Sprint 6's own
report correctly identified memory pressure as the proximate cause but speculated the fix would
require "investigating the local dev-server memory/stability issue" — it did not check whether the
project already had an established, working alternative procedure for exactly this problem.

**Fix**: no code or configuration change. Reproduced using: clean `pnpm build` (API `nest build` +
Next.js production build, all 31 routes), then `node dist/src/main.js` (API, port 4000) and
`next start -p 3000` (web), then `npx playwright test` against that stack.

**This corrects the original diagnosis's implied next step.** The underlying instinct — "memory
pressure caused this" — was correct. But the fix isn't tuning Node's heap or investigating a
suspected leak in the dev server; it's using the production build the project had already adopted
for exactly this reason after Sprint 5A. No evidence of an application-level memory leak was found:
the compiled production runtime completed the full 29-test suite three times consecutively (two
full runs plus one isolated re-check of `flow-20-tarot-discovery`) with no instability, no dropped
connections, and no server restarts needed.

**Verified — full suite passes, deterministically, three separate checks**:

| Run | Result |
|---|---|
| Full suite, run 1 (initial reproduction) | 29/29 passed (2.6m) |
| Full suite, run 2 (clean rebuild + fresh server restart, final Phase 3 record) | 29/29 passed (2.7m) |
| `flow-20-tarot-discovery.spec.ts` alone (extra confirmation) | 1/1 passed (7.8s) |

No test files, `playwright.config.ts`, or product code were modified.

## 4. Full regression — Phase 3, exact counts

All commands run fresh this session, against a clean Docker stack (Postgres/Redis/Mailpit) and, for
the build/Playwright rows, a clean `rm -rf apps/api/dist apps/web/.next` rebuild followed by freshly
started production servers.

| Command | Result |
|---|---|
| Backend unit (`npx jest` in `apps/api`) | PASS — 75 suites / 650 tests |
| Complete backend e2e (`npx jest --config test/jest-e2e.json`) | PASS — 13 suites / **159/159** tests |
| Frontend unit (`pnpm test:web`) | PASS — 53 suites / 245 tests |
| `pnpm lint` | PASS — 0 errors (24 pre-existing warnings, all in `insight-generation.service.spec.ts` / `insight-relationship.service.spec.ts`, files untouched by this pass) |
| `pnpm typecheck` | PASS — both `apps/api` and `apps/web` |
| `pnpm build` (clean rebuild) | PASS — API (Nest) + Web (Next, all 31 routes) |
| Complete Playwright (`npx playwright test`, production-mode servers) | PASS — **29/29** |
| `flow-20-tarot-discovery.spec.ts` alone | PASS — 1/1 |
| `npx prisma validate` | PASS — schema valid |
| `npx prisma migrate status` | PASS — up to date, both `beaconvie` (dev) and `beaconvie_test` databases, 13 migrations |
| `git diff --check` | PASS — exit 0 |
| Secret scan (pattern-based, over the full session diff) | PASS — no matches (only doc-comment text like "reset token"/"password" as UI copy, no actual credentials) |

This is a complete-suite PASS, not a partial one: every row above ran the full suite, not a subset,
and every full-suite row was independently repeated at least once with matching results.

## 5. Files changed

- `apps/api/src/auth/auth.controller.ts` — the one functional change (see §2). +19/-1 lines, adding
  an `import` and one `@SkipThrottle(...)` decorator line to each of 7 route handlers, plus the
  explanatory constant and comment.
- `docs/progress/post-sprint-6-test-infrastructure.md` — this document (new).

No other files were modified. No test files changed. No Tarot code touched (no regression was
found, so per instruction, none was fixed).

**Why this is a test/infra classification despite being product code**: the *symptom* (full-batch
e2e 429s) is a test-infrastructure/release-gate problem — it only manifests under concurrent,
high-volume traffic from a single IP, a pattern the test suite produces but that isolated manual
usage or moderate production traffic from distinct IPs would rarely trigger. The *fix*, however, had
to be a one-line production-code correction because the defect genuinely lives in the routing
configuration, not in the tests: no test-only isolation trick (resetting Redis between files,
staggering requests, using distinct per-suite IPs) would be correct here, because the tests were
correctly exercising real auth traffic — the guard configuration was incorrectly gating it with an
unrelated bucket. This is disclosed rather than hidden, per the task's explicit preference order.

## 6. Security implications

None. See §2 for the specific verification that the real `auth` throttler is unchanged and still
enforced. No production rate limit was raised, no throttler was globally disabled, and no test
weakened its own assertions to get a green result. The Playwright fix involved no code change at
all.

## 7. Before/after summary

| | Before | After |
|---|---|---|
| Backend e2e (13 suites) | 13 failed, 138/159 tests failed (429s) | 13 passed, 159/159 tests passed |
| Playwright (29 tests) | Incomplete — dev-server crash, 4/29 ran, 25 × `ERR_CONNECTION_REFUSED` | 29/29 passed |
| Auth production rate limit | 200 req/15min, enforced | 200 req/15min, enforced (unchanged) |
| Tarot behavior | Unmodified | Unmodified |

## 8. Remaining non-blocking issues

1. **`.env.test` / `.env.test.example` drift** (§2) — `.env.test` is missing the `AI_RATE_LIMIT_*`
   test-friendly overrides its own example file documents as needed for Companion-heavy e2e/
   Playwright runs. Not currently blocking (all Companion-touching suites pass), but worth syncing
   as a defensive follow-up so a future test that sends more AI-chat traffic doesn't rediscover a
   real (if different) rate-limit ceiling the hard way.
2. Sprint 6's own disclosed residual items (§16/§17 of `sprint-6-final-report.md`) — AI interpretation
   failure path not runtime-verified (code-reviewed only), and the git-history discrepancy where
   `35417d0` already bundles Sprint 5C + Sprint 6 — are unrelated to this maintenance pass and still
   stand as-is; not touched here, per instruction not to rewrite pushed history.
3. Neither of Sprint 5A's own previously-disclosed residual risks (a stale demo-account `InsightCandidate`
   headline; Docker Desktop's occasional local Mailpit SMTP flakiness) reappeared during this pass,
   and both remain out of this pass's scope.

## 9. Commands executed (for reproducibility)

```
git status --short
git log --oneline -10
git diff --check
docker ps
npx prisma migrate status   # both DATABASE_URL values
npx prisma validate
npx jest --config ./test/jest-e2e.json         # apps/api, run 3× (baseline stashed, then 2×  fixed)
npx jest                                        # apps/api unit
pnpm test:web
pnpm lint
pnpm typecheck
pnpm build                                      # 2× (initial + clean rebuild)
node dist/src/main.js                           # apps/api, production build
next start -p 3000                              # apps/web, production build
npx playwright test                             # 2× full runs
npx playwright test flow-20-tarot-discovery     # isolated confirmation
```

## 10. Git

No commits created. `35417d0` and `e763e55` untouched. The one functional change
(`apps/api/src/auth/auth.controller.ts`) remains uncommitted in the working tree, per instruction not
to commit maintenance changes unless explicitly requested.
