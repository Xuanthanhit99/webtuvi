# Notification & Retention Foundation (Sprint 11)

Status: Implemented. Selected by `docs/audit/sprint-11-pre-implementation-audit.md` (the only
unshipped V1-tier Product Bible module — Module 19). This document is the design record every
code comment in `apps/api/src/notifications/` points back to.

## 1. Why this exists, and what it deliberately is not

The Sprint 11 audit's central finding: no proactive return mechanism existed anywhere in the
product — zero scheduled jobs, zero push, zero re-engagement email. This module closes that one
gap, narrowly. It is not a marketing automation platform, not an engagement-optimization engine,
and does not use AI to decide anything. Every design choice below traces back to Product Bible
Module 19's standing creed: *"Every notification should have a reason. Every reminder should have
meaning. Silence is better than interruption. Trust is worth more than attention. The best
notification is often the one never sent."*

## 2. Architecture

```
Product Event / Scheduled Evaluation
            |
Notification Eligibility   (deterministic facts only — TarotDailyReminderEligibilityService)
            |
Preference / Consent       (NotificationPreferencesService — skipped entirely for TRANSACTIONAL)
            |
Deduplication               (DB-level @@unique([userId, dedupeKey]) inside NotificationsService.create)
            |
Notification record         (its existence IS the in-app delivery)
            |
Delivery channel
        /-------------\
     IN_APP          EMAIL   (NotificationDeliveryService, only for opted-in REMINDER / all TRANSACTIONAL)
```

Each stage has exactly one job and is a separate class — no stage reaches into another's
responsibility. `NotificationsService` has no opinion about *whether* something is worth
notifying about; the eligibility engines have no opinion about *how* it's delivered.

## 3. Domain model

`Notification` and `NotificationPreference` (see `schema.prisma`, migration
`20260813180000_sprint11_notification_retention_foundation`). No separate `NotificationDelivery`
table: IN_APP delivery is the row's own existence; only EMAIL needs independent state, tracked
inline (`emailStatus`/`emailAttemptedAt`/`emailError`) since it's the only channel that can fail
on its own. A dedicated delivery table was considered and rejected as unwarranted complexity for
two channels, one of which has no failure mode of its own.

`category` (`SECURITY`/`PREMIUM`/`DISCOVERY`) and `class` (`TRANSACTIONAL`/`PRODUCT`/`REMINDER`)
are separate, both closed/native-enum taxonomies. `type` (e.g. `tarot.daily_reminder`,
`premium.activated`) is a free-text column bounded at the application layer
(`notifications.types.ts` `NOTIFICATION_TYPES`) rather than a native enum, so a new type can ship
without a migration — deliberately different from `category`/`class`, which are genuinely fixed
taxonomies.

## 4. Deliberately excluded types (and why)

- **Journal/Memory "you haven't thought about this" reminders** — no deterministic,
  non-speculative trigger exists in this codebase today. Inventing a "haven't engaged with X
  lately" heuristic is exactly the fabricated-reason pattern the brief and Module 19's creed both
  forbid.
- **Generic SECURITY notifications** (password changed, new device, etc.) — existing auth flows
  already email password-reset/verification directly (`MailService.sendPasswordResetEmail` etc.).
  Duplicating them as `Notification` rows would violate the brief's explicit "do not rebuild auth
  email flows unnecessarily." `SECURITY` remains a valid `category` (for the design honesty of
  `NotificationClass.TRANSACTIONAL`'s non-suppressible guarantee and Sprint 11 brief §24's Premium
  boundary), but has zero triggers this sprint.
- **PRODUCT class** — reserved for a genuinely future category (Reports-ready, Community reply)
  with no Sprint 11 trigger. No Settings toggle is exposed for it — a toggle controlling nothing
  yet would be confusing, dishonest UI.
- **Push, SMS, WhatsApp, Telegram** — explicitly out of scope (brief §5); no mobile app exists to
  make push meaningful, and adding channel infrastructure nobody can use yet is pure waste.

## 5. Preferences

`NotificationPreference` has exactly two fields: `reminderInApp` (default `true`) and
`reminderEmail` (default `false`, and only meaningful while `reminderInApp` is also `true` —
`reminderInApp` is the master switch for the entire REMINDER class; `reminderEmail` only
*amplifies* an already-created reminder onto the email channel). TRANSACTIONAL notifications
(`SECURITY`, `PREMIUM`) never consult this table at all — they are always created, and where email
applies, always sent, per Module 19 §6's "must not accidentally become suppressible" requirement.
The Settings UI intentionally does not expose a toggle for account/payment notices — a checkbox
that does nothing when unchecked would itself be a dark pattern.

## 6. Scheduler architecture

`@nestjs/schedule` is the one new npm dependency this sprint introduces — the smallest
production-suitable, in-process option consistent with this codebase (no BullMQ, no Redis queue,
no external cron service exists here today; see the Sprint 11 audit §19/§33). `ScheduleModule` is
registered once in `AppModule`.

**Cadence**: `@Cron('0 9 * * *')` — once daily, 09:00 UTC. Retention reminders do not need
second/minute precision (brief §11); a single fixed evaluation time is sufficient.

**Timezone**: a single, disclosed simplification — "today" means UTC-today for every user, not
their own local day, mirroring `TarotRecordService.assertNoDailyDrawToday`'s existing convention
exactly (`date-key.util.ts`). `UserProfile.timezone` exists but is optional and only populated
after a manual profile edit — not a reliable enough signal to schedule real per-user local-time
delivery against yet. This is a known, accepted limitation, not a silent gap.

**Duplicate-safety**: not a distributed lock (none exists in this codebase) but the same
DB-unique-constraint idempotency `PaymentWebhookEvent` already established — a re-run's `create()`
calls simply no-op via `@@unique([userId, dedupeKey])`.

**Restart-safety**: an in-process `@Cron` job does not persist "it already ran today." A process
restart near 09:00 UTC could skip that day's run entirely. Accepted as appropriate for a low-stakes
daily reminder at current scale (brief §10: "do not build distributed scheduling infrastructure
beyond current scale"), not solved with new infrastructure.

**Bounded work**: `TarotDailyReminderEligibilityService.findEligibleBatches` is cursor-paginated
(200 users/page), never a single unbounded table scan.

## 7. Initial retention events — what's actually implemented, and what's not

| Candidate (brief §8) | Implemented? | Reasoning |
|---|---|---|
| A. Daily Tarot available | **Yes** | Deterministic, reuses the exact "already drawn today" query `TarotRecordService` already uses; gated on genuine prior engagement (has drawn before) per Module 19 §4/§12 |
| B. Journal/Memory return reminder | **No** | No existing product behavior supports a non-speculative trigger — see §4 above |
| C. Payment/Premium status | **Yes, narrowly** | Only "Premium activated" (event-based, hooked into the existing, unmodified payment webhook). No email — the checkout return page already gives real-time confirmation |
| D. Security | **No trigger this sprint** | See §4 above |

## 8. Payment integration

`PaymentWebhookService.applyPaymentResult()` is unchanged in its actual grant/accounting logic; it
now also returns `{ granted: boolean }` so `handlePayOSWebhook()` can call
`NotificationsService.create()` **after** the transaction commits, never inside it — a
notification failure must never roll back a real entitlement grant. The notification call is
wrapped in `.catch()` at the call site: best-effort, logged, never propagated. Notification
creation never grants Premium, never changes payment status, and never reads redirect query
parameters — strictly downstream of already-authoritative payment state (brief §29).

## 9. Privacy

Notification titles/bodies are always generic and non-sensitive by construction — no journal
excerpt, no memory content, no chart/numerology detail ever appears in a title, body, email
subject, or log line. Both Sprint 11 notification types ("Today's card is ready", "Premium is
active") satisfy this by design, not by redaction after the fact.

## 10. Realtime

No WebSocket/generic SSE infrastructure exists in this codebase — Companion's SSE streaming is
tightly coupled, Companion-specific plumbing, not a reusable "live update" mechanism (confirmed by
direct code inspection during this sprint's reconnaissance pass). Per brief §23, this sprint does
not build new realtime infrastructure to achieve live badge updates: `NotificationBell` polls
`GET /notifications/unread-count` on a 60-second interval and refetches on window focus (React
Query's default). This is a deliberate, disclosed trade-off, not an oversight.

## 11. Rate limiting

**Corrected during Release Closure.** The implementation-time version of this section claimed
`NotificationsController` was "covered by the global default throttler" — that was wrong. This
codebase has no global `APP_GUARD` for `ThrottlerGuard` (only `CsrfGuard` is global); every named
throttler bucket is opt-in per route, exactly like `JournalExportController`/
`MemoryExportController`/`AccountExportController` already demonstrate. Without an explicit guard,
`NotificationsController`'s routes had **no rate limiting of any kind**. Fixed: `@UseGuards(
JwtAuthGuard, ThrottlerGuard)` + `@SkipThrottle({ auth: true, companion: true, 'companion-ip':
true, payment: true })` + `@Throttle({ default: { limit: 120, ttl: 60_000 } })` at the controller
level — explicitly isolated from every other feature's throttler budget, the same discipline
`f8fcba1` established for Auth vs. Companion. 120/min comfortably covers the unread-count badge's
60s polling plus normal interaction without being "absurdly low" for mark-read/read-all.

## 12. Frontend

`NotificationBell` (in `AppHeader`, visible on both desktop and mobile — the one shell element
that isn't breakpoint-exclusive) opens the existing `Dialog` primitive (native `<dialog
showModal()>`) with `NotificationCenter` inside, rather than a new anchored dropdown/popover — no
popover primitive exists in this design system, and building one for a single feature would
contradict "reuse existing design system, do not redesign the shell." This is a deliberate
architectural choice, not a corner cut.

## 13. Account deletion / export integration

`AccountDeletionService`: `notification`/`notificationPreference` rows are hard-deleted inside the
same transaction as every other personal-content table. `AccountExportService`: notifications are
exported (content fields only — `emailStatus`/`emailAttemptedAt`/`emailError` are internal
delivery metadata, deliberately excluded, same principle as excluding `passwordHash` elsewhere in
this export). `AccountExportResult.exportVersion` bumped 1 → 2 (additive structural change).
Deleted users are additionally excluded at the source: `NotificationsSchedulerService`'s
eligibility query only ever selects `status: 'ACTIVE'` users.

## 14. Email failure/retry

No new retry-queue infrastructure. `NotificationDeliveryService` attempts at most 2 synchronous
sends per notification (bounded, not infinite) within one call; if both fail, `emailStatus`
becomes `FAILED` and is not retried on a later scheduler run, since the underlying `Notification`
row already exists and its dedupe key would no-op a second `create()`. A disclosed limitation, not
a silent gap.

## 15. Known limitations (disclosed, not hidden)

1. No per-user timezone-aware scheduling (§6).
2. No cross-process-restart scheduler durability (§6).
3. No cross-run email retry beyond the same-call bounded attempt (§14).
4. `SECURITY` and `PRODUCT` categories/classes are modeled but have zero real triggers this
   sprint (§4).
5. Journal/Memory reminders are explicitly out of scope pending a real, non-speculative trigger.
