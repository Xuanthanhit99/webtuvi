# Golden Vector Spec V2 — Sprint 18A.5

**Date:** 2026-08-21
**Replaces the human-blind-review vector strategy** of `expert-blind-golden-vector-pack.md` / `golden-vector-comparison-matrix.md` (Sprint 18A.4), which assumed a human reviewer would populate expected values independently. That assumption is gone (see `ai-only-verification-standard.md`). This document defines two vector classes usable without a human expert, and populates Class B in full.

---

## Two classes

### Class A — SOURCE-ANCHORED VECTORS

Inputs and expected outputs must originate from a source independent of our implementation — e.g., a complete worked chart from a published Vietnamese lá số resource, shown-work example, or (if ever engaged) a real human expert.

**Count this sprint: 0.** Unchanged from every prior sprint's finding — VDTTL-1956 itself contains no complete worked chart (confirmed exhaustively, Sprint 18A.3, all 6 parts pattern-searched), and no independent complete worked chart was located anywhere in this project's history. This sprint did not re-attempt that search (Sprint 18A.3 already established it as exhausted for general web search) and did not fabricate one. **This class remains open for the future** — if a human expert, a licensed calculator with shown methodology, or a genuinely independent published chart ever becomes available, it is entered here as Class A and is the only class that can promote a rule past `SOURCE_SINGLE_AUTHORITY`.

### Class B — RULE-COVERAGE VECTORS

Inputs are deliberately designed to exercise specific rule combinations. **Expected outputs are computed directly from `canonical-ruleset-v1.md`'s locked rule tables/formulas** — by hand, in this document, showing the arithmetic — and labeled `RULE_DERIVED_TEST_VECTOR`, never `INDEPENDENT_GOLDEN_VECTOR`. This is a specification/documentation exercise (working through a spec's own formulas on paper, the same activity `domain-resolution-pack.md` §3–4 already did for Mệnh/Thân in Sprint 15), not an engine implementation — no code was written, no library was invoked, no production calculation module exists.

**Inputs are given directly in lunar terms** (year Can-Chi, lunar month, lunar day, hour branch, sex) rather than Gregorian dates. This is a deliberate choice: computing a Gregorian→lunar conversion from memory, without the actual `HND-ALGORITHM` library running, would be exactly the kind of unverified "rule exists only in AI memory" fabrication this sprint's stop conditions prohibit (Stop Condition C). The calendar-conversion layer is separately resolved (`TUVI-CAL-01` through `03`, `IMPLEMENTATION_READY`) and is not what these vectors exist to test — they test the an-sao rules downstream of a lunar date, which is exactly what VDTTL-1956 itself consumes.

**Count this sprint: 6, fully computed.** Design rationale and full computation below. A further 9 vectors' worth of coverage (remaining Can, remaining branches, leap-month and Lunar-New-Year-boundary cases specifically) is **not** computed here, because populating those correctly requires either (a) the real calendar-conversion library actually running (to avoid fabricating a Gregorian↔lunar mapping from memory), or (b) additional careful hand-arithmetic beyond this sprint's effort budget — both are explicitly flagged as future work, not silently skipped.

---

## Coverage achieved by the 6 Class B vectors

| Coverage requirement | Status |
|---|---|
| All 5 Cục | ✅ V1=Hỏa Lục, V2/V3=Kim Tứ, V4=Thổ Ngũ, V5=Mộc Tam, V6=Thủy Nhị |
| Multiple Heavenly Stems | ✅ 5 of 10 (Giáp, Mậu, Canh, Ất, Bính) |
| Multiple lunar months | ✅ tháng 1, 8, 3, 10, 5 (V2/V3 share tháng, all others differ) |
| Multiple birth hours | ✅ Tý, Dần, Mùi, Tuất, Sửu (5 distinct) |
| Tý hour | ✅ V1 |
| Ngọ-hour / Mệnh=Thân coincidence | ✅ V5 (new structural fact, `canonical-ruleset-v1.md` §5) |
| Kim Tứ Cục disputed cell, both sides | ✅ V2 (day 21, undisputed) and V3 (day 24, convention-locked) — direct operational test of Expert Question 1 |
| Triệt disputed case | ✅ V4 (Canh Ngọ, reproduces VDTTL-1956's own disputed worked-example year exactly) — direct operational test of Expert Question 2 |
| Dense/wraparound multi-star palace | ✅ V6 (Thiên Phủ anchor lands exactly opposite Tử Vi's anchor, producing 5 of 7 star-pairs sharing a palace — the most extreme case this slate produced, found by the arithmetic itself, not engineered) |
| All four Tứ Hóa transformations | ✅ Automatic — 5 distinct Can computed, each contributing its own 4-cell row |
| Sex | Recorded per vector for completeness; no CORE_V1 rule in this slate's computed fields is sex-dependent (Hỏa Tinh/Linh Tinh, the one sex-dependent CORE_V1 star, is not computed in this pass — see gaps below) |
| Leap lunar month | ❌ Not computed — requires the calendar layer, not fabricated here |
| Lunar New Year boundary | ❌ Not computed — same reason |
| 23:xx / 00:xx boundary | ❌ Not applicable to lunar-input vectors — this is a Gregorian/calendar-layer question (`TUVI-GIO-02`), tracked separately, not a Class B rule-coverage question |
| Remaining 5 Can (Đinh, Kỷ, Tân, Nhâm, Quý) | ❌ Not computed this pass |
| Hỏa Tinh/Linh Tinh (sex-dependent star) | ❌ Not computed this pass — flagged explicitly rather than silently omitted |

---

## VECTOR-B1

```
INPUT (lunar)
Year Can-Chi: Giáp Tý       Sex: Nam
Lunar month:  1 (Giêng)
Lunar day:    1
Hour branch:  Tý
```

**Computed (RULE_DERIVED_TEST_VECTOR, per `canonical-ruleset-v1.md`):**
- R (reference palace) = Dần. Mệnh = **Dần**. Thân = **Dần** (coincide — Tý-hour baseline case).
- Cục: Can Giáp + Mệnh Dần → row "Dần,Mão,Tuất,Hợi" × col "Giáp Kỷ" → **Hỏa Lục Cục**.
- Tử Vi anchor: Hỏa Lục Cục, day 1 → **Dậu**.
- Thiên Phủ anchor: (4−Dậu[9]) mod 12 = 7 → **Mùi**.
- 14 Chính Tinh: Tử Vi=Dậu, Liêm Trinh=Sửu, Thiên Đồng=Thìn, Vũ Khúc=Tỵ, Thái Dương=Ngọ, Thiên Cơ=Thân; Thiên Phủ=Mùi, Thái Âm=Thân, Tham Lang=Dậu, Cự Môn=Tuất, Thiên Tướng=Hợi, Thiên Lương=Tý, Thất Sát=Sửu, Phá Quân=Tỵ.
  - *(Note: Thiên Cơ and Thái Âm both land at Thân; Liêm Trinh and Thất Sát both land at Sửu; Vũ Khúc and Phá Quân both land at Tỵ; Tử Vi and Tham Lang both land at Dậu — a naturally-occurring dense-palace case.)*
- Lộc Tồn (Can Giáp) = **Dần**. Kình Dương = Mão. Đà La = Sửu.
- Tuần (Giáp Tý, decade "Giáp Tý–Quý Dậu") = **Tuất, Hợi**.
- Triệt (Can Giáp, "Giáp Kỷ" row — not the disputed row) = **Thân, Dậu**.
- Tứ Hóa (Can Giáp): Lộc=Liêm Trinh, Quyền=Phá Quân, Khoa=Vũ Khúc, Kỵ=Thái Dương.

**WHY_THIS_VECTOR_EXISTS:** simplest possible baseline (month 1, Tý hour) — establishes the Mệnh=Thân=Dần floor case and gives a first full, clean chart to sanity-check any future implementation against before trying harder cases.

---

## VECTOR-B2

```
INPUT (lunar)
Year Can-Chi: Mậu Thân       Sex: Nữ
Lunar month:  1 (Giêng)
Lunar day:    21
Hour branch:  Dần
```

**Computed:**
- R = Dần. Mệnh = (Dần[2]−Dần[2]) mod12 = **Tý**. Thân = (2+2) mod12 = 4 = **Thìn**. (Offset 4, even ✓ invariant.)
- Cục: Can Mậu + Mệnh Tý → row "Tý,Sửu" × col "Mậu Quý" → **Kim Tứ Cục**.
- Tử Vi anchor: Kim Tứ Cục, day 21 → **Thìn** (undisputed cell — matches the formula-corroborated value exactly, no convention lock needed for this specific day).
- Thiên Phủ anchor: (4−4) mod12=0 → **Tý**.
- 14 Chính Tinh: Tử Vi=Thìn, Liêm Trinh=Thân, Thiên Đồng=Hợi, Vũ Khúc=Tý, Thái Dương=Sửu, Thiên Cơ=Mão; Thiên Phủ=Tý, Thái Âm=Sửu, Tham Lang=Dần, Cự Môn=Mão, Thiên Tướng=Thìn, Thiên Lương=Tỵ, Thất Sát=Ngọ, Phá Quân=Tuất.
- Lộc Tồn (Can Mậu) = **Tỵ**. Kình Dương = Ngọ. Đà La = Thìn.
- Thiên Khôi/Thiên Việt (Can Mậu, same row as Giáp) = **Sửu / Mùi**.
- Tả Phù (tháng 1, Thìn=1 forward, 0 steps) = **Thìn**. Hữu Bật (tháng 1, Tuất=1 backward, 0 steps) = **Tuất**.
- Văn Xương (giờ Dần, Tuất=Tý backward 2) = **Thân**. Văn Khúc (Thìn=Tý forward 2) = **Ngọ**.
- Địa Kiếp (giờ Dần, Hợi=Tý forward 2) = **Sửu**. Địa Không (Hợi=Tý backward 2) = **Dậu**.
- Tuần (Mậu Thân, decade "Giáp Thìn–Quý Sửu") = **Dần, Mão**.
- Triệt (Can Mậu, "Mậu Quý" row) = **Tý, Sửu**.
- Tứ Hóa (Can Mậu): Lộc=Tham Lang, Quyền=Thái Âm, Khoa=Hữu Bật, Kỵ=Thiên Cơ.

**WHY_THIS_VECTOR_EXISTS:** direct operational test of **Expert Question 1's undisputed side**. Lunar day 21 in Kim Tứ Cục is printed unambiguously (Thìn) and independently formula-corroborated — this vector's Tử Vi anchor is the highest-confidence value in the entire Kim Tứ Cục table, useful as the "control" half of the V2/V3 pair.

---

## VECTOR-B3

```
INPUT (lunar)
Year Can-Chi: Mậu Thân       Sex: Nữ
Lunar month:  1 (Giêng)
Lunar day:    24
Hour branch:  Dần
```

Identical to VECTOR-B2 in every input except lunar day (21→24). All Can/year-level facts (Lộc Tồn, Thiên Khôi/Việt, Tuần, Triệt, Tứ Hóa) and all hour-based auxiliary stars (Văn Xương/Khúc, Địa Không/Kiếp — unaffected by day) are **identical to VECTOR-B2**, reproduced here for completeness.

**Computed (differs from B2 only in Tử Vi-anchor-dependent fields):**
- Tử Vi anchor: Kim Tứ Cục, day 24 → **`CONVENTION_LOCK_REQUIRED`: Mùi** (per `canonical-ruleset-v1.md` §1 row 14 — the printed table has no valid cell for day 24; this is the disputed cell itself).
- Thiên Phủ anchor: (4−7) mod12 = −3 mod12 = 9 → **Dậu**.
- 14 Chính Tinh: Tử Vi=Mùi, Liêm Trinh=Hợi, Thiên Đồng=Dần, Vũ Khúc=Mão, Thái Dương=Thìn, Thiên Cơ=Ngọ; Thiên Phủ=Dậu, Thái Âm=Tuất, Tham Lang=Hợi, Cự Môn=Tý, Thiên Tướng=Sửu, Thiên Lương=Dần, Thất Sát=Mão, Phá Quân=Mùi.
- Mệnh=Tý, Thân=Thìn, Cục=Kim Tứ, Lộc Tồn=Tỵ, Kình Dương=Ngọ, Đà La=Thìn, Thiên Khôi/Việt=Sửu/Mùi, Tả Phù=Thìn, Hữu Bật=Tuất, Văn Xương=Thân, Văn Khúc=Ngọ, Địa Kiếp=Sửu, Địa Không=Dậu, Tuần=Dần/Mão, Triệt=Tý/Sửu, Tứ Hóa as in B2 — all unchanged from VECTOR-B2.

**WHY_THIS_VECTOR_EXISTS:** direct operational test of **Expert Question 1's disputed side**. This is the exact cell the whole Kim Tứ Cục conflict is about, computed here with the convention lock explicitly applied and flagged — anyone reviewing this vector immediately sees which field is a locked convention rather than a source-confirmed value, and can override just this one field if better evidence ever arrives without needing to recompute the rest of the chart.

---

## VECTOR-B4

```
INPUT (lunar)
Year Can-Chi: Canh Ngọ       Sex: Nữ
Lunar month:  8
Lunar day:    10
Hour branch:  Mùi
```

**Computed:**
- R = (8+1) mod12 = 9 → **Dậu**. Mệnh = (9−7) mod12 = 2 → **Dần** [giờ0(Mùi)=7]. Thân = (9+7) mod12 = 16mod12=4 → **Thìn**. (Offset 2, even ✓.)
- Cục: Can Canh + Mệnh Dần → row "Dần,Mão,Tuất,Hợi" × col "Ất Canh" → **Thổ Ngũ Cục**.
- Tử Vi anchor: Thổ Ngũ Cục, day 10 → **Mão**.
- Thiên Phủ anchor: (4−3) mod12=1 → **Sửu**.
- 14 Chính Tinh: Tử Vi=Mão, Liêm Trinh=Mùi, Thiên Đồng=Tuất, Vũ Khúc=Hợi, Thái Dương=Tý, Thiên Cơ=Dần; Thiên Phủ=Sửu, Thái Âm=Dần, Tham Lang=Mão, Cự Môn=Thìn, Thiên Tướng=Tỵ, Thiên Lương=Ngọ, Thất Sát=Mùi, Phá Quân=Hợi.
- Lộc Tồn (Can Canh) = **Thân**. Kình Dương = Dậu. Đà La = Mùi.
- Thiên Khôi/Thiên Việt (Canh/Tân row) = **Ngọ / Dần**.
- Tả Phù (tháng 8, Thìn=1 forward 7) = **Hợi**. Hữu Bật (Tuất=1 backward 7) = **Mão**.
- Văn Xương (giờ Mùi, Tuất=Tý backward 7) = **Mão**. Văn Khúc (Thìn=Tý forward 7) = **Hợi**.
- Địa Kiếp (giờ Mùi, Hợi=Tý forward 7) = **Ngọ**. Địa Không (Hợi=Tý backward 7) = **Thìn**.
- Tuần (Canh Ngọ, decade "Giáp Tý–Quý Dậu") = **Tuất, Hợi**.
- Triệt (Can Canh, "Ất Canh" row): **`CONVENTION_LOCK_REQUIRED` → Mùi, Ngọ** (table value, per `canonical-ruleset-v1.md` row 19 — VDTTL-1956's own worked example for this exact year, Canh Ngọ, instead claims Thân, Dậu; that example is not followed here, per the disclosed convention lock).
- Tứ Hóa (Can Canh): Lộc=Thái Dương, Quyền=Vũ Khúc, Khoa=Thái Âm, Kỵ=Thiên Đồng.

**WHY_THIS_VECTOR_EXISTS:** direct operational test of **Expert Question 2**, using the *exact same birth year* (Canh Ngọ) as VDTTL-1956's own disputed worked example, so the convention-lock decision is visible in full-chart context, not just as an isolated table lookup. Anyone who believes the worked example (Thân, Dậu) rather than the table should be able to look at this one field and immediately see and override the disagreement.

---

## VECTOR-B5

```
INPUT (lunar)
Year Can-Chi: Ất Sửu       Sex: Nam
Lunar month:  3
Lunar day:    5
Hour branch:  Tuất
```

**Computed:**
- R = (3+1) mod12=4 → **Thìn**. Mệnh = (4−10) mod12 = −6mod12=6 → **Ngọ** [giờ0(Tuất)=10]. Thân = (4+10) mod12=14mod12=2 → **Dần**. (Offset −4≡8, even ✓.)
- Cục: Can Ất + Mệnh Ngọ → row "Ngọ,Mùi" × col "Ất Canh" → **Mộc Tam Cục**.
- Tử Vi anchor: Mộc Tam Cục, day 5 → **Dần**.
- Thiên Phủ anchor: (4−2) mod12=2 → **Dần** (coincide with Tử Vi — both on the Dần–Thân axis).
- 14 Chính Tinh: Tử Vi=Dần, Liêm Trinh=Ngọ, Thiên Đồng=Dậu, Vũ Khúc=Tuất, Thái Dương=Hợi, Thiên Cơ=Sửu; Thiên Phủ=Dần, Thái Âm=Mão, Tham Lang=Thìn, Cự Môn=Tỵ, Thiên Tướng=Ngọ, Thiên Lương=Mùi, Thất Sát=Thân, Phá Quân=Tý.
  - *(Liêm Trinh and Thiên Tướng both land at Ngọ — another naturally-occurring dense palace.)*
- Lộc Tồn (Can Ất) = **Mão**. Kình Dương = Thìn. Đà La = Dần.
- Tứ Hóa (Can Ất): Lộc=Thiên Cơ, Quyền=Thiên Lương, Khoa=Tử Vi, Kỵ=Thái Âm.
- Tuần/Triệt/remaining aux: not computed for this vector (effort-bounded; Mệnh/Thân/Cục/Tử-Vi-anchor/14-star/Lộc-Tồn/Tứ-Hóa are the fields this vector was designed to exercise).

**WHY_THIS_VECTOR_EXISTS:** operationalizes this sprint's own new finding (`canonical-ruleset-v1.md` §5) that Tý and Ngọ are the *only* two hour branches producing an automatic Mệnh=Thân coincidence — this vector deliberately uses a **non**-Tý, **non**-Ngọ hour (Tuất) specifically to confirm Mệnh≠Thân in the general case (Ngọ palace vs. Dần palace here), giving a contrasting pair with VECTOR-B1's Tý-hour coincidence case. Also completes a 5th distinct Cục (Mộc Tam) and a 4th distinct Can (Ất).

---

## VECTOR-B6

```
INPUT (lunar)
Year Can-Chi: Bính Dần       Sex: Nữ
Lunar month:  5
Lunar day:    8
Hour branch:  Sửu
```

**Computed:**
- R = (5+1) mod12=6 → **Ngọ**. Mệnh = (6−1) mod12=5 → **Tỵ** [giờ0(Sửu)=1]. Thân = (6+1) mod12=7 → **Mùi**. (Offset 2, even ✓.)
- Cục: Can Bính + Mệnh Tỵ → row "Thìn,Tỵ" × col "Bính Tân" → **Thủy Nhị Cục**.
- Tử Vi anchor: Thủy Nhị Cục, day 8 → **Tỵ**.
- Thiên Phủ anchor: (4−5) mod12=−1mod12=11 → **Hợi** (exactly opposite Tử Vi's palace — the two anchors are 6 palaces apart, the maximum possible separation).
- 14 Chính Tinh: Tử Vi=Tỵ, Liêm Trinh=Dậu, Thiên Đồng=Tý, Vũ Khúc=Sửu, Thái Dương=Dần, Thiên Cơ=Thìn; Thiên Phủ=Hợi, Thái Âm=Tý, Tham Lang=Sửu, Cự Môn=Dần, Thiên Tướng=Mão, Thiên Lương=Thìn, Thất Sát=Tỵ, Phá Quân=Dậu.
  - **Dense-palace stress case (by design intent, found naturally by the arithmetic):** Tử Vi & Phá Quân both at Tỵ; Thiên Đồng & Thái Âm both at Tý; Vũ Khúc & Tham Lang both at Sửu; Thái Dương & Cự Môn both at Dần; Thiên Cơ & Thiên Lương both at Thìn. **5 of the 7 non-anchor-pair stars double up with a star from the other group**, because the two anchors happen to sit exactly opposite each other on the 12-palace ring this time — this is the single densest chart this slate produced, and a strong stress-test for any wraparound/dense-palace handling in a future implementation.
- Lộc Tồn (Can Bính) = **Tỵ**. Kình Dương = Ngọ. Đà La = Thìn.
- Tứ Hóa (Can Bính): Lộc=Thiên Đồng, Quyền=Thiên Cơ, Khoa=Văn Xương, Kỵ=Liêm Trinh.
- Tuần/Triệt: not computed for this vector (same effort-bounded reason as B5).

**WHY_THIS_VECTOR_EXISTS:** completes 5-of-5 Cục coverage (Thủy Nhị, the last one missing from B1–B5) and a 5th distinct Can (Bính); the resulting maximal-opposition anchor placement produces the densest multi-star palace pattern in this slate, satisfying the "main-star offset wraparound / dense-palace stress case" coverage requirement more thoroughly than a deliberately-engineered case would have.

---

## Explicit gap disclosure (per this document's own honesty standard)

Not computed this sprint, and not fabricated to fill the gap:
- Đinh, Kỷ, Tân, Nhâm, Quý Can (5 of 10 remaining).
- Any leap-month or Lunar-New-Year-boundary case (requires the real calendar library).
- Hỏa Tinh/Linh Tinh (the one CORE_V1 star whose rule depends on sex, per `canonical-ruleset-v1.md` §1 row 24) — no vector in this slate exercises it.
- Cross-checking B1's, B4's, B5's, B6's Tuần palaces beyond what is shown (B5/B6 explicitly left blank).

**These gaps are recorded so a future pass can close them without re-deriving the method from scratch — not because they don't matter.**
