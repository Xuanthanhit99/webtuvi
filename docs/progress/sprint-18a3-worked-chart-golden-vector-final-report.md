# Sprint 18A.3 — Worked Chart Extraction + Conflict Resolution — Final Report

**Date:** 2026-08-20
**Type:** Domain research/documentation. Zero product code changed — confirmed via `git diff --stat -- apps/ packages/` returning empty.

## 1. Git baseline

**HEAD:** `0c54adb`. **origin/master:** `3bbd18c`. **Ahead/behind:** `2/0`, unchanged all session. **Working tree at start:** the files left by Sprint 18A.2 (5 addenda + 6 new docs), no drift.

## 2. Parts 2–3 accessibility

**Fully accessible, fully checked.** Downloaded `dv02.pdf` through `dv06.pdf` (Parts 2–3 in full, ~271 printed pages) plus their OCR full-text derivatives (~520KB combined). Visually sampled the opening pages of Part 2 and exhaustively pattern-searched the full OCR text of all 5 remaining parts.

## 3. Worked charts found

**Zero.** Confirmed by exhaustive search (multiple patterns: `sinh ngày`, `lá số của/ông/bà/mẫu/điển hình`, `tinh bàn`, `một lá số`, `xét lá số`, `coi lá số`), not partial exploration. The book's structure explains why: Part 2 ("Luận Đoán 12 Cung") is organized as ~200 pages of palace-by-palace and star-combination-by-combination interpretation guidance (the Cung Mệnh chapter alone spans printed pages 52–124), teaching entirely through short single-concept "thí dụ" fragments (e.g., "Kim Mệnh, Thủy Cục là tương sinh") — never a single continuous "here is a complete sample chart" illustration.

## 4–5. Full-vector / partial-vector candidates

**Zero of either.** No candidate chart of any completeness was found in VDTTL-1956 beyond the single-field fragments already catalogued in Part 1 (Mệnh/Thân/Cục/Tuần/Tứ Hóa worked examples, all already used as internal cross-checks in `vdttl-1956-extraction.md` and this sprint's conflict resolutions — none of these individually constitutes even a partial multi-field chart).

## 6. Valid independent vectors

**0.** Unchanged. No source meeting the `CROSS_CHECKED`/`EXPERT_CONFIRMED` bar was found or produced this sprint, and none was fabricated to fill the gate.

## 7–10. Coverage (5 Cục / leap month / year boundary / Giờ Tý)

**All at 0% populated**, unchanged — there is no vector to provide any of this coverage. The coverage matrix in `golden-vectors.md` remains a plan, not a populated dataset.

## 11. Mệnh/Thân verification

**Not achieved — a false-independence trap was caught instead.** The most relevant search result for a numeric worked example traced directly back to `SECONDARY-TVSG-MENH-THAN`, the exact secondary source already on file as the candidate formula's origin — re-fetching it confirmed identical authorship/content, not a second source. Per this task's own §14, this does not count. **0 of the required 3 independent worked-chart confirmations obtained.** One genuine, separate finding did emerge from this re-fetch: the source's own worked example uses inconsistent hour-indexing (Tý=1 for input, Dần=1 for output) not present in VDTTL-1956's own prose — flagged as a reason for caution about the exact arithmetic formula, independent of the verification-count question.

## 12. Kim Tứ conflict result

**`PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`.** An independently-sourced quotient/remainder placement formula — validated first against two already-clean VDTTL-1956 data points (Thủy Nhị Cục day 8→Tỵ, day 1→Sửu, both reproduced exactly) before being trusted — computes day 21→Thìn and day 24→Mùi for Kim Tứ Cục. This matches the printed Thìn cell exactly and identifies the printed Mùi cell ("14-21-27") as containing the error, which should read "14-24-27". Full derivation in `vdttl-1956-second-review.md` §5 (Sprint 18A.3 addendum).

## 13. Triệt conflict result

**`PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`.** An independent modern Vietnamese Tử Vi reference (`tracuutuvi.com`, directly fetched, no connection to VDTTL-1956 or any source already cited) states "Ất và Canh: an Triệt tại Ngọ và Mùi" — matching VDTTL-1956's table exactly and diverging from its own worked example. Table judged very likely correct; the printed worked example judged the likely error in this edition.

## 14. Giờ Tý day-boundary result

**Real evidentiary backing found, not from VDTTL-1956 itself.** The Vietnam Astronomical Society (`thienvanvietnam.org`, a legitimate calendrical-science source, not an astrology site) states the modern Vietnamese lunar calendar rolls over at 00:00, not 23:00 — the Tý hour-branch label stays continuous across 23:00–01:00, but the lunar day used for day-dependent calculations changes at midnight (Model B in `domain-resolution-pack.md` §2). Recommended as the working assumption in `v1-canonical-ruleset.md` §3, explicitly flagged as inherited from the general calendar convention rather than a VDTTL-1956-specific statement.

## 15. Star-group worked-chart verification

**Not performed — no worked chart exists to check against (see §3–5).** The direction/offset question was instead addressed via the adversarial cross-check already completed in Sprint 18A.2 (offsets converge with an external source; label question remains open but non-blocking, per the encode-offsets-directly recommendation in `v1-canonical-ruleset.md` §9).

## 16–18. Tứ Hóa / Tuần / Triệt chart verification

**Not performed — no worked chart exists.** Tứ Hóa and Tuần remain independently self-consistent (cross-checked against their own in-text worked examples, per Sprint 18A.2); Triệt's conflict is addressed in §13 above via a non-chart independent source.

## 19. Auxiliary-star vector coverage

**0%.** No vectors exist to provide this coverage for any of the 13 `CORE_V1` stars. Per instruction, the 13-star set is retained as `CORE_V1` unchanged (no source review this sprint suggested any of the 13 is unsuitable) — see `v1-canonical-ruleset.md` §10.

## 20. False-independence findings

One caught and excluded (§11 above — the Mệnh/Thân "worked example" is the same secondary source already on file, not independent). Two genuinely independent sources confirmed and used (§12's Cục-formula source; §13's Triệt-table source) — checked for shared authorship/citation chains before being trusted, none found.

## 21. Domain-expert questions remaining

Per this task's §15 format:

1. **"Under VDTTL-1956 V1, for Kim Tứ Cục, does lunar day 24 belong to palace Mùi (per an independently-validated quotient/remainder formula) or does the printed table's assignment of day 21 to both Thìn and Mùi reflect something the formula misses? A / B / other."** Exact page: p.8, Kim Tứ Cục block, cell "14-21-27" (row 1, col 3 in the printed layout).
2. **"Under VDTTL-1956 V1, for a Canh-year birth, is Triệt placed at Mùi-Ngọ (per the book's own table, corroborated by an independent modern reference) or Thân-Dậu (per the book's own worked example)? A / B / other."** Exact page: p.17, Triệt table + "Sinh năm Canh Ngọ" example.
3. **"Does VDTTL-1956's Vietnamese-tradition convention place the Tý-hour lunar-day rollover at midnight (matching the modern Vietnamese civil calendar), or does it use a different convention specific to Tử Vi Đẩu Số?"** No specific page — confirmed absent from Part 1 (pp.6, 24–26 checked).
4. **"Does VDTTL-1956's own Mệnh/Thân arithmetic use a single Dần=1 count for both month and hour (as the book's prose describes), or a mixed Tý=1/Dần=1 scheme (as a popular modern secondary source's worked example implies)?"** No VDTTL-1956 page found with a numeric worked example to check directly — this may require reading further into Part 1 or Parts 2–3 more closely, or is itself the expert question.

## 22. An Sao audit

Unchanged in method from Sprint 18A.2's re-evaluation. Two items' underlying evidence improved (Cục, Tuần/Triệt) but neither reaches `PASS` — `PASS` requires *no unresolved ambiguity*, and `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY` is a strong, evidenced recommendation, not a closed resolution. Items 5–7, 9–12 remain `SECOND_REVIEW_REQUIRED`/`GOLDEN_VECTOR_REQUIRED` as appropriate; item 14 (golden vectors) remains `GOLDEN_VECTOR_REQUIRED`, unimproved.

## 23. Readiness matrix

| Layer | Source | Review | Worked-chart evidence | Conflict | READY |
|---|---:|---:|---:|---:|---:|
| Calendar | ✅ | ✅ | — | ✅ | ✅ |
| Can Chi | ✅ | ✅ | — | ✅ | ✅ |
| Giờ Tý | ✅ (hour) | ✅ | Indirect (calendar-layer evidence) | Day-boundary not VDTTL-specific | ✗ |
| Mệnh | ✅ (structure) | ✅ | 0 independent | Numeric formula unverified | ✗ |
| Thân | ✅ (structure) | ✅ | 0 independent | Numeric formula unverified | ✗ |
| Cục | ✅ | ✅ 30/30 | Formula-corroborated (1 cell) | Likely-resolved, not confirmed | ✗ |
| 12 Cung | ✅ | ✅ | — | ✅ | ✅ |
| Tử Vi anchor | ✅ | ✅ | Formula-corroborated (1 cell) | Likely-resolved, not confirmed | ✗ |
| 14 Chính Tinh | ✅ | ✅ | Adversarial-offset-corroborated | ✅ (offsets) | ✗ (golden gate) |
| Auxiliary V1 | ✅ | ✅ | 0 | ✅ | ✗ (golden gate) |
| Tuần | ✅ | ✅ | Self-corroborated | ✅ | ✗ (golden gate) |
| Triệt | ✅ | ✅ | Independent-table-corroborated | Likely-resolved, not confirmed | ✗ |
| Tứ Hóa | ✅ | ✅ | Self-corroborated | ✅ | ✗ (golden gate) |
| Golden vectors | — | — | — | — | ✗ (0/12) |

**4 of 14 rows READY, unchanged.** The shape of the remaining 10 has sharpened further: 4 rows (14 Chính Tinh, Auxiliary V1, Tuần, Tứ Hóa) are now blocked *only* by the golden-vector gate. 4 rows (Cục, Tử Vi anchor, Triệt, and partially Giờ Tý) carry a well-evidenced likely resolution pending final confirmation. 2 rows (Mệnh, Thân) still lack independent numeric verification.

## 24. Stop conditions

School locked ✅. Star-group directions: offsets confirmed, encode-directly recommendation adopted ✅. Ambiguous cells: both now `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY` rather than fully `RESOLVED` — **not cleared** per this task's strict bar. Triệt: same, **not cleared**. Giờ Tý: hour-rule cleared, day-boundary has real but non-VDTTL-specific evidence — **not cleared**. Mệnh/Thân: **not cleared** (0/3 independent confirmations). Cục/anchor/14-star/Tứ Hóa/Tuần: reviewed ✅. Auxiliary V1: locked to the 13-star recommendation, not founder-confirmed this sprint. **≥12 golden vectors: not cleared (0/12)** — the dominant remaining blocker, unaffected by every other improvement.

## 25. Sprint 18B readiness

**Not ready.** Meaningfully closer — two of the three hardest domain-internal conflicts now have strong, independently-corroborated likely answers rather than open ambiguity — but the golden-vector gate is untouched and remains, by itself, sufficient to block Sprint 18B.

## 26–27. Files created / modified

**Created:** none new beyond updates to existing Sprint 18A.1/18A.2 documents, plus this report (`docs/progress/sprint-18a3-worked-chart-golden-vector-final-report.md`).
**Modified — addenda only, no history erased:** `docs/domain/tu-vi/domain-decision-register.md`, `v1-canonical-ruleset.md`, `vdttl-1956-second-review.md`, `golden-vectors.md`. Per instruction, no machine-readable vector-data file was created under §13 of the governing task, since **zero vectors exist to encode** — creating an empty schema file was judged to add no information beyond what `golden-vectors.md`'s existing coverage-matrix table already states, and was skipped rather than padded.

## 28. Product-code changes

**Zero.** Confirmed via `git diff --stat -- apps/ packages/` returning empty.

## 29. Git status

```
 M docs/domain/tu-vi/authoritative-sources.md
 M docs/domain/tu-vi/domain-decision-register.md
 M docs/domain/tu-vi/domain-resolution-pack.md
 M docs/domain/tu-vi/golden-vector-specification.md
 M docs/domain/tu-vi/star-placement-rules.md
?? docs/domain/tu-vi/golden-vectors.md
?? docs/domain/tu-vi/v1-canonical-ruleset.md
?? docs/domain/tu-vi/vdttl-1956-extraction.md
?? docs/domain/tu-vi/vdttl-1956-second-review.md
?? docs/progress/sprint-18a-domain-resolution-final-report.md
?? docs/progress/sprint-18a1-primary-source-extraction-final-report.md
?? docs/progress/sprint-18a2-second-review-final-report.md
?? docs/progress/sprint-18a3-worked-chart-golden-vector-final-report.md
```

## 30–32. Commit / push / deployment status

**Not committed. Not pushed. Not deployed.**

## 33. Final verdict

**SPRINT 18A.3 BLOCKED — GOLDEN VECTOR / DOMAIN CONFLICTS REMAIN — DO NOT IMPLEMENT SPRINT 18B**

This sprint closed the single most promising remaining research lead (VDTTL-1956 Parts 2–3, now confirmed exhaustively to contain no worked chart) and substantially de-risked two of the three hardest open conflicts (Kim Tứ Cục, Triệt) via genuine, validated, independent corroboration — while correctly catching and excluding a false-independence trap on Mệnh/Thân rather than letting it inflate confidence. None of this manufactures the one thing the gate actually requires: independently-attested complete worked charts. That gate is now the sole realistic blocker of its size, and this sprint's own search has good reason to believe no further unassisted document search will close it — the recommended path is a domain expert directly producing charts against the now-largely-complete `v1-canonical-ruleset.md`.

## 34. Recommended next action

1. **Engage a domain expert or practitioner** to produce and show their work on 12–15 charts spanning the coverage matrix — the only realistic remaining path, per §21's own conclusion that general search is exhausted.
2. **In parallel, hand the domain expert the 4-question expert pack in §21** — all four are now precisely bounded, page-cited, answer-format-specified questions, not open research.
3. **Founder:** confirm the 13-star `CORE_V1` auxiliary lock (no sourcing objection found this sprint).
4. **Do not begin Sprint 18B** until the golden-vector gate shows ≥12 `CROSS_CHECKED`/`EXPERT_CONFIRMED` vectors — every other gate is now either cleared or has a well-evidenced likely resolution, but none of that substitutes for this one.
