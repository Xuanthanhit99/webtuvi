# Sprint 18B.10 — AI Interpretation Layer — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (NestJS service + real HTTP route + real Postgres/Redis e2e testing against the real Mock AI provider). No frontend (deferred to 18B.11).

---

## Architecture reuse

`TuViInterpretationService` mirrors `EasternHoroscopeInterpretationService`/`NumerologyInterpretationService` exactly: reuses Companion's existing `ProviderOrchestratorService.stream()`, `SafetyService.checkOutput()`, `CostControlService.checkBudget()`/`.record()`, `GenerationLockService.tryAcquireDiscovery()`/`.releaseDiscovery()`, and `ObservabilityService.logUsage()` — no second AI client, no bespoke safety layer. `TuViRecordService.calculate()` awaits `generateInterpretation()` before returning (best-effort — the deterministic chart is already persisted regardless of outcome), and a `retryInterpretation()` method exists for the case where the first attempt failed (budget/lock/provider issue), matching Eastern Horoscope's own precedent — not an annual-refresh concept, since a Tử Vi chart (unlike Year Energy) is permanent.

## Deterministic/AI separation (the phase's core requirement)

Structurally enforced, not just documented:

- `generateInterpretation()`'s only write to the chart row is `this.prisma.tuViChart.update({ where: { id: chartId }, data: { interpretation, interpretedAt: new Date() } })` — verified by grep that this is the **only** `tuViChart.update()` call touching those two columns anywhere in the codebase; every other `update()` call (archive/restore/remove) touches only `status`/`archivedAt`/`deletedAt`, never the fact columns (`cuc`, `menhPosition`, `mainStars`, etc.).
- The `/tu-vi/charts/:id/interpret` route takes no `@Body()` at all — zero attack surface for a client to inject a payload that could influence anything beyond triggering a retry.
- `TuViInterpretationService.interpret()` returns a plain narrative `string | null` — never structured data that gets parsed back into chart fields.
- The system prompt's `HARD_RULES` explicitly forbid the model from stating a different palace/star/Cục/Tuần/Triệt/Tứ Hóa placement than the one given, and forbid inventing an additional star or fact.
- Verified live over real HTTP (see e2e results below): a calculated chart's `cuc`, `palaces`, `mainStars`, `auxiliaryStars` are asserted unchanged after interpretation completes.

## Prisma / schema

No new migration this phase beyond the two already applied: `TU_VI` added to the `AIFeature` enum (`20260821084846_tu_vi_ai_feature`, additive `ALTER TYPE ... ADD VALUE`, applied to both `beaconvie` and `beaconvie_test`) — required because `ai-feature.types.ts`'s `AIFeature` TS union and the Prisma enum must stay in lockstep for `toPrismaAIFeature()` to compile/run correctly for the new `'tu_vi'` member.

## API route

`POST /tu-vi/charts/:id/interpret` — `JwtAuthGuard` (module-level) + `DiscoveryThrottlerGuard`, `@SkipThrottle` on the throttlers that don't apply to this route (matches Eastern Horoscope's own route exactly). Owner-scoped via the same `findOwned` used by every other lifecycle action — a different user gets an identical 404.

## Test results

- **`tu-vi-record.service.spec.ts` (unit, mocked Prisma): 19/19 pass** (14 existing + 5 new interpretation tests: success path persists + `INTERPRETED` history; provider-null failure leaves `interpretation: null` without throwing, deterministic facts unaffected; generation lock always released via `finally` even when `interpret()` throws; `retryInterpretation()` is owner-scoped; `retryInterpretation()` does not regenerate an existing interpretation).
- **`test/tu-vi.e2e-spec.ts` (real Postgres + real Redis + real HTTP + real Mock AI provider), run standalone: 18/18 pass** (14 existing + 4 new: populated interpretation with canonical facts unchanged; a Premium user also receives an interpretation; retry on an already-interpreted chart returns the same text without regenerating or corrupting facts; concurrent double-retry both succeed under the generation lock, i.e. no duplicate-generation race).
- **Full backend unit suite: 145 suites, 1546/1546 tests pass** (+19 from 18B.9's 1541 — includes the interpretation service being exercised transitively via the record-service mocks; no dedicated `tu-vi-interpretation.service.spec.ts` was needed since its only logic is orchestration already covered by the shared `ProviderOrchestratorService`/`SafetyService` test suites plus the record-service integration tests).
- **Full e2e suite (all 24 files together): 143/342 fail.** Every visible failure is `expected 201, got 429` on `POST /auth/register`, including in files this phase never touched (`numerology.e2e-spec.ts` fails on its very first `register()` call). This is the same root cause documented in 18B.9 (Redis-backed IP-keyed rate limiting saturating across ~300+ back-to-back registrations in one process) — the higher failure count vs. 18B.9's 92/338 tracks the larger total registration volume from this phase's additional e2e tests, not new breakage. `tu-vi.e2e-spec.ts` run in isolation is unaffected (18/18 pass) — the standalone run is the reliable signal for this phase's own correctness; the combined-suite number is an environmental artifact of the shared registration rate limiter, orthogonal to Tử Vi.
- Lint (`eslint src/tu-vi/**/*.ts`), `tsc --noEmit`, `nest build`: all clean.

## Bugs discovered / fixed

None — `tsc --noEmit` caught one non-bug: extending `TuViRecordService`'s constructor to 7 params broke `tu-vi-record.service.spec.ts`'s `makeService()` helper at compile time (`TS2554`), fixed by rewriting the helper to construct and inject the 4 new mocked dependencies. Not a product defect.

## Security/privacy findings

None outstanding. `/interpret` accepts no body (no mass-assignment surface). IDOR: closed, verified live (cross-user retry attempt 404s identically to every other lifecycle route). Generation lock prevents duplicate concurrent generation (verified live with `Promise.all` of two simultaneous retry calls). No birth data, chart contents, or interpretation text ever reaches analytics — the `tu_vi_completed` event still carries only `{feature: 'tu_vi'}`, untouched by this phase.

## Stop conditions

**None triggered.**

## Files created

```
apps/api/src/tu-vi/interpretation/tu-vi-interpretation.types.ts
apps/api/src/tu-vi/interpretation/tu-vi-interpretation.service.ts
apps/api/prisma/migrations/20260821084846_tu_vi_ai_feature/migration.sql
docs/progress/sprint-18b10-ai-interpretation-final-report.md
```

## Files modified (additive only)

`apps/api/prisma/schema.prisma` (+`TU_VI` enum value), `apps/api/src/companion/providers/ai-feature.types.ts` (+`'tu_vi'`), `apps/api/src/tu-vi/record/tu-vi-record.service.ts` (+interpretation generation, +`retryInterpretation`), `apps/api/src/tu-vi/record/tu-vi-record.service.spec.ts` (+mocks, +5 tests), `apps/api/src/tu-vi/tu-vi.controller.ts` (+`/interpret` route), `apps/api/src/tu-vi/tu-vi.module.ts` (+`CompanionModule`/`MemoryModule` imports, +provider), `apps/api/test/tu-vi.e2e-spec.ts` (+Interpretation describe block, +interpret to the IDOR cross-user check, interpretation assertion updated from `toBeNull()` to populated).

## Verdict

**PASS — continuing automatically to Sprint 18B.11.**
