# Sprint 18B.11 — Production Frontend — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (Next.js App Router feature, real HTTP against the real 18B.9/18B.10 API, real browser verification via Playwright against a live dev server — not a mock/storybook check).

---

## What shipped

Replaced the Discover hub's "Tử Vi Lá Số — Coming soon" card with a real, working feature:

- `packages/types/index.ts` — added `TuViChartDto` and its supporting types (`TuViChartStatusValue`, `TuViPalaceRoleValue`, `TuViTransformationValue`, `TuViStarPlacementDto`, `TuViPalacePairDto`, `TuViTransformationDto`, `TuViChartHistoryDto`, `ListTuViChartsResultDto`) — the shared-DTO layer this feature was missing (18B.9/18B.10 only defined the DTO shape inside `apps/api`, per CLAUDE.md's "shared DTOs belong in packages/types when used across web and API").
- `apps/web/features/tu-vi/` — new feature module: `api/tu-vi-api.ts` (thin `api.get/post/delete` wrapper, mirrors `eastern-horoscope-api.ts` exactly), `labels.ts` (status/palace-role/transformation English glosses, no AI wording), `tu-vi-projection.ts` (pure, non-calculating reshape of an already-real `TuViChartDto` into per-palace cells — the frontend's read-only re-derivation of the backend's own `buildPalaceProjection`), `components/tu-vi-dashboard.tsx`, `tu-vi-form.tsx`, `tu-vi-history-list.tsx`, `tu-vi-detail.tsx`, `tu-vi-chart-view.tsx`, `tu-vi-palace-grid.tsx`.
- `apps/web/app/(app)/discover/tu-vi/page.tsx` — the real route.
- `apps/web/app/(app)/discover/page.tsx` + its test — Tử Vi Lá Số flipped from `available: false` (no href) to `available: true, href: '/discover/tu-vi'`; the naming-boundary tests (Eastern Horoscope vs. Tử Vi Lá Số) were preserved, not weakened.

## Architecture reuse

Followed the same pattern used by every other Discovery feature (`eastern-horoscope`, `natal-chart`): `?item=<id>` "open detail in place" dashboard, form → reveal → history, a collapsible `Section` helper, the shared `AiInterpretation` component (not a bespoke one — Tử Vi's interpretation is plain narrative text like Eastern Horoscope's, unlike Natal Chart's structured sections, so the plain component was the right fit), lifecycle actions (archive/restore/delete) as `useMutation` + `toast`, `usePremiumStatus` for the free-history-cap banner. No new UI primitives were needed except the palace grid itself.

## The 12-palace grid (new UI, no precedent to copy)

Genuinely new work: the traditional Vietnamese lá số layout is a 4×4 grid (12 palaces around the border, a blank 2×2 center for chart identity — `Cục`/Can-Chi/lunar date). Implemented as real, directly-legible DOM (each palace a `role="group"` with a real `aria-label` and visible Vietnamese + English text) rather than an SVG-with-hidden-text-equivalent pattern (unlike `NatalChartWheel`, which is decorative/`aria-hidden` because a circular wheel genuinely isn't legible as text) — the 4×4 grid already reads as a table, so it doesn't need a separate accessible equivalent. Below `tablet` (768px) it becomes a single-column stacked list in clockwise reading order starting from Mệnh, rather than a shrunk, illegible grid — no information lost, just a different presentation. The two representations are both real DOM (CSS-toggled via `hidden`/`tablet:grid`/`tablet:hidden`), with the grid version listed first in source order since it's the primary representation.

## A real bug found and fixed via browser verification (not caught by unit tests or typecheck)

Per CLAUDE.md's "start the dev server and use the feature in a browser before reporting complete," registered a real user, walked the full flow, and screenshotted the result. The first render showed **the same Tứ Hóa superscript tag (e.g. "Q") on every star in a palace that had a transformation**, not just the one star the transformation actually targets — e.g. both Vũ Khúc and Phá Quân (co-located in Điền Trạch) showed the same tag, even though only one of them is the real `targetStar`. Root cause: `PalaceCell.transformations` had been flattened to bare transformation names, losing which star each one actually belonged to. Fixed by carrying the full `TuViTransformationDto` (with `targetStar`) through `tu-vi-projection.ts` and matching by star identity in `tu-vi-palace-grid.tsx`'s `starTags()`. Re-verified in the browser: only the correct star now carries each tag. Added a regression assertion to `tu-vi-projection.test.ts` (two different target stars in the same palace, asserting `transformations.map(t => t.targetStar)` rather than just the transformation names).

## Real browser verification (CLAUDE.md requirement)

Started both dev servers for real (`pnpm dev:api`, `next dev`), registered a real account, and drove the full flow with Playwright against the live app (not headless-only — screenshotted both a desktop and a 375px-mobile capture): Discover hub → "Tử Vi Lá Số" card (no longer "Coming soon") → real form (date/time/sex, including the empty-submit failure state showing a real validation message, never a fabricated result) → **VECTOR-B1** (`1984-02-02 00:30 Nam`, the same rule-derived vector independently verified at the engine and API layers in 18B.4–18B.9) → confirmed the rendered chart matches: `Hỏa Lục Cục`, Mệnh/Thân both at Dần (correctly badged), all 12 palace roles present and correctly labeled, main/auxiliary stars in their correct palaces, Tuần/Triệt markers on the correct palaces, and a populated "AI Interpretation" section visually/structurally distinct from the deterministic facts above it (Mock-provider text, disclosed — this dev environment's `DEFAULT_AI_PROVIDER=openai` has no billing credits and falls back to mock, same documented precedent as every other Discovery flow spec in this repo). Re-ran after the star-tag fix to confirm the correction.

Environment note (not a product issue, logged for future sessions): writing a dev-server log file **inside** `apps/api/` or `apps/web/` causes Nest's/Next's own file watcher to treat the log write as a source change and recompile in a loop — this produced two rounds of flaky registration failures before the log files were moved outside the watched trees. Also: running `next build` and `next dev` concurrently corrupts `.next` (`Cannot find module for page: /...`) since both processes write to the same directory — pre-existing Next.js behavior, not specific to this feature; fixed by sequencing build after stopping dev.

## Accessibility

Semantic headings (`h1`/`h2`/`h3` via `Section`), `fieldset`/`legend`/`role="radiogroup"` for sex selection (no bare unlabeled radios), every palace a labeled `group` with real visible text (no color-only status — Mệnh/Thân use both color and an explicit text badge), keyboard-operable radio inputs and buttons throughout (native elements, no custom widgets requiring extra ARIA), `noindex,follow` inherited automatically from the `(app)` layout (private route, no per-page SEO work needed).

## Terminology isolation from Eastern Horoscope

`TuViDashboard`'s intro copy explicitly disclaims "Not the same as Ngũ Hành Phương Đông" (mirrors Eastern Horoscope's own reciprocal disclaimer), routes never cross-link (`/discover/tu-vi` vs. `/discover/eastern-horoscope`), and the Discover page's naming-boundary test suite (`page.test.tsx`) was preserved and extended, not weakened, to keep proving this at the rendered-page level.

## Test results

- `apps/web` typecheck (`tsc --noEmit`): clean.
- `apps/web` lint (`eslint features/tu-vi/**` + `app/(app)/discover/**`): clean.
- New tests: `tu-vi-projection.test.ts` (9 tests — pure reshaping logic, including the Tứ Hóa target-star regression) and `tu-vi-dashboard.test.tsx` (7 tests — form/history/detail wiring, deterministic-vs-AI visual separation, all-12-palace-roles accessible rendering, no cross-links to Eastern Horoscope), plus `discover/page.test.tsx` rewritten for the now-live card (7 tests). **23 new/updated tests, all passing.**
- **Full frontend unit suite: 96 suites, 479/479 tests pass** (up from the pre-existing baseline; zero regressions).
- **Production build** (`next build`, `output: 'standalone'`): compiles, type-checks, lints, and generates all 52/52 static pages successfully (including the new `/discover/tu-vi` route). The final "copy traced files" step fails with `EPERM: operation not permitted, symlink ...` — a **pre-existing, previously-documented Windows-host-only limitation** (building a Linux/Docker-target standalone artifact without Windows Developer Mode/symlink privileges), identically described in `docs/progress/sprint-17-final-report.md` §42 ("compilation, type-checking, and static-page generation all succeed first; only the standalone-output symlink copy... fails... not a code defect"). Classified ENVIRONMENTAL per that same precedent — not attempted to be fixed by modifying product code; the real deployment target (Docker/Linux) is unaffected.

## Bugs discovered / fixed

One real product defect, found via browser verification (not by any automated gate): Tứ Hóa superscript tags were applied to every star in a palace rather than only the actual target star. Fixed (see above), verified live, regression test added.

## Security/privacy findings

None new — this phase adds no new API surface (reuses 18B.9/18B.10's endpoints exactly as designed) and no new client-side storage of sensitive data (React Query cache only, keyed `['tu-vi', ...]`, cleared on normal cache lifecycle).

## Stop conditions

**None triggered.**

## Files created

```
apps/web/features/tu-vi/api/tu-vi-api.ts
apps/web/features/tu-vi/labels.ts
apps/web/features/tu-vi/tu-vi-projection.ts
apps/web/features/tu-vi/tu-vi-projection.test.ts
apps/web/features/tu-vi/components/tu-vi-dashboard.tsx
apps/web/features/tu-vi/components/tu-vi-dashboard.test.tsx
apps/web/features/tu-vi/components/tu-vi-form.tsx
apps/web/features/tu-vi/components/tu-vi-history-list.tsx
apps/web/features/tu-vi/components/tu-vi-detail.tsx
apps/web/features/tu-vi/components/tu-vi-chart-view.tsx
apps/web/features/tu-vi/components/tu-vi-palace-grid.tsx
apps/web/app/(app)/discover/tu-vi/page.tsx
docs/progress/sprint-18b11-frontend-final-report.md
```

## Files modified

`packages/types/index.ts` (additive — new Tử Vi DTO section), `apps/web/app/(app)/discover/page.tsx` (Tử Vi Lá Số card flipped live), `apps/web/app/(app)/discover/page.test.tsx` (updated for the live card, naming-boundary assertions preserved).

## Deferred to 18B.12 (explicitly, not silently skipped)

Formal responsive QA across all 10 specified breakpoints (1440/1280/1100/1024/900/820/768/767/390/375) and a full axe accessibility scan — this phase verified the two structural breakpoints that matter for the grid/list CSS toggle (desktop ≥768px, and 375px mobile) via real browser screenshots, but the complete breakpoint sweep and automated a11y scan belong to 18B.12's dedicated QA pass, per the master prompt's own phase boundary.

## Verdict

**PASS — continuing automatically to Sprint 18B.12.**
