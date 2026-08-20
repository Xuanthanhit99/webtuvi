# Tử Vi Golden Vectors — Sprint 18A.2

**Valid independent golden vectors (CROSS_CHECKED or EXPERT_CONFIRMED): 0.**
**Target: ≥12, preferably 15. Gate not met.**

## What was attempted this session

Per the governing task's explicit rule (§15–17: expected values must not come from our own tables, a single calculator, or AI generation; only `CROSS_CHECKED`/`EXPERT_CONFIRMED` count toward the gate), this session searched for independently-sourced, complete worked Tử Vi charts:

- Re-ran targeted web searches for complete worked Vietnamese Tử Vi chart examples (in VDTTL-1956 itself and elsewhere) and for textbook/appendix-style complete Zi Wei Dou Shu worked examples generally.
- Result: **confirms Sprint 15's own finding.** Search results are overwhelmingly calculator tools and general methodology descriptions (`ziweidoushucalculator.com`, `fatemaster.ai`, `masterseanchan.com`, etc.) — Level C/D per this project's source hierarchy, explicitly disqualified as sole evidence. No complete, independently-documented, expert-attributed worked chart was located.
- **Sprint 18A.3 update — Parts 2–3 now checked, exhaustively, and confirmed not to contain one.** Downloaded and OCR-text-searched all of Parts 2–6 (`dv02.txt` through `dv06.txt`, ~520KB of text, pages ~31–271, the entirety of the book beyond Part 1) for multiple patterns indicating a complete worked chart (`sinh ngày`, `lá số của/ông/bà/mẫu/điển hình`, `tinh bàn`, `một lá số`, etc.). **No complete worked example chart exists anywhere in this book.** Visual sampling of Part 2's opening pages confirms why: the book teaches interpretation through short, single-concept "thí dụ" fragments (e.g., "Kim Mệnh, Thủy Cục là tương sinh") scattered across ~200 pages of palace-by-palace and combination-by-combination discussion (the Cung Mệnh chapter alone spans printed pages 52–124), never a single continuous "here is Mr./Mrs. X's full chart" illustration. **This closes the single most promising previously-unexplored lead with a definitive negative result — VDTTL-1956 cannot itself be the source of any golden vector**, confirmed by exhaustive search, not partial exploration.

## Why 0 is the honest, correct count — not a shortfall of effort

A vector only counts if its expected values are independently attested (a named practitioner's shown work, a second source, or expert confirmation) and does not derive from this project's own extraction, engine, or a single calculator. This session's extraction work (`vdttl-1956-extraction.md`) — however thorough — is itself a candidate *input* to a future engine; using it to generate "expected" chart values and calling those vectors would be exactly the circular-evidence problem this gate exists to prevent. No qualifying independent source was found.

## Coverage matrix (target/plan — unpopulated, restated from `golden-vector-specification.md` §"Planned vector slate," unchanged this session)

| Coverage requirement | Status |
|---|---|
| All 5 Cục | Not sourced |
| ≥1 leap lunar month | Not sourced |
| Lunar New Year boundary | Not sourced |
| Giờ Tý boundary (both sides) | Not sourced |
| Several distinct birth hours | Not sourced |
| Several distinct lunar months | Not sourced |
| Mệnh/Thân variation | Not sourced |
| Tử Vi anchor wraparound case | Not sourced |
| Tử Vi group wraparound/dense-palace case | Not sourced |
| Thiên Phủ group wraparound/dense-palace case | Not sourced |
| Tuần exercised | Not sourced |
| Triệt exercised | Not sourced |
| All 4 Tứ Hóa transformations | Not sourced |
| Multiple Heavenly Stems | Not sourced |

**0 of 14 coverage cells populated.** The 15-vector acquisition plan in `domain-resolution-pack.md` §13 remains the design to fill against, unchanged.

## Adversarial cross-check performed (in lieu of true golden vectors, per §18 of the governing task)

No golden vector exists, but a genuine adversarial cross-check against a separate, independent implementation description was performed for the highest-risk item (star-group direction) — see `vdttl-1956-second-review.md` §1 for the full account. Summary:

| | PRIMARY_SOURCE (VDTTL-1956) | SECONDARY_IMPLEMENTATION (mingming3.com, representing mainstream modern convention) |
|---|---|---|
| Tử Vi group direction label | thuận (book's own definition: clockwise) | counterclockwise |
| Thiên Phủ group direction label | thuận | clockwise |
| Tử Vi group actual offsets (decoded to mod-12 positions) | Liêm Trinh+4, Thiên Đồng+7, Vũ Khúc+8, Thái Dương+9, Thiên Cơ+11 | **identical**: +4, +7, +8, +9, +11 |
| Thiên Phủ group actual offsets | Thái Âm+1...Phá Quân+10 | **identical** |

**DIFFERENCE:** direction *labels* disagree for the Tử Vi group; actual *offsets* agree for both groups once decoded numerically.
**LIKELY CAUSE:** a labeling/reference-frame convention difference (candidates: differing page/chart-orientation assumptions between traditions; a translation artifact) — not confirmed which.
**SCHOOL DIFFERENCE?:** Plausible and consistent with this project's own prior finding (Sprint 15) that Vietnamese-adapted and mainstream-Chinese Zi Wei conventions are known to diverge in places.
**BUG?:** No bug found in this session's own reading (reconfirmed twice at high zoom).
**UNRESOLVED?:** Yes, the *reason* for the label difference — but the *practical placement result* shows strong convergence, materially de-risking this item pending full resolution.

This adversarial check is explicitly **not** a golden vector (it compares direction conventions and offset values, not a complete birth-to-chart worked example with all fields), and does not count toward the ≥12 gate.

## Independence audit (Sprint 18A.3, §14 of the governing task)

Every candidate lead surfaced by web search this sprint was checked for false independence before being cited:
- The Kim Tứ Cục quotient/remainder formula source: genuinely unrelated to VDTTL-1956 and to any source already on file — treated as real corroboration, and further validated against two already-clean VDTTL-1956 data points before being trusted (see `vdttl-1956-second-review.md` §5).
- The Triệt table source (`tracuutuvi.com`): genuinely unrelated, no shared authorship/citation chain found — treated as real, if Level-C, corroboration.
- The Mệnh/Thân "independent" worked example: **caught as false independence** — directly re-fetching it confirmed it is the exact same `SECONDARY-TVSG-MENH-THAN` source already on file, not a second one. Excluded from any confidence upgrade, exactly per this task's own warning ("two websites copying the same table != two independent sources").

## Recommendation

The golden-vector gate remains the single hardest, most resource-intensive remaining blocker — now the **only** remaining blocker of this magnitude, since Parts 2–3 have been exhaustively ruled out as a source and the two prior conflicts have well-evidenced likely resolutions. Recommended next steps, in priority order:
1. **Engage a domain expert or practitioner directly** to produce (and show their work on) 12–15 charts spanning the coverage matrix above, using the now-largely-complete `v1-canonical-ruleset.md` as their working reference — with a second reviewer confirming their output independently. This is now the only realistic path to closing this gate; no further unassisted document search is expected to find one, having exhausted the primary text itself and general web search.
2. If a second primary text becomes accessible (per `authoritative-sources.md`'s TD-TOANTHU or HLDP-1972 leads), treat it as a second independent verification path for whichever vectors an expert produces in step 1 — and as a possible source of its own worked examples.
