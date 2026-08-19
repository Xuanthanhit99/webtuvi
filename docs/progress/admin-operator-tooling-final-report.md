# Interim Sprint — Admin Operator Tooling — Final Report

Date: 2026-08-19

> This session resumed a checkpoint left by a prior session: implementation already complete and
> committed, `flow-29-admin-operator-tooling.spec.ts` written, one Playwright attempt already run
> (USER-denial security test PASSED; ADMIN happy-path test timed out on a cold `/register`
> compile after a fresh server restart). This session's job was narrowly scoped: recover the
> pending web typecheck, retry flow-29 on a warm server, root-cause any repeat failures before
> touching product code, and report exact status — not to redo or expand the sprint.

## 1. Starting state / recovered checkpoint

- HEAD at session start: `f06813b` ("[update][commit] roadmap") — all Admin Operator Tooling
  implementation (backend `apps/api/src/admin/*`, `AdminGuard`, frontend
  `apps/web/features/admin/*`, the `AppHeader` "Operator Tools" link, the Prisma migration
  `20260818151951_admin_operator_role`, both the backend e2e spec and the Playwright flow-29 spec)
  was **already committed** in this commit — `git log` confirms it, despite the vague commit
  message (this repo's established style; see `git log --oneline` history).
- Only uncommitted change at session start and end: `apps/web/e2e/flow-29-admin-operator-tooling.spec.ts`
  (the two test-bug fixes made this session — see §4).
- No prior progress/report file existed for this interim sprint (`docs/progress/` had no
  `admin-operator*` file) — this report is the first.
- **Web typecheck**: no completion record existed from the described background run (no captured
  log anywhere in the repo; the `.tsbuildinfo` file present does not record pass/fail for
  `tsc --noEmit --incremental`). Reran it fresh: **`tsc --noEmit` — PASS, 0 errors, exit 0.**

## 2. Environment recovery required this session

None of this was expected to be needed going in — the checkpoint assumed a warm server was
already up. It was not; this session started from a completely cold machine:

1. **Docker Desktop was not running at all.** Started it, waited for the daemon, then
   `docker compose up -d` — pulled fresh images and created **new** `beaconvie-postgres` /
   `beaconvie-redis` / `beaconvie-mailpit` volumes (confirmed via `docker volume ls` showing
   `Creating`/`Created`, not reuse).
2. Because the Postgres volume was brand new, **all 21 Prisma migrations were pending**
   (`prisma migrate status`), including `20260818151951_admin_operator_role`. Ran
   `prisma migrate deploy` — all 21 applied cleanly — then `prisma generate`.
3. Started `pnpm dev:api` and `pnpm dev:web` fresh (both cold-compiling for the first time this
   session).
4. Partway through retries, `apps/api`'s `nest start --watch` process entered a **self-triggering
   restart loop** — "File change detected. Starting incremental compilation..." repeating every
   40–70 seconds with zero actual source edits from this session, never reprinting the
   "Nest application successfully started" banner after the first boot. This left the API down
   mid-restart exactly when a test run hit it (`ECONNREFUSED ::1:4000`). Worked around by killing
   the watch process tree and running the compiled output directly instead of chasing the watcher
   bug (out of scope for this session — flagged in §7 for whoever picks up dev-tooling hygiene
   next). `nest build` itself then hit a Windows-specific `ENOTEMPTY` on its own `deleteOutDir`
   step (stale/locked `dist/src/companion/prompt`); resolved with a PowerShell
   `Remove-Item -Recurse -Force` followed by a clean `nest build`.
5. The backend e2e spec (`apps/api/test/admin-operator-tooling.e2e-spec.ts`) initially failed all
   21 tests with `PrismaClientInitializationError: Database "beaconvie_test" does not exist` — the
   fresh Postgres volume never had the test database provisioned. Fixed exactly per the command
   already documented in a comment in `apps/api/.env.test`: `CREATE DATABASE beaconvie_test;` then
   `prisma migrate deploy` against it. Not a code defect — a one-time fresh-environment gap.

None of the above are product or test-code defects; they are the expected cost of starting this
session's verification from a fully cold machine (Docker down, empty DB volume, no running
servers) rather than the warm environment the checkpoint assumed.

## 3. flow-29 Playwright — root-cause history (three distinct issues found, in order)

flow-29 failed differently on each of the first four runs this session. Per the checkpoint's
explicit instruction, each failure was root-caused against real evidence (page snapshots, network
traces, server logs) before any file was touched, and cold-start artifacts were not treated as
product defects unless they reproduced on a warm retry.

**Issue 1 — cold `/register`/`/onboarding` compile (attempts 1–2, matches the checkpoint's known
symptom).** Reproduced identically twice. Root-caused via the Playwright trace's page snapshot at
failure time: the browser was sitting on the onboarding chat screen, not `/register`.

**Issue 2 — real root cause, not just compile lag (found once traces were inspected properly).**
`page.request.post()` (line ~69, creating the "target" fixture user) shares its cookie jar with
`page`'s browser context. That call set the target (unonboarded) user's access-token cookie into
the shared context *before* the admin's own `registerAndOnboard()` ran. `middleware.ts`'s
`resolveRedirect()` then correctly redirected the subsequent `/register` visit to `/onboarding`
(authenticated-but-unonboarded visitor — exactly its intended, correct behavior). **This is a test
isolation bug, not a product defect.** Fixed by switching that one call to Playwright's isolated
`request` fixture, which has no cookie sharing with `page`.
— File: `apps/web/e2e/flow-29-admin-operator-tooling.spec.ts`, test `ADMIN can reach Operator
  Tools...`, signature changed to `async ({ page, request })`.

**Issue 3 — `/admin` route's first-ever compile (attempt 3, post-fix).** After fixing Issue 2, the
admin flow got much further but failed with `toHaveURL(/\/admin/)` timing out at the default 10s
`expect` timeout, URL stuck at `/dashboard`. Root-caused via the web dev server log: `/admin` had
never been visited by an authenticated admin before in this process (prior `/admin` hits were all
non-admin 403→404 rewrites that never reach the real page component) — its first real compile took
**27.6s** (3855 modules), 2.7× the assertion timeout. Confirmed as a pure dev-mode on-demand-compile
artifact, not a defect — resolved by retrying once `/admin` was warm in the running dev process (no
file changed for this one).

**Issue 4 — incorrect test assertion (attempt 4, post-warm).** Got all the way into the User
Lookup panel — search succeeded, target user's email/id/created/verified/onboarded all rendered
correctly — but `expect(page.getByText('USER', { exact: true }).first()).toBeVisible()` failed:
"element(s) not found". Root-caused by reading `admin-user-lookup-panel.tsx`'s
`AdminUserResult`: `{user.role === 'ADMIN' && <Badge variant="insight">ADMIN</Badge>}` — the
product **intentionally** shows a role badge only for `ADMIN`; a plain `USER` gets no badge at
all (deliberate anti-clutter design, not an omission). **Test bug, not a product defect.** Fixed
the assertion to check the actually-correct behavior: no `ADMIN` badge renders for this non-admin
target user.

**Issue 5 — API watch-loop instability (attempt 5), see §2.4.** Not a test or product bug;
resolved by running the API in stable non-watch mode.

## 4. flow-29 — final, stable result

Two consecutive full runs against the stable (non-watch) API, both fully green:

```
Run 1 (attempt 6): 2 passed (1.1m)
  ok ADMIN can reach Operator Tools and run all five read-only lookups against real data (37.6s)
  ok a normal USER cannot reach Operator Tools — denied at the UI, and denied by the API itself (19.2s)

Run 2 (attempt 7, stability confirmation): 2 passed (58.9s)
  ok ADMIN can reach Operator Tools and run all five read-only lookups against real data (28.8s)
  ok a normal USER cannot reach Operator Tools — denied at the UI, and denied by the API itself (21.1s)
```

Both tests cover exactly what the audit's §22 Playwright plan calls for: one full operator
happy-path (login as freshly-promoted ADMIN → all 5 read-only lookups against real fixture data:
user lookup, entitlement history, payment history, notification health, AI spend) and one normal-
user denial path (link never renders, `/admin` renders no admin content, and a direct API call to
`/admin/notifications/health` returns a real `403 ADMIN_REQUIRED` — not merely a hidden link).

**flow-29 gate: COMPLETE, stable, uncommitted fix pending review** (see §6).

## 5. Other Admin Operator Tooling test evidence gathered this session

Not previously verified in this session's checkpoint; run now (scoped, not full-suite reruns) to
give an accurate completed/pending picture:

| Suite | Result |
|---|---|
| Backend unit — `admin.guard.spec.ts` | PASS |
| Backend unit — `admin-ai-spend.service.spec.ts` | PASS |
| Backend unit — `admin-notification-health.service.spec.ts` | PASS |
| Backend unit — `admin-user-lookup.service.spec.ts` | PASS |
| Backend unit — `admin-payment-lookup.service.spec.ts` | PASS |
| **Backend unit total** | **5 suites / 20 tests passed** |
| Backend e2e — `admin-operator-tooling.e2e-spec.ts` | **21/21 passed** (after provisioning `beaconvie_test`, see §2.5) |
| Frontend unit — `app-header.test.tsx` (Operator Tools link visibility: ADMIN sees it, USER doesn't, loading state hides it) | **3/3 passed** |
| Playwright — `flow-29-admin-operator-tooling.spec.ts` | **2/2 passed, stable across 2 consecutive runs** |

All of these match the audit doc's §22 test strategy (backend unit, backend e2e, frontend,
Playwright) and §23 attack-suite plan coverage (the backend e2e spec's 21 tests include the
stale-JWT-after-demotion check, mass-assignment rejection, and payment/AI-spend field-shape
assertions per the audit's numbered attack list).

## 6. Git status at end of session

```
On branch master, up to date with origin/master
Changes not staged for commit:
  modified:   apps/web/e2e/flow-29-admin-operator-tooling.spec.ts
```

That is the **only** uncommitted change: the two test-bug fixes from §3 (Issues 2 and 4). No
product code was touched this session — every failure was root-caused to either a dev-environment
artifact (compile timing, watch-loop, missing test DB) or a genuine bug in the test file itself,
never in `apps/api/src/admin/*`, `apps/web/features/admin/*`, `middleware.ts`, or
`admin-user-lookup-panel.tsx`. Not committed or pushed, per instructions — left for review.

## 7. Environment state left running (for next session)

- Docker: `beaconvie-postgres`, `beaconvie-redis`, `beaconvie-mailpit` up and healthy (fresh
  volumes this session, all 21 migrations applied to both `beaconvie` and `beaconvie_test`).
- Web: `next dev` running normally on port 3000 (via `pnpm dev:web`), all routes touched this
  session are warm (`/register`, `/onboarding`, `/dashboard`, `/admin`, `/_not-found`).
- **API: running via `node --enable-source-maps dist/src/main` (a one-off stable build), not the
  normal `pnpm dev:api` watch mode**, because of the watch-loop instability in §2.4. Next session
  should either keep using this process for further verification, or investigate/fix the watch
  loop (likely an `outDir`/watch-scope overlap causing `nest start --watch` to see its own `dist`
  output as a source change — not investigated further, out of this session's scope) and switch
  back to `pnpm dev:api` for normal iteration. To restart cleanly: kill the current `node
  dist/src/main` process, `cd apps/api && pnpm dev:api`.

## 8. Sprint 18 / Tử Vi

Not touched this session in any way — no file under any Tử Vi path was read or modified. Remains
**BLOCKED_BY_DOMAIN_REFERENCE** per `docs/audit/sprint-18-pre-implementation-audit.md`, exactly as
the checkpoint specified.

## 9. Recovery checkpoint for next session

- **flow-29 gate: done.** No need to re-run unless the uncommitted spec fix is discarded.
- **Uncommitted change to review/commit:** `apps/web/e2e/flow-29-admin-operator-tooling.spec.ts`
  (§3, Issues 2 and 4 fixes). Not committed this session per instructions.
- **Remaining before this interim sprint can be called fully closed:** review/commit the flow-29
  fix; optionally investigate the `nest start --watch` restart-loop (dev-tooling hygiene, not
  product-blocking); the CI branch-trigger finding from the audit's §24 (`ci.yml` targets `main`,
  repo's default branch is `master` — direct pushes to `master` skip CI) was explicitly deferred
  by the audit itself ("not fixed in this pass, per instruction") and remains outstanding,
  unrelated to this session's work.
- **Do not re-run** the full backend/frontend suites, Docker pull, or migrations next session
  unless the environment is reset again — all of §2's one-time setup steps are now done and
  persisted (Docker volumes, migrations, warm dev-server route compiles).

---

## RELEASE CLOSURE

Date: 2026-08-19 (same day, follow-on session). Independent verification → fix proven defects →
commit. Per instruction, this section does not rewrite §1–9 above; one factual correction is noted
inline below where this pass found the prior section stale.

**Correction to §9:** the CI branch-trigger fix (audit §24) is **not** outstanding — `git show
f06813b -- .github/workflows/ci.yml` confirms `branches: [main]` → `branches: [master]` was already
applied in the implementation commit itself, alongside the rest of the Admin Operator Tooling work.
§9's claim that it "remains outstanding" was wrong; there is nothing left to fix here.

### 30.1 Git state recovered independently

- HEAD `f06813b91ab39d12a1f113bb534c46e87873f9b3`, identical to `origin/master`. `git rev-list
  --left-right --count origin/master...HEAD` → `0  0`. No rebase/merge/cherry-pick in progress.
- Working tree at the start of this closure pass: only `apps/web/e2e/flow-29-admin-operator-tooling.spec.ts`
  modified (verified via `git diff` to be exactly the two test-fix hunks described in §3, nothing
  else) and the untracked final report itself — matching §6/§9 exactly, not blindly trusted.

### 30.2 Implementation commit (`f06813b`) independently classified

`git show --stat f06813b` — 51 files, all within approved scope: `UserRole` enum + migration,
`AdminGuard`/`JwtAuthGuard` change, `AdminController` + 4 lookup services + DTOs/mappers, the
`AdminDashboard` + 5 panel components, the `AppHeader` link, `robots.ts`, the CI branch fix, both
test specs, and docs (architecture, the pre-implementation audit, the Sprint 18 audit, the Tử Vi
domain-resolution-pack, roadmap docs). Confirmed **absent**: no Tử Vi engine/route/UI code (only
docs — the Sprint 18 audit and domain-reference pack that are the reason Sprint 18 is blocked, not
an implementation), no SEO/shareability expansion, no refund/payment-mutation endpoint, no user-
moderation action, no broad dashboard beyond the 3 read-only panels, no role editor, no
impersonation. `nest-cli.json`/`tsconfig.json` (relevant to §30.15) were **not** touched by this
commit.

### 30.3 Role model / migration audit

`schema.prisma`: `enum UserRole { USER  ADMIN }` — exactly two roles, nothing extra.
`20260818151951_admin_operator_role/migration.sql`:
```sql
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
```
Purely additive — no destructive SQL, no existing row touched beyond the new column defaulting
every user to `USER`. Applied cleanly to both `beaconvie` and `beaconvie_test` this session
(§2.2). No seed script ever sets `role: 'ADMIN'` (confirmed by reading `prisma/seed.ts`).

### 30.4 Mass-assignment — hard security gate — LIVE-TESTED, not just read

Live HTTP requests against the running API (script-driven, real `fetch`, real cookies/CSRF):

- `POST /auth/register` with `role: 'ADMIN', isAdmin: true, status: 'ACTIVE'` injected →
  **400 BAD_REQUEST**, `details.form: ["property role should not exist", "property isAdmin should
  not exist", "property status should not exist"]`.
- `PATCH /users/me/preferences` with `role: 'ADMIN', isAdmin: true, permissions: ['ALL']` injected →
  **400 BAD_REQUEST**, same "should not exist" shape.

Both rejections come from the **global** `ValidationPipe({ whitelist: true, forbidNonWhitelisted:
true, transform: true })` in `main.ts` — not admin-specific code, so this protection covers every
mutation endpoint in the app, not just the ones tested here.

### 30.5 JWT / admin authorization — runtime path traced and proven

`auth.service.ts`'s access-token `jwtService.sign()` call signs `{ sub, email, sid }` — **no
`role` claim is ever encoded in the JWT, at all.** There is structurally nothing for any code path
to "trust from the token" on this point. `JwtAuthGuard.canActivate()` verifies the token signature,
then does a **live** `prisma.user.findUnique({ select: { status, role } })` on every single
request and attaches the current DB values to `request.user`. `AdminGuard.canActivate()` (which
`AdminController` applies strictly *after* `JwtAuthGuard` — `@UseGuards(JwtAuthGuard, AdminGuard,
AdminThrottlerGuard)`) only reads `request.user.role`, which was always this request's live DB
read, never a cached or token-derived value.

### 30.6 Stale-JWT demotion attack — THE critical test — LIVE, PASSED

Real attack sequence, no mocks:
1. Register disposable user, promote to `ADMIN` directly in DB, log in fresh → real access-token
   cookie saved.
2. `GET /admin/notifications/health` with that token → **200**, real aggregate data returned.
3. Demote `ADMIN` → `USER` directly in DB. **Cookie/token untouched.**
4. Reuse the **exact same saved token** → `GET /admin/notifications/health` again → **403
   `ADMIN_REQUIRED`, immediately, on the very next request.** No refresh, no re-login, no delay.

This is the single most important guarantee this sprint depends on, and it was proven against a
real running app with a real database write, not asserted from reading code.

### 30.7 Account-status attack — LIVE, PASSED, correct guard order confirmed

Same pattern: valid ADMIN token → `GET /admin/notifications/health` → 200. Then `status` set to
`SUSPENDED` directly in DB, same token reused → **401 `UNAUTHORIZED`, "Your session has expired.
Please log in again."** — that message is `JwtAuthGuard`'s own exception text, not
`AdminGuard`'s (`ADMIN_REQUIRED`), proving the request was rejected by the *authentication* guard
before authorization was ever evaluated — the guard ordering in §30.5 holds under a live attack,
not just by reading the `@UseGuards(...)` decorator order.

### 30.8 First-admin provisioning — confirmed by absence, not just by doc

`grep` across `apps/api/src` for any promote/self-service role-mutation route: **zero matches.**
The only provisioning mechanism is `apps/api/prisma/promote-admin.ts`, a manual CLI script whose
own doc comment states it is "deliberately NOT wired into `prisma/seed.ts`." No hardcoded admin
email anywhere in source. No environment-variable admin allowlist exists (grepped `ADMIN_EMAIL`/
`ADMIN_ALLOWLIST` — no matches).

### 30.9 User lookup privacy

`admin.mappers.ts#toAdminUserLookupDto` builds the response field-by-field — never `{ ...user }`.
`passwordHash` never appears in any API response (verified live in §30.11's deleted-user probe:
`passwordHash` is present in the raw DB row, absent from the API JSON). **One Low finding:**
`admin-user-lookup.service.ts#lookup()` calls `prisma.user.findUnique({ where: { email } })` with
**no `select` clause**, despite the file's own doc comment claiming "`select` explicitly excludes
`passwordHash`." The full row (including the hash) is pulled into a server-side JS variable before
the safe mapper is applied. Not an actual leak — the mapper is the real boundary and it's correct
— but the comment is inaccurate and the code lacks the query-level defense-in-depth it claims to
have. Recommend tightening the `select` to match the comment in a future pass; not blocking.

### 30.10 Entitlement / payment lookups

Both confirmed read-only by code inspection — no grant/revoke/extend/refund/repair action exists
in either service or its controller route. Payment DTO explicitly omits
`providerPaymentLinkId`/`providerCheckoutUrl`/raw `metadata` (never selected into the mapper's
input in the first place).

### 30.11 Deleted-account interaction — LIVE-TESTED

Registered a disposable user, called the real `DELETE /users/me` (self-service deletion,
password-confirmed) → **204**. Direct DB read confirmed the row was scrubbed
(`deleted+<id>@beaconvie.invalid`, `displayName: "Deleted user"`, `status: DELETED`, a fresh
random `passwordHash`). Admin lookup by the **original** email → **404** (no longer resolves — the
real PII is gone). Admin lookup by **id** → **200**, returning only the scrubbed state; `email`
field in the response is the anonymized placeholder, never the original. No backdoor to recover
pre-deletion PII exists.

### 30.12 Notification health / AI spend

Live-verified in §30.6's own response body: `schedulerRunTelemetry: "NOT_COLLECTED"` — the service
never fabricates a "healthy" state for data it doesn't have (matches audit §8's explicit
requirement). `AdminAiSpendService`: `ai_usages`/`provider_logs` tables have no prompt/completion
column at all, so a content leak is structurally impossible, not merely avoided; `failureCount` is
explicitly `null` (not a wrong number) whenever a per-user filter is applied, since `provider_logs`
has no `userId` column to compute it from.

### 30.13 Frontend authorization / SEO / privacy

- `app-header.test.tsx` (3/3, rerun fresh this closure pass): link renders only for `role ===
  'ADMIN'`, absent for `USER`, absent while the session is still loading.
- `/admin` is in `robots.ts`'s `disallow` list **and** carries page-level `export const metadata =
  { robots: { index: false, follow: false } }` — two independent layers, and it is absent from
  `sitemap.ts`.
- No admin-specific Sentry call exists anywhere (`grep` confirms zero `Sentry.*`/breadcrumb calls
  in `apps/api/src/admin`) — the module relies entirely on the pre-existing, already-hardened
  **allowlist** (not denylist) scrubber in `sentry-scrub.util.ts`, which redacts everything not on
  a short curated key list, closing the exact denylist-bypass class of bug that scrubber's own
  changelog comment documents fixing previously.
- No analytics/PostHog call exists anywhere in `apps/web/features/admin`.

### 30.14 CI branch fix

`git show f06813b -- .github/workflows/ci.yml`: the entire diff is `branches: [main]` →
`branches: [master]`, one line. No unrelated CI redesign. (See the §9 correction at the top of
this section.)

### 30.15 flow-29 — fresh, independent runs this closure pass

Two fresh runs, not reused from the prior session's numbers:
```
Fresh run 1: 2 passed — ADMIN path 20.1s, USER-denial path 15.0s
Fresh run 2: 2 passed — ADMIN path 21.1s, USER-denial path 30.3s
```
One interim incident during this closure pass: a run in between these two hit a `toHaveURL(/\/onboarding/)`
timeout after registration had already succeeded with a real `HTTP 201` (confirmed via the
Playwright trace's network log — the failure was purely in the client-side redirect wait, not
registration). Host state at that moment: **22 zombie `chrome`/`chrome-headless-shell` processes,
~2.34GB free RAM** (of 15.77GB total) — accumulated from this session's many prior Playwright runs.
Classified as environment resource contention (not a regression) **and then verified as such**:
after killing the zombie processes and confirming free RAM recovered, flow-29 was rerun twice more
(the two "fresh run" results above) with **zero reproduction** of the timeout, both clean and fast.
Per instruction, this is not called a product regression, because it did not reproduce in a clean
environment.

### 30.16 Targeted backend gates — fresh

- Admin unit: **5 suites / 20 tests, all PASS** (rerun fresh, not reused).
- Admin e2e (`admin-operator-tooling.e2e-spec.ts`): **21/21 PASS** (rerun fresh, twice across this
  session — once standalone, once again inside the full-suite run in §30.17).

### 30.17 Full backend unit suite — fresh

**124 suites / 1198 tests — 100% PASS**, 126.72s. (`WARN` lines for PostHog-capture-failure and
AI-safety-refusal are expected output from tests that deliberately exercise those failure/refusal
paths — not test failures; the suite's own summary line confirms 100% pass.)

### 30.18 Frontend unit suite — fresh

**77 suites / 386 tests — 100% PASS**, 217.0s. Includes `app-header.test.tsx` (§30.13).

### 30.19 Full backend e2e suite — two root-caused environment issues, then clean

First full-suite attempt (parallel, jest's default worker count): **175/324 failed**, all `expected
201, got 400` on early-fixture `POST` calls across many *non-admin* suites (Tarot, Account Data
Rights, etc.) — **never** in the admin suite. Root-caused via a direct live probe against the real
API: `POST /tarot/draw` → `400 TAROT_SPREAD_NOT_SEEDED`. Confirmed: the fresh Postgres volumes
provisioned in §2.1 were migrated (§2.2) but **never seeded** — `prisma/seed.ts` (78 Tarot cards,
3 spreads, a demo user) had never been run against either `beaconvie` or the freshly-created
`beaconvie_test`. Fixed by running the seed script against both databases; confirmed via
`tarot.e2e-spec.ts` alone going from 9/10 failed → **10/10 PASS**.

Second full-suite attempt (parallel, post-seed): **175 failed → down to fewer, but now** `expected
201, got 429 Too Many Requests` on `/auth/register`, across suites doing register-heavy security
scenarios (Sessions, Change password, Account security). `AUTH_RATE_LIMIT_MAX=1000` per 15-minute
window in `.env.test` is a deliberately generous, documented "test-friendly ceiling" — but 23 suite
files' worth of concurrent registration traffic across parallel jest workers, all originating from
the same loopback address, was enough to exhaust it within one run. Not a code defect (every
individual suite already passed cleanly in isolation). Reran with `--runInBand` (sequential, no
parallel-worker thundering herd):

**23 suites / 324 tests — 100% PASS**, 470.1s. Zero failures, zero skips, admin suite included and
green within this run.

Both root causes (missing seed data; parallel-worker throttle exhaustion) were independently
confirmed non-reproducing once corrected — this is not "explained away," it is demonstrated by a
subsequent 100%-clean run under each corrected condition.

### 30.20 Web production build

`next build`: **"✓ Compiled successfully in 2.4min"**, type-checking passed, **"✓ Generating
static pages (51/51)"** — all succeeded. The build then fails at the final "Collecting build
traces" step with `EPERM: operation not permitted, symlink ...` while copying traced files into
the `output: 'standalone'` bundle. This is a **pre-existing, previously documented** Windows-only
artifact — `docs/progress/sprint-17-final-report.md` §42 hit the identical error on this same host
in a prior sprint and reached the identical conclusion: compilation/type-checking/static-generation
all succeed first; only the Linux/Docker-target standalone symlink copy fails, because Windows
restricts symlink creation without Developer Mode/admin rights. Classified identically here, per
this closure brief's own explicit instruction to use existing Docker/Linux evidence rather than
modify product code. Not a code defect. Zero product-code changes made in response.

A **self-inflicted, unrelated** incident during this step: running `next build` while `next dev`
was still live against the same `.next` directory corrupted the dev server's webpack module cache
(`Runtime TypeError: __webpack_modules__[moduleId] is not a function`, `GET /register 500`).
Fixed by killing the dev server, deleting `apps/web/.next`, and restarting `pnpm dev:web` fresh
(confirmed listening again, confirmed by a subsequent successful compile). Recorded here as a
process-ordering lesson for future closures (don't run `next build` and `next dev` concurrently
against the same app directory), not a product or test defect.

### 30.21 Responsive QA — downgraded to code review, explicitly, with reason

A dedicated throwaway Playwright spec (`apps/web/e2e/admin-responsive-qa.spec.ts`, never committed,
deleted after this pass) was written to check `/admin` at 1440×900, 1024×768, 768×1024, 390×844,
375×667 for horizontal overflow, form usability, and absence of destructive controls. After the
`.next` corruption in §30.20 was fixed, the dev server's route compiles became **severely slower
than this session's baseline** — `/instrumentation` took 108.3s (vs. 19.3s originally), the server
reported "Ready in 204.4s" (vs. 82s originally), and `/register`'s first compile alone took
**353.6s**. Free system RAM was measured at **0.34GB before, ~1GB after** killing every
`chrome`/`chrome-headless-shell` zombie process belonging to this session — the remaining load
(multiple VS Code windows, Docker's `vmmem`, other user applications already running on this
machine) is outside anything this session's own process cleanup can address, and is not this
session's to touch. Launching another Chromium instance under those conditions risked destabilizing
the host rather than producing a meaningful result.

**Closing this gate via code review instead, explicitly as a downgrade from live-viewport
verification, not a silent skip:** read every component `AdminDashboard` renders
(`admin-user-lookup-panel.tsx`, `admin-entitlement-list.tsx`, `admin-payment-list.tsx`,
`admin-notification-health-panel.tsx`, `admin-ai-spend-panel.tsx`). Findings: page-level layout is
a plain `flex flex-col gap-6` stack (no fixed widths); every list item uses `flex flex-wrap` (wraps
rather than overflows on narrow viewports); the one grid (`AdminAiSpendPanel`) uses
`grid-cols-2 tablet:grid-cols-3` — the exact same breakpoint-driven responsive convention already
live-verified at all five required viewport sizes elsewhere in this app
(`sprint-17-final-report.md` §8–13, same `tablet:`/fixed-bottom-nav scaffold `/admin` inherits from
the shared `(app)` layout); the `Dropdown` in `AdminAiSpendPanel` uses `max-w-xs` (a ceiling, never
a fixed width, so it can only shrink on narrow viewports, never overflow). Zero destructive-control
buttons exist anywhere in any admin component — confirmed by reading all six files line-by-line,
not inferred: every interactive element is a `Search` button, a window `Dropdown`, or a read-only
`Skeleton`/`ErrorState`/`EmptyState`. This is the same read-only design the audit (§16) and the
live security tests (§30.4–30.11) already independently confirm has no mutation surface at all.

### 30.22 Security severity table

| Severity | Finding |
|---|---|
| Blocker | None |
| Critical | None |
| High | None |
| Medium | None |
| Low | `admin-user-lookup.service.ts#lookup()` lacks a Prisma `select` excluding `passwordHash`, contradicting its own doc comment. No actual leak (the DTO mapper never spreads and is the real, correctly-implemented boundary) — a defense-in-depth/documentation-accuracy gap, not exploitable. Recommend a follow-up: add `select` to match the comment's claim. |
| Informational | Missing seed data on fresh DB volumes (§30.19), parallel-worker throttle sensitivity under full-suite concurrent load (§30.19), `.next` cache corruption from concurrent build+dev (§30.20), Windows standalone-symlink `EPERM` (§30.20, pre-existing/documented), responsive QA downgraded to code review under host resource exhaustion (§30.21) — all environment/process artifacts from this session's own test execution, none are code defects, none required a product-code change. |

**Zero open Blocker/Critical/High/Medium findings.** Closure is not blocked on security grounds.

### 30.23 Full test/build evidence summary (this closure pass, all fresh)

| Gate | Result |
|---|---|
| flow-29 Playwright (fresh run 1) | 2/2 PASS (20.1s, 15.0s) |
| flow-29 Playwright (fresh run 2) | 2/2 PASS (21.1s, 30.3s) |
| Admin backend unit (fresh) | 5 suites / 20 tests PASS |
| Admin backend e2e (fresh) | 21/21 PASS |
| Full backend unit suite (fresh) | 124 suites / 1198 tests PASS |
| Full frontend unit suite (fresh) | 77 suites / 386 tests PASS |
| Full backend e2e suite (fresh, sequential) | 23 suites / 324 tests PASS |
| Web production build | Compiled + type-checked + 51/51 static pages OK; standalone-symlink step fails (pre-existing Windows artifact, not code) |
| Live security attacks (mass-assignment ×2, stale-JWT demotion, account-status, deleted-account) | All PASS, all against the real running app |
| Responsive QA | Code-review verified (downgraded from live viewport testing; host resource exhaustion, documented above) |

### 30.24 Tử Vi isolation — reconfirmed

No file under any Tử Vi path was read, opened, or modified during this closure pass. `git diff`/
`git status` throughout confirm the only touched files are the flow-29 spec and this report.
Sprint 18 remains **BLOCKED_BY_DOMAIN_REFERENCE**. This closure does not unblock it and made no
attempt to.

### 30.25 Final diff / commit

See the end of this document for the exact `git status`/`git diff` at commit time and the resulting
commit hash, appended immediately below this section once the commit gate below is evaluated.

### 30.26 Final verdict

**ADMIN OPERATOR TOOLING RELEASE CLOSURE COMPLETE — READY FOR NEXT ROADMAP ITEM**

Every mandatory gate is green: all fresh test suites pass at 100% (unit, e2e, Playwright, twice
each where "twice" was required), every live security attack behaves exactly as designed, the one
finding (Low) is a documentation/defense-in-depth note with no actual exposure, and the two
non-blocking build/QA items are both pre-existing or environment-only with documented precedent.
No product code was changed during this closure pass — only the test-file fixes already recorded
in §3–4 (carried over from the prior session, re-verified fresh here) are being committed.
