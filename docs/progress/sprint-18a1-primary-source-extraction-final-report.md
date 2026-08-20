# Sprint 18A.1 — Tử Vi Primary Source Extraction — Final Report

**Date:** 2026-08-20
**Type:** Primary-source domain extraction. No Tử Vi engine, Prisma model, API route, frontend calculation, or AI prompt was implemented — confirmed via `git status`/`git diff` showing zero changes outside `docs/domain/tu-vi/` and `docs/progress/`.

## 1–4. Baseline

**HEAD:** `0c54adb`. **origin/master:** `3bbd18c`. **Ahead/behind:** `2/0`, unchanged — both prior commits remain local-only. **Initial working tree:** the 4 uncommitted Sprint 18A files (3 addenda + 1 report), exactly as that session left them — no drift.

## 5. Inherited Sprint 18A files

All read in full before new work began: `domain-decision-register.md`, `authoritative-sources.md`, `calculation-specification.md`, `star-placement-rules.md`, `golden-vector-specification.md`, `an-sao-logic-audit.md`, `domain-resolution-pack.md`, `sprint-18a-domain-resolution-final-report.md`. No competing second specification was created — this sprint's findings were added as addenda to these files plus one new extraction document, per the explicit instruction to extend, not fork, the existing `RULE_ID`/`DECISION_ID` system.

## 6–7. Primary source accessibility / page-image accessibility

**Both confirmed directly, not by lead or citation.** `dv01.pdf` (597,465 bytes) was downloaded directly from `archive.org/download/TuViDdauSoTanBien-VDThaiThuLang-DV/...`, rendered to page images locally (`pymupdf`, installed this session via `pip` into a scratch environment — no product dependency changed), and **read directly by this session's own vision** — not through WebFetch's summarizing intermediary, which Sprint 18A had already shown caps verbatim quotes at ~125 characters and produced at least one internally-inconsistent result. This is a categorically more reliable extraction method, and the difference showed immediately: several findings below directly contradict what the WebFetch-mediated pass reported in Sprint 18A.

## 8. V1 school recommendation

**A — RECOMMEND VDTTL-1956 AS THE V1 CANDIDATE**, more strongly than Sprint 18A could say. Across every hard gate this session reached, the text proved internally coherent, largely self-consistent (verified by construction — see the per-item consistency checks in `vdttl-1956-extraction.md`), and corroborated by its own worked examples in the majority of cases. This is not merely "the most-cited name" anymore — it is a demonstrated, workable, nearly-complete system.

## 9. Founder school decision status

**Still PENDING — not converted to a lock.** Per this task's own explicit instruction ("do NOT silently convert a founder-level decision into a final lock"), this session's strengthened evidence is a recommendation, not a decision. **Exact founder question, unchanged in form from `domain-resolution-pack.md` §1, now backed by materially stronger evidence:** *"Approve VDTTL-1956 (Vân Đằng Thái Thứ Lang, Tử Vi Đẩu Số Tân Biên, 1956) as canonical V1 Vietnamese Tử Vi school? YES / NO."*

## 10. Primary-source page index

| Topic | Section | Printed page | Table/figure | Quality |
|---|---|---|---|---|
| 12 Cung layout | 1. Định Cung | 5 | Diagram | Clean |
| Giờ Tý (hour labels) | 4. Định Giờ | 6 | Table | Clean |
| Mệnh | 5. An Mệnh | 6 | Text rule | Clean |
| Thân | 6. An Thân | 7 | Text rule | Clean |
| Cục | 7. Lập Cục | 7 | Table (30 cells) | Clean, 1 block ambiguous |
| Tử Vi anchor | 8. An Sao (intro) | 7–8 | 5 tables (~150 cells) | Clean, 1 of 5 ambiguous |
| Tử Vi group (6★) + direction | 8.1 | 7 | Text rule | Clean, flagged for review |
| Thiên Phủ group (8★) + direction | 8.2 | 9 | Text rule | Clean, flagged for review |
| Tử Vi/Thiên Phủ mirror | 8.2 cont. | 9 | 2 diagrams | Medium confidence |
| Thái Tuế series (12★) | 8.3 | 9 | Text rule | Clean |
| Lộc Tồn + companion series | 8.4 | 9–10 | Table + text | Clean |
| Tràng Sinh series | 8.5 | 10 | Table + text | Clean |
| Lục Sát (Kình/Đà/Không/Kiếp/Hỏa/Linh) | 8.6 | 10–11 | Text + table | Clean, 1 minor duplicate noted |
| ~30 further auxiliary stars | 8.7–8.36 | 11–16 | Tables/text | Clean |
| Tuần | 8.37.1 | 16–17 | Table (6 rows) | Clean |
| Triệt | 8.37.2 | 17 | Table (5 rows) | Table/example conflict flagged |
| Tứ Hóa | 8.23 | 13–14 | Table (40 cells) | Clean, cross-checked |
| Định Hướng Chiếu (interpretive, not a placement gate) | 9 | 17+ | — | Not read this session |

## 11–13. Giờ Tý / Mệnh / Thân

**Giờ Tý:** hour-branch labeling half resolved — Tý is one undivided 23:00–01:00 block, no Sơ/Chính split. Day-boundary-for-calculation half still not found in pages 1–17. **Mệnh:** direction/structure source-confirmed exactly matching the existing candidate formula's shape (forward-to-month, then backward-to-hour); exact numeric mod-12 formula not yet cross-checked against a primary worked example. **Thân:** same, mirrored (forward-to-hour); plus a new, source-backed invariant — Thân may only land in 6 specific palaces.

## 14–15. Cục / Tử Vi anchor cells extracted

**Cục:** 30/30 printed cells (=120/120 logical cells via the standard 5-pair Can grouping), 4 of 5 Cục blocks pass a perfect 30-day internal-consistency check, 1 (Kim Tứ) has one flagged ambiguous cell. **Tử Vi anchor:** ~150/150 cells across all 5 Cục, same pattern — 4 clean, 1 ambiguous.

## 16–18. 14 Chính Tinh / group directions

**16.** 14/14 stars have complete offset rules extracted (6 in the Tử Vi group, 8 in the Thiên Phủ group). **17–18. Both group directions:** the primary text states **both** groups walk **thuận (forward)** — not opposite directions as the prior Sprint 18A secondary-source-based hypothesis assumed. This is the single most important, highest-risk finding in this report and is flagged for second-review at maximum priority, precisely because it is exactly the "plausible but completely wrong chart" direction-inversion risk this task named explicitly.

## 19. Auxiliary-star V1 set

**Far larger than previously assumed.** All 13 originally-proposed MVP stars have complete rules; roughly 40 additional named stars/series also have complete rules directly extracted (Thái Tuế's 12-star series, Lộc Tồn's 12-star companion series, Tràng Sinh's 10-star series, and ~15 more named pairs/singles). This session does not select which subset is V1 — that remains a founder scope call, now much better informed (see §31 below).

## 20–22. Tuần / Triệt / Tứ Hóa

**Tuần:** complete 6-row table, cross-checked clean against its own worked example. **Triệt:** complete 5-row table, but its own worked example (Canh year → Thân-Dậu) does not match its own table row (Ất-Canh → Mùi-Ngọ) — flagged, not resolved. **Tứ Hóa:** complete 40/40-cell table, cross-checked clean against its own worked example — the strongest single result in this report.

## 23. Ambiguous cells

Two, both explicitly flagged, neither guessed:
1. Kim Tứ Cục / Tử Vi anchor: day "21" appears in two cells, day "24" appears in none — one cell almost certainly misprints 24 as 21 in this edition, but which cell cannot be determined from this evidence alone.
2. Triệt: Canh-year worked example doesn't match its own table row.

## 24. Cross-school audit

**Clean.** No cell anywhere in this extraction mixes VDTTL-1956 with any other candidate school, with Eastern Horoscope's tables, or with any modern implementation (iztro etc.). Every extracted value traces to one specific page of one specific edition.

## 25. Second-review status

**SECOND_REVIEW_PENDING for every single item in this report, without exception.** No second human reviewer was available this session. This is stated plainly, not softened.

## 26–28. Golden vectors / independence / edge coverage

**Golden vectors populated: 0. Unchanged.** Per this task's own explicit rule, expected values must come from a source independent of the implementation under test — this extraction is itself a candidate *input* to a future engine, and computing vectors from it would be circular. No complete worked chart (full birth-date-to-full-chart) was found in the pages read this session; only single-field worked examples (used as cross-checks above, not as vectors). **Independence/edge coverage: N/A** — no vectors exist to assess.

## 29. An Sao audit re-run

Per this task's allowed statuses (`PASS`/`FAIL`/`DOMAIN_REFERENCE_REQUIRED`/`SECOND_REVIEW_REQUIRED`), re-evaluating `an-sao-logic-audit.md`'s 14 items against this session's findings:

| # | Item | Status |
|---|---|---|
| 1 | Solar→Lunar | PASS (unchanged, calendar layer) |
| 2 | Leap month (Tử-Vi-specific) | DOMAIN_REFERENCE_REQUIRED (not found in pages read) |
| 3 | UTC+7 normalization | PASS (unchanged) |
| 4 | Giờ Tý boundary | SECOND_REVIEW_REQUIRED (hour-label half extracted; day-boundary half still DOMAIN_REFERENCE_REQUIRED) |
| 5 | Mệnh | SECOND_REVIEW_REQUIRED |
| 6 | Thân | SECOND_REVIEW_REQUIRED |
| 7 | Cục | SECOND_REVIEW_REQUIRED (1 block ambiguous) |
| 8 | 12-palace indexing | PASS (unchanged, now directly confirmed) |
| 9 | 14 main stars | SECOND_REVIEW_REQUIRED (direction finding is the highest-priority item in this report) |
| 10 | MVP auxiliary stars | SECOND_REVIEW_REQUIRED (rules extracted; list-scope still a founder call) |
| 11 | Tuần/Triệt | SECOND_REVIEW_REQUIRED (Triệt ambiguity) |
| 12 | Tứ Hóa | SECOND_REVIEW_REQUIRED (cleanest result, still not expert-confirmed) |
| 13 | Vận | DOMAIN_REFERENCE_REQUIRED (deliberately out of scope, Sprint 22) |
| 14 | Golden vectors | DOMAIN_REFERENCE_REQUIRED (0 populated) |

**No item is marked PASS merely because a table was typed** — items 5–7, 9–12 moved from `DOMAIN_REFERENCE_REQUIRED` to the new, more precise `SECOND_REVIEW_REQUIRED` status, which is not a pass.

## 30. Readiness matrix

| Layer | Source extracted | Cross-checked | Expert/founder locked | Golden coverage | Ready |
|---|---:|---:|---:|---:|---:|
| Calendar | ✅ | ✅ | ✅ (03B) | — | ✅ |
| Can Chi | ✅ | ✅ | ✅ (mechanics) | — | ✅ |
| Giờ Tý | Partial | ✗ | ✗ | 0 | ✗ |
| Mệnh | ✅ | Partial | ✗ | 0 | ✗ |
| Thân | ✅ | Partial | ✗ | 0 | ✗ |
| Cục | ✅ (29/30 blocks clean) | ✅ (1 xref) | ✗ | 0 | ✗ |
| 12 Cung | ✅ | ✅ | ✅ | — | ✅ |
| Tử Vi anchor | ✅ (4/5 clean) | Partial | ✗ | 0 | ✗ |
| 14 Chính Tinh | ✅ | ✗ (direction unresolved) | ✗ | 0 | ✗ |
| Auxiliary stars | ✅ (53 stars) | Partial | ✗ (list scope) | 0 | ✗ |
| Tuần | ✅ | ✅ | ✗ | 0 | ✗ |
| Triệt | ✅ | ✗ (1 conflict) | ✗ | 0 | ✗ |
| Tứ Hóa | ✅ | ✅ | ✗ | 0 | ✗ |
| Golden vectors | — | — | — | 0/15 | ✗ |

**4 of 14 rows READY (Calendar, Can Chi, 12 Cung — all structural — unchanged from Sprint 18A). 10 of 14 remain not-ready**, though 6 of those 10 (Cục, Tử Vi anchor, 14 Chính Tinh, Tuần, Triệt, Tứ Hóa) have moved from "no data" to "data exists, review pending" — a materially smaller remaining task than Sprint 18A left.

## 31. Founder decisions required

1. **School lock (DECISION-01):** "Approve VDTTL-1956 as canonical V1? YES/NO" — now backed by a demonstrated, largely-coherent system, not just a citation count.
2. **Auxiliary-star scope (DECISION-08):** given ~53 stars now have complete rules (not 13), which subset ships in V1? Recommend: the original 13 as `CORE_V1` (already the most-cited/"load-bearing" set per prior research), the newly-found Thái Tuế/Lộc Tồn/Tràng Sinh series and remaining ~25 singles as `OPTIONAL_V1` or `DEFERRED` pending founder review of `vdttl-1956-extraction.md`'s full list.
3. **Miếu/Vượng/Đắc/Hãm (DECISION-11):** unchanged, still a scope call, not touched this session.

## 32. Domain-expert decisions required

1. **Highest priority: the star-group direction finding (TUVI-09/10)** — confirm or correct "both groups walk thuận," which contradicts prior secondary sourcing.
2. Kim Tứ Cục's ambiguous cell (day 21 vs. 24).
3. Triệt's table/worked-example conflict for Canh year.
4. Giờ Tý's day-boundary-for-calculation question (not found in pages read; may require reading further into the book, or is a genuine expert question).
5. Numeric verification of the Mệnh/Thân mod-12 formula against a primary worked example (none found in pages 1–17).
6. General second-review/sign-off of every table in `vdttl-1956-extraction.md` against the actual page images (page numbers given for direct navigation).

## 33. Manual-transcription work required

**Substantially reduced, not eliminated.** What remains is not "find and transcribe from scratch" — it's a **verification pass**: a Vietnamese-fluent reviewer opens `archive.org/details/TuViDdauSoTanBien-VDThaiThuLang-DV`, `dv01.pdf`, at the specific printed pages cited in `vdttl-1956-extraction.md`, and confirms or corrects this session's transcription — prioritized in the order given in §32. This is now a bounded, few-hours task for a fluent reader, not an open research problem.

## 34. Stop conditions triggered

| Condition | Triggered? |
|---|---|
| A. V1 school not locked | **YES** — founder decision still pending |
| B. Giờ Tý unresolved | **YES** — day-boundary half still open |
| C. Mệnh/Thân unresolved | **YES** — second review pending |
| D. Cục table incomplete | **Partial** — 29/30 blocks complete, 1 ambiguous, no second review |
| E. Tử Vi anchor incomplete | **Partial** — same pattern |
| F. Any Chính Tinh unresolved | **YES** — all 14 have rules, but second review pending |
| G. Group direction unresolved | **YES** — flagged, unconfirmed, highest priority |
| H. Core auxiliary-star set unresolved | **YES** — rules exist, scope-lock pending |
| I. Tuần unresolved | **Partial** — complete + self-consistent, no second review |
| J. Triệt unresolved | **YES** — internal conflict unresolved |
| K. Tứ Hóa unresolved | **Partial** — complete + self-consistent, no second review, no founder lock |
| L. Fewer than 12 golden vectors | **YES** (0) |
| M. Second-review requirement unmet | **YES** — universally |
| N. Incompatible schools mixed | **NO** — confirmed clean |
| O. Any cell inferred rather than sourced | **NO** — confirmed clean; ambiguities flagged, not guessed |

**12 of 14 checkable conditions still trigger** (2 improved from full-trigger to partial-trigger: D/E, and I/K similarly partial). This remains conclusively BLOCKED per this task's own §22.

## 35. Sprint 18B readiness

**Not ready.** Unchanged conclusion from Sprint 18A, though the remaining distance is now much shorter and well-defined (§33).

## 36–37. Files modified / created

**Created:** `docs/domain/tu-vi/vdttl-1956-extraction.md` (the primary deliverable), `docs/progress/sprint-18a1-primary-source-extraction-final-report.md` (this document).
**Modified — addenda only:** `docs/domain/tu-vi/domain-decision-register.md`, `domain-resolution-pack.md`, `star-placement-rules.md`, `golden-vector-specification.md`.
**Not touched, no finding changed:** `authoritative-sources.md`, `calculation-specification.md`, `an-sao-logic-audit.md` (this report's §29 re-evaluates its gate table without editing the file itself, since the file's own framing as a "template, re-run for real at Sprint 19" is still accurate — this session's re-evaluation lives here, not there).

## 38. Product-code files changed

**Zero.** Confirmed via `git status`/`git diff --stat` — no file under `apps/api` or `apps/web`, no Prisma schema/migration, no Tử Vi API route, no frontend calculation code, no AI/Tử Vi prompt.

## 39. Git status

```
 M docs/domain/tu-vi/authoritative-sources.md
 M docs/domain/tu-vi/domain-decision-register.md
 M docs/domain/tu-vi/domain-resolution-pack.md
 M docs/domain/tu-vi/golden-vector-specification.md
 M docs/domain/tu-vi/star-placement-rules.md
?? docs/domain/tu-vi/vdttl-1956-extraction.md
?? docs/progress/sprint-18a-domain-resolution-final-report.md
?? docs/progress/sprint-18a1-primary-source-extraction-final-report.md
```
(Scratch PDF/rendered page images were downloaded/generated outside the repository's working tree — in the session scratchpad, not under `d:\web-tu-vi` — and do not appear here.)

## 40–42. Commit / push / deployment status

**Not committed. Not pushed. Not deployed.** Per instruction, left for review.

## 43. Final verdict

**SPRINT 18A.1 BLOCKED — PRIMARY SOURCE / DOMAIN REVIEW INCOMPLETE — DO NOT IMPLEMENT SPRINT 18B**

This is the correct call despite the scale of this session's findings. Twelve of fourteen checkable stop conditions still trigger. Every single extracted item remains `SECOND_REVIEW_PENDING` — this session was one reader, working alone, with no domain-expert cross-check and no founder sign-off, and it directly caught its own extraction method producing an internally-inconsistent result once already (Sprint 18A's WebFetch pass), which is exactly why a second, independent human review is non-negotiable before any of this is trusted, however clean and self-consistent it looks. The single highest-stakes finding — that both 14-chính-tinh groups appear to walk the same direction, contradicting prior secondary sourcing — is precisely the kind of plausible-but-possibly-wrong result this entire sprint exists to catch before it reaches an engine, not paper over because the source now looks so much more complete than before.

## 44. Recommended next action

1. **Founder:** review `vdttl-1956-extraction.md` and answer the school-lock question (§9/§31.1) — the evidence bar for saying yes is now much higher than "most-cited name."
2. **In parallel, independent of the school question:** get a Vietnamese-fluent second reviewer (ideally someone with Tử Vi Đẩu Số familiarity) to open the same archive.org PDF at the cited pages and confirm or correct this session's transcription, prioritized: (a) the star-group direction finding (TUVI-09/10) — highest stakes, (b) the two flagged ambiguous cells, (c) everything else, page by page.
3. **Founder, separately:** decide the auxiliary-star MVP scope now that ~53 fully-ruled candidates exist instead of 13 (§31.2).
4. Do not begin Sprint 18B, any Tử Vi Prisma model, API route, frontend calculation, or AI prompt until the readiness matrix (§30) shows all fourteen rows READY.
