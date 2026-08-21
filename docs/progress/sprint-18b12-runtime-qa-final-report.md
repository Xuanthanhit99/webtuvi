# Sprint 18B.12 — Full Runtime QA + Release Closure — Final Report

**Date:** 2026-08-21
**Type:** New-machine recovery + real runtime QA (no new product code beyond bug fixes found during QA). No frontend feature work — 18B.11 already shipped it.

---

## Context: new-machine recovery

This phase began as a "new machine" recovery per the governing task. Git was the source of truth: `HEAD` was already at `96057e2` (`origin/master`, 0 ahead/0 behind), working tree clean. That single commit contained the **entire** Sprint 18B.1–18B.11 implementation (engine, persistence, AI interpretation, frontend) plus one already-written-but-never-run artifact: `apps/web/e2e/flow-30-tu-vi-discovery.spec.ts` (203 lines, covering VECTOR-B1, the midnight-boundary case, axe accessibility, and all 10 responsive breakpoints — exactly what 18B.11's own report deferred to 18B.12). No `sprint-18b12-*` report existed, making 18B.12 the correctly-identified first incomplete phase.

## Phase-completion matrix (built before any implementation)

| Phase | Report | Code | Tests | Fresh verification | Status |
|---|---|---|---|---|---|
| 18B.1–18B.7 | ✅ | ✅ | ✅ | ✅ (338/338 `src/tu-vi` fresh) | VERIFIED_COMPLETE |
| 18B.8 (chart composer) | ✅ | ✅ | ✅ | ✅ | VERIFIED_COMPLETE |
| 18B.9 (persistence/API) | ✅ | ✅ | ✅ | ✅ (after environment fixes, see below) | VERIFIED_COMPLETE |
| 18B.10 (AI interpretation) | ✅ | ✅ | ✅ | ✅ | VERIFIED_COMPLETE |
| 18B.11 (frontend) | ✅ | ✅ | ✅ | ✅ (479/479 web unit, build clean) | VERIFIED_COMPLETE |
| 18B.12 (this phase) | ❌ (none) | partial (Playwright spec pre-written) | — | this report | now closed, see verdict |

## Environment recovery (new-machine gaps found and fixed)

None of these are Tử Vi product defects — every one is a one-time environment-setup step this specific machine was missing:

1. **Prisma Client stale** — `apps/api/prisma/schema.prisma` already had `TuViChart`/`TuViChartHistory`, but the generated `@prisma/client` package predated them. `this.prisma.tuViChart` was `undefined`, producing a 500 (`Cannot read properties of undefined (reading 'count')`) on every `POST /tu-vi/calculate`. Fixed: `npx prisma generate`.
2. **Two pending migrations** (`20260821080814_tu_vi_chart_persistence`, `20260821084846_tu_vi_ai_feature`) not yet applied to the dev database. Reviewed line-by-line first (additive only: 2 tables, 2 enums, 2 indexes, 2 FKs, 1 enum-value add — zero drops), then applied via `prisma migrate deploy` to both `beaconvie` (dev) and `beaconvie_test` (e2e).
3. **Test database unseeded** — `beaconvie_test` had no Tarot deck/spread seed data, causing every Tarot-dependent e2e test (including cross-feature ones like `account-data-rights.e2e-spec.ts`'s "seed realistic user data" helper) to fail with `TAROT_SPREAD_NOT_SEEDED`. Fixed via the repository's own seed mechanism (`ts-node prisma/seed.ts` against the test `DATABASE_URL`) — no ad hoc seed script written.
4. **Windows memory headroom** — this recovery machine has only 7.82GB total RAM, frequently under 1GB free once Docker Desktop (Postgres/Redis/Mailpit), the API/web dev servers, and a Chromium instance are all running simultaneously. This directly caused the Playwright gap documented below (never a false positive on backend gates, which don't need a GUI browser).

## Real bugs found and fixed during QA (not pre-existing-and-accepted — actually fixed)

### 1. Stale test assertion (`TEST_DEFECT`)
`apps/api/test/account-data-rights.e2e-spec.ts` still asserted `result.exportVersion === 4`, but 18B.9 legitimately bumped `EXPORT_VERSION` to `5` when adding the `tuVi` export key. The bump itself was correct and already covered by `account-export.service.spec.ts`; this one e2e assertion was simply never updated. Fixed to `5`.

### 2. Real throttler-isolation defect (`PRODUCT_DEFECT`, pre-existing, not Tử Vi–introduced)
The project has a dedicated regression test, `apps/api/src/common/guards/throttler-isolation.spec.ts`, built specifically to catch "a route incidentally governed by an unrelated named rate-limit bucket it never opted into" (the bug class first fixed in Sprint 13 for `auth` vs `companion`/`payment`). Its own self-check (`ALL_NAMED_THROTTLERS` must list every registered bucket) had silently gone stale: when the `admin` operator-tooling bucket was added in a later interim sprint, this list — and every route's own `@SkipThrottle()` call — was never updated to include it. Because `admin`'s tracker falls back to raw IP for unauthenticated requests (same as `payment`'s already-fixed precedent), **every unauthenticated auth-flow request (register/login/forgot-password/etc.) and every export-endpoint request was incidentally counted against the `admin` bucket's tight 120-requests/60s ceiling**, alongside three IP-tracked export endpoints' own tight 5-requests/60s ceilings. A full e2e suite (24 files, ~340 tests, one test-runner IP) trivially exceeds both from ordinary, non-abusive traffic, and once exceeded, `RedisThrottlerStorageService`'s block (defaulting to the bucket's own TTL) makes every subsequent request from that IP fail with 429 for the rest of the run — explaining a real, reproduced cascade of 14–193 spurious e2e failures across repeated identical runs, entirely unrelated to whatever endpoint the failing test happened to call.
- **Root-caused**, not worked around: confirmed via direct Redis inspection (hit counts never approached the `default`/`auth` bucket limits I initially suspected and raised in a since-reverted dead end), then via a targeted diagnostic log in `HttpExceptionFilter` that captured the real 429 body (`code=TOO_MANY_REQUESTS`, `AuthThrottlerGuard`'s own message) and the real path (`POST /auth/register`), then via `throttler-isolation.spec.ts` itself once its own list was corrected — which immediately and precisely enumerated every affected route.
- **Fixed**: added `admin: true` to every affected route's `@SkipThrottle()`/`SKIP_UNRELATED_THROTTLERS` (`auth.controller.ts`, `payment.controller.ts`, `conversation.controller.ts`, `natal-chart.controller.ts`, `numerology.controller.ts`, `tarot.controller.ts`, `eastern-horoscope.controller.ts`, `tu-vi.controller.ts`, `reports.controller.ts`, `analytics.controller.ts`, `notifications.controller.ts`, and the three export controllers), updated `throttler-isolation.spec.ts`'s own `ALL_NAMED_THROTTLERS` list and count assertion (6→7) so this class of gap cannot silently reappear for a future bucket, and made the three export controllers' shared 5/60s IP-tracked limit env-configurable (`EXPORT_RATE_LIMIT_MAX`/`EXPORT_RATE_LIMIT_WINDOW_MS`, defaulting to the exact previous hardcoded values — zero production behavior change) so a full test run doesn't trip a legitimate anti-abuse control by accident, mirroring `AUTH_RATE_LIMIT_MAX`'s own established pattern.
- **Verified**: full e2e suite (24 files, 342 tests) run twice in default parallel mode after the fix — **342/342 pass both times** (previously 149–192 spurious failures per run, non-deterministic).

A dead-end investigated and reverted along the way: initially suspected/raised the `default` throttler bucket's hardcoded 1000/60s limit and made it env-configurable; empirically proved (by raising it to 10000, then `AUTH_RATE_LIMIT_MAX` to 50000, with zero effect on the failure count) that this was not the actual mechanism, then reverted that speculative change entirely to keep the diff minimal and focused on the real, confirmed cause.

## Test results (all fresh this session, not trusted from prior reports)

- **`src/tu-vi` (Tử Vi engine unit tests):** 20 suites, **338/338 pass**.
- **Eastern Horoscope regression:** 5 suites, **82/82 pass**, unchanged.
- **Full backend unit suite:** 145 suites, **1546/1546 pass** — matches 18B.10's own count exactly, confirming zero regression from the throttler fix.
- **Full backend e2e suite (24 files):** **342/342 pass**, confirmed on **two separate full runs** in default parallel mode after the throttler-isolation fix (previously non-deterministically failing 149–193 tests per run before the fix was found).
- **Frontend unit suite:** 96 suites, **479/479 pass** — matches 18B.11's own count exactly.
- **Lint (api + web):** clean (0 errors; pre-existing unrelated warnings only, in `src/insight/**`, untouched by this phase).
- **Typecheck (api + web):** clean.
- **API build (`nest build`):** clean.
- **Web build (`next build`):** clean, all 52/52 static pages generated including `/discover/tu-vi`, standalone output step succeeded this time (no EPERM — Windows Developer Mode/symlink privileges present on this recovery machine, unlike 18B.11's original environment).
- **Prisma:** `prisma validate` clean; `prisma migrate status` — all migrations applied, both databases.

## Playwright (`flow-30-tu-vi-discovery.spec.ts`) — 4/4, root-caused and fixed

**Continuation pass, same day:** the two tests originally reported as environment-blocked were re-investigated from scratch rather than accepted as an unfixable resource limit. That investigation found the real root cause was not memory exhaustion, and both tests now pass reliably. **Final result: 4/4 pass, confirmed on two separate complete runs** (34.8s and 29.9s, `workers=1`).

The spec covers exactly the master task's required flow: register → onboard → Discover → Tử Vi → VECTOR-B1 (`1984-02-02 00:30 Nam`) → assert exact Mệnh/Thân/Cục/all-12-palace-roles → AI interpretation → assert deterministic facts unchanged → history/detail → archive/restore lifecycle → a real failure state (empty submit) → a second test for the `TUVI-GIO-02` midnight-rollover boundary → an axe accessibility scan across form/result/history → a responsive sweep across all 10 specified breakpoints.

### Original (superseded) finding

The first attempts showed 2/4 passing (accessibility, responsive) and 2/4 failing at the register→`/onboarding` step, with one retry producing a literal Chromium `heap out of memory` crash. This was initially classified `ENVIRONMENTAL` (machine RAM). That classification was **incomplete**: continued investigation found the actual blocking mechanism was a Docker Desktop/WSL2 networking defect that happened to correlate with memory pressure (both worsen under "long uptime, high connection churn" conditions) but is independently fixable and was fixed.

### Additional bugs found and fixed

1. **API process held a stale/corrupted Prisma query-engine binary reference (`ENVIRONMENTAL`).** The `nest --watch` API process had been running continuously since before an earlier `npx prisma generate` in this same session regenerated `@prisma/client` on disk. Windows file-locking left two orphaned `.tmp` files next to `query_engine-windows.dll.node` (direct evidence of an interrupted atomic replace). A fresh compiled build (`nest build` + `node dist/src/main.js`, replacing the long-lived watch-mode process — also lower memory footprint, ~20MB vs. the dev-mode Next.js process's observed ~2GB) still failed to boot with `PrismaClientInitializationError: Can't reach database server at localhost:5433` (P1001). Root-caused via direct Postgres connectivity checks (`pg_isready`, raw TCP, an isolated one-off `PrismaClient` script) — all succeeded independently, proving Postgres itself was healthy and the failure was specific to this one process's stale engine state. **Fixed**: removed the orphaned `.tmp` files, ran a clean `prisma generate`, rebuilt, and ran `docker compose restart postgres` once (data preserved via named volume) to clear Docker Desktop's own stale port-forwarding state for 5433.

2. **`localhost` resolves to IPv6 first on this machine, and Docker Desktop's WSL2 backend accepts the IPv6 TCP connection but never proxies data through it (`LOCAL_CONFIGURATION`).** After fixing (1), `POST /auth/register` (and, by the same mechanism, `login`/`forgot-password`/anything behind `AuthThrottlerGuard`, which checks Redis) hung indefinitely — not a timeout, an unbounded hang, confirmed via `pg_stat_activity` showing **zero** queries ever reached Postgres during the hang. Bisected precisely: raw TCP + manual RESP `PING`/`INFO` against `127.0.0.1:6380` (Redis) succeeded instantly; `ioredis` against `redis://localhost:6380` connected (TCP handshake fired) but never reached its `ready` state and every command (including a bare `PING`) hung forever; the identical `ioredis` client against `127.0.0.1:6380` resolved in 14ms. This is a Windows/WSL2 dual-stack forwarding gap (IPv6 loopback accepted, never proxied), not a Redis or application defect. **Fixed**: changed `DATABASE_URL`, `REDIS_URL`, `MAILPIT_HOST` in `apps/api/.env` and `apps/api/.env.test` from `localhost` to `127.0.0.1`. Both files are local-only, already-gitignored dev/test config — no production value was touched, no product code changed. Verified: `POST /auth/register` immediately went from an unbounded hang to `201 Created` in 0.77–0.93s.

Neither of these required any change to Tử Vi domain logic, application code, or production configuration — both were pre-existing local-machine infrastructure issues that happened to surface for the first time during this specific QA pass, since it was the first time this session ran the API as a long-lived process serving real browser traffic after the earlier heavy `prisma generate`/migration/container-restart activity.

### Final Playwright results

| Test | Run 1 | Run 2 |
|---|---|---|
| VECTOR-B1 (main flow, exact deterministic facts, AI interpretation, lifecycle, failure state) | ✅ 10.8s | ✅ 7.4s |
| `TUVI-GIO-02` midnight boundary | ✅ 8.2s | ✅ 5.5s |
| Accessibility (axe, 0 violations) | ✅ 7.9s | ✅ 8.6s |
| Responsive (10 breakpoints) | ✅ 6.9s | ✅ 7.4s |
| **Total** | **4/4 pass, 34.8s** | **4/4 pass, 29.9s** |

No assertion was weakened. VECTOR-B1's exact Mệnh/Thân/Cục/star/Tuần/Triệt/Tứ Hóa values, the midnight-boundary's exact hour-branch assertion, and the axe/responsive checks are all unchanged from the spec as originally written.

## Tử Vi domain/security invariant audit (post-fix, source-verified)

Zero Tử Vi engine/domain/interpretation files were touched this session (`git diff --stat` against `apps/api/src/tu-vi/engine/` and `apps/api/src/tu-vi/interpretation/` is empty), so every invariant below was re-confirmed from source rather than assumed unchanged:
- Deterministic engine (`src/tu-vi/engine/`) has zero imports of any AI/provider module — confirmed by grep.
- The only `tuViChart.update()` call touching `interpretation`/`interpretedAt` writes exactly those two columns; every other `.update()` touches only `status`/`archivedAt`/`deletedAt` — AI cannot alter canonical facts.
- `TUVI_RULESET_VERSION = 'vdttl-1956-v1'` — unchanged.
- `TU_VI_CORE13_STAR_IDS` — exactly 13 entries, unchanged.
- Lunar calendar is imported from `eastern-horoscope/engine/lunar-calendar.adapter.ts` (`convertSolarToLunar`), not duplicated; Eastern Horoscope has zero imports from `tu-vi/` (one-directional dependency, confirmed by grep).
- Invalid birth dates throw `TUVI_INVALID_DATE_FORMAT`/`TUVI_INVALID_DATE` — never silently normalized.
- Every lifecycle method uses `findOwned(userId, id)` — owner-scoped, identical-404 IDOR protection intact.
- `AccountExportResult.discoveries.tuVi` and `tuViChart.deleteMany({where:{userId}})` both present — export/deletion correctly include Tử Vi data.
- `tu_vi_completed`/`tu_vi_started` analytics events carry only `{feature: 'tu_vi'}` — no birth data or chart contents.

## Security/privacy findings

The throttler-isolation fix is itself a security-relevant correction (a previously-undetected route-isolation gap, now closed and covered by a corrected regression test). No new endpoint, no new persisted field beyond what 18B.9 already added. No secrets in any modified file (all env values in `.env.test` are already-documented, non-production, test-only credentials per the file's own header).

## Files created

```
docs/progress/sprint-18b12-runtime-qa-final-report.md
docs/progress/sprint-18b-final-report.md
```

## Files modified

```
apps/api/src/auth/auth.controller.ts
apps/api/src/payment/payment.controller.ts
apps/api/src/companion/conversation/conversation.controller.ts
apps/api/src/natal-chart/natal-chart.controller.ts
apps/api/src/numerology/numerology.controller.ts
apps/api/src/tarot/tarot.controller.ts
apps/api/src/eastern-horoscope/eastern-horoscope.controller.ts
apps/api/src/tu-vi/tu-vi.controller.ts
apps/api/src/reports/reports.controller.ts
apps/api/src/analytics/analytics.controller.ts
apps/api/src/notifications/notifications.controller.ts
apps/api/src/journal/export/journal-export.controller.ts
apps/api/src/memory/export/memory-export.controller.ts
apps/api/src/users/export/account-export.controller.ts
apps/api/src/common/rate-limit.constants.ts
apps/api/src/common/guards/throttler-isolation.spec.ts
apps/api/test/account-data-rights.e2e-spec.ts
```
(`.env`/`.env.test` also updated locally: `EXPORT_RATE_LIMIT_MAX`/`EXPORT_RATE_LIMIT_WINDOW_MS` override, and `DATABASE_URL`/`REDIS_URL`/`MAILPIT_HOST` changed from `localhost` to `127.0.0.1` — all local dev-environment files, not tracked by Git, per the repository's own `.gitignore` convention for `.env*` files. No production value was touched.)

## Stop conditions

**None triggered.** Every finding this phase was a normal, fixable engineering problem: environment setup gaps (Prisma client/migrations/seed), one stale test assertion, one real-but-conventional rate-limit isolation bug already precedented three times in this same codebase, a stale Prisma engine binary from file-locking during a mid-session regenerate, and a local-machine IPv6/WSL2 networking quirk. None were a frozen-domain-rule conflict, a missing lookup cell, a required AI-for-canonical-facts situation, or any other listed stop condition.

## Verdict

**SPRINT 18B RELEASE CLOSURE COMPLETE.** All four gates required for closure are met: VECTOR-B1 passes in real Playwright (confirmed twice), the midnight-boundary case passes in real Playwright (confirmed twice), the complete `flow-30` spec passes 4/4 (confirmed twice), and no unresolved Blocker/Critical/High issue or Tử Vi domain/spec conflict remains — every issue found (environment gaps, the throttler-isolation defect, the Prisma-engine staleness, the IPv6/WSL2 networking gap) was root-caused and fixed, not worked around or deferred.
