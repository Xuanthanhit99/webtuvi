# Account Data Rights — Architecture (Sprint 10)

Status: Implemented. Selected by `docs/audit/sprint-10-pre-implementation-audit.md` §28 (P0:
account export, account deletion). See `docs/progress/sprint-10-progress.md` for the build log and
`docs/progress/sprint-10-final-report.md` for verification results.

## 1. Core architectural decision

**Account deletion never calls `prisma.user.delete()` and never relies on the schema's
`onDelete: Cascade` chain from `User`.** Every personal-content foreign key in the schema already
cascades from `User` (confirmed by reading every `onDelete:` clause in `schema.prisma`) — including,
critically, `PaymentOrder.user` and `PremiumEntitlement.user`. A literal `user.delete()` would
therefore destroy financial/accounting records, which the sprint brief explicitly forbids ("Account
deletion must not corrupt payment/accounting integrity").

Instead, account deletion is an **application-orchestrated, two-part operation**:

1. **The `User` row is never removed.** Its personally-identifying fields are irreversibly scrubbed
   (`email` → `deleted+{userId}@beaconvie.invalid`, an RFC 2606 `.invalid`-TLD address that can never
   be re-registered or delivered to; `displayName` → `"Deleted user"`; `passwordHash` → a random,
   unusable argon2 hash of a value nobody can supply), `status` is set to `DELETED`.
2. **Every personal-content child table is explicitly hard-deleted** via targeted
   `deleteMany({ where: { userId } })` calls (not cascade) — Companion, Memory, Journal, Reflection/
   Insight/Review/Goal, Tarot/Numerology/Natal Chart readings, sessions/tokens, profile/preferences,
   activity log. **`PaymentOrder`, `PaymentWebhookEvent`, and `PremiumEntitlement` are deliberately
   left untouched** — they still reference the (now-anonymized) `User` row by `userId`, preserving
   referential integrity, webhook idempotency (`@@unique([provider, externalEventId])`), and
   reconciliation history, while containing no PII of their own (verified: neither model has ever
   stored email/name/card data — only `amount`/`currency`/`status`/`orderCode`/a documented
   non-sensitive `metadata` field).

This is why the `User.status` enum already had a `DELETED` value before this sprint (`schema.prisma`
line 18-22) — the schema was already shaped for this pattern; it just wasn't enforced anywhere yet
(see §4).

## 2. Account data inventory & retention matrix

| Model | User relationship | Export? | Delete? | Retain? | Reason |
|---|---|---|---|---|---|
| `User` | is the account | Yes (non-secret fields) | Anonymize, not delete | Yes (scrubbed) | FK target for retained payment records |
| `UserSession` | direct, cascade | No (session metadata only, not useful to the user) | Hard delete | No | Auth artifact |
| `PasswordResetToken` / `EmailVerificationToken` | direct, cascade | No | Hard delete | No | Hash-only auth artifacts |
| `UserProfile` / `UserPreference` | direct, cascade | Yes | Hard delete | No | Personal settings |
| `OnboardingProgress` | direct, cascade | Yes | Hard delete | No | Personal state |
| `CompanionMessage` (onboarding transcript) | direct, cascade | Yes | Hard delete | No | Personal content |
| `MemoryNote` (Sprint 1, deprecated) | direct, cascade | Yes | Hard delete | No | Personal content, still real |
| `ActivityEvent` | direct, cascade | Yes | Hard delete | No | Non-sensitive but personal |
| `Conversation` + `ConversationMessage` | direct/cascade | Yes | Hard delete | No | Personal Companion chat content |
| `AIUsage` | direct, cascade | No (internal cost telemetry, not user-facing) | Hard delete | No | Considered for retention (vendor cost reconciliation) and decided against — it is internal telemetry, not a financial transaction record with the User; no accounting obligation named in the brief covers it |
| `ProviderLog` | **none** (no `userId` field) | N/A | N/A | N/A | Not user-linked by design; out of scope |
| `Memory` + `MemoryVersion`/`MemoryCandidate`/`MemoryAudit`/`MemoryDuplicate`/`MemoryConflict`/`MemoryMergeSuggestion`/`MemoryRetrievalLog`/`MemoryConsentSetting`/`MemoryTypeConsent` | direct/cascade | Yes (memory + versions + consent, mirroring the existing `MemoryExportService`) | Hard delete | No | Bible Module 10: "always user-deletable" |
| `JournalEntry` + `JournalRevision` | direct/cascade | Yes | Hard delete | No | Personal content |
| `ReflectionCandidate` + `ReflectionSourceRef` | direct/cascade | Yes | Hard delete | No | Personal derived content |
| `InsightCandidate` + `InsightEvidence` + `InsightRelationship` | direct/cascade | Yes | Hard delete | No | Personal derived content |
| `Review` + `ReviewSection` + `ReviewEvidence` | direct/cascade | Yes | Hard delete | No | Personal derived content |
| `Goal` + `GoalMilestone`/`GoalProgress`/`GoalEvidence`/`GoalHistory`/`GoalRelationship` | direct/cascade | Yes | Hard delete | No | Personal content |
| `TarotReading` + `TarotReadingCard`/`TarotReadingSession`/`TarotReadingHistory` | direct/cascade | Yes | Hard delete | No | Personal Discovery data |
| `TarotCard` / `TarotSpread` | **none** — global catalog | N/A | N/A | N/A | Not user data |
| `NumerologyReading` + `NumerologyValue`/`NumerologyReadingHistory` | direct/cascade | Yes | Hard delete | No | Personal Discovery data |
| `NatalChart` + `NatalPlacement`/`NatalHouse`/`NatalAspect`/`NatalChartHistory` | direct/cascade | Yes | Hard delete | No | Personal Discovery data |
| `PaymentOrder` | direct | Yes (safe fields only) | **Not deleted** | **Yes, indefinitely** | Financial/accounting integrity; contains no PII |
| `PaymentWebhookEvent` | indirect (via order) | No (internal audit ledger, not user-facing) | **Not deleted** | **Yes, indefinitely** | Webhook idempotency + audit trail |
| `PremiumEntitlement` | direct | Yes | **Not deleted** | **Yes, indefinitely** | Accounting/what-was-granted record; contains no PII |
| `Notification` (Sprint 11) | direct, cascade | Yes (content fields only — `emailStatus`/`emailAttemptedAt`/`emailError` excluded as internal delivery metadata) | Hard delete | No | Personal content; also excluded at the source going forward — `NotificationsSchedulerService` only ever queries `status: 'ACTIVE'` users |
| `NotificationPreference` (Sprint 11) | direct, cascade | Yes | Hard delete | No | Personal settings |

## 3. Retention period — explicit product/legal decision required

**PRODUCT/LEGAL DECISION REQUIRED.** This implementation retains `PaymentOrder`/
`PaymentWebhookEvent`/`PremiumEntitlement` **indefinitely by default** — no automatic purge job
exists this sprint, and no specific retention period (e.g., "5 years for tax records") is invented
here, per the sprint brief's explicit instruction not to fabricate a legal retention period the
repository/Product Bible does not define. A real retention period is a business/legal decision
(tax law, accounting standards, Vietnam's data-protection framework) that should be made explicitly
before this becomes a compliance concern at scale, and then implemented as a scheduled purge job in
a later sprint.

## 4. Auth-enforcement gap found and fixed

`UserStatus.DELETED` existed in the schema but was **never checked anywhere** — `JwtAuthGuard`
verified only the JWT signature, never re-checked the database. This meant a deleted account's
still-valid (15-minute) access token would continue authenticating every protected route until
natural expiry, and login already correctly checks `passwordHash`/existence but was not explicitly
tested against a `DELETED` status. Fixed: `JwtAuthGuard` now performs one additional indexed
`User.findUnique({ where: { id }, select: { status: true } })` after signature verification and
rejects (401) any non-`ACTIVE` status. This mirrors `EntitlementService.hasPremiumAccess()`'s own
precedent (`premium-entitlements.md` §3: "computed at read time... acceptable at this scale, avoids
introducing caching for an MVP-sized feature") — same tradeoff, same justification, applied to
authentication instead of entitlement. `UserSession`-based refresh-token revocation (`logoutAll`,
already existing) is called on deletion for defense-in-depth, closing the refresh path
independently of the guard-level check.

## 5. Export architecture

Reuses the existing `MemoryExportService` pattern (`apps/api/src/memory/export/`) exactly — a
synchronous, per-user Redis-locked (`SET NX`), Redis-cached (15-minute TTL) two-step job
(`POST` creates + caches, `GET /:jobId` retrieves), not a background queue (matches this sprint's
established "no BullMQ, no unnecessary infrastructure" precedent). `AccountExportService`
(`apps/api/src/users/export/`) assembles one JSON document per §2's "Export? Yes" rows, explicitly
excluding: `passwordHash`, refresh-token hashes, CSRF secrets, provider API keys/checksum keys,
internal `ProviderLog`/raw-AI-prompt content, and any other user's data. Versioned via
`exportVersion: 1`.

## 6. Deletion confirmation

Reuses `changePassword`'s existing password-confirmation pattern (`auth.service.ts`, `argon2.verify`)
exactly — no second authentication mechanism invented. `DELETE /users/me` requires the current
password in the request body.

## 7. Release Closure findings (independent re-verification)

Two genuine defects were found during independent Release Closure re-verification (not present in
the original implementation's own self-report) and fixed:

1. **Export omitted `MemoryNote`.** §2's table always classified `MemoryNote` as "Export? Yes", but
   `AccountExportService.assemble()` never actually queried it — a real gap between documented intent
   and shipped code. Confirmed via a live dev-DB row (`memory_notes` table, still actively written by
   `MemoryService.createNote()` from the Onboarding Reflection step) that a real user's export would
   have silently omitted this content. Fixed: added as `memory.legacyNotes` in the export result
   (`select`-scoped to `id`/`content`/`source`/`createdAt`, same safety discipline as every other
   section).

2. **A late PayOS webhook could mint a fresh Premium entitlement for an already-deleted account.**
   Reproduced directly: register → checkout → **delete account** → a real, validly-signed `PAID`
   webhook for that order arrives afterward. `PaymentOrder` correctly (and desirably) still
   transitions `PENDING` → `PAID` — the payment genuinely happened and the accounting record must
   reflect that regardless of what the buyer did with their account afterward — but
   `PaymentWebhookService` was unconditionally calling `EntitlementService.grantPremium()` for the
   order's `userId` with no account-status check, creating a brand-new `status: ACTIVE`
   `PremiumEntitlement` row against a scrubbed, `DELETED` user. Under the current design this grants
   no actual access today — `JwtAuthGuard` already refuses to authenticate any `DELETED` user
   regardless of entitlement state, and entitlements are looked up by `userId`, not email, so a later
   re-registration with the freed original email cannot inherit it either. It was nonetheless a
   genuine defect, not a "safe retained accounting state": a dormant `ACTIVE` entitlement silently
   materializing against a deleted identity is confusing for reporting/reconciliation, and would
   become a real, live access-restoration bug the moment any future admin "undelete"/support-restore
   flow exists — access would resume without the user ever passing through checkout again. Fixed:
   `PaymentWebhookService.applyPaymentResult()` now checks the account's current `User.status` inside
   the same transaction before calling `grantPremium()` — the order still transitions to `PAID`
   unconditionally, but the entitlement grant is skipped (logged as
   `payment.entitlement.skipped_inactive_account`) unless the account is still `ACTIVE`. Covered by
   new unit tests (`payment-webhook.service.spec.ts`) and a real signed-webhook e2e reproduction
   (`account-data-rights.e2e-spec.ts`).

Re-registration with the same (now-freed) original email was also explicitly tested: it creates a
structurally unrelated new `User` row (new UUID); the old row's email is already scrubbed to the
`.invalid` address so no collision occurs; the new account starts with zero Premium/payment history.
Multi-session revocation was explicitly tested too: deleting from one session immediately revokes
every other session's still-unexpired access token (all `UserSession` rows are hard-deleted for the
`userId`, not just the calling session's).

## 8. Payment production status (reverified, not re-derived from scratch)

Unchanged from `docs/progress/payos-production-readiness.md`'s own verdict: **PAYOS INTEGRATION:
CONTRACT VERIFIED / PAYMENT PRODUCTION: BLOCKED.** See that document and
`docs/progress/sprint-10-final-report.md` §"PayOS remaining blockers" for the blocker
classification this sprint added (CODE / CONFIGURATION / EXTERNAL ACCOUNT / PRODUCT DECISION /
DEPLOYMENT / DOCUMENTATION).
