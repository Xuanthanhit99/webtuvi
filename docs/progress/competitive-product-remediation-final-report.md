# Competitive Product Remediation — Final Report (2026-08-22)

Companion to `docs/audit/competitive-product-gap-final-audit.md`. That document has the findings and
verdict; this one has the exact diff/test evidence for what was actually changed.

**Not committed. Not pushed. Not deployed.** Per policy, left as reviewable working-tree state.

---

## 1. Scope actually implemented this session

Agreed with the product owner up front, after the initial audit found most of the 29-section source
brief already satisfied by prior work (Sprint 18B):

1. Correct two stale docs that still claimed Tử Vi was domain-blocked after the engine shipped.
2. Add a dedicated Tử Vi trust/source-transparency section (deterministic-vs-AI explainer + plain-
   language glossary + VDTTL-1956 methodology disclosure).
3. Guest Tử Vi flow: audited, found already correctly handled by a deliberate existing decision —
   product owner chose to keep it as-is rather than build new anonymous compute surface.
4. (Unplanned, found during the trust-section work) a live brand bug: `SITE_NAME` and dozens of
   in-product strings still said "Mệnh Vi" instead of the founder-locked "Tử Vi Tarot" — fixed.
5. Write the two audit docs the source brief requires (this one and its companion).

## 2. Phase A — stale documentation corrected

Both edits are **additive-only**, matching each document's own established convention (append a
dated superseding section; never edit/erase history):

- `docs/product/product-completion-roadmap-v2.md` — new §12, "TỬ VI DETERMINISTIC ENGINE SHIPPED —
  SUPERSEDES §10's SPRINT 18–21 STATUS". Corrects the Sprint 18–21 status table (was
  `BLOCKED_BY_DOMAIN_REFERENCE`, now `SHIPPED` with evidence citations); explicitly leaves Sprint 22
  (Vận Depth) and the two open decision-register items unchanged.
- `docs/operations/production-activation-checklist.md` — new note under the top-level Status block
  and a superseding paragraph appended to §14. Corrects the "PRODUCT COMPLETE BLOCKED BY TỬ VI DOMAIN
  TRACK" framing without touching the actual activation checklist content (payment/DNS/email/Sentry/
  legal), which is unaffected and still governs.

## 3. Phase B — Tử Vi trust section

**New files:**
- `apps/web/features/tu-vi/components/tu-vi-trust-section.tsx` — `TuViTrustSection` component.
  Collapsible, `defaultOpen` prop. Content: "AI không an sao cho bạn" headline, one explanatory
  paragraph, a 6-term plain-language glossary (12 Cung, Mệnh/Thân/Cục, 14 Chính Tinh, Phụ tinh,
  Tuần/Triệt, Tứ Hóa — deliberately never exposes `CORE_13`/enum names/rule IDs), and a source
  disclosure line ("Trường phái / nguồn V1: Vân Đằng Thái Thứ Lang — Tử Vi Đẩu Số Tân Biên (1956)...
  không phải một tuyên bố về chân lý tuyệt đối" — phrased as methodology transparency, not an
  absolute-truth claim, per the source brief's explicit instruction).
- `apps/web/features/tu-vi/components/tu-vi-trust-section.test.tsx` — 2 tests: collapsed-by-default
  behavior + expansion, and that expanded content never leaks raw engine/ruleset version strings
  (`vdttl-1956-v1`, `tuvi-engine-v1`, `core-13-v1`, `RULE_ID`) into the rendered trust body.

**Wired into:**
- `tu-vi-dashboard.tsx` — rendered above the birth-data form, collapsed by default (pre-calculation
  trust-building).
- `tu-vi-chart-view.tsx` — rendered right after the existing "Deterministic — never AI-generated"
  badge, `defaultOpen` (post-calculation, full disclosure immediately visible).
- `tu-vi-dashboard.test.tsx` — 2 new assertions: the trust toggle is present before any calculation,
  and is expanded (`aria-expanded="true"`) on the real result view.

**Test evidence:** `pnpm jest features/tu-vi` → 3 suites, 16 tests, all pass (`VERIFIED_BY_TEST`,
run this session).

## 4. Phase D — guest flow: audited, not changed

Read `apps/web/features/guest-trials/guest-trial-storage.ts` and its call sites in
`dashboard-view.tsx`: Tarot's guest preview is a client-side random draw, Numerology's is client-side
life-path math — neither ever calls the backend API. `apps/api/src/tu-vi/tu-vi.controller.ts` has
every route behind `JwtAuthGuard`; `GuestTuViBoundary` already explains why in user-facing copy.
Presented this finding to the product owner with three options (polish the existing gate / build real
anonymous compute / leave untouched); chose "keep existing gate, polish only" but the trust-section
work (Phase B) already addresses the credibility half of that — no further Tử Vi-specific change was
made to the guest boundary component itself this session.

## 5. Brand bug fix (found during Phase B, not originally scoped)

**Root cause:** `apps/web/lib/seo.ts` — `SITE_NAME` was `'Mệnh Vi'` despite an adjacent comment
stating the brand was renamed to `'Tử Vi Tarot'` and that this constant is the single source every
other page derives from. `DEFAULT_DESCRIPTION` had the same drift.

**Files changed (46 total, all under `apps/web/`, grouped by area):**

- **Root cause:** `lib/seo.ts`, `lib/seo.test.ts` (assertion corrected + strengthened to also assert
  `SITE_NAME` is not `'BeaconVie'` and not `'Mệnh Vi'`).
- **Logo/header/nav:** `components/ui/logo.tsx`, `components/layout/app-header.tsx`,
  `components/layout/sidebar.tsx`, `components/layout/sidebar.test.tsx`.
- **Public landing:** `app/page.tsx`, `features/dashboard/components/home-route.tsx`,
  `features/dashboard/components/dashboard-view.tsx` (+ `.test.tsx`, incl. two `describe` block
  renames for hygiene), `components/marketing/trust-section.tsx`,
  `components/marketing/problem-solution.tsx`, `content/landing-copy.ts` (+ `.test.ts`).
- **Auth:** `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`,
  `features/auth/components/auth-card.tsx`.
- **Marketing pages:** `app/(marketing)/about/page.tsx`, `.../community/page.tsx`,
  `.../contact/page.tsx`, `.../privacy/page.tsx`, `.../terms/page.tsx`.
- **App shell:** `app/global-error.tsx`, `app/not-found.tsx`.
- **In-product copy (Settings/Premium):** `app/(app)/premium/page.tsx`, `app/(app)/settings/page.tsx`,
  `features/settings/components/account-data-section.tsx`.
- **Memory feature:** `features/memory/components/conflicts-section.tsx`, `candidate-review.tsx`,
  `remember-this-button.tsx` (+ `.test.tsx`), `duplicates-section.tsx`, `memory-view.tsx`,
  `consent-settings.tsx` (+ `.test.tsx`), `memory-timeline.tsx`.
- **Other frozen/active modules:** `features/journal/components/journal-home.tsx`,
  `features/onboarding/components/onboarding-chat.tsx`,
  `features/reflection/components/reflection-home.tsx` (frozen module, still reachable by direct
  route per CLAUDE.md — fixed since it's a real, reachable live surface),
  `features/insight/components/insight-dashboard.tsx` (same), 
  `features/notifications/components/notification-preferences-section.tsx`.
- **Regression test corrected:** `e2e/flow-26-ambiguity-cleanup.spec.ts` — this test asserted the
  production landing page's title matched `/BeaconVie/` and separately asserted zero "Mệnh Vi" text.
  The first assertion was itself stale (predated the domain-brand lock); updated to assert
  `/Tử Vi Tarot/` and to additionally assert zero "BeaconVie" text, while keeping the original zero-
  "Mệnh Vi" assertion (which was already correct and is now enforced, not just aspirational).

**Deliberately left unchanged (verified as legitimate, not brand drift):**
- `apps/web/app/menh-vi/**`, `apps/web/features/menh-vi/**` — the real, separate, archived design
  prototype module (per CLAUDE.md). Its own name is correctly "Mệnh Vi."
- `apps/web/tailwind.config.ts` — two comments explicitly about that archived module's design tokens
  (`docs/design/menh-vi-reference-breakdown.md`).
- `apps/api/src/tu-vi/engine/tu-vi-palace.ts` — contains "Mệnh Viên" (a Tử Vi palace-name term,
  substring-matches "Mệnh Vi" but is unrelated).

**Not fixed (requires a founder/ops decision, not a copy fix):**
- `app/(marketing)/contact/page.tsx` — `mailto:hello@beaconvie.local`, a non-resolving placeholder
  domain. A real support address requires the founder/ops team to actually provision one.

## 6. Test/build evidence (this session, `VERIFIED_BY_TEST`)

| Check | Result |
|---|---|
| `pnpm jest features/tu-vi` (initial, trust section only) | 3 suites / 16 tests pass |
| `pnpm typecheck` (apps/web) | Clean, after clearing a stale unrelated `.next/types` cache artifact (pre-existing, unrelated to this session's edits — see note below) |
| `pnpm lint` (apps/web) | Clean, 0 errors |
| `pnpm jest` full suite (apps/web), final run | **96 suites / 496 tests, all pass**, 271.8s |

**Note on the typecheck cache issue:** the first `pnpm typecheck` run failed on
`.next/types/validator.ts` referencing a nonexistent `app/(marketing)/page.js` — a stale
auto-generated Next.js route-type file from a prior build, unrelated to any file this session
touched (no `page.tsx` exists directly under the `(marketing)` route group, only its subroutes).
Deleting the `.next` build cache and rerunning produced a clean pass. Not a regression.

**Note on mid-run flakiness:** the first full-suite run (before the label-text fixes below) showed 5
failing suites. Two (`consent-settings.test.tsx`, `remember-this-button.test.tsx`) were real: their
`getByLabelText` queries still searched for the old "Mệnh Vi" string after the component copy was
corrected — fixed by updating the regex in both test files. The other three
(`register-form.test.tsx`, `birth-input-form.test.tsx`, `dashboard-view.test.tsx`) failed only under
full-suite parallel load (5s timeout exceeded) and passed cleanly in isolated re-runs — judged
environment flakiness (consistent with this machine's previously-documented low-RAM/Windows
characteristics), not a real regression, and the final full-suite run above confirms 496/496 clean.

Backend (`apps/api`) was not touched this session (confirmed via `git status` — zero files under
`apps/api/` or `packages/`) and therefore was not re-run; the one backend match for "Mệnh Vi" found
during the brand-audit grep (`tu-vi-palace.ts`, "Mệnh Viên") was confirmed unrelated and left alone.

## 7. Deliberately not implemented

- Đại Vận / Tiểu Hạn / Lưu Niên — `UNSOURCED`, hard domain gate, per
  `docs/domain/tu-vi/domain-decision-register.md` DECISION-12.
- Miếu/Vượng/Đắc/Hãm — open founder scope call, DECISION-11.
- Guest anonymous Tử Vi computation — audited, product-owner decision to keep the existing gate.
- PNG/PDF share export — pre-existing P2 roadmap item, out of this session's agreed scope.
- Live browser QA across the source brief's 12 breakpoints, fresh Playwright/axe runs — out of this
  session's scope; existing Sprint 18B12 results were cited, not re-verified live this session.

## 8. Commit / push / deployment status

Not committed, not pushed, not deployed — 46 modified files + 2 new files + 2 new audit docs, all
left as reviewable working-tree state per policy. Request a commit once reviewed.
