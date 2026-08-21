# Sprint 18A.5 — AI-Only Domain Verification & Evidence Reclassification — Final Report

**Date:** 2026-08-21
**Type:** Domain research/documentation only. Zero application-code changes.

---

## 1. HEAD

`c88a5092fadf51731bd29581889c39364277399f` — unchanged throughout the session.

## 2. origin/master

`c88a5092fadf51731bd29581889c39364277399f` — identical to HEAD.

## 3. Ahead/behind

`0/0` at session start and end.

## 4. Working-tree baseline

Clean at session start (only Sprint 18A.4's 4 new docs + 1 progress report present as untracked). No tracked file was modified this session.

## 5. Documents read

Full re-read this session: `authoritative-sources.md`, `domain-decision-register.md`, `vdttl-1956-extraction.md`, `vdttl-1956-second-review.md`, `golden-vectors.md`, `golden-vector-specification.md`, `an-sao-logic-audit.md`, `calculation-specification.md`, `star-placement-rules.md`, `domain-resolution-pack.md`, `v1-canonical-ruleset.md`, `expert-review-pack.md`, `expert-blind-golden-vector-pack.md`, `golden-vector-comparison-matrix.md`, `sprint-18b-entry-gate.md`, all 5 prior `docs/progress/sprint-18a*` final reports. `docs/audit/` inventoried (contents unrelated to Tử Vi — general product/sprint audits — confirmed, none touched). No summary was trusted over source files where a source file existed.

## 6. New evidence model

Old ladder (`UNVERIFIED → SOURCE_EXTRACTED → CROSS_CHECKED → EXPERT_CONFIRMED`) and the Sprint 18A.4 `CANDIDATE_PENDING_EXPERT_VERIFICATION` framing are retired from active use (not deleted from history). New ladder: `UNSOURCED → PRIMARY_SOURCE_EXTRACTED → PRIMARY_SOURCE_RECHECKED → INDEPENDENT_SOURCE_CORROBORATED / DETERMINISTICALLY_CROSS_CHECKED → CONVENTION_LOCK_REQUIRED / SOURCE_CONFLICT → IMPLEMENTATION_READY`. `EXPERT_CONFIRMED` is never assigned by an AI. Full definition and rationale: `ai-only-verification-standard.md`.

## 7. Number of canonical rules

28 rows in the `canonical-ruleset-v1.md` inventory, covering all 20 required categories from the governing task's Phase 3 list (several categories expand into multiple rows, e.g. Mệnh and Thân as separate rows, 7 individual auxiliary-star rows).

## 8. Rules `PRIMARY_SOURCE_EXTRACTED`

All 28 start here at minimum; most were upgraded further this sprint (see next item). Rows still at this level only (not re-rechecked this sprint): the 6 auxiliary-star rows not re-rendered/re-read this session (Kình/Đà, Địa Không/Kiếp, Hỏa/Linh, Tả Phù/Hữu Bật, Văn Xương/Khúc, Khôi/Việt) — carried forward from Sprint 18A.1/18A.2's own triple-review, not re-verified a fourth time this sprint.

## 9. Rules `PRIMARY_SOURCE_RECHECKED`

This sprint performed a genuine third independent read from freshly-rendered page images (not the prior transcription, not OCR text): Giờ, Mệnh/Thân structure, full 30-cell Cục table, both chính-tinh group direction sentences + all 14 offsets, all 5 Tử Vi-anchor Cục blocks (Kim Tứ Cục's anomaly re-confirmed, not resolved), the Tử Vi/Thiên Phủ mirror coincidence points, the 40-cell Tứ Hóa table, the Tuần table, the Triệt table (its conflict re-confirmed), and the Lộc Tồn table. 12 of 28 rows are `PRIMARY_SOURCE_RECHECKED`. Zero divergence found from the prior two reads in every case.

## 10. Rules independently corroborated

- **`INDEPENDENT_SOURCE_CORROBORATED`:** 14 Chính Tinh offsets (`mingming3.com`, carried forward); Triệt table (`tracuutuvi.com`, Sprint 18A.3, + `vietdich.blogspot.com`, new this sprint — now 2 independent sources); Kim Tứ Cục day 24 (quotient/remainder formula, carried forward, pre-validated against 2 clean data points).
- **`DETERMINISTICALLY_CROSS_CHECKED`:** Mệnh/Thân's exact arithmetic — new this sprint, derived directly from VDTTL-1956's own prose and proven to satisfy the source's own stated "6 palaces only" invariant exactly (see item 17 below).

## 11. Rules single-authority only

Cục table (30/30 cells), 4 of 5 Tử Vi-anchor Cục blocks, Tuần table, Tứ Hóa table — all `PRIMARY_SOURCE_RECHECKED`, internally clean, no independent corroboration sought or found, explicitly disclosed as `SOURCE_SINGLE_AUTHORITY` rather than presented as equivalent to independently-corroborated evidence.

## 12. Rules conflicting

2, both re-confirmed (not newly discovered) this sprint: Kim Tứ Cục day-21/24 duplication/gap; Triệt's table vs. its own worked example (Canh Ngọ). Both now carry a disclosed `CONVENTION_LOCK_REQUIRED` decision rather than being left open.

## 13. Rules unresolved

2 genuine gaps (not conflicts — VDTTL-1956 is simply silent): leap-month Tử-Vi-specific treatment; civil/lunar day rollover for a 23:00–00:59 birth. Both also now carry a disclosed convention-lock proposal. 1 scope decision unresolved: the 13-star CORE_V1 auxiliary list is fully sourced but not founder-locked.

## 14. Kim Tứ result

`PRIMARY_SOURCE_PRINTING_ERROR_LIKELY` (carried forward), now backed by a third independent read confirming the anomaly is real and not a transcription artifact. Formally resolved to a disclosed `CONVENTION_LOCK`: day 24 → Mùi. Day 21 → Thìn is independently confirmed correct, not in dispute.

## 15. Triệt result

Same status trajectory. `PRIMARY_SOURCE_EXAMPLE_ERROR`-equivalent: the table is used (now corroborated by 2 independent sources), the book's own Canh-Ngọ worked example is not followed. Disclosed `CONVENTION_LOCK`, not silently corrected.

## 16. Giờ Tý result

Hour-branch labeling: fully resolved, undisputed. Day rollover: still genuinely absent from VDTTL-1956 (re-confirmed absent from pp.5–17); a midnight-rollover convention lock is proposed, explicitly flagged as inherited from the general calendar layer, not VDTTL-1956-specific.

## 17. Mệnh/Thân result

**The most significant new finding this sprint.** Exact mod-12 arithmetic re-derived directly from VDTTL-1956's own counting description (`Mệnh0=(R0−giờ0) mod 12`, `Thân0=(R0+giờ0) mod 12`), with no dependence on any secondary source. Proven self-consistent against the primary source's own explicit invariant ("Thân may only land on one of 6 palaces") — the formula produces a Thân−Mệnh offset of `2×giờ0 mod 12`, which takes on exactly 6 distinct values by construction, an exact structural match. Also discovered: Tý and Ngọ are the only two hour branches that always produce Mệnh=Thân coincidence, for any birth month. Prior secondary-source formula (mixed indexing) remains explicitly rejected; this sprint's fresh web search found further restatements of that same flawed lineage across multiple Vietnamese sites, none independent of each other.

## 18. Cục status

`IMPLEMENTATION_READY`, `SOURCE_SINGLE_AUTHORITY`, triple-confirmed, internally clean.

## 19. Tử Vi anchor status

`IMPLEMENTATION_READY` for 4 of 5 Cục blocks (`SOURCE_SINGLE_AUTHORITY`); Kim Tứ Cục `IMPLEMENTATION_READY` via disclosed convention lock (independent corroboration for the locked cell).

## 20. 14 Chính Tinh status

`IMPLEMENTATION_READY`, `INDEPENDENT_SOURCE_CORROBORATED` for offsets (both groups); direction-label question remains open but explicitly non-blocking (offsets encoded directly, per policy unchanged since Sprint 18A.4).

## 21. Tứ Hóa status

`IMPLEMENTATION_READY`, `SOURCE_SINGLE_AUTHORITY`, triple-confirmed 40/40 cells.

## 22. Auxiliary-star decision

All 13 proposed CORE_V1 stars remain sourced and clean (no star reclassified `DEFER_V1_1` or `REJECT` this sprint — no evidence found suggesting any of the 13 is unsuitable). The list itself is **not** founder-locked — this is the single remaining blocking item, a scope decision, not a sourcing gap.

## 23. Cross-school contamination result

None found. Every cross-school source consulted (`mingming3.com`, iztro) was used only to check numeric convergence with VDTTL-1956's own values, never to supply a value VDTTL-1956 doesn't state. No blending, no majority vote. Explicit audit in `source-corroboration-matrix.md`'s closing section.

## 24. Source-independence audit

Full matrix in `source-corroboration-matrix.md`. Notable finding: this sprint's fresh Mệnh/Thân web search surfaced several more sites repeating what is structurally the same formula/lineage already flagged `SAME_SOURCE`/`LIKELY_DERIVED` in Sprint 18A.3 (same internal indexing bug reproduced) — reinforces, does not weaken, the prior finding. New finding: a second, genuinely independent Triệt-table corroboration (`vietdich.blogspot.com`, citing a third distinct 1975 Vietnamese source).

## 25. Source-anchored (Class A) vector count

**0.** None exist; none fabricated. Unchanged from every prior sprint's honest finding — VDTTL-1956 itself has no complete worked chart (exhaustively confirmed, Sprint 18A.3), and no independent one was ever located.

## 26. Rule-derived (Class B) vector count

**6, fully computed by hand from the locked canonical rules**, arithmetic shown in full in `golden-vector-v2-spec.md`. Labeled `RULE_DERIVED_TEST_VECTOR` throughout, never presented as independent.

## 27. Vector coverage

All 5 Cục; 5 of 10 Can; 5 distinct hour branches including Tý; the Ngọ-hour Mệnh=Thân coincidence (new structural finding); both sides of the Kim Tứ Cục convention lock; the Triệt convention lock reproduced in the book's own disputed year; a naturally-occurring maximal-density wraparound case. Explicitly not covered and disclosed as such: remaining 5 Can, leap-month/Tết-boundary cases (would require the real calendar library, not fabricated), the sex-dependent Hỏa Tinh/Linh Tinh rule.

## 28. Revised 18B gate

`sprint-18b-revised-entry-gate.md` — per-rule minimum bar (8 conditions) plus a higher bar for 6 named high-risk rule groups (independent corroboration OR triple-read-single-authority + disclosed convention lock). Golden-vector requirement changed from ≥12 human-cross-checked to ≥6 Class-B-computed covering all 5 Cục and both sides of every convention lock (met).

## 29. Gate items PASS

13 of 14 rule groups meet the revised bar (see gate document §3): Calendar/Can-Chi/12-palace, Giờ (both halves, one via convention lock), Mệnh/Thân, Cục, Tử Vi anchor (both parts), 14 Chính Tinh, Tuần, Triệt (via convention lock), Tứ Hóa, Auxiliary V1 sourcing.

## 30. Gate items FAIL

**0 outright fails.** No rule was found genuinely unsalvageable.

## 31. Gate items requiring founder convention

1: the 13-star CORE_V1 auxiliary list lock (a scope decision, not evidence gap). The 4 domain convention locks (Kim Tứ Cục day 24, Triệt table-vs-example, day rollover, leap-month treatment) are engineering-proposed and disclosed in this sprint's documents, not left for the founder — they are ready to implement as stated unless the founder wants to override any of them.

## 32. Phased implementation recommendation

`sprint-18b-revised-entry-gate.md` §7 — 7-phase breakdown (18B.1 calendar skeleton → 18B.2 Mệnh/Thân/Cục/Tuần/Triệt/Tứ Hóa → 18B.3 Tử Vi/14-star → 18B.4 auxiliary [blocked on founder scope lock] → 18B.5 composition/persistence → 18B.6 regression suite → 18B.7 interpretation boundary, separate sprint). Recommendation only — not started.

## 33. Deterministic/AI boundary

Restated and made unconditional in `sprint-18b-revised-entry-gate.md` §6: no LLM star placement, no LLM table repair, no runtime rule inference, no reuse of Eastern Horoscope's element mapping as Cục, no silent school mixing, no AI-driven change to a computed result. Matches `calculation-specification.md` §7's existing, unchanged rule.

## 34. Security/privacy impact

None. No code, no data schema, no PII handling touched or designed this sprint.

## 35. Files created

`docs/domain/tu-vi/ai-only-verification-standard.md`, `canonical-ruleset-v1.md`, `source-corroboration-matrix.md`, `golden-vector-v2-spec.md`, `sprint-18b-revised-entry-gate.md`, `docs/progress/sprint-18a5-ai-verification-final-report.md` (this file). 6 new files.

## 36. Files modified

**0.** No prior file, including Sprint 18A.4's own output, was edited. `sprint-18b-entry-gate.md` (Sprint 18A.4) is superseded in practice by `sprint-18b-revised-entry-gate.md` but was not touched, per the "never erase history" discipline this project has followed since Sprint 18A.1.

## 37. Application-code files touched

**0.** Confirmed via `git diff --stat -- apps/ packages/ prisma/` returning empty, both at session start and at report time.

## 38. Commit status

**Not committed.**

## 39. Push status

**Not pushed.**

## 40. Deployment status

**Not deployed.**

## 41. Final verdict

**SPRINT 18A.5 COMPLETE — IMPLEMENTATION-READY WITH EXPLICIT CONVENTION LOCKS**

Outcome B from the governing task's menu, chosen on the actual evidence, not to force an unblock: 13 of 14 rule groups clear the revised implementation bar on their own merits (triple-independently-read, internally clean, several independently corroborated); the 2 real internal conflicts and 2 real evidentiary gaps each carry a specific, disclosed, evidence-backed convention lock rather than a guess; the one item that is not implementation-ready (the 13-star auxiliary scope) is a founder scope call, not a domain-evidence problem. This sprint did not choose B "merely to unblock" — outcome C (`DOMAIN_EVIDENCE_INCOMPLETE`) was seriously considered and rejected because the actual evidence, re-examined from first principles this sprint (especially the Mệnh/Thân re-derivation), turned out to be substantially stronger than Sprint 18A.4's framing suggested; outcome D (`PRIMARY_SOURCE_CONFLICT`) was rejected because the two real conflicts are narrow, precisely located, and each has a specific evidenced resolution rather than being pervasive or unresolvable.

## 42. Exact next action

1. **Founder:** lock the 13-star CORE_V1 auxiliary-star list (`v1-canonical-ruleset.md` §10's recommendation) — the only remaining blocking item.
2. **Founder or engineering lead:** review the 4 disclosed convention locks in `canonical-ruleset-v1.md` (`CONVENTION_DECISION` column) and either accept them as proposed or override with reasoning — do not let Sprint 18B implementation begin without this review having happened, even though the locks are technically ready to implement as-is.
3. Once both of the above are done, proceed to Sprint 18B per the phased breakdown in `sprint-18b-revised-entry-gate.md` §7, starting with 18B.1 (calendar skeleton — zero remaining domain risk).
4. Treat `golden-vector-v2-spec.md`'s 6 vectors as the first regression-test fixtures once code exists; close its disclosed coverage gaps (remaining Can, leap-month/Tết cases, Hỏa Tinh/Linh Tinh) as automated tests rather than more hand computation.
5. If a genuine human Tử Vi expert or a newly-discovered independent worked chart ever becomes available, add it as a Class A vector immediately — it remains the strongest possible evidence this domain can have, and its absence was never treated as equivalent to it not mattering.
