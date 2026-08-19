# Vietnamese Tử Vi Đẩu Số — Domain Resolution Pack

**Type:** Expert/primary-source resolution intake forms only. This document does not resolve any
domain blocker itself — it converts each blocker identified in `domain-decision-register.md` and
`docs/audit/sprint-18-pre-implementation-audit.md` into a precise, answerable question with the
exact structure an answer must take, so a founder, domain expert, or primary-text transcriber can
close each gate efficiently instead of starting from an open-ended research prompt.

**No new web research was performed to produce this document, per this task's own instruction not to
broaden research.** Every fact restated here (candidate formulas, source names, corroborated
structures) is carried forward from Sprint 15's already-recorded findings
(`authoritative-sources.md`, `domain-decision-register.md`, `calculation-specification.md`,
`star-placement-rules.md`, `golden-vector-specification.md`) and Sprint 18's re-audit
(`sprint-18-pre-implementation-audit.md`) — reused, not re-derived. **No missing rule is inferred
from memory anywhere in this document.** Where a worked example appears below, it is explicitly
labeled `FORMULA-DERIVED — NOT SOURCE-VERIFIED` and is a mechanical application of an already-
documented *candidate* formula to concrete numbers, produced so an expert has something specific to
confirm or correct — never a claim that the underlying formula itself is confirmed.

**Existing decision IDs reused, none duplicated:** DECISION-01 through DECISION-12 (plus the
already-split DECISION-02B/03B, where 03B is already `RESOLVED_BY_SOURCE` and out of scope for this
pack) map 1:1 to the sections below. No new decision ID is introduced.

---

## 0. Status recovered from `sprint-18-pre-implementation-audit.md` (unchanged, reconfirmed)

| Decision | Status at last audit | Still current? |
|---|---|---|
| DECISION-01 School/tradition | `DOMAIN_EXPERT_REQUIRED` | Yes — unchanged, no founder action recorded since |
| DECISION-02 Giờ Tý | `CONFLICT` | Yes |
| DECISION-03 Leap-month Tử-Vi treatment | `UNSOURCED` | Yes |
| DECISION-03B Calendar library | `RESOLVED_BY_SOURCE` | Yes — out of scope for this pack |
| DECISION-04 Mệnh/Thân | `DOMAIN_EXPERT_REQUIRED` | Yes |
| DECISION-05 Cục | `UNSOURCED` | Yes |
| DECISION-06 Tử Vi anchor | `UNSOURCED` | Yes |
| DECISION-07 Remaining 13 chính tinh | `UNSOURCED` | Yes |
| DECISION-08 Auxiliary stars | `UNSOURCED` | Yes |
| DECISION-09 Tuần/Triệt | `UNSOURCED` | Yes |
| DECISION-10 Tứ Hóa | `DOMAIN_EXPERT_REQUIRED` (real Bắc/Nam conflict) | Yes |
| DECISION-11 Miếu/Vượng/Đắc/Hãm | `DOMAIN_EXPERT_REQUIRED` / founder scope call | Yes — out of scope for this pack (not a Sprint 18 hard gate; see product definition §4E) |
| DECISION-12 Vận cycles | `UNSOURCED` (deliberately deferred to Sprint 22) | Yes — out of scope |

Golden vectors: **0 populated**, target ~12–15, unchanged.

---

## 1. Canonical school decision (DECISION-01)

### Decision form to present to the founder/domain expert

> **BeaconVie V1 Vietnamese Tử Vi shall follow _____________ as the canonical deterministic
> ruleset.**

| Field | Candidate A (recommended, not selected) | Candidate B | Candidate C | Candidate D |
|---|---|---|---|---|
| **SOURCE** | *Tử Vi Đẩu Số Tân Biên* | *Tử Vi Đẩu Số Toàn Thư* (紫微斗数全书) | Nam Phái / Trung Châu lineage | Bắc Phái |
| **AUTHOR** | Vân Đằng Thái Thứ Lang | Trần Đoàn (Hi Di Trần Đoàn), Vietnamese ed. w/ Lâm Canh Phàm | Lục Bân Triệu (Khâm Thiên môn) | Not individually named in sourcing found |
| **EDITION** | Unspecified — multiple modern reprints/PDF scans exist, none pinned | "Đồ Giải Tử Vi Đẩu Số Toàn Thư" (thuviensach.vn PDF) referenced repeatedly, not pinned as *the* edition | "Tử vi đẩu số toàn tập" (as cited) | N/A |
| **YEAR** | 1956, Saigon | Classical Chinese text, disputed original date; cited Vietnamese ed. dated 1973 (Trúc Lâm An Thư Cục, Taiwan) | Not dated in sourcing found | Not dated |
| **SCHOOL/TRADITION** | Vietnamese-adapted Tử Vi — described by contemporaries as "Tử Vi Kinh" | Root/originating Chinese Zi Wei Dou Shu text | Southern School (derives Tứ Hóa from year Stem) | Northern School (treats Tứ Hóa as structural core) |
| **WHY SELECTED (if chosen)** | Most consistently cited Vietnamese-language source found; matches product's Vietnamese-facing audience (product definition §2); already referenced by the archived `/menh-vi` prototype's own copy | Shared ancestor text — establishes lineage, not necessarily modern Vietnamese practice | Named, internally consistent, cited as "high-accuracy" for Tứ Hóa specifically | Named as structurally distinct, no specific accuracy claim found |
| **WHAT IT GOVERNS (once selected)** | Every downstream table this pack requests: Mệnh/Thân formula confirmation, Cục table, Tử Vi anchor + 14-star offsets, auxiliary-star rules, Tuần/Triệt tables, Tứ Hóa mapping | Same, if selected as primary instead of A | Tứ Hóa mapping specifically (DECISION-10); does not by itself resolve Mệnh/Thân/Cục/star-placement unless also adopted as the general school | Same scope caveat as Nam Phái |
| **WHAT IT DOES NOT GOVERN** | Vận cycle rules (Sprint 22, separately scoped per DECISION-12); does not retroactively validate Eastern Horoscope, which is intentionally a different, simpler domain (see isolation note, §17 of the Sprint 18 audit) | Same | Non-Tứ-Hóa tables, unless the founder also adopts Nam Phái generally, not just for this one table | Same |

**Selection status: PENDING. Not selected by this document.** If the founder or an engaged domain
expert selects Candidate A, B, C, or D (or a fifth candidate not listed above), record the choice by
filling the blank in the decision-form sentence and updating `domain-decision-register.md`
DECISION-01's status from `DOMAIN_EXPERT_REQUIRED` to `RESOLVED_BY_FOUNDER_DECISION` (mirroring
Eastern Horoscope's own DECISION-EH-01/EH-04 closure precedent) — with the reasoning recorded
verbatim, not merely the choice.

**Hard rule, restated:** no mixed-school implementation is allowed. Selecting Candidate A for the
general ruleset does not automatically resolve Tứ Hóa (§13 below) if Candidate A's own text does not
explicitly cover Tứ Hóa placement — that sub-decision must be confirmed against whichever source
covers it, once the general school is fixed.

---

## 2. Giờ Tý decision pack (DECISION-02)

### The ambiguity, precisely restated

Sprint 15's sourcing (`SECONDARY-GIOTY`) names two terms — "Giờ Tý Sơ" and "Giờ Tý Chính" — but the
sourced material itself does not unambiguously establish whether these are:
- **(Model A)** two alternative *whole-window* day-boundary conventions (the entire 23:00–00:59 Tý
  hour belongs to one civil day or the other, chosen once and applied consistently), or
- **(Model B)** a description of two *sub-periods within the same night's Tý hour* that both occur
  every night, with day-assignment potentially splitting *within* that single hour rather than the
  hour being assigned wholesale.

**This document does not guess which reading is correct — both are laid out below precisely so the
expert question is unambiguous regardless of which structural reading turns out to be right.**

### Precise decision table — expected treatment at each checkpoint, per model

| Time | Hour branch (all models agree) | Model A1 — whole window = CURRENT day | Model A2 — whole window = NEXT day | Model B — split within the hour (23:00–23:59 current, 00:00–00:59 next) |
|---|---|---|---|---|
| 22:59 | Hợi (no ambiguity) | current day | current day | current day |
| 23:00 | Tý begins | **current** day | **next** day | **current** day |
| 23:59 | Tý | current day | next day | current day |
| 00:00 | Tý continues | current day (of the 23:00 civil date, i.e. still "yesterday" relative to the clock) | next day | **next** day |
| 00:59 | Tý | same as 00:00 row | next day | next day |
| 01:00 | Sửu begins | next day (unambiguous — Tý hour has ended) | next day | next day |

**Astrological day / day Can Chi / lunar date used for day-dependent star placement:** these three
follow whichever civil-day assignment the resolved model produces above — none of Sprint 15's
sourcing suggests day Can Chi, astrological day, and the lunar date fed into day-dependent star
placement (e.g. the Tử Vi anchor's lunar-day input, §7 below) would ever diverge from each other
*once* the civil-day question is answered; they were not found to be three independently-resolved
questions, only one question (which civil day does 23:00–00:59 belong to) with three downstream
consumers. **This should be explicitly confirmed, not assumed, when the expert answers.**

### The exact question to ask

> **"For a birth at 23:30 Vietnam time, which civil/lunar day is used for all day-dependent Tử Vi
> calculations — the day that had already begun before 23:00 that night, or the day that begins at
> the next midnight? And is the answer the same for the entire 23:00–00:59 window, or does it split
> partway through (e.g. at 00:00), per Model B above?"**

**One unambiguous answer is required.** A response that says "it depends on the practitioner" is not
sufficient to unblock this gate — it must name the specific rule the selected school (§1) uses.

**Status: unresolved. `CONFLICT`, unchanged.**

---

## 3. Cung Mệnh rule (DECISION-04)

### Candidate rule, extracted exactly as previously sourced (not re-derived)

```
INPUT:
  tháng = lunar birth month, 1–12
  giờ   = birth-hour branch, indexed 1–12 counted from a fixed Dần(Tiger)=1 reference
          (Dần=1, Mão=2, Thìn=3, Tỵ=4, Ngọ=5, Mùi=6, Thân=7, Dậu=8, Tuất=9, Hợi=10, Tý=11, Sửu=12)

ALGORITHM:
  Starting branch:   Dần (index 1) — the fixed reference point both tháng and giờ are counted from
  Direction:         backward from the tháng-derived reference palace to the hour branch
  Count origin:      Dần = 1 (not 0-based)
  Inclusive/exclusive: inclusive of both endpoints, per the "+1" term in the formula
  Modulo behavior:   Mệnh = ((tháng − giờ) + 1); if the raw result is ≤ 0, add 12 to normalize into 1–12
```

**Source:** `SECONDARY-TVSG-MENH-THAN` (numeric formula) + one independent, differently-worded
second source describing the same forward/backward counting shape without a numeric formula
(structural agreement, not proof). **Neither is a primary text.**

### Three worked examples — `FORMULA-DERIVED — NOT SOURCE-VERIFIED`

| # | tháng (lunar month) | giờ (hour branch, index) | Raw calculation | Mệnh (candidate result) | For expert to confirm |
|---|---|---|---|---|---|
| E1 | 1 | Tý (11) | (1 − 11) + 1 = −9 → +12 → 3 | **Thìn** (index 3) | Does this match VDTTL-1956 (or whichever source §1 selects) for a lunar-month-1, hour-Tý birth? |
| E2 | 6 | Ngọ (5) | (6 − 5) + 1 = 2 | **Mão** (index 2) | Does this match for a lunar-month-6, hour-Ngọ birth? |
| E3 | 12 | Hợi (10) | (12 − 10) + 1 = 3 | **Thìn** (index 3) | Does this match for a lunar-month-12, hour-Hợi birth? Note E1 and E3 both land on Thìn from different inputs — expert should confirm this coincidence is expected, not a formula error. |

**Status: unresolved. `DOMAIN_EXPERT_REQUIRED` — do not implement from this formula alone**, per the
existing register's own instruction, restated here rather than weakened.

---

## 4. Cung Thân rule (DECISION-04, same register item as Mệnh)

### Candidate rule

```
INPUT:  same tháng / giờ definitions as Mệnh (§3) — same starting branch (Dần=1), same indexing.
ALGORITHM:
  Direction:  forward from the tháng-derived reference palace to the hour branch — the MIRROR of
              Mệnh's backward count, not a separately-anchored calculation
  Formula:    Thân = ((tháng + giờ) − 1); if the raw result is > 12, subtract 12 to normalize into 1–12
```

**Explicitly confirmed from the sourced material, not assumed:**
- **Same starting branch as Mệnh?** Yes — both formulas key off the same Dần=1 reference and the
  same tháng/giờ inputs; no separate starting point was found or should be assumed for Thân.
- **Opposite direction?** Yes — Mệnh counts backward (subtracts giờ), Thân counts forward (adds
  giờ). This is stated as a mirror relationship, not derived as an afterthought.
- **Same month/hour indexing?** Yes — same 1–12 Dần-anchored indexing for both tháng and giờ; no
  evidence found of a second, different indexing convention for Thân specifically.
- **Thân is NOT assumed to be a purely arithmetic inverse of Mệnh** (e.g., not "Thân = 13 − Mệnh") —
  the two formulas happen to produce a mirror-like relationship for many inputs because of their
  shared structure, but they are two independently-stated formulas, and `golden-vector-specification.
  md`'s own invariant list already notes Thân may legitimately coincide with Mệnh, which a naive
  "always the opposite" assumption would preclude for some inputs.

### Three worked examples — `FORMULA-DERIVED — NOT SOURCE-VERIFIED`

| # | tháng | giờ (index) | Raw calculation | Thân (candidate result) | For expert to confirm |
|---|---|---|---|---|---|
| E1 | 1 | Tý (11) | (1 + 11) − 1 = 11 | **Tý** (index 11) | Paired with Mệnh E1 (Thìn) — do Mệnh and Thân correctly land on different palaces here? |
| E2 | 6 | Ngọ (5) | (6 + 5) − 1 = 10 | **Hợi** (index 10) | Paired with Mệnh E2 (Mão) |
| E3 | 12 | Hợi (10) | (12 + 10) − 1 = 21 → −12 → 9 | **Tuất** (index 9) | Paired with Mệnh E3 (Thìn) |

**Status: unresolved. `DOMAIN_EXPERT_REQUIRED`**, gated together with Mệnh under DECISION-04.

---

## 5. Cục table resolution (DECISION-05) — HARD GATE

### Required output table — template only, no cell filled from memory

**Target:** every combination of Cung Mệnh branch (12 values) × Can năm sinh (10 values) → one of
the five valid Cục outputs:

```
Thủy Nhị Cục    (2)
Mộc Tam Cục     (3)
Kim Tứ Cục      (4)
Thổ Ngũ Cục     (5)
Hỏa Lục Cục     (6)
```

**Table shape (120 cells: 12 Mệnh-branch rows × 10 Can-năm columns):**

| Mệnh branch \ Can năm | Giáp | Ất | Bính | Đinh | Mậu | Kỷ | Canh | Tân | Nhâm | Quý |
|---|---|---|---|---|---|---|---|---|---|---|
| Tý | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Sửu | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Dần | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Mão | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Thìn | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Tỵ | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Ngọ | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Mùi | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Thân | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Dậu | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Tuất | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Hợi | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

**One cell has a partial lead, not a confirmed source-backed entry:** Bính-year, Mệnh at Dậu → "Hỏa
Lục Cục" (`SECONDARY-TNT`'s single worked example). **This is not populated into the table above**
because it fails the population requirement below (no `SOURCE_PAGE`, only a secondary-source
citation chain; no `SECONDARY_CONFIRMATION` from an independent second source for this specific
cell). It is recorded here only as the closest existing lead.

### Population requirement, per cell, before any cell may be marked resolved

```
CELL: [Mệnh branch, Can năm]
VALUE: [one of the 5 Cục names]
SOURCE_PAGE:            (page/section of the selected §1 primary text, or equivalent primary
                         reference — not a secondary summary)
SOURCE_ROW/COLUMN:       (if the primary source itself presents this as a table — its own row/column
                         reference, for auditability)
SECONDARY_CONFIRMATION:  (a second, independent source confirming the same cell value)
```

**Do not mark this table complete until every reachable combination is sourced this way.** The named
methodology (Cục = Nạp Âm of the Can-Chi of the month containing Mệnh) implies the table is
mechanically derivable *once* (a) the Mệnh formula (§3) is confirmed, (b) the month→Can-Chi mapping
is confirmed, and (c) the 60-cell Nạp Âm compound-element table itself is sourced — meaning this
120-cell table may ultimately be filled by verifying the *derivation mechanism* plus the Nạp Âm
table, rather than needing 120 independently-sourced cells one at a time. **This is stated as a
possible resolution path, not itself a resolution** — the Nạp Âm table itself remains equally
unsourced in this project's research to date, so this path still requires new primary-source access.

**Status: unresolved. `UNSOURCED`. Hard gate remains BLOCKED.**

---

## 6. Tử Vi anchor table resolution (DECISION-06) — CRITICAL HARD GATE

### Required extraction template

**Target:** lunar day 1–30 × 5 Cục values → Tử Vi palace (or, if the selected source states an
algorithm instead of a raw lookup table, the exact algorithm — see below).

**Table shape (up to 150 cells: 30 lunar-day rows × 5 Cục columns; note not every Cục actually
extends its cycle to day 30 — the maximum relevant lunar day for a given Cục is itself part of what
must be sourced, not assumed):**

| Lunar day | Thủy Nhị (2) | Mộc Tam (3) | Kim Tứ (4) | Thổ Ngũ (5) | Hỏa Lục (6) |
|---|---|---|---|---|---|
| 1 | TBD | TBD | TBD | TBD | TBD |
| 2 | TBD | TBD | TBD | TBD | TBD |
| 3 | TBD | TBD | TBD | TBD | TBD |
| … | … | … | … | … | … |
| 30 | TBD | TBD | TBD | TBD | TBD |

*(Full 30-row grid to be completed following this exact header shape once sourced — not reproduced
cell-by-cell here, since every cell is currently `TBD` and repeating that 150 times adds no
information.)*

### If the selected source defines an algorithm instead of a raw table

Record, exactly, not approximated:

```
EXACT DIVISIBILITY RULE:   (what happens when lunar day ÷ Cục number divides evenly — TBD)
REMAINDER BEHAVIOR:        (what happens for every possible non-zero remainder — TBD, must cover
                            every remainder value for every Cục, not just a general description)
FORWARD/BACKWARD DIRECTION: (which direction the placement moves when applying the remainder — TBD)
PALACE INDEXING:           (0-based or 1-based; which palace is index 0/1 — TBD)
WRAPAROUND:                (exact behavior when a computed position exceeds 12 or goes below the
                            first palace — TBD)
```

**No missing row or cell is inferred here.** `star-placement-rules.md` itself already states this
table was not located in Sprint 15's research; this pass's own re-audit (`sprint-18-pre-
implementation-audit.md` §11) confirms nothing has changed since. **This document adds no new data
here — it only formalizes exactly what shape the missing data must take once found, so a
primary-text transcriber can fill this table directly without needing to design its structure
first.**

**Status: unresolved. `UNSOURCED`. Critical hard gate remains BLOCKED — every one of the 14 chính
tinh (§7) is placed relative to this table's output.**

---

## 7. 14 Chính Tinh resolution pack (DECISION-06 anchor + DECISION-07 remaining 13)

**Group-direction semantics — restated precisely, for explicit expert confirmation (not yet
confirmed against a primary source):**

> **"Does the Tử Vi group (6 stars) walk in reverse (nghịch) order starting from Tử Vi's own placed
> palace, and does the Thiên Phủ group (8 stars) walk in forward (thuận) order starting from Thiên
> Phủ's palace (itself fixed in mirror position to Tử Vi across the Tị/Hợi axis) — exactly as
> `SECONDARY-14STARS-STRUCTURE` describes, or does the selected primary source (§1) state a
> different group-direction rule?"**

| Star | Anchor | Offset | Direction | Dependency | Source | Worked example | Status |
|---|---|---|---|---|---|---|---|
| Tử Vi | self (0) | — | — | Tử Vi anchor table (§6) | `SECONDARY-14STARS-STRUCTURE` (structure only) | None — anchor itself unresolved | `UNSOURCED` |
| Thiên Cơ | Tử Vi | reported "one position apart" — exact value unconfirmed | reverse (per group semantics above, pending confirmation) | Tử Vi anchor | same | None | `UNSOURCED` |
| Thái Dương | Tử Vi | not stated | reverse (pending confirmation) | Tử Vi anchor | none found | None | `UNSOURCED` |
| Vũ Khúc | Tử Vi | not stated | reverse (pending confirmation) | Tử Vi anchor | none found | None | `UNSOURCED` |
| Thiên Đồng | Tử Vi | reported "two positions apart" (anchor-relative value unconfirmed) | reverse (pending confirmation) | Tử Vi anchor | `SECONDARY-14STARS-STRUCTURE` | None | `UNSOURCED` |
| Liêm Trinh | Tử Vi | not stated | reverse (pending confirmation) | Tử Vi anchor | none found | None | `UNSOURCED` |
| Thiên Phủ | self (0, mirrored from Tử Vi) | — | — | Tử Vi anchor (mirror relationship) | `SECONDARY-14STARS-STRUCTURE` | None | `UNSOURCED` |
| Thái Âm | Thiên Phủ | not stated | forward (pending confirmation) | Thiên Phủ anchor | none found | None | `UNSOURCED` |
| Tham Lang | Thiên Phủ | not stated | forward (pending confirmation) | Thiên Phủ anchor | none found | None | `UNSOURCED` |
| Cự Môn | Thiên Phủ | not stated | forward (pending confirmation) | Thiên Phủ anchor | none found | None | `UNSOURCED` |
| Thiên Tướng | Thiên Phủ | not stated | forward (pending confirmation) | Thiên Phủ anchor | none found | None | `UNSOURCED` |
| Thiên Lương | Thiên Phủ | not stated | forward (pending confirmation) | Thiên Phủ anchor | none found | None | `UNSOURCED` |
| Thất Sát | Thiên Phủ | reported "three positions apart" (anchor-relative value unconfirmed) | forward (pending confirmation) | Thiên Phủ anchor | `SECONDARY-14STARS-STRUCTURE` | None | `UNSOURCED` |
| Phá Quân | Thiên Phủ | not stated | forward (pending confirmation) | Thiên Phủ anchor | none found | None | `UNSOURCED` |

**Empty-palace (vô chính diệu) handling:** confirmed as a real, named, expected outcome of a
correctly-run placement (not a bug), but the specific rule for when it legitimately occurs and how it
should be handled downstream (interpretation-gating, etc.) remains `UNSOURCED`.

**Status: all 14 rows `UNSOURCED`. Group structure is the only corroborated element — not sufficient
to place a single chart. Critical hard gate remains BLOCKED.**

---

## 8. MVP auxiliary-star list — founder lock (DECISION-08, list-confirmation half)

### Proposed minimum set, carried forward from the product definition's own §4D candidate list

**This is a proposal for founder review, not a locked decision.** The product definition itself
already states this exact caveat: *"this set is not invented here — it must be confirmed against the
authoritative source chosen... not assumed correct because it appears in this list."*

| Star | Proposed classification | Rationale |
|---|---|---|
| Tả Phù | `MVP_REQUIRED` (proposed) | Part of the standard "6 auspicious stars" grouping, consistently named as load-bearing across every source touching this set |
| Hữu Bật | `MVP_REQUIRED` (proposed) | Same grouping |
| Văn Xương | `MVP_REQUIRED` (proposed) | Same grouping |
| Văn Khúc | `MVP_REQUIRED` (proposed) | Same grouping |
| Thiên Khôi | `MVP_REQUIRED` (proposed) | Same grouping |
| Thiên Việt | `MVP_REQUIRED` (proposed) | Same grouping |
| Địa Không | `MVP_REQUIRED` (proposed, lower confidence) | Named in the product definition's original 13-star list; not independently re-confirmed as load-bearing this session |
| Địa Kiếp | `MVP_REQUIRED` (proposed, lower confidence) | Same caveat |
| Lộc Tồn | `MVP_REQUIRED` (proposed, lower confidence) | Same caveat |
| Kình Dương | `MVP_REQUIRED` (proposed, lower confidence) | Same caveat |
| Đà La | `MVP_REQUIRED` (proposed, lower confidence) | Same caveat |
| Hỏa Tinh | `MVP_REQUIRED` (proposed, lower confidence) | Same caveat |
| Linh Tinh | `MVP_REQUIRED` (proposed, lower confidence) | Same caveat |

**Founder question:** *"Does this 13-star list match what the selected primary source (§1) treats as
load-bearing? Should any of the lower-confidence 7 (Địa Không through Linh Tinh) be reclassified
`DEFERRED` or `OUT_OF_SCOPE` for V1?"*

**Status: PENDING FOUNDER LOCK.** Per this task's own instruction, placement-rule sourcing (§9 below)
should not proceed star-by-star until this list is locked, to avoid sourcing effort on a star that
gets deferred.

---

## 9. Auxiliary-star rule extraction (DECISION-08, placement-rule half — blocked on §8's lock)

Template only, prepared in advance so sourcing can begin the moment §8 locks:

| Star | Input basis (typical pattern, NOT a sourced rule) | Starting point | Direction | Offset/table | Wraparound | Source | Worked example |
|---|---|---|---|---|---|---|---|
| Tả Phù | lunar month (typical pattern for this star family — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Hữu Bật | lunar month (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Văn Xương | birth hour (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Văn Khúc | birth hour (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Thiên Khôi | year Stem (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Thiên Việt | year Stem (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Địa Không | birth hour (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Địa Kiếp | birth hour (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Lộc Tồn | year Stem (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Kình Dương | Lộc Tồn's resulting palace (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Đà La | Lộc Tồn's resulting palace (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Hỏa Tinh | year Branch (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |
| Linh Tinh | year Branch (typical pattern — unconfirmed) | TBD | TBD | TBD | TBD | none found | none |

**"Typical pattern" column is explicitly flagged as background context only, carried forward from
this pass's own prior adversarial-review note (`sprint-18-pre-implementation-audit.md` §13) — it is
not a sourced rule and must not be implemented from.** **No prose-only rule will be acceptable when
sourcing resumes; every populated row must be transcribable into a deterministic test per §16's
standard below.**

**Status: unresolved for every star. `UNSOURCED`.**

---

## 10. Tuần resolution (DECISION-09, Tuần half)

```
INPUT:                 which "Tuần Giáp" (decade group within the 60-year sexagenary cycle) the
                        birth year falls into
10-DAY-CYCLE / BASIS:   the birth year's position within a 60-year cycle, grouped into 10-year
                        ("Tuần Giáp") bands — the specific grouping boundaries themselves are not
                        yet sourced
AFFECTED PALACES:       exactly 2, per palace (branches/positions not yet sourced)
TABLE:                  TBD — mapping each Tuần-Giáp group to its specific 2-palace pair
```

**Required: at least 3 worked examples, none currently available.** Template for when sourced:

| # | Birth year | Tuần Giáp group | Affected palace 1 | Affected palace 2 | Source location |
|---|---|---|---|---|---|
| 1 | TBD | TBD | TBD | TBD | TBD |
| 2 | TBD | TBD | TBD | TBD | TBD |
| 3 | TBD | TBD | TBD | TBD | TBD |

**Status: unresolved. `UNSOURCED`** for the table; `RESOLVED_BY_SOURCE` only for the narrow claim
that Tuần's input basis is the Tuần-Giáp decade group (distinct from Triệt's basis, §11).

---

## 11. Triệt resolution (DECISION-09, Triệt half — independently extracted, not assumed to mirror Tuần)

```
INPUT BASIS:            the birth year's Heavenly Stem (Can) alone — explicitly NOT the same input
                        as Tuần; confirmed as a real structural difference, not assumed
AFFECTED PAIR:           exactly 2 palaces, different from Tuần's pair (not guaranteed related to
                        Tuần's pair in any fixed way per sourcing found)
TABLE:                  TBD — mapping each of the 10 Can values to its specific 2-palace pair
```

**Required: at least 3 worked examples, none currently available.** Template:

| # | Can năm | Affected palace 1 | Affected palace 2 | Source location |
|---|---|---|---|---|
| 1 | TBD | TBD | TBD | TBD |
| 2 | TBD | TBD | TBD | TBD |
| 3 | TBD | TBD | TBD | TBD |

**Status: unresolved. `UNSOURCED`** for the table; `RESOLVED_BY_SOURCE` only for the narrow claim
that Triệt's input basis (Can alone) differs from Tuần's (decade group).

---

## 12. Tứ Hóa school-conflict resolution (DECISION-10) — HARD GATE

### Step 1 — school selection (blocks Step 2)

The real, named conflict, restated precisely: **Bắc Phái** treats Tứ Hóa as the structural core of
the entire reading method; **Nam Phái** (specifically the Trung Châu / Lục Bân Triệu / Khâm Thiên
lineage named in sourcing) derives Tứ Hóa placement from the birth-year Heavenly Stem. The source
itself states plainly that Tử Vi schools generally "do not have unified views" on this rule
specifically.

**This cannot be answered independently of §1 (canonical school).** If §1 selects Candidate A
(VDTTL-1956, the Vietnamese-adapted tradition), the expert must additionally confirm whether that
specific text treats Tứ Hóa per the Bắc Phái or Nam Phái convention — the general school selection
does not automatically resolve this sub-question, since VDTTL-1956's own Tứ Hóa treatment was not
independently checked in Sprint 15's research.

### Step 2 — the table itself, once Step 1 resolves

**Required output: complete 10 Can × 4 transformation table.**

| Can năm | Hóa Lộc | Hóa Quyền | Hóa Khoa | Hóa Kỵ |
|---|---|---|---|---|
| Giáp | TBD | TBD | TBD | TBD |
| Ất | TBD | TBD | TBD | TBD |
| Bính | TBD | TBD | TBD | TBD |
| Đinh | TBD | TBD | TBD | TBD |
| Mậu | TBD | TBD | TBD | TBD |
| Kỷ | TBD | TBD | TBD | TBD |
| Canh | TBD | TBD | TBD | TBD |
| Tân | TBD | TBD | TBD | TBD |
| Nhâm | TBD | TBD | TBD | TBD |
| Quý | TBD | TBD | TBD | TBD |

Each cell value must name which of the 14 chính tinh or auxiliary stars receives that transformation
for that Can. **Every cell must be source-backed to the school selected in Step 1 — no cell may be
filled from a different school's table, and no cell may be filled from general "common knowledge" of
Tứ Hóa, given the explicit, sourced conflict.**

**Status: unresolved on both steps. `DOMAIN_EXPERT_REQUIRED`. Hard gate remains BLOCKED.**

---

## 13. Golden-vector acquisition plan (§14/§15 of this task's brief)

**Current count: 0.** This section is a concrete *acquisition plan* — which vectors to seek and what
each must cover — not populated vector data, per this task's own explicit instruction not to
generate vectors from a future engine or fill them from memory.

### Planned vector slate (12–15 target, no double-counting in the headline count)

| Vector ID | Primary coverage purpose | Secondary coverage folded in (same chart, no separate count) |
|---|---|---|
| V1 | Baseline normal date, Cục = Thủy Nhị | One Tứ Hóa Can, general 14-star placement sanity check |
| V2 | Baseline normal date, Cục = Mộc Tam, different Can/Chi from V1 | Different Tứ Hóa Can |
| V3 | Baseline normal date, Cục = Kim Tứ | Different Tứ Hóa Can |
| V4 | Baseline normal date, Cục = Thổ Ngũ | Different Tứ Hóa Can |
| V5 | Baseline normal date, Cục = Hỏa Lục | Different Tứ Hóa Can — completes all-5-Cục coverage across V1–V5 |
| V6 | Leap lunar month birth | Exercises DECISION-03's eventual resolution directly |
| V7 | Lunar New Year (Tết) boundary birth | Calendar-layer edge case, mirrors Eastern Horoscope's own B1–B4-style vectors |
| V8 | 22:59 boundary (just before Tý) | Exercises DECISION-02's "Sơ" side |
| V9 | 23:00 boundary (Tý begins) | Exercises DECISION-02 directly at the named ambiguity point |
| V10 | 00:00 boundary (midnight, within Tý) | Exercises DECISION-02's "Chính" side / Model B split point (§2) |
| V11 | Chosen specifically to force a Tử Vi placement remainder case (non-exact Cục division) | Also a palace-wraparound case if the resulting position crosses palace 12→1 |
| V12 | Chosen specifically to produce a dense multi-star palace (main-star wraparound stress case) | Tests the adversarial "group inversion" risk flagged in the Sprint 18 audit §23 |
| V13 | Distinct birth hour set exercising month-based auxiliary stars (Tả Phù/Hữu Bật) and hour-based auxiliary stars (Văn Xương/Văn Khúc) together | Covers 2 of the 4 auxiliary input-basis categories in one chart |
| V14 | Distinct year-Stem/year-Branch combination exercising year-Stem-based (Thiên Khôi/Thiên Việt/Lộc Tồn) and year-Branch-based (Hỏa Tinh/Linh Tinh) auxiliary stars together | Covers the remaining 2 auxiliary input-basis categories |
| V15 | Chosen specifically to exercise both Tuần and Triệt simultaneously with non-overlapping palace pairs | Confirms the "up to 4 palaces affected, independently positioned" structural claim from `SECONDARY-TUANTRIET-BASIS` |

**Coverage checklist cross-reference (from `golden-vector-specification.md`, all still "Not yet
sourced," this plan does not change that):** normal date ✓(V1–V5), leap lunar month ✓(V6), lunar-
year boundary ✓(V7), 22:59 ✓(V8), 23:00 ✓(V9), 23:59/00:00 ✓(V10), all 12 birth-hour branches
(distributed across V1–V15, to be confirmed once specific inputs are sourced), all 5 Cục ✓(V1–V5),
Tử Vi remainder cases ✓(V11), palace wraparound ✓(V11/V12), both main-star groups ✓(V12 stress case
+ general coverage across all vectors), month-based aux ✓(V13), hour-based aux ✓(V13), year-Stem-
based aux ✓(V14), year-Branch-based aux ✓(V14), Tuần ✓(V15), Triệt ✓(V15), all 10 Stems for Tứ Hóa
(distributed across V1–V5 plus additional Can values needed in V6–V15 to reach all 10 — must be
tracked explicitly once real inputs are chosen, not assumed to fall out automatically).

### Vector record template (per vector, once sourced — restated from `golden-vector-specification.md`, unchanged)

```
VECTOR_ID
INPUT (birthDate, birthTime, timezone/location assumptions, gender if required)
SOURCE_1  (primary — named text/practitioner/calculator with shown work)
SOURCE_2  (independent second source or reviewer confirming the same chart)
EXPECTED_LUNAR        (incl. leap flag)
EXPECTED_CAN_CHI       (năm/tháng/ngày/giờ as resolved)
EXPECTED_MENH
EXPECTED_THAN
EXPECTED_CUC
EXPECTED_12_CUNG
EXPECTED_14_MAIN_STARS
EXPECTED_MVP_AUX
EXPECTED_TUAN
EXPECTED_TRIET
EXPECTED_TU_HOA
REVIEWER_1
REVIEWER_2
STATUS   (UNVERIFIED / SOURCE_EXTRACTED / CROSS_CHECKED / EXPERT_CONFIRMED — see §14 below)
```

**If a source only verifies part of a chart** (e.g., confirms Cục but not star placement), the
unverified fields must be recorded as `UNVERIFIED`, never filled in by inference from the verified
fields or from the future engine — restated from `golden-vector-specification.md`'s own rule,
unchanged.

**Status: acquisition plan exists (this section); 0 of 15 planned vectors are populated.**

---

## 14. Source extraction standard (formalized, for use on every rule as sourcing resumes)

```
RULE_ID                  (maps to a DECISION-xx item above)
SOURCE_ID                (per authoritative-sources.md's registry, or a newly registered one)
SOURCE_PAGE
SOURCE_SECTION
ORIGINAL_TEXT_SUMMARY    (what the source actually says, in its own terms)
NORMALIZED_RULE          (the rule restated in this project's canonical notation)
WORKED_EXAMPLE           (at least one, ideally from the source itself)
SECONDARY_CONFIRMATION   (a second, independent source or reviewer)
REVIEW_STATUS
```

**Allowed `REVIEW_STATUS` values, in ascending order of confidence:**

| Status | Meaning |
|---|---|
| `UNVERIFIED` | A candidate value/rule exists but has not been checked against any source at all (e.g., this document's own "typical pattern" auxiliary-star notes) |
| `SOURCE_EXTRACTED` | Directly transcribed from a named source, not yet independently cross-checked |
| `CROSS_CHECKED` | Confirmed by a second, independent source or reviewer |
| `EXPERT_CONFIRMED` | A domain expert has explicitly confirmed the rule against the selected canonical school (§1) |

**Only `EXPERT_CONFIRMED`, or an explicitly-approved equivalent (e.g., a primary-text page reference
independently transcribed and reviewed by two people, matching `golden-vector-specification.md`'s
own acceptable-provenance chain), may unblock a hard gate.** `SOURCE_EXTRACTED` and `CROSS_CHECKED`
are legitimate intermediate progress states, useful for tracking, but insufficient alone to move a
hard-gated decision (Cục, Tử Vi anchor, 14 chính tinh, Tứ Hóa) to implementation-ready.

Every candidate/formula referenced elsewhere in this document (Mệnh/Thân formula, group-direction
structure, Cục methodology, Tuần/Triệt input bases) is currently at `SOURCE_EXTRACTED` at best (most
via a secondary source, not yet cross-checked against a primary text) — **none is `EXPERT_CONFIRMED`,
and none is being treated as if it were.**

---

## 15. Implementation readiness checklist

| Gate | Ready? |
|---|---|
| One canonical school | ☐ Not resolved |
| Giờ Tý | ☐ Not resolved |
| Mệnh | ☐ Not resolved (candidate formula only, `DOMAIN_EXPERT_REQUIRED`) |
| Thân | ☐ Not resolved (candidate formula only, `DOMAIN_EXPERT_REQUIRED`) |
| Complete Cục mapping | ☐ Not resolved (0 of 120 cells source-backed) |
| Complete Tử Vi anchor rule | ☐ Not resolved (0 of up to 150 cells / no algorithm sourced) |
| Complete 14 Chính Tinh rules | ☐ Not resolved (0 of 14 offsets sourced; group structure only) |
| Locked MVP auxiliary-star list | ☐ Not resolved (proposed list only, pending founder lock) |
| Sourced MVP auxiliary-star rules | ☐ Not resolved (0 of 13 stars) |
| Tuần | ☐ Not resolved (0 of the Tuần-Giáp-group table) |
| Triệt | ☐ Not resolved (0 of the Can table) |
| One canonical Tứ Hóa mapping | ☐ Not resolved (school conflict unresolved; 0 of 40 cells) |
| Sufficient independent golden vectors | ☐ Not resolved (0 of 15 planned vectors populated) |

**No partial pass. All thirteen items remain unchecked.**

---

## Sprint 18 — Tử Vi Domain Resolution Pack — Summary Report

1. **Canonical school status:** Unresolved. Candidate A (Vân Đằng Thái Thứ Lang, 1956) recommended,
   not selected. Decision form prepared (§1).
2. **Giờ Tý status:** Unresolved, `CONFLICT`. Precise decision table and single expert question
   prepared (§2), including a third structural model (split-within-hour) not previously
   distinguished in Sprint 15's own framing.
3. **Mệnh status:** Unresolved, `DOMAIN_EXPERT_REQUIRED`. Candidate formula fully specified, 3
   formula-derived (unverified) worked examples prepared for expert confirmation (§3).
4. **Thân status:** Unresolved, `DOMAIN_EXPERT_REQUIRED`. Same treatment, explicitly not assumed to
   be Mệnh's arithmetic inverse, 3 worked examples prepared (§4).
5. **Cục table completeness:** 0 of 120 required cells source-backed. Full template prepared with
   per-cell population requirements (§5).
6. **Tử Vi anchor completeness:** 0 of up to 150 cells / no algorithm sourced. Extraction template and
   required algorithmic fields (divisibility, remainder, direction, indexing, wraparound) prepared
   (§6).
7. **14 Chính Tinh completeness:** 0 of 14 offsets sourced. Group-direction confirmation question and
   full per-star extraction table prepared (§7).
8. **MVP auxiliary-star list status:** Proposed 13-star list carried forward from the product
   definition, pending founder lock (§8) — not yet locked.
9. **Auxiliary-star rule completeness:** 0 of 13 stars sourced. Per-star template prepared, with
   "typical pattern" input-basis notes explicitly flagged as unsourced background only (§9).
10. **Tuần status:** Unresolved, `UNSOURCED`. Input basis confirmed, table absent, 3-example template
    prepared (§10).
11. **Triệt status:** Unresolved, `UNSOURCED`. Independently confirmed different input basis from
    Tuần, table absent, 3-example template prepared (§11).
12. **Tứ Hóa status:** Unresolved, `DOMAIN_EXPERT_REQUIRED`, real Bắc/Nam conflict. Two-step
    resolution (school, then table) formalized; 40-cell template prepared (§12).
13. **Golden-vector count:** 0.
14. **Golden-vector completeness:** Acquisition plan for 15 purposefully-covering vectors prepared
    (§13), collectively covering every required dimension with no double-counting in the headline
    count; 0 vectors actually populated.
15. **Expert-confirmed items:** **None.** Zero `EXPERT_CONFIRMED` rules exist anywhere in this pack.
16. **Source-extracted-only items:** Mệnh/Thân candidate formula, 14-star group structure, Cục
    category names/methodology shape, Tuần/Triệt input-basis distinction — all `SOURCE_EXTRACTED` at
    best (secondary sources), none cross-checked against a primary text.
17. **Remaining unsourced items:** Cục table, Tử Vi anchor table, 13 non-anchor star offsets, all 13
    auxiliary-star placement rules, Tuần table, Triệt table, Tứ Hóa table (both schools) — 0% source-
    backed for all of these.
18. **Remaining conflicts:** School/tradition selection (§1), giờ Tý convention (§2), Tứ Hóa Bắc Phái
    vs. Nam Phái (§12) — three real, named, unresolved conflicts, none worked around.
19. **Remaining founder decisions:** Canonical school selection (§1); MVP auxiliary-star list lock
    (§8); (out of this pack's scope but still open per the register) Miếu/Vượng/Đắc/Hãm inclusion
    scope call (DECISION-11).
20. **Remaining expert decisions:** Giờ Tý convention confirmation (§2); Mệnh/Thân formula
    confirmation (§3/§4); Cục table extraction (§5); Tử Vi anchor + 14-star offset extraction (§6/
    §7); auxiliary-star placement extraction (§9); Tuần/Triệt table extraction (§10/§11); Tứ Hóa
    table extraction, once school is fixed (§12).
21. **Sprint 18 readiness:** **Not ready.** All 13 items on the readiness checklist (§15) remain
    unchecked. This pack makes each blocker precisely answerable; it does not itself answer any of
    them.
22. **Files created/modified:** `docs/domain/tu-vi/domain-resolution-pack.md` (this document) created.
    No other file created or modified. No application code, Prisma schema, migration, API route, or
    frontend page touched.
23. **Git status:** `?? docs/domain/tu-vi/domain-resolution-pack.md` (new, untracked) alongside the
    prior session's `?? docs/audit/sprint-18-pre-implementation-audit.md`. No previously-tracked file
    changed (`git diff --stat`/`git diff --check` empty).
24. **Commit/push status:** Nothing staged, nothing committed, nothing pushed this session.
    `origin/master` remains `c1c8b8f`; local `HEAD` remains `cfe0824`, unchanged by this pass.
25. **Recommended next action:** Engage a Vietnamese Tử Vi Đẩu Số domain expert (or obtain direct
    primary-text access to `VDTTL-1956`/`TD-TOANTHU`) and work through this pack's decision forms in
    the priority order they naturally imply: (1) school selection (§1) — unblocks nearly everything
    else; (2) Mệnh/Thân confirmation (§3/§4) — fastest single item to close given the existing
    candidate formula; (3) Cục table (§5) and Tử Vi anchor (§6) together, since both gate the star
    layer; (4) 14-star offsets (§7); (5) Tứ Hóa (§12), once school is fixed; (6) auxiliary stars/
    Tuần/Triệt (§8–§11), correctly lowest priority per Sprint 15's own original sequencing rationale,
    unchanged here.

### Final verdict

**DOMAIN RESOLUTION INCOMPLETE — DO NOT IMPLEMENT SPRINT 18**

This document converts every open blocker into a precise, answerable form — exact decision
sentences, exact table shapes, exact worked-example templates, one unambiguous question per
conflict — but resolves none of them itself, per this task's own explicit instruction not to infer
missing rules from memory or broaden research. Zero items reach `EXPERT_CONFIRMED`. Zero golden
vectors are populated. All three real, named conflicts (school, giờ Tý, Tứ Hóa) remain open. Sprint
18 implementation must not begin until a domain expert or direct primary-source access closes these
forms — this pack exists to make that process as fast and unambiguous as possible when it happens,
not to substitute for it.
