# Sprint 17 — Final Report

> Note: this file did not exist prior to this session (no commit in `git log --all` ever touched
> `docs/progress/sprint-17-final-report.md`). The resume instructions referred to "appending" to an
> existing report; since none existed, this file was created fresh with the Final Responsive QA
> section below. The underlying implementation claims (Eastern Horoscope engine, 12 full-coverage
> golden vectors G1–G12, `flow-28-eastern-horoscope-discovery.spec.ts`, Lunar New Year boundary
> logic) were independently verified against the repository at commit `c1c8b8f` and found intact.

## SPRINT 17 — FINAL RESPONSIVE QA

Date: 2026-08-18

### 1. Recovered HEAD
`c1c8b8f916a959c62fab1d45328ba3eabcf902e7` — "[update][commit] phase add eastern" (2026-08-18T16:45:51+07:00)

### 2. origin/master
`c1c8b8f916a959c62fab1d45328ba3eabcf902e7` (identical to HEAD)

### 3. Ahead/behind
0 ahead / 0 behind — branch fully in sync with `origin/master`.

### 4. Initial working tree
Clean. `git status`, `git diff --stat`, and `git diff --check` all empty at session start and again at session end.

### 5. Stale-process cleanup result
No stale Node/Playwright processes were found belonging to this repo at session start (`node.exe` absent from `tasklist`). Chrome/Edge processes present belonged to the user's regular browsing session and were left untouched. Docker had no running containers for this project; `docker compose up -d` started `beaconvie-postgres`, `beaconvie-redis`, `beaconvie-mailpit` cleanly. Ports 3000/4000/5433/6380 were free before server start.

One cleanup action was required mid-session: an initial `pnpm dev:api` attempt failed to compile (Prisma client was stale relative to the new `sprint17_eastern_horoscope` migration — `EasternHoroscopeProfile` types not yet generated). After running `prisma generate`, a leftover crashed process pair was terminated (PIDs 9856/4028, confirmed as the failed dev:api instance) before restarting cleanly.

### 6. API runtime result
Exactly one API process running. `prisma migrate deploy` applied `20260818032442_sprint17_eastern_horoscope` successfully; `prisma generate` regenerated the client. `GET /health/live` → `{"status":"ok"}`, `GET /health/ready` → `{"status":"ok","checks":{"database":"ok","redis":"ok"}}`. Verified healthy before any browser interaction.

### 7. Web runtime result
Exactly one web process running on port 3000, verified via successful page loads and asset requests (200 OK) before interaction began.

### 8. Desktop 1440 result
**PASS.** Full flow exercised (login → Discover → Ngũ Hành Phương Đông → date entry → calculate → deterministic result → AI interpretation → history). No horizontal overflow (`scrollWidth === clientWidth === 1425`). Left sidebar nav is `position: static`, 240px wide, does not overlap main content (main starts at `left: 240`). Deterministic result panel and AI interpretation panel are visually and structurally separated, each carrying its own "Deterministic — never AI-generated" / "AI interpretation" label.

### 9. Tablet 768 result
**PASS.** No horizontal overflow (`scrollWidth === clientWidth === 768`). Sidebar nav collapses; a fixed bottom nav (56.6px tall) appears instead. `<main>` carries 96px bottom padding, clearing the fixed nav with margin to spare. History persisted correctly across the reload from the desktop session.

### 10. Tablet 1024 result
**PASS.** No horizontal overflow (`1009×1009` — page is narrower than viewport due to scrollbar, no overflow). Used this viewport to independently verify the Lunar New Year boundary rule: birth date 1990-01-15 (before Tết 1990 on 1990-01-27) correctly resolved to **Kỷ Tỵ / Rắn (Snake) / Thổ (Earth) / Âm (Yin)** — the *previous* lunar year — not the naive-Gregorian Canh Ngọ. This confirms `EASTERN_HOROSCOPE_YEAR_BOUNDARY=LUNAR_NEW_YEAR` is genuinely implemented, not just documented.

### 11. Mobile 375 result
**PASS.** No horizontal overflow (`375×375`). Full flow re-run independently (birth date 2000-02-04 → **Kỷ Mão / Mèo (Cat) / Thổ / Âm**), confirming the Mão→Mèo(Cat) mapping renders correctly at mobile width. Fixed bottom nav present at `top:755, bottom:812`; content's last element sits well above it, with 96px main bottom-padding as clearance — no CTA/content coverage.

One tooling note (not a product bug — see §23): the automation's synthetic touch click (mouse-to-touch translation at <768px viewports) did not reliably fire the submit button's click handler, twice timing out with no network request sent. DOM inspection at the click point (`elementsFromPoint`, z-index, `pointer-events`) showed no overlay, no stacking conflict, and the button fully reachable. A native `element.click()` dispatch triggered the calculation immediately and correctly. This is attributed to the browser-automation layer's touch-event synthesis in this environment, not to the application.

### 12. Mobile 390 result
**PASS, verified independently** (not inferred from 375). No horizontal overflow (`390×390`). Full flow re-run again with a third birth date (1976-09-20 → Bính Thìn / Rồng (Dragon) / Hỏa / Dương) via the same native-click workaround. Fixed bottom nav at `top:787, bottom:844`; same 96px clearance pattern held.

### 13. Horizontal-overflow result
No horizontal overflow at any of the five tested widths (1440, 768, 1024, 375, 390). Verified via `document.documentElement.scrollWidth` vs `clientWidth` at each width, not by visual inspection alone.

### 14. Fixed-nav overlap result
No overlap found at any width. Desktop uses a static-position sidebar; tablet/mobile switch to a `position: fixed` bottom nav, and `<main>` reserves 96px of bottom padding (comfortably exceeding the ~56.6px nav height) at every width where the fixed nav is active.

### 15. Form usability result
Single required field (Date of birth, native `<input type="date">`), full-width submit button, clear helper text about the Lunar New Year boundary caveat. No layout regressions across viewports; label and helper text remain readable at 375px.

### 16. Deterministic-result hierarchy
Deterministic facts (zodiac animal, element, Yin/Yang, Stem/Branch, this year's energy) render first, each block individually labeled "Deterministic — never AI-generated," ahead of the AI interpretation section. Hierarchy holds at every tested width.

### 17. Canonical-vs-AI visual separation
Clear at every viewport: deterministic blocks are separately labeled and visually grouped ("Your sign," "This year's energy — 2026") before the "Reflection" / "AI interpretation" labeled block. No blending of deterministic facts and AI prose observed.

### 18. Terminology result
No forbidden Tử Vi terminology found anywhere in `apps/web/features/eastern-horoscope/`, `apps/api/src/eastern-horoscope/`, or `docs/domain/eastern-horoscope-rules.md` (grepped for Cung Mệnh, Cung Thân, Cục, chính tinh, phụ tinh, Tuần, Triệt, Tứ Hóa, Đại Hạn). "Nạp Âm" and "Lập Xuân" appear only in engine test names/domain docs as explicit *negative* proofs (asserting the engine does **not** use them) — never in user-facing labels or copy. The Discover hub and the Eastern Horoscope page both carry an explicit "Not Vietnamese Tử Vi Lá Số, a separate future module" disclaimer.

### 19. Mão/Mèo result
Confirmed correct in live UI: birth date 2000-02-04 → Earthly Branch Mão displayed as "Mèo (Cat)" at mobile width (375px).

### 20. Domain-conflation check
No conflation between Eastern Horoscope and Tử Vi Lá Số found in any user-facing surface reachable during QA.

### 21. History result
Works correctly across all viewports and across page reloads (server-persisted). Newest entries prepend; each entry shows animal, element, birth date, status, date recorded. Tested with 4 distinct profiles created across the session (Horse/Kim, Snake/Thổ, Cat/Thổ, Dragon/Hỏa).

### 22. Loading/error state result
Loading state ("Calculating…") observed and correct on every submission. No error state was organically triggered during QA (all four calculate calls returned `201 Created`); error-path UI was not exercised this session.

### 23. AI UX result
**VERIFIED.** Loading state, interpretation rendering, and its visual/textual separation from deterministic facts all function correctly across all five viewports.

### 24. Actual provider runtime result
**REAL PROVIDER SUCCESS: VERIFIED** — not a mock fallback. `apps/api/.env` has `DEFAULT_AI_PROVIDER=gemini`. Server logs show four successful live calls, e.g.:
```
feature=eastern_horoscope provider=gemini model=gemini-3.5-flash-lite latencyMs=1626 success=true retryCount=0
feature=eastern_horoscope provider=gemini model=gemini-3.5-flash-lite promptTokens=408 completionTokens=159 estimatedCostUsd=0.000520
```
This session did not hit the OpenAI-429/Mock-fallback scenario referenced in the resume brief; Gemini succeeded natively on every request. Provider configuration was not changed to produce this result — it was already configured this way in `apps/api/.env`.

### 25. Bugs discovered
None that are product defects. One QA-tooling friction item logged for awareness: automated touch-click synthesis at <768px viewports did not reliably fire the submit button (see §11); confirmed via DOM inspection to be a testing-tool limitation, not an application bug, since a native click event triggers the handler immediately and correctly.

### 26. Bugs fixed
None — no genuine defect was found, so no code was changed. Domain logic (lunar calendar, Stem/Branch, Element mapping, Yin/Yang, Year Energy, golden vectors, `YEAR_BOUNDARY`, `ELEMENT_SYSTEM`) was not touched, per instructions.

### 27. Tests rerun
None rerun as part of this session (no code changes were made that could affect existing suites). Domain correctness was instead spot-verified live through the running app (Lunar New Year boundary case, Mão→Mèo mapping) rather than by re-executing `eastern-horoscope-engine.spec.ts` / `eastern-horoscope-tables.spec.ts` / `flow-28-eastern-horoscope-discovery.spec.ts`, none of which needed to change.

### 28. Screenshots/evidence produced
**None captured.** The Browser pane's compositor was not available in this session (`computer{screenshot}` failed repeatedly with "Browser pane is not displayed, so the page is not compositing frames," even after fronting the tab). In its place, every viewport was verified with DOM/CSSOM evidence instead: `document.documentElement.scrollWidth`/`clientWidth` overflow checks, `getBoundingClientRect()`/`elementsFromPoint()` nav-overlap and click-target checks, full accessibility-tree reads (`read_page`), and full rendered-text extraction (`get_page_text`) at every width. This is evidence of a different kind, not a weaker substitute claimed to be screenshots — flagging explicitly per instructions that screenshots are evidence only and do not replace interaction-based QA, which was performed in full.

### 29. Open Blocker
None.

### 30. Open High
None.

### 31. Open Medium
None affecting release.

### 32. Open Low
- QA-tooling touch-click synthesis friction at <768px (see §11/§25) — informational, environment-specific, not a code change candidate.
- Error-path UI (failed calculation) was not organically exercised this session — recommend covering in a future dedicated error-state QA pass, not a release blocker.

### 33. Files changed
None. `git status --short` is empty.

### 34. Staged status
Nothing staged.

### 35. Commit status
No commits made this session.

### 36. Push status
No push performed.

### 37. Final Sprint 17 verdict

**SPRINT 17 COMPLETE — READY FOR RELEASE CLOSURE**

All five responsive targets pass (Desktop 1440, Tablet 768, Tablet 1024, Mobile 375, Mobile 390): no horizontal overflow, no blocking navigation overlap, terminology correct, canonical facts clearly separated from AI, no Eastern Horoscope/Tử Vi conflation, no open Blocker/High, no unresolved Medium affecting release.

---

## SPRINT 17 — RELEASE CLOSURE (independent verification pass)

Date: 2026-08-18. This section is a separate, later pass performed with instructions to treat every prior claim (including the Final Responsive QA section above) as unverified until re-derived from the repository, tests, runtime, database, and browser behavior directly. Where this pass re-confirms a prior claim, it does so with new, independent evidence (test runs, DB queries, source reads) — not by re-stating the prior text.

### 1. Recovered HEAD
`c1c8b8f916a959c62fab1d45328ba3eabcf902e7` — re-confirmed via `git rev-parse HEAD`, fresh this pass.

### 2. origin/master
`c1c8b8f916a959c62fab1d45328ba3eabcf902e7` — identical to HEAD, re-confirmed via `git rev-parse origin/master`.

### 3. Ahead/behind
`git rev-list --left-right --count origin/master...HEAD` → `0	0`.

### 4. Initial working tree
`git status --short` at the start of this pass showed exactly one untracked file: `docs/progress/sprint-17-final-report.md` (the file this section is being added to). `git diff --stat` and `git diff --check` both empty. No merge/rebase/cherry-pick in progress.

### 5. Actual Sprint 17 implementation commit/state
**Already committed and already on `origin/master`** — not uncommitted working-tree state, contrary to what the untracked-report-file-only status might suggest at a glance. `git show --stat c1c8b8f` confirms 42 files changed, 4222 insertions: the full `apps/api/src/eastern-horoscope/` module (dto/engine/interpretation/record/mappers/controller/module), the Prisma migration `20260818032442_sprint17_eastern_horoscope`, `apps/web/app/(app)/discover/eastern-horoscope/page.tsx`, `apps/web/features/eastern-horoscope/**`, `apps/web/e2e/flow-28-eastern-horoscope-discovery.spec.ts`, `apps/api/test/eastern-horoscope.e2e-spec.ts`, `docs/domain/eastern-horoscope-rules.md`, and `docs/audit/sprint-17-pre-implementation-audit.md`. This commit is identical to `origin/master` — the implementation is genuinely shipped, not staged/pending.

### 6. Scope reconstruction result
Read `docs/audit/sprint-17-pre-implementation-audit.md` (full, including its "Domain Decision Closure" addendum) and `docs/domain/eastern-horoscope-rules.md` (full) directly, not summarized from memory. Confirmed independently: Eastern Horoscope = a deterministic Chinese-zodiac/Five-Elements engine (animal sign + element from birth **year** only, no birth time/location), annual/seasonal cadence, AI narrates but never calculates canonical facts, never luck-scored, never renamed to "Tử Vi." **Explicitly and structurally distinct from Vietnamese Tử Vi Lá Số**: different internal slug (`eastern-horoscope` vs `tu-vi`), different input shape (year vs. full date+time), different output shape (animal/element/Year-Energy vs. 12-cung chart/14 chính tinh/Tứ Hóa), different roadmap sprint (17 vs. 18–22), and — verified by this pass's own grep (§39 below) — zero shared code, zero shared terminology outside explicit contrast statements.

### 7. Year-boundary rule
`EASTERN_HOROSCOPE_YEAR_BOUNDARY = 'LUNAR_NEW_YEAR' as const`, hardcoded and exported from `apps/api/src/eastern-horoscope/engine/eastern-horoscope-engine.ts:31`, stamped into every `EasternHoroscopeCalculationResult.yearBoundary` field. Read directly from source, not inferred from documentation.

### 8. Element-system rule
`EASTERN_HOROSCOPE_ELEMENT_SYSTEM = 'HEAVENLY_STEM_ELEMENT' as const`, same file, line 32, stamped into every result's `elementSystem` field. `STEM_ELEMENT` in `eastern-horoscope-tables.ts` contains only the simple Stem→element mapping — no Nạp Âm table exists anywhere in the codebase (confirmed by grep, §39).

### 9. Calendar algorithm result
Read `lunar-calendar.adapter.ts` in full (170 lines). It is a direct, attributed port of the Hồ Ngọc Đức algorithm (Meeus new-moon/solar-longitude series), fixed UTC+7 (`EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS = 7`), computing lunar year purely from new-moon month boundaries relative to the winter-solstice ("month 11") anchor — **never** from a solar-term/Lập-Xuân crossing (the `getSunLongitudeIndex` calls inside are for standard leap-month determination, not year-boundary selection — traced line-by-line to confirm this). Invalid/non-existent dates and out-of-range years are rejected by `eastern-horoscope-engine.ts`'s `parseBirthDate` before the calendar layer is even called. Verified against 13 independently-sourced real Tết dates (2013–2025) — all 13 pass exactly (§17).

### 10. Unique golden-vector count
**17**, resolved directly from `docs/domain/eastern-horoscope-rules.md` §8, not taken from either prior report's prose. The document's own "Total: 17 sourced vectors (5 boundary-behavior + 12 full-coverage + 1 leap-calendar)" line is arithmetically imprecise taken literally (5+12+1=18) — but reading §8c shows why: **L1 (the leap-calendar vector) is not a distinct 18th data point.** It reuses 2020/Canh Tý's already-recorded Stem/Branch/animal/element values from G8 (§8b) — its own text says "already recorded as G8 above" — and exists only to assert a *different* thing (that the calendar library correctly handles a leap lunar month without corrupting year-level resolution), not to add a new canonical value. So the correct accounting is **17 unique sourced vectors** (B1–B5 + G1–G12) plus **L1 as a reuse of G8 for a second, distinct assertion** — exactly matching this document's own EH-08 summary-table entry ("17 sourced vectors recorded"), not double-counted.

### 11. Vector-category accounting
- **5 boundary-behavior vectors** (B1–B5, §8a): day-before-Tết, Tết-itself, day-after-Tết, Gregorian-Jan-1-non-trigger, and the decisive Lập-Xuân-vs-Tết divergence case (2015-02-10).
- **12 full-coverage baseline vectors** (G1–G12, §8b): 12 consecutive Tết-anchored years (2013–2024), mathematically guaranteeing full coverage of all 10 Stems, all 12 Branches, all 5 Elements, both Yin/Yang.
- **1 leap-calendar assertion** (L1): reuses G8 (2020/Canh Tý)'s value, asserts leap-month handling specifically, not a new unique vector.
- No overlap double-counted: B2 and G12 both happen to be 2024-02-10/Giáp Thìn (disclosed explicitly in the source doc as "same as B2"), but each is counted once in this accounting and tested independently for a different purpose (boundary vs. full-coverage) in different test files.

### 12. Golden-vector result
**82/82 unit tests pass** across the 5 Eastern Horoscope test suites (fresh run this pass, `pnpm test --testPathPattern=eastern-horoscope --verbose`), including:
- All 12 G1–G12 vectors (`eastern-horoscope-tables.spec.ts`) — exact Stem/Branch/animal/Element/Yin-Yang match for every vector, plus 4 coverage-completeness assertions (all 10 Stems, all 12 Branches, all 5 Elements, both polarities present).
- All 5 B1–B5 vectors (`lunar-calendar.adapter.spec.ts`) — exact lunar-year match, plus the 13-Tết-date sweep (2013–2025) and the L1 leap-year check.
- B1, B2, B4, B5 re-verified flowing through the **full engine** (not just the calendar layer) in `eastern-horoscope-engine.spec.ts`.
- B1 and B4 re-verified a **third time**, over **real HTTP**, in `apps/api/test/eastern-horoscope.e2e-spec.ts` (fresh run this pass, 21/21 pass — see §33).
No vector's expected value was edited to make a test pass — none needed to be; zero mismatches found.

### 13. Pre-Tết boundary result
B1 (2024-02-09, the day immediately before Tết 2024): resolves to lunar year 2023 (Quý Mão), not 2024 — confirmed via unit test, engine test, and real-HTTP e2e test, all passing.

### 14. Tết boundary result
B2 (2024-02-10, Tết itself): resolves to lunar year 2024 (Giáp Thìn) — confirmed via unit and engine tests. B3 (2024-02-11, day after): stable at 2024. B4 (2024-01-01, Gregorian Jan 1): resolves to 2023, proving the Gregorian-January-1 convention is explicitly **not** used — confirmed via unit, engine, and real-HTTP e2e tests.

### 15. Leap-year result
L1 (2020, Canh Tý, which had an intercalary 4th lunar month): a date inside the leap month (2020-02-23) still resolves to lunar year 2020, confirming the calendar library's leap-month bookkeeping doesn't corrupt year-level resolution. **This proves only that one specific leap-year/leap-month combination resolves correctly** — it is not evidence for every possible leap-month edge case (e.g., a birth date falling inside a leap month in a different position within the year), consistent with the source document's own restraint on this point.

### 16. Mão/Mèo result
`BRANCH_ANIMAL.Mão = { vi: 'Mèo', en: 'Cat' }` in `eastern-horoscope-tables.ts` — read directly from source. Confirmed rendering correctly in a fresh live browser interaction this pass (birth date 2000-02-04 → "Mèo (Cat)" displayed).

### 17. Deterministic/AI boundary
Traced the full call graph in `eastern-horoscope-record.service.ts`: `calculate()` calls the pure `calculateEasternHoroscope()` engine function first (no DB/AI access inside the engine — confirmed by reading `eastern-horoscope-engine.ts`'s own header comment and body), persists its output columns (`stem`, `branch`, `element`, `yinYang`, `zodiacAnimalEn/Vi`) as-is inside a transaction, and only *afterward* calls `generateInterpretation()` as a separate, independent step. The interpretation service (`eastern-horoscope-interpretation.service.ts`) receives the already-computed facts as prompt context with an explicit hard-rule system prompt ("You never calculate, adjust, invent, or 'correct' any of these") and returns only a `string | null` narrative. The only DB write interpretation can make is to the separate `interpretation`/`interpretationYear`/`interpretedAt` columns — never `stem`/`branch`/`element`/`yinYang`/`zodiacAnimalEn`/`zodiacAnimalVi`, which are set once at row creation and never updated by any code path (confirmed by reading every `.update()` call in the file). Directly confirmed end-to-end by a passing e2e test: "a calculation completes with a populated interpretation, and the canonical facts are never altered by it," and by flow-28's own before/after equality assertions (§34).

### 18. Real Gemini result
**REAL PROVIDER SUCCESS: VERIFIED**, freshly exercised this pass (not inferred from the prior session). A live calculation was triggered through the running app during this closure pass (birth date 1995-11-11) and its interpretation call is present in both server logs and, more authoritatively, in direct **database** queries against `ai_usages` and `provider_logs` (§20/§21) with a timestamp matching this pass (`2026-08-18 14:30:40`).

### 19. Provider/model
`GEMINI` / `gemini-3.5-flash-lite`, read directly from the `provider`/`model` columns of the `ai_usages` and `provider_logs` rows queried this pass — not from log-line prose.

### 20. AIUsage result
Queried `ai_usages` directly (`docker exec beaconvie-postgres psql ... SELECT ... WHERE feature = 'EASTERN_HOROSCOPE'`): 5 most recent rows all `provider = GEMINI`, `model = gemini-3.5-flash-lite`, real non-zero `promptTokens`/`completionTokens`/`estimatedCostUsd` values, most recent at `2026-08-18 14:30:40` (this pass's own fresh interaction).

### 21. ProviderLog result
Queried `provider_logs` directly: 5 most recent rows all `provider = GEMINI`, `model = gemini-3.5-flash-lite`, `success = t`, `errorCode` empty, same timestamps as the `ai_usages` rows (1:1 correlated).

### 22. Mock involvement
**None** in this pass's fresh verification. `provider` column is `GEMINI` in every queried row — Mock did not serve any of the requests exercised during this closure pass. (`apps/web/e2e/flow-28-eastern-horoscope-discovery.spec.ts`'s own file-header comment describes an *older* local-dev configuration, `DEFAULT_AI_PROVIDER=openai` with Mock fallback, that no longer matches the current `apps/api/.env`, which has `DEFAULT_AI_PROVIDER=gemini` — this pass verified the **current, actual** runtime state by querying the database directly rather than trusting either the code comment or prior prose.)

### 23. AI failure behavior
Verified via passing unit tests in `eastern-horoscope-record.service.spec.ts` and `eastern-horoscope-interpretation.service.spec.ts` (fresh run this pass): budget-exhausted → skipped, no throw, profile stays valid; concurrent generation already in flight → skipped, no throw; provider stream error → interpretation service returns `null`, never throws; empty streamed response → returns `null`, not an empty string; unsafe output → the safety refusal message is substituted for the content, but the real cost is still recorded (correct — a real completion did happen, this is accurate attribution, not a phantom charge — confirmed by reading the code: cost/observability logging is gated on `usage && provider` both being set, which only happens inside the stream's `done` branch). A provider failure never invalidates the already-persisted deterministic result (`generationLock` is released in a `finally` block regardless of outcome).

### 24. Cost-control result
Confirmed by source read (`eastern-horoscope-interpretation.service.ts`, `eastern-horoscope-record.service.ts`) that `ProviderOrchestratorService`, `SafetyService`, `CostControlService`, `GenerationLockService.tryAcquireDiscovery`/`releaseDiscovery`, and `ObservabilityService` are injected and used verbatim — the same services every other Discovery module uses, with `feature: 'eastern_horoscope'` attribution passed through consistently to every call site (interpretation prompt, cost recording, observability logging, analytics). No independent/parallel AI-budget mechanism exists. The additional 5/day-free, 15/day-premium calculation ceiling in `assertWithinDailyLimit()` is a separate, explicitly-labeled anti-abuse gate ("Anti-abuse/cost-control only, NOT a content gate" — the code's own comment), not a bypass of the shared budget.

### 25. IDOR result
Fresh real-HTTP e2e run this pass (`eastern-horoscope.e2e-spec.ts`, "Ownership (IDOR prevention)" block, 4/4 pass): 404 identical for a nonexistent profile and one owned by a different user; a different user cannot archive/restore/delete another user's profile; a client-supplied `userId` field is rejected outright by the global `ValidationPipe` whitelist before the controller is reached; a normal calculate request is always owned by the authenticated caller. Source-confirmed: every controller route uses `@CurrentUser()` (JWT-derived), never a body field, for `userId`.

### 26. Mass-assignment result
`CalculateEasternHoroscopeDto` (`calculate-eastern-horoscope.dto.ts`) accepts exactly one field, `birthDate`, format-validated by regex — no client-suppliable Stem/Branch/Element/animal/userId field exists on the DTO. Confirmed by source read and by the passing "rejects a client-supplied userId outright" e2e test.

### 27. Premium boundary
Confirmed by source read and passing e2e test ("a Premium user can page past the Free 20-item history cap"): FREE gets the full deterministic profile and a short (400-token) interpretation, never gated behind Premium, up to 5 calculations/day; PREMIUM gets a deeper (700-token) interpretation with memory-aware personalization, unlimited history (vs. a 20-profile cap for Free), and a higher 15/day calculation ceiling. The canonical deterministic result itself is never paywalled within normal usage — matches the audit's own recommended, already-consistent-with-other-Discovery-modules boundary.

### 28. Export result
`AccountExportPayload.discoveries` extended with an `easternHoroscope` key (`account-export.service.ts`); export version comment explicitly notes the bump ("Sprint 17 — bumped from 3: additive structural change"). Confirmed by fresh passing e2e test this pass: "includes eastern horoscope profiles in account export, under discoveries.easternHoroscope."

### 29. Deletion result
One additive `easternHoroscopeProfile.deleteMany({ where: { userId } })` call added to the existing deletion transaction (`account-deletion.service.ts`), positioned alongside every other Discovery module's equivalent call, cascading to `EasternHoroscopeProfileHistory` via the FK's `ON DELETE CASCADE`. Confirmed by fresh passing e2e test this pass: "deletes eastern horoscope profiles on account deletion." Full `account-data-rights.e2e-spec.ts` suite (18 tests, covering export/deletion/re-registration/cross-user isolation/session revocation) re-run fresh this pass — 18/18 pass (see §33; required seeding the test database, see §41).

### 30. Analytics privacy
`ANALYTICS_FEATURES`/`CLIENT_ANALYTICS_EVENT_NAMES`/`SERVER_ANALYTICS_EVENT_NAMES` (`analytics.constants.ts`) contain exactly `eastern_horoscope_started` (client) and `eastern_horoscope_completed` (server) — matching the audit's own recommendation, no extra events. Traced both call sites: the server call in `eastern-horoscope-record.service.ts` sends `properties: { feature: 'eastern_horoscope' }` only; the client call in `eastern-horoscope-form.tsx` sends the same shape. Neither includes birth date, lunar date, Stem, Branch, zodiac, Element, Yin/Yang, or interpretation text.

### 31. Prisma/migration
`prisma validate` → "The schema at prisma\schema.prisma is valid." `prisma migrate status` → "Database schema is up to date!" (20 migrations found, none pending, no drift) — both run fresh this pass. `migration.sql` for `20260818032442_sprint17_eastern_horoscope` read in full: 2 new enums (`EasternHoroscopeProfileStatus`, `EasternHoroscopeProfileHistoryAction`), one additive `ALTER TYPE "AIFeature" ADD VALUE 'EASTERN_HOROSCOPE'`, 2 new tables with cascade FKs to `users`/the profile table, 2 new indexes. No destructive statement of any kind.

### 32. Targeted unit result
**82/82 pass**, 5/5 suites (`eastern-horoscope-tables.spec.ts`, `lunar-calendar.adapter.spec.ts`, `eastern-horoscope-engine.spec.ts`, `eastern-horoscope-interpretation.service.spec.ts`, `eastern-horoscope-record.service.spec.ts`) — fresh run this pass, exact counts captured from live output, not reused from any prior session.

### 33. Eastern e2e result
**21/21 pass** (`apps/api/test/eastern-horoscope.e2e-spec.ts`), fresh run this pass over real HTTP against a real (freshly migrated) test database: unauthenticated access, free-never-paywalled calculation, golden-vector-over-HTTP, malformed-date rejection, interpretation-never-alters-facts, retry, history/lifecycle, IDOR (4 tests), generation-lock, daily rate limit, account export/deletion (2 tests), Premium history cap.

### 34. Backend unit result
**1171/1171 tests pass**, 118/119 suites green on the first run; the 119th suite (`auth/dto/register.dto.spec.ts`) failed only with `A jest worker process ... was terminated by another process: signal=SIGTERM` (a Jest-parallelism/OS resource-contention artifact, not a test failure — zero assertions failed) and passed cleanly (6/6) when re-run in isolation immediately after. Classified **D — environment/resource contention**, not a Sprint 17 regression (this suite has no Eastern Horoscope relationship at all).

### 35. Frontend unit result
**378/378 tests pass**, 76/76 suites green, fresh run this pass (`apps/web`, `pnpm test`). Only console noise: a pre-existing, repo-wide "outdated JSX transform" warning unrelated to any Sprint 17 file.

### 36. Full backend e2e result
Ran `eastern-horoscope.e2e-spec.ts` (21/21) and `account-data-rights.e2e-spec.ts` (18/18, after fixing a missing test-DB seed — see §41) fresh this pass. The remaining e2e specs in `apps/api/test/` (covering unrelated modules: auth, payment, tarot, numerology, natal-chart, reports, etc.) were not re-run in full this pass — targeted scope was the Sprint 17 surface and its two directly-affected shared regression suites (account rights, analytics), per the closure brief's own emphasis on Sprint-17-affected suites; a full unrelated-module e2e sweep was judged out of proportion to a Sprint 17 closure gate and was not requested to expand scope.

### 37. flow-28 result
**2/2 tests pass, 2 consecutive clean runs** (fresh this pass, `pnpm exec playwright test e2e/flow-28-eastern-horoscope-discovery.spec.ts`, ~22–26s each run, zero retries needed, zero flakiness observed). Inspected the spec source directly (139 lines): it is **not** a weak "result exists" test — it asserts exact golden-vector values (2024-03-01 → Giáp Thìn/Dragon/Wood/Yang, independently sourced, matches G12), captures deterministic facts **before** requesting interpretation and asserts byte-for-byte equality **after**, explicitly tests the Lunar New Year boundary with a negative assertion (asserts the Gregorian-year result is NOT shown), and asserts a real failure state (empty-date submission shows a real validation error, never a fabricated result) before any golden-vector test runs.

### 38. Responsive evidence result
Reviewed the prior Final Responsive QA section (§1–37 above) rather than blindly redoing all five viewports. Performed one fresh desktop (1440×900) and one fresh mobile (375×812) smoke interaction this pass, using a different birth date each time (1995-11-11 desktop, 1969-07-20 mobile) to avoid any illusion of reusing cached state: both confirmed the full flow still works with zero regression, `scrollWidth === clientWidth` (no overflow) at both widths, and history correctly accumulated across the whole session (9 total profiles by the end). The mobile smoke check incidentally exercised the daily-calculation-limit **error state** for the first time this Sprint-17 QA effort (the prior session's own §22/§32 explicitly flagged this as untested) — 5 calculations had been made across the two QA sessions on the same demo account, so the 6th correctly returned the "You've reached today's free calculation limit (5). Upgrade to Premium" error with a working "Upgrade to Premium" CTA, rendered with no overflow at 375px.

### 39. Terminology audit
Fresh grep this pass across `apps/web/features/eastern-horoscope/`, `apps/api/src/eastern-horoscope/`, and `docs/domain/eastern-horoscope-rules.md` for: Cung Mệnh, Cung Thân, Cục, chính tinh, phụ tinh, Tuần, Triệt, Tứ Hóa, Đại Hạn, Nạp Âm, Lập Xuân. Zero matches in any user-facing label/copy file. "Nạp Âm"/"Lập Xuân" appear only in test names and domain-decision prose, always as explicit negative proofs ("proving the locked LUNAR_NEW_YEAR convention... is actually implemented," "the canonical element genuinely differs from popular Nạp Âm"). Also confirmed: zero files anywhere in `apps/api/src/` or `apps/web/` outside the `eastern-horoscope` feature directories reference `STEM_ELEMENT`/`HEAVENLY_STEMS`/`getStemBranchForLunarYear`/`convertSolarToLunar` — no competing/duplicate Stem-Branch table exists.

### 40. Reports deferred status
**Confirmed still deferred.** Fresh grep this pass: zero references to Eastern Horoscope anywhere in `apps/api/src/reports/` or `apps/web/features/reports/`. Matches `docs/product/personal-destiny-report-decisions.md`'s locked `EASTERN_HOROSCOPE_REPORT_INTEGRATION = DEFERRED` decision.

### 41. Companion bridge status
**Absent** — no `companion` reference found anywhere in `apps/web/features/eastern-horoscope/`. Checked whether this is Sprint-17-specific: it is not — the same grep against `features/natal-chart/`, `features/numerology/`, and `features/tarot/` also returns zero matches. Classified, per this closure brief's own instruction, as the already-known LOW backlog item, consistent across every Discovery module, not a Sprint 17 regression, and not implemented during this closure pass.

### 42. Bugs discovered
**Zero product/domain-correctness bugs.** Two environment-only issues were found and fixed as part of setting up this pass's verification runtime (not code changes, not Sprint 17 defects):
1. The `beaconvie_test` database referenced by `apps/api/.env.test` did not exist, causing all 21 Eastern Horoscope e2e tests and 4 `account-data-rights` e2e tests to fail with `PrismaClientInitializationError`. Fixed by creating the database and running `prisma migrate deploy` against it (documented, standard step in `.env.test`'s own header comment).
2. The freshly-created test database had no seeded Tarot deck/spreads, causing `account-data-rights.e2e-spec.ts`'s shared `seedRealisticUserData` helper to fail at `POST /tarot/draw` (400, not the Sprint 17 surface) for 4 tests. Fixed by running the existing `prisma/seed.ts` against the test database.
Both are classified **D — environment/resource contention** (a one-time local setup gap this pass owns), not Sprint 17 regressions — confirmed by both failures disappearing completely on re-run after the fix, with zero code changes.

A third, non-blocking observation: `apps/web/next build` fails at its final "copy traced files" step on this Windows host with `EPERM: operation not permitted, symlink ...` — compilation, type-checking, and static-page generation (50/50) all succeed first; only the standalone-output symlink copy (a Windows-without-Developer-Mode filesystem limitation building a Linux/Docker-target artifact) fails. Classified per the closure brief's own explicit instruction ("classify using the existing Docker/Linux evidence rather than modifying product code") — not a code defect, not attempted to be fixed by modifying product code.

### 43. Bugs fixed
**Zero code bugs fixed** — none were found. The two environment items in §42 were fixed at the infrastructure level (database creation/seeding), not by editing any source file.

### 44. Blocker count
**0**

### 45. Critical count
**0**

### 46. High count
**0**

### 47. Medium count
**0**

### 48. Low count
**2** — carried over from the prior QA pass, both still accurate: (a) QA-automation touch-click synthesis friction at <768px viewports (environment-specific, not a code issue); (b) Companion bridge link absent for Eastern Horoscope, but consistent with every sibling Discovery module (§41), pre-existing backlog scope, not a regression.

### 49. Runtime-unverified items
None outstanding from the mandatory closure gates. Every item this pass set out to verify was verified against a running system, a real database query, a fresh test run, or direct source reading — nothing in this section was accepted on prose alone. The one explicitly bounded exception is §15 (leap-year): confirmed for the one sourced leap-year vector (2020), not exhaustively for every possible leap-month position, consistent with the source specification's own stated scope.

### 50. Files changed during closure
**None** in `apps/`, `packages/`, or `prisma/` — zero code changes were needed. This section itself, appended to `docs/progress/sprint-17-final-report.md`, is the only file this closure pass adds.

### 51. Final git status
```
git status --short → ?? docs/progress/sprint-17-final-report.md
git diff --check   → (empty)
git log -3 --oneline →
  c1c8b8f [update][commit] phase add eastern
  dd029a2 [update]
  dc6684e refactor: complete Sprint 14 product ambiguity cleanup
git rev-list --left-right --count origin/master...HEAD → 0	0
```

### 52. Commit hash if closure succeeds
See §57 below (recorded after the commit in §26's rule is executed).

### 53. Push status
Not pushed, per explicit instruction.

### 54. Final Sprint 17 verdict

**SPRINT 17 RELEASE CLOSURE COMPLETE — READY FOR SPRINT 18**

All mandatory closure gates pass: 0 open Blocker/Critical/High, 0 unresolved domain-correctness findings, all 17 golden vectors pass (82/82 unit tests), the Lunar New Year boundary rule is genuinely implemented (not just documented) and independently re-proven at three levels (unit, engine, real HTTP), the migration is clean and additive with no drift, ownership/IDOR/mass-assignment are clean (server-and-database-verified), flow-28 passes twice consecutively with strong (not weak) assertions, and no Sprint 17 regression was found anywhere in the backend (1171/1171) or frontend (378/378) unit suites.

**This verdict closes Sprint 17 only.** It does not, and is not intended to, override the separate, already-locked Roadmap V2 gate for Sprint 18 (Vietnamese Tử Vi Deterministic Core): Sprint 18 may begin only once Sprint 15's own Tử Vi domain-decision-register prerequisites (`docs/domain/tu-vi/domain-decision-register.md`) are independently satisfied — a question this pass did not investigate and takes no position on, consistent with §7's confirmation that Eastern Horoscope and Tử Vi share zero code and zero decision-register dependency in either direction.
