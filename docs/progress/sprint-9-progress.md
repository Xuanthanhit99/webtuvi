# Sprint 9 — Natal Chart Discovery Foundation — Progress Log

## Baseline (Phase 0 recovery)

- Branch: `master`, up to date with `origin/master`.
- HEAD: `30cdd32` — "check AI". Working tree clean at session start.
- Note: an earlier stub of this file (superseded by this rewrite) recorded HEAD `cc48504` with a
  set of uncommitted changes (`.env.example`, `gemini.provider.ts` model bump to
  `gemini-3.5-flash-lite`, `pricing.ts`, Sprint 8.5 docs). Those changes are now committed as
  `30cdd32` — the working tree is clean and there is nothing left over from that session.
- No `natal`/`astrology`/`horoscope` code exists anywhere in `apps/api/src` or `apps/web` — Sprint
  9 is greenfield, aside from one pre-staged, unused dependency (see below).
- `docs/audit/full-product-feature-gap-audit.md` confirms Natal Chart is currently honestly
  "Coming soon" with no gap found.
- Sprint 8.5 final verdict: **REAL GEMINI VERIFIED — READY FOR SPRINT 9** (`DEFAULT_AI_PROVIDER=
  gemini`, verified via `provider_logs`/`ai_usages`, not response wording).

## Key findings before writing any code

- `circular-natal-horoscope-js@1.1.0` (Unlicense) is already declared in `apps/api/package.json`
  and resolved in `pnpm-lock.yaml`, but is **not installed** in `node_modules` and **not imported
  anywhere** in `apps/api/src` — pre-staged by an earlier session, never wired up. This becomes
  Sprint 9's calculation engine (see `docs/architecture/natal-chart-discovery.md`); resolving it
  only needs `pnpm install`, not a new dependency decision.
- No geocoding capability exists anywhere in the repo. Decision (user-directed): server-side-only
  live Nominatim (OpenStreetMap), behind a `GeocodingProvider` abstraction, opaque-token
  candidate selection (never trusting client-supplied coordinates). Documented in the architecture
  doc.
- Architecture, API routes, lifecycle/history model, and Companion-bridge pattern all mirror
  `apps/api/src/numerology/` (Sprint 8) and `docs/architecture/numerology-discovery.md` as closely
  as the Natal Chart domain allows.

## Plan

Full approved plan: see `docs/architecture/natal-chart-discovery.md` for the calculation-engine
decision, house-system/zodiac-mode product decisions, geocoding architecture, AI boundary, and
golden-vector verification approach.

## Log

- [x] Docs: progress log (this file) + architecture decision doc
- [x] Prisma schema (additive, mirrors Numerology's model shapes) — `prisma validate` passes.
      Migration not yet generated/applied — pending user checkpoint.
- [x] Engine: `NatalChartCalculatorService`, constants, fixed-meaning reference table. Verified via
      ad-hoc smoke test: known-time Hanoi chart, unknown-time degrade (houses/Ascendant → null),
      extreme-latitude degrade (78°N → housesAvailable false). Found and fixed a real
      `tz-lookup` misclassification (Hanoi → `Asia/Bangkok` instead of `Asia/Ho_Chi_Minh`) via a
      documented, tested compensation in `natal-chart-timezone.util.ts` — verified it changes the
      calculated UTC instant for a pre-1975 date and is a no-op for modern dates.
- [x] Geocoding module (Nominatim provider, Redis token cache, `GET /geocoding/search`) — server
      -side only, opaque tokens, never raw coordinates echoed by the client.
- [x] Backend module (record/interpretation/controller) — routes: `POST/GET /natal-charts`,
      `GET /natal-charts/:id`, `GET /natal-charts/:id/history`, `POST /natal-charts/:id/interpret`,
      `/archive`, `/restore`, `DELETE /natal-charts/:id`.
- [x] Companion bridge — `ContextBuilderService` gained a `latestNatalChart` query (Big Three +
      interpretation overview only); `system-prompt.ts` renders it. Existing Companion unit suite
      (23 suites, 176 tests) still green after the fixture updates this required.
- [x] `pnpm typecheck`/`pnpm lint` clean across all new/modified files at every step so far.
- [x] Backend unit tests incl. golden vectors — 8 suites, 91 tests, all passing:
      `natal-chart-birth-input.util.spec.ts`, `natal-chart-timezone.util.spec.ts` (incl. the
      VN historical-offset correction proof), `natal-chart-calculator.service.spec.ts` (golden
      vectors: 2020/2000 March equinox and 2020 June solstice Sun-longitude checks sourced from
      space.com/Wikipedia; Mercury/Venus max-elongation physical-law checks; equatorial
      12-hour-Ascendant-flip symmetry check — plus determinism, degrade-path, and range-sanity
      checks), `natal-chart-meanings.spec.ts`, `natal-chart-enum.util.spec.ts`,
      `geocoding.service.spec.ts`, `natal-chart-interpretation.service.spec.ts` (structured-JSON
      parsing + real `SafetyService` crisis/injection-detector proof), and
      `natal-chart-record.service.spec.ts` (ownership 404s, lifecycle transitions, status-agnostic
      daily ceiling, Free history cap, mass-assignment/AI-boundary proof that interpretation
      writes never touch a calculated field).
      One real finding from the golden-vector work, corrected in the engine itself (not just
      documented): `tz-lookup` misclassifies Hanoi as `Asia/Bangkok`; fixed via a tested
      compensation in `natal-chart-timezone.util.ts`. A second finding, corrected in the test
      itself: a naive "12-hour birth time flip ⇒ ~180° Ascendant shift" assumption only holds
      near the equator — at high latitude (tested: London, 51.5°N) Placidus's real "fast/slow
      house" geometry distorts it to ~127°, which is correct engine behavior, not a bug.
- [x] Migration applied — checkpoint reviewed with user (purely additive: 6 enums, 5 tables, no
      `ALTER`/`DROP` on any existing table) and explicitly approved before running. Applied as
      `20260812033827_natal_chart_discovery_foundation`. `prisma migrate status` confirms the
      schema is in sync. Docker infra (Postgres/Redis/Mailpit) was not running at the start of
      this stage — started via `docker compose up -d` (all three containers healthy) after
      launching Docker Desktop, both ordinary local-dev setup steps per this file's own
      Environment Setup section.
- [x] Discovery entry (`/discover` page flip to `available: true`) + intro copy updated. Premium
      wiring reuses `EntitlementService`/`usePremiumStatus()` exactly as Numerology/Tarot do — no
      new premium-check pattern.
- [x] Frontend feature (`apps/web/features/natal-chart/`) + `/discover/natal-chart` route:
      shared DTOs added to `packages/types`; `natal-chart-api.ts`/`geocoding-api.ts` clients;
      `labels.ts` (planet/sign glyphs, aspect styling, section order); `birth-input-form.tsx`
      (explicit-search geocoding flow — no per-keystroke autocomplete, opaque token only, never
      raw coordinates); `natal-chart-wheel.tsx` (hand-built inline SVG, Ascendant-anchored when
      available else Aries-anchored fallback, all internal elements `aria-hidden` since the real
      accessible equivalent is the sibling list components per Module 13 §20); `big-three-
      summary.tsx`, `planet-list.tsx`, `house-list.tsx` (honest unavailable states, never
      fabricated), `aspect-list.tsx`, `interpretation-sections.tsx` (ten collapsible sections,
      Overview open by default, explicit "written by AI" labeling mirroring Sprint 8.5's
      `AiInterpretation` precedent), `natal-chart-view.tsx`, history list, detail, dashboard.
      All explicit frontend states from the brief's Phase 21 are covered (empty/input/
      validating/calculating/failed/ready/AI not-generated/generating/generated/failed-retry/
      history states/archived/restored) via the existing mutation-state + error-code-mapping
      pattern already established by Numerology's form.
- [x] Frontend component tests — 7 suites, 32 tests, all passing (dashboard, birth-input-form
      incl. the "never per-keystroke, never raw coordinates" proof, wheel, planet/house/aspect
      lists incl. honest-unavailable-state checks, interpretation sections incl. AI-labeling
      check). `pnpm typecheck`/`pnpm lint` clean.
- [x] Full backend regression (95 suites/895 tests) + full frontend regression (66 suites/314
      tests) both green. Two isolated timeouts on the first full-frontend-suite run
      (`register-form.test.tsx` — pre-existing, untouched by this sprint — and one of this
      sprint's own `birth-input-form.test.tsx` cases) were confirmed as resource-contention
      flakiness from running 66 suites in parallel, not real regressions: both pass cleanly
      (15/15) when re-run in isolation immediately after.
- [x] Manual browser verification (desktop/tablet/mobile) — real Postgres/Redis, real Nominatim
      geocoding (resolved "Ha Noi" → "Thành phố Hà Nội, Việt Nam" against the live public API),
      full end-to-end flow: register → onboarding → Discover → Natal Chart form → geocoding
      search/select → calculate → chart wheel + Big Three (Sun Gemini/Moon Sagittarius/Rising
      Libra) + Planets/Houses/Key Aspects sections + honest "interpretation isn't ready yet" state
      (the dev `.env`'s `DEFAULT_AI_PROVIDER=openai` has no billing credits, confirmed via a real
      429 in `provider_logs`-backed observability, and falls back to `mock`, whose generic prose
      correctly fails this feature's strict-JSON parse — exactly the intended non-fabricating
      degrade path, not a bug) → history → tablet layout (clean) → mobile layout.
      **Real finding, fixed**: on mobile, `BirthInputForm`'s "Calculate my chart" button (this
      sprint's own new page) sat ~20px underneath the fixed bottom nav bar after a native
      scroll-into-view (e.g. Tab/keyboard navigation, or any programmatic scrollIntoView) —
      confirmed via precise DOM bounding-box measurement, and confirmed page-specific (not a
      pre-existing/systemic AppShell bug) by measuring Numerology's equivalent, shorter-form
      button, which does not overlap. Root-caused to native scroll-into-view having no awareness
      of the fixed `MobileNavigation` bar, and fixed at the correct shared layer — added
      `scroll-padding-bottom: 5rem` to `html` in `apps/web/styles/globals.css` (reset to 0 at the
      `desktop` breakpoint where the nav is hidden) — verified fixed via the same bounding-box
      measurement (button now clears the nav by ~24px) and confirmed visually via screenshot.
- [x] Security/threat-model pass (folded into the e2e suite below — every bypass attempt is a
      real HTTP call against a real DB, not a code-inspection claim)
- [x] Backend e2e (`test/natal-chart.e2e-spec.ts`, real Postgres/Redis) — 19 tests: unauthenticated
      access, create (incl. mass-assignment hard-rejected by the global `ValidationPipe`'s
      `forbidNonWhitelisted`, malformed/expired location token, impossible/future dates, missing-
      birth-time degrade), AI boundary (interpretation stays honestly null against the generic
      Mock provider — its canned prose never satisfies this feature's strict-JSON schema — and
      every calculated fact is provably byte-identical before/after the interpret attempt),
      lifecycle, ownership/cross-user isolation/IDOR (identical 404s, victim chart provably
      untouched after every rejected cross-user attempt), daily ceiling, and one real-network test
      proving the live Nominatim integration genuinely works. This doubles as the Phase 22
      security/threat-model pass — every bypass attempt above is a real HTTP call against a real
      DB, not a code-inspection claim. Full backend e2e suite (16 suites/208 tests) still green.
- [x] Playwright `flow-23-natal-chart-discovery.spec.ts` written and run against real production
      builds (checkpoint approved by user).
- [x] Production build + full Playwright suite (checkpoint approved by user). Hit and resolved
      real infrastructure issues along the way (disclosed, not hidden): (1) the first `next start`
      silently ran against a stale leftover dev-server process still holding port 3000 (killed via
      Windows `taskkill`, not found by `lsof` in this shell) — the *second* `next start` attempt
      then failed with a corrupted `.next` build (mixed dev/build artifacts from the earlier stale
      process), fixed with a clean `rm -rf .next && next build`; (2) `flow-23` itself then failed
      three times in a row, and **every one of the three was a real bug in the test, not the
      product** — verified by reading the actual DOM snapshot Playwright captures on failure each
      time, never assumed: (a) `getByText('SUN', {exact:true})` doesn't match the real DOM text
      "Sun" (only CSS `text-transform: uppercase` makes it *look* like "SUN"); (b) fixing that
      exposed a genuine strict-mode collision ("Sun" legitimately appears in both the Big Three
      block and the Planets list) — fixed by adding `role="group" aria-label="Big Three"` to
      `BigThreeSummary` (a real accessibility improvement, not just a test hook) and scoping
      locators to it or to the Planets section's own `id`; (c) a `page.reload()` assertion assumed
      the just-calculated reveal persists across reload, but (like `NumerologyForm`) that reveal is
      local component state — reload correctly returns to the form+history dashboard, and the fix
      was asserting against the History list (which flow-22 does too, just via an incidental double
      match) rather than the reveal view. Final result: **26/32 passed** — `flow-23` passes cleanly
      end-to-end (real Nominatim search included); all 6 failures are in frozen, pre-existing
      modules never touched this sprint (Companion+Memory integration, Reflection, Insight,
      Review) — consistent with (slightly better than) Sprint 8's own documented baseline
      ("26/31... pre-existing flakiness in frozen, out-of-scope modules").
- [x] Real-Gemini smoke test (checkpoint approved by user — real cost incurred, one call).
      Temporarily set `DEFAULT_AI_PROVIDER=gemini` in `apps/api/.env`, restarted the API, created
      one real chart (Hà Nội, 2000-06-15 14:30) through the real HTTP API end-to-end (real
      Nominatim geocoding token, not seeded). Verified via `provider_logs` (never response
      wording): `provider=GEMINI, model=gemini-3.5-flash-lite, success=true, latencyMs=5364`.
      Gemini's real output satisfied the strict-JSON section schema on the first attempt — a
      genuine generated interpretation was persisted (not just the "not ready" fallback state).
      Confirmed the calculated chart facts (`placements`/`houses`/`aspects`/`ascendant`/
      `midheaven`) are byte-identical in the API response before and after the interpretation
      call — Gemini did not and structurally cannot mutate them (the interpretation write path
      only ever touches the `interpretation`/`interpretedAt` columns). `ai_usages` had no matching
      row for this call — consistent with that table tracking Companion-conversation calls
      specifically, not Discovery-feature interpretation calls (no Tarot/Numerology/Natal-Chart
      interpretation call has ever produced an `ai_usages` row either); `provider_logs` alone is
      unambiguous and sufficient per the brief's own "provider_logs / ai_usages" wording. Reverted
      `.env` to `DEFAULT_AI_PROVIDER=openai` immediately after and restarted the API back to its
      normal configuration. `GEMINI_API_KEY` was never printed at any point.
- [x] Multi-viewport manual verification — desktop/tablet/mobile all reviewed via real screenshots
      during Stage 2 (see above); one real mobile bug found and fixed (bottom-nav overlap).
- [x] Full regression + final report — `prisma validate` (pass), `prisma migrate status` (up to
      date), API lint (0 errors; fixed 1 real warning — unnecessary `eslint-disable-next-line
      no-console` in `natal-chart.e2e-spec.ts`), web lint (0 errors, 1 pre-existing harmless
      config warning on `globals.css`), API typecheck (exit 0), web typecheck (exit 0),
      `git diff --check` (clean, only pre-existing LF/CRLF warnings, no conflict markers/
      whitespace errors), secret scan across every file this sprint touched (no API keys/tokens/
      private keys found; the one `password = 'Sup3r$ecretPass'` hit in
      `natal-chart.e2e-spec.ts` is the identical shared test-fixture constant already used
      verbatim in all 15 other `apps/api/test/*.e2e-spec.ts` files, not a real secret). See
      `docs/progress/sprint-9-final-report.md` for the full structured report and final verdict.

## Independent release closure (2026-08-13)

- [x] Full independent re-verification performed without trusting the above report's own claims:
      re-ran every test suite fresh, re-read every changed file, empirically probed the
      astrology library's aspect-dedup behavior, made a second independent real Gemini call, and
      did fresh manual browser verification. No Blocker/High defects found.
- [x] Two real, narrow, LOW-severity findings surfaced and disclosed (chart-wheel 0°/360°
      collision-easing gap; tablet-width scroll-to-card-text nav-overlap distinct from the
      already-fixed submit-button case) — both documented, neither fixed (out of safe same-
      session scope; see final report §49 for the recommended follow-up).
      Two documentation-only defects were fixed directly: an undisclosed approximate-birth-time
      gap was added to the architecture doc's deferred list, and a stale `bodyA`/`bodyB` field
      naming + inaccurate "planet/node/Lilith" claim were corrected.
- [x] Root-caused and fixed an `npx playwright` CLI version-drift issue (1.62.1 vs the repo's
      pinned 1.62.0) that was causing every Playwright spec — not just flow-23 — to fail with a
      misleading `test.describe.configure()` error; switched to the local binary for the
      remainder of the closure session. Confirmed this is a session-environment issue, not a
      repo/CI defect.
- [x] Full backend e2e re-run: 4/16 suites failed on the first parallel pass (Companion+Memory,
      Review, Insight, Account-Security — none touch Natal Chart), then passed 4/4 (59/59 tests)
      when re-run in isolation — proven resource-contention flakiness, not a regression.
- [x] Full Playwright re-run (fresh production build): 26/32, flow-23 stable across 4 runs, the
      6 failures cross-verified as pre-existing/environment-driven (same failure-category
      composition as both this sprint's own original implementation-session result and Sprint
      8's separately-documented baseline; confirmed severe memory pressure — 18 zombie Chromium
      processes, ~1.1GB free RAM, one stale `nest start --watch` process running since 11:39 AM —
      during the noisiest retries).
- [x] Second independent real Gemini smoke test: PASS, `provider_logs` confirms a distinct new
      `GEMINI`/`gemini-3.5-flash-lite` row, chart facts byte-identical before/after.
- [x] **Final verdict: READY FOR SPRINT 10.** See `docs/progress/sprint-9-final-report.md` for
      the full 50-item closure report.

(Entries below are appended as each step completes, with concrete results/blockers.)
