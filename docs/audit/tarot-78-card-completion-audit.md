# Tarot 78-Card V1 Completion — Audit (2026-08-22)

Response to the "Tarot 78-Card V1 Full Product Completion" master brief. Artwork is founder-
supplied and explicitly out of scope for this pass — this audit covers everything else.

---

## 1. Repository state recovered

```
HEAD (start) = 95714fc47064d46db7b7d1d7a03c6230a2040454
origin/master = 1eb91056496538a302c48d284fa78f73082f4929
ahead/behind = 1 / 0
working tree at start: 2 files modified (privacy/page.tsx, terms/page.tsx), 5 untracked
(privacy/page.test.tsx, terms/page.test.tsx, founder-legal-decision-sheet.md,
legal-content-completion-final-report.md) — the uncommitted Legal Content Completion pass.
```

**Preserved exactly, untouched by this pass** — verified via `git diff --stat` on those specific
paths before and after: identical (356+/45- privacy, 149+/... terms). No Legal Content file was
modified by this Tarot pass.

## 2. CURRENT_TAROT_MATRIX — what existed before this pass

A full read of `apps/api/src/tarot/**`, `apps/api/prisma/schema.prisma`'s Tarot models,
`apps/api/prisma/data/tarot-deck.ts`, `apps/web/features/tarot/**`, and the existing test suites
found a **materially complete, production-grade system already shipped** — not a stub. Verified by
reading the actual source, not assumed from a comment.

| Component | Prior state | Classification |
|---|---|---|
| Canonical deck | **Already 78 real cards** (22 Major + 14×4 Minor), a hard runtime `throw` already enforced exactly 78 at module load. Real, non-empty upright/reversed meanings and keywords for every card, English only. | **KEEP** (content), **EXTEND** (add nameVi/reflectionPrompts/topic meanings) |
| Reversals | Already fully implemented — `TarotCard.reversedKeywords`/`reversedMeaning` non-nullable on every row, `TarotReadingCard.isReversed`, interpretation service already narrates orientation correctly. | **KEEP** — `TAROT_REVERSALS_V1 = ENABLED` (already true; not a new decision) |
| Card identifiers | Stable, machine-safe slugs already in place (`major-00-the-fool`, `wands-05-five-of-wands`, exactly the shape the brief's §4 asked for) | **KEEP** |
| Spreads | Data-driven `TarotSpread` model (`positions: Json`) already existed. Three spreads seeded: `daily-draw` (1), `single-card` (1), `three-card-ppf` (3, Past/Present/Future labels). | **KEEP** as-is; new spreads (LOVE/DECISION/FIVE_CARD_DEEP) **DEFERRED** — see §11 |
| Draw engine | Deterministic, reproducible (seed + Fisher-Yates + mulberry32), draws without replacement from the real 78-card pool for every reading type, persists the full shuffled order for independent re-verification. | **KEEP** — already meets §10/§11's requirements |
| Topic/intent model | **Did not exist** — no `topic` column on `TarotReading`, no topic selection in the draw flow. | **DEFERRED** (UI/flow) / **EXTENDED** (per-card topic-meaning content, ready for future wiring) |
| AI interpretation | Reuses Companion's shared provider orchestrator (no parallel AI stack), hard rules already prevent card mutation, tier-based (FREE/PREMIUM) prompts, safety input/output checks, cost recording. Free-form narrative text, not structured JSON. | **KEEP** |
| Persistence | `TarotReading`/`TarotReadingCard`/`TarotReadingSession`/`TarotReadingHistory` — full lifecycle (archive/restore/soft-delete), append-only history log, IDOR-safe owner-scoped queries. | **KEEP** |
| Guest flow | Client-side-only random draw (Tarot/Numerology), never calls the backend — confirmed via `guest-trial-storage.ts` in the earlier competitive-gap audit, re-confirmed unchanged this pass. | **KEEP** (untouched) |
| Premium boundaries | Daily draw-count caps (Free vs Premium), Free history capped at 20 readings, unchanged. | **KEEP** (untouched — no pricing/payment code touched, per instruction) |
| Card artwork | `imageSlug` field existed but was **never resolved to a real path anywhere in the frontend** — every card always rendered the typographic fallback face, by design (documented prior decision, not an oversight). | **EXTEND** — built the missing resolver, see §9 |
| Export/deletion | `AccountDeletionService` already hard-deletes `TarotReading` (cascades cards/session/history); `AccountExportService` already includes `TarotReadingCard` rows. Neither needed a code change — new `TarotCard` columns are shared reference data, not exported per-user. | **KEEP** (verified, zero changes needed) |

## 3. Canonical 78-card deck — verified, not re-built

Confirmed via a fresh read of `apps/api/prisma/data/tarot-deck.ts` and its own runtime assertions
(now strengthened, see §4): 22 Major Arcana (0–21, The Fool through The World), 56 Minor Arcana
across Wands/Cups/Swords/Pentacles at exactly 14 each (Ace–10, Page, Knight, Queen, King). No
duplicate, no missing, no extra card. `TAROT_DECK_SIZE_V1 = 78` was already a hard invariant before
this pass (enforced by a `throw` at module load) — this pass added five more invariant checks (see
§4) rather than replacing the existing one.

## 4. Stable identifiers — unchanged, verified sound

Slugs (`major-00-the-fool`, `wands-01-ace-of-wands`, …) were already stable and machine-safe;
`imageSlug` already equals `slug` for every card. No persisted reading's card identity was ever at
risk from this pass — no slug was renamed, no card was added or removed, only new columns were
added to the same rows.

## 5. Canonical schema — extended per §5 of the brief

`TarotCard` gained: `nameVi`, `reflectionPrompts` (string array), `loveMeaning`, `careerMeaning`,
`financeMeaning`, `selfMeaning`, `deckVersion`. All additive, all backfilled with real content
immediately (not left at their migration-safety defaults) via a full reseed. `deckVersion` is
stamped `tarot-v1-78` on every row — see §14 (Historical versioning).

No duplicated card-definition source was created: `apps/api/prisma/data/tarot-deck.ts` remains the
single source of truth, consumed by the seed script, the backend mapper, and this pass's own new
deck-completeness test (imported directly, never re-typed).

## 6. Vietnamese names — added, one consistent convention

**Finding before this pass:** Tarot had **zero** Vietnamese-language card or spread names anywhere
— unlike Tử Vi/Eastern Horoscope (fully Vietnamese) or Natal Chart (English page heading + a
Vietnamese Discover-hub label, the established bilingual precedent this pass extends). This was a
real product inconsistency, not previously flagged.

**Convention chosen** (documented here, not left implicit):
- English `name`/`slug` remain the sole canonical identity (unchanged, per the brief's explicit
  instruction) — mirrors the same pattern already established for Natal Chart's own page heading.
- `nameVi` added as a bilingual display gloss, shown alongside the English name in the card detail
  dialog (`"{English name}" · "{Vietnamese name}"`).
- **Major Arcana (22):** individually authored real Vietnamese Tarot terms (e.g. "The Fool" →
  "Kẻ Khờ", "The Star" → "Ngôi Sao").
- **Minor Arcana (56):** *programmatically derived*, not hand-authored per card — one fixed
  suit-name table (`Gậy`/`Cốc`/`Kiếm`/`Tiền` for Wands/Cups/Swords/Pentacles) and one fixed
  rank-name table (`Át`/`Hai`/…/`Mười`/`Thị Vệ`/`Kỵ Sĩ`/`Hoàng Hậu`/`Vua`), composed as
  `"{rank} {suit}"`. This is deliberate: the brief explicitly warns against "Cups / Cốc / Ly"-style
  inconsistency, and a single generation function structurally cannot drift the way 56 independently
  hand-typed names could. Verified by a dedicated test (§21) that every Cups card resolves to the
  same suit term.
- Court-rank naming was chosen to avoid colliding with Major Arcana terms already in use: Minor
  Arcana "Queen"/"King" → `Hoàng Hậu`/`Vua`; Major Arcana "The Empress"/"The Emperor" →
  `Nữ Hoàng`/`Hoàng Đế` — four distinct terms, not two reused ones, so a reading never conflates a
  Major Arcana sovereign card with a Minor Arcana court card in Vietnamese.

## 7. Full meaning content — completed for all 78

Every one of the 78 cards now has: 3–6 upright keywords (unchanged, already present), a concise
upright meaning (unchanged), 2–4 reversed keywords + reversed meaning (unchanged — already present,
confirming reversals were already complete), **2–4 reflection prompts** (new, every one phrased as
a real question — enforced by both the data file's own runtime assertion and a dedicated test), and
**four topic-framed meanings** (love/career/finance/self — new). No empty placeholder text: every
field is asserted non-empty at both module-load time (in `tarot-deck.ts` itself) and in the
dedicated Jest suite (`tarot-deck-data.spec.ts`).

**Deterministic-language discipline:** every topic/reflection addition was authored as an
interpretive derivation of that same card's own already-established upright meaning — never a
separate invented reading, never phrased as a guaranteed outcome. A dedicated test asserts zero
occurrence of banned deterministic phrases ("you will definitely", "this guarantees", etc.) across
every meaning/prompt field for all 78 cards.

## 8. Reversal decision — reconfirmed, not reopened

**`TAROT_REVERSALS_V1 = ENABLED`** — this was already the shipped state before this pass (every
card already had complete reversed content, `isReversed` already persisted and already narrated by
the interpretation service). This pass did not introduce reversals; it verified them and extended
the same discipline to the five new fields. No partial-reversal risk exists — the five new fields
(nameVi, reflectionPrompts, four topic meanings) are orientation-agnostic by design (a reflection
question or a topic framing doesn't have a separate "reversed" form in this product's own existing
content model, matching how `categories` already worked identically for both orientations).

## 9. Artwork contract — built fresh this pass

**Finding:** `TarotCard.imageSlug` existed in the schema, but no frontend code ever resolved it to
an actual file path — `TarotCardVisual` always rendered its typographic fallback face, by a
documented prior decision ("No illustrated artwork exists yet — disclosed, not faked"). This meant
the "founder can add artwork without a code change" requirement was **not yet actually true**: there
was no manifest/resolver to wire a real file into.

**Fixed:** `apps/web/features/tarot/artwork.ts` — one pure function, `resolveTarotArtworkSrc()`,
mapping `(arcana, suit, imageSlug)` → the documented path. Wired into the one production call site
that renders a real drawn card (`TarotReadingView` → `TarotCardFace`). No other component needed
the wiring (confirmed by grep — only one call site existed). Full 78-file contract:
`docs/design/tarot-78-artwork-contract.md`. Founder-facing status checklist (generated from real
`TAROT_DECK` data + a real filesystem check, all 78 currently `PENDING_ARTWORK` — none marked
`READY` without a real file present): `docs/design/tarot-78-artwork-checklist.md`. Regenerate either
via `apps/api/scripts/generate-tarot-artwork-docs.ts` — never hand-edit the tables.

**Path convention chosen:** `apps/web/public/assets/tarot/cards/{major|minor/{suit}}/{imageSlug}.webp`
— follows this repo's own existing `public/assets/*` convention (used by the archived `menh-vi`
prototype) rather than the brief's illustrative `public/tarot/cards/*` example, per the brief's own
explicit permission to deviate when the repo already has a better convention.

## 10. Draw engine / RNG — verified sound, unchanged

Re-read `tarot-draw-engine.util.ts` fresh. Draws without replacement from the real 78-card pool
(`prisma.tarotCard.findMany()`, unfiltered by reading type — confirmed **all three** reading types,
including Daily Draw, already draw from the full 78-card deck, satisfying §29's "migrate Daily Tarot
to 78 cards" requirement with zero code change, since it already worked this way). No client-
authoritative card ID injection is possible — `DrawReadingDto` accepts only `type`/`question`, never
a card id. Persisted draw is stable forever (`getOne`/`history`/`archive`/`restore` never call
`drawCards()` again — verified by reading every method in `TarotRecordService`).

**RNG:** the default seed is `crypto.randomUUID()` (cryptographically strong) hashed into a fast,
non-cryptographic PRNG (mulberry32) for the actual shuffle steps — a deliberate, already-documented
tradeoff ("this engine's security property is reproducible, not unpredictable"). This is sound:
unpredictability in production comes from the crypto-random seed; the shuffle algorithm itself only
needs to be fast and deterministic given that seed, which is standard practice. Test determinism is
achieved by passing an explicit `seed` param (bypassing the crypto-random default) — the production
code path is never altered for tests. No change was needed or made.

## 11. Deliberately deferred, with justification (not silently dropped)

Per Definition of Done §50's own explicit allowance ("5-card works **or explicit V1 deferral
justified**"), and to keep this pass's diff reviewable and fully regression-tested rather than
spread thin:

- **New spread types** (`THREE_CARD_LOVE`, `THREE_CARD_DECISION`, `FIVE_CARD_DEEP`) — the existing
  `TarotReadingType` enum, `SPREAD_SLUG_BY_TYPE` mapping, daily-limit tables, and frontend spread
  picker all assume a fixed, small set of reading types wired end-to-end (backend enum → spread seed
  → service limits → frontend labels → analytics). Adding three more is a real, separable
  feature-sized change (new Prisma enum values, new seeded spreads, new limits, new UI, new
  Playwright coverage) — genuinely large enough to deserve its own focused pass with its own full
  regression run, not a same-pass addition bolted onto 78-card content completion.
- **Topic selection at the draw-flow level** — the underlying content (four topic-framed meanings
  per card) is fully built and ready to display (see `TarotCardDetailDialog`'s new optional `topic`
  prop); only the UI step of letting a user *choose* a topic before drawing is deferred, alongside
  the new spreads above.
- **Clarification card** — brief §24 explicitly permits deferring to V1.1 if schema/history
  complexity is significant; not attempted this pass, no code exists for it.
- **Structured AI output** (§21) — no existing validated structured-interpretation schema exists
  anywhere in this codebase (Tarot's own interpretation, and every other Discovery system's, is a
  single narrative text) — building one for Tarot alone would be a new, unvalidated pattern, exactly
  what §21 itself says not to do ("do not over-engineer if current architecture already has [no]
  validated schema").

None of these gaps affect the 78-card canonical completeness, meaning content, reversal policy, or
artwork-contract requirements the Definition of Done actually gates on.

## 12. Product-specific trust language — reconfirmed accurate

Deterministic-vs-AI separation (brief §Phase 7) was already correct in the existing interpretation
service's hard rules and is unchanged. Re-verified this pass: the AI interpretation prompt
(`tarot-interpretation.service.ts`) explicitly instructs "never state a prediction as a fact...
always frame it as something to consider or notice," and the new content added this pass (topic
meanings, reflection prompts) follows the identical discipline, enforced by the automated banned-
phrase test (§7 above).

## 13. Cross-surface consistency

Checked the Discover hub, Tarot's own dashboard/draw panel, and history list for any hardcoded
"22 cards" or "Major Arcana only" assumption — none found (`READING_TYPES`/`SUIT_LABELS` already
enumerate all four suits; `TarotCardFace` renders Major and Minor identically, differentiated only
by the suit icon). No stale brand references in any Tarot file (grepped fresh).

## 14. Historical versioning policy

**Decision:** `TarotCard` rows are treated as versioned, shared reference data, keyed by their
stable `id`/`slug` — not per-reading snapshots. `TarotReadingCard` already only stores `cardId` +
`position` + `positionLabel` + `isReversed` (no copy of the card's own text), matching the existing
precedent already established for `TarotSpread`'s own `positionLabel` denormalization comment
("denormalized so a reading's own history reads correctly even if the spread template's labels are
ever revised" — the *label* is snapshotted, the *card meaning text* deliberately is not, since a
card's meaning is treated as fixed reference data, not a per-reading fact).

**Policy going forward:** a future rewrite of any card's meaning/keyword/reflection text must bump
`deckVersion` for the whole deck (all 78 rows share one value per edition) rather than silently
mutating text in place — this doesn't change *identity* (no reading's cards change), but it does
mean the canonical detail view a user sees for an old reading could reflect newer wording than what
existed when they drew it. This is the same tradeoff the pre-existing architecture already made for
`positionLabel`; this pass did not change that tradeoff, only named and documented it, since no prior
doc stated it explicitly. `TAROT_SPREAD_VERSION` is not yet a stored field (no spread content changed
this pass) — defining it now would be premature; the deferred spread-expansion pass (§11) is the
right place to add it alongside the new spread types it will actually version.

## 15. Backward compatibility

No existing persisted reading was put at risk. Verified by construction, not just by test: every
change to `TarotCard` was an additive column with a safe default, immediately backfilled via
`seed-tarot.ts`'s upsert (idempotent, `update` path only touches the fields listed, no destructive
migration). No `slug`/`imageSlug`/`id` was renamed. The Tarot e2e suite's full lifecycle coverage
(archive/restore/delete, ownership, history) re-ran clean against real Postgres after the migration
— see the completion report's regression section.

## 16. Files changed this pass

See `docs/progress/tarot-78-card-completion-final-report.md` §"Files changed" for the complete,
authoritative list.
