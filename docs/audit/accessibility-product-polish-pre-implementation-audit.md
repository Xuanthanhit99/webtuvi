# Accessibility + Product Polish — Pre-Implementation Audit

Date: 2026-08-19. Type: **audit only** — zero production code changed, zero commits, zero pushes,
per this task's own explicit rules. Follows `seo-shareability-foundation-final-report.md`'s
RELEASE CLOSURE (commit `fa1dad7`, not pushed).

---

## 1. Git baseline

```
git status --short        → clean
HEAD                       → fa1dad7 (local only)
origin/master               → 45c6a29
ahead/behind (origin...HEAD) → 0 / 1   (fa1dad7 not pushed — matches the prompt's claim, verified not assumed)
git diff --check           → clean
```

`fa1dad7` is confirmed **local-only**, one commit ahead of `origin/master`, exactly as reported.
No git history modified by this audit.

---

## 2. Governing docs read

`product-completion-roadmap-v2.md`, `docs/architecture/product-surface-map.md` (exists — contrary
to a passing remark in an earlier report; found at this path), `seo-shareability-foundation-final-report.md`
(incl. its RELEASE CLOSURE section), `admin-operator-tooling-final-report.md`,
`sprint-17-final-report.md`, `docs/audit/full-product-completion-roadmap-rebase.md` §28–29 (prior
Mobile/Responsive and Accessibility notes), `sprint-4b-final-report.md`.

**Already considered, reconstructed:**
- **DONE:** Companion streaming-announcement fix, natal-chart wheel accessible summary, duplicate
  "Key Aspects" name fix (Sprint 2B-era, verified still holding — see §11).
- **KNOWN LOW / carried forward:** QA-tooling touch-click synthesis friction at <768px (Sprint 17,
  environment-specific, not a code issue — not re-litigated here).
- **DEFERRED / open, roadmap-tracked:** **Tablet breakpoint (768–1279px) navigation fix** —
  Roadmap V2 §3 P1 item 8, "open since Sprint 4B" per `full-product-completion-roadmap-rebase.md`
  §28. Independently re-verified still open — see §4.
- **FROZEN:** Reflection/Insight/Review/Goal — unlisted but reachable, untouched by this audit.

No closed design decision was reopened without new evidence.

---

## 3. Live route/surface inventory

Matches `product-surface-map.md` exactly (re-verified against `apps/web/app/**`, not copied):
7 PUBLIC_MARKETING routes, `/onboarding` + 13 AUTHENTICATED_PRODUCT route groups (dashboard,
companion, journal, discover×5 incl. Eastern Horoscope now live, settings, memory, premium,
reports, admin), 4 FROZEN_DIRECT_ACCESS modules, `/menh-vi` ARCHIVED. **Environment note:** Docker
is not running in this environment (`docker ps` fails to reach the daemon), so the API/DB are not
reachable and no authenticated session could be established. Every finding below for authenticated
surfaces (Discovery systems, Reports, Companion, Notifications, Settings, Admin) is a **static
source-code read**, not a live-rendered/live-interaction verification — disclosed here once,
applies to §9–13, 16, 19 (tablet/mobile findings for those surfaces are NOT included below for this
reason). Public marketing surfaces (§4, §14–15) *were* live-tested against a running `next dev`
server.

---

## 4. Navigation findings

**[MEDIUM] Tablet 768–1279px shares the mobile bottom-tab nav instead of its own layout — CONFIRMED STILL OPEN.**
`apps/web/components/layout/sidebar.tsx:16` (`hidden ... desktop:flex`) and
`mobile-navigation.tsx:14` (`fixed inset-x-0 bottom-0 ... desktop:hidden`) key off Tailwind's single
`desktop: 1280px` breakpoint with no `tablet:` (768px) treatment at all — every viewport from
375px to 1279px gets the identical phone-style fixed bottom nav. This is the exact item flagged
since Sprint 4B and still listed as Roadmap V2 §3 P1 item 8 / Sprint 24 in-scope / Product Complete
Gate checklist item. Not a broken-layout bug (no overflow/overlap — Sprint 17's QA already verified
that in the narrower sense of "does it clip"), but a real, long-standing product-polish gap: a
1024×768 tablet gets a phone-density nav instead of a tablet-appropriate one. Failure scenario:
tablet users get less information density and a nav paradigm designed for one-handed phone use on
a device where a sidebar or icon-rail would fit comfortably. **Carried forward, not a new finding**
— flagged per the audit brief's explicit "pay special attention... do not assume it still exists"
instruction, with fresh source-level proof it does.

**[MEDIUM] Mobile marketing nav (`<details>`/`<summary>` hamburger) does not close on Escape or outside click — live-verified.**
`apps/web/components/marketing/marketing-header.tsx:39-70`. Live-tested against the running dev
server (390×844): opened the menu, dispatched `Escape` → still open; dispatched an outside click on
`document.body` → still open. Native `<details>` provides neither behavior for free, and no JS was
added to supply it. Failure scenario: a keyboard user who opens the mobile menu cannot dismiss it
with Escape (the conventional expectation for any disclosure/overlay) and must either activate the
summary again or tab through all 6 menu links to get back to page content. Does not trap focus
(Tab still moves through and past it), so this is not a hard blocker — just missing the
conventional dismiss affordances the brief's §4 explicitly asks to check for.

**[LOW] `marketing-header.tsx:41`** — `aria-label="Open menu"` is static, never updates to "Close
menu" when `details[open]` is true. Minor; native `<details>` open/closed state is still exposed to
most modern AT via the element's own semantics.

**[GOOD]** Desktop sidebar: correct `aria-label="Main navigation"`, `aria-current="page"` on the
active item, `min-h-11` (44px) touch targets, visible focus (inherits the app-wide
`focus-visible:outline` convention — see §15). Logo link has a real text accessible name
("BeaconVie"), not icon-only.

---

## 5. Heading/landmark findings

Public pages (live-verified): each of `/`, `/about`, `/contact`, `/privacy`, `/terms` has exactly
one real `<h1>`; `main`/`nav`/`header`/`footer` landmarks present and correctly labeled
(`aria-label="Primary"` on the marketing nav, `aria-label="Main navigation"` reused identically by
both sidebar and mobile-nav — **not a defect**, since only one of the two is ever visible/rendered
in the accessibility tree at a given viewport width due to `hidden`/`desktop:hidden`, so there's no
real duplicate-landmark collision, just two mutually-exclusive definitions of the same landmark
name).

**[MEDIUM] `apps/web/app/(app)/discover/page.tsx:44-79`** (source-read) — every Discovery system
card and the Personal Destiny Report card render their titles as `<p className="font-display
text-body-lg...">`, not heading elements, while the page has exactly one `<h1>Discover</h1>` at the
top and nothing else. Failure scenario: a screen-reader user navigating by heading (a near-universal
AT workflow) cannot jump directly to "Tarot"/"Bản Đồ Sao"/"Thần Số Học"/"Ngũ Hành Phương Đông"/
"Personal Destiny Report" — every other Discovery sub-page correctly uses real `<h2>` elements for
its subsections, making this index page the outlier.

**[LOW] `natal-chart-view.tsx`'s `Section` helper and `interpretation-sections.tsx:50-59`**
(source-read) — collapsible-section headers are `<button>` elements referenced by
`aria-labelledby`, not real heading elements, so "Planets"/"Houses"/"Major Aspects" don't appear
under heading-navigation (H key), only under button-navigation. Labels are still announced
correctly; this only affects one specific AT navigation shortcut, not comprehension.

---

## 6. Form findings

**Public forms (live+source verified):** login/register/forgot-password/reset-password all use a
shared `FormField`/`Label`/`Input` stack with real `<label htmlFor>`, `aria-describedby` wired to
hint/error text, `aria-invalid` on the input, visible-but-`aria-hidden` `*` for required fields, and
`aria-busy`+disabled submit buttons while pending — this is the **strongest, most consistent area
of the whole audit**. No defects found in the public/auth form stack.

**[GOOD, confirmed]** `oauth-buttons.tsx` — Google/Apple are genuinely `disabled`+`aria-disabled`
with visible "(Coming soon)" text, matching CLAUDE.md's "social login buttons may be present but
must remain disabled unless implemented" constraint. No misleading live-looking dead buttons.

**Authenticated forms (source-read only, per §3):** Settings/account-deletion form correctly
disables its submit button while the mutation is pending (`Button`'s own `disabled={disabled ||
loading}`) and uses specific destructive-action copy ("Permanently delete my account", not
"Confirm"). No defects found in this form specifically. Admin lookup forms: no defects in label
association; see §13 for their error/retry gap instead.

---

## 7. Dialog findings

Built on native `<dialog>` + `.showModal()` — a good architectural choice that gives focus-trapping,
Escape-to-close, and top-layer stacking for free without a hand-rolled implementation.

**[HIGH] `apps/web/components/ui/dialog.tsx:38,42`** — the title `<h2 id="dialog-title">` and the
`aria-labelledby="dialog-title"` on the `<dialog>` element are both **hardcoded, non-unique ids**.
Not hypothetical: `apps/web/features/settings/components/sessions-panel.tsx:140` and `:165` mount
two `Dialog` instances on the same Settings page simultaneously, and `account-data-section.tsx:96`
adds a third — three `id="dialog-title"` elements on one page. Per the HTML spec, `aria-labelledby`
resolves to the *first* matching id in the document, so depending on DOM order a screen reader can
announce the wrong dialog's title (e.g. hearing "Sign out this device?" while "Sign out of every
device?" is actually open). **Real, reproducible, on a real page — HIGH.**

**[MEDIUM] `dialog.tsx:38-49`** — the optional `description` renders as a plain `<p>` with no `id`,
and the `<dialog>` has no `aria-describedby`. Every destructive-action dialog relies on this text to
convey consequences (e.g. account deletion's "This permanently deletes your Companion
conversations..."), but it isn't guaranteed to be announced — only the title is. A screen-reader
user could act on "Delete your account?" without ever hearing what deletion actually removes.

**[LOW] `dialog.tsx:45`** — initial focus lands on the close (×) button (first focusable element in
DOM order via native `showModal()` autofocus), not on the more useful first field/action for
non-destructive dialogs like `goal-create-dialog.tsx`. Not wrong, just not optimal.

**[GOOD]** Close button is a real `IconButton aria-label="Close dialog"`, not a bare unlabeled "×".
Focus-restoration-to-trigger is native `<dialog>` behavior, so covered for free.

---

## 8. Loading/error/empty state findings

**[MEDIUM] Settings/Admin's `Skeleton` loading states have no `aria-live`/`role="status"` companion.**
`skeleton.tsx` is `aria-hidden="true"` by design (correct — a skeleton shouldn't be read literally),
but nowhere in `sessions-panel.tsx`, the admin panels, or the Settings memory-preference dropdown is
there an accompanying live region announcing "Loading…". This is inconsistent with the codebase's
**own better pattern** used elsewhere: `tarot-draw-panel.tsx`, `premium-upgrade-panel.tsx`,
`verify-email-status.tsx`, and `companion-view.tsx` all correctly pair a skeleton/spinner with a
`role="status"`/`aria-live="polite"` text announcement. Settings and Admin simply don't follow it.
Failure scenario: a screen-reader user clicks "Search" in the admin user-lookup tool and hears
nothing until the result (or error) renders — reads as an unresponsive page for the wait duration.

**[MEDIUM] Admin's three top-level panels never wire `ErrorState`'s existing `onRetry` prop.**
`admin-user-lookup-panel.tsx`, `admin-notification-health-panel.tsx`, `admin-ai-spend-panel.tsx`
all render `<ErrorState title=… />` on query failure, but `ErrorState` (`error-state.tsx`) already
supports a retry button — it's just never passed. Failure scenario: a transient network blip during
an AI-spend or notification-health fetch leaves an operator with no retry affordance short of a
full page reload (which also loses the AI-spend window selection and re-triggers every other
panel's query). **Real gap, directly contradicts the audit brief's own §8 expectation** ("no
dead-end states... retry controls").

**[LOW/INFORMATIONAL]** Nested admin lists (`admin-entitlement-list.tsx`, `admin-payment-list.tsx`)
render a plain `<p>` on error with no retry — lower severity since they're re-triggerable by
re-running the parent user search, but inconsistent with even the (weaker) top-level pattern.

**[GOOD]** No ad hoc unlabeled `"Loading…"` strings found anywhere — the team already standardized
on `Skeleton`/`EmptyState`/`ErrorState`. Empty states are honest and specific (e.g. "No entitlement
history — never purchased Premium"), never blank space passed off as "nothing happened." Reports'
"Calculated Facts" vs. AI-methodology split is explicit and well-labeled.

**[MEDIUM] `apps/web/features/reports/components/report-detail.tsx`** — while a report's `status`
is `GENERATING`, the query has no polling (`refetchInterval`) and the "generating" card has no
`role="status"`/`aria-live`. Reachable if a user opens a report link while generation is still
running server-side (bookmark/shared link/second tab — not the primary generate-button flow, which
already blocks synchronously). The page then shows a static message indefinitely with no
way to know when it's done short of a manual reload, and zero announcement for screen-reader users
when it eventually would finish.

---

## 9. Tarot findings (source-read, per §3)

No blocking issues. `tarot-card-face.tsx` gives each card a real `aria-label` (name + orientation);
`ai-interpretation.tsx` clearly separates calculated cards from AI narration; `tarot-draw-panel.tsx`
uses `role="status"` for shuffling and `role="alert"` for limit banners.

**[LOW]** After a draw completes, focus isn't moved into the result region — the reading follows
immediately in DOM order, so this is a minor loss-of-place for keyboard users, not a lost result.

---

## 10. Numerology findings

**[GOOD]** `numerology-value-card.tsx`'s "Why is my number X?" disclosure uses correct
`aria-expanded`/`aria-controls`, with real derivation steps (deterministic, not AI text).

**[LOW]** Same no-focus-move-after-reveal pattern as Tarot.

---

## 11. Natal Chart findings

**[GOOD]** `natal-chart-wheel.tsx` is exemplary: decorative SVG parts `aria-hidden`, one
`role="img"` summary label, backed by a full textual equivalent (Big Three/Planets/Houses/Aspects
lists). Confirms the historical "wheel glyph collision"/"duplicate Key Aspects name" fixes
(`full-product-completion-roadmap-rebase.md` §29) are **still holding, not regressed**.
`natal-chart-view.tsx` additionally shows a bilingual "calculated, never chosen by AI" disclosure
plus a full "Calculation details" panel (zodiac mode, house system, timezone, calc version) —
unusually transparent.

**[LOW]** Same no-focus-move-after-reveal pattern. Collapsible-section headers are buttons, not
headings (see §5).

---

## 12. Eastern Horoscope findings

**[GOOD]** Both the dashboard H1 copy and the Discover index card explicitly disambiguate Eastern
Horoscope from the not-yet-built Vietnamese Tử Vi Lá Số — correct, matches CLAUDE.md's hard
constraint. `eastern-horoscope-profile-view.tsx` gives calculated facts a `Badge variant="new"`
("Deterministic — never AI-generated") distinct from the Reflection card's `Badge
variant="insight"` ("AI interpretation") — clean separation, and the facts card doesn't depend on
interpretation state (an AI failure can't hide it).

No new findings beyond the cross-cutting ones already listed.

---

## 13. Admin findings

See §7 (dialog id collision reachable via Settings, not Admin specifically) and §8 (missing retry,
missing loading announcement). Additionally:

**[GOOD]** No ambiguous accessible-name collisions — only one "Search" button exists on the admin
page; Notification Health and AI Spend are distinct `<h2>`-headed sections. No PII (user id, email,
timestamps) is baked into an `aria-label` — it's plain visible text content, which is expected and
correct for an operator tool (this is the privacy/accessibility intersection check from §21 of the
brief — **passes**).

---

## 14. Contrast findings — measured, not guessed

Computed via the WCAG relative-luminance formula against the actual hex values in
`apps/web/tailwind.config.ts` (single-theme dark app — no light-mode class is ever toggled anywhere
in the codebase, confirmed by grep; `canvas-light`/`surface-light`/`text-primary-light` tokens are
defined but unused, so only the dark palette is live and was measured):

| Pair | Ratio | WCAG AA normal text (4.5:1) |
|---|---|---|
| `text-primary` (#F1ECE4) on `canvas`/`surface` | 15.33 / 13.98 | **PASS** |
| `text-secondary` (#B7AFC9) on `canvas`/`surface` | 8.58 / 7.82 | **PASS** |
| `insight` (#E3B368, links/accent/focus ring) on `canvas`/`surface` | 9.37 / 8.54 | **PASS** |
| `reflection` (#9A7FA6) on `canvas` | 5.12 | **PASS** |
| `trust` (#7E9787) on `canvas` | 5.72 | **PASS** |
| `caution` (#C17B6B, error/warning) on `canvas` | 5.42 | **PASS** |
| `text-disabled` (#6E6785) on `canvas`/`surface` | 3.38 / 3.09 | **FAIL** |

**[HIGH] `text-disabled` fails WCAG AA for normal text (needs 4.5:1, measures 3.09–3.38:1) and is
used pervasively for real content, not just decoration.** A repo-wide grep found 60+ call sites
across nearly every feature area — timestamps, card metadata, and critically, the **deterministic-
vs-AI disclosure copy itself**: `natal-chart-view.tsx`'s "calculated from your birth data, never
chosen by AI" and `interpretation-sections.tsx`'s "Written by AI to narrate the chart above" both
use `text-caption text-text-disabled` (12px, regular weight — does not qualify as "large text"
under WCAG's 18pt/24px-normal-or-14pt/18.66px-bold exemption). Also used for the Privacy/Terms
pages' Sprint-1-placeholder disclaimer and every input's placeholder color. Classified **HIGH**
given the breadth (dozens of components) and because the specific text this touches includes the
product's own core trust mechanism (the calculated-fact/AI-narration distinction CLAUDE.md
requires), not merely low-priority chrome.

**Everything else measured: PASS**, including the focus-ring color (`border-focus`, same hex as
`insight`) against its background — 9.37:1, comfortably clears the 3:1 non-text-contrast minimum
(WCAG 1.4.11) for focus indicators.

No dark-mode-specific contrast risk exists because there is no second theme in production.

---

## 15. Focus visibility findings

Repo-wide grep for `outline-none`, `focus:outline-none`, `outline: none`,
`focus-visible:outline-none` across all of `apps/web` found **exactly one unguarded match**:

**[MEDIUM] `apps/web/features/journal/components/journal-editor.tsx:112`** — the journal-entry
title `<Input>` sets `border-none bg-transparent px-0 ... focus-visible:outline-none` with no
adjacent replacement (no ring/border-color/box-shadow). Every other interactive control in the
codebase (`button.tsx`, `input.tsx`, `icon-button.tsx`, `dropdown.tsx`, `password-input.tsx`,
`companion/composer.tsx`) consistently applies
`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-insight` — this is the one place that convention was dropped instead of
replaced. Failure scenario: a sighted keyboard-only user tabbing to the journal title field gets
zero visual confirmation of focus.

**[GOOD]** The `focus-visible:outline-insight` convention (measured 9.37:1 contrast, §14) is applied
consistently everywhere else — this is a strong, near-universal pattern with one clean exception.

---

## 16. Icon-only control findings

Audited via source (notification bell, close buttons, search/menu/hamburger, IconButton usages).

**[GOOD]** `notification-bell.tsx` — `aria-label` dynamically includes the unread count ("Notifications,
3 unread" vs. "Notifications"), with the visual dot separately `aria-hidden` (no double-announcement).
Dialog close buttons use a real `aria-label="Close dialog"`. Admin `/admin` header icon link has
`aria-label="Operator Tools"`. Composer send button has `aria-label="Send message"` +
`aria-busy`. Password-visibility toggle has correct `aria-label`/`aria-pressed`.

**[MEDIUM] Duplicate/ambiguous accessible names — Companion "Remember this" buttons.**
`apps/web/features/companion/components/message-item.tsx` renders an icon-only
`IconButton aria-label="Remember this"` on every user message, with **identical text on every
instance**. Failure scenario: a screen-reader user browsing a long conversation via an
elements/buttons list (a standard NVDA/JAWS workflow) sees many buttons all named "Remember this"
with no way to distinguish which message each belongs to without leaving the list view. A softer
version of the same pattern exists in `memory-used-section.tsx`'s "Why I remembered this" buttons
when a message uses 2+ memories (no per-memory distinguishing text at all).

**[MEDIUM] Notification unread/read state is conveyed only visually, not in the accessible name.**
`notification-center.tsx` marks unread items with a decorative `aria-hidden` dot only — nothing in
the notification button's accessible name states "unread." The bell's aggregate count is announced
correctly (see above), but once inside the list, a screen-reader user can't tell which specific
items are unread.

**[LOW]** `conversation-sidebar.tsx` conversation buttons fall back to "Untitled conversation" +
relative timestamp; two untitled conversations created in the same minute would produce identical
accessible names. Low likelihood, low impact.

---

## 17–21. Responsive QA (17: desktop/tablet/mobile methodology; 18–21 below cover 5 targets combined per surface availability)

**Public surfaces (live-tested against running dev server, `document.body.scrollWidth` vs.
`window.innerWidth`):**

| Width | Result |
|---|---|
| 1440 (desktop) | No horizontal overflow (verified during the prior SEO closure pass, re-confirmed structurally unchanged this pass) |
| 1024 (tablet) | No horizontal overflow |
| 768 (tablet) | No horizontal overflow |
| 390 (mobile) | No horizontal overflow |
| 375 (mobile) | No horizontal overflow |

**Authenticated surfaces (Dashboard, Discover, a Discovery system, Reports, Settings, Admin):**
**not live-tested** — no database/API available in this environment (§3). Source-level responsive
classes were spot-checked (Tailwind `tablet:`/`desktop:` utility usage) and found consistent with
the app-wide convention everywhere except the nav gap already documented in §4. **Disclosed
explicitly, not glossed over**, per this audit's own instruction not to claim QA that wasn't
performed.

---

## 22. Accessibility automation / tooling status

- **eslint-plugin-jsx-a11y is already active**, bundled transitively via `next/core-web-vitals`
  (confirmed present at `node_modules/.pnpm/.../eslint-plugin-jsx-a11y`) — the project gets baseline
  static a11y linting (alt-text, aria-props/role validity, anchor-is-valid, etc.) for free, and it
  currently passes clean (0 lint errors, re-confirmed in the prior SEO closure pass).
- **No runtime accessibility testing exists** — no `jest-axe`, no `@axe-core/playwright`. Nothing
  in the 412-test frontend suite or the 29-flow Playwright suite exercises computed ARIA
  relationships, focus-trap behavior, or contrast at runtime.

**Recommendation: (B) `jest-axe`, targeted — not a large new framework.** Rationale: the concrete
defects found in this audit (duplicate dialog ids, missing `aria-describedby`, missing live
regions) are exactly the class of bug `jest-axe` catches cheaply in the existing Jest/RTL suite,
against the small set of shared primitives (`Dialog`, `ErrorState`, `Skeleton`-consuming panels)
where the bugs actually live — not a blanket sweep of all 400+ components. `@axe-core/playwright`
would be heavier to introduce (new e2e dependency, slower CI) for the same marginal catch, given the
existing Playwright suite already favors `getByRole`/`getByLabel` selectors (see §26) which already
indirectly pressure-test accessible naming. Not implemented in this audit — recommendation only.

---

## 23. Playwright coverage / quality findings

29 flow specs, 834 total `getByRole`/`getByLabel`/`getByTestId`/`getByText` calls vs. 60 occurrences
of brittler patterns (`.nth()`, `.first()`, `.last()`, `force: true`, long `waitForTimeout`) across
18 files — roughly a 14:1 ratio favoring accessible-selector-first testing, which is genuinely
good practice and indirectly validates a lot of the accessible-naming work audited above.

**[LOW/TEST_GAP]** Spot-checked `flow-28-eastern-horoscope-discovery.spec.ts`'s `.first()` usage:
legitimate (element/animal text like "Mộc (Wood)" and the "Deterministic — never AI-generated"
micro-label both legitimately appear more than once on the page), not evidence of an actual
duplicate-name defect — but it does make those specific assertions slightly less precise than a
`getByRole` scoped to a specific card/section would be. Not worth a broad rewrite; flagging as a
minor test-quality note only, per the brief's "recommend only where it materially reduces
regression risk" instruction — this doesn't clear that bar on its own.

No `page.locator('.some-class')` CSS-selector anti-pattern usage found.

---

## 24. Terminology / copy findings

No stale "coming soon" labels found on any live feature (the one `available: false` branch in
`discover/page.tsx` is currently dead code — all four systems hardcode `available: true` — flagged
as an informational watch-item for whenever a new module is added to that array, not a current
defect). No Mệnh Vi branding leak outside the already-archived `/menh-vi` tree (re-confirmed, no
regression since the SEO closure pass). No Eastern Horoscope/Tử Vi conflation anywhere audited —
both the Discover index and the Eastern Horoscope dashboard explicitly disambiguate. OAuth buttons
are honestly disabled, not misleadingly live-looking. No `Lorem ipsum`/`test@test.com`/leftover
`TODO` placeholder copy found in any audited component.

---

## 25. Privacy/accessibility interaction findings

No case found of an `aria-label` or accessible name built from birth date, email, AI prompt/response
text, or a private report body. Admin's PII (user id, email, timestamps) renders as plain visible
text in a `<dl>`, never folded into an `aria-label` — correct pattern, matches what a screen-reader
user would need without over-exposing it via an unexpected channel (e.g. a hidden/duplicated DOM
node). **Passes.**

---

## 26. Performance-visible findings

None observed beyond what's already covered above (Reports' missing polling in §8 is a
correctness/announcement gap, not a performance one). No evidence of layout shift, double-submit
risk (destructive buttons already correctly disable while pending — §6), or repeated
unlabeled spinners (§8) beyond the specific Settings/Admin gap already documented.

---

## Severity summary

| Severity | Count |
|---|---|
| BLOCKER | 0 |
| HIGH | 2 |
| MEDIUM | 10 |
| LOW | 8 |
| INFORMATIONAL | 3 |

**HIGH:** (1) `Dialog` primitive's hardcoded `id="dialog-title"` causes real `aria-labelledby`
collisions on pages that mount 2+ dialogs (Settings, confirmed 3 on one page). (2) `text-disabled`
color token fails WCAG AA contrast (3.09–3.38:1 vs. 4.5:1 required) and is used pervasively for real
content including the product's core calculated-vs-AI disclosure copy.

**MEDIUM (10):** tablet 768–1279px nav-sharing (roadmap-tracked since Sprint 4B); mobile hamburger
menu no Escape/outside-click dismiss; `/discover` index cards not real headings; `Dialog` missing
`aria-describedby`; Settings/Admin `Skeleton` loading has no `aria-live` companion; Admin's 3
top-level panels don't wire `ErrorState`'s existing retry prop; Reports `GENERATING` status has no
polling/live-region; Companion "Remember this"/"Why I remembered this" buttons have duplicate
accessible names; Notification unread state not in the accessible name; `journal-editor.tsx`'s one
`focus-visible:outline-none` with no replacement.

**LOW (8):** no focus move after Tarot/Numerology/Natal-Chart reveal (1 consolidated pattern);
collapsible-section headers are buttons not headings; Dialog initial focus on close button;
conversation-sidebar duplicate-title edge case; nested admin list errors have no retry; Reports CTA
disabled+"Upgrade" copy ambiguity for non-Premium+not-ready users; static "Open menu" aria-label
never flips to "Close menu"; Playwright `.first()` usage slightly imprecise (not a real defect).

---

## P0/P1/P2 implementation scope (recommended, not started)

**P0 (block launch-quality bar for accessibility):**
1. Fix `Dialog`'s hardcoded `id="dialog-title"` → generate a unique id per instance (e.g.
   `useId()`). Small, contained, high-confidence fix; unblocks the HIGH finding.
2. Replace `text-disabled` (or introduce a slightly lighter token) so it clears 4.5:1 against both
   `canvas` and `surface` — this is a single token-value change with wide blast radius (60+ call
   sites), so treat as "change the token, not each call site," and re-verify contrast + visually
   spot-check that it doesn't read as promoted-to-primary-emphasis text.

**P1 (materially improves the actual audit brief's stated focus areas):**
3. `Dialog` `aria-describedby` wiring for its `description` prop.
4. Settings/Admin: wire `role="status"`/`aria-live="polite"` around `Skeleton` usage, matching the
   pattern already used elsewhere in the codebase.
5. Admin's 3 top-level panels: pass `onRetry` to their existing `ErrorState` usage (prop already
   exists — this is wiring, not new code).
6. Mobile hamburger menu: add Escape-key and outside-click handlers (or migrate to the existing
   `Dialog`/popover pattern already used elsewhere, for consistency).
7. `/discover` index cards: change title `<p>` → `<h2>` (verify it doesn't break existing visual
   styling, which is trivial since heading elements can carry any className).
8. Companion "Remember this" / "Why I remembered this": extend the `aria-label` to include a
   distinguishing fragment (e.g. a snippet of the message/memory text), not just the fixed phrase.
9. Notification Center: add a visually-hidden "Unread" cue to unread items' accessible names.
10. `journal-editor.tsx:112`: restore a `focus-visible:` replacement consistent with the rest of the
    app.

**P2 / deferred (real but lower-urgency, or requires product input):**
- Tablet 768–1279px dedicated nav layout — this is a real design decision (icon-rail? collapsed
  sidebar? keep bottom-nav but denser?), not a one-line fix; recommend scoping as its own small
  design pass rather than bundling into this accessibility punch list, consistent with its existing
  Sprint 24 placement in the roadmap.
- Reports `GENERATING`-status polling/live-region for the rare direct-link-during-generation path.
- Post-reveal focus movement for Tarot/Numerology/Natal-Chart (nice-to-have, not blocking).
- Collapsible-section headers → real heading elements (Natal Chart, interpretation sections).
- Admin nested-list retry parity with top-level panels.
- `jest-axe`, targeted at `Dialog` + the auth form stack (tooling recommendation, §22).

**Explicit out-of-scope (per this audit's own brief, not touched or assessed further):**
Community, Tử Vi, new SEO strategy, new admin features, payment/business logic, major visual
redesign, full WCAG certification, a full Playwright-suite rewrite, dark-mode-specific work (no
dark mode exists in production).

---

## Tử Vi isolation

Zero files under any Tử Vi-related path (`apps/web/features/menh-vi/**` excepted, which is
archived-but-preserved Mệnh Vi design-exploration code, not Tử Vi) were read or referenced by this
audit's investigation beyond the disambiguation check in §12/§24. No domain-resolution pack, golden
vector, or engine file was opened. **Sprint 18 status unchanged: `BLOCKED_BY_DOMAIN_REFERENCE`.**
This audit produced zero code changes, so there is nothing that could have touched it regardless.

---

## Git status / commit / push status

No files were created or modified except this document itself and, if the user requests it, the
optional companion architecture doc (not created — judged unnecessary; this document's own P0/P1/P2
section already serves that purpose without a second file to keep in sync). No commit was made. No
push was made. Working tree will show exactly one new untracked file
(`docs/audit/accessibility-product-polish-pre-implementation-audit.md`) after this write completes.

---

## Final verdict

**ACCESSIBILITY + PRODUCT POLISH — PRODUCT DECISION REQUIRED**

Not "READY FOR IMPLEMENTATION" outright, and not "NO MATERIAL IMPLEMENTATION NEEDED" — two real
findings (2 HIGH, several MEDIUM) are unambiguous, small, low-risk engineering fixes with no product
decision attached (P0/P1 list above) and could start immediately. But the single most
roadmap-prominent item this audit was asked to re-check — the tablet 768–1279px navigation gap — is
**not** a pure bug-fix: it requires a product/design decision about what tablet's own nav layout
should actually look like (icon-rail vs. collapsed sidebar vs. something else), which is exactly the
kind of decision this audit is not authorized to make unilaterally. Recommend: ship the P0/P1
engineering punch list as a fast, low-risk pass first (all independently actionable, no product
input needed), and separately bring the tablet-nav design question to the founder/product owner —
consistent with how the roadmap itself has already deferred it to a dedicated pass (Sprint 24)
rather than folding it into every intervening sprint.

## Recommended next action

Implement the P0 list (2 items: Dialog id collision, `text-disabled` contrast) as the smallest
possible next engineering pass — both are objective, measured defects with no product ambiguity.
Bring the tablet-nav layout question to the founder/product owner in parallel, as its own scoped
decision, before scheduling engineering time against it.

---

# PRODUCT DECISIONS LOCKED

Date: 2026-08-19 (same day, separate closure pass). Type: **decision lock only** — no production
code changed. This section resolves the "PRODUCT DECISION REQUIRED" verdict above into a scope the
next implementation pass cannot expand beyond. History above this line is unmodified.

## Baseline re-verified

`HEAD` = `fa1dad7`, local-only (`origin/master` = `45c6a29`, 0 ahead / 1 behind), working tree
clean except this document, `git diff --check` clean. Matches the reported baseline exactly.

## D1 — Dialog IDs: **FIX**

`apps/web/components/ui/dialog.tsx:38,42` hardcodes `id="dialog-title"` / `aria-labelledby="dialog-title"`.
Locked direction: replace with `React.useId()` (React `^19.0.0`, confirmed installed — no version
gap), called once per `Dialog` instance, producing a unique `titleId` threaded to both the `<h2 id>`
and the `<dialog aria-labelledby>`. This is a **single shared-primitive fix** — every call site
(`sessions-panel.tsx` ×2, `account-data-section.tsx`, and every other `Dialog` usage across
Tarot/Companion/Notifications/Goals) inherits it automatically with zero call-site changes, exactly
per this task's own instruction not to hand-assign ids per call site. No precedent for `useId()`
exists yet in the codebase (grepped, zero hits) — this introduces the pattern for the first time,
which is fine; it's a one-file, standard-library addition, not a new dependency.

**Must not break:** the existing `onCancel`/`variant === 'destructive'` Escape-prevention behavior
(line 35-37) and the native-`<dialog>`-provided focus-trap/restore-focus semantics are unrelated to
the id fix and must be left untouched — this is Stop Condition D territory (shared Dialog changes
breaking focus semantics) if the implementation pass touches anything beyond the id-generation
lines.

## D2 — Dialog descriptions: **FIX**

Same component, same pass. Add a second `React.useId()`-derived `descId`, apply it as the `id` on
the existing `description` `<p>` (line 49) only when `description` is truthy, and conditionally set
`aria-describedby={description ? descId : undefined}` on the `<dialog>` element. **Locked
constraint per this task's own §5:** do not add a placeholder/empty description anywhere solely to
satisfy this wiring — `aria-describedby` must be absent (not pointing at an empty string) on the
`Dialog` instances that pass no `description` prop today.

## Contrast — `text-disabled`: **FIX, via minimal token split**

Audited every call site behind the pervasive-usage finding (60+ sites, `apps/web/**`). Classified
into the three categories this task's decision required:

| Category | Examples | Verdict |
|---|---|---|
| **(A) Readable secondary/supporting text** — the overwhelming majority: timestamps, card metadata, disclosure copy (`natal-chart-view.tsx`'s "calculated... never chosen by AI", `interpretation-sections.tsx`'s "Written by AI to narrate..."), Privacy/Terms placeholder-legal disclaimers, Reports readiness labels | **Must move off `text-disabled`.** This is real content a user needs to read; WCAG 1.4.3 fully applies. |
| **(B) Genuinely disabled-control text** — `oauth-buttons.tsx`'s Google/Apple buttons, which already carry `disabled` + `aria-disabled="true"` + `opacity-60` | **Stays on `text-disabled`, no change required.** WCAG 1.4.3 has an explicit carve-out: "Text... that is part of an inactive user interface component... has no minimum contrast requirement." Re-verified this is the only genuinely-disabled-control usage found. |
| **(C) Placeholder text** — `input.tsx`'s `placeholder:text-text-disabled`, reused by every text input incl. Companion composer, Journal editor | **Inherits the (A) fix automatically, no separate token needed.** Placeholder isn't WCAG-exempt in the strict text, so raising the shared token used here is a net improvement; no case for a third token. |

**Locked token strategy:** introduce one new token (name to be finalized at implementation time,
e.g. `text-tertiary`) for category (A)'s ~60 call sites, leaving `text-disabled` itself unchanged
and reserved for category (B) only (currently 2 call sites, both in `oauth-buttons.tsx`) — this is
the "split minimally rather than forcing one token to do two jobs" instruction, applied literally:
**one new token, not a palette redesign.** Illustrative candidate verified against both real
backgrounds (final hex to be confirmed at implementation time using the same calculation method,
not this candidate blindly): `#9A93AE` → 6.15:1 on `canvas` (#161428), 5.60:1 on `surface`
(#1F1C36) — clears 4.5:1 on both with margin. Category (B)'s `text-disabled` is confirmed
WCAG-exempt as-is; **no change required there**, so this does not touch `oauth-buttons.tsx`.

**Stop Condition A explicitly checked and NOT triggered:** this does not require redesigning the
color system — it's one additive token plus a mechanical find-and-replace across category-(A) call
sites, using the same `canvas`/`surface`/`text-*` naming convention already in place.

## Tablet navigation (768–1279px): **FIX — locked direction, not yet built**

**Decision:** tablet gets a **compact icon-rail nav that structurally reuses the existing
`Sidebar` component** (`apps/web/components/layout/sidebar.tsx`) rather than a new component or
visual language. Concretely:

- `Sidebar` renders at `tablet:flex` (currently `desktop:flex` only) with a narrower rail width at
  `tablet:` and the full `w-60` labeled width at `desktop:`. Same `NAV_ITEMS`, same
  `aria-current="page"` active-state logic, same icons — zero new visual language, per this task's
  explicit instruction.
- `MobileNavigation`'s bottom-tab bar changes from `desktop:hidden` to `tablet:hidden`, so it
  becomes strictly `<768px`-only (phone), never shown to a tablet-width viewport again.
- **Accessibility trap to lock explicitly, since it's the exact kind of regression an
  accessibility-motivated change must not introduce:** each nav item's visible text label
  (`sidebar.tsx:37`, currently `<span className="flex-1">{item.label}</span>`) must switch to
  `sr-only tablet:sr-only desktop:not-sr-only` (visually-hidden-but-in-the-accessibility-tree) at
  the icon-rail width — **not** `hidden`/`display:none`, which would silently strip every nav
  item's accessible name and turn 6 icon-only links into unlabeled controls, trading one
  accessibility defect for a worse one.
- No existing reusable "compact/icon-rail nav" component was found elsewhere in the live product
  (the Mệnh Vi archived design has an icon+label-toggling top nav at its own `mv-wide: 1440px`
  breakpoint, per `tailwind.config.ts`'s comment — different orientation, different breakpoint,
  different brand, and off-limits per this task's `/menh-vi` boundary; noted as prior-art context
  only, its code is not to be touched or reused).

**Stop Condition B explicitly checked and NOT triggered:** this reuses the existing `AppShell`/
`Sidebar`/`MobileNavigation` structure and `tailwind.config.ts`'s already-defined `tablet: 768px`
breakpoint (defined but currently unused by either nav component) — no architecture rewrite
required. If implementation discovers this assumption is wrong (e.g. `Sidebar`'s current DOM
structure can't cleanly support two width states), that becomes a real Stop-Condition-B trigger at
that point, not now.

**Desktop boundary (≥1280px):** unchanged — full labeled `Sidebar`, `MobileNavigation` never
renders. **Phone boundary (<768px):** unchanged — `MobileNavigation` bottom-tab bar exactly as
today, `Sidebar` never renders. Neither existing behavior is touched by this decision.

## Settings/Admin loading states: **FIX**

Reuse the exact pattern already correct elsewhere (`tarot-draw-panel.tsx`, `verify-email-status.tsx`,
`companion-view.tsx`): wrap the loading-announcement text in `role="status" aria-live="polite"`,
paired with the existing visual `Skeleton`. **Locked constraint:** apply only where a
`Skeleton`/loading state currently has zero accessible announcement (Settings' `sessions-panel.tsx`,
the three Admin panels, the memory-preference dropdown) — do not add `aria-live` regions to
already-correct areas, and do not make every spinner in the app narrate itself (per this task's own
instruction).

## Admin retry: **FIX**

`admin-user-lookup-panel.tsx`, `admin-notification-health-panel.tsx`, `admin-ai-spend-panel.tsx`
already render `<ErrorState>`, which already accepts `onRetry`. Locked scope: pass the existing
query's `refetch` function through as `onRetry` at these three call sites — **wiring only, zero new
Admin capability, zero new component.** The nested nested-list nested `admin-entitlement-list.tsx`/
`admin-payment-list.tsx` LOW finding (plain `<p>` on error, no `ErrorState` at all) is **deferred**
(see §"remaining Medium/Low findings" below) — it's a LOW, not one of this pass's locked Mediums,
and upgrading it to use `ErrorState` is a slightly larger change (introducing a component, not just
wiring a prop) than this pass's wiring-only mandate for Admin.

## Companion accessible names: **FIX**

`message-item.tsx`'s per-message `IconButton aria-label="Remember this"` and
`memory-used-section.tsx`'s "Why I remembered this" both currently use one fixed, identical string.
**Locked differentiation strategy, checked against Stop Condition C:** append a short, bounded,
already-public fragment already rendered elsewhere on the same message — the message's own
timestamp (already visible in the UI, not new private content) or a short truncated excerpt already
used elsewhere in the codebase for the same message (e.g. the pattern `journal-suggestion-card.tsx`
already uses for excerpts). **Explicitly locked constraint, per this task's §8 and Stop Condition
C:** the accessible name must never contain the full message body, any AI prompt/response text, or
any field not already rendered visibly on that same card — e.g. `aria-label={"Remember this
message from " + formattedTime}` is in-scope; `aria-label={"Remember: " + message.text}` is not.
Exact fragment choice (timestamp vs. short excerpt vs. an ordinal position) is an implementation
detail within this bound, not a further product decision.

## Notification unread state: **FIX**

`notification-center.tsx`'s unread dot is `aria-hidden` with no accessible-name equivalent. Locked
direction: add a visually-hidden (`sr-only`, not `hidden`) "Unread" text node inside each unread
item's accessible name/content, conditionally rendered only when the notification is actually
unread — read notifications get no extra text (avoids the "excessively verbose" trap this task's §9
explicitly warns against). The bell's own `aria-label` (already correct, "Notifications, N unread")
is unaffected.

## Journal focus ring: **FIX**

`journal-editor.tsx:112`'s title `<Input>` restores the app-wide
`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-insight` convention (already measured at 9.37:1 contrast, §14 above) used by
every other interactive control. **Locked constraint:** this is a pure CSS-class addition to one
element; no change to Journal's edit/save/autosave behavior, no reactivation of any frozen module
(Journal itself is live, not frozen — Reflection/Insight/Review/Goal remain untouched regardless).

## Remaining Medium findings — enumerated and locked

The audit's Medium list beyond the 6 explicitly named above:

1. **Mobile hamburger menu, no Escape/outside-click dismiss** (`marketing-header.tsx`, live-verified
   this pass's predecessor) — localized (one component), low risk, objectively accessibility-related
   (keyboard dismissal), no redesign. **FIX_IN_THIS_PASS.** Locked implementation bound: add an
   Escape-keydown handler and an outside-click handler that set the native `<details>` element's
   `open = false`; do not replace the `<details>`/`<summary>` pattern with a different widget
   (that would be inventing new interaction, not fixing the existing one).
2. **`/discover` index cards not real headings** (`discover/page.tsx`) — localized (one file,
   `<p>` → `<h2>`), low risk, no visual redesign required (heading elements carry any className).
   **FIX_IN_THIS_PASS.**
3. **Reports `GENERATING` status: no polling, no live region** (`report-detail.tsx`) — localized to
   one query hook + one status card, low risk. **FIX_IN_THIS_PASS**, narrowly scoped to: add
   `refetchInterval` only while `status === 'GENERATING'` (stops once resolved), and wrap the
   "generating" card's text in `role="status" aria-live="polite"`. Locked constraint: no other
   change to Reports' generation flow, UI, or copy.

All three: no Stop Condition triggered, no product-behavior change beyond the accessibility fix
itself.

## Findings fixed in next pass (consolidated)

D1 (Dialog ids), D2 (Dialog descriptions), contrast token split, tablet icon-rail nav, Settings/Admin
loading announcements, Admin retry wiring, Companion accessible-name disambiguation, Notification
unread semantic state, Journal focus ring, mobile hamburger Escape/outside-click, `/discover`
heading fix, Reports `GENERATING` polling/live-region. **12 items total.**

## Findings deferred (with reason)

- **Admin nested-list (`admin-entitlement-list.tsx`/`admin-payment-list.tsx`) retry parity** —
  LOW, not one of the locked Mediums; upgrading to `ErrorState` is a slightly larger change than
  this pass's wiring-only Admin scope. Reason: **DEFER_WITH_REASON** — bundle with any future Admin
  pass instead.
- **Post-reveal focus movement (Tarot/Numerology/Natal Chart)** — LOW, nice-to-have, three separate
  feature areas; deferred to keep this pass's blast radius to the locked 12 items.
- **Collapsible-section headers as real headings (Natal Chart, interpretation sections)** — LOW,
  deferred; same reasoning, and touches presentational structure the audit didn't flag as broken,
  only sub-optimal for one specific AT navigation shortcut.
- **Dialog initial-focus placement (lands on close button)** — LOW, deferred; not wrong, just not
  optimal, and changing initial-focus targets per-dialog would touch every call site rather than
  the shared primitive alone.
- **Conversation-sidebar duplicate-title edge case, Reports CTA copy ambiguity, static "Open
  menu"→"Close menu" label, Playwright `.first()` precision** — all LOW/INFORMATIONAL, deferred,
  no material accessibility impact per the original audit's own severity call.
- **jest-axe/`@axe-core/playwright` full adoption beyond the targeted scope below** — deferred by
  explicit founder instruction (§13): no full automated WCAG certification this pass.

## Contrast verification policy — locked

For every text/background pair touched by this pass (the new category-(A) token against `canvas`
and `surface`, and the restored Journal focus ring against its adjacent surfaces):
1. Compute the actual contrast ratio from the final committed hex/RGB values using the WCAG
   relative-luminance formula (the same method used throughout this audit, reproducible via a short
   Node script — no visual-inspection sign-off accepted).
2. Record, per pair: foreground hex, background hex, ratio, applicable requirement (4.5:1 normal
   text / 3:1 large text or non-text UI component), PASS/FAIL.
3. Where a background is dynamic or semi-transparent (none identified in this pass's locked scope —
   all touched surfaces are opaque `canvas`/`surface`/`surface-raised` solid tokens — but if
   implementation discovers one, e.g. a hover/backdrop blend), compute against the actual rendered
   composite color, not the nominal token alone.
4. This table becomes part of the implementation pass's own closure report — not optional
   documentation.

## Automation/tooling decision — locked

**`@axe-core/playwright`, targeted — not `jest-axe`, reversing this audit's own tentative
recommendation per the founder's explicit preference order.** Verified compatible: `@playwright/test
^1.49.1` is current and actively maintained; `@axe-core/playwright` has no unusual peer-dependency
conflict with this version, and the existing `e2e/` suite already uses `getByRole`/`getByLabel`
selectors extensively (§23 of the audit above), so `@axe-core/playwright`'s scan integrates into the
same test files without a parallel testing paradigm. **Locked scope: a small, named set of critical
live surfaces, not blanket coverage** — the Settings page (exercises the fixed Dialog + loading
states), the Companion view (exercises the fixed accessible-name disambiguation), the Notification
Center (exercises the fixed unread state), and the new tablet-width nav (exercises the new icon-rail
at 768/1024). Four surfaces, added as assertions inside the *existing* relevant `e2e/flow-*.spec.ts`
files where those flows already navigate through them — not a new parallel spec suite. **Stop
Condition E explicitly checked and not triggered:** one new dependency (`@axe-core/playwright`,
dev-only, no runtime/production impact), no build-pipeline change, no CI-config rewrite implied
beyond `pnpm add -D` and importing it in four existing spec files.

## Responsive QA matrix — locked

| Width | Priority | Representative journeys to check |
|---|---|---|
| 1440, 1279, 1100, 1024, 900, 820, 768, 767 | **High** (tablet range is this pass's core remediation — 767 and 1279 specifically test the boundary transitions) | Dashboard (nav-mode correctness at the boundary), Settings (Dialog + loading fixes), one Discovery result page (Natal Chart — richest layout), Personal Destiny Report (long-form content) |
| 390, 375 | Standard (regression-only — phone nav must be provably unchanged) | Dashboard, Settings |

Locked per this task's §14 instruction: not every route at every width — the journeys above are
chosen because they're the ones this pass's actual changes touch (nav boundary, Dialog, loading
states, headings) or are the highest structural-complexity representative (Natal Chart wheel,
Reports' long-form TOC-adjacent layout) most likely to reveal a regression if the tablet-rail change
has any unintended side effect.

## Frozen-module / `/menh-vi` policy — reaffirmed

Reflection/Insight/Review/Goal remain frozen/unlisted; none of the 12 locked items touch their
code, and no polish work is scoped to them this pass (the shared `Dialog`/focus-visible/contrast
token fixes will incidentally benefit any dialog or `text-disabled` usage inside those frozen
modules' own code purely because they're shared primitives — this is an acceptable, unavoidable
side effect of a primitive-level fix, not scope creep, and requires no separate decision).
`/menh-vi` remains archived; not referenced by any of the 12 locked items except as read-only
prior-art context for the tablet-nav decision (§ above), its code untouched.

## Sprint 18 / Tử Vi boundary — reaffirmed

Zero locked item touches Cục, Mệnh/Thân, any Tử Vi star rule, golden vectors, the domain-resolution
pack, or any Tử Vi implementation path. **`SPRINT_18 = BLOCKED_BY_DOMAIN_REFERENCE`, unchanged.**
This decision-lock pass itself made zero code changes, so there is nothing that could have touched
it regardless — reaffirmed structurally, not just by assertion.

## Stop conditions — checked against every locked item

| Condition | Triggered? |
|---|---|
| A — contrast fix requires color-system redesign | **No** — one additive token, mechanical replacement |
| B — tablet nav can't reuse existing shell without major rewrite | **No** — reuses `Sidebar`/`MobileNavigation`/existing `tablet:` breakpoint |
| C — accessible name would expose private content | **No** — Companion fix bounded to already-visible fragments (timestamp/excerpt), explicitly excludes message/AI text |
| D — Dialog changes break focus/focus-trap semantics | **No** — fix is scoped to id-generation only, native `<dialog>` focus behavior untouched |
| E — tooling requires disproportionate dependency/build change | **No** — one dev-only dependency, four existing spec files extended |
| F — remediation alters locked product behavior | **No** — every locked item is additive/wiring; no product behavior (payment, auth, Discovery calculation, Reports content, frozen-module visibility) changes |

**No stop condition triggered. No further founder/product decision required before implementation
of the 12 locked items begins.**

## Remaining product decisions

None outstanding for the 12 locked items. The exact hex value for the new contrast token, and the
exact accessible-name fragment strategy for Companion (timestamp vs. excerpt vs. ordinal), are
implementation-detail choices bounded by the constraints locked above, not further product
decisions requiring founder input.

## Files created / modified this pass

`docs/audit/accessibility-product-polish-pre-implementation-audit.md` (this section appended;
history above unmodified). No `docs/product/accessibility-product-polish-decisions.md` created — a
separate file was judged unnecessary since this closure lives naturally as a section of the same
audit it resolves, consistent with how `seo-shareability-foundation-final-report.md` handled its
own closure section.

## Git / commit / push status

No files modified besides this document. No staging, no commit, no push performed by this pass.

## Verdict

**ACCESSIBILITY + PRODUCT POLISH DECISIONS LOCKED — READY FOR IMPLEMENTATION**

All 12 items have a locked, bounded implementation direction with no outstanding product ambiguity
and no triggered stop condition. Scope is explicitly closed against redesign, WCAG certification,
Tử Vi, frozen-module reactivation, `/menh-vi` restoration, and every other item in the audit's
original out-of-scope list (reaffirmed, unchanged).

## Recommended next action

Implement the 12 locked items as one contained pass, in roughly this order (primitive-level fixes
first, since several downstream items benefit from them or share test surfaces): (1) Dialog
id/description fix, (2) contrast token split, (3) tablet icon-rail nav, (4) the remaining 9
wiring/labeling fixes, (5) the 4-surface `@axe-core/playwright` addition, (6) the locked responsive
QA matrix, (7) a closure report following the same structure as the SEO/shareability precedent.
