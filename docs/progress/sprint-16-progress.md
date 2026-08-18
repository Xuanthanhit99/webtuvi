# Sprint 16 — Personal Destiny Report — Implementation Progress Log

Running log kept during implementation. The authoritative, structured outcome is
`docs/progress/sprint-16-final-report.md`; this file records the sequence of work and the
decisions made along the way.

## Starting state

- HEAD `dc6684e` (Sprint 14 ambiguity cleanup), 1 commit ahead of `origin/master`, 0 behind.
  Working tree clean at session start.
- Authoritative inputs: `docs/architecture/personal-destiny-report.md` (architecture +
  "PRODUCT DECISIONS LOCKED" section), `docs/product/personal-destiny-report-decisions.md`
  (standalone decision record), `docs/audit/sprint-16-pre-implementation-audit.md` (original
  audit). Product scope treated as LOCKED; only implementation choices were made freely.

## Sequence

1. **Prisma migration.** Added `AIFeature.REPORTS`, `DestinyReport` model (+ `DestinyReportStatus`,
   `DestinyReportFailureReason` enums) to `schema.prisma`. `prisma migrate dev` refused to run
   (non-interactive environment); used `prisma migrate diff --from-migrations ... --to-schema-datamodel
   ... --shadow-database-url ... --script` against a temporary `beaconvie_shadow` database, then
   `prisma migrate deploy` against both the dev and test (`beaconvie_test`) databases. Shadow DB
   dropped after. `prisma generate` initially hit an `EPERM` file lock from a leftover dev-server
   process holding the query-engine DLL; killed the process, retried, succeeded.
2. **Backend module** (`apps/api/src/reports/`): readiness service (read-only, both required
   sources), snapshot service (builds the immutable source snapshot; Natal/Numerology required,
   Tarot/Memory optional and never blocking), prompt + Zod schema + grounding-violation checker,
   generation service (entitlement → readiness → budget → lock → snapshot → synthesis →
   validate+ground → persist), record service (generate/regenerate/list/getOne with owner-scoped
   404s), controller, module, mappers, DTOs.
3. **Cross-cutting wiring**: `AIFeature` type/enum extended to `reports`; analytics event names
   added to both `packages/types/index.ts` and the runtime mirror in
   `analytics.constants.ts` (+ spec updated, count 24→29); account export bumped to
   `EXPORT_VERSION = 3` with `destinyReports` included; account deletion transaction extended with
   `destinyReport.deleteMany`. Self-caught and fixed: an initial server-side
   `report_generation_started` analytics call was removed — that event is client-only per the
   locked decision (fires on button click, mirroring `tarot_started`), not something the backend
   should emit.
4. **Backend tests**: 36 new unit tests across 5 files (readiness, prompt/grounding, generation,
   record, snapshot — including a dedicated test that the snapshot service's own source file
   contains no import from `journal`/`reflection`/`insight`/`review`/`goal`). One fixture bug found
   and fixed: the schema's `evidenceRefs: z.array(...).min(1)` requirement meant an initially-empty
   test fixture silently exercised the failure path instead of the success path.
5. **Backend e2e** (`apps/api/test/reports.e2e-spec.ts`, 17 tests): auth gating, readiness variants,
   generation gating (free/no-sources), generation lifecycle (mock provider honestly lands in
   `FAILED`/`VALIDATION_FAILED` — expected, matching Natal Chart's own precedent, never a fabricated
   `READY`), history, regeneration, cross-user 404, concurrent-generation lock, export/deletion
   integration. Found and fixed a real regression this sprint caused: a hardcoded
   `expect(result.exportVersion).toBe(2)` in the pre-existing `account-data-rights.e2e-spec.ts` was
   missed when `EXPORT_VERSION` was bumped to 3.
6. **Real generation runtime measurement** (stop condition A): ran a full real (Gemini-backed)
   report generation via direct API calls — registered user, created Numerology/Natal Chart, granted
   Premium via direct DB insert, called `POST /reports`. Result: **~5.1–5.9s wall time**, 3527 total
   tokens (2365 prompt + 1162 completion), ~$0.0036 estimated cost, valid structured JSON passed
   schema + grounding validation on the first attempt, correctly attributed as `GEMINI` /
   `gemini-3.5-flash-lite` with `feature='REPORTS'` in `ai_usages`. Well within synchronous HTTP
   bounds — stop condition A not triggered. Regeneration via curl confirmed a distinct new report
   while preserving the original.
7. **Frontend feature** (`apps/web/features/reports/`): API client, labels, readiness panel,
   history list, dashboard (Premium gate + upgrade routing + generate flow), detail view (all 11
   locked sections, Calculated Facts appendix explicitly labeled "Deterministic — never
   AI-generated", table of contents, Companion bridge link). Route wired into `route-guard.ts`,
   `middleware.ts`, `robots.ts`, and linked from `/discover` as a distinct "convergence point" card
   (not part of the `SYSTEMS` grid, since it synthesizes Discovery systems rather than being one).
8. **Frontend unit tests** (9 tests, 2 files): dashboard (missing-source CTAs, Premium upsell,
   upgrade routing, generate-and-navigate, empty state) and detail (GENERATING/FAILED/READY states,
   optional-section presence/absence, Companion bridge link). Found and fixed two real bugs via
   these tests: (a) the table of contents unconditionally linked to "Current Themes"/"Personalized
   Reflection" even when those optional sections were absent from a given report, creating dead
   links — fixed by passing presence flags and filtering; (b) a test-only timing issue where an
   assertion ran before the async readiness query resolved — fixed with `waitFor`.
9. **Playwright** (`apps/web/e2e/flow-27-personal-destiny-report.spec.ts`): registration/onboarding
   → direct-API setup of Numerology + Natal Chart → readiness → Premium gate/upgrade routing → real
   checkout + HMAC-signed webhook (mirrors `flow-21` exactly) → generation against the real Gemini
   provider → all locked sections render → Calculated Facts labeled deterministic → AI disclosure
   present → history → regeneration (verified against live backend state via `page.request`, not
   just the UI's own cache) → Companion bridge link. Debugged an initially-flaky final regeneration
   assertion (three iterations: UI DOM count → `expect.poll` → direct backend-state verification
   with a response-status diagnostic); the diagnostic run showed a clean `201` with a genuinely new
   report, and two subsequent full runs both passed cleanly — the earlier failures were timing
   flakiness in the test's own assertions, not a product defect. Diagnostic logging removed before
   finalizing the spec.
10. **Quality gates**: lint (0 errors, pre-existing warnings only), typecheck (both apps clean),
    backend unit (114 suites / 1095 tests, fresh run, all passing), frontend unit (76 suites / 378
    tests, fresh run, all passing), API production build (clean), web production build (compiles,
    typechecks, lints, generates all 49 static pages cleanly; fails only at the `output: 'standalone'`
    trace-copy step on the same pre-existing Windows-only `EPERM` symlink limitation documented since
    Sprint 13 and independently confirmed fine under real Docker/Linux in Sprint 14's Release
    Closure). `git diff --check` clean, conflict-marker scan clean, secret scan clean across the
    full diff including untracked files.
11. **Infra interruption**: partway through the final quality-gate pass, Docker Desktop's backend
    service (`com.docker.service`) stopped responding (500 errors from its API, then found stopped
    entirely) — a genuine environmental issue, not caused by any code change (backend e2e had passed
    cleanly, 21/21 suites / 282/282 tests, including all 17 Reports e2e tests, earlier in this same
    session before the interruption). This session's process lacks permission to restart the Docker
    service or force-kill its processes (`Access is denied`); `wsl --shutdown` did not recover it.
    A fresh, final re-run of backend e2e could not be completed as a result — see the final report's
    "Runtime-unverified items" for the honest accounting and what already stands as evidence.
12. **`next.config.mjs`** restored to its committed state (`output: 'standalone'` re-enabled,
    temporary comment removed) before finishing; confirmed via `git diff` showing zero delta on that
    file.

## Deviations from the brief, and why

- None. The report type, required/optional/excluded sources, synchronous-only generation, and the
  11-section fixed structure all match the locked decisions exactly; no stop condition was
  triggered; no async/queue/timeout-relaxation workaround was introduced.

See `docs/progress/sprint-16-final-report.md` for the full structured accounting and verdict.
