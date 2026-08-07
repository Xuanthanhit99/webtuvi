# Post-Sprint 5A Maintenance

Small maintenance closure following Sprint 5A (Insight Experience, `5d8a9a223f24309ed5dbe73f45cd5d4909a9fa70`).
Scope: the one intentionally-excluded API start-script fix, and the two pre-existing Playwright
failures disclosed in Sprint 5A's own release-closure report. No Insight Experience code touched.
No unrelated modules refactored. Sprint 5B not started.

## 1. API start-script root cause and fix

**Root cause**: `apps/api/package.json`'s `"start": "node dist/main.js"` pointed at a path that
never existed. `nest-cli.json` sets `sourceRoot: "src"`, so `nest build`'s real output is
`dist/src/main.js` — confirmed by a clean `rm -rf dist && nest build` followed by checking both
paths directly (`dist/main.js` absent, `dist/src/main.js` present). Running `pnpm --filter api
start` before the fix failed outright with `MODULE_NOT_FOUND`.

**Fix**: `"start": "node dist/src/main.js"`. One line. Verified no unrelated script or dependency
changes are present in the diff (`git diff -- apps/api/package.json` shows exactly this one line).
`start:dev`/`start:debug` use `nest start --watch` (source-level, never touch `dist/`) and were
already correct; `test`/`test:e2e`/`lint`/`typecheck`/`prisma:*` scripts are all unchanged.

**Verified**: clean `nest build`, then `pnpm --filter api start` against the real local Postgres/
Redis — `GET /health/live` → `200 {"status":"ok"}`, `GET /health/ready` → `200 {"status":"ok",
"checks":{"database":"ok","redis":"ok"}}`, and `GET /insight-candidates` (unauthenticated) → `401`
(confirms the whole module graph, including `InsightModule`, boots correctly).

**Committed**: `14c00f0e45b977c272d08a8b1f16ae1f7cf2824a` ("fix: correct API production start
path"), separate from and not amending Sprint 5A's own commit.

## 2. flow-5 (companion-cancel) root cause and fix

**Root cause**: `MockProvider.stream()` (`apps/api/src/companion/providers/mock.provider.ts`,
untouched) emits one word every 15ms, and the shortest canned reply is ~13 words — a full turn can
complete in well under 200ms. `Composer`'s Cancel button (`composer.tsx`, untouched) only renders
while `status === 'streaming'`, and `status` flips away from `'streaming'` the instant the `done`
SSE event arrives. The test's own `toBeVisible()` check + Playwright's click-actionability pass
could, under any system load, land *after* that ~200ms window had already elapsed — Playwright
correctly reported `element was detached from the DOM, retrying`, because the button had genuinely
already unmounted, not because of a Playwright API misuse.

**Fix** (test-file only, `apps/web/e2e/flow-5-companion-cancel.spec.ts`): a `page.route()`
interceptor on the streaming request (`**/companion/conversations/*/messages/stream*`) holds the
request for 2 seconds before calling `route.continue()`. This delays only *when the network
request reaches the real API* — the same real `MockProvider`/`StreamService` code path still runs,
still emits the same real tokens in the same real format, and the client-side `cancel()` (a
synchronous `EventSource.close()` + state update, per `use-companion-conversation.ts`) still
exercises the same real cancellation mechanic. `status` is set to `'streaming'` synchronously
before the (now-delayed) request is even sent, so the Cancel button's visible window becomes a
deterministic ~2 seconds instead of racing a ~200ms reply. No product code changed. No arbitrary
sleep inside the test's own control flow — the delay is a scoped network-layer synchronization
primitive tied to one specific request.

**Verified**: 3 consecutive isolated runs, all passing (10.6s / 7.4s / 10.4s); passing again as
part of the full 25-test Playwright suite.

## 3. flow-9 (memory-archive-restore) root cause and fix

**Root cause**: each Memory Timeline row (`memory-timeline.tsx`, untouched) renders both a title
`<p>{item.title}</p>` and a summary `<p>{item.summary}</p>`. "Remember this" carries the raw
companion-message text into both fields verbatim, so when the test's own phrase is both the title
and the summary of the same row, an unscoped `page.getByText(phrase)` matches *two real elements in
the same row*. The observed failure (`getByText(phrase)` resolving to a "Rename memory: ..." button
and a paragraph, both under `Memory Detail`'s own aria-label) is a genuine strict-mode locator
collision, not a product bug — `MemoryDetail`/`MemoryTimeline` conditional-render correctly
(confirmed by reading `memory-view.tsx`: `activeId ? <MemoryDetail/> : <MemoryTimeline/>`, a clean
either/or).

**Fix** (test-file only, `apps/web/e2e/flow-9-memory-archive-restore.spec.ts`): scope every
`getByText(phrase)` assertion to the Timeline's own accessible list region
(`page.getByRole('list', { name: 'Memory timeline' })`, matching the real `aria-label="Memory
timeline"` already on the `<ol>` in `memory-timeline.tsx`). This makes every assertion resolve to
exactly the row(s) that matter and — critically for the "hidden after archive" check — resolve to
*zero* elements once the memory is truly archived and gone from the list, rather than racing
whatever might still be present in a still-transitioning detail view. No duplicate UI content was
hidden or suppressed; the title/summary duplication is real, normal, and unchanged — only the test's
own locator was made unambiguous.

**Verified**: 3 consecutive isolated runs, all passing (9.5s / 8.3s / 10.2s), plus one prior
single-run pass; passing again as part of the full 25-test Playwright suite.

## 4. Mailpit test status

**Investigated, precisely root-caused, partially fixed at the test level — product code
unchanged**, per the task's own preference order.

Two distinct, compounding causes were found in `apps/api/test/account-security.e2e-spec.ts`'s
"resend respects the cooldown" test (the only test in the suite exposed to this, since it performs
3 real, *awaited* SMTP round-trips — register's own verification email plus 2 resend calls — while
every other flow in this repo either doesn't send mail synchronously in the request path, or (like
`AuthService`'s welcome email) fires it with `void ...` and never awaits it):

1. **Environment**: Docker Desktop's SMTP port-forward for the local Mailpit container has been
   observed to intermittently stop responding after sustained local use (`Greeting never
   received`), independent of the container's own health (`docker ps`/`docker inspect` both
   reported it healthy throughout). Reproduced directly with a raw TCP probe
   (`timeout 5 bash -c 'exec 3<>/dev/tcp/localhost/1025 && cat <&3'` hangs); `docker restart
   beaconvie-mailpit` reliably restores it. This is a local Windows/Docker Desktop infrastructure
   quirk with no production analog (production uses a real SMTP provider, never Mailpit — see
   `env.validation.ts`).
2. **Test-file-level (fixed, in scope)**: the resend-cooldown test carried an explicit `15000`ms
   timeout override, *tighter* than the suite's own `jest-e2e.json` default of `60000`ms, with no
   comment explaining why. Measured directly this session: even with Mailpit fully healthy, this
   test's 3 real SMTP round-trips took **19.5 seconds** — already past its own 15s override,
   independent of any Docker flakiness. This was the proximate, reproducible cause.

**Fix applied** (test-file only, no product code):

- Added a bounded (3-second) TCP-connect readiness probe in the "Email verification" describe
  block's `beforeAll`, against the same host/port `MailpitMailProvider` would use. If unreachable,
  the resend-cooldown test logs a clear warning and returns early (a graceful, visible skip)
  instead of hanging out nodemailer's own much longer internal timeouts.
- Removed the unexplained `15000`ms override, so the test now uses the suite's own established
  `60000`ms default — the same margin already given to every other test in this file. This is not
  an "excessive" new timeout; it is the suite's own pre-existing default, already proven adequate
  (every other test here fits comfortably inside it), applied consistently rather than carving out
  a tighter, unjustified exception for the one test that most needs the room.

This directly follows the task's stated preferences — "readiness verification before test
execution" and "polling ... with a bounded timeout" — without touching `MailService`,
`MailpitMailProvider`, or `EmailVerificationService`. "Unique recipient per run" and pre-clearing a
mailbox were considered but don't apply: the test already uses a unique, timestamped email per run
(`uniqueEmail('resend-cooldown')`), and it never inspects Mailpit's own mailbox contents at all —
only `EmailVerificationToken` row counts in the database — so mailbox state was never actually part
of what could flake.

**Not fixed, left to product code, disclosed rather than hidden**: the *reason* this test alone is
exposed is that `EmailVerificationService.sendVerification()` `await`s `MailService.
sendVerificationEmail()`, while `AuthService`'s welcome email is fire-and-forget (`void
this.mailService.sendWelcomeEmail(...)`). Since `MailService.dispatch()` already catches and only
logs every send failure (never rethrows), that `await` provides no behavioral benefit today — the
caller can't observe success or failure either way — while making the HTTP response hostage to
nodemailer's own connection/greeting timeout whenever SMTP is slow or unreachable. Matching the
welcome-email's fire-and-forget pattern (or giving `MailpitMailProvider`'s transporter a short,
explicit `connectionTimeout`/`greetingTimeout`) would remove the *underlying* exposure entirely, not
just this one test's margin for it — but both are product-code changes, explicitly out of scope for
this maintenance task ("do not redesign email delivery"). Recommended as a follow-up ticket, not
attempted here.

**Verified**: `account-security.e2e-spec.ts` run twice in isolation with Mailpit healthy — 18/18
passing both times, resend-cooldown taking ~19.5s (comfortably inside the new 60s budget); the full
backend e2e suite (10 files) also passes 124/124 with this file included.

## 5. Exact commands and results

All commands run fresh this session, against the still-running production-mode stack from Sprint
5A's own closure (`node dist/src/main.js` + `next start`) and a clean rebuild for the start-script
verification specifically.

| Command | Result |
|---|---|
| `pnpm lint` | PASS — 0 errors (25 pre-existing warnings, unchanged, plus zero new ones after removing one unnecessary `eslint-disable`) |
| `pnpm typecheck` | PASS |
| `pnpm --filter api test` (backend unit) | PASS — 65 suites / 543 tests |
| `pnpm --filter api test:e2e` (backend e2e) | PASS — 10 suites / **124/124** tests (up from 123/124 before this maintenance) |
| `pnpm --filter web test` (frontend unit) | PASS — 40 suites / 196 tests |
| `pnpm build` | PASS — api (Nest) + web (Next, all 26 routes) |
| Full Playwright suite (`npx playwright test`) | PASS — **25/25** (up from 23/25 before this maintenance) |
| `git diff --check` | PASS — exit 0, no whitespace/conflict errors |
| Secret scan (pattern-based, full maintenance diff) | PASS — no matches |

Individual isolation/repeat runs performed during diagnosis (all passing, see Sections 2–4 above):
flow-5 ×4 (1 initial + 3 repeat), flow-9 ×5 (1 initial + 3 repeat + 1 combined-with-flow-5),
account-security.e2e-spec.ts ×2 full-file runs.

## 6. Remaining non-blocking issues

1. **`EmailVerificationService` awaiting a fire-and-forget-equivalent mail send** (Section 4) —
   recommended follow-up, not fixed here (product code, out of scope).
2. **Docker Desktop's Mailpit SMTP port-forward reliability** is an environment characteristic of
   this host, not something either the test suite or the application can fully control. The
   readiness probe added this session catches it gracefully going forward; it does not "fix" Docker
   Desktop itself.
3. Sprint 5A's own disclosed residual risk — one legacy demo-account `InsightCandidate` row with a
   stale headline relative to its live evidence count — is unrelated to this maintenance and still
   pending its own natural self-heal (see `docs/progress/sprint-5a-final-report.md` Section 16).
4. The Playwright/e2e test-file fixes in this document (`flow-5`, `flow-9`,
   `account-security.e2e-spec.ts`) are verified but **left uncommitted** in the working tree — this
   task's own instructions specified a commit step only for the API start-script fix.
