# Memory Foundation (Sprint 3A)

Memory Foundation is the trusted, structured foundation of BeaconVie Memory — schema, consent,
candidate lifecycle, CRUD, versioning, audit, timeline, and export. It is deliberately **not** Memory
intelligence: no embeddings, no vector database, no semantic search, no RAG, no knowledge graph, no
LLM-based extraction, no importance/duplicate/merge/conflict automation, no semantic retrieval into
Companion prompts. Those are Sprint 3B/3C, per the Product Bible's own phased roadmap (Module 10).

> **Sprint 3B update**: importance scoring, duplicate/conflict detection, merge suggestions, a
> deterministic retrieval policy, ranking, and context budgeting were added on top of this
> foundation — still no embeddings/RAG/semantic search, and still not wired into a live Companion
> prompt (that remains Sprint 3C). See docs/architecture/memory-intelligence.md for the full
> design; this document is otherwise unchanged from Sprint 3A and still describes the storage
> layer accurately. The `Memory` model gained `importanceScore`/`importanceFactors`/`pinned`/
> `referencedCount` columns (Sprint 3B migration `20260804120000_memory_intelligence`) — additive
> only, nothing described below was altered.

**Governing rule** (Product Bible Module 10 §2's standing creed, restated as this sprint's own test):
> Remember less. Remember better. Never fake. Always explain. Always allow deletion. Respect change.
> Protect privacy.

## Relationship to Sprint 1's `MemoryNote`

Sprint 1 shipped one flat table, `memory_notes` (`id`, `userId`, `content`, `source: ONBOARDING|COMPANION`,
`createdAt`), written only by `MemoryService.createNote()` (onboarding's Reflection step) and read only
by `MemoryService.mostRecent()` (the Dashboard's memory highlight). It has no type, no status, no
consent, no versioning, no audit trail, and no user-facing UI of its own.

- Every existing `memory_notes` row was migrated once, additively, into the new `Memory` model (see
  the first Sprint 3A migration, `20260803064730_memory_foundation`) — tagged `sourceType:
  'MIGRATED_LEGACY'`, with the original `memory_notes.id` and legacy `source` enum preserved in
  `structuredPayload` rather than fabricated. `sourceConversationId`/`sourceMessageId` are left `null`
  for migrated rows — `MemoryNote` never had a real conversation/message reference, and inventing one
  would violate this sprint's own "no accepted memory without a real source" rule.
- `UserPreference.memoryPreference` (Sprint 1's onboarding-level global toggle: `ASK_BEFORE_SAVING` /
  `SAVE_SELECTED_ONLY` / `DO_NOT_SAVE_YET`) is a **separate, older setting** for the legacy flow —
  left untouched. It is not the same thing as this sprint's `MemoryConsentService`, and the two are
  not merged; see "Consent engine" below for why that's a deliberate choice, not an oversight.

### Onboarding cutover (Sprint 3A release closure)

As of the Sprint 3A release closure, `OnboardingService.respondToMemoryConsent()` no longer calls
`MemoryService.createNote()` — it calls `MemoryCandidateService.createDirect()`, writing straight to
the new `Memory`/`MemoryVersion`/`MemoryAudit` tables (consent-checked, same as `accept()`, but
skipping the candidate-row/source-message-ownership step because onboarding's own explicit "yes,
remember this" *is* that consent, and onboarding's messages live in the older `CompanionMessage` model,
which has no real `Conversation`/`ConversationMessage` to reference — `sourceConversationId`/
`sourceMessageId` are left `null`, exactly like migrated legacy rows, rather than fabricated).

This makes `MemoryNote` **write-only-in-the-past, read-only-going-forward**: `MemoryService.createNote()`
has no remaining caller anywhere in the codebase, and is kept only so `MemoryService.mostRecent()` (the
Dashboard's fallback) still has a real implementation to call for accounts whose only memory predates
this cutover. No code path can create a new `memory_notes` row anymore. The table itself is **not**
dropped in this closure — see docs/progress/sprint-3a-final-report.md "Legacy MemoryNote transition
decision" for why (in short: a follow-up migration must first backfill any `memory_notes` rows created
between the last migration run and this cutover shipping, which this closure's evidence run found none
of, but a schema-drop is safer as its own reviewed step than bundled into this one).

`DashboardService`'s Memory Highlight prefers the newest genuinely `ACCEPTED` Sprint 3A `Memory`
if one exists, falling back to the legacy `MemoryNote`-based highlight otherwise — both are "only real
accepted memories," never a fabricated one.

## Module layout

```
apps/api/src/memory/
  memory.service.ts        Sprint 1 legacy — unchanged (createNote/mostRecent, MemoryNote)
  audit/                   MemoryAuditService — writes/reads MemoryAudit rows (event trail only)
  consent/                 MemoryConsentService — the single consent source of truth
  candidate/               MemoryCandidateService — CANDIDATE/PENDING_CONSENT → ACCEPTED/REJECTED
  record/                  MemoryRecordService — CRUD, deletion, versioning, timeline
  export/                  MemoryExportService — synchronous, Redis-cached-by-jobId export
```

## Domain model

Enums: `MemoryType` (18 values, including `HEALTH` — see "Consent engine"), `MemoryStatus`
(`CANDIDATE`/`PENDING_CONSENT`/`ACCEPTED`/`REJECTED`/`ARCHIVED`/`EXPIRED`/`DELETED` — in practice a
`Memory` row is only ever `ACCEPTED`/`ARCHIVED`/`DELETED`, since it's only ever *created* directly with
`ACCEPTED` at candidate-acceptance time; the other three values exist on the shared enum for
forward-compatibility with the literal Sprint 3A spec, not because this sprint assigns them to a
`Memory` row), `MemoryConsentMode` (`ASK_EVERY_TIME`/`ALLOW_SELECTED`/`ALLOW_TYPE`/`DENY_TYPE`/
`DISABLED`), `MemoryVisibility` (`PRIVATE`/`COMPANION_ALLOWED` — no public/community visibility),
`MemorySourceType`, `MemoryCandidateStatus`, `MemoryAuditAction`, `MemoryActorType`.

Models: `Memory`, `MemoryVersion` (full content snapshot per change, cascades with its `Memory`),
`MemoryAudit` (event trail only, deliberately **not** a foreign key to `Memory` — see
docs/security/memory-privacy.md "Deletion semantics" for why), `MemoryConsentSetting` (one row per
user — the global default), `MemoryTypeConsent` (zero-or-one row per (user, type) — an explicit
override), `MemoryCandidate`.

`MemoryRelation` was considered and not added — source/version linkage is already fully covered by
`sourceConversationId`/`sourceMessageId` (plain, unenforced string references — see "Candidate
lifecycle" below for why they're not FKs) and `MemoryVersion.memoryId`, so a generalized relation
table would be speculative infrastructure this sprint doesn't need.

## Consent engine

`MemoryConsentService` is the single source of truth for whether a candidate may become a `Memory`.
Two tables back it: `MemoryConsentSetting` (exactly one row per user, the global default, conservative
`ASK_EVERY_TIME`) and `MemoryTypeConsent` (an explicit per-type override; its absence means "use the
global default," never "auto-allow"). This is deliberately two tables, not one nullable-type table —
Postgres treats `NULL` as distinct in a unique index, which would have allowed multiple "global" rows
per user; two focused tables avoid that pitfall entirely.

**`HEALTH` is never auto-allowed under any circumstance** — `MemoryConsentService.canAccept()` never
lets `HEALTH` fall back to the global default, no matter what it's set to; `HEALTH` requires its own
explicit `MemoryTypeConsent` row with `mode: 'ALLOW_TYPE'`, full stop. This is enforced once, in one
place, and both `MemoryCandidateService.propose()`/`accept()` and the Settings UI go through it — there
is no second code path that could bypass it.

Settings (`/settings`) and the full Memory page (`/memory` → "Memory settings") render the *same*
`ConsentSettings` component against the *same* `/memory/consents` endpoints — there is no second,
parallel consent implementation.

## Candidate lifecycle

`CANDIDATE`/`PENDING_CONSENT` → `ACCEPTED`/`REJECTED`. No LLM extraction anywhere in this sprint.
Every candidate is created via `MemoryCandidateService.propose()`, which requires `sourceConversationId`
+ `sourceMessageId` to resolve to a real `ConversationMessage`, in a `Conversation` the caller owns,
**with `role: 'USER'`** — an assistant-authored message can never be a candidate's source. This is what
structurally guarantees "no candidate creation from fabricated assistant content" without any
content/semantic analysis (explicitly out of scope this sprint): the check is purely about who
authored the source row, not what it says.

Legitimate creation paths in Sprint 3A, all ultimately going through the same `propose()` method:
1. **Explicit user action** — the "Remember this" button on the user's own message in `/companion`
   (see "Frontend" below), the primary path today.
2. **Onboarding's Reflection consent step** — since the release closure cutover (see "Relationship to
   Sprint 1's `MemoryNote`" above), goes through `MemoryCandidateService.createDirect()` rather than
   `propose()`/`accept()` — the same consent gate and atomic Memory+MemoryVersion+audit creation, but
   without a candidate row or source-message ownership check, since onboarding's `CompanionMessage`
   model has no real `Conversation`/`ConversationMessage` to check ownership against, and the user's
   explicit "yes" is itself the acceptance.
3. **Development/test fixtures** — the same endpoint, used directly in tests.
4. **An authorized internal Companion service call** — not distinct from (1) today, since Sprint 3A's
   Companion has no automatic extraction; "Remember this" *is* that authorized call, triggered by the
   user, not by the model deciding on its own.

`accept()` creates the `Memory` + its first `MemoryVersion` + marks the candidate `ACCEPTED` in one
Prisma transaction — there is no window where one exists without the other. It is idempotent
(accepting an already-`ACCEPTED` candidate returns the same `Memory`, never a second one) and consent-
gated at the moment of acceptance (not just at proposal time, since consent settings can change in
between). `reject()` is idempotent and creates no `Memory`, ever.

## Memory CRUD and editing vs. deletion

**Editing vs. deletion — a deliberate reconciliation with the Product Bible.** The sprint brief for
this task asked for a literal `PATCH /memory/:id` endpoint with "fields users are allowed to change."
The Product Bible states, repeatedly and without qualification (Module 10 §8, Module 20 §8, Module 21
§8, Module 3 §9's Data Ownership asymmetry), that memory content is never directly user-writable —
only deletable; "editing" is implemented as delete-and-let-it-update-naturally. Per this task's own
priority order (Product Bible over this prompt) and "do not contradict previously finalized behavior,"
`MemoryRecordService.update()`/`UpdateMemoryDto` allow **only `title` and `visibility`** — never
`summary`, `structuredPayload`, or `type`. `title` is a user-facing label, not the memory's substantive
content (comparable to renaming a file, not rewriting what's inside it), so allowing it doesn't
reintroduce direct content editing. Every `update()` call still creates a new `MemoryVersion` and
`MemoryAudit(UPDATED)` entry, exactly as if it were a substantive change, so the version/audit trail
stays complete regardless of which fields were touched.

`archive()`/`restore()` are reversible (hides from the default list, keeps it fully recoverable).
`remove()` is a real, honest hard delete — see docs/security/memory-privacy.md "Deletion semantics"
for the full policy.

## Timeline

`GET /memory/timeline` — reverse-chronological, cursor-paginated (the cursor is the previous page's
last item's `createdAt` ISO timestamp; simple and sufficient at this sprint's scale, no need for a
more elaborate opaque-cursor scheme). Items are grouped client-side into Today/This week/Earlier.
Filters: type, status (excluding `DELETED`, which can never be requested back even explicitly — see
memory-privacy.md), date range. No semantic ranking, no importance ranking — plain `createdAt` order,
consistent with this sprint's explicit non-goals.

Every timeline item carries `whyThisMemory` (a plain-language sentence derived from `sourceType` —
"From a conversation with your Companion," "You asked BeaconVie to remember this," etc.) and
`consentExplanation` (derived from the `consentState` snapshot recorded at acceptance time) — the
Product Bible's "always explain" creed line, implemented literally as data the frontend renders
verbatim rather than a UI-only convention that could drift from the backend's actual decision.

## Export

`POST /memory/export` runs synchronously — Sprint 3A's expected data volumes make a background job
queue (BullMQ or otherwise) unnecessary infrastructure, and none is introduced anywhere in this
sprint. The completed result is cached in Redis for 15 minutes, keyed by a generated `jobId`, so
`GET /memory/export/:jobId` is genuinely backed rather than a job store that's faked to "always
succeed instantly" — after 15 minutes the id simply expires, which is disclosed, not silently
pretended to be permanent storage. Exports include only the caller's own memories, versions, consent
settings, and activity history — never `ProviderLog` rows, secrets, other users' data, raw system
prompts, or internal safety metadata.

## Dashboard integration

`DashboardService`'s Memory Highlight prefers the newest `ACCEPTED` Sprint 3A `Memory`
(`MemoryRecordService.mostRecentAccepted()`) over the legacy `MemoryNote`-based highlight, falling back
to the legacy path only when no Sprint 3A memory exists yet. Both paths only ever show a real,
already-accepted memory — no inferred insight, no fabricated content, an honest "just getting to know
each other" empty state otherwise (unchanged from Sprint 1).

## Companion integration

`RememberThisButton` (`features/memory/components/remember-this-button.tsx`) is the one and only way
Companion-side content becomes a memory candidate: a small icon button on the user's own messages in
`/companion` only (never on an assistant reply — the button isn't even rendered there). Clicking it
opens a short confirmation dialog (type + editable title/summary, pre-filled from the message), then
proposes and — if consent currently allows it — immediately accepts the candidate as one user-facing
action. If consent blocks it, the candidate is created as `PENDING_CONSENT` and surfaces in Settings →
Memory → Pending instead of silently failing or silently succeeding.

Companion does **not** automatically retrieve memories into prompts in this sprint (that's Sprint 3C);
it does not perform semantic selection; it cannot bypass consent (the same `MemoryConsentService.
canAccept()` gate applies regardless of caller); and it never claims to have "remembered" something
unless a `Memory` record was actually created via a real, successful `accept()` call.

## Frontend

`/memory` (not a Global Navigation item, per Module 3's IA — reachable from Settings, the Dashboard
Memory Highlight's implicit link to `/companion`, and Companion's Remember-this flow) hosts three
sections behind a simple in-page switcher: Timeline (default), Pending (candidate review), and Memory
settings (consent). Selecting a timeline item opens its detail view (`?item=<id>` in the URL, the same
pattern `CompanionView` already uses for its active conversation) with title editing, archive/restore,
delete (the established `Dialog` destructive-confirmation pattern), version history, and activity
history, all inline. Settings (`/settings`) embeds the exact same `ConsentSettings` component plus a
link to the full `/memory` page and an export button — no second consent implementation.
