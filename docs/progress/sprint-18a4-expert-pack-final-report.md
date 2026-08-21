# Sprint 18A.4 — Tử Vi Expert Verification Pack — Final Report

**Date:** 2026-08-21
**Type:** Domain research/documentation only. Zero application-code changes.

---

## 1. Git baseline

**HEAD:** `c88a5092fadf51731bd29581889c39364277399f`. **origin/master:** identical (`c88a509...`). **Ahead/behind:** `0/0` at session start. **`git diff --check`:** clean. Working tree at start: clean (per `git status --short`).

## 2. Candidate ruleset version

`TUVI_RULESET_CANDIDATE_V1 = VDTTL_1956_CANDIDATE_1`

## 3. Candidate ruleset status

`CANDIDATE_PENDING_EXPERT_VERIFICATION` — explicitly not verified. No rule promoted to `EXPERT_CONFIRMED` this sprint.

## 4. Rules normalized

All 13 required categories (Calendar, Can Chi, Giờ, Mệnh, Thân, Cục, 12 Cung, Tử Vi anchor, 14 Chính Tinh, 13 auxiliary V1 stars, Tuần, Triệt, Tứ Hóa) normalized into the `RULE_ID` / `INPUT` / `OUTPUT` / `CANONICAL REPRESENTATION` / `PRIMARY SOURCE` / `PAGE` / `CURRENT STATUS` / `KNOWN CONFLICT` / `EXPERT REVIEW REQUIRED?` format in `docs/domain/tu-vi/expert-review-pack.md` §2. No uncertainty hidden — every row states its actual status, including the 4 rows still carrying an unresolved conflict (Giờ day-boundary, Mệnh, Thân, Cục's downstream Kim Tứ cell, Triệt) and the rows that are strong-but-not-expert-confirmed (12 Cung, Tuần, Tứ Hóa, 14 Chính Tinh, auxiliary V1).

## 5. Direction-label handling

Implemented per instruction: the 14 Chính Tinh's canonical representation is `anchor + offset (mod 12)`, using literal offset tables. "Thuận"/"nghịch"/"clockwise"/"counterclockwise" labels are preserved only as source notes, never as engine-executed instructions — documented with reasoning in `expert-review-pack.md` §3, referencing the specific finding (`vdttl-1956-second-review.md` §1) that motivated this policy: direction *labels* disagree between VDTTL-1956 and an external adversarial source for the Tử Vi group, while the *decoded numeric offsets* agree exactly.

## 6. Expert questions prepared

4 of 4, in `expert-review-pack.md` §4 and repeated in `expert-blind-golden-vector-pack.md`'s closing section: Kim Tứ Cục, Triệt, Giờ Tý day rollover, Mệnh/Thân.

## 7. Kim Tứ review form

Prepared — printed value, formula-derived value, exact affected lunar day (24), exact affected palace (Mùi, candidate), 4-option answer format (A/B/C/D). `expert-review-pack.md` §4, Question 1.

## 8. Triệt review form

Prepared — VDTTL-1956 table result (Mùi, Ngọ), VDTTL-1956 worked-example result (Thân, Dậu), independent corroborating result (`tracuutuvi.com`, matches table), 4-option answer format. §4, Question 2.

## 9. Giờ Tý review form

Prepared — hour-branch rule vs. day-boundary rule kept explicitly separate; two distinct sub-questions (23:30 case, 00:30 case) so the answer pair directly reveals whether midnight rollover applies. §4, Question 3.

## 10. Mệnh/Thân review form

Prepared — candidate formula shown (structure-derived, not the disputed secondary formula), 4 concrete lunar month/hour inputs (including two wraparound cases), expert asked to compute independently before comparison. §4, Question 4.

## 11. Golden-vector inputs created

15 (VECTOR-01 through VECTOR-15), all in `expert-blind-golden-vector-pack.md`. Every vector carries a `WHY_THIS_VECTOR_EXISTS` rationale tied to specific coverage cells and `RULE_ID`s — none selected blindly. Design targets (intended Mệnh branch, intended Cục) were derived by hand-applying VDTTL-1956's own source-confirmed counting method (TUVI-05/06) and the Cục lookup table (TUVI-07), explicitly flagged as design intent, not asserted actual output, and explicitly not an engine implementation (no star placement, no Tuần/Triệt/Tứ Hóa computation was performed by hand for any vector).

## 12. Vector coverage matrix

All required coverage cells addressed — all 5 Cục (via VECTOR-07 through VECTOR-11's targeted Can/palace-row combinations), all 10 Heavenly Stems (Can) represented across the 15 vectors, 11 of 12 hour-branches used directly as the birth hour, multiple lunar months, male/female balance (8 Nam / 7 Nữ), Tý hour (V1/V2), 23:xx and 00:xx boundary pair (V1/V2), Lunar New Year boundary both sides (V3/V4), leap lunar month interior and exit cases (V5/V6), Tử Vi anchor edge case targeting the Kim Tứ ambiguity directly (V7/V8), main-star offset wraparound stress case (V14), Tuần across two decade-groups (V12/V13), Triệt reproducing the book's own disputed case (V12), all four Tứ Hóa transformations (automatic, given full Can coverage), and a Mệnh=Thân coincidence target (V15). Full table in `expert-blind-golden-vector-pack.md`'s "Coverage this 15-vector slate is designed to exercise" section.

## 13. Blind Pack A created

Yes — `docs/domain/tu-vi/expert-blind-golden-vector-pack.md`. Contains: Vietnamese cover instructions, 15 vectors (input + blank output template each), the 4 domain questions, and an explicit closing confirmation that no expected values are pre-populated.

## 14. Internal Pack B created

Yes — `docs/domain/tu-vi/golden-vector-comparison-matrix.md`. Contains: rule-ID-to-column mapping, the 15-row comparison matrix (blank/pending), the reviewer-A/reviewer-B tracking table (blank/pending), and conflict-resolution field templates. Does **not** contain pre-computed candidate chart values — see that document's own explanation of why (computing 15 full candidate charts by hand would itself be an unscoped manual engine implementation).

## 15. Expected values pre-populated?

**NO.** Confirmed explicitly in both `expert-blind-golden-vector-pack.md`'s closing section and `golden-vector-comparison-matrix.md`'s header.

## 16. Reviewer model

Reviewer A + Reviewer B, or Expert A + an independent trusted chart/source — defined in `expert-review-pack.md` §8, with the full per-vector tracking field set (`REVIEWER_A`, `REVIEWER_B`, `MATCH_STATUS`, `DISAGREEMENTS`, `RESOLUTION`) and the 6 allowed `MATCH_STATUS` values.

## 17. Vector acceptance policy

A vector is accepted only when **all** deterministic fields required for it agree — partial agreement (e.g., Cục matches but a star doesn't) is explicitly insufficient and must be recorded as `CONFLICT`. Documented in `expert-review-pack.md` §8 and restated in `golden-vector-comparison-matrix.md`.

## 18. Comparison matrix

Created (`golden-vector-comparison-matrix.md`), 15 rows, entirely blank/`PENDING`, exactly matching the column set specified in the governing task (`Vector | Calendar | Mệnh | Thân | Cục | 14 CT | Aux | Tuần | Triệt | Tứ Hóa | Status`).

## 19. Vietnamese expert instructions

Written, in `expert-review-pack.md` §10 (standalone concise sheet) and duplicated/adapted as the cover instructions in `expert-blind-golden-vector-pack.md`. Covers: VDTTL-1956 V1 framing, deterministic-placements-only scope (not fortune interpretation), no adapting results to match our tables, explicit disagreement recording, stating if a different school/convention is used, stating if a rule differs from VDTTL, not silently substituting Nạp Âm/Eastern Horoscope rules, and the importance of exact birth-time treatment.

## 20. Evidence references

Compiled in `expert-review-pack.md` §5 — for each of the 4 disputed questions: source title, printed page, scan-page reference (where available), table/rule name, and the exact conflict, plus the corroborating secondary sources used (with their independence explicitly checked, per the project's existing false-independence discipline). No screenshots included (copyright caution on a 1956 book with unclear modern reprint rights); page/section citations are given instead, sufficient to navigate the same publicly-accessible archive.org item.

## 21. Expert qualification requirements

Defined in `expert-review-pack.md` §6 — Vietnamese fluency, demonstrable lập lá số experience, ability to state their own school/convention, willingness to give deterministic placements not just interpretation, willingness to flag disagreements. No fabricated academic-credential requirement. VDTTL-1956 familiarity and access to reference texts listed as preferred, not required.

## 22. Post-expert workflow

Defined in `expert-review-pack.md` §9, an explicit 8-step non-skippable sequence: import responses → compare field-by-field → resolve discrepancies → obtain second review → promote ≥12 vectors → re-run An Sao Logic Audit → freeze `TUVI_RULESET_V1` → only then open Sprint 18B.

## 23. Sprint 18B gate

Written as `docs/domain/tu-vi/sprint-18b-entry-gate.md` — the exact 16-item checklist from the governing task, each item's current state and what specifically moves it to checked, with an explicit "no percentage-based override" statement. Current state: 0 of 16 boxes checked (1 prerequisite, `TUVI_SCHOOL_V1` locked, was already satisfied from a prior sprint and is not itself newly opened by this gate).

## 24. Current accepted golden vectors

**0.** Unchanged from Sprint 18A.3. This sprint designed 15 candidate vectors' *inputs* but produced zero *accepted* vectors (no expert has responded yet) — exactly the expected, honest state for a sprint whose job was to prepare the pack, not to fill it.

## 25. Current unresolved conflicts

Kim Tứ Cục (day 21/24 ambiguity, `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`); Triệt (table vs. worked example, `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`); Giờ Tý day-boundary (hour rule resolved, day-boundary rule has non-VDTTL-1956-specific evidence only); Mệnh/Thân exact arithmetic (structure confirmed, 0 independent numeric worked-example checks). All four are precisely the four expert questions in this pack — no fifth undocumented conflict was found or introduced this sprint.

## 26. Application-code changes

**Zero.** Confirmed via `git diff --stat -- apps/ packages/` returning empty, both at baseline and at report time.

## 27. Files created

- `docs/domain/tu-vi/expert-review-pack.md`
- `docs/domain/tu-vi/expert-blind-golden-vector-pack.md`
- `docs/domain/tu-vi/golden-vector-comparison-matrix.md`
- `docs/domain/tu-vi/sprint-18b-entry-gate.md`
- `docs/progress/sprint-18a4-expert-pack-final-report.md` (this file)

## 28. Files modified

None. No prior document was edited this sprint — this sprint only added new files, per the governing task's "do not erase previous research history" instruction. `vdttl-1956-extraction.md`, `v1-canonical-ruleset.md`, `vdttl-1956-second-review.md`, `golden-vectors.md`, `domain-decision-register.md`, `authoritative-sources.md`, and `an-sao-logic-audit.md` were all read for reference but not changed.

## 29. Git status

```
?? docs/domain/tu-vi/expert-blind-golden-vector-pack.md
?? docs/domain/tu-vi/expert-review-pack.md
?? docs/domain/tu-vi/golden-vector-comparison-matrix.md
?? docs/domain/tu-vi/sprint-18b-entry-gate.md
?? docs/progress/sprint-18a4-expert-pack-final-report.md
```

## 30. Commit status

**Not committed.**

## 31. Push status

**Not pushed.**

## 32. Deployment status

**Not deployed.**

## 33. Final verdict

**SPRINT 18A.4 EXPERT VERIFICATION PACK COMPLETE — WAITING FOR HUMAN DOMAIN REVIEW — SPRINT 18B REMAINS BLOCKED**

## 34. Exact human action required next

1. **Recruit a qualified reviewer** per `expert-review-pack.md` §6 (Vietnamese-fluent, demonstrable lập lá số experience, willing to give deterministic placements and flag disagreements).
2. **Hand them `docs/domain/tu-vi/expert-blind-golden-vector-pack.md` first, alone** — not `expert-review-pack.md`, not `golden-vector-comparison-matrix.md` — so their 15-vector answers and 4-question answers are produced independently, before seeing any candidate ruleset value.
3. **Recruit a second reviewer** (or identify an independent trusted chart/source) for the same 15 vectors, per the acceptance rule in §8 — a single reviewer's output alone can never move a vector past `REVIEWER_A_COMPLETE`.
4. **Once both responses are in hand**, return to this project and resume at `expert-review-pack.md` §9 (post-expert procedure) — import responses into `golden-vector-comparison-matrix.md`, compare field-by-field, resolve discrepancies, and only then proceed toward freezing `TUVI_RULESET_V1` and checking the boxes in `sprint-18b-entry-gate.md`.
5. Do not begin any engine, Prisma, API, frontend, or AI-interpretation work for Tử Vi until that checklist shows all 16 boxes checked.
