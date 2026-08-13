# Natal Chart Discovery Foundation (Sprint 9)

Product Bible Module 13's third real Discovery system. A deterministic, ephemeris-based birth
chart, persisted once, explored through progressive-disclosure sections and a chart wheel, and
narrated (never calculated) by the existing Gemini provider chain. Mirrors Tarot Discovery
Foundation (Sprint 6) and Numerology Discovery Foundation (Sprint 8)'s architecture pattern
throughout — see `docs/architecture/tarot-discovery.md` / `docs/architecture/numerology-discovery.md`.

This is a **Foundation** sprint: it implements Module 13's deterministic core, persistence, API,
AI-interpretation boundary, Companion bridge, Discovery entry, and a real (not admin-dashboard) UI.
It deliberately does not implement Module 13's deeper, longer-horizon ambitions — see "Explicitly
deferred" below — exactly as Sprint 8 deferred Personal Month/Insight-hookup for Numerology.

## Calculation engine decision

**`circular-natal-horoscope-js@1.1.0`** (Unlicense — public domain), audited and selected per the
sprint's Phase 2 requirement:

- Already declared in `apps/api/package.json` and resolved in `pnpm-lock.yaml` before this sprint
  started, but not installed in `node_modules` and not imported anywhere — pre-staged by an
  earlier session in anticipation of this work, never wired up. Materializing it required only
  `pnpm install`, not a new-dependency decision.
- Computes Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, the lunar
  nodes, and Lilith; Ascendant and Midheaven; house cusps under 7 house systems (Placidus, Koch,
  Topocentric, Regiomontanus, Campanus, Whole Sign, Equal House); and a configurable-orb aspect
  list.
- Its `Origin` class derives the IANA timezone and the correct historical UTC offset (including
  historical DST) directly from latitude/longitude via its own bundled `tz-lookup` +
  `moment-timezone` dependencies — this is what satisfies the "timezone must account for
  historical offset" requirement without any extra code.
- Deterministic, server-side, reproducible, no network call, no paid API, MIT-compatible
  (Unlicense) license.

No new astrology dependency was introduced. `tz-lookup` is additionally declared as an explicit
direct dependency (it was already transitive via `circular-natal-horoscope-js`) so
`NatalChartCalculatorService` can resolve and persist the IANA timezone identifier directly,
independent of the library's internal `Origin` construction.

Gemini never touches this calculation — see "AI interpretation boundary" below.

## Zodiac mode, house system, orbs (Phase 5 versioning)

Centralized in `apps/api/src/natal-chart/engine/natal-chart-constants.ts`, never scattered:

- **Zodiac mode: Tropical.** The Western-astrology default and the mode implied throughout Module
  13's own text (the "eur-asian... circular charts" framing, and its explicit distinction from the
  separate, unrelated future "Eastern Horoscope" module). Sidereal is supported by the underlying
  library but not exposed this sprint.
- **House system: Placidus.** Module 13 §17 does not mandate a system but gives Placidus as its
  own example ("a specific, *named* system... e.g., Placidus"); Placidus is also the de facto
  default in most Western astrology software, making it the least surprising choice for a user
  comparing this chart against another source. Documented, single, centralized constant — never
  chosen per-request.
  - **Known limitation, and a correction to this decision's original assumption**: Placidus is
    mathematically undefined at extreme latitudes (inside the polar circles, where the local
    horizon never crosses some house cusps' diurnal arc at all). During the engine spike,
    `circular-natal-horoscope-js@1.1.0` was probed at latitudes from 66.5° up to and including
    the exact pole (90°), across a full day's worth of times — it never threw and never produced
    NaN/Infinity; it always returns *some* finite number, which is not necessarily astronomically
    meaningful at those latitudes. Since the library gives no detectable failure signal, houses/
    Ascendant/Midheaven are instead gated by an explicit, disclosed latitude threshold
    (`NATAL_CHART_HOUSE_UNAVAILABLE_LATITUDE_THRESHOLD = 66.5`, the polar circles — the same
    boundary real astrology software commonly uses to disable/warn on Placidus) rather than a
    library-error check. Below that threshold, houses are always available (birth-time permitting).
    Reuses the exact same "unavailable, clearly labeled, never fabricated" UX Module 13 §14/§16
    already mandates for unknown birth time — planets/signs remain fully available regardless.
- **Aspects: major only** — Conjunction (0°), Opposition (180°), Trine (120°), Square (90°),
  Sextile (60°) — using the library's own documented default orb degrees, read once into the
  constants file and never overridden per-request. Minor aspects (quincunx, semi-square, etc.) are
  not computed this sprint.
- **`calculationVersion`**: `'natal-chart-circular-horoscope-v1'`, persisted on every
  `NatalChart` row alongside the library version, house system, and zodiac mode actually used —
  if any of these ever changes, historical charts remain explainable under the rules that produced
  them, never silently recalculated (same reproducibility discipline as Numerology's
  `calculationVersion`/`normalizationVersion`).

## Birth input & unknown-time handling

- `birthDate` required; `birthTime` optional (`birthTimeKnown: false` when omitted).
- Without a known birth time, the calculator still runs (planets/signs are time-of-day-independent
  enough for sign-level accuracy at typical resolution) but Ascendant/houses are marked
  unavailable rather than computed from a guessed time — never a silently wrong Ascendant.
- Birth date/time/place are personal data: never included in application log lines (only chart
  ids appear in logs), never sent to the AI prompt beyond the minimal structured facts required
  for interpretation (see below).

## Geocoding architecture

No geocoding capability existed anywhere in the repo before this sprint. Decision (user-directed,
recorded here per the sprint's "document the product decision" requirement):

**Live Nominatim (OpenStreetMap)**, server-side only, behind a `GeocodingProvider` interface
(`apps/api/src/geocoding/geocoding-provider.interface.ts`) so a different provider can replace it
later without touching callers.

Flow:

1. User types a birth-place free-text query and explicitly submits a search (no per-keystroke
   autocomplete against the public API — Nominatim's usage policy and this app's own cost/latency
   discipline both rule that out).
2. `GET /geocoding/search?q=` calls Nominatim server-side with an identifying `User-Agent` header
   per its usage policy, and a request timeout.
3. Each result candidate (display name, latitude, longitude) is cached in Redis
   (`NominatimGeocodingProvider` via the existing `RedisService`) keyed by an opaque, random,
   short-lived token (TTL ~15 minutes) and returned to the client as `{ token, label, ... }` —
   **never raw lat/long** in the response the client is expected to echo back.
4. The user picks one candidate from the results.
5. Chart creation (`POST /natal-charts`) accepts the **token**, not client-supplied coordinates.
   The server re-resolves the cached candidate itself. A missing/expired token fails with a
   truthful "search again" error — coordinates are never fabricated or guessed from a stale/absent
   token.
6. Timezone is not resolved by the geocoding step at all — it's derived deterministically from the
   confirmed coordinates by the calculation engine itself (`Origin`, via `tz-lookup`/
   `moment-timezone`), and the resulting IANA identifier is persisted on the chart for display and
   reproducibility.

This satisfies "never trust client-supplied coordinates/timezone when server-side normalization
exists" structurally (the client physically cannot supply coordinates — only a token referencing a
server-cached search result), while keeping the UX to city names, not manual lat/long entry.

**Documented limitation**: the public Nominatim instance is rate-limited and appropriate for
MVP/low-volume use. Production-scale traffic would need a hosted or self-hosted Nominatim (or a
paid provider) — noted here, not solved this sprint.

## Domain model (additive)

Mirrors `NumerologyReading`/`NumerologyValue`/`NumerologyReadingHistory`'s structure — migration
`<timestamp>_natal_chart_discovery_foundation`:

- `NatalChart` — one row per calculated chart. Birth input snapshot (`birthDate`, `birthTime`
  nullable, `birthTimeKnown`), resolved location (`birthPlaceLabel`, `latitude`, `longitude`,
  `timezone`), `zodiacMode`, `houseSystem`, `housesAvailable`, `calculationVersion`/
  `engineVersion`, `status` (`ACTIVE`/`ARCHIVED`/`DELETED`), `visibility` (`PRIVATE`/
  `COMPANION_VISIBLE`, defaults to `COMPANION_VISIBLE` at the application layer — same disclosed
  deviation from the DB column's conservative default that Tarot/Numerology both make, since every
  chart is meant to open a Companion conversation), `interpretation` (`Json?`, the structured
  section object — see below), `aiProvider`/`aiModel`/`promptVersion`/`interpretedAt`, lifecycle
  timestamps.
- `NatalPlacement` — one row per computed classical planet (Sun through Pluto; no lunar nodes or
  Lilith — out of scope this sprint, see "Explicitly deferred"): `body`, absolute `longitude`,
  `sign`, `degreeInSign`, `house` (nullable when houses are unavailable), `retrograde`.
- `NatalHouse` — one row per house (1–12, only present when `housesAvailable`): `number`,
  `cuspLongitude`, `sign`.
- `NatalAspect` — one row per detected major aspect: `pointA`, `pointB`, `type`, `orb`, `angle`.
- `NatalChartHistory` — append-only lifecycle log, same 6-action enum shape as
  `NumerologyReadingHistory` (`CREATED`/`VIEWED`/`INTERPRETED`/`ARCHIVED`/`RESTORED`/`DELETED`).

No shared "Discovery reading" base table (same precedent as Tarot/Numerology — each system owns
its own models).

## Fixed reference meanings (Module 13 §18's "Symbol Interpretation Engine")

Composed, not exhaustively hand-authored: a small curated table of planet meanings (10), sign
qualities (12), house domains (12), and aspect-type meanings (5) in
`apps/api/src/natal-chart/engine/natal-chart-meanings.ts`, composed at render time into e.g.
"Mercury (communication, thinking) in Gemini (adaptable, curious) — 3rd house (communication,
learning)". This mirrors how real astrology reference texts compose meaning from these same
building blocks, and keeps curated content bounded — unlike Tarot's 78 unique cards or
Numerology's per-number tables, planet-in-sign-in-house doesn't need ~1,000+ unique hand-written
entries to be genuinely "fixed traditional meaning," not AI-generated.

## AI interpretation boundary

Reuses Companion's existing provider orchestrator and safety layer exactly — no second AI client,
same as Tarot/Numerology. `NatalChartModule` imports `CompanionModule` for
`ProviderOrchestratorService`/`SafetyService` only.

```
Deterministic engine output (placements, houses, aspects — already persisted, immutable)
  -> structured FACTS block (planet/sign/degree/house, Ascendant, key aspects, fixed meanings)
  -> Natal-Chart-specific system prompt: tendency/potential language only, exactly one
     reflective question per section, forbids inventing/adjusting any placement or fact,
     forbids sign-based stereotype language (Module 13 §2/§6/§11)
  -> ProviderOrchestratorService.stream() (same retry/fallback chain as Companion chat)
  -> SafetyService.checkOutput()
  -> structured interpretation object (see below), or null on any failure
```

**Interpretation shape**: one call returns fixed JSON sections — `overview`, `corePersonality`,
`emotionalWorld`, `communication`, `loveAndRelationships`, `motivation`, `careerDirection`,
`strengths`, `challenges`, `keyAspects` — rather than Numerology's single prose blob. This is
required by the sprint brief's Phase 11 (frontend must render sections independently) and is still
fully within the existing AI boundary (Module 13's own `GET /interpret/:section` streaming sketch
is explicitly "illustrative, not binding," §17). One call per chart is enough for a Foundation
sprint; per-section streaming is deferred.

A provider/safety failure never invalidates the chart — every calculated placement, house, and
aspect remains fully visible and correct; only `interpretation` stays `null`, retryable via
`POST /natal-charts/:id/interpret`. The FACTS block sent to Gemini is asserted (in tests) to be
byte-identical before and after the call — Gemini's response can never mutate stored chart data,
structurally (the interpretation write path only ever writes to the `interpretation` JSON column,
never to `NatalPlacement`/`NatalHouse`/`NatalAspect`).

## Premium boundary

Per Product Bible Module 2 §8 / Module 17 §4: all Discovery-system content, including every
calculated placement/house/aspect, is free for every account — never gated. Mirrors Tarot/
Numerology's exact differentiation shape via `EntitlementService.hasPremiumAccess()`, no scattered
`isPremium` checks:

| Capability | Free | Premium |
|---|---|---|
| Full calculated chart (placements/houses/aspects) | Full access | Full access (unchanged) |
| Interpretation | Basic depth, no Memory reference | Deeper, ≤1 Memory reference |
| Chart history | Most recent 20 | Unlimited |
| Daily create/recalculate ceiling | 5/day | 15/day |

The daily ceiling is anti-abuse/cost-control only (bounding AI-interpretation cost), counted
status-agnostically (includes `DELETED` charts) — the same disclosed precedent Numerology's
`assertWithinDailyLimit` established after Tarot's own security-review finding, preventing
delete-then-recalculate abuse of the ceiling.

**Deviation from Module 13's own retention framing, noted explicitly**: §1/§12 frame Natal Chart
as a low-frequency, "depth over frequency" artifact where repeated *viewing* is never rate-limited
— this sprint's daily ceiling applies only to *creating/recalculating* a chart (an AI-cost event),
never to viewing an already-calculated one, which stays unlimited for both tiers. This is the
smallest-safe interpretation: it satisfies both Module 13's "don't rate-limit revisiting" principle
and the same cost-control precedent every other Discovery system in this codebase already applies
to its creation/calculation event specifically.

## Companion bridge (read-only)

`ContextBuilderService` (in `CompanionModule`) gains one more `Promise.all` entry querying the
user's most recent `ACTIVE`, `COMPANION_VISIBLE` `NatalChart` (+ its placements), exactly
mirroring the existing Tarot/Numerology bridge entries — `CompanionModule` never imports
`NatalChartModule` (avoiding circularity the same way). `ConversationContext`/`system-prompt.ts`
gain a `latestNatalChart` field stating the real calculated Big Three (Sun/Moon/Ascendant) and any
existing interpretation, with an explicit instruction that Companion never calculates,
recalculates, or "corrects" a placement.

## Security / privacy

- Every chart query is `userId`-scoped; ownership checks 404 identically for "doesn't exist" and
  "belongs to someone else" (`NATAL_CHART_NOT_FOUND`), same as Numerology.
- No throttler guard on `NatalChartController` — abuse ceiling enforced at the DB-count level, same
  reasoning as Numerology (sidesteps the shared `ThrottlerModule` bucket-isolation issue fixed in
  `f8fcba1`).
- `birthDate`/`birthTime`/`birthPlaceLabel`/coordinates are real personal data — never logged,
  never sent to the AI prompt beyond the minimal structured FACTS block.
- Geocoding search queries are free text sent to a third-party service (Nominatim) — bounded
  length, never logged with user-identifying context beyond what Nominatim itself receives (which
  is inherent to using a third-party geocoder at all, disclosed here).
- Prompt-injection surface: `birthPlaceLabel` (Nominatim-sourced, not fully trusted) flows into the
  interpretation FACTS block as a labeled fact, never as an instruction — the system prompt treats
  all FACTS-block content as inert data, same discipline as Tarot/Numerology's card names/number
  values.

## Explicitly deferred

Insight Engine hookup, Natal Timeline / Identity-evolution tracking (Module 13 §12), Journal
integration (frozen module), automatic Identity-type Memory-node creation from chart placements
(chart content instead rides the standard significance-based Memory pipeline from the resulting
Companion conversation, same as Tarot/Numerology), per-section streamed interpretation,
Transit/Progressions/Solar Return/Relationship-Compatibility/Family Charts/Voice Interpretation
(all explicitly out-of-scope per Module 13 §22), minor aspects, lunar nodes and Lilith (available
in the underlying library but not part of any documented product decision this sprint), sidereal
zodiac option, approximate/ranged birth time input (Module 13 §16's "midpoint of a time range"
suggestion — the birth-time field this sprint accepts only an exact `HH:mm` or full omission, not
a range; identified during release closure as a real, previously-undisclosed gap, now recorded
here), and in-place birth-data correction/regeneration of an existing chart (creating a new chart
is supported; editing one's inputs and recalculating in place is deferred to a follow-up sprint).

## Frontend

`/discover/natal-chart` (`apps/web/features/natal-chart/`) — mirrors the Numerology feature folder
structure: `api/natal-chart-api.ts`, `labels.ts`, `components/` (`natal-chart-dashboard.tsx` using
the shared `?item=<id>` pattern, `birth-input-form.tsx` with the explicit-search geocoding flow
above, `natal-chart-wheel.tsx` — hand-built inline SVG plus a fully accessible text/table
equivalent per Module 13 §20, `big-three-summary.tsx`, `planet-list.tsx`, `house-list.tsx`,
`aspect-list.tsx`, `interpretation-sections.tsx`, `natal-chart-history-list.tsx`,
`natal-chart-detail.tsx`).

## Golden-vector verification

See test suite for exact values/tolerances. Strategy: Case A/B use ordinary, well-documented
modern birth data cross-checked against multiple independent published sources; Case C uses a
publicly published equinox/solstice UTC instant (an astronomically well-defined fact independent
of this or any astrology library — at that instant the Sun's tropical ecliptic longitude is
exactly 0° of a cardinal sign) as a library-independent boundary check; Case D exercises a
birth-time-sensitive Ascendant/house case. Any discrepancy beyond the documented tolerance is
recorded, never silently loosened to force a passing test.

## Known limitations

- Placidus houses/Ascendant are unavailable at extreme (polar-circle) latitudes — disclosed, not
  faked (see "Zodiac mode, house system, orbs" above).
- Public Nominatim geocoding is rate-limited and not guaranteed available at production scale —
  documented MVP tradeoff.
- No in-place birth-data correction/chart regeneration this sprint (Module 13 §16's "fully
  editable in Settings/Profile" requirement is deferred).
- No admin content-curation UI for the static meanings table — an in-code, versioned constant this
  sprint, same as Tarot/Numerology's own meanings tables.
