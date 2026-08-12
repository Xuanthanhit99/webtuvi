# Natal Chart Discovery Foundation (Sprint 9)

Product Bible Module 13's third real Discovery system. A deterministic, versioned,
ephemeris-based natal chart calculation, persisted charts, and a narrow AI interpretation
layer that only ever narrates an already-real, already-calculated chart. Mirrors Numerology
Discovery Foundation's (Sprint 8, see `docs/architecture/numerology-discovery.md`) and Tarot
Discovery Foundation's (Sprint 6) architecture pattern throughout.

## Implementation matrix (Phase 1)

| Requirement | Product Bible (Module 13) | Existing code (pre-Sprint 9) | Sprint 9 |
|---|---|---|---|
| Birth date | §5 required | none | REQUIRED |
| Birth time | §5/§16 optional, explained why it matters | none | REQUIRED (optional input, chart degrades gracefully — houses/Ascendant omitted when absent) |
| Birth location | §5 required (house/timezone calc) | none | REQUIRED |
| Coordinates | §17 geocoded from location, never asked of the user directly | none | REQUIRED (server-side geocoding from a curated location dataset, Phase 8) |
| Timezone | §17 "genuinely nontrivial", historical DST-aware | none | REQUIRED (derived server-side from coordinates, historical-DST-aware) |
| Sun/Moon/planets | §17/§18 Sun..Pluto | none | REQUIRED (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto) |
| Ascendant | §4/§17 | none | REQUIRED when birth time known; OPTIONAL/omitted otherwise (§14/§16) |
| Houses | §17 named house system | none | REQUIRED when birth time known; OPTIONAL/omitted otherwise |
| Aspects | §4/§18 major aspects | none | REQUIRED (5 major aspects: conjunction, opposition, trine, square, sextile) |
| Chart wheel | §16 Phase requirement, §20 accessible equivalent required | none | REQUIRED |
| Interpretation | §6/§17/§18 tendency/potential language, reuses Companion AI | none | REQUIRED |
| History | §12/§19 | none | REQUIRED (mirrors Tarot/Numerology lifecycle) |
| Companion bridge | §7 | none | REQUIRED (read-only, no circular import) |
| Premium | §1/§17/Module 2 §8, Module 17 §4 | Tarot/Numerology precedent: core content free, interpretation depth/history gated | REQUIRED (mirrors Numerology's table exactly) |
| Identity Theme synthesis (multi-placement) | §4/§18, stricter evidentiary bar | none | DEFERRED — the mega-prompt's Phase 11 structured-sections requirement is satisfied by per-placement + overview interpretation; true cross-placement "Identity Theme" synthesis with its own evidentiary gate is a natural Sprint 9.x follow-up, not required for a correct, honest v1 |
| Identity evolution timeline / reflection-history tracking | §8/§10/§12 | none | DEFERRED — same "additive future work" treatment Numerology gave Personal Month; the six-number/chart-value core must exist and be trustworthy first |
| Transit reading, Progressions, Solar Return, Compatibility | §22 explicitly listed as future expansion | none | OUT OF SCOPE (explicitly deferred by the Bible itself) |
| Sidereal zodiac | §17 mentions Tropical/Sidereal as a library capability | none | OUT OF SCOPE — this product's chart tradition is Western/tropical (README's own framing: "eur-asian... not Chinese or Vedic"); Eastern Horoscope is Module 14's separate, still-unbuilt module. Tropical only. |

## Calculation engine decision (Phase 2)

**Dependency audit finding**: `circular-natal-horoscope-js@1.1.0` was already added to
`apps/api/package.json` and `pnpm-lock.yaml` by a prior session (commit `30cdd32`, "check AI")
but never installed into `node_modules` or wired into any code — greenfield otherwise. This
sprint completes that selection rather than re-deciding it from scratch, after independently
verifying it meets every stop-condition in the sprint brief.

**Chosen engine**: `circular-natal-horoscope-js@1.1.0` (npm, `Unlicense`/public domain,
TypeScript types included, zero paid/external API calls).

- **Astronomical basis**: wraps a JS port (`mivion`/`xErik`) of Steve Moshier's analytical
  ephemeris (the same ephemeris family used in several established open-source astronomy
  tools), plus formulas from Jean Meeus's *Astronomical Algorithms* and Michael Munkasey's
  *An Astrological House Formulary* (cited in the library's own README/sources). This is a
  real, deterministic astronomical calculation — not an approximation invented for this
  product, and not AI-generated.
- **Coverage**: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto (+
  Chiron/Sirius/lunar nodes/Lilith, unused this sprint), Ascendant, Midheaven, 7 house systems
  (Placidus, Koch, Campanus, Whole Sign, Equal House, Regiomontanus, Topocentric), configurable
  aspect set with configurable orbs, Tropical or Sidereal zodiac.
- **Timezone**: `Origin` derives the IANA timezone from latitude/longitude (`tz-lookup`) and
  resolves local-time-to-UTC using `moment-timezone`'s full historical transition tables —
  independently verified (Phase 8 below) to handle historical DST/offset changes correctly,
  satisfying §17's "genuinely nontrivial" requirement without hand-rolled timezone code.
- **Accuracy verification (golden vectors, Phase 7)**: see below — Sun ecliptic longitude at
  the four 2020 equinox/solstice instants (independently published UTC times, not derived from
  this library) matched to within 0.04°, i.e. within about 2.4 arcminutes. This is far tighter
  than astrology's own working tolerances (whole-degree sign boundaries, multi-degree aspect
  orbs) and confirms the engine is a genuine ephemeris, not a fabrication.

**Rejected alternatives**:
- **Swiss Ephemeris (`swisseph`/`sweph`)**: higher raw precision, but a native addon with a
  dual AGPL/commercial license — meaningfully higher deployment complexity (native build step)
  and licensing review burden for a precision gain that doesn't move any astrology-facing
  output (sign, house, aspect) at this product's stated accuracy bar. Not selected; documented
  here in case a future sprint's requirements change.
- **`astronomy-engine`**: a real, well-maintained, pure-TS/JS VSOP/ELP-based library — a
  reasonable alternative, but it computes raw ephemeris positions only, not astrological
  houses/aspects/sign-mapping. Adopting it would mean building the entire astrological layer
  (house-cusp formulas, aspect-orb engine, sign-mapping) from scratch in this codebase — exactly
  the "hand-written formulas merely to make tests pass" risk the sprint brief warns against.
  Rejected in favor of a library that already implements and cites its astrological formulas.
- **Paid astrology API**: rejected per the sprint brief's explicit preference for local
  deterministic calculation; no external per-request cost, no third-party outage dependency,
  no additional data-sharing of birth data.
- **Hand-written approximation**: rejected outright, per the sprint brief's non-negotiable
  "no fake astrology data" constraint.

**Engine version pin**: `circular-natal-horoscope-js@1.1.0`, recorded verbatim in every
persisted chart's `engineVersion` field (Phase 5).

## Zodiac mode (Phase 5 decision)

**Tropical.** This is this product's only Western/circular-chart Discovery system (Eastern
Horoscope, Module 14, is unbuilt and would own any sidereal/Vedic-adjacent chart tradition).
Not configurable per-user this sprint — centralized as `NATAL_CHART_ZODIAC_MODE = 'tropical'`
in `apps/api/src/natal-chart/engine/natal-chart.constants.ts`.

## House system (Phase 5 decision — Product Bible conflict/ambiguity, resolved)

Module 13 §17 says a house system must be "a specific, named system chosen and documented for
consistency, e.g., Placidus, rather than left ambiguous" — naming Placidus only as an example,
not a hard mandate. Per the sprint brief's instruction to use "the smallest safe interpretation
that does not violate existing product behavior" when the Bible doesn't fully pin a decision:
**Placidus** is chosen, because (a) it's the Bible's own named example, (b) it's the most
common default in mainstream Western astrology software, matching what a user comparing this
chart against another source would expect, and (c) the library implements it natively.
Centralized as `NATAL_CHART_HOUSE_SYSTEM = 'placidus'` alongside the zodiac constant.

**Documented limitation**: Placidus is undefined at extreme latitudes (inside the polar
circles, house cusps can fail to resolve for certain birth times). The calculator surfaces
this as a calculation failure (Phase 6/14's "chart generation failure" error state), never a
silent wrong answer — an accepted, disclosed edge case, not a blocker.

## Orb rules (Phase 6 decision)

Centralized in `natal-chart.constants.ts`, not left to the library's undocumented internal
defaults (verified via runtime introspection that the library exposes no public constant for
this — only accepts a `customOrbs` override):

```ts
export const NATAL_CHART_ASPECT_ORBS = {
  conjunction: 8,
  opposition: 8,
  trine: 8,
  square: 7,
  sextile: 6,
} as const;
```

Sourced from the commonly-cited astro-charts.com orb table (the same source the library's own
README cites for its unconfigured defaults) and restricted to Module 13 §4/§18's five **major**
aspects only — no minor aspects (quincunx, semi-sextile, quintile, septile, etc.), matching the
Bible's explicit "Only include other aspects if Product Bible requires them" instruction (it
doesn't).

## Domain model (Phase 4)

Additive-only, mirrors `NumerologyReading`/`NumerologyValue`/`NumerologyReadingHistory` exactly
(migration to be named `<timestamp>_natal_chart_discovery_foundation`):

- **`NatalChartReading`** — one row per generated chart. Stores the input snapshot
  (`birthDateInput`, `birthTimeInput` nullable, `birthTimeKnown` boolean, `birthPlaceInput` as
  typed) alongside the normalized, server-derived values actually used for calculation
  (`normalizedLatitude`, `normalizedLongitude`, `normalizedTimezone`, `normalizedPlaceLabel`) —
  same "never silently alter without showing the normalized input" precedent as Numerology's
  `birthNameInput`/`normalizedBirthName` pair. `calculationVersion`, `engineVersion`,
  `houseSystem`, `zodiacMode` pin reproducibility (Phase 5/7). `ascendantAvailable` records
  whether houses/Ascendant were computed (false when `birthTimeKnown` is false). Interpretation
  fields (`interpretation` JSON — structured sections per Phase 11 —, `aiProvider`, `aiModel`,
  `promptVersion`, `interpretedAt`) mirror Numerology's additive-interpretation precedent
  exactly: a chart is fully real and viewable before interpretation exists.
- **`NatalChartPlacement`** — one row per computed body (Sun..Pluto, one row per planet):
  `body`, `signLongitude` (0-360 absolute ecliptic degrees), `sign`, `degreeInSign`,
  `houseNumber` (nullable — null when `ascendantAvailable` is false), `retrograde` boolean.
- **`NatalChartAngle`** — Ascendant and Midheaven (0-2 rows; empty when birth time unknown):
  `kind` (ASCENDANT/MIDHEAVEN), `longitude`, `sign`, `degreeInSign`.
- **`NatalChartHouse`** — 1-12 rows (empty when birth time unknown): `houseNumber` (1-12),
  `cuspLongitude`, `sign`.
- **`NatalChartAspect`** — 0-N rows: `bodyOne`, `bodyTwo`, `aspectType`, `orb` (actual computed
  orb), `orbAllowed` (the configured max for that aspect type, Phase 6) — both persisted so a
  later orb-policy change is auditable against what was actually used at calculation time.
- **`NatalChartReadingHistory`** — append-only lifecycle log (`CREATED`/`VIEWED`/`INTERPRETED`/
  `ARCHIVED`/`RESTORED`/`DELETED`), identical shape to Numerology's.

No shared "Discovery reading" base table — consistent with Tarot/Numerology's own precedent
(each Discovery system owns its models).

**Privacy**: `birthDateInput`/`birthTimeInput`/`birthPlaceInput`/normalized coordinates are
real personal data — never written to application logs (only reading ids in log lines, same
rule as Numerology's `birthNameInput`/`birthDate`), never included in analytics events, never
sent to the AI prompt beyond the minimal structured placement/house/aspect facts needed for
interpretation (Phase 10).

## Location / timezone (Phase 8)

Independently verified via runtime script (not committed, ad hoc verification — see progress
log) that `Origin` resolves historical timezone/DST correctly:

- Hanoi, 1995-07-15 14:30 local → correctly resolved to UTC+7 (`Asia/Bangkok`/`Asia/Ho_Chi_Minh`
  both represent modern Vietnam's single UTC+7 offset; `tz-lookup` returned `Asia/Bangkok` for
  the Hanoi coordinate, which is offset-equivalent to `Asia/Ho_Chi_Minh` for all dates after
  Vietnam's 1975 unification onto UTC+7 — functionally correct for this product's purposes).
- Ho Chi Minh City, 1988-01-01 00:05 local → resolved via the full `Asia/Ho_Chi_Minh` historical
  offset-transition table (correctly UTC+7 for this date).
- New York, 2020-06-20 (DST-active date) → correctly applied EDT (UTC-4), not standard EST.

**Location input**: users search by place name (Phase 3's non-negotiable "never require raw
lat/long from normal users"); the backend resolves to `{ latitude, longitude, ianaTimezone,
displayLabel }` server-side and this is what's persisted, never a client-trusted raw
coordinate/timezone pair. Sprint 9 ships a curated static dataset (`natal-chart-locations.ts`)
covering major Vietnamese cities/provinces (Hà Nội, Hồ Chí Minh City, Đà Nẵng, Hải Phòng, Cần
Thơ, Huế, Nha Trang, ...) plus major world cities, searchable by normalized (diacritic-stripped,
same NFD approach as Numerology's name normalizer) name match. A full geocoding-API integration
is a documented future improvement (see Known Limitations), not required to satisfy "don't make
users type coordinates" for this sprint's launch surface.

## AI interpretation boundary (Phase 10/11)

Identical pipeline to Numerology (`docs/architecture/numerology-discovery.md`'s "AI
interpretation" section) — reuses `ProviderOrchestratorService`/`SafetyService` from
`CompanionModule`, no second AI client, no direct Gemini call from `NatalChartModule`.

```
Deterministic engine output
  -> structured facts only: Sun/Moon/Ascendant + 7 remaining planets (sign, degree, house),
     houses (cusp sign), major aspects (both bodies, type)
  -> Natal-Chart-specific system prompt (hard rule: never invent/adjust/"correct" a placement;
     tendency/potential language only, per Module 13 §6/§11; exactly one closing question per
     section, per §6)
  -> ProviderOrchestratorService.stream()
  -> SafetyService.checkOutput()
  -> structured interpretation (JSON sections: overview, coreIdentity, emotionalWorld,
     communication, loveAndRelationships, motivation, careerDirection, strengths,
     challenges, keyAspects — Phase 11), or null on any failure
```

A provider/safety failure never invalidates the chart — the deterministic placements/houses/
aspects remain fully visible and correct; only `interpretation` stays `null`, retryable via
`POST /natal-chart/readings/:id/interpret`.

## Companion bridge

`ContextBuilderService` queries the user's most recent `ACTIVE`, `COMPANION_VISIBLE`
`NatalChartReading` directly via Prisma (identical no-circular-import pattern as the
Tarot/Numerology bridges) — `NatalChartModule` is never imported by `CompanionModule`.

## Premium boundary

Mirrors Numerology's table exactly (Module 2 §8/Module 17 §4: all Discovery-system content,
including the full deterministic chart, is free for every account):

| Capability | Free | Premium |
|---|---|---|
| Full deterministic chart (placements, houses, aspects, wheel) | Full access | Full access (unchanged) |
| Interpretation | Basic, per-section, no Memory reference | Deeper, ≤1 Memory reference |
| Reading history | Most recent 20 | Unlimited |
| Daily chart-generation ceiling | 5/day | 15/day (anti-abuse cost control only, not a content gate — identical to Numerology's) |

Enforced through `EntitlementService.hasPremiumAccess()` — no scattered `isPremium` checks.

## Known limitations (disclosed)

- Location dataset is a curated static list, not a full geocoding API — birth places outside
  the curated set are not yet supported at launch; documented as a follow-up, not silently
  faked with a wrong coordinate.
- Cross-placement "Identity Theme" synthesis (Module 13 §4/§18's stricter-evidentiary-bar
  layer) is deferred — Sprint 9 ships per-placement and overview-level interpretation only.
- Identity-evolution timeline tracking (§8/§10/§12) is deferred.
- Placidus houses are undefined at extreme polar latitudes for certain birth times — surfaced
  as an honest calculation failure, not a silent incorrect result.
