# PayOS Production Readiness Gate

Performed on top of `b1b5a48` (Sprint 7 — Premium & Payment Foundation, final/re-audited). This is
**not** a feature sprint and does not start Sprint 8. Its purpose is to determine whether the
existing payment implementation can safely accept real payments, using an actual PayOS
sandbox/production transaction wherever possible, and to fix (not just note) any environment-level
gap that stood between "the code is correct" and "the claimed test results are actually
reproducible right now."

## 0. Git baseline

- HEAD: `b1b5a48df78b8e90f64185578157be62209ab0cf` ("feat: complete Sprint 7 premium payment
  foundation"), branch `master`, up to date with `origin/master`.
- `git status --short` at session start: clean. No stray files, no accidental Sprint 8 work.
- `git diff --check`: exit 0, both at session start and after this session's changes.
- Docs read before touching anything: `sprint-7-final-report.md`, `payment-foundation.md`,
  `premium-entitlements.md`, `post-sprint-6-test-infrastructure.md`. Every claim in them was then
  independently checked against the actual code and a live re-run, per the task's explicit "do not
  trust documentation alone" instruction — see §1 and the discrepancy in §7 below.

## 1. PayOS official-contract audit (re-verified against current published docs, live web access)

Re-fetched `payos.vn/docs/api/`, `payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/`,
`payos.vn/docs/sdks/back-end/node/`, `payos.vn/docs/du-lieu-tra-ve/return-url/`, and the
`payOSHQ/payos-lib-node` GitHub README, independently of Sprint 7's own re-audit (§12 of
`payment-foundation.md`), which used the same sources. Result: **no new mismatch found** — this
implementation still matches the current published contract field-for-field.

| PayOS field/behavior | Current implementation | Official contract | Match? | Action |
|---|---|---|---|---|
| Create-payment-link auth headers | `x-client-id`, `x-api-key` | `x-client-id`, `x-api-key` (+ optional `x-partner-code`, not used, correctly optional) | ✅ | none |
| Create-payment-link required fields | `orderCode`, `amount`, `description`, `cancelUrl`, `returnUrl`, `signature` | Same five + `signature`, rest optional (buyerName, items, invoice, expiredAt, etc.) | ✅ | none |
| `orderCode` type | `number` (ms-timestamp × 100 + random 2 digits) | integer, unique per merchant | ✅ | none |
| `amount` representation | integer, VND, no decimals | integer, smallest currency unit, no decimals | ✅ | none |
| Checkout signature data | `amount, cancelUrl, description, orderCode, returnUrl` sorted alphabetically, raw values, HMAC-SHA256 | Identical field set and ordering rule | ✅ | none |
| Checkout response shape | reads only `checkoutUrl`, `paymentLinkId` from `data` | full `data` object also has `bin/accountNumber/accountName/amount/description/orderCode/currency/status/qrCode` | ✅ (partial-but-correct) | none — deliberately narrow type |
| Webhook signature algorithm | extract every `data` field, sort alphabetically, `key=value&...` raw values, HMAC-SHA256 hex | Same, explicitly documented as **not** the same scheme as the unrelated `payouts` API (which URL-encodes) | ✅ | none |
| Webhook payload `data` fields | `orderCode/amount/description/reference/currency` declared + `.passthrough()` for the rest | Documented example additionally has `accountNumber, transactionDateTime, paymentLinkId, code, desc, counterAccountBankId/-Name/-Number, virtualAccountName/-Number` | ✅ (via passthrough, already fixed in Sprint 7 closure) | none |
| Webhook ack response | `HTTP 200`, body `{ received: true }` | SDK sample shows `res.status(200).send('OK')` — no documented body-content requirement, only the 200 status | ✅ | none |
| Return/cancel URL query params | Not read at all — `/premium/return` polls `GET /payment/orders/:id`; `/premium?cancelled=1` is our own static param, never PayOS's | PayOS appends `code, id, cancel, status (PAID/PENDING/PROCESSING/CANCELLED), orderCode` — explicitly undocumented as trustworthy client-side values | ✅ (correctly never trusted) | none |
| Webhook URL registration | Not yet performed (no real merchant account) | `payos.webhooks.confirm(url)` (Node/PHP/.NET/Python SDKs) — a real API call PayOS validates, not only a dashboard field | N/A yet | manual step, §12 checklist |
| Cancelled/expired-order webhook behavior | Not assumed; `CANCELLED`/`EXPIRED` are reachable in our schema but never written by webhook | **Still undocumented** on every official page reached (confirmed again this session, independently of Sprint 7's own search) | Unconfirmed | sandbox-only verification item, §9 |

**Conclusion**: contract-level, this implementation is still correct. The one real contract defect
that existed (`.passthrough()` for webhook fields) was already found and fixed in Sprint 7's own
closure pass — this audit re-derived the same conclusion independently rather than trusting that
claim, and found nothing further.

## 2. Environment configuration audit

Checked (see `apps/api/src/config/env.validation.ts`, `configuration.ts`): `PAYOS_CLIENT_ID`,
`PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` are server-only (never a `NEXT_PUBLIC_*` var — confirmed by
grep across `apps/web`), all three required at boot in production
(`env.validation.ts` throws if any is missing when `NODE_ENV=production`), `PAYOS_MOCK_CHECKOUT`
cannot be `true` in production (boot fails), and `.env.example`/`.env.test.example` both document
every payment-related key with no real secret ever present in either. Credential status (values
never displayed, per instruction):

| Key | Local `.env` (dev) | Local `.env.test` |
|---|---|---|
| `PAYOS_CLIENT_ID` | SET (dev-only fake value, added this session — see §7) | SET (test-only fake value, added this session — see §7) |
| `PAYOS_API_KEY` | SET (fake) | SET (fake) |
| `PAYOS_CHECKSUM_KEY` | SET (fake) | SET (fake) |
| Real PayOS sandbox/production credential | **NOT SET** anywhere in this environment | **NOT SET** |

No production credential exists in this environment at any layer (no CI secret store was available
to check either — this task ran entirely against the local machine).

## 3. Price sign-off gate

Searched the full Product Bible reference set (`docs/reference/web-tu-vi/web-tu-vi/**`) for any
approved Premium price figure. Found none. The one directly relevant line
(`02-business-model-and-product-ecosystem.md`) explicitly recommends modeling
"LLM cost-per-active-memory-graph **immediately, before finalizing Premium price points**" — i.e.
the Product Bible itself documents that pricing is *not yet finalized*, corroborating rather than
contradicting the existing `payment-foundation.md`/`premium-entitlements.md` disclosure.

**PRODUCTION PRICE SIGN-OFF: REQUIRED.** `PREMIUM_PRICE_VND=79000` remains an engineering
placeholder, not a business decision. Changing it pre-launch is a one-line env var change
(`PREMIUM_PRICE_VND`), no code/migration required. Frontend independence re-confirmed: `/premium`
shows no price anywhere in its UI (`apps/web/features/premium/**` grepped for `79000`/`VND` — no
match outside test fixtures); the only source of truth is
`AppConfiguration.payment.premium.priceVnd`, read once in `PaymentCheckoutService.createCheckout`.

## 4. Real PayOS credential check

```
PAYOS_CLIENT_ID: NOT SET (no real value; only a dev/test fake placeholder exists)
PAYOS_API_KEY: NOT SET
PAYOS_CHECKSUM_KEY: NOT SET
```

No real PayOS sandbox, test, or production credential was available anywhere in this session or
environment. Per the task's absolute rule, **no sandbox/production round-trip was fabricated**.
Phases 5–9 below (checkout creation, real webhook round-trip, cancel flow against real provider
behavior) are therefore reported as **NOT VERIFIED**, not simulated as if they were.

## 5. Checkout runtime result (mock-provider / self-signed — not sandbox)

Re-ran (not re-asserted) the full checkout path against the real HTTP surface, real Postgres, real
Prisma transactions, `PAYOS_MOCK_CHECKOUT=true`:

- `POST /payment/checkout` creates a `PENDING` `PaymentOrder`, priced only from
  `config.payment.premium.priceVnd` — confirmed the route accepts no body field that changes price
  (`payment.e2e-spec.ts`: "a client cannot influence the price").
- No entitlement exists before payment (confirmed: `GET /payment/premium-status` for a fresh user
  returns `isPremium: false`).
- Order ownership is enforced (`GET /payment/orders/:id` 404s identically for a nonexistent id and
  another user's real order).

This proves the implementation's own logic is internally consistent; it does **not** prove PayOS's
real API behaves identically to the mock. Classified honestly as **NOT PayOS runtime verification**.

## 6. Real PayOS webhook result

**NOT VERIFIED.** No real webhook was ever sent by or received from PayOS's actual servers, in this
session or any prior one available for inspection. Every webhook exercised in this gate (and in
Sprint 7's own closure) is self-signed by the test suite using the same `PAYOS_CHECKSUM_KEY` the
server holds — this proves the verification *code path* is correct, not that PayOS's real webhook
delivery matches it exactly beyond what the published contract (§1) already confirms.

## 7. Signature verification result

Re-derived independently this session (§1): the HMAC-SHA256, alphabetical-sort,
`key=value&...`-raw-value scheme in `payos-signature.util.ts` matches PayOS's current documentation
exactly, including the `.passthrough()` fix for undeclared `data` fields. Two dedicated regression
tests (`payos.provider.spec.ts`) sign/verify PayOS's own documented example payload field-for-field —
both re-run this session and passing (see §14). **CONTRACT-level verified; PayOS-runtime NOT
verified** (no live signature was ever exchanged with PayOS's real infrastructure).

## 8. Payment state-transition result

Confirmed by direct code read (`payment-webhook.service.ts`) and by e2e test, re-run this session:

- `PENDING → PAID` and `PENDING → FAILED` are the only writable transitions, both gated to
  `WHERE status = 'PENDING'` inside one `$transaction`.
- A stale `FAILED` event arriving after `PAID` is a no-op (dedicated unit test).
- `CANCELLED`/`EXPIRED` exist in the schema but nothing currently writes them (see §9).

## 9. Entitlement grant result

Confirmed exactly-once, gated to a successful `PENDING → PAID` transition inside the same
transaction as the order update — re-verified this session against a real Postgres instance
(`payment.e2e-spec.ts`, "Premium Tarot access after payment"). No entitlement is ever created by
checkout creation, by the return/cancel URLs, or by anything the browser controls.

## 10. Duplicate/concurrent webhook result

Re-run this session against a real, running Postgres instance (not mocked):

- Identical-payload replay (same `externalEventId`): second delivery is a safe no-op via the
  `@@unique([provider, externalEventId])` constraint.
- **True concurrency** — two webhook HTTP requests fired via `Promise.all` (no `await` between
  them): both the identical-payload race and the distinct-bank-reference race for the same order
  resulted in exactly one `PremiumEntitlement` row. Both tests passed.

## 11. Cancel flow result

By construction, not by a special-cased check: `cancelUrl` points to a static
`${FRONTEND_URL}/premium?cancelled=1` our backend generates — PayOS's own appended query params
(`code`, `id`, `cancel`, `status`, `orderCode` — confirmed via official docs, §1) are never read by
`PremiumBoundaryBanner` or anywhere else in the frontend. `/premium/return` never reads any URL
param except our own internal `order` id, and polls `GET /payment/orders/:id` exclusively — verified
by direct read of `premium-return-status.tsx`. **The return/cancel URL cannot mark an order PAID or
grant Premium under any input**, confirmed by code inspection (no code path exists, not just "no
test found one"). Real-provider cancel behavior (does PayOS send a cancellation webhook?) remains
**unconfirmed** — undocumented on every official page reached, both in Sprint 7's own search and
this session's independent re-check.

## 12. Expired/abandoned-order result

PayOS's official docs do not state whether an unpaid payment link auto-expires with a webhook, is
only discoverable via polling `getPaymentLinkInformation`, or remains payable indefinitely — this
remains a **sandbox-only verification item**, unchanged from Sprint 7's own disclosure. Given that:

**Decision: no stale-order sweep is required for launch.** Our own `PaymentOrder.expiresAt` (30 min)
is advisory-only; an order stuck `PENDING` past it blocks nothing (the user can simply start a new
checkout, and each checkout is independent — no unique-per-user constraint prevents a second
attempt). This is a reasonable MVP posture, not a gap that blocks safely accepting real payments.
Revisit only if support volume shows real users confused by a stale `PENDING` order (post-launch
telemetry decision, not a pre-launch blocker).

## 13. Webhook hardening decision

Audited `payment.controller.ts` / `payment-throttler.guard.ts` / `app.module.ts` directly. The
webhook route (`POST /payment/webhooks/payos`) intentionally carries **no throttler guard**.
Decision affirmed, not just repeated: PayOS (and most payment providers) legitimately retries
webhook delivery on a non-2xx or timeout response; a low IP-keyed rate limit risks dropping a
legitimate retry storm from PayOS's own infrastructure (which may originate from a small set of
provider IPs). Primary defenses, all already in place and verified this session:

- Signature verification before any DB write (cheap to reject: one HMAC compare + zod parse).
- Strict schema validation (`safeParse`, rejects malformed payloads before touching the DB).
- Idempotency at the DB level (`@@unique([provider, externalEventId])`).
- Bounded payload size: Express's default JSON body-parser limit (100kb) applies globally via
  `helmet()`/Nest defaults — no unbounded-body DoS vector; PayOS payloads are small JSON objects, far
  under this ceiling.

**No additional in-app rate limiting added.** If provider-side abuse is ever observed in production,
the correct layer is edge/gateway-level protection (e.g. a CDN/WAF rule keyed to the specific PayOS
egress IP range, if PayOS publishes one), not an in-app limiter that risks rejecting real retries.

## 14. Payment kill switch — IMPLEMENTED this session

No feature-flag mechanism existed in this codebase before this session (grepped for
`PAYMENTS_ENABLED`/`FEATURE_FLAG` — no match). Implemented the smallest safe config switch, per
Phase 13's explicit requirement:

- **New env var** `PAYMENTS_ENABLED` (default `true`), validated by the existing zod env schema
  (`env.validation.ts`), exposed as `config.payment.enabled` (`configuration.ts`).
- **`PaymentCheckoutService.createCheckout`** checks it first, before even checking whether PayOS is
  configured: if `false`, throws `400 { code: 'PAYMENTS_DISABLED' }` and creates no order — no DB
  write, no provider call.
- **The webhook route is deliberately never gated by this flag** — an order created before a
  disable may still legitimately receive a real webhook afterward; blindly blocking webhook
  processing would strand those payments in `PENDING` forever with no way to reconcile them. This
  matches the task brief's explicit warning against "blindly disabling webhook processing."
- **Existing entitlements are unaffected** — `EntitlementService` never reads this flag; a disable
  only blocks *new* checkout creation.
- Frontend: `premium-upgrade-panel.tsx` now maps `PAYMENTS_DISABLED` to the same
  "Payment is temporarily unavailable" copy already used for `PAYMENT_PROVIDER_UNAVAILABLE`.
- Tests added: `payment-checkout.service.spec.ts` (kill switch blocks checkout, never touches the
  provider registry), `env.validation.spec.ts` (defaults to `true`; explicitly allowed to be `false`
  in production — the switch itself must never be blocked), `premium-upgrade-panel.test.tsx`
  (frontend message mapping).

**Status: READY.** To disable payments in production: set `PAYMENTS_ENABLED=false` and restart the
API — no redeploy of application code required.

## 15. Environment/regression discrepancy found and fixed

Per Phase 0's explicit instruction to inspect actual code rather than trust documentation, this gate
attempted to *reproduce* Sprint 7's claimed test counts rather than re-assert them, and found the
claims were **not reproducible as-is** in this environment — two real, current gaps, both now fixed:

1. **The Sprint 7 Prisma migration was never deployed.** `npx prisma migrate status` showed
   `20260810000000_premium_payment_foundation` as pending against both the dev and test databases,
   despite the schema file itself being valid and the migration `.sql` file existing on disk. Every
   payment-related Prisma call (`this.prisma.paymentOrder`, etc.) was `undefined` at runtime as a
   result — `payment.e2e-spec.ts` failed 11/13 with `TypeError: Cannot read properties of undefined
   (reading 'create')` before this was fixed. **Fixed**: `prisma migrate deploy` run against both
   `beaconvie` and `beaconvie_test`, `prisma generate` re-run. This directly contradicts Sprint 7's
   final report's claim that its 172/172 e2e result reflected the current state of this environment —
   whatever was true in that session's own environment, it did not persist into this one.
2. **`apps/api/.env.test` was missing every Sprint 7 key** (`PAYOS_*`, `PREMIUM_*`,
   `PAYMENT_RATE_LIMIT_*`) that `.env.test.example` documents as required, plus the pre-existing,
   already-disclosed-but-never-fixed `AI_RATE_LIMIT_*` gap from
   `post-sprint-6-test-infrastructure.md` §2/§8. This directly contradicts the Sprint 7 final
   report's claim that "local `.env`/`.env.test` were updated with fake/dev-only credentials." **Fixed**:
   synced both keys sets into `.env.test` from `.env.test.example`, and added the equivalent
   dev-only fake PayOS config + `AI_RATE_LIMIT_*` overrides to `.env` (gitignored, not committed
   either way) so the production-mode Playwright flow could actually run.
3. **Backend e2e parallelism**: the default Jest worker count for `test:e2e` causes Postgres
   connection contention on this machine (auth/register spuriously 500s/429s under full parallel
   load; passes 100% with `--runInBand`, and individual suites pass 100% in isolation too). This is
   the same *class* of test-infrastructure issue already documented in
   `post-sprint-6-test-infrastructure.md` (a different symptom, same root cause: this machine's
   local Postgres/Redis under concurrent test-runner load), not a new application defect. No
   application code changes this; documented as a known local-machine characteristic.

None of these three are payment-logic defects — they are environment/config drift that accumulated
between sessions. They are disclosed here specifically because Phase 0 required inspecting actual
state rather than trusting prior claims, and because an unreproducible "172/172 passed" claim is not
a safe basis for a production-readiness verdict.

## 16. Targeted tests added

- `payment-checkout.service.spec.ts`: kill-switch-disabled checkout (new test, §14).
- `env.validation.spec.ts`: `PAYMENTS_ENABLED` defaults to `true`; allowed `false` in production
  (2 new tests, §14).
- `premium-upgrade-panel.test.tsx`: `PAYMENTS_DISABLED` frontend message mapping (1 new test, §14).

All pre-existing payment/security test coverage (checkout pricing authority, valid/invalid webhook
signature, amount/currency mismatch, unknown order, duplicate/concurrent webhook, exactly-once
entitlement, stale-state-transition protection, cancel/return never granting Premium, frontend
polling backend truth) was re-run, not re-asserted — see §17 for exact counts.

## 17. Full regression — exact counts, this session

All commands actually executed this session, against the real Docker Postgres/Redis/Mailpit stack
(started via Docker Desktop mid-session; was not running at session start) and real production
builds (`nest build` + `next build`/`next start` — never `next dev`, per project convention).

| Gate | Result |
|---|---|
| `pnpm lint` | PASS — 0 errors (24 pre-existing warnings, unrelated files, unchanged) |
| `pnpm typecheck` | PASS — both `apps/api` and `apps/web` |
| Backend unit (`npx jest`, `apps/api`) | PASS — **81 suites / 719 tests** (716 baseline + 3 new kill-switch tests) |
| Backend e2e (`npx jest --config test/jest-e2e.json --runInBand`) | PASS — **14 suites / 172 tests** (see §15.3 for why `--runInBand`) |
| `payment.e2e-spec.ts` alone | PASS — 13/13 |
| Frontend unit (`pnpm test:web`) | PASS — **55 suites / 260 tests** (259 baseline + 1 new) |
| `pnpm build` (API + Web, production) | PASS — API (Nest) + Web (Next, 33 routes incl. `/premium`, `/premium/return`) |
| `npx prisma validate` | PASS |
| `npx prisma migrate status` (dev + test DB) | PASS — up to date, 14 migrations, **after the fix in §15.1** |
| Full Playwright, production-mode servers, run 1 | 28/30 — `flow-21-premium-payment` **PASS**; 2 failures confined to `flow-13-companion-memory-suggestion-and-forget.spec.ts` (Sprint 3C, untouched by any diff this session) |
| Full Playwright, run 2 (same session, same demo account, no DB reset between runs) | 17/30 — degraded further, still all failures confined to Companion/Memory flows sharing the seeded `demo@beaconvie.local` account; `flow-21-premium-payment` **PASS** in both runs |
| `flow-21-premium-payment.spec.ts` isolated | PASS, 3/3 across all three invocations this session |
| `git diff --check` | PASS — exit 0 |
| Secret scan (diff-scoped, pattern-based) | PASS — no matches |

**On the Playwright Companion/Memory failures**: root-caused, not hand-waved. All affected flows
share one seeded fixture account (`demo@beaconvie.local`, `apps/api/prisma/seed.ts`) with no
per-run reset. `AI_DAILY_REQUEST_LIMIT` defaults to 50/day and was not overridden in local `.env`
(unlike `.env.test.example`, which sets it to 1000 for exactly this reason). Running the full
30-test Playwright suite against that one account multiple times in a single session exhausts that
budget partway through, and every subsequent Companion-dependent flow degrades from there —
consistent with run 1 (fresher budget, 2 failures near the end of the Companion-heavy portion) being
strictly better than run 2 (same-day budget already partially consumed, 13 failures). This is a
**pre-existing local-fixture/budget characteristic of the Companion/Memory test suite, unrelated to
and untouched by this session's payment work** — no payment or entitlement code path shares this
budget. It is not fixed here (out of scope for a payment gate, and raising a real cost-control
default casually would be the wrong instinct) but is worth a follow-up: give the Playwright fixture
account (or Playwright's local `.env`) the same `AI_DAILY_REQUEST_LIMIT` override
`.env.test.example` already uses for Jest. **The one flow this gate actually cares about,
`flow-21-premium-payment.spec.ts`, does not touch the Companion AI budget and passed cleanly in
every single invocation this session (3/3).**

## 18. Code/files changed this session

**Application code**:
- `apps/api/src/config/env.validation.ts` — `PAYMENTS_ENABLED` env var + spec.
- `apps/api/src/config/configuration.ts` — exposes `payment.enabled`.
- `apps/api/src/payment/checkout/payment-checkout.service.ts` — kill-switch gate in `createCheckout`.
- `apps/web/features/premium/components/premium-upgrade-panel.tsx` — `PAYMENTS_DISABLED` message.

**Tests**:
- `apps/api/src/config/env.validation.spec.ts` (+2 tests)
- `apps/api/src/payment/checkout/payment-checkout.service.spec.ts` (+1 test)
- `apps/web/features/premium/components/premium-upgrade-panel.test.tsx` (+1 test)

**Docs**:
- `apps/api/.env.example`, `apps/api/.env.test.example` — document `PAYMENTS_ENABLED`.
- `docs/architecture/payment-foundation.md` — pointer to this report + kill-switch/env-fix summary.
- `docs/progress/payos-production-readiness.md` — this file (new).

**Local/gitignored, not committed either way, not part of any diff**: `apps/api/.env`,
`apps/api/.env.test` — synced with the Sprint 7 keys they were missing (§15.2), plus `.env`'s
`AI_RATE_LIMIT_*` dev overrides. Two dev/test Postgres databases had the pending migration deployed
(§15.1) — a one-time local schema-state fix, not a code change.

No Sprint 7 payment/webhook/entitlement business logic was modified. No commit was made — everything
above sits in the working tree, per instruction not to commit unless explicitly asked.

## 19. Working tree status

```
 M apps/api/.env.example
 M apps/api/.env.test.example
 M apps/api/src/config/configuration.ts
 M apps/api/src/config/env.validation.spec.ts
 M apps/api/src/config/env.validation.ts
 M apps/api/src/payment/checkout/payment-checkout.service.spec.ts
 M apps/api/src/payment/checkout/payment-checkout.service.ts
 M apps/web/features/premium/components/premium-upgrade-panel.test.tsx
 M apps/web/features/premium/components/premium-upgrade-panel.tsx
 M docs/architecture/payment-foundation.md
 + docs/progress/payos-production-readiness.md
```

`b1b5a48` and `f8fcba1` untouched — no amend, no rebase. `git diff --check` exit 0.

## 20. Remaining production blockers (unchanged in kind from Sprint 7's own disclosure; re-confirmed independently this session)

1. No real PayOS sandbox/production transaction has ever been executed (§4–§6) — this session had
   no real credentials available, same as Sprint 7's own session.
2. Production price has no product sign-off (§3) — the Product Bible itself says pricing is not
   finalized.
3. Production webhook URL has not been registered with PayOS (`webhooks.confirm(url)` — §1, §21).
4. Cancelled/expired PayOS behavior remains unconfirmed against real provider behavior (§11, §12) —
   still undocumented on every official page reachable, re-checked independently this session.
5. Stale-order sweep: **decided not required** for launch (§12), not merely deferred.
6. Webhook rate-limit hardening: **decided not needed in-app** (§13), not merely deferred.

Newly surfaced by this gate specifically (not carried over from Sprint 7):

7. The previously-reported "172/172" backend e2e and "29/30" Playwright results were not
   reproducible in this environment until an undeployed migration and stale `.env.test` were fixed
   (§15) — now fixed and re-verified, but this means any future session must not assume prior
   verification claims survive across environment resets without re-checking.
8. Local Playwright Companion/Memory flows share one fixture account with a too-low default AI
   daily budget for repeated full-suite runs (§17) — recommend syncing `AI_DAILY_REQUEST_LIMIT` in
   local `.env` the same way `.env.test.example` already does, as a test-infra follow-up. Does not
   affect payment code.

## 21. Production configuration checklist

```
[x] PayOS account ready — NO, no merchant account/credentials exist in any environment checked
[ ] credentials configured — blocked on the above
[x] secrets server-only — verified (env.validation.ts, no NEXT_PUBLIC_* leak, grep-confirmed)
[ ] production price approved — REQUIRED, no sign-off exists (§3)
[ ] production domain confirmed — not yet set (no production FRONTEND_URL/API_BASE_URL decided)
[ ] return URL configured — depends on production domain
[ ] cancel URL configured — depends on production domain
[ ] webhook URL registered — requires `payos.webhooks.confirm(url)` against a real merchant account
[ ] HTTPS verified — depends on production domain/infra, not yet provisioned
[ ] webhook reaches API — cannot verify without a public HTTPS endpoint + real PayOS account
[ ] real signature verified — cannot verify without a real webhook (contract-level verified, §7)
[ ] test payment verified — blocked on PayOS account (§4)
[x] entitlement granted — verified end-to-end against self-signed webhooks (§9)
[x] duplicate webhook safe — verified against true concurrency, real DB (§10)
[x] cancelled flow verified — verified by construction/code-inspection (§11); real-provider webhook
    behavior for cancellation remains unconfirmed
[x] abandoned/expired policy confirmed — decided: no sweep needed for launch (§12)
[x] logs contain no secrets — verified (checksum key/signature never logged, grep-confirmed)
[x] rollback/disable switch documented — `PAYMENTS_ENABLED` kill switch implemented this session (§14)
```

## Final verdicts

**PAYOS INTEGRATION: CONTRACT VERIFIED**

Independently re-derived against PayOS's current published documentation this session (not reused
from Sprint 7's own claim) — every field, algorithm, and encoding matches. Sandbox/production
verification remains impossible without a real PayOS merchant account, which does not exist in any
environment checked.

**PAYMENT PRODUCTION: BLOCKED**

Unchanged from Sprint 7's own verdict, and for the same fundamental reason: no real PayOS
credentials exist to run an actual transaction. This session's work narrows what's left — a kill
switch now exists, the contract audit is independently reconfirmed, and two real environment gaps
that made prior test claims unreproducible are now fixed — but obtaining a real PayOS
sandbox/production account and completing items 1–4 in §20 remain hard blockers that no amount of
local code work can substitute for. Sprint 8 should not start until those are resolved or the
business explicitly accepts launching without payments enabled (`PAYMENTS_ENABLED=false`).
