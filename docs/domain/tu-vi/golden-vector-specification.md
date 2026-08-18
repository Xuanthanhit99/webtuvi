# Vietnamese Tử Vi Đẩu Số — Golden Vector Specification (Sprint 15, spec only)

**Purpose:** design the independent validation dataset that will gate Sprint 19 (Golden
Verification & Domain Audit). No vectors are populated in this sprint — expected values must come
from an independent, named reference, never from this project's own future engine, and this
sprint's research (secondary web sources, mostly) does not meet that bar for any individual vector.

---

## Minimum target

**12–15 independently verified charts**, expandable if domain coverage gaps are found during
Sprint 19 review — unchanged from product definition §7.

## Required coverage checklist

| Coverage requirement | Why | Status this sprint |
|---|---|---|
| Multiple normal dates (baseline correctness) | Establishes the floor | Not yet sourced |
| A lunar leap-month date | Tests `DECISION-03` | Not yet sourced |
| A lunar/solar year-boundary date (around Tết) | Tests calendar-layer edge handling | Not yet sourced |
| A 22:59 / 23:00 boundary date | Tests `DECISION-02`'s "Sơ" side | Not yet sourced |
| A 23:59 / 00:00 boundary date | Tests `DECISION-02`'s "Chính" side | Not yet sourced |
| Multiple distinct birth hours (all 12 branches at least once across the set) | Coverage of `DECISION-04` | Not yet sourced |
| All five Ngũ Hành Cục (at least one chart each) | Tests `DECISION-05` completeness | Not yet sourced |
| Distinct Tử Vi placements (meaningfully different palace positions) | Tests `DECISION-06`/07 | Not yet sourced |
| A star-wraparound / dense multi-star palace case | Ordering correctness | Not yet sourced |
| A case exercising Tuần | Tests `DECISION-09` | Not yet sourced |
| A case exercising Triệt | Tests `DECISION-09` | Not yet sourced |
| A case exercising each Tứ Hóa pattern where practical | Tests `DECISION-10` | Not yet sourced — blocked on school selection first |
| Multiple distinct Can (as many of the 10 as practical) | General coverage | Not yet sourced |
| Multiple distinct Chi (as many of the 12 as practical) | General coverage | Not yet sourced |
| A case exercising vận calculation | Deferred — only once `DECISION-12`/Sprint 22 is in scope | Explicitly out of scope for the Sprint 18/19 vector set |

---

## Vector record template

Every vector, once sourced, must store:

```
VECTOR_ID
birthDate (solar)
birthTime
timezone / location assumptions
gender (if the resolved ruleset ends up requiring it — see calculation-specification.md §11)
source (named — a specific published lá số, book worked example, or practitioner-verified chart)
sourceLocationDetail (page/section/URL/screenshot reference — not just "a website")
expectedLunarDate (incl. leapFlag)
expectedCanChi (năm/tháng/ngày/giờ as resolved)
expectedMenh
expectedThan
expectedCuc
expectedPalaceArrangement (all 12 cung)
expectedMainStarPositions (all 14 chính tinh)
expectedAuxiliaryStars (per the MVP set, once DECISION-08 is resolved)
expectedTuanTriet
expectedTuHoa
expectedVanResult (once vận is in scope, Sprint 22+)
manualTranscriptionReviewer (name/identifier of whoever transcribed it)
secondReviewerStatus (confirmed / pending / disagreement — a single-reviewer vector is not
  sufficient for a hard-gate dataset)
```

**Non-negotiable, restated from the product definition §7:** expected values must come from an
independent, named reference (a published lá số from a recognized calculator, text, or
practitioner) — never derived from the implementation under test. This session did not produce any
qualifying vector — every candidate source found was either a category-level description (no full
worked chart) or a single worked example without independent second-reviewer confirmation
(`SECONDARY-TNT`'s one Cục example is the closest thing found, and it is not a full chart, only one
field).

---

## Source policy for future sourcing work

Acceptable sources for a real vector, in descending preference:
1. A worked example from a primary text (VDTTL-1956, TD-TOANTHU, or whichever source
   `DECISION-01` resolves to), independently transcribed and reviewed by two people.
2. A chart independently verifiable against a live, reputable practitioner's own published
   worked example (not a calculator app's raw output — the practitioner must show their work or
   the chart must be independently cross-checked against a second source).
3. A chart produced by a domain expert specifically engaged for this project, working from the
   resolved ruleset, with their working shown.

**Not acceptable alone:** any single calculator website's output, any single open-source library's
output (including `iztro`), any AI-generated chart (including one this project's own future engine
produces, obviously — that would be circular).

---

## Boundary test matrix (Sprint 15 §36 requirement)

| Boundary | Expected semantics | Status |
|---|---|---|
| 22:59 → 23:00 | Should trigger a hour-branch change to Tý — direction of civil-day change depends on `DECISION-02` | Unresolved pending DECISION-02 |
| 23:59 → 00:00 | Should stay within Tý (if "Giờ Tý Sơ" spans the full 23:00–00:59 window) or cross into "Giờ Tý Chính" as a distinct sub-period — depends on which convention is selected | Unresolved pending DECISION-02 |
| Lunar month end | Calendar-layer mechanical rollover | Resolved by `DECISION-03B` (calendar library), assuming correct library integration |
| Lunar year end | Calendar-layer mechanical rollover, Can Chi năm changes | Resolved by `DECISION-03B` for the astronomy; downstream Tử Vi treatment not separately verified |
| Solar year end | Not the same as lunar year end — must not be conflated | Resolved by `DECISION-03B` for astronomy; no Tử Vi-specific concern found distinct from the lunar year boundary |
| Lunar New Year (Tết) | The highest-density ambiguity window for solar/lunar mismatch | Resolved by `DECISION-03B` for the astronomy; requires explicit golden-vector coverage regardless, since this is exactly where naive implementations are known to break |
| Leap month entering | First day of an intercalary month | Resolved astronomically by `DECISION-03B`; Tử-Vi-specific treatment is `DECISION-03`, UNSOURCED |
| Leap month exiting | Last day of an intercalary month, transition to the next regular month | Same as above |

Where this table says "unresolved," Sprint 19's audit gate item for that boundary must resolve to
`DOMAIN REFERENCE REQUIRED`, never a guessed `PASS`.

---

## Property / invariant test plan (Sprint 15 §35 requirement — separate from golden vectors)

These do not require an external source — they are structural guarantees any correct engine must
satisfy, checkable by construction:

- Exactly 12 palaces exist on every chart, always.
- Exactly one Mệnh palace, exactly one Thân palace (Thân may coincide with Mệnh — that is a valid,
  named outcome in the tradition, not a bug, per general Tử Vi structure; this session did not find
  a source disputing that Thân-equals-Mệnh is possible).
- Exactly 14 main-star placements per chart (each of the 14 named stars appears exactly once).
- Every star maps to a valid branch/palace (index 0–11 or 1–12 depending on internal convention —
  see calculation-specification.md's canonical representation notes) — no wraparound may ever
  produce an out-of-range index (no "branch 13" or "branch -1").
- Cục is always exactly one of the 5 valid named values — never a 6th value, never null for a
  complete, valid input.
- Tứ Hóa always produces exactly four transformations (Lộc, Quyền, Khoa, Kỵ) — never more, never
  fewer, for a given Can năm, once `DECISION-10` is resolved.
- Deterministic repeatability: same `TUVI_ENGINE_VERSION` + same canonical input → byte-identical
  chart output, always (no floating-point drift, no unordered-map nondeterminism in
  implementation).
- Tuần affects exactly 2 palaces; Triệt affects exactly 2 palaces (possibly overlapping with
  Tuần's, possibly not — per `SECONDARY-TUANTRIET-BASIS`, up to 4 total, never fewer than 2 for
  each).

No domain-specific invariant is added here beyond what this session's research actually sourced —
per instruction, "Add domain-specific invariants only when sourced."
