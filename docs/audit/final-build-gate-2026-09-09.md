# Final build gate verification — 2026-09-09

This verification applies the user's revised verdict rules: a confirmed Windows symlink-permission failure is environmental, and does not reopen the repaired application defects. It supersedes the earlier report's stricter build-exit-based verdict without changing or deleting that historical evidence. No production/test/configuration code changed in this verification; previous test results are reused explicitly.

1. **CURRENT BRANCH:** `master`.
2. **CURRENT HEAD:** `082cbfb0eac55ebe26e9042ab9ebe49c6a2b7f0d`.
3. **WORKTREE STATUS:** Existing 17 modified tracked files and eight new source/test files remain unstaged; both previous audit reports and ignored evidence are preserved. This verification adds only this report and an ignored filesystem probe result. No commit, push, reset, clean, restore or revert.
4. **REMEDIATION CHANGES PRESERVED:** Re-inspected payment retry/error handling, safe redirect helper and call sites, reduced-motion subscription, Premium fresh-entitlement confirmation, Settings unavailable state, Natal disclosure assertion and Tarot E2E helpers/flows. No removal or new regression identified in this scoped review.
5. **WINDOWS BUILD FAILURE EXACT ROOT CAUSE:** The preceding actual `pnpm --filter @beaconvie/web build` exits 1 at Next.js standalone dependency copying. `fs.promises.symlink` throws `EPERM` / errno `-4048`. A fresh independent Node filesystem probe in a writable ignored directory successfully creates a directory and ordinary file, but the same symlink operation fails with EPERM. This reproduces the restriction outside Next.js/application code. The specific Windows policy imposing the restriction was not changed or attributed to an unverified setting.
6. **EXACT SYMLINK OPERATION:** See the exact source/destination below, transcribed from the final fatal error in `test-results/health-gate/web-build.log`. Next.js `copyTracedFiles` reads a traced dependency link then calls `fs.promises.symlink(symlink, fileOutputPath)`; the failure is creating that link in `.next/standalone`.
7. **COMPILE STATUS:** PASS in the preceding actual build, Next.js 15.5.22, compiled in 2.2 minutes.
8. **LINT/TYPE BUILD-GATE STATUS:** PASS in that build; it proceeded past lint/type validation into page-data collection and generation. No rules or gates disabled.
9. **PAGE GENERATION STATUS:** PASS, 53/53 generated.
10. **STANDALONE PACKAGING STATUS:** Failed on this Windows host, EPERM creating dependency symlinks during finalization/build tracing. No complete standalone artifact is certified.
11. **NEXT.JS CONFIG STATUS:** Unchanged `apps/web/next.config.mjs`, still `output: 'standalone'` with the existing Sentry wrapper. Dockerfile, workflow, package scripts and lockfile also unchanged. No copied substitute output, error suppression or filesystem shim.
12. **LINUX/CI BUILD PATH FOUND:** `.github/workflows/ci.yml` uses `ubuntu-latest` and `pnpm build:web`, which aliases the same filtered build. `apps/web/Dockerfile` uses Linux `node:22-slim`, runs that same build and copies standalone output into its runtime stage. Prefer this existing Docker path for reproduction: the workflow still selects Node 20, whereas the Dockerfile and deployment runbook document Node 22 after an earlier pnpm 11/Node 20 incompatibility. This historical CI toolchain discrepancy is disclosed, not a newly executed CI failure; no workflow change made.
13. **LINUX/CI BUILD EXECUTION STATUS:** Not executed. Docker still cannot open `//./pipe/dockerDesktopLinuxEngine`; bounded `wsl --list --quiet` did not return within 12 seconds and only its own probe process tree was stopped. `gh` CLI is absent. The existing workflow is triggered by push/PR, has no workflow_dispatch entry, and a remote rerun of HEAD would omit these uncommitted fixes. No commit/push was authorized or performed to send the worktree to CI. No accessible Linux execution path for this exact worktree was established.
14. **LINUX/CI BUILD RESULT:** UNVERIFIED, not PASS. Exact existing-Dockerfile reproduction is below. The environmental diagnosis is not a prediction that every Linux build step must succeed.
15. **WEB TEST RESULT:** Reused from immediately preceding remediation: 110 suites, 611/611 PASS. That final independent run passed without changing the timeout/assertions after an earlier concurrent run hit one Tarot timeout.
16. **API TEST RESULT:** Reused: 152 suites, 1,649/1,649 PASS.
17. **WEB TYPECHECK:** Reused: PASS, final remediation command exit 0.
18. **API TYPECHECK:** Reused: PASS, exit 0.
19. **CHANGED-FILE ESLINT:** Reused: web/API both PASS, exit 0. No code changes requiring another run.
20. **GIT DIFF CHECK:** Freshly rerun, PASS. Only Git line-ending conversion notices, no whitespace errors.
21. **REMAINING P0:** None identified in the scoped application review. Payment recovery regressions remain present.
22. **REMAINING P1:** None identified in the scoped application review. Windows packaging failure is classified as environmental, not the former reduced-motion source defect. Linux build success remains unverified.
23. **ENVIRONMENT-ONLY BLOCKERS:** Windows symlink permission, unavailable Docker/Linux execution, and unavailable real-service/provider certification. CI's documented Node toolchain discrepancy should be considered when choosing the existing reproduction path.
24. **REAL-STACK E2E STATUS:** Not executed; previous Playwright listing of two updated flows is not E2E success. Real database, browser and PayOS verification remain outstanding.
25. **RECOMMENDED NEXT PHASE:** Application health permits the intended next phase under the revised rules, with these environment limitations recorded. Choose Auth/Onboarding/Settings or Reports separately; neither was started. Run the existing Linux build and real-stack checks before production approval.
26. **FINAL VERDICT:** **SAFE_TO_CONTINUE_WITH_ENVIRONMENT_BLOCKERS**.

Exact fatal build operation:

```text
operation: fs.promises.symlink(source, destination)
error: EPERM (errno -4048), syscall: symlink
source:
D:\web-tu-vi\node_modules\.pnpm\@babel+helper-string-parser@7.29.7\node_modules\@babel\helper-string-parser
destination:
D:\web-tu-vi\apps\web\.next\standalone\node_modules\.pnpm\@babel+types@7.29.7\node_modules\@babel\helper-string-parser
```

Independent probe evidence: `test-results/health-gate/symlink-probe-1788936873800/result.json`. Ordinary file write succeeds; `fs.symlinkSync` fails with EPERM between fresh paths in that same writable directory. It does not touch `.next`, dependencies or application files.

Reproduce on an available Linux Docker engine from the **current repository root**, using the complete current worktree including all untracked remediation source/test files. A plain checkout of the HEAD above is insufficient. On a separate Linux machine, transfer that worktree without Windows dependencies/caches or secret environment files, then run the existing Dockerfile. No new deployment architecture or source changes are needed:

```sh
docker build --progress=plain \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_SENTRY_DSN= \
  --build-arg NEXT_PUBLIC_ANALYTICS_ENABLED=false \
  -t menhvi-web:health-gate .
```

These are local verification URLs/settings, not production deployment values. For a production-targeted build, provide the intended public URLs/telemetry values through the existing build arguments described in the runbook. The Dockerfile executes `pnpm --filter @beaconvie/web build` without changing Next.js configuration. Require successful compile, lint/types, page generation, standalone packaging and Docker build exit 0. To check the packaged server after a successful build, without running the application:

```sh
docker run --rm --entrypoint sh menhvi-web:health-gate \
  -c 'test -f /app/apps/web/server.js && test -d /app/apps/web/.next/server'
```

Neither command was executed here. The original remediation log/results remain unchanged, including its previous verdict under the earlier rules.
