# Sprint 18B Revised Entry Gate — Sprint 18A.5

**Date:** 2026-08-21
**Supersedes:** `sprint-18b-entry-gate.md` (Sprint 18A.4), which required `EXPERT_CONFIRMED` evidence and ≥12 human-cross-checked golden vectors — both now known to be permanently unreachable, since no human expert exists. That document is not deleted; it remains the record of what a human-reviewer-based gate would have required. This document is the actual gate going forward.

---

## 1. The problem with the old gate

The Sprint 18A.4 gate's 16 boxes were designed around two things that turned out not to exist: a human Reviewer A/B pair, and 12 `EXPERT_CONFIRMED`/`CROSS_CHECKED` golden vectors produced by that pair. Requiring them literally would block Sprint 18B forever — not because the domain evidence is actually insufficient, but because the gate was measuring the wrong thing. This document redesigns the gate around evidence that is actually achievable and actually meaningful: primary-source strength, adversarial re-read depth, independent corroboration where it exists, deterministic self-consistency, and disclosed convention locks where the source is silent or conflicted.

## 2. Per-rule minimum bar (Phase 9)

A rule may enter implementation only when **all** of the following hold:

1. Primary source is identified (VDTTL-1956, per the locked school).
2. Exact formula/table is recorded (`canonical-ruleset-v1.md`) — no prose-only rule.
3. Primary extraction has been re-read at least once independently (`PRIMARY_SOURCE_RECHECKED` or better).
4. No unresolved transcription ambiguity remains (i.e., all readers agree on what the page actually says — this is separate from whether what the page says is itself internally consistent).
5. School is explicitly VDTTL-1956, and no cross-school value was silently substituted.
6. Known cross-school and internal conflicts are documented (`source-corroboration-matrix.md`).
7. Any founder/engineering convention lock is explicit and disclosed (`canonical-ruleset-v1.md`'s `CONVENTION_DECISION` column), never hidden inside code behavior.
8. Tests can deterministically exercise it (a Class B rule-derived vector exists or can be constructed).

**For HIGH-RISK rules** — Cục, Tử Vi anchor, Mệnh/Thân, 14 Chính Tinh, Tuần/Triệt, Tứ Hóa — the bar is higher: require **either**
- (A) independent corroboration (`INDEPENDENT_SOURCE_CORROBORATED` or `DETERMINISTICALLY_CROSS_CHECKED`), **or**
- (B) exceptionally clear primary-source evidence + adversarial re-read (≥2 independent reads, no divergence) + explicit `SOURCE_SINGLE_AUTHORITY` status, disclosed as such — never presented as equivalent to (A).

**Where a rule fails both (A) and (B)** — i.e., the primary source is genuinely ambiguous or self-conflicting and no independent source resolves it — a `CONVENTION_LOCK_REQUIRED` decision is the only path forward, and it must be visible in the codebase (a named constant/config, not a magic number) and in this documentation, so a future re-evaluation can find and revisit it without re-deriving the whole domain from scratch.

## 3. Per-rule status against this bar (current, Sprint 18A.5)

| Rule | Bar met? | Basis |
|---|---|---|
| Calendar/Can Chi/12-palace | ✅ | Non-disputed, independently corroborated (open-source reimplementations) |
| Giờ (hour labeling) | ✅ | `PRIMARY_SOURCE_RECHECKED` ×3, no ambiguity |
| Giờ (day rollover) | ✅ via convention lock | Genuinely absent from source; lock disclosed (`TUVI-GIO-02`) |
| Leap-month Tử-Vi treatment | ✅ via convention lock | Genuinely absent from source; lock disclosed (`TUVI-CAL-04`) |
| Mệnh/Thân | ✅ (B) + partial (A) | Bar-B: triple-read structure + this sprint's self-consistency proof against the source's own invariant (`DETERMINISTICALLY_CROSS_CHECKED`) — a genuinely strong instance of path B, arguably stronger than a single unverified "independent" worked example would have been |
| Cục | ✅ (B) | `PRIMARY_SOURCE_RECHECKED` ×3, clean, self-consistent, no independent corroboration found (`SOURCE_SINGLE_AUTHORITY`, disclosed as such) |
| Tử Vi anchor, 4/5 Cục blocks | ✅ (B) | Same as Cục |
| Tử Vi anchor, Kim Tứ Cục | ✅ via convention lock + (A) | `INDEPENDENT` formula corroboration for the locked value (day 24→Mùi); day 21 independently confirmed correct as printed |
| 14 Chính Tinh | ✅ (A) | `mingming3.com` independent offset corroboration, both groups |
| Tuần | ✅ (B) | `PRIMARY_SOURCE_RECHECKED`, self-consistent, no independent source sought (no conflict to require one) |
| Triệt | ✅ via convention lock + (A) | 2 independent sources corroborate the table over the book's own worked example |
| Tứ Hóa | ✅ (B) | `PRIMARY_SOURCE_RECHECKED` ×3, self-consistent, cross-school corroboration deliberately not sought (moot per locked-school reasoning) |
| Auxiliary V1 (13 stars) | ✅ (B), fully | Rules sourced and re-rechecked (`PRIMARY_SOURCE_RECHECKED`, all 13, Sprint 18A.6); **`TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13` founder-locked Sprint 18A.6** — see §5 |

**14 of 14 rule groups now meet the bar for implementation, as of Sprint 18A.6.** See `sprint-18a6-entry-gate-closure.md` for the full re-verification.

## 4. Golden-vector requirement (revised)

The old ≥12-`CROSS_CHECKED`/`EXPERT_CONFIRMED`-vector gate is replaced with:

- **Class A (source-anchored) vectors: 0 required to enter Sprint 18B**, since none can currently exist without a human expert or a newly-discovered independent worked chart. If one ever becomes available, it should be added and is always the strongest possible test fixture — but its absence does not block implementation, since blocking indefinitely on something structurally unobtainable is exactly what this sprint exists to correct.
- **Class B (rule-derived) vectors: at least 6 fully computed, covering all 5 Cục and both sides of every disclosed convention lock**, before Sprint 18B begins. **This bar is met** — see `golden-vector-v2-spec.md`, 6 vectors, all 5 Cục, both Kim Tứ Cục disputed-day cases, the Triệt disputed year reproduced exactly, and a naturally-occurring maximal-density wraparound case.
- Before Sprint 18B **ships** (not merely begins), the remaining coverage gaps disclosed in `golden-vector-v2-spec.md` (5 remaining Can, leap-month/Tết-boundary cases, the sex-dependent Hỏa Tinh/Linh Tinh rule) should be closed — as automated regression tests once code exists, which is a far lower-risk way to reach that coverage than more hand computation.

## 5. What blocked Sprint 18B — now closed (Sprint 18A.6)

**Resolved.** The founder has locked `TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13` (`v1-canonical-ruleset.md` §10's recommendation, adopted verbatim, Sprint 18A.6). All 13 stars carry a complete, clean, `PRIMARY_SOURCE_RECHECKED` rule (the 6 not re-rendered in Sprint 18A.5 were re-rendered and re-verified in Sprint 18A.6, resolving the one lingering medium-confidence flag on the Hỏa Tinh/Linh Tinh table). See `sprint-18a6-entry-gate-closure.md` for the full 13-row verification and the frozen-ruleset promotion (`canonical-ruleset-v1.md` §7). **No further blocking item was found in the Sprint 18A.6 re-verification.**

## 6. Safety boundary (Phase 11, disclosed explicitly, unconditional)

The deterministic engine, once built, must never:
- Ask an LLM where a star belongs, or to repair a missing/ambiguous table cell.
- Infer an unsourced Tử Vi rule at runtime.
- Reuse Eastern Horoscope's `HEAVENLY_STEM_ELEMENT` mapping as a stand-in for Cục (an already-corrected Sprint 18A.1 mistake in the *research*, restated here as a permanent *implementation* prohibition).
- Mix schools silently — a convention lock is a disclosed, named, VDTTL-1956-scoped engineering choice; it is never an excuse to borrow a value from a different school's table.
- Let AI interpretation change, "correct," or double-check a deterministic result. AI receives finished chart facts only, after calculation, exactly mirroring the existing Tarot/Numerology/Natal Chart discipline (`calculation-specification.md` §7, unchanged).

## 7. Phased implementation recommendation (Phase 10)

Given the actual dependency order surfaced by this and prior sprints' research, the safest split is close to the candidate structure the governing task proposed, with one reordering: Tuần/Triệt/Tứ Hóa (all pure Can-indexed lookups, no dependency on Cục or star placement) can ship in the same phase as Mệnh/Thân/Cục rather than waiting for the star layer, since nothing about them depends on where Tử Vi lands.

```
18B.1 — Calendar + Can Chi + 12-palace skeleton                  (no domain risk — already IMPLEMENTATION_READY)
18B.2 — Mệnh/Thân + Cục + Tuần/Triệt + Tứ Hóa                    (all convention locks land here, fully disclosed)
18B.3 — Tử Vi anchor + 14 Chính Tinh                              (depends on 18B.2's Cục output)
18B.4 — CORE auxiliary stars                                      (blocked on the founder's 13-star scope lock, §5)
18B.5 — Full chart composition + persistence                     (per calculation-specification.md §14)
18B.6 — Golden/regression suite                                   (promote golden-vector-v2-spec.md's 6 vectors to automated tests; close the disclosed coverage gaps)
18B.7 — Interpretation boundary                                   (per §6 above — separate sprint, not touched here)
```

This is a recommendation for whoever scopes Sprint 18B's actual work breakdown — not itself an implementation, and not started this sprint.

## 8. What this gate does NOT do

It does not certify VDTTL-1956 is astrologically "correct" — that was never the question (see the governing task's own success criterion). It does not claim human-expert-equivalent confidence. It does not hide any of the 4 disclosed convention locks inside implementation code without a paper trail back to this document. Anyone implementing Sprint 18B should read `canonical-ruleset-v1.md`'s `CONVENTION_DECISION` column before writing the corresponding code, not discover the disclosed uncertainty later.
