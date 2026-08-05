# Sprint 4B — Reflection Foundation: Final Report

**Base commit:** `a004c73` (Sprint 4A closure). Sprint 4B's changes are complete and verified in
the working tree. Per the sprint brief and the subsequent release-closure pass, committed only on
explicit request — see §16 for commit status.

This report has two layers: the original implementation pass (domain model, rule engine, APIs,
frontend, initial tests) and a subsequent **release-closure pass** that ran deeper runtime
verification (backend e2e, the complete Playwright suite, a live manual smoke test) and fixed two
real defects it uncovered. Both are reflected below as one coherent, current picture — this
document is not a diff of the two passes.

---

## 1. Executive summary

Reflection Foundation is implemented and **runtime-verified end-to-end**, including scenarios that
were only unit-tested at the end of the implementation pass. The release-closure pass found and
fixed one real product defect (Memory consent revocation wasn't propagating to already-generated
Reflection Candidates the way Phase 11 requires for deletion), diagnosed and resolved three
environment issues that were producing false-negative test results (dev-mode Next.js compile
latency, duplicate/stuck API processes from earlier in the session, and test-data pollution in the
shared demo account from the closure pass's own earlier debugging), and confirmed that every
remaining test failure is a pre-existing, previously-documented flake in code Sprint 4B never
touches (verified by `git diff`, not just asserted).

No LLM-generated reflections, no AI summaries/coaching, no reports, no mood/habit prediction, no
embeddings, no pgvector, no vector database, no semantic search, no RAG, no knowledge graph, no
autonomous agents — all explicit non-goals are honored structurally. This repository has **no
dedicated `Goal` model** — disclosed from the Phase 0 audit onward; "Goals" as a Reflection data
source means `Memory` rows of type `GOAL`/`ACHIEVEMENT`/`CHALLENGE`, following Memory
Intelligence's own existing precedent.

**Verdict: READY FOR SPRINT 4C.**

## 2. Scope

In scope and delivered: domain model (2 new tables, 6 new enums), a 9-rule deterministic rule
engine, deterministic grouping, a documented weighted scoring algorithm, timeline, feed, an 8-route
CRUD/lifecycle API, a Companion "you may want to reflect on this" hint (1 additional endpoint),
five frontend views (Feed/Timeline/Groups/Detail + Companion banner), and full test coverage
(backend unit, backend e2e, frontend unit, Playwright).

Explicitly out of scope this sprint (per the mission brief, honored throughout): AI-generated
reflections/summaries/coaching, weekly/monthly reports, mood/habit prediction, embeddings/pgvector/
vector database/semantic search/RAG/knowledge graph, autonomous agents.

Closure-pass scope was verification and defect-fixing only — no new features, no API redesign, no
Reflection Foundation redesign. The one code change made (§5, consent-revocation propagation) was
made because runtime verification proved it a real, in-scope gap against this sprint's own stated
Phase 11 privacy requirement, not a scope expansion.

## 3. Database verification

- `npx prisma generate` / `validate` — PASS.
- `npx prisma migrate status` against the existing dev database (`beaconvie`) — up to date, 7
  migrations applied, no drift.
- **Clean-database verification** (new this closure pass): created a throwaway `beaconvie_verify`
  database, ran `prisma migrate deploy` against it from scratch — all 7 migrations, including
  `20260805013035_reflection_foundation`, applied in order with zero errors.
  `prisma migrate diff` between that clean database and the current schema returned an **empty
  diff** — no drift, the migration history fully and exactly reconstructs the schema.
- **Migration contents inspected directly**: purely additive SQL (`CREATE TYPE` × 6,
  `CREATE TABLE` × 2, `CREATE INDEX` × 7, `ADD CONSTRAINT` × 2) — no `DROP`, no destructive
  `ALTER`, confirmed by reading the migration file, not just trusting the filename.
- **Foreign keys / cascade behavior verified via `\d` on the live tables**:
  `reflection_candidates.userId → users.id` (`ON DELETE CASCADE` — a deleted user's candidates are
  removed with them, consistent with every other user-owned table in this schema);
  `reflection_source_refs.reflectionCandidateId → reflection_candidates.id` (`ON DELETE CASCADE` —
  a candidate's source refs never outlive it, mirroring `MemoryVersion`'s cascade-with-parent
  pattern).
- **Unique constraint verified**: `(userId, dedupeKey)` on `reflection_candidates` — enforces
  "never a duplicate row for the same rule+group+window fingerprint" at the database level, not
  only in application code.
- Test database (`beaconvie_test`) — confirmed up to date, 7 migrations applied, before running
  backend e2e.

## 4. Reflection architecture

Unchanged from the implementation pass — see `docs/architecture/reflection-foundation.md` for the
full design: domain model, module layout, "Goals" data-source reconciliation, generation/
regeneration policy (`dedupeKey`, never resurrects a resolved candidate), and the currency-
sensitive `LONG_INACTIVITY` staleness handling. The one addition this closure pass made
(§5) is documented there under "Privacy (Phase 11)" and "Data sources (Phase 2)."

## 5. Rule Engine

Unchanged — 9 deterministic rules, each a pure function, each citing only real, already-fetched
source records. Full threshold table in the architecture doc. Runtime-verified this closure pass
via both the new backend e2e spec (§8) and the Playwright flow (§9), which exercise
`REPEATED_JOURNAL_THEME` and `REPEATED_GOAL` against a live database end-to-end, not just as unit
tests over fixtures.

**Real defect found and fixed (Step 5, "Consent review")**: `ReflectionDataSourceService.fetch()`
fetched `ACCEPTED` memories but never re-checked the user's *current* Memory consent settings the
way `MemoryRetrievalService` (Sprint 3B) already does for Companion context assembly. This meant a
memory whose type had since been set to `DENY_TYPE`/`DISABLED` (or, for `HEALTH`, lost its
explicit `ALLOW_TYPE`) could still seed a *new* Reflection finding, and an *already-generated*
candidate citing it would never be invalidated — a real gap against this sprint's own "Never
expose stale Reflection" requirement and against the established codebase precedent that consent
is re-checked at read time, not just accept time.

**Fix** (both changed, minimal, mirrors existing `MemoryRetrievalService.filterByCurrentConsent()`
exactly):
- `ReflectionDataSourceService.fetch()` now filters fetched memories through
  `MemoryConsentService.canAccept()`, one call per distinct `MemoryType` present (not per row).
- `ReflectionValidityService.revalidateForUser()` now treats a memory whose type consent is
  currently denied the same as a hard-deleted memory — the candidate expires on the next read.

Verified by 2 new backend e2e tests (denying `GOAL` consent expires an in-flight candidate citing
it) and 8 new unit tests across `reflection-data-source.service.spec.ts` (new file) and
`reflection-validity.service.spec.ts` (extended). No API surface changed — this is internal
service logic only.

## 6. APIs

Unchanged — `ReflectionController` (8 routes under `/reflections`) and
`CompanionReflectionController` (`GET /companion/reflection-hint`), all `JwtAuthGuard` + the
project-wide `CsrfGuard`, all implicitly ownership-scoped. Runtime-verified against a live
database via 13 backend e2e tests (§8) covering every route.

## 7. Frontend

Unchanged — `/reflections` (Feed/Timeline/Groups + `?item=<id>` detail), reachable from Settings
and a Companion hint banner, not added to the fixed five-item global nav. Runtime-verified this
closure pass via a live manual smoke test (§10) with real screenshots, in addition to the 13
frontend unit tests and the Playwright flow.

## 8. Backend e2e

**New this closure pass** — Reflection had no dedicated e2e coverage at the end of the
implementation pass; this was a real, disclosed gap (`sprint-4b-progress.md`'s prior draft flagged
it under "Runtime-unverified items"). `apps/api/test/reflection.e2e-spec.ts` (13 tests, run against
the live `beaconvie_test` Postgres/Redis via supertest) now covers:

| Scenario | Result |
|---|---|
| CSRF rejection on a mutation | PASS |
| Journal pattern → real candidate citing real entries → Feed | PASS |
| Archive hides from Feed, stays in Timeline with correct state | PASS |
| Archive is idempotent | PASS |
| Dismiss hides from Feed, is idempotent | PASS |
| A dismissed candidate is never resurrected by later regeneration | PASS |
| Deleting a cited journal entry expires its candidate (Phase 11) | PASS |
| Hard-deleting a cited memory expires its candidate (Phase 11) | PASS |
| Denying Memory consent for a type expires a candidate citing it (§5 fix) | PASS |
| Ownership: identical 404 for nonexistent vs. another user's candidate | PASS |
| Ownership: a non-owner cannot archive/dismiss | PASS |
| Ownership: feed/list/timeline/groups/statistics never leak across users | PASS |
| Groups aggregates by deterministic `groupKey` | PASS |
| Timeline items carry a valid bucket; custom date range works | PASS |
| Feed is ordered by score descending, backed-by-more-evidence outranks weaker | PASS |

**Result: 13/13 PASS**, first attempt, against a real database. The full backend e2e suite
(9 spec files) was then run: **8/9 suites PASS**; the one failure
(`account-security.e2e-spec.ts`'s email-resend-cooldown test) is a pre-existing, previously-
documented Mailpit-timing issue — see §13.

## 9. Playwright

The complete suite (23 tests across 22 spec files) was run to completion multiple times this
closure pass while diagnosing environment issues; the final, definitive run against a clean,
single, production-mode API + web stack: **22/23 PASS**. Full diagnostic trail:

1. **First full run** (fresh `next dev` + `nest start --watch`): 5/23 passed, 18 failed, took 2.1
   hours. Root-caused, not assumed: Next.js dev-mode compiles each route on first hit; the very
   first test to touch any given route paid that compile cost and exceeded the suite's 10-30s
   default timeouts, while later hits of the same route passed quickly (visible directly in the
   log: `flow-14`'s first test failed, its later tests in the same file passed). One test
   (`flow-6-companion-retry`) additionally consumed 1.8 of the 2.1 hours — traced to a duplicate,
   competing `nest start --watch` process left over from earlier in the session fighting over port
   4000 (confirmed via `Get-CimInstance Win32_Process`), not a real product hang.
2. **Fix applied** (infrastructure, not product code): built and ran both apps in production mode
   (`next build && next start`; `nest build && node dist/src/main.js`) instead of dev-mode watch,
   after killing every stale/duplicate process. This is also the technically correct way to run an
   e2e suite (dev servers are for iteration, not for time-sensitive test assertions).
3. **Second full run** (clean single-instance production stack): 20/22 passed (flow-6 excluded
   this run pending its own isolated check), in 5.7 minutes — confirming the fix. The 2 failures
   were `flow-13`'s ambiguous-delete test and `flow-5-companion-cancel` — **the exact two tests
   Sprint 4A's own closure report already disclosed as pre-existing flakes**, word-for-word
   matching symptoms.
4. **`flow-13` root-caused, not assumed**: retrying alone showed "expected 2 candidates, got 5" —
   traced to orphaned "kayaking trips" test memories left in the shared demo account by this
   closure session's own earlier failed attempts at this same test (its cleanup step never runs
   when the test fails before reaching it, so debris accumulates across repeated runs). Deleted
   the 5 orphaned memories via the API; the test then passed cleanly and reproducibly.
5. **`flow-5` and `flow-6` retried alone**: both passed (`flow-5` in 10.6s on the final full run;
   `flow-6` in 14.4s standalone, and again in 14.0s in the final full run) — confirming their
   earlier failures were artifacts of the broken-environment runs, not reproducible bugs.
6. **Final, definitive full run** (all 23 tests, clean stable stack): **22/23 PASS** in 4.9
   minutes. The sole failure, `flow-9-memory-archive-restore`, was retried 3× in isolation
   immediately after and **passed 3/3** — consistent with its own documented history (Sprint 3C:
   "previously flagged as flaky"; Sprint 4A: "passed cleanly... consistent with genuinely
   load/timing-sensitive... not a real regression"). `git diff` confirms Sprint 4B touches no file
   in its code path.

**Reflection's own tests (`flow-15-reflection-foundation.spec.ts`, 2 tests) passed in every single
run across this entire investigation**, including the first, environmentally-broken run (with a
generous 180s per-test timeout budgeted in from the original implementation pass) — the strongest
single signal that Reflection Foundation itself was never the source of the instability.

**Demo account cleanup**: this closure pass's own debugging (steps above) left test debris in the
shared `demo@beaconvie.local` account — orphaned memories and 4 Reflection Candidates stuck in
`READY` from runs that timed out before their archive/dismiss steps. All identified and removed via
the API (5 memories, 13 journal entries, 4 candidates resolved/expired) — verified via a follow-up
API call showing an empty feed before manual smoke testing began.

## 10. Manual smoke

Performed via Playwright as the browser driver (no interactive human-in-the-loop browser access is
available in this environment) — real navigation, real screenshots, against the live demo account.
9 screenshots captured and visually reviewed:

| Surface | Result |
|---|---|
| Feed, empty state | Honest "Nothing to reflect on yet" — no fabricated content |
| Feed, populated | Real reasons, category/trigger/score badges, correct scores |
| Timeline | Renders, section switch works |
| Groups | Renders, aggregation visible |
| Detail (score explanation) | Correct breakdown (e.g. "60/100 — Backed by multiple related entries (+24), Recently observed (+20), Shows up across several journal entries (+16)"), never the bare number |
| Detail (source viewer) | 13 real, dated, clickable "Journal entry" links — never fabricated |
| Desktop (1440×900) | Full layout correct |
| Tablet (768×1024) | Full layout correct |
| Mobile (375×812) | Cards stack correctly, readable; see minor observation below |
| Loading state | Skeleton placeholders render correctly |
| Error state (forced 500) | "Something went wrong" + "Try again" — no silent failure, no fabricated data |
| Keyboard navigation | Tab reaches interactive elements (confirmed focus lands on a real `<button>`) |

**Two non-blocking observations** (neither is a defect the closure task's "verification proves a
real defect" bar requires fixing — noted for future polish):
- On mobile, the fixed bottom navigation bar can slightly overlap the last visible feed card
  before scrolling — this is a characteristic of the shared `MobileNavigation` layout component
  used by every page in the app, not something specific to or introduced by the Reflections page.
- The Source Viewer shows a generic "Journal entry"/"Memory" label plus date for each source,
  never the source's own title — a deliberate design choice from the implementation pass (source
  refs deliberately store no title/content, only `sourceType`/`sourceId`/`sourceTimestamp` — see
  "never fabricate sources" in the architecture doc), not a bug. Showing real titles would require
  fetching each source's current record, a reasonable future enhancement, not implemented here to
  avoid scope creep.

## 11. Security

No Blocker/High findings, reconfirmed this closure pass with fresh code review plus the new e2e
suite's explicit ownership/IDOR/leakage tests (§8) all passing:

- **IDOR**: every `ReflectionCandidate` query is `userId`-scoped at the Prisma `where` clause;
  `findOwned()` throws an identical 404 for cross-user access and non-existence.
- **CSRF**: verified live (both via e2e and Playwright) that a mutation without a CSRF token gets
  `403 CSRF_TOKEN_MISSING`.
- **Deleted/archived source leakage**: `ReflectionSourceRef` never stores source content, only
  `sourceType`/`sourceId`/`sourceTimestamp` — there is no content to leak even before expiry runs.
- **Cross-user feed/group/statistics leakage**: explicitly tested end-to-end this closure pass
  (§8) — confirmed none of the five read surfaces (list/feed/timeline/groups/statistics) ever
  return another user's data.
- **Export leakage**: N/A — Reflection Foundation has no export endpoint this sprint (nothing to
  leak via a surface that doesn't exist).
- **Companion hint leakage**: `ReflectionHintService` returns only `{available, reflectionId,
  category}` — confirmed by re-reading the service; no `reason`/`sources`/`scoreExplanation` ever
  crosses that endpoint.
- **Route ordering**: confirmed `timeline`/`feed`/`groups`/`statistics`/bare-list are all
  registered ahead of the dynamic `:id` route in `ReflectionController`.

## 12. Commands executed (this closure pass)

| Command | Result |
|---|---|
| `docker ps` / `docker compose up -d` | PASS — Postgres/Redis/Mailpit healthy |
| `npx prisma generate` / `validate` | PASS |
| `npx prisma migrate status` (dev + test DBs) | PASS — up to date, no drift |
| Clean-DB migration replay + `prisma migrate diff` | PASS — 7/7 migrations, empty diff |
| `pnpm lint` (full monorepo) | PASS — 0 errors |
| `pnpm typecheck` (full monorepo) | PASS |
| `npx jest` (apps/api, full unit suite) | PASS — 446/446 tests, 53/53 suites (5 new this pass) |
| `npx jest --config test/jest-e2e.json` (new `reflection.e2e-spec.ts`) | PASS — 13/13 |
| `npx jest --config test/jest-e2e.json` (full backend e2e, 9 suites) | 8/9 suites — 1 pre-existing unrelated flake (§13) |
| `npx next build` / `npx nest build` | PASS — both production builds clean |
| Full Playwright suite (final run, all 23 tests) | 22/23 — 1 pre-existing unrelated flake, confirmed 3/3 pass in isolation (§9) |
| Manual smoke test (Playwright-driven, 9 screenshots) | PASS — see §10 |
| `git diff --check` | PASS — clean |
| Secret scan (grep across all changed/new files) | PASS — no findings |
| `git status` review | PASS — change set scoped to Reflection Foundation + its minimal required touches |

## 13. PASS/FAIL summary

**Overall: PASS.** Every Definition of Done item this sprint controls is green. One real defect
found and fixed (§5). Zero Blocker/High security findings. All remaining test failures are
confirmed pre-existing, unrelated to Sprint 4B, and either already documented in prior sprints'
own closure reports or freshly root-caused this pass:

- **`account-security.e2e-spec.ts`'s email-resend-cooldown test** — a test-local, fixed 15s budget
  for 2 real sequential SMTP round-trips plus a deliberate 2.1s sleep; under this session's Mailpit
  latency the budget was occasionally insufficient. All 17 other tests in the same file
  (including 2 others that also depend on real Mailpit delivery) passed reliably. `git diff`
  confirms zero Sprint 4B changes touch mail/auth code. Not modified — mirrors the exact
  precedent set in Sprint 4A's own closure report for this same file.
- **`flow-9-memory-archive-restore.spec.ts`** — confirmed genuinely intermittent (3/3 pass in
  isolation immediately after the one failure), matching its own history across Sprint 3C and
  Sprint 4A closures. `git diff` confirms zero Sprint 4B changes touch its code path
  (`memory-detail.tsx` and its close-transition logic were never edited this sprint).

## 14. Known limitations

Unchanged from the implementation pass, plus one addition:

- Bounded data window (180-day lookback, 500/300-row caps per source).
- Clustering compares each new item only to its cluster's first member.
- `GOAL_ACTIVITY_MISMATCH`'s absence-of-evidence check is a token-overlap heuristic.
- No restore for archived/dismissed candidates.
- No dedicated persisted observability table (Logger-only, mirroring Journal's precedent).
- **New**: the Source Viewer shows type + date only, never a source's title (§10) — deliberate,
  disclosed, not a defect.

## 15. Residual risks

- Bounded data window and no per-route rate limit beyond the global default throttler — both
  low-severity, `userId`-scoped, consistent with Memory/Journal's own existing practice.
- The two pre-existing environmental/timing flakes (§13) mean a fully green CI run is not
  guaranteed on every attempt under full-suite load — this is a pre-existing condition of the
  repository, not introduced or worsened by Sprint 4B, and is now better-characterized (root
  causes identified, not just re-observed) than before this closure pass.
- Demo-account and CI environments that run dev-mode Next.js servers for e2e/Playwright should
  budget for first-navigation compile latency, or (recommended, and now the proven working
  pattern) run against production builds — worth codifying in the project's e2e-running docs for
  future sprints, though not done here as it's process documentation outside this sprint's file
  scope.

## 16. Sprint 4C entry criteria

1. This report is reviewed and Sprint 4B is explicitly accepted.
2. If Sprint 4C intends to build AI-generated insights, coaching, or reports **on top of**
   Reflection Candidates, it must be scoped as a new, separate deliverable — nothing in this
   sprint's code assumes or half-implements them.
3. If a real `Goal` model is introduced in a future sprint, `ReflectionDataSourceService`'s
   `goalMemories` filter and the two goal-related rules should be revisited to consume it directly.
4. Consider adding e2e/Playwright-running guidance (production build vs. dev-mode) to the
   project's contributor docs, given this closure pass's concrete finding that dev-mode first-hit
   compile latency alone produced an 18-test false-failure signal.
5. The two pre-existing environmental flakes (§13) are not Sprint 4B blockers but should be
   triaged separately (Mailpit connection handling under load; the Memory detail close-transition
   race), consistent with both Sprint 3C's and Sprint 4A's own prior disclosures of the same
   issues.
6. Commit status: not committed as of this report — see the assistant's final turn for whether an
   explicit commit request was made and completed.
