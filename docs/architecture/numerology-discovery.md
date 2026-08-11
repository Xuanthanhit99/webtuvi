# Numerology Discovery Foundation (Sprint 8)

Product Bible Module 15's second real Discovery system. A deterministic, versioned, standard
Pythagorean numerology engine, persisted readings, and a narrow AI interpretation layer that only
ever narrates an already-real, already-calculated result. Mirrors Tarot Discovery Foundation's
(Sprint 6) architecture pattern throughout — see `docs/architecture/tarot-discovery.md`.

## Numerology convention

**Standard Pythagorean numerology**, per Module 15 §17's explicit instruction. Not Chaldean. This
is the one documented convention this product implements; nothing else is silently mixed in.

### Supported calculations

Six core numbers (five permanent + one time-bound), per Module 15 §4/§18:

| Number | Source | Durability |
|---|---|---|
| Life Path | Birth date | Permanent |
| Expression | Full birth name (every letter) | Permanent |
| Soul Urge | Full birth name (vowels only) | Permanent |
| Personality | Full birth name (consonants only) | Permanent |
| Birthday | Birth date (day-of-month component) | Permanent |
| Personal Year | Birth date + the calendar year the reading is calculated in | Time-bound, recalculated fresh each year (see "Personal Year" below) |

Personal Month is explicitly **deferred** per Module 15 §22 — not implemented this sprint.

### Reduction rule (`apps/api/src/numerology/engine/numerology-reduction.util.ts`)

One centrally shared rule, applied identically everywhere a number is reduced: repeatedly sum the
decimal digits of the current value until it is either a single digit (1-9) or a **Master Number**
(11, 22, 33), at which point reduction stops. Master Numbers are never collapsed into their reduced
single-digit equivalents (Module 15 §17/§18) — this is a single reusable utility
(`reduceToCoreNumber`), never scattered `if (value === 11 || ...)` checks.

### Life Path / Personal Year method

Two documented sub-methods exist in real-world Pythagorean numerology for date-based numbers:
digit-summing the entire date string at once, or reducing month/day/year separately first and then
reducing their sum. This product uses the **separate-then-sum** method
(`numerology-engine.ts#calculateLifePath`/`calculatePersonalYear`) — the more commonly taught
Pythagorean approach, and one that gives clearer per-component transparency steps for the "why is
my number X" UI (Phase 13) than a single combined digit-sum would.

### Name-to-number mapping (`numerology-name.util.ts`)

Standard Pythagorean A-Z → 1-9 letter table:

```
1: A J S    4: D M V    7: G P Y
2: B K T    5: E N W    8: H Q Z
3: C L U    6: F O X    9: I R
```

Vowels are exactly **A, E, I, O, U**. **Y is always treated as a consonant** — the traditional "Y is
a vowel only when it carries a syllable's vowel sound" rule is not algorithmically deterministic
without a pronunciation dictionary, so this product intentionally does not implement it. This is a
disclosed simplification, applied identically for every user (documented in the source file).

### Name normalization / transliteration (Module 15 §17's "documented, tested transliteration
approach" requirement)

1. Trim, collapse internal whitespace.
2. Map `đ`/`Đ` → `d`/`D` explicitly (this character does not decompose under Unicode NFD, unlike
   marks such as ă/â/ê/ô/ơ/ư).
3. Unicode NFD-decompose, then strip combining diacritical marks (U+0300–U+036F) — this handles
   Vietnamese and other accented Latin input.
4. Upper-case.
5. For letter-value sums, keep only A-Z characters (spaces/hyphens/apostrophes/periods carry no
   value but are preserved in the displayed normalized name).

**Known, disclosed limitation**: this is diacritic-stripping, not general transliteration. A name
in a non-Latin script (Chinese, Japanese, Cyrillic, Arabic, etc.) that NFD cannot reduce to any
Latin letters produces zero calculable letters, and the engine throws
`NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED` with an honest, actionable message rather than
silently producing a wrong or empty result. Per the sprint's explicit instruction, no OCR or
external transliteration service is used.

### Date validation (`numerology-date.util.ts`)

Accepts only `YYYY-MM-DD`. Rejects (with distinct error codes, never silently auto-corrected):

- Malformed format (`NUMEROLOGY_INVALID_DATE_FORMAT`)
- Impossible calendar dates, e.g. `2024-02-30` — JavaScript's `Date` would silently roll this into
  March 2nd; this product rejects it instead (`NUMEROLOGY_INVALID_CALENDAR_DATE`)
- Future dates (`NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED`)
- Birth years before 1900, a disclosed sanity floor, not a calendar-validity claim
  (`NUMEROLOGY_DATE_TOO_OLD`)

### Personal Year

Computed at calculation time for the calendar year the request happens in
(`result.personalYearAppliesTo`). A reading calculated in 2026 always shows "2026" as the year its
Personal Year value describes — it is never silently reinterpreted as still current in a later
year. Recalculating for a new year requires calculating a new reading (mirrors Tarot's own
"compute once, persist forever" precedent); no background job auto-refreshes an existing reading's
Personal Year value.

## Deterministic engine

`apps/api/src/numerology/engine/` — pure functions only, no I/O, no AI call, no randomness:

- `numerology-reduction.util.ts` — `reduceToCoreNumber`, Master Number rule.
- `numerology-name.util.ts` — normalization, letter-value table, vowel/consonant partitioning.
- `numerology-date.util.ts` — birth-date parsing/validation.
- `numerology-meanings.ts` — the static, versioned "Symbol Interpretation Engine" (Module 23 §10):
  fixed traditional meanings per (type, value) pair, never AI-generated, never AI-editable.
- `numerology-engine.ts` — `calculateNumerology()`, the single entry point. Every displayed core
  number originates here and is reproducible from the same normalized input (`engineVersion =
  'numerology-pythagorean-v1'`).

Every value carries full structured reduction steps (`ReductionStep[]`), never just a final number
— this is what powers the "why is my number X" expandable UI (Phase 13).

## Reproducibility / versioning

Every persisted `NumerologyReading` stores `calculationVersion` and `normalizationVersion`
independently. If either convention changes in the future, historical readings remain explainable
under the rules that actually produced them — they are never silently recalculated under new rules.
`aiProvider`/`aiModel`/`promptVersion`/`interpretedAt` similarly pin the exact AI generation that
produced a reading's interpretation.

## Data model

Additive-only, mirrors `TarotReading`/`TarotReadingCard`/`TarotReadingHistory`'s own precedent
exactly (see migration `20260811013824_numerology_discovery_foundation`):

- `NumerologyReading` — one row per calculation. `birthNameInput` (exactly as typed) and
  `normalizedBirthName` (what was actually calculated from) are both stored, satisfying the "never
  silently alter a name without showing the normalized calculation input" requirement.
  `visibility` defaults to `PRIVATE` at the DB layer; the record service explicitly sets it to
  `COMPANION_VISIBLE` at creation (the same disclosed deviation Tarot made — Module 15 treats the
  Companion bridge as every reading's intended next step, not an opt-in extra).
- `NumerologyValue` — one row per core number, `type` + `value` + `isMasterNumber` +
  `breakdown` (JSON structured steps) + `appliesToYear` (Personal Year only) + `order`.
- `NumerologyReadingHistory` — append-only lifecycle log (`CREATED`/`VIEWED`/`INTERPRETED`/
  `ARCHIVED`/`RESTORED`/`DELETED`).

No shared "Discovery reading" base table exists in this codebase (Tarot doesn't have one either) —
each Discovery system owns its own models, per existing precedent.

## AI interpretation

Reuses Companion's existing provider orchestrator and safety layer exactly — no second AI client.
`NumerologyModule` imports `CompanionModule` for `ProviderOrchestratorService`/`SafetyService` only
(the same two services `TarotModule` imports), mirroring `TarotInterpretationService`'s pipeline:

```
Deterministic engine output
  -> structured calculated values (type, value, isMasterNumber, traditional meaning)
  -> Numerology-specific system prompt (hard rules forbid inventing/adjusting/"correcting" a number)
  -> ProviderOrchestratorService.stream() (same retry/fallback chain as Companion chat)
  -> SafetyService.checkOutput()
  -> interpretation string, or null on any failure
```

A provider/safety failure never invalidates the reading — the six real calculated numbers remain
fully visible and correct; only `interpretation` stays `null`, retryable via
`POST /numerology/readings/:id/interpret`.

## Premium boundary

Per Product Bible Module 2 §8 / Module 17 §4: **all Discovery-system content, including
Numerology's core numbers, is free for every account** — content is never gated behind Premium.
This sprint's Premium differentiation mirrors Tarot's own precedent exactly:

| Capability | Free | Premium |
|---|---|---|
| Core numbers + basic explanation | Full access | Full access (unchanged) |
| Interpretation | Basic, 400 tokens, no Memory reference | Deeper, 700 tokens, ≤1 Memory reference |
| Reading history | Most recent 20 | Unlimited |
| Daily calculation ceiling | 5/day | 15/day |

The daily calculation ceiling is **not a content gate** — it exists purely as an anti-abuse/
cost-control measure (bounding AI-interpretation cost against automated "try every name variant"
abuse, an edge case the Product Bible itself acknowledges at §16). A user acting normally never
encounters it; the deterministic calculation and a basic interpretation are always available.
Enforced through the same `EntitlementService.hasPremiumAccess()` every other Premium decision in
this codebase uses — no `isPremium` shortcuts.

## Companion bridge (read-only)

`ContextBuilderService` (in `CompanionModule`) directly queries the user's most recent `ACTIVE`,
`COMPANION_VISIBLE` `NumerologyReading` (avoiding a circular module dependency the same way the
Tarot bridge does — Companion never imports `NumerologyModule`). The system prompt
(`system-prompt.ts`) states the real calculated numbers and any existing interpretation, with an
explicit instruction that Companion never calculates, recalculates, or "corrects" a number — those
happened deterministically before the conversation.

## Security / privacy

- Every reading query is `userId`-scoped; ownership checks 404 identically for "doesn't exist" and
  "belongs to someone else" (`NUMEROLOGY_READING_NOT_FOUND`).
- The daily-ceiling count is deliberately **status-agnostic** (counts `DELETED` readings too) —
  mirrors the exact security-review finding that shaped Tarot's own `assertNoDailyDrawToday`, so a
  user cannot delete-then-recalculate past the ceiling.
- No throttler guard is applied to `NumerologyController` — its abuse ceiling is enforced entirely
  at the DB-count level, so it never participates in the shared `ThrottlerModule` bucket-isolation
  bug fixed in `f8fcba1` (every named throttler bucket applies to every guarded route by default
  unless explicitly skipped).
- `birthNameInput`/`normalizedBirthName`/`birthDate` are real personal data — never logged in
  application logs (only reading ids appear in log lines); never exposed to the AI prompt beyond
  the minimal calculated-values context described above.

## Frontend

`/discover/numerology` (`apps/web/features/numerology/`) — mirrors the Tarot feature folder
structure: `api/numerology-api.ts`, `labels.ts`, `breakdown-text.ts` (plain-language rendering of
the structured breakdown JSON — Phase 13 transparency, never AI-generated explanation text),
`components/` (`numerology-dashboard.tsx` using the shared `?item=<id>` pattern, `numerology-form.tsx`,
`numerology-reading-view.tsx`, `numerology-value-card.tsx`, `numerology-history-list.tsx`,
`numerology-reading-detail.tsx`).

## Known limitations

- Non-Latin-script names (no Latin-letter reduction possible via NFD) cannot produce a name-based
  number — disclosed via `NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED`, not silently faked.
- Personal Month is not implemented (explicitly deferred by the Product Bible).
- No admin content-curation UI exists yet for the static meanings table (Module 23 §10's
  eventual target) — it is an in-code, versioned constant for this sprint, same as Tarot's card
  meanings.
