# Tử Vi Expert Blind Golden-Vector Pack (Pack A) — Sprint 18A.4

**Date:** 2026-08-21
**Status:** `CANDIDATE_PENDING_EXPERT_VERIFICATION`. **This pack does NOT contain any pre-computed expected chart values.** Every output field below is blank, to be filled in solely by the reviewing expert, independently, using their own knowledge/method.
**Companion documents:** `expert-review-pack.md` (ruleset, 4 questions, evidence, Vietnamese instructions), `golden-vector-comparison-matrix.md` (internal-only, do not send to the expert).

---

## HƯỚNG DẪN GỬI KÈM (Vietnamese cover instructions — send this page with the pack)

Kính gửi chuyên gia,

Đây là 15 trường hợp sinh (ngày giờ dương lịch, giới tính) để quý vị lập lá số Tử Vi Đẩu Số **theo cách quý vị vẫn làm**, không xem trước bất kỳ đáp án hay bảng tính nào của chúng tôi. Với mỗi trường hợp, xin điền vào các trường trống ở mục "KẾT QUẢ CHUYÊN GIA" bên dưới mỗi trường hợp.

**Xin lưu ý:**
- Chúng tôi cần vị trí an sao xác định (Mệnh, Thân, Cục, 14 chính tinh, sao phụ, Tuần, Triệt, Tứ Hóa) — không cần luận giải vận mệnh.
- Nếu quý vị dùng trường phái/quy ước khác VDTTL-1956 (Vân Đằng Thái Thứ Lang, 1956), xin ghi rõ.
- Xin xử lý cẩn thận giờ sinh gần ranh giới 23:00/00:00 và ranh giới Tết âm lịch — một vài trường hợp dưới đây cố ý rơi vào các ranh giới này.
- Sau khi quý vị hoàn thành phần này một cách độc lập, chúng tôi sẽ mới đối chiếu với bộ quy tắc ứng viên của chúng tôi (không làm trước, để tránh làm sai lệch kết quả của quý vị).
- Ngoài 15 trường hợp, có 4 câu hỏi riêng ở cuối tài liệu — xin trả lời cả 4 câu.

Xin chân thành cảm ơn.

---

## Output field template (repeated per vector)

```
INPUT
----------------
Gregorian date:
Time:
Timezone:
Sex:

EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...
- ...

13 Auxiliary V1:
- ...
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## Coverage this 15-vector slate is designed to exercise

| Coverage requirement | Vector(s) |
|---|---|
| All 5 Cục | V7/V8 (Kim Tứ), V9 (Mộc Tam), V10 (Thổ Ngũ), V11 (Hỏa Lục), V1/V2/V3–V6/V12–V15 (Thủy Nhị or others, outcome TBD by actual computation) |
| Multiple Heavenly Stems (Can) | All 10 Can represented across V1–V15 (see rationale per vector) |
| Multiple Chi / branches | Year, month, and hour branches spread across all 15 (11 of 12 hour-branches directly exercised) |
| Multiple lunar months | V1–V15 spread across Gregorian months (approximate lunar-month spread) |
| Multiple birth hours | 11 distinct hour branches used directly as the birth hour across the slate |
| Male/female | 8 Nam, 7 Nữ, alternating |
| Tý hour | V1, V2 |
| 23:xx boundary | V1 (23:30) |
| 00:xx boundary | V2 (00:30), paired same-week as V1 |
| Lunar New Year boundary | V3 (pre-Tết 2023), V4 (post-Tết 2023) |
| Leap lunar month | V5 (2020 leap month 4), V6 (2023 leap month 2, exit boundary) |
| Tử Vi anchor edge/wrap case | V7, V8 (Kim Tứ Cục days 21/24 region) |
| Main-star offset wraparound | V14 |
| Tuần | V12, V13 (different decade-groups) |
| Triệt | V12 (deliberately reproduces the book's own disputed Canh-Ngọ case) |
| All four Tứ Hóa | Automatic — all 10 Can represented, and Tứ Hóa is a pure Can-indexed table |
| Mệnh/Thân variation, incl. coincidence | V15 (designed target: Mệnh = Thân) |

**Important honesty note:** every "design target" below (intended Mệnh branch, intended Cục) is derived from applying VDTTL-1956's own *verbatim, source-confirmed counting method* (TUVI-05/06 — forward-to-month, then forward-or-backward-to-hour) and the Cục lookup table (TUVI-07) by hand, for the sole purpose of choosing well-reasoned rather than random inputs. **This is not an assertion that the target is the correct/actual result** — it is exactly the kind of hand-reasoning a human test-designer does to pick informative cases, not an engine implementation, and it does not use the disputed numeric formula from `SECONDARY-TVSG-MENH-THAN`. The exact lunar month/day for each Gregorian date below has **not** been computed against the real solar↔lunar calendar algorithm (`HND-ALGORITHM`) — only the birth-year Can-Chi is asserted with reasonable confidence (derived from well-documented Tết/Lunar-New-Year dates). Whether each design target is actually hit is precisely what the expert's independent computation will reveal.

---

## VECTOR-01 — Giờ Tý, 23:xx side of the day boundary

```
INPUT
----------------
Gregorian date: 1983-06-15
Time: 23:30
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam (Male)
```

**WHY_THIS_VECTOR_EXISTS:** Directly tests Expert Question 3 (Giờ Tý day rollover). 23:30 falls within VDTTL-1956's undivided Tý hour-branch (TUVI-04, confirmed) but the civil/lunar *day* used for day-dependent calculations (Cục, Tử Vi anchor) for this exact clock time is the open question. Paired with VECTOR-02 (same calendar week, one hour later) so the two answers can be directly compared.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-02 — Giờ Tý, 00:xx side of the day boundary

```
INPUT
----------------
Gregorian date: 1983-06-16
Time: 00:30
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nữ (Female)
```

**WHY_THIS_VECTOR_EXISTS:** Companion to VECTOR-01. Same clock-hour label (Tý) as V1, one calendar day later by the clock, one hour after V1. If the expert's method treats V1 and V2 as the *same* lunar day, that supports the "no midnight rollover" model; if *different* lunar days, that supports the midnight-rollover model this project's calendar layer already assumes for other purposes (see `expert-review-pack.md` §2.3).

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-03 — Lunar New Year boundary, pre-Tết side

```
INPUT
----------------
Gregorian date: 2023-01-21
Time: 12:00
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam
```

**WHY_THIS_VECTOR_EXISTS:** 2023-01-22 was Tết Quý Mão. This date is the day immediately before — still lunar year Nhâm Dần (Can Nhâm). Tests the calendar layer at the single highest-density solar/lunar mismatch window (`golden-vector-specification.md` boundary matrix), which flows directly into every Can-dependent rule (Cục, Tứ Hóa, Thiên Khôi/Việt, Lộc Tồn, Kình/Đà). Paired with VECTOR-04.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-04 — Lunar New Year boundary, post-Tết side

```
INPUT
----------------
Gregorian date: 2023-01-23
Time: 12:00
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nữ
```

**WHY_THIS_VECTOR_EXISTS:** Companion to VECTOR-03, one day later — already lunar year Quý Mão (Can Quý). If the year-Can-Chi flips between V3 and V4 but nothing else about the input changed except the date, that isolates the Tết rollover cleanly and makes any downstream error easy to attribute.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-05 — Leap lunar month, interior date

```
INPUT
----------------
Gregorian date: 2020-05-10
Time: 10:00
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam
```

**WHY_THIS_VECTOR_EXISTS:** The Vietnamese lunar year 2020 (Canh Tý) contains a documented leap 4th month, solar-approximately late April–late May 2020. This date falls within that window. Tests DECISION-03 (Tử-Vi-specific leap-month treatment), currently `UNSOURCED` — specifically, which lunar month number the engine uses as Mệnh/Thân's `tháng` input for a leap-month birth.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-06 — Leap lunar month, exit-boundary date

```
INPUT
----------------
Gregorian date: 2023-03-21
Time: 18:00
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nữ
```

**WHY_THIS_VECTOR_EXISTS:** The Vietnamese lunar year 2023 (Quý Mão) contains a documented leap 2nd month, solar-approximately 2023-02-20 to 2023-03-21. This date sits at the tail end of that window — the "leap month exiting" row of `golden-vector-specification.md`'s boundary matrix, a distinct edge case from VECTOR-05's interior date.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-07 — Kim Tứ Cục target, design A

```
INPUT
----------------
Gregorian date: 1988-09-10
Time: 05:30
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 1988 = Mậu Thìn (Can Mậu). Per the Cục table (TUVI-07), Can Mậu paired with a Mệnh palace in the "Tý, Sửu" row yields **Kim Tứ Cục**. Month/hour chosen as a design target intended to land Mệnh in Tý or Sửu (via the source-confirmed forward/backward counting method) — actual placement depends on the real lunar month for this date, not asserted here. **This vector is the most direct probe for Expert Question 1** — if this birth's Tử Vi anchor resolves to lunar day 21 or 24, request the expert explicitly confirm which palace (Thìn or Mùi) it lands in.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-08 — Kim Tứ Cục target, design B (independent Can/branch combination)

```
INPUT
----------------
Gregorian date: 1997-11-20
Time: 15:30
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nữ
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 1997 = Đinh Sửu (Can Đinh). Per the Cục table, Can Đinh paired with a Mệnh palace in the "Dần, Mão, Tuất, Hợi" row also yields **Kim Tứ Cục** — a structurally different Can/palace-group combination than VECTOR-07, so the expert's two independent Kim Tứ Cục answers cross-check each other rather than both depending on the same table cell.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-09 — Mộc Tam Cục target

```
INPUT
----------------
Gregorian date: 2001-05-02
Time: 09:15
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 2001 = Tân Tỵ (Can Tân). Per the Cục table, Can Tân paired with a Mệnh palace in the "Dần, Mão, Tuất, Hợi" row yields **Mộc Tam Cục** — completes Cục coverage with a third distinct Cục value and a fourth distinct Can not otherwise used.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-10 — Thổ Ngũ Cục target

```
INPUT
----------------
Gregorian date: 1985-12-01
Time: 19:45
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nữ
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 1985 = Ất Sửu (Can Ất). Per the Cục table, Can Ất paired with a Mệnh palace in the "Dần, Mão, Tuất, Hợi" row yields **Thổ Ngũ Cục** — the fourth distinct Cục value in this slate.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-11 — Hỏa Lục Cục target (structurally matches the book's own worked example)

```
INPUT
----------------
Gregorian date: 1986-08-14
Time: 21:20
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 1986 = Bính Dần (Can Bính). Per the Cục table, Can Bính paired with a Mệnh palace in the "Thân, Dậu" row yields **Hỏa Lục Cục** — deliberately the same Can/row pattern as VDTTL-1956's own cited worked example (Bính year, Mệnh at Dậu → Hỏa Lục Cục, TUVI-07), giving a fifth, structurally-anchored Cục value and completing coverage of all 5 Cục across VECTOR-07 through VECTOR-11.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-12 — Triệt-focused vector (reproduces the disputed Canh-Ngọ case in a full-chart context)

```
INPUT
----------------
Gregorian date: 1990-11-25
Time: 14:00
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nữ
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 1990 = Canh Ngọ — **the exact same year-Can-Chi as VDTTL-1956's own disputed Triệt worked example.** This is the most direct possible probe for Expert Question 2: whatever the expert independently computes for Triệt here is a full-chart-context, apples-to-apples answer to "table (Mùi-Ngọ) or worked example (Thân-Dậu)?"

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-13 — Tuần-focused vector, distinct decade group

```
INPUT
----------------
Gregorian date: 1974-02-10
Time: 08:00
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 1974 = Giáp Dần (Can Giáp), the "Giáp Dần – Quý Hợi" decade group → Tuần at Tý-Sửu per TUVI-26. Exercises Tuần's table on a cleanly different decade-group than VECTOR-12, and adds Can Giáp (otherwise unused in this slate) for stem-coverage completeness.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-14 — Main-star offset wraparound / dense-palace stress case

```
INPUT
----------------
Gregorian date: 2010-01-08
Time: 03:20
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nữ
```

**WHY_THIS_VECTOR_EXISTS:** This date falls before Tết 2010 (2010-02-14), so the lunar year is still Kỷ Sửu (Can Kỷ), not Canh Dần — a deliberate second Tết-adjacent case, distinct from VECTOR-03/04. Early-month, early-hour design intent (giờ Dần) is chosen so the resulting Tử Vi position is likely to sit close to a palace-index wrap point, stress-testing the mod-12 arithmetic in the 14-chính-tinh offset tables (TUVI-09/10) — the exact place an off-by-one implementation bug would surface. Also completes Can coverage (Kỷ).

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## VECTOR-15 — Mệnh = Thân coincidence target, final Can-coverage close-out

```
INPUT
----------------
Gregorian date: 1965-07-07
Time: 12:00
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Sex: Nam
```

**WHY_THIS_VECTOR_EXISTS:** Birth year 1965 = Ất Tỵ. Midday hour (giờ Ngọ) combined with a mid-year lunar month is designed so the forward-count (Thân) and backward-count (Mệnh) from the same reference palace are likely to coincide, targeting a **Mệnh = Thân** outcome — a valid, named case per TUVI-06 and `golden-vector-specification.md`'s own invariant list ("Thân may coincide with Mệnh — that is a valid, named outcome"), deliberately not tested by any other vector in this slate. Also exercises the Ất row of the Tứ Hóa table.

```
EXPERT EXPECTED OUTPUT
----------------
Lunar date:
Year Can Chi:
Month:
Hour branch:

Mệnh:
Thân:
Cục:

12 palace arrangement:

Tử Vi:

14 Chính Tinh:
- ...

13 Auxiliary V1:
- ...

Tuần:
Triệt:

Tứ Hóa:
Lộc:
Quyền:
Khoa:
Kỵ:

Notes:

EXPERT:
DATE REVIEWED:
SOURCE/METHOD:
CONFIDENCE:
```

---

## Four domain questions (repeated from `expert-review-pack.md` §4 for a self-contained blind pack)

Please answer all four, ideally without re-reading `expert-review-pack.md` first (to preserve independence — read it afterward if you want the full sourcing detail).

**QUESTION 1 — Kim Tứ Cục:** In the Kim Tứ Cục Tử Vi-anchor table, lunar day 21 appears in two different palaces as printed, and day 24 appears in none. Based on your own knowledge/method, where does lunar day 24 belong for Kim Tứ Cục? (A) Trust the printed table as-is / cannot resolve the gap. (B) Day 24 → Mùi. (C) Another palace — please state. (D) Cannot determine.

**QUESTION 2 — Triệt:** For a person born in a Canh (year Can) year, where is Triệt placed? (A) Mùi, Ngọ. (B) Thân, Dậu. (C) Another pair — please state. (D) Cannot determine.

**QUESTION 3 — Giờ Tý day rollover:** For a birth at 23:30 Vietnam time, which civil/lunar day (and day Can Chi) should be used for chart construction? And separately, for a birth at 00:30 Vietnam time — same day as the 23:30 case, or the next day?

**QUESTION 4 — Mệnh/Thân:** Using your own method (not a formula we provide), compute Mệnh and Thân for: (a) lunar tháng Giêng (month 1), giờ Tý; (b) tháng 6, giờ Ngọ; (c) tháng 11, giờ Sửu; (d) tháng 12, giờ Hợi. For each, state which palace Mệnh lands in and which palace Thân lands in.

---

## Confirmation

**Expected values pre-populated in this document: NO.** Every "EXPERT EXPECTED OUTPUT" block above is blank. Every "WHY_THIS_VECTOR_EXISTS" note explains input-selection rationale only — it states design *targets* derived from applying VDTTL-1956's own confirmed counting method and lookup tables by hand (a test-design activity, not an engine execution), never asserts what the actual chart output is, and is clearly separable from the blank output fields the expert is asked to fill in.
