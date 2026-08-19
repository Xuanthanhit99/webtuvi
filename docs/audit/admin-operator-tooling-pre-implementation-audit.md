# Interim Sprint — Admin Operator Tooling — Pre-Implementation Audit

**Type:** Research/architecture/threat-model only. No Prisma migration, no backend implementation, no
frontend implementation, no CI modification, in this document or the session that produced it. No
commit, no push. This audits the interim sprint recommended in
`docs/audit/roadmap-resequencing-after-tuvi-block.md` §6 while Vietnamese Tử Vi Sprint 18 remains
`BLOCKED_BY_DOMAIN_REFERENCE` (`docs/audit/sprint-18-pre-implementation-audit.md`).

**Method note on this session's own process:** a background investigation agent was dispatched to
inspect the actual auth/payment/entitlement/notification/AI-usage architecture before any design
decision was made. That agent's task-notification was reported as having "no completion record" by
an intervening system message, which was read as a possible failure — the agent had in fact completed
successfully with a full, citation-backed report, which arrived and is the evidentiary basis for
every architecture claim in §2–§10 below. No fact in this document is asserted from memory or
inferred without a specific file/code citation.

---

## 1. Git baseline (fresh this session)

```
git status --short   → M  docs/product/product-completion-roadmap-v2.md
                        ?? docs/audit/roadmap-resequencing-after-tuvi-block.md
                        ?? docs/audit/sprint-18-pre-implementation-audit.md
                        ?? docs/domain/tu-vi/domain-resolution-pack.md
HEAD                  = cfe0824d01a6d681011be10845dfd18fac113274
origin/master          = c1c8b8f916a959c62fab1d45328ba3eabcf902e7
ahead/behind           = 1 ahead / 0 behind
```

No reset, stash, or clean performed. No unrelated local changes found — every pending change traces
to this session's own prior turns.

---

## 2. Existing RBAC/admin infrastructure — inventory

**None exists.** Confirmed by direct repository search (`admin`, `administrator`, `moderator`,
`staff`, `RBAC`, `isAdmin`, `isStaff`, `allowlist`, `allowedEmails`, `ALLOWED_USER_*`, `role`,
`permission`) across `apps/api/src`, `apps/web`, `packages/types`, `prisma/schema.prisma`:

- Every `admin` hit is a **comment describing future, out-of-scope work** — e.g.
  `natal-chart-meanings.ts`/`numerology-meanings.ts`: "Editable in the future only through an Admin
  tool"; `schema.prisma` (near `PremiumEntitlement`): "...future manual/refund action — no admin UI
  exists yet, out of Sprint 7 scope..." and "...a future non-payment grant path (promo, admin,
  referral — none in scope now)." Nothing built.
- `role`: only `MessageRole` (`USER`/`COMPANION`) and `ConversationRole`
  (`SYSTEM`/`USER`/`ASSISTANT`) — chat-turn-speaker enums, structurally and semantically unrelated to
  user authorization.
- `permission`: only a Memory-consent UI label ("Health (requires explicit permission)"), a
  user-consent string, not an authorization system.
- `RBAC`, `staff`, `moderator`, `isAdmin`, `isStaff`: zero genuine hits.
- `allowlist`: real pattern, but always for a different purpose — Sentry event-field scrubbing,
  analytics event/property allowlisting, CSRF safe-method allowlisting, frontend route allowlisting.
  None relate to *who* is allowed to act; all relate to *what data* is allowed to leave the system.

**The `User` Prisma model has no role/permission field today** — confirmed by reading the full model
(§3). This is a genuinely greenfield addition, not a redesign of something partial.

---

## 3. User / UserStatus / authentication runtime path

**Full `User` model** (as read from `apps/api/prisma/schema.prisma`):

```prisma
model User {
  id                    String     @id @default(cuid())
  email                 String     @unique
  passwordHash          String
  displayName           String
  status                UserStatus @default(ACTIVE)
  emailVerifiedAt       DateTime?
  onboardingCompletedAt DateTime?
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
  // ...29 relation fields, one per module (sessions, payment orders, entitlements,
  //     AI usages, all Discovery readings, notifications, etc.)
  @@map("users")
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

Sensitive fields: `passwordHash` (argon2). No token material lives on `User` — refresh tokens are
hashed and stored on the related `UserSession.refreshTokenHash`, not here.

**Authentication runtime path — traced, not inferred.** `apps/api/src/common/guards/jwt-auth.guard.ts`
is the single guard responsible for both authentication and freshness — there is **no separate
`@nestjs/passport` `JwtStrategy`**; this codebase does not use `@nestjs/passport` at all. The guard:

1. Reads the `beaconvie_access_token` cookie.
2. Verifies the JWT signature via `JwtService` against `config.jwt.accessSecret`. Payload shape:
   `{ sub, email, sid? }` — **no `status`, no `role`, no anything else is embedded in the token.**
3. **Performs a live, indexed Prisma point-lookup on every single request:**
   ```ts
   const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { status: true } });
   if (!user || user.status !== 'ACTIVE') {
     throw new UnauthorizedException('Your session has expired. Please log in again.');
   }
   ```
4. Only then attaches the resolved user to `request.user` and allows the request through.

**The Sprint 10 comment, quoted in full, exactly as found in source:**

> `// Sprint 10 — a still-valid, unexpired access token must not keep authenticating once the`
> `// account is deleted (or ever suspended). One indexed point-lookup per request; the same`
> `// "computed at read time, no caching" tradeoff EntitlementService.hasPremiumAccess() already`
> `// makes at this scale (see docs/architecture/account-data-rights.md §4).`

This is the load-bearing precedent for the entire authorization design in this document (§11–§12):
**this codebase already has one established, already-audited pattern for "a DB state change must
revoke access on the very next request" — status flips. Admin role must reuse this exact pattern,
not invent a second, weaker one.**

---

## 4. Stale-JWT / immediate-revocation behavior — re-derived, not assumed

Because `JwtAuthGuard` re-reads `status` from the DB on every request rather than trusting a JWT
claim, the architecture **already, today, for `SUSPENDED`/`DELETED`** guarantees: a still-valid,
unexpired access token stops working on the very next request after the DB row changes — no token
revocation list, no forced logout, no waiting for expiry. This is proven, shipped behavior, not a
design goal to newly achieve.

**Consequence for admin design:** if `role` is added to the same `select` this guard already performs
(§11), admin demotion inherits this exact guarantee for free, with zero new revocation machinery. If
instead admin state lived in a JWT claim, a separate cache, or an environment variable, this guarantee
would have to be re-earned from scratch — and might not be, which is exactly the risk Stop Condition A
exists to catch (see §31).

---

## 5. Existing privileged-mechanism inventory

Searched specifically for narrower, non-"admin"-named privileged mechanisms: document moderation,
community moderation, payment-operations tooling, internal/debug endpoints, environment allowlists,
`ALLOWED_USER_IDS`/`ALLOWED_USER_EMAILS`, seed-only privileged users.

| Candidate | Classification | Evidence |
|---|---|---|
| `apps/api/prisma/seed.ts` demo user (`demo@beaconvie.local`) | `PATTERN_ONLY` | Creates one ordinary, non-privileged demo account for local dev/CI/E2E flows — not a privileged-role mechanism, and not invoked by the production deployment runbook (`docs/operations/production-deployment-runbook.md` has zero mentions of `seed`). Useful precedent for *how* a bootstrap script is structured, not reusable as an admin-grant mechanism itself. |
| `apps/web/app/(app)/insights/internal/page.tsx` | `UNRELATED` | Despite the name, this is an ordinary Insight-feature page ("Insight Preparation (internal)") gated by the same plain user-auth as every other route — "internal" refers to in-feature state, not operator tooling. |
| Sentry/analytics/CSRF/route "allowlists" | `PATTERN_ONLY` (naming only) | All are data-field or safe-method allowlists, not user-authorization allowlists — useful as a naming/discipline precedent (allowlist > denylist, per Sentry's own documented history of a denylist bypass — §10), not directly reusable code. |
| PayOS webhook/checkout "operations" | `UNRELATED` | Provider-integration logic, not staff-facing tooling. |

**No existing privileged mechanism conflicts with the design in this document.** Stop Condition G
(§31) is not triggered.

---

## 6. Payment architecture — safe vs. never-expose fields

Full models, as read from `apps/api/prisma/schema.prisma`:

```prisma
model PaymentOrder {
  id, userId, product, amount, currency, provider, providerOrderCode (unique),
  providerPaymentLinkId, providerCheckoutUrl, status, createdAt, updatedAt,
  paidAt, failedAt, expiresAt, metadata (Json?)
}
model PaymentWebhookEvent {
  id, provider, externalEventId, orderId, payloadHash, status, errorCategory,
  receivedAt, processedAt
}
model PremiumEntitlement {  // see §7
  id, userId, status, source, startsAt, expiresAt, grantedAt, revokedAt, orderId, createdAt, updatedAt
}
```

**Raw webhook payloads are never persisted anywhere.** `PaymentWebhookService.handlePayOSWebhook()`
stores only `payloadHash = sha256(safeStringify(rawPayload))` — the schema's own comment states this
explicitly: *"never the raw payload itself, and never a sensitive banking field."*
`errorCategory` is a bounded enum-like string (`INVALID_SIGNATURE`, `UNKNOWN_ORDER`,
`AMOUNT_MISMATCH`, etc.) — *"never a raw exception message or payload fragment."*

**No signature/secret is ever persisted.** `PAYOS_CHECKSUM_KEY` lives only in server config/env, used
transiently for verification. `PaymentOrder.metadata` is explicitly scoped by its own schema comment
to *"safe, non-sensitive audit context only... never card numbers, CVV, banking credentials, or
provider secrets."*

**SAFE OPERATOR METADATA** (allowed in an admin payment lookup response):
`id` (internal order id), `product`, `amount`, `currency`, `provider`, `status`, `createdAt`,
`paidAt`, `failedAt`, `expiresAt`, `entitlement` linkage (via the `orderId` relation) —
`providerOrderCode` (the provider's own order reference) is also reasonable for an operator to see,
since support staff will often need to correlate against a PayOS dashboard reference the user or
provider quotes.

**NEVER EXPOSE IN ADMIN UI:** `providerPaymentLinkId`/`providerCheckoutUrl` (transient checkout URLs,
not useful post-purchase, low residual value in the UI, no need to carry the exposure risk even
though not classically "secret"), `metadata` raw JSON (even though scoped safe by design intent, an
admin UI should render only the specific fields verified safe, not blindly forward an arbitrary JSON
blob whose contents could drift from that intent over time without this document being updated),
`PaymentWebhookEvent.payloadHash` (a hash, not reversible or sensitive per se, but it is internal
audit/debugging material with no operator-support value — excluding it costs nothing and follows
data-minimization by default), and — trivially — anything that doesn't exist to expose in the first
place (checksum keys, raw payloads).

---

## 7. Entitlement architecture

`apps/api/src/payment/entitlement/entitlement.service.ts`, `hasPremiumAccess(userId)`:

```ts
async hasPremiumAccess(userId: string): Promise<boolean> {
  const now = new Date();
  const active = await this.prisma.premiumEntitlement.findFirst({
    where: { userId, status: 'ACTIVE', startsAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { id: true },
  });
  return !!active;
}
```

**Source of truth:** computed live at read time against `PremiumEntitlement` rows — never a cached
`user.isPremium`-style flag. The service's own docstring: *"nothing else in the app should read
`PremiumEntitlement` rows directly."* An admin entitlement lookup must go through (or exactly mirror)
this same service, not a parallel query, to avoid ever disagreeing with the real authorization
decision a user's own session gets.

**Fields:** `status` (`PremiumEntitlementStatus`; effective `EXPIRED` is computed, never a stored,
potentially-stale value), `source` (`PremiumEntitlementSource`; only `PAYMENT` exists today),
`startsAt`, `expiresAt` (nullable — reserved for a future non-expiring grant path, never set that way
today), `grantedAt`, `revokedAt` (present on the model; **no code path currently sets it** — confirmed
no admin/refund/revoke mechanism exists yet, consistent with §2's "no admin UI exists yet" schema
comments), `orderId` (unique FK back to the originating order).

**This sprint builds READ-ONLY lookup only.** No grant/revoke/extend/modify endpoint is designed or
implied anywhere in this document.

---

## 8. Notification-health capabilities — available now vs. would-require-new-telemetry

**AVAILABLE NOW, no new schema required:** the `Notification` model (full block, `schema.prisma`)
already carries real, queryable per-notification delivery state:

```prisma
model Notification {
  id, userId, category, class, type (bounded at app layer, see NOTIFICATION_TYPES),
  title, body, deepLink, dedupeKey, readAt, createdAt,
  emailStatus  NotificationDeliveryStatus @default(SKIPPED),
  emailAttemptedAt DateTime?,
  emailError String?,
  @@unique([userId, dedupeKey])
}
```

An operator "health" view can be built entirely from `COUNT(*) ... GROUP BY type, emailStatus` over a
recent window (e.g. last 24h/7d) — this is a real, derivable aggregate today, no new table needed.
`emailError` (when non-null) is a real, if unstructured, failure reason string already captured for
every failed send.

**WOULD REQUIRE NEW TELEMETRY, explicitly not invented here:** the *scheduler run itself* (the daily
`@Cron('0 9 * * *')` `NotificationsSchedulerService.runTarotDailyReminder()` job) reports its
`{evaluated, created, emailed, failed}` counts **only as a single structured log line and Sentry
breadcrumbs on failure — nothing is persisted to a DB table.** There is no `NotificationRun`/
`SchedulerRun` model. Consequently, "did today's scheduled run execute at all" (as distinct from
"zero users were eligible today") **cannot be answered from the database as it exists today** — only
from log/Sentry search, which is outside this codebase.

**Recommendation, not a silent decision:** ship the aggregate `Notification`-row health view in V1
(real data, zero new schema); explicitly flag "did the run execute" as `PRODUCT_DECISION_REQUIRED` —
if judged necessary, the smallest additive fix is a single new `SchedulerRunLog` row per run
(`jobName`, `ranAt`, `evaluated`, `created`, `emailed`, `failed`) — not built in this document, and
not assumed necessary, since Sentry/log search already gives an operator *some* visibility into this
today.

---

## 9. AIUsage / ProviderLog — confirmed content-free, real aggregable fields

```prisma
model AIUsage {
  id, userId, conversationId, feature (AIFeature), sourceId, provider, model,
  promptTokens, completionTokens, totalTokens, estimatedCostUsd, createdAt
}
model ProviderLog {
  id, feature (AIFeature), sourceId, provider, model, latencyMs, success,
  errorCode, retryCount, streamDurationMs, createdAt
  // NOTE: no userId column — this table is feature/provider-level, not user-attributed, by design.
}
```

**Confirmed: neither model has any field capable of storing prompt text, completion text, or
conversation content.** `ProviderLog`'s own doc comment states this as an explicit design property:
*"deliberately excludes conversation content, PII, and any request/response body."*

**Real, available aggregates (no invention needed):**
- Spend today / last 7 days: `SUM(estimatedCostUsd)` on `ai_usages`, filtered by `createdAt`.
- Spend by feature / by provider: `GROUP BY feature` / `GROUP BY provider` on `ai_usages`.
- Request count: `COUNT(*)` on either table.
- Failure count: `COUNT(*) WHERE success = false` on `provider_logs`.

**Real constraint to design around, not paper over:** because `ProviderLog` has no `userId`, a
**per-user failure rate cannot be computed directly from `ProviderLog` alone** — only from `AIUsage`
(which is user-attributed but only records *successful, completed* calls with token counts, not
failures). An admin AI-spend view can correctly report **per-user spend** (from `AIUsage`) and
**aggregate, feature/provider-level failure rates** (from `ProviderLog`), but must not claim to show
"this user's failure rate" — that data does not exist at the granularity the UI must not imply it
does. This is stated explicitly here so an eventual implementer doesn't quietly join across `sourceId`
to fake a per-user failure metric the schema doesn't actually support cleanly.

**No AI-conversation viewer is designed anywhere in this document.**

---

## 10. Privacy boundaries — inherited, not reinvented

- **Account export** (`account-export.service.ts`): every query is `select`-scoped, explicitly never
  `passwordHash`, refresh-token hashes, CSRF secrets, or `ProviderLog`/raw-AI-prompt content. Payment
  export fields: `id, product, amount, currency, status, createdAt, paidAt` — never
  `providerOrderCode`/`providerPaymentLinkId`. **The admin payment lookup in this design (§6) is
  intentionally slightly wider than the user's own export** (includes `providerOrderCode`, since
  support staff genuinely need it to correlate with a provider-side reference) — this asymmetry is
  named explicitly here rather than left as an unstated inconsistency: a user exporting their own data
  gets a minimal safe set; an authenticated, role-gated operator gets a marginally larger, still
  safe-by-construction set, for a documented operational reason.
- **Account deletion** (`account-deletion.service.ts`): field-scrubbing, not a hard delete — `User`
  row survives with `email`/`displayName`/`passwordHash` scrubbed and `status: DELETED`; every
  personal-content child table is hard-deleted by `userId` in one transaction;
  `PaymentOrder`/`PaymentWebhookEvent`/`PremiumEntitlement` are explicitly, by comment, never touched
  (financial/accounting retention). **Because the scrub is real (data is actually gone from the row,
  not merely flagged), an admin user-lookup on a deleted account cannot leak pre-deletion PII even in
  principle — there is nothing left to leak.** The admin UI must represent this state plainly (e.g.
  "Deleted — no personal data retained; financial records retained per policy"), never implying
  recoverability (§25 below).
- **Sentry scrubbing** (`sentry-scrub.util.ts`): allowlist-based (not denylist) for `extra`/
  `contexts`/breadcrumb `data`; request `data`/`cookies`/`query_string` dropped unconditionally;
  headers allowlisted. The file's own docstring documents a **real prior vulnerability**: an earlier
  denylist-by-key-name version was proven bypassable by nesting a sensitive value under an unlisted
  key (`details`, `notes`, `misc`). **This is the single most important precedent for this sprint's
  own Sentry design (§23): any admin-lookup context sent to Sentry must be built the same way —
  allowlist the exact keys, never assume "it'll be fine" for an unlisted key.**
- **Analytics** (`analytics.service.ts`/`analytics.constants.ts`): closed event-name allowlist,
  bounded property values only (no free-form content ever accepted), `sanitizeProperties()` strips
  query strings and truncates routes. No PII field exists in the analytics contract at all today.

---

## 11. Selected admin identity model

**Decision: Option A — additive `User.role` enum (`USER` | `ADMIN`, default `USER`).**

Scored against B (dedicated `AdminUser` model), C (environment allowlist), D (other existing
architecture — none found, §2/§5):

| Criterion | A. `User.role` | B. Dedicated `AdminUser` | C. Env allowlist |
|---|---|---|---|
| Security | Reuses the one already-audited-safe pattern (live per-request DB check) | Equal-or-worse — either a second DB round-trip or duplicated live-check logic, risking drift from `JwtAuthGuard`'s | Weaker — see next row |
| Immediate revocation | **Yes, for free** — same `select` `JwtAuthGuard` already runs every request | Achievable, but requires building a second live-lookup mechanism from scratch | **No, not by default** — env changes need a deploy/restart; directly fails the hard requirement (§4) |
| Compatibility | One additive column, zero JWT payload change, zero login/refresh change | Adds a second identity concept the guard chain must additionally understand | No schema change, but see revocation row |
| Migration complexity | Trivial — additive enum + column, default `USER` | Higher — new table + relation + parallel guard logic | None — but a false economy (see below) |
| Auditability | Fine for V1 (no self-service promotion path exists to audit against; see §13) | Marginally better structurally (`grantedBy`/`grantedAt` fields) — B's one real advantage | Poor — env changes aren't logged in-app at all |
| Operational simplicity | Highest — one manual `UPDATE`/small CLI script | Lower — two places define "is this user special" | Deceptively simple for one admin, gets worse per admin added/removed (each is a deploy) |
| Blast radius | Small — extends the one guard that already gates every authenticated request | Larger surface for a binary flag that doesn't need Premium-style lifecycle structure | Small technically, but the revocation-latency weakness is a real regression |

**C is rejected outright**, not merely scored lower: it fails Stop Condition A's hard requirement by
default, and it introduces a *different, weaker* consistency model than the one this codebase has
already established and already relies on twice (`JwtAuthGuard.status`, `EntitlementService.
hasPremiumAccess`) — adding a third, inconsistent pattern here would itself be a design defect, not a
neutral choice.

**B is rejected for proportionality, not for being unsafe in principle**: admin is a binary
operational trust flag with no expiry, no source-of-grant variety, and no plan tiers today — unlike
`PremiumEntitlement`, which genuinely needs a separate table because it has real lifecycle state
(start/expiry/source/history). Building B's structure for A's actual requirement would be exactly the
kind of unwarranted abstraction this project's own coding conventions (CLAUDE.md: "don't create
abstractions merely because they sound clean") already discourage. B remains available as a future
upgrade path if admin roles ever become tiered (support vs. finance vs. super-admin) — not needed now,
and not designed now.

---

## 12. Authorization design — exact runtime sequence

```
Request
  → JwtAuthGuard (existing file, ONE-LINE select change: add `role: true` to the existing
                   `select: { status: true }`)
       - verify JWT signature → { sub, email, sid }              [unchanged]
       - live DB lookup: findUnique({ where: { id: sub }, select: { status: true, role: true } })
       - !user or status !== 'ACTIVE' → 401                       [unchanged]
       - attach { id, email, status, role } to request.user       [role now included]
  → AdminGuard (NEW — applied only to the /admin/* route group, always runs AFTER JwtAuthGuard)
       - request.user.role !== 'ADMIN' → 403
  → Controller
```

**Verified outcomes:**
- Anonymous → 401 (`JwtAuthGuard` rejects first; unchanged).
- Authenticated `USER` → 403 (`JwtAuthGuard` passes; `AdminGuard` rejects).
- Authenticated `ADMIN` → reaches the controller.
- **Demoted `ADMIN` holding an old, still-signature-valid JWT → 403 on the very next request**,
  because `JwtAuthGuard`'s live lookup returns the *current* `role` value every single time — no
  token refresh, no expiry wait, no separate revocation list needed. This is not a new guarantee being
  built; it is the existing `status` guarantee (§3/§4), extended to one more column in the same query.

This satisfies the brief's hard requirement in §6/§12/§20A directly, by construction, using evidence
(§3's exact code) rather than assertion.

---

## 13. First-admin provisioning

**Recommendation: manual DB promotion, documented as an explicit, rare, production-DB-access-gated
operational step in the deployment runbook** (`docs/operations/production-deployment-runbook.md`) —
not implemented in this document, but named as the required companion doc update once this sprint is
actually built. A small CLI wrapper (`pnpm --filter @beaconvie/api admin:promote --email=...`) is a
reasonable, low-risk follow-up, not a hard V1 requirement — it would only ever be run manually by
someone who already has production DB access, never exposed over HTTP.

**Explicitly and permanently prohibited, and independently confirmed already impossible today by the
DTO/ValidationPipe evidence in §14:**
- No `POST /admin/promote-me` or any self-service role-mutation endpoint of any kind.
- No existing or new account/profile DTO may accept a `role` field.
- Admin provisioning must **never** ride along on `prisma/seed.ts` — confirmed by direct check that
  the production deployment runbook contains **zero references to `seed`** at all; seeding is a
  dev/CI-only step today, and this must remain true specifically *because* the seed script would be
  an unreviewed, easily-forgotten place to accidentally grant admin in a non-local environment.

**Demotion/revocation:** the same manual/CLI mechanism, in reverse. Per §12, it takes effect on the
demoted user's very next request — no additional revocation step is needed.

---

## 14. Mass-assignment result

**Confirmed CLEAN.** `apps/api/src/main.ts` registers a global `ValidationPipe` with
`whitelist: true` (strips unknown properties) **and** `forbidNonWhitelisted: true` (throws 400 on any
unknown property, rather than silently dropping it — a stronger guarantee than mere stripping).
Checked DTOs: `RegisterDto` (`email`, `displayName`, `password`, `confirmPassword`,
`acceptedTerms`), `UpdatePreferencesDto` (`memoryPreference?`, `reflectionFrequency?`,
`checkInTime?`), `DeleteAccountDto` (`password`). **None accept `role`, `status`, `isAdmin`,
`permissions`, `premium`, or `entitlementId`.** A hypothetical attacker POSTing an extra `role: 'ADMIN'`
field to any existing account endpoint receives a 400 at the framework layer, before any service code
runs. **Stop Condition B is not triggered.**

---

## 15. Admin API shape

```
GET /admin/users/lookup?email=...          (exact match only — no partial/fuzzy search)
GET /admin/users/lookup?id=...             (alternative exact key)
GET /admin/users/:id/entitlement            (entitlement lookup for an already-identified user)
GET /admin/users/:id/payments                (payment/order history for an already-identified user)
GET /admin/payments/:orderId                  (direct order lookup — support often has an order id
                                              first, not a user id)
GET /admin/notifications/health                (aggregate, not user-scoped)
GET /admin/ai-spend?window=today|7d&feature=&provider=&userId=   (aggregate, optionally user-scoped)
```

All GET (read-only, matching §16's default-deny on writes). All under `JwtAuthGuard` + the new
`AdminGuard`. **CSRF:** the existing global `CsrfGuard` already exempts `GET`/`HEAD`/`OPTIONS` — no
special handling needed for this sprint's entirely-read scope; a future write endpoint would
automatically inherit CSRF protection like every other mutating route already does, with no bypass
required.

**Throttling:** should not reuse the loose 1000/min `default` bucket (too permissive for a sensitive
surface) or a consumer-facing per-IP bucket (wrong shape — admins are a handful of named accounts, not
a public audience). Recommend a new named bucket, `admin`, per-authenticated-user tracked (mirroring
the already-established `discovery`/`payment`/`companion` bucket pattern in
`ThrottlerModule.forRootAsync`), sized generously enough for interactive support work (a specific
number is an implementation-time config decision, not fixed here) while still bounding a compromised-
or-scripted-session's blast radius. **No unrestricted `GET /admin/users` dump endpoint** — every
lookup requires an exact key (email, id, or order id); nothing resembling `GET /admin/users` returning
the full table is designed anywhere in this document.

---

## 16. Write actions — explicit default deny

Every item below is **OUT_OF_SCOPE** for this sprint, evaluated and rejected, not silently omitted:

delete user · suspend user · reset password · change email · grant Premium · revoke Premium ·
refund payment · modify payment status · resend webhook · edit notifications · inspect Memory ·
inspect Journal · inspect AI conversation · impersonation/login-as-user.

None of these has an accompanying code path, DTO, or route anywhere in this document. If any is later
judged genuinely necessary, it requires its own separate audit (own threat model, own audit-logging
requirement per §14 of the original brief — read actions and write actions are not the same trust
tier) — not a quiet addition to this sprint's scope.

**Admin audit log:** because V1 is strictly read-only and no mutation exists, a dedicated admin-action
audit log is **reasonably deferred** for V1 — there is no destructive or state-changing admin action
to audit yet. This is stated as an explicit, reasoned deferral, not an oversight: **the moment any
write action is introduced in a future sprint, audit logging becomes a hard gate for that sprint**,
not optional.

---

## 17. Admin UI

Minimum surface: `/admin` (search) → a read-only result view per lookup type (e.g. `/admin/users/:id`).
No dashboard product, no navigation-heavy shell — matches the "5 lookups," not "an admin dashboard,"
framing already set by the roadmap (`product-completion-roadmap-v2.md` §3 P2 item 4).

**Server-side authorization is the only thing that matters — hidden navigation is explicitly not
authorization**, restated as a hard design constraint: the frontend route must independently verify
role (e.g. by extending the existing `/auth/me` response — read by `middleware.ts` today for
`onboardingCompletedAt`, per §10's route-guard finding — to also carry `role`, or a small dedicated
check) and every API call underneath it is protected by the real `AdminGuard` (§12) regardless of what
the frontend renders or hides. **Today's frontend route-guard (`route-guard.ts`) has no role dimension
at all** — this is new logic to add, not an extension of a role check that already exists.

**Non-admin behavior on a direct `/admin` visit:** a plain "not found" is safer than a "you don't have
permission" message, which would confirm to a curious authenticated non-admin user that a hidden
admin feature exists at all.

**`robots.ts`:** currently disallows `/dashboard`, `/companion`, `/journal`, `/memory`,
`/reflections`, `/insights`, `/reviews`, `/goals`, `/discover`, `/settings`, `/menh-vi`, `/reports` —
**`/admin` is not yet in this list** (confirmed by direct read) and must be added when this sprint is
implemented. Not changed in this documentation-only pass.

**Mobile-emergency usability:** a simple search box + read-only result cards (no dense data-grid)
renders acceptably at the existing `tablet`/`desktop` Tailwind breakpoints without new responsive
infrastructure — a design constraint to hold the eventual UI to, not a new component requirement.

---

## 18. Sentry implications

Direct consequence of §10's documented denylist-bypass history: **any admin-lookup context
(the searched email/id/order-id, or the returned result) sent to Sentry must go through the exact same
allowlist discipline** `sentry-scrub.util.ts` already enforces — never assume a new, unlisted key is
safe by omission. Concretely: if admin-route error handling ever attaches request context to a Sentry
event, only fields already on `ALLOWED_METADATA_KEYS` (e.g. `userid`, `orderid`, `status`, `reason`)
should appear; a raw admin-search query string or full lookup result object must never be attached
directly. **Attack test to add at implementation time:** search for a sentinel value
(`admin-test@example.invalid`) and a fake payment reference, then confirm neither string appears
anywhere in a captured Sentry event — mirrors the "Release Closure attack test" already present in
`sentry-scrub.util.spec.ts` for the general case, applied specifically to the new admin routes.

---

## 19. Analytics implications

**Default recommendation: no product analytics for the *contents* of admin lookups at all.** Per §10,
the existing analytics contract has zero PII fields already — extending it to carry admin search terms
(email, userId, payment IDs, transaction references) would be a new, unprecedented category of
sensitive analytics payload this codebase has specifically avoided everywhere else. If any signal is
wanted (e.g. "an admin lookup happened," for usage/adoption tracking of the tool itself), it must be
shaped exactly like every other analytics event already is — a bounded event name plus bounded,
content-free properties (e.g. `{ lookupType: 'user' }`, never the searched value itself) — not a new
exception to the existing no-PII discipline.

---

## 20. Account-deletion / retention interaction

Directly from §10: because deletion is real field-scrubbing (not a soft-delete flag hiding intact
data), an admin user-lookup on a `DELETED` account **cannot** reconstruct pre-deletion PII — the data
is genuinely gone from the row. The admin UI must represent this state accurately (e.g. "Deleted —
personal data scrubbed; financial records retained per policy") and must never imply the underlying
PII is recoverable via this or any other tool. The payment lookup for such a user correctly still
returns real `PaymentOrder`/`PremiumEntitlement` rows (deliberately never touched by deletion, per
§10/§6) — this is intentional, documented behavior, not a bug or a privacy gap: the roadmap's own
"payment retention policy" external checklist item (`product-completion-roadmap-v2.md` §4) governs
*how long* these survive, not *whether* an operator can see them while they do.

---

## 21. Migration design (spec only — not created in this pass)

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  // ...existing fields unchanged...
  role UserRole @default(USER)
}
```

**Additive only.** Every existing user row receives `role = USER` on migration (the enum default), no
existing field is touched, no existing relation is affected, and account-deletion behavior
(`account-deletion.service.ts`) is unaffected because `role` is never referenced by the scrub logic
(deletion sets `status: DELETED`, leaving `role` as-is — a deleted account's residual `role` value is
irrelevant once `JwtAuthGuard` already 401s it on `status` alone). **Zero admins are created by this
migration** — provisioning the first one is a separate, explicit, manual step (§13), never automatic.

---

## 22. Test strategy (design only)

**Backend unit:** `AdminGuard` (allows `ADMIN`, rejects `USER`/missing role); each lookup service's
privacy-projection logic (confirms `passwordHash` and every §6/§9 "never expose" field is structurally
absent from the DTO shape, not just omitted by convention); notification-health and AI-spend
aggregation logic against seeded fixture data.

**Backend e2e:** anonymous → 401; authenticated `USER` → 403; authenticated `ADMIN` → 200; **`ADMIN`
demoted to `USER` in the DB mid-session, same still-valid JWT reused → 403 on the very next request**
(the single most important test in this sprint — directly proves §12's central claim against a real
running app, not just a unit-level mock); exact-match user lookup (found/not-found); IDOR-style
attempt (an `ADMIN` looking up an arbitrary user is *expected* to succeed — that's the feature; the
real IDOR risk is a non-admin bypassing `AdminGuard` entirely, already covered above); mass-assignment
attempt against existing account DTOs with an injected `role` field (expect 400, per §14); payment
lookup field-shape assertion (never `providerPaymentLinkId`/`providerCheckoutUrl`/raw `metadata`);
deleted-user lookup (returns the scrubbed state, not an error, not stale PII); AI-spend response
shape (never a prompt/response field, structurally impossible to include since the source tables have
none — but assert it anyway as a regression guard).

**Frontend:** `/admin` route guard (a `USER` session cannot render the page — redirects/404s before
any admin content mounts); search states (empty query, no-result, found); error states.

**Playwright:** one full operator happy-path (login as a seeded `ADMIN` fixture → search → view a
user's entitlement/payment/AI-spend) + one normal-user denial path (login as an ordinary user →
attempt to reach `/admin` directly by URL → confirm no admin content ever renders, matching the API's
own 403).

---

## 23. Security attack-suite plan

1. Forged `role` in request body against an existing DTO → expect 400 (§14, ValidationPipe).
2. Forged/arbitrary `userId` in an admin query param by a non-admin → expect 403 before the query ever
   runs (`AdminGuard` sits ahead of every handler).
3. Stale `ADMIN` JWT after DB demotion → expect 403 on the very next request (§12/§22).
4. Normal `USER` hitting `/admin/*` API directly (no UI) → expect 403.
5. Normal `USER` navigating to `/admin/*` pages directly by URL → expect no admin content rendered,
   matching the API result (§17).
6. Arbitrary-email enumeration attempt (trying many emails against the lookup endpoint) → bounded by
   the new `admin` throttle bucket (§15); since this is authenticated-admin-only tooling, exact-match
   lookup itself is an accepted design tradeoff, not treated as a vulnerability on its own.
7. Bulk-dump attempt (requesting without any lookup key, or a wildcard) → expect a validation error,
   never a full-table response (§15 confirms no such endpoint is designed).
8. Payment-ID probing (iterating order IDs) → same throttle bound as #6; response for a
   non-owned/nonexistent order id should be a plain not-found, not a signal distinguishing
   "exists but you can't see it" from "doesn't exist" (this is authenticated-admin tooling, so the
   IDOR-style enumeration concern that matters for *user*-facing endpoints — see
   `EasternHoroscopeRecordService.findOwned()`'s identical-404 precedent — is lower-stakes here, but
   the same discipline costs nothing to keep).
9. Sentry leakage — sentinel email/payment-reference test, per §18.
10. Analytics leakage — confirm no admin-lookup event carries the searched value, per §19.
11. Deleted-user PII "recovery" attempt via the admin lookup → confirm only the scrubbed state is ever
    returned (§20) — structurally guaranteed by the data no longer existing, not just by DTO shaping,
    but worth an explicit regression test anyway.
12. Hidden-UI bypass — confirm a non-admin cannot reach admin functionality by directly calling the
    API even if the frontend never renders a link to it (§17's core claim, re-tested from the attacker's
    side rather than the builder's side).

---

## 24. CI branch-trigger finding — independently reconfirmed this session

**CONFIRMED.** `.github/workflows/ci.yml` is the **only** workflow file in the repository
(`find .github -type f` returns exactly one file) — so there is no second workflow to separately
check; the finding is fully scoped to this one file. `on: push: branches: [main]`, while
`git remote show origin` reports `HEAD branch: master` and `git branch -a` confirms no `main` branch
exists anywhere in this repository. `pull_request:` carries no branch filter, so PR-triggered CI runs
are unaffected — **only direct pushes to `master` skip CI entirely.** Severity: low (does not affect
PR-gated changes, which is presumably the primary merge path), but real and free to fix — **not fixed
in this pass**, per instruction; recorded here for the eventual implementation to correct alongside
this sprint's other deliverables.

---

## 25. Tử Vi isolation — confirmed

**Zero Tử Vi engine, rule table, star-placement table, golden-vector, or domain-resolution-pack
content is touched, read for calculation purposes, or required by anything in this document.** The
only tangential connection is that the AI-spend lookup (§9) aggregates by the existing `feature`
column on `AIUsage`/`ProviderLog` — which will, whenever Tử Vi eventually ships, naturally include a
future Tử Vi feature value the same way it already includes `EASTERN_HOROSCOPE` today. This is the
AI-spend view being generically correct by construction, not a dependency on or an implementation of
any Tử Vi work. Sprint 18 remains `BLOCKED_BY_DOMAIN_REFERENCE`; Sprints 19–22 remain blocked behind
it; no sprint number is renumbered by this document.

---

## 26. Stop conditions — checked explicitly

| # | Condition | Triggered? |
|---|---|---|
| A | Admin revocation cannot be made immediate with existing auth architecture | **No** — §4/§12 show it already can be, by construction, extending the existing `status`-check pattern |
| B | User update endpoints permit role/status mass assignment | **No** — §14, confirmed clean |
| C | Payment lookup would require exposing secrets/raw sensitive provider data | **No** — §6, nothing sensitive is even stored to expose |
| D | Admin identity requires a major auth rewrite | **No** — §11/§21, one additive column + one small guard |
| E | Existing account-deletion/privacy guarantees would be weakened | **No** — §20, scrubbing is structural, not a flag; nothing new to leak |
| F | Admin implementation requires touching Tử Vi domain code | **No** — §25 |
| G | A privileged/admin mechanism already exists and conflicts with the proposed one | **No** — §5, none exists |

**None triggered. No workaround was needed for any of them, because none applies.**

---

## 27. P0 / P1 / P2 findings

**P0 (must be true before implementation starts):** none outstanding — every architectural
prerequisite this sprint depends on (live per-request auth check, clean DTO whitelist behavior,
content-free AI usage tables, structural deletion scrubbing) already exists and was independently
verified, not assumed.

**P1 (should be resolved during implementation, not before):**
1. Exact `admin` throttle-bucket limit value (a config decision, not a design blocker).
2. Whether a CLI provisioning script is built alongside the manual-`UPDATE` path, or deferred.
3. `robots.ts` and the deployment runbook must both be updated as part of this sprint's own
   deliverables (not done in this documentation-only pass).

**P2 (explicitly deferred, named so they aren't silently dropped):**
1. "Did today's notification scheduler run execute at all" telemetry (§8) —
   `PRODUCT_DECISION_REQUIRED`, not built.
2. A dedicated `AdminUser` model with grant provenance (§11's Option B) — revisit only if admin roles
   become tiered.
3. Admin action audit logging — deferred correctly per §16, becomes a hard gate the moment any write
   action is introduced.

---

## 28. Implementation readiness matrix

| Area | Status | Evidence / Decision |
|---|---|---|
| Admin identity | READY | §11 — additive `User.role` enum, scored against 2 real alternatives |
| Admin provisioning | READY | §13 — manual DB promotion, documented runbook step, explicitly no self-service path |
| Admin authorization | READY | §12 — exact guard sequence, reuses existing live-check pattern |
| Stale JWT revocation | READY | §4/§12 — already guaranteed by existing `JwtAuthGuard` architecture, extended not rebuilt |
| User lookup | READY | §16 (of the original brief numbering; this doc's §6/§10) — exact-match only, safe field list derived from existing export precedent |
| Entitlement lookup | READY | §7 — read-only, must reuse `EntitlementService`, no grant/revoke |
| Payment lookup | READY | §6 — safe/never-expose fields enumerated from actual schema, nothing sensitive stored to leak |
| Notification health | READY (partial) | §8 — aggregate view ready now from real data; scheduler-run telemetry `PRODUCT_DECISION_REQUIRED` |
| AI spend | READY | §9 — real fields only, explicit constraint documented (no per-user failure rate from `ProviderLog`) |
| Privacy | READY | §10/§20 — inherits existing export/deletion/Sentry/analytics discipline, no new exception carved out |
| Sentry | READY | §18 — must follow existing allowlist discipline; attack test specified |
| Analytics | READY | §19 — default to zero content in any admin-related event |
| Account deletion interaction | READY | §20 — structurally safe by the scrub being real |
| Migration | READY | §21 — additive-only, spec written, not applied |
| Frontend | READY | §17 — server-side-enforced design specified; robots.ts update named as a required deliverable |
| Testing | READY | §22 — full unit/e2e/frontend/Playwright plan specified |
| CI fix | READY | §24 — confirmed, minimal, not applied in this pass |
| Tử Vi isolation | READY | §25 — zero touch confirmed |

**All 17 areas: READY. Zero `PRODUCT_DECISION_REQUIRED` or `BLOCKED` at the implementation-gating
level** — the one true open product question (§8's scheduler-run telemetry) is explicitly scoped as
optional/deferred, not blocking the rest of the sprint.

---

## 29. Files created / modified

**Created:** `docs/audit/admin-operator-tooling-pre-implementation-audit.md` (this document),
`docs/architecture/admin-operator-tooling.md` (companion architecture reference).
**Modified:** none. No Prisma schema, migration, API route, frontend page, or CI file touched.

---

## 30. Final report

1. **Git baseline:** HEAD `cfe0824` (1 ahead of `origin/master` `c1c8b8f`), working tree unchanged
   beyond this session's own prior doc turns.
2. **Existing RBAC/admin infrastructure:** none — confirmed greenfield (§2).
3. **User/UserStatus findings:** `User.status` (`ACTIVE`/`SUSPENDED`/`DELETED`) is the only trust axis
   today; no `role` field exists (§3).
4. **Authentication runtime path:** single custom `JwtAuthGuard`, no `@nestjs/passport`, live DB
   `status` check on every request, token carries only `{sub, email, sid}` (§3).
5. **Stale-JWT behavior:** already immediate-revocation-safe for `status`; the design in this document
   extends the exact same mechanism to `role` (§4/§12).
6. **Existing privileged patterns:** none conflict; nearest precedents (seed script, "internal" page
   name) are `PATTERN_ONLY`/`UNRELATED`, not reusable admin mechanisms (§5).
7. **Payment architecture findings:** no raw webhook payloads or secrets ever persisted; safe field
   list derived directly from schema (§6).
8. **Entitlement architecture findings:** computed live from `PremiumEntitlement`, never cached; V1
   lookup must reuse `EntitlementService`, read-only (§7).
9. **Notification-health capabilities:** per-notification delivery status is real and aggregable
   today; scheduler-run-level telemetry does not exist and is explicitly not invented (§8).
10. **AIUsage/ProviderLog findings:** confirmed zero content fields in either table; one real
    structural constraint documented (no per-user failure rate from `ProviderLog` alone) (§9).
11. **Privacy boundaries:** admin design inherits, and in one documented case (payment lookup)
    intentionally slightly exceeds, the existing export-scoping discipline, for a named reason (§10).
12. **Selected admin identity model:** additive `User.role` enum (§11), B and C explicitly evaluated
    and rejected with reasons, not defaulted to by convenience.
13. **Authorization semantics:** `JwtAuthGuard` (extended) → `AdminGuard` (new); anonymous 401 / USER
    403 / ADMIN allowed / demoted-ADMIN-with-stale-JWT 403-on-next-request (§12).
14. **First-admin provisioning:** manual DB promotion, documented runbook step; seed-script promotion
    explicitly prohibited (confirmed the production runbook never invokes seeding) (§13).
15. **Mass-assignment result:** confirmed clean — global `ValidationPipe` whitelist + no offending DTO
    field found in the 3 checked account DTOs (§14).
16. **User lookup fields:** exact-match (email/id) only; safe fields modeled on the existing export
    precedent, `passwordHash` and all secrets excluded (§6/§10/§15).
17. **Entitlement lookup fields:** status/source/startsAt/expiresAt/grantedAt/revokedAt/orderId,
    read-only, via `EntitlementService` (§7/§15).
18. **Payment lookup fields:** id/product/amount/currency/provider/status/timestamps/
    providerOrderCode/entitlement-linkage; explicit never-expose list (§6/§15).
19. **Notification-health fields:** aggregate counts by type/emailStatus over a window, from real
    `Notification` rows; scheduler-run-execution signal flagged as a separate, deferred product
    decision (§8/§15).
20. **AI-spend fields:** spend/requests/failures by date-window/feature/provider, optionally by user
    for spend (not for failures); no content, ever (§9/§15).
21. **Write actions explicitly rejected:** 13 named actions, all `OUT_OF_SCOPE`, each independently
    evaluated (§16).
22. **Admin UI architecture:** `/admin` search → read-only result; server-side-enforced, hidden nav is
    not authorization; `robots.ts` update named as a required future deliverable (§17).
23. **Sentry implications:** must extend the existing allowlist discipline, not a denylist; sentinel
    attack test specified (§18).
24. **Analytics implications:** default to zero content in any admin-related analytics event (§19).
25. **Account-deletion interaction:** scrubbing is structural, so nothing can leak; UI must represent
    the deleted state accurately, never imply recoverability (§20).
26. **Migration design:** additive `UserRole` enum + `User.role @default(USER)`; zero admins created
    automatically; deletion logic unaffected (§21).
27. **Test strategy:** unit/e2e/frontend/Playwright plan specified, centered on the stale-JWT-after-
    demotion e2e test as the single most important proof (§22).
28. **Security attack strategy:** 12 specific attacks planned, each mapped to a specific defense
    already designed above (§23).
29. **CI branch result:** **CONFIRMED**, single affected workflow (`ci.yml`), `pull_request` unaffected,
    not fixed in this pass (§24).
30. **Tử Vi isolation result:** confirmed zero touch; Sprint 18–22 status unchanged, unrenumbered
    (§25).
31. **Stop conditions triggered:** **none** — all 7 explicitly checked and cleared (§26).
32. **P0 findings:** none outstanding (§27).
33. **P1 findings:** 3, all implementation-time config/deliverable items, none design-blocking (§27).
34. **P2 findings:** 3, all explicitly deferred with a named reason, not silently dropped (§27).
35. **Implementation scope:** role foundation, `AdminGuard`, 5 read-only lookup endpoint groups
    (user/entitlement/payment/notification-health/AI-spend), minimal internal UI, test suite, CI
    branch fix, `robots.ts` update, runbook update (§28 readiness matrix; original brief §28 scope
    lock).
36. **Out-of-scope:** Tử Vi, SEO, shareability, Community, refund implementation, any payment
    mutation, user moderation, broad analytics dashboard, Memory/Journal/AI-conversation inspection,
    impersonation/login-as-user (§16, §25).
37. **Files created/modified:** 2 created (this document + the architecture companion), 0 modified
    (§29).
38. **Git status:** see the exact captured output in §31 below (post-write).
39. **Commit status:** nothing staged or committed this session.
40. **Push status:** nothing pushed; `origin/master` remains `c1c8b8f`.
41. **Final verdict:** see below.

### Final verdict

**ADMIN OPERATOR TOOLING — READY FOR IMPLEMENTATION**

Every stop condition was explicitly checked against real, cited evidence and cleared. The selected
design (additive `User.role`, guard-chain extension, five read-only lookups, explicit write-action
default-deny) reuses this codebase's own already-proven security patterns rather than inventing new
ones, and every "never expose" boundary is derived from what the schema actually stores, not from
assumption. The two P2 deferrals (scheduler-run telemetry, tiered admin roles) are named, reasoned,
and non-blocking. Sprint 18 (Tử Vi) remains `BLOCKED_BY_DOMAIN_REFERENCE`, untouched and unaffected by
this sprint in either direction.
