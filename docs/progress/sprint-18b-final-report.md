# Sprint 18B — Tử Vi Lá Số V1 — Final Report (New-Machine Recovery + Closure)

**Date:** 2026-08-21

---

## What was already present after clone/pull

`HEAD` was already `96057e2`, identical to `origin/master`, 0 ahead / 0 behind, working tree clean. That single commit contained the **complete** Sprint 18B.1–18B.11 implementation: the full deterministic engine (calendar, Can Chi, 12 palaces, Mệnh/Thân, Cục, 14 Chính Tinh, CORE_13, Tuần/Triệt, Tứ Hóa, chart composer), the persistence/API layer, AI interpretation, and the production frontend — plus individual final reports for every phase 18B.1 through 18B.11, and one artifact that had been written but never run: `apps/web/e2e/flow-30-tu-vi-discovery.spec.ts`. No `sprint-18b12-*` report existed anywhere, correctly identifying 18B.12 (Full Runtime QA + Release Closure) as the first incomplete phase — nothing from 18B.1–18B.11 was redone.

## What was continued on this machine

Sprint 18B.12 in full, across two passes: environment recovery, a fresh phase-completion matrix, root-causing and fixing four real issues surfaced only by actually running the full stack (not by reading the prior reports' claims), and the complete runtime-QA checklist including all four Playwright tests. See `sprint-18b12-runtime-qa-final-report.md` for full detail.

## Environment differences (this machine vs. what the prior reports assumed)

- Node v22.13.0, pnpm 11.18.0 (matches `packageManager` pin), git 2.41.0 — all consistent with the repo's pinned toolchain; `pnpm install --frozen-lockfile` reported "Already up to date," zero lockfile drift.
- Docker Desktop was not running at session start (had to be launched); once up, Postgres/Redis/Mailpit containers were already present and healthy (persisted from a prior session on this same machine).
- **Prisma Client was stale** relative to the schema (missing the `TuViChart`/`TuViChartHistory` models) — `prisma generate` fixed it.
- **Two Tử Vi migrations were unapplied** on both the dev and e2e-test databases — reviewed (additive-only, zero drops) and applied via `prisma migrate deploy`.
- **The e2e test database had no seed data** (Tarot deck/spreads) — seeded via the repository's own `prisma/seed.ts`.
- **A long-lived `nest --watch` API process held a stale Prisma query-engine binary reference** (Windows file-locking left orphaned `.tmp` files from a mid-session `prisma generate`) — fixed by cleaning up the temp files, regenerating cleanly, and switching to a compiled non-watch process.
- **`localhost` resolves to IPv6 first on this machine, and Docker Desktop's WSL2 backend accepts the IPv6 connection but never proxies data through it** — caused an unbounded hang on every DB/Redis-touching request (register, login, throttled routes). Fixed by changing `DATABASE_URL`/`REDIS_URL`/`MAILPIT_HOST` in the local `.env`/`.env.test` from `localhost` to `127.0.0.1`. Local-only config, not production, not committed to Git.
- **Total RAM is 7.82GB**, observed as low as 0.3GB free at points under simultaneous Docker + dev servers + test runners + browser load — contributed to, but was not the root cause of, the two Playwright failures ultimately traced to the issues above.

## Files changed on this machine

17 tracked files, all under `apps/api/` — a throttler-isolation defect fix (10 controllers + 3 export controllers + the shared rate-limit constants module + the regression test that should have caught it) and one stale test assertion. Zero files under `apps/web/` or the Tử Vi engine/domain layer were touched — the entire deterministic engine, persistence, AI interpretation, and frontend from 18B.1–18B.11 are exactly as the prior machine left them. Additionally, three local-only, gitignored `.env`/`.env.test` values were corrected (not tracked by Git, not product code). Full list and rationale in `sprint-18b12-runtime-qa-final-report.md`.

## Tests freshly run this session (not trusted from prior reports)

| Suite | Result |
|---|---|
| `src/tu-vi` (engine unit) | 338/338 pass (20 suites) |
| Eastern Horoscope regression | 82/82 pass (5 suites) |
| Full backend unit | **1546/1546 pass** (145 suites) |
| Full backend e2e (24 files) | **342/342 pass**, confirmed on multiple full runs after the throttler fix |
| Frontend unit | **479/479 pass** (96 suites) |
| Lint (api + web) | clean (0 errors) |
| Typecheck (api + web) | clean |
| API build | clean |
| Web build | clean, 52/52 static pages incl. `/discover/tu-vi` |
| Playwright — VECTOR-B1 main flow | ✅ pass, twice (10.8s, 7.4s) |
| Playwright — midnight-boundary case | ✅ pass, twice (8.2s, 5.5s) |
| Playwright — accessibility (axe) | ✅ pass, twice (0 violations) |
| Playwright — responsive (10 breakpoints) | ✅ pass, twice |
| Playwright — complete `flow-30` spec | **4/4 pass, confirmed twice** (34.8s, 29.9s) |

## Phases completed on Git vs. continued here

- **Already complete on Git (verified, not redone):** 18B.1 Calendar Foundation, 18B.2 Can Chi/Palaces/Mệnh-Thân, 18B.3 Cục, 18B.4 Main Stars, 18B.5 CORE_13, 18B.6 Tuần/Triệt, 18B.7 Tứ Hóa, 18B.8 Deterministic Chart, 18B.9 Persistence/API, 18B.10 AI Interpretation, 18B.11 Frontend.
- **Continued/closed on this machine:** 18B.12 Full Runtime QA + Release Closure — now fully closed.

## Bugs found and fixed (all root-caused, none worked around)

1. **Stale test assertion** (`TEST_DEFECT`) — `account-data-rights.e2e-spec.ts` expected `exportVersion === 4`; 18B.9 legitimately bumped it to 5. Fixed.
2. **Throttler-isolation defect** (`PRODUCT_DEFECT`, pre-existing, not Tử Vi-introduced) — the `admin` rate-limit bucket was added after the project's own isolation skip-lists (and their dedicated regression test) were last updated, causing unauthenticated auth traffic to incidentally exhaust its tight 120/60s ceiling during any full e2e run. Fixed across 13 controllers plus the regression test itself; verified via repeated full e2e runs (342/342 pass).
3. **Stale Prisma query-engine binary** (`ENVIRONMENTAL`) — a long-lived watch-mode API process outlived a mid-session `prisma generate`, leaving Windows-locked orphaned temp files. Fixed by cleaning up and switching to a compiled, non-watch process.
4. **`localhost`→IPv6 resolution gap in Docker Desktop WSL2** (`LOCAL_CONFIGURATION`) — caused an unbounded hang (not a timeout) on every DB/Redis-touching request, root-caused via direct connectivity bisection (raw TCP/RESP worked; `ioredis` against `localhost` never reached `ready`; the identical client against `127.0.0.1` worked in 14ms). Fixed via local-only `.env`/`.env.test` values.

## Git state

- Branch: `master`. `HEAD` unchanged at `96057e2` throughout (matches `origin/master`, still 0 ahead/0 behind for the base commit — the 17-file fix is uncommitted working-tree changes).
- `git status --short`: 17 tracked files modified, all reviewed, all intentional. (One unrelated untracked directory, `apps/web/public/assets/menh-vi/home/`, containing recently-added images unrelated to this work, was observed and left untouched — not part of this session's changes.)
- `git diff --check`: clean (only line-ending advisory warnings, no conflict markers).

## Commit / push / deployment status

**Not committed. Not pushed. Not deployed.** Per policy, this is left as reviewable working-tree state — the user can request a commit once satisfied.

## Final Sprint 18B verdict

**SPRINT 18B RELEASE CLOSURE COMPLETE.** Every gate is verified passing with real, freshly-run evidence: the deterministic engine, persistence/API/security (including a newly-found-and-fixed IDOR-adjacent rate-limit isolation defect), the AI interpretation boundary, the frontend, the full backend unit suite (1546/1546) and e2e suite (342/342, confirmed reproducible), lint, typecheck, both production builds, and — completing the phase — all four Playwright tests (VECTOR-B1's exact deterministic-fact assertions, the `TUVI-GIO-02` midnight-boundary convention, axe accessibility with zero violations, and all 10 responsive breakpoints), confirmed on two independent full runs. No unresolved Blocker/Critical/High issue and no Tử Vi domain/spec conflict remain.

## Exact next action

1. Review the 17-file throttler-isolation fix and the local-only `.env`/`.env.test` corrections (`sprint-18b12-runtime-qa-final-report.md` has full rationale for each) and, if satisfied, request a commit — not done automatically per policy.
2. Proceed to whatever the founder's next-scheduled work is (this report does not start Sprint 19 or any other roadmap item, per instruction).
