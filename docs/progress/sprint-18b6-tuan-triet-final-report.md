# Sprint 18B.6 — Tuần + Triệt — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (engine-layer code + tests). No Prisma, no API, no frontend, no AI calls.

## Files created
`tu-vi-tuan-triet.ts`, `tu-vi-tuan-triet.spec.ts`, `tu-vi-tuan-triet-context.ts`, `tu-vi-tuan-triet-context.spec.ts`.

## Tuần implementation
`calculateTuan(yearStem, yearChi): PalacePair` — modeled as a distinct `PalacePair` domain type (`{first, second}`), not a star placement, since Tuần is structurally two adjacent palaces, not one star (`TUVI-TUAN-01`). Decade-group resolution: `decadeStart = (yearChiIndex − stemPosition) mod 12`, then a 6-entry table lookup keyed by that decade's own "Giáp X" starting Chi — reusing the same mechanic already established for Mệnh/Thân/CORE_13's offset counting, not a new ad hoc pattern.

## Triệt implementation
`calculateTriet(yearStem): PalacePair` — 5-row Can-pair table.

## Historical conflict lock
**`TUVI-TRIET-01` implemented exactly as frozen, traceable in code, not hidden.** `tu-vi-tuan-triet.ts`'s header comment states the conflict explicitly: VDTTL-1956's own table gives Ất/Canh → Mùi, Ngọ; the book's own worked example (same page) gives Canh Ngọ → Thân, Dậu instead. The table value is used. A dedicated regression test (`tu-vi-tuan-triet.spec.ts`) asserts both facts side by side — the locked value AND that it is explicitly not the disputed value — and `tu-vi-tuan-triet-context.spec.ts` reproduces the exact historical case end-to-end (a real Canh Ngọ birth year, 1990-11-25, run through the full context chain, confirming `triet = {Mùi, Ngọ}`).

## Exhaustive results
Tuần: **60/60** valid sexagenary Can-Chi year combinations verified against an independently-derived fixture (a structurally different `Math.floor(k/10)` decade-group computation, sharing no code path with production's modular-offset lookup). Triệt: **10/10** year Cans verified against an independently-transcribed table.

## Test results
`src/tu-vi`: **270/270 pass** (16 suites, +22 from 18B.5's 248) — all passed on the first run, no test-authoring bugs found this phase. Eastern Horoscope: **82/82 pass**, unchanged. Full backend: **141 suites, 1478/1478 tests pass** (+22). Lint/typecheck/`nest build`: all clean.

## Leakage audit
Tứ Hóa: zero implementation, all matches are scope-boundary comments. AI/provider/logging: zero matches. Prisma/frontend/module registration: zero changes.

## Stop conditions
None triggered.

## Verdict
**PASS — continuing automatically to Sprint 18B.7.**
