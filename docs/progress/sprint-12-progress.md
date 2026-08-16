# Sprint 12 — Trust & Monetization Closeout — Progress

Tracking doc for the implementation session following `docs/audit/sprint-12-pre-implementation-audit.md`.
See `docs/progress/sprint-12-final-report.md` for the closing report.

## Baseline

HEAD `9d66d3c` (Sprint 11, unpushed), `origin/master` at `ffd82dc`, 0 behind / 1 ahead — matched
the audit's reported state exactly. Working tree clean except the audit doc itself. Real Postgres/
Redis/Mailpit infra came up mid-session (Docker Desktop was still starting when first checked) —
this session had real-infra verification available where prior sprints in this environment did
not.

## Phases completed

1. **Natal Chart accessibility fix** — raw aspect list section renamed `"Key Aspects"` →
   `"Major Aspects"` (`natal-chart-view.tsx`), distinct from the AI-narrated section's own
   `"Key Aspects"` label. flow-23 Playwright locator updated and re-verified passing against a
   real browser.
2. **Notification scheduler failure visibility** — per-candidate and outer-run try/catch added to
   `NotificationsSchedulerService`, structured `Logger.error` (never email/content), 10 new
   regression tests.
3. **AIUsage/ProviderLog schema** — additive `AIFeature` enum + `feature`/`sourceId` columns,
   migration verified against real pre-existing data (113 + 70 rows, zero loss).
4. **Shared Discovery AI control services** — `DiscoveryThrottlerGuard`, generalized
   `GenerationLockService`/`CostControlService`/`ObservabilityService`, all exported from
   `CompanionModule` and reused (not copied) by Tarot/Numerology/Natal Chart.
5. **AI parity applied** to all three Discovery surfaces — rate limit, concurrency lock, cost
   check, usage/provider-log recording, all with regression tests.
6. **AI pricing sanity check** — Anthropic's `claude-3-5-sonnet-20241022`/`claude-3-haiku-20240307`
   found fully retired (confirmed live against official docs), replaced with `claude-sonnet-5`/
   `claude-haiku-4-5-20251001` and current pricing. Gemini/OpenAI entries re-confirmed current,
   unchanged.
7. **Sentry** — backend (`@sentry/nestjs`) + frontend (`@sentry/nextjs`), error-tracking tier only,
   mandatory `beforeSend` scrubbing (allowlist request data, denylist free-form extras), 14 new
   scrubbing tests.
8. **`global-error.tsx`** — the one missing root-level boundary, reports to Sentry, no stack trace
   shown, 3 focused tests.
9. **Payment kill-switch UX** — `PremiumStatusDto.paymentsEnabled` added, frontend hides the
   upgrade CTA honestly when the kill switch is closed.
10. **Deployment readiness docs** — `TRUST_PROXY`, PayOS webhook registration procedure, PayOS env
    checklist, email production checklist, consolidated in
    `docs/architecture/production-deployment-readiness.md`.

## Regression evidence (real counts, this session)

- Backend unit: 104 suites / 999 tests — PASS
- Frontend unit: 72 suites / 356 tests — PASS
- Backend e2e (real Postgres + Redis): 18 suites / 239 tests — PASS
- API production build: PASS
- Web production build: PASS (48 routes)
- Playwright flow-23 (Natal Chart, the specific regression this sprint closes): PASS
- Playwright flow-21 (Payment), flow-22 (Numerology), flow-25 (Notifications ×2): PASS
- Playwright flow-20 (Tarot): 1 failure — root-caused to a pre-existing loose locator
  (`getByText('Today')`, no `exact: true`) colliding with real-Gemini-generated prose containing
  the word "today", surfaced only because this ad-hoc verification ran against the dev environment's
  real Gemini provider rather than the Mock provider the e2e suite is designed against. Not a
  Sprint 12 regression — this test file, the Tarot draw/render code, and the AI prompt wording were
  none of them touched this sprint. See final report for full detail.
- `prisma validate`/`migrate status` (dev + test DB): PASS
- Secret scan (diff-scoped): PASS, no matches
- `git diff --check`: PASS

See `docs/progress/sprint-12-final-report.md` for the full 83-item closing report.
