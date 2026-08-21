# Sprint 18B Entry Gate — Tử Vi Engine Implementation

**Date:** 2026-08-21
**Status:** **NOT MET.** This is a hard, machine/checklist-style gate. No percentage-based override exists — all boxes are required, not "most" or "enough."

Sprint 18B (actual engine implementation) may not begin until every box below is checked, with the checking event and evidence recorded next to it. This document itself does not check any box — it only defines what checking each box requires and records the current (all-unmet) state.

---

## Checklist

```
[ ] TUVI_SCHOOL_V1 locked
[ ] TUVI_RULESET_V1 frozen
[ ] Kim Tứ resolved
[ ] Triệt resolved
[ ] Giờ Tý/day boundary resolved
[ ] Mệnh verified
[ ] Thân verified
[ ] Cục verified
[ ] Tử Vi anchor verified
[ ] 14 Chính Tinh verified
[ ] auxiliary V1 verified
[ ] Tuần verified
[ ] Triệt verified
[ ] Tứ Hóa verified
[ ] >=12 accepted golden vectors
[ ] >=2 reviewer/source paths represented
[ ] An Sao audit PASS
```

---

## What checking each box requires

| Item | Current state | What moves it to checked |
|---|---|---|
| `TUVI_SCHOOL_V1` locked | ✅ **Already met** (`VDTTL_1956`, `domain-decision-register.md` DECISION-01, Sprint 18A.2, founder decision) | Already satisfied — carried forward, not re-opened by this gate |
| `TUVI_RULESET_V1` frozen | ✗ Currently `TUVI_RULESET_CANDIDATE_V1 = VDTTL_1956_CANDIDATE_1`, status `CANDIDATE_PENDING_EXPERT_VERIFICATION` | All other boxes in this checklist pass, then the `_CANDIDATE` designation is dropped per `expert-review-pack.md` §9 step 7 |
| Kim Tứ resolved | ✗ `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`, not expert-confirmed | Expert Question 1 answered, resolution recorded in `golden-vector-comparison-matrix.md` conflict-resolution fields (if needed) |
| Triệt resolved | ✗ `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`, not expert-confirmed | Expert Question 2 answered, resolution recorded |
| Giờ Tý/day boundary resolved | ✗ Hour-label rule confirmed; day-boundary rule has non-VDTTL-1956-specific evidence only | Expert Question 3 answered with an explicit VDTTL-1956-specific (or expert-declared-convention) ruling |
| Mệnh verified | ✗ Structure source-confirmed; exact arithmetic unverified, 0 independent numeric checks | Expert Question 4 + ≥12 golden vectors' Mệnh fields agree per the acceptance rule |
| Thân verified | ✗ Same as Mệnh | Same as Mệnh, plus the 6-palace hard invariant holding across all accepted vectors |
| Cục verified | ✗ Table second-reviewed clean, but 0 independently-expert-confirmed vectors | ≥12 accepted vectors' Cục fields agree |
| Tử Vi anchor verified | ✗ 4/5 Cục blocks clean, Kim Tứ ambiguous | Kim Tứ resolved (above) + ≥12 accepted vectors' Tử Vi fields agree |
| 14 Chính Tinh verified | ✗ Offsets corroborated two ways, but 0 golden-vector confirmation | ≥12 accepted vectors' full 14-star fields agree |
| Auxiliary V1 verified | ✗ 13-star `CORE_V1` set recommended, not founder-locked or expert-confirmed | Founder confirms the 13-star scope AND ≥12 accepted vectors' auxiliary fields agree |
| Tuần verified | ✗ Table self-consistent, 0 expert confirmation | ≥12 accepted vectors' Tuần fields agree |
| Triệt verified | ✗ (duplicate of "Triệt resolved" above — both must be checked; this line tracks full golden-vector agreement specifically) | ≥12 accepted vectors' Triệt fields agree, on top of the conflict resolution above |
| Tứ Hóa verified | ✗ Table self-consistent, 0 expert confirmation | ≥12 accepted vectors' Tứ Hóa fields agree |
| ≥12 accepted golden vectors | ✗ **0 / 12** — the dominant blocker | `golden-vector-comparison-matrix.md` shows ≥12 rows at `CROSS_CHECKED` or `EXPERT_CONFIRMED` |
| ≥2 reviewer/source paths represented | ✗ 0 | Per vector: Reviewer A + Reviewer B, or Expert A + an independent trusted chart/source — not a single reviewer's uncorroborated output, for any of the ≥12 counted vectors |
| An Sao audit PASS | ✗ Per `an-sao-logic-audit.md`, 11/14 items `DOMAIN_REFERENCE_REQUIRED` as of last review | Re-run in full against the frozen ruleset and the accepted golden-vector set, all 14 items `PASS`, no item marked `PASS` merely because an engine "ran without error" |

---

## Current gate status

**0 of 16 boxes checked.** `TUVI_SCHOOL_V1` is the only prerequisite already satisfied from prior sprints; it is listed above for completeness but was not re-opened by this sprint.

## Explicit statement

**No item on this checklist may be waived, approximated, or partially satisfied.** A ruleset that is "probably right," a golden-vector count of "close to 12," or an An Sao audit with "only a couple of `DOMAIN_REFERENCE_REQUIRED` items left" does not open Sprint 18B. This mirrors `an-sao-logic-audit.md`'s own stated discipline: "No item may be marked `PASS` merely because the engine 'ran without an exception,'" extended here to the pre-implementation gate as a whole.
