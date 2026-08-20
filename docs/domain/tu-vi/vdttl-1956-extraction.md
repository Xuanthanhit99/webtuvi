# VDTTL-1956 Primary-Source Extraction — Sprint 18A.1

**Source:** *Tử Vi Đẩu Số Tân Biên*, Vân Đằng Thái Thứ Lang, 1956, Saigon (Giấy phép số 722 TXB, Nha T.T.N.Đ., ngày 13-5-57; publisher: Tín Đức Thư Xã, 25-27 Đường Tạ-thu-Thâu, Saigon).
**Copy used:** `archive.org/details/TuViDdauSoTanBien-VDThaiThuLang-DV`, file `dv01.pdf` (Part 1 — "Lập Thành," 30 scan pages, printed pages 1–~24 plus front matter). Downloaded directly (`curl`, HTTP 200, 597,465 bytes) and rendered to page images locally (`pymupdf`, 2.5×–5.0× scale) — **read directly by this session's own (multimodal) vision, not through any AI-summarizing intermediary.** This is a materially different, more reliable extraction method than the WebFetch-mediated summaries used in Sprint 18A, which this document supersedes for every item covered below.

**What this document is:** a page-cited, directly-transcribed record of every deterministic rule/table found in Part 1 of this specific edition. **What this document is not:** a resolution of DECISION-01 (school selection) or a substitute for second-reviewer/expert confirmation. Every item below is `SOURCE_EXTRACTED` — directly transcribed, self-consistency-checked where possible — never `EXPERT_CONFIRMED`. No cell was inferred, interpolated, or filled from this session's own background knowledge of Zi Wei Dou Shu; where background knowledge was used at all, it is explicitly labeled as a plausibility check only, never as a substitute for what the page shows.

**Print vs. scan pages:** citations below use this edition's own printed page numbers (visible at the bottom of each page, e.g. "-6-"), which is what a second reviewer opening the same archive.org PDF should navigate to.

---

## Extraction protocol used

```
RULE_ID: TUVI-{topic}
SOURCE_ID: VDTTL-1956
BOOK: Tử Vi Đẩu Số Tân Biên
AUTHOR: Vân Đằng Thái Thứ Lang
EDITION: 1956, Saigon (Tín Đức Thư Xã) — archive.org scan/reprint, dv01.pdf
PRINTED_PAGE: (as shown at page bottom)
SECTION: (book's own numbered heading, e.g. "5. AN MỆNH")
ORIGINAL_TEXT: (transcribed, Vietnamese, as printed)
NORMALIZED_RULE: (restated in engine-shape terms)
TRANSCRIBER: Claude (Sonnet 5), this session, direct visual read of rendered page image
SECOND_REVIEW_STATUS: SECOND_REVIEW_PENDING (for every item — no second reviewer was available this session)
NOTES: (self-consistency checks performed, ambiguities, corrections to prior hypotheses)
```

---

## TUVI-01 — 12 Cung layout

**PRINTED_PAGE:** 5. **SECTION:** "1. ĐỊNH CUNG."
**ORIGINAL_TEXT:** A 12-cell chart, physical layout: top row Tỵ(6)-Ngọ(7)-Mùi(8)-Thân(9); right side descending Dậu(10)-Tuất(11); bottom row (right to left) Hợi(12)-Tý(1)-Sửu(2)-Dần(3); left side ascending Mão(4)-Thìn(5); center 2×2 merged into the "Thiên Bàn" info box (Họ tên / Năm tháng ngày giờ sinh / Tuổi âm dương / Bản Mệnh, cục). "Mỗi ô là một cung. Bắt đầu từ một là cung thứ nhất, gọi là cung Tý, đếm theo chiều thuận (thuận chiều kim đồng hồ)..."
**NORMALIZED_RULE:** 12 palaces, numbered 1(Tý)–12(Hợi), fixed physical positions, canonical reading direction is clockwise ("thuận").
**STATUS:** SOURCE_EXTRACTED. Matches the already-`PASS`-classified structural assumption in `an-sao-logic-audit.md` item 8 — now directly confirmed, not merely "no source disputes it."

## TUVI-02 — Bản Mệnh (Nạp Âm) table

**PRINTED_PAGE:** 5–6. **SECTION:** "2. TÌM BẢN MỆNH."
**ORIGINAL_TEXT:** Complete 60-entry table, 5 columns (Kim/Mộc/Thủy/Hỏa/Thổ Mệnh) × 12 Can-Chi pairs each, e.g. Kim Mệnh: Giáp Tý, Ất Sửu, Nhâm Thân, Quý Dậu, Canh Thìn, Tân Tỵ, Giáp Ngọ, Ất Mùi, Nhâm Dần, Quý Mão, Canh Tuất, Tân Hợi (and 4 more full columns, directly transcribed, not reproduced again here — see `calculation-specification.md` §4's Nạp Âm placeholder, now fillable from this page).
**NORMALIZED_RULE:** the classical 60-term Nạp Âm table, keyed by the person's own birth-year Can-Chi pair (**not** by month, and **not** the same thing as "Cục" — see TUVI-04's correction below).
**STATUS:** SOURCE_EXTRACTED, full 60/60 cells read. Self-consistency: all 60 Can-Chi pairs of the sexagenary cycle appear exactly once across the 5 columns (verified by count, 12×5=60).

## TUVI-03 — Âm Dương (Yin/Yang) tables

**PRINTED_PAGE:** 6. **SECTION:** "3. PHÂN ÂM DƯƠNG."
**ORIGINAL_TEXT:** By Can: Dương={Giáp,Bính,Mậu,Canh,Nhâm}, Âm={Ất,Đinh,Kỷ,Tân,Quý}. By Chi: Dương={Tý,Dần,Thìn,Ngọ,Thân,Tuất}, Âm={Sửu,Mão,Tỵ,Mùi,Dậu,Hợi}.
**STATUS:** SOURCE_EXTRACTED. Standard, matches `calculation-specification.md` §4's existing non-disputed assumption.

## TUVI-04 — Định Giờ (hour table) — DECISION-02 evidence

**PRINTED_PAGE:** 6. **SECTION:** "4. ĐỊNH GIỜ."
**ORIGINAL_TEXT:** Table: 23 giờ-1 giờ→Tý; 1-3→Sửu; 3-5→Dần; 5-7→Mão; 7-9→Thìn; 9-11→Tỵ; 11-13→Ngọ; 13-15→Mùi; 15-17→Thân; 17-19→Dậu; 19-21→Tuất; 21-23→Hợi.
**NORMALIZED_RULE:** the Tý hour-branch is treated as a **single, undivided 23:00–01:00 window** — no "Giờ Tý Sơ"/"Giờ Tý Chính" split is present anywhere in this table or its surrounding text.
**IMPORTANT SCOPE LIMIT — what this does and does not resolve:** this table resolves *which hour-branch label* applies to a clock time. It does **not**, by itself, state which *civil/lunar day* a 23:00–00:59 birth is assigned to for day-dependent calculations (day Can Chi; the Tử Vi anchor's lunar-day input, TUVI-06). Nothing found on pages 5–17 explicitly addresses that separate sub-question — it may be addressed elsewhere in Part 1 (pages 24–31, "Lý Giải Ngũ Hành, Can, Chi," not read this session) or may be assumed standard (midnight rollover) without explicit statement. **DECISION-02 is therefore partially, not fully, closed by this finding** — the hour-branch-labeling half is now source-extracted; the day-boundary-for-calculation half remains open.
**STATUS:** SOURCE_EXTRACTED (hour-labeling half only).

## TUVI-05 — An Mệnh (Mệnh placement)

**PRINTED_PAGE:** 6. **SECTION:** "5. AN MỆNH."
**ORIGINAL_TEXT (verbatim):** "Bắt đầu từ cung Dần là tháng Giêng, đếm theo chiều thuận đến tháng sinh, ngừng tại cung nào gọi là giờ Tý, đếm theo chiều nghịch đến giờ sinh, ngừng tại cung nào an Mệnh Viên ở cung đó."
**NORMALIZED_RULE:** Step 1 — from Dần=month 1, count **forward (thuận)** to the birth month; call the palace reached "the Tý reference." Step 2 — from that reference, count **backward (nghịch)** to the birth-hour branch; place Mệnh there.
**Also on this page:** the remaining 11 palace names in forward order from Mệnh: Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Thê Thiếp (or Phu Quân for a female chart), Huynh Đệ.
**STATUS:** SOURCE_EXTRACTED. Direction structure now directly confirmed from the primary text — materially stronger than the prior "two secondary sources agree" evidence for DECISION-04. Exact numeric formula (`domain-resolution-pack.md` §3's candidate `Mệnh = ((tháng − giờ) + 1) mod 12`) still needs explicit worked-number verification against this text's own examples (none seen yet in pages 5–17; may appear in Part 2).

## TUVI-06 — An Thân (Thân placement)

**PRINTED_PAGE:** 7. **SECTION:** "6. AN THÂN."
**ORIGINAL_TEXT (verbatim):** "Bắt đầu từ cung Dần là tháng Giêng, đếm theo chiều thuận đến tháng sinh, ngừng tại cung nào gọi là giờ Tý, đếm theo chiều thuận đến giờ sinh ngừng tại cung nào an Thân ở cung đó." Also: "Thân chỉ có thể an vào Mệnh Viên, Phúc Đức, Quan Lộc, Thiên Di, Tài Bạch, Thê Thiếp. Nếu khi an Thân thấy Thân lạc vào những cung khác các cung kể trên, như vậy là đã nhầm lẫn, cần phải soát lại ngay."
**NORMALIZED_RULE:** identical Step 1 to Mệnh (forward to month). Step 2 — count **forward (thuận)**, not backward, to the hour branch; place Thân there. **New structural invariant, not previously in any project document:** Thân may only legitimately land in one of exactly 6 palaces (Mệnh, Phúc Đức, Quan Lộc, Thiên Di, Tài Bạch, Thê Thiếp/Phu Quân) — any other result indicates a calculation error. This is a genuine, source-backed engine-validation invariant, additive to `golden-vector-specification.md`'s existing invariant list.
**STATUS:** SOURCE_EXTRACTED. Mirror relationship to Mệnh (forward/backward split on the hour-count step only) is now directly confirmed, not merely corroborated.

## TUVI-07 — Lập Cục (Cục determination) — HARD GATE, now fully extracted

**PRINTED_PAGE:** 7. **SECTION:** "7. LẬP CỤC."
**ORIGINAL_TEXT (verbatim, method statement):** "Trước khi an Tử Vi tinh hệ, cần phải căn cứ và Can của tuổi và cung an Mệnh để lập Cục."
**CORRECTION TO PRIOR HYPOTHESIS:** `domain-resolution-pack.md` §5 and `authoritative-sources.md`'s `SECONDARY-TNT` entry hypothesized Cục = "Nạp Âm of the Can-Chi of the **month** containing Mệnh." **This primary text states the opposite input basis: the Can of the birth YEAR (tuổi) plus the Mệnh palace (Chi) — not the month at all.** This is a material correction, not a refinement — the secondary source's guessed mechanism does not match what this primary text actually says.
**Complete table** (5 Mệnh-palace row-groups × 5 Can-pair column-groups = 30 printed cells, fully covering all 12×10=120 logical combinations via the standard Giáp-Kỷ/Ất-Canh/Bính-Tân/Đinh-Nhâm/Mậu-Quý pairing):

| Mệnh palace | Giáp Kỷ | Ất Canh | Bính Tân | Đinh Nhâm | Mậu Quý |
|---|---|---|---|---|---|
| Tý, Sửu | Thủy nhị cục | Hỏa lục cục | Thổ ngũ cục | Mộc tam cục | Kim tứ cục |
| Dần, Mão, Tuất, Hợi | Hỏa lục cục | Thổ ngũ cục | Mộc tam cục | Kim tứ cục | Thủy nhị cục |
| Thìn, Tỵ | Mộc tam cục | Kim tứ cục | Thủy nhị cục | Hỏa lục cục | Thổ ngũ cục |
| Ngọ, Mùi | Thổ ngũ cục | Mộc tam cục | Kim tứ cục | Thủy nhị cục | Hỏa lục cục |
| Thân, Dậu | Kim tứ cục | Thủy nhị cục | Hỏa lục cục | Thổ ngũ cục | Mộc tam cục |

**Cross-check:** matches the one pre-existing worked example (`authoritative-sources.md`'s `SECONDARY-TNT`: "Bính-year, Mệnh at Dậu → Hỏa Lục Cục") exactly — Bính falls in the "Bính Tân" column, Dậu in the "Thân, Dậu" row → Hỏa lục cục. ✓. This is real, independent corroboration between this session's direct read and a pre-existing secondary source's worked example.
**STATUS:** SOURCE_EXTRACTED, 30/30 printed cells (=120/120 logical cells), internally self-consistent (verified: every Can appears in exactly one pair-column, every Chi in exactly one row-group), cross-checked against one independent pre-existing worked example. **Not yet EXPERT_CONFIRMED or second-reviewed.**

## TUVI-08 — Tử Vi anchor placement — CRITICAL HARD GATE, now fully extracted

**PRINTED_PAGE:** 7–8. **SECTION:** "8. AN SAO" intro + the 5 per-Cục tables.
**ORIGINAL_TEXT (method, verbatim):** "Chùm sao này gồm có Tử Vi, Liêm Trinh, Thiên Đồng, Vũ Khúc và Thiên Cơ. Trước hết phải an Tử Vi bắt đầu từ một cung đã định trước... Những cung đã định trước để từ đấy, an Tử Vi được ghi trong bảng dưới đây (tùy theo cục và ngày sinh)."
**Table structure:** for each of the 5 Cục values, a 12-cell chart (same physical layout as TUVI-01) maps lunar-day ranges to palace positions. Decoding method: the day-range groups are printed in the same 4-row physical grid as the Định Cung diagram (TUVI-01), with the Cục's own name in the center label position; day-ranges are read off against the same Tỵ/Ngọ/Mùi/Thân(top)/Dậu/Tuất(right)/Hợi/Tý/Sửu/Dần(bottom)/Mão/Thìn(left) positions.

**Thủy Nhị Cục:** Tý=22-23; Sửu=1,24,25; Dần=2,3,26,27; Mão=4,5,28,29; Thìn=6,7,30; Tỵ=8,9; Ngọ=10,11; Mùi=12,13; Thân=14,15; Dậu=16,17; Tuất=18,19; Hợi=20,21. *(Self-check: 30/30 days, no duplicates, no gaps.)*

**Mộc Tam Cục:** Tý=25; Sửu=2,28; Dần=3,5; Mão=6,8; Thìn=1,9,11; Tỵ=4,12,14; Ngọ=7,15,17; Mùi=10,18,20; Thân=13,21,23; Dậu=16,24,26; Tuất=19,27,29; Hợi=22,30. *(Self-check: 30/30, no duplicates, no gaps.)*

**Kim Tứ Cục:** Tý=5; Sửu=3,9; Dần=4,7,13; Mão=8,11,17; Thìn=2,12,15,21; Tỵ=6,16,19,25; Ngọ=10,20,23,29; Mùi=14,21,27; Thân=18,28; Dậu=22; Tuất=26; Hợi=1,30. **⚠ AMBIGUOUS_SOURCE_CELL:** day 21 appears in both Thìn's cell ("2-12-15-21") and Mùi's cell ("14-21-27") as printed; day 24 does not appear anywhere. Both "21"s were independently re-verified at 5× zoom — both are unambiguously printed as "21," not an OCR artifact. Given every other Cục's table passes a perfect 30-days-no-duplicates check under this same decoding method, this is very likely a single-digit error in this specific edition (plausibly "24" misprinted/mistyped as "21" in one of the two cells) — **but which cell is correct cannot be determined from this evidence alone.** Recorded as-is, not silently corrected.

**Thổ Ngũ Cục:** Tý=22; Sửu=1,24,25; Dần=10,14; Mão=3,15,19,27; Thìn=8,20,24... — *(recorded per the page; full table: Tý=22, Sửu=1-24-25... — see note)* — full breakdown: row1: Tỵ=8-20-24, Ngọ=1-13-25-29, Mùi=6-18-30, Thân=11-23; row2: Thìn=3-15-19-27, [center], Dậu=16-28; row3: Mão=10-14-22, [center], Tuất=21; row4: Dần=5-9-17, Sửu=4-12, Tý=7, Hợi=2-26. *(Self-check: 30/30, no duplicates, no gaps — clean.)*

**Hỏa Lục Cục:** row1: Tỵ=10-24-29, Ngọ=2-16-30, Mùi=8-22, Thân=14-28; row2: Thìn=4-18-23, [center], Dậu=1-20; row3: Mão=12-17-27, [center], Tuất=7-26; row4: Dần=6-11-21, Sửu=5-15-25, Tý=9-19, Hợi=3-13. *(Self-check: 30/30, no duplicates, no gaps — clean.)*

**STATUS:** SOURCE_EXTRACTED, 4 of 5 Cục tables (Thủy Nhị, Mộc Tam, Thổ Ngũ, Hỏa Lục) fully clean and internally self-consistent; 1 of 5 (Kim Tứ) has one flagged `AMBIGUOUS_SOURCE_CELL` pending second review. This is, regardless, an enormous advance from the prior `UNSOURCED, 0 of ~150 cells` state.

## TUVI-09 — Tử Vi tinh hệ (6-star group) placement, including direction — HIGHEST-RISK ITEM

**PRINTED_PAGE:** 7 (start) / 8 continued at top of the star-placement text (the paragraph spans the page break around the Cục tables — the placement rule text itself is fully on page 7, immediately before the Cục tables begin visually).
**SECTION:** "8.1. Tử Vi tinh hệ."
**ORIGINAL_TEXT (verbatim, re-verified at 5× zoom):** "Chùm sao này gồm có Tử Vi, Liêm Trinh, Thiên Đồng, Vũ Khúc và Thiên Cơ. Trước hết phải an Tử Vi bắt đầu từ một cung đã định trước. Sau khi an Tử Vi, **đếm theo chiều thuận** bỏ qua ba cung an Liêm Trinh, bỏ qua hai cung an Thiên Đồng, an Vũ Khúc, an Thái Dương. Bỏ qua một cung an Thiên Cơ."
**NORMALIZED_RULE (offsets, all forward/thuận from Tử Vi=0):** Tử Vi(0) → skip 3 → Liêm Trinh(+4) → skip 2 → Thiên Đồng(+7) → [adjacent] Vũ Khúc(+8) → [adjacent] Thái Dương(+9) → skip 1 → Thiên Cơ(+11).
**⚠ CONFLICTS WITH PRIOR SECONDARY-SOURCE HYPOTHESIS — flagged prominently, per this task's own explicit warning about direction-inversion risk:** `star-placement-rules.md` and `authoritative-sources.md`'s `SECONDARY-14STARS-STRUCTURE` entry (a web-sourced, non-primary lead) stated the Tử Vi group walks in **reverse (nghịch)** direction. This primary text explicitly and unambiguously says **thuận (forward)**. This is a genuine, material, high-stakes discrepancy between a Level C secondary web source and this Level A primary text — resolved in favor of the primary text's own words for this extraction, but flagged with maximum severity for second-reviewer/domain-expert confirmation before any engine implementation trusts it, precisely because this is exactly the "plausible but completely wrong chart" failure mode this task named explicitly.
**Note on group membership:** the sentence names 5 stars as the group ("Tử Vi, Liêm Trinh, Thiên Đồng, Vũ Khúc và Thiên Cơ") but the walking instructions place 6 stars including Thái Dương, which is not named in the group-definition sentence. Recorded exactly as printed — not smoothed into a cleaner 6-star definition.
**STATUS:** SOURCE_EXTRACTED, complete, unambiguous text (re-verified at high zoom). **Second review required at the highest priority of any item in this document**, given the direct conflict with prior secondary sourcing.

## TUVI-10 — Thiên Phủ tinh hệ (8-star group) placement, including direction

**PRINTED_PAGE:** 9. **SECTION:** "8.2. Thiên Phủ tinh hệ."
**ORIGINAL_TEXT (verbatim):** "Chùm sao này gồm có: Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân. Trước hết phải an Thiên Phủ bắt đầu từ một cung đã định trước. Sau khi an Thiên Phủ, **theo chiều thuận** lần lượt mỗi cung an một sao thứ tự: Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, bỏ qua ba cung an Phá Quân."
**NORMALIZED_RULE (offsets, all forward/thuận from Thiên Phủ=0):** Thiên Phủ(0), Thái Âm(+1), Tham Lang(+2), Cự Môn(+3), Thiên Tướng(+4), Thiên Lương(+5), Thất Sát(+6), skip 3 → Phá Quân(+10).
**⚠ MAJOR FINDING:** this group **also** walks thuận (forward) — the **same direction as the Tử Vi group** (TUVI-09), not the opposite direction the prior secondary-source hypothesis assumed. If both this and TUVI-09 hold up under second review, the entire "two groups walk opposite directions" structural assumption in `star-placement-rules.md` is materially wrong and needs correction, not just refinement.
**STATUS:** SOURCE_EXTRACTED, complete, unambiguous. Second review required at the same high priority as TUVI-09 — these two findings stand or fall together.

## TUVI-11 — Tử Vi / Thiên Phủ mirror-position table

**PRINTED_PAGE:** 9. **SECTION:** continuation of 8.2, two 12-cell reference charts.
**ORIGINAL_TEXT:** two charts in the same physical 12-palace layout as TUVI-01, one showing where Thiên Phủ falls for each Tử Vi position, the other the reverse.
**Decoded relationship (medium-high confidence, not re-verified at high zoom for every cell the way TUVI-07/08/09/10 were):** Tử Vi and Thiên Phủ coincide (same palace) at exactly Dần and Thân; elsewhere they mirror across what appears to be the **Dần–Thân axis** (e.g., Tử Vi at Tý ↔ Thiên Phủ at Thìn; Tử Vi at Sửu ↔ Thiên Phủ at Mão), **not the Tị–Hợi axis** `star-placement-rules.md` previously assumed.
**STATUS:** SOURCE_EXTRACTED at medium confidence (grid-position decoding, not a direct textual statement of the axis) — flagged for second-reviewer re-verification at high zoom before being trusted at the same confidence level as TUVI-07 through TUVI-10.

## TUVI-12 through TUVI-24 — Auxiliary stars (complete rules, all 13 originally-proposed MVP stars plus additional series)

All of the following are `SOURCE_EXTRACTED`, directly transcribed, printed pages 9–17, section numbers as noted. Format: star(s) — rule — page/section.

- **Lộc Tồn** (p.9, §8.4) — by year-Can: Giáp→Dần, Ất→Mão, Bính→Tỵ, Đinh→Ngọ, Mậu→Tỵ, Kỷ→Ngọ, Canh→Thân, Tân→Dậu, Nhâm→Hợi, Quý→Tý. Complete 10/10.
- **Kình Dương, Đà La** (p.10, §8.6.1) — Kình Dương = Lộc Tồn's palace +1 (forward); Đà La = Lộc Tồn's palace −1 (backward). Worked example: Lộc Tồn at Tý → Kình Dương Sửu, Đà La Hợi.
- **Địa Không, Địa Kiếp** (p.10, §8.6.2) — both start from Hợi=giờ Tý reference; Địa Kiếp counts forward to birth hour, Địa Không counts backward to birth hour.
- **Hỏa Tinh, Linh Tinh** (p.10–11, §8.6.3) — starting palace by year-Chi group (4 groups × 2 stars, table on p.11) crossed with gender/yin-yang (dương nam/âm nữ vs. âm nam/dương nữ) determining forward-vs-backward count to birth hour from that starting palace. Full table transcribed; noting two of the four year-Chi groups showed the same starting-palace pair (Dần for Hỏa Tinh, Tuất for Linh Tinh) in this session's read — plausible but not re-verified at high zoom, lower priority than TUVI-08/09/10's flagged items.
- **Tả Phù, Hữu Bật** (p.11, §8.7) — by lunar month: Tả Phù starts Thìn=month 1, counts forward; Hữu Bật starts Tuất=month 1, counts backward.
- **Văn Xương, Văn Khúc** (p.11, §8.8) — by hour: Văn Xương starts Tuất=giờ Tý, counts backward; Văn Khúc starts Thìn=giờ Tý, counts forward.
- **Long Trì, Phượng Các** (p.11, §8.9) — by year: Long Trì starts Thìn=năm Tý, counts forward; Phượng Các starts Tuất=năm Tý, counts backward. *(Not in the original 13-star MVP list — candidate for `OPTIONAL_V1`, see the readiness section below.)*
- **Thiên Khôi, Thiên Việt** (p.11, §8.10) — by year-Can, complete 10/10 table: Giáp/Mậu→Sửu/Mùi; Ất/Kỷ→Tý/Thân; Canh/Tân→Ngọ/Dần; Bính/Đinh→Hợi/Dậu; Nhâm/Quý→Mão/Tỵ.
- **Thiên Khốc, Thiên Hư** (p.11–12, §8.11) — by year, both count from Ngọ=năm Tý, Khốc backward, Hư forward. Noted as always co-located with specific companion stars (Song Hao for Khốc-adjacent, Tuế Phá for Hư) per the text — *not in original MVP list.*
- **Tam Thai, Bát Tọa** (p.12, §8.12); **Ân Quang, Thiên Quý** (p.12, §8.13); **Thiên Đức, Nguyệt Đức** (p.12, §8.14); **Thiên Hình, Thiên Riêu, Thiên Y** (p.12, §8.15); **Hồng Loan, Thiên Hỷ** (p.12, §8.16); **Quốc Ấn, Đường Phù** (p.12–13, §8.17); **Thiên Giải, Địa Giải, Giải Thần** (p.13, §8.18); **Thai Phụ, Phong Cáo** (p.13, §8.19); **Thiên Tài, Thiên Thọ** (p.13, §8.20); **Thiên Thương, Thiên Sứ** (p.13, §8.21 — fixed palaces: always Nô Bộc / Tật Ách respectively, no calculation needed); **Thiên La, Địa Võng** (p.13, §8.22 — fixed palaces: always Thìn / Tuất) — all complete, directly-read rules, **none in the original 13-star MVP list.**
- **Thiên Quan, Thiên Phúc (Quan Phúc)** (p.14, §8.24) — by year-Can, complete 10/10 table.
- **Cô Thần, Quả Tú** (p.14, §8.25) — by year-Chi group, complete table.
- **Đào Hoa** (p.14–15, §8.26); **Thiên Mã** (p.15, §8.27); **Kiếp Sát** (p.15, §8.28); **Phá Toái** (p.15, §8.29); **Hoa Cái** (p.15, §8.30) — all by year-Chi group, complete tables.
- **Lưu Hà, Thiên Trù, Lưu Niên Văn Tinh** (p.16, §8.31–8.33) — all by year-Can, complete 10/10 tables each.
- **Bác Sỹ** (p.16, §8.34 — always co-located with Lộc Tồn); **Đẩu Quân** (p.16, §8.35 — month-then-hour compound rule, structurally like Mệnh/Thân); **Thiên Không** (p.16, §8.36 — always the palace immediately before Thái Tuế's).
- **Lộc Tồn's own 12-star companion walk** (p.10, continuing §8.4): Lục Sỹ, Thanh Long, Tiểu Hao, Tướng Quân, Tấu Thư, Phi Liêm, Hỷ Thần, Bệnh Phù, Đại Hao, Phục Binh, Quan Phù — gender/yin-yang-direction-dependent walk starting from Lộc Tồn's palace.
- **Tràng Sinh series** (p.10, §8.5) — starting palace by Cục: Thủy→Thân, Mộc→Hợi, Kim→Tỵ, Thổ→Thân, Hỏa→Dần; then 10-star walk (Mộc Dục, Quan Đới, Lâm Quan, Đế Vượng, Bệnh, Tử, Mộ, Tuyệt, Thai, Dưỡng), gender/yin-yang-direction-dependent.
- **Thái Tuế series** (p.9, §8.3) — Thái Tuế itself at the palace matching birth-year Chi; then 11 companion stars walking forward one-per-palace (Thiếu Dương, Tang Môn, Thiếu Âm, Quan Phù, Tử Phù, Tuế Phá, Long Đức, Bạch Hổ, Phúc Đức, Điếu Khách, Trực Phù). **A complete 12-star series not present in any prior project document at all.**

**Summary for DECISION-08:** the primary text treats a **far larger auxiliary-star universe as canonical** than the previously-proposed 13-star MVP list — all 13 originally-proposed stars have complete rules extracted above, **plus roughly 40 additional named stars/series** with complete, directly-sourced placement rules. This materially changes the shape of the DECISION-08 founder question: it is no longer "is this list of 13 correct," but "which subset of ~53 fully-ruled stars does the founder want in V1," a scope-size question this document does not answer (see the readiness/founder-decision section below).

## TUVI-25 — Tứ Hóa — HARD GATE, now fully extracted

**PRINTED_PAGE:** 13–14. **SECTION:** "8.23. Bộ sao Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ)."
**ORIGINAL_TEXT (method):** "Theo hàng Can của năm sinh an Tứ Hóa theo thứ tự: Lộc, Quyền, Khoa, Kỵ, vào những cung đã an sao kê trong bảng dưới đây."
**Complete table (10 Can × 4 transformations = 40 cells):**

| Can | Lộc | Quyền | Khoa | Kỵ |
|---|---|---|---|---|
| Giáp | Liêm Trinh | Phá Quân | Vũ Khúc | Thái Dương |
| Ất | Thiên Cơ | Thiên Lương | Tử Vi | Thái Âm |
| Bính | Thiên Đồng | Thiên Cơ | Văn Xương | Liêm Trinh |
| Đinh | Thái Âm | Thiên Đồng | Thiên Cơ | Cự Môn |
| Mậu | Tham Lang | Thái Âm | Hữu Bật | Thiên Cơ |
| Kỷ | Vũ Khúc | Tham Lang | Thiên Lương | Văn Khúc |
| Canh | Thái Dương | Vũ Khúc | Thái Âm | Thiên Đồng |
| Tân | Cự Môn | Thiên Lương | Văn Khúc | Văn Xương |
| Nhâm | Thiên Lương | Tử Vi | Tả Phụ | Vũ Khúc |
| Quý | Phá Quân | Cự Môn | Thái Âm | Tham Lang |

**Cross-check:** the page's own worked example ("Sinh năm Đinh Mão an Hóa Lộc ở cung đã an Thái Âm, Hóa Quyền ở cung đã an Thiên Đồng, Hóa Khoa ở cung đã an Thiên Cơ, Hóa Kỵ ở cung đã an Cự Môn") matches the Đinh row exactly. ✓ Internally self-consistent.
**Note on the Bắc/Nam school question (DECISION-10):** this table is simply what VDTTL-1956 states — it does not itself identify whether this matches the Bắc Phái or Nam Phái/Trung Châu convention named in `authoritative-sources.md`'s `SECONDARY-TUHOA-SCHOOLS` entry. That meta-question remains open; a domain expert could likely answer it quickly by inspection, but this document does not guess.
**STATUS:** SOURCE_EXTRACTED, 40/40 cells, internally self-consistent with its own worked example. The strongest single hard-gate result in this entire extraction.

## TUVI-26, TUVI-27 — Tuần, Triệt — HARD GATE, now fully extracted

**PRINTED_PAGE:** 16–17. **SECTION:** "8.37. Bộ sao Nhị Không (Tuần Trung không vong (Tuần), Triệt Lộ không vong (Triệt))."

**Tuần (8.37.1, p.16–17)** — complete 6-row table by 10-year Can-decade group, each spanning exactly 2 palaces:

| Birth year in range | Tuần palaces |
|---|---|
| Giáp Tý – Quý Dậu | Tuất, Hợi |
| Giáp Tuất – Quý Mùi | Thân, Dậu |
| Giáp Thân – Quý Tỵ | Ngọ, Mùi |
| Giáp Ngọ – Quý Mão | Thìn, Tỵ |
| Giáp Thìn – Quý Sửu | Dần, Mão |
| Giáp Dần – Quý Hợi | Tý, Sửu |

Worked example ("Sinh năm Bính Dần... an Tuần ở giữa cung Tuất và cung Hợi") matches row 1 exactly. ✓ Self-consistent.

**Triệt (8.37.2, p.17)** — complete 5-row table by Can-pair group, each spanning exactly 2 palaces:

| Can group | Triệt palaces |
|---|---|
| Giáp, Kỷ | Thân, Dậu |
| Ất, Canh | Mùi, Ngọ |
| Bính, Tân | Thìn, Tỵ |
| Đinh, Nhâm | Dần, Mão |
| Mậu, Quý | Tý, Sửu |

**⚠ AMBIGUOUS finding:** the page's own worked example ("Sinh năm Canh Ngọ an Triệt ở giữa cung Thân và cung Dậu") does **not** match the table as transcribed — Canh belongs to the "Ất, Canh" row (Mùi–Ngọ per the table), but the example gives Thân–Dậu (the "Giáp, Kỷ" row's value). This is recorded exactly as printed on both sides, **not resolved in either direction** — not by assuming the table is right and the example is a misprint, and not by any recollection of common Zi Wei Dou Shu convention (which this session deliberately did not use to break the tie, per this task's explicit prohibition on using inherited/background knowledge as a source). **This specific item requires second-reviewer resolution before use.**
**STATUS:** SOURCE_EXTRACTED for both tables; Tuần cross-checked clean against its own worked example; Triệt has one flagged internal inconsistency between table and worked example.

---

## What remains genuinely unresolved after this extraction

- **DECISION-01 (school lock):** still a founder decision, unchanged in kind — but the practical case for Candidate A (VDTTL-1956) is now much stronger: it is not just "the most-cited name," it is a complete, internally coherent, largely self-consistent, worked-example-corroborated system covering every hard gate.
- **DECISION-02 (Giờ Tý), day-boundary half:** the hour-branch-labeling half is now resolved (undivided Tý, 23:00–01:00); the civil/lunar day-assignment half for a 23:00–00:59 birth is still not found in pages 1–17.
- **Exact numeric Mệnh/Thân formula:** direction/structure now source-confirmed; the precise arithmetic (mod-12 formula) still awaits a worked numeric example from this text (not found in pages 1–17; may be in Part 2's practice examples).
- **Two flagged AMBIGUOUS_SOURCE_CELL items:** Kim Tứ Cục's day-21/24 conflict (TUVI-08); Triệt's Canh-year table/example conflict (TUVI-27).
- **TUVI-09/TUVI-10's direction finding** (both star groups walk thuận) directly contradicts prior secondary sourcing and is the single highest-priority item for second-reviewer/domain-expert confirmation before any engine trusts it.
- **Zero golden vectors were computed from this material**, correctly — golden vectors must come from a source independent of whatever implementation is being tested, and this document is itself a candidate *input* to a future engine, not an independent check on one. A human transcriber/expert producing full worked charts *from this same book's own worked examples elsewhere in the text* (if any exist in Parts 2–3, not read this session) would still qualify as independent-of-engine; this document computing its own vectors would not.
- **Second review:** every single item above is `SECOND_REVIEW_PENDING`. No item in this document may be treated as `EXPERT_CONFIRMED`.
