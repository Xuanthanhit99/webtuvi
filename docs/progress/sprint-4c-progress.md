# Sprint 4C — Insight Preparation Engine: Progress / Audit

## Phase 0 audit

### Reflection Foundation (Sprint 4B, base for this sprint)

`ReflectionCandidate` (`apps/api/prisma/schema.prisma`): `id`, `userId`, `category`
(`ReflectionCategory`: `GOAL`/`TOPIC`/`JOURNAL`/`WELLBEING`/`ALIGNMENT`/`MISMATCH`/`INACTIVITY`),
`trigger` (`ReflectionTrigger`, 9 values — one per deterministic rule), `state`
(`ReflectionState`: `NEW`/`READY`/`DISMISSED`/`ARCHIVED`/`EXPIRED`), `window`/`windowStart`/
`windowEnd`, `reason` (plain-language), `score` (0-100, documented weights)/`scoreFactors`,
`groupKey` (deterministic grouping string), `visibility`, `pinned`, `dedupeKey` (unique per user —
makes regeneration idempotent, never resurrects a resolved candidate), `resolvedAt`, `expiredAt`.
`ReflectionSourceRef` cites the real `JOURNAL`/`MEMORY`/`ACTIVITY`/`COMPANION` records a candidate
is built from (`sourceType`/`sourceId`/`sourceTimestamp`, plain references).

Generation is compute-on-read (`ReflectionGenerationService.ensureGenerated()`, no background job)
and privacy-aware (`ReflectionValidityService.revalidateForUser()` expires a candidate whose cited
Memory/Journal source was deleted or whose Memory consent was revoked — see
`docs/architecture/reflection-foundation.md`).

**This is the entire input surface for Sprint 4C.** The mission is explicit: "Prepare deterministic
Insight Candidates from existing Reflection Candidates" — Insight Preparation reads
`ReflectionCandidate` (and, transitively through it, the `ReflectionSourceRef`s each one already
cites), never Journal/Memory/Activity/Companion directly. This keeps the layering honest: Reflection
Foundation already did the work of turning raw data into trustworthy, sourced candidates; Insight
Preparation's job is to find deterministic *relationships between those candidates* and package
them as evidence — not to re-derive anything from raw data a second time.

### Journal / Memory / Companion / Activity

Unchanged since Sprint 4B — see `docs/architecture/journal-foundation.md`,
`docs/architecture/memory-engine.md`, `docs/architecture/memory-intelligence.md`,
`docs/architecture/companion-memory-integration.md`. Sprint 4C touches none of these directly;
`ReflectionCandidate.score`/`ReflectionSourceRef` already summarize what this sprint's Priority
Engine needs (reflection score, and — via each evidence reflection's own sources — whether Journal/
Activity/Memory backed it, and each cited Memory's `importanceScore`).

### Confirmed: no drift since Sprint 4B closure

`git log` head is `81fc874` ("feat: complete Sprint 4B reflection foundation"), working tree clean.
Schema, migrations, and the `reflection/` module are exactly as documented in
`docs/architecture/reflection-foundation.md` and `docs/progress/sprint-4b-final-report.md` — no
re-audit of those files' own content was needed beyond confirming this.

## Deliberate scope decisions (disclosed up front)

1. **Insight Preparation is one layer above Reflection Foundation, never a Reflection Foundation
   rewrite.** Every `InsightCandidate` references real `ReflectionCandidate` rows via
   `InsightEvidence` — never Journal/Memory/Activity/Companion rows directly. "Never fabricate
   evidence" (Phase 3) is enforced the same structural way Sprint 4B enforced "never fabricate
   sources": an `InsightEvidence` row can only ever be created from a `ReflectionCandidate` id
   already present in a fetched, `userId`-scoped snapshot.
2. **"No semantic similarity"** (Phase 2's own instruction): the Relationship Engine classifies
   pairs of `ReflectionCandidate`s using only structural fields already on the row — `category`,
   `trigger`, `groupKey`, `score`, `windowStart`/`windowEnd`, `state` — via fixed thresholds and a
   fixed table of "contradicting trigger" pairs. No token/Jaccard comparison, no embeddings (that
   machinery exists in `memory/shared/text-normalization.util.ts` for Memory/Reflection's own
   *content*-level matching; Insight Preparation deliberately does not reuse it, since relating two
   already-structured Reflection Candidates is a different, coarser-grained problem than relating
   raw text).
3. **`InsightPriority` and confidence/rule explanations are embedded fields, not separate
   tables** — exactly like `ReflectionCandidate.score`/`scoreFactors` (Sprint 4B) and
   `Memory.importanceScore`/`importanceFactors` (Sprint 3B). A priority score is 1:1 with its
   candidate, never independently queried.
4. **`InsightRelationship` is a real, persisted pairwise table** (mirrors `MemoryDuplicate`/
   `MemoryConflict`'s own precedent) — both because Phase 1 names it as its own domain concept and
   because a relationship edge is genuinely reusable evidence (the same two Reflection Candidates
   might be cited by more than one downstream concern in a later sprint).
5. **Compute-on-read, no background job** — identical precedent to every prior sprint's own
   "no new async infrastructure" decision. `InsightGenerationService.ensureGenerated()` runs inside
   every read endpoint.
6. **No `EXPIRED` status on `InsightCandidate`.** Phase 5 lists exactly four states
   (`NOT_READY`/`READY`/`INSUFFICIENT_EVIDENCE`/`ARCHIVED`) and this sprint implements exactly
   those four, not a fifth invented state. Source invalidation (Phase 8) is handled by recomputing
   readiness from only the still-valid evidence on every read — if a cited Reflection Candidate
   expires, it's excluded from evidence and the readiness naturally recalculates (typically back to
   `NOT_READY` if that leaves too little evidence), the same way Reflection Foundation's own
   `LONG_INACTIVITY` staleness handling recomputes from current data rather than inventing a new
   state.

## Phase 1+ implementation log

See `docs/architecture/insight-preparation.md` for the full design once implemented, and
`docs/progress/sprint-4c-final-report.md` for the closure report.
