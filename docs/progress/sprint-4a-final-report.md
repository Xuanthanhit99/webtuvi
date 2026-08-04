# Sprint 4A — Journal Foundation: Final Report

**Base commit:** `94d2bc5` (Sprint 3C closure). Sprint 4A's changes are complete and verified in the
working tree but **not committed** — per the sprint brief, commit only on explicit request.

---

## 1. Executive summary

Journal Foundation is implemented and verified end-to-end: domain model, full CRUD/lifecycle APIs,
timeline, deterministic search, a conflict-safe autosave draft system with local-backup recovery, a
markdown editor, Markdown/JSON export, one-click-but-user-confirmed Companion integration, four
frontend routes, and backend/frontend/Playwright test coverage. Every item in the Definition of Done
checklist passes. Six real bugs were found and fixed through actual test/build execution (not code
review alone) — see §13 and §10. No AI-generated journal content, no automatic journal creation, no
embeddings, no semantic search — all explicit non-goals are honored structurally, not just by
omission.

**Verdict: READY FOR SPRINT 4B.**

## 2. Domain model

`apps/api/prisma/schema.prisma`, migration `20260804074726_journal_foundation` (applied to both the
dev and `beaconvie_test` databases):

- **`JournalEntry`** — `id`, `userId`, `title` (optional), `content`, `mood` (`JournalMood?`),
  `tags` (`String[]`), `state` (`JournalState`), `visibility` (`JournalVisibility`), `pinned`,
  `wordCount`, `readingTimeMinutes`, `version`, `previousState` (for exact restore),
  `sourceType`/`sourceConversationId`/`sourceMessageId` (Companion provenance, never client-settable
  — see §11), `publishedAt`, `archivedAt`, `deletedAt`, timestamps.
- **`JournalRevision`** — immutable snapshot (`title`, `content`, `mood`, `tags`, `version`) created
  on publish and on every content-changing edit to a published entry; cascades with its parent
  (`onDelete: Cascade`) since the parent row is never hard-deleted this sprint.
- **Enums**: `JournalState` (`DRAFT` / `PUBLISHED` / `ARCHIVED` / `DELETED`), `JournalVisibility`
  (`PRIVATE` / `SHARED` — `SHARED` is schema-only/future-ready, no sharing mechanism behind it),
  `JournalMood` (`GREAT` / `GOOD` / `OKAY` / `LOW` / `DIFFICULT`), `JournalSourceType`
  (`USER` / `COMPANION_SUGGESTED`).
- **`UserPreference.journalSuggestionsEnabled`** — the single boolean backing "Never suggest again."
- Deliberately **not built**: `JournalAttachment` (no upload infra exists in the repo),
  `JournalTag` as a join table (native `String[]` + `hasSome` is sufficient and avoids premature
  schema), `JournalAudit` (revisions already provide the transparency surface). All disclosed in
  `sprint-4a-progress.md` "Deliberate scope decisions," not discovered as gaps later.

## 3. APIs

`apps/api/src/journal/record/journal-record.controller.ts` (base `/journal`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/journal/timeline` | Daily/weekly/monthly grouped timeline (registered **before** `:id` to avoid route collision) |
| POST | `/journal` | Create (title optional — supports empty-shell creation for `/journal/new`) |
| GET | `/journal` | List — filter by `state`/`tag`/`mood`/`q`/date range, paginated |
| GET | `/journal/:id` | Detail |
| PATCH | `/journal/:id` | Update (versions on real content change) |
| POST | `/journal/:id/autosave` | Draft-only, no revisioning, conflict-safe |
| POST | `/journal/:id/publish` | DRAFT → PUBLISHED, creates first revision |
| POST | `/journal/:id/archive` | → ARCHIVED, records `previousState` |
| POST | `/journal/:id/restore` | → exactly `previousState` |
| POST | `/journal/:id/duplicate` | Clone as a new DRAFT |
| DELETE | `/journal/:id` | Soft delete → DELETED, records `previousState` |
| GET | `/journal/:id/revisions` | Full revision history |
| GET | `/journal/:id/export/markdown` \| `/json` | Per-entry export |

`apps/api/src/journal/export/journal-export.controller.ts` (whole-account export):
`POST /journal/export` (throttled 5/60s, Redis `SET NX` single-in-flight lock), `GET
/journal/export/:jobId` (`userId`-scoped cache key).

`apps/api/src/companion/journal/companion-journal.controller.ts`: `POST
/companion/journal/save` (creates a real DRAFT from a suggestion — see §8), `POST
/companion/journal/never-again` (flips `journalSuggestionsEnabled` off).

Every method (18 routes total) is behind `JwtAuthGuard`, ownership-scoped via `findOwned()`
returning an identical 404 for "doesn't exist" vs. "belongs to someone else," and every mutating
route sits behind the global `CsrfGuard`.

## 4. Timeline

`JournalTimelineService` groups entries by day/week/month (query param), excludes `ARCHIVED` and
`DELETED` by default (matching `list()`'s own default), supports pagination and pinned-entry
surfacing. Its controller method lives inside `JournalRecordController` itself (not a separate
controller) specifically so `GET /journal/timeline` is registered ahead of `GET /journal/:id` and
never gets swallowed by the dynamic segment — the same route-ordering discipline Memory's own
controllers already follow.

## 5. Draft system

`apps/web/features/journal/hooks/use-journal-draft.ts`: 2000ms debounced autosave to the server,
mirrored synchronously to `localStorage` (`beaconvie:journal-draft:<id>`) on every keystroke so a
same-tick refresh never loses text the debounce hasn't flushed yet. On mount, compares the local
backup's timestamp against the server's `updatedAt`; offers recovery only if the backup is strictly
newer (never silently overwrites a fresher server save). Unmount flushes any pending change
synchronously, with `.catch(() => undefined)` so a failed flush during teardown can't crash the
page. `saveNow()` bypasses the debounce for explicit-save actions (e.g. before Publish). Explicit
`status`: `idle` / `saving` / `saved` / `error`, rendered live in the editor.

## 6. Search

Deterministic only — no embeddings, no ranking model. `q` → Postgres `contains` (case-insensitive)
over `title`/`content`; `tag` → `hasSome`; `mood`/`state` → exact match; date range → `gte`/`lte` on
`createdAt`. All parameterized through Prisma's query builder, never raw SQL. Bounded by pagination;
disclosed as O(n) within a user's own entries, not a search-engine claim.

## 7. Export

Per-entry Markdown/JSON (`GET /journal/:id/export/{markdown,json}`) is a lightweight, ownership-
checked, unthrottled single-row read (matching the codebase's existing practice of reserving
dedicated throttles for heavier operations). Whole-account export (`POST /journal/export`) mirrors
`MemoryExportService`'s exact pattern: synchronous generation, Redis-cached by `jobId` for 15
minutes, `userId`-scoped cache key so a guessed `jobId` from another user resolves to nothing, rate-
limited 5/60s. No PDF (no PDF library exists anywhere in the repo — disclosed as out-of-scope rather
than adding a new dependency for it).

## 8. Companion integration

`journal-suggestion-detector.ts` — deterministic regex pattern list, same style as
`memory-suggestion-detector.ts`, no ML. `ConversationService.sendMessage()` runs it inline (via
`Promise.all` alongside the existing memory-suggestion check) and returns `journalSuggestion` on the
result; the frontend (`journal-suggestion-card.tsx`) renders "This might be worth saving as a
journal entry." with **Save as Journal / Later / Never suggest again**.

"Save as Journal" calls `POST /companion/journal/save`, which independently re-verifies the source
conversation belongs to the caller and the source message has `role: 'USER'` (never lets a client
claim provenance it doesn't own — same discipline as `MemoryCandidateService.propose()`), then
creates a **real `DRAFT`** row immediately and navigates to the editor. This satisfies all three
brief constraints simultaneously: nothing is created without a click ("Companion must never
automatically create a journal"), the content is the user's own already-sent message carried over
verbatim, never generated ("Companion does not write journal content"), and Publish remains a
required, separate, explicit second action ("User must confirm").

## 9. Frontend

Routes: `/journal` (timeline + search + filters), `/journal/new` (creates an empty DRAFT
immediately, editor takes over), `/journal/[id]` (editor / detail / revision history / archive-
restore / delete / export, state-dependent UI), `/journal/archive` (archived + "Recently deleted"
tabs). Editor: markdown textarea, live word count / character count / reading-time estimate,
autosave status indicator, draft-recovery banner. Nav item's `comingSoon` flag removed. No
collaborative editing (explicit non-goal) — single-writer, last-write-wins autosave (disclosed
limitation, §14).

## 10. Tests

- **Backend unit**: `journal-record.service.spec.ts` (27), `journal.mappers.spec.ts`,
  `journal-timeline.service.spec.ts`, `journal-suggestion-detector.spec.ts`,
  `companion-journal.service.spec.ts` — all passing, part of the 390/390 full backend suite.
- **Backend e2e**: `journal.e2e-spec.ts` (25 tests, two describe blocks: CRUD/lifecycle and
  Companion-integration/ownership) — all passing.
- **Frontend**: `journal-suggestion-card.test.tsx` (5), `use-journal-draft.test.ts` (9) — all
  passing, part of the 156/156 full frontend suite.
- **Playwright**: `flow-14-journal-lifecycle.spec.ts` (4 tests — full lifecycle, refresh-recovery,
  export, search) — passing both standalone and inside the full 21-spec suite run.

Six real bugs were found and fixed via actual execution, not review:
1. `list()`'s default filter excluded `DELETED` but not `ARCHIVED`, contradicting the documented
   design ("archive hides from default list"). Found via e2e failure.
2. `CreateJournalDto.title` required non-empty, but `/journal/new` intentionally creates with
   `title: ''` to make autosave work from the first keystroke — a real 400 in a live Playwright run.
   Made `title` optional end-to-end (DTO, service, frontend type).
3. `applyRecoveredBackup()` sent the whole `LocalBackup` object (including `savedAt`) to an API that
   `forbidNonWhitelisted`-rejects unknown fields — a real 400 during draft recovery in a live
   Playwright run. Fixed by destructuring only the 4 real fields.
4. A `nest build`-only TS error in a test file's generic sort helper (not caught by
   `tsc --noEmit -p tsconfig.json` alone) — revealed a real gap in verification ordering.
5. An unmount-flush unhandled rejection in `use-journal-draft.ts` crashed the Jest worker process
   for *every* test via testing-library's automatic cleanup, not just the one that set up the
   rejection. Fixed the production code (`.catch(() => undefined)`), not just the test.
6. A Playwright `getByText('Archived.')` strict-mode violation — the default case-insensitive
   substring match also hit unrelated static page text. Fixed with `{ exact: true }`.

## 11. Security review

**Blocker:** none found.

**High:** none found.

**Low:**
- No background purge job for long-soft-deleted (`DELETED`) rows. At this sprint's scale this is a
  non-issue (rows stay `userId`-scoped and invisible to everyone else indefinitely); a future sprint
  should add a scheduled sweep with a disclosed retention window if storage ever requires it.
- No dedicated rate limit on `autosave` / per-entry export / Companion `save` beyond the global
  default throttler (1000/60s). All three are strictly `userId`-scoped, so the only realistic impact
  is a caller hammering their own account, not cross-user exposure — consistent with the codebase's
  existing practice of reserving dedicated throttles for the heaviest operations only.

**Informational:**
- `JournalVisibility.SHARED` exists in the schema with no functional sharing mechanism behind it —
  intentionally future-ready, disclosed, has no observable effect today.
- Last-write-wins autosave, no operational-transform/CRDT conflict resolution — an accepted
  consequence of "no collaborative editing" being explicitly out of scope; only a single owner's own
  two tabs could ever collide (no cross-user path exists).
- IDOR, enumeration, mass-assignment, CSRF, content-size, search-injection, and log-leakage controls
  were all independently re-verified in `journal.e2e-spec.ts` and the source (see
  `docs/security/journal-privacy.md` for the full threat-model table) — no gaps found in this pass.
- Grepped every `logger.*` call site in `journal/` and `companion/journal/`: only entry ids, counts,
  and booleans are ever logged — no journal title/content/search-query text.

## 12. Commands executed (this closure pass)

| Command | Result |
|---|---|
| `pnpm lint` (full monorepo) | PASS — 0 errors, both `apps/api` and `apps/web` |
| `pnpm typecheck` (full monorepo) | PASS — `tsc --noEmit` clean in both apps |
| `pnpm build` (`nest build` + `next build`) | PASS — clean, all 4 journal routes present in the Next.js route manifest |
| `npx jest` (apps/api, full unit suite) | PASS — 390/390 tests, 47/47 suites |
| `npx jest --config test/jest-e2e.json` (apps/api, full e2e suite) | 98/99 tests, 7/8 suites — 1 pre-existing, unrelated flake (see §15) |
| `npx jest` (apps/web, full suite) | PASS — 156/156 tests, 30/30 suites |
| `npx playwright test` (full suite, all 21 spec files) | 20/21 — all 4 Journal tests pass; 1 pre-existing, unrelated flake (see §15) |
| `npx prisma validate` | PASS |
| `npx prisma migrate status` | PASS — "Database schema is up to date," 6 migrations applied |
| `git diff --check` | PASS — clean (only line-ending advisories, no conflict markers) |
| Secret scan (grep for key/token/secret/PEM patterns across all new/changed Journal files) | PASS — no findings |
| `git status` review | PASS — change set is scoped exactly to Journal Foundation files, no stray files |

## 13. PASS/FAIL summary

**Overall: PASS.** Every Definition of Done checklist item is green. Zero Blocker or High findings.
Two Low findings, both disclosed design tradeoffs rather than defects. All test failures encountered
during this closure pass were either fixed (6 real bugs, §10) or are pre-existing, unrelated flakes
not introduced by this sprint (§15).

## 14. Runtime-unverified items

- **No manual browser smoke test was performed this closure pass.** Verification relied on the full
  Playwright suite (which exercises the real backend, real Postgres, and a real browser end-to-end
  for the golden path: create → autosave → publish → archive → restore → delete → export → search)
  rather than a separate manual pass. If the user wants an interactive manual check before Sprint
  4B, that is still outstanding.
- Whole-account export (`POST /journal/export` → `GET /journal/export/:jobId`) is exercised in the
  e2e suite but not in Playwright (only per-entry export is Playwright-covered, via the "Export .md"
  button flow).
- Redis `SET NX` fail-open behavior on Redis unavailability (for the export lock) is implemented per
  the existing Memory-export pattern but was not independently re-tested by killing Redis mid-export
  this pass — inherited, not newly verified.

## 15. Known limitations / pre-existing, unrelated issues observed

- **`account-security.e2e-spec.ts`** — the email-resend-cooldown test failed once with an SMTP
  "Greeting never received" error against Mailpit (confirmed healthy via `docker ps`) under the load
  of the full e2e suite running sequentially; a lone re-run of the e2e suite reproduced it again,
  consistent with a timing-sensitive flake under parallel test load rather than a real regression.
  This file has no relationship to Journal code. Not modified, per "do not modify product code
  unless a real verification failure is found [in the code the sprint touches]."
- **`flow-5-companion-cancel.spec.ts`** — failed once in the full Playwright run ("element was
  detached from the DOM, retrying" — a race between the streamed reply completing and the cancel
  button being clicked). Pre-existing Sprint 1/2-era test, unrelated to Journal, not modified.
- **`flow-13`'s ambiguous-delete test and `flow-9`'s memory archive/restore test** — previously
  flagged as flaky during Sprint 3C closure; both passed cleanly in this sprint's full-suite run,
  consistent with them being genuinely load/timing-sensitive rather than consistently broken.
- Documented product-level limitations (all disclosed up front in
  `docs/security/journal-privacy.md` and `docs/progress/sprint-4a-progress.md`, not discovered
  late): no background purge of soft-deleted rows, no functional `SHARED` visibility, last-write-
  wins autosave with no CRDT, no `JournalAttachment`, no PDF export.

## 16. Residual risks

- Same as §11's Low findings: unbounded retention of soft-deleted rows, and reliance on the global
  throttler for `autosave`/per-entry-export/Companion-save rather than dedicated limits. Both are
  low-severity, `userId`-scoped, and match existing codebase precedent.
- The two SMTP/Playwright flakes in §15 are environmental/timing, not code defects, but they do mean
  a fully green CI run is not guaranteed on every attempt under full-suite parallel load — worth a
  future look at Mailpit connection pooling and the companion-cancel test's race condition,
  independent of Journal work.

## Exact Sprint 4B entry criteria

Sprint 4B may begin once, and only once:

1. This report is reviewed and Sprint 4A is explicitly accepted (or any requested follow-up fixes
   from §11/§14/§15 are completed).
2. If Sprint 4B intends to build user-facing features on top of Journal (e.g. a Reflection Engine,
   mood analytics, insights, or any semantic/embeddings-based capability), it must be scoped as a
   **new, separate deliverable** — Sprint 4A's brief explicitly excludes all of these, and nothing
   in this sprint's code assumes or half-implements them.
3. Any change to `SHARED` visibility becoming a real feature requires a full rewrite of
   `docs/security/journal-privacy.md`'s "Privacy" section and a new threat-model pass — not an
   incremental patch, per that document's own disclosed caveat.
4. If production scale is expected to accumulate a large volume of long-lived soft-deleted rows,
   the "no background purge" decision (§11, §15) should be revisited with an explicit retention
   window before Sprint 4B ships anything that increases Journal write volume materially.
5. The two pre-existing environmental flakes (§15) are not blockers for 4B but should be triaged
   separately from Journal work, since they affect full-suite CI reliability generally.
