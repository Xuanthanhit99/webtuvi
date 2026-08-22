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

**Sprint 18A.2 update (2026-08-20):** Founder decision received: `TUVI_SCHOOL_V1 = VDTTL_1956`.
**Status updated to `RESOLVED_BY_FOUNDER_DECISION`.** See `docs/domain/tu-vi/v1-canonical-ruleset.md`
for the resulting normalized ruleset and `docs/domain/tu-vi/vdttl-1956-second-review.md` for the
independent-as-possible re-verification this decision was made against. This does not retroactively
validate every table extracted from VDTTL-1956 as `EXPERT_CONFIRMED` — two items remain open
(DECISION-05's Kim Tứ Cục cell, DECISION-09's Triệt conflict) and the golden-vector gate
(`docs/domain/tu-vi/golden-vectors.md`) remains at 0 — but the *which school* question itself is
closed.

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

**Sprint 18A.6 addendum (2026-08-21):** Placement rules for all 13 originally-proposed MVP stars
were fully sourced from VDTTL-1956 by Sprint 18A.1, and re-verified independently three times since
(Sprint 18A.2's general review; Sprint 18A.5's re-read of Lộc Tồn; Sprint 18A.6's re-read of the
remaining 6 stars, which also resolved the one lingering ambiguity flag on the Hỏa Tinh/Linh Tinh
table — confirmed as printed, not a transcription artifact, and self-consistent with its own worked
example). **Founder decision received this sprint: `TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13`** — V1
implements exactly these 13 stars (Tả Phù, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi, Thiên Việt,
Lộc Tồn, Kình Dương, Đà La, Địa Không, Địa Kiếp, Hỏa Tinh, Linh Tinh), matching the product
definition's original 13-star MVP list exactly. Every other auxiliary star found in VDTTL-1956
(~40 more — Thái Tuế's companion series, the Tràng Sinh series, Lộc Tồn's own companion walk, and
~15 named singles/pairs, all catalogued in `vdttl-1956-extraction.md`) is `DEFERRED_TO_V1_1`, not
in scope. **Status updated to `RESOLVED_BY_FOUNDER_DECISION`** for the list-confirmation question;
the individual placement rules were already source-resolved. See `canonical-ruleset-v1.md` §7 and
`docs/progress/sprint-18a6-entry-gate-closure.md` for the full closure record.

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

**Tử Vi Depth Completion pass addendum (2026-08-22):** the domain-correctness half of this item is
now resolved. `dv02` (Part 2 — Luận Đoán 12 Cung), never opened by any prior session, was located,
downloaded (byte-verified against archive.org metadata), and read directly against the PDF
page-image scans (not OCR text alone) for its full "2. ĐỊNH DANH" (definitions, p.31–32) and
"3. ĐẶC TÍNH CÁC SAO" §3.1–3.14 (one table per star, p.33–38) sections — every one of the 14 Chính
Tinh, not a sample. A 5-state system (Miếu địa / Vượng địa / Đắc địa / Bình hòa / Hãm địa, not the
4 states the product definition assumed). Every star's branch-state table was verified to partition
all 12 Earthly Branches exactly once (no gap, no overlap) — Tử Vi and Thiên Phủ notably have no Hãm
địa state at all, confirmed correct on the scan (not an extraction artifact). Full table, citations,
and this session's independent-re-read methodology: `apps/api/src/tu-vi/engine/tu-vi-dignity.ts`.
Scope confirmed explicitly by the source itself (§1.6): this classification applies to the 14 Chính
Tinh only, never to auxiliary/CORE_13 stars.

**Status updated to `RESOLVED_BY_SOURCE`** for domain correctness (`PRIMARY_SOURCE_CONFIRMED` +
independent re-read of all 14 stars against the page-image scans, not OCR alone, + mathematical
completeness invariant — one step short of a second human domain expert's sign-off, which remains
the one gap between this and `EXPERT_CONFIRMED`). **The founder scope-call question is treated as
resolved by inclusion** in this pass — implemented as an additive, backward-compatible engine layer
(new `dignityVersion`, does not alter any existing calculated fact) — since the original scope
concern ("changes MVP scope size non-trivially") predates the MVP shipping; this is now a post-ship
enhancement, not a pre-ship scope expansion. Founder review of this specific judgment call is
invited, not bypassed — the change sits fully uncommitted pending review, per standing policy.
Shipped: `apps/api/src/tu-vi/engine/tu-vi-dignity.ts` (+ `.spec.ts`, 13 tests), wired through
persistence/API/frontend (Prisma migration `20260822032932_tu_vi_dignity_version`, `TuViChartDto`,
`TuViPalaceGrid`). See `docs/progress/tu-vi-depth-completion-final-report.md` for full evidence.

**Founder decision received (2026-08-22, Time Cycles pass):** `TUVI_STAR_DIGNITY_V1 = ENABLED`.
The inclusion judgment call above is confirmed, not merely proposed — Miếu/Vượng/Đắc/Hãm is
founder-approved for V1. **Status upgraded to `RESOLVED_BY_FOUNDER_DECISION`** (both the domain-
correctness and scope-inclusion halves of this item are now closed). Not reverted; the previously-
uncommitted implementation stands.

---

## DECISION-12 — Vận calculation rules (Đại Hạn/Tiểu Hạn/Lưu Niên)

**Corresponds to:** product definition §5 item 12.
**What was found:** No dedicated research was conducted this session — per the product definition
and Roadmap V2, this is explicitly **post-MVP** (Sprint 22, "Vận Depth"), and Sprint 15's own scope
instructs not to expand Sprint 18's engine scope to cover it.
**Status:** `UNSOURCED` (deliberately not researched this session — correctly out of Sprint 18's
MVP boundary; see calculation-specification.md's MVP/post-MVP split).
**Owner:** Deferred to the Sprint 22 mini-spec pass, per Roadmap V2 §5's own sequencing rationale.

**Tử Vi Depth Completion pass addendum (2026-08-22):** dedicated research was conducted this
session — `dv01`'s own "10. KHỞI HẠN" section (p.20–22), never covered by the prior extraction
(which stopped at p.17), was located and read directly against the PDF page-image scans. Splitting
this decision into its 3 named sub-parts:

- **Đại Vận / Đại Hạn (10-year cycles) — `RESOLVED_BY_SOURCE` for the core palace/age assignment.**
  Direction rule ("dương nam, âm nữ theo chiều thuận; âm nam, dương nữ theo chiều nghịch") and the
  age formula (`ageStart = cụcNumber + 10×index`) independently cross-checked against **3 separate
  worked examples across 2 pages** (p.20's own example, plus 2 unrelated "cung gốc của đại hạn"
  ranges cited inside the p.21–22 Lưu Đại Hạn worked examples) — not merely the one example used to
  derive the rule. A suspected direction contradiction against the already-shipped
  `PALACE_ROLES_FROM_MENH` order (`tu-vi-palace.ts`) was investigated by viewing the actual page-6
  and page-20 scans side by side and found to be **no contradiction at all** — a naive misreading on
  this session's own first pass, corrected by re-deriving from `tu-vi-palace.ts`'s own already-proven
  mathematical invariant (which predates and independently confirms the Đại Hạn rule). The book also
  describes a second, alternate starting-palace method and **explicitly states the first (Mệnh-
  starting) method is preferred** ("người ta hay dùng cách thứ nhất vì nó chính xác hơn") — only that
  method is implemented, not an engineering guess between the two. Shipped:
  `apps/api/src/tu-vi/engine/tu-vi-dai-van.ts` (7 tests). **Explicitly NOT implemented**: "Lưu Đại
  Hạn" (p.20–21, §10.2) — a real, separately-documented annual sub-cycle within each 10-year window
  (a "xung chiếu"/opposite-palace pivot mechanism) — deferred, not because evidence is lacking, but
  to keep this pass's scope bounded; the core 10-year assignment is the higher-value, lower-risk
  increment.

- **Tiểu Hạn (annual cycle, adults) — `RESOLVED_BY_SOURCE`.** Direction rule confirmed **sex-only**
  ("Nam khởi lưu theo chiều thuận. Nữ khởi lưu theo chiều nghịch") — explicitly does NOT also depend
  on year-Can yin-yang polarity the way Đại Vận does; this was checked directly rather than assumed
  to mirror Đại Vận. Starting-palace table (4 birth-year-branch groups × 3 branches = 12/12,
  complete) cross-checked against the book's own worked example (a boy born year Tý starts at Tuất,
  matching the table; the example's first 3 annual steps independently confirm the offset formula).
  Shipped: `apps/api/src/tu-vi/engine/tu-vi-tieu-han.ts` (6 tests). **Explicitly NOT implemented**:
  the separate child (age < 13) Tiểu Hạn table (`dv06` §21.3, newly discovered this session, not
  previously known to exist in any prior doc) — its OCR-derived table for ages 5–12 was flagged as
  an uncertain linearized-table reconstruction, not independently visually re-verified; deferred
  rather than shipped on partial confidence, per this project's own "do not implement partial lookup
  tables" discipline.

- **Lưu Niên — clarified, not a 4th standalone system.** The term never denotes an independent
  calculation; it is a "current year" qualifier used two ways: (a) as part of the compound term "lưu
  niên tiểu hạn" (i.e., Tiểu Hạn itself — already covered above), and (b) as a prefix on certain
  auxiliary stars recalculated fresh each year (Thái Tuế, Tang Môn, Bạch Hổ, Thiên Khốc, Thiên Hư,
  Lộc Tồn, Kình Dương, Đà La, Thiên Mã — `dv06` §4, "NHẬN ĐỊNH ẢNH HƯỞNG CỦA NHỮNG SAO LƯU ĐỘNG").
  Two of these star-groups (Lưu Thái Tuế/Tang Môn/Bạch Hổ; Lưu Thiên Khốc/Thiên Hư) were fully
  transcribed with worked examples; a third (Lưu Lộc Tồn/Kình Dương/Đà La) was found but not fully
  transcribed, and Lưu Thiên Mã's specific rule was not located. **Status: `UNSOURCED` for this
  auxiliary "Lưu" star sub-mechanism** — genuinely incomplete, not implemented.

**Owner:** Engine-layer implementation for Đại Hạn (core) and Tiểu Hạn (adult) complete this pass,
uncommitted pending review. Lưu Đại Hạn, the child Tiểu Hạn table, and the "Lưu" auxiliary stars
remain owned by a future pass — see `docs/progress/tu-vi-depth-completion-final-report.md`.

**Time Cycles pass addendum (2026-08-22):** Đại Hạn (core) and Tiểu Hạn (adult) are now shipped
**end-to-end** — persistence (`daiVan`/`tieuHanStart`/`cycleVersion` columns, migration
`20260822042508_tu_vi_cycle_persistence`), API (`TuViChartDto.daiVan`/`tieuHanStart`/
`currentDaiVan`/`currentTieuHan`/`nearbyTieuHan`, computed fresh on every read from the real current
date, never persisted/stale), and frontend (`TuViDaiVanTimeline`, `TuViTieuHanYearNav`, both wired
into the real chart detail view with honest empty/unavailable states for pre-feature charts and
under-13 tuổi). AI interpretation was deliberately NOT extended to reference time cycles — see
`docs/progress/tu-vi-time-cycles-release-closure.md` §"AI boundary" for the staleness reasoning.
One disclosed convention applied (not a primary-source-confirmed rule): "tuổi" for the purpose of
resolving which cycle is *current* uses the standard Vietnamese nominal/lunar age
(`tuổi = currentLunarYear − birthLunarYear + 1`), since no explicit "cách tính tuổi" statement was
found anywhere across all 6 parts of the primary source — flagged, not silently assumed, in
`apps/api/src/tu-vi/engine/tu-vi-current-cycle.ts`'s own module doc comment.

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

**Sprint 18A.3 addendum (2026-08-20):** Kim Tứ Cục's ambiguous cell (DECISION-05) and the Triệt
table/example conflict (DECISION-09) both now have well-evidenced likely resolutions —
`PRIMARY_SOURCE_PRINTING_ERROR_LIKELY` for both, backed by an independently-validated formula
(Cục) and an independent modern reference (Triệt). Giờ Tý's day-boundary half (DECISION-02) now has
real, if not VDTTL-1956-specific, evidentiary backing for the midnight-rollover convention. Golden
vectors remain at 0 — VDTTL-1956 Parts 2–3 were read exhaustively this sprint and confirmed to
contain no complete worked chart. None of these statuses are changed below (still correctly
`SOURCE_EXTRACTED`-tier, not `EXPERT_CONFIRMED`) — see `docs/domain/tu-vi/vdttl-1956-second-review.md`
and `docs/progress/sprint-18a3-worked-chart-golden-vector-final-report.md` for full detail.

**Sprint 18A addendum (2026-08-20):** VDTTL-1956's full text is now confirmed freely, fully
accessible (archive.org — see `authoritative-sources.md`'s addendum for the full finding). This
does not move any status below — no cell of any hard-gated table has been transcribed and verified
— but it changes DECISION-01/05/06/07/10's "what's blocking this" answer from "we don't have the
source" to "the source is in hand; it needs careful human transcription," which is a materially
smaller, better-scoped remaining task. See `docs/progress/sprint-18a-domain-resolution-final-report.md`.

**Sprint 18A.1 addendum (2026-08-20, same day):** the transcription work anticipated above has now
substantially happened — see `docs/domain/tu-vi/vdttl-1956-extraction.md` for the full, page-cited
record. This session downloaded the actual scanned PDF and read the rendered page images directly
(not through any AI-summarizing intermediary), extracting: the complete Cục table (30/30 printed
cells, 4/5 Cục blocks internally clean, 1/5 flagged ambiguous), the complete Tử Vi anchor table for
all 5 Cục (~150 cells, same one-block caveat), complete offset tables for both 14-chính-tinh groups
including their walking **direction** (both groups walk thuận/forward — contradicting the prior
`SECONDARY-14STARS-STRUCTURE` assumption of opposite directions, flagged at the highest priority for
second review), the complete 40-cell Tứ Hóa table (self-consistent with its own worked example), the
complete Tuần and Triệt tables (Triệt has one flagged table/worked-example inconsistency), and
complete rules for all 13 originally-proposed MVP auxiliary stars plus roughly 40 more.

**None of this moves any decision below out of its formal status** — every item is `SOURCE_EXTRACTED`
at best, pending second review, and DECISION-01 (school selection) is still a founder decision. But
the practical distance from here to `RESOLVED_BY_SOURCE` for DECISION-05/06/07/09/10 is now a
second-reviewer verification pass against specific page citations, not an open sourcing search. Two
specific cells are flagged `AMBIGUOUS_SOURCE_CELL` and one directional claim (both chính-tinh groups
walking the same direction) is flagged as the single highest-priority item for expert confirmation,
given this task's explicit warning about direction-inversion risk. See
`docs/progress/sprint-18a1-primary-source-extraction-final-report.md`.
