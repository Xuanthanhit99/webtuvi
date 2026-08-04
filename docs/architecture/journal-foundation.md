# Journal Foundation (Sprint 4A)

Journal Foundation is BeaconVie's first-class, user-authored writing space — data model,
lifecycle, versioning, draft system, timeline, search, export, and a Companion suggestion
integration. It is deliberately **not** the Reflection Engine: no AI-generated journal content,
no automatic summarization, no mood analytics, no embeddings, no vector database, no semantic
search, no RAG anywhere in this sprint. Those are explicitly out of scope per the mission brief's
own non-goals list.

**Governing rule for this sprint**: a journal entry is directly, literally authored by the user.
Companion may *notice* something might be worth keeping and offer a button; it never writes a
word of journal content, and nothing is ever saved without an explicit user click.

## Relationship to Memory Foundation

Journal Foundation is architecturally the same *shape* of problem Memory Foundation (Sprint 3A)
solved — owned, versioned, user-writable content with lifecycle states, timeline, search, and
export — and reuses its patterns directly: ownership enforced by scoping every query to
`(id, userId)` and returning an identical 404 for "doesn't exist" and "belongs to someone else";
`JwtAuthGuard` + the project-wide `CsrfGuard` on every mutation; deterministic-only decision
logic. It does **not** reuse Memory's consent/candidate layer — a journal entry has no proposal
step to gate, since the user writes it directly, the same way they'd write anything else in a
text field. See `docs/architecture/memory-engine.md` for the pattern this sprint is following.

## Domain model

```
apps/api/src/journal/
  journal.mappers.ts     JournalEntryDto shape, countWords(), readingTimeMinutesFor()
  record/                JournalRecordService + Controller — CRUD, lifecycle, draft, list/search
  timeline/               JournalTimelineService — day/week/month grouping, cursor pagination
  export/                 JournalExportService + Controller — per-entry + account-wide
apps/api/src/companion/journal/
  journal-suggestion-detector.ts   deterministic, same style as memory-suggestion-detector.ts
  companion-journal.service.ts     evaluate() / saveFromSuggestion() / neverAgain()
  companion-journal.controller.ts  the two new mutation endpoints
```

Enums: `JournalState` (`DRAFT`/`PUBLISHED`/`ARCHIVED`/`DELETED`), `JournalVisibility`
(`PRIVATE`/`SHARED` — see "Privacy" below), `JournalMood` (`GREAT`/`GOOD`/`OKAY`/`LOW`/
`DIFFICULT`, self-selected only), `JournalSourceType` (`USER`/`COMPANION_SUGGESTED`).

Models: `JournalEntry` (the entry itself — title, content, state, visibility, mood, `tags:
String[]`, `pinned`, `wordCount`, `version`, source attribution, timestamps), `JournalRevision`
(one row per meaningful edit — a full content snapshot, cascades with its parent entry).

### Deliberate scope decisions

- **Tags are a `String[]` column, not a join table.** A relational `JournalTag` model with its
  own many-to-many join table would be premature abstraction for a short list of labels a user
  types — Postgres native arrays plus Prisma's `hasSome`/`has` filters give deterministic tag
  filtering with zero extra tables to keep in sync.
- **No `JournalAttachment` table.** Marked "(optional)" in the brief, and the repository has zero
  file-upload infrastructure anywhere (no multer, no S3 client, no multipart handling). Shipping
  a schema table with no working upload path behind it would be a half-finished implementation —
  skipped entirely rather than shipped as dead schema.
- **No PDF export.** The brief says "PDF (if infrastructure already exists)" — it doesn't (no PDF
  library anywhere in this repository). Markdown and JSON are implemented; PDF is disclosed as
  out of scope rather than added via a brand-new dependency.
- **No `JournalAudit` table mirroring `MemoryAudit`'s user-facing activity trail.** Memory's audit
  trail is a Sprint 3A deliverable the memory brief explicitly asked for; the Journal brief's
  Phase 12 asks for system-level observability (counts, not a user-facing "activity history" per
  entry). Phase 12 is satisfied via structured `Logger` calls only — see "Observability" below.

## Lifecycle

```
DRAFT --publish()--> PUBLISHED <--archive()/restore()--> ARCHIVED
  \                     |                                    \
   \--- archive() ------+--- remove() (soft) --> DELETED <---+ (via previousState)
```

**A deliberate difference from Memory's hard delete.** Memory Foundation's own spec calls it
"delete means delete" — a real, honest hard delete. Journal is different by this sprint's own
explicit design: Phase 1 lists `deleted` as a first-class *state* alongside draft/published/
archived, and Phase 2 lists `Restore` as a distinct operation from `Archive` — both signal a
*soft*-delete lifecycle (a "recently deleted" recovery window), not a hard delete. This does not
contradict Memory's policy; they are different features with different stated requirements, and
Memory Foundation's own hard-delete policy is unchanged and untouched by this sprint.

`previousState` is set only when transitioning into `ARCHIVED` or `DELETED`, and `restore()`
always returns to exactly that state — never a guessed default. No background purge sweep exists
this sprint (no new cron/queue infrastructure introduced) — a `DELETED` entry with no further
action stays soft-deleted, excluded from every normal read, indefinitely; only the owner, via the
dedicated "recently deleted" view, can ever see or restore it again. This mirrors
`Memory.expiresAt`'s own disclosed "reserved for a future sweep, not implemented this sprint"
precedent.

Editing is blocked for `ARCHIVED`/`DELETED` entries (restore first) — matching Memory's own
"unarchive before editing" precedent so the two features behave consistently from the user's
point of view, even though their underlying deletion policies differ.

## Editing

Unlike Memory, journal content genuinely **is** directly user-writable — there is no "content is
never directly editable" rule to reconcile, because a journal entry was never a system-proposed
candidate to begin with; it is the user's own writing from the start.

## Revisions

A `JournalRevision` snapshot is created when:

1. A draft is explicitly published (`publish()`).
2. An already-published entry's title or content changes at all — matching Memory's own "any edit
   to accepted content versions" precedent.
3. **Never** for a no-op save (content/title unchanged from the current row — mirrors
   `MemoryRecordService.update()`'s own empty-params short-circuit).
4. **Never** for an autosave tick (see "Draft system" below) — even when content changed.

Point 4 is the one genuinely new policy Journal introduces beyond Memory's precedent: autosave
fires on every pause in typing (every few seconds), and versioning every tick would turn "version
every meaningful edit" into noise, not history. A revision snapshot is a meaningful-edit boundary,
not a keystroke log.

## Draft system

`JournalRecordService.autosave()` is a distinct code path from `update()` (though it delegates to
the same underlying transaction) — it is only ever allowed while `state: 'DRAFT'`, and it never
creates a revision or bumps `version`. Two layers of "never silently discard user writing":

1. **Server-side autosave** — the frontend's `useJournalDraft` hook (`apps/web/features/journal/
   hooks/use-journal-draft.ts`) debounces keystrokes (2s) and calls `POST /journal/:id/autosave`.
   This is the real, persisted save.
2. **Client-side `localStorage` mirror** — written synchronously on every keystroke, *before* the
   debounce timer even starts. This is what "recovery after refresh" actually depends on: if the
   tab closes or crashes in the 2-second window before the debounced network save completes, the
   local backup already has the latest text. On mount, if the local backup is strictly newer than
   the entry's own `updatedAt`, the user is offered an explicit Recover/Discard choice — never
   silently applied, never silently discarded.

A failed autosave (network error, offline) leaves the local backup intact rather than clearing it
— a failed save must never look identical to a successful one. An explicit save (`saveNow()`,
bound to Ctrl/Cmd+S) flushes immediately instead of waiting for the debounce. On unmount/
navigation, any still-pending change is flushed as a best-effort save (its own failure is
swallowed — there is no component left to show an error to at that point, and the local backup is
the real safety net for that specific case).

**Conflict-safe save, explicitly scoped**: Journal has no collaborative editing (per the mission's
own explicit instruction) — autosave is last-write-wins on the same row within one owner's own
single active session. There is no multi-writer scenario to reconcile, so no operational-transform
or CRDT machinery is introduced.

## Timeline

`GET /journal/timeline` — reverse-chronological, cursor-paginated (same simple "cursor is the
previous page's last item's `createdAt`" scheme Memory's timeline uses), grouped per item by day,
week, or month (`groupBy` query param) computed in application code, not a separate `GROUP BY`
query — so pagination stays correct across group boundaries. Excludes `ARCHIVED` and `DELETED` by
default; `includeArchived=true` includes archived entries (never deleted ones — that's the
dedicated "recently deleted" view's job, reached via `GET /journal?state=DELETED`).

"Pinned entries" and "recently edited" (Phase 4's other two timeline sections) are not separate
endpoints — they're the same `GET /journal` list endpoint with `pinned=true` or
`sort=recently_edited`, avoiding a second query shape that could drift from the first.

## Search

Deterministic only — Postgres `contains` (case-insensitive) over `title`+`content`, `hasSome`/
`has` over `tags`, exact match on `mood`/`state`, range on `createdAt`. No embeddings, no
full-text-search extension, no semantic ranking — matches the sprint's own explicit instruction
and Memory Intelligence's own precedent (Jaccard token overlap, not a search engine). Bounded by
pagination; disclosed as an O(n) scan within a user's own entries, not a search-engine claim.

Filtering and searching are the *same* endpoint (`GET /journal?q=...&mood=...&tag=...&state=...`)
— Phase 2's "List/Filter/Tag/Mood" and Phase 6's "Search" are one query shape, not two that could
drift out of sync with each other.

## Privacy

`JournalVisibility`: `PRIVATE` (default) and `SHARED`. `SHARED` is stored but **not functionally
implemented this sprint** — no recipient model, no share link, no actual visibility change to any
other user. It exists as a future-ready field only, per the brief's own "Shared (future-ready
only)" wording — mirroring Memory's own `COMPANION_ALLOWED` precedent of a visibility value that
exists before its full mechanism does.

Archived and deleted are lifecycle states, not visibility values, but interact with privacy the
same way Memory's archived state does: fully readable/restorable by the owner, excluded from
every other read path, never visible to any other user under any circumstance.

## Companion integration

Companion may suggest — via a deterministic, non-LLM detector
(`journal-suggestion-detector.ts`, same style as `memory-suggestion-detector.ts`/
`crisis-detector.ts`: fixed regular expressions tuned for reflective, day-in-review phrasing, no
model call) — that a message "might be worth saving as a journal entry." This runs inline in
`ConversationService.sendMessage()`, alongside the existing memory-suggestion and forget-intent
detectors, and is included in the same response the frontend already receives
(`journalSuggestion: JournalSuggestionDto | null`). Crisis-flagged messages never reach this
detector at all — `SafetyService.checkInput()` short-circuits `sendMessage()` first.

The frontend's `JournalSuggestionCard` renders three actions:

- **Save as Journal** — the click *is* the explicit user action (mirroring Memory's
  `RememberThisButton` precedent exactly: nothing happens before the click). It calls
  `POST /companion/journal-suggestions/save` with the source `conversationId`/`messageId` only
  (never title/content — the DTO structurally cannot accept them). `CompanionJournalService`
  independently verifies the conversation belongs to the caller and the source message is
  `role: 'USER'` (identical to `MemoryCandidateService.propose()`'s own ownership check) before
  creating a real **`DRAFT`** entry, carrying the user's own already-sent message verbatim as its
  content. The frontend then navigates to the editor, where the user still must review and
  explicitly Publish before it's a finished entry.
- **Later** — calls no API at all. A one-time dismissal has no lasting effect, so there is nothing
  to persist.
- **Never suggest again** — `POST /companion/journal-suggestions/never-again` sets a single
  account-wide `journalSuggestionsEnabled` boolean on the existing `UserPreference` row (not a new
  consent-table family — journal suggestions come from one detector, not eighteen memory types
  the way Memory's consent model needs to distinguish).

This satisfies every constraint the mission states explicitly: Companion never automatically
creates a journal (nothing happens without a click); Companion does not write journal content (the
content is the user's own message, carried over unmodified); the user must confirm (both the
button click *and* the subsequent, separate, required Publish action).

## Export

`GET /journal/:id/export/markdown` and `.../json` — per-entry, synchronous, direct download (the
frontend does the same client-side Blob-download trick `/memory`'s own export button already
uses — no new download mechanism). Markdown includes a small YAML front-matter header (title,
date, mood, tags) followed by the raw content. `POST /journal/export` /
`GET /journal/export/:jobId` — account-wide, mirrors `MemoryExportService` exactly: synchronous
computation, Redis-cached by a generated `jobId` for 15 minutes, a per-user `SET NX` lock capping
one in-flight export at a time (fails open on a Redis error). Every export includes only the
caller's own, non-deleted entries.

## Observability

Every new service logs structured, content-free lines via NestJS `Logger` — entry id, source
type, word/revision counts, boolean flags — matching Companion Core's and Memory Foundation's own
observability discipline. **Never logged**: title, content, search query text, or any other
content field — grepped every `logger.*` call site under `journal/` and `companion/journal/` to
confirm. No new persisted observability table was introduced (unlike Memory's
`MemoryRetrievalLog`) — Phase 12's requirements here are structural counts, not a durable,
queryable metric Journal's own algorithms need to tune against.

## Security

- **Ownership**: every read/mutate method in `JournalRecordService`/`JournalExportService`/
  `CompanionJournalService` scopes its query by `(id, userId)` and throws an identical 404 for
  "doesn't exist" and "belongs to someone else" — no enumeration difference.
- **CSRF**: every mutating route is a `POST`/`PATCH`/`DELETE`, covered by the project-wide
  `CsrfGuard` (`APP_GUARD`) — no per-route opt-out anywhere in this module.
- **Draft isolation**: `autosave()` is only reachable for an entry the caller owns (same
  `findOwned()` gate as every other method) and only while it is still a `DRAFT`.
- **Deleted/archived visibility**: excluded from `list()`/`timeline()` by default; reachable
  directly by id only by the owner (necessary for the "recently deleted"/archive recovery views);
  never visible to any other user under any circumstance.
- **Export ownership**: per-entry export 404s for a non-owner; account-wide export's `jobId` is
  Redis-keyed by `userId`, so a guessed jobId belonging to another user resolves to nothing.
- **Revision ownership**: `revisions()` checks ownership before returning any snapshot.
- **Mass assignment**: every DTO whitelists its own fields; the global `ValidationPipe`
  (`whitelist: true, forbidNonWhitelisted: true`) rejects any undeclared field outright.
- **Companion-sourced content spoofing**: `CreateJournalDto` has no `sourceConversationId`/
  `sourceMessageId`/`sourceType` fields at all — not merely validated away, structurally absent.
  Those are only ever set by `JournalRecordService.create()`'s internal `source` parameter,
  populated exclusively by `CompanionJournalService` after its own independent ownership check.

See `docs/security/journal-privacy.md` for the full threat-model table and residual risks.
