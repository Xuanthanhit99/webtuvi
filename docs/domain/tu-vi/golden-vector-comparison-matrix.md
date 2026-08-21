# Golden Vector Comparison Matrix (Pack B — internal) — Sprint 18A.4

**Date:** 2026-08-21
**Status:** All 15 vectors `PENDING`. 0 accepted (`CROSS_CHECKED`/`EXPERT_CONFIRMED`) toward the ≥12 gate.
**Audience:** Internal only — **do not send this document to the expert.** It exists to compare the expert's Pack A (`expert-blind-golden-vector-pack.md`) answers against `TUVI_RULESET_CANDIDATE_V1` (`expert-review-pack.md` §2) only *after* the expert's blind answers are in hand, per the post-expert procedure (`expert-review-pack.md` §9).

**Why this document does not contain pre-computed candidate chart values:** the governing task for this sprint explicitly prohibits implementing the engine. Hand-computing 15 complete candidate charts (all 12 palaces, 14 chính tinh, 13 auxiliary stars, Tuần, Triệt, Tứ Hóa) would itself be a manual execution of the ruleset-as-engine, with the same error surface as writing the code — exactly what this sprint is scoped not to do. Instead, this document provides the **comparison scaffolding**: which candidate `RULE_ID` governs each column, and blank tracking fields to be filled in during the post-expert comparison step, at which point computing the candidate value for one specific, now-expert-anchored input is a bounded, low-risk verification task rather than an open-ended engine build.

---

## Rule-ID reference per comparison column

| Column | Governing RULE_ID(s) | Candidate source |
|---|---|---|
| Calendar | TUVI-CAND-01 | `expert-review-pack.md` §2.1 |
| Mệnh | TUVI-05 | §2.4 |
| Thân | TUVI-06 | §2.5 |
| Cục | TUVI-07 | §2.6 |
| 14 CT | TUVI-09, TUVI-10, TUVI-11 | §2.9 |
| Aux | TUVI-12–TUVI-24 (13-star CORE_V1 subset) | §2.10 |
| Tuần | TUVI-26 | §2.11 |
| Triệt | TUVI-27 | §2.12 |
| Tứ Hóa | TUVI-25 | §2.13 |

---

## Comparison matrix

Blank/pending until real expert results arrive, per instruction. `Status` uses the allowed values from `expert-review-pack.md` §8: `PENDING`, `REVIEWER_A_COMPLETE`, `CROSS_CHECK_PENDING`, `CROSS_CHECKED`, `EXPERT_CONFIRMED`, `CONFLICT`.

| Vector | Calendar | Mệnh | Thân | Cục | 14 CT | Aux | Tuần | Triệt | Tứ Hóa | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| VECTOR-01 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-02 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-03 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-04 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-05 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-06 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-07 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-08 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-09 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-10 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-11 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-12 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-13 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-14 | — | — | — | — | — | — | — | — | — | PENDING |
| VECTOR-15 | — | — | — | — | — | — | — | — | — | PENDING |

**Acceptance rule (restated from `expert-review-pack.md` §8):** a vector's `Status` may only move to `CROSS_CHECKED`/`EXPERT_CONFIRMED` when **every** column for that row agrees between Reviewer A and Reviewer B (or Expert A and an independent trusted source). A single column disagreement forces `Status = CONFLICT`, regardless of how many other columns matched.

---

## Reviewer tracking (per vector)

| Vector | REVIEWER_A | REVIEWER_B | MATCH_STATUS | DISAGREEMENTS | RESOLUTION |
|---|---|---|---|---|---|
| VECTOR-01 | — | — | PENDING | — | — |
| VECTOR-02 | — | — | PENDING | — | — |
| VECTOR-03 | — | — | PENDING | — | — |
| VECTOR-04 | — | — | PENDING | — | — |
| VECTOR-05 | — | — | PENDING | — | — |
| VECTOR-06 | — | — | PENDING | — | — |
| VECTOR-07 | — | — | PENDING | — | — |
| VECTOR-08 | — | — | PENDING | — | — |
| VECTOR-09 | — | — | PENDING | — | — |
| VECTOR-10 | — | — | PENDING | — | — |
| VECTOR-11 | — | — | PENDING | — | — |
| VECTOR-12 | — | — | PENDING | — | — |
| VECTOR-13 | — | — | PENDING | — | — |
| VECTOR-14 | — | — | PENDING | — | — |
| VECTOR-15 | — | — | PENDING | — | — |

---

## Conflict-resolution fields (populate only once a `CONFLICT` occurs)

```
VECTOR_ID:
FIELD_IN_CONFLICT:
REVIEWER_A_VALUE:
REVIEWER_B_VALUE:
CANDIDATE_RULESET_VALUE (TUVI_RULESET_CANDIDATE_V1):
RESOLUTION_REASONING:
RESOLVED_VALUE:
RESOLVED_BY:
RESOLUTION_DATE:
```

---

## Gate status summary

**Vectors at `CROSS_CHECKED`/`EXPERT_CONFIRMED`: 0 / 15 designed, 0 / 12 required.**
**Sprint 18B remains BLOCKED until this count reaches ≥12 and `sprint-18b-entry-gate.md`'s full checklist passes.**
