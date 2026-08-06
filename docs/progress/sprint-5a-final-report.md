# Sprint 5A — Insight Experience: Release Closure Final Report

## 1. Executive summary

Sprint 5A (Insight Experience) is **code-complete and verification-complete**. All Definition of
Done checks pass. Two real, narrow bugs were found and fixed during closure verification (one in
Sprint 4C's own reconciliation logic, one in this sprint's own Playwright spec) — both disclosed
below with root cause and fix. Several pre-existing, environment-specific and unrelated-feature
flakiness issues were investigated, root-caused, and are disclosed rather than silently retried
past. No security or privacy findings. No AI/LLM call exists anywhere in the Insight Experience
code path.

**Note on the numbers stated in the closure request**: the request's "Current verified state"
listed backend unit tests at 517/517 and frontend tests at 212/212. This report's own from-scratch
runs (Section 13) consistently produced **543/543 backend** and **196/196 frontend** across every
run this session, matching `docs/progress/sprint-5a-progress.md`'s own recorded counts from the
original implementation session. The discrepancy is disclosed rather than silently reconciled —
this report's numbers are from fresh runs performed in this closure session, not carried over from
the request.

## 2. Baseline commit

`547536b` ("update code sprint 4") — working tree was clean at the start of the original Sprint 5A
implementation session; this closure session found the same set of Sprint 5A changes still
unstaged and uncommitted, no unrelated drift.

## 3. Scope delivered

Everything specified in the original Sprint 5A brief: presentation types, deterministic renderer,
Evidence View, Timeline (range + grouping), Filters, the `/insights` dashboard, and Sprint 4C API
extensions (`cards`/`timeline`/`:id/card`/`:id/evidence`/`:id/pin`/`:id/unpin`). See
`docs/architecture/insight-experience.md` for the full design (unchanged this closure session,
still accurate).

Additions made **during this closure session**:

- `apps/api/test/insight-experience.e2e-spec.ts` — Sprint 5A had no dedicated backend e2e coverage
  before this closure (Sprint 4C shipped without one too); this file adds 12 tests against the real
  HTTP surface (ownership, filters, timeline, evidence, archive, cross-user isolation, CSRF).
- A regression test in `insight-generation.service.spec.ts` was already added in the implementation
  session for the reconciliation bug (see Section 4); unchanged this session.
- `flow-17-insight-experience.spec.ts` fixed for a strict-mode Playwright locator bug (Section 11).

## 4. Insight presentation architecture

Unchanged from the implementation session — see `docs/architecture/insight-experience.md` in full.
Summary: `InsightPresentationService` (`apps/api/src/insight/presentation/`) reads
`InsightCandidate` rows Sprint 4C's `InsightGenerationService` already materialized, and renders
them via pure functions in `insight-renderer.ts`. No new insight generation anywhere.

## 5. Renderer

Unchanged. `insight-renderer.ts` — pure, deterministic, unit-tested (24 assertions). Priority tiers
reuse existing codebase thresholds (40, 70). Verified again this session via a fresh, isolated
`insight-renderer.spec.ts` run (part of the 543/543 total).

## 6. Evidence view

Unchanged in design. Verified this session via:

- 12 new backend e2e tests (`insight-experience.e2e-spec.ts`) against the real API, including a
  **hard-delete reconciliation test**: deleting every journal entry behind one evidence reflection
  causes that reflection to expire and be reconciled out of the insight's evidence — proving the
  reconciliation bug fix (Section 4/11 of the architecture doc) works end-to-end, not just in the
  unit test.
- An **archived-source test**: archiving (not deleting) a cited journal entry keeps its evidence
  source `available: true` with a working link.
- A **spoofing/cross-user test**: a non-owner's evidence request 404s and the response body
  contains neither the real journal content nor the real journal id.

## 7. Timeline and filters

Unchanged in design. Verified via 5 new backend e2e tests (range resolution incl. custom-range
validation, groupBy=category/priority/topic, category filter) plus the existing unit tests
(`insight-timeline.util.spec.ts`, `insight-timeline-range.util.spec.ts`).

## 8. Frontend routes

`/insights` (dashboard), unchanged. Manually smoke-tested this session (Section 12) against the
**production build** (`next build` + `next start`), not the dev server — Top/Recent/Timeline/
Pinned/Archived sections, filters, evidence view, pin toggle, keyboard tab order, error state for a
nonexistent id, and mobile viewport, all confirmed working.

## 9. Security and privacy

Re-verified this session (no findings, consistent with the implementation session's own review):

- **Ownership**: every `insight-candidates/*` route is `userId`-scoped or does an explicit
  post-fetch ownership check that 404s identically for nonexistent vs. cross-user IDs. Confirmed
  via e2e (`card`/`evidence`/`pin`/`unpin`/`archive` all tested against a real second user).
  Re-confirmed via a dedicated new e2e test asserting the 404 error code is identical.
- **Client-provided IDs cannot spoof evidence**: `evidence(userId, id)` always re-checks
  `candidate.userId !== userId` before returning any data — a crafted `id` belonging to another
  user returns a 404 with no journal content or ids in the response body (asserted directly).
- **Deleted/invalidated evidence never renders as active**: proven end-to-end via the hard-delete
  e2e test (Section 6) — not just asserted in a unit test with a mocked scenario.
- **No content logging**: grepped every `Logger`/`logger.*` call site under `apps/api/src/insight/`
  — the only log line in the entire presentation module is
  `Insight ${pinned ? 'pinned' : 'unpinned'} id=${id}`, structured and content-free. No
  `ruleExplanation`, `contribution`, journal, memory, or reflection text is ever logged.
- **No hidden LLM/provider call**: grepped `apps/api/src/insight/` for
  `openai|anthropic|gemini|fetch\(|axios|http.request` — zero matches (the one "fetch" hit is
  `InsightDataSourceService.fetch()`, a Prisma method name, not a network call). The Insight
  Experience code path never imports or calls the `companion/providers/` AI provider layer.
- **Deterministic renderer never invents unsupported wording**: every string in `InsightCard` is
  either copied from a persisted field (`ruleExplanation`) or a fixed template
  (`insight-renderer.spec.ts` asserts this directly, including a determinism check: same input
  always produces the same output).
- **CSRF**: `POST .../pin` and `.../unpin` both rejected with `CSRF_TOKEN_MISSING` when the header
  is omitted (e2e-tested).

No HIGH, MEDIUM, or LOW findings from this session's review.

## 10. Backend E2E

New file `apps/api/test/insight-experience.e2e-spec.ts`, 12 tests, covering exactly the checklist
in the closure request: ownership, timeline filters, source filters, priority/category/status
filtering, deleted/invalid evidence handling, archived evidence behavior, cross-user isolation,
CSRF on pin mutations. (Stale-source-link *defense-in-depth* — the per-source `available: false`
branch in `evidence()` — is unit-tested but not independently e2e-reachable: Reflection
Foundation's own `revalidateForUser()`, which every Insight read re-runs first, already guarantees
a non-expired reflection can never cite a deleted source, so the real HTTP API cannot currently
construct that state. Disclosed rather than faked with a contrived test.)

Full backend e2e suite result: **123/124 passing** (see Section 13 for the one pre-existing,
unrelated failure and its root cause).

## 11. Playwright

`flow-17-insight-experience.spec.ts` had a real bug found during this closure's full-suite run: an
unanchored regex assertion (`getByText(/^Goal \(\d+\)$|.../)`) hit Playwright's strict-mode
violation once the shared demo account's Timeline legitimately had two category groups visible at
once ("Journal theme" and "Recurring topic"). Fixed with `.first()` — the same pattern already used
elsewhere in the same file for the Pinned-section assertion. Verified passing twice in a row in
isolation, and passing as part of the full 25-test suite (Section 13).

flow-16 and flow-15 (regression) both verified passing against the production-mode stack — see
Section 13.

## 12. Manual smoke

Performed for real, against the production build (not dev server), via a scripted Playwright
session driving a real Chromium browser (not claimed without evidence):

- Logged in as the seeded demo account.
- Desktop (1440×900): Top insights, Recent insights, Timeline, Pinned, Archived — all render.
  Category filter narrows the list. Opening a card shows Reason/Why it matters/Evidence. Pin/Archive
  buttons present and correctly labeled per state.
- A `?item=does-not-exist-id` direct link renders the real `ErrorState` ("Something went wrong /
  That insight couldn't be found. / Try again") — confirmed after waiting long enough for React
  Query's default retry backoff (an initial 1-second check falsely looked like a stuck loading
  skeleton; a 9-second wait proved it resolves correctly).
- Keyboard: tabbing from the detail view's "Back" button reaches the Pin/Archive controls and then
  the page's own nav — no keyboard trap.
- Mobile (375×812): layout stacks correctly, no horizontal scroll, bottom nav does not overlap
  content in the real (non-full-page-screenshot) viewport.
- No console errors beyond an expected pre-login 401 (the app's own auth-check-before-redirect
  pattern, present on every page, not specific to this sprint) and one intentional 404 (the
  error-state test itself).

## 13. Commands and exact results

All commands run fresh in this closure session, against a clean rebuild (`rm -rf .next dist` then
`pnpm build`) and a **production-mode** local stack (`node dist/src/main.js` + `next start`, not
`next dev`/`nest start --watch`).

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — "Already up to date" |
| `pnpm lint` | PASS — 0 errors (24 pre-existing warnings in Sprint 4C test files, unchanged) |
| `pnpm typecheck` | PASS |
| `pnpm --filter api test` (backend unit) | PASS — **65 suites / 543 tests** |
| `pnpm --filter web test` (frontend unit) | PASS — **40 suites / 196 tests** |
| `pnpm --filter api test:e2e` (backend e2e) | **123/124 passing** — 1 pre-existing, unrelated failure (see below) |
| `pnpm build` | PASS — api (Nest) + web (Next, all 26 routes incl. `/insights`) |
| `prisma generate` | PASS |
| `prisma validate` | PASS — "valid 🚀" |
| `prisma migrate status` | PASS — 9/9 migrations, "Database schema is up to date!" |
| Full Playwright suite (`npx playwright test`) | **23/25 passing** — 2 pre-existing, unrelated failures (see below) |
| `git diff --check` | PASS — exit 0, no whitespace/conflict errors |
| Secret scan (pattern-based, full diff + all new files) | PASS — no matches |

### Backend e2e failure: `account-security.e2e-spec.ts` (pre-existing, unrelated)

One test — "resend respects the cooldown, then allows a new send once it elapses" — times out at
its hardcoded 15s budget. Root-caused: this test performs 3 real SMTP round-trips (register's
welcome+verification emails, then 2 resend calls) plus an explicit 2.1s sleep, against a local
Mailpit container whose Docker-Desktop-for-Windows port-forward for 1025 was observed to
intermittently stop responding ("Greeting never received") over a long-running session and requires
a container restart to recover (`docker restart beaconvie-mailpit`) — confirmed by direct raw-TCP
reproduction (`timeout 5 bash -c 'exec 3<>/dev/tcp/localhost/1025 && cat <&3'` hung; a fresh
container restart immediately fixed it). Even freshly restarted, this specific test's tight 15s
budget for 3 real network round-trips is fragile on this host. **Classification: infrastructure
(Docker Desktop SMTP port-forward reliability) + pre-existing test fragility (tight timeout for a
multi-round-trip test)**. Not a Sprint 5A regression: this file is untouched by the Sprint 5A diff,
and every other mail-dependent test (`auth.e2e-spec.ts`, including forgot/reset-password and
register-triggered emails) passed cleanly once Mailpit was healthy. Not fixed — out of scope
("do not refactor unrelated code"); disclosed as a residual risk (Section 16).

### Playwright failures (2, both pre-existing, unrelated to Sprint 5A)

- `flow-5-companion-cancel.spec.ts` — "cancel a streaming reply mid-generation": the Cancel button
  is detached from the DOM before Playwright's click lands (`element was detached from the DOM,
  retrying`, then a 30s timeout). Reproduced identically across two independent full-suite runs.
  Classification: **test timing race** in a pre-existing Sprint 2B spec (the streaming reply
  finishes or re-renders faster than the click can land) — not a product defect (the adjacent
  `flow-6-companion-retry.spec.ts` passes, showing the underlying stream/cancel/retry mechanism
  works).
- `flow-9-memory-archive-restore.spec.ts` — "archiving a memory hides it...": a strict-mode
  Playwright violation, the exact same class of bug fixed in `flow-17` this session — the memory's
  title text matches both a button label and a paragraph element simultaneously. Classification:
  **pre-existing test-authoring bug** in a Sprint 3A spec, not a product defect.

Neither file is part of the Sprint 5A diff; neither will be modified here per the closure request's
"do not refactor unrelated code."

### Discovered, pre-existing, out-of-scope infrastructure defect

`apps/api/package.json`'s `"start": "node dist/main.js"` script pointed at the wrong path — `nest
build`'s actual output is `dist/src/main.js` (per `nest-cli.json`'s `sourceRoot: "src"`). Running
`pnpm --filter api start` failed outright (`MODULE_NOT_FOUND`) before any fix. This is what blocked
Section 4's "production-mode local stack" requirement until diagnosed. **Fixed in the working tree**
(`"start": "node dist/src/main.js"`) to unblock verification, but **deliberately left unstaged and
uncommitted** — it predates Sprint 5A entirely (no Sprint 5A file touches `package.json`'s scripts)
and is out of this sprint's scope per "stage intended Sprint 5A files only." Recommend the user
decide whether to commit this separately.

## 14. Test-environment throttle incident

Investigated per the closure request's claim that flow-16 was blocked by a self-inflicted auth rate
limit.

- **State recovered, not weakened**: `LoginThrottlerGuard` keys by `${ip}:${email}` in Redis
  (`RedisThrottlerStorageService`, prefix `beaconvie:throttle`), limit governed by
  `AUTH_RATE_LIMIT_MAX`/`AUTH_RATE_LIMIT_WINDOW_MS`. This repo's local `.env` already sets
  `AUTH_RATE_LIMIT_MAX=100` (vs. the production default of 5) specifically to give local/Playwright
  runs headroom — production security (the default-5 behavior) was never touched.
- **What was checked**: `docker exec beaconvie-redis redis-cli KEYS "beaconvie:throttle:*"` at the
  start of this closure session returned **zero keys** (`DBSIZE` also 0) — no active block existed
  for the dev/Playwright Redis namespace at that time. flow-16 and flow-17 both logged in
  successfully on every run this session (multiple runs each), confirming no rate-limit collision
  occurred during this closure's own verification.
- **Per-run isolation already exists**: the backend e2e suite has its own dedicated Redis prefix
  (`beaconvie:throttle:test`, `.env.test`) and its own `jest-e2e.global-setup.js`, which flushes
  that prefix's keys before every e2e run — confirmed present and working (two stray
  `beaconvie:throttle:test:*` keys observed mid-session were from the e2e suite's own runs and are
  auto-cleared on the next invocation). Playwright's flows use unique, timestamped tags for all
  created content (journals, etc.) but share one login identity (`demo@beaconvie.local`) by design,
  documented in flow-16's own comments, since the account's accumulated history is the point of that
  test. No test-isolation change was made to this pattern (out of scope: would be a test-design
  change to pre-existing files, not requested for Sprint 5A specifically, and the generous local
  `AUTH_RATE_LIMIT_MAX=100` already gives ample headroom for the actual number of logins these
  flows perform).
- **Conclusion**: no reset action was necessary in this session; the original incident (if it
  occurred) had already self-resolved via the rate limit's own TTL before this session began.

## 15. Known limitations (carried forward, unchanged)

See `docs/architecture/insight-experience.md` "Known limitations" — unpaginated evidence, dominant-
groupKey topic heuristic, no calendar-picker UI for custom timeline ranges. All previously disclosed,
none newly discovered this session.

## 16. Residual risks

1. **One pre-existing InsightCandidate row on the shared demo account still shows a stale headline**
   ("30 reflections..." while its live evidence count is 16) — this row was already partially
   reconciled *before* this sprint's reconciliation bug fix landed, and since none of its current
   16 evidence reflections have newly expired, `reconcileStaleCandidates()` has had no reason to
   touch (and thus refresh) its `ruleExplanation` again since the fix. The fix is confirmed correct
   going forward (proven by the e2e hard-delete test and by every other, more-recently-touched
   candidate on the same account showing fully consistent numbers, e.g. "28 reflections... Backed
   by 28 reflections"). This one legacy row will self-heal the next time its evidence set changes
   again; no data migration was written for it (out of scope — would be a one-off data-hygiene
   script touching only demo/test data, not application code).
2. **Docker Desktop's SMTP port-forward for Mailpit (port 1025) has been observed to silently stop
   responding over a long-running local session**, requiring `docker restart beaconvie-mailpit` to
   recover. This affects local mail-dependent e2e/Playwright tests only — Mailpit is a dev/test-only
   tool, this has no production analog (production uses a real SMTP provider). Recommend the team
   note this as a known local-dev quirk on Windows/Docker Desktop if it recurs.
3. **`apps/api/package.json`'s `start` script fix is uncommitted** (Section 13) — recommend a
   separate, explicit commit/PR for that one-line infra fix, since it's unrelated to Sprint 5A.
4. **`flow-5` and `flow-9`** (pre-existing, unrelated Playwright specs) remain flaky as diagnosed —
   not fixed, per scope.

## 17. Sprint 5B entry criteria

- Insight Experience is stable under real, repeated, production-mode verification — not just a
  single green run.
- All Sprint 5A-owned tests (unit, e2e, Playwright) are green and reproducibly so (each rerun
  independently, not just once).
- The one backend e2e failure and two Playwright failures are pre-existing, root-caused, unrelated
  to Sprint 5A, and explicitly do not block closure.
- No security/privacy findings.
- Nothing in Sprint 5A touched AI/LLM/reports/recommendations — that boundary remains intact for
  whatever Sprint 5B introduces.
- Recommend Sprint 5B (or a small maintenance ticket) pick up the two disclosed, out-of-scope
  fixes: the `package.json` start-script path and the pre-existing Playwright flakiness in flow-5/
  flow-9, since they're now precisely diagnosed rather than mysterious.
