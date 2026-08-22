# Tử Vi Depth + Time Cycles — Final Live Release QA & Closure (2026-08-22)

Final live/browser QA pass over the already-implemented, already-uncommitted Tử Vi Depth
Completion (Miếu/Vượng/Đắc/Hãm) and Time Cycles (Đại Vận, Tiểu Hạn) work. Companion docs:
`docs/progress/tu-vi-depth-completion-final-report.md`,
`docs/progress/tu-vi-time-cycles-release-closure.md`, `docs/domain/tu-vi/domain-decision-register.md`.

**Not committed. Not pushed. Not deployed. No production credentials touched.** Left as reviewable
working-tree state, per explicit instruction for this pass.

This was **not** a feature-development pass — no new astrology functionality was implemented and no
in-scope-deferred functionality (Lưu Niên, CORE_13 expansion) was added. Every change below is
either a genuine, verified defect fix discovered during live QA, or documentation.

---

## 1. Scope and starting state

- `HEAD` at session start: same working tree as the end of the Time Cycles pass (dignity + Đại Vận +
  Tiểu Hạn implemented, uncommitted). No new inherited/unexplained changes found.
- Frozen decisions reconfirmed unchanged in `docs/domain/tu-vi/domain-decision-register.md`:
  `TUVI_RULESET_V1 = VDTTL_1956_V1` and `TUVI_STAR_DIGNITY_V1 = ENABLED` (founder decision,
  `RESOLVED_BY_FOUNDER_DECISION`).
- Environment: Docker Postgres/Redis/Mailpit up, API on `:4000`, web on `:3000` (production build via
  `next start`, not `next dev` — see §5), both verified live via `curl`/`/health/ready`, not assumed.

## 2. Full regression (fresh this pass)

| Suite | Result |
|---|---|
| `pnpm test:api` (backend unit) | **150 suites / 1613 tests — all pass** |
| `pnpm typecheck` (both apps) | **clean, 0 errors** |
| `pnpm lint` (both apps) | **0 errors** — 24 pre-existing `no-explicit-any` warnings in unrelated `insight`/`review` API spec files, untouched by this pass |
| `apps/api` `tu-vi.e2e-spec.ts` against real Postgres | **21/21 pass** (persistence, mass-assignment/IDOR, current-cycle freshness, deterministic/AI boundary snapshot, privacy spot-check) |
| `pnpm test:web` (frontend unit) | **506/506 tests pass.** First parallel run reported 3 timeouts (`register-form`, `birth-input-form`, `dashboard-view` — none touch Tử Vi) while running alongside 4 other heavy jobs simultaneously on the same machine; re-run in isolation, all 28 tests in those 3 suites passed cleanly. Classified **ENVIRONMENT_DEFECT (resource-contention flakiness)**, not a regression — not fixed (no code defect exists to fix), noted here for the record. |
| `apps/web` `e2e/flow-30-tu-vi-discovery.spec.ts` (real browser, Playwright) | **5/5 pass** after fixes below (§3) |

## 3. Genuine defects found and fixed this pass

### PRODUCT_DEFECT (1) — duplicate accessibility landmark

**Found via:** live axe scan (`@axe-core/playwright`) on the calculated-chart page — `landmark-unique`
violation (moderate impact), reproducible every time a chart is calculated on `/discover/tu-vi`.

**Root cause:** `TuViTrustSection` (`apps/web/features/tu-vi/components/tu-vi-trust-section.tsx`) is
mounted twice simultaneously on that page — once persistently in `TuViDashboard`, once inline
(`defaultOpen`) inside `TuViChartView`, which renders below the form once a chart exists. The
component used a hardcoded `id="tu-vi-trust-heading"` / `id="tu-vi-trust-body"`, so with both mounted
the page had literal duplicate DOM ids, and axe additionally flagged the two `role="region"` landmarks
as indistinguishable (same accessible name, "AI không an sao cho bạn") even after ids were made
unique.

**Fix (two steps, both required):**
1. `useId()` for both the heading and body ids, so each mount gets a unique DOM id (fixes the
   invalid-duplicate-id issue).
2. A new optional `context` prop rendering a **visually-hidden** (`sr-only`) suffix appended to the
   heading's accessible name only — `TuViDashboard` passes `context="tổng quan"`, `TuViChartView`
   passes `context="kết quả"`. Sighted users see identical visible copy in both places (no product
   copy changed); assistive technology now hears two distinguishable landmarks.

**Files:** `tu-vi-trust-section.tsx`, `tu-vi-dashboard.tsx`, `tu-vi-chart-view.tsx`,
`tu-vi-trust-section.test.tsx` (one assertion updated to not depend on the now-dynamic id).

**Verification:** axe scan re-run post-fix — 0 violations, both in the "accessibility" test and the
"dignity badges" test (both instantiate a calculated chart and scan the results page).

### TEST_DEFECT (5) — all in `apps/web/e2e/flow-30-tu-vi-discovery.spec.ts`, all found via live
browser QA runs (never assumed from memory), all pre-existing in this session's own test file, not
caused by any product-code bug:

1. **Stale `/dashboard` redirect assertion** in the shared `registerAndOnboard()` helper — asserted
   `toHaveURL(/\/dashboard/)` after "Go to Dashboard", but `apps/web/app/(app)/dashboard/page.tsx` is
   a deliberate `redirect('/')` (dashboard consolidated into home route in an earlier sprint, confirmed
   correct/intentional by reading the route file). Fixed to assert the real destination
   (`http://localhost:3000/`).
   - **Scope note:** the identical stale pattern exists in this same helper shape across roughly 29
     other flow spec files in the suite (confirmed via grep for the assertion pattern) — entirely
     unrelated to Tử Vi. Per the master prompt's explicit instruction not to opportunistically refactor
     unrelated code, **only this file was fixed**; the other 29 are flagged here as a real, separate,
     unfixed finding for a future pass.
2. **Stale `/try tử vi lá số/i` link selector** — the Discover hub renders every system card's CTA via
   one shared component (`apps/web/app/(app)/discover/page.tsx:65`, `Mở {system.title}`), so the real
   button text is "Mở Tử Vi Lá Số" ("Open X"), never "Try X". Fixed to `/mở tử vi lá số/i`.
   - **Scope note:** the identical `/try .../` pattern also exists in
     `flow-23-natal-chart-discovery.spec.ts` (`/try bản đồ sao/i`) — unrelated to this pass, **not
     fixed**, flagged here.
3. **Wrong h1 assertion** — all 5 tests asserted `getByRole('heading', { name: 'Tử Vi Lá Số', level: 1 })`
   on `/discover/tu-vi`; the real h1 (via `MvPageHeader` in `tu-vi-dashboard.tsx`) is "Bản đồ vận mệnh
   theo hệ Tử Vi Đẩu Số", with "Tử Vi Lá Số" rendered only as a non-heading eyebrow `<paragraph>`.
   Fixed all 5 occurrences.
4. **Stale English "Hour branch" label** — two assertions (`getByText('Hour branch')`,
   `dt:has-text("Hour branch") + dd`) expected an English label that does not exist; the real dt/dd row
   (`tu-vi-dashboard.tsx:141`) is labeled "Giờ sinh" (Vietnamese, consistent with the rest of that
   list's Vietnamese labels: Mệnh, Thân, Cục, Can Chi năm). Fixed both occurrences; also removed one
   redundant plain-text assertion that had become ambiguous (matched 4 elements including glossary
   prose) once corrected.
5. **Wrong dignity-badge palace assumption** — the "dignity badges" test asserted a dignity badge would
   appear on the Mệnh palace card for VECTOR-B1 (birth 1984-02-02 00:30 Nam). Cross-checked against the
   engine's own regression suite (`apps/api/src/tu-vi/engine/tu-vi-chart.spec.ts:22-34`): Mệnh for this
   exact chart is at Dần, and none of the 14 chính tinh are placed at Dần — this chart is legitimately
   **Vô Chính Diệu** (no main star in Mệnh), a real, correctly-implemented Tử Vi outcome, not a bug. The
   dignity badge only renders when a palace has a main star
   (`tu-vi-palace-grid.tsx:50`), so no badge at Mệnh is correct behavior. Fixed the test to check Tý
   instead, which the same engine regression confirms holds a real chính tinh (Thiên Lương).

**Explicitly not done, per the master prompt's constraints:** no astrology rule was changed from
memory; the Vô Chính Diệu finding above was cross-checked against the existing, already-verified engine
regression suite, not "fixed" by altering engine behavior.

## 4. Live browser QA results (Playwright, real Chromium, real HTTP + real Postgres, no mocking of the
product under test)

All 5 tests in `flow-30-tu-vi-discovery.spec.ts`, final run: **5/5 pass, ~1.4 min total.**

1. **VECTOR-B1 full flow** — real failure state (empty birth date never silently guesses), exact
   deterministic facts (Cục, Mệnh/Thân, all 12 palace labels, Giáp Tý, Giờ sinh Tý) captured and
   compared byte-for-byte before vs. after AI interpretation completes — unchanged, confirming the
   deterministic/AI boundary holds at the full HTTP+browser layer, not just unit/API layers. History
   list, detail view, archive/restore/delete lifecycle all exercised against the real API.
2. **TUVI-GIO-02 midnight boundary** (23:30 birth) — resolves to hour branch Tý (frozen undivided
   23:00–00:59 window), through the real HTTP layer, not re-derived from engine internals.
3. **Accessibility** — `axe-core` scan across 3 states (input form idle, calculated result including
   palace grid + AI section, history list) with `color-contrast` disabled (design-token contrast is a
   separate, already-tracked concern) — **0 violations of any severity** after the fix in §3.
4. **Responsive** — all 11 required breakpoints (1440/1280/1279/1100/1024/900/820/768/767/390/375), no
   horizontal overflow, chart stays legible at every width.
5. **Dignity + Time Cycles current-state UX** — dignity badge present and one of the 5 real states on a
   palace confirmed to hold a chính tinh; Đại Vận tab marked `aria-current="true"` matches an
   **independently computed** range (derived fresh from today's real date via the same Cục-offset
   arithmetic as the engine, never read back from the UI itself); Tiểu Hạn year nav shows real years,
   not the "chưa áp dụng" under-13 state; no internal jargon (`cycleVersion`, `dignityVersion`,
   `CORE_13`) leaks into visible copy.

## 5. Environment note carried forward

The web server under test this pass was `next start` (a production build), not `next dev`. This meant
two of the fixes above (§3 PRODUCT_DEFECT, and by extension its dependent axe-clean state) required an
explicit rebuild + server restart cycle to take effect — source edits alone are invisible to a running
production server. Confirmed via `Get-CimInstance Win32_Process` full command-line inspection before
each restart, never by process name alone. `next build` continues to fail only at the
Windows-symlink-permission "Collecting build traces" step (`EPERM` on `.next/standalone`) — non-blocking,
same precedent-matched signature as prior sessions; compile, typecheck, and all 53 static pages succeed
first every time.

## 6. Servers left running

API (`:4000`) and web (`:3000`, production build reflecting all fixes in this doc) were left running at
the end of this pass for continuity/inspection. No deploy, push, or commit was performed.

## 7. Verdict

**COMPLETE — READY FOR FINAL PRODUCT CLOSURE.**

All required gates for this verdict are met: real browser journey pass, responsive QA pass (11/11
breakpoints), accessibility pass (0 violations, any severity), deterministic/AI boundary pass (byte-for-byte,
both API-layer and now browser-layer), security/mass-assignment pass (API e2e), full regression pass
(backend, frontend, typecheck, lint all green), no P0/P1 defects outstanding. The one PRODUCT_DEFECT
found was fixed and re-verified; all TEST_DEFECTs found in the in-scope file were fixed and re-verified.
Two out-of-scope, pre-existing TEST_DEFECTs were found and explicitly flagged (not fixed, per
instruction) — see §3, item 1 and item 2's scope notes.
