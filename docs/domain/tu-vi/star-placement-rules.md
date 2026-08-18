# Vietnamese Tử Vi Đẩu Số — Star Placement Rules (Sprint 15, spec only)

Every rule below is stated at the confidence level the research this sprint actually supports —
see `authoritative-sources.md` for citations and `domain-decision-register.md` for the formal
status of each underlying decision. **No table in this document is complete or implementation-
ready.** That is the intended, honest output of this sprint.

---

## 14 Chính Tinh (main stars)

### Group structure (CORROBORATING — see `domain-decision-register.md` DECISION-07)

Two fixed-relationship groups, walking in opposite directions from their respective anchor stars:

**Tử Vi group (6 stars, walks in reverse/nghịch direction from Tử Vi's palace):**

| # | Star | Offset from Tử Vi | Direction | Wraparound | Source | Status |
|---|---|---|---|---|---|---|
| 1 | Tử Vi | 0 (anchor) | — | — | `SECONDARY-14STARS-STRUCTURE` | UNSOURCED (anchor placement itself — see DECISION-06) |
| 2 | Thiên Cơ | reported "one position apart" | reverse | not verified | `SECONDARY-14STARS-STRUCTURE` | UNSOURCED (exact offset not confirmed) |
| 3 | Thái Dương | not stated | reverse | not verified | — | UNSOURCED |
| 4 | Vũ Khúc | not stated | reverse | not verified | — | UNSOURCED |
| 5 | Thiên Đồng | reported "two positions apart" (from an adjacent star, exact anchor-relative offset unclear) | reverse | not verified | `SECONDARY-14STARS-STRUCTURE` | UNSOURCED |
| 6 | Liêm Trinh | not stated | reverse | not verified | — | UNSOURCED |

**Thiên Phủ group (8 stars, walks in forward/thuận direction from Thiên Phủ's palace, itself fixed
opposite Tử Vi across the Tị/Hợi axis):**

| # | Star | Offset from Thiên Phủ | Direction | Wraparound | Source | Status |
|---|---|---|---|---|---|---|
| 1 | Thiên Phủ | 0 (anchor, mirrored from Tử Vi) | — | — | `SECONDARY-14STARS-STRUCTURE` | UNSOURCED (depends on Tử Vi anchor, DECISION-06) |
| 2 | Thái Âm | not stated | forward | not verified | — | UNSOURCED |
| 3 | Tham Lang | not stated | forward | not verified | — | UNSOURCED |
| 4 | Cự Môn | not stated | forward | not verified | — | UNSOURCED |
| 5 | Thiên Tướng | not stated | forward | not verified | — | UNSOURCED |
| 6 | Thiên Lương | not stated | forward | not verified | — | UNSOURCED |
| 7 | Thất Sát | reported "three positions apart" (exact anchor-relative offset unclear) | forward | not verified | `SECONDARY-14STARS-STRUCTURE` | UNSOURCED |
| 8 | Phá Quân | not stated | forward | not verified | — | UNSOURCED |

**What this table is useful for:** confirming the *engine design* should implement two independent
directional "walks" from two mirrored anchor points, rather than 14 unrelated lookup rules — a real,
useful structural finding. **What it cannot do:** produce a single correct chart. Every offset must
be confirmed from a primary source (ideally the same one that resolves DECISION-01/06) before any
value in the "Offset" column is trusted.

**Empty-palace (vô chính diệu) case:** the product definition explicitly requires handling this (§4C
— "a chart that omits... an empty-palace case is not MVP-complete"). No source in this session
described the specific rule for when a palace legitimately has zero chính tinh, beyond it being a
known, named, expected outcome of the placement algorithm (not a bug). Status: `UNSOURCED` for the
specific downstream handling/interpretation rule, though structurally implied by any correctly
implemented offset table.

---

## Auxiliary stars (MVP set per product definition §4D)

The product definition's candidate 13-star MVP list, cross-checked against what this session found:

| Star | Confirmed as a recognized "load-bearing" star this session? | Placement rule found? | Status |
|---|---|---|---|
| Tả Phù | Yes — part of the standard "6 auspicious stars" grouping | No | UNSOURCED |
| Hữu Bật | Yes — same grouping | No | UNSOURCED |
| Văn Xương | Yes — same grouping | No | UNSOURCED |
| Văn Khúc | Yes — same grouping | No | UNSOURCED |
| Thiên Khôi | Yes — same grouping | No | UNSOURCED |
| Thiên Việt | Yes — same grouping | No | UNSOURCED |
| Địa Không | Not independently confirmed this session | No | UNSOURCED |
| Địa Kiếp | Not independently confirmed this session | No | UNSOURCED |
| Lộc Tồn | Not independently confirmed this session | No | UNSOURCED |
| Kình Dương | Not independently confirmed this session | No | UNSOURCED |
| Đà La | Not independently confirmed this session | No | UNSOURCED |
| Hỏa Tinh | Not independently confirmed this session | No | UNSOURCED |
| Linh Tinh | Not independently confirmed this session | No | UNSOURCED |

**Important caveat carried forward from the product definition itself (§4D):** even the *list* is
not yet confirmed canonical — "this set is not invented here — it must be confirmed against the
authoritative source chosen... not assumed correct because it appears in this list." This session's
research neither confirmed nor contradicted the 13-star list; it simply did not find primary-source
confirmation of it as a complete, correct MVP set. Treat the list itself as still open, not just the
individual placement rules.

---

## Tuần / Triệt

**Confirmed structural difference (CORROBORATING — see DECISION-09):**
- **Tuần** — input: which "Tuần Giáp" (decade group within the 60-year sexagenary cycle) the birth
  year falls into. Affects 2 palaces.
- **Triệt** — input: the birth year's Heavenly Stem (Can) alone. Affects 2 different palaces.
- Combined, up to 4 palaces on a single chart can be affected, independently positioned (Tuần's pair
  is not guaranteed to relate to Triệt's pair in any fixed way based on what was found this
  session).

**Not found:** the actual lookup table for either — which specific palace pair each Tuần-Giáp group
or each Can maps to. `Status: UNSOURCED` for both tables.

---

## Tứ Hóa (Hóa Lộc / Hóa Quyền / Hóa Khoa / Hóa Kỵ)

**Confirmed real school conflict (see DECISION-10) — the single most important finding of this
entire research pass.** Bắc Phái and Nam Phái are documented as genuinely disagreeing here, not
merely using different presentation styles of the same table. One specific named high-accuracy
lineage was identified for further investigation ("Tử vi đẩu số toàn tập - Trung Châu phái - Lục
Bân Triệu - Khâm Thiên môn"), but **no 10-Can × 4-Hóa table was extracted or verified in this
session**, and doing so before DECISION-01 (school selection) is resolved would risk building the
wrong school's table.

**Status: `DOMAIN_EXPERT_REQUIRED`.** This is a hard release-blocking gate per the product
definition §7–8, and this sprint's research only strengthens the case that it must not be
shortcut — it does not, and could not responsibly, produce a usable table.

---

## Miếu/Vượng/Đắc/Hãm (star brightness/dignity states)

Not researched in depth this session — per `domain-decision-register.md` DECISION-11, this is
primarily a founder scope-inclusion call (product definition §4E: "Do not default to 'yes, include
it' or 'no, skip it' without that decision being made explicitly"), not purely a sourcing question.
If the founder decides to include it, it will need its own dedicated sourcing pass at that time.

---

## What would unblock this document the fastest

In priority order, based on where this session's research came closest to a usable answer:
1. **Mệnh/Thân formula** (DECISION-04) — one domain-expert confirmation pass on the specific
   formula already found, not open-ended research.
2. **School/tradition selection** (DECISION-01) — a founder decision, informed by the fact that
   Vân Đằng Thái Thứ Lang's 1956 text is the strongest Vietnamese-tradition candidate found.
3. **Cục table** (DECISION-05) — direct reading of VDTTL-1956 and/or HLDP-1972 by someone who can
   transcribe the full table, with a second independent reviewer.
4. **Tử Vi anchor + 14-star offsets** (DECISION-06/07) — same primary-text reading, once Cục is
   resolved (these depend on it).
5. **Tứ Hóa** (DECISION-10) — cannot proceed until #2 is resolved; then needs the specific named
   lineage's table verified from a primary source.
6. **Auxiliary stars, Tuần, Triệt** (DECISION-08/09) — lowest priority only because they are
   furthest from a usable answer already, not because they matter less to the finished product.
