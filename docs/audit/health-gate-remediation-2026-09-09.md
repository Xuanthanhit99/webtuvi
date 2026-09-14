# Mệnh Vi health gate remediation — 2026-09-09

The original five P0/P1 source defects are remediated. The required production build still exits 1 because Windows denies symlink creation during standalone packaging, after successful compilation, lint/types and generation of all 53 pages. Under the requested strict build gate this prevents approval. The original project-health audit and its ignored evidence are preserved.

1. **CURRENT BRANCH:** `master`.
2. **STARTING HEAD:** `082cbfb0eac55ebe26e9042ab9ebe49c6a2b7f0d`.
3. **CURRENT HEAD:** `082cbfb0eac55ebe26e9042ab9ebe49c6a2b7f0d`. No commit, push, staging, reset, restore, clean or history operation.
4. **STARTING WORKTREE:** At remediation start, only untracked `docs/audit/project-health-2026-09-09.md`. At resume, the existing remediation changes listed below were already present; they were preserved and completed.
5. **WORK ALREADY PRESENT BEFORE RESUME:** Payment recovery and rollback tests; shared redirect validation wired into Login/Register/middleware/onboarding; reduced-motion subscription; Premium entitlement refresh and unavailable states; Natal assertion; Tarot workflow helpers and selectors; focused tests. Resume corrected Unicode damaged during earlier shell writes, moved SSR verification into a Node test environment, added middleware/onboarding propagation tests, and completed validation.
6. **FILES CHANGED:** Inventory below. Changes are limited to the authorized reliability, redirect, build, state presentation and test synchronization scope. Frozen modules, engines, assets, pricing, schemas and lint/build configuration are unchanged.
7. **P0 PAYMENT ROOT CAUSE:** The durable VERIFIED event was inserted before the payment transaction. A failed transaction left that event behind; every later insert collision was treated as completed. The blanket catch also acknowledged unrelated database failures.
8. **P0 PAYMENT FIX:** Reuse the existing event state model. Only a real Prisma `P2002` triggers lookup of the matching provider/event key; only `PROCESSED` suppresses application. A surviving VERIFIED event retries. The PENDING-only order transition, entitlement grant and PROCESSED marker still commit in one transaction. Concurrent attempts remain guarded by the conditional order update; no queue or schema change.
9. **PAYMENT RETRY TEST:** A real PayOS HMAC-signed synthetic payload fails after the order transition, models transaction rollback, and leaves VERIFIED/unprocessed. The identical second delivery retries and grants once. A second regression uses the real EntitlementService with transactional test storage and fails the processed-marker write after granting: rollback removes the grant, and retry persists one 30-day entitlement. These are unit regressions modeling database rollback, not real PostgreSQL integration certification.
10. **PAYMENT THIRD-DELIVERY IDEMPOTENCY:** The third identical delivery opens no new application transaction after success and grants nothing again. The actual entitlement regression asserts one persisted row and unchanged expiry, preventing double duration stacking.
11. **NON-DUPLICATE DB ERROR TEST:** Unexpected insertion errors propagate before application/grant. A Prisma unique error with no matching event also propagates. Focused payment/provider/entitlement/checkout tests: 6 suites, 75 tests passed.
12. **AUTH REDIRECT ROOT CAUSE:** The old slash-prefix check accepted slash/backslash authority syntax, which URL normalization can resolve to an external origin.
13. **SAFE REDIRECT FIX:** One shared helper checks raw and repeatedly decoded input, rejects authority/backslash/control/malformed values, verifies origin after normalization, and permits application paths only. Login, Register, middleware and onboarding use it. Valid query/hash intent survives the login/onboarding chain; unsafe intent falls back to `/`.
14. **REDIRECT ATTACK CASES TESTED:** HTTPS/HTTP absolute URLs, protocol-relative and backslash authority forms, JavaScript/data schemes, encoded/double-encoded slash/backslash forms, newline/tab/NUL, malformed percent escapes, dot-segment traversal, auth/non-app paths, empty and non-string inputs. Valid `/`, `/premium`, `/discover`, `/discover/tarot?item=123`, `/settings#security` remain valid. Form tests verify actual router calls; middleware and onboarding tests cover authenticated, unauthenticated, completion and skip propagation.
15. **BUILD ROOT CAUSE:** `react-hooks/set-state-in-effect` rejected the synchronous preference update in the reduced-motion effect.
16. **REDUCED-MOTION FIX:** `useSyncExternalStore` reads the media query, subscribes to changes and removes its listener on unmount. A deterministic false server snapshot keeps SSR/hydration safe. Browser subscription and browser-free SSR tests pass. No ESLint disable or config weakening.
17. **PRODUCTION BUILD RESULT:** `pnpm --filter @beaconvie/web build`, exit **1**. Next.js 15.5.22 compiled successfully, passed full build lint/type validation and generated **53/53** pages, then failed copying traced dependencies into `.next/standalone`: **EPERM, operation not permitted, symlink**. This is a newly exposed Windows packaging/environment blocker, distinct from the fixed reduced-motion lint defect. Warnings also report webpack cache serialization of 132/139 KiB strings. Full log: `test-results/health-gate/web-build.log`. No config weakening, dependency patching or symlink shim was used; standalone deployment output remains required.
18. **PREMIUM RETURN ROOT CAUSE:** A historical PAID order was treated as proof of current active access.
19. **PREMIUM RETURN FIX:** After backend PAID, mount a status query that always refetches the authoritative entitlement endpoint. Wait for a fresh response before confirming active access, including when an old active result is cached. Inactive and unavailable responses have distinct messaging/retry. The cancellation query banner no longer asserts an unverified payment outcome.
20. **PAID VS ACTIVE ENTITLEMENT RESULT:** Tests pass for PAID+active, PAID+NONE/EXPIRED/REVOKED, status-error/retry, stale cached active status, and PENDING polling. No frontend Premium grant or success-query authority was introduced.
21. **SETTINGS PREMIUM ROOT CAUSE:** Missing data from a failed status request fell through to the Free branch.
22. **SETTINGS FIX:** Separate loading, successful inactive (Free), successful active, and status-unavailable states. Error offers a real query retry and cannot display Free. All four state tests pass.
23. **NATAL TEST SYNCHRONIZATION:** Assert the current Vietnamese calculated-birth-data disclosure while retaining separate AI Interpretation / written-by-AI assertions. Production Natal code is unchanged.
24. **TAROT E2E SYNCHRONIZATION:** Flow-20/21 now select spread and intention/question, submit a real draw, select face-down cards and wait for reveal. Assertions compare displayed card identity to the backend DTO, verify no duplicate cards, preserve daily/quota rejection, history/delete and signed-payment journeys. Playwright loads both tests successfully (`--list`); no real-stack execution is claimed. All 78 canonical front hashes still match the frozen manifest.
25. **WEB TYPECHECK:** PASS, final `pnpm --filter @beaconvie/web typecheck`, exit 0, including all added tests and current Next-generated types.
26. **API TYPECHECK:** PASS, `pnpm --filter @beaconvie/api typecheck`, exit 0.
27. **CHANGED-FILE LINT:** PASS, web exit 0 and API exit 0. ESLint covered modified and new TypeScript/TSX files. The production build also passed its full lint/type stage; no rules or configuration were disabled.
28. **FULL WEB TESTS:** PASS on the final independent run: **110/110 suites, 611/611 tests**, exit 0, 122.279 seconds. Command: `pnpm --filter @beaconvie/web test --runInBand --json --outputFile=../../test-results/health-gate/web-full.json`. The initial run alongside API/build hit the unchanged 5-second timeout in the Tarot reset test (610 passed, 1 timed out); its evidence is preserved as `web-full-attempt1.log/json`. Re-running the entire suite after the other jobs finished passed without changing timeout, assertions, production Tarot code or test configuration. This is consistent with load-sensitive timing, not proof that the existing real-time test is immune to future contention. Focused runs also passed: 10 suites/80 tests plus middleware/onboarding 2 suites/10 tests. Existing JSX-transform warning noise remains.
29. **FULL API TESTS:** PASS, **152/152 suites, 1,649/1,649 tests**, exit 0. Includes all four new payment regressions. Command: `pnpm --filter @beaconvie/api test --runInBand --json --outputFile=../../test-results/health-gate/api-full.json`.
30. **GIT DIFF CHECK:** PASS, `git diff --check`, exit 0. Git reports only line-ending conversion notices, no whitespace errors or conflict markers.
31. **PAYMENT SECURITY RECHECK:** HMAC verification precedes event processing; amount/currency and known-order validation remain. Checkout still reads server-owned product/price/currency, and order retrieval still checks owner identity. PENDING-only transition and active-account entitlement gate remain. No change to PREMIUM_30D, 79,000 VND, 30 days, quota/gating, stacking or provider semantics. Token storage/logging was not modified; no new credentials or token logs.
32. **AUTH REDIRECT RECHECK:** Shared validation plus real form/middleware/onboarding call-site tests pass; no external post-auth destination is accepted in the regression matrix. Auth/session authorization remains backend-owned.
33. **DOCKER STATUS:** Rechecked `docker version --format '{{.Server.Version}}'`, exit 1: cannot open `//./pipe/dockerDesktopLinuxEngine` (file not found). No Docker/WSL repair performed.
34. **REAL STACK STATUS:** ENVIRONMENTAL — required Docker-backed services unavailable. A read-only `wsl --list --quiet` probe also did not return; only the two processes belonging to that probe were stopped. No WSL/Docker repair, migrations, seeded DB changes or provider transactions performed.
35. **REAL E2E STATUS:** ENVIRONMENTAL / NOT EXECUTED. The two updated Playwright flows are discoverable, which only checks loading/configuration. Real PostgreSQL concurrency/rollback, browser journeys and live PayOS behavior remain unverified.
36. **REMAINING P0:** None identified in the scoped source recheck. P0-01 is fixed and tested; real database integration remains unverified.
37. **REMAINING P1:** The original four P1 source defects are fixed. The **required production-build gate remains blocked** by Windows standalone symlink permissions. It cannot be marked green from the successful compile/lint/type stages alone.
38. **REMAINING P2:** Existing multiple active navigation items, nested main landmarks, Reports/other Settings request-error presentation, mixed-language/legacy copy and Home article links leading to tools remain out of scope. Natal assertion and Tarot selector debt addressed; real E2E verification remains environmental.
39. **PRODUCTION-ONLY BLOCKERS:** Restore services independently; verify database-backed auth/payment/calculator flows, concurrent delivery and rollback against PostgreSQL; run the updated real smoke journeys and responsive/browser checks; verify live PayOS credentials/webhook behavior, mail/APP_PUBLIC_URL and chosen AI provider. Unit tests do not certify production infrastructure. Separately, successful standalone packaging is still required for this strict health gate itself.
40. **RECOMMENDED NEXT PHASE:** First rerun the unchanged production build in a Linux/CI environment or Windows environment permitted to create symlinks, and confirm exit 0. Then choose the intended Auth/Onboarding/Settings production pass or Reports pass. Neither was started here. Complete environmental integration certification before production approval.
41. **FINAL VERDICT:** **NOT_SAFE_TO_CONTINUE**, because the actual required production build remains red. This does not reopen the repaired payment/redirect/state defects; it follows the user's explicit rule that build success is mandatory even when an environmental issue is responsible.

Changed-file inventory (relative to repository root):

```text
apps/api/src/payment/webhook/payment-webhook.service.ts
apps/api/src/payment/webhook/payment-webhook.service.spec.ts
apps/web/app/(app)/premium/page.tsx
apps/web/app/(onboarding)/onboarding/page.tsx
apps/web/components/motion/use-prefers-reduced-motion.ts
apps/web/components/motion/use-prefers-reduced-motion.test.tsx
apps/web/components/motion/use-prefers-reduced-motion.server.test.tsx
apps/web/e2e/flow-20-tarot-discovery.spec.ts
apps/web/e2e/flow-21-premium-payment.spec.ts
apps/web/e2e/helpers/tarot-flow.ts
apps/web/features/auth/components/login-form.tsx
apps/web/features/auth/components/login-form.test.tsx
apps/web/features/auth/components/register-form.tsx
apps/web/features/auth/components/register-form.test.tsx
apps/web/features/natal-chart/components/natal-chart-dashboard.test.tsx
apps/web/features/onboarding/components/onboarding-chat.tsx
apps/web/features/onboarding/components/onboarding-chat.test.tsx
apps/web/features/premium/components/premium-return-status.tsx
apps/web/features/premium/components/premium-return-status.test.tsx
apps/web/features/premium/components/premium-status-card.tsx
apps/web/features/premium/components/premium-status-card.test.tsx
apps/web/lib/safe-next-path.ts
apps/web/lib/safe-next-path.test.ts
apps/web/middleware.ts
apps/web/middleware.test.ts
docs/audit/health-gate-remediation-2026-09-09.md
```

`docs/audit/project-health-2026-09-09.md` remains untracked and unchanged from the earlier audit. The earlier ignored `apps/web/test-results/project-health/` evidence is preserved. New validation logs/JSON are in ignored `test-results/health-gate/`.
