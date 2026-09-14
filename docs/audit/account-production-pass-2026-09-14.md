# Mệnh Vi — Auth, Onboarding and Settings production pass

This resumes the existing worktree, preserving the health-gate remediation and the interrupted account implementation. No commit, push, reset, clean, restore, dependency/configuration weakening, schema change, or payment/pricing/artwork modification was performed.

## Recovery and scope

1. **CURRENT BRANCH:** `master`.
2. **CURRENT HEAD:** `082cbfb0eac55ebe26e9042ab9ebe49c6a2b7f0d`.
3. **STARTING WORKTREE:** 54 modified tracked files and 17 untracked files; nothing staged. Exact inventory is appended below. The full starting diff and status are preserved in `apps/web/test-results/account-final/resume-2026-09-14/starting.diff` and `starting-status.txt`.
4. **WORK ALREADY PRESENT BEFORE RESUME:** Vietnamese auth forms and account error mapping; real password policy; non-blocking verification/resend; recovery forms; cookie refresh and session-expiry handling; private query-cache cleanup; safe auth/onboarding return intent; localized persisted onboarding; sectioned Settings with real security, consent, notifications, export/deletion and authoritative Premium status. Health-gate payment, redirect, reduced-motion, Premium and test-synchronization fixes already existed.
5. **EXACT PREVIOUS STOPPING POINT:** The recoverable evidence ends during validation, not initial implementation. Saved web full run: 624/624 pass; focused runs: 80/80 and 22/22. Saved API focused run: 39/40, with account deletion exceeding the unchanged 5-second test timeout. Last saved web typecheck failed because Dropdown lacked `disabled`, but the starting source already contained that fix. Visual QA timed out navigating to `/login`; the saved result was `[]` and no screenshots existed. There was no saved completed account-phase full API run, production build, final lint, or visual review. The exact last executed command cannot be reconstructed beyond these artifacts; file contents and recorded results are distinguished rather than guessed.
6. **FILES ALREADY MODIFIED BEFORE RESUME:** See the full starting inventory below. All were preserved.
7. **NEW FILES MODIFIED AFTER RESUME:** See the resume delta below. Fixes cover journal-backup cleanup, resend-form lint, truthful onboarding copy, account accessibility/contrast/localization, plus this report and ignored QA evidence.

## Account lifecycle

8. **LOGIN STATUS:** Complete for the real email/password API: validation, pending state, safe error mapping, recovery/register links and internal destination continuity. Backend permits unverified accounts; no invented verification-required login error.
9. **REGISTER STATUS:** Complete for required display name, email, password/confirmation and terms acceptance. Backend returns a session immediately; UI proceeds to onboarding with an email-verification reminder. Registration does not duplicate onboarding.
10. **EMAIL VERIFICATION STATUS:** Supported missing-token, verifying, verified, invalid/reused, expired, rate-limited and network-error/retry states. Backend does not distinguish “already verified” from used/invalid token, so UI does not invent that result. Tokens remain within required route/API handling; auth routes set no-referrer.
11. **RESEND STATUS:** Real enumeration-safe API, generic confirmation, pending state, server error/rate-limit mapping and display cooldown. Backend remains the cooldown authority.
12. **FORGOT PASSWORD STATUS:** Real API and generic response independent of whether an account exists. Vietnamese validation and connection/rate-limit errors.
13. **RESET PASSWORD STATUS:** Requires route token and successful API response; URL parameters never imply success. Matches backend password rules, clears private cache on success, then returns to login.
14. **SESSION RESTORE STATUS:** `/auth/me` and HttpOnly-cookie refresh remain authoritative; failed access requests retry once after refresh. Login/Register restore navigation retains safe intent. Network failure during refresh is unavailable, not confirmed logout.
15. **SESSION EXPIRY STATUS:** Confirmed 401 after refresh emits expiry notification, clears account cache and returns an authenticated client to login with validated internal intent.
16. **LOGOUT STATUS:** Real logout must succeed before success feedback/navigation. Failed logout retains state and offers retry. Current-session revoke, logout-all and account deletion clear private state after server success.
17. **PRIVATE CACHE CLEANUP:** Cancels/removes private queries, clears mutation cache and auth data, and removes `beaconvie:journal-draft:` local backups. Public Tarot deck/Numerology meanings caches and unrelated browser storage survive. Regression covers late private query responses and private local drafts. No JWT storage introduced.
18. **ONBOARDING STATUS:** Uses existing persisted conversation, consent, discovery, completion and skip APIs. Errors retain the current step and typed reply. Copy no longer promises unsupported later return or fabricated personalization.
19. **ONBOARDING RETURN INTENT:** Existing secured helper preserved. Login/Register → onboarding → completion/skip retains valid app query/hash intent and rejects external/malformed destinations. Middleware/form/onboarding regression coverage retained.
20. **SETTINGS STATUS:** Desktop section navigation and focused content column; wrapping section links and stacked controls on mobile. Real retry/loading/error states for preferences, consent, notifications and sessions.
21. **PROFILE/ACCOUNT STATUS:** Read-only display name, wrapping email and verification state from UserDto. No fabricated editable profile fields/API.
22. **PASSWORD CHANGE STATUS:** Real current/new/confirmation contract; success clears form and refreshes sessions. Backend revokes other sessions and retains the current one.
23. **SESSION/DEVICE STATUS:** Lists actual user-agent summary and last-used time; marks current session; confirms single-session revoke and logout-all. No fabricated location. No separate revoke-others endpoint exists; password change has that backend effect.
24. **NOTIFICATION SETTINGS STATUS:** Only supported in-app and email reminder preferences; server-backed optimistic update/rollback and pending lock. Account/payment notices are accurately described as mandatory.
25. **MEMORY/PRIVACY STATUS:** Real legacy onboarding memory preference plus global/type consent APIs. Health information requires its actual separate consent rule; controls do not invent settings.
26. **DATA EXPORT STATUS:** Real synchronous account and memory export jobs download JSON only after success. Pending/error feedback retained. Account filename now uses Mệnh Vi branding.
27. **ACCOUNT DELETE STATUS:** Password-confirmed irreversible action with retention explanation, pending/error state and server-authoritative deletion followed by private cleanup/login. Native dialog semantics and focus restoration checked in visual QA.
28. **PREMIUM STATUS IN SETTINGS:** Loading, successful Free, active Premium and status-unavailable remain distinct. Fetch error never becomes Free.
29. **AUTH + PREMIUM FLOW:** Backend entitlement remains authoritative; account boundaries remove cached entitlement. Existing PAID-versus-ACTIVE remediation preserved.
30. **AUTH + TOOL FLOW:** Existing protected-route guard and safe auth/onboarding destination continuity retained; no client-only authorization added.
31. **SECURITY FINDINGS:** No known scoped P0/P1 remains after validation. HttpOnly cookies, CSRF/retry, backend session checks, rate limits and password policy preserved. Resume fixed private journal backups surviving account boundaries. Frozen security-source hash comparisons are recorded in evidence. Real database/email behavior remains an integration limitation.
32. **LOCALIZATION:** Touched account UI uses Mệnh Vi and Vietnamese copy, error messages, password visibility names, account menu and Settings dialog close names. Backend enums unchanged. Pre-existing global metadata/shared-shell copy is outside this phase.
33. **ACCESSIBILITY:** Form labels/error associations, native select controls, pending announcements, accessible password toggles, focus styles and native dialogs retained. Fixed scoped destructive/error text contrast and consent disclosure contrast. Native Tab traversal may reach browser chrome; background page controls must not receive focus.
34. **MOBILE QA:** Pending final evidence consolidation.
35. **RESPONSIVE QA:** Pending final evidence consolidation.
36. **SCREENSHOTS:** `apps/web/test-results/account-final/` and its `resume-2026-09-14/` subdirectory. All browser fixtures are explicitly **VISUAL QA**, not real auth E2E.
37. **VISUAL REVIEW:** Inspected desktop/mobile login, register, verification, onboarding, loaded Settings/security and deletion dialog. Midnight navy, restrained gold, prominent forms and readable section hierarchy retained; identified contrast defects were fixed and recaptured.
38. **WEB TYPECHECK:** Pending final result.
39. **API TYPECHECK:** PASS, exit 0.
40. **CHANGED-FILE ESLINT:** PASS after fixing resend handler's ref-analysis violation; no rule disabled. API changed-file lint also passed.
41. **FULL WEB TESTS:** PASS: 114 suites, 624/624 tests. Initial focused: 104/104. After final behavior fixes: 9 suites, 37/37; includes cleanup, resend, onboarding, Settings, dialog and header. Assertions/timeouts were not weakened.
42. **FULL API TESTS:** Pending final result. Relevant auth/users/guards/CSRF/onboarding focused tests: 7 suites, 53/53 pass, including the previously timed-out deletion test without modifications.
43. **PRODUCTION BUILD:** Pending final result.
44. **DOCKER STATUS:** Pending final safe probe.
45. **REAL AUTH E2E:** Pending prerequisite check. Synthetic screenshots do not certify sessions, PostgreSQL, Redis or email delivery.
46. **REMAINING P0:** None identified in scoped implementation review; final validation pending.
47. **REMAINING P1:** None identified in scoped implementation review; final validation pending.
48. **REMAINING P2:** Pre-existing global metadata branding and shared-shell copy remain outside scope. Native browser-chrome focus traversal is documented rather than replaced with custom dialog architecture.
49. **ENVIRONMENT BLOCKERS:** Pending build and Docker checks; real outbound email has not been exercised.
50. **RECOMMENDED NEXT PHASE:** Validate standalone packaging and real auth/email lifecycle in the supported deployment stack before production release. Reports/shared-shell/SEO work has not been started.
51. **FINAL VERDICT:** Pending final checks.

## Starting classification

“DONE” here means the supported implementation was present; it does not claim real-stack validation. Resume worked only on the identified gaps.

| Area | At recovery | Resume work |
|---|---|---|
| Login; Register | DONE | Validation/visual checks |
| Verification; resend | PARTIAL | Resend lint failure fixed; states checked |
| Forgot/reset password | DONE | Validation/visual checks |
| Session restore; expiry; logout | DONE | Regressions and contract review |
| Private cleanup | PARTIAL | Added private journal-backup removal |
| Onboarding | PARTIAL | Corrected unsupported copy |
| Safe onboarding return | DONE | Frozen helper/regressions preserved |
| Settings structure; profile | DONE | Loaded responsive checks |
| Password change; sessions | DONE | Contrast/localized dialog controls |
| Notifications; memory/privacy | DONE | Contrast and real contract checks |
| Export; deletion | DONE | Filename/dialog localization and QA |
| Settings Premium; auth/Premium; auth/tools | DONE | Authoritative states/regressions preserved |
| Vietnamese localization | PARTIAL | Remaining touched account labels/copy |
| Accessibility | PARTIAL | Identified contrast defects corrected |
| Mobile/responsive | PARTIAL | Source existed; screenshots absent |
| Tests/static/build | PARTIAL | Completed remaining validation |
| Screenshots; visual self-review | NOT STARTED | Earlier capture attempts produced no images |
| Real auth E2E | NOT STARTED | Safe prerequisite probe required |

## Starting file inventory

<!-- STARTING_INVENTORY -->

## Resume source delta

<!-- RESUME_DELTA -->

## Health-gate preservation

The earlier audit `docs/audit/health-gate-remediation-2026-09-09.md` contains its exact file inventory. These changes predate the account phase: payment retry/idempotency, safe-next helper and call sites, reduced-motion subscription, PAID/ACTIVE and UNKNOWN/Free distinction, Natal disclosure assertion and Tarot E2E synchronization. Account work overlaps auth/onboarding redirect call sites and Settings Premium copy; it does not replace those protections. Frozen source checks compare against the saved account-phase starting SHA-256 manifest, not just Git HEAD.

All logs, scripts, JSON, screenshots, original attempts and the final diff remain in ignored evidence directories. This tracked audit is the durable index; preserve the ignored evidence separately when handing off the worktree.
