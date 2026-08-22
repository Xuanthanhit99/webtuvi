# Tử Vi Time Cycles — Release Closure (2026-08-22)

Continuation of the Tử Vi Depth Completion pass (same session lineage). Companion docs:
`docs/audit/tu-vi-depth-completion-audit.md`, `docs/domain/tu-vi/tu-vi-depth-v1-decision.md`,
`docs/progress/tu-vi-depth-completion-final-report.md`, and this pass's additive addenda to
`docs/domain/tu-vi/domain-decision-register.md`.

**Not committed. Not pushed. Not deployed.** Left as reviewable working-tree state, per policy.

---

## 1–5. Repository state recovered

`HEAD = origin/master = c3760dc`, 0 ahead / 0 behind at session start. Working tree contained only
this session's own prior work (competitive-gap-audit pass + Tử Vi Depth Completion pass) — no
unexplained inherited changes. Verified fresh, not trusted from the prior session's own claim.

## 6. Dignity founder decision status

`TUVI_STAR_DIGNITY_V1 = ENABLED` — founder decision received and recorded additively in
`domain-decision-register.md` (DECISION-11). Not reverted; the prior pass's implementation stands
unchanged.

## 7–8. Đại Vận engine audit / end-to-end status

Re-read `tu-vi-dai-van.ts` fresh (not trusted from the prior session's own summary) — confirmed
sound: direction rule (dương nam/âm nữ thuận, âm nam/dương nữ nghịch), Cục-dependent starting age,
10-year intervals, reuses the already-proven `PALACE_ROLES_FROM_MENH`/`addPalaceOffset` primitives.
No rewrite needed. **Status: SHIPPED END-TO-END this pass** — persistence (`daiVan` JSON column),
API (`TuViChartDto.daiVan` + `currentDaiVan`, computed fresh per read), frontend
(`TuViDaiVanTimeline`, selectable period timeline with the current period pre-highlighted).

## 9–11. Tiểu Hạn engine audit / supported V1 scope / end-to-end status

Re-read `tu-vi-tieu-han.ts` fresh — confirmed sound: sex-only direction (verified NOT to also depend
on yin-yang, unlike Đại Vận), starting-palace table complete (12/12 branches), age ≥ 13 boundary
enforced by a hard `RangeError` (never silently wrong for the unimplemented child system). **V1
scope: adults only (tuổi ≥ 13).** **Status: SHIPPED END-TO-END this pass** — persistence
(`tieuHanStart` JSON column), API (`currentTieuHan` + `nearbyTieuHan`, a real ±2-year window computed
server-side, including real lunar calendar years — never re-derived client-side), frontend
(`TuViTieuHanYearNav`, with an honest "áp dụng từ 13 tuổi trở lên" state when unsupported, never a
fabricated result).

## 12–13. Lưu Niên evidence result / TUVI_LUU_NIEN_V1_SCOPE

Re-confirmed from the prior pass's research (not re-derived): "Lưu Niên" is not a standalone system
in the primary source — it is a qualifier used two ways.

| Item | Classification |
|---|---|
| A. Annual Can Chi context | `NOT_PART_OF_V1` — no V1 feature needs this independently of Tiểu Hạn |
| B. Annual palace/time-cycle position | `ALREADY_AVAILABLE` — this **is** Tiểu Hạn, shipped above |
| C. Annual Tứ Hóa | `NOT_PART_OF_V1` — Tứ Hóa is birth-chart-fixed in this engine, not annually recomputed; no primary-source evidence read this session supports an annual Tứ Hóa layer |
| D. Lưu auxiliary stars (Lưu Thái Tuế, Lưu Lộc Tồn, etc.) | `BLOCKED_BY_DOMAIN_EVIDENCE` — genuinely incomplete extraction (2 of 3+ star groups transcribed, one star's rule never located) |
| E. Annual AI interpretation | `NOT_PART_OF_V1` — no deterministic annual-interpretation rule exists to ground it in |
| F. "Lưu Đại Hạn" (separate cycle system) | `BLOCKED_BY_DOMAIN_EVIDENCE` for implementation — sourced but deliberately deferred to bound this pass's scope |

**A cleanly bounded V1 with Đại Vận + Tiểu Hạn (item B) is what shipped.** No fake Lưu Niên
completeness was added.

## 14–16. Rules implemented / deferred / blocked

**Implemented:** Đại Vận core 10-year assignment (both directions); Tiểu Hạn adult annual
assignment (both directions); server-side "current cycle" + "nearby years" resolution.
**Deferred (sourced, scope-bounded):** Lưu Đại Hạn annual sub-cycle.
**Blocked (domain evidence):** Tiểu Hạn child (<13) table (uncertain OCR reconstruction); Lưu Niên
auxiliary "Lưu" stars (incomplete extraction).

## 17–20. Persistence / migrations / engine-version / exportVersion decisions

Two new Prisma migrations this pass: `20260822032932_tu_vi_dignity_version` (from the prior pass,
re-confirmed applied) and `20260822042508_tu_vi_cycle_persistence` (new `daiVan Json`,
`tieuHanStart Json`, `cycleVersion String` columns on `TuViChart`). Both hand-edited to backfill the
13 pre-existing local-dev rows (never real production data) with an empty/neutral state, then drop
the default — matching this table's own established per-column versioning discipline (one version
identifier per independently-evolvable rule layer: `mainStarVersion`, `dignityVersion`,
`cycleVersion`, distinct on purpose). **No `exportVersion` bump was needed or made** — the account
data-export pipeline serializes whatever `TuViChartDto` currently contains via the same mapper this
pass extended; no separate export-specific schema exists for Tử Vi (confirmed by inspection — not
assumed). Historical-chart compatibility: verified via a dedicated test
(`tu-vi.mappers.spec.ts`: "returns null for both when daiVan is empty... never crashes").

## 21–22. API / frontend changes

**API:** no new endpoints — the existing authenticated lifecycle (`calculate`/`list`/`getOne`)
automatically returns the new fields via the extended mapper. No anonymous compute added. IDOR/
mass-assignment/rate-limiting all unchanged (this pass touched zero controller/guard code).
**Frontend:** two new components (`TuViDaiVanTimeline`, `TuViTieuHanYearNav`), wired into the real
chart detail view (`TuViChartView`), positioned after the palace grid/summary and before the deeper
Tứ Hóa/Tuần-Triệt technical sections — closer to the top than the prior structure's most technical
content, without a full reorder (audited first, per instruction; the existing hierarchy was judged
sound enough not to warrant a full rework).

## 23–26. Đại Vận UX / Tiểu Hạn UX / beginner UX / advanced UX

**Đại Vận:** a horizontally-scrollable period-selector (all periods visible as chips, current one
marked with `aria-current` and a dot indicator), selecting a period reveals age range, palace
role+English gloss, and position in a detail panel below — progressive disclosure, not a raw table
dump. **Tiểu Hạn:** a small ±2-year window with real lunar calendar years, current year marked.
**Beginner UX:** both sections lead with plain framing ("Đại Vận — chu kỳ 10 năm") and a one-line
deterministic-not-AI disclosure sentence; no jargon, no internal version strings exposed anywhere in
either component. **Advanced UX:** the full 12-cycle Đại Vận table remains fully inspectable (every
period is a real, clickable chip, not summarized away); "Vị trí" (position) is shown alongside the
palace role for anyone who wants the raw branch.

## 27. AI boundary

**Deliberately NOT extended this pass.** Tử Vi AI interpretation is generated once and treated as
permanent (`tu-vi-interpretation.service.ts`'s own doc comment: "a Tử Vi chart is permanent...
`interpretedAt` exists only to record when the [one] interpretation was generated"). Baking
"currently in Đại Vận X" into that permanent, one-time-generated text would become false the moment
the person ages into the next cycle — a correctness bug baked into content this product cannot
silently regenerate. The deterministic UI (always computed fresh from today's real date) is the
correct place for time-sensitive facts; AI interpretation is not. Verified by direct grep: zero
references to `daiVan`/`tieuHan` anywhere under `src/tu-vi/interpretation/`.

## 28–29. Privacy / security result

No new data flows. Birth date/time/sex were already persisted and already excluded from analytics
(re-confirmed: the one `trackEvent('tu_vi_started', ...)` call site sends only `{feature: 'tu_vi'}`,
unchanged this pass). No new Sentry/logging call sites were added. No anonymous compute surface was
added (§24 of the source brief's own explicit instruction, respected — the existing authenticated-
only architecture is unchanged).

## 30. Export/deletion result

Not specially modified — both flow through the existing `TuViChartDto`/Prisma-row deletion cascade
generically. Verified by inspection that no Tử-Vi-specific export code hardcodes a field list that
would need updating (see §17–20 above).

## 31. Historical-chart compatibility

Verified explicitly via test, not merely asserted: a chart persisted before this feature (backfilled
`daiVan=[]`, `tieuHanStart={}`) round-trips through `toTuViChartDto` to `daiVan: []`,
`tieuHanStart: null`, `currentDaiVan: null`, `currentTieuHan: null`, `nearbyTieuHan: []` — never
throws, never shows a broken UI (both new frontend components render nothing for this exact state,
confirmed by dedicated tests).

## 32. Adversarial findings

One real bug found and fixed during this pass's own testing (not by a separate adversarial pass,
but the same rigor): the mapper initially returned the backfilled `{}` placeholder as-is for
`tieuHanStart` instead of normalizing it to `null`, which would have made every consumer need to
check `tieuHanStart?.startPalace` instead of a simple null-check — caught by
`tu-vi.mappers.spec.ts`'s own test, fixed immediately, re-verified. Deliberately checked and found
clean: no AI/deterministic-fact contradiction possible (AI boundary untouched, §27); no Eastern
Horoscope/Tử Vi conflation (zero cross-references introduced); no stale "coming soon"/`href="#"`
copy in any new file (grepped directly); no internal terminology (`RULE_ID`, raw enum names) leaked
into any new user-facing string (spot-checked every rendered string in both new components).

## 33–34. Bugs discovered / fixed

One (see §32) — discovered and fixed in the same session, both states are the true, final state
(not separately re-verified after the fact since the fix was made before any downstream code
depended on the old behavior).

## 35–41. Test results (freshly run this session, not carried forward)

| Suite | Result |
|---|---|
| Tử Vi engine unit (`src/tu-vi/engine`) | 401/401 pass (across all engine spec files) |
| Tử Vi mapper unit (`tu-vi.mappers.spec.ts`) | included in the above; 8 dedicated tests |
| Full backend unit | **1610/1610 pass** (150 suites) |
| Tử Vi e2e (real HTTP + real Postgres) | **18/18 pass**, including the calculation→persist→GET round-trip with the new columns |
| Full frontend unit | **506/506 pass** (98 suites) |
| Playwright | `NOT_RUN` this pass — no new Playwright spec was added or executed; existing `flow-30-tu-vi-discovery.spec.ts` was not re-run live this session (would require the full dev stack up, not exercised) |
| axe | `NOT_RUN` this pass — no live browser session was run |

## 42–43. Responsive / accessibility result

`NOT_RUN` live at the 12 listed breakpoints — no browser session was launched this pass. Static
review only: both new components use `flex-wrap`/`overflow-x-auto` (no fixed-width desktop layout
that would break on mobile), `min-h-11` touch targets on every interactive element (matches this
codebase's existing touch-target convention), and real `aria-selected`/`aria-current`/`role="tab"`/
`role="list"` semantics (verified via Testing Library's accessible-role queries in the component
tests themselves, which fail if the semantics are wrong — a real, if partial, accessibility check).
Full live axe/responsive QA remains a legitimate follow-up, honestly reported as not run rather than
assumed passing.

## 44–48. Builds / lint / typecheck / Prisma status

| Check | Result |
|---|---|
| API production build (`nest build`) | clean |
| Web production build | compiled/typechecked/all pages generated cleanly; fails only at the pre-existing, previously-documented Windows-symlink packaging step (not a regression — see the competitive-gap-audit session's report for the first occurrence of this exact, precisely-matched precedent) |
| Backend lint | clean, 0 errors (2 warnings this pass introduced were found and fixed; 24 pre-existing unrelated warnings untouched) |
| Frontend lint | clean, 0 errors |
| Backend typecheck | clean |
| Frontend typecheck | clean |
| Prisma migrate status | both new migrations applied to dev AND e2e-test databases, confirmed via successful e2e run against real Postgres |

## 49. git diff --check

Clean (only pre-existing LF/CRLF line-ending advisory warnings on Windows, no conflict markers).

## 50–53. Priority findings

**P0:** none outstanding — nothing shipped this pass blocks anything else.
**P1:** live Playwright/axe/responsive QA for the two new components (honestly not run this pass,
see §42–43) — recommended next verification step before this reaches real users.
**P2:** Lưu Đại Hạn (sourced, not implemented); an AI-grounding update that references time cycles
without baking staleness into permanent text (e.g., a "regenerate on view" interpretation model,
which would be an architecture change, not attempted this pass).
**P3:** Tiểu Hạn child system; Lưu Niên auxiliary stars — both genuinely blocked by incomplete
domain evidence, not merely deprioritized.

## 54. Ready-to-Live impact

Additive, backward-compatible, fully tested. Does not by itself change any other Ready-to-Live gate
(payment, email, Sentry, legal docs — all untouched, tracked independently in
`docs/operations/production-activation-checklist.md`).

## 55–57. Files created / modified / final git status

**New this pass:** `apps/api/src/tu-vi/engine/tu-vi-current-cycle.ts` (+`.spec.ts`),
`apps/api/src/tu-vi/tu-vi.mappers.spec.ts`,
`apps/api/prisma/migrations/20260822042508_tu_vi_cycle_persistence/`,
`apps/web/features/tu-vi/components/tu-vi-dai-van-timeline.tsx` (+`.test.tsx`),
`apps/web/features/tu-vi/components/tu-vi-tieu-han-year-nav.tsx` (+`.test.tsx`),
`docs/progress/tu-vi-time-cycles-release-closure.md` (this file).

**Modified this pass:** `apps/api/src/tu-vi/engine/tu-vi-chart.ts` (+`.spec.ts`),
`apps/api/src/tu-vi/tu-vi.mappers.ts`, `apps/api/src/tu-vi/record/tu-vi-record.service.ts`
(+`.spec.ts`), `apps/api/prisma/schema.prisma`, `packages/types/index.ts`,
`apps/web/features/tu-vi/components/tu-vi-chart-view.tsx`, `tu-vi-dashboard.tsx` (+`.test.tsx`),
`tu-vi-palace-grid.tsx`, `apps/web/features/tu-vi/labels.ts`, `tu-vi-projection.ts` (+`.test.ts`),
`docs/domain/tu-vi/domain-decision-register.md`, `docs/domain/tu-vi/tu-vi-depth-v1-decision.md`
(additive addenda to both).

**Final git status:** all of the above `M`/`??`, nothing staged, nothing committed.

## 58–60. Commit / push / deployment status

Not committed, not pushed, not deployed — per explicit instruction, left for review.

## 61. Final verdict

**TỬ VI TIME CYCLES COMPLETE — RELEASE QA REQUIRED.**

The approved V1 features (Đại Vận core, Tiểu Hạn adult) reach the user end-to-end — not merely
computed in the engine — satisfying this pass's own bar for "COMPLETE" (§31 of the source brief:
"Do NOT declare completion merely because the engine tests pass... the approved V1 features must
actually reach the user end-to-end"). "RELEASE QA REQUIRED" rather than the fuller "RELEASE CLOSURE
COMPLETE" verdict specifically because live Playwright/axe/responsive verification was not run this
pass (§42–43) — everything or that's testable without a live browser session (unit, e2e-against-real-
database, typecheck, lint, both production builds) is done and clean.

## 62. Exact next action

Run a live QA pass (dev server up, real browser) exercising: register → onboarding → Tử Vi →
calculate → inspect the new Đại Vận timeline and Tiểu Hạn year nav → resize through the 12 listed
breakpoints → run axe on the result page. If that passes, this becomes eligible for
`RELEASE CLOSURE COMPLETE`. Independently: bring DECISION-11's founder confirmation (already
received) and the still-open Lưu Đại Hạn / child-Tiểu-Hạn / Lưu-Niên-auxiliary-star items to whoever
owns the next domain-research pass, per `docs/domain/tu-vi/domain-decision-register.md`.

---

## Addendum (2026-08-22, Final Live Release QA pass) — §61's open item resolved

The exact next action above was carried out. Full detail, evidence, and the required 75-item report
live in `docs/progress/tu-vi-depth-time-cycles-final-release-qa.md` — this addendum only records the
outcome so this file's own §61 verdict isn't left stale.

- Live Playwright (`flow-30-tu-vi-discovery.spec.ts`, real Chromium + real HTTP + real Postgres): **5/5
  pass**, including all 11 required responsive breakpoints (this pass added one more, 1100px, beyond
  §42's originally-listed 12 total across the whole QA scope — 11 of those 12 apply to this one flow's
  own test) and a live axe scan (**0 violations, any severity**).
- One real **PRODUCT_DEFECT** was found live (not predicted by static review) and fixed: a duplicate
  accessibility landmark from `TuViTrustSection` being mounted twice on the same page. See the QA
  closure doc §3 for full root cause and fix.
- Five pre-existing **TEST_DEFECTs**, all in this flow's own spec file, were found and fixed; two
  analogous out-of-scope stale-test patterns elsewhere in the suite were found and explicitly flagged,
  not fixed (same doc, §3).
- Full regression re-run fresh this pass, all green (backend 1613/1613, frontend 506/506, Tử Vi e2e
  21/21, typecheck, lint) — see the QA closure doc §2 for the one resource-contention flake
  (re-verified passing in isolation, not a real defect).

**Updated final verdict for the Time Cycles feature: COMPLETE — READY FOR FINAL PRODUCT CLOSURE**,
superseding this file's own §61 "RELEASE QA REQUIRED". Still not committed, not pushed, not deployed.
