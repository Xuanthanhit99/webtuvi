# Vietnamese Tử Vi Đẩu Số — Calculation Specification (Sprint 15, spec only)

**No code, no Prisma, no migrations in this document or the sprint that produced it.** This is a
design/requirements specification, gated by `docs/domain/tu-vi/domain-decision-register.md` — where
that register marks an item unresolved, this document says so explicitly rather than filling the
gap with plausible-looking detail.

---

## 1. Pipeline (unchanged in shape from the product definition, restated for traceability)

```
Birth data (solar date, time, location)
  → calendar/time normalization (Vietnam UTC+7, day-boundary rule)      [DECISION-02, 03B]
  → lunar date conversion (incl. leap-month handling)                    [DECISION-03, 03B]
  → Can năm / Chi năm → Cung Mệnh → Cung Thân → Ngũ Hành Cục            [DECISION-04, 05]
  → 12 cung layout → 14 chính tinh placement → phụ tinh placement       [DECISION-06, 07, 08]
  → Tuần / Triệt → Tứ Hóa                                                [DECISION-09, 10]
  → (post-MVP) Đại Hạn / Tiểu Hạn / Lưu Niên                             [DECISION-12]
  → canonical chart object (persisted, versioned)
  → visualization (12-cung chart)
  → AI interpretation (reads canonical facts only)
```

Every arrow above is annotated with the decision-register item(s) it depends on. **No arrow may be
implemented in Sprint 18 while its decision-register item is anything other than
`RESOLVED_BY_SOURCE`.**

---

## 2. Calendar layer (input normalization)

- **Timezone:** UTC+7 fixed for Vietnam birth data — consistent with Natal Chart's already-shipped
  VN-override table (per product definition §14, this module reuses Natal Chart's existing
  birth-data collection/consent pattern; the timezone-handling *pattern*, not the astrological
  rules, is directly reusable).
- **Solar→lunar conversion:** recommend wrapping the Hồ Ngọc Đức algorithm (`DECISION-03B`,
  `RESOLVED_BY_SOURCE`) rather than reimplementing lunar astronomy from scratch. See
  `authoritative-sources.md` SOURCE_ID `HND-ALGORITHM` for the citation chain (Meeus; Reingold &
  Dershowitz) and independent-reimplementation evidence.
- **Leap-month astronomy (which month is a leap month):** resolved by the same algorithm.
- **Leap-month Tử-Vi treatment (which lunar month index a leap-month birth uses for chart
  construction):** `DECISION-03`, **UNSOURCED** — do not implement until resolved.
- **Day boundary / giờ Tý:** `DECISION-02`, **CONFLICT** — two named, real conventions exist. Do
  not implement either silently; the engine must not ship until this is resolved to one explicit,
  recorded convention with a cited source.
- **Hour-branch (12 double-hour) resolution:** mechanically well-defined *except* at the 23:00–01:00
  boundary, which is exactly `DECISION-02`.

---

## 3. Can Chi (Heavenly Stems / Earthly Branches)

Standard sexagenary-cycle arithmetic (10 Can × 12 Chi, 60-year/month/day/hour cycle) is
well-established, non-disputed combinatorial math once the calendar layer (§2) is trusted — no
source found in this session disputes the mechanics of the 60-cycle itself, only how the calendar
layer feeds into it (leap months, day boundary). Once §2 is resolved:

| Rule | Input | Output | Status |
|---|---|---|---|
| Can năm / Chi năm | lunar year | sexagenary year pair | Mechanically resolved once calendar layer resolved |
| Can ngày / Chi ngày | lunar day (continuous 60-day cycle from a fixed epoch) | sexagenary day pair | Mechanically resolved once calendar layer resolved |
| Chi giờ | civil/lunar hour, per `DECISION-02`'s resolution | one of 12 branches | Blocked on `DECISION-02` |
| Can giờ | Chi giờ + Can ngày (five-rat-escape / ngũ thử độn method) | sexagenary hour pair | Standard, well-documented derivation once Can ngày + Chi giờ known — not independently re-verified in this session, flagged for confirmation alongside `DECISION-04` |
| Can tháng / Chi tháng | lunar month + Can năm (via a standard month-stem derivation) | sexagenary month pair | Same caveat as Can giờ — standard method, not independently re-verified this session |

**Status:** the *mechanics* of Can Chi are low-risk (this is standard, centuries-old, undisputed
calendrical arithmetic — not a Tử Vi-school-specific point of contention anywhere found in this
session's research). The *inputs feeding it* (calendar layer, day boundary) are the actual risk,
already tracked above.

---

## 4. Âm Dương / Ngũ Hành foundation

**Required for chart construction:**
- Each Heavenly Stem's Yin/Yang polarity and Five-Element assignment (standard, non-disputed —
  every Can has a fixed, universally-agreed element in all Tử Vi/Bát Tự literature).
- Each Earthly Branch's Five-Element assignment (same).
- **Nạp Âm** (the "sound element" of a Can-Chi pair) — required specifically because
  `SECONDARY-TNT`'s cited Cục-derivation method depends on it. If DECISION-05's methodology is
  confirmed, Nạp Âm becomes a required intermediate calculation, not merely interpretive color.

**Interpretation-only (do not build into the deterministic engine unless a later, sourced rule
requires it):**
- Gender-based Âm/Dương interaction effects on interpretation narrative.
- Any Ngũ Hành "generates/overcomes" (sinh/khắc) narrative framing — this belongs in the AI
  interpretation layer (§7 below), reading already-computed facts, never as its own deterministic
  calculation step.

---

## 5. Mệnh / Thân

See `domain-decision-register.md` DECISION-04. Candidate formula (not yet implementation-grade):

```
Mệnh = ((tháng − giờ) + 1) mod 12   [normalize into 1–12]
Thân = ((tháng + giờ) − 1) mod 12   [normalize into 1–12]
```
`tháng` = lunar birth month (1–12), `giờ` = birth-hour branch index, both counted from a fixed
Dần=1 reference. **Status: `DOMAIN_EXPERT_REQUIRED`** — structurally corroborated by two
independent secondary descriptions, but neither is a primary text. This is the fastest item in the
whole register to close (a domain expert can likely confirm or correct this in one pass) and should
be prioritized first.

---

## 6. Ngũ Hành Cục

See `domain-decision-register.md` DECISION-05. Category structure is corroborated (Thủy Nhị=2,
Mộc Tam=3, Kim Tứ=4, Thổ Ngũ=5, Hỏa Lục=6). The derivation method (Nạp Âm of the Can-Chi of the
month containing Mệnh) is named with two cited primary sources but only one worked example.
**Status: `UNSOURCED`** for the complete table. This is a **hard gate** — no star placement can
proceed without it.

---

## 7. Deterministic / AI boundary (exact, per this sprint's instructions)

**The AI (Gemini, or whichever provider is active) MUST NEVER calculate:**
- Lunar date / leap-month resolution
- Can Chi (any of năm/tháng/ngày/giờ)
- Mệnh, Thân
- Ngũ Hành Cục
- The 12-cung palace layout
- Star positions — 14 chính tinh and every MVP auxiliary star
- Tuần, Triệt
- Tứ Hóa
- Vận cycle positions (Đại Hạn/Tiểu Hạn/Lưu Niên, once in scope)

This mirrors, and does not weaken, the identical rule already enforced for Tarot/Numerology/Natal
Chart (Bible Module 23 §10) and restated verbatim in the product definition §3. **AI may only**
explain, summarize, synthesize, and personalize narrative built from already-computed canonical
facts handed to it as structured data — never re-derive or "double-check" a fact by recomputing it.

---

## 8. AI input contract (spec only)

A future AI interpretation call must receive a closed, structured payload of canonical facts —
conceptually: `{ menh, than, cuc, palaces: [...], mainStars: [...], auxStars: [...], tuanTriet,
tuHoa, engineVersions }` — and a system-level instruction that:
1. Explicitly forbids inventing, inferring, or "filling in" any star, palace, or fact not present
   in the payload.
2. **Fails closed** if the canonical chart is incomplete for any required MVP field — the
   interpretation step must refuse to run (structured `INCOMPLETE_CANONICAL_CHART` error, see §10)
   rather than paper over a gap with plausible-sounding prose. This is the direct analog of Natal
   Chart's and Tarot's existing "never invent a card/placement" rules, applied to a domain with
   more moving parts and therefore more surface area for silent gap-filling if not enforced
   explicitly at the contract level.

---

## 9. Versioning

Three persisted version identifiers, per product definition §6, confirmed still required:

| Version | Increments when |
|---|---|
| `TUVI_ENGINE_VERSION` | Any change to the overall calculation pipeline/orchestration (e.g., adding vận cycles, changing how canonical facts are assembled) |
| `CALENDAR_VERSION` | Any change to the solar↔lunar conversion algorithm/library, leap-month handling, or day-boundary (`DECISION-02`) resolution |
| `STAR_RULESET_VERSION` | Any change to Cục, star placement (main or auxiliary), Tuần/Triệt, or Tứ Hóa tables — including switching which cited source a table is derived from |

This mirrors the `calculationVersion`/`normalizationVersion` pattern already shipped for
Numerology — an extension of a proven pattern, not a new one. Every persisted chart must store all
three so a historical chart remains explainable even after rules evolve (product definition §6).

---

## 10. Failure modes (deterministic errors, never silent substitution)

| Error code | Trigger |
|---|---|
| `UNSUPPORTED_DATE` | Birth date outside the calendar algorithm's reliable range |
| `INVALID_BIRTH_TIME` | Malformed or missing birth-hour input where required |
| `CALENDAR_CONVERSION_FAILED` | Underlying solar↔lunar library throws/returns an error |
| `UNRESOLVED_RULESET` | An attempt to calculate against a decision-register item that is not yet `RESOLVED_BY_SOURCE` in the active `STAR_RULESET_VERSION` — this is the mechanism that makes "don't ship an unresolved rule" enforceable in code, not just in process |
| `ENGINE_VERSION_UNSUPPORTED` | A request references a `TUVI_ENGINE_VERSION` the running service no longer supports |
| `INCOMPLETE_CANONICAL_CHART` | Chart assembly produced a partial result (e.g., one required auxiliary star failed to place) — must block AI interpretation (§8) |

No failure mode may be silently downgraded to an approximate or partial chart being shown as if
complete.

---

## 11. Privacy / minimum input data

Per this sprint's instruction, **do not automatically copy Natal Chart's location requirement.**

| Field | Classification | Why |
|---|---|---|
| Birth date | REQUIRED | Foundational to every downstream calculation |
| Birth time | REQUIRED | Required for hour-branch, Mệnh/Thân, and is the source of the single highest-risk ambiguity (`DECISION-02`) — the product cannot honestly ship without it, and must be explicit with users about why (mirrors Natal Chart's existing disclosure pattern) |
| Timezone | REQUIRED, but fixed to Vietnam UTC+7 rather than user-selected — no evidence found in this session that Tử Vi Đẩu Số as practiced needs a birth-location-derived timezone the way Western Natal Chart's ephemeris-based houses do |
| Gender | **OPTIONAL, pending domain confirmation** — some vận-cycle methods (Đại Hạn direction) are traditionally gender-dependent in Chinese/Vietnamese astrology broadly, but no source in this session confirmed whether the MVP (static chart, no vận) actually needs it. Recommend collecting it as optional now (cheap, reversible) rather than requiring a second data-collection pass later if a `DECISION-12` resolution needs it — but do not make it required for MVP. |
| Birth location (city/coordinates) | **NOT_NEEDED for MVP** — unlike Natal Chart (which needs real ephemeris/house calculations tied to geographic coordinates), no source found in this session showed Tử Vi Đẩu Số chart construction depending on birth location beyond the fixed Vietnam-UTC+7 assumption already covered above. Do not collect it merely because Natal Chart does. |

This reuses Natal Chart's existing consent/storage pattern for the fields actually needed (product
definition §14), not its full field set.

---

## 12. Premium boundary (confirmed locked, no change proposed)

**FREE:** the full deterministic chart — all 12 cung, all 14 chính tinh, MVP auxiliary stars,
Tuần/Triệt/Tứ Hóa — plus a short per-palace interpretation. **PREMIUM:** deeper palace
interpretation, cross-palace synthesis, vận analysis (once in scope), richer/unlimited history,
Memory-aware explanation, Destiny Report inclusion. Correctness is never paywalled — confirmed
unchanged from product definition §12, no research finding in this sprint conflicts with it.

---

## 13. Reports interaction (Sprint 16 precedes the Tử Vi engine)

Reports (Sprint 16) ships before any Tử Vi code exists (Sprint 18+). Reports **must not** expect or
reference Tử Vi data in its initial version, and must not render any placeholder/fake Tử Vi section.
Once the Tử Vi engine ships and passes its golden-vector gate (Sprint 19), Tử Vi becomes an
additional, versioned, additive input to Reports — never a required one, never backfilled into
already-generated reports without an explicit versioned regeneration path.

---

## 14. Persistence requirements (concept only — no Prisma changes this sprint)

A future `TuViReading`-shaped record must be able to reproduce, years later, exactly what was shown
to the user, meaning it needs at minimum (conceptually, not a schema):
- The canonical input (solar birth datetime, resolved timezone, any optional gender field)
- The three version identifiers (§9)
- Every calculated canonical fact (lunar date, Can Chi set, Mệnh, Thân, Cục, all 12 palace
  contents, all placed stars with their palace, Tuần/Triệt palaces, Tứ Hóa assignments)
- Interpretation metadata, kept separately/visibly distinguishable from canonical facts (mirrors the
  existing Reports discipline and Tarot/Natal Chart's own reading-record pattern)
- History/lifecycle fields matching the existing Discovery-system pattern (archive/restore, not
  delete-only)

**No migration is created in Sprint 15.** This section exists so Sprint 18's engine work does not
have to re-derive these requirements from scratch.

---

## 15. Migration strategy (concept only)

Additive-only: a new set of tables (not a retrofit of Natal Chart's or Numerology's schema), so
existing Discovery systems are unaffected regardless of when Tử Vi ships. No migration is created
in this sprint.

---

## 16. MVP vs. post-MVP boundary (confirmed against product definition §4, no scope expansion)

**MVP-required** (Sprint 18, gated on the decision register): calendar/day-boundary/Can Chi, Mệnh,
Thân, Cục (all 5 variants), all 14 chính tinh with correct wraparound and empty-palace (vô chính
diệu) handling, the MVP auxiliary-star set (pending DECISION-08), Tuần, Triệt, Tứ Hóa.
**Explicitly undecided, not defaulted either way:** Miếu/Vượng/Đắc/Hãm (DECISION-11 — founder scope
call).
**Post-MVP (Sprint 22):** Đại Hạn, Tiểu Hạn, Lưu Niên (DECISION-12) — this sprint deliberately did
not research vận rules, consistent with Roadmap V2's own sequencing and this sprint's explicit
instruction not to expand Sprint 18's scope.
**No new items are added to MVP scope by this sprint's research** beyond what §4 of the product
definition already specified — the research clarified *how hard* several of these are, not *what*
belongs in MVP.
