# TỬ VI AN SAO LOGIC AUDIT — Gate Definition (Sprint 15, spec only)

**This document formalizes the audit gate for future use at Sprint 19 (Golden Verification &
Domain Audit Gate). It is a template/procedure, not a completed audit.** Running it now, before an
engine exists, would be meaningless — this sprint instead confirms the gate's shape, criteria, and
current baseline status for each item so Sprint 19 has a ready-to-execute checklist rather than
having to design one from scratch under release pressure.

---

## Purpose

A mandatory, independent, pre-AI-interpretation audit gate (product definition §8). **AI
interpretation cannot ship while any item below is unresolved.** This gate sits between the
"Engine" (Sprint 18) and "AI Interpretation" (Sprint 21) sprints — it is not optional and is not
satisfied merely by the engine running without runtime errors; each item requires actual
golden-vector comparison against the independent reference set (`golden-vector-specification.md`).

## Allowed result per item

- `PASS` — golden-vector comparison across the full coverage set succeeds, with no disagreement.
- `FAIL` — golden-vector comparison finds a genuine discrepancy; engine has a real defect.
- `DOMAIN_REFERENCE_REQUIRED` — the item cannot be evaluated because the underlying rule is not yet
  `RESOLVED_BY_SOURCE` in `domain-decision-register.md`, or no golden vector exists that exercises
  it yet.

**No item may be marked `PASS` merely because the engine "ran without an exception."**

---

## The 14 audit items, with Sprint 15 baseline status

| # | Item | Corresponding decision(s) | Sprint 15 baseline (would this PASS today if an engine existed?) |
|---|---|---|---|
| 1 | Solar → Lunar | DECISION-03B | Would likely `PASS` once wired — algorithm is `RESOLVED_BY_SOURCE` |
| 2 | Leap month | DECISION-03 | `DOMAIN_REFERENCE_REQUIRED` — Tử-Vi-specific treatment is UNSOURCED even though the astronomy (03B) is resolved |
| 3 | UTC+7 / birth-time normalization | DECISION-03B | Would likely `PASS` — same algorithm, timezone-fixed per calculation-specification.md §2 |
| 4 | Giờ Tý boundary | DECISION-02 | `DOMAIN_REFERENCE_REQUIRED` — real, named, sourced conflict, unresolved |
| 5 | Mệnh | DECISION-04 | `DOMAIN_REFERENCE_REQUIRED` — strong candidate formula exists but not primary-source-verified |
| 6 | Thân | DECISION-04 | Same as Mệnh |
| 7 | Cục | DECISION-05 | `DOMAIN_REFERENCE_REQUIRED` — methodology known, table incomplete |
| 8 | 12-palace indexing | (structural, not independently disputed) | Would likely `PASS` if the palace-order/direction rules from calculation-specification.md are implemented correctly — no source found disputing the 12-palace layout order itself |
| 9 | 14 main stars | DECISION-06, DECISION-07 | `DOMAIN_REFERENCE_REQUIRED` — anchor and offsets both unresolved |
| 10 | MVP auxiliary stars | DECISION-08 | `DOMAIN_REFERENCE_REQUIRED` — even the MVP list itself is unconfirmed |
| 11 | Tuần/Triệt | DECISION-09 | `DOMAIN_REFERENCE_REQUIRED` — input bases confirmed different, tables absent |
| 12 | Tứ Hóa | DECISION-10 | `DOMAIN_REFERENCE_REQUIRED` — confirmed real school conflict, must not guess |
| 13 | Vận | DECISION-12 | `DOMAIN_REFERENCE_REQUIRED` — deliberately out of scope until Sprint 22 |
| 14 | Golden vectors | `golden-vector-specification.md` | `DOMAIN_REFERENCE_REQUIRED` — zero vectors currently exist |

**Current gate status: 3 of 14 items would plausibly `PASS` today (items 1, 3, 8), assuming correct
implementation of already-resolved layers. 11 of 14 require `DOMAIN_REFERENCE_REQUIRED`.** This is
the honest current state, not a prediction of Sprint 19's actual result — Sprint 19 must re-run this
for real, against a real engine and real golden vectors, once the decision register has actually
moved.

---

## Procedure for Sprint 19 (when this gate is actually run)

1. Confirm `domain-decision-register.md` shows every item this gate depends on as
   `RESOLVED_BY_SOURCE` — if any relevant decision is still `CONFLICT`, `DOMAIN_EXPERT_REQUIRED`, or
   `UNSOURCED`, its corresponding audit item is mechanically `DOMAIN_REFERENCE_REQUIRED`, no
   engine testing needed to determine that.
2. For every item that is unblocked, run the full golden-vector suite
   (`golden-vector-specification.md`) and compare engine output field-by-field against each
   vector's expected values.
3. Any single mismatch on any vector for a given item → that item is `FAIL`, not `PASS` — a
   majority-correct result is still a `FAIL` for a deterministic system (product definition's own
   discipline: deterministic-first means exactly right, not mostly right).
4. Record the audit result, dated, with the `TUVI_ENGINE_VERSION` / `CALENDAR_VERSION` /
   `STAR_RULESET_VERSION` it was run against.
5. **AI interpretation (Sprint 21) may not begin implementation, let alone ship, until all 14 items
   are `PASS`.** A `FAIL` requires fixing and re-running the full gate, not just the failed item (a
   fix to one layer, e.g. Cục, can silently change output for every dependent layer — Tử Vi
   placement, star offsets — so a partial re-run is not sufficient assurance).

## What Sprint 19 must NOT do

- Mark an item `PASS` because "it's probably fine" or because only one golden vector was checked
  when the coverage plan called for more.
- Treat `DOMAIN_REFERENCE_REQUIRED` as a soft warning that can be waived under schedule pressure —
  product definition §8 states this explicitly: "it is not optional, and it is not satisfied by the
  engine merely running without errors."
- Silently narrow golden-vector coverage to make the gate easier to pass — if coverage gaps are
  found during Sprint 19, the product definition's own instruction is to *expand* the vector set,
  not shrink the audit's ambition.
