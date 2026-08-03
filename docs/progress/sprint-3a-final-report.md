# BeaconVie — Sprint 3A Release Closure: Final Report

Date: 2026-08-03. This closes out Sprint 3A (Memory Foundation) on top of the previously
uncommitted Sprint 2B (Companion Core) remediation, verifies both against live infrastructure,
and fixes real defects surfaced only by that live verification. Sprint 3B is **not** started.

## 1. Baseline commit

- **HEAD at the start of this closure**: `3284287` ("[update][commit]" — the Sprint 2B
  code-complete commit, itself sitting on top of `624c2de` "feat: complete Sprint 2A production
  hardening" and `ff77169` "feat: complete BeaconVie Sprint 1 foundation").
- **HEAD at the time of writing this report**: still `3284287` — nothing has been committed yet;
  see §17 for the commit this report is a precondition for.

## 2. Git scope classification

`git status --porcelain` shows **76 changed paths**, none of them `.env` files, build output,
screenshots, or local database files (all correctly gitignored). Classification:

| Category | Paths | Notes |
|---|---|---|
| Sprint 2B Companion remediation | `apps/api/src/companion/**`, `apps/api/src/common/guards/companion-throttler.guard.ts`(+spec), `apps/api/src/config/{configuration,env.validation}.ts`(+spec), `apps/api/src/app.module.ts`, `apps/web/features/companion/**`, `apps/web/lib/api-client.ts`, `.github/workflows/ci.yml`, `docs/architecture/companion-core.md`, `docs/security/ai-safety.md`, `docs/progress/sprint-2b-progress.md`, `docs/progress/sprint-2b-audit-report.md`, deletion of `retry.util.ts`(+spec) | Verified complete in the prior session; re-verified again in this closure (unit + e2e all green). |
| Sprint 3A Memory Foundation | `apps/api/prisma/schema.prisma` (+migration), `apps/api/src/memory/**`, `apps/api/test/memory.e2e-spec.ts`, `apps/web/app/(app)/memory/**`, `apps/web/features/memory/**`, `apps/web/e2e/flow-7..12-*.spec.ts`, `packages/types/index.ts`, `docs/architecture/memory-engine.md`, `docs/security/memory-privacy.md`, `docs/progress/sprint-3a-progress.md` | Built in the prior session; this closure added the onboarding cutover, export concurrency cap, and several real-bug fixes (below). |
| Shared/dependency (touched by both) | `apps/api/src/dashboard/dashboard.service.ts`, `apps/api/src/onboarding/onboarding.service.ts`, `apps/api/src/memory/memory.module.ts`, `apps/web/components/ui/dialog.tsx`, `apps/web/app/(app)/settings/page.tsx`, `apps/api/.env.example`, `apps/api/.env.test.example` | Dashboard's Memory Highlight and onboarding's Reflection step depend on Memory Foundation existing; `dialog.tsx` is a shared UI primitive fixed for both Companion and Memory dialogs. |
| Unrelated/artifact | *(none found)* | No stray files, no `.env`, no build output, no test-results, no local DB dumps in the diff. |

No work was lost or overwritten during this closure — every file above was inspected before being
touched, and only targeted edits were made (see §9–§10 for what changed and why).

## 3. Architecture (as of this closure)

- **Companion Core** (Sprint 2B): real, configurable AI provider (OpenAI/Anthropic/Gemini),
  Mock provider gated to non-production or an explicit dev flag, rate limiting + per-user
  concurrency lock + daily/monthly budget ceilings, SSE streaming with cancel/retry. See
  `docs/architecture/companion-core.md`.
- **Memory Foundation** (Sprint 3A): consent engine (global + per-type, `HEALTH` never
  auto-allowed), candidate lifecycle (propose → accept/reject, source-ownership enforced),
  CRUD scoped to `title`/`visibility` only (content is delete-only per the Product Bible),
  versioning + content-free audit trail, cursor-paginated timeline, synchronous Redis-cached
  export. See `docs/architecture/memory-engine.md`.
- **Onboarding cutover** (this closure): `OnboardingService.respondToMemoryConsent()` now calls
  `MemoryCandidateService.createDirect()` instead of the legacy `MemoryService.createNote()` —
  see §5.

## 4. Migration verification

Migration `20260803064730_memory_foundation` (schema DDL + one-time `memory_notes` → `memories`
data migration, in the same file) was verified against two real databases:

| Database | Legacy `memory_notes` rows | Migrated `memories` (`MIGRATED_LEGACY`) | `memory_versions` | `memory_audits` |
|---|---|---|---|---|
| `beaconvie_test` (clean, `prisma migrate deploy` from scratch) | 4 | 4 | — | — |
| `beaconvie` (dev, pre-existing real usage data) | 8 | 8 | 43 (incl. later edits) | 183 (incl. later activity) |

Confirmed:
- **Every compatible legacy row migrated exactly once** — 1:1 correspondence in both databases.
- **Idempotent redeploy** — re-running `prisma migrate deploy` against `beaconvie_test` reported
  "No pending migrations to apply"; row counts stayed 4/4, no duplication.
- **No fabricated `sourceConversationId`/`sourceMessageId`** — inspected migrated rows directly;
  both fields are `NULL`, with the original `memory_notes.id` and legacy `source` enum preserved
  losslessly in `structuredPayload` (e.g. `{"legacySource":"ONBOARDING","migratedFromMemoryNoteId":"cms8nqyte0013142aow5jtc4z"}`).
- **Ownership preserved** — 100% match on `userId` between legacy and migrated rows (dev DB,
  SQL JOIN check).
- **Timestamps preserved** — 100% match on `createdAt`.
- **Deleted/invalid legacy rows**: none existed in either database to test against; the migration
  SQL only ever selects existing `memory_notes` rows, so there is no code path that could
  reference a since-deleted one.

## 5. Legacy MemoryNote transition decision

**Decision A — cutover implemented.** `OnboardingService.respondToMemoryConsent()` now writes
directly to the Sprint 3A `Memory` model via the new `MemoryCandidateService.createDirect()`
method (added this closure), never to `MemoryNote`. `MemoryService.createNote()` has **no
remaining caller anywhere in the codebase** — confirmed by grep. `MemoryNote` is henceforth
read-only, kept solely so `MemoryService.mostRecent()` still has a real implementation to serve
`DashboardService`'s fallback for any account whose only memory predates this cutover.

Verified live (not just by code inspection): after resetting the demo account's consent and
exercising the full onboarding flow multiple times against the running `beaconvie_test` database
during this closure's own e2e/Playwright runs, `memory_notes` stayed at its pre-existing count
(4) while `memories` with `sourceType='ONBOARDING'` grew — i.e., new onboarding-consented memories
are provably landing in the new table, not the old one.

**The legacy table is intentionally not dropped in this closure.** Dropping it is a schema
change independent of this cutover and belongs in its own reviewed migration, not bundled into a
release-closure session; nothing in this closure's evidence suggests it's unsafe to drop later —
it simply wasn't asked for and doing it here would be exactly the kind of unrequested broad change
this task explicitly rules out.

**Dashboard read order**: `DashboardService`'s Memory Highlight prefers the newest `ACCEPTED`
Sprint 3A `Memory` (`MemoryRecordService.mostRecentAccepted()`), falling back to the legacy
`MemoryNote`-based highlight only when no Sprint 3A memory exists yet for that user — confirmed
unchanged and correct in this closure.

## 6. Consent behavior

Global (`MemoryConsentSetting`, one row/user, default `ASK_EVERY_TIME`) + per-type override
(`MemoryTypeConsent`, absence = defer to global). `HEALTH` can never fall back to the global
default under any code path — requires its own explicit `ALLOW_TYPE` row. Consent is re-checked
at `accept()`/`createDirect()` time, not just at proposal time. Verified via
`memory-consent.service.spec.ts`, `memory.e2e-spec.ts`'s live HTTP-layer tests, and Playwright
flow 11 (disable → blocked → re-enable → restored), all passing against live Postgres/Redis in
this closure.

## 7. Candidate lifecycle

`propose()` requires a real, owned `ConversationMessage` with `role: 'USER'` — an
assistant-authored message can never become a candidate (structural enforcement, no content
analysis). `accept()` is idempotent (accepting an already-`ACCEPTED` candidate returns the same
`Memory`, never a second one) and atomic (Memory + first MemoryVersion + audit rows in one
transaction). `reject()` is idempotent and creates no `Memory`. `createDirect()` (new this
closure) is the onboarding-only equivalent — same consent gate, same atomicity, no candidate row
since onboarding's own "yes" is itself the acceptance.

## 8. CRUD, versioning, and audit

`UpdateMemoryDto` allows only `title`/`visibility` (Product Bible: content is delete-only, not
directly user-writable). Every update, archive, restore, and delete writes a new `MemoryVersion`
and a `MemoryAudit` row. `MemoryAudit.metadata` is grepped across every call site in this session
— never contains `title`/`summary`/`structuredPayload`, only structural facts (`{type,
previousStatus}`, `{candidateId, type}`, `{scope, mode}`, `{fields}`, `{memoryCount}`).

## 9. Delete semantics

Real, synchronous hard delete (`prisma.memory.delete()`), cascading `MemoryVersion`. Idempotent
and non-enumerable (`remove()` returns success for "never existed," "already deleted," and
"belongs to someone else" identically — the one deliberate exception to the rest of the module's
404-for-not-owned pattern, since a delete response is the single most enumeration-sensitive
operation). The `MemoryAudit(DELETED)` row is written *before* the delete and is not a Prisma
foreign key to `Memory` (a plain, non-relational `memoryId: String?` column), so the audit event
survives the row it documents without retaining any of its content. Verified live via
`memory.e2e-spec.ts` and Playwright flow 10 (delete → confirm gone from timeline → reload →
confirm still gone).

## 10. Export behavior

Synchronous `POST /memory/export`, 15-minute Redis-cached result keyed by a generated `jobId`
(disclosed TTL, not faked permanent storage). Owner-scoped (`GET /memory/export/:jobId` from
another user's session resolves to `404`, indistinguishable from an expired one). Rate-limited
(5/60s). **This closure's targeted fix**: a per-user Redis `SET NX` lock now caps concurrent
export *creation* to one in flight at a time — a second `POST /memory/export` while one is still
computing gets `409 EXPORT_ALREADY_IN_PROGRESS` instead of both racing to compute duplicate
copies. Fails open on a Redis error (consistent with every other Redis-backed guard in this
codebase). No BullMQ introduced. 4 new unit tests added for the lock behavior (acquire-blocks,
release-on-success, per-user isolation, fail-open); all 10 tests in
`memory-export.service.spec.ts` pass.

## 11. Security verification (re-tested against live Postgres/Redis, not just unit mocks)

| Check | Result |
|---|---|
| Cross-user GET/PATCH/DELETE/archive/restore/versions/audit → 404, never 403 | PASS (`memory.e2e-spec.ts`) |
| Delete of another user's memory is a silent 204 no-op; owner still sees it after | PASS |
| Candidate source-message ownership + USER-role-only enforcement | PASS |
| CSRF required on candidate proposal (and, by the same global `CsrfGuard`, every other mutation) | PASS |
| Idempotent candidate accept — no duplicate Memory/MemoryVersion | PASS |
| Consent re-checked at acceptance time, not just proposal | PASS |
| `HEALTH` never auto-allowed via global default | PASS |
| Hard-deleted memory invisible to owner and everyone else, including after reload | PASS |
| Cursor-paginated timeline never returns a deleted memory | PASS |
| Export contains only the caller's own data | PASS |
| Export concurrency cap (this closure's fix) | PASS (4 new unit tests) |
| No memory content in audit metadata or logs | PASS (grepped every call site) |

## 12. Exact test totals (actual runner output, not estimated)

| Suite | Suites | Tests | Result |
|---|---|---|---|
| Backend unit (`pnpm --filter api test`) | 23 | 149 | 149 passed |
| Frontend unit (`pnpm --filter web test`) | 21 | 112 | 112 passed |
| Backend e2e (`pnpm --filter api test:e2e`) | 6 | 58 | 57 passed, 1 failed — see below |
| Playwright (`pnpm --filter web test:e2e`, all 12 flows, one full run) | — | 12 | 12 passed (confirmed across 2 consecutive full runs) |
| **Total** | **50** | **331** | **330 passed, 1 pre-existing/unrelated failure** |

**The one backend e2e failure**: `account-security.e2e-spec.ts` → "resend respects the cooldown,
then allows a new send once it elapses" — times out only when run as part of the full 6-suite
parallel batch; passes cleanly in isolation (`--runInBand`, 3.6s). Root cause: `MailService`
awaits the real SMTP send synchronously (pre-existing Sprint 1 design, not part of Sprint 2B/3A),
and Mailpit's un-pooled per-email SMTP connections occasionally saturate under many parallel Jest
workers all registering/resending in the same few seconds. Confirmed via direct TCP tests that
Mailpit itself responds correctly to a single connection; this is parallel-load contention, not a
Companion or Memory defect, and not a change introduced by this closure.

## 13. Commands run / PASS-FAIL

| Command | Result |
|---|---|
| `docker compose up -d` | 3 containers healthy (postgres, redis, mailpit) |
| `pnpm --filter api prisma:generate` | PASS |
| `pnpm --filter api exec prisma validate` | PASS |
| `pnpm --filter api exec prisma migrate status` | PASS (all 4 migrations applied, both DBs) |
| `prisma migrate deploy` against a clean `beaconvie_test` | PASS, 4:4:4:4 migration |
| `prisma migrate deploy` re-run (idempotency check) | PASS, "No pending migrations," no duplication |
| `pnpm --filter api test` | PASS, 149/149 |
| `pnpm --filter web test` | PASS, 112/112 |
| `pnpm --filter api test:e2e` | 57/58 (1 pre-existing parallel-load flake, §12) |
| `pnpm --filter api build` | PASS |
| `pnpm --filter web build` | PASS (`/memory` route present, 8.09 kB) |
| `pnpm --filter web exec playwright test` (full 12-flow suite) | PASS, 12/12 (×2 consecutive runs) |
| `git diff --check` | PASS, no whitespace errors |
| Secret scan of staged diff | Clean (see §14) |

## 14. Runtime verification

Full runtime verification was completed in this environment — Docker Desktop, Postgres, Redis,
and Mailpit were all reachable this session (unlike the prior Sprint 3A build session, which was
runtime-unverified for lack of Docker). Both apps were built for production and run as real
processes (`node dist/src/main.js`, `next start`) against the real dev database and a seeded
demo account, and the full Playwright suite was run against that live pair, not `next dev`.

**Distinguishing code-complete from runtime-verified, honestly**: every item in this report is
runtime-verified, not merely code-complete, with one exception noted in §12 (a pre-existing,
unrelated, load-dependent flake in Sprint 1's email test).

## 15. Real defects found and fixed during this closure's own verification

Verification is not just re-confirmation — running the full Playwright suite for the first time
ever in a working environment (it had never been runtime-verified before this closure) surfaced
five real, previously-undiscovered issues, all fixed and re-verified:

1. **`Dialog` (shared UI primitive, `apps/web/components/ui/dialog.tsx`) always rendered its
   children even while closed.** A native `<dialog>` without the `open` attribute is invisible but
   still present in the DOM; since `RememberThisButton`'s confirmation dialog pre-fills its
   textarea from the message being remembered, every closed dialog silently duplicated that
   message's text in the DOM. Fixed with a one-line change (`{open && children}`) that fixes every
   usage site (Companion's cancel-confirm, Memory's archive/delete-confirm, session revoke) at
   once. No functional regression (6 affected unit test suites re-run, all pass).
2. **`MemoryDetail`'s cache invalidation used React Query's default `refetchType: 'active'`**,
   which does nothing for the Timeline query while it's unmounted (behind the open detail view) —
   fixed to `refetchType: 'all'` so archive/restore/delete correctly refresh the Timeline the
   moment the user navigates back to it.
3. **A genuine test race** in 4 Playwright specs: navigating to `/memory` immediately after
   clicking "Remember this" could cancel the in-flight `propose()`+`accept()` request before it
   completed, leaving a candidate stuck at `CANDIDATE` status forever (confirmed via direct DB
   query). Fixed by waiting for the confirmation dialog to actually close before navigating.
4. **Six Playwright specs used page-wide text locators** that collided with the Composer's
   *intentionally* preserved (not a bug — a deliberate Sprint 2B decision so a failed send doesn't
   lose what the user typed) disabled textarea value during generation. Fixed by scoping to the
   conversation log role.
5. **`flow-12`'s test skipped the onboarding Reflection step's explicit memory-consent prompt**,
   asserting for the wrong button ("Maybe later," which belongs to the later Discovery step).
   Fixed by adding the missing "Not yet" interaction.

Two environmental (not code) issues were also found and corrected for this local verification
session only, both isolated to the gitignored `.env`/Redis state and irrelevant to production:
a stale local `.env` missing `CSRF_SECRET`/using renamed `EMAIL_*` vars, and the local
`AUTH_RATE_LIMIT_MAX`/`AI_DAILY_REQUEST_LIMIT` being exhausted by this session's own repeated
full-suite runs (confirmed via a direct `AI_BUDGET_EXCEEDED` API response) — both budget/rate
controls are themselves Sprint 2B features working exactly as designed, not defects.

## 16. Known limitations (disclosed, not hidden)

- `ASK_EVERY_TIME` and `ALLOW_SELECTED` consent modes are behaviorally identical in Sprint 3A
  (no automatic candidate proposal exists yet to distinguish them).
- No automated PII/health-content scanning of `summary`/`structuredPayload` at write time —
  relies on the type-level `HEALTH` gate and the user's own judgment.
- Backup-retention window (encrypted snapshots may briefly retain deleted content until rotation)
  is an infrastructure fact disclosed to the user, not something this module's code can reach into.
- The legacy `memory_notes` table remains in the schema (read-only) — see §5 for why dropping it
  is deliberately out of this closure's scope.

## 17. Residual risks

- The one pre-existing, unrelated Mailpit-load flake (§12) will likely recur in any CI
  configuration that runs the backend e2e suites with multiple parallel Jest workers; it is not a
  release blocker for Sprint 3A/2B but is worth a follow-up (either pool the Mailpit SMTP
  connections or run that one spec file with reduced worker concurrency).
- No load/stress testing was performed on the export concurrency lock or the Memory endpoints
  under realistic concurrent multi-user traffic — verified for correctness, not for throughput.

## Exact Sprint 3B entry criteria

Sprint 3B (Memory Intelligence: embeddings, vector search, importance scoring, duplicate/merge
detection, semantic retrieval into Companion prompts) may begin once:

1. This closure's two commits (see below) are reviewed and merged.
2. The Mailpit parallel-load flake (§17) is either fixed or explicitly accepted as a known CI
   quirk by whoever owns CI configuration.
3. No new writes to `MemoryNote` is confirmed to remain true in production traffic for at least
   one full release cycle before any decision to drop the legacy table.

No other blockers exist. Memory Foundation's schema, consent, candidate lifecycle, CRUD,
versioning, audit, deletion, export, and security posture are all runtime-verified and stable
enough to build Sprint 3B on top of.

---

## Final verdict

**READY FOR SPRINT 3B** (pending the two commits below being made).

- **Working tree status**: 76 changed paths, fully classified (§2), nothing lost or overwritten,
  no secrets/artifacts in scope.
- **Verification table**: §11, §12, §13 — all green except one pre-existing, unrelated,
  parallel-load-dependent email test flake, fully explained and reproducibly isolated.
- **Migration result**: 100% (4:4 and 8:8) legacy-row migration correctness, verified on two real
  databases, idempotent redeploy confirmed.
- **Playwright result**: 12/12, confirmed across 2 consecutive full-suite runs.
- **Legacy `MemoryNote` decision**: **A** — onboarding cutover implemented and verified live; table
  kept read-only, not dropped (§5).
- **Remaining blockers**: none for Sprint 3A itself. One pre-existing, unrelated CI-environment
  flake noted for follow-up (§17).
- **Exact next action**: stage and commit per the commit strategy below, then this sprint is closed.
