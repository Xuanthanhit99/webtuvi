# Sprint 5B — Weekly & Monthly Reviews: Release Closure Final Report

## 1. Executive summary

Sprint 5B (Review Engine) is **code-complete and verification-complete**. Every Definition of Done
check passes, including a from-scratch, fully-fresh re-run (new database, new Redis, new demo
account, new Playwright storage, production-mode servers) specifically to rule out the environmental
flakiness observed during in-session verification. Four real bugs were found and fixed — all in this
sprint's own new Playwright spec, none in product code — plus one infrastructure incident (stray
duplicate dev-server processes) and one unrelated pre-existing test's side effect (a changed demo
password from an interrupted `flow-3` run), both diagnosed and resolved. The security audit found no
high-confidence, exploitable findings. No AI/LLM call exists anywhere in the Review Engine code path.

## 2. Baseline commit

`14c00f0` ("fix: correct API production start path") — working tree at the start of this closure
matched the known Sprint 5B implementation state: the same modified/untracked files as recorded in
`docs/progress/sprint-5b-progress.md`, no unexpected drift (`git status --short` / `git diff --check`
both confirmed clean at Step 1 of this closure).

## 3. Scope delivered

Everything specified in the Sprint 5B brief: `Review`/`ReviewSection`/`ReviewEvidence` domain model
(WEEK/MONTH/CUSTOM windows), a deterministic builder (Overview/Highlights/Changes/Achievements/
Challenges), statistics (journal/memory/reflection/insight/activity counts, journaling streak,
companion conversations), presentation UI (`/reviews`, `/reviews/:window`, `/reviews/:id`), category/
priority/date/status filters, Markdown/JSON export, security/ownership enforcement, and full test
coverage. See `docs/architecture/review-engine.md` for the complete design (unchanged this closure
session, still accurate) and `docs/progress/sprint-5b-progress.md` for the implementation log
including the journaling-streak bug and the DTO-validation-ordering bug found during original
implementation.

## 4. Review architecture / Builder / Statistics / UI / Export

Unchanged from the implementation session — see `docs/architecture/review-engine.md` in full. In
summary: `ReviewGenerationService.ensureGenerated()` is compute-on-read, upserting by
`dedupeKey = window + windowStart`, same idempotent-regeneration discipline as every prior engine in
this codebase. `review-builder.util.ts` and `review-statistics.util.ts` are pure, deterministic
functions — no AI wording anywhere. Export supports Markdown and JSON (no PDF — confirmed, again,
that no PDF library exists in this repository; disclosed as out of scope, not silently dropped).

## 5. Security audit

A dedicated, scoped security review of every file under `apps/api/src/review/` was performed during
this closure (ownership/IDOR, cross-user isolation, deleted/archived source data, export ownership,
stored-XSS via the renderer, custom-window validation). Findings:

- **Ownership / IDOR**: every id-bearing route (`getOne`, `archive`, `exportMarkdown`, `exportJson`)
  goes through `ReviewRecordService.findOwned()`, which checks `review.userId !== userId` and 404s
  identically for missing vs. cross-user ids. No gaps found.
- **Cross-user isolation**: every Prisma query in `review-data-source.service.ts` filters by
  `userId` directly or through a relation already scoped by `userId`. No unscoped query found.
- **Deleted/archived evidence**: `JournalEntry` queries filter `state: 'PUBLISHED'`, `Memory`
  queries filter `status: 'ACCEPTED'` — soft-deleted/archived rows for those sources are correctly
  excluded.
- **Export**: both export endpoints independently re-verify ownership via `findOwnedRaw()` before
  returning content; exported content is plain-text Markdown/JSON in the response body, not written
  to disk or server-rendered — no injection path.
- **Renderer / stored-XSS**: no `dangerouslySetInnerHTML` anywhere under
  `apps/web/features/review/components/`; React's default text-node escaping applies even though raw
  Journal/Memory text flows unescaped into `ReviewEvidence.contribution`.
- **Custom window**: `IsISO8601` blocks malformed dates; no max-range cap exists, but evidence
  fetches are bounded (`take` limits), so this is not concretely exploitable — noted, not reported as
  a finding.

**One non-blocking design note** (documented as intentional in `review-engine.md`, not a
vulnerability): a user-dismissed Reflection or user-archived Insight — both explicit "hide this"
actions in their own native views — can still surface as Review evidence/statistics, since Review
generation includes `InsightStatus IN (READY, ARCHIVED)` and excludes only `EXPIRED` Reflections.
Worth an explicit product sign-off before wider release; not a security defect.

**Verdict: no high-confidence, exploitable security findings.**

## 6. Backend E2E

`apps/api/test/review.e2e-spec.ts` (13 tests) covers ownership, category/priority filtering with
empty-section dropping, deleted-evidence and archived-evidence handling, cross-user isolation
(identical 404s), and custom-window validation. Run against a **freshly dropped-and-recreated**
`beaconvie_test` database with all 11 migrations reapplied (Step 4 of this closure): **11/11 suites,
137/137 tests passing**, including `review.e2e-spec.ts` in full.

## 7. Playwright

Four real bugs were found and fixed in `flow-18-review-engine.spec.ts` during this closure's
verification passes (all in the test file, not product code — see
`docs/progress/sprint-5b-progress.md` "Full verification pass" section for full detail):

1. Missing `page.goto('/reviews')` before asserting on dashboard content.
2. A second strict-mode locator collision (`getByText('Journal entries')` case-insensitively matched
   both the statistics label and the overview sentence) — fixed with `{ exact: true }`.
3. The category filter assertion assumed a fixed `'JOURNAL'` category instead of reading it
   dynamically off the evidence badge, the same pattern the backend e2e test already used for the
   same reason (the shared demo account accumulates other Insight data across sprints).
4. The Archive step didn't tolerate the review already being archived by an earlier run within the
   same ISO week (Review archiving is one-way by design — `review.controller.ts`: "never resurrected
   by later regeneration" — unlike Memory's archive/restore) — fixed to only click Archive when the
   button is actually present, while still asserting the archived-status filter finds it either way.

After these fixes, and after a **from-scratch environment reset** (Step 2/3 of this closure: dropped
and recreated the dev database via `prisma migrate reset --force`, flushed Redis, cleared
`test-results`/`playwright-report`, confirmed no persisted browser storage state exists, killed three
stray duplicate `nest start --watch` processes left over from earlier same-session restarts, and ran
both apps in **production mode** — `node dist/src/main.js` + `next start`, not dev mode, matching
`README.md`'s own documented e2e procedure): **the complete 27-test Playwright suite passed, 27/27,
in 4.5 minutes**, including `flow-18-review-engine.spec.ts`'s both tests. This is the run that counts
for release closure; earlier in-session runs against a long-lived, heavily-reused dev-mode
environment showed unrelated pre-existing flows failing intermittently (see Section 9) — the clean
fresh-environment run demonstrates conclusively that those were environmental, not product,
regressions.

## 8. Manual browser verification

Performed via a scripted Playwright session driving a real Chromium browser against the fresh
production-mode stack, logged in as the freshly-seeded demo account:

- **Desktop (1280×800)**: `/reviews` dashboard and `/reviews/week` detail render correctly
  (screenshots captured) — overview, statistics grid, sections, evidence.
- **Tablet (768×1024)** and **Mobile (375×812)**: both render correctly, no horizontal overflow
  (`scrollWidth > clientWidth` checked programmatically, not just visually).
- **Filters**: Category select present (8 options), Priority select present.
- **Evidence**: 4 real deep-links found on the page (`/insights?item=...` etc.).
- **Export**: "Export Markdown" triggers a real download (`weekly-review-2026-08-03.md`).
- **Keyboard/focus accessibility**: first Tab from page load lands on "Skip to main content" (correct
  pattern); continued tabbing reaches the review card's "View" button — cards are keyboard-reachable.
- **Console errors**: only two benign, pre-existing `401`s from `/auth/me` and `/auth/refresh` fired
  before login completes (the app's own session-check-on-load pattern, present on every page, not
  specific to this sprint — confirmed by request-level inspection, not just console text).
- One apparent mobile-layout bug (bottom nav appearing to overlap the statistics grid) was
  investigated and disproven: it was a `fullPage`-screenshot compositing artifact of a genuinely
  `position: fixed` element, not a real rendering defect — confirmed via `getComputedStyle` and a
  real (non-full-page) viewport screenshot showing the nav correctly pinned to the bottom.

## 9. Commands and exact results (this closure session, fresh environment)

| Command | Result |
|---|---|
| `git status --short` / `git diff --check` / `git log --oneline -10` | PASS — clean, expected diff only |
| Fresh DB (`prisma migrate reset --force`) | PASS — 11/11 migrations, demo user reseeded |
| Redis `FLUSHALL` | PASS |
| Playwright storage/artifacts cleared; no persisted browser profile found | PASS |
| `pnpm build` (api + web, production) | PASS — all routes incl. `/reviews`, `/reviews/[param]` |
| Full Playwright suite, fresh env, production servers | **PASS — 27/27 (4.5m)** |
| Backend e2e, fresh `beaconvie_test` DB | **PASS — 11 suites / 137 tests** |
| `pnpm lint` | PASS — 0 errors (24 pre-existing warnings, unrelated Sprint 4C/5A test files) |
| `pnpm typecheck` | PASS — both apps |
| `pnpm --filter api test` (backend unit) | **PASS — 69 suites / 584 tests** |
| `pnpm --filter web test` (frontend unit) | **PASS — 45 suites / 214 tests** |
| `prisma validate` | PASS — "valid 🚀" |
| `prisma migrate status` | PASS — 11/11 migrations, "Database schema is up to date!" |
| `git diff --check` (re-run after doc updates) | PASS — exit 0 |
| Secret scan (pattern-based, full diff + all new files, 55 files) | PASS — no matches |
| Security audit (Review Engine code) | PASS — no high-confidence findings (Section 5) |

## 10. Environmental incidents diagnosed during this closure (not product regressions)

Disclosed in full for transparency, since they produced real failing test runs earlier in this same
session before the fresh-environment reset:

1. **Stray duplicate API dev-server processes.** Earlier `EPERM`-driven restarts of
   `nest start --watch` (from iterative Prisma schema work) left three separate watch processes (and
   three compiled `dist/src/main` processes) all contending for port 4000, causing an intermittent
   connection-refused/flapping API and a runaway "File change detected" restart loop. This cascaded
   into unrelated, untouched flows (companion streaming, memory, journal) failing on ordinary
   navigation/login timeouts. **Fixed**: killed every stray process, confirmed exactly one clean
   instance before re-testing.
2. **Shared demo account password left changed.** An unrelated, pre-existing test
   (`flow-3-forgot-reset-password.spec.ts`, not part of this sprint) had, in an earlier full-suite
   run this session, changed the demo account's password to `Demo1234!New` without it being reset
   back — cascading into every other flow's hardcoded `loginAsDemo('Demo1234!')` failing. **Fixed**
   at the time via a one-off password restore script; **superseded** by this closure's full database
   reset, which reseeds the demo account fresh on every future run regardless.
3. **Auth-rate-limit / demo-account data-volume exhaustion from repeated same-session full-suite
   runs.** Prior to the fresh-environment reset, this session ran the full Playwright suite multiple
   times against the same long-lived dev-mode servers and ever-growing shared demo-account data,
   which — combined with dev-mode's slower per-route compilation (`README.md`'s own documented
   caveat: "Next's dev-mode lazy per-route compilation is slow enough on first visit to make dev-mode
   e2e runs flaky") — produced failures in unrelated flows (memory, companion, journal, reflection,
   insight). None of the failing spec files were ever Review Engine files. **Resolved** by the
   from-scratch reset and switching to production-mode servers for this closure's authoritative run
   (Section 7), which passed 27/27 cleanly.

None of these three incidents originated in or were caused by Sprint 5B code; all are now
root-caused, and the authoritative fresh-environment run in Section 7 supersedes every earlier,
environment-polluted run from this session.

## 11. Known limitations (unchanged, carried forward from implementation)

- "Study streak" and "Completed sessions" from the original brief map to real, honestly-labeled
  product concepts (Journaling streak, Companion conversations) — no fabricated entity, disclosed in
  both `sprint-5b-progress.md` and `review-engine.md`.
- No PDF export (no PDF library exists anywhere in this repository).
- Calendar-period windows (ISO week / calendar month), not rolling windows — a deliberate design
  choice to preserve idempotent regeneration, documented in `review-engine.md`.

## 12. Residual / non-blocking findings

1. **Dismissed Reflections / archived Insights still surface in Review evidence** (Section 5) —
   intentional per current design, but worth an explicit product sign-off before wider release.
2. Sprint 5B's code changes remain **uncommitted in the working tree until this closure's own commit
   step** (see Final Output below) — no other open blockers.

## 13. Sprint 5C entry criteria

- Review Engine is stable under a real, fresh-environment, production-mode verification pass — not
  just a single green run in a long-lived, reused dev environment.
- All Sprint 5B-owned tests (backend unit, backend e2e, frontend unit, Playwright) are green,
  reproducibly, in a clean environment.
- No security/privacy findings block release; one non-blocking design note is disclosed for product
  sign-off.
- Nothing in Sprint 5B touched AI/LLM/coaching/recommendations/embeddings — that boundary remains
  intact for whatever Sprint 5C introduces.
- Recommend: get explicit product sign-off on the dismissed/archived-evidence-in-Reviews behavior
  (Section 5/12) before treating it as final.
