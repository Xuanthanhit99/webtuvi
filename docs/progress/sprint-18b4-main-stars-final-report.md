# Sprint 18B.4 — Tử Vi Anchor + 14 Chính Tinh — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (engine-layer code + tests). No Prisma, no API, no frontend, no AI calls.

## Files created
`apps/api/src/tu-vi/engine/tu-vi-chinh-tinh.ts`, `tu-vi-chinh-tinh.spec.ts`, `tu-vi-main-stars-context.ts`, `tu-vi-main-stars-context.spec.ts`.

## Implementation summary
- **Tử Vi anchor**: `TU_VI_ANCHOR_TABLE` — 5 Cục × 30-lunar-day, one source of truth, transcribed from `canonical-ruleset-v1.md` §4. **TUVI-TVA-02 (Kim Tứ Cục) convention lock implemented exactly as frozen**: Mùi's day list is `[14, 24, 27]` (day 24, not the printed "21"); day 21 → Thìn (undisputed) unchanged.
- **14 Chính Tinh**: `TU_VI_CHINH_TINH_IDS` (stable canonical order), `TU_VI_GROUP_OFFSETS` (Tử Vi group, 6 stars) + `THIEN_PHU_GROUP_OFFSETS` (Thiên Phủ group, 8 stars), both mod-12 offset tables — no direction-label prose encoded anywhere (`canonical-ruleset-v1.md` §2 policy, reused unchanged).
- **Thiên Phủ anchor**: `getThienPhuPosition` — `(4 − TuVi0) mod 12`, mirror axis; coincidence at Dần/Thân and involution property both verified.
- **Orchestrator**: `buildTuViMainStarsContext` extends the `TuViCucContext` chain with `chinhTinh` (14-entry array) and `rulesetVersion`.

## Anchor exhaustive count/result
**150/150** (5 Cục × 30 days) verified against an **independently re-transcribed, structurally different** fixture (day-ordered arrays in the spec file, vs. production's branch-grouped table) — PASS.

## Kim Tứ convention
Implemented and regression-tested: day 21 → Thìn, day 24 → Mùi, the two differ (proving the fix is active, not just re-printing the ambiguity).

## 14 Chính Tinh result
Every placement valid; exactly 14 unique star IDs in stable canonical order; co-location confirmed valid (not an error) via a dense real case (Thủy Nhị Cục day 8, Tử Vi/Thiên Phủ at maximal 6-palace separation).

## Offset/direction strategy
Pure mod-12 offsets only — zero "thuận"/"nghịch"/clockwise prose in executable code.

## Adversarial tests
Cục-block-inversion detector, day+1-shift detector, one-cell-mutation detector (all in `tu-vi-chinh-tinh.spec.ts`), plus the 150-combination exhaustive independent-fixture comparison itself.

## Bugs discovered / fixed
**One, TEST_DEFECT**: a rule-derived-vector test misattributed Sprint 18A.5's VECTOR-B6 co-located star (wrote "Phá Quân=Tỵ"; the correct co-located star at Tỵ is "Thất Sát," per re-checking `golden-vector-v2-spec.md` directly — Phá Quân is actually at Dậu). Fixed against the source document, not against whatever the code produced; production code was confirmed correct throughout.

## Test results
**tu-vi-chinh-tinh.spec.ts + tu-vi-main-stars-context.spec.ts: 29/29 pass.** Cumulative `src/tu-vi`: **206/206 pass** (12 suites, +29 from 18B.3's 177). Eastern Horoscope: **82/82 pass**, unchanged. Full backend: **137 suites, 1414/1414 tests pass** (+29). Lint/typecheck/`nest build`: all clean.

## Leakage audit
CORE_13, Tuần, Triệt, Tứ Hóa: zero implementation logic, all matches are scope-boundary comments. AI/provider/logging: zero matches. Prisma/frontend/module registration: zero changes.

## Stop conditions
None triggered.

## Verdict
**PASS — continuing automatically to Sprint 18B.5.**
