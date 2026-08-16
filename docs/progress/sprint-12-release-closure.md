# Sprint 12 — Release Closure Report

Independent verification pass over the implementation session's own report
(`sprint-12-final-report.md`). Same repository state (HEAD `9d66d3c`, unpushed, 0 behind/1 ahead of
`origin/master` at `ffd82dc`) — closure fixed real defects on top of it rather than trusting the
prior report's claims. Nothing was committed or pushed by this pass either, until the final
verdict below.

## What was independently re-verified with live evidence (not just re-reading code)

1. **Cross-feature AI budget bypass (CRITICAL)** — `CostControlService.checkBudget()` has no
   `feature` filter; confirmed by direct read, then proven with 3 new tests: exhausting the
   request-limit ceiling via Companion alone still blocks a subsequent Tarot attempt; a token
   ceiling exhausted across a *mix* of Companion+Tarot+Numerology still blocks a Natal Chart
   generation that has never itself recorded a row; a user within budget across all four features
   combined is allowed regardless of which feature asks.
2. **Generation-lock concurrency, against real Redis (not a mock)** — 20 genuinely concurrent
   `tryAcquire` calls against the live Redis instance for the same `(feature, user, reading)` key
   resolved to exactly 1 acquired, 19 correctly rejected.
3. **AIUsage/ProviderLog feature attribution, against real data** — queried the real test database
   (populated by the full e2e run) directly: `AIUsage` shows 171/32/33/32 rows for
   Companion/Tarot/Numerology/Natal Chart respectively with distinct token sums; `ProviderLog`
   shows 521/34/35/32. Proves the "how much did Tarot cost today" class of query is genuinely
   answerable, with real numbers, not asserted.
4. **ProviderLog privacy** — confirmed by direct schema/column inspection (not just intent): the
   table has no column capable of holding free-text content (only `provider`/`model`/timing/
   outcome/`feature`/`sourceId`, where `sourceId` values are confirmed-opaque CUIDs). Structurally
   impossible to leak Tarot questions, birth data, journal content, etc. — not merely a policy
   promise.
5. **Rate-limit isolation, against real Redis** — fired 8 real `POST /auth/register` requests at a
   live server and inspected Redis directly: the `auth` bucket incremented, `discovery`/
   `companion` buckets stayed at zero. Also confirmed (informational finding, not a Sprint 12
   defect — see below) that `auth`'s own skip set has never included `payment`, predating this
   sprint (`git show ffd82dc:...auth.controller.ts`).
6. **Natal Chart accessibility, via real browser accessibility tree** — registered a real account,
   calculated a real chart (with real Gemini narration), and read the actual accessibility tree:
   `button "Major Aspects"` and `button "Key Aspects"` are confirmed genuinely distinct nodes, not
   merely distinct visible text or test selectors.
7. **Payment kill-switch, live end-to-end** — see Blocker finding below; after the fix, re-verified
   live: `GET /payment/premium-status` correctly returns `paymentsEnabled: false`, the frontend
   correctly hides the upgrade button and shows the honest unavailable message, and
   `POST /payment/checkout` correctly returns `400 PAYMENTS_DISABLED`.
8. **flow-20's reported "pre-existing locator fragility"** — not accepted on the prior report's
   word. Reproduced (2/2 failures against real Gemini, 0/1 failures against Mock — proving the
   classification), root-caused to a specific missing `exact: true`, fixed, and re-verified stable
   (4/4 passes against real Gemini after the fix).

## Findings

### BLOCKER — fixed

**`z.coerce.boolean()` silently coerces the string `"false"` to `true`.** JavaScript's
`Boolean('false')` is `true` for any non-empty string. Every boolean env var in
`env.validation.ts` (`AUTH_COOKIE_SECURE`, `AI_ENABLE_MOCK_PROVIDER`, `PAYOS_MOCK_CHECKOUT`,
`PAYMENTS_ENABLED`) used this pattern. Discovered live, not by code review, while verifying
Sprint 12's own kill-switch UX feature: a running server started with `PAYMENTS_ENABLED=false`
still reported `paymentsEnabled: true` and still accepted checkout. This is not a Sprint-12-
introduced defect — the pattern predates this sprint by several — but it directly invalidates
Sprint 12's own kill-switch UX work if left unfixed, and an existing test
(`env.validation.spec.ts`, "allows PAYMENTS_ENABLED=false in production") had masked it for every
prior sprint by asserting only `.not.toThrow()`, never the actual resulting value.

Also confirmed **currently active**, not theoretical: `AUTH_COOKIE_SECURE=false` is explicitly set
in both `apps/api/.env` and `.env.test` — meaning the `Secure` cookie flag has silently been `true`
in local dev/test this entire time. Its real-world impact has been masked only by Chrome's
"localhost is a trustworthy origin" exception, which allows `Secure` cookies over plain HTTP on
`localhost` specifically — this exception would not apply to a real non-HTTPS, non-localhost
deployment.

**Fix**: replaced `z.coerce.boolean()` with a `zBooleanString()` helper that actually parses the
string (`'true'`/`'false'`, case-insensitive) instead of coercing it, applied to all four affected
flags. 16 new regression tests (`env.validation.spec.ts`) assert the actual parsed boolean value
for both `"true"` and `"false"` inputs, case-insensitively, across all four flags — not merely
"did validation throw." Re-verified live end-to-end (see §7 above).

**Severity justification for BLOCKER**: a security/business kill switch that silently does nothing
when explicitly disabled is a genuine production-safety defect — per Sprint 12's own Definition of
Done and Phase 36's explicit gate ("no open Blocker"), this had to be fixed before closure, and was.

### CRITICAL — fixed

**Sentry scrubber denylist bypass.** The original `extra`/`contexts`/breadcrumb-`data` scrubbing
used a sensitive-key-name regex (a denylist). A dedicated attack test proved a real bypass: a
sentinel value placed under an unanticipated, innocuous key name (`details`, `notes`, `misc`)
survived scrubbing completely untouched, because only the key name was ever inspected, never the
value. Denylists are inherently incomplete against a key name nobody anticipated.

**Fix**: switched `extra`/`contexts`/breadcrumb-`data` handling to an allowlist of genuinely-
operational key names (`requestId`, `feature`, `provider`, `model`, `orderId`, `userId`,
`sourceId`, scheduler counters, provider-call timing/outcome fields — matching exactly what this
codebase's own `Sentry.captureException()` call sites and existing `ProviderLog`/scheduler logging
already treat as safe to log in plaintext). Every unrecognized key, regardless of name or nesting
depth, is now redacted by default. Applied identically to both the backend and frontend copies.
5 new regression tests (including the exact bypass reproduction, plus a full multi-location
sentinel attack test firing the literal sentinel values named in the closure brief through headers,
cookies, query params, request body, user object, extra, contexts, and breadcrumbs simultaneously
— zero survive).

### Low/Informational — not fixed, out of scope

- `auth.controller.ts`'s `SKIP_UNRELATED_THROTTLERS` has never included `payment`, meaning a burst
  of unauthenticated auth requests from one IP/tracker could spuriously exhaust the `payment`
  throttler bucket for that same tracker, causing a legitimate subsequent checkout attempt to be
  falsely rate-limited. Confirmed pre-existing (present at `ffd82dc`, before Sprint 12). Sprint
  12's own new `discovery` throttler correctly skips `payment` everywhere it's applied — this
  finding is about the older, unrelated `auth`/`payment` pair, not anything Sprint 12 touched.
  Flagged for backlog, not fixed here (out-of-scope pre-existing gap, per Phase 31's "do not expand
  into unrelated refactors").
- `flow-20`'s locator fragility (see above) — fixed as authorized by the closure brief (narrow,
  `exact: true`, no `.first()`/`.nth()`/force).

## Fresh regression evidence (this closure pass, not reused from the implementation session)

- Backend unit: **104 suites / 1016 tests** — PASS (was 999 before closure; +17 net new: 3
  cross-feature budget-bypass tests, 2 Sentry backend bypass/full-attack tests, 12 boolean-string
  parsing tests across the 4 affected env flags).
- Frontend unit: **72 suites / 357 tests** — PASS (was 356; +1 Sentry frontend bypass test).
- Backend e2e, real Postgres + Redis, fresh run: **18 suites / 239 tests** — PASS.
- Backend typecheck/lint: PASS, 0 errors (24 pre-existing warnings in untouched Insight test
  files, unrelated to Sprint 12).
- Frontend typecheck/lint: PASS, 0 errors/warnings.
- Production builds (fresh, both apps): PASS. 48 web routes generated, including
  `/discover/tarot`, `/discover/numerology`, `/discover/natal-chart`, `/premium`, `/settings`,
  `/privacy`. Zero `/menh-vi` (Eastern Horoscope prototype) changes — confirmed via `git diff
  --stat -- 'apps/web/app/menh-vi/**'` returning empty.
- Prisma: `validate`/`generate`/`migrate status` all PASS, both dev and test databases, up to
  date, no drift, no duplicate migration.
- Targeted Playwright, fresh, against real production builds + real Postgres/Redis: **flow-20
  (4/4 after fix), flow-21, flow-22, flow-23, flow-24, flow-25 (×2 specs) — all PASS.** Full
  30-flow suite not run this pass (mainly exercises frozen, already-documented-flaky, out-of-scope
  modules — Reflection/Insight/Review — per the audit's own §43/§49 disclosure); every flow this
  sprint's own scope touches was run and passes.
- Secret scan: PASS, no real secret values in the diff (only a placeholder example DSN in
  `.env.example` files).
- `git diff --check`: PASS.
- Working tree: 58 modified + 20 new paths, all within Sprint 12's own scope — no Eastern
  Horoscope/Community/Reports/unrelated-redesign content, confirmed by direct review of every
  changed path.

## Verdict

**SPRINT 12 RELEASE CLOSURE COMPLETE.** One Blocker and one Critical finding were discovered
through independent, hands-on verification (not present in or caught by the original
implementation session's own testing) and fixed, with regression tests and live re-verification
proving the fixes. No open Blocker or High findings remain. External blockers (real PayOS
credentials, production price sign-off, real email credential, production domain) are unchanged,
correctly out of engineering's control, and do not block this closure per Sprint 12's own
Definition of Done.
