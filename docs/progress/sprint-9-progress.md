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

Full approved plan: see `docs/architecture/natal-chart-discovery.md` (written alongside this log)
for the calculation-engine decision, house-system/zodiac-mode product decisions, the one
Product-Bible-vs-mega-prompt conflict and its resolution, schema, AI boundary, and golden-vector
verification approach.

## Log

- [ ] Engine + location dataset + golden vectors
- [ ] Prisma schema + migration
- [ ] Backend module (record/interpretation/controller/Companion bridge/Discovery entry points)
- [ ] Backend tests (unit + e2e)
- [ ] Frontend feature + chart wheel
- [ ] Frontend tests + Playwright flow-23
- [ ] Real-Gemini smoke test
- [ ] Multi-viewport screenshot review
- [ ] Full regression + final report

(Entries below are appended as each step completes, with concrete results/blockers.)
