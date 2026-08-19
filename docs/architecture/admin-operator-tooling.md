# Admin Operator Tooling — Architecture Reference

**Status:** Design-ready, not implemented. Full rationale, threat model, and evidence citations:
`docs/audit/admin-operator-tooling-pre-implementation-audit.md`. This document is the concise,
implementation-facing companion — read the audit first if you need the *why*, read this for the
*what*.

---

## 1. Identity model

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  // ...existing fields...
  role UserRole @default(USER)
}
```

Additive migration. Every existing row becomes `USER`. Zero admins created automatically.

---

## 2. Authorization chain

```
Request → JwtAuthGuard (extend existing select to { status: true, role: true })
        → AdminGuard (new; role !== 'ADMIN' → 403)
        → Controller
```

`JwtAuthGuard` already re-reads `status` from the DB on every request (Sprint 10 precedent) — adding
`role` to the same `select` gives immediate revocation for free. No JWT payload change, no login/
refresh change, no caching layer.

| Caller | Result |
|---|---|
| Anonymous | 401 |
| Authenticated `USER` | 403 |
| Authenticated `ADMIN` | 200 |
| `ADMIN` demoted in DB, same still-valid JWT | 403 on the very next request |

---

## 3. Provisioning

First admin: manual `UPDATE users SET role = 'ADMIN' WHERE email = ...`, documented as a rare,
production-DB-access-gated step in `docs/operations/production-deployment-runbook.md`. Optional
follow-up: a CLI wrapper, never an HTTP endpoint. **Never** via `prisma/seed.ts`, and no DTO anywhere
accepts a `role` field (enforced by the existing global `ValidationPipe({ whitelist: true,
forbidNonWhitelisted: true })`).

---

## 4. Endpoints

```
GET /admin/users/lookup?email=...|id=...
GET /admin/users/:id/entitlement
GET /admin/users/:id/payments
GET /admin/payments/:orderId
GET /admin/notifications/health
GET /admin/ai-spend?window=today|7d&feature=&provider=&userId=
```

All read-only. All `JwtAuthGuard` + `AdminGuard`. New `admin` throttle bucket, per-authenticated-user
tracked (same pattern as `discovery`/`payment`/`companion`). No unbounded list/dump endpoint.

---

## 5. Field scoping

### User lookup — ALLOW
`id, email, displayName, status, role, createdAt, emailVerifiedAt, onboardingCompletedAt` + Premium
status (via `EntitlementService`, not a raw join).

### User lookup — DENY
`passwordHash`, any session/refresh-token material, Memory/Journal content, AI prompts/responses,
private Discovery narrative content.

### Entitlement lookup
Read-only, via `EntitlementService.hasPremiumAccess`-equivalent path — never a parallel query.
Fields: `status, source, startsAt, expiresAt, grantedAt, revokedAt, orderId`. No grant/revoke/extend
mutation.

### Payment lookup — ALLOW
`id, product, amount, currency, provider, providerOrderCode, status, createdAt, paidAt, failedAt,
expiresAt`, entitlement linkage.

### Payment lookup — DENY
`providerPaymentLinkId`, `providerCheckoutUrl`, raw `metadata` JSON, `PaymentWebhookEvent.payloadHash`,
any checksum/secret (none are ever persisted — nothing to leak, but the DTO must not forward them
regardless).

### Notification health
Aggregate `COUNT(*) GROUP BY type, emailStatus` over a recent window, from real `Notification` rows —
available today, no new schema. "Did the scheduler run execute" is **not** available without new
telemetry (`SchedulerRunLog`, not built) — flagged `PRODUCT_DECISION_REQUIRED`, not silently added.

### AI spend
From `ai_usages`/`provider_logs`: spend (today/7d, by feature, by provider, optionally by user),
request count, failure count (feature/provider-level only — `ProviderLog` has no `userId`, so
per-user failure rate is not derivable and must not be implied by the UI). Never prompt/completion
content — structurally impossible, neither table has such a column.

---

## 6. Explicit non-goals (V1)

Delete/suspend user, reset password, change email, grant/revoke Premium, refund, modify payment
status, resend webhook, edit notifications, inspect Memory/Journal/AI conversation, impersonation.
Any of these later requires its own audit — read and write are different trust tiers.

---

## 7. Frontend

`/admin` → search → read-only result. Server-side role check (extend `/auth/me` or equivalent) —
hidden navigation is never the authorization mechanism; every API call is independently protected by
`AdminGuard`. Add `/admin` to `apps/web/app/robots.ts`'s disallow list. Non-admin direct visit → plain
not-found, not a permission-denied message (don't confirm the feature exists).

---

## 8. Sentry / analytics

Sentry: any admin-route context sent to Sentry must use the existing allowlist scrubber
(`sentry-scrub.util.ts`) — never assume an unlisted key is safe (this codebase has a documented prior
denylist-bypass incident). Analytics: no admin-lookup event may carry the searched value (email,
userId, order id) — content-free events only, matching the existing zero-PII analytics contract.

---

## 9. Testing anchor

The single most important test: **an `ADMIN` demoted to `USER` mid-session, same still-valid JWT
reused, must get 403 on the very next request.** This proves the whole authorization design against a
real running app, not a mock.

---

## 10. Out of scope for this document

Vietnamese Tử Vi (Sprint 18 remains `BLOCKED_BY_DOMAIN_REFERENCE`, untouched), SEO, shareability,
Community, any write/mutation admin action, admin action audit logging (deferred until a write action
exists).
