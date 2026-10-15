# Mobile V1 — Full Integration & Parity Gate

Audit date: 2026-10-15 (Asia/Bangkok).
Repository: Xuanthanhit99/webtuvi. PR: #45, OPEN / DRAFT.
Audited source HEAD: `3644ba1aab290b18576c6ffb8a768a15c7ae2fbe`.
Base observed: `master` at `73d45ded7a9951300453868d708536bc2070a957`.

**Release decision: NOT READY.** This is an audit checkpoint, not completion of the requested integration. All requested capabilities remain in V1. No V1.1 deferral.

## Evidence rules

- FAIL: source inspection establishes missing or incompatible functionality.
- IMPLEMENTED / UNVERIFIED: code exists; this is not a functional PASS.
- PASS (CI): an existing named workflow/job succeeded on the audited source commit.
- BLOCKED: execution could not proceed; absence of execution is not PASS.
- NOT TESTED: no qualifying evidence was collected.
- Historical Android/backend findings below were recorded at d4cbb1c on 2026-10-14, not reproduced on the audited HEAD.

## Web / Mobile parity matrix

Paths below are repository-relative and refer to the audited HEAD.

| Capability | Web / API evidence | Mobile evidence | Gate status / priority |
|---|---|---|---|
| Tử Vi input and calculation | apps/web/features/tu-vi/api/tu-vi-api.ts; apps/api/src/tu-vi/tu-vi.controller.ts | apps/mobile/src/app/(tabs)/tu-vi.tsx renders ComingSoon | FAIL / P0 |
| Tử Vi overview, twelve palaces, interpretation | apps/web/features/tu-vi/components/tu-vi-chart-view.tsx and tu-vi-palace-grid.tsx; TuViChartDto | No functional Tử Vi screen | FAIL / P0 |
| Đại Vận / Tiểu Hạn | Web timeline/year-navigation components; TuViChartDto.daiVan/currentDaiVan/currentTieuHan/nearbyTieuHan | No functional Tử Vi screen | FAIL / P0 |
| Tử Vi persistence, list/detail/history and lifecycle | tuViApi calculate/listCharts/getChart/chartHistory/archiveChart/restoreChart/deleteChart | No Mobile adapter or functional flow in audited tree | FAIL / P0 |
| Natal date, optional time, place search and creation | apps/web/features/natal-chart/api/natal-chart-api.ts; CreateNatalChartDto | No natal route/feature in audited Mobile source tree; Home points to Discover ComingSoon | FAIL / P0 |
| Natal placements, houses, aspects, interpretation and history | NatalChartDto; natalChartApi list/get/history/interpret and lifecycle | No functional Mobile flow | FAIL / P0 |
| Numerology six values and meanings | numerologyApi; CalculateNumerologyDto; NumerologyReadingDto / NumerologyValueTypeValue | No numerology route/feature in audited Mobile source tree | FAIL / P0 |
| Numerology persistence and revisit | /numerology/readings list/detail/history/lifecycle endpoints | No functional Mobile flow | FAIL / P0 |
| Tarot one/three-card selection and interpretation | /tarot/selection-session and /tarot/draw | apps/mobile/src/features/tarot/tarot-api.ts and app/(tabs)/tarot.tsx | IMPLEMENTED / UNVERIFIED end to end; P0 evidence gap |
| Tarot list/detail/archive/delete/restore | Mobile API adapter exposes real endpoints; historical screen tests documented | Mocked local test report exists; native/backend acceptance still required | IMPLEMENTED / UNVERIFIED end to end; P0 evidence gap |
| Home navigation to four tools / Discover | Web discovery modules | feature-grid.tsx: natal and numerology both target Discover; discover.tsx and tu-vi.tsx are ComingSoon | FAIL / P0 |
| Home API contract | packages/types/index.ts DashboardViewModelDto and apps/api/src/dashboard/dashboard.service.ts | use-home-data.ts assumes /dashboard returns hasChart; actual DTO has hero, companionPanel, memoryHighlight, discoverySuggestion, recentActivity, no hasChart | FAIL / P0 |
| Home real daily suggestions | Existing Mobile suggestions component inspected | today-suggestions.tsx contains fixed auspicious hours/directions/calendar and fallback energy prose | FAIL against real-data requirement / P0 |
| Login/register/logout/session refresh | /auth/mobile/register, login, refresh, logout and /auth/me exist | auth-api.ts / auth-provider.tsx call real routes; transient-refresh regression tests exist | IMPLEMENTED / UNVERIFIED live; P0 evidence gap |
| Email verification and password reset completion | /auth/verify-email and /auth/reset-password exist | Pending/resend and forgot-password screens exist; no verify-token or reset-token route/API method in audited Mobile tree | FAIL for native completion parity / P1; verify full email return flow |
| Onboarding | apps/web/features/onboarding/api/onboarding-api.ts | No Mobile onboarding route/adapter in audited tree | FAIL / P0 |
| Protected actions, cross-account isolation, revoked sessions | Protected API controllers exist | Real authenticated device/API checks not executed in this session | NOT TESTED / P0 |
| Dev fixtures | auth-provider.tsx and settings.tsx | __DEV__ fixture user and Home fixture overrides exist | Must not supply release acceptance data; production exclusion and real-session path need verification / P1 |
| Android acceptance | Historical docs/qa/tarot-native-v1-android-d4cbb1c/QA-REPORT.md | Historical Expo Go ANR, missing local API/session, no clean Tarot visual comparison | BLOCKED historically; audited HEAD NOT TESTED / P0 |
| iOS acceptance | No new iOS evidence collected | Checklist in mobile-v1-native-qa-plan.md | NOT TESTED / P0 |

No engine defect was demonstrated by this audit. Do not rewrite calculation engines to fill missing Mobile UI.

## Verified request/response contracts

### Tử Vi

POST /tu-vi/calculate: { birthDate: YYYY-MM-DD, birthTime: HH:mm, sex: 'Nam' | 'Nữ' }.
List: GET /tu-vi/charts?status=ACTIVE|ARCHIVED|DELETED&page=&pageSize=.
Detail/history: GET /tu-vi/charts/:id and /:id/history.
Mutations: POST /:id/interpret, /:id/archive, /:id/restore; DELETE /:id.
Render server-returned chart, palaces, stars, transformations, twelve Đại Vận cycles and nearby Tiểu Hạn.
Empty legacy cycles and null interpretation/current cycles are valid absence, never permission to invent results.
The server owns Tiểu Hạn palace assignments; Mobile must not rederive them.

### Natal chart

Explicit place search: GET /geocoding/search?q=, returning opaque location tokens.
POST /natal-charts: { birthDate, birthTime?: HH:mm, locationToken }.
Do not send fabricated coordinates or replace a location token with a place label.
Omit birthTime when unknown. Respect birthTimeKnown/housesAvailable and null angles; never fabricate houses/Ascendant/Midheaven.
Interpretation is structured sections or null, not a plain text-only contract.
List/detail/history: GET /natal-charts, /:id, /:id/history.
Mutations: POST /:id/interpret, /:id/archive, /:id/restore; DELETE /:id.

### Numerology

POST /numerology/calculate: { fullBirthName, birthDate }.
Keep original input and show server-returned normalizedBirthName.
Six types: LIFE_PATH, EXPRESSION, SOUL_URGE, PERSONALITY, BIRTHDAY, PERSONAL_YEAR.
Use server values, breakdown, isMasterNumber, order and appliesToYear.
Meanings: GET /numerology/meanings.
List/detail/history: GET /numerology/readings, /:id, /:id/history.
Mutations: POST /:id/interpret, /:id/archive, /:id/restore; DELETE /:id.

### Tarot

Use the server selection-session token and selectedPositions (unique integers 0..77).
SINGLE_CARD/DAILY_DRAW require one position; THREE_CARD requires three.
Only server-returned card identities, reversals and interpretation are authoritative.
Existing adapter invalidates erroneous input; screen token-consumption and mutation behavior still require real-backend tests.
Do not automatically retry a draw after an ambiguous response; confirm persistence through history.

### Account and onboarding

Mobile token responses: { user, accessToken, refreshToken }; protected reads use bearer authorization.
Verify/reset completion endpoints are POST /auth/verify-email and /auth/reset-password.
Onboarding: GET /onboarding; POST /onboarding/message { content }, /memory/consent { accepted },
/discovery/select { choice: 'accepted' | 'skipped' }, /complete, /skip.
Do not add a stricter email-verification gate than the existing backend enforces.
Session-management parity also needs review against /auth/sessions, /sessions/:id, /logout-all and /change-password.

## Existing CI evidence (read only, no new run requested)

All results below belong to source commit 3644ba1, not to a future documentation checkpoint or implementation.

| Workflow | Run | Observed result |
|---|---|---|
| Mobile V1 Jest | https://github.com/Xuanthanhit99/webtuvi/actions/runs/38704438436 | PASS; job 116320493265; install, Mobile lint, typecheck and Jest steps succeeded |
| CI | https://github.com/Xuanthanhit99/webtuvi/actions/runs/38704438229 | PASS; job 116320220486; lint/typecheck, backend unit+e2e, frontend unit, builds and production-readiness Playwright steps succeeded |

Job/step statuses were read through GitHub. Test counts were not extracted from logs.
These runs do not prove Mobile full parity, native Android/iOS acceptance, or a new local execution.
No workflow dispatch or rerun was requested. Monthly spend/remaining allowance was not verified.
The documentation checkpoint uses [skip ci] to avoid spending Actions on this audit.

## Current execution blocker

Local shell calls did not return even for read-only workspace/status commands.
A separate Node runtime attempt to read the workspace timed out and reset its kernel.
Thus local HEAD, dirty files, fetch/sync, dependencies, Docker/API readiness, device state and tests could not be verified in this session.
Remote PR HEAD was checked before creating this documentation checkpoint. No local reset, checkout, migration, seed or application-source change was made.
The checkpoint is created through GitHub against the audited parent with an expected-HEAD lease; it does not claim local synchronization.
No permission rejection was received; this is a runtime availability blocker, not an approval request.

## Integration batches still required

1. Restore local runtime access, inspect local instructions/dirty files, fetch and fast-forward safely to the PR branch. Recheck remote/local HEAD before code edits.
2. Integrate typed Tử Vi, natal/geocoding and numerology Mobile adapters, native input/result screens and full persisted lifecycle; reuse shared DTOs and server engines.
3. Integrate account onboarding, email/reset return flows and protected-action/session behavior. Validate real-session persistence and cross-account cache isolation.
4. Replace Discover placeholders with working tool navigation; align Home with DashboardViewModelDto and real available API data. Never present the fixed suggestions as live data. If a required daily-data contract is absent, record the product/API decision explicitly.
5. Exercise Tarot against a real local backend: one-use tokens, limits, network ambiguity and archive/delete/restore persistence. Preserve existing regression coverage.
6. Run local lint/typecheck/unit/integration checks and fix failures; commit/push complete source checkpoints without intermediate Actions runs. Run final Actions once after integration.
7. Complete Android and iOS checklist with build/SHA/device evidence, then reassess every Release Gate. Keep PR Draft until all gates pass.

## Release Gate

- [ ] All six requested scope groups operate using real API responses, with no dead ComingSoon destinations.
- [ ] All required list/detail/history and persisted lifecycle flows survive reload/relaunch.
- [ ] Auth, verification, onboarding, protected actions and session errors pass real integration.
- [ ] Local lint, typecheck, unit and integration checks PASS on final source.
- [ ] Final source checkpoint committed/pushed; final Actions verified within the existing budget.
- [ ] Android acceptance PASS with evidence.
- [ ] iOS acceptance PASS with evidence.
- [ ] Locked Web baselines and calculation engines preserved.
- [ ] P0/P1 blockers resolved, with remaining limits stated honestly.

Do not mark ready, merge or deploy based on this checkpoint.
