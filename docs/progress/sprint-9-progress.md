# Sprint 9 — Natal Chart Discovery Foundation — Progress Log

## Baseline (Phase 0 recovery)

- Branch: `master`, up to date with `origin/master`.
- HEAD: `cc48504` — "[update][commit] update lại luồng".
- Working tree at session start had pre-existing **uncommitted, unrelated** changes from a prior
  session (not part of this sprint, left untouched):
  - `apps/api/.env.example` (whitespace/line-ending only in diff view)
  - `apps/api/src/companion/providers/gemini.provider.ts` — `DEFAULT_MODEL` bumped from the
    shut-down `gemini-1.5-flash` to `gemini-3.5-flash-lite`.
  - `apps/api/src/companion/providers/pricing.ts` — matching pricing table update.
  - `docs/progress/sprint-8-5-product-experience-remediation.md` (modified) and
    `docs/progress/sprint-8-5-product-experience-final-report.md` (new, untracked).
- No `astrology`/`natal` code exists anywhere in `apps/api/src` or `apps/web` — Sprint 9 is
  greenfield.
- `docs/audit/full-product-feature-gap-audit.md` confirms Natal Chart is currently honestly
  "Coming soon" with no gap found.
- Sprint 8.5 final verdict: **REAL GEMINI VERIFIED — READY FOR SPRINT 9** (`DEFAULT_AI_PROVIDER=
  gemini`, verified via `provider_logs`/`ai_usages`, not response wording).

## Plan

Full approved plan: see `docs/architecture/natal-chart-discovery.md` (written this session) for
the calculation-engine decision, house-system/zodiac-mode product decisions, the requirement
matrix, schema, AI boundary, and golden-vector verification approach.

## Log

- [x] Phase 0 recovery (this session) — confirmed clean tree at `30cdd32`; prior session had
  already added `circular-natal-horoscope-js@1.1.0` to `apps/api/package.json`/`pnpm-lock.yaml`
  (commit `30cdd32`) but never installed/wired it — greenfield otherwise.
- [x] Phase 1 — Product Bible Module 13 read in full; requirement matrix written into
  `docs/architecture/natal-chart-discovery.md`.
- [x] Phase 2 — Engine spike: installed `circular-natal-horoscope-js` (via
  `C:\Users\Admin\AppData\Roaming\npm\pnpm.cmd install --frozen-lockfile` — the corepack pnpm
  shim on this machine, `C:\nvm4w\nodejs\pnpm.ps1`, is broken:
  `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`; use the npm-installed binary instead for this repo
  going forward). Verified license (Unlicense), API shape, and accuracy via an ad hoc golden-vector
  script (not committed): Sun ecliptic longitude at the four 2020 equinox/solstice instants
  (independently published UTC times) matched to within 0.04°. Verified historical timezone/DST
  resolution for Hanoi (1995), Ho Chi Minh City (1988), and DST-era New York (2020) — all correct.
  Decision, rejected alternatives, house system (Placidus), zodiac (Tropical), and orb rules
  documented in `docs/architecture/natal-chart-discovery.md`.
- [x] Explore-agent blueprint of Numerology/Tarot conventions (schema, controller, record
  service, interpretation service, Companion bridge, entitlement gating, module wiring, frontend
  structure, test conventions, CSRF, Playwright numbering — next flow spec is
  `flow-23-natal-chart-discovery.spec.ts`) captured to mirror exactly for Natal Chart.
- [ ] Prisma schema + migration (in progress)
- [ ] Engine wrapper (`NatalChartCalculator`) + committed golden-vector test suite
- [ ] Location/timezone service + curated location dataset
- [ ] Backend module (record/interpretation/controller/Companion bridge/Discovery entry points)
- [ ] Backend tests (unit + e2e)
- [ ] Frontend feature + chart wheel
- [ ] Frontend tests + Playwright flow-23
- [ ] Real-Gemini smoke test (requires explicit checkpoint — costs real API money)
- [ ] Multi-viewport screenshot review
- [ ] Full regression + final report

(Entries below are appended as each step completes, with concrete results/blockers.)
