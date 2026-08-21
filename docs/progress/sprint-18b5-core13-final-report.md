# Sprint 18B.5 — CORE_13 Auxiliary Stars — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (engine-layer code + tests). No Prisma, no API, no frontend, no AI calls.

## Files created
`tu-vi-core13.ts`, `tu-vi-core13.spec.ts`, `tu-vi-core13-context.ts`, `tu-vi-core13-context.spec.ts`.

## Files modified (additive only)
`tu-vi-canonical-input.ts` — added optional `sex?: 'Nam' | 'Nữ'` to `TuViBirthInput`/`TuViParsedBirthInput` (non-breaking; every 18B.1–18B.4 test still compiles/passes unchanged). `tu-vi-calendar-context.ts` — passes `sex` through into `TuViCalendarContext` (optional field, additive).

## New primary-source evidence this sprint
Re-rendered VDTTL-1956 p.10 at 5× zoom (previously only p.11 had been read for this section). This resolved an open question from Sprint 18A.6: **both** Hỏa Tinh/Linh Tinh gender-parity cases are explicitly stated in the primary text ("Dương nam, âm nữ" and "Âm nam, dương nữ," each with its own direction pair) — not just the one case previously captured. Also re-confirmed Kình Dương/Đà La's rule and worked example (Lộc Tồn Tý → Kình Dương Sửu, Đà La Hợi) and Địa Không/Địa Kiếp's rule, both matching what was already implemented.

## CORE_13 list
Lộc Tồn, Kình Dương, Đà La, Địa Không, Địa Kiếp, Hỏa Tinh, Linh Tinh, Tả Phù, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi, Thiên Việt — exactly the founder-locked 13, read from `canonical-ruleset-v1.md` §7, not enumerated from this prompt.

## 13/13 implementation status
All 13 implemented. Table lookups: Lộc Tồn (year-Can), Thiên Khôi/Việt (year-Can). Offset-from-anchor: Kình Dương/Đà La (±1 from Lộc Tồn), Địa Kiếp/Không (±hour0 from Hợi), Tả Phù/Hữu Bật (±month0 from Thìn/Tuất), Văn Xương/Khúc (±hour0 from Tuất/Thìn). Gender-conditional: Hỏa Tinh/Linh Tinh (start by year-Chi trine group, direction by sex × year-Can yin-yang parity — both parity cases now directly sourced, not inferred).

## Dependency audit
Full 13-row matrix in `tu-vi-core13.spec.ts`'s header comment. **Every row: DEFERRED-STAR DEPENDENCY = NO.** Kình Dương/Đà La depend on Lộc Tồn, itself CORE_13 — no dependency on any of the ~40 deferred stars (Thái Tuế series, Tràng Sinh series, Lộc Tồn's own companion walk, etc.).

## Auxiliary-star tests
248/248 `src/tu-vi` (up from 206, +42). `tu-vi-core13.spec.ts` (37 tests): normal cases, wraparound (all 12 hours, all 12 months), table boundary (all 10 Cans, all 12 Chis), the Yin/Yang×gender branch explicitly (both parity groups, with a dedicated flip test), rule-derived vectors reproducing `golden-vector-v2-spec.md` VECTOR-B4 exactly, structural invariants (13 unique IDs, stable order, frozen), invalid-input guards, determinism.

## Bugs discovered / fixed
**One, TEST_DEFECT**: the first "parity switch" test used `hourBranch: 'Ngọ'` (hour0=6), which is a self-inverse point under mod-12 negation (`+6 ≡ −6`), so the sex-driven direction flip has zero visible effect there — not a product defect, just a badly chosen test hour. Verified by hand (recomputing both parities at Ngọ, confirming they coincide mathematically) before fixing; fixed by switching to `'Mão'` (hour0=3, where the flip is visible). Production code was correct throughout.

## Test results
`src/tu-vi`: **248/248 pass** (14 suites). Eastern Horoscope: **82/82 pass**, unchanged. Full backend: **139 suites, 1456/1456 tests pass** (+42). Lint: one warning (unused import) found and fixed, now clean. Typecheck/`nest build`: clean.

## Leakage audit
Tuần/Triệt/Tứ Hóa: zero implementation, all matches are scope-boundary comments. Deferred stars (Thái Tuế, Tràng Sinh, Lộc Tồn's companion series): zero implementation, only named in an explanatory audit comment. AI/provider/logging: zero real matches (one grep hit was the English word "companion" describing a deferred *star series*, not the Companion AI module). Prisma/frontend/module registration: zero changes.

## Stop conditions
None triggered. (Condition E — "CORE_13 requires a deferred star" — explicitly checked via the dependency audit and found NO for all 13.)

## Verdict
**PASS — continuing automatically to Sprint 18B.6.**
