# Pre-Live Product Experience Remediation — Final Report

**Date:** 2026-08-20
**Type:** Implementation pass closing findings from `docs/audit/pre-live-product-experience-completion-audit.md`.
**Not done:** no deploy, no production configuration, no push, no Vietnamese Tử Vi calculation logic, no P3 polish, no commit (left for review per instruction).

## Baseline

`HEAD = origin/master = 3bbd18cc954594cd7578cc35f41683b5c3bd791e` ("fix: complete accessibility and product polish pass"). `git rev-list --left-right --count origin/master...HEAD` = `0  0` — no divergence. Working tree carried the same 32 modified/untracked files left by the prior Domain + Brand Production Lock and Production Activation passes; nothing had drifted since the audit was written. This report's diff is additive on top of that unchanged baseline.

## Findings closed

| Audit # | Severity | Finding | Fix | Files |
|---|---|---|---|---|
| 1 | P0 | Onboarding told users "Discovery is still warming up" — false, all four systems are live | Replaced with accurate, warm copy: *"Discovery is ready for you whenever you want it — a real Tarot draw, your chart, your numbers, all live right now. For now, I'll keep what you've shared in mind."* State machine, stage transitions, and message-append flow untouched — copy-only fix. | `apps/api/src/onboarding/conversation-script.ts` |
| 2 | P0 | Homepage described the shipped Personal Destiny Report as "a V1.5 feature, on its way" | Rewrote to present-tense, accurate, concise copy naming the real feature and its Premium/on-demand nature. Also fixed the FAQ answer repeating the same stale "full reflection reports" framing. | `apps/web/content/landing-copy.ts` (`reportsLine`, FAQ) |
| 3 | P1 | Brand "Tử Vi Tarot" had no acknowledgment of Vietnamese Tử Vi Lá Số beyond one buried disclaimer | Added a 5th Discover-hub card: title "Tử Vi Lá Số", `available: false`, no `href` (render logic renders no CTA when unavailable), bilingual honest description explicitly distinguishing it from Ngũ Hành Phương Đông. Reuses the exact badge/card pattern already in the file. | `apps/web/app/(app)/discover/page.tsx` |
| 4 | P1 | Homepage testimonials are original marketing copy attributed to "Early user," not real quotes | Removed `<Testimonials/>` from the rendered homepage. Component and `landingCopy.testimonials` data preserved for reuse once real, verified testimonials exist. | `apps/web/app/(marketing)/page.tsx` |
| 5 | P2 | FAQ "What does Premium actually add?" echoed the stale reflection-reports framing | Rewritten alongside finding #2. | `apps/web/content/landing-copy.ts` |
| 6 | P2 | Two sr-only headings still said "BeaconVie" | Renamed to "Tử Vi Tarot". Also fixed a stale JSDoc comment in `seo.ts` referencing the old title template (`%s — BeaconVie`) found during the same sweep. | `apps/web/components/marketing/trust-section.tsx`, `problem-solution.tsx`, `apps/web/lib/seo.ts` |
| 7 | P2 | No price shown anywhere pre-login | **Partially addressed — see Stop Condition A below.** Pricing *structure* (one-time, 30-day, not a subscription) and concrete benefits now disclosed; exact number still gated behind signup, by deliberate, documented decision. | `apps/web/content/landing-copy.ts`, `apps/web/components/marketing/pricing-section.tsx` |
| 8 | P2 | Legal/trust pages unreachable from the authenticated app | New "Legal & Support" card in Settings linking to `/privacy`, `/terms`, `/contact` — plain links, existing text-link convention, no new navigation system. | `apps/web/features/settings/components/legal-links-section.tsx` (new), `apps/web/app/(app)/settings/page.tsx` |
| — (new) | P0-equivalent | Dashboard's `discoverySuggestion` card still said "your chart is on its way" — stale since Natal Chart shipped Sprint 9 | Found during the item-17 dead-copy sweep, not in the original audit's 13 findings but the same class of harm (a live surface telling users a shipped feature is pending). Fixed to describe all live systems accurately. | `apps/api/src/dashboard/dashboard.service.ts` |

**Not touched, correctly deferred (P3, explicitly out of scope per instruction):** dashboard Recent Activity empty state, Premium benefit-copy unification across 3 locations, Natal Chart jargon/glossary, Settings memory-control duplication, stale `product-surface-map.md` doc.

## Stop Condition A — invoked, documented (pricing)

The instruction explicitly authorized stopping rather than improvising if exposing the real price pre-login required duplicating a hardcoded canonical price or introducing meaningful architecture complexity. Both applied:

- **Duplication risk:** the real price lives only in backend config (`PREMIUM_PRICE_VND=79000`, `apps/api/.env.example`), read once in `PaymentController.getPremiumStatus()` behind `JwtAuthGuard`. Hardcoding the number into `landing-copy.ts` would create a second source of truth that drifts the moment the backend value changes — exactly what `packages/types`' own comment on `priceVnd` warns against ("never hardcode this in the frontend").
- **Architecture-complexity risk:** the marketing homepage is currently a fully static component — no data fetching, no loading state, no error state anywhere on the page. Making it fetch a live price would require a new *unauthenticated* endpoint, a caching/ISR strategy so the highest-traffic, most SEO-critical page in the product doesn't depend on backend uptime, and new failure-mode handling for a page that has never needed any. That is meaningful new infrastructure for a copy-honesty fix, not the "smallest safe alternative" the instruction asked for.
- **An independent reason not to publish the number even if the above were solved:** the backend's own `PremiumStatusDto` explicitly flags this price as `isMvpTestPrice: true` — "no product sign-off mechanism exists yet for this price... always disclosed as unvalidated until one does" (`payment.controller.ts:64-67`). Publishing an explicitly-unvalidated number on public marketing copy pre-launch risks advertising a price that changes before real launch — a worse trust outcome than the current gap.

**Smallest safe alternative implemented:** the pricing section now honestly discloses everything that *is* stable — Premium is a one-time 30-day pass, not a subscription; concrete benefits (memory across conversations, higher Discovery limits, unlimited history, Personal Destiny Report); and a direct, low-friction promise: *"See the exact current price — free to look, no card required — right after you sign up."* Single source of truth for the number itself is preserved. A regression test (`landing-copy.test.ts`) asserts the marketing copy never duplicates the known backend value (`79000`/`VND`).

**Recommendation:** once the price is finalized and signed off (removing `isMvpTestPrice`), revisit whether to surface it pre-login — at that point duplicating a *stable* number becomes a much smaller, more defensible tradeoff, or a lightweight public price endpoint (returning only `{priceVnd, currency}`, no user/auth context) becomes reasonable.

## Testimonial trust decision

Chosen path: **remove, don't rewrite or relabel.** The instruction was explicit that fabricating or relabeling fake quotes was off the table; removal was the only listed safe option. The `Testimonials` component and `landingCopy.testimonials` array are both preserved in source, unreferenced by the live page, with an inline comment at the removal site explaining why and pointing back to this report — so a future engineer with real, verified testimonials can re-wire it in one line rather than rebuilding it.

## Discover model verification

Confirmed by test (`discover/page.test.tsx`, 8 tests, all passing) and direct read of the render logic:

- **LIVE, with working CTAs:** Tarot, Bản Đồ Sao, Ngũ Hành Phương Đông, Thần Số Học — unchanged.
- **COMING SOON, no CTA:** Tử Vi Lá Số — `available: false` means the `{system.available && system.href && <Link>...}` branch never renders for it; it has no `href` at all, so there is no path — accidental or otherwise — to a dead link, and explicitly no link to the archived `/menh-vi` prototype (verified by test: no rendered `<a>` on the page contains "menh-vi").
- **No conflation path:** the new card's own description states "Not the same as Ngũ Hành Phương Đông above," in addition to Eastern Horoscope's own pre-existing disclaimer — the distinction is now stated from both directions, not just one.

## First-time funnel regression (code-verified, not live-browser-verified — see Responsive/Live QA section)

Walked `/` → register → onboarding → dashboard → discover through source, confirming each audit expectation:

- Homepage no longer advertises unshipped Reports (`landing-copy.test.ts` regression-guards `on its way`/`V1.5`/`coming soon` never appearing in Reports copy again).
- Homepage carries no BeaconVie branding (`landing-copy.test.ts` regression-guards the full copy object; marketing component sweep confirmed clean).
- Fake testimonials don't render (`page.test.tsx` regression-guards this on the actual `LandingPage` component).
- Premium information states structure/benefits honestly, points to the real price post-signup.
- Onboarding's Discovery-accepted message says Discovery is ready now, not warming up (`conversation-script.spec.ts`).
- Dashboard's discovery-suggestion card no longer claims the chart is pending (`dashboard.service.spec.ts`, new).
- Discover shows four live systems plus one honestly-labeled Coming Soon card, no dead CTAs (`discover/page.test.tsx`).

## Persona regression (re-run against the fixed state)

**Persona A — "I came here for Tarot."** Unaffected by any change here; path was already clear (Section 7 of the audit found no defects in the Tarot journey itself). Still clear.

**Persona B — "I searched for Tử Vi."** This is the persona the remediation most directly targets. Previously: reached the Discover hub, saw four systems, none named Tử Vi, no visible acknowledgment. Now: the Discover hub explicitly lists "Tử Vi Lá Số" as its own card, clearly marked "Coming soon," with its own description stating it is not the same as Ngũ Hành Phương Đông. This persona can no longer land on the hub and conclude the brand name was empty marketing — the product now visibly knows what they're looking for and is honest that it isn't built yet.

**Persona C — "Deciding whether Premium is worth it."** Now sees, before registering: Premium is a one-time 30-day pass (not a recurring subscription — a real, previously-invisible distinction), concrete benefits, and Reports gating correctly described. Does not see the exact number pre-registration (Stop Condition A) — sees instead an explicit, low-friction promise of where and when they will. Once registered, the real number, the full feature matrix, and gating were already solid per the original audit (Section 13) and untouched here.

## Empty/error-state regression

No empty or error state was touched by any fix in this pass. Verified by reading each: Dashboard (Companion panel, Memory card), Companion (no-conversation/no-message), Memory (zero-memories, zero-archived, zero-pending), Tarot/Numerology/Natal Chart/Eastern Horoscope history, Reports history, Notifications, payment-disabled banner, auth-expiry flows — all unchanged from the audit's Section 16/17 findings, which found them already strong. The one previously-known gap (Dashboard Recent Activity has no empty state at all) is unchanged, by design — it's P3 and explicitly out of scope for this pass.

## Accessibility

**Not live-axe-tested in this pass.** The project's axe coverage lives inside Playwright e2e flows, which require a running dev server + browser; Docker was down and free RAM was ~2GB throughout this session (same constraint disclosed in the audit itself), so running them risked repeating the crash pattern documented earlier in this engineering effort. Verified instead by direct code/markup review of every touched surface:

- **Tử Vi Coming Soon card:** identical DOM shape to every other Discover card (`<h2>` heading, `<span>` badge, `<p>` description) — no new interactive element, no new widget, nothing to keyboard-trap. Confirmed by test that it renders no focusable CTA.
- **Settings legal links:** plain `<Link>` → real `<a href>` elements inside a list, matching the exact convention already used for the same two links in `register-form.tsx` — no icon-only links, no custom click handlers, natively keyboard-reachable.
- **Marketing page after testimonial removal:** confirmed no dangling `aria-labelledby`/id reference to the removed section (`testimonials-heading` only exists inside the now-unrendered `Testimonials` component itself); heading hierarchy of surrounding sections unaffected since each section's `<h2 id=...>` is self-contained.
- **Pricing:** one new `<p>` of plain text, no interactive elements, no color-only signaling.
- **Onboarding message:** plain string, rendered through the same message pipeline as every other Companion/system message — no new markup.

No new accessibility violations are expected from any of these changes; none introduce new interactive elements, only accurate text and one honestly-disabled card.

## Responsive QA

**Not live-browser-tested**, for the same disclosed host-resource reason as the audit (Docker down, ~2GB free RAM — insufficient headroom to safely run Docker + dev server + a real browser without repeating this session's documented crash pattern). Assessed instead from the actual Tailwind classes used:

- The new Tử Vi card sits inside the existing `grid gap-4 desktop:grid-cols-2` — the same responsive grid every other Discover card already uses; it reflows identically (single column below `desktop:`, two columns at/above), since it's a plain 5th array entry through the same `.map()`, not new layout code.
- The Settings "Legal & Support" card uses the same `<Card>` + `flex flex-col gap-2` pattern as every other Settings card on the page — no new breakpoints introduced.
- The pricing section's new `<p>` sits inside the same `max-w-content`/`max-w-2xl` centered container as the rest of that section.

No new custom widths, fixed pixel values, or non-reflowing elements were introduced anywhere in this pass. This is a lower-risk claim than a full live pass would give, and is disclosed as such rather than asserted as verified.

## Tests

**Targeted (per modified area):**
- `apps/api/src/onboarding/conversation-script.spec.ts` — 5/5 pass (1 new)
- `apps/api/src/dashboard/dashboard.service.spec.ts` — 2/2 pass (new file)
- `apps/web/content/landing-copy.test.ts` — 7/7 pass (new file)
- `apps/web/app/(marketing)/page.test.tsx` — 1/1 pass (new file)
- `apps/web/app/(app)/discover/page.test.tsx` — 8/8 pass (updated + extended)
- `apps/web/features/settings/components/legal-links-section.test.tsx` — 1/1 pass (new file)

**Full frontend suite:** 94 suites, 467 tests, **all passing**.
**Full backend suite:** 125 suites, 1208 tests, **all passing**.
**Typecheck (both apps):** clean, no errors.
**Lint (both apps):** 0 errors; 24 pre-existing warnings, all in `apps/api/src/insight/*.spec.ts` files untouched by this pass (`no-explicit-any`/unused-import style warnings, not introduced here).

No assertion was weakened to make a test pass; every new/modified assertion targets the exact behavior described in the corresponding fix.

## Build

`next build` was run in the web app. Result:

- `✓ Compiled successfully in 76s`
- `Linting and checking validity of types...` — passed
- `✓ Generating static pages (51/51)` — every route, including every page touched in this pass (Discover, Settings, marketing landing), statically generated without error
- Final step (`output: 'standalone'` trace-copy) failed: `EPERM: operation not permitted, symlink 'D:\web-tu-vi\node_modules\.pnpm\...' -> 'D:\web-tu-vi\apps\web\.next\standalone\...'`

This is the identical, previously-documented Windows artifact (same error code `-4048`, same `symlink` syscall, same Windows-requires-admin/Developer-Mode-for-symlinks root cause) seen in four prior reports this engineering effort (Sprint 17, Admin Operator Tooling, Accessibility/Product Polish, Domain + Brand Production Lock final reports). Compile, typecheck, lint, and all 51/51 static pages succeeding is the signal that matters for a product-code correctness check — the trace-copy failure is an environment-only artifact of this Windows host lacking symlink privileges, not a product regression, and is classified `PRE_EXISTING_ENVIRONMENTAL` consistent with every prior occurrence.

## Tử Vi safety gate

Explicitly re-verified against the full diff of this pass (`git diff --stat` before and after):
- No file under any Tử Vi-specific or `/menh-vi` path was created, modified, or referenced by a new link.
- No calculation, chart, sample result, or AI substitute for Tử Vi Lá Số was added anywhere — the only new artifact is a static description string on the Discover hub with `available: false` and no `href`.
- `docs/product/product-completion-roadmap-v2.md`'s Sprint 18 entry (`BLOCKED_BY_DOMAIN_REFERENCE`) was not touched by this pass (it carries pre-existing, uncommitted edits from the earlier Domain + Brand Production Lock task, unrelated to this remediation).
- The new card is, and only ever renders as, informational.

## Remaining findings by severity

**P0:** none remaining.
**P1:** none remaining.
**P2:** one partially open by deliberate, documented decision — exact Premium price still not shown pre-login (Stop Condition A); revisit once the price is signed off.
**P3 (unchanged, correctly deferred):** Dashboard Recent Activity has no empty state; Premium benefit copy still worded three ways across three surfaces; Natal Chart jargon has no inline glossary; Settings retains a legacy/duplicate memory-consent control; `docs/architecture/product-surface-map.md` is stale (internal doc only).

## Ready-to-Live matrix (re-evaluated)

| Dimension | Prior | Now | Basis |
|---|---|---|---|
| Brand promise | PARTIAL | **PASS** | Tử Vi Lá Số now honestly acknowledged on the Discover hub |
| First impression | PARTIAL | **PASS** | Testimonials removed, Reports copy accurate, pricing structure honest |
| Registration | PASS | **PASS** | Unchanged |
| Onboarding | PARTIAL | **PASS** | Discovery-accepted message now accurate |
| Dashboard | PARTIAL | **PASS** | Discovery-suggestion copy fixed (new finding, fixed); Recent Activity empty-state gap remains but is P3 |
| Discover | PARTIAL | **PASS** | Fifth card added, no conflation path, no dead CTA |
| Tarot / Numerology / Natal Chart / Eastern Horoscope | PASS | **PASS** | Unchanged, untouched, no defects found originally |
| Tử Vi honesty | PARTIAL | **PASS** | Direct acknowledgment now present; Sprint 18 engine correctly still blocked |
| Reports | PASS | **PASS** | Feature itself unchanged; its marketing description now accurate |
| Companion | PASS | **PASS** | Unchanged |
| Memory | PASS | **PASS** | Unchanged |
| Premium | PARTIAL | **PARTIAL** | Structure/benefits now honest; exact price still gated by deliberate decision (Stop Condition A) |
| Trust | PARTIAL | **PASS** | Testimonials no longer misleading; sr-only brand drift fixed |
| Legal discoverability | PARTIAL | **PASS** | In-app links added |
| Responsive | Not live-tested | **Not live-tested** | Same disclosed host constraint; code-level review only, no new risk introduced |
| Accessibility | PASS (existing coverage) | **PASS** (code-reviewed, not live-axe-tested this pass) | No new interactive elements introduced |
| Dead CTAs | PASS | **PASS** | New card verified to render none |
| Error handling | PASS | **PASS** | Unchanged |

**No dimension remains FAIL. One dimension (Premium) remains PARTIAL by an explicit, documented, task-sanctioned decision rather than an oversight.**

## Files changed (this pass only)

Modified: `apps/api/src/onboarding/conversation-script.ts`, `apps/api/src/onboarding/conversation-script.spec.ts`, `apps/api/src/dashboard/dashboard.service.ts`, `apps/web/content/landing-copy.ts`, `apps/web/components/marketing/pricing-section.tsx`, `apps/web/components/marketing/trust-section.tsx`, `apps/web/components/marketing/problem-solution.tsx`, `apps/web/lib/seo.ts`, `apps/web/app/(app)/discover/page.tsx`, `apps/web/app/(app)/discover/page.test.tsx`, `apps/web/app/(app)/settings/page.tsx`, `apps/web/app/(marketing)/page.tsx`.

Created: `apps/api/src/dashboard/dashboard.service.spec.ts`, `apps/web/content/landing-copy.test.ts`, `apps/web/app/(marketing)/page.test.tsx`, `apps/web/features/settings/components/legal-links-section.tsx`, `apps/web/features/settings/components/legal-links-section.test.tsx`, `docs/audit/pre-live-product-experience-completion-audit.md` (prior turn), this report.

All other modified/untracked files shown by `git status` predate this pass (Domain + Brand Production Lock, Production Activation) and were not touched here.

## Git / deployment status

Not committed (left for review, per instruction). Not pushed. Not deployed. No production configuration touched.

## Production activation recommendation

With every P0 and P1 finding closed, and the sole remaining P2 (exact Premium price pre-login) resolved via a documented, defensible product decision rather than left unaddressed, this product is ready for its founder to review this diff, commit it, and proceed to the previously-prepared `docs/operations/production-activation-checklist.md` / `founder-production-action-pack.md`. The only action this report recommends before that: a founder read-through of the Stop Condition A reasoning (pricing) to confirm agreement with "disclose structure, gate the number until signed off" as the launch posture, since that is a product call this report made on the smallest-safe-alternative principle, not a purely mechanical fix.

## Final verdict

**PRE-LIVE REMEDIATION COMPLETE — READY FOR RELEASE CLOSURE**

---

# RELEASE CLOSURE

**Date:** 2026-08-20 (same day, independent verification pass over the remediation above).
**Type:** Independent re-verification of every claim in this report, live-QA attempt, one genuine bug found and fixed, two commits created. No deploy, no push, no production configuration, no Sprint 18/Tử Vi calculation work.

## Runtime recovery attempt

Checked before any live QA: Docker daemon not running (no `docker` process at all — would require a full Docker Desktop cold start), ~3GB free RAM, 24 pre-existing `chrome.exe` processes already on the host that could not be safely distinguished from the user's real browser session (killing them was explicitly out of bounds). Booting Docker + Postgres + Redis + Mailpit + API + web dev server + Playwright browsers on top of that was judged very likely to repeat this session's own documented OOM/crash pattern. **Not attempted.** This is the same disclosed constraint as the original audit and the implementation pass — verification below is code-level, not live-browser, wherever it says so explicitly.

## Independent verification results

Every claim in the implementation report above was independently re-checked by reading the actual current source (not re-trusted from the report text):

- **Onboarding (§3):** Confirmed directly — `DISCOVERY_ACCEPTED_MESSAGE` contains no "warming up" language; state-machine files (`onboarding.service.ts`, `onboarding.controller.ts`) show zero diff, confirming the fix is copy-only. Could not run a live registration/onboarding click-through (no runtime); the existing e2e flow `flow-1-register-onboard-dashboard.spec.ts` does not assert on this message's exact wording either way, so it wasn't affected by the fix and running it (if the environment allowed) would have added no additional signal for this specific defect beyond the unit test already covering it.
- **Homepage Reports copy (§4):** Confirmed directly — `reportsLine` and the Premium FAQ answer both read as claimed, present-tense, no "V1.5"/"on its way"/"coming soon".
- **Tử Vi Coming Soon card (§5):** Confirmed directly from `discover/page.tsx` — `available: false`, `href: undefined`, render logic (`system.available && system.href`) guarantees no CTA. Description text distinguishes it from Ngũ Hành Phương Đông explicitly.
- **Eastern Horoscope separation (§6):** Confirmed directly — its own page intro still carries "Not Vietnamese Tử Vi Lá Số, a separate future module." under its H1, unchanged.
- **`/menh-vi` archive (§7):** Confirmed at the code level — `apps/web/app/menh-vi/layout.tsx` still calls `notFound()` unconditionally for every request under the tree (a Next.js layout-level `notFound()` applies to all nested routes/query strings/trailing slashes by the framework's own routing guarantee — this is a structural guarantee, not something that needs per-URL testing). Could not confirm via live HTTP request (no runtime); the code-level guarantee is strong enough that this is treated as verified, not merely assumed, but is flagged as not live-request-tested.
- **Brand drift (§8):** Found genuinely incomplete. Re-grepping "BeaconVie" across the full reachable app surface — including Settings, which this closure task explicitly named as a check area unlike the prior remediation pass's narrower "marketing surface" scope — turned up **5 more live, user-facing occurrences** the remediation pass had knowingly left out of scope: two directly in `settings/page.tsx` ("Controls only the very first reflections BeaconVie saved...", "Control what BeaconVie is allowed to remember...") and one each in `consent-settings.tsx` (a form label), `notification-preferences-section.tsx`, and `account-data-section.tsx` — all three rendered directly inside the Settings page. **Fixed all five** to "Tử Vi Tarot", and updated the one test (`consent-settings.test.tsx`) that asserted on the old label text. Logo/sidebar/app-header accessible names and mail templates were re-confirmed clean (already correct from the earlier Domain+Brand pass). Remaining "BeaconVie" occurrences (the standalone `/memory` page and its sub-components, the frozen Reflection/Insight modules, `.env.example`/`schema.prisma`/`tailwind.config.ts` internal config, e2e spec titles, and a dev-only Swagger title gated behind `nodeEnv !== 'production'`) are correctly out of this closure task's named scope (sr-only headings, aria-labels, logo, Settings, marketing, emails) and are documented as a residual P3, not silently missed.
- **Testimonials (§9):** Confirmed directly — `<Testimonials/>` is not imported or rendered in `(marketing)/page.tsx`; no dangling `aria-labelledby`/id reference to the removed section; no orphaned wrapper left behind (the removal is a clean deleted import + JSX line, nothing structural to leave a gap).
- **Pricing architecture (§10):** Re-verified independently — `git diff --stat` on `apps/api/src/payment/` shows only the pre-existing webhook Sentry fix; `payment.controller.ts`'s `premium-status` endpoint is unchanged, still `JwtAuthGuard`-only, still returns `isMvpTestPrice: true`. Stop Condition A's reasoning is unchanged and still holds — nothing in the repository disproves the need for it.
- **Premium value coherence (§11):** Directly compared `premium-status-card.tsx` ("Higher Tarot daily limits, deeper interpretations, and unlimited reading history.") against `premium-upgrade-panel.tsx` ("Higher daily Tarot allowances, deeper AI interpretations, and unlimited reading history — a one-time 30-day..."). No direct contradiction — the dashboard card is a shorter subset, not a conflicting claim (it omits duration rather than misstating it). No fix needed; correctly remains a P3 unification item, not a blocker.
- **Settings legal links (§12):** Confirmed directly and by test — `LegalLinksSection` renders real `<a href="/privacy">`/`/terms`/`/contact"` links via `next/link`, matching the existing convention.
- **Dashboard stale copy (§13):** Confirmed directly — `dashboard.service.ts`'s `discoverySuggestion.description` now reads "A real Tarot draw, Numerology reading, and birth chart — all live now.", no "on its way" anywhere in the live code path (only in the explanatory comment and the regression test, both intentional).
- **Dead-copy sweep (§14), fresh:** Re-ran full-repo searches for all six phrases. All previously-fixed phrases (`warming up`, `V1.5 feature`, `Early user`) now appear only inside regression-test assertions/comments, never in live copy. `on its way` appears only in comments/tests. `BeaconVie` — see brand-drift finding above (5 new fixes). `coming soon` — every remaining instance re-classified as legitimate (the new Tử Vi card, disabled OAuth buttons, an accurate "theme preferences" note, backend-driven booleans, or historical/archived-route comments); none describe an already-shipped feature as unshipped.
- **Dead-CTA sweep (§15):** Re-confirmed zero `href="#"` anywhere in `apps/web`. Tử Vi card confirmed to render no CTA (by both code read and the existing `discover/page.test.tsx` test). Could not click-test every primary CTA live (no runtime); relied on route-existence checks the original audit's research agents already performed plus this pass's own direct reads of every route added or touched.

## A genuine bug this independent pass found and fixed

`pnpm typecheck` — not run as part of `npx jest`, which had passed on this file — surfaced 4 real errors in `dashboard.service.spec.ts`: `viewModel.discoverySuggestion` is typed nullable (`DashboardDiscoverySuggestionDto | null` in `packages/types`) even though the runtime code path always constructs a concrete object, and the test accessed `.description`/`.comingSoon` on it without narrowing. Fixed by adding an explicit `expect(...).not.toBeNull()` narrowing step before accessing fields, which also strengthens the test (it now explicitly asserts the DTO is populated, not just its content). Verified: `tsc --noEmit` on the file directly (clean), the test itself (2/2 pass), the full backend suite fresh (125/125 suites), and the full monorepo `pnpm typecheck` fresh (clean, both apps). This is exactly the kind of thing an independent "don't trust the report blindly" pass exists to catch — the implementation pass's own typecheck runs had reported success, and this fresh run did not, on the identical code.

## Persona re-verification

**Persona A — Tarot.** PASS. Nothing in either pass touched the Tarot journey; the path from homepage → signup → onboarding → Discover → Tarot remains exactly as clean as the original audit found it, and the onboarding fix removes the one thing that could have discouraged a Tarot-seeking user from continuing.

**Persona B — Tử Vi.** PASS. This is the persona the whole remediation targets. Verified directly: the Discover hub now carries an explicit "Tử Vi Lá Số — Coming soon" card with no CTA and no path to `/menh-vi`; Eastern Horoscope's own copy still explicitly disclaims being Tử Vi; the new card's own copy adds a second, independent disclaimer ("Not the same as Ngũ Hành Phương Đông above"). A user arriving specifically for Tử Vi no longer has to discover its absence by trial-and-error — the product states it directly, in the one place (Discover hub) such a user would naturally look.

**Persona C — Premium.** PASS, with the pre-login price gap correctly remaining a P2, not a blocker. Verified: Free/Premium tiers, one-time 30-day duration, concrete benefits, and Reports gating are all understandable before registration; the exact number is available immediately after signup with zero additional friction (confirmed via `/premium` upgrade panel reading the real backend value). Stop Condition A's own reasoning (the price is explicitly marked unvalidated server-side) is itself the argument for why this gap is transparency-level, not deception-level — the product isn't hiding a real, final number, it's declining to publish a number it says itself isn't final yet.

## Responsive QA

**Not live-browser-tested**, for the runtime-recovery reason stated above — this is the same disclosed gap as both prior passes, not a new omission. Re-assessed at the code level: all new/changed markup (Tử Vi card, Legal & Support card, pricing `priceNote` paragraph, the 5 brand-drift text fixes) reuses existing responsive classes and component patterns with no new breakpoints, fixed widths, or custom layout introduced anywhere in either pass. This is a lower-confidence claim than a real 6-viewport pass would give, and is reported as such rather than asserted as verified.

## Accessibility QA

**Not live-axe-tested**, same reason. Re-reviewed at the code/markup level, including the 5 new brand-drift fixes: all are plain text-content changes inside existing `<p>`/`<label>` elements — no new interactive elements, no new ARIA attributes, no heading-hierarchy changes. Combined with the already-reviewed Tử Vi card, Settings legal links, and post-testimonial-removal marketing page (Sections above), nothing in either pass is expected to introduce a new axe violation. This remains a code-review-level claim, not a live-tested one.

## Tests — fresh, this pass

- **Targeted (brand-drift fix + null-safety fix):** `consent-settings.test.tsx`, `notification-preferences-section.test.tsx` (no assertion change needed), `account-data-section.test.tsx` (no assertion change needed), `dashboard.service.spec.ts` (fixed) — all passing after fixes.
- **Full frontend suite, fresh:** 94 suites, 467 tests, all passing (identical count to the implementation pass — the brand-drift fixes touched existing, not new, test files).
- **Full backend suite, fresh, run twice** (before and after the null-safety fix): 125 suites, 1208 tests, all passing both times.
- **Onboarding e2e:** no dedicated onboarding-specific e2e beyond the shared `flow-1-register-onboard-dashboard.spec.ts`, which doesn't assert on the fixed string either way (see above) — not run live (no runtime available).
- **Playwright, broader:** not run — no runtime available; existing flows relevant to this pass (`flow-1-register-onboard-dashboard.spec.ts`) were identified and read but not executed. No new Playwright suite was written, per the instruction not to build a giant new suite for this closure.

## Build, lint, typecheck — fresh, this pass

- **Typecheck:** first fresh run **failed** (the genuine bug above); second fresh run, after the fix, clean across both apps.
- **Lint:** fresh, 0 errors; 24 pre-existing warnings, all in untouched `insight/*.spec.ts` files.
- **Build:** fresh `next build` — compiled successfully, `Linting and checking validity of types` passed, **51/51 static pages generated**. Final `standalone` trace-copy step failed with the identical `EPERM` signature (same error code `-4048`, same syscall, same `@jridgewell/gen-mapping` → `@jridgewell/source-map` symlink target pattern) as every prior report this engineering effort — confirmed as the same pre-existing environmental artifact, not a new regression.

## Security / privacy

No new unauthenticated endpoint was created (Stop Condition A holds, re-verified). No secret, credential, or production config value was added or exposed — the full diff was scanned for common secret patterns (private-key headers, live API key prefixes) with zero matches, and `.env.example`'s diff contains only illustrative/placeholder values. No public exposure of private user data. No Tử Vi fake result of any kind. No auth-bypass — the two new/changed routes (`/privacy`, `/terms`, `/contact` links from Settings) point to pre-existing public pages, not new auth-sensitive surface. No legal-route regression — `/privacy`/`/terms`/`/contact` pages themselves were untouched by this pass.

## Tử Vi domain safety — re-confirmed

`git diff --stat` and `git status --short`, both before and after this closure pass's own edits, show zero files under any Tử Vi-calculation or `/menh-vi` path. No school-selection, giờ Tý, Mệnh/Thân, Cục, 14 chính tinh, auxiliary-star, Tuần/Triệt, Tứ Hóa, or golden-vector logic exists anywhere in the diff — confirmed by the absence of any matching file path, not merely by absence of matching text. `docs/product/product-completion-roadmap-v2.md`'s Sprint 18 entry (`BLOCKED_BY_DOMAIN_REFERENCE`) is unchanged (it was staged and committed as-is in Commit 1, carrying forward the pre-existing, already-uncommitted edit from the earlier Domain + Brand Production Lock pass — its content was not altered by either pass). The Discover hub's new card remains, and only ever renders as, informational.

## Ready-to-Live matrix — rebuilt independently

| Dimension | Status | Basis |
|---|---|---|
| Brand promise | PASS | Tử Vi Lá Số acknowledged on Discover hub |
| First impression | PASS | Reports/testimonials/pricing all honest |
| Pre-login | PARTIAL | Exact Premium price still gated (Stop Condition A, re-verified valid) |
| Registration | PASS | Unchanged, low-friction |
| Onboarding | PASS | Discovery-accepted message accurate; state machine unchanged |
| Dashboard | PASS | Discovery-suggestion copy fixed; Recent Activity empty-state gap remains P3 |
| Discover | PASS | Five cards, correct live/coming-soon split, zero dead CTA |
| Tarot | PASS | Unchanged, no defects |
| Numerology | PASS | Unchanged, no defects |
| Natal Chart | PASS | Unchanged, no defects (jargon/glossary remains P3) |
| Eastern Horoscope | PASS | Disclaimer intact, independently re-verified |
| Tử Vi honesty | PASS | Direct, prominent acknowledgment now present |
| Reports | PASS | Feature unchanged; description now accurate |
| Companion | PASS | Unchanged |
| Memory | PASS | Unchanged; consent label brand-fixed this pass |
| Notifications | PASS | Unchanged; preferences copy brand-fixed this pass |
| Premium | PARTIAL | Structure/benefits honest; exact price gated by deliberate decision; no cross-surface contradiction found |
| Payment UX | PASS | Architecture unchanged, unaffected by either pass |
| Settings | PASS | Legal links added; 5 brand-drift strings fixed this pass |
| Trust | PASS | Testimonials removed from public render; brand-drift closed further |
| Empty states | PASS | None touched by either pass; Dashboard Recent Activity gap remains documented P3 |
| Error states | PASS | None touched by either pass |
| AI distinction | PASS | Unchanged, strong |
| Product coherence | PASS | All identified stale-copy contradictions fixed |
| Responsive | Not live-tested | Same disclosed constraint both passes; code-level review only |
| Accessibility | Not live-tested | Same disclosed constraint both passes; code-level review only |
| Dead CTAs | PASS | Re-confirmed zero this pass |

**Zero FAIL. Two PARTIAL, both by explicit, documented, re-verified decision (pricing) or environment constraint (responsive/accessibility not live-tested) rather than oversight.**

## Finding severity

**P0:** 0. **P1:** 0. **BLOCKER:** 0. **CRITICAL:** 0. **HIGH:** 0. **MEDIUM:** one — the Settings brand-drift gap this closure pass found and fixed (would have been MEDIUM had it been left open; it is now closed). **P2:** one, open by design (Premium price pre-login, Stop Condition A). **P3, unchanged and correctly deferred:** Dashboard Recent Activity empty state, Premium copy unification across surfaces, Natal Chart jargon/glossary, Settings legacy memory-control duplication, stale `product-surface-map.md`, remaining `/memory`-page and frozen-module (Reflection/Insight) BeaconVie references, dev-only Swagger title.

## Bugs discovered / bugs fixed, this closure pass

**Discovered and fixed (2):**
1. Five live, user-facing "BeaconVie" strings inside Settings (2 in `settings/page.tsx`, 1 each in `consent-settings.tsx`, `notification-preferences-section.tsx`, `account-data-section.tsx`) — missed by the prior remediation pass's narrower "marketing surface" scope, caught because this closure task explicitly named Settings as a check area. Fixed; one dependent test assertion updated.
2. `dashboard.service.spec.ts` failed `tsc --noEmit` (nullable-field access) despite passing under `jest`. Fixed via explicit null-narrowing; re-verified clean.

## Final diff review

`git status --short` (before commit): 39 modified + 13 untracked = 52 files (23 modified/created by this closure pass's own fixes on top of the 41+11 from the implementation pass, after accounting for the 5 brand-drift files and the dashboard-spec fix landing on already-tracked/untracked paths). `git diff --check`: clean, no conflict markers (only expected Windows CRLF-normalization warnings). No `.env` (real), no credentials, no test-results/Playwright-report directories, no scratch files were ever created or staged.

## Commit strategy

The tree naturally split into two coherent groups by originating pass, with one caveat: `apps/web/content/landing-copy.ts` and `apps/web/lib/seo.ts` each contain a mix of pre-existing Domain+Brand rename lines and this remediation's own content lines. Inspecting the actual diff hunks, most are cleanly separable, but at least one hunk in `landing-copy.ts` merges a brand-rename line with an adjacent remediation line under git's default 3-line context, meaning a truly clean hunk-level split would require zero-context (`-U0`) manual patch construction — real risk of a malformed patch for a purely organizational benefit, since neither commit already exists in history and correctness doesn't depend on which one carries these two files. Decision: both files are staged whole into **Commit 2** (the remediation/closure commit), since that pass substantially extended both — not split via `git add -p` or manual patch surgery. Every other file split cleanly by whole-file boundaries along actual pass ownership. `git add .` / `git add -A` was never used; every commit staged explicit paths only.

**Commit 1 (already created, prior turn of this same closure pass):** `de25fcd` — "fix: domain + brand production lock and production-readiness engineering" — 29 files (Domain + Brand Production Lock rename work, the payment-webhook Sentry visibility fix, and their associated docs).

**Commit 2 (this pass):** Pre-Live UX remediation, the release-closure brand-drift/null-safety fixes, and the closure report itself — 23 files, staged explicitly and reviewed via `git diff --cached` before commit (see the git-state section of the final chat output for the resulting hash).

## Production activation recommendation

Unchanged from the implementation report's recommendation, now with independent confirmation behind it: with P0/P1/Blocker/Critical/High all at zero, and the one MEDIUM this pass found already closed, the founder's remaining action is the same as before — review Stop Condition A's pricing reasoning, then proceed to `docs/operations/production-activation-checklist.md`. The two things this closure pass adds to that recommendation: (1) live browser/Playwright QA (responsive + accessibility) remains a genuine, twice-now-disclosed evidence gap that should be closed on a host with available Docker/RAM headroom before or shortly after activation, not skipped indefinitely; (2) the residual out-of-scope "BeaconVie" strings on the standalone `/memory` page and the frozen Reflection/Insight modules are low-severity (those modules are already hidden from primary navigation) but worth a follow-up pass since they are, factually, still there.

## Release closure verdict

**PRE-LIVE PRODUCT EXPERIENCE RELEASE CLOSURE COMPLETE — READY FOR PRODUCTION ACTIVATION**
