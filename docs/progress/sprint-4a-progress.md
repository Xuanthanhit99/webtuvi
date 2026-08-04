# Sprint 4A — Journal Foundation: Progress

Status: **complete**. See `docs/progress/sprint-4a-final-report.md` for the full closure report
(Definition of Done results, security classification, known limitations, Sprint 4B entry
criteria). Not committed — per the sprint brief, commit only on explicit request.

## Phase 0 — Audit

Read: `docs/architecture/memory-engine.md`, `docs/architecture/memory-intelligence.md`,
`docs/architecture/companion-memory-integration.md`, `docs/security/memory-privacy.md`,
`docs/progress/sprint-3c-final-report.md`, plus the actual Memory module source
(`apps/api/src/memory/**`) and its frontend (`apps/web/features/memory/**`) as the pattern to
follow — Journal Foundation is architecturally the same *shape* of problem (owned, versioned,
user-writable content with lifecycle states, timeline, search, export) as Memory Foundation, just
without a consent/candidate layer (a journal entry is directly user-authored, not proposed from a
conversation and gated by acceptance).

### What already exists

- **Companion integration model** (Sprint 3C): `ConversationService.sendMessage()` runs
  deterministic, regex-based detectors (`memory-suggestion-detector.ts`,
  `forget-intent-detector.ts`) inline and returns their result alongside the persisted message;
  the frontend renders a dismissible suggestion card; every button maps to an **existing**
  mutation, nothing is auto-created. This is the exact shape Phase 8 asks for and is reused
  directly — a new `journal-suggestion-detector.ts` in the same style, a `JournalSuggestionCard`
  in the same style, wired into the same `sendMessage()` return shape.
- **Memory ownership model**: every table carries `userId`, every service method scopes its
  query by `(id, userId)` and throws an identical `404` for "doesn't exist" and "belongs to
  someone else" (see memory-privacy.md "Ownership"). Journal reuses this exact pattern —
  `JwtAuthGuard` + `findOwned()`-style lookups everywhere, no exceptions.
- **Consent architecture**: Memory's `MemoryConsentSetting`/`MemoryTypeConsent` exist because
  memory content is *proposed by the system* (from a conversation) and needs a gate before
  acceptance. A journal entry has no such step — the user writes it directly, the same way they'd
  write anything else in a text field — so **Journal introduces no consent model**. The one
  Journal-specific preference this sprint needs ("Never suggest again") is a single boolean, added
  to the existing per-user `UserPreference` row (`journalSuggestionsEnabled`), not a new
  consent-table family — there is no per-type dimension to gate (journal suggestions are one
  detector, not eighteen memory types).
- **Export architecture**: `MemoryExportService` runs synchronously, Redis-caches the result by a
  generated `jobId` for 15 minutes, and includes only the caller's own data. Journal export
  follows the same synchronous-and-owned pattern, but per-entry (Markdown/JSON, direct
  `Content-Disposition` download — no job-id indirection needed for a single entry) plus a
  whole-account JSON export mirroring Memory's exact shape for consistency.
- **Deletion policy**: Memory hard-deletes (`prisma.memory.delete()`) — deliberate, because Memory
  Foundation's own spec calls it "delete means delete." **Journal is different by this sprint's
  own explicit design**: Phase 1 lists `deleted` as a first-class *state* alongside
  draft/published/archived, and Phase 2 lists `Restore` as a distinct operation from `Archive` —
  both signal a *soft*-delete lifecycle (a "recently deleted" recovery window), not Memory's hard
  delete. See "Deliberate scope decisions" below for the exact state machine this sprint
  implements, and why it doesn't contradict Memory's own policy (they're different features with
  different stated requirements — Memory Foundation's hard-delete policy is unchanged and
  untouched by this sprint).

## Deliberate scope decisions (disclosed up front, not discovered later)

1. **Soft-delete state machine, not hard delete.** `JournalState`: `DRAFT` → `PUBLISHED` ⇄
   `ARCHIVED`, and any of those → `DELETED` (soft) → `RESTORED` back to exactly the state it was
   in before deletion/archiving, tracked via `previousState`. No background purge sweep is
   introduced (no new cron/queue infrastructure) — a `DELETED` entry with no further action stays
   soft-deleted, excluded from every normal read, indefinitely. This mirrors `Memory.expiresAt`'s
   own disclosed "reserved for a future sweep, not implemented this sprint" precedent rather than
   inventing new background-job infrastructure this sprint doesn't otherwise need.
2. **Tags are a `String[]` column, not a join table.** A `JournalTag` relational model (with its
   own id/many-to-many join table) would be premature abstraction for "a short list of labels a
   user types" — Postgres native arrays plus Prisma's `hasSome`/`has` filters give deterministic
   tag filtering with zero extra tables, joins, or migrations to keep in sync. Named `tags` on
   `JournalEntry` and on each `JournalRevision` snapshot.
3. **Mood is a fixed, self-selected enum**, never inferred: `JournalMood` (`GREAT`/`GOOD`/`OKAY`/
   `LOW`/`DIFFICULT`, plus `null` for "not set"). No mood analytics, no trend computation, no
   scoring — explicitly out of scope per the mission brief. The field exists purely so an entry
   can carry the same self-reported mood tag a user might write in a paper journal, filterable
   deterministically (Phase 6), nothing more.
4. **No `JournalAttachment` table this sprint.** It's explicitly marked "(optional)" in the brief,
   and the repository has **zero** file-upload infrastructure anywhere (no multer, no S3 client, no
   multipart handling — grepped `apps/api/`). Adding a schema table with no working upload path
   behind it would be exactly the "half-finished implementation" this project's own conventions
   rule out. Skipped entirely, disclosed here rather than shipped as dead schema.
5. **No PDF export.** Phase 9 says "PDF (if infrastructure already exists)" — it doesn't (no PDF
   library anywhere in either `apps/api` or `apps/web`). Per the same "don't introduce new
   infrastructure" discipline, Markdown and JSON export are implemented; PDF is disclosed as
   out-of-scope rather than added via a brand-new dependency.
6. **Revisions snapshot on meaningful edits, not on every autosave tick.** Autosave (the draft
   persistence loop, every few seconds while typing) updates the current row's `title`/`content`
   in place without creating a new `JournalRevision` — otherwise "version every meaningful edit"
   would produce a `JournalRevision` row every few seconds of typing, which is noise, not history.
   A revision snapshot is created when: (a) a draft is explicitly published, (b) an
   already-published entry's title or content changes at all (matching Memory's own "any edit to
   accepted content versions" precedent), (c) never for a no-op save (content/title unchanged from
   the current row, mirroring `MemoryRecordService.update()`'s own empty-params short-circuit).
7. **Search is deterministic `ILIKE`/array-containment, not full-text search infrastructure.**
   Matches the sprint's explicit "no embeddings, no semantic search" instruction and Memory
   Intelligence's own precedent (Jaccard token overlap, not a search engine) — Postgres `contains`
   (case-insensitive) over title/content, `hasSome` over tags, exact match on mood/state, range on
   date. Bounded by pagination; disclosed as O(n) within a user's own entries, not a search-engine
   claim.
8. **Companion "Save as Journal" creates a real `DRAFT` row immediately on the button click, then
   navigates to the editor for the user to review/edit before Publish** — not a two-step
   "preview, then a second create call." This mirrors Memory's `RememberThisButton` precedent
   exactly (the click *is* the explicit user action; nothing happens before it): the button click
   is real, unambiguous user intent, and the row it creates is a `DRAFT`, not a `PUBLISHED` entry
   — the user still must take a further, separate, explicit action (Publish) before it's a real
   finished journal entry. This satisfies "Companion must never automatically create a journal"
   (nothing happens without a click), "Companion does not write journal content" (the content is
   the user's own already-sent message, carried over verbatim into an editable draft, never
   generated), and "User must confirm" (Publish is a second, separate, required action).

## Module layout (planned)

```
apps/api/src/journal/
  journal.module.ts
  record/        JournalRecordService + Controller — CRUD, archive/restore/delete, duplicate, list, detail
  revision/      JournalRevisionService — snapshot-on-meaningful-edit, history read
  timeline/      JournalTimelineService + Controller — daily/weekly/monthly grouping, pagination
  search/        JournalSearchService + Controller — deterministic filtered search
  export/        JournalExportService + Controller — markdown/JSON, per-entry + account-wide
  draft/         JournalDraftService — autosave endpoint (no revisioning), conflict-safe save
apps/api/src/companion/journal/
  journal-suggestion-detector.ts   deterministic, same style as memory-suggestion-detector.ts
  companion-journal.service.ts     evaluate() + dismiss()/never-suggest-again()
  companion-journal.controller.ts  the two new mutation endpoints
apps/web/features/journal/
  api/journal-api.ts
  components/  (editor, timeline, entry-card, revision-viewer, search-bar, filters, ...)
  hooks/       (use-journal-draft.ts — autosave + local-storage recovery)
apps/web/app/(app)/journal/
  page.tsx (timeline), new/page.tsx, [id]/page.tsx, archive/page.tsx
```

## Final status (all phases)

All 14 phases from the mission brief were implemented: domain model + migration, full CRUD/
lifecycle/timeline/search/export APIs, autosave draft system with local-backup recovery, the
timeline view, a markdown editor with live word/char/reading-time counts, deterministic search,
privacy/lifecycle states, one-click-but-never-automatic Companion suggestion integration, Markdown/
JSON export, four frontend routes, a security pass, `Logger`-only observability with no journal
content ever logged, and backend/frontend/Playwright test coverage. Full results, command output,
and the Blocker/High/Low/Informational security classification are in
`docs/progress/sprint-4a-final-report.md`.

Six real bugs were found and fixed via actual test/build execution (not just code review) — see
the final report's "Known limitations" and commit history for detail. No product code was changed
outside of what a real verification failure required.
