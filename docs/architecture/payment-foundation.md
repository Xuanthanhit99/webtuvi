# Payment Foundation — Architecture (Sprint 7)

Status: Implemented, contract re-verified against payOS's current published documentation during
Release Closure (§12 — one real defect found and fixed), provider *runtime* still UNVERIFIED (no
PayOS sandbox/production credentials available in this environment — see §11). See
`docs/progress/sprint-7-progress.md` for the audit and provider-decision trail, and
`docs/architecture/premium-entitlements.md` for what a verified payment grants.

**Update — PayOS Production Readiness Gate**: see `docs/progress/payos-production-readiness.md` for
the full gate report. Two additions since the paragraph above was written: (1) a `PAYMENTS_ENABLED`
kill switch (§13 of the readiness report) now gates *new* checkout creation only — the webhook route
is deliberately never gated by it, since an order created before a disable can still legitimately
receive a real webhook after; (2) the gate's own re-verification found the official PayOS contract
unchanged from §12's findings (no new mismatch), but found and fixed two *environment* gaps that had
made the previously-reported test counts non-reproducible in this environment (an undeployed Prisma
migration and a stale `.env.test`) — see the readiness report §"Environment/regression discrepancy
found and fixed" for detail. No payment/webhook/entitlement logic changed as a result.

## 1. Provider decision

Every mention in the Product Bible pairs `PayOS/VNPay` without picking one; the remediation roadmap
explicitly defers that choice to implementation time ("pick one for MVP, defer the other"). This
sprint selects **PayOS**:

- A modern REST API (`api-merchant.payos.vn/v2/payment-requests`) with a JSON request/response
  contract and HMAC-SHA256 signed requests/webhooks — matches Phase 6's signature-verification
  requirement directly, with no bank-specific query-string checksum scheme to reverse-engineer.
- The same HMAC-SHA256 checksum-key scheme signs both the outgoing checkout-creation request and the
  incoming webhook — one signing/verification implementation, not two.
- A first-class hosted checkout link (`checkoutUrl`) — no bank-gateway redirect chain to build.
- Positioned for Vietnam SME/startup MVPs, matching this product's Vietnam MVP scope.

VNPay was not implemented (scope freeze: "second payment provider" is explicitly out of scope). The
`PaymentProvider` interface (`apps/api/src/payment/providers/payment-provider.interface.ts`) is
narrow enough that a VNPay implementation could be added later as a second class behind
`PaymentProviderRegistryService`, without touching checkout/webhook orchestration.

## 2. Domain model

```
PaymentOrder
  id, userId, product (PREMIUM_30D), amount, currency, provider (PAYOS),
  providerOrderCode (unique, our own generated reference), providerPaymentLinkId?, providerCheckoutUrl?,
  status (PENDING|PAID|FAILED|EXPIRED|CANCELLED),
  createdAt, updatedAt, paidAt?, failedAt?, expiresAt?, metadata?

PaymentWebhookEvent
  id, provider, externalEventId (orderCode:bankReference), orderId?,
  payloadHash (sha256, audit-only — never the raw payload), status (RECEIVED|VERIFIED|REJECTED|PROCESSED|ERROR),
  errorCategory?, receivedAt, processedAt?
  @@unique([provider, externalEventId])   -- the idempotency ledger
```

Never stored: card numbers, CVV, banking credentials, provider secrets, or raw webhook payloads
(only a sha256 hash of the payload is kept, for audit/duplicate-detection purposes).

## 3. Checkout flow (Phase 5)

```
Authenticated user (JwtAuthGuard + CsrfGuard)
  -> POST /payment/checkout   (no body accepted — product/price are 100% server config)
  -> PaymentCheckoutService.createCheckout(userId)
       1. requires PayOS to be registered (has credentials) — else 400 PAYMENT_PROVIDER_UNAVAILABLE
       2. amount = config.payment.premium.priceVnd, currency = 'VND'  (never client input)
       3. creates a PENDING PaymentOrder with a fresh generateOrderCode() (retried up to 3x on the
          vanishingly-unlikely unique-constraint collision)
       4. calls provider.createPayment({ orderCode, amount, currency, description, returnUrl, cancelUrl })
            returnUrl = `${FRONTEND_URL}/premium/return?order=<our internal order id>`
            cancelUrl = `${FRONTEND_URL}/premium?cancelled=1`
       5. persists providerCheckoutUrl/providerPaymentLinkId, returns the safe PaymentOrderDto
          (never providerOrderCode/providerPaymentLinkId — internal correlation ids only)
  -> frontend redirects the browser to checkoutUrl (PayOS-hosted)
```

`PAYOS_MOCK_CHECKOUT=true` (non-production only, boot-fails if true in production — mirrors
`AI_ENABLE_MOCK_PROVIDER`'s precedent exactly) short-circuits only step 4's outbound HTTP call with a
locally-built, still-really-signed response, so checkout order creation is fully exercisable in
dev/test without live PayOS credentials. Nothing about webhook verification is ever mocked.

Rate limiting: a dedicated `payment` throttler bucket (`PaymentThrottlerGuard`,
`PAYMENT_RATE_LIMIT_MAX`/`_WINDOW_MS`, per-authenticated-user), isolated from `companion`/
`companion-ip`/`auth` via `@SkipThrottle(...)` — the exact symmetric fix `f8fcba1` already applied
for `auth` vs `companion`, applied again here so payment routes are neither too strict nor
accidentally sharing an unrelated bucket.

## 4. Webhook verification (Phase 6 — CRITICAL)

```
POST /payment/webhooks/payos   (no JwtAuthGuard, @SkipCsrf() — PayOS cannot authenticate as a user
                                 or supply our CSRF token; security is 100% the signature check below)
  -> PaymentWebhookService.handlePayOSWebhook(payload)
       1. verify signature (PayOSProvider.verifyWebhook) -> throws on missing/invalid signature or
          a payload that fails schema validation
       2. look up PaymentOrder by providerOrderCode -> 400 UNKNOWN_ORDER if none
       3. validate amount matches the order -> 400 AMOUNT_MISMATCH
       4. validate currency matches the order -> 400 CURRENCY_MISMATCH
       5. idempotency: INSERT into PaymentWebhookEvent(provider, externalEventId) — a duplicate
          delivery fails this insert at the DB level (unique constraint), logged and treated as a
          safe no-op, before any grant logic runs
       6. inside one $transaction:
            - PAID:    UPDATE PaymentOrder SET status='PAID' WHERE id=? AND status='PENDING'
                       -> only if this update actually changed a row, grantPremium() runs
            - other:   UPDATE PaymentOrder SET status='FAILED' WHERE id=? AND status='PENDING'
                       (never touches an order that isn't still PENDING)
            - mark the PaymentWebhookEvent PROCESSED
```

Every rejected/unknown/mismatched delivery is still recorded (`REJECTED`, with a safe
`errorCategory` — never a raw payload or exception message) before the request is rejected with
`400 PAYMENT_WEBHOOK_REJECTED`, so a forged or malformed webhook is audited, not silently dropped.

## 5. Idempotency & concurrency (Phase 6/7)

Two independent layers:

1. **`PaymentWebhookEvent`'s unique constraint** on `(provider, externalEventId)` — the first line of
   defense. Two concurrent deliveries of the byte-for-byte identical webhook race on this insert;
   only one wins, the other is a safe no-op logged as `payment.webhook.duplicate`.
2. **The conditional `updateMany({ where: { status: 'PENDING' } })`** inside the same transaction as
   the entitlement grant — even if two *different* deliveries somehow got distinct
   `externalEventId`s (e.g. a provider retry carrying a new bank reference for the same order), only
   the first to win that row-level update actually calls `grantPremium`; the second sees `count === 0`
   and stops. This is also what makes the state machine below hold: a `FAILED` event arriving after
   the order is already `PAID` is gated to `status: 'PENDING'` too, so it can never revert a paid
   order.

Verified at two levels: `payment-webhook.service.spec.ts` (10 unit tests, mocked Prisma, sequential
delivery) and — added during Release Closure re-audit, since sequential `await`s prove nothing about
real concurrency — `payment.e2e-spec.ts`'s "Webhook concurrency" suite, which fires two webhook
requests via `Promise.all` (no `await` between them) against a **real** running Postgres instance and
asserts exactly one `PremiumEntitlement` row results, for both the identical-payload race (layer 1)
and the distinct-reference race (layer 2). Both passed against the real database, not just the mock.

## 6. Payment state machine (Phase 7)

```
PENDING -> PAID       (only via a verified webhook reporting success; conditional update, exactly once)
PENDING -> FAILED     (only via a verified webhook reporting failure; conditional update)
PENDING -> EXPIRED    (not actively swept this sprint — see §10 Known limitations)
PENDING -> CANCELLED  (not actively written this sprint — PayOS reports cancellation via the user's
                       return-URL flow, not a webhook; the frontend's `?cancelled=1` banner on
                       /premium is purely informational and never writes this status itself)
```

No other transition is reachable. `PAID`/`FAILED` are terminal from the backend's perspective — every
transition above is a `WHERE status = 'PENDING'` conditional update, so a stale or duplicate webhook
can never move an order backward out of a terminal state.

## 7. Tarot Premium integration

See `docs/architecture/premium-entitlements.md` §4 — `EntitlementService.hasPremiumAccess()` is the
one function `TarotRecordService` calls to decide usage limits, history depth, and interpretation
tier. No Tarot code reads `PaymentOrder`/`PaymentWebhookEvent` directly.

## 8. Environment / configuration (Phase 16)

| Variable | Purpose | Production requirement |
|---|---|---|
| `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` | PayOS merchant credentials; the checksum key signs/verifies everything | All three required (env.validation.ts fails boot otherwise) |
| `PAYOS_BASE_URL` | PayOS API base (default `https://api-merchant.payos.vn`) | — |
| `PAYOS_MOCK_CHECKOUT` | Skip the outbound checkout-link HTTP call (still real-signed) | Must be `false`/unset (boot fails if `true`) |
| `PREMIUM_PRICE_VND` | Backend-authoritative price (default 79,000) | — |
| `PREMIUM_DURATION_DAYS` | Entitlement window per purchase (default 30) | — |
| `PAYMENT_RATE_LIMIT_MAX` / `_WINDOW_MS` | Checkout throttle | — |

`.env.example` and `.env.test.example` both updated; the local (gitignored) `.env` and `.env.test`
were synced with matching values (fake/dev-only credentials) so the app boots locally. No real
credential was ever committed.

## 9. Security audit (Phase 14)

**Authorization**
- Cross-user order access: `PaymentCheckoutService.getOrder` 404s identically for a nonexistent id
  and another user's real order (unit-tested, and e2e-tested against the real HTTP surface).
- Cross-user entitlement access: `EntitlementService` always scopes by the authenticated `userId`
  from `@CurrentUser()` — there is no endpoint that accepts a target user id.
- Premium endpoint bypass / IDOR: every Premium decision funnels through `EntitlementService`; no
  controller reads a client-supplied "isPremium" field anywhere (grep-verified — no such field
  exists in any DTO).

**Payment integrity** (all verified by `payment-webhook.service.spec.ts` unit tests and
`payment.e2e-spec.ts` e2e tests)
- Forged webhook (invalid/missing signature) → rejected, audited, order untouched.
- Wrong amount / wrong currency → rejected, audited, order untouched.
- Unknown order → rejected, audited.
- Duplicate webhook (identical payload) → safe no-op, entitlement granted once.
- Concurrent/near-duplicate webhook (same order, different bank reference) → only the first
  transitions the order; the second is a no-op via the conditional update.
- Stale webhook (a FAILED event after the order is already PAID) → cannot revert a PAID order (gated
  to `status: 'PENDING'`).
- Provider mismatch: the `provider` field is always `'PAYOS'` server-side (never accepted from a
  webhook payload) — there is exactly one registered provider this sprint, so no cross-provider
  confusion is reachable.
- Malformed payload (missing required fields, wrong types) → fails zod schema validation before the
  signature is even checked, rejected as `MALFORMED_PAYLOAD`, never reaches order lookup.
- **Field-stripping defect found and fixed during Release Closure re-audit**: the webhook `data`
  schema originally declared only a fixed subset of fields (`orderCode`/`amount`/`description`/
  `reference`/`currency`, plus a few `.optional()`s); zod object schemas strip unrecognized keys by
  default, and payOS's own documentation states the signature covers *every* field actually present
  in `data`. A real webhook's extra fields (confirmed via payOS's own published example payload —
  `accountNumber`, `transactionDateTime`, `paymentLinkId`, `counterAccountBankId/-Name`,
  `counterAccountNumber`, `virtualAccountName/-Number`) would have been silently dropped before
  signature reconstruction, so **every real PayOS webhook would have failed signature verification in
  production** — a launch-blocking defect this implementation would never have caught on its own
  (self-signed test fixtures never exercised a field the schema didn't already know about). Fixed by
  adding `.passthrough()` to the `data` schema so the full field set PayOS actually sends is signed/
  verified, matching the documented behavior. Two regression tests added
  (`payos.provider.spec.ts`): one verifying a payload with payOS's *exact* documented example fields
  passes, one verifying a tampered extra field still fails.

**Client trust** — verified by inspection + e2e test (`payment.e2e-spec.ts`, "a client cannot
influence the price"): `POST /payment/checkout` accepts no body; any extra fields sent (amount,
currency, product) are silently ignored (backend always uses its own config). Premium status is
never read from `localStorage`/cookies the client controls, a URL query parameter, or a client
"success" flag — `/premium/return` only ever displays what `GET /payment/orders/:id` reports, and
that in turn only ever reflects a verified webhook.

**Secrets**
- `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` are server-only env vars, never in a
  `NEXT_PUBLIC_*` variable, never sent to the client, never logged (log lines use stable ids —
  `orderId`, `userId`, amount/currency — never the checksum key or raw signature comparison inputs).
- No raw webhook payload is logged or persisted — only a sha256 hash (`payloadHash`) for audit.

**CSRF**
- `POST /payment/checkout` and `GET /payment/orders/:id` sit behind the project-wide `CsrfGuard`
  (not skipped — real authenticated mutations/reads).
- `POST /payment/webhooks/payos` carries `@SkipCsrf()` deliberately — PayOS cannot supply our CSRF
  token (no browser session), and applying CSRF there would be meaningless (see controller
  docstring). Its security is entirely the HMAC signature check, which is the correct control for a
  server-to-server webhook.

**Rate limiting**
- `POST /payment/checkout` carries its own `payment` bucket + `@SkipThrottle({ companion: true,
  'companion-ip': true, auth: true })`, mirroring `f8fcba1`'s fix exactly — it does not share the
  tight AI-chat buckets, and unrelated routes don't share its bucket either.
- The webhook route intentionally carries no throttler guard (no `@UseGuards` at all) — its cost of
  rejection is cheap (schema validation + one HMAC compare before any DB write), and unlike
  session-authenticated routes there's no natural per-user tracker for an unauthenticated
  server-to-server endpoint. Flagged as a residual hardening item for production (edge/gateway-level
  rate limiting), not solved in-app this sprint — see §10.

## 10. Known limitations / residual risks

1. **Price is an unvalidated placeholder** (79,000 VND) — no Product Bible figure exists; needs a
   real business decision before production launch.
2. **No stale-order sweep** — a `PENDING` order past its `expiresAt` (30 min) is never automatically
   transitioned to `EXPIRED`; it simply stays `PENDING` until a webhook resolves it or forever if none
   arrives. Low impact (it blocks nothing — the user can just start a new checkout), but worth a
   scheduled job in a later sprint.
3. **No rate limiting on the webhook route itself** — see §9. Signature verification makes forged
   requests cheap to reject, but a very high-volume flood could still cost CPU on schema
   validation/HMAC computation. Recommend infrastructure/edge-level protection in production.
4. **Provider *runtime* integration is UNVERIFIED** — see §11/§12. No PayOS sandbox or production
   credentials were available in this environment. The *contract* (signature scheme, checkout
   request/response shape, webhook payload shape) has since been cross-checked against payOS's own
   current published documentation (§12) — a stronger tier than "built from memory" — but no live
   request/response was ever exchanged with PayOS's actual servers.
5. **PayOS domain ambiguity noted, not fully resolved** — see §12. `payos.vn` (Vietnamese payment
   gateway, matches this implementation) and `docs.payos.money` (a Svix-webhook-based platform with
   an entirely different payload shape) both surfaced under the "PayOS" name during the Release
   Closure re-audit's documentation search. This implementation targets `payos.vn` /
   `api-merchant.payos.vn`, consistent with the Vietnam MVP context and this codebase's existing
   `PAYOS_BASE_URL` default — but the account/merchant setup used at launch should be double-checked
   against the same domain before going live.

## 11. Provider runtime verification status

Per the sprint brief's explicit three-tier distinction:

- **A. Provider contract/signature behavior verified**: YES — and, as of the Release Closure
  re-audit, verified against payOS's own current published documentation (§12), not just this
  codebase's own memory of the contract:
  - `payos-signature.util.spec.ts` (9 tests) / `payos.provider.spec.ts` (11 tests) — the HMAC-SHA256 signing/
    verification code, including two tests built directly from payOS's own documented example
    payload and field-signing rule (see §12) — this is what caught and fixed the `.passthrough()`
    defect (§9).
  - `payment-webhook.service.spec.ts` (10 tests) — the full pipeline (verify → validate →
    idempotency → grant), mocked Prisma.
  - `payment.e2e-spec.ts` (13 tests, incl. 2 true-concurrency tests added this re-audit) — the same
    pipeline against a **real** Postgres/Redis stack (Docker), a real HTTP server, real Prisma
    transactions, and webhook payloads this test suite signs itself with the same checksum key the
    running API server uses — including two `Promise.all`-fired concurrent deliveries (not
    sequential `await`s) proving exactly-one-grant under real concurrency.
  - `flow-21-premium-payment.spec.ts` (Playwright, 1 test) — the complete user-facing loop against
    **real production builds** of both apps (`nest build` + `next build`/`next start`) and the same
    real Postgres/Redis stack: free Tarot usage → Premium boundary → `/premium` → a real
    `POST /payment/checkout` → a self-signed webhook POST → `/premium/return` polling → Premium
    reflected on `/premium` → the Tarot boundary genuinely lifted. **Actually run and passing** in
    this session (see the Sprint 7 final report's verification table) — Docker was unavailable
    earlier in this session and became available partway through; every DB-dependent check below was
    re-run once it did, none were skipped.
- **B. Sandbox/provider integration verified**: NO. No PayOS sandbox credentials were available in
  this execution environment — every check above uses `PAYOS_MOCK_CHECKOUT=true` (skips only the
  outbound checkout-link HTTP call) and a self-signed webhook (this test suite plays PayOS's role,
  signing with the same checksum key the server was configured with). This is **not equivalent** to
  B — it proves this implementation's own logic is internally consistent and matches payOS's
  documented contract; it does not prove payOS's real servers actually behave as documented, or that
  no additional discrepancy exists beyond what documentation search surfaced.
- **C. Real production payment verified**: NO, and out of scope for automated verification per the
  sprint brief ("Automated tests must not require spending real money").

Before production launch, a PayOS sandbox account should be used to confirm: the exact field set and
casing PayOS's real `/v2/payment-requests` response and webhook payload use (this implementation's
schema is now built from payOS's own current published documentation — §12 — not just memory, but
still not a live response); the real webhook delivery URL registration flow (PayOS requires
registering one webhook URL via their dashboard/API, not a per-order callback); and end-to-end
checkout-to-webhook timing in practice.

## 12. Release Closure re-audit — PayOS contract verification against current documentation

Performed with live web search/fetch access, which was not used during initial Sprint 7
implementation. Findings:

**Domain disambiguation (new finding).** Searching "PayOS" surfaced two unrelated products:
`payos.vn` / `api-merchant.payos.vn` (the Vietnamese payment gateway this implementation targets —
VND, `orderCode`-based, matches this codebase's field names exactly) and `docs.payos.money` (a
different, Svix-webhook-based platform — `eventType`/`payload`/`svix-signature` headers, entirely
different field names, unrelated to this implementation). This codebase's `PAYOS_BASE_URL` default
(`https://api-merchant.payos.vn`) and all field names already matched the correct (`.vn`) product —
no code was confused between the two — but this is worth stating explicitly so a future reader
searching "PayOS webhook docs" doesn't land on `docs.payos.money` and assume a mismatch is a bug.

**Checkout request body — verified against payOS's own API reference** (`payos.vn/docs/api/`,
`POST /v2/payment-requests`): required fields are `orderCode`, `amount`, `description`, `cancelUrl`,
`returnUrl`, `signature` — exactly what `PayOSProvider.createPayment` sends. Optional fields this
implementation omits (`buyerName`, `buyerEmail`, `items`, `invoice`, `expiredAt`, etc.) are
confirmed optional, not silently missing required data.

**Checkout response body — verified**: envelope `code`/`desc`/`data`/`signature`; `data` object
`bin`/`accountNumber`/`accountName`/`amount`/`description`/`orderCode`/`currency`/`paymentLinkId`/
`status`/`checkoutUrl`/`qrCode`. This implementation reads only `checkoutUrl`/`paymentLinkId` (all it
needs) — no bug, just a deliberately partial type.

**Webhook signature algorithm — verified**: payOS's own docs ("Kiểm tra dữ liệu với signature")
confirm, for the `payment-requests` family specifically (not the unrelated `payouts` API, which uses
a *different*, URL-encoded variant — the docs explicitly warn these two are not interchangeable):
extract every field in `data`, sort alphabetically, join as `key=value&key=value` with **raw**
(non-URL-encoded) values, HMAC-SHA256, hex digest. This matches `buildPayOSSignatureData`/
`signPayOSData` exactly, field-for-field and encoding-for-encoding.

**Webhook payload shape — verified against payOS's own published example**, which is what surfaced
the real defect fixed in §9: the example payload's `data` object carries `orderCode`, `amount`,
`description`, `accountNumber`, `reference`, `transactionDateTime`, `currency`, `paymentLinkId`,
`code`, `desc`, `counterAccountBankId`, `counterAccountBankName`, `counterAccountName`,
`counterAccountNumber`, `virtualAccountName`, `virtualAccountNumber` — considerably more fields than
this implementation's schema originally declared. Fixed via `.passthrough()` (§9); a regression test
(`payos.provider.spec.ts`) now signs and verifies payOS's exact documented example field-for-field.

**Not resolved by documentation search**: whether PayOS sends a webhook for cancelled/expired
payments at all (undocumented on the pages reached), and the exact webhook-URL registration flow's
UI/API steps. Both remain sandbox-verification items (§11 tier B).

**What this does and does not prove**: this re-audit substantially raises confidence that the
*implementation matches payOS's documented contract* — it already caught and fixed one real defect
that would have blocked every production webhook. It does **not** constitute sandbox or production
verification (tier B/C, §11) — no request was ever sent to or received from payOS's actual servers in
this session.
