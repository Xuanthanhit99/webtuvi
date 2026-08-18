# Vietnamese Tử Vi Đẩu Số — Domain Decision Register

**Status:** Sprint 15. This register re-derives and updates the 12-item register originally
recorded in `docs/product/vietnamese-tu-vi-product-definition.md` §5. All 12 original items were
located, confirmed still present, and re-researched — none deleted, none silently merged. Two are
newly split for precision (see DECISION-02 / DECISION-02B). Statuses use exactly the four allowed
values: `RESOLVED_BY_SOURCE`, `CONFLICT`, `DOMAIN_EXPERT_REQUIRED`, `UNSOURCED`. No item uses
"probably," "commonly," or "likely" as a resolution.

---

## DECISION-01 — School / tradition / reference system

**Corresponds to:** product definition §5 item 1.
**Why it matters:** every downstream table (Cục, star placement, Tứ Hóa) depends on which
tradition is followed. Chosen first or nothing else can start correctly.
**Options found:**
- Vietnamese-adapted tradition per Vân Đằng Thái Thứ Lang's *Tử Vi Đẩu Số Tân Biên* (1956) —
  historically dominant in Vietnamese-language practice (SOURCE_ID `VDTTL-1956`).
- Chinese Zi Wei Dou Shu per Trần Đoàn's *Tử Vi Đẩu Số Toàn Thư* — the shared root text, but not
  itself proof of which downstream conventions modern Vietnamese practice actually follows
  (SOURCE_ID `TD-TOANTHU`).
- Nam Phái (Southern School) / Trung Châu lineage — named explicitly in Tứ Hóa research as a
  distinct, internally-consistent tradition with its own named authority chain (Lục Bân Triệu,
  Khâm Thiên môn) (SOURCE_ID `SECONDARY-TUHOA-SCHOOLS`).
- Bắc Phái (Northern School) — named as structurally different in how central it treats Tứ Hóa.
**Conflict:** Real. These are not variations on one tradition; Bắc Phái vs. Nam Phái is explicitly
documented as producing different Tứ Hóa treatment (see DECISION-10), and the Vietnamese-adapted
vs. Chinese-root question is exactly what decision register item 1 in the product definition was
already flagging.
**Engine impact:** Determines every other table in this register.
**Recommended action:** Vân Đằng Thái Thứ Lang's *Tử Vi Đẩu Số Tân Biên* is the strongest
*candidate* default — it is the most consistently cited Vietnamese-language source found in this
session, matches the product's stated target audience (Vietnamese users wanting the specifically
Vietnamese tradition, not a Chinese-zodiac gloss — product definition §2), and its name is already
referenced by the existing `/menh-vi/la-so` placeholder copy. **This is a recommendation, not a
decision** — per this sprint's explicit instruction, no school may be silently chosen. Founder
sign-off required, ideally after a domain expert confirms this text's conventions are still
standard current Vietnamese practice (60–70 years of practitioner drift is plausible).
**Status:** `DOMAIN_EXPERT_REQUIRED` (source identified; selection itself needs founder + expert
confirmation, not just source discovery).
**Owner:** Founder (selection), Engineering (execution once selected).

---

## DECISION-02 — Giờ Tý / day-boundary convention

**Corresponds to:** product definition §5 item 2.
**Why it matters:** affects hour-branch and everything downstream (Mệnh/Thân/Cục) for a large share
of real birth times.
**Options found:**
- "Giờ Tý Sơ" — 23:00–23:59 treated as (early) Tý of the *current* civil day.
- "Giờ Tý Chính" — 00:00–00:59 treated as Tý of the *next* civil day; by implication, some sources
  place the entire 23:00–00:59 window as belonging to one day or split across two, depending on
  which sub-convention is used for the day-boundary itself, not just the hour-branch label.
**Conflict:** Real and explicitly named in Vietnamese-language sources (SOURCE_ID
`SECONDARY-GIOTY`) — this is not the product definition inventing caution; independent research
confirms two actively-used, named conventions exist.
**Engine impact:** Off-by-one-day/palace risk for any birth time in the 23:00–00:59 window — the
single most common ambiguity point flagged repeatedly across this project's own prior audits.
**Recommended action:** None proposed here — this genuinely requires either (a) confirming which
convention DECISION-01's selected primary source (VDTTL-1956, once read directly) uses, or (b) a
domain expert's explicit ruling.
**Status:** `CONFLICT` (real, named, sourced disagreement — not merely unresolved).
**Owner:** Domain expert / primary-text verification.

---

## DECISION-03 — Lunar leap-month behavior

**Corresponds to:** product definition §5 item 3.
**Why it matters:** affects Can Chi / Cục for a meaningful minority of birth dates.
**What was found:** The calendar-layer question (*which month is the leap month, astronomically*)
is well-resolved by the Hồ Ngọc Đức algorithm (SOURCE_ID `HND-ALGORITHM`) — leap months are
determined via the Principal Terms method against the UTC+7 meridian, a mechanical, non-disputed
computation once the algorithm is trusted. **What is not resolved:** which *lunar month a
leap-month birth is treated as for Tử Vi chart-construction purposes* (e.g., does a person born in
leap-4th-month use "month 4" or a special leap-month rule for Mệnh/Thân/Cục calculation?) — this is
a Tử Vi convention question, separate from the calendar-astronomy question, and was not resolved by
any source found in this session.
**Conflict:** Not yet demonstrated as a real school conflict (unlike DECISION-02/10), but genuinely
unsourced for the Tử Vi-specific treatment.
**Engine impact:** Wrong month-index input to Mệnh/Thân/Cục formulas for leap-month births.
**Status:** `UNSOURCED` (the calendar math itself is `RESOLVED_BY_SOURCE`, tracked separately as
DECISION-03B below; the Tử Vi-specific leap-month-as-input convention is not).

### DECISION-03B — Calendar computation library/algorithm (new, split out for precision)
**What was found:** Hồ Ngọc Đức's algorithm (SOURCE_ID `HND-ALGORITHM`), grounded in Jean Meeus's
*Astronomical Algorithms* and Reingold & Dershowitz's *Calendrical Calculations*, computed for
UTC+7, independently re-implemented by at least 4 separate open-source libraries over roughly two
decades.
**Status:** `RESOLVED_BY_SOURCE` for the narrow claim "this algorithm correctly computes
solar↔lunar conversion, lunar leap months, and Can Chi for the Vietnamese calendar, for any
realistic birth date." This does **not** resolve DECISION-02 (giờ Tý) or DECISION-03 (Tử-Vi-specific
leap-month treatment) — a correct calendar layer is a prerequisite for those, not a substitute.
**Owner:** Engineering (library selection/wrapping — see calculation-specification.md).

---

## DECISION-04 — Mệnh/Thân placement rule

**Corresponds to:** product definition §5 item 4.
**What was found:** A specific, named formula from SOURCE_ID `SECONDARY-TVSG-MENH-THAN`:
```
Mệnh = ((tháng − giờ) + 1) mod 12   [add 12 if the raw result is ≤ 0]
Thân = ((tháng + giờ) − 1) mod 12   [subtract 12 if the raw result is > 12]
```
where `tháng` = lunar birth month number (1–12) and `giờ` = birth-hour branch index, both counted
from a Dần=1 reference — and independently, a directionally-consistent description (count forward
from Dần to birth month to find "the Tý-hour reference palace," then count *backward* to the
birth-hour branch for Mệnh, *forward* for Thân) from a second, differently-worded source.
**Conflict:** None found between the two sources that were checked — they agree in structure and
(as far as the second source's prose describes) in direction.
**Engine impact:** Foundational — every palace label depends on this.
**Status:** `DOMAIN_EXPERT_REQUIRED` — not `RESOLVED_BY_SOURCE`, despite the encouraging
corroboration, because both supporting sources are secondary (no bibliography, not independently
verified against VDTTL-1956/TD-TOANTHU directly). This is the single most implementation-ready
finding in this register and the recommended first item to take to a domain expert for a quick
confirm/deny, since the shape is already well-formed. **Do not implement from this formula alone.**
**Owner:** Domain expert (quick confirmation, not open research).

---

## DECISION-05 — Cục (destiny bureau) derivation table

**Corresponds to:** product definition §5 item 5. **Hard domain gate.**
**What was found:** A named methodology (Ngũ Hành Nạp Âm of the Can-Chi of the month containing the
Mệnh palace) with two cited primary sources (`VDTTL-1956`, `HLDP-1972`) and exactly one fully worked
example (Bính-year, Mệnh at Dậu → Hỏa Lục Cục), via SOURCE_ID `SECONDARY-TNT`. The five Cục
category names/numbers themselves (Thủy Nhị=2 / Mộc Tam=3 / Kim Tứ=4 / Thổ Ngũ=5 / Hỏa Lục=6) are
consistently repeated across many independent sites.
**What was explicitly NOT found:** the complete lookup table (all 12 Mệnh-branch positions × 10
Can-năm combinations → Cục). One source explicitly states the numeric assignment's "exact origins
and theoretical justification... remain subjects of scholarly debate" even among practitioners.
**Conflict:** Not a demonstrated school conflict, but a demonstrated gap between "the category
names are well-known" and "the full derivation table is verified."
**Engine impact:** Star placement (DECISION-06/07) depends directly on this — nothing downstream
can be built until this table is complete and verified.
**Status:** `UNSOURCED` for the complete table; `CORROBORATING` only for category structure and
methodology shape. **This is the single highest-priority item for direct primary-text reading**
(VDTTL-1956 and/or HLDP-1972) or domain-expert engagement.
**Owner:** Domain expert / primary-text transcription with a second independent reviewer.

---

## DECISION-06 — Tử Vi star placement table (anchor star)

**Corresponds to:** product definition §5 item 6. **Hard domain gate — single highest-leverage
table in the entire engine.**
**What was found:** Confirms placement is a function of (Cục, lunar birth day) — structurally
consistent with tradition — but no complete day-1-through-final-lunar-day × 5-Cục table was located
or verified in this session.
**Conflict:** None demonstrated (simply unverified).
**Engine impact:** Every other of the 14 chính tinh is placed relative to this star (see
DECISION-07) — nothing about the star layer can proceed without this table complete and verified.
**Status:** `UNSOURCED`.
**Owner:** Domain expert / primary-text transcription with a second independent reviewer.

---

## DECISION-07 — Remaining 13 chính tinh placement rules

**Corresponds to:** product definition §5 item 7. Direct dependency on DECISION-06.
**What was found:** The classic two-group structural model, independently corroborated: the "Tử Vi
tinh hệ" (Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh — reverse/nghịch direction
from Tử Vi's position) and the "Thiên Phủ tinh hệ" (Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên
Tướng, Thiên Lương, Thất Sát, Phá Quân — forward/thuận direction from Thiên Phủ's position, itself
fixed in mirror relationship to Tử Vi across the Tị/Hợi axis). Some individual offsets were
partially stated (e.g., certain stars described as "one position apart," "two positions apart"),
but not a complete, verified 14-cell offset table.
**Conflict:** None demonstrated.
**Engine impact:** Direct dependency on DECISION-06; without a verified anchor, this cannot be
finalized even with the group structure known.
**Status:** `UNSOURCED` for the complete offset table; `CORROBORATING` for the group-structure shape
(useful for engine design — e.g., confirms two independent "walk" loops are the right internal
representation — but not sufficient to ship).
**Owner:** Domain expert / primary-text transcription with a second independent reviewer.

---

## DECISION-08 — Auxiliary-star placement tables (MVP set, product definition §4D)

**Corresponds to:** product definition §5 item 8.
**What was found:** Confirms the standard "6 auspicious stars" grouping (Văn Xương, Văn Khúc, Tả
Phù, Hữu Bật, Thiên Khôi, Thiên Việt) is a real, recognized set, with interpretive meaning per
star — but zero deterministic placement formulas for any of the product definition's 13-star MVP
list were found.
**Conflict:** Not demonstrated (no placement data to conflict).
**Engine impact:** Product definition explicitly requires confirming the MVP list itself before
each placement rule — this session did not confirm the list, only the general category.
**Status:** `UNSOURCED` for every star's placement rule; `UNSOURCED` also for whether the product
definition's specific 13-star list matches what a chosen primary source treats as "load-bearing"
vs. decorative (the product definition itself flags this — "this set is not invented here — it must
be confirmed against the authoritative source chosen... not assumed correct because it appears in
this list").
**Owner:** Domain expert / primary-text transcription, once DECISION-01 and DECISION-05/06/07 are
resolved (auxiliary placement typically depends on Can/Chi/palace values already established).

---

## DECISION-09 — Tuần/Triệt calculation rule

**Corresponds to:** product definition §5 item 9.
**What was found:** Confirmed — and this is a genuine, useful finding — that Tuần and Triệt use
**different input bases**: Tuần derives from which "Tuần Giáp" (decade group within the 60-year
sexagenary cycle) the birth year belongs to; Triệt derives directly from the birth year's Heavenly
Stem (Can) alone. A person can have up to 4 palaces affected in total (2 from Tuần, 2 from Triệt,
independently positioned). No lookup table for either was located.
**Conflict:** None demonstrated, but confirms the product definition's own explicit warning ("do
not assume Tuần and Triệt follow analogous rules") reflects real structure, not caution for its own
sake.
**Engine impact:** Two separate lookup tables required, not one shared formula.
**Status:** `UNSOURCED` for both tables; `RESOLVED_BY_SOURCE` only for the narrow claim "Tuần and
Triệt have different input bases" (useful for engine architecture, not sufficient to place either).
**Owner:** Domain expert / primary-text transcription.

---

## DECISION-10 — Tứ Hóa mapping

**Corresponds to:** product definition §5 item 10. **Hard domain gate.**
**What was found:** The clearest, most explicit real conflict in this entire register. Bắc Phái
(Northern School) treats Tứ Hóa as the structural core of the whole reading method. Nam Phái
(Southern School) derives Tứ Hóa placement from the birth-year Heavenly Stem, with one specific,
named high-accuracy lineage cited: "Tử vi đẩu số toàn tập - Trung Châu phái - Lục Bân Triệu - Khâm
Thiên môn." The source is explicit: *"the different schools of Tử Vi Đẩu Số often do not have
unified views"* on this specific rule.
**Conflict:** Real, named, sourced. **Do not resolve by picking whichever 10-Can×4-Hóa table
appears most often in a search** — popularity is not the same as correctness, and this is precisely
the failure mode this whole register exists to prevent (see product definition §5's own governing
rule: "Where two schools disagree... never silently blend schools").
**Engine impact:** Directly downstream of DECISION-01 — this cannot be resolved independently of
which school is selected there.
**Status:** `DOMAIN_EXPERT_REQUIRED`.
**Owner:** Founder (school selection, DECISION-01) + domain expert (table itself, once school is
fixed).

---

## DECISION-11 — Miếu/Vượng/Đắc/Hãm — include in V1 or defer?

**Corresponds to:** product definition §5 item 11.
**What was found:** No new research changes this from the product definition's own framing — this
is explicitly a scope-size decision requiring founder input ("Yes (scope call)"), not purely a
domain-research question. No new evidence was found this session that would push this toward
"must include" or "must defer" on domain-correctness grounds alone.
**Engine impact:** Changes MVP scope size non-trivially (per product definition §4E).
**Status:** `DOMAIN_EXPERT_REQUIRED` for whether the *correctness* of a brightness table can be
established without more sourcing, but the *inclusion* decision itself is fundamentally a founder
scope call — recommend explicitly deferring this star-dignity layer to post-MVP, consistent with
the product definition's own framing of it as optional scope, so it does not gate the rest of the
V1 engine.
**Owner:** Founder (scope call).

---

## DECISION-12 — Vận calculation rules (Đại Hạn/Tiểu Hạn/Lưu Niên)

**Corresponds to:** product definition §5 item 12.
**What was found:** No dedicated research was conducted this session — per the product definition
and Roadmap V2, this is explicitly **post-MVP** (Sprint 22, "Vận Depth"), and Sprint 15's own scope
instructs not to expand Sprint 18's engine scope to cover it.
**Status:** `UNSOURCED` (deliberately not researched this session — correctly out of Sprint 18's
MVP boundary; see calculation-specification.md's MVP/post-MVP split).
**Owner:** Deferred to the Sprint 22 mini-spec pass, per Roadmap V2 §5's own sequencing rationale.

---

## Summary table

| # | Decision | Status | Blocks Sprint 18 MVP? |
|---|---|---|---|
| 01 | School/tradition | DOMAIN_EXPERT_REQUIRED | Yes — blocks everything |
| 02 | Giờ Tý boundary | CONFLICT | Yes |
| 03 | Leap-month Tử-Vi treatment | UNSOURCED | Yes |
| 03B | Calendar library/algorithm | RESOLVED_BY_SOURCE | No — resolved |
| 04 | Mệnh/Thân | DOMAIN_EXPERT_REQUIRED (strong candidate formula) | Yes, but fastest to close |
| 05 | Cục table | UNSOURCED (methodology known) | Yes |
| 06 | Tử Vi anchor placement | UNSOURCED | Yes |
| 07 | Remaining 13 chính tinh | UNSOURCED (structure known) | Yes |
| 08 | Auxiliary stars | UNSOURCED | Yes |
| 09 | Tuần/Triệt | UNSOURCED (input bases known) | Yes |
| 10 | Tứ Hóa | DOMAIN_EXPERT_REQUIRED | Yes |
| 11 | Miếu/Vượng/Đắc/Hãm | DOMAIN_EXPERT_REQUIRED / founder scope call | No if deferred |
| 12 | Vận cycles | UNSOURCED (deliberately deferred) | No — Sprint 22 |

**Zero of the twelve original items resolve to `RESOLVED_BY_SOURCE` on their own this session.**
One newly-split sub-item (calendar algorithm, 03B) does. This is the expected, correct outcome per
this sprint's own instructions ("If a core rule cannot be sourced: MARK IT UNSOURCED... This is
expected and acceptable. Do not force READY.").
