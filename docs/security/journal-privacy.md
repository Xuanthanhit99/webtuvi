# Journal Foundation: Privacy and Security (Sprint 4A)

Covers the threat model, controls, lifecycle/deletion semantics, and residual risks for Journal
Foundation. See `docs/architecture/journal-foundation.md` for the full functional design this
document assumes.

## Threat model

| Threat | Mitigation |
|---|---|
| **IDOR / ownership bypass** — reading, updating, autosaving, publishing, archiving, restoring, deleting, duplicating, or exporting another user's journal entry | Every `JournalRecordService`/`JournalExportService` method scopes its query by `(id, userId)` via `findOwned()` (or an equivalent `findFirst({where:{id,userId}})`) and throws `NotFoundException` otherwise — verified directly in `journal.e2e-spec.ts`'s "a non-owner cannot update, archive, restore, delete, duplicate, or read revisions" and the export ownership tests. |
| **Enumeration** — probing entry ids to learn whether they exist or belong to someone else | Every read/mutate method returns an identical `404 JOURNAL_NOT_FOUND` whether the id truly doesn't exist or belongs to another user — directly asserted (`journal.e2e-spec.ts`: "identical 404 for nonexistent and someone else's"). |
| **Mass assignment** — a client sending `userId`, `state`, `sourceType`, `wordCount`, `version`, etc. in a create/update body | `CreateJournalDto`/`UpdateJournalDto` only declare the fields a user is actually meant to control (`title`/`content`/`mood`/`tags`, plus `visibility`/`pinned` on update); the global `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true`) rejects any undeclared field outright, not silently strips it. |
| **Companion-sourced content spoofing** — a client claiming an arbitrary journal entry "came from" a conversation/message it doesn't own, or forging journal content as if Companion wrote it | Structurally impossible via the public API: `CreateJournalDto` has no `sourceConversationId`/`sourceMessageId`/`sourceType` fields at all. The only path that ever sets them (`CompanionJournalService.saveFromSuggestion()`) independently verifies the conversation belongs to the caller and the source message is `role: 'USER'` before calling `JournalRecordService.create()`'s internal `source` parameter — the same check `MemoryCandidateService.propose()` already performs for Memory. Verified in `journal.e2e-spec.ts`: rejects a conversation the caller doesn't own (404) and an assistant-authored source message (400). |
| **Deleted-entry access by another user** | Structurally impossible — every ownership check is on `(id, userId)` regardless of `state`; a `DELETED` entry is only ever readable by its actual owner, the same as any other state. |
| **Deleted-entry leakage into normal browsing** | `list()`/`timeline()` exclude `DELETED` (and `ARCHIVED`) by default; only an explicit `state=DELETED` filter (the dedicated "recently deleted" view) or a direct `GET /journal/:id` by the owner ever surfaces one. Verified in `journal.e2e-spec.ts`: a soft-deleted entry never appears in the default list, and is directly reachable and restorable by the owner. |
| **Archived-entry access policy** | Same policy as Memory's own archived state: fully readable/restorable by the owner, excluded only from the *default* list/timeline filters. |
| **Draft isolation** | `autosave()` is reachable only for an entry the caller owns (same `findOwned()` gate) and only while `state: 'DRAFT'` — rejected with `409 JOURNAL_NOT_DRAFT` once published, archived, or deleted. |
| **CSRF on mutations** | Every mutating journal/companion-journal route is a `POST`/`PATCH`/`DELETE`, and the project-wide `CsrfGuard` (`APP_GUARD`, unconditional double-submit check) already covers all of them — no per-route opt-out. Directly re-tested for entry creation and both Companion-journal mutation endpoints in `journal.e2e-spec.ts`. |
| **Export authorization / abuse** | `POST /journal/export` (account-wide) requires `JwtAuthGuard` like every other route, additionally rate-limited (5/60s, matching Memory's own export throttle) since it is a heavier operation than an ordinary request. `GET /journal/export/:jobId` is scoped by `userId` in the Redis cache key — another user's `jobId`, even if guessed, resolves to nothing. Per-entry export (`GET /journal/:id/export/markdown\|json`) is a lightweight single-row read, ownership-checked the same as every other per-entry method, without a dedicated throttle (matching the codebase's existing practice of reserving dedicated rate limits for the heaviest operations only). |
| **Content-size abuse** | `content` is capped at 200,000 characters (`@MaxLength`) on both create and update DTOs — a client cannot submit an unbounded payload. |
| **Search-query injection** | All filtering (`q`, `tag`, `mood`, `state`, date range) goes through Prisma's parameterized query builder (`contains`/`has`/exact-match) — never raw/interpolated SQL. |
| **Logs and telemetry** | No journal content, title, or search query text is ever passed to a `Logger` call anywhere in this module or `companion/journal/` — grepped every `logger.*` call site to confirm; only entry ids, counts, and booleans. |
| **Pagination abuse** | `pageSize` is capped (`@Max(100)`) and `timeline`'s `limit` is capped (`@Max(100)`) via `class-validator` on the query DTOs. |

## Ownership

Every read/mutate method throws an identical `404 JOURNAL_NOT_FOUND` for a resource that doesn't
exist **or** belongs to another user — the same code path, the same response, so an attacker
learns nothing about which case they hit. Unlike Memory's `remove()` (which is deliberately silent
for non-owners, matching hard-delete's stronger non-enumerability need), Journal's `remove()` is a
normal owned-mutation (soft delete) and follows the standard `findOwned()` 404 pattern like every
other method here — there is no separate silent-delete surface to reason about, since the entry
itself is never actually removed from the database.

## Lifecycle / deletion semantics — stated honestly

- **Soft delete, by explicit design, different from Memory's hard delete.** `remove()` transitions
  `state` to `DELETED` and records `previousState`/`deletedAt`; the row is never removed from the
  database this sprint. This is a deliberate difference between the two features (see
  `docs/architecture/journal-foundation.md` "Lifecycle"), not an inconsistency — Journal's own
  brief explicitly asks for a `deleted` *state* and a distinct `Restore` operation, which only make
  sense against a soft-delete model.
- **No background purge.** No cron/queue/sweep job exists this sprint to eventually hard-delete
  old `DELETED` rows. A soft-deleted entry, left alone, remains recoverable (and, structurally,
  still present in the database, still `userId`-scoped and never exposed to anyone else)
  indefinitely. This is disclosed as a residual risk below, not silently assumed away.
- **Restore is exact, not a guess.** `previousState` is recorded at the moment of archiving or
  deleting, and `restore()` always returns to exactly that value.
- **Revisions cascade with their parent entry** (`onDelete: Cascade`) — unlike `MemoryAudit`,
  which deliberately survives its parent `Memory`'s deletion. This is correct for Journal because
  the parent row itself never actually disappears on a normal soft delete; a revision losing its
  meaning only if the row is one day hard-deleted (not implemented this sprint) is an accepted,
  disclosed consequence of that future, not-yet-built feature, not a gap in this one.

## Consent model

Journal Foundation introduces **no consent model** — see
`docs/architecture/journal-foundation.md` "Relationship to Memory Foundation" for why: a journal
entry is directly authored by the user, with no system-proposed-candidate step to gate. The one
Journal-specific preference this sprint needs, "Never suggest again" on the Companion suggestion
card, is a single boolean (`UserPreference.journalSuggestionsEnabled`) — not a new consent-table
family, since there is no per-type dimension to distinguish (one detector, not eighteen memory
types).

## Audit / logging policy

No dedicated `JournalAudit` table (mirroring `MemoryAudit`'s full user-facing activity trail) was
introduced this sprint — see `docs/architecture/journal-foundation.md` "Deliberate scope
decisions" for why. `JournalRevision` already provides a complete, user-facing content history for
every meaningful edit, which is the primary transparency surface Journal's own brief asks for
(Phase 2's "Revision history"). System-level observability (Phase 12) is structured `Logger`
output only — see "Logs and telemetry" above.

## Residual risks

- **No background purge of long-soft-deleted entries** — see "Lifecycle" above. At this sprint's
  expected scale this is a non-issue; a future sprint could add a scheduled sweep (with its own
  disclosed retention window) if storage or product requirements ever call for it. Not implemented
  here because no background-job infrastructure is otherwise needed by this sprint, and inventing
  one solely for this would be premature.
- **No per-route rate limit on `autosave`/per-entry export/Companion `save`** — only the global
  default throttler (1000/60s) applies. Consistent with this codebase's existing practice of
  reserving dedicated throttles for the heaviest operations (account-wide export, AI generation)
  rather than every mutation; all three are strictly `userId`-scoped, so the only realistic impact
  of abuse is a caller hammering their own account, not a cross-user exposure.
- **`SHARED` visibility has no functional sharing mechanism behind it yet** — see
  "Privacy"/"Deliberate scope decisions" in the architecture doc. Setting an entry to `SHARED`
  today has no observable effect beyond the stored field itself; this is disclosed as
  intentionally future-ready, not a broken feature.
- **Last-write-wins autosave, no operational-transform/CRDT conflict resolution** — an accepted,
  disclosed consequence of "no collaborative editing" being explicitly out of scope. A single
  owner's own two tabs open on the same draft could overwrite each other's autosave; this is the
  same class of limitation as any single-writer document editor without real-time collaboration,
  not a data-integrity defect (no other user can ever reach the row to trigger it).

## Production checklist

- [ ] If Journal is expected to accumulate a large volume of long-lived `DELETED` rows at
      production scale, revisit the "no background purge" decision above with an explicit,
      disclosed retention window.
- [ ] If `SHARED` visibility becomes a real, user-facing feature in a future sprint, this document
      and the architecture doc's "Privacy" section need a full rewrite for the actual sharing
      mechanism — not an incremental patch.
