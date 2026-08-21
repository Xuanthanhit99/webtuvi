# Sprint 18B.3 — Ngũ Hành Cục — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (engine-layer code + tests) plus documentation. No Prisma, no API, no frontend, no AI calls.
**Note on session continuity:** this sprint was reported interrupted by an external ENOTFOUND (API/DNS) failure partway through. Recovery performed per the resumption brief: repository state was re-read from disk (not assumed), all four Sprint 18B.3 files were found already fully written and intact, one real test failure from the last completed test run was investigated and fixed (see item 37), and every mandatory gate was **re-run from scratch** rather than trusted from before the interruption.

---

## 1. HEAD

`c88a5092fadf51731bd29581889c39364277399f` — unchanged throughout, confirmed both before and after recovery.

## 2. origin/master

Identical to HEAD.

## 3. Ahead/behind

`0/0`.

## 4. Initial working tree

Recovered via `git status --short` / `git diff --stat` / `git diff --check`: only the pre-existing Sprint 18A/18B.1/18B.2 documentation and code (all mine, all previously reported) plus this sprint's own `apps/api/src/tu-vi/engine/tu-vi-cuc*.ts(.spec.ts)` files — already present, unmodified since they were written earlier in this sprint. `git diff --check` clean (no whitespace/conflict-marker issues). No `UNKNOWN` changes, nothing to preserve-vs-discard beyond what this sprint itself had already produced.

## 5. Frozen Cục spec verified

Re-read `canonical-ruleset-v1.md` §1 row 12 (`TUVI-CUC-01`) and §3 (the reproduced table) directly from disk. Confirmed: input = birth-year Heavenly Stem + Mệnh-palace Earthly Branch; 5×5 group table (row-groups = Mệnh Chi groups, column-groups = Can pairs); `KNOWN_CONFLICT` = "None internal to the table" (the Cục table itself is clean — the disputed Kim Tứ Cục cell belongs to the separate `TUVI-TVA-02` Tử Vi-anchor table, Sprint 18B.4's scope, not this one's). No reinterpretation of the primary-source table was performed; the implementation table is a direct transcription of §3.

## 6. Cục input contract

```ts
interface CalculateCucInput {
  yearStem: HeavenlyStem;
  menhPosition: EarthlyBranch;
}
function calculateCuc(input: CalculateCucInput): TuViCucId
```
Both inputs come from `TuViFoundationContext` (18B.2) — `yearCanChi.stem` and `menhPosition` — never recomputed inside the Cục module. `buildTuViCucContext` (the orchestrator) is the only place that wires `TuViFoundationContext`'s fields into `calculateCuc`.

## 7. Cục domain model

`TuViCucId` — a closed literal-string union (`'Thủy Nhị Cục' | 'Mộc Tam Cục' | 'Kim Tứ Cục' | 'Thổ Ngũ Cục' | 'Hỏa Lục Cục'`), matching the established repo convention (`HeavenlyStem`/`EarthlyBranch`/`PalaceRole` are all literal-Vietnamese-word unions, not synthetic English enum keys). `TU_VI_CUC_NUMBER` is a separate metadata record (canonical identifier → traditional number), never used as an array index — no presentation-formatting logic in engine code.

## 8. Five Cục identifiers

`Thủy Nhị Cục`, `Mộc Tam Cục`, `Kim Tứ Cục`, `Thổ Ngũ Cục`, `Hỏa Lục Cục` — `TU_VI_CUC_IDS` (`tu-vi-cuc.ts`).

## 9. Numeric mapping

`{ 'Thủy Nhị Cục': 2, 'Mộc Tam Cục': 3, 'Kim Tứ Cục': 4, 'Thổ Ngũ Cục': 5, 'Hỏa Lục Cục': 6 }` — `TU_VI_CUC_NUMBER`, asserted exactly by test.

## 10. Lookup architecture

One immutable 5×5 `CUC_TABLE` matrix plus two explicit `Record` group-index maps (`MENH_CHI_GROUP_INDEX`, `CAN_GROUP_INDEX`) — no scattered conditionals, no derived/computed group index (explicit lookups chosen specifically to keep the one place a transposition could occur small and inspectable, per Phase 4's instruction). No fallback, no default: an out-of-table lookup throws (verified by test, item 15).

## 11. Total canonical table cells

30 printed group-cells (5×5), representing 120 logical (12 branch × 10 stem) cells.

## 12. Implemented table cells

**30/30 group-cells, 120/120 logical cells** — full coverage, verified exhaustively (item 17).

## 13. Unresolved cells

**0.** The Cục table itself has zero internal ambiguity (unlike the separate Tử Vi-anchor table's Kim Tứ Cục block, out of scope here).

## 14. Kim Tứ convention implementation

**Correctly scoped as not applicable to this phase.** The task's "Kim Tứ Cục convention lock" instruction refers to `TUVI-TVA-02` (the Tử Vi-anchor table's day-21/24 ambiguity) — a fact this phase's code comments state explicitly (`tu-vi-cuc.ts`'s own header note). This phase's only Kim Tứ Cục responsibility is to correctly determine WHICH inputs produce `'Kim Tứ Cục'` as a Cục value, so that Sprint 18B.4 can later apply its own separately-locked anchor-table convention to the correct charts. No day-21/24 logic of any kind exists anywhere in this sprint's code — confirmed by the leakage audit (item 25).

## 15. Disputed-case regression result

**PASS.** `tu-vi-cuc.spec.ts`'s "Kim Tứ Cục coverage" describe block asserts all 5 group-cells that produce `'Kim Tứ Cục'` per the table (one per Mệnh-Chi row-group, paired with the correct Can-column-group), plus a direct reproduction of this project's own Sprint 18A.5 rule-derived vectors B2/B3 (Mậu year context → Mệnh Tý → Kim Tứ Cục), labeled `RULE_DERIVED_TEST_VECTOR`.

## 16. Table-orientation attack tests

6 dedicated tests in `tu-vi-cuc.spec.ts`, each targeting a distinct mutation class (full mapping in item 34): anchor-cell check, row/column-swap detector, Can-group-reversal detector, palace-row-reversal detector, Chi-indexing-off-by-one detector, group-boundary detector. **One of these (the off-by-one detector) caught a real bug — in the test's own expected value, not in production code** — see item 37.

## 17. Exhaustive combination count

**120** (12 Mệnh branches × 10 year stems), verified against an **independently re-transcribed** fixture (a fresh 5×5 group matrix typed directly from `canonical-ruleset-v1.md` §3 into the spec file, sharing no object identity with `tu-vi-cuc.ts`'s production table — per Phase 8's explicit "must be capable of detecting a bad production transcription" requirement).

## 18. Exhaustive test result

**PASS — 120/120 combinations match the independent fixture exactly**, after the test-defect fix (item 37). All 5 Cục values confirmed actually produced across the space (not vacuous); every result confirmed a member of the closed `TU_VI_CUC_IDS` union.

## 19. Independent expected fixture strategy

A hand-transcribed `EXPECTED_MENH_CHI_ROW_GROUPS` / `EXPECTED_CAN_COLUMN_GROUPS` / `EXPECTED_CUC_MATRIX` trio, expanded via a locally-defined `expectedCuc()` helper in the spec file itself — zero imports from `tu-vi-cuc.ts`'s internal table/maps. This structurally guarantees the exhaustive test cannot pass merely because both "expected" and "actual" trace back to the same object.

## 20. Five-Cục vector coverage

All 5 Cục values reproduced from Sprint 18A.5's `golden-vector-v2-spec.md` rule-derived vectors: B1 (Hỏa Lục), B2/B3 (Kim Tứ), B4 (Thổ Ngũ), B5 (Mộc Tam), B6 (Thủy Nhị) — each cited explicitly by vector ID in the test file, labeled `RULE_DERIVED_TEST_VECTOR`, never relabeled as an independent golden vector.

## 21. Foundation integration

New `TuViCucContext { foundationContext, cuc, rulesetVersion }` (`tu-vi-cuc-context.ts`) — a separate context type, not an extension of `TuViFoundationContext`, per the task's explicit "do not overload... if that breaks phase boundaries" instruction. `TuViFoundationContext`'s own shape and tests are untouched.

## 22. Determinism result

**PASS.** Repeated calls with identical input produce byte-identical `cuc` (20-call loop, single distinct result). Cross-timezone determinism re-confirmed at the `TuViCucContext` level (`UTC`/`America/New_York`/`Asia/Tokyo`, identical `cuc` in all three).

## 23. Rule traceability

`TUVI-CUC-01` (reused, `canonical-ruleset-v1.md`) throughout `tu-vi-cuc.ts`'s header comment and cell-level comments. `TUVI-TVA-02` cited explicitly wherever the Kim Tứ Cục scope boundary is explained. No rule ID invented or reassigned.

## 24. Tử Vi-anchor leakage result

**Zero.** Grepped for all 14 chính-tinh star names and the word "anchor" across `src/tu-vi/`. Every match is either (a) an explicit "OUT OF SCOPE: Tử Vi anchor" boundary comment, (b) the pre-existing, unrelated `SOURCE_ANCHORED_VECTOR` test-label convention (from 18B.1/18B.2), or (c) `tu-vi-menh-than.ts`'s pre-existing `MONTH_REFERENCE_ANCHOR` constant (the Dần reference palace for the month-counting step of Mệnh/Thân — an unrelated concept that happens to share the English word "anchor," not the Tử Vi star-anchor table). No star-placement calculation of any kind.

## 25. Star-placement leakage result

**Zero.** No 14-chính-tinh or auxiliary-star placement logic anywhere in the new code.

## 26. Tuần/Triệt/Tứ Hóa leakage

**Zero.** All matches are inside scope-boundary/audit doc comments (e.g., `tu-vi-can-chi.ts`'s pre-existing audit note explaining why year Can/Chi will be needed by these *later* phases). No calculation logic for any of the three.

## 27. AI/provider calls

**0.** Confirmed by grep across `src/tu-vi/` for `console\.|logger|openai|anthropic|gemini|provider|llm|companion` — zero matches.

## 28. Endpoints

**0.** No controller, no module registration, no `app.module.ts` change (confirmed via `git status -- apps/api/src/*.module.ts`, empty).

## 29. Database/Prisma changes

**0.** `git diff --stat -- apps/api/prisma/` empty.

## 30. Targeted Cục tests

**63 tests** across `tu-vi-cuc.spec.ts` (54) and `tu-vi-cuc-context.spec.ts` (9), all passing after the fix in item 37.

## 31. Cumulative Tử Vi tests

**177/177 pass** (`src/tu-vi`, 10 suites — up from 147 at the end of 18B.2, +30 new this phase).

## 32. Eastern Horoscope regression

**82/82 pass**, re-run fresh this session (not trusted from before the reported interruption), zero change to any Eastern Horoscope file.

## 33. Full backend tests

**135/135 suites, 1385/1385 tests pass**, re-run fresh this session (up from 1355 at the end of 18B.2 — exactly the 30 new tests).

## 34. Lint / Typecheck / Build

All three re-run fresh this session:
- **Lint:** clean — `npx eslint "src/tu-vi/**/*.ts"` zero output.
- **Typecheck:** clean — `npx tsc --noEmit -p tsconfig.json` (whole project) zero output.
- **Build:** clean — `npx nest build` exit code 0.

**Adversarial-mutation → protecting-test map** (Phase 17), stated explicitly:

| Mutation | Would be caught by |
|---|---|
| One table cell changed | Exhaustive 120-combination test (item 18) against the independent fixture |
| Two rows swapped | "Row/column swap detector" + "palace-position (row) reversal detector" (item 16) |
| Two columns swapped | "Row/column swap detector" + "Can-group reversal detector" (item 16) |
| Kim Tứ convention reverted | N/A to this phase — no such convention exists here to revert (it lives in 18B.4); the Kim Tứ *coverage* test (item 15) would catch a wrong Kim Tứ determination |
| Year-stem index shifted by one | "Can-group reversal detector" + exhaustive test + `CAN_GROUP_INDEX` being an explicit (not computed) map |
| Mệnh-position index shifted by one | "Chi-indexing off-by-one detector" + "palace-position reversal detector" + exhaustive test |
| Cục numeric value mislabeled | `TU_VI_CUC_NUMBER` exact-match test (item 9) |

## 35. Bugs discovered

**One**, in this sprint's own test-authoring, not in production code: `tu-vi-cuc.spec.ts`'s "Chi-indexing off-by-one detector" test originally asserted `'Kim Tứ Cục'` as the expected result for `{ yearStem: 'Mậu', menhPosition: 'Dần' }` (and the other 3 branches in that row-group). The correct value, per `canonical-ruleset-v1.md` §3's row "Dần, Mão, Tuất, Hợi" × column "Mậu, Quý", is `'Thủy Nhị Cục'` — verified by hand against the frozen table before touching any code. **Production code (`tu-vi-cuc.ts`'s `CUC_TABLE`/`MENH_CHI_GROUP_INDEX`/`CAN_GROUP_INDEX`) was confirmed correct and was not changed.**

## 36. Bugs fixed

The one test-authoring bug above — the test's expected value was corrected to `'Thủy Nhị Cục'`, with a comment added explaining the distinction from the (correctly-passing) Kim Tứ Cục coverage test that uses the same row-group with a different Can. Classified `TEST_DEFECT`, not `PRODUCT_DEFECT`, not `SPEC_CONFLICT` — no stop condition applies.

## 37. Investigation detail (why this was TEST_DEFECT, not SPEC_CONFLICT)

Per Phase 18's explicit instruction, a source-derived expected case contradicting the frozen table would require a STOP. This was checked carefully: the frozen table (`canonical-ruleset-v1.md` §3, itself `PRIMARY_SOURCE_RECHECKED` ×3 with zero internal conflict for this specific table) was consulted directly, and the production `CUC_TABLE` was found to match it exactly, cell for cell, at the disputed row/column. The error was localized entirely to the test file's own hand-written expectation — a genuine authoring slip (reaching for "Kim Tứ Cục" from memory of the nearby, correctly-written Kim Tứ coverage test, rather than re-deriving this specific cell). This is the normal, expected outcome of an adversarial test doing its job — it caught an error, just an error in the test itself rather than in the code under test, which is why the test was re-verified against the primary source before either side was changed.

## 38. Security/privacy findings

No logging of birth data, no analytics, no AI/provider calls (item 27), no new endpoint (item 28), no persistence (item 29), no Sentry payload. Pure deterministic engine only — identical discipline to 18B.1/18B.2.

## 39. Stop conditions

**None triggered.** All 10 re-checked:
- A (table cannot be implemented unambiguously): none — the table is internally clean, confirmed `PRIMARY_SOURCE_RECHECKED` with zero conflict.
- B (Kim Tứ lock not machine-implementable): not applicable to this phase's scope (item 14); the actual lock is 18B.4's, deferred correctly.
- C (required Cục input cannot be obtained from 18B.2): none — `yearStem`/`menhPosition` both available directly from `TuViFoundationContext`.
- D (exhaustive coverage reveals an unresolved cell): none — 120/120 resolved.
- E (a rule-derived vector contradicts frozen mapping): none, after the test fix (item 37) confirmed the contradiction was in the test, not the mapping.
- F (table orientation cannot be determined): none — orientation confirmed unambiguous and correctly implemented, by 6 dedicated attack tests.
- G (implementation would need a fallback/default): none — `calculateCuc` has no fallback path; an impossible lookup throws.
- H (AI/external service needed): none.
- I (implementing Cục requires changing Mệnh logic): none — `tu-vi-menh-than.ts` untouched this sprint.
- J (implementing Cục requires starting Tử Vi-anchor logic): none — confirmed via the leakage audit (item 24).

## 40. Files created

```
apps/api/src/tu-vi/engine/tu-vi-cuc.ts
apps/api/src/tu-vi/engine/tu-vi-cuc.spec.ts
apps/api/src/tu-vi/engine/tu-vi-cuc-context.ts
apps/api/src/tu-vi/engine/tu-vi-cuc-context.spec.ts
docs/progress/sprint-18b3-cuc-final-report.md
```
5 files (all written before the reported interruption; the spec file received one post-recovery edit, see item 41).

## 41. Files modified

`apps/api/src/tu-vi/engine/tu-vi-cuc.spec.ts` — one expected-value correction plus an explanatory comment (item 35/36). No 18B.1/18B.2 file touched.

## 42. Git status

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
?? docs/progress/sprint-18b1-calendar-foundation-final-report.md
?? docs/progress/sprint-18b2-canchi-palaces-menh-than-final-report.md
?? docs/progress/sprint-18b3-cuc-final-report.md
```
`domain-decision-register.md`'s modification predates this sprint (Sprint 18A.6) — not staged or touched here.

## 43. Commit status

**Not committed.**

## 44. Push status

**Not pushed.**

## 45. Deployment status

**Not deployed.**

## 46. Final verdict

**SPRINT 18B.3 COMPLETE — CỤC VERIFIED — READY FOR 18B.4**

## 47. Exact next action

1. Proceed to Sprint 18B.4 (Tử Vi anchor + 14 Chính Tinh), which will consume `TuViCucContext.cuc` and `TuViCucContext.foundationContext.calendarContext.lunarDate.lunarDay` as its two inputs.
2. 18B.4 must implement the **actual** Kim Tứ Cục convention lock (`TUVI-TVA-02`, day 24 → Mùi) that this phase correctly deferred — do not assume it is already handled anywhere in the current codebase.
3. No founder or domain review needed before proceeding — this phase surfaced no spec conflict, only a self-corrected test-authoring error.
