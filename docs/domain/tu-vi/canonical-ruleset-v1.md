# Tử Vi Canonical Ruleset V1 — Sprint 18A.5

**Date:** 2026-08-21
**School:** `TUVI_SCHOOL_V1 = VDTTL_1956` (unchanged, founder-locked, Sprint 18A.2).
**Evidence model:** see `ai-only-verification-standard.md`. Statuses below use that document's ladder, never `EXPERT_CONFIRMED`.
**Primary source, re-verified this sprint:** `archive.org/details/TuViDdauSoTanBien-VDThaiThuLang-DV`, file `dv01.pdf`, 597,465 bytes (byte-identical to Sprint 18A.1/18A.2's copy — confirmed by matching file size). Rendered fresh at 5× zoom this session, read directly, before consulting the prior transcription.

**Important caveat carried forward unchanged from Sprint 18A.2:** this archive.org item's own JP2 "scan" derivative was previously found to be a digitally-retypeset edition (identical font/layout to the PDF, not photographic scan artifacts of the 1956 paper original) — see `vdttl-1956-second-review.md` §2. This means the two anomalies below (Kim Tứ Cục, Triệt) could in principle be an error introduced at some retypesetting/reprint stage rather than present in the original 1956 printing. No earlier or alternate edition was located this session to test that possibility further — it remains an open, disclosed uncertainty, not resolved either way.

---

## 1. Rule inventory (≥20 items, per Phase 3)

| # | RULE_ID | RULE_NAME | CANONICAL_FORMULA_OR_TABLE | PRIMARY_SOURCE_PAGE | PRIMARY_SOURCE_STATUS | CORROBORATING_SOURCE | CORROBORATION_STATUS | KNOWN_CONFLICT | CONVENTION_DECISION | CONFIDENCE | IMPLEMENTATION_STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TUVI-CAL-01 | Solar→lunar conversion | Hồ Ngọc Đức algorithm (Meeus; Reingold & Dershowitz), Principal Terms leap-month method | N/A (not VDTTL-1956) | N/A | 4 independent open-source re-implementations | INDEPENDENT | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 2 | TUVI-CAL-02 | UTC+7 fixing | Fixed Vietnam timezone, no location-based ephemeris needed | N/A | N/A | Same as above | INDEPENDENT | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 3 | TUVI-CAL-03 | Leap lunar month (astronomy) | Same algorithm | N/A | N/A | Same | INDEPENDENT | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 4 | TUVI-CAL-04 | Leap lunar month (Tử-Vi-specific chart-input treatment — which month index a leap-month birth uses) | Not stated by VDTTL-1956 | Searched pp.1–17, 24–26; absent | N/A | None found | — | Real gap, not a conflict | **`CONVENTION_LOCK_REQUIRED`**: treat a leap month as a repeat of its preceding month's index for Mệnh/Thân's `tháng` input (the most common convention in adjacent ZWDS practice; disclosed as an engineering default, not a VDTTL-1956-sourced rule) | Low (unsourced) | `CONVENTION_LOCK_REQUIRED` |
| 5 | TUVI-CC-01 | Can Chi (năm/tháng/ngày/giờ) sexagenary arithmetic | Standard 60-cycle math | N/A | N/A | Universally non-disputed | INDEPENDENT | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 6 | TUVI-PAL-01 | 12-palace ordering | 1(Tý)…12(Hợi), physical layout, thuận=clockwise=increasing index | p.5 | `PRIMARY_SOURCE_RECHECKED` (3 independent reads, identical) | None sought (undisputed structural fact) | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 7 | TUVI-GIO-01 | Giờ hour-branch labeling | 23:00–01:00 undivided Tý; then 2-hour blocks | p.6 | `PRIMARY_SOURCE_RECHECKED` | None needed (mechanical) | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 8 | TUVI-GIO-02 | Civil/lunar day rollover for a 23:00–00:59 birth | Not stated by VDTTL-1956 | Searched pp.1–17, 24–26; absent | Vietnam Astronomical Society (`thienvanvietnam.org`) — general modern civil/lunar convention, not VDTTL-specific | INDEPENDENT (general convention, not VDTTL-1956-specific) | Real gap | **`CONVENTION_LOCK_REQUIRED`**: midnight rollover (23:00–23:59 = the day ending; 00:00–00:59 = the day beginning), inherited from the calendar layer, disclosed as non-VDTTL-1956-specific | Medium | `CONVENTION_LOCK_REQUIRED` |
| 9 | TUVI-MT-01 | Mệnh formula | `Mệnh0 = (R0 − giờ0) mod 12`, `R0 = (tháng + 1) mod 12` (0-indexed Tý=0), `giờ0` = hour branch's own standard 0-indexed position | p.6 (structure); this sprint (arithmetic, re-derived directly from the structure, not from any secondary source) | `PRIMARY_SOURCE_RECHECKED` (structure) + `DETERMINISTICALLY_CROSS_CHECKED` (arithmetic, see §5) | Structurally corroborated (not numerically) by 2 secondary Vietnamese sites, both flagged `LIKELY_DERIVED`/same-lineage, not independent — see `source-corroboration-matrix.md` | LIKELY_DERIVED (rejected as independent) | Prior secondary-source numeric formula (mixed Tý=1/Dần=1 indexing) explicitly rejected; this document's own re-derivation used instead | High (self-consistency-verified) | `IMPLEMENTATION_READY` |
| 10 | TUVI-MT-02 | Thân formula | `Thân0 = (R0 + giờ0) mod 12`, same R0/giờ0 as Mệnh | p.7 (structure) + this sprint (arithmetic) | Same as above | Same as above | Same as above | Same as above | High | `IMPLEMENTATION_READY` |
| 11 | TUVI-MT-03 | Thân 6-palace hard invariant | Thân−Mệnh offset ∈ {0,2,4,6,8,10} (0-indexed mod 12) — 6 possible values, matching the source's own "6 palaces" claim | p.7 | `PRIMARY_SOURCE_RECHECKED` (text) + `DETERMINISTICALLY_CROSS_CHECKED` (formula proven to satisfy it, §5) | — | — | None | Implement as a hard assertion | High | `IMPLEMENTATION_READY` |
| 12 | TUVI-CUC-01 | Cục table (30 printed cells / 120 logical cells) | 5 Mệnh-branch row-groups × 5 Can-pair column-groups | p.7 | `PRIMARY_SOURCE_RECHECKED` (3 independent reads, all 30 cells identical) | One pre-existing single-cell worked example (Bính/Dậu→Hỏa Lục), ambiguous independence (cites VDTTL-1956 itself) | UNKNOWN_DEPENDENCE (not counted as independent) | None internal to the table | Use as-is | High (single-authority, triple-confirmed) | `IMPLEMENTATION_READY` |
| 13 | TUVI-TVA-01 | Tử Vi anchor table, 4 of 5 Cục (Thủy Nhị, Mộc Tam, Thổ Ngũ, Hỏa Lục) | 5-Cục × 30-lunar-day table | pp.7–8 | `PRIMARY_SOURCE_RECHECKED` (3 independent reads, all cells identical, each a clean 30-day bijection) | None sought this sprint (already clean) | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 14 | TUVI-TVA-02 | Tử Vi anchor table, Kim Tứ Cục | Same table shape; day 21 printed in both the Thìn cell and the Mùi cell; day 24 printed nowhere | p.8 | `PRIMARY_SOURCE_RECHECKED` (3 independent reads, identical anomaly every time — ruled out as a reading artifact) | An independently-sourced quotient/remainder placement formula, pre-validated against 2 known-clean VDTTL-1956 data points, computes day 21→Thìn (matches printed) and day 24→Mùi (printed cell shows 21 instead) | INDEPENDENT (formula source unrelated to VDTTL-1956) | `SOURCE_CONFLICT` (internal to this edition) | **`CONVENTION_LOCK_REQUIRED`**: day 24 → Mùi, per the validated formula | Medium-high | `CONVENTION_LOCK_REQUIRED` |
| 15 | TUVI-TVPHU-01 | Thiên Phủ anchor (mirror of Tử Vi) | `ThienPhu0 = (4 − TuVi0) mod 12` (0-indexed) — mirrors across the Dần–Thân axis; coincide at Dần and Thân | p.9 | `PRIMARY_SOURCE_RECHECKED` (coincidence points re-verified visually this session; full cell-by-cell mirror table not re-decoded to the same certainty as other tables) | Formula independently derivable from the axis + 2 confirmed coincidence points; internally consistent with `vdttl-1956-second-review.md`'s stated Tý↔Thìn, Sửu↔Mão pairs | DETERMINISTICALLY_CROSS_CHECKED | None found; residual medium-confidence flag carried forward on full-table decoding only | Medium-high | `IMPLEMENTATION_READY` (formula); table decode itself still `PRIMARY_SOURCE_RECHECKED` at medium confidence |
| 16 | TUVI-TV-GRP | Tử Vi group (6 stars) offsets + direction | Offsets from Tử Vi=0: Liêm Trinh+4, Thiên Đồng+7, Vũ Khúc+8, Thái Dương+9, Thiên Cơ+11, all thuận (forward) | p.7 | `PRIMARY_SOURCE_RECHECKED` (verbatim sentence re-read 3 times, identical) | `mingming3.com` (external adversarial source) — direction *label* disagrees, decoded *offsets* agree exactly | INDEPENDENT (offsets); label question unresolved but non-blocking | Direction-label vs. external convention (offsets do not actually conflict) | Encode offsets directly, never a direction-label loop (see `expert-review-pack.md` §3, unchanged policy) | High | `IMPLEMENTATION_READY` |
| 17 | TUVI-TP-GRP | Thiên Phủ group (8 stars) offsets + direction | Offsets from Thiên Phủ=0: Thái Âm+1, Tham Lang+2, Cự Môn+3, Thiên Tướng+4, Thiên Lương+5, Thất Sát+6, Phá Quân+10, all thuận | p.9 | `PRIMARY_SOURCE_RECHECKED` | `mingming3.com` — both label and offsets agree | INDEPENDENT | None | Encode offsets directly | High | `IMPLEMENTATION_READY` |
| 18 | TUVI-TUAN-01 | Tuần table | 6 rows by year-Can decade group → 2 palaces | pp.16–17 | `PRIMARY_SOURCE_RECHECKED` (full table + worked example re-read, identical) | Not independently re-sought this sprint (self-consistent, no flagged conflict) | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 19 | TUVI-TRIET-01 | Triệt table | 5 rows by year-Can pair → 2 palaces | p.17 | `PRIMARY_SOURCE_RECHECKED` (identical) | `tracuutuvi.com` (Sprint 18A.3) + `vietdich.blogspot.com` (this sprint, citing a distinct 1975 Vietnamese source) both confirm Ất/Canh→Mùi-Ngọ | INDEPENDENT ×2 | `SOURCE_CONFLICT` with the book's own worked example (Canh Ngọ → Thân-Dậu, matching the Giáp/Kỷ row instead) | **`CONVENTION_LOCK_REQUIRED`**: use the table (now 2× independently corroborated), not the worked example | High (table); the conflict itself remains disclosed, not hidden | `CONVENTION_LOCK_REQUIRED` |
| 20 | TUVI-TUHOA-01 | Tứ Hóa table | 10 Can × 4 transformations | pp.13–14 | `PRIMARY_SOURCE_RECHECKED` (all 40 cells + worked example re-read, identical) | Not independently sought (VDTTL-1956 is the locked school regardless of Bắc/Nam Phái alignment) | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 21 | TUVI-AUX-LOCTON | Lộc Tồn | Year-Can, 10-cell table | p.9 | `PRIMARY_SOURCE_RECHECKED` | — | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 22 | TUVI-AUX-KINHDA | Kình Dương, Đà La | Lộc Tồn ±1 | p.10 | `PRIMARY_SOURCE_RECHECKED` (Sprint 18A.6: re-rendered at 5×, cross-checked against its own worked example — Lộc Tồn Tý→Kình Dương Sửu, Đà La Hợi — exact match) | — | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 23 | TUVI-AUX-DIAKHONGKIEP | Địa Không, Địa Kiếp | Hour, from Hợi; Kiếp forward, Không backward | p.10 | `PRIMARY_SOURCE_RECHECKED` (Sprint 18A.6, verbatim re-read, identical) | — | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 24 | TUVI-AUX-HOALINH | Hỏa Tinh, Linh Tinh | Year-Chi group (4 trine groups) × gender/yin-yang | pp.10–11 | `PRIMARY_SOURCE_RECHECKED` (Sprint 18A.6: re-rendered at 5× zoom, previously-flagged ambiguity resolved — see note) | — | — | **Resolved, not a conflict**: groups "Thân,Tý,Thìn" and "Hợi,Mão,Mùi" genuinely both print Hỏa Tinh=Dần, Linh Tinh=Tuất — confirmed as printed, not a duplication artifact; self-consistent with the table's own worked example (Dần group→Hỏa Sửu/Linh Mão, matches) | Use as-is | High (upgraded from Medium) | `IMPLEMENTATION_READY` |
| 25 | TUVI-AUX-TAPHUUBAT | Tả Phù, Hữu Bật | Lunar month; Tả Phù (book spells "Tả Phụ") Thìn=1 forward, Hữu Bật Tuất=1 backward | p.11 | `PRIMARY_SOURCE_RECHECKED` (Sprint 18A.6, verbatim re-read, identical) | — | — | Minor spelling variant noted ("Tả Phù" vs. "Tả Phụ") — same star, not a placement conflict | Use as-is | High | `IMPLEMENTATION_READY` |
| 26 | TUVI-AUX-VANXUONGKHUC | Văn Xương, Văn Khúc | Hour; Xương Tuất=Tý backward, Khúc Thìn=Tý forward | p.11 | `PRIMARY_SOURCE_RECHECKED` (Sprint 18A.6, verbatim re-read, identical) | — | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 27 | TUVI-AUX-KHOIVIET | Thiên Khôi, Thiên Việt | Year-Can, 10-cell table | p.11 | `PRIMARY_SOURCE_RECHECKED` (Sprint 18A.6: re-rendered, cross-checked against its own worked example — Ất Mùi→Khôi Tý, Việt Thân — exact match) | — | — | None | Use as-is | High | `IMPLEMENTATION_READY` |
| 28 | TUVI-AUXLIST-01 | CORE_V1 auxiliary-star list (13 stars) | See `v1-canonical-ruleset.md` §10 recommendation | pp.9–13 | `PRIMARY_SOURCE_RECHECKED` (per-star, above — all 13 now re-verified) | — | — | None | **`TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13`, founder-locked Sprint 18A.6** — see §7 below | High for sourcing; scope now locked | `IMPLEMENTATION_READY` |

**Auxiliary star rows 21–27 above are the 7 of 13 CORE_V1 stars needed to fully compute this sprint's Class B golden vectors (`golden-vector-v2-spec.md`); the remaining CORE_V1 auxiliary stars (Địa Không/Kiếp already listed, Kình/Đà already listed) are covered. Full 13-star list is unchanged from `v1-canonical-ruleset.md` §10.**

---

## 2. Direction-label policy (unchanged from Sprint 18A.4, re-confirmed this sprint)

Canonical representation for every chính-tinh and directional auxiliary-star rule is `anchor + offset (mod 12)`. Direction labels ("thuận," "nghịch," "clockwise," "counterclockwise") are source notes only, never engine-executed instructions. This sprint's re-read (§4) reconfirmed both group-direction sentences verbatim, unchanged from Sprint 18A.1/18A.2 — see `ai-only-verification-standard.md` §4.

## 3. Cục table (reproduced, triple-confirmed)

| Mệnh palace | Giáp Kỷ | Ất Canh | Bính Tân | Đinh Nhâm | Mậu Quý |
|---|---|---|---|---|---|
| Tý, Sửu | Thủy nhị | Hỏa lục | Thổ ngũ | Mộc tam | Kim tứ |
| Dần, Mão, Tuất, Hợi | Hỏa lục | Thổ ngũ | Mộc tam | Kim tứ | Thủy nhị |
| Thìn, Tỵ | Mộc tam | Kim tứ | Thủy nhị | Hỏa lục | Thổ ngũ |
| Ngọ, Mùi | Thổ ngũ | Mộc tam | Kim tứ | Thủy nhị | Hỏa lục |
| Thân, Dậu | Kim tứ | Thủy nhị | Hỏa lục | Thổ ngũ | Mộc tam |

## 4. Tử Vi anchor tables (reproduced, triple-confirmed; Kim Tứ Cục shown with the convention lock applied)

**Thủy Nhị:** Tý=22,23; Sửu=1,24,25; Dần=2,3,26,27; Mão=4,5,28,29; Thìn=6,7,30; Tỵ=8,9; Ngọ=10,11; Mùi=12,13; Thân=14,15; Dậu=16,17; Tuất=18,19; Hợi=20,21.
**Mộc Tam:** Tý=25; Sửu=2,28; Dần=3,5; Mão=6,8; Thìn=1,9,11; Tỵ=4,12,14; Ngọ=7,15,17; Mùi=10,18,20; Thân=13,21,23; Dậu=16,24,26; Tuất=19,27,29; Hợi=22,30.
**Kim Tứ:** Tý=5; Sửu=3,9; Dần=4,7,13; Mão=8,11,17; Thìn=2,12,15,**21**; Tỵ=6,16,19,25; Ngọ=10,20,23,29; Mùi=14,**24**(convention-locked, printed "21"),27; Thân=18,28; Dậu=22; Tuất=26; Hợi=1,30.
**Thổ Ngũ:** Tý=7; Sửu=4,12; Dần=5,9,17; Mão=10,14,22; Thìn=3,15,19,27; Tỵ=8,20,24; Ngọ=1,13,25,29; Mùi=6,18,30; Thân=11,23; Dậu=16,28; Tuất=21; Hợi=2,26.
**Hỏa Lục:** Tý=9,19; Sửu=5,15,25; Dần=6,11,21; Mão=12,17,27; Thìn=4,18,23; Tỵ=10,24,29; Ngọ=2,16,30; Mùi=8,22; Thân=14,28; Dậu=1,20; Tuất=7,26; Hợi=3,13.

## 5. Mệnh/Thân — full derivation and self-consistency proof (new this sprint)

**Source text, re-confirmed verbatim (p.6–7):** "Bắt đầu từ cung Dần là tháng Giêng, đếm theo chiều thuận đến tháng sinh, ngừng tại cung nào gọi là giờ Tý, đếm theo chiều nghịch đến giờ sinh, ngừng tại cung nào an Mệnh Viên ở cung đó" (Mệnh); "...đếm theo chiều thuận đến giờ sinh ngừng tại cung nào an Thân ở cung đó" (Thân, same Step 1).

**Reading adopted:** the reference palace R is temporarily relabeled "giờ Tý" (position 0 in the standard hour-branch count). To find Mệnh, count backward (nghịch) a number of physical palaces equal to the target hour branch's own ordinal position in the standard Tý-first sequence (Tý=0 steps, Sửu=1 step, …, Hợi=11 steps). To find Thân, count forward (thuận) the same number of steps. This is the natural, standard counting technique used throughout Vietnamese/Chinese fortune-telling for this kind of "count off the branches while stepping palaces" procedure, and it is the reading that makes the primary source's own words self-consistent (see the proof below) — an alternative, more literal "reverse the label sequence itself" reading was tried first and rejected because it made Mệnh and Thân identical for every input, which cannot be correct given the source explicitly treats them as two different steps.

**Formula (0-indexed, Tý=0…Hợi=11):**
```
R0     = (tháng + 1) mod 12                [tháng: 1=Giêng…12; R0 is Dần(2) when tháng=1]
giờ0   = birth-hour branch's own standard index (Tý=0, Sửu=1, …, Hợi=11)
Mệnh0  = (R0 − giờ0) mod 12
Thân0  = (R0 + giờ0) mod 12
```

**Self-consistency proof (this sprint's key new finding):** `Thân0 − Mệnh0 = 2×giờ0 (mod 12)`. As `giờ0` ranges over its 12 possible values, `2×giờ0 mod 12` takes on exactly **6 distinct values**: {0, 2, 4, 6, 8, 10} — because `giờ0` and `giờ0+6` always produce the same offset. This means the formula **structurally guarantees** Thân can only ever land on one of exactly 6 palaces relative to Mệnh, for any birth input — an exact match to VDTTL-1956's own explicit invariant (p.7: "Thân chỉ có thể an vào Mệnh Viên, Phúc Đức, Quan Lộc, Thiên Di, Tài Bạch, Thê Thiếp... nếu... lạc vào những cung khác... là đã nhầm lẫn"). A wrong formula would have no particular reason to satisfy this 6-value constraint exactly — this is genuine `DETERMINISTICALLY_CROSS_CHECKED` evidence, derived entirely from the primary source's own words, no external source needed.

**Two further sanity checks, both consistent with known baseline cases:**
- `tháng=1, giờ=Tý` → `Mệnh0=Thân0=R0=Dần`. (Mệnh and Thân coincide at Dần for any Tý-hour, month-1 birth — the simplest possible case.)
- **New finding:** for **any** month, a birth in the **Ngọ hour** (`giờ0=6`) always produces `Mệnh0 = Thân0`, since `2×6=12≡0 (mod 12)`. Tý and Ngọ are therefore the *only* two hour branches that always produce a Mệnh=Thân coincidence, regardless of birth month — a clean, useful, previously-undocumented-in-this-project structural fact, used directly in `golden-vector-v2-spec.md`'s vector design.

**Explicitly rejected:** the previously-flagged secondary-source formula (`SECONDARY-TVSG-MENH-THAN`, and this sprint's fresh web search turned up further restatements of what is structurally the same formula/lineage on other Vietnamese sites) mixes a Tý=1-indexed input with a Dần=1-indexed output in its own worked examples — this project continues not to implement from that formula. The formula in this section is derived independently, directly from VDTTL-1956's own prose, and needed no secondary source at all.

## 6. What remains genuinely open (updated Sprint 18A.6)

- `TUVI-CAL-04` (leap-month Tử-Vi treatment) and `TUVI-GIO-02` (day rollover): still absent from VDTTL-1956 itself; convention locks proposed, not sourced. **These locks are adopted as-is by the Sprint 18A.6 freeze (§7) — not newly re-sourced, but formally accepted as the V1 engineering convention.**
- `TUVI-TVA-02` (Kim Tứ Cục day 24) and `TUVI-TRIET-01`'s conflict with its own worked example: real, triple-confirmed `SOURCE_CONFLICT`s within this specific printed edition; convention locks proposed and evidenced, not sourced to a resolution beyond dispute. **Adopted as-is by the freeze (§7).**
- Whether this edition's two anomalies are original-1956 errors or introduced during a later digital retypesetting: undetermined, no alternate edition located. Does not block the freeze — the convention locks above apply regardless of root cause.
- ~~`TUVI-AUXLIST-01`: the 13-star CORE_V1 scope is a recommendation pending founder lock~~ — **resolved Sprint 18A.6: founder has locked `TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13`.** See §7.

---

## 7. Frozen ruleset — Sprint 18A.6

**`TUVI_RULESET_CANDIDATE_V1 = VDTTL_1956_CANDIDATE_1` is promoted to:**

```
TUVI_RULESET_V1 = VDTTL_1956_V1
STATUS: IMPLEMENTATION_READY
```

**This promotion does not delete or rewrite the candidate-status history above** — every row in §1, the derivations in §5, and the disclosed-open items in §6 remain exactly as researched; "frozen" means the ruleset is now accepted for implementation as documented, including its explicit convention locks, not that further evidence is barred from ever revising it (see `sprint-18b-revised-entry-gate.md` §8's "traceable, not final" framing, unchanged).

**The frozen ruleset comprises, at minimum:**

| Constant | Value |
|---|---|
| `TUVI_SCHOOL_V1` | `VDTTL_1956` |
| `TUVI_AUXILIARY_STAR_SCOPE_V1` | `CORE_13` |
| Kim Tứ Cục convention lock | Lunar day 24 → Mùi |
| Triệt convention lock | Use the table (Ất/Canh → Mùi, Ngọ), not VDTTL-1956's own Canh-Ngọ worked example |
| Giờ Tý / day-rollover convention lock | Midnight rollover (23:00–23:59 = ending day; 00:00–00:59 = beginning day) |
| Leap-month Tử-Vi-input convention lock | A leap month repeats its preceding month's index for Mệnh/Thân's `tháng` input |

**Founder decision recorded this sprint (Sprint 18A.6):**

> `TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13` — V1 implements exactly the 13 auxiliary stars already classified in §1 rows 21–27 (Lộc Tồn; Kình Dương, Đà La; Địa Không, Địa Kiếp; Hỏa Tinh, Linh Tinh; Tả Phù, Hữu Bật; Văn Xương, Văn Khúc; Thiên Khôi, Thiên Việt). No additional auxiliary star from VDTTL-1956's ~40-star remainder (Thái Tuế's 12-star companion series, the Tràng Sinh 10-star series, Lộc Tồn's own 12-star companion walk, and ~15 more named singles/pairs — all catalogued in `vdttl-1956-extraction.md` TUVI-12–24) enters V1 scope. Every one of those is `DEFERRED_TO_V1_1`, **unless** a future implementer finds one is strictly required as an internal deterministic dependency of a CORE_13 calculation — an audit for exactly that dependency question is in `sprint-18a6-entry-gate-closure.md` §2.

## 8. Version identifiers (documentation only — no application constants added this sprint)

| Identifier | Value |
|---|---|
| `TUVI_ENGINE_VERSION` | `tuvi-engine-v1` (not yet built — reserved) |
| `TUVI_RULESET_VERSION` | `vdttl-1956-v1` |
| `TUVI_CALENDAR_VERSION` | inherits the existing, already-verified Hồ Ngọc Đức algorithm wrapper version used elsewhere in the codebase (per `DECISION-03B`) — no new calendar version is introduced by this ruleset |
| `TUVI_AUXILIARY_SCOPE_VERSION` | `core-13-v1` |
