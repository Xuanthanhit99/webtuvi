# Tử Vi Expert Review Pack — Sprint 18A.4

**Date:** 2026-08-21
**Type:** Domain research/documentation only. Zero application-code changes.
**School:** `TUVI_SCHOOL_V1 = VDTTL_1956` (Vân Đằng Thái Thứ Lang, *Tử Vi Đẩu Số Tân Biên*, 1956) — founder-locked (`domain-decision-register.md` DECISION-01, Sprint 18A.2).
**Candidate ruleset:** `TUVI_RULESET_CANDIDATE_V1 = VDTTL_1956_CANDIDATE_1`
**Candidate ruleset status:** `CANDIDATE_PENDING_EXPERT_VERIFICATION` — **this is not a verified ruleset.** No rule in this document may be treated as `EXPERT_CONFIRMED` until an expert has independently reviewed it per the procedure below.
**Golden vectors:** 0/12 accepted. **Sprint 18B remains BLOCKED.**

---

## 1. Purpose and scope boundaries

This document, together with `expert-blind-golden-vector-pack.md`, `golden-vector-comparison-matrix.md`, and `sprint-18b-entry-gate.md`, is the complete package handed to a human domain expert to close the two remaining classes of blocker on the Tử Vi Đẩu Số V1 engine:

1. Four specific, page-cited, unresolved domain conflicts (§5 below).
2. The golden-vector gate (0/12 — needs ≥12 independently-verified, expert-produced worked charts).

**What this package is not:**
- Not an engine. No code exists for this feature (see `CLAUDE.md` — Vietnamese Tử Vi Lá Số has no code, route, or engine yet).
- Not a source of "expected answers." Every candidate value in this document is derived from `vdttl-1956-extraction.md` / `v1-canonical-ruleset.md` — the reviewer's own second-pass extraction of VDTTL-1956 — and is explicitly `SOURCE_EXTRACTED`, never `EXPERT_CONFIRMED`.
- Not a request for fortune interpretation. This is a deterministic an-sao (star-placement/chart-construction) verification exercise only.

---

## 2. Candidate ruleset — normalized rule table

Every deterministic rule needed for a V1 chart, normalized into one reviewable form. Full page-cited transcriptions live in `vdttl-1956-extraction.md`; this table is the convenience/summary layer only — **it carries no independent authority beyond what that document already established.**

### 2.1 Calendar

| Field | Value |
|---|---|
| RULE_ID | TUVI-CAND-01 |
| INPUT | Gregorian date, time, timezone (fixed UTC+7) |
| OUTPUT | Lunar date (year/month/day, leap-month flag) |
| CANONICAL REPRESENTATION | Delegated to the Hồ Ngọc Đức algorithm (`HND-ALGORITHM`), Principal-Terms leap-month method, UTC+7 meridian |
| PRIMARY SOURCE | Not VDTTL-1956 — a separate, already-`RESOLVED_BY_SOURCE` calendar-layer decision (`DECISION-03B`) |
| PAGE | N/A |
| CURRENT STATUS | `RESOLVED_BY_SOURCE` (calendar layer only) |
| KNOWN CONFLICT | None for the astronomy. VDTTL-1956-specific leap-month *treatment* (which lunar month number a leap-month birth uses as Mệnh/Thân's `tháng` input) is separately `UNSOURCED` — see DECISION-03. |
| EXPERT REVIEW REQUIRED? | Not for the astronomy. **Yes** for the Tử-Vi-specific leap-month-as-input convention. |

### 2.2 Can Chi

| Field | Value |
|---|---|
| RULE_ID | TUVI-CAND-02 |
| INPUT | Lunar year/month/day |
| OUTPUT | Can Chi (sexagenary pair) for year, month, day |
| CANONICAL REPRESENTATION | Standard sexagenary arithmetic once the calendar layer is trusted |
| PRIMARY SOURCE | Mechanically derived, not independently re-derived from VDTTL-1956 this sprint |
| PAGE | N/A |
| CURRENT STATUS | `RESOLVED_BY_SOURCE` (mechanical, non-disputed) |
| KNOWN CONFLICT | None |
| EXPERT REVIEW REQUIRED? | No |

### 2.3 Giờ (hour)

| Field | Value |
|---|---|
| RULE_ID | TUVI-04 |
| INPUT | Clock time |
| OUTPUT | Hour branch (Tý…Hợi) |
| CANONICAL REPRESENTATION | 23:00–01:00 → Tý (undivided); Sửu 1–3; Dần 3–5; Mão 5–7; Thìn 7–9; Tỵ 9–11; Ngọ 11–13; Mùi 13–15; Thân 15–17; Dậu 17–19; Tuất 19–21; Hợi 21–23 |
| PRIMARY SOURCE | VDTTL-1956, "4. ĐỊNH GIỜ" |
| PAGE | 6 |
| CURRENT STATUS | `SOURCE_EXTRACTED` (hour-label half only) |
| KNOWN CONFLICT | **Day-boundary half is a separate, unresolved sub-question**: which civil/lunar day a 23:00–00:59 birth is assigned to for day-dependent calculations (Cục, Tử Vi anchor). Not stated anywhere in VDTTL-1956 Part 1 (pp.5–17, 24–26 exhaustively checked). A non-VDTTL, non-astrology source (`thienvanvietnam.org`) supports midnight rollover as the general modern Vietnamese civil/lunar convention — this is a *recommendation*, not a VDTTL-1956-specific finding. |
| EXPERT REVIEW REQUIRED? | **Yes — Expert Question 3.** |

### 2.4 Mệnh

| Field | Value |
|---|---|
| RULE_ID | TUVI-05 |
| INPUT | Lunar birth month, birth-hour branch |
| OUTPUT | Mệnh palace |
| CANONICAL REPRESENTATION | Reference palace R = Dần + (month − 1) steps **forward** (thuận). Mệnh = R − (hour-branch index) steps **backward** (nghịch), i.e. `R_index − B (mod 12)`, where B = 0 for Tý, 1 for Sửu, … 11 for Hợi, and R_index = ((month + 1) mod 12) + 1 in the book's own 1(Tý)…12(Hợi) fixed-palace indexing. |
| PRIMARY SOURCE | VDTTL-1956, "5. AN MỆNH" |
| PAGE | 6 |
| CURRENT STATUS | `SOURCE_EXTRACTED` for direction/structure (verbatim primary text). The specific mod-12 arithmetic above is this document's own restatement of that verbatim structure, not a separately-sourced formula. |
| KNOWN CONFLICT | A different, secondary-sourced numeric formula (`SECONDARY-TVSG-MENH-THAN`) mixes two different hour-indexing bases in its own worked example — internally inconsistent with VDTTL-1956's single continuous Dần=1 counting description. **Do not implement from the secondary formula alone.** |
| EXPERT REVIEW REQUIRED? | **Yes — Expert Question 4.** |

### 2.5 Thân

| Field | Value |
|---|---|
| RULE_ID | TUVI-06 |
| INPUT | Lunar birth month, birth-hour branch |
| OUTPUT | Thân palace |
| CANONICAL REPRESENTATION | Same Step 1 as Mệnh (reference palace R, forward from Dần). Thân = R + (hour-branch index) steps **forward** (thuận), i.e. `R_index + B (mod 12)`. **Hard invariant:** Thân must resolve to exactly one of 6 palaces — Mệnh, Phúc Đức, Quan Lộc, Thiên Di, Tài Bạch, Thê Thiếp/Phu Quân. Any other result is a defect. |
| PRIMARY SOURCE | VDTTL-1956, "6. AN THÂN" |
| PAGE | 7 |
| CURRENT STATUS | `SOURCE_EXTRACTED` for direction/structure and the 6-palace invariant (both verbatim). |
| KNOWN CONFLICT | Same arithmetic caveat as Mệnh above. |
| EXPERT REVIEW REQUIRED? | **Yes — Expert Question 4.** |

### 2.6 Cục

| Field | Value |
|---|---|
| RULE_ID | TUVI-07 |
| INPUT | Birth-year Can, Mệnh-palace Chi |
| OUTPUT | One of 5 Cục (Thủy Nhị / Mộc Tam / Kim Tứ / Thổ Ngũ / Hỏa Lục) |
| CANONICAL REPRESENTATION | 5×5 table (5 Mệnh-branch row-groups × 5 Can-pair column-groups), reproduced in full in `v1-canonical-ruleset.md` §6 |
| PRIMARY SOURCE | VDTTL-1956, "7. LẬP CỤC" |
| PAGE | 7 |
| CURRENT STATUS | `SOURCE_EXTRACTED`, 30/30 printed cells, second-reviewed clean, cross-checked against one independent pre-existing worked example (Bính year, Mệnh Dậu → Hỏa Lục Cục) |
| KNOWN CONFLICT | None in the Cục *table* itself. The downstream Tử Vi anchor table has one ambiguous cell for Kim Tứ Cục specifically (see §2.8). |
| EXPERT REVIEW REQUIRED? | No, for the table itself. |

### 2.7 12 Cung

| Field | Value |
|---|---|
| RULE_ID | TUVI-01 |
| INPUT | — (fixed structure) |
| OUTPUT | 12 physical palace positions, 1(Tý)…12(Hợi), clockwise |
| CANONICAL REPRESENTATION | Fixed layout per the book's own diagram |
| PRIMARY SOURCE | VDTTL-1956, "1. ĐỊNH CUNG" |
| PAGE | 5 |
| CURRENT STATUS | `SOURCE_EXTRACTED`, not disputed anywhere in this project's research |
| KNOWN CONFLICT | None |
| EXPERT REVIEW REQUIRED? | No |

### 2.8 Tử Vi anchor

| Field | Value |
|---|---|
| RULE_ID | TUVI-08 |
| INPUT | Cục, lunar birth day |
| OUTPUT | Tử Vi's palace |
| CANONICAL REPRESENTATION | 5-Cục × ~30-lunar-day table, full reproduction in `vdttl-1956-extraction.md` TUVI-08 |
| PRIMARY SOURCE | VDTTL-1956, "8. AN SAO" per-Cục tables |
| PAGE | 7–8 |
| CURRENT STATUS | `SOURCE_EXTRACTED`. 4 of 5 Cục blocks (Thủy Nhị, Mộc Tam, Thổ Ngũ, Hỏa Lục) clean 30/30 bijections, second-review-confirmed. Kim Tứ Cục has one ambiguous cell: day 21 is printed in both the Thìn cell and the Mùi cell; day 24 does not appear anywhere. |
| KNOWN CONFLICT | `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`. An independently-sourced, pre-validated quotient/remainder formula computes day 21→Thìn (matches printed) and day 24→Mùi (printed cell instead shows "21" where "24" is expected) — see `vdttl-1956-second-review.md` §5. |
| EXPERT REVIEW REQUIRED? | **Yes — Expert Question 1 (Kim Tứ Cục only).** |

### 2.9 14 Chính Tinh

| Field | Value |
|---|---|
| RULE_ID | TUVI-09, TUVI-10, TUVI-11 |
| INPUT | Tử Vi's palace (from §2.8), Thiên Phủ's palace (mirrored from Tử Vi per TUVI-11) |
| OUTPUT | Palace for each of the 14 chính tinh |
| CANONICAL REPRESENTATION | **Literal mod-12 offset tables**, anchor + offset mod 12 — see §4 below for why this, not a "walk clockwise/counterclockwise" procedural loop, is the canonical form. Tử Vi group (from Tử Vi=0): Liêm Trinh +4, Thiên Đồng +7, Vũ Khúc +8, Thái Dương +9, Thiên Cơ +11. Thiên Phủ group (from Thiên Phủ=0): Thái Âm +1, Tham Lang +2, Cự Môn +3, Thiên Tướng +4, Thiên Lương +5, Thất Sát +6, Phá Quân +10. Thiên Phủ itself mirrors Tử Vi across the Dần–Thân axis (coincide at Dần/Thân). |
| PRIMARY SOURCE | VDTTL-1956, "8.1 Tử Vi tinh hệ" / "8.2 Thiên Phủ tinh hệ" |
| PAGE | 7 (Tử Vi group), 9 (Thiên Phủ group + mirror table) |
| CURRENT STATUS | `SOURCE_EXTRACTED`, all 14 offsets second-review-confirmed at high zoom, twice. Offsets additionally corroborated by an independent adversarial source (`mingming3.com`) once decoded to actual palace positions — see §4. |
| KNOWN CONFLICT | The primary text's own direction *label* ("thuận," both groups) conflicts with a mainstream external source's direction *labels* (opposite for the two groups) — but the **decoded numeric offsets agree exactly** across both sources. Labeling question open; offset values are not in dispute. Thiên Phủ mirror axis (Dần–Thân, not Tị–Hợi) is at slightly lower confidence — grid-decoded, not a direct textual statement. |
| EXPERT REVIEW REQUIRED? | Recommended, non-blocking (offsets already corroborated two ways) — direction-label origin and Thiên Phủ mirror-axis confirmation would still benefit from expert sign-off. |

### 2.10 Auxiliary V1 stars (13)

All by rule ID `TUVI-12` through `TUVI-24` (subset), PAGE 9–13, PRIMARY SOURCE VDTTL-1956 §8.4–8.10, STATUS `SOURCE_EXTRACTED`, KNOWN CONFLICT none, EXPERT REVIEW REQUIRED recommended but non-blocking (no sourcing objection found):

| Star(s) | Basis | Rule |
|---|---|---|
| Lộc Tồn | Year-Can, 10-cell table | Giáp→Dần, Ất→Mão, Bính→Tỵ, Đinh→Ngọ, Mậu→Tỵ, Kỷ→Ngọ, Canh→Thân, Tân→Dậu, Nhâm→Hợi, Quý→Tý |
| Kình Dương, Đà La | Lộc Tồn ±1 | Kình Dương = Lộc Tồn +1; Đà La = Lộc Tồn −1 |
| Địa Không, Địa Kiếp | Hour, from Hợi | Both start Hợi=giờ Tý reference; Địa Kiếp counts forward, Địa Không counts backward to birth hour |
| Hỏa Tinh, Linh Tinh | Year-Chi group × gender/yin-yang | 4 starting-palace groups, forward/backward count depends on dương nam/âm nữ vs. âm nam/dương nữ |
| Tả Phù, Hữu Bật | Lunar month | Tả Phù: Thìn=month 1, forward. Hữu Bật: Tuất=month 1, backward |
| Văn Xương, Văn Khúc | Hour | Văn Xương: Tuất=giờ Tý, backward. Văn Khúc: Thìn=giờ Tý, forward |
| Thiên Khôi, Thiên Việt | Year-Can, 10-cell table | Giáp/Mậu→Sửu/Mùi; Ất/Kỷ→Tý/Thân; Canh/Tân→Ngọ/Dần; Bính/Đinh→Hợi/Dậu; Nhâm/Quý→Mão/Tỵ |

### 2.11 Tuần

| Field | Value |
|---|---|
| RULE_ID | TUVI-26 |
| INPUT | Birth-year Can-decade group |
| OUTPUT | 2 palaces |
| CANONICAL REPRESENTATION | 6-row table, `v1-canonical-ruleset.md` §11 |
| PRIMARY SOURCE | VDTTL-1956, "8.37.1" |
| PAGE | 16–17 |
| CURRENT STATUS | `SOURCE_EXTRACTED`, cross-checked clean against its own worked example (Bính Dần → Tuất-Hợi) |
| KNOWN CONFLICT | None |
| EXPERT REVIEW REQUIRED? | No |

### 2.12 Triệt

| Field | Value |
|---|---|
| RULE_ID | TUVI-27 |
| INPUT | Birth-year Can-pair group |
| OUTPUT | 2 palaces |
| CANONICAL REPRESENTATION | 5-row table, `v1-canonical-ruleset.md` §12 |
| PRIMARY SOURCE | VDTTL-1956, "8.37.2" |
| PAGE | 17 |
| CURRENT STATUS | `SOURCE_EXTRACTED` for the table |
| KNOWN CONFLICT | `PRIMARY_SOURCE_PRINTING_ERROR_LIKELY`. Table says Ất/Canh → Mùi-Ngọ; the book's own worked example ("Sinh năm Canh Ngọ") gives Thân-Dậu (the Giáp/Kỷ row's value) instead. An independent modern reference (`tracuutuvi.com`) matches the table, not the example. |
| EXPERT REVIEW REQUIRED? | **Yes — Expert Question 2.** |

### 2.13 Tứ Hóa

| Field | Value |
|---|---|
| RULE_ID | TUVI-25 |
| INPUT | Birth-year Can |
| OUTPUT | 4 star→transformation assignments (Lộc, Quyền, Khoa, Kỵ) |
| CANONICAL REPRESENTATION | 10×4 table, `v1-canonical-ruleset.md` §13 |
| PRIMARY SOURCE | VDTTL-1956, "8.23" |
| PAGE | 13–14 |
| CURRENT STATUS | `SOURCE_EXTRACTED`, 40/40 cells, second-review-confirmed, cross-checked against its own worked example (Đinh year) |
| KNOWN CONFLICT | None internally. Alignment with the separately-named Bắc Phái/Nam Phái school distinction is not established and not needed (VDTTL-1956 is locked as V1 regardless). |
| EXPERT REVIEW REQUIRED? | No |

---

## 3. Direction-label handling policy

Per this task's explicit instruction: **direction labels (clockwise, counterclockwise, thuận, nghịch) are never encoded as canonical computational truth for the 14 Chính Tinh where offsets are already available.**

- The canonical representation for every chính-tinh placement is `anchor + offset (mod 12)`, using the literal offset tables in §2.9.
- Historical direction wording ("thuận," "nghịch," "clockwise," "counterclockwise") is preserved only as **source notes** — useful for a human cross-checking against the book's own prose, never as an instruction a future engine executes.
- **Reason:** `vdttl-1956-second-review.md` §1 found that VDTTL-1956's own "thuận" label and an external adversarial source's "clockwise/counterclockwise" labels disagree for the Tử Vi group, while the **decoded numeric offsets agree exactly** once each description is converted to an actual palace position. Encoding direction labels directly into an engine would risk building a "plausible but completely wrong chart" — exactly the failure mode this project's sourcing discipline exists to prevent — even though the underlying data is not actually in conflict. Encoding literal offsets sidesteps this ambiguity entirely.
- This policy applies to the 14 chính tinh (§2.9) and to any auxiliary star (§2.10) whose rule is stated as a directional walk — those are likewise recorded as forward/backward step counts, not loop instructions keyed to a direction flag.

---

## 4. Four expert questions

Each question is designed to be answerable in one sitting, without requiring the expert to read the full extraction documents first (though they may, and the underlying evidence is linked for anyone who wants to).

### QUESTION 1 — Kim Tứ Cục

**Show:**
- Primary-source printed value: Kim Tứ Cục's Mùi cell reads "14 - 21 - 27" (VDTTL-1956, p.8). The Thìn cell reads "2 - 12 - 15 - 21" (also p.8). Day 21 is thus printed in *both* cells; day 24 does not appear in the Kim Tứ Cục table at all — the only such gap across all 5 Cục tables, each otherwise a clean 1–30 bijection.
- Formula-derived/corroborated value: an independently-sourced quotient/remainder Tử-Vi-placement formula (validated first against two already-unambiguous VDTTL-1956 data points — Thủy Nhị Cục day 8→Tỵ and day 1→Sửu, both reproduced exactly) computes day 21→Thìn (matches the printed Thìn cell) and day 24→Mùi (the printed Mùi cell shows "21" where "24" is expected).
- Exact affected lunar day: **day 24** (day 21's placement in Thìn is not in dispute; only where day 24 belongs is).
- Exact affected palace: **Mùi** (candidate correction) vs. the printed "no day 24 anywhere" gap.

**Ask expert to select:**
- A. The printed value is correct (day 24 belongs elsewhere, or the gap itself is intentional/misread)
- B. The corrected value is correct (day 24 → Mùi, per the formula)
- C. Another value (please state which palace)
- D. Cannot determine

### QUESTION 2 — Triệt

**Show:**
- VDTTL-1956 table result: Can-pair "Ất, Canh" → Triệt at Mùi, Ngọ (p.17).
- VDTTL-1956 worked-example result: "Sinh năm Canh Ngọ an Triệt ở giữa cung Thân và cung Dậu" (p.17) — i.e. for the same Can (Canh), the book's own example gives Thân, Dậu instead — which is actually the *Giáp, Kỷ* row's value.
- Independent corroborating result: `tracuutuvi.com` (modern Vietnamese Tử Vi reference, unconnected to VDTTL-1956) states "Thiên can Ất và Canh: an Triệt tại Ngọ và Mùi" — matching the table, not the worked example.

**Ask which should be canonical under VDTTL-1956 V1:**
- A. The table (Mùi, Ngọ)
- B. The worked example (Thân, Dậu)
- C. Neither — state the correct rule
- D. Cannot determine

### QUESTION 3 — Giờ Tý day rollover

VDTTL-1956 states Tý is a single, undivided 23:00–01:00 hour-branch window (p.6, confirmed, not in dispute). What is **not** stated anywhere found in this source is which *civil/lunar day* a birth in that window belongs to for day-dependent calculations (Cục input, Tử Vi anchor's lunar-day input).

**Ask separately:**
1. For a birth at **23:30** Vietnam time, which civil/lunar day and day Can Chi should the V1 engine use — the day that is ending, or the day that is beginning?
2. For a birth at **00:30** Vietnam time, which civil/lunar day and day Can Chi should the V1 engine use?

(A "yes, midnight rollover" answer to both means 23:30 uses the day that is ending and 00:30 uses the day that has already begun — i.e., the two answers differ by one calendar day despite both falling in the same Tý hour-branch. A "no rollover" / "Giờ Tý Sơ spans one full day" answer would mean both times use the same day.)

### QUESTION 4 — Mệnh / Thân

**Candidate formula** (structure confirmed from VDTTL-1956's own prose, p.6–7; arithmetic is this document's own restatement, not separately source-verified):

```
Reference palace R = Dần + (tháng − 1) steps forward (thuận)
Mệnh = R − (giờ) steps backward (nghịch)
Thân = R + (giờ) steps forward (thuận)
```
where `tháng` = lunar birth month (1–12) and `giờ` = birth-hour branch, counted Tý=0…Hợi=11.

**Ask the expert to independently compute Mệnh and Thân** for the following concrete inputs, ideally **without being shown our own computed answer first**:

| # | Lunar month | Hour branch | Notes |
|---|---|---|---|
| a | Tháng Giêng (1) | Giờ Tý | Simplest case — reference palace = Mệnh's own starting point |
| b | Tháng 6 | Giờ Ngọ | Mid-cycle case |
| c | Tháng 11 | Giờ Sửu | Tests wraparound near the Tý/Sửu boundary |
| d | Tháng 12 | Giờ Hợi | Tests wraparound at both ends simultaneously |

For each, report: which palace Mệnh lands in, which palace Thân lands in, and whether Thân falls within the 6 legally-allowed palaces (Mệnh, Phúc Đức, Quan Lộc, Thiên Di, Tài Bạch, Thê Thiếp/Phu Quân) per VDTTL-1956's own stated invariant (p.7).

---

## 5. Evidence package

For each of the four disputed questions:

| Question | Source | Printed page | Scan page (archive.org `dv01.pdf`) | Table/rule | Exact conflict |
|---|---|---|---|---|---|
| Q1 Kim Tứ Cục | VDTTL-1956, "8. AN SAO," Kim Tứ Cục block | 8 | `_0007` (jp2 derivative) | Tử Vi anchor table | Day 21 duplicated (Thìn + Mùi cells); day 24 missing |
| Q2 Triệt | VDTTL-1956, "8.37.2" | 17 | — | Triệt table vs. worked example | Ất/Canh row (table) vs. Canh-Ngọ example both claim different palace pairs for the same Can |
| Q3 Giờ Tý | VDTTL-1956, "4. ĐỊNH GIỜ" + full Part 1 search | 6 (hour rule); absent from 5–17, 24–26 (day-boundary rule) | — | Định Giờ table | Hour-label rule present; day-boundary rule confirmed absent from this source, not merely unconfirmed |
| Q4 Mệnh/Thân | VDTTL-1956, "5. AN MỆNH" / "6. AN THÂN" | 6–7 | — | An Mệnh / An Thân prose | Direction/structure confirmed; no primary-text numeric worked example found in pp.1–17 to verify the exact mod-12 arithmetic |

Corroborating sources cited for Q1/Q2 (secondary, Level C, not VDTTL-1956 itself):
- Q1: independently-sourced quotient/remainder formula, origin unrelated to VDTTL-1956, pre-validated against 2 clean VDTTL-1956 data points before being applied — full derivation in `vdttl-1956-second-review.md` §5.
- Q2: `tracuutuvi.com/tuan-triet.html`, directly fetched, no shared authorship/citation chain with any source already on file — full account in `vdttl-1956-second-review.md` §6.
- Q3: `thienvanvietnam.org` (Vietnam Astronomical Society) — a calendrical-science source, not an astrology site, describing the general modern Vietnamese civil/lunar convention, not a VDTTL-1956-specific statement.

No screenshot/page-image reproduction is included in this document (copyright caution — the source is a 1956 book with modern reprint rights of unclear status); page/section citations above are sufficient for anyone with access to the same archive.org item to navigate directly to the disputed cells.

---

## 6. Reviewer qualification requirements

**Minimum:**
- Vietnamese fluent (the source text and all corroborating sources are Vietnamese-language).
- Demonstrable experience lập lá số Tử Vi (constructing Tử Vi charts by hand or by trusted reference, not just reading interpretations).
- Able to state which school/convention they personally use (even if it is VDTTL-1956 itself, or a variant) — this matters because a "correct" answer from a different school's convention is not automatically a correct VDTTL-1956 V1 answer, and any divergence must be recorded, not silently absorbed.
- Willing to return deterministic placements (palace positions, Cục, Tuần/Triệt palaces, Tứ Hóa assignments) — not only narrative interpretation.
- Willing to flag disagreements explicitly rather than adapting their answer toward what they assume we want to hear.

**Preferred, not required:**
- Familiarity specifically with VDTTL-1956 / Vân Đằng Thái Thứ Lang's work.
- Access to and willingness to consult printed/reference texts (their own copy of VDTTL-1956 or another primary/near-primary text) rather than working from memory alone.

No academic credential (degree, certification) is required or expected — none exists for this domain in a form that would meaningfully gate reviewer quality here.

---

## 7. Blind review design — pointer

Two companion packs implement the blind-review design (§7 of the governing task):

- **Pack A (expert blind pack):** `expert-blind-golden-vector-pack.md` — 15 input-only vectors, requested output fields, and the four questions above, **with no candidate/computed expected chart values shown.** This is the pack that should go to the expert first.
- **Pack B (internal comparison pack):** `golden-vector-comparison-matrix.md` — the internal comparison schema, reviewer-A/reviewer-B tracking table, and rule-ID references (not computed candidate chart values — see that document's own note on why full candidate charts are not pre-computed here). Used only *after* the expert's Pack A responses are in hand.

**Confirmed: no expected values are pre-populated anywhere in Pack A.** See `expert-blind-golden-vector-pack.md`'s own header for the explicit statement.

---

## 8. Second reviewer design and vector acceptance rule

**Golden vector acceptance requires** (per the governing task, non-negotiable):
- Reviewer A + Reviewer B, **or**
- Expert A + an independent trusted chart/source.

**Per-vector tracking fields:** `REVIEWER_A`, `REVIEWER_B`, `MATCH_STATUS`, `DISAGREEMENTS`, `RESOLUTION`.

**Allowed `MATCH_STATUS` values:** `PENDING`, `REVIEWER_A_COMPLETE`, `CROSS_CHECK_PENDING`, `CROSS_CHECKED`, `EXPERT_CONFIRMED`, `CONFLICT`.

**Only `CROSS_CHECKED` and `EXPERT_CONFIRMED` count toward the ≥12-vector gate.**

**Acceptance rule:** a vector is accepted only when **all** deterministic fields required for that vector agree between reviewers. Partial agreement (e.g., Cục matches, Tử Vi matches, but one auxiliary star or Tuần/Triệt disagrees) does **not** count the vector as accepted — record the field-level disagreement and set `MATCH_STATUS = CONFLICT`. One unresolved deterministic disagreement is sufficient to keep a vector out of the gate count, no matter how many other fields matched.

The live tracking table for all 15 candidate vectors is in `golden-vector-comparison-matrix.md`, currently entirely `PENDING`.

---

## 9. Post-expert procedure

Once expert results arrive, **do not immediately code.** Required sequence:

1. Import expert responses into the verification docs (`expert-blind-golden-vector-pack.md`'s output fields, `golden-vector-comparison-matrix.md`'s tracking table).
2. Compare field-by-field against `TUVI_RULESET_CANDIDATE_V1` (this document, §2) — this is the first point at which candidate rule values are compared against expert answers, consistent with the blind-review design in §7.
3. Resolve discrepancies — for each, determine whether the candidate ruleset, the expert's answer, or neither is correct, with reasoning recorded, not silently picked.
4. Obtain second review (Reviewer B or an independent trusted source) per §8.
5. Promote ≥12 vectors to `CROSS_CHECKED` / `EXPERT_CONFIRMED`.
6. Re-run the An Sao Logic Audit (`an-sao-logic-audit.md`) against the now-verified ruleset.
7. Freeze `TUVI_RULESET_V1` (drop the `_CANDIDATE` designation) only after steps 1–6 are complete.
8. Only then open Sprint 18B.

No step in this sequence may be skipped or reordered under schedule pressure.

---

## 10. Vietnamese expert instruction sheet

*(See also `expert-blind-golden-vector-pack.md` for the full Vietnamese-language cover instructions distributed with Pack A. The version below is the concise standalone sheet.)*

**HƯỚNG DẪN CHUYÊN GIA — RÀ SOÁT LÁ SỐ TỬ VI (VDTTL-1956, phiên bản V1)**

1. Đây là bộ quy tắc "an sao" (lập lá số) theo trường phái **Vân Đằng Thái Thứ Lang — Tử Vi Đẩu Số Tân Biên (1956)**, đã được người sáng lập dự án khóa làm phiên bản V1. Chúng tôi **không** yêu cầu quý vị luận giải vận mệnh, tính cách, hay dự đoán — chỉ cần các **vị trí an sao xác định** (cung Mệnh, cung Thân, Cục, vị trí 14 chính tinh, sao phụ, Tuần, Triệt, Tứ Hóa).
2. Vui lòng lập lá số **theo đúng cách quý vị vẫn làm**, dựa trên ngày giờ sinh cung cấp — **không** điều chỉnh kết quả để cố khớp với bất kỳ bảng nào của chúng tôi. Nếu kết quả của quý vị khác với những gì quý vị đoán là "đáp án mong đợi," xin cứ ghi đúng như quý vị tính được.
3. Nếu quý vị thường dùng một trường phái khác (không phải VDTTL-1956) hoặc một quy ước khác (ví dụ: giờ Tý phân "Sơ/Chính" khác với chúng tôi mô tả), xin **nêu rõ** trường phái/quy ước đó, thay vì âm thầm áp dụng và không ghi chú.
4. Nếu một quy tắc cụ thể của quý vị khác với quy tắc chúng tôi đã trích từ VDTTL-1956 (được liệt kê trong tài liệu này), xin ghi rõ điểm khác biệt — đây chính xác là loại thông tin chúng tôi cần nhất.
5. Xin **không** áp dụng các quy tắc Nạp Âm hoặc Ngũ Hành Phương Đông (Đông phương horoscope) — đây là một hệ thống khác, không liên quan đến Tử Vi Đẩu Số, và việc thay thế âm thầm sẽ làm sai lệch toàn bộ kết quả.
6. Giờ sinh chính xác rất quan trọng — xin xử lý các trường hợp ranh giới (23:xx, 00:xx) một cách cẩn thận và ghi rõ cách quý vị xử lý ranh giới ngày âm lịch, vì đây là một trong bốn câu hỏi trọng tâm của bộ tài liệu này.
7. Chúng tôi cần **vị trí an sao xác định** (deterministic placements), không chỉ phần luận giải — xin điền đầy đủ các trường vị trí cung, kể cả khi quý vị cũng muốn ghi thêm nhận xét luận giải.
8. Nếu có bất kỳ điểm nào quý vị không chắc chắn hoặc thấy mâu thuẫn trong nguồn tài liệu, xin đánh dấu rõ "không chắc chắn" thay vì đoán — điều này giúp chúng tôi hơn nhiều so với một câu trả lời tự tin nhưng có thể sai.

Xin cảm ơn quý vị đã dành thời gian rà soát.

---

## 11. Files in this pack

- `docs/domain/tu-vi/expert-review-pack.md` — this document.
- `docs/domain/tu-vi/expert-blind-golden-vector-pack.md` — Pack A, sent to expert first.
- `docs/domain/tu-vi/golden-vector-comparison-matrix.md` — Pack B, internal use after Pack A returns.
- `docs/domain/tu-vi/sprint-18b-entry-gate.md` — the machine-checkable Sprint 18B entry checklist.
- `docs/progress/sprint-18a4-expert-pack-final-report.md` — this sprint's final report.
