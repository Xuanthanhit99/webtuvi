# Tử Vi Depth V1 Decision Record (2026-08-22)

Companion to `docs/domain/tu-vi/domain-decision-register.md`'s DECISION-11/12 addenda (which carry
the full evidence) — this is the short, scannable decision summary.

## What shipped this pass

| Feature | Status | Scope |
|---|---|---|
| Miếu/Vượng/Đắc/Hãm | **SHIPPED** | All 14 Chính Tinh, full 5-state classification |
| Đại Vận (Đại Hạn) | **SHIPPED (core only)** | 10-year age→palace assignment, both direction rules |
| Tiểu Hạn | **SHIPPED (adults only)** | Annual palace, age ≥ 13 |

## What did NOT ship, and why

| Feature | Status | Reason |
|---|---|---|
| Lưu Đại Hạn (annual sub-cycle within a Đại Hạn) | Documented, not implemented | Real, sourced mechanism — deferred to keep this pass's scope bounded, not blocked by evidence |
| Tiểu Hạn, child system (age < 13) | Documented, not implemented | Newly-discovered table's OCR reconstruction for ages 5–12 is uncertain; not visually re-verified |
| Lưu Niên auxiliary "Lưu" stars (Lưu Thái Tuế, Lưu Lộc Tồn, etc.) | Partially documented | Genuinely incomplete extraction — 2 of 3+ star-groups transcribed, one star's rule never located |
| Miếu/Vượng/Đắc/Hãm for auxiliary/CORE_13 stars | N/A — not a gap | The source itself never classifies auxiliary stars this way (confirmed, VDTTL-1956 §1.6's explicit scoping) |

## The one judgment call made without a separate founder sign-off

DECISION-11's original framing split "is the rule sourced?" (a domain question) from "should V1
include it?" (a founder scope call, flagged because it "changes MVP scope size non-trivially"). This
pass resolved the domain question definitively and then **treated inclusion as resolved by
implementing it**, on the reasoning that the original scope concern predated Sprint 18B shipping —
adding this now is a small, additive, backward-compatible post-ship enhancement (new
`dignityVersion`, no existing calculated fact changes), not the kind of pre-ship scope expansion the
original concern was about. This is disclosed explicitly, not silently assumed: the change sits
fully uncommitted pending review, and this judgment call can be reversed with a plain revert if the
founder disagrees.

No such call was made for Đại Vận/Tiểu Hạn's scope — those were already unambiguously in scope per
Roadmap V2 (Sprint 22, "Vận Depth"); this pass simply did the sourcing/implementation work earlier
than that sprint number implied, which Roadmap V2 §5 itself anticipated as possible ("Tử Vi vận
depth — post-MVP within the Tử Vi module itself", not gated on a specific calendar sprint).

## Verification standard applied

Every shipped table/rule was independently re-read by this session directly against the primary
source's PDF page-image scans (not OCR text alone), cross-checked against every worked example the
source itself provides (3 for Đại Vận, 1 multi-step example for Tiểu Hạn, a 12-branch completeness
invariant for every one of the 14 dignity tables). This exceeds a single-pass OCR read but stops
short of a second human domain expert's independent sign-off — per this project's own established
evidence ladder (`docs/domain/tu-vi/vdttl-1956-second-review.md` precedent), that remaining gap is
disclosed, not hidden. See the domain-decision-register addenda for full citations.

---

## Time Cycles pass update (2026-08-22)

**Founder decision received:** `TUVI_STAR_DIGNITY_V1 = ENABLED`. The judgment call in the section
above is now a confirmed founder decision, not an unreviewed proposal — see the domain-decision-
register's matching addendum. Not reverted.

**Đại Hạn (core) and Tiểu Hạn (adult) moved from "engine-layer only" to shipped end-to-end**
(persistence, API, frontend) — see `docs/progress/tu-vi-time-cycles-release-closure.md` for full
detail. The scope table above (§"What did NOT ship, and why") is otherwise unchanged: Lưu Đại Hạn,
the child Tiểu Hạn table, and the Lưu Niên auxiliary stars remain deliberately unimplemented, for
the same reasons.

**One new disclosed convention, not a primary-source rule:** resolving *which* Đại Hạn/Tiểu Hạn
cycle is "current" requires knowing the person's present-day tuổi, which requires a definition of
"tuổi" the primary source's read pages never state explicitly. The standard Vietnamese nominal/lunar
age convention (`tuổi = currentLunarYear − birthLunarYear + 1`) was applied as a baseline cultural/
calendar convention — not a disputed school-specific rule — and is flagged as such in
`apps/api/src/tu-vi/engine/tu-vi-current-cycle.ts`'s own doc comment, so a future session can verify
it directly against the primary text if a dedicated "cách tính tuổi" section is ever found.
