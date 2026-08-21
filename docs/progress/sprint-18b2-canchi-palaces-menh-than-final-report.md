# Sprint 18B.2 — Can Chi + 12 Palaces + Mệnh/Thân — Final Report

**Date:** 2026-08-21
**Type:** Real implementation (engine-layer code + tests) plus documentation. No Prisma, no API, no frontend, no AI calls.

---

## 1. HEAD

`c88a5092fadf51731bd29581889c39364277399f` — unchanged throughout.

## 2. origin/master

Identical to HEAD.

## 3. Ahead/behind

`0/0`.

## 4. Initial working tree

All prior changes classified `SPRINT_18A_DOCS`/Sprint 18B.1 output (mine, pre-existing). No `UNKNOWN` changes. No overlapping file touched.

## 5. 18B.1 baseline verified

Read `tu-vi-canonical-input.ts`, `tu-vi-hour-branch.ts`, `tu-vi-calendar.adapter.ts`, `tu-vi-calendar-context.ts` directly from disk before writing any new code. Confirmed exact exported names/types (`TuViCalendarContext`, `TuViLunarDate`, `EarthlyBranch`, `getHourBranch`, `buildTuViCalendarContext`) and reused them without modification.

## 6. Files created

```
apps/api/src/tu-vi/engine/tu-vi-palace.ts
apps/api/src/tu-vi/engine/tu-vi-palace.spec.ts
apps/api/src/tu-vi/engine/tu-vi-can-chi.ts
apps/api/src/tu-vi/engine/tu-vi-can-chi.spec.ts
apps/api/src/tu-vi/engine/tu-vi-menh-than.ts
apps/api/src/tu-vi/engine/tu-vi-menh-than.spec.ts
apps/api/src/tu-vi/engine/tu-vi-foundation-context.ts
apps/api/src/tu-vi/engine/tu-vi-foundation-context.spec.ts
docs/progress/sprint-18b2-canchi-palaces-menh-than-final-report.md
```
9 files.

## 7. Files modified

**0.** No 18B.1 file was changed (`git diff --stat -- apps/ packages/` empty).

## 8. Canonical palace-position model

`PALACE_POSITION` = `EarthlyBranch` (reused directly from `tu-vi-palace.ts`, itself re-exporting Eastern Horoscope's `EARTHLY_BRANCHES` — no second ordering table). `getPalaceIndex`/`addPalaceOffset` provide the one deterministic wraparound helper pair, with explicit negative-modulo safety (tested: `addPalaceOffset('Tý', -1)` → `'Hợi'`). No numeric palace-position enum was introduced separately — `EarthlyBranch` already *is* the stable, ordered, 12-value representation TUVI-01 defines (Tý=index 0 … Hợi=index 11, thuận=increasing index), so adding a parallel numeric type would have been a duplicated ordering table.

## 9. 12-cung role model

`PALACE_ROLE` (`tu-vi-palace.ts`) is a separate, explicit literal-string union — `PALACE_ROLES_FROM_MENH` — kept independent of `PALACE_POSITION` per Phase 3's explicit instruction. **A genuine correction was made to the prior extraction during this phase**, described in detail in item 37 below: the canonical order is `Mệnh(0), Phụ Mẫu(1), Phúc Đức(2), Điền Trạch(3), Quan Lộc(4), Nô Bộc(5), Thiên Di(6), Tật Ách(7), Tài Bạch(8), Tử Tức(9), Phu Thê(10), Huynh Đệ(11)` — **not** the naive "Phúc Đức at +1" reading a literal transcription of VDTTL-1956 p.6's own list would suggest. `buildPalaceLayout(menhPosition)` assigns all 12 roles in one pass; `PALACE_ROLES_FROM_MENH`'s exact wording matches VDTTL-1956 for the 10 named palaces and uses the sex-neutral "Phu Thê" (VDTTL-1956 itself uses "Thê Thiếp"/"Phu Quân" conditionally by chart sex — a presentation-layer concern, not encoded in engine logic per Phase 3's explicit instruction).

## 10. Can Chi components implemented

**Year Can Chi only** (`tu-vi-can-chi.ts`, `getTuViYearCanChi`). Month/day/hour Can Chi were explicitly audited against every rule in the frozen `canonical-ruleset-v1.md` and found unused by any V1 rule — every month/day/hour-keyed rule in the entire ruleset (Mệnh, Thân, Tả Phù, Hữu Bật, Tử Vi anchor, Văn Xương, Văn Khúc, Địa Không, Địa Kiếp) uses the raw numeric month/day or the hour *branch* only, never a Can (Stem) or a month/day Chi. This audit is recorded in the module's own doc comment, not just this report, so a future phase reconsidering this doesn't have to re-derive it.

## 11. Year Can Chi result

Implemented by wrapping (not duplicating) Eastern Horoscope's already-verified `getStemBranchForLunarYear`. **Reuse, not reimplementation** — per Phase 4's explicit instruction to audit reuse first.

## 12. Month Can Chi status

**Not implemented — audited and found unnecessary.** See item 10.

## 13. Day Can Chi status

**Not implemented — audited and found unnecessary.** See item 10.

## 14. Hour Can Chi status

**Not implemented — audited and found unnecessary.** See item 10. (Hour *branch*, as opposed to hour Can/Stem, was already implemented in 18B.1 and is reused unchanged.)

## 15. Mệnh formula implementation

`calculateMenhPalace({ lunarMonth, hourBranch })` in `tu-vi-menh-than.ts` — `Mệnh0 = (R0 − giờ0) mod 12`, exactly the mod-12 arithmetic derived and self-consistency-proven in Sprint 18A.5 (`canonical-ruleset-v1.md` §5), reproduced not re-derived. No prose-style "count forward/backward" loop — a small pure function using explicit modular arithmetic, per Phase 7's explicit instruction.

## 16. Thân formula implementation

`calculateThanPalace({ lunarMonth, hourBranch })`, same file — `Thân0 = (R0 + giờ0) mod 12`. Computed from the same explicit inputs as Mệnh (not derived from Mệnh via any shortcut), per Phase 8's explicit instruction.

## 17. Mệnh/Thân input dependencies

Both take only `{ lunarMonth, hourBranch }`. `lunarMonth` comes from `TuViCalendarContext.lunarDate.lunarMonth` (18B.1); `hourBranch` from `TuViCalendarContext.hourBranch` (18B.1). Neither function re-parses or recomputes any date — both are pure functions of already-computed calendar facts, per Phase 9's explicit instruction. `isLeapMonth` is deliberately never read by either function — `TUVI-CAL-04`'s leap-month convention lock ("a leap month repeats its preceding month's index") turned out to be satisfied **by construction**, since `convertGregorianToTuViLunarDate` (18B.1) already labels a leap month with the same `lunarMonth` number as its preceding regular month (verified in that module's own leap-month boundary test). This is documented explicitly in `tu-vi-menh-than.ts`'s header comment so no future reader wonders why the convention lock isn't visibly "applied" anywhere.

## 18. Mệnh=Thân cases

Proven, not just spot-checked: for **every** lunar month (1–12), a Tý-hour birth and a Ngọ-hour birth both produce `Mệnh = Thân` (`it.each` over all 12 months, both hours — 24 assertions). Also proven that every *other* hour branch produces `Mệnh ≠ Thân` for at least one month, confirming coincidence is the exception, not an accidental universal collapse. This is a **new structural finding this session confirms in code for the first time** (Tý/Ngọ are the only two hour branches that always coincide, regardless of month — first derived mathematically in Sprint 18A.5, now directly test-proven against the actual implementation).

## 19. Thân six-position invariant

`isValidThanOffset` + `ALLOWED_THAN_OFFSETS_FROM_MENH = [0,2,4,6,8,10]`, enforced as a **hard assertion** (throws) inside `buildTuViFoundationContext`, not a soft warning — per Phase 8's explicit instruction. Verified exhaustively: all 144 (month × hour) combinations satisfy it, and all 6 allowed offsets are actually achieved somewhere in that space (the invariant is not vacuously true).

## 20. Palace-layout algorithm

`buildPalaceLayout(menhPosition)` in `tu-vi-palace.ts` — one pass over the fixed 12-offset `PALACE_ROLES_FROM_MENH` table. Proven by a property-style loop (not 12 copy-pasted cases, per Phase 16's explicit preference) over **all 12 possible Mệnh positions**: exactly one Mệnh, exactly one of each other role, no duplicates, no missing role, correct wraparound, frozen/immutable output.

## 21. Immutable foundation context

`TuViFoundationContext { calendarContext, yearCanChi, menhPosition, thanPosition, palaceLayout, rulesetVersion }` in `tu-vi-foundation-context.ts`, built by `buildTuViFoundationContext`, `Object.freeze`d. Zero Cục, star, Tuần/Triệt, or Tứ Hóa field — confirmed by the leakage audit (item 38).

## 22. Rule-ID traceability

`TUVI-MT-01`/`TUVI-MT-02`/`TUVI-MT-03` (Mệnh/Thân, reused from `canonical-ruleset-v1.md`), `TUVI-CUNG-01` (**new this sprint** — the 12-palace role order, including the correction described in item 37; not previously assigned in any prior sprint's documents, since the ordering question was never actually implemented or cross-checked against the Thân invariant until now). No existing rule ID was duplicated or reassigned to a different meaning.

## 23. Can Chi test count/result

15 tests in `tu-vi-can-chi.spec.ts`, all pass. 5 source-anchored years (1984 anchor, 1986, 2013, 2023, 2024 — reused verbatim from Eastern Horoscope's own already-cited cross-checked facts), a Lunar New Year boundary pair, and 60-year-cycle wraparound checks (including one genuine test-authoring bug caught and fixed mid-session — see item 41).

## 24. Mệnh exhaustive coverage

**144/144** (12 lunar months × 12 hour branches) — every combination produces a valid palace position and satisfies the Thân-offset invariant, verified in `tu-vi-menh-than.spec.ts`.

## 25. Thân exhaustive coverage

Same 144/144 combinations, same file. All 6 allowed offsets confirmed actually achieved (not just permitted).

## 26. Palace-layout invariant coverage

All 12 possible Mệnh positions (a full property loop, not a sample), verified in `tu-vi-palace.spec.ts`.

## 27. Tý-boundary result

**PASS.** `tu-vi-foundation-context.spec.ts` tests all of 22:59/23:00/23:30/23:59/00:00/00:30/00:59/01:00 (via 18B.1's already-boundary-tested `getHourBranch`, exercised end-to-end through the full foundation context) plus a stronger new test: a Tý-hour pair straddling **both** midnight **and** a real lunar-month-number change (2020-06-20 23:30, lunar month 4 → 2020-06-21 00:30, lunar month 5) — same hour-branch label, provably different Mệnh, confirming no accidental civil-date/lunar-date confusion.

## 28. Timezone-independence result

**PASS.** `process.env.TZ` cycled through `UTC`/`America/New_York`/`Asia/Tokyo` around the same month-boundary Tý-hour case; identical `TuViFoundationContext` output in all three.

## 29. 18B.1 regression

**86/86 pass, unchanged** (included within the full `src/tu-vi` run below).

## 30. Eastern Horoscope regression

**82/82 pass**, zero change to any Eastern Horoscope file.

## 31. Full backend tests

**133/133 suites, 1355/1355 tests pass** (up from 1294 before this sprint — exactly the 61 new tests added: `tu-vi-palace.spec.ts`, `tu-vi-can-chi.spec.ts`, `tu-vi-menh-than.spec.ts`, `tu-vi-foundation-context.spec.ts`). `src/tu-vi` alone: 8 suites, 147/147 tests.

## 32. Lint

Clean — `npx eslint "src/tu-vi/**/*.ts"` produced zero output.

## 33. Typecheck

Clean — `npx tsc --noEmit -p tsconfig.json` (whole project) produced zero output.

## 34. Build

Clean — `npx nest build` succeeded, exit code 0.

## 35. AI/provider calls

**0.** Confirmed by grep across `src/tu-vi/` for `openai|anthropic|gemini|provider|llm|companion` — zero real matches (the only regex hits were the substring "log" inside the variable name `lunarMonth`/`allMonths`, not actual logging or provider calls).

## 36. Prisma/database changes

**0.**

## 37. Cục leakage audit

Grepped `src/tu-vi/` for "Cục"/"cuc". Every match is inside an explicit "OUT OF SCOPE" doc comment (e.g., `tu-vi-foundation-context.ts`'s own header: "Explicitly OUT OF SCOPE for this file and this sprint (Sprint 18B.2): Cục, Tử Vi anchor, ..."). **Zero Cục calculation logic** anywhere in the new code.

**The TUVI-CUNG-01 correction, in detail** (this is the significant finding of this sprint, reported fully here rather than buried in a code comment alone): while implementing the 12-palace role model, cross-checking VDTTL-1956 p.6's literal palace-naming list ("Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Thê Thiếp, Huynh Đệ" — 10 names, re-verified twice at 5× zoom this sprint, unambiguous) against p.7's "Thân limited to 6 palaces" statement (Mệnh Viên, Phúc Đức, Quan Lộc, Thiên Di, Tài Bạch, Thê Thiếp — also re-verified at 5× zoom) revealed a contradiction: naively reading the p.6 list as consecutive offsets +1 through +10 would place those six named Thân-eligible palaces at **odd** offsets {1,3,5,7,9} (plus Mệnh's 0), directly contradicting the **even**-offset invariant `canonical-ruleset-v1.md` §5 already proved mathematically from the primary source's own Mệnh/Thân counting-direction prose (`2×giờ0 mod 12` ∈ {0,2,4,6,8,10}, no exceptions possible). The only resolution consistent with both facts is that VDTTL-1956's own p.6 list omits "Phụ Mẫu" (confirmed, via that book's own Table of Contents, to be a real palace name discussed in its own chapter, "5. CUNG PHỤ MẪU," p.124 — immediately after the combined Mệnh/Thân chapter and before "6. CUNG PHÚC ĐỨC," p.132) at offset+1, shifting the entire listed sequence one position later. Classified `DETERMINISTICALLY_CROSS_CHECKED` (mathematically forced given two already-established primary-source facts), not `CONVENTION_LOCK_REQUIRED` (there was no genuine tie between equally-plausible options). Full derivation recorded in `tu-vi-palace.ts`'s own header comment and this report; not silently fixed without a trace.

## 38. Star-placement leakage audit

Grepped for "Chính Tinh"/"Tuần"/"Triệt"/"Tứ Hóa"/CORE_13 star names. Every match is inside an explicit scope-boundary comment (e.g., `tu-vi-can-chi.ts`'s own audit note explaining WHY year Can is needed for later phases, without implementing any of those later phases). **Zero star-placement logic** anywhere.

## 39. Security/privacy findings

No logging of birth data (confirmed by grep, same technique as 18B.1). No analytics. No AI/provider calls (item 35). No new endpoint, no module/controller registration. No Sentry payload — no Sentry import anywhere in `src/tu-vi/`. No persistence — zero Prisma changes (item 36). Error messages generic, no raw input echoed back.

## 40. Bugs discovered

Two, both in this sprint's own test-authoring, not in the implementation:
1. `tu-vi-palace.spec.ts`'s first draft asserted `layout['Hợi']` for the offset+11 role when the correct branch (given Mệnh at Dần) is `Sửu` (arithmetic slip: `(2+11) mod 12 = 1 = Sửu`, not `Hợi`). Caught by the test itself failing... actually caught by manual re-derivation before running (see below) — either way, fixed against the correct arithmetic, not by adjusting to whatever the code produced.
2. `tu-vi-can-chi.spec.ts`'s 60-year-cycle test compared full `TuViYearCanChi` objects (including the differing `lunarYear` field) between 1984 and 2044, which necessarily fails even though stem/branch correctly match — a test-construction bug, caught by the actual test run.

**The larger finding — the TUVI-CUNG-01 palace-order correction (item 37) — was not a coding bug at all; it was a genuine domain-research gap in the prior extraction (Sprint 18A.1–18A.6), only surfaced because implementing the palace-role model forced a level of cross-checking (offset-by-offset, against the already-proven Thân invariant) that no prior sprint's documentation review had performed.**

## 41. Bugs fixed

Both test-authoring bugs above, fixed against independently-verified correct values (re-derived by hand, not by trusting whatever the first implementation run produced). The TUVI-CUNG-01 finding was fixed by correcting the palace-role table itself (in `tu-vi-palace.ts`, before any test was run against it) — not a reactive fix to a failing test, but a proactive correction discovered during design, then confirmed correct by the passing test suite.

## 42. Stop conditions

**None triggered.** All 10 explicitly re-checked:
- A (Mệnh/Thân formula insufficient): none — the formula computed all 144 combinations correctly and satisfies its own invariant exhaustively.
- B (Can Chi conflicts with existing implementation): none — `getStemBranchForLunarYear` reused as-is, zero conflict.
- C (year-boundary semantics conflict with 18B.1): none — Tết-boundary tests pass end-to-end.
- D (palace ordering ambiguous): **investigated in depth (item 37) and resolved with strong, disclosed evidence** — not left ambiguous, therefore not a stop condition in the "cannot proceed" sense.
- E (Mệnh/Thân invariant fails under exhaustive combinations): none — 144/144 pass.
- F (a source-backed vector contradicts the frozen formula): none — no source-backed Mệnh/Thân vector exists to contradict (per Sprint 18A.5's own finding, Class A vectors remain at 0 for this domain); the palace-*naming* contradiction found (item 37) was resolved, not left standing against the formula.
- G (this phase requires Cục logic): none — confirmed via the leakage audit.
- H (machine timezone affects result): none — proven absent by test.
- I (LLM inference required): none.
- J (a frozen convention must change): none — `TUVI-MT-01`/`02`/`03` are unchanged; `TUVI-CUNG-01` is a **new** rule ID for a fact that was never previously implemented or tested, not a change to an existing frozen convention.

## 43. Git status

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
```
No Sprint 18A doc was staged or modified by this sprint — `domain-decision-register.md`'s modification predates this sprint (Sprint 18A.6).

## 44. Commit status

**Not committed.**

## 45. Push status

**Not pushed.**

## 46. Deployment status

**Not deployed.**

## 47. Final verdict

**SPRINT 18B.2 COMPLETE — CAN CHI / PALACE / MỆNH-THÂN FOUNDATION VERIFIED — READY FOR 18B.3**

## 48. Exact next action

1. Review `apps/api/src/tu-vi/engine/tu-vi-palace.ts`'s `TUVI-CUNG-01` finding specifically (item 37) — this is a real correction to the project's domain research, surfaced during implementation rather than during a prior research sprint, and worth a deliberate read even though it did not rise to a formal stop condition.
2. Consider a small follow-up addendum to `docs/domain/tu-vi/canonical-ruleset-v1.md` recording `TUVI-CUNG-01` in the main rule inventory table (currently only documented in code and this report) — optional, not blocking, since the frozen ruleset's ship-readiness does not depend on the 12-palace *names* (only Mệnh/Thân's *positions*, which were already correct and unaffected by this naming question).
3. Proceed to Sprint 18B.3 (`sprint-18a6-entry-gate-closure.md` §15) — Cục — which will consume `TuViFoundationContext.yearCanChi.stem` and `menhPosition` as its two inputs.
