# Tử Vi Depth Completion — Audit (2026-08-22)

Audit against the "Tử Vi Depth Completion + Pre-Live Closure Master Pass" brief. Evidence
classification: `VERIFIED_FROM_CODE`, `VERIFIED_BY_TEST`, `VERIFIED_LIVE`, `INFERENCE`,
`NOT_VERIFIED`, `DEFERRED_BY_DECISION`.

## 1. Repository state recovered

`HEAD = origin/master = c3760dc`, 0 ahead/0 behind at session start. All uncommitted changes present
were this session's own prior work (brand-bug fix, trust section, stale-doc corrections from the
immediately preceding competitive-gap-audit pass) — no unexplained inherited state.
`VERIFIED_FROM_CODE`.

## 2. Current Tử Vi capability inventory (before this pass)

Re-verified directly, not trusted from summaries: deterministic engine (calendar, Can Chi, 12
palaces, Mệnh/Thân, Cục, 14 Chính Tinh, CORE_13, Tuần/Triệt, Tứ Hóa) — `IMPLEMENTED`. Deterministic/
AI boundary — read `tu-vi-interpretation.service.ts` in full; hard-coded system-prompt rules forbid
the model from inventing or altering any placement, non-streaming, structured input only —
`IMPLEMENTED`, `VERIFIED_FROM_CODE`. IDOR protection, throttling, birth-data-never-in-analytics —
spot-checked directly (controller guards, `trackEvent` call sites, logger calls) —
`IMPLEMENTED`, `VERIFIED_FROM_CODE`. Miếu/Vượng/Đắc/Hãm, Đại Vận, Tiểu Hạn, Lưu Niên — `MISSING`
before this pass, confirmed by direct grep across the engine and domain docs.

## 3. Domain evidence audit — the core finding

The prior extraction (Sprint 18A.1) only ever read `dv01.pdf` (Part 1 — construction mechanics),
despite an existing doc claiming coverage through "page ~24" (it actually stopped around page 17).
`dv02`–`dv06` (interpretation + vận parts) had never been opened by any session. This pass:

1. Located and downloaded all 6 parts from archive.org, byte-verified against the item's own
   metadata (sizes match exactly — not a partial/corrupted fetch).
2. Read `dv02`'s full Miếu/Vượng/Đắc/Hãm section (§2, §3.1–3.14) directly against the PDF page-image
   scans — not just OCR text — for all 14 Chính Tinh, not a sample.
3. Read `dv01`'s "10. KHỞI HẠN" section (p.20–22, previously unread), independently re-verified
   against the page-image scans, resolving Đại Vận and Tiểu Hạn's core rules.
4. Investigated and resolved a suspected direction contradiction in Đại Vận by cross-referencing the
   already-shipped, already-mathematically-proven `PALACE_ROLES_FROM_MENH` order — found to be a
   misreading on this session's own first pass, not a real source conflict.

**A. Miếu/Vượng/Đắc/Hãm evidence result:** `RESOLVED_BY_SOURCE`. Complete for all 14 Chính Tinh,
5-state system, every star's branches independently verified to partition all 12 branches exactly
once. `VERIFIED_FROM_CODE` + `VERIFIED_BY_TEST` (13 dedicated tests, all pass).

**B. Đại Vận evidence result:** `RESOLVED_BY_SOURCE` for the core 10-year palace/age assignment,
cross-checked against 3 independent worked examples. Lưu Đại Hạn (annual sub-cycle) sourced but not
implemented this pass (scope decision, not an evidence gap). `VERIFIED_BY_TEST` (7 tests).

**C. Tiểu Hạn evidence result:** `RESOLVED_BY_SOURCE` for adults (age ≥ 13), cross-checked against
the source's own worked example. Child system (age < 13) newly discovered this pass but its OCR
table reconstruction is uncertain — not implemented. `VERIFIED_BY_TEST` (6 tests).

**D. Lưu Niên evidence result:** clarified as not a standalone system (a qualifier on Tiểu Hạn and
on certain auxiliary "Lưu"-prefixed stars). The auxiliary-star sub-mechanism remains `UNSOURCED`
(genuinely incomplete — 2 of 3+ star groups transcribed) — correctly not implemented.

**E. Additional gaps discovered, not in the original 4:** none found that would qualify as P0/P1;
the dv04/dv05 parts were grep-scanned and confirmed to contain no material relevant to any of the 4
target features.

## 4. Architecture rule compliance

All new calculation is pure, deterministic TypeScript — no LLM call anywhere in
`tu-vi-dignity.ts`/`tu-vi-dai-van.ts`/`tu-vi-tieu-han.ts`. AI interpretation was not modified this
pass and does not consume the new fields (an available follow-up, not required for correctness).
`VERIFIED_FROM_CODE`.

## 5. Versioning / persistence impact

Additive only. New `dignityVersion` column (Prisma migration `20260822032932_tu_vi_dignity_version`,
applied to both dev and e2e-test databases, `VERIFIED_LIVE` via a real e2e persistence round-trip
test). `mainStars` JSON shape gained a `dignity` field per entry — backward-compatible (old code
reading the JSON ignores unknown fields). `daiVan`/`tieuHanStart` are engine-layer-only this pass —
computed and tested, but NOT added to the Prisma schema, DTO, or API response, so no persistence
migration was needed for them, and no historical chart's stored shape is affected at all. No
existing calculated fact was changed for any existing chart. `VERIFIED_FROM_CODE` + `VERIFIED_LIVE`.

## 6. API / frontend impact

Miếu/Vượng/Đắc/Hãm: threaded end-to-end — `TuViChartDto.mainStars` (packages/types), palace grid
display (`tu-vi-palace-grid.tsx`, compact badge next to each main star), labels
(`DIGNITY_SHORT_LABEL`). Đại Vận/Tiểu Hạn: engine-layer only, not exposed via API/DTO/frontend this
pass (explicit, documented scope boundary, not an oversight).

## 7. Test evidence (this session, freshly run — not carried forward from a prior claim)

| Suite | Result |
|---|---|
| New dignity/Đại Vận/Tiểu Hạn unit tests | 26/26 pass |
| Full `src/tu-vi` engine unit suite | 378/378 pass (23 suites) |
| Full backend unit suite | 1587/1587 pass (148 suites) |
| Tử Vi e2e (real HTTP + real Postgres) | 18/18 pass |
| Backend typecheck | clean |
| Backend lint | clean |
| API production build | clean |
| Frontend `features/tu-vi` unit tests | 16/16 pass |
| Frontend typecheck | clean |
| Frontend lint | clean |
| Web production build | see final report for result (may complete after this doc is written) |

## 8. Adversarial review

Checked for: AI altering deterministic facts (impossible by construction — dignity/vận are
engine-computed, never passed to or returned from the AI interpretation service this pass); Eastern
Horoscope/Tử Vi conflation (none introduced — no file touched crosses that boundary); stale/
misleading claims about "full lá số" (not touched this pass, was already addressed in the prior
competitive-gap-audit session); internal terminology leaking into user UI (`DIGNITY_SHORT_LABEL`
shows only the proper Vietnamese domain terms — "Miếu"/"Vượng"/"Đắc"/"Bình hòa"/"Hãm" — never an
enum name or version string); mobile overflow (not visually re-verified this pass — see §9).

## 9. What was NOT done this pass (explicit)

No live browser QA at the 12 breakpoints listed in the source brief — this pass's evidence is
`VERIFIED_BY_TEST` and `VERIFIED_FROM_CODE`, not `VERIFIED_LIVE` for the new dignity badge's visual
layout specifically (though the surrounding palace grid's responsive behavior was already verified
in a prior sprint and this change only adds a small inline span, not a new layout element). No new
Playwright/axe run was executed. No AI-grounding update was made to feed dignity/vận into the
interpretation prompt. No frontend/persistence wiring for Đại Vận/Tiểu Hạn (explicit scope boundary).

## 10. Final verdict

**TỬ VI DEPTH COMPLETION PARTIAL — SAFE V1 BOUNDARY IDENTIFIED.** Miếu/Vượng/Đắc/Hãm shipped
end-to-end. Đại Vận and Tiểu Hạn shipped at the engine layer, with a clear, documented, evidence-
based (not caution-based) boundary around what's deferred (Lưu Đại Hạn, the child Tiểu Hạn table,
Lưu Niên auxiliary stars) — each deferral has a specific, named reason, not a blanket "not enough
evidence." See `docs/progress/tu-vi-depth-completion-final-report.md` for the full file-by-file
report and `docs/domain/tu-vi/tu-vi-depth-v1-decision.md` for the decision summary.

## 11. Exact next action

If the founder confirms the DECISION-11 inclusion judgment call (§3 of the decision record): thread
Đại Vận/Tiểu Hạn through persistence/DTO/frontend as the next increment, following the same additive
pattern used for dignity. Otherwise: revert `tu-vi-dignity.ts`'s persistence/API/frontend wiring
(the engine module itself is harmless to keep either way) and treat this pass as domain-research-
only for that one item.
