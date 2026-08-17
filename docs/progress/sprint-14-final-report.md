# Sprint 14 — Ambiguity Cleanup — Final Report

1. **Starting HEAD:** `50c0e93` (feat: complete Sprint 13 production analytics foundation).
2. **origin/master:** `50c0e93` — identical.
3. **Ahead/behind:** 0/0.
4. **Working-tree baseline:** clean; both `50c0e93` and `2213cad` present; no merge/rebase/cherry-pick in progress; `git diff --check` clean throughout.
5. **`/menh-vi` inventory:** 14 route files (`app/menh-vi/{page,la-so,tarot,ban-do-sao,than-so-hoc,kham-pha,cong-dong,toi,tinh-duyen,su-nghiep,tai-chinh,suc-khoe,nhat-ky-van-menh}.tsx` + `layout.tsx`), 13 components + 2 mock-data modules under `features/menh-vi/`, and `mv-*` design tokens in `tailwind.config.ts`. Never linked from `sitemap.ts`, marketing pages, or `middleware.ts`'s matcher — publicly reachable, unauthenticated, own brand/design system, zero real functionality except `/menh-vi/tarot` (mock data, disconnected from the real Tarot backend).
6. **`/menh-vi` final disposition:** Archived. `layout.tsx` calls `notFound()`; `middleware.ts` rewrites every `/menh-vi(/:path*)` request to a genuinely unmatched path before Next's router runs, producing a real HTTP 404 (verified via `next start`, not just dev mode). Route files remain in the tree as preserved, unreachable dead code.
7. **Preserved prototype assets/components:** All of `apps/web/features/menh-vi/**` (components, mock data) and the `mv-*` Tailwind tokens — untouched, still compile/typecheck. `docs/design/menh-vi-*.md` design references untouched.
8. **Sitemap result:** No change needed — `/menh-vi` was never listed.
9. **Robots result:** `/menh-vi` added to `robots.ts`'s disallow list (defense in depth alongside the 404).
10. **Brand audit:** No `BeaconSoul` or other legacy brand anywhere in the repo. "Mệnh Vi" confined entirely to the now-archived `app/menh-vi/` and `features/menh-vi/` trees — CURRENT PRODUCTION surface has zero occurrences.
11. **BeaconVie naming result:** Sole live brand confirmed across landing (`app/layout.tsx` metadata), nav, and all authenticated routes.
12. **Frozen Reflection result:** Hidden from Settings (its only entry point); code/data/tests untouched; direct route (`/reflections`) still auth-gated and functional.
13. **Frozen Insight result:** Same — `/insights` (+ `/insights/internal`, pre-existing internal-only route, untouched).
14. **Frozen Review result:** Same — `/reviews` (+ `/reviews/:param`).
15. **Frozen Goal result:** Same — `/goals`.
16. **Frozen route direct-access policy:** Option A — remain available but unlisted (see `docs/architecture/product-surface-map.md` for rationale). No redirect, no internal-only gate; existing Playwright specs for these modules navigate directly and continue to pass unmodified.
17. **Dashboard result:** Audited — no frozen-module or `/menh-vi` references found; no changes needed.
18. **Settings result:** "More tools" card (the sole Reflection/Insight/Review/Goal entry point) removed. Account, Premium, password, sessions, Memory, notification-preference, and account-data sections untouched.
19. **Discover naming result:** Hub now shows Tarot / Bản Đồ Sao / Ngũ Hành Phương Đông / Thần Số Học, matching `vietnamese-tu-vi-product-definition.md` §1 exactly. Eastern Horoscope's card copy explicitly disclaims being Tử Vi Lá Số.
20. **Tử Vi future naming:** No live placeholder exists in the real product (the only prior "Tử Vi Lá Số" string lived inside the now-archived `/menh-vi/la-so`). No route/engine created — correctly out of scope.
21. **Eastern Horoscope naming:** Labeled "Ngũ Hành Phương Đông," "Coming soon," with copy stating it is not Tử Vi — cannot be confused with the future Tử Vi module.
22. **CLAUDE.md corrections:** Fixed the stale "companion is rule-based, not an LLM" claim (real since Sprint 2B); removed "Sprint 1" framing from the project-overview/constraints language; added brief, factual current-state notes on shipped Discovery systems, `/menh-vi`'s archived status, and the frozen four — without turning the file into a product spec.
23. **README/current-state corrections:** Fixed the stale `companion/` project-structure line and the "only Tarot is real" closing paragraph (Numerology/Natal Chart have since shipped); added notes on the frozen four and archived `/menh-vi`; softened the Sprint-1-pinned title/intro. Historical sprint narrative in the "What's real vs simplified" section left intact.
24. **Route inventory:** See `docs/architecture/product-surface-map.md` — full PUBLIC MARKETING / AUTHENTICATED PRODUCT / FROZEN DIRECT-ACCESS / ARCHIVED / FUTURE / INTERNAL matrix. No orphaned production navigation found.
25. **Middleware/auth result:** `middleware.ts` matcher extended with `/menh-vi` + `/menh-vi/:path*` (rewrite-only, no session fetch for archived routes). `route-guard.ts`'s `resolveRedirect`/`APP_ROUTES` untouched — zero auth regression risk on existing routes. No future Tử Vi route created.
26. **Dead CTA audit:** None found or introduced — the removed Settings links were the only frozen-module CTAs; Eastern Horoscope's "Coming soon" badge (pre-existing, unchanged) is non-interactive by design (no `href`, no button).
27. **Accessibility result:** Not comprehensively re-audited (no UI redesign occurred); the one interactive-control change (Settings card removal) removes controls cleanly with no orphaned `aria-*` references. No new coming-soon badge markup added beyond the pre-existing pattern.
28. **Analytics regression:** No analytics event names, properties, or trigger points changed. `discover_viewed`'s trigger point (`AnalyticsPageView` mount) is unaffected by the copy-only Discover changes.
29. **SEO regression:** `sitemap.ts` unchanged (still only public marketing routes); `robots.ts` gained one disallow entry; no canonical/OpenGraph metadata changed except `/menh-vi`'s own (now `noindex, nofollow`, moot given the 404).
30. **Backend changes:** None. Zero files under `apps/api/` touched.
31. **Prisma/migration status:** No schema or migration changes — none were needed or justified.
32. **Frontend unit result:** 74/74 suites, 369/369 tests passing (2 new tests added for `isArchivedRoute`). Lint and typecheck both clean.
33. **Backend unit/e2e result:** Not run — zero backend/middleware-adjacent backend files changed; Postgres/Redis/Docker are unavailable in this session (consistent with Sprint 13's own documented finding on this host).
34. **Sprint 14 Playwright result:** New spec `flow-26-ambiguity-cleanup.spec.ts` added (landing brand check, `/menh-vi` + sub-route 404, Settings frozen-link absence + direct-route reachability, Discover naming) and `flow-23-natal-chart-discovery.spec.ts` updated for the new hub copy — **not executed** in this session; Docker/Postgres/Redis unavailable (verified: `docker info` fails, ports 5433/6380 closed). Both specs pass lint/typecheck and were reviewed by hand against the actual rendered copy (verified live via a local `next start` server against the two changed pages).
35. **Core Playwright regression:** Not executed, same infra limitation. No core-flow code (auth, onboarding, Companion, Tarot/Numerology/Natal Chart, Premium, Notifications, account data rights) was touched this sprint — only Discover's display copy and one Playwright assertion updated to match it.
36. **Desktop manual result:** Verified live via a local `next start` production server (temporarily built without `output: 'standalone'` to route around this Windows host's separate, pre-existing symlink limitation): `/menh-vi` and `/menh-vi/la-so` return HTTP 404 with the correct "Page not found" UI; `/discover` sanity-redirects (307, unauthenticated) as expected; an unrelated nonexistent path also correctly 404s, confirming no over-broad rewrite.
37. **Tablet manual result:** Not separately re-verified — no layout/breakpoint code touched this sprint (Settings card removal and Discover label text are the only visual changes, both within existing responsive containers). No regression risk identified; the known tablet-nav issue (P1/backlog) is untouched.
38. **Mobile manual result:** Same as tablet — no navigation/menu code touched.
39. **Production build:** `next build` compiles cleanly, typechecks cleanly, lints cleanly, and generates all 48 static pages successfully (including the archived `/menh-vi/*` routes). The `output: 'standalone'` trace-copy step fails with the same pre-existing Windows-host-only `EPERM` symlink error Sprint 13 already documented and verified fine under Docker (`docs/progress/sprint-13-final-report.md` §"Docker verification"); Docker is unavailable in this session to re-confirm.
40. **Security findings:** None. No auth/session logic changed; the new middleware branch runs before and independently of the existing `fetchMe`/`resolveRedirect` logic, adds no new data exposure, and was verified to affect only `/menh-vi*` paths (spot-checked that `/discover` and a random nonexistent path are unaffected).
41. **Bugs discovered:** A real one — `notFound()` called from a Next.js 15.5.22 App Router **layout** renders the correct UI but does not set the response's HTTP status to 404 for statically-generated routes; confirmed on both `next dev` and a real `next start` build. Not previously known/documented in this repo.
42. **Bugs fixed:** The above — fixed via a `middleware.ts` rewrite to a genuinely unmatched path (verified real 404 via `curl`), rather than relying on layout-level `notFound()` alone.
43. **Open Blocker:** None.
44. **Open High:** None.
45. **Open Medium:** Full Playwright/backend e2e regression for this sprint's changes is unexecuted pending Docker/DB availability (item 33–35) — recommend running `pnpm --filter @beaconvie/web test:e2e` (specifically `flow-26` and `flow-23`) and `pnpm test:e2e` (API) in an environment with Docker before Release Closure signs off.
46. **Open Low:** None newly introduced. Pre-existing tablet-nav issue (P1/backlog) and Sprint-13-documented Windows standalone-build symlink limitation remain as previously tracked, unrelated to this sprint.
47. **Files created:** `docs/progress/sprint-14-progress.md`, `docs/architecture/product-surface-map.md`, `docs/progress/sprint-14-final-report.md`, `apps/web/app/menh-vi/not-found.tsx`, `apps/web/e2e/flow-26-ambiguity-cleanup.spec.ts`.
48. **Files modified:** `CLAUDE.md`, `README.md`, `apps/web/app/(app)/discover/page.tsx`, `apps/web/app/(app)/settings/page.tsx`, `apps/web/app/menh-vi/layout.tsx`, `apps/web/app/robots.ts`, `apps/web/e2e/flow-23-natal-chart-discovery.spec.ts`, `apps/web/lib/route-guard.ts`, `apps/web/lib/route-guard.test.ts`, `apps/web/middleware.ts`.
49. **`git diff --check`:** Clean (only a benign LF→CRLF line-ending notice from Git on Windows, not a whitespace error).
50. **Working tree:** All changes above are unstaged/uncommitted, as instructed; nothing else in the tree was touched.
51. **Commit status:** Not committed, per instruction.
52. **Push status:** Not pushed, per instruction.
53. **Sprint 14 verdict:** Complete for everything executable in this environment. The four DoD items from Roadmap V2 (`/menh-vi/*` unreachable publicly; Settings no longer surfaces the frozen four; CLAUDE.md accurate; Discover hub copy updated) are all met and verified — including a genuine correctness bug (layout-level `notFound()` returning 200) found and fixed, not just papered over. The one gap is environmental, not scope: Playwright/backend e2e regression could not be executed for lack of Docker/DB in this session.
54. **Exact Sprint 15 entry criteria:** Per Roadmap V2, Sprint 15 (Vietnamese Tử Vi Domain & Calculation Specification) requires the founder checklist item "Tử Vi authoritative source(s) identified/engaged" — independent of and not blocked by this sprint. Recommend Sprint 14's Playwright/e2e regression (item 45) be executed once Docker/DB is available, ideally before or in parallel with Sprint 15 kickoff, not as a hard gate on it.
55. **Recommended Release Closure checks:** (a) run `flow-26-ambiguity-cleanup.spec.ts` and `flow-23-natal-chart-discovery.spec.ts` against a real running stack; (b) run the full Playwright suite once to confirm zero regression on unrelated flows; (c) if Docker is available, build `apps/web/Dockerfile` to re-confirm the `output: 'standalone'` step succeeds in Linux (as Sprint 13 did) — this sprint did not need to touch the Dockerfile or verify it again, but a fresh confirmation is cheap given middleware changed; (d) spot-check `/menh-vi` returns 404 against the actual deployed/staging domain, not just localhost.

SPRINT 14 COMPLETE — READY FOR RELEASE CLOSURE

---

## RELEASE CLOSURE (independent verification pass)

**Everything above this line is the unedited implementation-time report.** This section records a
separate, independent verification pass that did not trust the report above and re-derived every
claim from the actual repository, a real running stack, and a real Docker build.

### Baseline re-recovery
HEAD/origin/master both `50c0e93`, 0/0 ahead-behind, working tree matches the implementation
session's own diff exactly (same 15 files: 10 modified, 5 new) — independently re-confirmed via
`git status --short` / `git diff --stat` / `git diff --check` before touching anything.

### File classification (no ambiguous paths)
MENH_VI_ARCHIVE: `app/menh-vi/layout.tsx`, `app/menh-vi/not-found.tsx`. MIDDLEWARE: `middleware.ts`,
`lib/route-guard.ts`, `lib/route-guard.test.ts`. ROBOTS/SEO: `app/robots.ts`. FROZEN_UX:
`app/(app)/settings/page.tsx`. DISCOVER_NAMING: `app/(app)/discover/page.tsx`,
`e2e/flow-23-natal-chart-discovery.spec.ts`. DOCS: `CLAUDE.md`, `README.md`,
`docs/architecture/product-surface-map.md`, `docs/progress/sprint-14-{progress,final-report}.md`.
TESTS: `e2e/flow-26-ambiguity-cleanup.spec.ts`. UNRELATED: none.

### `/menh-vi` re-inventory
Re-enumerated independently: 14 route `page.tsx` files (1 root + 13 sub-routes) + `layout.tsx` +
the new `not-found.tsx` = 16 files under `app/menh-vi/`, matching the reported count exactly. No
dynamic-segment (`[...slug]`) routes exist, so nothing could have been missed by static
enumeration.

### Infra recovery — Docker/Postgres/Redis/Mailpit
Docker Desktop was not running (daemon unreachable via `docker info`); the CLI and executable were
present, so it was launched (`Start-Process "Docker Desktop.exe"`) and polled until the daemon
came up (~2 min). `docker compose up -d` then found all three containers (`beaconvie-postgres`,
`beaconvie-redis`, `beaconvie-mailpit`) already `Up ... (healthy)` — Docker Desktop had preserved
them from a prior session. Verified directly: `pg_isready` → accepting connections, `redis-cli
ping` → `PONG`, `curl` to Mailpit's UI → `200`. This unblocked every item the implementation
session had marked unverified.

### **Critical finding: the reported HTTP-404 fix was incomplete**
The implementation session's own report (item 41 above) is directionally correct — it found and
fixed a real bug — but its verification method (temporarily disabling `output: 'standalone'` to
run a local `next start`) was never re-checked against the *actual* committed configuration with
a *real* Docker build. Doing exactly that here surfaced a second, separate defect: the first
`docker build` invocation (with no `--build-arg`s) failed outright with `Failed to collect page
data for /discover/numerology` / `TypeError: Invalid URL` — because `apps/web/Dockerfile` requires
`NEXT_PUBLIC_API_URL` etc. as build args, which were never supplied. **This is not a Sprint 14
regression** — the Dockerfile's build-arg contract predates this sprint and Sprint 14 touches
nothing the numerology page depends on — but it means the implementation session's build claims
were never actually exercised against the real deployment path in this session; they are now.
Rebuilding with the correct `--build-arg`s (matching `apps/web/.env`'s local values) succeeded
end-to-end: compiled, typechecked, generated all 48 static pages, and the `output: 'standalone'`
copy step — which fails locally on this Windows host — completed without error inside the Linux
build, exactly as Sprint 13's own report found.

### HTTP status verification — real Docker/Linux production image
Ran the built image (`docker run`) and checked every representative case with `curl`:

| Path | Status | |
|---|---|---|
| `/menh-vi` | **404** | |
| `/menh-vi/tarot`, `/menh-vi/la-so` | **404** | |
| `/menh-vi/nonexistent` (never-existed sub-route) | **404** | |
| `/menh-vi/` (trailing slash) | 308 → `/menh-vi` → **404** | Next's own global trailing-slash redirect fires first; final resolved status is still 404, not a bypass |
| `/menh-vi?x=1` (query string) | **404** | |
| `/menh-vi/foo/bar/baz` (nested) | **404** | |
| `/menh-vi%2Ffoo` (encoded slash) | **404** | |
| `/Menh-Vi`, `/MENH-VI` (case variants) | **404** | |
| `/menh-vi-something` (similar prefix, not a real archived path) | 404 (via Next's ordinary routing, not the archive rule — confirmed `isArchivedRoute` does not over-match) | |
| `/`, `/login`, `/register`, `/robots.txt`, `/sitemap.xml` | 200 | unaffected |
| `/dashboard`, `/discover(/*)`, `/premium`, `/settings` (unauthenticated) | 307 → login | unaffected, correct pre-existing behavior |
| `/nope-xyz` (genuine unmatched route) | 404 | sanity control |

No bypass found in any variant. The trailing-slash case was the only one worth a second look — it
redirects before the archive rule's rewrite even matters, but still lands on a real 404, so it is
not a bypass.

### `notFound()` defense-in-depth — why both layers exist
Confirmed both are still present: `layout.tsx` still calls `notFound()` unconditionally, and
`app/menh-vi/not-found.tsx` still exists as its local boundary. With the `middleware.ts` rewrite in
place, these two files are **not currently on the request path in production** — the rewrite
intercepts every `/menh-vi*` request before Next's router resolves to this layout at all. They are
retained deliberately as defense-in-depth: if the middleware matcher is ever edited incorrectly (a
typo removing `/menh-vi` from the `config.matcher` array, for instance), the layout's own
`notFound()` still prevents the real Mệnh Vi UI from rendering — visitors would see a wrong-status
(200) not-found page rather than the live archived prototype. Documented in
`product-surface-map.md`; this finding doesn't change that document's disposition, so it was not
edited.

### robots.txt / sitemap.xml — live-served content
Fetched both from the running container (not just read from source): `robots.txt` disallows
`/menh-vi` alongside the pre-existing authenticated-route list; `sitemap.xml` contains exactly the
7 public marketing URLs, no `/menh-vi`, no authenticated route. Matches the source-level review.

### Brand search — re-run independently
`grep -r` for `Mệnh Vi|Menh Vi|menh-vi|BeaconSoul` across `apps/web` (excluding `.next`): 36 files,
every one of them either (a) the archived `app/menh-vi/**` / `features/menh-vi/**` tree, (b) the
Sprint 14 files that *reference* the archival by name in comments/logic (`middleware.ts`,
`route-guard.ts`, `robots.ts`, the new `not-found.tsx`, `flow-26`), or (c) `tailwind.config.ts`'s
preserved `mv-*` design tokens. Zero occurrences in marketing pages, nav, Dashboard, or any live
authenticated surface. No `BeaconSoul` anywhere. Classification: all ARCHIVED CODE or TEST — no
LIVE PRODUCT BUG.

### Frozen-module UX re-audit
Re-grepped `nav-items.ts`, `app-header.tsx`, `app-shell.tsx`, `sidebar.tsx`,
`mobile-navigation.tsx`, `marketing-header.tsx`, `dashboard/page.tsx`, and `settings/page.tsx`
independently for `reflections|insights|reviews|goals` (case-insensitive): the only match left is
an unrelated sentence fragment in Settings ("Controls only the very first **reflections**
BeaconVie saved during onboarding" — describes onboarding memory, not the Reflection module). Zero
promotional entry points remain anywhere.

### Frontend unit — fresh run
74/74 suites, 369/369 tests, clean lint, clean typecheck — re-run from a clean invocation after
Docker recovery, not reused from the implementation session's numbers.

### Backend — now verifiable, run fresh (previously blocked)
`pnpm --filter @beaconvie/api typecheck` and `build`: clean. `pnpm --filter @beaconvie/api test`:
**109/109 suites, 1059/1059 tests passing.** Zero backend files are in this sprint's diff, so this
is a pure regression check, not new coverage — it confirms the "no backend changes" claim (item 30
above) rather than merely trusting it.

### flow-26 — run, one real defect found and fixed, then re-run for stability
First run: 2/3 passed, 1 failed. The failure was in flow-26 itself, not the product: the test
asserted zero occurrences of the substring "Tử Vi" anywhere on `/discover`, but the Eastern
Horoscope card's own copy — written this sprint, deliberately — says *"(Not Vietnamese Tử Vi Lá
Số, a separate future module.)"*, which correctly *mentions* Tử Vi in order to disclaim it. That's
the intended anti-ambiguity behavior, not a bug; the test's assertion was simply too broad.
Rewrote the assertion to check for the *absence of a Tử Vi-titled card* (exact-match on `'Tử Vi'`
and `'Tử Vi Lá Số'` as card content) plus the *presence* of the disclaimer sentence, which is what
the sprint actually needs to guarantee. Re-ran twice after the fix: **3/3 passed both times.**

### flow-23 — natal chart regression
1/1 passed — Discover → "Bản Đồ Sao" card → calculate → Big Three/wheel/planet/aspect →
history/detail → lifecycle → Companion bridge, all intact after the label rename.

### Core Playwright regression
Ran every other flow spec in the suite (25 files total, all of flow-1 through flow-25):
**auth/onboarding, login, forgot/reset password, Companion (create/stream/cancel/retry), Memory
(remember/timeline/edit/versions/archive/restore/delete/disable-consent/empty-state),
Companion+Memory integration, Journal lifecycle, Tarot, Numerology, Premium/payment,
Notifications, Account data rights** — all passed.

### Full Playwright suite — result and failure classification
26 spec files run in total (every flow in the repo). **4 failures**, all confined to
`flow-15-reflection-foundation.spec.ts` (both its cases) and one case each in
`flow-16-insight-preparation.spec.ts` / `flow-17-insight-experience.spec.ts` — every failure
timed out waiting for a background reflection-candidate/insight-generation job to materialize
within the spec's 10-second window. **Classification: C (known frozen-module flake), not a Sprint
14 regression.** This exact signature — same specs, same "background pattern-detection job doesn't
materialize in time" cause, same 10-second window — is independently documented as reproduced
across at least 4 prior sessions (`docs/audit/sprint-11-pre-implementation-audit.md` §31: "Sprint 8
baseline, Sprint 9 closure, Sprint 10 implementation, Sprint 10 closure"), and `playwright.config.ts`
has `retries: 0`, so it "will always surface as a hard CI failure on the first bad timing roll" —
exactly what happened here. `flow-18-review-engine.spec.ts` (also historically flagged flaky in
that same audit) passed cleanly both times it ran in this session, consistent with the
environment-sensitive diagnosis. Zero Sprint 14 file touches `apps/api/src/reflection`,
`apps/api/src/insight`, or their frontend feature folders — confirmed via `git diff --stat`, empty.
Per this closure brief's own instruction ("Do NOT modify frozen-module business logic") and the
original implementation brief ("Do not repair unrelated historical flakes unless Sprint 14 directly
exposes a new defect"), this was not touched.

### Analytics / SEO regression
`discover_viewed`'s `AnalyticsPageView` mount point is unchanged (still line-for-line the same
component call); `/menh-vi` is intercepted by middleware before any React component (including any
analytics hook) ever mounts — confirmed the root `not-found.tsx` it resolves to has zero analytics
imports. `robots.txt`/`sitemap.xml` re-verified live (see above) — no archived or frozen-module
exposure.

### Manual QA
Desktop: verified via live `curl`/`docker run` against the real Docker/Linux image (landing brand,
`/menh-vi` 404 with correct body, robots/sitemap content) — stronger evidence than a visual
walkthrough. Mobile: resized to 375×812 and confirmed no horizontal scroll overflow on `/menh-vi`'s
404 page and the landing page via `document.documentElement.scrollWidth` vs `clientWidth`. An
authenticated mobile walkthrough of Settings/Discover was attempted but the sandboxed Browser
pane's click interaction is non-functional in this environment (confirmed via repeated timeouts,
consistent with its earlier screenshot failures) — this is a tool limitation, not a product
finding. Settings/Discover's actual rendering and interaction correctness is instead covered by
`flow-26`/`flow-23`'s real, passing Playwright assertions (Desktop Chrome viewport), and the
Sprint 14 diff makes no layout/breakpoint changes to either page (pure element removal on
Settings; equal-or-shorter label text within already-proven `Card`/`Badge` components on
Discover) — low residual risk, disclosed rather than papered over. Tablet: same reasoning, not
independently re-walked; the pre-existing tablet-nav issue is untouched.

### Security review
No auth/session logic changed (`resolveRedirect`/`APP_ROUTES` byte-identical to before). The new
middleware branch runs first and returns early only for `/menh-vi*`, confirmed via the bypass-variant
table above to affect nothing else. No internal/frozen route gained or lost exposure — `route-guard.ts`'s
`APP_ROUTES` list is unchanged, so `/goals`, `/reflections`, `/insights`, `/reviews` remain exactly
as auth-gated as before. No Blocker/High finding.

### Scope-creep check
`git diff --name-only` piped through a case-insensitive grep for
`tu-vi|tuvi|eastern-horoscope|zodiac|lá số|reports-engine|community`: only matches inside
`CLAUDE.md`, `README.md`, `discover/page.tsx`, and `flow-23` — all of them naming/documentation
references distinguishing Tử Vi/Eastern Horoscope as *not yet built*, not implementation. Zero
Prisma diff. Zero new backend modules.

### New finding this pass — LOW / INFORMATIONAL, not fixed (out of committed scope)
The **marketing landing page's** "Discovery systems" preview section (`components/marketing/
discovery-systems.tsx`, unauthenticated `/`) still reads "Natal Chart" and "Numerology" — the old
English names — while the authenticated `/discover` hub now reads "Bản Đồ Sao" and "Thần Số Học".
This file was not part of Sprint 14's diff (confirmed: `git diff --stat` shows zero changes to
`components/marketing/**`) and Roadmap V2's Sprint 14 scope explicitly named "Discover hub copy,"
not the separate marketing teaser. Not a regression, not ambiguous about Tử Vi (the marketing page
never mentions Tử Vi at all), and not a dead CTA. Flagged as a candidate for a small follow-up
(either its own tiny fix or folded into Sprint 23's SEO/public-content pass) rather than expanded
into this sprint's scope without a corresponding report claim to back it.

### Static gates — re-run fresh
`git diff --check`: clean. Conflict-marker scan (`<<<<<<<` / `=======` / `>>>>>>>`) across every
changed file: zero matches. Secret scan (API keys, private-key headers, `sk-`/`ghp_` tokens,
`password=`/`secret=` patterns) across the diff: zero matches. Lint/typecheck: clean (see above).

### Final finding classification
- **BLOCKER:** none.
- **HIGH:** none.
- **MEDIUM:** none remaining — the one Medium the implementation session left open (full
  Playwright/backend regression unexecuted) is now closed by this pass.
- **LOW:** the marketing-landing naming inconsistency above (pre-existing surface, not this
  sprint's diff, not user-confusing about Tử Vi specifically).
- **INFORMATIONAL:** the implementation session's Docker-build verification claim was based on a
  workaround (disabling `output: 'standalone'` locally) rather than a real Docker build; this pass
  ran the real Docker build and it is genuinely fine, but the distinction is worth recording for
  future sessions that inherit this report.

### Runtime-unverified items
None remain. Every item the implementation session marked unverified (flow-26, flow-23, full
Playwright, backend regression, Docker) has been executed in this pass.

### Verdict
**READY FOR SPRINT 15.** All four Roadmap V2 Sprint 14 DoD items independently re-confirmed against
a real Docker/Linux production image, a real Postgres/Redis-backed API, and the full Playwright
suite — not just re-stated from the implementation session's report. No unresolved Blocker/High.
The only failures found (flow-15/16/17) are a pre-existing, independently-documented flake outside
this sprint's scope, correctly left untouched. One genuine test-authoring defect (flow-26's
over-broad assertion) was found and fixed. One LOW documentation-consistency item is flagged for a
future small follow-up, not blocking.

**Sprint 15 entry criteria (unchanged from the implementation report):** Roadmap V2 Sprint 15
(Vietnamese Tử Vi Domain & Calculation Specification) requires the founder checklist item "Tử Vi
authoritative source(s) identified/engaged" — independent of and not blocked by Sprint 14. Per this
closure brief's explicit instruction, no Tử Vi work of any kind (engine, route, naming beyond what
already exists) begins as a result of this READY verdict.

SPRINT 14 RELEASE CLOSURE — READY FOR SPRINT 15 (SPECIFICATION ONLY — NO IMPLEMENTATION)
