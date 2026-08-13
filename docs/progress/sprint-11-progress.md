# Sprint 11 — Notification & Retention Foundation — Progress Log

Selected by `docs/audit/sprint-11-pre-implementation-audit.md` — the only unshipped V1-tier
Product Bible module (Module 19). Baseline HEAD `ffd82dc`, working tree clean at session start
(one pre-existing untracked audit doc).

## Phases completed

1. Baseline recovery + independent re-audit of Notifications' absence (confirmed: zero Prisma
   model, zero scheduler/cron of any kind, zero notification code — matching the audit).
2. Reconnaissance of reusable infrastructure (mail provider abstraction, settings/preferences
   pattern, payment/entitlement service, account deletion/export patterns, Prisma/controller/DTO
   conventions, throttler conventions, Memory significance scoring, realtime infra, Tarot
   daily-draw check, frontend nav shell, Playwright conventions).
3. Prisma schema: `Notification`, `NotificationPreference` models + 3 enums. Migration generated
   offline via `prisma migrate diff` (no live DB in this environment — see final report "Runtime-
   unverified items"). `prisma generate`/`prisma validate` both clean.
4. Backend core module: `NotificationsService` (idempotent create, list/pagination, unread-count,
   read/read-all, IDOR-safe owner scoping), `NotificationPreferencesService`,
   `NotificationsController` (6 routes), DTOs.
5. Eligibility/scheduler/delivery: `TarotDailyReminderEligibilityService` (deterministic,
   cursor-paginated), `NotificationsSchedulerService` (`@nestjs/schedule` `@Cron`, 09:00 UTC
   daily — the one new dependency this sprint adds), `NotificationDeliveryService` (bounded
   2-attempt email retry), a generic notification email template.
6. Payment webhook hook: `premium.activated` notification created strictly downstream of a real
   entitlement grant, never inside the payment transaction, best-effort/non-blocking.
7. Account deletion/export integration: notification rows hard-deleted on account deletion,
   exported (content fields only) with `exportVersion` bumped 1 → 2.
8. Two bundled remediations: AI-disclosure copy added to `/privacy`; natal chart 0°/360°
   wraparound collision-easing gap fixed with regression tests.
9. Frontend: `NotificationBell` (polling badge, `Dialog`-based Notification Center),
   `NotificationPreferencesSection` (Settings), wired into `AppHeader`/`settings/page.tsx`.
10. Tests: 5 new backend unit spec files (34 tests, all passing), 3 updated existing specs
    (payment webhook, account deletion, account export — all passing), 1 new backend e2e spec
    (written, not executed — no live Postgres in this sandbox), 3 new frontend unit spec files
    (16 tests, all passing), 1 new Playwright flow (written, not executed — no live
    Docker/browser in this sandbox).
11. Quality gates run in this environment: backend typecheck/lint/unit (956/956 passing, 0 lint
    errors), frontend typecheck/lint/unit (340/340 passing, 0 lint errors), both production
    builds clean, `prisma validate`/`generate` clean, `git diff --check` clean, basic secret scan
    clean.

See `docs/progress/sprint-11-final-report.md` for the full closure report, including
runtime-unverified items and the exact reasoning behind every non-trivial design decision (also
cross-referenced from `docs/architecture/notification-retention.md`).

## Release Closure (separate session)

Real infrastructure (Docker/Postgres/Redis/Mailpit) came up in a later session. Migration applied
cleanly to dev/test/scratch databases; full backend e2e (239/239), backend/frontend unit
(956/956, 345/345), Playwright (30/35, all 5 failures confirmed pre-existing/unrelated), real
Mailpit email delivery, and a real duplicate-webhook Premium cycle were all verified against live
infrastructure. Three real defects found and fixed during closure: a missing rate-limit guard on
`NotificationsController`, a deep-link validation hardening, and a checkbox optimistic-update UX
fix. Lockfile issue fully resolved (correct pnpm/Node combination found). Verdict: **READY FOR
SPRINT 12**. Full detail in `docs/progress/sprint-11-final-report.md`'s "RELEASE CLOSURE" section.
