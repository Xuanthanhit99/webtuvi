# AI-Only Verification Standard — Sprint 18A.5

**Date:** 2026-08-21
**Supersedes (prospectively, not retroactively):** the human-reviewer assumptions in `expert-review-pack.md`, `expert-blind-golden-vector-pack.md`, `golden-vector-comparison-matrix.md`, and `sprint-18b-entry-gate.md` (all Sprint 18A.4). Those documents are **not deleted or rewritten** — they remain the historical record of what Sprint 18A.4 designed under the (now-corrected) assumption that a human Tử Vi domain expert would be recruited. This document records why that assumption no longer holds and what replaces it going forward.

---

## 1. Why this change happened

The founder has explicitly confirmed: **there is no human Tử Vi domain expert involved in this project.** Research and review have been, and will continue to be, performed by AI systems (Claude and ChatGPT), not by a qualified human practitioner.

Sprint 18A.4's design — Reviewer A / Reviewer B as independent human reviewers, `EXPERT_CONFIRMED` as an achievable status, a blind pack meant to be filled out by a person with no visibility into our candidate rules — depended on that human existing. It does not. Continuing to reference "the expert" or to imply AI output carries `EXPERT_CONFIRMED` weight would misrepresent the evidence to anyone reading these documents later, including a future engineer deciding whether it is safe to build against them.

**This document does not blame Sprint 18A.4** for designing around the information available at the time. It corrects the model going forward.

## 2. Explicit rules for this and all future Tử Vi domain sprints

- **Do not** label any AI-generated verification, re-read, or corroboration-check as `EXPERT_CONFIRMED`. That status is reserved exclusively for a case where an actual qualified human Tử Vi practitioner participated and is named.
- **Do not** present Claude (or any AI) as an independent second reviewer of Claude's own prior work. Two passes by the same model family are **additional verification depth**, not independence — this project has said so explicitly since Sprint 18A.2's own methodological-honesty note, and this sprint's re-read (§4 below) is held to the same standard.
- **Do not** fabricate reviewer independence, a review timestamp, or a credential that does not exist.
- **Do not** block the project indefinitely on the unavailability of a human expert. Evidence quality is a spectrum, not a single achievable/unachievable gate — the correct response to "no expert exists" is to use the strongest defensible evidence actually available (primary source + independent corroboration + adversarial re-read + deterministic cross-checks + rule-derived test vectors) and disclose exactly where that evidence is thinner, not to freeze.

## 3. The new evidence ladder

Replaces the `UNVERIFIED → SOURCE_EXTRACTED → CROSS_CHECKED → EXPERT_CONFIRMED` ladder used in `domain-resolution-pack.md` §14 and the `CANDIDATE_PENDING_EXPERT_VERIFICATION` framing used throughout Sprint 18A.4, for every rule going forward:

| Status | Meaning |
|---|---|
| `UNSOURCED` | No primary-source or corroborating basis exists for this rule at all. |
| `PRIMARY_SOURCE_EXTRACTED` | Directly transcribed from VDTTL-1956 once, with page citation. (Equivalent to the old ladder's `SOURCE_EXTRACTED`.) |
| `PRIMARY_SOURCE_RECHECKED` | Re-transcribed from a fresh, independent rendering of the same primary-source page image, by a separate reading pass, with no divergence found. Confirms the first read was not a transcription artifact — does **not** confirm the primary source itself is correct if the source has an internal conflict. |
| `INDEPENDENT_SOURCE_CORROBORATED` | A second source, genuinely unrelated to VDTTL-1956 and to any other source already on file (checked for shared authorship/citation chains, per this project's existing false-independence discipline), states the same rule/value. |
| `DETERMINISTICALLY_CROSS_CHECKED` | The rule's own internal structure was checked against a mathematical/structural invariant the primary source itself states (e.g., "Thân may only land on one of 6 palaces") and passes. This is evidence *about* the rule's correctness derived from the rule and the source together, not from an external party. |
| `CONVENTION_LOCK_REQUIRED` | The primary source is genuinely ambiguous, internally conflicting, or silent, and no independent source resolves it. An explicit, disclosed engineering/founder convention decision is required before implementation — the decision is recorded, never hidden inside "how the code happens to behave." |
| `SOURCE_CONFLICT` | Two sources (which may include the primary source disagreeing with itself, e.g., its own table vs. its own worked example) give different answers and neither is clearly authoritative. Distinct from `CONVENTION_LOCK_REQUIRED` in that a conflict may be *resolvable* with more evidence, whereas a convention lock is an *acknowledged, permanent* engineering choice among genuinely tied options. |
| `IMPLEMENTATION_READY` | The rule has cleared enough of the above (see `sprint-18b-revised-entry-gate.md` for the exact bar per risk tier) that an engineer can implement it directly from this documentation without further domain research, with its exact convention disclosed if any lock was required. |

**`EXPERT_CONFIRMED` is retired from active use.** It is never assigned by this or any future AI-only sprint. If a genuine human expert is ever engaged, that person's confirmations use this exact label and are dated and attributed by name — nothing in this project's history should ever cause a reader to mistake an AI pass for that.

## 4. What actually changed this sprint (evidence, not just labels)

This sprint performed a **third independent adversarial re-read** of the actual VDTTL-1956 page images (not a re-read of prior transcriptions, not OCR text, not memory) — downloading the source PDF directly from archive.org (`dv01.pdf`, 597,465 bytes, byte-identical to the copy used in Sprint 18A.1/18A.2) and rendering pages 6, 7, 8, 9, 14, and 17 at 5× zoom for direct visual reading. Full account in `canonical-ruleset-v1.md` and `source-corroboration-matrix.md`. Headline results:

- Every rule re-checked this session (Giờ, Mệnh/Thân direction, the full 30-cell Lập Cục table, both chính-tinh group direction statements and offsets, all 5 Tử Vi-anchor Cục blocks, the 40-cell Tứ Hóa table, the Tuần table, the Triệt table, the Lộc Tồn table) matches the prior two independent transcriptions **exactly, with zero new divergence found.** This is strong evidence the prior transcriptions are not OCR or reading artifacts.
- The two previously-flagged anomalies (Kim Tứ Cục's day-21/24 conflict; Triệt's table-vs-worked-example conflict) are **re-confirmed as genuine, unambiguous features of this specific printed edition** — not a misread by any of the three independent passes. This pushes them from "possible transcription error" to "real conflict requiring a disclosed convention lock," which is exactly what `CONVENTION_LOCK_REQUIRED` is for.
- A **new derivation**: the exact Mệnh/Thân mod-12 arithmetic was re-derived directly from VDTTL-1956's own verbatim counting description (not from the previously-flagged, internally-inconsistent secondary-source formula), and cross-checked against the primary source's own stated invariant ("Thân may only land on one of 6 palaces") — the derived formula produces *exactly* 6 possible Thân-relative-to-Mệnh outcomes, a clean mathematical match to the source's own claim. This is genuine `DETERMINISTICALLY_CROSS_CHECKED` evidence, and is materially stronger than anything in Sprint 18A.4's pack for this rule. Full derivation in `canonical-ruleset-v1.md` §5.
- New **`INDEPENDENT_SOURCE_CORROBORATED`** evidence for Triệt: a second independent source (`vietdich.blogspot.com`, citing a distinct named 1975 Vietnamese publication, "KHHB Xuân Ất Mão") confirms the Ất/Canh → Mùi-Ngọ table reading, on top of the `tracuulasotuvi.com`/`tracuutuvi.com` corroboration already on file from Sprint 18A.3. Two independent sources now agree with the table; zero sources found anywhere corroborate the book's own worked example's Thân-Dậu answer for a Canh-year birth.

## 5. Historical-record discipline

Nothing in Sprint 18A.4's output is deleted or marked wrong. `expert-review-pack.md`, `expert-blind-golden-vector-pack.md`, and `golden-vector-comparison-matrix.md` remain useful artifacts — their rule inventory, evidence citations, and 15 designed-input vectors are real research value, reusable as-is for their *content* even though their *review-process assumptions* (human Reviewer A/B) no longer apply. `sprint-18b-entry-gate.md` is superseded by `sprint-18b-revised-entry-gate.md` for the same reason. Where this sprint's new documents restate a fact from those documents, it is because the fact is still true — not because the fact was re-invented.
