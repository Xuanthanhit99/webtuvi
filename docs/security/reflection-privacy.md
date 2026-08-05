# Reflection Foundation: Privacy and Security (Sprint 4B)

Covers the threat model, controls, and residual risks for Reflection Foundation. See
`docs/architecture/reflection-foundation.md` for the full functional design this document
assumes.

## Threat model

| Threat | Mitigation |
|---|---|
| **IDOR / ownership bypass** — reading, archiving, or dismissing another user's reflection candidate | Every `ReflectionRecordService` method scopes its query by `(id, userId)` via `findOwned()` and throws `NotFoundException` otherwise — verified in `reflection-record.service.spec.ts`'s ownership tests. |
| **Enumeration** — probing candidate ids to learn whether they exist or belong to someone else | `findOwned()` returns an identical `404 REFLECTION_NOT_FOUND` for both cases — the same pattern Memory/Journal already use. |
| **Cross-user data leakage into a candidate's evidence** | Every rule in `reflection-rules.ts` operates only on the single `ReflectionUserData` snapshot `ReflectionDataSourceService.fetch(userId)` produces, itself built from `userId`-scoped Prisma queries (including the reused `MemoryConflictService.detectForUser(userId)` call) — there is no code path in the rule engine that reads another user's rows. |
| **Fabricated sources** | Structural, not just conventional: `ReflectionSourceRef` rows are only ever created from a `ReflectionRuleFinding.sources` array, itself only ever built from records already present in the `ReflectionUserData` snapshot the rule was given — a rule cannot cite an id it wasn't handed. `GoalActivityMismatchRule`, whose whole premise is an *absence* of evidence, cites only the real goal memory, never a placeholder for the missing activity. |
| **Companion hint content leakage** | `GET /companion/reflection-hint` (`ReflectionHintService.getHint()`) returns only `{ available, reflectionId, category }` — never `reason`, `sources`, or `scoreExplanation`. A client cannot learn anything about the candidate's content without a separate, ownership-checked `GET /reflections/:id` call. |
| **Stale/expired data continuing to be surfaced** | `ReflectionValidityService.revalidateForUser()` runs before every read (list/feed/timeline/groups/statistics/detail/Companion hint) and expires any `NEW`/`READY` candidate whose cited `Memory` no longer exists or whose cited `JournalEntry` is soft-deleted — verified in `reflection-validity.service.spec.ts` and end-to-end in `flow-15-reflection-foundation.spec.ts`'s second test. |
| **Resurrected dismissed/archived candidates** | `ReflectionGenerationService.ensureGenerated()` looks up existing candidates by `dedupeKey` and explicitly skips regeneration for any row already `DISMISSED`/`ARCHIVED`/`EXPIRED` — verified in `reflection-generation.service.spec.ts`. |
| **Stale reflection after Memory consent is revoked** | `ReflectionDataSourceService.fetch()` and `ReflectionValidityService.revalidateForUser()` both re-check `MemoryConsentService.canAccept()` per distinct `MemoryType` (added during release-closure Step 5, mirroring `MemoryRetrievalService`'s own re-check) — a memory whose type consent is now `DENY_TYPE`/`DISABLED` can never seed a new finding, and any existing candidate citing it is expired on the next read. Verified in `reflection-data-source.service.spec.ts` and `reflection-validity.service.spec.ts`. |
| **CSRF on mutations** | `POST /reflections/:id/archive` and `/dismiss` sit behind the project-wide `CsrfGuard` (`APP_GUARD`) — no per-route opt-out. |
| **Mass assignment** | Neither mutating route accepts a request body at all (archive/dismiss are pure state transitions keyed only by the URL `:id`) — there is no field for a client to smuggle. |
| **Pagination / query abuse** | `pageSize`/`limit` are capped (`@Max(100)`/`@Max(50)`) via `class-validator` on the query DTOs, matching Memory/Journal's own bounds. |
| **Logs and telemetry** | No candidate `reason`, `scoreFactors`, or any source's underlying content is ever passed to a `Logger` call — grepped every `Logger.*`/`this.logger.*` call site under `reflection/` to confirm; only ids, counts, trigger names, and latency. |

## Ownership

Every read/mutate method throws an identical `404 REFLECTION_NOT_FOUND` for a candidate that
doesn't exist **or** belongs to another user — the same code path, the same response.

## Consent and visibility

Reflection Foundation introduces no new consent model — it reads only data the user already
consented to store (`ACCEPTED` memories, `PUBLISHED` journal entries) via the same status/state
filters those features already enforce at their own layer; Reflection adds no separate consent
gate on top. `ReflectionVisibility` (`PRIVATE`/`COMPANION_VISIBLE`) gates only whether Companion's
hint endpoint may notice a candidate exists — it never gates the owner's own access to
`/reflections`, which always shows every one of the owner's candidates regardless of this value.

**A revoked Memory consent does invalidate Reflection Candidates that cited that memory** — fixed
during Sprint 4B release closure (Step 5, "Consent review"). Both `ReflectionDataSourceService`
(for new findings) and `ReflectionValidityService` (for already-generated `NEW`/`READY`
candidates) call `MemoryConsentService.canAccept()` per distinct `MemoryType`, mirroring
`MemoryRetrievalService.filterByCurrentConsent()`'s existing "re-checked against current settings,
not the acceptance-time snapshot" policy for Companion retrieval. A type set to
`DENY_TYPE`/`DISABLED` (or `HEALTH` losing its explicit `ALLOW_TYPE`) after a candidate was
generated causes that candidate to expire on the very next read — the same guarantee Phase 11
already gives for deletion, now also given for consent revocation. Verified in
`reflection-data-source.service.spec.ts` and `reflection-validity.service.spec.ts`.

## Audit / logging policy

No dedicated `ReflectionAudit` table was introduced this sprint, mirroring Journal Foundation's
own precedent (`docs/security/journal-privacy.md` "Audit / logging policy") — Phase 12's
requirements here are structural counts, not a durable, queryable metric this sprint's algorithms
need to tune against, and a resolved candidate's own `resolvedAt`/`expiredAt` timestamps already
provide a complete record of what happened and when, directly on the row.

## Residual risks

- **No per-route rate limit on `archive`/`dismiss`/the Companion hint endpoint** beyond the global
  default throttler (1000/60s) — consistent with this codebase's existing practice (Memory/Journal
  apply the same reasoning) of reserving dedicated throttles for the heaviest operations; all three
  are strictly `userId`-scoped, so the only realistic impact of abuse is a caller hammering their
  own account.
- **Bounded data window** (180-day lookback, capped row counts) means a very high-volume account
  could have real patterns outside that window go unsurfaced — disclosed under "Known limitations"
  in the architecture doc, not a security gap (no data is exposed incorrectly, only some real
  patterns are not yet computed).
- **No restore for archived/dismissed candidates** — an intentional simplification since a
  reflection has no editable content to "come back to," unlike Memory's archive/restore pair.

## Production checklist

- [ ] If Reflection's data volume grows well past this sprint's bounds (180-day lookback, 500/300
      row caps), revisit the "bounded, not exhaustive" limitation with a disclosed, larger window
      or a smarter candidate-generation strategy before it becomes a user-visible gap.
