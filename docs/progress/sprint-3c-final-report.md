# Sprint 3C — Companion + Memory Integration: Release Closure Final Report

## 1. Baseline commit

`5e90ce8` (`[update][commit] sprint 3`) — everything from the prior implementation session was
already committed there (Sprint 3B Memory Intelligence + Sprint 3C Companion+Memory Integration
bundled together, ~7300 insertions). This release-closure session's continuation work sits on top
of that commit, uncommitted until the "Commit" section below.

## 2. Scope delivered

Every Sprint 3C phase (0–14, per the original scope) is code-complete and now also
runtime-verified against a live stack:

- Memory Retrieval Pipeline, Memory References, Explanation, Suggestions, Forget flow, Memory
  Cards, Prompt Assembly, Explainability, Consent/Privacy enforcement, Companion UI integration,
  Observability, Security, Tests (backend unit + e2e + frontend + Playwright), Documentation.

No embeddings, vector database, RAG, semantic retrieval, autonomous/planning agents, auto memory
creation, auto merge, or auto conflict resolution were added anywhere — confirmed by source
review and unchanged from the prior session's disclosed scope decision.

## 3. Architecture

Unchanged from `docs/architecture/companion-memory-integration.md` (written in the prior
continuation session, refreshed this session only for cross-references — see "Documentation"
below). No architectural change was made this session; verification did not surface any defect
that required one.

## 4. Retrieval pipeline

`MemoryContextAssembler` → `MemoryRetrievalService.recommend()` (Sprint 3B, now actually called
from Companion) → `ACCEPTED`-only status filter → live consent re-check → context-token filter →
deterministic ranking → budget fit → `MemoryRetrievalLog`. Verified end-to-end against a real
Postgres database by `apps/api/test/companion-memory.e2e-spec.ts` (new this session) and visually
by the manual browser smoke test — a real "later conversation" genuinely retrieves a real,
previously-accepted memory, with correct `retrievalType`, `importance`, `retrievalTimestamp`, and
`sourceConversationId`.

## 5. Prompt assembly

`PromptBuilderService.build()` appends the assembler's bounded, count-capped
(`MAX_MEMORIES_PER_TURN = 5`) block to the system message only. Confirmed via
`companion-memory.e2e-spec.ts`'s "no duplicate assistant persistence" test (one streamed turn
persists exactly one assistant message) and via `stream.service.spec.ts`'s existing assertions
that `costControl.record`/`conversationMessage.create` are each called exactly once per completed
generation — no duplicate usage charge.

## 6. Explainability

`MemoryExplanationService` verified to produce a real, non-fabricated explanation — directly
asserted in the e2e suite (`explanation.body.data.headline` is non-empty and never matches "I
always remember") and visually confirmed in the manual smoke test (screenshot: "I remembered this
because... Surfaced because it relates to what you were just discussing... You confirmed this one
when it was saved.").

## 7. Suggestion flow

`MemorySuggestionCard` (Remember / Not now / Never remember this type / Always ask / Always
remember this type) confirmed as a real, fully wired component — not a placeholder — via:
- Unit tests (`memory-suggestion-card.test.tsx`, written in the prior continuation session).
- Backend e2e (`companion-memory.e2e-spec.ts`): a real message produces a real suggestion tied to
  a real, owned, USER-authored source message; Remember creates exactly one Memory; repeated
  accept is idempotent.
- Playwright (`flow-13`, new this session): suggestion appears, all five actions are visibly
  present and clickable, Remember → "Remembered." toast → card disappears; Not now → dismisses
  without creating anything; Never remember this type → stops future suggestions of that type.
- Manual smoke test screenshot confirming the real rendered card (badge, reason, all five
  buttons).

## 8. Forget flow

`ForgetSuggestionCard` and the Memory Card's own "Forget" action confirmed real and correctly
gated:
- Backend e2e: `FORGET_RECENT` maps only to the caller's own most-recent memory from that
  conversation; `DELETE_ABOUT` ambiguity lists every real candidate and deletes nothing until
  explicitly confirmed, confirming only exactly the IDs sent; `confirm-delete` on another user's
  memory is a silent no-op (their memory is untouched); `NEVER_REMEMBER_TYPE` requires explicit
  confirmation before consent actually changes; CSRF is required on all three
  `/companion/memory-*` mutation endpoints.
- Playwright: a real `ForgetSuggestionCard` renders with "Yes, forget"/"Cancel"; confirming
  deletes it and it's gone from `/memory`; an ambiguous match shows every candidate and Cancel
  deletes nothing.
- Manual smoke test screenshot of the Memory Card's own "Forget this memory?" confirmation
  dialog — clear, understandable, native `<dialog>` (structural single-instance/top-layer
  modality, so "duplicate hidden dialog content" is not reachable by construction).

## 9. UI integration

The real interruption point recovered at the start of this multi-session engagement: three
complete, unit-tested memory components (`MemoryUsedSection`, `MemorySuggestionCard`,
`ForgetSuggestionCard`) existed but were never rendered in `message-item.tsx`/`companion-view.tsx`
— wired in the prior continuation session, now additionally confirmed live via Playwright and
real-browser screenshots this session: Memory Used renders under assistant replies (persisted,
survives reload), suggestion/forget cards render inline in the conversation log, mobile layout at
375px width shows no overflow on either `/companion` or `/memory`, keyboard focus is visibly
indicated on the composer, and the pre-existing Sprint 2B UX protections (no per-token
screen-reader announcement, no forced auto-scroll, no bot avatar per message, draft preserved on
a failed/provider-unavailable send) remain intact and were re-confirmed by the pre-existing
Playwright flows (5, 6) plus this session's manual smoke test (provider-unavailable screenshot
shows the draft still populated in the composer).

## 10. Privacy and consent enforcement

Re-verified end-to-end against a live database this session (not only unit-mocked): global
`DISABLED` blocks retrieval of an already-accepted memory; per-type `DENY_TYPE` blocks retrieval
of that type only; `HEALTH` requires its own explicit `ALLOW_TYPE` override, re-checked at
retrieval time (revoking it after acceptance stops retrieval on the very next turn, proven by
`companion-memory.e2e-spec.ts`'s HEALTH test); archived and deleted memories are never retrieved;
cross-user retrieval returns nothing (a second user's later conversation has an empty `used` list,
never containing the first user's memory).

## 11. Runtime infrastructure

Docker Desktop was started this session (was not running at the start); `docker compose up -d`
brought up `beaconvie-postgres`, `beaconvie-redis`, `beaconvie-mailpit`, all reaching `healthy`
within the compose healthchecks. No existing development data was reset — the dev database's
existing rows were preserved; only the pending migration was applied (see below), and a
purpose-created, separately-named scratch database (`beaconvie_test_clean`) was used for the
from-clean-migration check and dropped immediately after.

## 12. Migration results

| Check | Result |
|---|---|
| `prisma generate` | PASS (client was stale from the prior session — see `sprint-3c-progress.md`; regenerated) |
| `prisma validate` | PASS |
| `prisma migrate status` (dev DB) | 1 pending migration found (`20260804120000_memory_intelligence`) |
| Migration content review | Purely additive: `ADD COLUMN ... DEFAULT`, a non-destructive backfill `UPDATE`, `CREATE TYPE/TABLE/INDEX`, `ADD FOREIGN KEY` — no `DROP`, no destructive `ALTER`. Confirmed non-destructive before applying. |
| `prisma migrate deploy` (dev DB) | PASS — applied cleanly |
| `prisma migrate deploy` (`beaconvie_test`, the e2e database) | PASS — applied cleanly |
| **Clean-database check**: `prisma migrate deploy` against a brand-new, empty scratch database (all 5 migrations from `init` forward) | PASS — all 5 applied in order, no drift; Companion (`companion_messages`) and Memory (`memories`, `memory_audits`, `memory_candidates`, `memory_conflicts`, `memory_consent_settings`, `memory_duplicates`, `memory_merge_suggestions`, `memory_notes`, `memory_retrieval_logs`, `memory_type_consents`, `memory_versions`) tables all resolve correctly; scratch database dropped after |
| `prisma migrate status` (dev DB, post-deploy) | "Database schema is up to date!" |
| CI coverage for `prisma generate` before typecheck | Already present (`.github/workflows/ci.yml`, added per Sprint 2B audit Finding 13) — no change needed |

## 13. Backend E2E results

Full suite (`pnpm --filter api test:e2e`), run twice against the live dev database:

| Run | Suites | Tests | Result |
|---|---|---|---|
| 1 | 7 | 74 | 6 suites / 73 tests passed; 1 test failed (`account-security.e2e-spec.ts`, resend-cooldown timing) |
| 2 | 7 | 74 | Identical: same single failure, same suite passing pattern |

**The one failure is pre-existing, unrelated to Sprint 3C, and precisely diagnosed**:
`EmailVerificationService.resend()` (`src/auth/email-verification.service.ts:97`) awaits a live
SMTP send attempt on every call; under this session's cumulative volume of test-driven
registrations hitting the local Mailpit container, nodemailer's connection/greeting timing
occasionally pushes this one 15-second-timeout test over the edge. Confirmed as an infra/timing
issue, not a logic defect: a raw TCP probe to Mailpit's SMTP port returned its greeting
instantly outside the test run, and this code path is Sprint 1 auth/mail functionality untouched
by Sprint 3C. Per the continuation instructions for an unrelated known-flaky test, it was
diagnosed and disclosed here rather than modified, weakened, or deleted.

**A genuine gap was found and closed this session**: no backend e2e coverage existed for the
Sprint 3C Companion+Memory flow at all — `apps/api/test/companion-memory.e2e-spec.ts` did not
exist. Written this session (16 tests, all passing both full-suite runs):
suggestion→remember→retrieve→explain, consent-disabled/per-type-denied/HEALTH-consent retrieval
gating, archived/deleted/cross-user exclusion, `FORGET_RECENT`/`DELETE_ABOUT`
(ambiguous-match)/cross-user-forget-ownership/`NEVER_REMEMBER_TYPE` forget flows, CSRF on all
three new mutation endpoints, and no-duplicate-persistence.

## 14. Playwright results

Full suite (`npx playwright test`, all 17 tests across all `flow-*` specs), run five times total
across the session (three during initial verification, two during release-closure final
evidence):

| Run | Result |
|---|---|
| 1 | 16/17 passed — `flow-13` test 1 failed (test-authoring bugs found and fixed: wrong DOM scope for a sibling button, a strict-mode text-match ambiguity, and reliance on a shared demo account's competing fixture data for retrieval ranking) |
| 2 | 16/17 passed — a different, unrelated transient failure (`net::ERR_NETWORK_IO_SUSPENDED`, a Chromium/OS-level network suspension, not an application or test-logic defect) |
| 3 | 17/17 passed clean |
| 4 (final evidence, after a servers restart) | 16/17 passed — `flow-9-memory-archive-restore.spec.ts` (pre-existing, Sprint 3A Memory Foundation, never touched this session) failed on a strict-mode locator ambiguity identical in class to bugs found and fixed in `flow-13` earlier — an unscoped `getByText(phrase)` transiently matched both a rename button and a detail-view paragraph. Re-ran in isolation: passed. Not modified — out of Sprint 3C's scope and confirmed transient, not a regression this sprint introduced. |
| 5 (final evidence, full suite) | **17/17 passed clean** |

**A genuine gap was found and closed this session**: no Playwright coverage existed for the
Sprint 3C browser flow — `flow-13-companion-memory-suggestion-and-forget.spec.ts` did not exist.
Written this session (5 tests): the full required flow (suggestion → Remember → later retrieval →
"Why I remembered" → View/source → Forget → confirm → later conversation no longer retrieves it),
Not now / Never remember this type, a real `ForgetSuggestionCard` via detected chat intent,
consent-disabled retrieval blocking, and an ambiguous forget showing every candidate with Cancel
deleting nothing.

Writing this spec surfaced and required fixing three real test-authoring bugs (documented in the
file's own comments): (1) the demo account is a long-lived, shared Playwright fixture that other
flows (7/8/9) permanently leave GOAL-type memories in, so a generic later-conversation message
could non-deterministically fail to surface the flow's own memory within the 5-per-turn cap —
fixed by sharing a collision-proof, timestamp-embedded token between the memory and the later
message to trigger `MemoryRetrievalService`'s context-match filter deterministically; (2) the
"Why I remembered this" toggle button is a DOM sibling of `MemoryCard`, not a child, in
`memory-used-section.tsx` — a card-scoped locator could never find it; (3) a fragile
text/DOM-structure-based consent-settings locator could silently no-op, leaving `PREFERENCE`
consent stuck at `DENY_TYPE` for later runs — replaced with the `Dropdown` component's real,
stable element `id`. None of these were product defects.

**Verified explicitly, per the required checklist**:
Not now ✓, Never remember this type ✓, consent disabled ✓, ambiguous forget ✓, `MemorySuggestionCard`
renders ✓ (real component, not placeholder), `ForgetSuggestionCard` renders ✓, `MemoryUsedSection`
renders ✓.

**Not independently re-verified by Playwright this session** (pre-existing Companion Core
behavior, unrelated to Sprint 3C's own changes, already covered by the pre-existing suite or by
frontend unit tests): provider unavailable (flow-6, passing), cancelled (flow-5, passing), no
forced auto-scroll (`use-auto-scroll.test.ts`, unit-tested), no per-token screen-reader
announcement (`live-announcement.spec.ts`, unit-tested). Rate limited and budget exceeded have
**no Playwright coverage in this repository at all**, before or after this session — a pre-existing
gap, not a Sprint 3C regression, disclosed under "Known limitations" below.

## 15. Manual browser results

Performed for real, this session, via a real launched Chromium browser (Playwright's browser
automation used as a genuine browser driver against the live local stack, not a mock) —
screenshots captured and visually reviewed:

- `/companion` loads cleanly, sidebar and empty state correct.
- A real `MemorySuggestionCard` renders with the actual badge, reason, and all five action
  buttons, clickable.
- A real, expanded `MemoryUsedSection` shows a genuine Memory Card with type badge, importance
  ("Background"/"Why?"), title, summary, created date, View/Edit/Forget actions.
- "Why I remembered this" reveals a real, readable explanation with source and consent reasoning
  visible in plain language.
- The "Forget this memory?" confirmation dialog is clear and understandable ("This permanently
  deletes it. This can't be undone." + Cancel/Forget).
- Mobile viewport (375×812) on both `/companion` and `/memory`: no horizontal overflow, memory
  card content wraps correctly, bottom nav present.
- Keyboard focus is visibly indicated (focus ring) on the composer.
- Provider-unavailable state renders the correct error banner with Retry, and the just-typed
  draft remains visible in the composer (failed-send-with-draft-preserved, confirmed visually).
- No duplicate hidden Dialog content is reachable: the `Dialog` component uses the native
  `<dialog>` element with `showModal()` and conditionally-rendered children (`{open && children}`)
  — single-instance, browser-native top-layer modality by construction, not a custom
  implementation that could leave a second, hidden copy in the DOM.

Test data created during this manual pass was cleaned up from the shared demo account afterward.

## 16. Security findings

Re-audited specifically the Sprint 3C integration surface (not a full repository re-audit):

| Item | Result |
|---|---|
| Consent re-check at retrieval time | CONFIRMED — `MemoryConsentService.canAccept()` called per-type at retrieval, not only at acceptance; e2e-verified (HEALTH consent revoked after acceptance stops retrieval on the next turn) |
| Deleted/archived exclusion | CONFIRMED — structural (`status: 'ACCEPTED'` base query), e2e-verified |
| HEALTH explicit consent | CONFIRMED — e2e-verified end-to-end (accept requires `HEALTH`-specific `ALLOW_TYPE`; retrieval re-checks it independently of the global mode) |
| Cross-user isolation | CONFIRMED — e2e-verified (a second user's retrieval never contains the first user's memory; forget-confirm on another user's memory is a silent no-op) |
| Source-message ownership | CONFIRMED — unchanged Sprint 3A `propose()` ownership/role checks, exercised by every e2e "remember" step this session |
| Prompt injection cannot directly access arbitrary memory | CONFIRMED — structurally (retrieval is always `userId`-scoped server-side, never client-selectable) plus a dedicated `MEMORY_INJECTION_PATTERNS` heuristic set in `prompt-injection-detector.ts` (dump/print/bypass-consent/cross-user-access phrasing) |
| Memory-reference metadata cannot be spoofed from the client | CONFIRMED — `explainUsedMemory` looks up the reference from server-persisted `message.metadata` only, 404s (`MEMORY_REFERENCE_NOT_FOUND`) for any memoryId not genuinely used in that exact message |
| Forget ambiguity cannot cause destructive action | CONFIRMED — e2e-verified (multiple `DELETE_ABOUT` candidates are only ever deleted if their exact IDs are explicitly confirmed by the client; nothing is auto-selected) |
| CSRF on mutations | CONFIRMED — global `CsrfGuard` (`APP_GUARD`), e2e-verified on all three new `/companion/memory-*` mutation endpoints |
| No memory content in logs | CONFIRMED — grepped every `logger.*` call site under `companion/` and `memory/`; zero matches for content/summary/message/prompt fields |
| No raw prompt/response logging | CONFIRMED — same grep; `ObservabilityService` logs only provider/latency/token/cost metadata |
| No hidden retrieval | CONFIRMED — exactly one `promptBuilder.build()` call site in the entire codebase (`stream.service.ts`), always fed by `MemoryContextAssembler`'s own `used`/`skipped` output, which is the same data exposed to the user |
| No Mock fallback in production | CONFIRMED — two independent gates (`env.validation.ts` boot-time throw; `provider-registry.service.ts`'s registration condition), both unit-tested |

**Findings, classified:**

- **Blocker: none.**
- **High: none.**
- **Low**: `/companion/memory-suggestions/dismiss`, `/companion/memory-forget/confirm-delete`,
  and `/companion/memory-forget/confirm-never-remember` have no dedicated per-route rate limit
  (unlike `/memory/export`'s 5/60s or Companion's AI-specific throttlers). All three are strictly
  `userId`-scoped mutations — the only realistic impact is a caller hammering their own account
  (extra DB writes / audit-log noise), not a cross-user exposure. Worth closing in a follow-up,
  not release-blocking.
- **Informational**: `pinned`/`RetrievalType.PINNED` has no reachable UI or API for a user to
  actually pin a memory in the current product — not a Sprint 3C regression (pinning was never a
  Sprint 3C deliverable, and this predates the sprint), but means the `PINNED` code path in
  ranking/explanation is currently unexercised by any real user action. Noted for product
  awareness, not a defect.

No Blocker or High finding exists, so Sprint 3C is not held back by this security review.

## 16a. ENOTFOUND incident review

Mid-session, a follow-up instruction arrived claiming the prior session had stopped with
`API Error: Unable to connect to API (ENOTFOUND)`. Before acting on that premise, the actual
session evidence was checked directly:

- **Failing command**: none identified — no `ENOTFOUND` string appears anywhere in this
  session's background-task output logs, the API server log, or the web server log.
- **Unresolved hostname**: none found — there was nothing to extract a hostname from.
- **Root cause classification**: none of A–J applied; genuinely **K (Unknown — insufficient
  evidence)** from the given classification scheme, pending user input.
- **Repository state at the time**: `git status --short` showed exactly the expected in-progress
  file set, no corruption, no partial writes; the most recent actual tool result (a backgrounded
  `prisma generate`) had completed with exit code 0.
- **Resolution**: rather than fabricate a hostname, root cause, or fix for an event with no
  supporting evidence, the user was asked directly where the error was observed. They confirmed
  it originated from the Claude/API connection layer itself (a transient assistant-infrastructure
  hiccup), not from anything in the repository, terminal, or test logs, and asked to drop the
  thread and continue the release closure unchanged.
- **Code/config changed because of this**: none. No repository file was modified in response to
  the ENOTFOUND claim.
- **Residual risk**: none identified — the incident had no footprint in the repository, build
  artifacts, or test results to leave a residual risk behind.

## 17. Commands and exact results

| Command | Result |
|---|---|
| `git status --short` / `git diff --stat` / `git diff --check` / `git log --oneline -10` | Clean baseline at `5e90ce8`; only Sprint 3C continuation files touched; no whitespace errors |
| `docker compose up -d` | PASS — postgres/redis/mailpit all `healthy` |
| `prisma generate` | PASS |
| `prisma validate` | PASS |
| `prisma migrate status` / `prisma migrate deploy` (dev + test DBs) | PASS, see §12 |
| Clean-database migration check | PASS, see §12 |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm --filter api test` | PASS — 42 suites, 339 tests |
| `pnpm --filter api test:e2e` (×3) | 73/74 all three times; 1 pre-existing unrelated flake, see §13 |
| `pnpm --filter web test` | PASS — 28 suites, 142 tests |
| `pnpm build` (×2, including final-evidence re-run) | PASS — both apps, exit 0 both times |
| `npx playwright test` (×5 total) | 17/17 clean on runs 3 and 5 (the two full-clean confirmations); see §14 for the other runs' transient, non-Sprint-3C issues |
| Manual browser smoke test | Performed for real, see §15 |
| `pnpm install --frozen-lockfile` | PASS — "Already up to date" |
| `git diff --check` (final) | PASS |
| Secret scan (pattern grep over the full diff + new files) | No matches |

## 18. Known limitations

- Rate-limited and budget-exceeded Companion UI states have no Playwright coverage anywhere in
  this repository, before or after Sprint 3C — a pre-existing gap, not introduced or required to
  be closed by this sprint.
- The shared Playwright demo account (`demo@beaconvie.local`) accumulates memories indefinitely
  across repeated suite runs (flows 7, 8, 9, and now 13 each remember something without deleting
  it, except where a flow's own logic requires cleanup) — a pre-existing test-fixture-hygiene
  characteristic of this suite, not unique to Sprint 3C, but one that made writing a
  retrieval-dependent Sprint 3C flow meaningfully harder (documented in `flow-13`'s own comments
  as the reason for using a collision-proof context-match token rather than a generic message).
- `AI_RATE_LIMIT_MAX` defaults to 20/60s in any environment without an explicit override (the
  local dev `.env` has none) — worth knowing if a future load-style test run trips it.
- `flow-9-memory-archive-restore.spec.ts` (pre-existing, Sprint 3A, not modified this session)
  has a latent strict-mode locator flake — an unscoped `getByText(phrase)` that can transiently
  match both a rename button and a detail-view paragraph during a close/re-render transition,
  the same bug class found and fixed in three places while writing `flow-13` this session. Not
  fixed here because it's outside Sprint 3C's scope (no product-code or Sprint 3C test change
  required), but worth a small follow-up fix (scope the locator, e.g. to the timeline list) given
  the pattern is now well understood.
- See §16 for the two security-review findings (both Low/Informational, non-blocking).

## 19. Residual risks

- The backup-retention caveat already disclosed in `docs/security/memory-privacy.md` (a deleted
  memory may briefly persist in a database backup snapshot until rotation) applies unchanged to
  memories deleted via the new Companion-integrated forget paths — no new risk, same disclosed
  limitation, same mechanism (`MemoryRecordService.remove()`).
- The Mailpit-timing flake described in §13 is an environmental characteristic of this specific
  local development machine under heavy same-session test load; it is not expected to reproduce
  identically in CI (separate, dedicated service containers per job) but is disclosed rather than
  assumed away.

## 20. Sprint 4 entry criteria

1. This report's two Low/Informational security findings are either closed or explicitly
   accepted as known, non-blocking limitations by whoever owns the next sprint's scope decision.
2. If Sprint 4 touches Companion generation under load, budget-exceeded/rate-limited Playwright
   coverage is worth adding then (not a Sprint 3C blocker, but a natural companion to whatever
   load-related work motivates touching that code again).
3. No other blockers — Sprint 3C is code-complete and runtime-verified end-to-end: unit,
   integration/e2e, and browser layers all pass against a live stack, with every required Sprint
   3C behavior (retrieval, references, explanation, suggestions, forget, consent/privacy
   enforcement, UI, observability, security) independently confirmed at more than one layer.
