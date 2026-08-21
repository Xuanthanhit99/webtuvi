# Sprint 18B.7 — Tứ Hóa — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (engine-layer code + tests). No Prisma, no API, no frontend, no AI calls.

## Files created
`tu-vi-tu-hoa.ts`, `tu-vi-tu-hoa.spec.ts`, `tu-vi-tu-hoa-context.ts`, `tu-vi-tu-hoa-context.spec.ts`.

## Implementation
`calculateTuHoa(yearStem): ReadonlyArray<TuHoaAssignment>` — 10×4 table, `TuHoaTargetStar = ChinhTinhId | Core13StarId` (a compile-time guarantee that every one of the 40 targets is a real, already-implemented star — checked and confirmed true for all 40 cells). One disclosed spelling normalization: the printed table's "Tả Phụ" (Nhâm's Hóa Khoa target) is written as "Tả Phù," matching the CORE_13 canonical spelling already established and disclosed in `canonical-ruleset-v1.md` §1 row 25.

**`annotateTuHoaPositions` never recomputes a star's position** — per the governing task's explicit instruction, it looks up each target's already-computed palace from the 14-Chính-Tinh and 13-CORE_13 arrays produced by earlier phases, throwing if a target is somehow absent from both (a defect guard, not a possible real outcome given the type-level guarantee).

## 40-cell verification
**40/40** verified against an independently re-transcribed fixture (fresh from `canonical-ruleset-v1.md`/`vdttl-1956-extraction.md`, sharing no object identity with production). Cross-checked against the book's own worked example (Đinh year). Attack tests: row-shift detector, transformation-column-swap detector, one-cell-mutation detector, wrong-star-identifier guard (all 40 targets checked against the real 27-star universe).

## School-contamination audit
Documented as a conscious non-test: `canonical-ruleset-v1.md` §1 row 20 already establishes this table is VDTTL-1956's own, and the locked school (`TUVI_SCHOOL_V1 = VDTTL_1956`) makes a Bắc Phái/Nam Phái comparison moot for V1 — no cross-school blending anywhere, confirmed by the fact that this table has exactly one source (no alternate table was ever consulted to fill any cell).

## Test results
`src/tu-vi`: **286/286 pass** (18 suites, +16 from 18B.6's 270). One real `tsc` strict-null-check error caught in my own test file (array-destructuring without a length guard) — fixed, not a production defect. Eastern Horoscope: **82/82 pass**. Full backend: **143 suites, 1494/1494 tests pass** (+16). Lint/typecheck/`nest build`: all clean after the fix.

## Bugs discovered / fixed
One, `TEST_DEFECT` (type-safety, not logic): `tu-vi-tu-hoa.spec.ts` destructured `const [annotated] = annotateTuHoaPositions(...)` without TypeScript being able to prove the array non-empty (`tsc --noEmit` caught this as `TS18048`, even though Jest's transpile-only run didn't). Fixed by checking `toHaveLength(1)` and indexing with optional chaining instead of destructuring.

## Leakage audit
AI/provider/logging: zero matches. Prisma/frontend/module registration: zero changes. No chart-composition, persistence, or interpretation logic anywhere (confirmed by file listing — only the 2 new implementation files + 2 spec files exist this phase).

## Stop conditions
None triggered.

## Verdict
**PASS — continuing automatically to Sprint 18B.8.**
