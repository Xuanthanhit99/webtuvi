# Memory Foundation: Privacy and Security (Sprint 3A)

Covers the threat model, controls, deletion semantics, consent model, audit/logging policy, and
residual risks for Memory Foundation. See docs/architecture/memory-engine.md for the functional
design this document assumes.

> **Sprint 3C note**: Companion's new "Remember"/"Not now"/"Never remember this type"/"Forget"
> actions (`companion/memory/*`) call exactly the mutations documented here
> (`propose`/`accept`/`updateType`/`remove`) through the same guards (`JwtAuthGuard`, the
> project-wide `CsrfGuard`, per-`userId` scoping) — no new authorization path, no new deletion
> semantics, no new consent model. `MemoryRetrievalService.recommend()`'s consent re-check and
> `ACCEPTED`-only filter (see memory-intelligence.md) now also gate what a live Companion prompt
> can see, not only the standalone `/memory/recommendations` endpoint. See
> docs/architecture/companion-memory-integration.md "Privacy and consent enforcement"/"Security".

## Threat model

| Threat | Mitigation |
|---|---|
| **IDOR / ownership bypass** — reading, patching, archiving, restoring, deleting, or exporting another user's memory | Every `MemoryRecordService`/`MemoryCandidateService`/`MemoryExportService` method scopes its query by `userId` (either a `findFirst({where:{id, userId}})` or an explicit ownership check followed by `NotFoundException`, never `SoleException`/403) — see "Ownership" below for the one deliberate exception (delete). |
| **Enumeration** — probing memory ids to learn whether they exist or belong to someone else | `getOne`/`update`/`archive`/`restore`/`versions`/`auditTrail` all return an identical `404 MEMORY_NOT_FOUND` whether the id truly doesn't exist or belongs to another user — no distinguishing error. `remove()` goes further: it returns success (204) whether the memory never existed, was already deleted, or belongs to someone else, so a delete call leaks nothing at all about existence (see "Deletion semantics"). |
| **Mass assignment** — a client sending `userId`, `sourceType`, `status`, `summary`, etc. in a PATCH body to overwrite fields it shouldn't control | `UpdateMemoryDto` only declares `title`/`visibility`; NestJS's global `ValidationPipe` is configured with `whitelist: true, forbidNonWhitelisted: true` (see `test-app.ts`/`main.ts`), so a request body containing any undeclared field is rejected outright (`400`) before it ever reaches the service — not silently stripped. Directly verified in `memory.e2e-spec.ts` (release closure): a PATCH containing `summary` alongside `title` gets `400`, not a silent partial update. |
| **Deleted-memory access** — reading a deleted memory via any surface | Structurally impossible: `remove()` hard-deletes the row (cascading `MemoryVersion`). Every subsequent read (`getOne`, `list`, `timeline`, export) queries the same table and simply finds nothing — there is no separate "is deleted" flag to forget to check at some call site. |
| **Archived-memory access policy** | An archived memory is fully readable/restorable by its owner (it's still their data, just deprioritized) — only the *default* `list()`/`timeline()` filters exclude it; an explicit `status=ARCHIVED` filter (or `getOne`) still returns it. This is an intentional, disclosed difference from deletion, not a gap. |
| **Candidate consent bypass** — accepting a candidate for a type consent currently denies | `MemoryCandidateService.accept()` re-checks `MemoryConsentService.canAccept()` at acceptance time (not just at proposal time, since settings can change in between) and throws `403 MEMORY_CONSENT_DENIED` if it's not currently allowed. There is exactly one gate (`canAccept()`); no caller — including Companion's "Remember this" flow — has an alternate path around it. |
| **Source-message ownership** — proposing a candidate sourced from someone else's conversation, or from an assistant-authored message | `propose()` verifies `Conversation.userId === callerId` (404 otherwise) and `ConversationMessage.role === 'USER'` (400 otherwise) before ever creating a candidate. Both checks happen before any database write. |
| **CSRF on mutations** | Every mutating memory/candidate/consent/export route is a `POST`/`PATCH`/`PUT`/`DELETE`, and the project-wide `CsrfGuard` (`APP_GUARD`, unconditional double-submit check) already covers all of them — no per-route opt-out exists in this module. Directly re-tested for candidate proposal in `memory.e2e-spec.ts`. |
| **Export authorization / abuse** | `POST /memory/export` requires `JwtAuthGuard` like every other route, additionally rate-limited (5/60s, tighter than the `default` throttler's 1000/60s) since a full export is a heavier operation than an ordinary request. `GET /memory/export/:jobId` is scoped by `userId` in the Redis cache key — another user's `jobId`, even if guessed, resolves to nothing (`404`, indistinguishable from an expired one). |
| **Audit data exposure** | `MemoryAudit.metadata` is restricted by convention (every call site in this codebase only ever passes small structural facts: `{type, previousStatus}`, `{candidateId, type}`, `{scope, mode}`, `{fields}`) — never `title`/`summary`/`structuredPayload` or any other content field. There is no generic "log whatever you're given" call site that could accidentally leak content. |
| **Logs and telemetry** | No memory content is ever passed to `Logger` calls anywhere in this module (grepped every `this.logger.*` call site in `memory/`) — only error class names/stack traces and structural facts, matching Companion Core's existing observability discipline (`docs/security/ai-safety.md`). |
| **Health-data consent** | See "Consent model" below — `HEALTH` never falls back to the global default under any code path. |
| **Pagination abuse** | `pageSize`/`limit` are both validated and capped (`@Max(100)` for list, `@Max(50)` for timeline) via `class-validator` on the query DTOs — a client cannot request an unbounded page. |

## Ownership

Every read/mutate method (`getOne`, `update`, `archive`, `restore`, `versions`, `auditTrail`, and every
candidate method) throws `404 MEMORY_NOT_FOUND`/`MEMORY_CANDIDATE_NOT_FOUND` for a resource that
doesn't exist **or** belongs to another user — the same code path, the same response, so an attacker
learns nothing about which case they hit. `remove()` is the one deliberate exception: it silently
succeeds (204) for all three cases (never existed, already deleted, belongs to someone else) rather
than 404ing, which is an even stronger non-enumerability guarantee for the one operation where "did
this exist" is the most privacy-sensitive question. See "Deletion semantics" below.

## Deletion semantics — "delete means delete," stated honestly

- **Query-layer invisibility**: immediate. `remove()` executes `prisma.memory.delete()` synchronously,
  in the same request — there is no async queue between "user clicked delete" and "the row is gone."
  Every subsequent `getOne`/`list`/`timeline`/export call queries the same table and finds nothing.
- **Deletion timestamp**: recorded on the `MemoryAudit(action: DELETED)` row's own `createdAt`
  (written immediately before the delete, in the same call) — the `Memory` row itself does not carry
  a lingering `deletedAt` past its own deletion, since the row ceases to exist.
- **Hard deletion is synchronous, not asynchronous.** No background job, no eventual-consistency
  window, no BullMQ queue is introduced anywhere in this module. The row and its `MemoryVersion`
  history (cascade) are gone by the time the `DELETE /memory/:id` response returns.
- **Backup-retention limitation (the one honest caveat)**: primary-database deletion is immediate and
  complete. Point-in-time database backups/snapshots taken *before* the delete may still contain the
  deleted row until they are rotated out per the infrastructure's standard backup-retention schedule
  (a Sprint 3A product/infra decision, not something this module's code can or should try to reach
  into and purge). This is disclosed directly to the user in Settings ("A copy may briefly remain in
  encrypted backups until the next backup rotation, never used to restore it in the product") — Sprint
  3A does not claim instantaneous, complete erasure everywhere including historical backups, because
  that would not be true.
- **Audit retention without retaining memory content**: `MemoryAudit.memoryId` is a plain, indexed
  string column — deliberately **not** a Prisma-level foreign key to `Memory`. This is the one place
  in the schema where a would-be FK is intentionally omitted: an enforced FK with `onDelete: Cascade`
  would delete the `DELETED` audit row along with the `Memory` it documents, defeating the entire
  purpose of having an audit trail survive the thing it's auditing; `onDelete: SetNull` would erase
  which memory the event was even about. A plain string column has neither problem — the audit event
  (action, timestamp, actor, safe metadata) survives indefinitely, while the row it refers to is
  genuinely gone.
- **Source-message retention behavior**: deleting a `Memory` does **not** delete its source
  `ConversationMessage`/`Conversation` — Companion Core's own retention rules govern those
  independently. This mirrors the Product Bible's explicit "a deleted memory does not retroactively
  rewrite past-generated content" principle (Module 10 §15): the conversation record itself is a
  separate system with its own lifecycle, not memory content.
- **Cached-data invalidation**: Sprint 3A introduces no memory-content cache anywhere (the only Redis
  usage in this module is the export-job cache and the pre-existing rate limiter/concurrency
  infrastructure from Sprint 2B) — there is nothing content-shaped to invalidate. The export cache
  itself expires on its own 15-minute TTL regardless; a delete that happens to fall within that window
  does not retroactively scrub an already-generated export snapshot, for the same "what was true when
  it was generated" reason Reports don't retroactively rewrite themselves.
- **Idempotency**: calling `DELETE /memory/:id` a second time (or a hundredth time) on the same id
  produces the identical `204` response as the first call once the row is gone — there is no special
  "already deleted" error state to reach.
- **Non-enumerability**: another user can never infer that a memory existed via a delete call — see
  "Ownership" above.

## Consent model

`MemoryConsentService` is the single source of truth (see memory-engine.md "Consent engine"). Modes:
`ASK_EVERY_TIME` (the conservative default — every acceptance is already an explicit, one-at-a-time
user action in this sprint, so this and `ALLOW_SELECTED` behave identically at accept-time; the
distinction matters for a future sprint's candidate *auto-proposal* UX, not for anything Sprint 3A
does), `ALLOW_SELECTED`, `ALLOW_TYPE` (auto-allow that type), `DENY_TYPE` (block that type), `DISABLED`
(block every type). No type is ever auto-allowed by the mere absence of a row — absence means "defer
to the global default," and the global default itself starts at the most conservative setting.

**`HEALTH` is never auto-allowed under any code path.** `canAccept()` special-cases `HEALTH` before
even looking at the global default: it requires its own `MemoryTypeConsent` row with exactly
`mode: 'ALLOW_TYPE'`. Setting the global mode to `ALLOW_TYPE`, or setting a `HEALTH`-specific override
to anything other than `ALLOW_TYPE` (including `ALLOW_SELECTED`), still blocks it — verified directly
in `memory-consent.service.spec.ts`'s "HEALTH — never auto-allowed" test group and re-verified at the
HTTP layer in `memory.e2e-spec.ts`.

Disabling memory (global `DISABLED`) blocks new candidates from being **accepted** — it does not
delete, hide, or otherwise touch any existing `Memory` row; those remain fully visible and manageable
(archive/restore/delete/export) by their owner exactly as before.

## Audit / logging policy

`MemoryAudit` records events (`CREATED`, `ACCEPTED`, `REJECTED`, `UPDATED`, `ARCHIVED`, `RESTORED`,
`DELETED`, `CONSENT_CHANGED`, `VIEWED`, `EXPORTED`) with `actorType`, `userId`, `memoryId` (nullable,
not an FK — see "Deletion semantics"), `requestId`, and a small `metadata` JSON object of safe,
structural facts only. **Never logged or persisted anywhere in this module**: `title`, `summary`,
`structuredPayload`, raw conversation content, PII, passwords, JWTs, or API keys. This mirrors
Companion Core's own established observability discipline (`docs/security/ai-safety.md`
"Observability") applied to the Memory domain specifically.

A failure to write a `MemoryAudit` row is caught and logged but never allowed to break the calling
operation (`MemoryAuditService.record()`'s `try`/`catch`) — audit is best-effort observability, not a
transactional guarantee that could itself become a new failure mode for Memory CRUD.

## Residual risks

- **`ASK_EVERY_TIME` and `ALLOW_SELECTED` are behaviorally identical in this sprint** (see "Consent
  model" above) because Sprint 3A has no automatic candidate proposal to distinguish "ask me" from
  "only what I select" against. This is a real, disclosed simplification, not a bug — it becomes a
  meaningful distinction once a future sprint introduces any automatic/background candidate proposal.
- **Export rate limiting (5/60s) is enforced by the same fail-open Redis-backed throttler as
  Companion's rate limits** (Sprint 2A/2B) — a Redis outage would allow export requests through
  unthrottled rather than blocking the feature entirely, an accepted availability-over-strictness
  trade-off consistent with the rest of the codebase, not unique to Memory.
- **The export-job Redis cache has no cap on how many distinct cached jobs a user accumulates over
  time** — calling `POST /memory/export` repeatedly (bounded by the 5/60s rate limit) still produces a
  separate 15-minute-TTL cache entry per call. At Sprint 3A's expected scale this is a non-issue.
  (Release closure note: a per-user Redis `SET NX` lock now caps *concurrent, in-flight* export
  creation to one at a time — a second `POST /memory/export` while one is still computing gets `409
  EXPORT_ALREADY_IN_PROGRESS` rather than both racing to compute their own copy — but this is a
  no-unbounded-concurrency fix, not a cap on total accumulated cache entries over time, which remains
  the disclosed limitation above.)
- **No automated PII/health-content scanning of `summary`/`structuredPayload` at write time** — the
  system relies entirely on the type-level `HEALTH` consent gate and the user's own judgment about
  what they ask BeaconVie to remember; there is no content classifier (deliberately, per this sprint's
  explicit non-goals) that would catch, say, health information disclosed under a non-`HEALTH` type.
  This is the same category of limitation Companion Core's crisis/PII detectors already disclose
  (`docs/security/ai-safety.md`) — heuristic/structural controls, not a content-understanding system.
- **Backup-retention window is an infrastructure fact, not something this module enforces or
  verifies** — see "Deletion semantics." No code in this sprint attempts to reach into or purge backup
  systems; this is disclosed to the user rather than concealed.

## Production checklist

- [ ] Confirm the actual backup-rotation window with infrastructure/ops and update the user-facing
      copy in Settings if it materially differs from "the next backup rotation."
- [ ] Confirm Redis eviction policy doesn't prematurely drop export-job cache entries under memory
      pressure before their intended 15-minute TTL (would surface as an unexpectedly early "export not
      available" 404 — not a security issue, but a UX one worth monitoring).
- [ ] If `HEALTH` memories are expected to see meaningful real-world usage, consider a follow-up sprint
      revisiting whether a stronger technical safeguard (beyond the consent gate) is warranted before
      scaling.
- [x] `memory.e2e-spec.ts` (13 tests) re-run against live Postgres/Redis during the Sprint 3A release
      closure — all passing. See docs/progress/sprint-3a-final-report.md for the full runtime
      verification evidence, including the Sprint 3A Playwright flows (7–12).
