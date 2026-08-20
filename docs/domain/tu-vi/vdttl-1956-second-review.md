# VDTTL-1956 — Second Review — Sprint 18A.2

**Date:** 2026-08-20
**Reviewer:** Claude (Sonnet 5), same session-family as the first extraction (`vdttl-1956-extraction.md`).

## Methodological honesty, stated up front

**This is not a genuinely independent second reader.** The task requesting this review asked for an independent second reader; that is not something this system can literally provide, since the first extraction was also produced by an instance of this same model reading the same source. What follows is the most rigorous approximation available in this environment: every item below was **re-opened from the raw page image and re-read fresh** (not by comparing text-to-text against the first transcription), several at higher zoom than the first pass, and — new this session — cross-checked where possible against (a) an independently-fetched separate scanned-image derivative of the same archive.org item, and (b) an adversarial external source unrelated to this project's own prior research. This raises confidence substantially above a single read, but it is **not a substitute for a different human, ideally Vietnamese-fluent, reading the same pages** — that remains recommended before any item here is treated as truly independent-second-reader-confirmed.

**Founder decision received this session:** `TUVI_SCHOOL_V1 = VDTTL_1956` (Vân Đằng Thái Thứ Lang, *Tử Vi Đẩu Số Tân Biên*, 1956) is now locked as the canonical V1 school, per explicit instruction. `domain-decision-register.md` DECISION-01 is updated accordingly (see that file's addendum) — other schools/sources remain usable only for corroboration and conflict documentation, never mixed into V1 rules.

---

## 1. Highest priority — star-group direction

### Re-verification method
Re-rendered pages 7 and 9 at 5× resolution (2977×4210 px), cropped tightly on the exact direction-bearing sentences, and read them fresh without consulting the first transcription until after recording the new read.

### Fresh reads (verbatim, re-confirmed)
- **Tử Vi group** (p.7): "...Sau khi an Tử Vi, **đếm theo chiều thuận** bỏ qua ba cung an Liêm Trinh, bỏ qua hai cung an Thiên Đồng, an Vũ Khúc, an Thái Dương. Bỏ qua một cung an Thiên Cơ." — identical to the first read.
- **Thiên Phủ group** (p.9): "...Sau khi an Thiên Phủ, **theo chiều thuận** lần lượt mỗi cung an một sao thứ tự: Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, bỏ qua ba cung an Phá Quân." — identical to the first read.

**Both readings reconfirmed unambiguously at maximum zoom. No transcription error found.**

### New internal corroboration found this session
Page 5 ("1. ĐỊNH CUNG") explicitly **defines** the book's own terminology: "đếm theo chiều thuận (**thuận chiều kim đồng hồ**)" — i.e., the book itself equates "thuận" with clockwise, applied to its own stated 12-palace numbering (1=Tý...12=Hợi). This term is used self-consistently across more than 30 separate rules throughout Part 1 (every auxiliary star's placement rule uses "thuận"/"nghịch" as the same opposite pair). This is strong internal evidence that both group-direction statements use the book's own single, consistently-applied convention — not a copy-paste error or an isolated inconsistency.

### New external adversarial cross-check this session (§18 of the governing task)
Fetched (directly, not summary-only) `mingming3.com`'s Ziwei chart guide, an independent modern web source unconnected to this project's prior research:
> "Ziwei system (**counterclockwise**): Ziwei → Tianji → (skip one palace) → Taiyang → Wuqu → Tiantong → (skip two palaces) → Lianzhen."
> "Tianfu system (**clockwise**): Tianfu → Taiyin → Tanlang → Jumen → Tianxiang → Tianliang → Qisha → (skip three palaces) → Pojun."

This describes the mainstream/modern convention as **opposite directions** between the two groups — matching the original `SECONDARY-14STARS-STRUCTURE` hypothesis Sprint 15 had recorded, and on its face contradicting VDTTL-1956.

### The arithmetic reconciliation — the most important finding of this review

Decoding both descriptions into actual mod-12 palace offsets from each group's own anchor (0):

| Star | VDTTL-1956 (thuận/+, this session's reading) | mingming3.com (counterclockwise/−, decoded mod 12) |
|---|---:|---:|
| Liêm Trinh | +4 | −8 ≡ **+4** |
| Thiên Đồng | +7 | −5 ≡ **+7** |
| Vũ Khúc | +8 | −4 ≡ **+8** |
| Thái Dương | +9 | −3 ≡ **+9** |
| Thiên Cơ | +11 | −1 ≡ **+11** |

**Every single offset matches exactly, star for star**, once mingming3.com's "counterclockwise" is converted into an actual palace position rather than left as a direction label. The Thiên Phủ group already matched exactly in both direction *and* offsets between VDTTL-1956 and mingming3.com. **This means the two star groups' actual, functional palace assignments — the thing that actually matters for a working engine — appear to be in full agreement between the primary source and this modern adversarial source.** The apparent "direction conflict" looks, on this evidence, like a **labeling/reference-frame difference** (which rotational direction gets called "clockwise" — plausibly a page-orientation or diagram-convention difference between traditions, not yet confirmed which) rather than a substantive disagreement about where any star actually lands.

**This is not treated as resolved.** The *reason* for the labeling difference is not established (candidates: a different physical chart-orientation convention; a translation artifact; something else), and this reconciliation was performed by this same reviewer, not an independent one. But it materially changes the risk profile: the worst-case scenario (silently building an engine with every star in the wrong palace) now looks unlikely, since the two independently-sourced offset sets converge. **Status: `CONFIRMED_FROM_PRIMARY_SOURCE` for the offset values (both groups); the "thuận"/"clockwise" terminology-label question remains flagged for expert input, but is no longer believed to indicate an actual placement disagreement.**

`TUVI_GROUP_DIRECTION`: offsets CONFIRMED (see table); direction-label question open, non-blocking for engine correctness if the offset table above is used directly (i.e., an implementation should encode the *offsets*, not re-derive them from a "clockwise/counterclockwise" instruction, precisely to sidestep this exact ambiguity).
`THIEN_PHU_GROUP_DIRECTION`: CONFIRMED_FROM_PRIMARY_SOURCE — offsets and direction label both agree with the adversarial source.

---

## 2. Ambiguous cell #1 — Kim Tứ Cục / Tử Vi anchor (day 21 vs. 24)

**Re-verification method:** re-cropped both cells at 5× resolution (individual crops, ~750–830px wide for a 4–5 character cell) and re-read fresh; additionally, downloaded and converted archive.org's separate "Single Page Processed JP2" derivative (`dv01_jp2.zip`, 12.1MB, the item's designated scanned-page-image format) for the same page, to check whether the underlying source scan differs from the PDF rendering.

**Finding:** the JP2 "scan" is pixel-for-pixel the same digitally-retypeset edition as the PDF (identical font, identical layout, identical apparent digital origin — not an independent scan of the physical 1956 book with paper/ink artifacts). **This forecloses the specific verification path attempted this session** — there is no more primitive image available within this archive.org item to check against.

**Printed page:** 8. **Scan page (this PDF's own indexing):** 8 (jp2 file `_0007`). **Table:** Kim Tứ Cục. **Row/column:** row 2 col 1 ("Thìn" position per the established spatial-grid decode) shows "2 - 12 - 15 - 21"; row 1 col 3 ("Mùi" position) shows "14 - 21 - 27". **First-reader value:** both cells "...21" as printed. **Second-reader value (this session, independent crop+zoom):** identical — both cells unambiguously "...21" as printed. **Image evidence:** confirmed via two independent high-resolution crops, character shapes unambiguous, no OCR/rendering artifact.

**Final status: `STILL_AMBIGUOUS`.** Both readers (same underlying system, two independent passes) agree on what is printed; the printed text itself is internally inconsistent (day 21 duplicated, day 24 absent — the only such gap across all 5 Cục tables, each of which is otherwise a clean bijection over 1–30). No further resolution is possible from within this specific digital source. **Requires either a different scanned edition of this book, or expert/practitioner knowledge of the correct Kim Tứ Cục table**, to resolve. Not guessed in either direction.

---

## 3. Triệt conflict

**Re-verification method:** re-rendered page 17 at 5× resolution, cropped the table and worked example together, read fresh.

**Canonical table (re-confirmed):** "Ất Canh" row → "Mùi - Ngọ".
**Worked example (re-confirmed, verbatim):** "Thí dụ: Sinh năm Canh Ngọ an Triệt ở giữa cung Thân và cung Dậu." — i.e., for a person born in the year Canh-Ngọ, the text's own example places Triệt at Thân–Dậu, which is the **"Giáp Kỷ" row's** value, not "Ất Canh"'s.

**Determination:** the book's own stated method ("Tùy theo hàng Can của năm sinh" — based on the birth year's Can alone) means the relevant input for a Canh-Ngọ birth is Canh, which the table itself places under "Ất Canh" → Mùi-Ngọ. The worked example's Thân-Dậu answer does not follow from the table as printed, using the method as printed. **This is not an illustration of a different condition or a transcription slip this reviewer can resolve** — both the table and the example are unambiguous, printed clearly, and simply disagree.

**Final status: `DOMAIN_EXPERT_REQUIRED`.** Recorded as a genuine internal inconsistency in this specific edition, not silently resolved toward either the table or the example. An expert or a comparison against a different print/edition of the same book is needed.

---

## 4. Cục — full second review (30/30 printed cells)

Every cell of the 5×5 Lập Cục table (p.7) was re-read directly from a fresh render (`original_scan_p07.png`, generated independently this session from the item's designated scan-derivative format). **Result: all 30 printed cells (=120 logical cells) match the first extraction exactly, cell for cell, row-label for row-label, column-label for column-label.** Row/column orientation (Mệnh-palace rows × Can-pair columns), Can ordering (Giáp Kỷ / Ất Canh / Bính Tân / Đinh Nhâm / Mậu Quý, left to right), and Cục labels (Thủy nhị / Mộc tam / Kim tứ / Thổ ngũ / Hỏa lục cục) all confirmed identical. **30/30 CONFIRMED.**

## 5. Tử Vi anchor — full second review

All 5 per-Cục tables (Thủy Nhị on p.7; Mộc Tam, Kim Tứ, Thổ Ngũ, Hỏa Lục on p.8) were re-read fresh from independently-generated renders. **4 of 5 (Thủy Nhị, Mộc Tam, Thổ Ngũ, Hỏa Lục) CONFIRMED identical to the first extraction, cell for cell — each independently re-verified as a clean bijection over lunar days 1–30.** Kim Tứ Cục: values re-confirmed identical to the first read (§2 above) — the ambiguity is in the source, not in either reading.

## 6. 14 Chính Tinh — full second review

All 14 stars' anchor/offset assignments re-read fresh from p.7 (Tử Vi group) and p.9 (Thiên Phủ group). All 14 offsets CONFIRMED identical to the first extraction. Direction question: see §1 above (offsets confirmed via two independent methods; label question flagged, not blocking).

## 7. Tứ Hóa — full second review (40/40 cells)

Re-read fresh from an independently-generated render of page 14 (`original_scan_p14.png`). **All 40 cells (10 Can × 4 transformations) CONFIRMED identical to the first extraction**, including the cross-check worked example (Đinh year). No Bắc/Nam school comparison was substituted — this table is recorded exactly as VDTTL-1956 states it, per the explicit instruction not to blend schools.

## 8. Tuần — full second review

Re-read fresh from an independently-generated render of page 16 (`original_scan_p16.png`) continuing into page 17. **All 6 rows CONFIRMED identical to the first extraction**, cross-checked clean against the page's own worked example (Bính Dần birth year → Tuất-Hợi, matching the Giáp Tý–Quý Dậu row).

## 9. Mệnh / Thân — second review

Direction/structure re-confirmed identical on fresh read of pages 6–7 (see also §1's methodology). **No additional independent worked numeric example was found** — Parts 2 and 3 of the book (dv02–dv06, pages ~31 onward) were not opened this session; a full numeric cross-check of the candidate mod-12 formula against a primary-text worked example remains outstanding. **Do not count our own manually applied formula as independent evidence** — none was generated or used as if it were.

## 10. Giờ Tý — second review, hour rule vs. day-boundary kept separate

**Hour-branch assignment (re-confirmed, p.6):** Tý = one undivided 23:00–01:00 block. **CONFIRMED, unchanged.**
**Civil/lunar day-boundary rule:** actively searched this session — re-checked p.6 (Định Giờ itself), and read pages 24, 25, and 26 (§11 "Lý Giải Ngũ Hành, Can, Chi," covering Ngũ Hành correspondences, Can tương hợp/tương phá, Chi tương hình/lục hợp/xung, and Bát Quái/phương hướng correspondences) in full. **No explicit statement of the day-rollover rule for a 23:00–00:59 birth was found anywhere in these pages.** This is now a confirmed-absent finding (searched, not found) rather than an unsearched gap — the remaining unexplored area is Part 1's pages 18–23 (Định Hướng Chiếu, Khởi Hạn — both plausibly interpretation/vận-adjacent, lower priority) and Parts 2–3 (not opened this session). **Status: hour-rule CONFIRMED; day-boundary rule remains genuinely not found in this source, not merely unconfirmed.**

## 11. Auxiliary star V1 lock — recommendation against explicit criteria

Applying the task's own stated criteria (required for a credible V1 chart; clearly sourced; meaningful interpretation value; proportionate implementation/test burden) to the originally-proposed 13-star list, all 13 of which now have complete, clean, directly-sourced rules (see `vdttl-1956-extraction.md` TUVI-12 through TUVI-24):

| Star | Recommendation | Basis |
|---|---|---|
| Tả Phù, Hữu Bật | `CORE_V1` | "6 auspicious stars" grouping, consistently load-bearing across every source touching this project's research |
| Văn Xương, Văn Khúc | `CORE_V1` | Same grouping; also appear as Tứ Hóa targets (TUVI-25) — directly load-bearing, not decorative |
| Thiên Khôi, Thiên Việt | `CORE_V1` | Same grouping |
| Lộc Tồn | `CORE_V1` | Foundational — anchors Kình Dương/Đà La's placement and the Bác Sỹ series; widely cited as one of the most consequential auxiliary stars |
| Kình Dương, Đà La | `CORE_V1` | Directly dependent on Lộc Tồn, complete simple rule, traditionally paired with the "6 auspicious" set as the core malefic counterpart |
| Địa Không, Địa Kiếp, Hỏa Tinh, Linh Tinh | `CORE_V1` | Complete the traditional "6 malefics" (Lục Sát) set alongside Kình/Đà; simple hour/year-based rules, proportionate burden |

**All 13 recommended `CORE_V1`** — every one already has a complete, clean, source-extracted rule, all are part of the traditionally-recognized "6 auspicious + 6 malefic + Lộc Tồn" core set this project's own prior research (Sprint 15) already identified as load-bearing, and none requires materially more implementation complexity than the others. The ~40 additional stars/series found this session (Thái Tuế's 12-star series, Lộc Tồn's own 12-star companion series, Tràng Sinh's 10-star series, and ~15 more named singles/pairs) are recommended `DEFERRED` — not because they lack sourcing (all are cleanly sourced), but because they exceed what the product definition originally scoped, and adding them multiplies test/golden-vector surface area without a demonstrated product need. **This is a recommendation, not a lock** — final scope remains a founder call.

---

## Sprint 18A.3 addendum — external corroboration for the two remaining conflicts

### §5 — Kim Tứ Cục, resolved to `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`

An independently-sourced quotient/remainder Tử Vi-placement formula (found via web search, origin unrelated to VDTTL-1956 or any source already on file) was first **validated** against two already-unambiguous VDTTL-1956 data points before being trusted:
- Thủy Nhị Cục (Cục=2), day 8: formula gives Tỵ — matches VDTTL-1956's table exactly (Tỵ=8,9). ✓
- Thủy Nhị Cục (Cục=2), day 1: formula gives Sửu — matches VDTTL-1956's table exactly (Sửu includes day 1). ✓

Applied to the disputed Kim Tứ Cục (Cục=4) cells:
- Day 21: `21÷4=5 remainder 1`; add `a=3` to reach `24÷4=6` evenly (`b=6`); `a=3` is odd → retreat 3 palaces from the count-6 position (Mùi) → **Thìn**. Matches the printed Thìn cell ("2-12-15-21") exactly.
- Day 24: `24÷4=6` evenly (`a=0, b=6`); `a=0` is even → advance 0 from the count-6 position → **Mùi**. Does **not** match the printed Mùi cell, which shows "21" where "24" is expected.

**Conclusion: the Mùi cell's printed "14-21-27" should read "14-24-27."** The Thìn cell is correct as printed. This is now a located, specific, well-evidenced correction — not a guess and not a majority vote among random calculators (only one formula source was used, and it was validated against known-good data before being applied to the disputed cell, per this task's explicit instruction not to resolve by popularity).

### §6 — Triệt, resolved to `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`

Directly fetched `tracuutuvi.com/tuan-triet.html` (independent modern Vietnamese Tử Vi reference, no connection to VDTTL-1956 or any source already cited in this project's research). Verbatim: "Thiên can Ất và Canh: an Triệt tại Ngọ và Mùi" — matches VDTTL-1956's **table** exactly (Ất Canh → Mùi-Ngọ), diverging from VDTTL-1956's own **worked example** (Canh Ngọ → Thân-Dậu, which matches the *Giáp-Kỷ* row instead). This source gave no worked example of its own to cross-check further, but its table-level agreement is real, independent, and specific (not a generic restatement). **Conclusion: the table is very likely correct; the worked example is the error in this edition.**

### Giờ Tý day-boundary — new evidence, not from VDTTL-1956 itself

`thienvanvietnam.org` (Vietnam Astronomical Society — a legitimate calendrical-science source, not an astrology site) states the modern Vietnamese lunar calendar rolls over at 00:00 (Chính Tý), not 23:00 (Sơ Tý) — i.e., the Tý hour-branch *label* is continuous across 23:00–01:00, but the *lunar day* used for day-dependent calculations changes at midnight, splitting the hour. This is Model B from `domain-resolution-pack.md` §2, now with real (if not VDTTL-1956-specific) evidentiary backing — see `v1-canonical-ruleset.md` §3 for the recommendation this supports.

### Mệnh/Thân — false-independence caught, not a new verification

Directly re-fetched `tuvisaigon.vn`'s "Bài 1: An Mệnh - Thân" article (the exact source already on file as `SECONDARY-TVSG-MENH-THAN`) to check whether a numeric worked example there could serve as independent verification. **It cannot — it is the same source, not a second one**, exactly the false-independence pattern this task's §14 warns against ("two websites copying the same table != two independent sources"). While re-fetching it, a real, separate finding emerged: the source's own worked example mixes two different hour-indexing conventions (Tý=1 for the input, Dần=1 for the output) in a way VDTTL-1956's own prose does not describe — flagged in `v1-canonical-ruleset.md` §4 as a reason to trust the *structural* finding (already primary-source-confirmed) over the *exact arithmetic mechanics* (still unconfirmed). No genuinely independent Mệnh/Thân numeric verification was found this sprint.

---

## Summary of this session's corrections to the first extraction

**None.** Every re-checked value matched the first extraction exactly. This session's contribution is not correction but **verification depth**: tighter zoom on the two flagged items, a second independent image-derivative check (ruling out a scan-vs-OCR explanation for the Kim Tứ Cục anomaly), and — most significantly — an external adversarial cross-check that reframes the star-direction question from "possible error" to "likely terminology/orientation convention difference with converging underlying data."
