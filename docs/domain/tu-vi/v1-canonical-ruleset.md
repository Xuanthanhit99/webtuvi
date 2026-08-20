# Tử Vi V1 Canonical Ruleset — Sprint 18A.2

**School:** `TUVI_SCHOOL_V1 = VDTTL_1956` (Vân Đằng Thái Thứ Lang, *Tử Vi Đẩu Số Tân Biên*, 1956) — founder-locked this sprint.
**Status of this document:** a normalized restatement of `vdttl-1956-extraction.md`'s raw, page-cited findings, for direct reference by a future engine implementer. **This document does not replace or delete the raw extraction — every rule below links back to it.** This document is a convenience layer, not new evidence. No rule here has independent authority beyond what the raw extraction already established.
**Confidence floor for every rule below:** `SOURCE_EXTRACTED`, self/second-reviewed by the same reviewing system twice (see `vdttl-1956-second-review.md`). **Nothing in this document is `EXPERT_CONFIRMED`.**

---

## 1. Calendar integration

Reuse the existing, already-`RESOLVED_BY_SOURCE` Hồ Ngọc Đức algorithm (`DECISION-03B`) for solar↔lunar conversion, leap-month astronomy, and UTC+7 fixing — unchanged, not touched by this sprint. **Do not reuse Eastern Horoscope's `HEAVENLY_STEM_ELEMENT` mapping for anything Tử Vi-specific** (Cục uses a different, VDTTL-1956-specific table — see §6).

## 2. Can Chi

Standard sexagenary arithmetic, mechanically resolved once the calendar layer is trusted. Not independently re-derived this sprint (per `calculation-specification.md` §3, unchanged).

## 3. Giờ (hour)

**Rule (extraction TUVI-04):** 23:00–01:00 = Tý, undivided; then Sửu(1–3), Dần(3–5), Mão(5–7), Thìn(7–9), Tỵ(9–11), Ngọ(11–13), Mùi(13–15), Thân(15–17), Dậu(17–19), Tuất(19–21), Hợi(21–23).
**Day-boundary — Sprint 18A.3 update:** VDTTL-1956 itself still does not state this (confirmed absent from Part 1 by exhaustive search). New this sprint: an authoritative, non-astrology source — the Vietnam Astronomical Society (`thienvanvietnam.org`) — explains the **modern Vietnamese civil/lunar calendar convention**: the lunar day does not roll over at 23:00 (Sơ Tý), it rolls over at **00:00 (Chính Tý)**. Concretely: 23:00–00:00 belongs to the previous lunar day; 00:00–01:00 already belongs to the next lunar day — the Tý *hour-branch label* stays "Tý" throughout, but the *lunar day* used for day-dependent calculations (Cục, Tử Vi anchor) changes at midnight. This is Model B from `domain-resolution-pack.md` §2. **This is not a VDTTL-1956-specific statement** — it describes the general modern Vietnamese calendar convention, the same one the project's already-resolved `DECISION-03B` (Hồ Ngọc Đức algorithm) computes. Adopting it here is the most internally consistent choice available (same calendar layer, same convention, no new assumption introduced) but is a recommendation, not a primary-source-confirmed VDTTL-1956 rule. **Recommend: implement midnight rollover (Model B) as the working assumption, explicitly flagged as inherited-from-calendar-layer rather than Tử-Vi-specific, pending expert confirmation that VDTTL-1956 doesn't diverge from it.**

## 4. Mệnh

**Rule (extraction TUVI-05):** from Dần=lunar month 1, count forward (thuận) to the birth month → reference palace. From that reference, count backward (nghịch) to the birth-hour branch → Mệnh.
**Numeric formula (candidate) — Sprint 18A.3 finding, indexing inconsistency flagged:** the candidate formula `Mệnh = ((tháng − giờ) + 1) mod 12` was re-traced to its source this sprint (`SECONDARY-TVSG-MENH-THAN`, tuvisaigon.vn, directly re-fetched). **Its own worked example uses two different indexing bases in the same formula** — `giờ` (hour) is indexed via the *standard* Tý=1 Chi order (Thìn=5), while the *output* is read via Dần=1 order (position 3 = Thìn) — an internal asymmetry not present in VDTTL-1956's own prose, which describes one continuous Dần=1 counting process for both month and hour. **This is not new independent verification — this "worked example" traces to the exact same secondary source already on file, not a second source (a genuine false-independence trap, flagged per this task's §14).** No numeric cross-check against VDTTL-1956's own numbers exists. **The structural finding (forward-to-month, backward-to-hour) remains solid; the exact arithmetic mechanics do not.**

## 5. Thân

**Rule (extraction TUVI-06):** identical Step 1 to Mệnh. Step 2 — count forward (thuận), not backward, to the hour branch → Thân.
**Numeric formula (candidate):** `Thân = ((tháng + giờ) − 1) mod 12` — same indexing-inconsistency caveat as §4 above; same false-independence finding for its "worked example."
**Hard invariant (source-backed, not merely structural):** Thân may only resolve to one of exactly 6 palaces: Mệnh, Phúc Đức, Quan Lộc, Thiên Di, Tài Bạch, Thê Thiếp/Phu Quân. **Any other result is a defect, not a valid outcome** — implement as a hard assertion/test, not a soft warning.

## 6. Cục

**Input (corrected from the prior secondary-source hypothesis — extraction TUVI-07):** the birth year's Can (not month), plus the Mệnh palace's Chi. **Do not use a month-based Nạp Âm derivation** — that was a Sprint 15 secondary-source guess this primary text does not support.
**Table:** the complete 5×5 grouped table in `vdttl-1956-extraction.md` TUVI-07 (Mệnh-branch row-groups × Can-pair column-groups → one of Thủy Nhị/Mộc Tam/Kim Tứ/Thổ Ngũ/Hỏa Lục Cục). Cross-checked clean against an independent pre-existing worked example (Bính year, Mệnh Dậu → Hỏa Lục Cục).

## 7. 12 Cung

Fixed physical layout, 1(Tý) through 12(Hợi), per `vdttl-1956-extraction.md` TUVI-01. Not disputed anywhere in this project's research.

## 8. Tử Vi anchor

**Input:** Cục (§6) + lunar birth day (§3's open day-boundary question feeds this).
**Table:** the complete 5-Cục × ~30-lunar-day table in TUVI-08. **4 of 5 Cục blocks (Thủy Nhị, Mộc Tam, Thổ Ngũ, Hỏa Lục) are clean, internally self-consistent, ready to encode directly.**
**Kim Tứ Cục — Sprint 18A.3 update:** the day-21/24 ambiguity is now `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`, with the error located, not just flagged. An independently-sourced quotient/remainder placement formula (unrelated to VDTTL-1956, found via web search and validated against two already-clean VDTTL-1956 data points — Thủy Nhị Cục day 8→Tỵ and day 1→Sửu, both reproduced exactly) computes day 21→Thìn and day 24→Mùi for Kim Tứ Cục. This matches the Thìn cell as printed ("2-12-15-21") and identifies the Mùi cell's printed "21" (in "14-21-27") as the error — it should read "14-**24**-27". **Recommend encoding Kim Tứ Cục with this correction**, flagged in the table itself as `CORRECTED, PENDING EXPERT SIGN-OFF` rather than left blank — see `vdttl-1956-second-review.md` §5 (Sprint 18A.3 addendum) for the full derivation.

## 9. 14 Chính Tinh

**Tử Vi group (6 stars), all offsets forward from Tử Vi=0 (TUVI-09):** Tử Vi(0), Liêm Trinh(+4), Thiên Đồng(+7), Vũ Khúc(+8), Thái Dương(+9), Thiên Cơ(+11).
**Thiên Phủ group (8 stars), all offsets forward from Thiên Phủ=0 (TUVI-10):** Thiên Phủ(0), Thái Âm(+1), Tham Lang(+2), Cự Môn(+3), Thiên Tướng(+4), Thiên Lương(+5), Thất Sát(+6), Phá Quân(+10).
**Thiên Phủ's own anchor position** is fixed relative to Tử Vi's — see the mirror table in TUVI-11 (medium confidence, Dần–Thân axis, not independently re-verified at the same zoom level as the other tables this sprint).
**Implementation note (important, from the second review):** encode these as literal mod-12 offset tables, **do not** implement a "walk clockwise/counterclockwise from the anchor" procedural loop keyed to a "thuận = clockwise" flag — the second review found the primary source's direction *label* may not carry the same meaning as an external convention's "clockwise," even though the *offsets* converge with an external adversarial source once decoded numerically (see `vdttl-1956-second-review.md` §1). Encoding the offsets directly sidesteps this ambiguity entirely and is the safer implementation choice regardless of how the labeling question is eventually resolved.

## 10. Auxiliary stars — CORE_V1 (recommended, not founder-locked)

All 13, each with a complete rule in TUVI-12 through TUVI-24, recommended `CORE_V1` per `vdttl-1956-second-review.md` §11: **Tả Phù, Hữu Bật** (by lunar month, opposite starting points/directions); **Văn Xương, Văn Khúc** (by hour, opposite starting points/directions); **Thiên Khôi, Thiên Việt** (by year-Can, 10-cell table); **Lộc Tồn** (by year-Can, 10-cell table); **Kình Dương, Đà La** (Lộc Tồn ±1); **Địa Không, Địa Kiếp** (by hour, from Hợi); **Hỏa Tinh, Linh Tinh** (by year-Chi group + gender, table in TUVI-12 through 24).
**Everything else found this sprint (~40 more stars/series) is `DEFERRED`**, not because it lacks sourcing but because it exceeds original product scope — see the extraction document for the full list if this is revisited.

## 11. Tuần

**Table (TUVI-26):** 6 rows by 10-year Can-decade group, each spanning exactly 2 fixed palaces. Cross-checked clean against its own worked example. Ready to encode directly.

## 12. Triệt

**Table (TUVI-27):** 5 rows by Can-pair group, each spanning exactly 2 fixed palaces.
**Sprint 18A.3 update:** status improved from `DOMAIN_EXPERT_REQUIRED` to `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`. An independent modern Vietnamese Tử Vi reference (tracuutuvi.com, verified by direct fetch, not connected to VDTTL-1956 or any source already cited in this project) states the identical Can-pair grouping and identical palace pairs as VDTTL-1956's **table** (Ất/Canh → Ngọ-Mùi), diverging from VDTTL-1956's own **worked example** (Canh Ngọ → Thân-Dậu). This is real, if Level-C-tier, corroboration that the table is correct and the worked example contains the error in this edition. **Recommend implementing from the table**, flagged `CORROBORATED, PENDING PRIMARY-TEXT-LEVEL CONFIRMATION` — see `vdttl-1956-second-review.md` §6 (Sprint 18A.3 addendum).

## 13. Tứ Hóa

**Table (TUVI-25):** complete 10×4 table, cross-checked clean against its own worked example, confirmed twice. Ready to encode directly. **Note:** this table reflects VDTTL-1956 only — its alignment with the "Bắc Phái"/"Nam Phái" school distinction named in `authoritative-sources.md` is not established and is not needed, since the school question is now moot (VDTTL-1956 is locked as V1 regardless of which broader lineage its Tứ Hóa table happens to align with).

---

## What blocks Sprint 18B, precisely

Two hard, source-internal blocks (Kim Tứ Cục's ambiguous cell, §8; Triệt's table/example conflict, §12), one open input question (Giờ Tý day-boundary, §3), the numeric Mệnh/Thân formula's not-yet-found worked-example cross-check (§4/§5), and — independent of all of the above — the golden-vector gate (see `golden-vectors.md`), which alone is sufficient to keep Sprint 18B blocked regardless of how the others resolve. Every other layer in this document (Calendar, Can Chi, 12 Cung, both 14-chính-tinh groups' offsets, Tứ Hóa, Tuần, 4 of 5 Cục Cục blocks, 4 of 5 Tử Vi anchor blocks) is in a genuinely strong, encode-ready state, pending only true independent second review.
