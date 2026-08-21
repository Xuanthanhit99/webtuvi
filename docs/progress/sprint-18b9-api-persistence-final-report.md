# Sprint 18B.9 — Persistence + API + Ownership + Security — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (Prisma migration + NestJS module + real Postgres/Redis testing). No frontend, no AI interpretation (deferred to 18B.10).

---

## Architecture reuse

Researched Eastern Horoscope's (and Numerology's/NatalChart's) established patterns via a dedicated research pass before writing any code. Followed exactly: flat-row Prisma model with inline nullable AI-interpretation columns (not a separate table — matches EasternHoroscopeProfile, not NatalChart's Json-interpretation or NumerologyValue's child-table split, since Tử Vi's arrays are all fixed-cardinality per chart, not open-ended); `findUnique + separate ownership check` pattern (not `findFirst({where:{id,userId}})`); identical-404 IDOR discipline; inline `EntitlementService.hasPremiumAccess` calls for anti-abuse tiering (never a route-level `PremiumGuard` on the deterministic calculation); `whitelist:true, forbidNonWhitelisted:true` global `ValidationPipe` (already present, confirmed, relied upon).

## Prisma changes

**Additive only**, confirmed via direct migration-SQL inspection (zero `DROP`/destructive statements): 2 new enums (`TuViChartStatus`, `TuViChartHistoryAction`), 2 new tables (`tu_vi_charts`, `tu_vi_chart_history`), 2 new indexes, 2 new foreign keys, 1 new back-relation on `User` (`tuViCharts`). `TuViChart` stores every `TuViChart` engine-output field flat on one row (scalars for singular facts, JSON columns for the fixed-shape arrays — 14 main stars, 13 CORE_13, 12-entry palace layout, 4 transformations), plus 7 version identifiers and the standard inline-nullable AI-interpretation columns (unpopulated this phase). Migration applied to **both** the dev database (`beaconvie`) and the e2e test database (`beaconvie_test`) via real `prisma migrate dev`/`migrate deploy` against live Postgres (Docker was not running at the start of this session — started it, confirmed healthy, then ran the real migration rather than skipping this step).

## Migration safety

`prisma validate` clean before migrating. Migration SQL manually reviewed line-by-line: only `CREATE TYPE`/`CREATE TABLE`/`CREATE INDEX`/`ALTER TABLE ... ADD CONSTRAINT` statements, zero drops, zero alterations to any existing table/column.

## API routes

`POST /tu-vi/calculate`, `GET /tu-vi/charts`, `GET /tu-vi/charts/:id`, `GET /tu-vi/charts/:id/history`, `POST /tu-vi/charts/:id/archive`, `POST /tu-vi/charts/:id/restore`, `DELETE /tu-vi/charts/:id` — all behind `JwtAuthGuard`, mirroring Eastern Horoscope's route shape exactly (`/profiles` → `/charts`). **No `/interpret` route yet** — deliberately deferred to Sprint 18B.10, matching the "AI comes last" phase boundary.

## Ownership / IDOR

`findOwned` — `findUnique({id})` + separate `userId` equality check, throwing a generic `NotFoundException` (code `TU_VI_CHART_NOT_FOUND`) whether the id doesn't exist or belongs to someone else, matching `EasternHoroscopeRecordService` exactly. **Verified twice**: 14 unit tests (mocked Prisma) and, more importantly, a **real e2e two-user attack** against live Postgres — User B attempting GET/archive/restore/delete/history on User A's chart all return identical 404s; the chart itself is confirmed untouched afterward; `list()` never leaks another user's charts even when queried directly.

## Mass assignment

Verified against the real HTTP layer, not just asserted: a `calculate` payload including `userId`, `status`, `interpretation`, `engineVersion` alongside the real fields is rejected with `400` by the existing global `ValidationPipe`'s `forbidNonWhitelisted: true` — no code change was needed for this (the guard already existed), only a test confirming it applies to the new DTO.

## Premium boundary

Deterministic calculation is **never** Premium-gated (mirrors Eastern Horoscope's own explicit precedent). `EntitlementService.hasPremiumAccess` used inline, exactly as precedent: (1) raises the daily calculation ceiling 5→15 (anti-abuse only), (2) raises the free history browsing cap past 20 charts. Verified: a free user can calculate 5 charts before hitting `403 PREMIUM_REQUIRED`; a premium user reaches 15 before a `400 TU_VI_DAILY_LIMIT_REACHED`; free-tier history pagination past 20 items is blocked, premium is not.

## Export

`AccountExportResult.discoveries.tuVi` added (additive), `EXPORT_VERSION` bumped 4→5 with the same documented-bump-comment convention as every prior addition. Verified via the existing export service's own spec suite (extended, not replaced).

## Deletion

`tuViChart.deleteMany({where:{userId}})` added to the deletion transaction array, cascading `TuViChartHistory` — no financial-retention exception, same as every other Discovery system. Verified via the existing deletion service's own spec suite (extended).

## Analytics privacy

`tu_vi_started`/`tu_vi_completed` added additively to `packages/types/index.ts`'s closed unions, `analytics.constants.ts`'s runtime arrays, and `analytics.constants.spec.ts`'s exhaustiveness switch + total-count assertion (33, up from 31). The server event fires with **only** `{feature: 'tu_vi'}` — no birth date, no sex, no chart contents, matching `AnalyticsEventProperties`'s already-closed, free-text-field-free shape exactly (no new property was added to that interface; `tu_vi` was only added to the existing `feature` enum). Verified via a Prisma-level spot check in the e2e suite confirming the persisted `TuViChart` row (not any analytics event) is the actual source of birth data.

## Test results

- **`tu-vi-record.service.spec.ts` (unit, mocked Prisma): 14/14 pass**, first run.
- **`test/tu-vi.e2e-spec.ts` (real Postgres + real Redis + real HTTP): 14/14 pass**, after two fixes (both environment/precedent-matching, not logic bugs — see below).
- **Full backend unit suite: 145 suites, 1541/1541 tests pass** (+14 from 18B.8's 1527).
- **Full e2e suite (all 24 files together): 92/338 fail** — investigated and confirmed **pre-existing/environmental** (see Stop Conditions below), not a regression.
- Lint/typecheck/`nest build`: all clean.

## Bugs discovered / fixed

Two, both `TEST_DEFECT`/expectation-mismatches against already-established platform behavior, not product defects:
1. My e2e test expected `401` for an unauthenticated `POST /tu-vi/calculate`; the actual, already-established, correct behavior is `403`/`CSRF_TOKEN_MISSING` (`CsrfGuard` runs before `JwtAuthGuard` for state-changing requests) — confirmed by checking `eastern-horoscope.e2e-spec.ts`'s own identical test, which expects the same 403. Fixed to match.
2. The e2e database (`beaconvie_test`, separate from the dev `beaconvie` database) needed its own `prisma migrate deploy` run — not a code bug, a one-time environment setup step (documented in `.env.test`'s own comment).

## Security/privacy findings

None outstanding. IDOR: closed (identical 404s, verified live). Mass assignment: closed (verified live). Premium bypass: not applicable (deterministic calculation is never gated; tiering-only checks verified). Malformed date/missing sex: return `400`, verified live, never a `500` or a silently-wrong chart. No raw birth data in analytics (verified). No new endpoint outside the intended 7 routes, all behind `JwtAuthGuard`.

## Stop conditions

**None triggered.** The full-e2e-suite `429` flood was investigated per Phase 15's "for ENVIRONMENTAL: provide concrete evidence" requirement: re-ran the entire 24-file e2e suite **excluding** `tu-vi.e2e-spec.ts` and found essentially the same failure pattern (82/324 failures, 13 suites) as with it included (92/338, 14 suites) — a proportional, not disproportionate, increase matching the ~14 new tests added. Root cause is Redis-backed IP-keyed registration rate-limiting saturating when the entire suite's ~300+ `POST /auth/register` calls run back-to-back in one process, unrelated to Tử Vi's own code. This matches the master prompt's own explicit "a clearly proven environmental flake... fix/recover and continue" guidance — recommended as a follow-up for Sprint 18B.12's QA phase (e.g., batch e2e runs, or raise the test-env registration rate limit), not a blocker here.

## Files created

```
apps/api/src/tu-vi/dto/calculate-tu-vi-chart.dto.ts
apps/api/src/tu-vi/dto/list-tu-vi-charts.dto.ts
apps/api/src/tu-vi/tu-vi.mappers.ts
apps/api/src/tu-vi/tu-vi.controller.ts
apps/api/src/tu-vi/tu-vi.module.ts
apps/api/src/tu-vi/record/tu-vi-record.service.ts
apps/api/src/tu-vi/record/tu-vi-record.service.spec.ts
apps/api/test/tu-vi.e2e-spec.ts
apps/api/prisma/migrations/20260821080814_tu_vi_chart_persistence/migration.sql
docs/progress/sprint-18b9-api-persistence-final-report.md
```

## Files modified (additive only)

`apps/api/prisma/schema.prisma` (2 new models/enums + 1 back-relation), `apps/api/src/app.module.ts` (register `TuViModule`), `packages/types/index.ts` (2 new event-name union members + 1 new feature), `apps/api/src/analytics/analytics.constants.ts` (mirrors the above), `apps/api/src/analytics/analytics.constants.spec.ts` (exhaustiveness switch + count), `apps/api/src/users/export/account-export.service.ts` (+key, +version bump), `apps/api/src/users/export/account-export.service.spec.ts` (+assertions), `apps/api/src/users/deletion/account-deletion.service.ts` (+deleteMany line), `apps/api/src/users/deletion/account-deletion.service.spec.ts` (+mock, +assertion).

## Verdict

**PASS — continuing automatically to Sprint 18B.10.**
