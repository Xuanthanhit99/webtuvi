# Source Corroboration Matrix — Sprint 18A.5

**Date:** 2026-08-21
**Purpose:** classify every corroborating source used anywhere in this project's Tử Vi research by genuine independence, per Phase 5's required classification: `INDEPENDENT`, `LIKELY_DERIVED`, `UNKNOWN_DEPENDENCE`, `SAME_SOURCE`, `CONFLICTING_SCHOOL`. `SAME_SOURCE` and `LIKELY_DERIVED` never count as independent confirmation of anything.

---

## Cục

| Source | Classification | Basis |
|---|---|---|
| `SECONDARY-TNT` (trannhatthanh.wordpress.com) — single worked example, Bính/Dậu→Hỏa Lục | `UNKNOWN_DEPENDENCE` | Cites VDTTL-1956 and HLDP-1972 by name as its own background reading, but presents a *different* derivation methodology (Nạp Âm-of-the-month) than what VDTTL-1956 actually states (Can-năm + Mệnh-branch direct table). The one worked example matches our table by coincidence of the final answer, not by a verified independent method. Not counted as independent confirmation of the table. |
| iztro (open-source ZWDS library) | `UNKNOWN_DEPENDENCE` / `CONFLICTING_SCHOOL` (undetermined which) | This sprint checked iztro's own documentation for which school/tradition it implements — it does not state one. Cannot be used as corroboration for a VDTTL-1956-specific claim without knowing its convention; not attempted for Cục this sprint. |

**Net assessment:** the Cục table has **no genuinely independent corroboration**, only three independent *readings of the same primary source* (`PRIMARY_SOURCE_RECHECKED` ×3, self-consistent, internally clean). This is `SOURCE_SINGLE_AUTHORITY` — see `canonical-ruleset-v1.md` §1 row 12.

## Tử Vi anchor (incl. Kim Tứ Cục)

| Source | Classification | Basis |
|---|---|---|
| Quotient/remainder placement formula (web-sourced, Sprint 18A.3) | `INDEPENDENT` | Origin unrelated to VDTTL-1956 or any source already on file; pre-validated against 2 already-clean, unrelated VDTTL-1956 data points (Thủy Nhị day 8→Tỵ, day 1→Sửu) before being trusted on the disputed cell. This is the strongest single piece of external evidence in this entire domain research effort. |
| This sprint's fresh web search for "Kim Tứ Cục ngày 24" | No result found | General search returned only category-level descriptions, no source addressing this specific cell. Does not weaken or strengthen the existing formula-based corroboration. |

## 14 Chính Tinh (offsets + direction)

| Source | Classification | Basis |
|---|---|---|
| `mingming3.com` (Sprint 18A.2) | `INDEPENDENT` | Unconnected to this project's prior sourcing; states the mainstream/modern convention. Direction *labels* disagree for the Tử Vi group; decoded numeric *offsets* agree exactly for both groups. Genuine independent corroboration of the values that matter for an engine (palace positions), with an open, non-blocking question about why the label differs. |

## Tuần

| Source | Classification | Basis |
|---|---|---|
| None sought this sprint | — | Table is self-consistent against its own in-text worked example (Bính Dần→Tuất-Hợi), triple-confirmed by re-reading; no external corroboration attempt made this sprint, since no conflict is flagged for this table. |

## Triệt

| Source | Classification | Basis |
|---|---|---|
| `tracuutuvi.com` (Sprint 18A.3) | `INDEPENDENT` | No shared authorship/citation chain with VDTTL-1956 or any other source on file. States Ất/Canh→Ngọ,Mùi, matching the table. |
| `vietdich.blogspot.com` (new this sprint) | `INDEPENDENT` | Cites its own named source, "KHHB Xuân Ất Mão (1975)" — a *third*, distinct Vietnamese publication, not VDTTL-1956 and not `tracuutuvi.com`'s lineage. States "Triệt Không án ngữ hai cung Ngọ và Mùi" for Ất/Canh — matches the table. |
| `tuvi.cohoc.net` (checked this sprint, did not pan out) | Not usable | Page found via search snippet appeared to state the Ất/Canh→Ngọ,Mùi fact, but direct fetch showed the actual page content is about a different topic (Thái Huyền number method) and explicitly declines to state a placement rule. The search-snippet attribution was wrong; excluded rather than miscited. |

**Net assessment:** the Triệt **table** now has 2 independent corroborating sources, one of which names a third distinct primary-adjacent text. The book's own **worked example** (Canh Ngọ→Thân-Dậu) has **zero** corroboration found anywhere, across two sprints of searching. This is a materially strong basis for the `CONVENTION_LOCK_REQUIRED` decision to use the table.

## Tứ Hóa

| Source | Classification | Basis |
|---|---|---|
| None sought | — | VDTTL-1956 is the locked school regardless of which broader Bắc Phái/Nam Phái lineage its table happens to align with (per `v1-canonical-ruleset.md` §13's existing, unchanged reasoning) — cross-school corroboration would not change what gets implemented, so was not pursued. |

## Mệnh/Thân

| Source | Classification | Basis |
|---|---|---|
| `SECONDARY-TVSG-MENH-THAN` (tuvisaigon.vn) | `SAME_SOURCE` when re-fetched (Sprint 18A.3 finding, unchanged) | Already established as literally the same source, not independent. |
| This sprint's fresh web search — multiple sites (`hocvientuvi.wordpress.com`, `bachhoaxanh.com`, `phongthuynguyenhoang.com`, `phongthuyminhviet.com`, and others) returning a worked example ("sinh 12/07/2017, giờ Thìn: Mệnh=(7-5)+1=3, Thân=(07+5)-1=11") | `LIKELY_DERIVED` | The example uses the *exact same* internally-inconsistent indexing bug already flagged for `tuvisaigon.vn` (hour indexed Tý=1 for input — Thìn=5 — but output read Dần=1) — strong evidence this is the same underlying formula/lineage propagating across many restatement sites, not independent derivations. Not counted as independent. Confirms, rather than resolves, the reason this project does not implement from that formula. |
| This sprint's own re-derivation from VDTTL-1956's verbatim prose | Not a "source" in the corroboration sense — this is primary-text-derived, cross-checked against the primary text's own invariant | See `canonical-ruleset-v1.md` §5. This is the strongest evidence on file for Mệnh/Thân, and it required no secondary source at all. |

**Net assessment:** genuinely independent numeric confirmation of Mệnh/Thân (in the sense of a second unrelated worked chart) was **not found**, consistent with Sprint 18A.3's conclusion. What changed this sprint is that the *exact arithmetic* no longer depends on any secondary source at all — it is derived and self-consistency-proven directly from VDTTL-1956's own words (`DETERMINISTICALLY_CROSS_CHECKED`), which is a stronger evidentiary position than "waiting for a third worked example" would have been even if one had been found, since a worked example from an unrelated, un-vetted site carries its own risk (as this session's search demonstrated).

## Giờ Tý / day rollover

| Source | Classification | Basis |
|---|---|---|
| `thienvanvietnam.org` (Vietnam Astronomical Society, Sprint 18A.3) | `INDEPENDENT` (as a general calendrical fact) but explicitly **not** VDTTL-1956-specific | Unchanged from Sprint 18A.3 — not re-searched this sprint, since Sprint 18A.3 already confirmed exhaustively (pp.6, 24–26 of VDTTL-1956 checked) that this source does not state its own day-boundary convention. |

## Auxiliary stars (CORE_V1 13)

| Source | Classification | Basis |
|---|---|---|
| None sought this sprint beyond re-reading the primary source (Lộc Tồn table re-confirmed on p.9) | — | No conflict is flagged for any of the 13; independent corroboration was not this sprint's priority given the two Cục/Triệt conflicts and the Mệnh/Thân re-derivation consumed the available research budget. |

## Cross-school contamination check (explicit, per Phase 6 instruction)

No cell in `canonical-ruleset-v1.md` was filled from a source using a different named school/tradition than VDTTL-1956. Where a cross-school source was consulted (`mingming3.com`'s mainstream ZWDS convention, iztro's undocumented convention), it was used **only** to check whether VDTTL-1956's own values converge with an outside source's *numeric result* — never to supply a value VDTTL-1956 itself does not state. No averaging, blending, or majority-vote resolution was performed anywhere in this project's history, including this sprint. Where VDTTL-1956 is silent (leap-month treatment, day rollover) or internally conflicted (Kim Tứ Cục, Triệt), the resolution proposed is an explicitly disclosed convention lock, not a silently-borrowed rule from a different school.
