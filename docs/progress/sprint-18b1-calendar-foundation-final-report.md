# Sprint 18B.1 — Tử Vi Calendar Foundation — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (engine-layer code + tests) plus documentation. No Prisma, no API, no frontend, no AI calls.

---

## 1. HEAD

`c88a5092fadf51731bd29581889c39364277399f` — unchanged throughout the session.

## 2. origin/master

Identical to HEAD.

## 3. Ahead/behind

`0/0`.

## 4. Initial working tree

Classified before any implementation work began:

- **`SPRINT_18A_DOCS`** (all pre-existing, all mine from Sprint 18A.4–18A.6): `docs/domain/tu-vi/domain-decision-register.md` (modified), plus 9 untracked `docs/domain/tu-vi/*` and `docs/progress/sprint-18a{4,5,6}*` files.
- **`PREEXISTING`**: none beyond the above.
- **`UNKNOWN`**: none found. No stop was required.

No overlapping file was touched by this sprint's implementation work.

## 5. Frozen ruleset/version used

`TUVI_RULESET_V1 = VDTTL_1956_V1` (per `canonical-ruleset-v1.md` §7). Calendar-layer rules consumed: `TUVI-CAL-01/02/03` (solar→lunar, UTC+7, leap-month astronomy — all `IMPLEMENTATION_READY`), `TUVI-GIO-01` (hour labeling), `TUVI-GIO-02` (day-rollover convention lock, midnight rollover). `TUVI-CAL-04` (leap-month Tử-Vi-input convention) was deliberately **not** applied — it governs how a later phase interprets `isLeapMonth` for Mệnh/Thân's `tháng` input, out of scope here.

## 6. Existing calendar implementation located

`apps/api/src/eastern-horoscope/engine/lunar-calendar.adapter.ts` — a hand-ported TypeScript implementation of the Hồ Ngọc Đức algorithm (Meeus-based), exposing `convertSolarToLunar(dd, mm, yy, timeZone)` returning `{ lunarDay, lunarMonth, lunarYear, lunarLeap }`, and `getLunarYearForGregorianDate(date, timeZone)`. Verified against 13 independently-sourced Tết dates (2013–2025) plus boundary/leap vectors in its own spec file. Cleanly separable — zero imports of Eastern-Horoscope-specific concepts (element/interpretation logic). Also located: `apps/api/src/eastern-horoscope/engine/eastern-horoscope-tables.ts`, exposing `EARTHLY_BRANCHES`/`EarthlyBranch` (the 12 Chi names), pure reference data.

## 7. Reuse strategy

**WRAP**, not extract or duplicate. `Prefer reuse over duplication`, and explicitly do not modify Eastern Horoscope's verified files (Stop Condition G). The new `tu-vi-calendar.adapter.ts` imports `convertSolarToLunar` directly and wraps its full return value (day/month/leap — fields Eastern Horoscope's own module computes but doesn't test/expose) into a Tử-Vi-scoped `TuViLunarDate` type. `tu-vi-hour-branch.ts` imports `EARTHLY_BRANCHES`/`EarthlyBranch` from the same table module (pure data, no coupling risk). Extraction into a shared package was considered and rejected — it would require touching already-shipped, tested Eastern Horoscope code for no functional benefit, which the governing task explicitly warns against.

## 8. Files reused

`apps/api/src/eastern-horoscope/engine/lunar-calendar.adapter.ts` (function: `convertSolarToLunar`), `apps/api/src/eastern-horoscope/engine/eastern-horoscope-tables.ts` (`EARTHLY_BRANCHES`, `EarthlyBranch`). Neither file was modified.

## 9. Files created

```
apps/api/src/tu-vi/engine/tu-vi-canonical-input.ts
apps/api/src/tu-vi/engine/tu-vi-canonical-input.spec.ts
apps/api/src/tu-vi/engine/tu-vi-hour-branch.ts
apps/api/src/tu-vi/engine/tu-vi-hour-branch.spec.ts
apps/api/src/tu-vi/engine/tu-vi-calendar.adapter.ts
apps/api/src/tu-vi/engine/tu-vi-calendar.adapter.spec.ts
apps/api/src/tu-vi/engine/tu-vi-calendar-context.ts
apps/api/src/tu-vi/engine/tu-vi-calendar-context.spec.ts
docs/progress/sprint-18b1-calendar-foundation-final-report.md
```
9 files. No NestJS module, controller, or DI wiring was created — no consumer exists yet, and Sprint 18B.1's own out-of-scope list excludes the Tử Vi API surface.

## 10. Files modified

**0.** No existing tracked file was changed (`git diff --stat -- apps/ packages/` returns empty both before and after).

## 11. Canonical input contract

```ts
interface TuViBirthInput {
  birthDate: string; // YYYY-MM-DD, Gregorian only
  birthTime: string; // HH:mm, 24-hour, local Vietnam wall-clock
}
```
Gregorian-only at the API boundary, per Phase 4's instruction and `calculation-specification.md` §1's pipeline (no lunar-input mode is specified anywhere in the frozen ruleset, so none was introduced). Birth time is required, not optional, matching `calculation-specification.md` §11. No timezone field — V1 is fixed to UTC+7 (`TUVI-CAL-02`), not user-selectable, unlike Natal Chart's geo-derived timezone. No `calendarInputType` field was added, since only one input type exists for V1 — adding a discriminator for a single case would be exactly the kind of "abstraction for abstraction's sake" Phase 3 warns against.

## 12. Date-validation policy

Strict round-trip validation via `Date.UTC` construct-and-compare (identical technique to `eastern-horoscope-engine.ts`'s `parseBirthDate` and `numerology-date.util.ts`'s `normalizeBirthDate` — reused deliberately for codebase consistency). `2025-02-31` and every other impossible date is rejected with `TUVI_INVALID_DATE`, never silently normalized (verified by a dedicated test naming this exact scenario). `MIN_BIRTH_YEAR = 1900` (same bound as the rest of the codebase). Future dates rejected via an injectable `now` option (same pattern as Eastern Horoscope's `options.now`).

## 13. Timezone policy

Zero dependency on server/Docker/browser/Node-process timezone. All date math uses `Date.UTC(...)` construction and `getUTC*` accessors exclusively — never a local-timezone-sensitive `Date` method. Verified directly by a test that sets `process.env.TZ` to `UTC`, `America/New_York`, and `Asia/Tokyo` mid-run and asserts byte-identical output (`tu-vi-calendar-context.spec.ts`, "environment (timezone) independence"). No `moment-timezone`/`tz-lookup` dependency introduced — not needed, per `TUVI-CAL-02`'s own "no location-based ephemeris needed" finding.

## 14. Solar→lunar implementation

`convertGregorianToTuViLunarDate(year, month, day): TuViLunarDate` in `tu-vi-calendar.adapter.ts` — a thin wrapper around the reused `convertSolarToLunar`. No new astronomical calculation was written.

## 15. Leap-month handling

`TuViLunarDate.isLeapMonth` is exposed as a raw calendar fact (from the underlying algorithm's `lunarLeap` field). **No convention is applied to it in this phase** — `TUVI-CAL-04`'s "leap month repeats its preceding month's index" lock governs how a later phase (Mệnh/Thân) *consumes* this flag, not how the calendar layer *reports* it. Verified with an independently-sourced vector: 2020's leap 4th lunar month starts 2020-05-23 (confirmed this session via a live Vietnamese lunar-calendar lookup site, not generated by the function under test — see item 25).

## 16. Hour-branch implementation

`getHourBranch(hour, minute): EarthlyBranch` in `tu-vi-hour-branch.ts`, implementing `TUVI-GIO-01`'s table exactly: Tý as a single undivided `[23:00,24:00) ∪ [00:00,01:00)` window, then eleven 2-hour half-open blocks. Boundary-inclusivity convention (start-hour inclusive, end-hour exclusive) is explicitly documented as a disclosed engineering choice, not a domain dispute.

## 17. Giờ Tý convention implementation

Deliberately split into two independent functions, per Phase 7's explicit instruction: `getHourBranch` (label only, §16) and `effectiveTuViDate` (day used for downstream calculations, §18) — never collapsed into one Date mutation.

## 18. Effective-day policy

`TuViCalendarContext.effectiveTuViDate` — under the locked midnight-rollover convention (`TUVI-GIO-02`), this is always identical to `solarDate` (no shift). Implemented as its own named, computed, tested field (not inlined) specifically so a future convention change (e.g. to "Giờ Tý Sơ," which would require a +1-day shift for 23:00–23:59 births) has exactly one place to change. Proven end-to-end by a test pairing `2024-03-15 23:30` against `2024-03-16 00:30`: same hour-branch label ("Tý"), different `effectiveTuViDate`, different `lunarDate.lunarDay` — directly demonstrating no whole-window shift is applied.

## 19. Canonical result structure

```ts
interface TuViCalendarContext {
  solarDate: { year; month; day };
  birthTime: { hour; minute };
  timezoneOffsetHours: number;
  lunarDate: TuViLunarDate; // { lunarYear, lunarMonth, lunarDay, isLeapMonth }
  hourBranch: EarthlyBranch;
  effectiveTuViDate: { year; month; day };
  calendarVersion: string;
  rulesetVersion: string;
}
```
Built by `buildTuViCalendarContext(input, options?)` in `tu-vi-calendar-context.ts`. The full object and every nested object are `Object.freeze`d (verified by a dedicated immutability test). No field was added beyond what §8's conceptual structure specified, and no Mệnh/Thân/Cục/star field exists anywhere in this type.

## 20. Version propagation

`TUVI_CALENDAR_VERSION = 'tuvi-calendar-hnd-v1'` (in `tu-vi-calendar.adapter.ts`), `TUVI_RULESET_VERSION = 'vdttl-1956-v1'` (in `tu-vi-calendar-context.ts`, matching `canonical-ruleset-v1.md` §7/§8 exactly — no conflicting identifier was invented). Both are asserted by exact-value tests, not just presence checks. `TUVI_ENGINE_VERSION` was **not** wired into this layer — it belongs to the full-chart-composition phase (18B.7), which doesn't exist yet; wiring it here would be premature/unused.

## 21. Source-anchored tests

- 13 independently-documented Tết (Lunar New Year) dates, 2013–2025 (reused verbatim from Eastern Horoscope's own already-sourced vectors — not regenerated).
- Lunar New Year boundary (2024-02-09/10/11).
- 2020 leap 4th lunar month: **verified this session via live web lookup** (`reference.vn`, `licham.prices.vn`) that the leap 4th month begins 2020-05-23 — the test's original date guess (2020-05-10) was checked against this source, found to fall in the *regular* 4th month instead, and corrected before being committed to the spec (documented in the test's own comment, not silently fixed).

## 22. Rule-derived tests

Hour-branch table (mechanical, not disputed — `TUVI-GIO-01` is a plain lookup, not a golden-vector-style derived case). Effective-date policy tests are derived directly from the `TUVI-GIO-02` convention lock's own stated semantics, not from any external source (there is none — the convention is engineering-locked, not sourced).

## 23. All-12-hour coverage

Confirmed — `tu-vi-hour-branch.spec.ts` exercises all 12 branches individually, plus a loop asserting all 24 clock hours collectively resolve to exactly 12 distinct branches (no gap, no phantom 13th value).

## 24. Tết-boundary result

**PASS.** 2024-02-09 → lunar year 2023; 2024-02-10/11 → lunar year 2024.

## 25. Leap-month result

**PASS**, with a genuine mid-sprint correction: the leap 4th month of 2020 (Canh Tý) independently confirmed to begin 2020-05-23 (not 2020-05-10 as first assumed) via live web lookup before finalizing the test — see item 15/21.

## 26. Eastern-Horoscope consistency result

**PASS**, labeled explicitly "regression only, NOT independent domain evidence" in the spec file itself, per Phase 11's instruction. 5 sample dates cross-checked; `TuViLunarDate.lunarYear` matches `getLunarYearForGregorianDate` exactly in every case, and a direct `convertSolarToLunar`-vs-`convertGregorianToTuViLunarDate` equality check confirms the wrapper introduces no divergence. No disagreement found — Stop Condition B was not triggered.

## 27. Timezone-independence result

**PASS.** `process.env.TZ` cycled through `UTC`/`America/New_York`/`Asia/Tokyo` mid-test; identical `TuViCalendarContext` output in all three.

## 28. Targeted test result

**86/86 pass** (`tu-vi-canonical-input.spec.ts`, `tu-vi-hour-branch.spec.ts`, `tu-vi-calendar.adapter.spec.ts`, `tu-vi-calendar-context.spec.ts`).

## 29. Regression test result

**Eastern Horoscope: 82/82 pass** (5 suites), zero change to any Eastern Horoscope file. **Full backend suite: 129/129 suites, 1294/1294 tests pass** (includes the 86 new Tử Vi tests and the 82 Eastern Horoscope tests within that total).

## 30. Lint

Clean — `npx eslint "src/tu-vi/**/*.ts"` produced zero output (zero errors, zero warnings).

## 31. Typecheck

Clean — `npx tsc --noEmit -p tsconfig.json` (whole-project) produced zero output.

## 32. Build

Clean — `npx nest build` succeeded, exit code 0, zero output.

## 33. Security/privacy findings

- No birth data logged anywhere in the new code (`grep` for `console\.|logger|log\(` across `src/tu-vi/` returns zero matches).
- No analytics event created or touched.
- No provider/LLM import anywhere in `src/tu-vi/` (`grep` for `openai|anthropic|gemini|provider|llm|companion` returns zero matches).
- No new public endpoint — no controller, no module registration, no `app.module.ts` change.
- Validation error messages are generic ("Birth date is not a real calendar date") and never echo the raw invalid input value back.
- No persistence — zero Prisma schema changes (`git diff --stat -- apps/api/prisma/` empty).
- **Zero AI/provider calls** — confirmed by the same grep above and by the fact that no file in `src/tu-vi/` imports `CompanionModule`/`ProviderOrchestratorService` or anything similar.

## 34. AI/provider calls introduced

**0.**

## 35. Database/Prisma changes

**0.**

## 36. Future-domain leakage audit

Grepped `src/tu-vi/` for Mệnh/Thân/Cục/Chính Tinh/Tuần/Triệt/Tứ Hóa/CORE_13-star terms. Every genuine match is an explicit "OUT OF SCOPE" doc-comment (e.g. `tu-vi-calendar-context.ts`'s own header: "Explicitly OUT OF SCOPE for this file and this sprint... Mệnh, Thân, Cục, Tử Vi anchor, 14 Chính Tinh, Tuần, Triệt, Tứ Hóa, CORE_13 auxiliary stars, AI interpretation"). The only non-comment match is `'Thân'` as one of the 12 `EarthlyBranch` calendar-branch names (the 9th zodiac branch, "Monkey") — an unrelated, pre-existing, reused piece of calendar reference data, not the Tử Vi "Thân palace" domain concept. **Zero implementation logic** for any out-of-scope calculation exists anywhere in the new code.

## 37. Bugs discovered

One, in this sprint's own test-authoring process, not in the implementation: the first draft of the leap-month test guessed an incorrect Gregorian date (2020-05-10) for 2020's leap 4th lunar month. Caught immediately by the test itself failing, root-caused by an independent web lookup (not by adjusting the assertion to match whatever the function returned), and corrected with the true source-anchored date (2020-05-23 onward). No implementation defect was found.

## 38. Bugs fixed

Same item as above — a test-vector error, fixed by finding the correct real-world date, not by weakening the assertion.

## 39. Open Blocker

**0.**

## 40. Open Critical

**0.**

## 41. Open High

**0.**

## 42. Open Medium

**0.**

## 43. Stop conditions triggered

**None** (A through J all checked, none applicable):
- A (spec/implementation disagreement): none found.
- B (Eastern Horoscope inconsistency): none — cross-check passed exactly.
- C (leap-month ambiguity): none — the calendar layer reports the raw fact unambiguously; the *convention* for consuming it is correctly deferred, not ambiguous.
- D (Giờ Tý non-deterministic): none — both hour-branch and effective-date are fully deterministic, tested at every boundary.
- E (machine-timezone dependency): none — proven absent by test.
- F (invalid dates silently normalized): none — proven absent by test.
- G (Eastern Horoscope reuse requiring a behavior change): none — zero lines of Eastern Horoscope code touched.
- H (LLM inference required): none — zero AI dependency.
- I (new domain conflict discovered): none.
- J (frozen ruleset would need to change): none.

## 44. Git status

```
 M docs/domain/tu-vi/domain-decision-register.md
?? apps/api/src/tu-vi/
?? docs/domain/tu-vi/ai-only-verification-standard.md
?? docs/domain/tu-vi/canonical-ruleset-v1.md
?? docs/domain/tu-vi/expert-blind-golden-vector-pack.md
?? docs/domain/tu-vi/expert-review-pack.md
?? docs/domain/tu-vi/golden-vector-comparison-matrix.md
?? docs/domain/tu-vi/golden-vector-v2-spec.md
?? docs/domain/tu-vi/source-corroboration-matrix.md
?? docs/domain/tu-vi/sprint-18b-entry-gate.md
?? docs/domain/tu-vi/sprint-18b-revised-entry-gate.md
?? docs/progress/sprint-18a4-expert-pack-final-report.md
?? docs/progress/sprint-18a5-ai-verification-final-report.md
?? docs/progress/sprint-18a6-entry-gate-closure.md
```
(`domain-decision-register.md` and the other untracked `docs/` entries predate this sprint — Sprint 18A.6's own output — untouched here. Only `apps/api/src/tu-vi/` and this report are new from this sprint.)

## 45. Commit status

**Not committed.**

## 46. Push status

**Not pushed.**

## 47. Deployment status

**Not deployed.**

## 48. Final verdict

**SPRINT 18B.1 COMPLETE — CALENDAR FOUNDATION VERIFIED — READY FOR 18B.2**

## 49. Exact next action

1. Review the implementation in `apps/api/src/tu-vi/engine/` (4 source files, 4 spec files, 86 tests, all passing, zero regressions across the 1294-test backend suite).
2. Proceed to Sprint 18B.2 (`sprint-18a6-entry-gate-closure.md` §15) — Can Chi + 12-palace skeleton + Mệnh/Thân — which will consume `TuViCalendarContext.lunarDate`/`hourBranch`/`effectiveTuViDate` as its input, and will be the first phase to apply `TUVI-CAL-04`'s leap-month convention lock to a real calculation.
3. No founder or domain action required — this phase surfaced no new conflict, no ambiguity, and no need to revisit any convention lock.
