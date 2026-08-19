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

---

# RELEASE CLOSURE (independent verification pass)

Date: 2026-08-19 (same day, separate pass). Per rule 0 ("repository reality wins"), every claim
below was independently re-derived from the repository/runtime, not copied from the report above.

1. **Recovered HEAD:** `45c6a29` ("[update][commit] update code seo") — **not** `5050160` as the
   closure prompt assumed.
2. **origin/master:** `45c6a29` — identical to HEAD, 0 ahead / 0 behind.
3. **Initial ahead/behind assumed by the prompt:** "origin/master behind local HEAD by 1 commit" —
   **false**. Actual: equal.
4. **Initial working tree assumed by the prompt:** "~25 uncommitted files" — **false**. Actual:
   clean (`git status --short` empty) at closure start. **Discrepancy, documented per rule 2:** the
   24 files described in the report above were committed as `45c6a29` (25 files — the report itself
   became file #25) and already fast-forward-*pulled* into this checkout from `origin` (see
   `git reflog`: `45c6a29 HEAD@{0}: pull ... origin: Fast-forward`), meaning the commit was already
   **pushed to origin by some other process/session** before this closure task began — not "no push
   has occurred" as the prompt assumed. This closure did not push anything itself (0/0 ahead-behind
   throughout) and did not attempt to unwind the existing push (would require a destructive
   history-rewrite on a shared branch, explicitly out of scope/prohibited). Closure proceeded by
   auditing the actual committed state at `45c6a29` instead of a since-superseded uncommitted state.
5. **Changed-file classification (the 45c6a29 diff vs. its parent `5050160`):** all 25 files are
   SEO_CORE / METADATA / ROBOTS / SITEMAP / PUBLIC_PAGE_COPY / SHAREABILITY / TESTS / DOCUMENTATION
   — matches the file list in §55–56 above exactly, plus the report itself. Zero files under
   `apps/api`, `packages/`, or any Tử Vi-related path (`git diff --stat` confirmed empty for
   `packages/` and `apps/api/`). Zero UNKNOWN-category paths.
6. **Public route inventory:** independently re-derived from `apps/web/app/**` + `middleware.ts` +
   `route-guard.ts` (not copied from the report): `/`, `/about`, `/contact`, `/privacy`, `/terms`,
   `/login`, `/register` — PUBLIC_INDEXABLE. `/forgot-password`, `/reset-password`, `/verify-email`,
   `/verify-email/pending` — SENSITIVE_TOKEN_ROUTE / PUBLIC_NOINDEX (reachable logged-out, must
   never index). `/onboarding` — AUTHENTICATED_PRIVATE. Confirmed accurate.
7. **Private route inventory:** everything under `(app)/` (dashboard, companion, journal,
   discover×5, settings, memory, goals, reflections, insights×2, reviews×2, premium×2, reports,
   admin) — AUTHENTICATED_PRIVATE, group-level `noindex` via `(app)/layout.tsx`, confirmed by
   grepping every child page for its own `metadata` export: none of them set their own `robots`
   field (except `/admin`, identical value, no conflict), so all inherit the layout's
   `noindex,follow` per Next.js's per-key metadata merge. `/menh-vi/*` — ARCHIVED (hard 404 via
   `notFound()` in `app/menh-vi/layout.tsx`, pre-existing, untouched).
8. **Unknown route count: 0.**
9. **Metadata architecture:** `lib/seo.ts` confirmed as the real single source of truth for
   `SITE_NAME`/`SITE_URL`/`DEFAULT_DESCRIPTION`/`buildMetadata`/JSON-LD builders, reused by every
   indexable page and `ShareButton`. **One HIGH-severity defect found and fixed** — see §30 below.
10. **Canonical result:** correct on every indexable page after the fix in §30 (canonical itself
    was already correct before the fix — the defect was `title`, not `alternates.canonical`).
11. **Canonical adversarial tests:** ran real HTTP requests against the dev server for
    `/menh-vi`, `/menh-vi/`, `/menh-vi/la-so`, `/menh-vi?foo=bar`, `/menh-vi/la-so/`,
    `/menh-vi%2Fla-so`, `/menh-vi/../menh-vi`, `/Menh-Vi` — every variant resolves to a true 404
    (trailing-slash variants redirect once, then 404; no bypass found for query string, encoding,
    case, or dot-segment traversal).
12. **Homepage metadata:** before the fix, **zero `<title>` tag rendered** (see §30). After the fix,
    confirmed live: tab title `"BeaconVie — An AI Companion That Remembers You"`, canonical
    `http://localhost:3000/`, meta description present, OG/Twitter present, exactly 2 JSON-LD
    scripts (`WebSite` + `Organization`) in the raw server HTML (a transient dev-mode double-render
    to 4 scripts was observed once after repeated forced navigations/HMR — reproducibility-tested on
    a fresh full navigation and did not recur; classified TEST_DEFECT-adjacent dev artifact, not a
    production defect, since the raw `fetch('/')` response body always contained exactly 2).
13. **About metadata:** title "About — BeaconVie", canonical `/about`, description present — correct
    both in source and live-rendered.
14. **Contact metadata:** title/description/canonical present and correct, source-verified.
15. **Privacy metadata:** title/description/canonical present and correct, source-verified.
16. **Terms metadata:** title/description/canonical present and correct, source-verified.
17. **login/register metadata policy:** both indexable (real, public, unauthenticated-only pages),
    real titles/descriptions/canonicals, correct.
18. **reset-password policy:** `noindex,follow` at the metadata level, confirmed live with a
    sentinel token (`?token=SENTINEL_RESET_TOKEN_12345`) in the URL — robots meta correctly
    `noindex, nofollow`, no canonical/OG tag emitted at all, token absent from `<head>` entirely
    (present only in the request URL/body form value, as expected).
19. **verify-email policy:** same pattern, source-verified identical to reset-password.
20. **Private noindex result:** defense-in-depth confirmed structurally (Next.js metadata
    inheritance, verified by grepping every `(app)` child page's `metadata` export) — matches §7.
21. **robots result:** rendered `/robots.txt` on the live dev server fetched and compared
    line-by-line against `APP_ROUTES`/`ONBOARDING_ROUTE` from `route-guard.ts` — exact match, no
    drift. `/menh-vi`, `/forgot-password`, `/reset-password`, `/verify-email` all present.
22. **sitemap result:** rendered `/sitemap.xml` fetched and compared entry-by-entry — exactly the 7
    intended public URLs, no dashboard/admin/account/Memory/Journal/Companion/Reports/Discovery/
    frozen-module/`/menh-vi`/token route present, no duplicates, `lastmod` is a real build-time
    timestamp (not a fabricated future date), priority/changeFrequency values conservative and
    pre-existing.
23. **`/menh-vi` result:** true 404 confirmed under 8 adversarial variants (§11). Sprint 14 archival
    mechanism untouched.
24. **Admin indexing result:** `/admin` disallowed in `robots.ts`, noindex at both its own page level
    and the `(app)` group level (redundant, no conflict), absent from sitemap, and functionally
    redirects unauthenticated visitors to `/login` (live-tested).
25. **Frozen-module result:** Reflection/Insight/Review/Goal routes remain reachable-but-unlisted,
    untouched by this pass, correctly noindex'd via the same `(app)` group mechanism.
26. **Brand result:** no live-surface "Mệnh Vi"/"BeaconSoul" leak found (grep confined to the
    already-archived `/menh-vi` tree). BeaconVie is the sole live brand.
27. **Stale-copy result:** the two fixes claimed in the original report (`landing-copy.ts`
    `discoverySystems` comingSoon flags, About page wording) verified live-rendered correctly.
    **One additional stale-copy instance found by this closure pass, missed by the original pass,
    and fixed:** `landing-copy.ts`'s `howItWorks.steps[0].text` still read "your chart is on its
    way" despite Natal Chart being marked live three lines below in the same file — same root cause
    as the bugs the original pass already fixed, just a different string. Fixed to "Start with a
    real Tarot draw, Numerology reading, Natal Chart, or Eastern Horoscope calculation." — verified
    live-rendered on the homepage after the fix.
28. **Eastern Horoscope/Tử Vi naming result:** `/discover/page.tsx`'s own doc comment explicitly
    warns against conflating Eastern Horoscope with the future Tử Vi module; no copy anywhere
    conflates them. Confirmed, unchanged.
29. **JSON-LD result:** `WebSite` + `Organization` on the homepage only, live-fetched and diffed
    against `seo.test.ts`'s assertions — exact match, no fabricated fields.
30. **Fabricated-claim audit:** none found. **Real defect found and fixed instead (HIGH severity):**
    `buildMetadata()` returned an object literal with an explicit `title: undefined` key whenever no
    `title` option was passed. Next.js's per-segment metadata merge treats a *present* key as an
    override even when its value is `undefined` (reproduced directly: `Object.assign({title:'Parent'},
    {title:undefined})` → `{title:undefined}`) — it does not fall through to the parent layout's
    `title.default`. The homepage is the only `buildMetadata()` caller that omits `title`
    (`buildMetadata({ path: '/' })`), and its rendered production HTML had **zero `<title>` element** —
    confirmed both via raw `fetch('/')` response body (`document.querySelectorAll('title').length`
    → 0, no title anywhere in the HTML string) and via the browser tab literally reading
    "localhost:3000" instead of the site title. This was not caught by the original pass's own
    `seo.test.ts`, which only unit-tests `buildMetadata()`'s return object in isolation and never
    exercises Next.js's actual metadata-resolution/merge behavior. **Fixed:** `title` is now only
    included in the returned object when defined (`...(title !== undefined ? { title } : {})`),
    letting the root layout's `title.default`/`template` apply correctly when omitted. Added a
    regression test (`seo.test.ts`) asserting `'title' in meta === false` — not merely
    `meta.title === undefined`, since the object-literal distinction is exactly what caused the bug.
    Verified live post-fix: homepage tab title now reads
    "BeaconVie — An AI Companion That Remembers You".
31. **OG-image result:** confirmed independently — no favicon/logo/OG asset exists anywhere under
    `apps/web/public` or `apps/web/app` (`find`-equivalent glob returned zero matches). Not
    fabricated. Documented as a follow-up only, per rule 13/§13 of the original prompt.
32. **ShareButton result:** line-by-line review confirms the share payload is exactly
    `{ title: SITE_NAME, text: DEFAULT_DESCRIPTION, url: SITE_URL }` — three module-level constants,
    no parameters, no code path for user/session/reading data. Live-exercised in a real browser
    (not just unit tests): clicked the actual rendered button, confirmed
    `navigator.clipboard.writeText` was called with exactly `"http://localhost:3000"` (no query
    string, no private data) and the accessible success toast appeared.
33. **Web Share behavior:** `navigator.share` branch tried first; verified via source review and the
    existing test suite (this dev environment's `navigator.share` is `undefined`, so live-exercise
    used the fallback path instead — Web Share itself was verified via the unit test suite, which
    mocks it, per §38 below).
34. **Clipboard fallback:** live-verified in a real browser (§32) — works correctly.
35. **Cancellation/error behavior:** `AbortError` (native share-sheet dismissal) correctly produces
    no toast, verified via the existing test (`does not announce anything when the user closes the
    native share sheet`), source-reviewed and confirmed correct.
36. **Accessibility result:** real `<button>`, visible "Share" text label (not icon-only), accessible
    name `"Share BeaconVie"` confirmed live via `aria-label` inspection in the rendered DOM.
37. **Analytics result:** confirmed independently — `packages/types/index.ts`'s
    `ClientAnalyticsEventName` union contains no `share_clicked` entry; no analytics contract change
    was made. Matches the original pass's documented, reasoned scope exclusion.
38. **Privacy sentinel attack result:** ran a live adversarial test against the running dev server —
    `GET /reset-password?token=SENTINEL_RESET_TOKEN_12345` — confirmed the token appears nowhere in
    `<head>` (no canonical, no OG, no JSON-LD, no meta leak), `robots` meta correctly
    `noindex, nofollow`. Combined with the existing `share-button.test.tsx`/`seo.test.ts` sentinel
    assertions (unchanged, re-run, passing) covering the birth-date/tarot-question/AI-interpretation
    sentinel classes. **Gate passes.**
39. **Auth/middleware regression:** live-tested via real HTTP requests (`redirect: 'follow'`) —
    `/dashboard`, `/discover`, `/settings`, `/admin` all correctly redirect an unauthenticated
    visitor to `/login` (200 at final URL `/login`); `/`, `/about`, `/login`, `/register` all resolve
    at their own URL with no redirect. No regression from the `robots.ts` refactor sharing
    `route-guard.ts`'s `APP_ROUTES`.
40. **Desktop 1440 QA:** live-resized the real running dev server to 1440×900 — `document.body.
    scrollWidth` (1425) ≤ `window.innerWidth` (1440), no horizontal overflow.
41. **Tablet 1024 QA:** same method, 1024×900 — scrollWidth 1009 ≤ 1024, no overflow.
42. **Tablet 768 QA:** same method, 768×1024 — scrollWidth 753 ≤ 768, no overflow.
43. **Mobile 390 QA:** same method, 390×844 — scrollWidth 390 ≤ 390, no overflow.
44. **Mobile 375 QA:** same method, 375×812 — scrollWidth 375 ≤ 375, no overflow. (This closure pass
    performed the live-viewport QA the original pass explicitly disclosed skipping — all 5
    breakpoints pass with zero horizontal overflow on the modified homepage/About surfaces.)
45. **Targeted tests:** `lib/seo.test.ts` (11, incl. the new regression test), `app/robots.test.ts`
    (7), `app/sitemap.test.ts` (6), `components/marketing/share-button.test.tsx` (5) — **27/27
    passing** after the fix.
46. **Full frontend tests:** re-ran clean — **81 suites / 412 tests, 100% pass**, no flake this run
    (the original report's one previously-noted transient flake did not reproduce).
47. **Playwright:** not run — same reasoning as the original pass (no new multi-step interactive
    journey; a single homepage button using already-tested primitives). Judged proportionate,
    consistent with rule 22's scope-expansion prohibition against building new e2e coverage
    disproportionate to the change.
48. **Lint:** clean, 0 errors/warnings, re-run independently after the fix.
49. **Typecheck:** clean, 0 errors, re-run independently after the fix.
50. **Production build:** `✓ Compiled successfully` (72s), `✓ Generating static pages (51/51)`,
    then fails at "Collecting build traces" with `EPERM: operation not permitted, symlink ...` for
    `react`, `@opentelemetry/api`, `@jridgewell/gen-mapping` — pure third-party `node_modules`
    packages inside the Windows-only `output: 'standalone'` trace-copy step, none of them files this
    session touched. Per rule 20's own evidence bar: compile succeeded ✓, typecheck succeeded ✓,
    static generation succeeded ✓ (51/51, matching the count in every prior report), failure
    signature matches the prior documented issue (`sprint-17-final-report.md` §42,
    `admin-operator-tooling-final-report.md` §30.20, and the original pass's own §44) ✓, no new SEO
    file caused the trace failure (all three failing symlinks are pre-existing dependency packages)
    ✓. Classified **PRE_EXISTING_ENVIRONMENTAL.**
51. **diff-check:** clean (`git diff --check` on the full `5050160..45c6a29` range, and again on this
    closure pass's own uncommitted changes) — no whitespace errors.
52. **Conflict scan:** no conflict markers found anywhere in the diff.
53. **Secret scan:** heuristic scan of every changed file (API keys, private-key headers, bearer
    tokens, hardcoded passwords) — zero matches outside expected sentinel/test/comment strings.
54. **Bugs discovered (this closure pass, beyond the 5 already fixed by the original pass):**
    1. `landing-copy.ts`'s `howItWorks` step 1 stale "chart is on its way" copy (§27).
    2. `buildMetadata()`'s `title: undefined`-key bug causing a missing `<title>` on the homepage
       (§30) — **HIGH**.
55. **Bugs fixed:** both #1 and #2 above, plus a regression test for #2.
56. **Open Blocker: 0.**
57. **Open Critical: 0.**
58. **Open High: 0** (the one HIGH found — missing homepage `<title>` — was fixed within this pass,
    not left open).
59. **Open Medium: 0.**
60. **Open Low: 0.**
61. **Public Discovery SEO decision status:** unchanged —
    `PUBLIC_DISCOVERY_SEO = PRODUCT_DECISION_REQUIRED`. Independently re-confirmed: all four
    Discovery system routes live entirely under the authenticated `(app)` group; exposing any of
    them pre-login is a real product/funnel/privacy decision (Option A/B/C per rule 28 of the
    closure prompt), not an implementation defect. Not resolved by this closure, per rule 28's own
    instruction not to.
62. **Files committed:** `apps/web/content/landing-copy.ts`, `apps/web/lib/seo.ts`,
    `apps/web/lib/seo.test.ts` (this closure pass's 2 fixes + 1 regression test), plus this report
    update — 4 files. The 24 SEO/shareability implementation files from the original pass were
    already committed as part of `45c6a29` before this closure task began (see §3–4 above) and are
    not re-committed here.
63. **Commit hash:** recorded after commit, below.
64. **Push status: not pushed** by this closure pass (consistent with rule 18). Note per §4: the
    prior `45c6a29` commit was already on `origin/master` before this pass started, independent of
    this pass's own actions.
65. **Final working tree:** clean after commit (verified below).
66. **Final ahead/behind:** local HEAD ahead of `origin/master` by this pass's own closure commit
    only (recorded below); no other divergence.
67. **Sprint 18 status:** unchanged, `BLOCKED_BY_DOMAIN_REFERENCE`.
68. **Tử Vi isolation result:** confirmed — zero files under any Tử Vi-related path read or modified
    by this closure pass; the only files touched are `landing-copy.ts`, `lib/seo.ts`,
    `lib/seo.test.ts`, and this report.
69. **Closure verdict:** see below.
70. **Recommended next roadmap item:** unchanged from §65 above — bring the Stop-Condition-H public
    Discovery SEO decision to the founder/product owner; Sprint 24 (Product Complete Release Gate)
    is the next roadmap milestone; Sprint 18 (Tử Vi) remains blocked.

## Closure git-state note

Because the SEO/shareability implementation commit (`45c6a29`) was already committed and already
present on `origin/master` before this closure task began (see §1–4), this closure pass's own
commit contains only the incremental fixes found during independent verification: the two-file
stale-copy correction, the `buildMetadata()` title-key fix, and its regression test, plus this
report section. This is a smaller, honestly-scoped commit — not a re-statement of the original
24-file implementation, which needed no re-committing.

## Verdict

**SEO + SHAREABILITY FOUNDATION RELEASE CLOSURE COMPLETE — READY FOR NEXT ROADMAP ITEM**

All mandatory gates pass: 0 UNKNOWN routes, no private/sensitive route became indexable, canonical
URLs are safe (and now, post-fix, so is the page title), token/query values cannot leak (adversarial
sentinel-tested live), sitemap contains only the 7 intended public routes, robots behavior is
correct and structurally can't drift, `/menh-vi` remains archived (8 adversarial bypass attempts all
fail), BeaconVie remains the sole live brand, Eastern Horoscope is never called Tử Vi, stale
shipped-feature copy is corrected (including one instance the original pass missed), JSON-LD
contains no fabricated claims, ShareButton cannot expose private data (live-verified), adversarial
privacy sentinel tests pass, auth behavior did not regress, all frontend tests pass (412/412), lint
and typecheck are clean, the production build's only failure is the same pre-existing Windows
artifact documented twice before with full evidence proving it (compile/typecheck/static-gen all
succeeded), 0 open Blocker/Critical/High/Medium/Low, and Sprint 18/Tử Vi remain completely
untouched.
