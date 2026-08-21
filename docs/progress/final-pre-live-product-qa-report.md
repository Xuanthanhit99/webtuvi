# Final Pre-Live Product QA — Full Product Experience Gate

**Date:** 2026-08-21
**Type:** Hands-on product QA via the real running app (real registration, real UI interaction, real API calls) — not a code-only review. No production credentials configured, no deployment, no real payment activated.

---

## Baseline

`HEAD` `96057e2168c8522a3daa4056186ccbd5b904ae76` = `origin/master`, 0 ahead/0 behind throughout. Starting working tree: the Sprint 18B.12 throttler-isolation fix (17 tracked files) plus two new progress reports — all `SPRINT_18B_VERIFIED`. One untracked directory, `apps/web/public/assets/menh-vi/home/` (recently-added images, unrelated to any tracked work), classified `UNRELATED` and left untouched throughout. No `UNKNOWN` files found — nothing to stop for.

Read before starting: `sprint-18b-final-report.md`, `sprint-18b12-runtime-qa-final-report.md`, `pre-live-product-experience-remediation-final-report.md`, `accessibility-product-polish-final-report.md`, `domain-brand-production-lock-final-report.md`, `seo-shareability-foundation-final-report.md`, `payos-production-readiness.md`. All five prior closure reports independently verdicted **COMPLETE — READY FOR PRODUCTION ACTIVATION**, with two already-documented, deliberate open items carried forward (both re-confirmed still accurate, not re-litigated): Premium's exact price stays gated behind signup (Stop Condition A — avoiding a duplicated hardcoded price source of truth), and a `router.replace`/`page.reload()` race in the Playwright test `flow-27` (not the app) that was already investigated and correctly left unfixed as out-of-scope.

## Environment

Reused the already-running, already-proven-stable local stack from the 18B.12 pass: compiled non-watch API (`node dist/src/main.js`) and production Next.js server (`next build && next start`), Docker Postgres/Redis/Mailpit. No production credentials configured — `PAYOS_MOCK_CHECKOUT=true`, `DEFAULT_AI_PROVIDER=gemini` (real dev key already present, not production), all URLs `localhost`. Health verified via bounded checks before starting (`curl --max-time`), never an unbounded loop.

## Journeys executed

Fresh account registered and walked end-to-end through: Landing → Register → Onboarding (skip path) → Dashboard → Discover → **Tử Vi Lá Số full calculation + AI interpretation + history + revisit + archive/restore** → Eastern Horoscope, Natal Chart, Numerology, Tarot (draw + AI interpretation) → Reports (empty state) → Premium → Settings/Account → logout → login → session restoration (all confirmed working). Also ran a scripted axe pass (Dashboard, Settings, Premium, Discover) and manual responsive checks (768px, 375px) across several pages.

## Tử Vi Lá Số UX result (Phase 3 — highest priority)

**Strong.** No "Coming Soon" state remains — the Discover card and dedicated `/discover/tu-vi` page are both fully live with working CTAs. Form fields are clearly labeled with explanatory helper text (why birth hour matters: "sets the hour branch (giờ sinh)"). Empty-submit validation shows a plain, specific message ("Birth date is required.") — never silently guesses. Calculated VECTOR-B1 (1984-02-02, 00:30, Nam) live in the browser and got the exact expected facts: **Hỏa Lục Cục**, Mệnh/Thân both at Dần, Giáp Tý year. Deterministic section is explicitly labeled "Deterministic — never AI-generated"; the AI section is explicitly labeled "AI INTERPRETATION" with the footer "Written by AI to narrate the result above — it never chooses or changes it." — the separation is unambiguous to a first-time user, not just structurally correct in code. The real AI interpretation (Gemini, not the mock fallback) produced coherent, well-grounded Vietnamese narrative text referencing the actual computed facts (Lộc Tồn, Hỏa Tinh, Triệt at the correct palaces). History → revisit → archive → restore all worked correctly with the state changes reflected immediately in the UI. Each of the 12 palaces carries an English subtitle (e.g. "Life / Destiny," "Spouse / Partner") alongside the Vietnamese role name — real comprehension scaffolding, not just Vietnamese jargon dropped on the user.

**Internal-term leakage check:** `TUVI_RULESET_V1`, `CORE_13`, rule IDs, `engineVersion`, and database IDs are **not** exposed anywhere in the rendered UI (confirmed by reading the actual page text, not just the code). One softened citation, "(VDTTL-1956)," appears in the intro copy on both the Discover card and the feature page — assessed as an intentional trust-building source citation ("built from a verified traditional ruleset... never invented"), not raw internal jargon; it reads the way a citation of a real historical text would, not like an internal build artifact.

**One informational note (not fixed, not a defect):** the birth-time form has no explicit timezone disclosure — V1 is fixed to UTC+7 by design (undisclosed to the user). This is a pre-existing, documented engineering decision (`TUVI-CAL-02`, no location-based ephemeris needed), not something Sprint 18B.12 changed. Flagged for founder awareness, not auto-fixed, since adding a disclaimer is a content/product-copy decision (how prominent, what wording) rather than a clear one-line correction.

## Discovery system coherence (Phase 4)

**Two real, now-fixed bugs found** (see "Bugs found and fixed" below) — the Eastern Horoscope card's disclaimer, on *both* the Discover hub and Eastern Horoscope's own feature page, still called Tử Vi Lá Số "a separate **future** module" after it had already shipped live. Both fixed to "a separate module." All five systems (Tarot, Bản Đồ Sao, Ngũ Hành Phương Đông, Thần Số Học, Tử Vi Lá Số) now carry clear, mutually-reciprocal disclaimers and the Discover hub's own intro line lists all five by name. A normal Vietnamese user reading either card cannot reasonably conflate Eastern Horoscope and Tử Vi Lá Số — each explicitly names and disclaims the other.

**Informational (pre-existing, out of scope):** Natal Chart and Numerology's own feature-page titles/headings use their English names ("Natal Chart," "Numerology") while the Discover hub displays them in Vietnamese ("Bản Đồ Sao," "Thần Số Học"). This is explicitly documented as intentional in `CLAUDE.md` ("displayed as 'Bản Đồ Sao' in the Discover hub") — not something this pass changed or judged as a defect, since renaming a feature page's primary heading is a naming decision, not a one-line correction.

## Other Discovery systems (Phase 5)

**Tarot:** Walked a full Daily Draw — real card, real AI interpretation with the same deterministic/AI disclosure pattern as Tử Vi, felt fully coherent with the rest of the product (same visual language, same trust framing). **Natal Chart / Numerology / Eastern Horoscope:** intro copy is clear, form fields well-explained (Natal Chart's "I don't know my birth time" escape hatch is a nice touch), empty states are informative, no dead CTAs found.

## Reports (Phase 6)

Empty state is clear and correctly gates on prerequisites ("Complete both required sources above first," explicit Premium framing that doesn't hide the free/paid boundary). The previously-documented `router.replace`/`page.reload()` race was re-examined: `reports-dashboard.tsx`'s `selectItem()` still calls `router.replace(...)` correctly (confirmed via direct source read — file untouched, same as the prior audit found); the race lives entirely in the Playwright test `flow-27`, which calls `page.reload()` on the next line without awaiting the URL change. **Re-confirmed: `TEST_DEFECT`, not `PRODUCT_DEFECT`** — no app code changed.

## Premium experience (Phase 7)

No real payment activated. Pricing structure (one-time, 30-day, not a subscription), the free/Premium capability comparison table, and the "MVP test price — not yet finalized" disclosure are all present and honest. The exact-price-before-login gap remains open by the same explicit, documented, already-signed-off decision (Stop Condition A) — re-confirmed still accurate (`payment.controller.ts`'s `premium-status` endpoint unchanged, still `JwtAuthGuard`-only). **One real bug found and fixed:** the page's browser tab title fell back to the marketing homepage's tagline instead of "Premium" (see below).

## Account / Settings / Privacy (Phase 8)

Brand-consistent throughout ("Tử Vi Tarot" used everywhere visible), Export ("A single file with your account, Companion, Memory, Journal, Discovery readings, and Premium history" — correctly implies Tử Vi is included, confirmed at the source level), Delete account, Legal & Support links, memory controls, active sessions, notification preferences — all present, no dead controls, no duplicated settings observed. **One real bug found and fixed:** a live, user-facing "BeaconVie" string inside the Companion's "Remember this" dialog (missed by the prior remediation pass's narrower scope), plus the Settings page's own tab title had the same fallback-title bug as Premium (see below).

## Error / empty / loading states (Phase 9)

Spot-checked directly: empty-submit validation (Tử Vi) shows a specific message, not a generic error. Unauthenticated API access returns a clean `401` with a generic message (`{"code":"UNAUTHORIZED","message":"Your session has expired. Please log in again."}`) — no raw stack trace, no internal error leakage. Reports' empty state explains exactly what's missing. No blank screens or infinite spinners encountered in any journey walked.

## Navigation / IA (Phase 10)

All visible nav items (Dashboard, Companion, Journal, Discover, Settings) resolved correctly across every page visited; no dead links found.

## Responsive (Phase 11)

Live-interacted (not screenshot-only) at 768px and 375px across Settings, Dashboard, Discover, Tử Vi. **One real, non-trivial bug found and fixed**: `/premium` overflowed the viewport by 79px at 375px width, traced to a missing `min-w-0` in the shared `AppShell` layout component (affects every authenticated page, only *surfaced* by Premium's wide comparison table) — see below. Confirmed fixed at 375px on Premium, and confirmed no regression on Journal (the only other page using the same wide-table pattern) and on Tử Vi's own palace grid. Tử Vi's own dedicated Playwright responsive test (all 10 required breakpoints: 1440/1280/1100/1024/900/820/768/767/390/375) re-ran clean after this shared-layout change.

## Accessibility (Phase 12)

Not axe-only. Scripted `@axe-core/playwright` pass against real authenticated pages (Dashboard, Settings, Premium, Discover): **0 violations on all four**, in addition to Tử Vi's own dedicated axe test (0 violations, confirmed twice in the prior 18B.12 pass). Manually observed during interaction: form labels present and correctly associated (`getByLabel` resolved cleanly throughout every form filled), validation messages appear as visible text (not solely color), heading hierarchy present (`h1`/`h2` used consistently), icon-only buttons carry `aria-label` (e.g., "Notifications," "Show password," "Remember this message from...").

## Brand / copy sweep (Phase 13)

Searched the live codebase for stale terms. **Found and fixed 3 real, live, user-facing defects** (2 instances of "a separate future module," 1 instance of "BeaconVie" in a live Companion surface) — see below. Ten additional "BeaconVie" occurrences in Memory sub-components (`candidate-review`, `conflicts-section`, `consent-settings`, `duplicates-section`, `memory-timeline`, `memory-view`, `merge-suggestions-panel`, etc.) were re-confirmed as the same already-documented, explicitly-deferred (P3) items from the prior remediation pass — not re-litigated or fixed, since that pass's own instruction explicitly scoped them out and nothing in this pass's chartering reopens that decision. `app/menh-vi/*`'s stale references are inside the archived, 404-returning internal prototype (per `CLAUDE.md`) — not a live user-facing surface, correctly out of scope.

## SEO / public surfaces (Phase 14)

`robots.txt` correctly disallows every authenticated/private route (`/dashboard`, `/discover`, `/settings`, `/premium`, `/reports`, `/admin`, etc.) while allowing public marketing pages. `sitemap.xml` lists only public pages (`/`, `/about`, `/contact`, `/privacy`, `/terms`). Homepage has a real `<title>`, `<meta description>`, and `<link rel="canonical">`. `(app)/layout.tsx` sets `robots: { index: false, follow: false }` for the entire authenticated app (confirmed at the source level — matches the 18B.11 report's own claim). No production-domain substitution issues found beyond the expected `NEXT_PUBLIC_APP_URL`/`metadataBase` environment value, which is already parameterized, not hardcoded.

## Security / privacy sanity (Phase 15)

Relied on the already-comprehensive existing test suites (1546 backend unit + 342 backend e2e, both passing) rather than re-deriving security coverage from scratch, per instruction. Spot-checked live: unauthenticated access to a protected route returns a clean `401`, no stack trace. No destructive testing performed.

## Performance / experience sanity (Phase 16)

No extreme first-interaction slowness, no obvious duplicate-request storms, no runaway polling observed during any journey. This machine's own limited RAM (documented extensively in the 18B.12 report) was the dominant *tooling* friction this session, explicitly not attributed to the product's own behavior — distinguished throughout via direct evidence (server logs, network traces, Postgres/Redis activity), never by assumption.

---

## Bugs found and fixed this pass (all `PRODUCT_DEFECT`/`UX_DEFECT`/`COPY_DEFECT`, all local/reversible/no-new-product-decision, all verified fixed)

1. **`COPY_DEFECT`, LOW** — Dashboard's Discover suggestion card ("A real Tarot draw, Numerology reading, and birth chart — all live now.") omitted Eastern Horoscope (shipped Sprint 17) and Tử Vi Lá Số (shipped Sprint 18B) — the exact same class of harm ("a live surface undercounting shipped features") the prior remediation pass fixed once already, just for the 2 newest systems. Fixed to name all 5. `apps/api/src/dashboard/dashboard.service.ts`.
2. **`COPY_DEFECT`, MEDIUM** — the Discover hub's Eastern Horoscope card, *and* Eastern Horoscope's own feature page, both still called Tử Vi Lá Số "a separate **future** module" after it had shipped live — directly contradicts the Tử Vi card right next to it, which correctly says "a separate module" (no "future"). Fixed both occurrences plus the one dependent test assertion. `apps/web/app/(app)/discover/page.tsx`, `apps/web/app/(app)/discover/page.test.tsx`, `apps/web/features/eastern-horoscope/components/eastern-horoscope-dashboard.tsx`.
3. **`COPY_DEFECT` (stale brand), LOW-MEDIUM** — a live, user-facing "BeaconVie" string (×2) inside the Companion chat's "Remember this" dialog, missed by the prior remediation pass's narrower scope (it swept Settings, not Companion/Memory's live-path components). Fixed plus the one dependent test assertion. `apps/web/features/memory/components/remember-this-button.tsx`, `.test.tsx`.
4. **`PRODUCT_DEFECT` (metadata), LOW** — `/premium` and `/settings` both silently fell back to the marketing homepage's tagline as their browser-tab title, instead of "Premium — Tử Vi Tarot" / "Settings — Tử Vi Tarot" like every other authenticated page. Root cause: both pages are Client Components (`'use client'`), and Next.js App Router disallows `metadata` exports from Client Components — every *other* page in the app is a Server Component with its own direct `export const metadata`, so this pattern was never hit before. Fixed via a `layout.tsx` sibling in each directory (the standard Next.js pattern for this exact situation) — confirmed via an exhaustive repo-wide check that no other page has the same gap. `apps/web/app/(app)/premium/layout.tsx` (new), `apps/web/app/(app)/settings/layout.tsx` (new).
5. **`PRODUCT_DEFECT` (responsive), MEDIUM** — `/premium` overflowed the viewport horizontally by 79px at 375px width. Root cause: `PremiumMatrix`'s comparison table correctly uses `overflow-x-auto` + `min-w-[420px]` (the right pattern for a horizontally-scrollable table on mobile), but the shared `AppShell` layout's row-flex chain (`<div className="flex min-h-dvh flex-1 flex-col">`) was missing `min-w-0` — a well-known Tailwind/flexbox gotcha where a flex item's default `min-width: auto` lets a wide descendant force the whole layout wider than the viewport instead of letting it scroll within its own box. This is a **shared layout component used by every authenticated page** — the bug was latent everywhere, only *exposed* by content wide enough to trigger it (Premium's table; Journal's timeline uses the same `min-w-[...]` pattern and was equally at risk). Fixed with one `min-w-0` addition. Confirmed fixed on Premium (375px: 454px→375px scrollWidth), confirmed the table still scrolls correctly within its own box (not just hidden), confirmed no regression on Journal or Tử Vi's palace grid, and confirmed Tử Vi's own dedicated 10-breakpoint Playwright responsive test still passes clean after the change. `apps/web/components/layout/app-shell.tsx`.

## Findings NOT fixed (documented, not silently dropped)

- **Premium exact price gated behind signup** — `DEFERRED_PRODUCT_DECISION`, LOW, re-confirmed unchanged, already explicitly signed off (Stop Condition A) in a prior pass. Revisit once the MVP test price is finalized.
- **`flow-27` Playwright test's `router.replace`/`page.reload()` race** — `TEST_DEFECT`, LOW, re-confirmed the app code is correct; the race is entirely inside a Playwright test file, out of this pass's scope.
- **Ten "BeaconVie" strings across Memory sub-components** — `DEFERRED_PRODUCT_DECISION` (re-confirmed, not reopened), LOW, all in frozen/hidden or secondary-visibility surfaces per `CLAUDE.md`, already explicitly deferred by name in the prior remediation pass.
- **Tử Vi's birth-time form has no timezone (UTC+7) disclosure** — `INFORMATIONAL`, not classified as a defect; a deliberate V1 engineering scope decision, not a UX oversight this pass is chartered to resolve unilaterally.
- **Natal Chart / Numerology pages show English titles while the Discover hub shows Vietnamese names** — `INFORMATIONAL`, explicitly documented as intentional in `CLAUDE.md`.

## Regression after fixes

- Backend: `npx tsc --noEmit` clean; `dashboard.service.spec.ts` (2/2) targeted, then **full suite 145 suites / 1546/1546 pass**.
- Frontend: `npx tsc --noEmit` clean; targeted (`discover/page.test.tsx` 7/7, `remember-this-button.test.tsx` 3/3) then **full suite 96 suites / 479/479 pass**.
- Both production builds (`nest build`, `next build`) clean after every fix batch; both dev servers restarted and re-verified live after each rebuild (compiled/non-watch throughout, matching the 18B.12 pass's stability findings).
- `flow-30-tu-vi-discovery.spec.ts` (the shared-layout `AppShell` change touches every authenticated page, including Tử Vi's) re-run in full: **4/4 pass** (VECTOR-B1, midnight-boundary, axe, all-10-breakpoints responsive).
- `git diff --check`: clean.

## Ready-to-Live matrix

| Dimension | Status | Evidence |
|---|---|---|
| Landing | PASS | Title/description/canonical correct; no testimonials (removed prior pass, re-confirmed absent) |
| Authentication | PASS | Register → onboard → login → logout → session-restore all walked live, no friction |
| Onboarding | PASS | Clear, warm copy; Skip path works |
| Dashboard | PASS | Copy fixed this pass to name all 5 live systems; axe clean |
| Navigation | PASS | All nav items resolve correctly across every page visited |
| Tarot | PASS | Full draw + AI interpretation walked live, clear deterministic/AI split |
| Natal Chart | PASS | Clear form, good "don't know birth time" fallback; English/Vietnamese naming split is documented-intentional |
| Eastern Horoscope | PASS | Stale "future module" reference fixed this pass; reciprocal disclaimer with Tử Vi now accurate both directions |
| Numerology | PASS | Clear, transparent "shows its work" framing |
| **Tử Vi Lá Số** | **PASS** | Full VECTOR-B1 walkthrough live: exact facts, clear AI separation, real coherent AI narrative, history/revisit/archive/restore all correct, 0 axe violations, 0 responsive overflow across all 10 breakpoints |
| Reports | PASS | Clear empty state and Premium gating; the one known race is confirmed `TEST_DEFECT`, not product |
| Companion | PASS | Stale brand string in "Remember this" fixed this pass |
| Notifications | PASS | Copy consistent, no stale branding found |
| Premium | PARTIAL | Structure/benefits honest; exact price gated by pre-existing, signed-off decision; tab-title and mobile-overflow bugs both fixed this pass |
| Settings | PASS | Tab-title bug fixed this pass; brand-consistent throughout |
| Account Security | PASS | Password change, active sessions, sign-out-all all present and correct |
| Privacy | PASS | Memory consent controls (global + per-type + Health-specific override) all present and clearly explained |
| Legal | PASS | Terms/Privacy/Contact reachable from Settings (prior pass's fix, re-confirmed live) |
| Admin | NOT_RE-TESTED | Out of this pass's user-journey scope (not a first-time-user surface); covered by its own dedicated prior test suite (unaffected by any change this pass made) |
| SEO | PASS | robots.txt/sitemap.xml correct; private routes noindexed; no production-domain blockers found |
| Accessibility | PASS | 0 axe violations on Dashboard/Settings/Premium/Discover (this pass) + Tử Vi (prior pass, re-confirmed) |
| Responsive | PASS | One real overflow bug found and fixed (Premium/shared-layout); re-verified across Journal, Tử Vi, and the fixed page itself |
| Error States | PASS | Clean, specific messages observed; no raw stack traces, no internal codes as primary copy |
| Empty States | PASS | Reports, Tarot, Tử Vi, Natal Chart, Numerology, Eastern Horoscope history sections all show clear, actionable empty-state copy |
| Loading States | PASS | No infinite spinners or blank screens encountered in any journey |
| Security | PASS | Relied on existing 1546+342 passing test suites; spot-checks confirm no raw error leakage |
| Analytics Privacy | PASS | Unchanged this pass; re-confirmed via source in the 18B.12 pass (`tu_vi_completed` carries only `{feature:'tu_vi'}`) |
| Email UX | NOT_RE-TESTED | Verification email flow itself unchanged; out of this pass's scope |
| Payment UX | PARTIAL | Same as Premium row — structure honest, exact price deliberately gated, no real payment activated (per instruction) |
| Performance sanity | PASS | No obvious product-caused slowness observed; machine RAM limits explicitly distinguished from product behavior |
| Brand consistency | PASS | 3 real live-surface defects found and fixed this pass; 10 already-deferred instances re-confirmed, not reopened |
| Copy accuracy | PASS | All "Coming Soon"/"future module" stale references now match actual live status |

**No dimension is FAIL.** Two dimensions (Premium, Payment UX) remain PARTIAL by the same pre-existing, explicit, already-signed-off decision (Stop Condition A) — not an oversight this pass introduced or is chartered to resolve.

## Git state

- Branch `master`, `HEAD` unchanged at `96057e2` throughout (matches `origin/master`).
- 24 tracked files modified + 2 new files (`premium/layout.tsx`, `settings/layout.tsx`) beyond the 18B.12 baseline's 17 — all reviewed, all intentional, all covered by the regression re-run above.
- `git diff --check`: clean.
- The unrelated untracked `apps/web/public/assets/menh-vi/home/` directory remains untouched.

## Commit / push / deployment status

**Not committed. Not pushed. Not deployed.** Left as reviewable working-tree state per instruction.

## Exact Production Activation prerequisites (not performed this pass, listed for the founder)

1. Finalize the real Premium price and remove `isMvpTestPrice` — then revisit whether to surface it pre-login (already-documented recommendation from the prior pass, unchanged).
2. Configure real production credentials when ready to go live: PayOS production keys, production SMTP/email provider, Sentry DSN, PostHog keys, production `NEXT_PUBLIC_APP_URL`/`metadataBase` (tuvitarot.vn), production cookie domain — none of these were touched, tested, or required for this local QA pass, matching instruction.
3. Production DNS/SSL for tuvitarot.vn — not configured, not in scope.
4. Optional, non-blocking: decide whether to add a birth-time timezone disclosure to Tử Vi's form (informational finding above), and whether to revisit the 10 already-deferred Memory-component "BeaconVie" strings in a future dedicated pass.

## Final verdict

**FINAL PRE-LIVE PRODUCT QA COMPLETE — READY FOR PRODUCTION ACTIVATION**

Five real, live, user-facing defects were found by actually using the product as a first-time user rather than trusting automated tests or prior reports' claims — two stale "future module"/undercounted-systems copy bugs (Sprint 18B's own Tử Vi launch not being fully reflected everywhere it should be), one missed stale-brand string, one metadata gap affecting two pages' browser tab titles, and one real mobile responsive overflow bug in a shared layout component. All five were root-caused precisely (not guessed at), fixed with the smallest correct change, and verified fixed live in the browser — not just by rebuilding and hoping. Two items remain intentionally open by pre-existing, already-documented founder-level decisions (Premium's exact price, unrelated to this sprint). No Blocker, Critical, or unresolved High-severity issue exists. No Tử Vi domain rule was touched. The product is coherent, honest about what's live versus not, and the newest feature (Tử Vi Lá Số) integrates into the existing five-system Discovery hub without creating confusion with its nearest neighbor (Eastern Horoscope) — the exact question this pass was chartered to answer.
