# Sprint 17 — Eastern Horoscope — Pre-Implementation Audit

**Type:** Audit / specification only. No Eastern Horoscope implementation, no Prisma changes, no API
code, no frontend code were written in this sprint. No commit, no push. Companion document:
`docs/domain/eastern-horoscope-rules.md` (domain research/decision register — read that document for
full source detail; this document references it rather than duplicating it).

---

## 1–4. Git baseline (independently verified, not assumed)

```
current branch   = master
HEAD             = dd029a2f199ec52ab24d82a4bd4a301c7917dc42
origin/master     = dd029a2f199ec52ab24d82a4bd4a301c7917dc42 (fetched fresh this session)
ahead/behind     = 0 / 0
working tree     = clean, except one pre-existing unstaged edit from the prior Sprint 16 Release
                    Closure session (docs/progress/sprint-16-final-report.md — the fresh-verification
                    appendix added during that closure pass, not part of this audit)
staged files     = none
untracked files  = none (beyond the one modified-not-staged file above)
merge/rebase/cherry-pick in progress = none
```

**Sprint 16 consolidation, verified directly (not trusted from the summary in the task prompt):**
`git show --stat dd029a2` confirms 55 files changed, 7293 insertions, including
`apps/api/src/reports/**` (module, controller, 5 service dirs, DTOs, mappers), the migration
`apps/api/prisma/migrations/20260817154354_sprint16_destiny_reports/`, both Sprint 16 e2e specs
(`apps/api/test/reports.e2e-spec.ts`, `apps/web/e2e/flow-27-personal-destiny-report.spec.ts`), and
all 6 Sprint 15 Tử Vi domain docs (`docs/domain/tu-vi/*.md`). Independently confirmed present on disk
(not just in the diff): `apps/api/prisma/migrations/20260817154354_sprint16_destiny_reports/` exists;
`apps/api/prisma/schema.prisma` contains `DestinyReport`, `DestinyReportStatus`,
`DestinyReportFailureReason`. **Sprint 16 is genuinely consolidated and pushed — not assumed from the
task prompt's summary.**

---

## 5. Governing documents read (full text, this session)

- `docs/product/product-completion-roadmap-v2.md` — full text, all 24 sprints, founder decisions table
- `docs/reference/web-tu-vi/web-tu-vi/14-eastern-horoscope-experience.md` — Product Bible Module 14, full text (23 sections)
- `docs/architecture/product-surface-map.md` — full text
- `docs/product/vietnamese-tu-vi-product-definition.md` — full text (15 sections)
- `docs/audit/sprint-15-pre-implementation-audit.md` — read in prior session context; cross-referenced this session
- `docs/domain/tu-vi/authoritative-sources.md` — full text
- `docs/domain/tu-vi/domain-decision-register.md` — full text
- `docs/domain/tu-vi/calculation-specification.md` — full text
- `docs/product/personal-destiny-report-decisions.md` — full text
- `docs/progress/sprint-16-final-report.md` — full text (including this session's own prior closure appendix)

**Founder Product Decision / Roadmap Lock:** no file with that exact name exists. The founder-locked
decisions live in `docs/product/product-completion-roadmap-v2.md` §2 ("Founder Decisions (locked
inputs to this roadmap)") — read in full; this is treated as the authoritative founder-lock record,
not inferred from a separate missing document.

**product-surface-map:** `docs/architecture/product-surface-map.md` — located and read; confirms
Eastern Horoscope's current route/code status independently of the Bible/roadmap docs (see §8 below).

**Term search performed** across the full repo (`apps/`, `docs/`) for: Eastern Horoscope, Chinese
Zodiac, Five Elements, Ngũ Hành, Can Chi, Thiên Can, Địa Chi, 生肖, zodiac, element — results
classified in §8.

---

## 6. Exact Eastern Horoscope definition (from governing docs, not inferred from route names)

Per Bible Module 14 (`14-eastern-horoscope-experience.md`) and Roadmap V2 §2/§3:

- **What it is:** a deterministic Chinese lunisolar-calendar-and-Five-Elements calculation engine
  (animal sign + element, from birth year), paired with a fixed, culturally-curated reference
  database for animal-sign qualities and elemental interactions, personalized through the existing
  single-most-relevant-Memory pattern, rendered exclusively in thematic/quality language (never
  predictive, never luck-scored), on an **annual/seasonal cadence** (not daily).
- **What it explicitly is not** (Bible §11, §23; Roadmap V2 founder decision): lucky
  numbers/colors/luck-scoring (hard rejection); a generic "Eastern mysticism" flavor treatment; a
  daily-engagement system; AI-approximated calendar/element calculation; Tử Vi under a different
  name.
- **Business framing** (Roadmap V2 §3, P2 item 1; §6 Sprint 17 entry): "the Bible's actual, narrowly-
  scoped, already-spec'd V1.5 Discovery module — independent of Tử Vi, unblocks the SEO calculator
  idea later." In scope: "lunisolar calendar engine, animal-sign/element deterministic mapping, same
  premium/cost-control/Companion-bridge pattern as the other Discovery systems." Explicitly out of
  scope: "anything Tử Vi-specific; do not let this sprint absorb Tử Vi scope by convenience."

---

## 7. Eastern Horoscope vs. Tử Vi boundary (explicit, per governing docs — not assumed)

| | Eastern Horoscope | Vietnamese Tử Vi Lá Số |
|---|---|---|
| Canonical display name | Ngũ Hành Phương Đông | Tử Vi Lá Số |
| Internal slug | `eastern-horoscope` (existing, unchanged) | `tu-vi` |
| Input | Birth **year** only | Full birth date + time (+ Vietnam UTC+7) |
| Core output | Animal sign, element, annual Year Energy | 12-cung chart, 14 chính tinh, auxiliary stars, Tuần/Triệt, Tứ Hóa |
| Cadence | Annual/seasonal | Static (one chart per person, MVP) |
| Roadmap sprint | 17 (this audit) | 18–22 |
| Domain register status | 2 of 7 items open (`docs/domain/eastern-horoscope-rules.md` §7) | 10 of 12 items open (`docs/domain/tu-vi/domain-decision-register.md`) |
| Founder decision | "Remains separate — Chinese Zodiac/Five Elements, unchanged scope, **never renamed to 'Tử Vi.'**" (Roadmap V2 §2) | "GREENLIT — build as a new, separate, dedicated module... Neither replaces the other." (same table) |

**Confirmed, this session: zero code overlap.** No file in `apps/api/src/reports/`,
`apps/api/src/natal-chart/`, or anywhere else references an Eastern-Horoscope/Tử-Vi merged concept.
`apps/api/src/natal-chart/engine/natal-chart-constants.ts` itself contains an explicit code comment
distinguishing Natal Chart's Western tropical zodiac from "the unrelated future 'Eastern Horoscope'
module" — the existing codebase already actively guards against this exact conflation, not something
this audit needs to newly introduce discipline for.

**Sprint 17 must not become a Tử Vi implementation sprint:** confirmed as a hard, repeated,
independently-sourced instruction across the product definition, the roadmap, and the Bible module
itself — not a caution invented by this audit's own brief.

---

## 8. Existing implementation status (audited, not assumed from route names)

**Repository-wide search** for Eastern-Horoscope-relevant terms found **63 files** with a textual
match; every genuine hit is one of: (a) this Bible module document itself, (b) roadmap/audit/progress
documentation, (c) the `/discover` hub's honest "Coming soon" card copy
(`apps/web/app/(app)/discover/page.tsx`), (d) the landing page's "Coming soon" teaser
(`apps/web/content/landing-copy.ts`), (e) code comments in unrelated modules (Natal Chart, Dashboard)
explicitly *distinguishing themselves from* Eastern Horoscope, or (f) this session's own new files.

**Confirmed zero:**
- No `apps/api/src/eastern-horoscope/` directory or equivalent — no backend module.
- No `EasternHoroscope*` Prisma model — `grep` of `schema.prisma` returns nothing.
- `AIFeature` type (`apps/api/src/companion/providers/ai-feature.types.ts`) is currently
  `'companion' | 'tarot' | 'numerology' | 'natal_chart' | 'reports'` — no `'eastern_horoscope'`
  value exists yet, confirming no AI-infrastructure wiring has begun.
- No route under `apps/web/app/(app)/` for Eastern Horoscope — only the Discover-hub card.
- `apps/web/features/menh-vi/**` (the archived design prototype, 22 files) — searched specifically
  for zodiac/element/animal-sign content given this audit's own explicit warning not to mistake
  decorative/mock UI for implementation. **Confirmed: zero matches.** The one textual hit
  (`mv-top-nav.tsx`) was a false positive (`HTMLDivElement`, a React type, not astrology content).
  `/menh-vi` has no Eastern Horoscope-relevant reusable code, decorative or otherwise.
- No lunar-calendar library dependency in `apps/api/package.json` (checked directly) — the
  `circular-natal-horoscope-js` dependency present is Natal Chart's Western-astrology engine,
  unrelated.

**Conclusion: this is a genuinely greenfield module**, matching `product-surface-map.md`'s own
existing claim ("No backend module exists yet") — independently re-confirmed, not merely quoted.

---

## 9. Reusable architecture (audited against actual shipped code)

The two closest sibling Discovery modules — `apps/api/src/natal-chart/` and
`apps/api/src/numerology/` — share an identical folder shape:

```
{module}/
  dto/             — request/response contracts
  engine/          — deterministic calculation, zero AI, zero Prisma writes
  interpretation/  — AI synthesis layer, reads engine output only
  record/          — persistence, ownership-scoped CRUD, history
  {module}.module.ts
  {module}.controller.ts
  {module}.mappers.ts
```

`apps/api/src/reports/` (Sprint 16, freshest example) uses an equivalent shape
(`readiness/`, `snapshot/`, `generation/`, `record/`). **Recommendation: Eastern Horoscope should
follow this exact same shape** — not because it "sounds clean," but because it is the actual,
consistent, three-times-proven pattern this codebase already uses for every deterministic-engine +
AI-interpretation Discovery module, and deviating from it would be the actual novelty requiring
justification.

**Reuse matrix:**

| Capability | Existing implementation | Reusable? | Modification required? | Risk |
|---|---|---|---|---|
| AI provider orchestration | `ProviderOrchestratorService`/`ProviderRegistryService` (Companion) | Yes, verbatim | None — add `'eastern_horoscope'` to `AIFeature` union | Low |
| Cost control / budget | `CostControlService` (global per-user, not feature-scoped, "a security decision, not an oversight" per its own code) | Yes, verbatim | None | Low |
| Generation lock | `GenerationLockService.tryAcquireDiscovery` | Yes, verbatim | None | Low |
| Safety pipeline | `SafetyService` | Yes, verbatim | None | Low |
| Rate limiting | `DiscoveryThrottlerGuard` | Yes, verbatim | None | Low |
| Premium/entitlement | `EntitlementService` | Yes, verbatim | None | Low |
| Account export | `AccountExportPayload.discoveries: { tarot, numerology, natalChart }` | Yes, additive | Add `easternHoroscope` key, following the exact Sprint 16 `destinyReports` precedent | Low |
| Account deletion | Existing per-module `deleteMany` pattern in the deletion transaction | Yes, additive | Add one `deleteMany` call | Low |
| Analytics | `ClientAnalyticsEventName`/`ServerAnalyticsEventName` closed unions | Yes, additive | Add the approved event set (§31) | Low |
| Companion bridge | Read-only `<Link href="/companion">`, identical across Tarot/Natal Chart/Reports | Yes, verbatim | None | Low |
| Memory integration | Existing consent/budget/relevance services | Yes, verbatim | None | Low |
| Versioning pattern | `calculationVersion`/`normalizationVersion` (Numerology), `TUVI_ENGINE_VERSION` family (Tử Vi spec) | Yes, as a pattern | New version constants, same shape | Low |
| Lunar calendar engine | **None exists in this codebase** | No — new dependency required | Add a solar↔lunar conversion library (see `eastern-horoscope-rules.md` §6 — recommend reusing the same Hồ Ngọc Đức-algorithm choice Sprint 15 already vetted) | Medium — new dependency, but the algorithm itself is already vetted by Sprint 15's research, not unvetted |
| Notification type | `NOTIFICATION_TYPES`'s own doc comment anticipates "Companion/Community/Reports" triggers but **not** Eastern Horoscope specifically | Partial | Not required for V1 (Bible module has no notification requirement); would need a new type if ever added | Low, deferred |

---

## 10. Required deterministic facts

Per Bible §17/§18 and `eastern-horoscope-rules.md` §3/§5: birth-year Heavenly Stem, birth-year Earthly
Branch, resulting zodiac animal, resulting element (pending §4's simple-vs-Nạp-Âm resolution),
Yin/Yang polarity, and the current-year Year Energy relationship (generates/is-generated-by/controls/
is-controlled-by/same, via the Five Elements cycle). All classified `DETERMINISTIC FACT` or `DERIVED
DETERMINISTIC FACT` — never AI-calculated, per the Bible's own §17/§18/§19 and this product's
standing Module 23 §10 rule.

**Classification:**
- `DETERMINISTIC FACT`: birth-year Stem, birth-year Branch, zodiac animal, birth-year element,
  Yin/Yang.
- `DERIVED DETERMINISTIC FACT`: current-year Year Energy relationship (a lookup against the fixed
  generating/controlling cycle, applied to two already-fixed facts).
- `AI INTERPRETATION`: the thematic narrative connecting Year Energy to the user's actual life
  (Bible §6, §18 — "Themes" row, explicitly named as "the genuinely generative layer").
- `PRODUCT COPY`: fixed reference descriptions of each animal sign's traditional qualities and each
  element's traditional qualities (curated content, not AI-generated, but not calculated either —
  static reference text).

---

## 11. Calendar requirement

Solar (Gregorian) birth year → lunar year, needed because the Chinese/Vietnamese lunar year does not
align with the Gregorian year (a Gregorian-year-born-in-January user may still belong to the *prior*
lunar year). Birth **time** is not required for this module's V1 scope (Bible §14: "Birth Year
missing" is the only input-gap error case listed; no birth-hour error case exists, unlike Tử Vi's
giờ Tý requirement) — confirmed by both the Bible module's own error table and
`eastern-horoscope-rules.md` §6's explicit finding that the giờ Tý question is not applicable here.

---

## 12. Year-boundary convention — the central open finding

**Genuinely unresolved, real, sourced disagreement.** See `eastern-horoscope-rules.md` §2 for full
detail. Summary: Lunar New Year (Tết) vs. Lập Xuân (Start of Spring solar term) are both real,
actively-used conventions in closely related traditions, differing by up to several weeks in a given
year, producing different animal-sign/element results for birth dates in the gap. Gregorian January 1
is confirmed **not** a legitimate convention in any source found and is excluded as a non-contender.
**Marked `DOMAIN DECISION REQUIRED`, not silently defaulted**, per this audit's own explicit
instruction (§5 of the audit brief) not to choose silently.

---

## 13. Stem/Branch rule status

`RESOLVED_BY_SOURCE`. See `eastern-horoscope-rules.md` §3 — the 10-Stem Yin-Yang/element table and
60-year sexagenary cycle mechanics are standard, non-disputed, confirmed by multiple independent
sources this session, and structurally identical to the already-low-risk Can-Chi mechanics
`docs/domain/tu-vi/calculation-specification.md` §3 already established for the Tử Vi module.

---

## 14. Zodiac rule status

`RESOLVED_BY_SOURCE`. See `eastern-horoscope-rules.md` §3 — the 12-Branch → animal mapping is
standard and non-disputed. One minor, well-documented, non-blocking Vietnamese/Chinese variant noted
(Mão = Cat in Vietnamese tradition, Rabbit in Chinese) — not a school conflict requiring a founder
call, simply a locale-copy decision (use "Mèo"/Cat, consistent with this product's Vietnamese-facing
audience and existing Vietnamese terminology conventions elsewhere in the product).

---

## 15. Five Element rule status

`RESOLVED_BY_SOURCE` for the generating/controlling cycle itself (Wood→Fire→Earth→Metal→Water→Wood;
Wood→Earth→Water→Fire→Metal→Wood) — standard, non-disputed, confirmed across every source found this
session. **`DOMAIN DECISION REQUIRED`** for which element-assignment convention feeds that cycle
(simple Stem-element vs. compound Nạp Âm) — see `eastern-horoscope-rules.md` §4, a genuinely new
finding not previously flagged in any governing document. This audit recommends the simple
Stem-element convention (matches the Bible's own worked example, dramatically simpler, keeps this
module's popular/folk register distinct from Nạp Âm's more Tử-Vi-adjacent technical usage) but does
not record this as a locked decision.

---

## 16. Yin/Yang rule status

`RESOLVED_BY_SOURCE`. Fixed per-Stem assignment (§3 above), non-disputed, no separate calculation
required beyond the Stem lookup itself.

---

## 17. Source-quality verdict

Per this audit's own instruction not to treat random astrology websites as canonical: sources used
this session are classified in `eastern-horoscope-rules.md` using the same
`PRIMARY/CORROBORATING/SECONDARY` discipline `docs/domain/tu-vi/authoritative-sources.md` established.
**Key distinction from Sprint 15's findings:** the Stem/Branch/zodiac/Five-Elements mechanics (§13–16
above) are corroborated by a *large number of independent, mutually-agreeing* sources with no
located conflict — a meaningfully different evidentiary posture than Tử Vi's star-placement tables,
which Sprint 15 found thinly and inconsistently documented even across multiple sources. The two
genuinely open items (year-boundary, element-convention) are, by contrast, evidenced by *specific,
named, mutually-conflicting* sources — real disagreement, not merely thin documentation. **Sprint 15's
calendar-layer finding (Hồ Ngọc Đức algorithm, `DECISION-03B`) is explicitly reused here** (see
`eastern-horoscope-rules.md` §6) rather than re-researched, per this audit's own instruction to state
exactly what can safely be reused and why.

---

## 18. Unresolved domain decisions (exhaustive list, this module only)

1. **Year-boundary convention** (Lunar New Year vs. Lập Xuân) — `CONFLICT`, founder call recommended,
   informed by this audit's finding that the Bible module's own register (popular/folk, not Bát-Tự-
   precision) favors Lunar New Year.
2. **Element convention** (simple Stem-element vs. Nạp Âm) — `DOMAIN DECISION REQUIRED`, newly
   flagged this session, this audit recommends simple Stem-element.

**Both are narrow, single-table decisions** — not multi-sprint research programs. Neither requires a
domain expert to *discover* an answer (unlike several Tử Vi items); both require a founder/product
decision between two already-identified, already-sourced options. This is the single most important
structural difference from the Tử Vi register, and this audit does not overstate it: two open items
still means Sprint 17 cannot start implementation today.

---

## 19. Golden-vector plan

**Recommended minimum: 12 independently-verified vectors** (proportionate to this module's much
smaller rule surface than Tử Vi's 12–15 recommendation, but not waived — the year-boundary ambiguity
specifically demands edge-case coverage):

- 2 baseline dates, mid-lunar-year (unambiguous under both boundary conventions), covering 2
  different animal/element combinations
- 2 dates in the Lunar-New-Year-vs-Lập-Xuân gap window (the actual disagreement zone) — chosen so
  the two conventions would disagree, i.e. the specific test that makes `DECISION EH-01`
  operationally meaningful once resolved
- 1 date on the exact Lunar New Year boundary
- 1 date on the exact Lập Xuân solar-term boundary (if that convention is selected)
- 1 vector per remaining element not yet covered by the above (ensuring all 5 elements appear at
  least once across the set)
- 1 vector confirming the Five Elements Year-Energy relationship for each of the 5 relationship types
  (generates / is-generated-by / controls / is-controlled-by / same) — could be satisfied by 5
  additional targeted current-year-vs-birth-year pairs, or folded into the baseline vectors above if
  chosen deliberately
- 1 leap-lunar-year vector (confirming the reused calendar library handles a leap month correctly
  without affecting the *year*-level Stem/Branch, which does not itself depend on leap-month
  position the way Tử Vi's month-index-dependent Cục calculation does)

**Expected values must come from an independent, named reference** (a published Chinese-zodiac/
BaZi-year calculator or reference table, cross-checked against at least one Vietnamese-language
source given this product's audience) — never derived from the implementation under test, identical
to the non-negotiable rule already stated for Tử Vi and Natal Chart.

---

## 20. Deterministic engine architecture

Recommended minimum, derived from actual scope (not abstraction-for-its-own-sake, per this audit's
own instruction):

```
EasternHoroscopeCalendarAdapter   — wraps the chosen solar↔lunar library; the only place that
                                     library's API surface is touched
EasternHoroscopeStemBranchService — birth year → Can/Chi, zodiac animal, element, Yin/Yang
                                     (pure function once the calendar layer resolves the lunar year)
EasternHoroscopeYearEnergyService — birth profile + current calendar year → Year Energy relationship
                                     (Five Elements cycle lookup, pure function)
EasternHoroscopeInterpretationService — AI synthesis layer, reads only the above services' output,
                                     mirrors Natal Chart/Numerology's `interpretation/` module
EasternHoroscopeRecordService     — persistence, ownership-scoped CRUD, history
```

**Not recommended:** a separate "engine" abstraction layer beyond what's listed — this module's
actual computational surface (two lookup tables plus one calendar conversion) does not warrant the
kind of multi-file `engine/` internal structure Natal Chart's astronomy math or Tử Vi's 12-cung/
14-star placement logic genuinely needs. A single, well-tested calculation module is proportionate
to this module's actual complexity; over-abstracting it would violate this project's own stated
"don't create abstractions merely because they sound clean" discipline (this audit's own §8
instruction, and CLAUDE.md's general coding conventions).

---

## 21. Versioning strategy

Three persisted version identifiers, mirroring the `TUVI_ENGINE_VERSION`/`CALENDAR_VERSION`/
`STAR_RULESET_VERSION` pattern already specified (not yet implemented) for Tử Vi, and the
`calculationVersion`/`normalizationVersion` pattern already shipped for Numerology:

- `EASTERN_HOROSCOPE_ENGINE_VERSION` — bumps on any change to the overall Stem/Branch/Year-Energy
  calculation orchestration.
- `CALENDAR_VERSION` — bumps on any change to the solar↔lunar library/algorithm or the year-boundary
  convention (§12/§18 item 1) — **the boundary convention is itself a calendar-layer decision and
  must be versioned as such**, so a chart generated under one convention remains explainable if the
  convention is ever revisited.
- `RULESET_VERSION` — bumps on any change to the Stem/Branch/zodiac/element tables (§13–16) or the
  element-convention decision (§18 item 2).

All three must be persisted with every generated profile/theme record, per this product's established
pattern (Numerology, and the Tử Vi spec) of keeping historical results explainable even after rules
evolve.

---

## 22. Persistence recommendation (conceptual only — no Prisma changes made)

Two conceptual records, matching the Bible module's own §17 proposal and this codebase's established
Discovery-record shape:

```
EasternHoroscopeProfile   (computed once per user, cached indefinitely — Bible §17)
  - userId, birthYear, stem, branch, zodiacAnimal, element, yinYang
  - engineVersion, calendarVersion, rulesetVersion
  - createdAt

AnnualThemeEngagement     (one row per calendar-year visit, time-bound — Bible §8/§12)
  - userId, calendarYear, yearEnergyRelationship, sectionsViewed
  - interpretation metadata (kept separately/visibly distinguishable from the profile's calculated
    facts, mirroring the existing Reports/Tarot/Natal-Chart discipline)
  - createdAt
```

**Existing Natal/Numerology/Tarot pattern directly reusable:** owner-scoped `findOwned()`-style 404
handling, `findMany`/history listing, and the account-export/`deleteMany` extension pattern (§9
above) all transfer without modification to this shape.

---

## 23. AI boundary

**Should Eastern Horoscope use AI in V1? Yes** — per Bible §6/§18/§19, the "Themes" narrative layer is
explicitly the module's "genuinely generative layer," identical in architectural role to Tarot/Natal
Chart/Numerology's existing interpretation layers. **Strict boundary, restated from Bible §17/§19 and
this product's standing Module 23 §10 rule:** the AI receives only the already-computed structured
facts (Stem, Branch, zodiac animal, element, Yin/Yang, Year Energy relationship) and must never
invent, recompute, or "correct" any of them — it may only connect the fixed thematic quality to the
user's real Memory/Journal context, in thematic/quality language only (never predictive, never
luck-scored, per the Bible's hard "no luck score" rule, §11).

---

## 24. AI infrastructure reuse

Confirmed reusable verbatim (§9 above, reuse matrix): provider orchestrator, `SafetyService`,
`CostControlService` (global per-user budget — Eastern Horoscope must add to this same ceiling, never
a separate one, per the existing architecture's own stated security rationale), generation lock,
rate limiting, `AIUsage`/`ProviderLog`. **No duplicate AI infrastructure required or recommended.**

---

## 25. Premium boundary

Per Bible §1 (Business Goals) and this product's consistent, already-validated pattern (Tarot,
Numerology, Natal Chart, and the Tử Vi spec all follow the same shape — never paywall the core
deterministic result):

**FREE (recommended, consistent with existing pattern, not invented to fill this section):** the
full deterministic profile (animal sign, element, Yin/Yang, current Year Energy relationship) plus a
short per-section interpretation.
**PREMIUM (recommended):** deeper interpretation depth (mirrors the existing 700-vs-400-token pattern
already used elsewhere), richer/unlimited annual-theme history, Memory-aware personalization depth,
eventual inclusion in the Personal Destiny Report (§26 below) once both ship.

This mirrors, rather than invents, the Bible module's own framing and the already-shipped precedent
across every other Discovery system — no new monetization concept required.

---

## 26. Reports extension strategy

`docs/product/personal-destiny-report-decisions.md` (Sprint 16, founder-locked) explicitly states:
`EASTERN_HOROSCOPE_REPORT_INTEGRATION = DEFERRED` — "additive, unpopulated, not required, not shipped
(Sprint 17)." Reports' own architecture (`sourceSnapshot` as immutable JSON, built once per
generation, `natalChartId`/`numerologyReadingId` stored as plain string references rather than FKs)
is confirmed, by direct reading of `docs/architecture/personal-destiny-report.md`'s own design and
`report-snapshot.service.ts`'s actual implementation pattern, to support an **additive** extension —
adding an `easternHoroscopeSnapshot` key to the existing snapshot shape — **without requiring a schema
redesign**. This audit does not implement this; it confirms the architectural precondition Sprint 17
would need to eventually satisfy is already met by Sprint 16's existing design.

---

## 27. Companion strategy

Per Bible §7: identical read-only bridging pattern already proven for Tarot/Natal Chart/Reports — a
plain `<Link href="/companion">`, no context-passing mechanism beyond what already exists. Companion
may read structured Eastern Horoscope facts as supporting context (mirroring Natal Chart's Identity
Theme cross-reference, Bible §9) but cannot mutate them.

---

## 28. Memory strategy

Per Bible §8: the user's fixed profile (animal sign, element) stored once as Identity-type,
high-durability memory; each year's Annual Themes engagement stored as lower-durability, time-bound
memory, naturally archived once the year passes (not deleted) — mirrors the existing Memory
durability-tier pattern already shipped, no new Memory mechanism required. **Never becomes Memory:**
generic static reference/traditional-meaning text itself, and — per this module's own hard rule —
there is no lucky-number/lucky-color content to exclude in the first place, since none is ever
offered.

---

## 29. UX flow

Per Bible §3/§5/§20 and Roadmap V2: Discover → Eastern Horoscope entry → birth year (reused from
Natal Chart if already set, collected fresh only if not — Bible §14, Module 7's standing
"never upfront" rule) → deterministic profile/Year-Energy generation → Overview → progressive
disclosure into Animal Sign / Five Elements / Year Energy / life-domain sections (Relationships,
Career, Health Reflection framed as reflection only, never diagnostic) → optional AI interpretation
per section → Companion invitation → history (Annual Timeline).

---

## 30. Required birth inputs

**Birth year only** — confirmed by the Bible's own §14 error table (only "Birth year missing" is
listed; no birth-hour or birth-location error case exists for this module) and by
`eastern-horoscope-rules.md` §6's explicit finding that this module's V1 scope needs no birth time.
**Do not request birth time or location** for Eastern Horoscope, per this audit's own explicit
instruction not to import Natal Chart's/Tử Vi's heavier data requirements by default — this module's
Bible spec genuinely does not need them.

---

## 31. Analytics events (minimum, avoiding event explosion)

Recommended: `eastern_horoscope_started`, `eastern_horoscope_completed` (mirrors the existing
Tarot/Natal-Chart-equivalent funnel pair). **Recommend deferring** `eastern_horoscope_
interpret_requested`/`_completed` as separate events unless a specific funnel question requires
per-section interpretation granularity beyond what `eastern_horoscope_completed` plus the existing
Companion-continuation event already answers — consistent with the Sprint 16 audit's own precedent of
recommending against an event that duplicates existing funnel coverage
(`report_upgrade_clicked` was flagged similarly, though the founder ultimately chose to include it
there for a different, Premium-paywall-specific reason that does not apply here). No birth
year/animal-sign/element content in any event payload, matching the existing closed-shape,
no-content-leak analytics discipline.

---

## 32. Privacy findings

No new privacy category — birth **year** alone is a materially lower sensitivity input than Natal
Chart's/Tử Vi's full birth date+time+location, and should reuse the existing birth-data consent
pattern at a strictly lighter weight (year-only collection, not a new consent flow). No AI-provider
payload content beyond the already-computed structured facts + bounded Memory context, mirroring the
existing Reports/Tarot/Natal-Chart discipline.

---

## 33. Security findings

Standard Discovery-module threat surface, every mitigation already proven and reusable, no new
security subsystem required: IDOR (owner-scoped `findOwned()` pattern), mass assignment (server-
computed facts only, no user-supplied calculation input beyond birth year), prompt injection (via
Memory context — existing `SafetyService`/prompt-injection detector), stored-output XSS (render as
plain text/JSX, no `dangerouslySetInnerHTML`, matching Reports' own confirmed-clean pattern),
generation abuse (existing lock/budget/rate-limit reuse), enumeration (existing cuid ID scheme). **No
Blocker/High finding** — this audit found no code yet exists to have a defect in; this is a
forward-looking mitigation-reuse confirmation, not a code review.

---

## 34. Account-export impact

Additive: extend `AccountExportPayload.discoveries` with an `easternHoroscope` key, following the
exact precedent `account-export.service.ts` already establishes for `tarot`/`numerology`/`natalChart`
and the Sprint 16 `destinyReports` addition. Not implemented this sprint.

---

## 35. Account-deletion impact

Additive: one `deleteMany` call in the existing deletion transaction, following the exact Sprint 16
`destinyReport.deleteMany` precedent (positioned independently, no FK dependency required given the
existing `natalChartId`/`numerologyReadingId`-as-plain-string-reference precedent Reports already
established). Not implemented this sprint.

---

## 36. Unit-test plan

Calendar-boundary tests (specifically targeting the Lunar-New-Year-vs-Lập-Xuân gap window, once §12
is resolved), Stem/Branch/zodiac/element table tests (fixed-table assertions, low risk once §18 item
2 is resolved), Five-Elements-cycle relationship tests (all 5 relationship types), golden-vector
comparison tests (§19), engine-versioning tests (mirroring Numerology's existing versioning-field
test pattern).

---

## 37. E2E plan

Auth gating, ownership (IDOR), create/read/history, interpretation request/response, Premium gating
(free vs. Premium depth), AI-provider-failure handling (Mock provider honest-failure precedent,
matching Reports' own proven pattern), budget/rate-limit integration, export/delete integration —
directly modeled on `apps/api/test/reports.e2e-spec.ts`'s already-proven 17-test shape.

---

## 38. Playwright plan

One complete happy path (birth year → profile → Year Energy → interpretation → Companion bridge),
one deterministic-result-verification path (asserting the displayed animal/element matches a known
golden-vector input, guarding against a silently-wrong calculation reaching the UI), one
AI-unavailable path (static fallback content per Bible §14's own specified degrade behavior).

---

## 39. Implementation stop conditions (this module)

- **A.** Year-boundary convention (§12/§18 item 1) remains unresolved.
- **B.** Element-convention (§18 item 2) remains unresolved.
- **C.** Deterministic outputs cannot be independently verified against a named external reference
  (golden-vector gate, §19, not yet built).
- **D.** Implementation begins depending on any unresolved Tử Vi decision-register item — confirmed
  not currently at risk (§7's boundary table shows zero code/decision overlap), but restated as a
  hard rule per this audit's own brief.
- **E.** AI would be required to calculate any canonical fact (Stem, Branch, zodiac, element,
  Yin/Yang, Year Energy relationship) rather than merely narrate it — confirmed not the current
  design (§10, §23), restated as a hard rule.
- **F.** Implementation would require silently changing this module's locked scope (e.g., adding
  lucky numbers/colors, a daily cadence, or absorbing Tử Vi's birth-time requirement) — explicitly
  forbidden by the Bible's own §11/§23 "Rejected Alternatives."

---

## 40. P0 findings (would block correct implementation)

1. **Resolve the year-boundary convention** (§12/§18 item 1) — a founder call between two
   already-identified, already-sourced options (Lunar New Year, recommended; Lập Xuân, the named
   alternative), not open-ended research.
2. **Resolve the element convention** (§18 item 2) — simple Stem-element (recommended) vs. Nạp Âm — a
   newly-flagged, narrow, single-table founder/product call.

## 41. P1 findings (important, not implementation-blocking)

1. Size the additional solar-term calculation requirement if Lập Xuân is selected (§6 of
   `eastern-horoscope-rules.md`) — not free, but not researched as a blocker since the recommended
   convention (Lunar New Year) doesn't need it.
2. Confirm the Vietnamese-copy zodiac-animal naming (Mèo/Cat vs. Rabbit) explicitly in UX copy review
   — low risk, but should be an explicit choice, not an accidental inconsistency with existing
   Vietnamese-facing terminology.
3. Select and vet the specific solar↔lunar calendar library/dependency (recommend reusing Sprint 15's
   Hồ Ngọc Đức-algorithm choice rather than evaluating alternatives from scratch).

## 42. P2 findings (polish/future, not this sprint)

1. `NOTIFICATION_TYPES` does not yet anticipate an Eastern-Horoscope-specific trigger (e.g., a
   new-lunar-year theme-refresh notification) — not required for V1 per the Bible module, worth a
   one-line addition only if a future sprint adds this.
2. Eastern Horoscope → Personal Destiny Report integration (§26) — confirmed architecturally
   feasible, explicitly deferred by Sprint 16's own locked decision, not this sprint's scope.
3. Public SEO calculator content (Roadmap V2 §3 P2 item 2) — explicitly sequenced after this module
   ships, not part of this audit.

---

## 43. Roadmap impact

**This audit's findings do not require a Roadmap V2 change.** Sprint 17 remains correctly sequenced
(no dependency on Tử Vi's Sprint 15 block, confirmed independent per §7's boundary table). Sprint 18
(Tử Vi Deterministic Core) is unaffected by this audit in either direction — its own dependency
remains Sprint 15's decision register, untouched here. Sprint 19 (Tử Vi Golden Verification) and
Sprint 20+ are likewise unaffected. **Roadmap V2 §6's Sprint 17 DoD** ("`/discover` badge flips from
'coming soon' to live; golden-vector discipline applied at Natal-Chart-equivalent rigor") remains
achievable once §40's two P0 items are resolved — this audit does not find evidence the DoD language
itself needs correction, unlike Sprint 16's own Roadmap-V2-wording finding.

---

## 44. Files created/modified (this audit, exhaustive)

**Created (documentation only):**
```
docs/audit/sprint-17-pre-implementation-audit.md   (this file)
docs/domain/eastern-horoscope-rules.md
```
**Modified:** none by this audit. (Note: `docs/progress/sprint-16-final-report.md` carries one
unstaged edit from the immediately-prior Sprint 16 Release Closure session in this same
conversation — pre-existing, not touched by this audit, disclosed here for completeness per §1's
own working-tree baseline.)

**No code, Prisma schema, migration, API route, frontend page, or dependency was added, changed, or
installed.** No frozen module was touched. No `/menh-vi` route was restored. Sprint 18 was not
started.

---

## 45. Staged/commit/push status

**Not staged. Not committed. Not pushed.** No `git add`, `git commit`, or `git push` was run this
session. `git status --short` at the end of this audit shows exactly the same one pre-existing
modified file noted in §1/§44, plus these two new untracked audit files.

---

## 46. Final verdict

**SPRINT 17 AUDIT — BLOCKED: two narrow, founder-resolvable domain decisions remain open** (year-
boundary convention, §12/§18 item 1; element convention, §18 item 2). This is **not** a Sprint-15-
style "domain references incomplete, expert engagement required" block — both open items have
already-identified, already-sourced candidate answers and require a founder/product call, not further
research or a domain-expert search. Every other audited dimension (existing-code status, reusable
architecture, AI/Premium/privacy/security boundaries, Stem/Branch/zodiac/Five-Elements mechanics,
calendar-layer reuse from Sprint 15, Reports-extension feasibility) resolves cleanly with zero
blocking findings. Verdict classification against this audit's own §20 options: **B — PRODUCT
DECISION REQUIRED** (not A, because two real decisions remain open; not C, because domain references
are *not* incomplete — the mechanics are well-sourced and the two open items have clear candidate
answers, unlike Sprint 15's Tử Vi register; not D, because no architecture blocker exists; not E,
because no roadmap change is warranted).

## 47. Exact recommended next action

1. Bring §12/§18's two open decisions to the founder as a short, scoped ask — not a research
   assignment: "Lunar New Year or Lập Xuân for the year-change boundary (this audit recommends Lunar
   New Year, matching the module's own popular/folk register)?" and "simple Stem-element or Nạp Âm
   for 'the year's element' (this audit recommends simple Stem-element, matching the Bible's own
   worked example)?"
2. Once both are resolved and recorded (in an update to `docs/domain/eastern-horoscope-rules.md`,
   mirroring how Sprint 15's register would be updated), Sprint 17 implementation may begin following
   the architecture in §20–22 above.
3. Do not begin implementation before both items are explicitly resolved and recorded — consistent
   with this product's own established discipline (Sprint 15's identical restraint) of not defaulting
   a real, sourced disagreement silently.
4. Sprint 18 (Tử Vi Deterministic Core) and Sprint 15's Tử Vi block remain fully independent of this
   verdict, in either direction — no cross-sprint effect either way.

---

**SPRINT 17 AUDIT — BLOCKED: two founder-resolvable domain decisions open (year-boundary convention;
element convention) — see §40/§47. Zero architecture, security, or reusability blockers found. Do not
begin Sprint 17 implementation until both are explicitly resolved and recorded.**

---

## SPRINT 17 DOMAIN DECISION CLOSURE (addendum — decisions locked, stop conditions reassessed)

**Everything above this line is the unedited Pre-Implementation Audit.** This section records a
separate, later pass in which the founder resolved both open P0 items directly. Decision-lock detail
and sourcing live in `docs/domain/eastern-horoscope-rules.md` §0/§2/§4/§8 — this section summarizes
and reassesses against the original audit's own stop-condition/verdict framework, per the closure
brief's own instruction not to just restate the decision without re-checking downstream implications.

### 1. Year-boundary decision

**LOCKED: `EASTERN_HOROSCOPE_YEAR_BOUNDARY = LUNAR_NEW_YEAR`.** Founder reasoning recorded verbatim in
`eastern-horoscope-rules.md` §0. Resolves original audit §12/§18 item 1 from `CONFLICT` to
`RESOLVED_BY_FOUNDER_DECISION`. Matches this audit's own original recommendation (§12).

### 2. Element-system decision

**LOCKED: `EASTERN_HOROSCOPE_ELEMENT_SYSTEM = HEAVENLY_STEM_ELEMENT`.** Nạp Âm explicitly excluded
from V1 canonical, reserved as a possible separately-versioned future extension only. Resolves
original audit §18 item 2 from `DOMAIN DECISION REQUIRED` to `RESOLVED_BY_FOUNDER_DECISION`. Matches
this audit's own original recommendation (§15). **Verified non-cosmetic**: 3 of 5 spot-checked real
years (1984, 2023, 2024) show the locked convention diverging from the popular Nạp Âm-based "mệnh"
value commonly cited online (`eastern-horoscope-rules.md` §4) — confirming the decision has real
downstream consequences, not just a naming preference.

### 3. Updated rule status

All 7 items in `eastern-horoscope-rules.md`'s decision register (§7, updated) now resolve to
`RESOLVED_BY_SOURCE`, `RESOLVED_BY_FOUNDER_DECISION`, or `N/A` — **zero `CONFLICT` or `DOMAIN
DECISION REQUIRED` items remain.** One new tracking item was added (`EH-08`, golden-vector coverage,
`PARTIAL`) — not a domain-knowledge gap, but a build-and-verify gate for the implementation sprint
itself, structurally equivalent to Sprint 19's role for Tử Vi, not a Sprint 17 P0.

### 4. Remaining unresolved deterministic rules

**None at the domain-decision level.** Every deterministic fact this module needs (Stem, Branch,
zodiac animal, element, Yin/Yang, Five-Elements Year-Energy relationship, year-boundary rule) now has
either a source-corroborated table or a locked founder decision behind it. The only remaining
"unresolved" item is procedural, not domain-knowledge: `EH-08`'s golden-vector set must be re-run
against the actual built engine once implementation exists (§5 below), which is expected,
implementation-phase work, not a pre-implementation gap.

### 5. Golden-vector readiness

**17 sourced vectors recorded** (`eastern-horoscope-rules.md` §8): 5 boundary-behavior vectors
(specifically exercising the `LUNAR_NEW_YEAR` decision, including the decisive Lập-Xuân-vs-Tết
divergence case, 2015-02-10), 12 full-coverage baseline vectors (all 10 Stems, all 12 Branches/
animals, all 5 Elements, both Yin/Yang — mathematically guaranteed by 12 consecutive Tết years), and
1 leap-lunar-year edge case (2020). All independently sourced this session via live `WebSearch`
cross-checked against multiple independent references per data point; none generated by an engine
(none exists); none fabricated to fill the table. This exceeds the original audit's §19 minimum-12
recommendation. **Readiness verdict: specification-ready.** This vector set is sufficient to write
unit tests *against* once an engine is built; it is not itself a substitute for re-running the same
comparison against the actual built engine before shipping AI interpretation (the Sprint-19-equivalent
gate), which remains a future, implementation-phase requirement, not a currently-open item.

### 6. Tử Vi isolation status

**Unchanged, reconfirmed.** No Tử Vi-specific concept (Cung Mệnh, Cung Thân, Cục, 12 Tử Vi palaces,
14 chính tinh, phụ tinh, Tuần, Triệt, Tứ Hóa, Đại Hạn, Tiểu Hạn, or any star-placement logic) appears
anywhere in this closure pass's changes — both edited files (`eastern-horoscope-rules.md`,
this document) were re-scanned for any of those terms outside of explicit boundary-contrast
statements (e.g., "this is not Tử Vi's Cục") and found clean. Sprint 15/18/19's Tử Vi track remains
fully independent, untouched, and unaffected in either direction by this closure.

### 7. Architecture readiness

**Unchanged from the original audit (§9, §20–22) — ready, pending implementation.** No new
architectural finding emerged from locking these two decisions; the recommended
`CalendarAdapter`/`StemBranchService`/`YearEnergyService`/`InterpretationService`/`RecordService`
shape and the reuse matrix (AI orchestrator, cost control, generation lock, safety, rate limiting,
entitlement, export/deletion, Companion bridge) both stand as originally audited.

### 8. Security/privacy readiness

**Unchanged from the original audit (§32–33) — ready, pending implementation.** Locking a domain
convention does not alter the privacy/security surface (birth year only, no new consent category, all
mitigations reused verbatim). No new finding.

### 9. Remaining P0

**None.** Both original P0 items (§40) are now `RESOLVED_BY_FOUNDER_DECISION`.

### 10. Remaining P1

Unchanged from the original audit (§41), re-confirmed still relevant, none newly blocking:
1. Size the solar-term calculation — **now moot**: `EH-01` resolved to `LUNAR_NEW_YEAR`, so Lập
   Xuân's solar-term computation is confirmed **not needed** for V1 (downgraded from P1 to
   not-applicable).
2. Confirm Vietnamese-copy zodiac-animal naming (Mèo/Cat vs. Rabbit) in UX copy review — still open,
   still P1, still low-risk.
3. Select and vet the specific solar↔lunar calendar library/dependency (reuse Sprint 15's Hồ Ngọc Đức-
   algorithm choice) — still open, still P1, unaffected by this closure.

### 11. Files changed (this closure pass)

**Modified:** `docs/domain/eastern-horoscope-rules.md` (added §0 locked-decisions block; updated §2,
§4, §7 to reflect resolution; added §8 golden-vector specification), `docs/audit/sprint-17-pre-implementation-audit.md`
(this addendum). **No other file touched.** No code, Prisma, migration, API route, frontend page, or
dependency was added, changed, or installed. No frozen module touched. `/menh-vi` not restored.
Sprint 18 not started.

### 12. Git status

```
git status --short (end of this closure pass):
 M docs/progress/sprint-16-final-report.md   (pre-existing, from the prior Sprint 16 closure session — untouched by this pass)
 M docs/audit/sprint-17-pre-implementation-audit.md   (this addendum)
 M docs/domain/eastern-horoscope-rules.md   (decisions locked, golden vectors added)
```
Not staged. Not committed. Not pushed. `git diff --check` clean, no merge/rebase/cherry-pick state.

### 13. Final implementation-readiness verdict

Every item this closure pass could reassess resolves cleanly: both former P0s are genuinely closed
with recorded founder decisions and concrete supporting evidence (not just a restated preference);
the domain-decision register has zero remaining `CONFLICT`/`DOMAIN DECISION REQUIRED` rows; a
17-vector, independently-sourced golden-vector specification exists and exceeds the original target;
architecture, security, privacy, and Tử Vi isolation all remain clean on reassessment. The only
open item (`EH-08`, re-running golden vectors against the actual built engine) is expected
implementation-phase work, not a pre-implementation gate — structurally identical to how Natal
Chart's and Tarot's own golden-vector suites were finalized *during*, not *before*, their
implementation sprints.

**SPRINT 17 DOMAIN DECISIONS LOCKED — READY FOR IMPLEMENTATION**
