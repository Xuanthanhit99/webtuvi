# Premium Entitlements — Architecture (Sprint 7)

Status: Implemented. See `docs/progress/sprint-7-progress.md` for the audit/decision trail and
`docs/architecture/payment-foundation.md` for the payment side (provider, checkout, webhook,
security audit) this domain is granted from.

## 1. Product decision

Two states only: **FREE** and **PREMIUM**. One paid product: **`PREMIUM_30D`** — a 30-day,
time-boxed Premium pass, not an auto-renewing subscription. PayOS's hosted checkout is a one-time
payment link, not a recurring-billing API, so a recurring subscription engine is not "strictly
necessary" per the sprint brief and is deliberately not built. Repeat purchases **stack**: buying
again while already Premium extends `expiresAt` from the current furthest expiry, not from "now".

Price: `PREMIUM_PRICE_VND` (default 79,000 VND), duration: `PREMIUM_DURATION_DAYS` (default 30) —
both read from a single backend config source (`AppConfiguration.payment.premium`, populated once in
`configuration.ts` from env), never client-supplied, never independently hardcoded in the frontend
(the `/premium` UI deliberately shows no price at all — see
`apps/web/features/premium/components/premium-upgrade-panel.tsx` — the real amount is only ever
shown by PayOS's own hosted checkout page, which reads it from the backend-signed checkout request).

> **CURRENT MVP TEST PRICE: 79,000 VND.**
> **PRODUCTION PRICE: REQUIRES PRODUCT SIGN-OFF.**
>
> The Product Bible has no validated price figure for Premium anywhere. 79,000 VND is an
> engineering placeholder chosen only so the checkout flow has *some* concrete, testable value — it
> is not a researched number, not a cost-modeling output, and must not be read as an approved
> business decision. Changing it before launch is a one-line env var change
> (`PREMIUM_PRICE_VND`) — no code or migration required — once Product actually sets a real price.

## 2. Free vs Premium Tarot matrix

The Product Bible's own Premium value (Memory retrieval depth, Module 17) was explicitly overridden
for this sprint by the sprint brief itself, which required using the *actual* Tarot implementation
and forbade quietly removing already-free Sprint 6 functionality (Three Card Spread was fully free
and unlimited in Sprint 6). The matrix below reconciles both constraints: Tarot stays fully
available to Free users; Premium raises usage ceilings, unlocks full history, and adds
memory-personalized/deeper interpretation as a secondary (not primary) value.

| Capability | Free | Premium | Notes |
|---|---|---|---|
| Daily Draw | 1 / UTC day | 1 / UTC day | Unchanged from Sprint 6 for **both** tiers — the "no re-draw" reflective premise (Module 12) applies equally; Premium does not get to re-draw. |
| Single Card | 3 / UTC day | 15 / UTC day | **New** cap — unlimited in Sprint 6. Documented product change, not a silent regression. |
| Three Card Spread | 1 / UTC day | 10 / UTC day | **New** cap — unlimited in Sprint 6, and **still fully available to Free** (never removed). |
| Interpretation | Basic prompt, 400 max tokens, no Memory reference | Richer prompt, 700 max tokens, at-most-one Memory reference (Sprint 6's original rule) | See §5. |
| Reading history | Most recent 20 readings only | Unlimited (Sprint 6's original pagination) | Explicit `PREMIUM_REQUIRED` denial when a Free request's window falls beyond the 20-item cap — never a silently-truncated result. |

Daily/Single/Three-Card counting is **status-agnostic** (counts all statuses, including
soft-deleted), mirroring Sprint 6's own Daily Draw rule — a user cannot delete today's readings to
reset their daily allowance.

## 3. Entitlement domain (Prisma)

```
PremiumEntitlement
  id, userId, status (ACTIVE|EXPIRED|REVOKED), source (PAYMENT),
  startsAt, expiresAt?, grantedAt, revokedAt?, orderId (unique, -> PaymentOrder),
  createdAt, updatedAt
```

One row per successful payment — an append-only grant ledger, not a single mutable "current
entitlement" row. `getUserEntitlements()` returns the full history; `hasPremiumAccess()` /
`requirePremium()` only ever look at whether *any* row currently grants access.

### Why status is computed, not just stored

The DB `status` enum only ever gets written as `ACTIVE` (on grant) — `REVOKED` is reserved for a
future manual/refund action (no admin UI exists this sprint, out of scope per the sprint brief's
scope freeze). `EXPIRED` is **never persisted**: `EntitlementService` computes "is this row
currently in effect" from `expiresAt` at read time (`expiresAt === null || expiresAt > now`) rather
than relying on a background job to flip a stored status. This means:

- No cron/worker is required for entitlements to correctly lapse.
- There is no window where a stale `ACTIVE` status could survive past a real background job's
  failure.
- The tradeoff: every access check does a live comparison against `now` rather than a flat status
  read — acceptable at this scale (one indexed query), and avoids introducing Redis caching or a
  scheduler for an MVP-sized feature (deliberately not built, matching "don't over-engineer").

### EntitlementService — the one authoritative layer

```
hasPremiumAccess(userId): Promise<boolean>
requirePremium(userId): Promise<void>              // throws ForbiddenException { code: 'PREMIUM_REQUIRED' }
getEntitlementSummary(userId): Promise<PremiumStatusDto>   // isPremium, status, expiresAt
getUserEntitlements(userId): Promise<PremiumEntitlementRecord[]>
grantPremium(tx, userId, orderId, durationDays): Promise<void>  // called only from PaymentWebhookService's transaction
```

Every Premium authorization decision in the app converges through this service — `TarotRecordService`
calls `hasPremiumAccess` to pick a usage-limit table and interpretation tier; nothing scatters its own
`user.isPremium`-style check. A generic `PremiumGuard` (`payment/entitlement/premium.guard.ts`) also
exists for any future route that is *exclusively* Premium (this sprint's Tarot gating is all
usage-limit-based, not boolean-gated, so no controller currently applies it — but it demonstrates the
server-side enforcement pattern Phase 9 requires and is unit-tested).

## 4. Server-side enforcement (Phase 9)

Every Premium decision happens in `TarotRecordService`, never in the frontend:

- `draw()` calls `assertWithinDailyLimit()` before creating anything — a Free user past their
  ceiling gets `403 { code: 'PREMIUM_REQUIRED' }` if Premium would actually raise the ceiling, or
  `400 { code: 'TAROT_DAILY_LIMIT_REACHED' }` if even Premium's (higher) ceiling was hit (upgrading
  wouldn't help, so it would be misleading to say Premium is required).
- `list()` computes `isPremium` once and either serves the full paginated result (Premium) or caps
  `total`/`skip` to the 20-item window and throws `PREMIUM_REQUIRED` for any request beyond it
  (Free).
- `generateInterpretation()` picks the tier, decides whether to even attempt Memory retrieval (Free:
  skipped entirely, not fetched-then-hidden), and passes `tier` into `TarotInterpretationService`,
  which selects the system prompt and token budget.

The frontend (`apps/web/features/tarot/components/tarot-draw-panel.tsx`,
`tarot-history-list.tsx`) only ever *reflects* these backend decisions — it branches on the
`ApiError.code` the backend returned (`PREMIUM_REQUIRED` vs `TAROT_DAILY_LIMIT_REACHED`) to decide
whether to show an upgrade link, never computes eligibility itself.

## 5. AI interpretation gating (Phase 13)

Both tiers reuse the identical Companion `ProviderOrchestratorService`/`SafetyService` pipeline —
no second AI client, no new safety bypass. The only differences:

| | Free | Premium |
|---|---|---|
| System prompt | Shorter, "brief and clear" framing | "Premium (deeper)" framing — connects themes across cards, weaves in the memory reference if present |
| `maxTokens` | 400 | 700 |
| Memory reference | Retrieval never attempted | At most one (Sprint 6's original rule) |

Both prompts carry the identical hard rules: never choose/change/add/remove a card, never claim a
different orientation than given, never fabricate a memory. Premium cannot bypass any AI safety or
cost control — the same `SafetyService.checkInput`/`checkOutput` and the same per-user AI rate
limit/budget apply regardless of tier.

## 6. Frontend surfaces

- `/premium` — Free state (matrix + upgrade CTA), Premium state (active badge + expiry), checkout
  loading/error/provider-unavailable states, a `?reason=required` boundary banner, a `?cancelled=1`
  informational banner.
- `/premium/return` — polls `GET /payment/orders/:id` (`refetchInterval` while `PENDING`) until the
  order settles, then reflects exactly that; never treats arriving on this page as proof of payment.
- `Settings` page — a compact `PremiumStatusCard` (Free/Active + Manage/Upgrade link), following the
  existing "Card row + Link-out Button" precedent already used for Reflections/Insights/Reviews/Goals.
- Tarot draw panel / history list — inline upgrade banners when a `PREMIUM_REQUIRED` error is
  returned, instead of a generic toast.
- **No "Premium" item was added to the main sidebar nav** (`components/layout/nav-items.ts`) — that
  list is a deliberate, documented product decision ("exactly five destinations, per the Product
  Bible's IA"); Premium is surfaced via Settings and contextual upgrade prompts instead, the same way
  Reflections/Insights/Reviews/Goals already are.

## 7. Known limitations / deliberately out of scope

- No admin revoke/refund UI (scope freeze: "no admin finance dashboard"). `REVOKED` exists in the
  schema for a future manual action but nothing writes it yet.
- No Redis caching of entitlement status (the Product Bible's Module 17 spec mentions this; skipped
  as a premature optimization for this scale).
- No pagination UI was added to the Tarot history list to let a user actually page past item 20 —
  the backend enforces/denies it (tested), and the frontend shows a plain "Upgrade for unlimited
  history" note when a Free account's total reaches the cap, but there's no "load more" control yet.
