# Insight Experience (Sprint 5A)

Insight Experience turns Insight Preparation's (Sprint 4C) existing `InsightCandidate` objects
into a user-facing dashboard: `/insights`. This sprint **does not generate new insights** — every
surface here reads, renders, filters, and paginates rows `InsightGenerationService` (Sprint 4C)
already materialized. Explicitly **not** AI: no LLM, no AI summaries, no coaching, no
recommendations, no weekly/monthly report generation, no semantic search, no embeddings, no vector
database, no autonomous agents.

See `docs/progress/sprint-5a-progress.md` for the Phase 0 audit that preceded this sprint, and
`docs/architecture/insight-preparation.md` for the generation layer this sprint is built on.

## Relationship to Insight Preparation

Insight Experience is a presentation layer, layered strictly on top of Sprint 4C:

- Every read endpoint calls `InsightGenerationService.ensureGenerated()` first (same as Sprint
  4C's own `InsightRecordService`), so a response always reflects the caller's current, already
  Reflection-Foundation-consistent candidates.
- Nothing here computes a category, priority, relationship, or evidence membership — those remain
  Sprint 4C's job. This sprint's renderer only ever *formats* fields a candidate (or its cited
  `ReflectionCandidate`/`ReflectionSourceRef` rows) already carries.
- The one schema addition, `InsightCandidate.pinned` (`Boolean @default(false)`), is a
  presentation-layer user action — not a new insight-generation input. Regeneration never reads or
  sets it; it only changes what a card looks like on `/insights`.
- The existing `/insights/internal` view (Sprint 4C's own verification surface, reachable only by
  direct URL) is untouched. `/insights` is the polished, user-facing surface this sprint adds.

### Bug fixed during this sprint's own verification

While visually verifying the dashboard against the shared demo account's real accumulated history,
a card's headline read "30 reflections connected by SUPPORTS relationships" while its own evidence
summary (computed from the same candidate's actual persisted `InsightEvidence` row count) read
"Backed by 16 reflections." Tracing it down: `InsightGenerationService.reconcileStaleCandidates()`
(Sprint 4C, Phase 8 — "an existing candidate's evidence referencing an expired Reflection Candidate
is stripped and priority/status recomputed") recomputed `category`/`window`/`ruleExplanation` via
`computeClusterResult()` but only ever persisted `status`/`priority`/`priorityFactors` from that
result — silently leaving `ruleExplanation` (and `category`/`window`) referencing the *previous,
larger* evidence set indefinitely. Fixed by persisting all of `computeClusterResult()`'s output
during reconciliation, not a subset (`insight-generation.service.ts`), with a regression test
(`insight-generation.service.spec.ts`) asserting `ruleExplanation` is recomputed once evidence
shrinks. This is a narrow bug fix within Sprint 4C's own reconciliation code, not a rewrite of it —
made because this sprint's `InsightCard.reason.headline` is the first surface that renders
`ruleExplanation` prominently to an end user, and a self-contradicting card would have undermined
this sprint's own "never fabricate, always consistent" goal.

## Domain model (Phase 1) — presentation objects

```
apps/api/src/insight/presentation/
  insight-presentation.types.ts    InsightCard / InsightEvidenceCard / InsightTimelineCard /
                                    InsightPriorityBadge / InsightReason / InsightCategoryPresentation
  insight-presentation-labels.ts   Fixed label dictionaries (mirror the frontend's own labels.ts)
  insight-renderer.ts               Phase 2 — the deterministic renderer (pure functions)
  insight-timeline.util.ts          Phase 4 — grouping (pure)
  insight-timeline-range.util.ts    Phase 4 — Today/7 days/30 days/custom range resolution (pure)
  insight-presentation.service.ts   Phase 2/3/4/5/6 — Prisma reads + calls the renderer
apps/api/src/insight/dto/
  list-insight-cards.dto.ts         Phase 6 filters
  insight-timeline.dto.ts           Phase 4 range/groupBy query
```

- **`InsightCard`**: `id`, `category`/`status` (value + fixed label), `window`/`windowStart`/
  `windowEnd`, `reason` (`InsightReason`), `priorityBadge` (`InsightPriorityBadge`),
  `evidenceCount`/`relationshipCount`, `pinned`, timestamps. The one shape every dashboard section
  renders.
- **`InsightReason`**: `headline` (always the candidate's own `ruleExplanation` — never generated
  text), `whyItMatters` (always `explainInsightPriorityFactors(candidate.priorityFactors)`, the
  *same* array Sprint 4C's own API already returns as `priorityExplanation` — never recomputed
  differently), `evidenceSummary` (a fixed template over `evidenceCount`/`relationshipCount`, e.g.
  `"Backed by 3 reflections, connected by 1 relationship."`).
- **`InsightPriorityBadge`**: `tier` (`LOW`/`MEDIUM`/`HIGH`) + `label` + the raw `priority`. Tier
  thresholds reuse this codebase's own existing constants rather than inventing new ones: 40 is the
  readiness cutoff already in `readiness/insight-readiness.util.ts`, 70 is `SINGLETON_MIN_SCORE`
  already in `clustering/insight-clustering.util.ts`.
- **`InsightEvidenceCard`**: one per real `ReflectionCandidate` the insight cites, plus that
  reflection's own resolved sources (`InsightEvidenceSourceItem[]`) — see "Evidence View" below.
- **`InsightTimelineCard`**: `InsightCard` + `day` (`YYYY-MM-DD`, from `createdAt`).

## Renderer (Phase 2)

`insight-renderer.ts` — pure functions only, no DB access, no randomness:
`priorityTierFor`/`toPriorityBadge`, `toCategoryPresentation`/`toStatusPresentation` (fixed
dictionaries), `toInsightReason`, `renderInsightCard`, `dayKey`/`renderTimelineCard`,
`hrefForSource`/`renderEvidenceSourceItem`, `renderEvidenceCard`. Every rendered field is either
copied straight off the input candidate/evidence row or built from one of these fixed templates —
verified by `insight-renderer.spec.ts` (46 assertions across all of the above, including a
determinism check: same input always produces the same output).

`InsightPresentationService` wires the renderer to Prisma: `cards()` (Phase 5/6), `timeline()`
(Phase 4), `evidence()` (Phase 3), `card()` (single-item render, for direct-link/refresh), and
`setPinned()` (pin/unpin). Every method starts with `ensureGenerated(userId)`.

## Evidence View (Phase 3)

`InsightPresentationService.evidence(userId, id)` resolves every `InsightEvidence` row down two
layers: the real `ReflectionCandidate` it cites (always linkable — `/reflections?item=id` exists
for any reflection state), then that reflection's own real `ReflectionSourceRef`s (Journal/Memory/
Activity/Companion). Link rules exactly mirror the existing `ReflectionSourceViewer` component
(Sprint 4B) so wording and linking behavior can never drift between the two surfaces:

- `JOURNAL`/`MEMORY` sources deep-link to their own real detail view (`/journal?item=id`,
  `/memory?item=id`).
- `ACTIVITY`/`COMPANION` sources have no standalone detail view in this product, so they render as
  plain, non-clickable rows — never a link to nowhere.

**Phase 8 — deleted/stale source handling.** Reflection Foundation's own
`ReflectionValidityService.revalidateForUser()` (re-run by `InsightGenerationService` before every
read) already guarantees a currently-cited, non-`EXPIRED` `ReflectionCandidate` can't be citing a
deleted Memory/Journal source. `evidence()` adds one more, defense-in-depth layer on top: it
re-checks every cited `JOURNAL`/`MEMORY` source id against the current `JournalEntry`/`Memory`
tables (scoped to the caller's own `userId`) and marks any that no longer resolve as
`available: false` — rendered with no `href` and a "(no longer available)" label instead of a dead
link, rather than trusting the upstream guarantee blindly. `ACTIVITY`/`COMPANION` sources have no
deletion pathway in this schema (documented in `reflection-foundation.md`'s own Privacy section) and
are always `available: true`. An **archived** (not deleted) Journal entry still resolves and is
still `available: true` — archiving hides an entry from its own default list, it does not remove
the record, so the evidence link continues to work exactly as `/journal?item=id` already does for
archived entries elsewhere in this product.

## Timeline (Phase 4)

`GET /insight-candidates/timeline?range=today|week|month|custom&from&to&groupBy=category|priority|topic`
(registered before `:id`, same route-ordering discipline every other controller in this codebase
documents). `resolveTimelineRange()` (pure, `insight-timeline-range.util.ts`) turns the four fixed
ranges into a concrete `[from, to]` window relative to `now` (injectable for deterministic tests);
`custom` requires both `from` and `to` from the caller, never guessed.

Grouping (`groupTimelineCards()`, pure, `insight-timeline.util.ts`) — no semantic clustering:

- `category`/`priority` group by fields the card already carries (priority groups are ordered
  `HIGH`/`MEDIUM`/`LOW`, not alphabetically, since that ordering is the meaningful one).
- `topic` groups by each candidate's *dominant evidence reflection's own* `groupKey` — a real,
  already-computed structural string (`ReflectionCandidate.groupKey`, fetched via the existing
  `evidence.reflectionCandidate` include at zero extra query cost) — never a fabricated taxonomy.
  Ties broken lexicographically for determinism.

## Dashboard (Phase 5)

`/insights` (`apps/web/features/insight/components/insight-dashboard.tsx`) — five sections plus the
shared `?item=<id>` "open detail in place" pattern every other module in this product already uses
(Memory/Journal/Reflection/the internal Insight view):

| Section | Backed by |
|---|---|
| Top insights | `GET .../cards?sort=priority` |
| Recent insights | `GET .../cards?sort=recent` |
| Timeline | `GET .../timeline` |
| Pinned | `GET .../cards?pinned=true` |
| Archived | `GET .../cards?status=ARCHIVED` |

Opening an item shows the Insight Card's Reason (headline + why it matters), Priority, and the
Evidence View, plus Pin/Unpin and Archive actions. A top-level empty state (`GET
.../statistics`, `total === 0`) replaces the section switcher entirely for a brand-new account,
matching every other module's own "honest empty state" precedent — never a fake example card.

## Filters (Phase 6)

`ListInsightCardsQueryDto` — priority (`priorityTier`: `LOW`/`MEDIUM`/`HIGH`), category, date
(`from`/`to` on `createdAt`), status, source (`JOURNAL`/`MEMORY`/`ACTIVITY`/`COMPANION` — only
insights with >= 1 evidence reflection citing that source type), plus `pinned` and `sort`. Every
filter maps directly to a validated (`class-validator`) query param and a matching Prisma `where`
clause — no semantic filtering, no fuzzy matching anywhere.

## API

`InsightController` (`@Controller('insight-candidates')`) — Sprint 4C's original four routes are
unchanged; this sprint adds:

| Method | Path | Purpose |
|---|---|---|
| GET | `/insight-candidates/cards` | Phase 5/6 — filterable `InsightCard` list |
| GET | `/insight-candidates/timeline` | Phase 4 — grouped timeline |
| GET | `/insight-candidates/:id/card` | a single rendered `InsightCard` (direct-link/refresh) |
| GET | `/insight-candidates/:id/evidence` | Phase 3 — Evidence View |
| POST | `/insight-candidates/:id/pin` | pin (display-only) |
| POST | `/insight-candidates/:id/unpin` | unpin |

`cards`/`timeline` are registered before `:id`, same reasoning every other controller in this
codebase documents. Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`
(registered globally via `APP_GUARD` in `CsrfModule` — applies to the two new `POST` routes
automatically); every underlying query is `userId`-scoped, and `card()`/`evidence()`/`setPinned()`
404 identically for "doesn't exist" and "belongs to someone else" (`findUnique` + an explicit
`candidate.userId !== userId` check before any data is returned) — the same pattern
`InsightRecordService.findOwned()` already established.

## Frontend (Phase 7)

`apps/web/features/insight/`:

- `components/insight-dashboard.tsx` — `/insights`'s shell.
- `components/insight-card.tsx` — the `InsightCard` presentation component; renders only fields
  already on `InsightCardDto`, with an optional pin toggle.
- `components/insight-card-list.tsx` — the shared Top/Recent/Pinned/Archived list surface: a fixed
  `baseFilters` prop plus the Phase 6 filter bar, loading/empty/error states, "Load more" pagination.
- `components/insight-filter-bar.tsx` — Phase 6 controls.
- `components/insight-timeline.tsx` — Phase 4 range/group-by controls + grouped sections.
- `components/insight-card-detail.tsx` — Reason/Why it matters/Evidence + Pin/Archive actions.
- `components/insight-evidence-view.tsx` — Phase 3, mirrors `ReflectionSourceViewer`'s link rules.

Not linked from the fixed five-item global nav (`nav-items.ts`'s own documented Product Bible
constraint) — reachable from Settings ("View my insights"), the same precedent Reflection (Sprint
4B) already established for the same reason.

## Security (Phase 8)

- **Ownership**: every new endpoint is `userId`-scoped, either via a Prisma `where: { userId, ... }`
  (`cards`/`timeline`) or an explicit post-fetch ownership check that 404s identically for
  nonexistent vs. cross-user (`card`/`evidence`/`setPinned`) — verified in
  `insight-presentation.service.spec.ts`.
- **Deleted evidence**: `evidence()` re-verifies every cited `JOURNAL`/`MEMORY` source against the
  current, `userId`-scoped `JournalEntry`/`Memory` tables and renders it as unavailable (no href)
  rather than a dead link if it no longer resolves — see "Evidence View" above.
- **Archived evidence**: an archived (not deleted) source stays `available: true` with a working
  link — archiving doesn't remove the record.
- **Cross-user isolation**: the evidence-availability lookups themselves are `userId`-scoped, so
  even a hypothetical cross-module data inconsistency couldn't leak another user's Journal/Memory
  existence through the `available` flag.
- **Stale links**: `hrefForSource()` only ever emits a link for a source flagged `available`; an
  unavailable source's `href` is always `null`, both in the renderer's type and enforced by
  `renderEvidenceSourceItem()`'s own logic (`insight-renderer.spec.ts` covers this directly).
- **CSRF**: `POST .../pin` and `POST .../unpin` sit behind the same project-wide `CsrfGuard` as
  every other mutating route in this codebase (globally registered, not a per-controller opt-in).

## Tests (Phase 9)

- **Backend** (53 new): `insight-renderer.spec.ts` (24), `insight-timeline.util.spec.ts` (7),
  `insight-timeline-range.util.spec.ts` (6), `insight-presentation.service.spec.ts` (18 — filters,
  ownership, pin idempotency, evidence availability including the deleted/archived/
  ACTIVITY-COMPANION cases), plus one regression test added to Sprint 4C's own
  `insight-generation.service.spec.ts` for the reconciliation bug fixed above. Full backend suite:
  65 suites / 543 tests passing.
- **Frontend** (27 new): `insight-card.test.tsx`, `insight-timeline.test.tsx`,
  `insight-evidence-view.test.tsx` (including the deleted-source and ACTIVITY/COMPANION
  non-clickable-row cases), `insight-dashboard.test.tsx` (empty state, section switching, filter
  application, `?item=id` deep link). Full frontend suite: 40 suites / 196 tests passing.
- **Playwright** (`flow-17-insight-experience.spec.ts`): seeds the same deterministic
  two-journal-theme -> `REPEATED_JOURNAL_THEME` -> `SUPPORTS` `InsightCandidate` pattern flow-16
  already establishes, then drives the real `/insights` UI end-to-end — dashboard sections, opening
  a card's detail view (Reason/Why it matters/Evidence), the Evidence View's real journal deep link,
  pin -> Pinned section, Timeline grouping, category filtering, and archive -> Archived section (looked
  up by real id via the API, not fragile UI text matching, since the shared demo account accumulates
  real history across every sprint's own Playwright specs — the same discipline flow-16 already
  documents). Passing against live Postgres/Redis/the real dev servers.

## Observability

Reuses `InsightPresentationService`'s own `Logger('InsightPresentation')` for pin/unpin only
(structured, content-free — `id` and pinned/unpinned, never any rendered text). Reads log nothing
new; `ensureGenerated()`'s own Sprint 4C logging already covers generation.

## Known limitations (disclosed, not hidden)

- **`evidence()` is unpaginated** — matches Sprint 4C's own `getOne()` precedent (a candidate's
  evidence array is already bounded by the same 200-reflection/180-day generation bounds
  `insight-preparation.md` discloses); not a new risk this sprint introduces.
- **Topic grouping is a dominant-groupKey heuristic**, not a weighted one — a candidate whose
  evidence spans several distinct `groupKey`s groups under whichever one is most frequent among its
  evidence, ties broken lexicographically. Disclosed, not hidden, mirrors Sprint 4C's own
  "clustering is a plain connected-components graph, not a weighted one" limitation.
- **No custom-range picker beyond a plain `from`/`to` pair** — the frontend Timeline control offers
  the three fixed presets plus two date inputs for `custom`; no calendar/range-picker UI component
  exists in this codebase to reuse, and building one was out of scope for a presentation-layer
  sprint over already-existing data.
