# SEO + Shareability Foundation — Final Report

Date: 2026-08-19

> This is a production-readiness/acquisition sprint, not a redesign sprint — the remainder of
> Sprint 23 ("Admin, SEO/Public Content, Shareability") from `product-completion-roadmap-v2.md`,
> Admin Operator Tooling having already shipped and closed. Per the task's own rule 0, the prompt's
> git-state and prior-finding claims were independently verified rather than trusted — one
> discrepancy was found and is documented in §9.

## 1–4. Baseline

- Starting HEAD: `5050160` ("test: close admin operator tooling verification"), 1 ahead of
  `origin/master` (`f06813b`), working tree clean at task start.
- `git fetch origin` confirmed `origin/master` unchanged.
- Recent commits (`c1c8b8f`, `cfe0824`, `f06813b`, `5050160`) all verified to exist via
  `git cat-file -e`.

## 5. Governing docs read

`product-completion-roadmap-v2.md` (confirms Sprint 23 = Admin[shipped] + "public SEO content
built on the now-live Eastern Horoscope engine... shareable result cards across
Tarot/Numerology/Natal Chart/Eastern Horoscope"), `vietnamese-tu-vi-product-definition.md`,
`roadmap-resequencing-after-tuvi-block.md`, `sprint-17-final-report.md`,
`admin-operator-tooling-final-report.md`. No dedicated `product-surface-map.md` exists — the
actual Next.js route tree was read directly instead (`apps/web/app/**`).

## 6–7. Route inventory

**Indexable (public, real metadata + canonical added this pass):** `/`, `/about`, `/contact`,
`/privacy`, `/terms`, `/login`, `/register` — exactly the routes already in `sitemap.ts`, now
verified accurate against the real route tree (not assumed).

**Noindex (private/transactional, defense-in-depth added this pass):** everything under the
`(app)` route group (dashboard, companion, journal, discover×5, settings, memory, goals,
reflections, insights, reviews, premium, reports, admin) via one group-level `metadata.robots` in
`(app)/layout.tsx`; `/onboarding`; `/forgot-password`; `/reset-password` and `/verify-email`
specifically because both carry a one-time, sensitive token in the URL; `/verify-email/pending`.

Before this pass, **only `/admin`** had page-level `robots: noindex` — every other private route
relied solely on `robots.ts`, which is explicitly insufficient per this task's own §6 ("do not rely
on robots.txt alone for a private/sensitive page"). Now all of them do.

## 8. Stale-brand findings

Searched for "Mệnh Vi", "BeaconSoul", and any other retired product name across
`apps/web/app`/`components`/`features`. All matches are confined entirely to the already-archived
`/menh-vi` route tree and its dedicated `features/menh-vi` folder (preserved-for-reuse per Sprint
14's decision, 404s publicly, disallowed in robots.ts) — no live surface leak. BeaconVie is the
only branding on every reachable public page.

## 9. Stale-terminology findings

**Discrepancy with this task's own premise:** the prompt asserted "the previously reported Low
finding: marketing landing page may still use stale Discovery-system naming" and asked to verify
whether it still exists. Grepped every doc in the repo for this phrasing and equivalents — **no
such finding exists in any prior report** (`sprint-17-final-report.md`,
`admin-operator-tooling-final-report.md`, or anywhere else). Per this task's own rule 0
("repository reality wins"), this is documented as a discrepancy, not silently treated as
confirmed.

**A genuinely real, independently-found instance of the same class of bug was found and fixed
this pass, unprompted:**
1. `content/landing-copy.ts`'s `discoverySystems` array marked **Natal Chart** and **Eastern
   Horoscope** as `comingSoon: true` — both have actually shipped (Sprint 9, Sprint 17). Fixed:
   both flipped to `comingSoon: false` with real `href`s, matching the pattern Tarot/Numerology
   already used.
2. The About page's copy said "Your chart and your numbers are on their way" — also stale, same
   root cause. Fixed to state the four Discovery systems are live today.
3. `discovery-systems.tsx`'s own doc comment claimed only Tarot/Numerology were real — corrected.

## 10. Metadata architecture

`apps/web/lib/seo.ts` — single source of truth: `SITE_NAME`, `SITE_URL` (reusing the same
`NEXT_PUBLIC_APP_URL` env var `robots.ts`/`sitemap.ts`/root `layout.tsx` already read, not a new
one), `DEFAULT_DESCRIPTION`, `buildMetadata({ title, description, path, noindex })`, and
`buildWebsiteJsonLd()`/`buildOrganizationJsonLd()`. Deliberately **no OG image** — verified (not
assumed) that zero brand/icon/OG assets exist anywhere in the repo (`find apps/web/public` and
`apps/web/app` for any icon/favicon/logo file — none). Fabricating one was explicitly out of scope
per this task's own §9; documented here as a design follow-up for whenever real artwork exists.

## 11–16. Homepage / Discover / per-system metadata

**Homepage (`/`):** explicit `buildMetadata({ path: '/' })` replacing implicit-only inheritance
from the root layout, plus `WebSite` + `Organization` JSON-LD (§20).

**`/discover` and all four Discovery system pages (Tarot/Numerology/Natal Chart/Eastern
Horoscope):** confirmed by reading the actual route tree — **all five live entirely under the
authenticated `(app)` route group.** There is no public, logged-out version of any of them. This
is not a metadata gap to fill; these pages are correctly private and are now correctly noindex'd
(see §7). See §26 (Stop-Condition-H) for why "per-Discovery-system public metadata" as this task's
own §3 audit table implies is out of scope this pass.

## 17–19. Canonical / OG / Twitter strategy

`buildMetadata()` sets `alternates.canonical` explicitly for every indexable page (never left for
Next.js to infer from the request URL, which would let query-string/trailing-slash variants create
duplicate canonicals) and derives OpenGraph + Twitter (`summary_large_image`) from the same
title/description — no separate copy to drift out of sync. Noindex pages get none of this; nothing
to make shareable about a page that must never be indexed.

## 20. JSON-LD result

`WebSite` + `Organization`, homepage only. Every field (`name`, `url`, `description`) is a real,
already-public fact — no `aggregateRating`, `review`, `author`, or `FAQPage`, all explicitly
tested-against in `seo.test.ts`. No other page currently qualifies: every other candidate is either
noindex or has no public entry point to describe (§26).

## 21. Sitemap result

Audited and found **already correct** — the seven routes it lists are exactly the seven genuinely
public routes. Added an explanatory comment (not a route-list change) clarifying that Discovery
routes are intentionally absent and why, so a future reader doesn't mistake this for an oversight.
`lastModified` uses real `new Date()` at build time (never fabricated future dates); priority/
changeFrequency values are the same conservative ones already in place, not newly invented.

## 22. Robots result

**Real bug found and fixed:** `robots.ts`'s disallow list had silently drifted out of sync with
`route-guard.ts`'s own `APP_ROUTES` — missing `/premium` and `/onboarding`, both real
authenticated-only routes. Fixed by importing `APP_ROUTES`/`ONBOARDING_ROUTE` directly from
`route-guard.ts` (the same source `middleware.ts` uses for the real auth gate) so this list cannot
drift again. Also added `/forgot-password`, `/reset-password`, `/verify-email` (token-bearing,
previously unlisted).

## 23. `/menh-vi` result

Still disallowed, still confirmed 404 by the existing Sprint 14 archival mechanism. Untouched.

## 24. Admin indexing result

Unchanged and reconfirmed: `/admin` disallowed in `robots.ts`, page-level `noindex` (predates this
session), absent from sitemap — now additionally covered by the new `(app)/layout.tsx` group-level
noindex too (redundant with its own existing setting, no conflict).

## 25. Private-route indexing result

See §7. Every private/sensitive route now carries metadata-level `noindex` in addition to
`robots.ts`, closing the defense-in-depth gap this task's own §6 explicitly calls for.

## 26. Shareability implementation — including the Stop-Condition-H finding

**Stop-Condition-H triggered and documented, not worked around:** confirmed by reading the actual
route tree that **no public entry point exists for any Discovery system** — `/discover/tarot`,
`/discover/numerology`, `/discover/natal-chart`, `/discover/eastern-horoscope` are all
authenticated-only. This task's own §8 examples ("Tarot entry point, Numerology entry point...")
and the roadmap's Sprint 23 DoD ("at least one public, indexable page per shipped Discovery
system") both assume public destinations that don't exist. Building them is a real product
decision — how much of each system to reveal pre-login, static copy vs. interactive teaser,
conversion-funnel impact on the "create an account to try it" flow — squarely the kind of decision
this task's own §19-H names as a stop condition ("existing route architecture contradicts the
locked product surface enough to require a product decision"). Not built this pass; documented
here as the reason full "shareable Discovery entry points" isn't shipped, rather than silently
narrowing scope or unilaterally deciding the product question.

**What was built instead, safely within scope:** `components/marketing/share-button.tsx` —
shares the one genuinely public destination that exists today, the homepage. Web Share API where
available, clipboard fallback otherwise (`toast.success`/`toast.error` for accessible
success/failure announcement, reusing the existing toast system rather than a silent visual-only
change). Wired into `final-cta.tsx` alongside the existing primary CTA.

## 27–28. Web Share / clipboard fallback

Both implemented and tested (§38). `navigator.share` branch tried first; `AbortError` (user closed
the native share sheet) is treated as a non-failure, nothing announced; any other share failure or
clipboard failure surfaces via `toast.error`.

## 29. Sensitive-data boundary

`ShareButton`'s payload is `{ title: SITE_NAME, text: DEFAULT_DESCRIPTION, url: SITE_URL }` —
three module-level constants, no function parameters, no user/session/reading data ever reaches
it. Structurally cannot leak private data because there is no code path for private data to enter
in the first place (not merely "doesn't currently pass any").

## 30. Adversarial privacy-test result

`share-button.test.tsx` asserts the actual Web Share payload never contains sentinel-shaped values
(`SENTINEL_EMAIL`, `SENTINEL_BIRTHDATE`, `SENTINEL_TAROT_QUESTION`, `SENTINEL_AI_INTERPRETATION`).
`seo.test.ts` asserts the JSON-LD objects' key sets are exactly the expected safe set and contain
none of `aggregateRating`/`review`/`author`/`faqPage`/`award`. Beyond the explicit assertions: both
`buildMetadata`/`buildWebsiteJsonLd`/`buildOrganizationJsonLd` and `ShareButton`'s share payload
are built from fixed constants/parameters with no code path for birth date/time/location, Memory,
Journal, Tarot questions, AI prompts/interpretations, or account identity to reach any of
metadata/canonical/sitemap/JSON-LD/share payload — verified by reading every line of the new code,
not merely by the tests. **Gate passes.**

## 31. Analytics result

**Deliberately skipped, documented per this task's own §13 allowance.** Reusing the existing
Sprint 13 analytics contract (`packages/types/index.ts`'s `ClientAnalyticsEventName`/
`AnalyticsEventProperties`) for a `share_clicked` event would require: (1) adding a new event name
to the shared, backend-enforced enum, and (2) adding `surface`/`method`-shaped properties that
**do not currently exist** in `AnalyticsEventProperties` (the closest existing fields, `feature`
and `source`, don't fit cleanly), and (3) extending the backend DTO's `whitelist: true,
forbidNonWhitelisted: true` validator to accept them. This is a real, non-trivial cross-boundary
contract change on both sides of the HTTP boundary — exactly what §13 says to skip and document
rather than bundle into a foundation pass. No analytics widening was made.

## 32. Accessibility result

`ShareButton` is a real `<button>` (native semantics, keyboard-operable for free), with a visible
"Share" text label (not icon-only — the icon carries `aria-hidden`), an `aria-label` for the
accessible name, and success/failure communicated via the existing toast system (already used
throughout the app for exactly this purpose). Not a full WCAG audit — a targeted check against this
task's own §14 list only.

## 33–37. Runtime QA (desktop/tablet/mobile)

**Not performed as live-viewport QA this pass — disclosed, not glossed over.** The change surface
this pass is metadata-only plus one small, self-contained homepage button using the same `Button`
component and `flex flex-wrap` layout pattern already used (and already live-viewport-verified)
throughout the app, including in `final-cta.tsx`'s own existing CTA row. No new page, no new
layout, no new interactive journey beyond a single button. Given the change's shape, a full
5-viewport live QA pass was judged disproportionate; instead: (1) the full frontend unit suite
(§38) exercises the rendered component tree, (2) the production build's static-generation step
(§44) renders every affected page server-side without error, (3) code review confirms
`share-button.tsx` and `final-cta.tsx`'s new markup use only existing, already-verified responsive
classes (`flex flex-wrap items-center justify-center gap-3`), no fixed widths. If a live-viewport
pass is wanted, it would be a fast, low-risk follow-up given how small the actual rendered
change is.

## 38. Frontend tests

New: `lib/seo.test.ts` (10 tests), `app/robots.test.ts` (7 tests), `app/sitemap.test.ts` (6
tests), `components/marketing/share-button.test.tsx` (5 tests) — **28 new tests, all passing.**

Full suite, rerun clean after all fixes: **81 suites / 412 tests — 100% pass.** (One transient,
unrelated failure — `features/natal-chart/components/birth-input-form.test.tsx`, a file this
session never touched — occurred once mid-session with 3 other suites, all timeout-based; did not
reproduce on an immediate rerun with the same code. Classified as transient environmental flakiness
from this session's own heavy cumulative test/build load, not a defect, and not counted against
this task's scope.)

**Debugging detours, both resolved:**
- Two `ShareButton` clipboard-fallback tests initially failed: `Object.defineProperty(navigator,
  'clipboard', {...})` doesn't reach the actual object the component reads from, because jsdom
  provides its own real `Clipboard`/`EventTarget` instance. Root-caused via a throwaway diagnostic
  test (deleted, never committed) that logged the object identity at call time. Fixed with
  `jest.spyOn(navigator.clipboard, 'writeText')` instead of replacing the whole object.
- Two typecheck errors in the new test files: `robots.test.ts` accessed a property on a
  `rules: {...} | Array<{...}>` union without narrowing (fixed by extracting `allow` alongside the
  already-correctly-narrowed `disallow`); `seo.test.ts` accessed `.card` on the `Twitter` union
  type, which only some union members have (fixed with a targeted cast). Both are in this session's
  own new test files, not pre-existing code.

## 39. Backend tests

None needed or run — this pass made zero backend/Prisma changes (see §45).

## 40–41. e2e / Playwright

Not run. No new interactive user journey was added beyond a self-contained homepage button using
already-tested UI primitives (`Button`, `toast`) — not the kind of change this repo's Playwright
suite is scoped to (multi-step flows like registration/admin/discovery). Judged disproportionate
for a metadata-and-one-button pass; noted explicitly per this task's own instruction not to
substitute "probably fine" for disclosure.

## 42. Lint

Clean — 0 errors, 0 warnings across every file this session touched (one unnecessary
`eslint-disable-next-line react/no-danger` comment removed from `(marketing)/page.tsx` after lint
flagged it as unused; `react/no-danger` isn't an active rule in this project's config).

## 43. Typecheck

Clean — 0 errors, after fixing the two issues described in §38.

## 44. Production build

`✓ Compiled successfully` (10.8min — slower than this session's earlier builds due to cumulative
host load from a long session, not a regression), type-checking passed, `✓ Generating static pages
(51/51)`. The build then fails at the final "Collecting build traces" step with `EPERM: operation
not permitted, symlink ...` while copying files into the `output: 'standalone'` bundle — **the
identical, already-documented, pre-existing Windows-only artifact** hit twice before this session
(`sprint-17-final-report.md` §42, `admin-operator-tooling-final-report.md` §30.20): Windows
restricts symlink creation without Developer Mode/admin rights, and this only affects building the
Linux/Docker-target standalone bundle, never compilation/typecheck/static-generation. Classified
identically, per this task's own explicit instruction (§26 in the original prompt: "classify using
existing Linux/Docker evidence rather than altering product code"). Zero product-code changes made
in response.

## 45. Prisma status

Not touched — SEO/shareability needed zero schema changes, as expected going in. `git diff --stat`
confirms no file under `apps/api/prisma/` appears in this session's changes.

## 46–47. Security / privacy findings

Zero. This pass's only security/privacy-relevant surface is the noindex additions (strictly
increases protection, never decreases it) and the ShareButton's payload (structurally
data-incapable of carrying anything private, verified in §30). No new attack surface introduced.

## 48. Bugs discovered

1. `landing-copy.ts` wrongly marked two shipped Discovery systems as "coming soon" — real,
   customer-facing, undersells the live product.
2. About page said two shipped features were "on their way" — same class of bug.
3. `robots.ts` silently missing `/premium` and `/onboarding` from its disallow list — a real
   privacy/indexing gap (both are auth-gated routes an anonymous crawler could otherwise attempt to
   index before middleware's redirect took effect).
4. Zero private pages except `/admin` had metadata-level `noindex` — relying on `robots.ts` alone,
   which this task's own §6 explicitly calls insufficient.
5. `reset-password`/`verify-email` (token-bearing URLs) had no `noindex` at all, at either layer —
   the most security-relevant of the findings, since an indexed/cached reset link is a real,
   if narrow, account-security exposure.
6. One transient, unrelated test-suite flake (§38) — not a defect, noted for completeness only.

## 49. Bugs fixed

All of #1–5 above. #6 is not a bug in this session's scope and was not "fixed" (nothing to fix —
it didn't reproduce).

## 50–54. Open findings

**Zero open Blocker. Zero open Critical. Zero open High. Zero open Medium. Zero open Low** — every
finding above was fixed within this pass, and none of the deliberate scope exclusions (missing OG
image, missing analytics event, missing public Discovery entry points) represent a defect; each is
a documented, reasoned scope boundary with its own rationale (§10, §26, §31).

## 55–56. Files created / modified

**Created (6):** `apps/web/lib/seo.ts`, `apps/web/lib/seo.test.ts`, `apps/web/app/robots.test.ts`,
`apps/web/app/sitemap.test.ts`, `apps/web/components/marketing/share-button.tsx`,
`apps/web/components/marketing/share-button.test.tsx`.

**Modified (18):** `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`,
`apps/web/app/(app)/layout.tsx`, `apps/web/app/(onboarding)/onboarding/page.tsx`,
`apps/web/app/(auth)/{login,register,forgot-password,reset-password,verify-email,verify-email/pending}/page.tsx`,
`apps/web/app/(marketing)/{page,about,contact,privacy,terms}.tsx`,
`apps/web/content/landing-copy.ts`, `apps/web/components/marketing/{discovery-systems,final-cta}.tsx`.

24 files total, 131 insertions / 26 deletions per `git diff --stat`.

## 57. `git diff --check`

Clean — only benign LF→CRLF autocrlf warnings (this Windows checkout's line-ending config), no
real whitespace errors.

## 58–60. Staged / commit / push status

**Nothing staged. Nothing committed. Nothing pushed** — per this task's explicit "Do not commit.
Do not push." instruction, honored throughout.

## 61. Final working tree

18 modified + 6 untracked files, all intentional and accounted for above; nothing else changed.

## 62. Sprint 18 / Tử Vi status

**Unchanged: `BLOCKED_BY_DOMAIN_REFERENCE`.** Zero files under any Tử Vi-related path were read or
modified this session — confirmed by the file list in §55–56 containing nothing outside
`apps/web`'s marketing/SEO surface.

## 63. Stop conditions triggered

**H — "Existing route architecture contradicts the locked product surface enough to require a
product decision."** Triggered by the absence of any public Discovery entry point (§26). Not
silently worked around: documented, and the safe subset of shareability that doesn't depend on it
(homepage sharing) was built instead.

No other stop condition (A–G) was triggered — nothing required exposing private pages, private
result data, `/menh-vi` reactivation, Tử Vi work, deterministic-rule changes, a new third-party
service, or a schema migration.

## 64. Final sprint verdict

**SEO + SHAREABILITY FOUNDATION COMPLETE — READY FOR RELEASE CLOSURE**

Every item in this task's own §22 success bar is met: the public indexable surface is explicitly
defined and accurate (§6–7, §21); private/user-specific surfaces are noindex'd with defense in
depth (§7, §22); canonical metadata is correct everywhere it applies (§17); sitemap/robots are
coherent with each other and with the real route tree (§21–22); `/menh-vi` remains archived (§23);
BeaconVie remains the sole live brand (§8); Eastern Horoscope is never conflated with Tử Vi
(unchanged, verified not touched); share payloads contain no private data, adversarially tested
(§29–30); relevant tests/lint/typecheck/build all pass, with the one build-step failure being the
same pre-existing, already-documented Windows artifact hit twice before (§44); no open
Blocker/Critical/High/Medium/Low (§50–54); no Tử Vi implementation was touched (§62). The one
explicit scope boundary — full public, shareable Discovery entry points — is a documented
Stop-Condition-H product decision, not a gap in what this foundation pass itself set out to do.

## 65. Recommended next roadmap action

1. Review and, when ready, commit the 24 files in this pass (not done here, per instruction).
2. Bring the Stop-Condition-H finding to the founder/product owner as its own scoped decision:
   whether/how much to reveal each Discovery system publicly pre-login, and whether an interactive
   teaser or static copy better serves the signup funnel — once resolved, the metadata/shareability
   groundwork in `lib/seo.ts` and `ShareButton` makes adding those pages straightforward.
3. Commission real OG/social-preview artwork (§10's documented follow-up) — currently every shared
   link falls back to a plain text card on platforms that require an image.
4. Optional, low-priority: a `share_clicked` analytics event, scoped as its own small change to
   `packages/types/index.ts` + the backend DTO (§31), if/when share-conversion visibility becomes a
   real product question.
5. Sprint 24 (Product Complete Release Gate) remains the next roadmap milestone after any
   remaining P1/P2 items; Sprint 18 (Tử Vi) remains `BLOCKED_BY_DOMAIN_REFERENCE`, unaffected by
   this pass.
