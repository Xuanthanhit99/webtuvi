# Tarot Discovery Foundation (Sprint 6)

The first real Discovery feature: a real, curated 78-card Tarot deck; a deterministic, seeded
draw engine; a persisted `TarotReading` (never recomputed); an AI interpretation layer that only
ever narrates an already-computed result; and a `/discover/tarot` frontend covering draw, reading
detail, and history. Explicitly **not** in scope: Natal Chart, Eastern Horoscope, Numerology,
Premium/Payment, Community, Notifications, Reports, BullMQ. Reflection/Insight/Review/Goal are
**frozen** — nothing under `reflection/`, `insight/`, `review/`, or `goal/` was touched.

See `docs/progress/sprint-6-progress.md` for the Phase 0 audit and disclosed scope decisions that
preceded this sprint, and `docs/audit/web-tu-vi-remediation-roadmap.md` for why Tarot-only was
chosen as this sprint's single priority.

## Relationship to prior sprints

- `Tarot*` is an entirely new, independent domain — no existing model was renamed, migrated, or
  repurposed.
- Reuse, not rebuild: the AI interpretation layer calls `CompanionModule`'s existing
  `ProviderOrchestratorService`/`SafetyService` (newly exported for this purpose — see "AI
  interpretation" below) instead of standing up a second AI client; `MemoryModule`'s existing
  `MemoryRetrievalService` supplies "at most one relevant memory," per Module 12's own rule.
- Companion gets one narrow, read-only touch: the latest `COMPANION_VISIBLE` reading's real cards
  and already-generated interpretation are surfaced as a fact block in the system prompt (see
  "Companion integration" below) — Companion never draws, re-draws, or reinterprets cards itself.

## Domain model (Phase 1/3)

```
apps/api/src/tarot/
  draw/            tarot-draw-engine.util.ts (pure) — seeded shuffle, no persistence
  deck/            TarotDeckService — read-only deck/card listing
  record/          TarotRecordService — draw, persistence, lifecycle, retry
  interpretation/  TarotInterpretationService — AI narration of an already-drawn result
  dto/             request DTOs (class-validator)
  tarot.types.ts   DrawnCardWithData / InterpretationInput
  tarot.mappers.ts toTarotCardDto / toTarotReadingDto / toTarotReadingHistoryDto
  tarot.controller.ts
  tarot.module.ts
apps/api/prisma/
  data/tarot-deck.ts   the real, static 78-card dataset (TAROT_DECK)
  seed-tarot.ts        idempotent upsert-by-slug seed for spreads + deck
```

Migration: `20260807080409_tarot_discovery` (additive only — 6 new enums, 5 new tables; `User`
gained a `tarotReadings` back-relation only).

### Enums

- **`TarotArcana`**: `MAJOR`/`MINOR`.
- **`TarotSuit`**: `WANDS`/`CUPS`/`SWORDS`/`PENTACLES` (Minor Arcana only).
- **`TarotReadingType`**: `DAILY_DRAW`/`SINGLE_CARD`/`THREE_CARD` — three types, not Module 12's
  MVP two (see sprint-6-progress.md decision #1): Daily Draw and Single Card both draw exactly one
  card via the identical engine; only the once-per-UTC-day rate limit and default framing differ.
- **`TarotReadingStatus`**: `ACTIVE`/`ARCHIVED`/`DELETED` — mirrors Journal/Goal's own reversible
  archive + soft-delete lifecycle.
- **`TarotReadingVisibility`**: `PRIVATE`/`COMPANION_VISIBLE` — see "Companion visibility default"
  below for why this deviates from Memory/Goal/Reflection's own "opt in explicitly" precedent.
- **`TarotReadingHistoryAction`**: `CREATED`/`VIEWED`/`INTERPRETED`/`ARCHIVED`/`RESTORED`/`DELETED`
  — mirrors `GoalHistory`/`MemoryAudit`'s own append-only event-log precedent.

### Models

- **`TarotCard`** — one row per real card (78 total): `slug`/`name`/`arcana`/`suit`/`number`,
  `uprightKeywords`/`uprightMeaning`/`reversedKeywords`/`reversedMeaning` (real, original text
  grounded in traditional/public-domain Tarot correspondences — never AI-generated, never a
  placeholder), `element`/`astrological` (Golden Dawn correspondences), `categories`, and
  `imageSlug` (a stable reference for a future asset pipeline — see "No card artwork" below).
- **`TarotSpread`** — a named layout (`daily-draw`, `single-card`, `three-card-ppf`) with
  `cardCount` and a `positions` JSON array of `{ order, label }`.
- **`TarotReading`** — one persisted reading: `userId`, `type`, `spreadId`, `status`,
  `visibility`, optional `question`, `interpretation` (nullable — see "AI interpretation" below).
  Computed once at `draw()` time and never recomputed; `interpretation` is the only field a later
  action (`retryInterpretation`) can change.
- **`TarotReadingCard`** — one row per drawn card: `readingId`, `cardId` (a real FK into
  `TarotCard` — the draw engine can only select from real ids, never invent one), `position`,
  `positionLabel`, `isReversed`.
- **`TarotReadingSession`** — the deterministic-draw audit record: `seed`, `algorithm`
  (`DRAW_ALGORITHM_VERSION`), and the full `shuffledCardIds` order used, making the draw
  independently reproducible after the fact.
- **`TarotReadingHistory`** — append-only lifecycle log.

## Draw engine (Phase 2)

`apps/api/src/tarot/draw/tarot-draw-engine.util.ts` — a pure function, no I/O:

- **Seeding**: `djb2`-hashes a string seed (auto-generated per draw via `crypto.randomUUID()`
  unless a caller passes one — no client-supplied seed is ever accepted over HTTP) into a 32-bit
  int, which seeds a `mulberry32` PRNG.
- **Shuffle**: Fisher–Yates over the full, stably-ordered (`orderBy: slug asc`) list of real card
  ids fetched from the database — reproducibility depends on the same seed always being shuffled
  against the same input order.
- **Draw**: takes the first `count` entries of the shuffled list; each gets an independent
  `isReversed` coin flip from the same PRNG stream (or is forced upright if `allowReversed:
  false`).
- **Guarantees enforced by test** (`tarot-draw-engine.util.spec.ts`, 11 tests): determinism (same
  seed + same input → identical output), different seeds diverge, no duplicate cards, no card
  outside the supplied pool, full-shuffle integrity, reproducibility across multiple draw sizes,
  and rejection of `count < 1` or `count > pool size`.

`TarotRecordService.draw()` is the only caller: it fetches real card ids, calls `drawCards()`,
and persists the exact result inside one `$transaction` (`TarotReading` + `TarotReadingCard[]` +
`TarotReadingSession` + a `CREATED` history row) — the deterministic result is never altered after
that point.

## Reading model & lifecycle (Phase 3)

Compute-once-persist-forever, unlike Review/Insight/Goal's compute-on-read precedent — a
`TarotReading`'s cards and `TarotReadingSession` are fixed at creation. Lifecycle
(`archive`/`restore`/`remove`) is a same-inline-guard pattern as Goal's `ALLOWED_TRANSITIONS`
discipline: `archive` only from `ACTIVE`, `restore` only from `ARCHIVED`/`DELETED`, `remove` only
when not already `DELETED`. Every reading is owner-scoped end-to-end (`findOwned()` 404s
identically for "doesn't exist" and "belongs to someone else").

### Daily Draw rate limit (and its fix)

`assertNoDailyDrawToday()` rejects a second `DAILY_DRAW` reading in the same UTC calendar day with
`TAROT_DAILY_DRAW_ALREADY_TAKEN`. This check is **deliberately status-agnostic** — it counts a
`DAILY_DRAW` row created today regardless of current `status`. An earlier draft excluded `DELETED`
rows, which let a user soft-delete today's Daily Draw and immediately redraw, defeating Module
12's explicit "no re-draw" rule; a dispatched security review caught this before any test coverage
existed, and both the fix and a regression test (delete → redraw attempt → still rejected, in both
the unit and e2e suites) are in place.

## AI interpretation (Phase 4)

`TarotInterpretationService` (`interpretation/tarot-interpretation.service.ts`) narrates an
already-persisted, already-real result — it never chooses or changes cards. Enforced structurally,
not just by prompt wording: the service only receives the drawn cards' real data (name,
upright/reversed meaning, keywords) plus at most one memory reference; it has no path to write a
`TarotReadingCard` row.

- **Reuse, not a second AI client**: `CompanionModule` previously exported nothing at all;
  `exports: [ProviderOrchestratorService, SafetyService]` was added (deliberately *not* exporting
  `ProviderRegistryService` or `MemoryContextAssembler` — the orchestrator resolves its own
  registry dependency internally), mirroring the `InsightModule`-exports-one-service precedent
  from Sprint 5B.
- **Safety**: `SafetyService.checkInput()` runs on the user's optional question before generation;
  `checkOutput()` runs on the generated text before it's ever persisted or returned.
- **Failure is non-blocking**: `interpret()` never throws — a provider failure (timeout, safety
  rejection, network error) leaves `interpretation: null`, logged as a warning. The already-real
  drawn cards are unaffected, and `POST /tarot/readings/:id/interpret` can retry later.
- **At most one memory**: `MemoryRetrievalService.recommend(userId, { limit: 1, contextText })`
  supplies zero or one `{ title, summary }` reference — Module 12's own explicit "never multiple"
  rule.
- **Prompt discipline**: `SYSTEM_PROMPT` hard-rules no card selection/changes, reflective (not
  predictive/fatalistic) language, ~120–220 words, ending in one open question.

## Backend API (Phase 5)

Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every reading route is
`userId`-scoped.

| Route | Purpose |
|---|---|
| `GET /tarot/deck` | List the 78-card deck (arcana/suit/category/search filters) |
| `GET /tarot/deck/:slug` | One card by slug |
| `POST /tarot/draw` | Draw + persist a new reading, then attempt interpretation |
| `GET /tarot/readings` | List/search the caller's own readings, paginated |
| `GET /tarot/readings/:id` | Get one reading (writes a `VIEWED` history row) |
| `GET /tarot/readings/:id/history` | Lifecycle history |
| `POST /tarot/readings/:id/interpret` | Retry interpretation when still `null` |
| `POST /tarot/readings/:id/archive` \| `/restore` | Reversible archive |
| `DELETE /tarot/readings/:id` | Soft-delete (reversible via restore) |

`DrawReadingDto` accepts only `type` (required enum) and an optional `question` (max 500 chars) —
no `seed` field is exposed; clients cannot influence the draw.

## Frontend (Phase 6)

`apps/web/features/tarot/` + `apps/web/app/(app)/discover/tarot/page.tsx`. Uses the same
`?item=<id>` "open detail in place" pattern as Memory/Insight/Review/Goal.

- `TarotDrawPanel` — reading-type selector, optional question (hidden for Daily Draw), a brief
  (700ms) "Shuffling…" pacing state before revealing the real, already-computed result from the
  server — never a client-side fake spin.
- `TarotCardFace` — no illustrated artwork exists yet (disclosed, not faked); a
  typographic/symbolic face (suit icon, name, number) with `rotate-180` for reversed cards,
  consistent with the Design Language System's "abstract, never literal fortune-teller iconography"
  rule.
- `TarotCardDetailDialog` — full upright/reversed meaning + keywords + arcana/suit/element/
  astrological badges.
- `TarotReadingView` — cards, interpretation (or a "Generate interpretation" retry action if still
  null), and status-gated lifecycle actions.
- `TarotHistoryList` / `TarotReadingDetail` / `TarotDashboard` — real past readings, detail view,
  and the `/discover/tarot` page shell.

## Companion integration (Phase 7)

`ConversationContext.latestTarotReading` — the caller's most recent `ACTIVE`,
`COMPANION_VISIBLE` reading's card names (with "(reversed)" suffix) and already-generated
interpretation text, or `null`. Added to `ContextBuilderService`'s `Promise.all` and surfaced as a
fact block in `system-prompt.ts` with an explicit instruction that Companion never draws,
re-draws, or reinterprets cards itself — it only ever references the real, already-computed result.

### Companion-visibility default (disclosed deviation)

New readings default to `visibility: COMPANION_VISIBLE` at the **application layer** (in
`draw()`'s create call), while the database column's own default remains the more conservative
`PRIVATE`. This is a deliberate deviation from Memory/Goal/Reflection's "opt in explicitly"
precedent: Module 12 treats the Companion-chat bridge as every reading's intended next step, not
an opt-in extra for sensitive content the way Memory/Goal/Reflection are.

## Security review (Phase 9)

A dispatched security-review subagent covered IDOR/ownership, draw-engine integrity (no
client-controlled seed), prompt-injection safety-check wiring, cross-user leakage in the Companion
context query, stored-XSS, mass-assignment (DTOs + global `ValidationPipe({ whitelist: true,
forbidNonWhitelisted: true })`), and CSRF coverage — all confirmed sound. The one real finding
(the Daily Draw soft-delete bypass, see above) was fixed before any test coverage existed for it.

## Deliberate scope decisions

See `docs/progress/sprint-6-progress.md` for the full disclosed list (three reading types instead
of Module 12's MVP two; no card artwork; original card-meaning text; `TarotReadingSession` as a
draw audit record, not a UI session concept; AI interpretation reuses the existing provider layer
exactly; no BullMQ — interpretation runs synchronously in the request path).
