# BeaconVie — Sprint 3A Progress: Memory Foundation

## 0. Repository audit (Phase 0)

- **Git branch**: `master`. **HEAD**: `3284287` ("[update][commit]" — Sprint 2B code-complete commit).
- **Working tree at Sprint 3A start**: NOT clean — it carries the full, uncommitted Sprint 2B audit
  remediation (mock-provider production gating, rate limit/concurrency/budget, composer draft fix,
  auto-scroll fix, screen-reader streaming fix, and associated docs/tests). That remediation was
  verified in its own session (lint/typecheck/full test suites/builds all green) but never committed.
  Sprint 3A is built on top of this working tree as-is, per instructions not to rewrite prior sprints.
  This is called out explicitly so it isn't mistaken for Sprint 3A's own scope creep.
- **Existing memory-adjacent structures found**:
  - `MemoryNote` (Prisma model, `apps/api/prisma/schema.prisma`): Sprint 1's only "memory" — one flat
    row per note (`userId`, `content`, `source: ONBOARDING|COMPANION`, `createdAt`). No type, no status,
    no consent, no versioning, no audit, no user-facing UI. Written only by `MemoryService.createNote`
    (`apps/api/src/memory/memory.service.ts`), called from `onboarding.service.ts` (the deterministic
    Reflection-step flow) and read by `dashboard.service.ts` (`mostRecent()`, for the Dashboard Memory
    Highlight). This is the "Sprint 1 temporary memory structure" Phase 0 asks about.
  - `UserPreference.memoryPreference` (`ASK_BEFORE_SAVING` / `SAVE_SELECTED_ONLY` / `DO_NOT_SAVE_YET`):
    a Sprint 1 onboarding-level global toggle, surfaced today in Settings. This is a *different*
    subsystem from Sprint 3A's new per-type `MemoryConsent` engine — see §7 "Consent behavior" below
    for how the two coexist without becoming two competing consent systems.
  - `CompanionMessage` / `Conversation` + `ConversationMessage` (Sprint 2B): the real source material
    Sprint 3A's `Memory`/`MemoryCandidate` records trace back to via `sourceConversationId`/
    `sourceMessageId`.
- **Decision**: `MemoryNote` is **preserved, not dropped**. It is migrated (compatible rows copied,
  tagged with an explicit migration source marker) into the new `Memory` model, and the table itself is
  kept (deprecated, not deleted) because `onboarding.service.ts` still writes to it via
  `MemoryService.createNote` and `dashboard.service.ts` still reads it via `MemoryService.mostRecent`.
  Rewiring onboarding/dashboard onto the new model is out of this sprint's stated scope (no request to
  touch onboarding's proven flow) and risks exactly the kind of "rewrite previous sprints" this task
  explicitly forbids. See §6 "Temporary-data migration" for the full reasoning once implemented.

## 1. Current phase

**Complete.** All phases (0–17) implemented and verified to the extent possible in this environment.

## 2. Completed work

- Phase 1/2: domain model + additive Prisma schema (`Memory`, `MemoryVersion`, `MemoryAudit`,
  `MemoryConsentSetting`, `MemoryTypeConsent`, `MemoryCandidate`, 7 new enums). Migration
  `20260803064730_memory_foundation` generated offline via `prisma migrate diff` (no live DB needed)
  and hand-verified against the schema.
- Phase 3: data migration of every `memory_notes` row into `Memory` (`sourceType: MIGRATED_LEGACY`),
  in the same migration file. `MemoryNote`/`MemoryService` kept, unchanged, deprecated-not-removed.
- Phase 4: `MemoryConsentService` — global + per-type consent, `HEALTH` never auto-allowed.
- Phase 5: `MemoryCandidateService` — propose/list/accept/reject, source-ownership + user-authored
  checks, idempotent accept/reject, atomic Memory+MemoryVersion creation.
- Phase 6/7: `MemoryRecordService` — CRUD, PATCH allowlist (title/visibility only — see the
  architecture doc for why), archive/restore, hard-delete with idempotent/non-enumerable semantics.
- Phase 8: versioning (`MemoryVersion`) + audit (`MemoryAudit`, content-free).
- Phase 9: timeline — cursor pagination, grouping, filters, "why this memory"/consent explanation.
- Phase 10/11: `/memory` page (Timeline/Candidates/Consent sections + detail view) and Settings
  integration (same `ConsentSettings` component, no second consent system).
- Phase 12: Dashboard highlight now prefers a real accepted `Memory`; Companion's "Remember this"
  button (user messages only) is the sole Companion→Memory candidate path.
- Phase 13: synchronous export with a 15-minute Redis-cached job id.
- Phase 14/15: `docs/security/memory-privacy.md` (threat model, deletion semantics, consent model,
  audit policy, residual risks, production checklist); no memory content anywhere in logs/audit.
- Phase 16: 145 backend unit tests (30 new + 115 pre-existing, all still passing), 1 new e2e spec
  file (`memory.e2e-spec.ts`, runtime-unverified — no DB in this environment), 112 frontend tests
  (22 new), 6 new Playwright flows (7–12).
- Phase 17: `docs/architecture/memory-engine.md`, `docs/security/memory-privacy.md`, this file,
  Swagger via existing `@ApiTags`/`@ApiOperation` decorators on every new controller. No `.env`
  changes were needed (no new configuration introduced). README not updated — see final report's
  "Known limitations."

## 3. Pending work

None outstanding for Sprint 3A's own scope. Backend e2e, `prisma migrate status`, and Playwright are
runtime-unverified (infrastructure, not code) — see Blockers.

## 4. Commands run / PASS-FAIL

See the final report (`Agent` response) for the authoritative, complete command/result table.
Summary: lint PASS, typecheck PASS (both apps), backend unit 145/145 PASS, frontend unit 112/112 PASS,
API build PASS, web build PASS (new `/memory` route present, 8.09 kB), `prisma validate` PASS,
`git diff --check` PASS, secret scan PASS (no matches). `prisma migrate status`, backend e2e, and
Playwright are runtime-unverified (no reachable Postgres/Redis/Docker in this environment).

## 5. Blockers

- Docker Desktop is unreachable in this environment (confirmed again, consistent with the Sprint 2B
  audit and remediation sessions). Backend e2e, `prisma migrate status` against a live database, and
  Playwright are **runtime-unverified** here, same as before. Everything else that doesn't need a
  live Postgres/Redis was run directly and passed.

## 6. Exact next action

Run `memory.e2e-spec.ts`, `prisma migrate status`, and the Sprint 3A Playwright flows (7–12) in CI or
any environment with reachable Postgres/Redis to close out the remaining unverified items. If those
pass, Sprint 3A is ready for release closure and Sprint 3B (Memory Intelligence — embeddings, vector
search, importance scoring, duplicate/merge detection, semantic retrieval into Companion prompts) can
begin on top of this foundation.
