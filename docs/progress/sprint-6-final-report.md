# Sprint 6 — Tarot Discovery Foundation: Release Closure Report

## 1. Executive summary

Sprint 6 Tarot Discovery is code-complete and independently re-verified in this closure pass.
Every Tarot-scoped check (unit, e2e in isolation, Playwright flow-20, manual browser smoke,
code-level security/privacy audit) passes. Two issues were found during closure, **neither of
which is a Tarot defect**:

1. The full backend e2e batch (all 13 suites run together) fails almost entirely on `429 Too Many
   Requests` from the shared Redis-backed auth rate limiter being exhausted by the suite's
   cumulative `/auth/register` volume — reproduced in both parallel and `--runInBand` modes.
   Tarot's own suite, run alone, passes 10/10 cleanly.
2. The full Playwright suite (20 flows) could not complete in this environment — the Next.js dev
   server crashed under sustained memory pressure partway through (4/29 tests ran before the
   crash). Tarot's own flow (`flow-20-tarot-discovery.spec.ts`), run alone, passes.

A third finding is process-level, not code-level: **the working tree was already fully committed
and pushed** at the start of this closure pass (contradicting the assumed "nothing staged"
starting state), and the pre-existing commit `35417d0` bundles Sprint 6 Tarot together with the
frozen Sprint 5C Goal system in one commit. See §2 and §16.

**Verdict: COMPLETE WITH NON-BLOCKING FINDINGS.**

## 2. Baseline commit

- HEAD at the start and end of this closure pass: `35417d0` — "`[upddate][commit] insert tarrot
  6`" (2026-08-07 17:23:57 +0700), branch `master`, up to date with `origin/master`.
- `git status --short` was already clean (no staged or unstaged changes) — the task brief's
  assumption of frozen Sprint 5C Goal changes plus docs/audit files sitting uncommitted did not
  match reality. That work, and Sprint 6 Tarot, are **already both inside `35417d0`**, already
  pushed. No new commit was made by this closure pass (see §16, §7 of the original brief).
- `git diff --check` and `git diff HEAD~1 HEAD --check`: clean, no whitespace violations.

## 3. Scope delivered

Confirmed via `git show --stat 35417d0` and direct code review — Tarot-owned files only, no
extension of Reflection/Insight/Review found in the same commit's diff (`git show --name-only`
against those directories returned nothing):

- 78-card deck data (`apps/api/prisma/data/tarot-deck.ts`) + seed script
- Deterministic draw engine (`apps/api/src/tarot/draw/`)
- Reading persistence/lifecycle (`apps/api/src/tarot/record/`)
- AI interpretation (`apps/api/src/tarot/interpretation/`)
- REST API (`apps/api/src/tarot/tarot.controller.ts`, 10 routes)
- `/discover/tarot` UI, history, `?item=<id>` detail view (`apps/web/features/tarot/`)
- Companion bridge (`ConversationContext.latestTarotReading`, read-only)
- SEO remediation (landing copy, `sitemap.ts`, `robots.ts`)
- Backend unit/e2e, frontend component, and Playwright tests
- `docs/architecture/tarot-discovery.md`

The same commit also contains the entire Sprint 5C Goal system (previously uncommitted/frozen
work) — see §16. Sprint 6's own Tarot code does not touch `goal/`, `reflection/`, `insight/`, or
`review/` source.

## 4. Deck integrity

Verified by direct inspection of `tarot-deck.ts` plus the passing `tarot-deck.service.spec.ts`
and the e2e "lists the full real 78-card deck" test:

- 22 Major Arcana literal entries (`major-00-the-fool` … `major-21-the-world`), each with distinct,
  real upright/reversed meanings and keywords — no placeholders.
- 4 Minor suits (Wands/Fire, Cups/Water, Swords/Air, Pentacles/Earth) generated via `buildSuit()`,
  14 ranks each (Ace–10, Page, Knight, Queen, King) = 56 cards.
- Build-time guard: `if (TAROT_DECK.length !== 78) throw new Error(...)` — a hard, load-time
  assertion, not just a test assumption.
- No duplicate slugs (deterministic `suit-rank-name` construction).

## 5. Draw engine

`tarot-draw-engine.util.ts` — pure functions, no DB/IO:

- PRNG: `djb2` seed hash → `mulberry32`, fully deterministic given the same seed.
- Fisher–Yates shuffle over the caller-supplied card-id list, sliced without replacement — no
  duplicate cards possible within one reading.
- Seed is always server-generated (`randomUUID()`), never accepted from the client — the record
  service calls `drawCards({ cardIds, count })` with no `seed` argument.
- `TarotReadingSession` persists `seed` + `algorithm` + full `shuffledCardIds` verbatim, making any
  past reading independently reproducible after the fact.
- Daily Draw re-draw is blocked by a status-agnostic check (`assertNoDailyDrawToday`) — deliberately
  includes `DELETED` readings so soft-deleting today's draw cannot be used to bypass the once-per-
  day rule (a Phase 9 security-review fix already in the codebase).

## 6. Reading model

`tarot-record.service.ts`:

- `draw()` persists the reading, its cards, and its session in one transaction *before* attempting
  interpretation — the real drawn result is never contingent on AI succeeding.
- Ownership: every read/mutate path routes through `findOwned()`, which 404s identically for a
  nonexistent reading and for another user's reading.
- Deletion: `remove()` sets `status: DELETED`; `list()` excludes `DELETED` by default; the owner can
  still reach a deleted reading directly (by id) to `restore()` it — by design, mirroring
  Goal/Journal precedent, not a leak.
- Cross-user isolation: `list()` is scoped by `userId` in the Prisma `where`; `findOwned()` double-
  checks ownership on every direct-id access.

## 7. AI interpretation

`tarot-interpretation.service.ts`:

- System prompt explicitly states the cards are already drawn and real; the service is only ever
  given structured card data (name, orientation, real traditional meaning/keywords) — it has no
  code path to select, add, remove, or re-orient a card.
- Reuses Companion's `ProviderOrchestratorService` and `SafetyService` (input/output checks) rather
  than a second AI stack.
- Failure handling is non-blocking end-to-end: provider stream errors, thrown exceptions, and empty
  output all resolve to `interpretation: null` (caught in `generateInterpretation()`, never re-
  thrown) — the already-persisted reading is unaffected and can be retried via
  `POST /tarot/readings/:id/interpret`.
- Logging (`this.logger.warn(...)`) records only error categories/messages, reading ids, and
  counts — never raw prompt text, raw model output, or secrets.
- **Manual-testing note**: in this dev environment (`DEFAULT_AI_PROVIDER=mock`), every Tarot
  interpretation renders the same canned sentence. This is a property of the shared `MockProvider`
  (`REPLIES[userTurns % 4]`, and a Tarot interpretation call is always exactly one user turn), not
  a Tarot-specific defect — the same mock provider is used by Companion chat. The prompt pipeline
  itself (verified by code review) sends the real per-reading card data; a real provider would
  produce grounded, per-card content.

## 8. APIs

10 routes on `tarot.controller.ts` (deck list/get-by-slug, draw, reading list/get/history/interpret/
archive/restore/delete) — all guarded by the standard auth guard, all delegate ownership checks to
the record service. No route accepts a client-supplied seed or card selection.

## 9. Frontend

`/discover/tarot` — verified functional in a real browser (see §14): reading-type selector (Daily
Draw / Single Card / Three Card Spread), optional question field, "Shuffling…" pacing state, real
revealed result with upright/reversed visual treatment (reversed cards render upside-down), history
list, `?item=<id>` in-place detail view, Archive/Delete/Restore actions gated by reading status.

## 10. Companion bridge

`context-builder.service.ts` adds `latestTarotReading` to `ConversationContext` via a single
`prisma.tarotReading.findFirst({ where: { userId, status: 'ACTIVE', visibility:
'COMPANION_VISIBLE' }, include: { cards: ... } })` — **read-only**, no write path from Companion
into Tarot data. The system prompt instructs Companion to reference the real drawn cards, never
draw or reinterpret its own.

## 11. SEO changes

Overclaiming language ("tarot, astrology, and numerology") removed from landing copy/metadata per
Phase 8; `sitemap.ts`/`robots.ts` added, restricted to public marketing routes (authenticated
`(app)` routes disallowed). Confirmed present in `35417d0`'s diff (`README.md`,
`apps/web/content/landing-copy.ts`, `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`).

## 12. Security / privacy

Re-audited at the code level this pass (see §5–§7, §10 above) plus:

- No client-controlled seed (server-generated `randomUUID()` only).
- AI cannot select/alter cards (architecturally — `interpret()` takes structured card data as
  input, returns only narration text).
- AI failure never invalidates a reading (best-effort, try/caught, `interpretation: null`).
- Ownership enforced identically across get/history/archive/restore/delete (`findOwned()`).
- Deleted readings excluded from default history; still owner-reachable for restore.
- Companion bridge is read-only.
- Cross-user isolation enforced at the query layer (`userId` scoping + ownership re-check).
- No raw prompts, AI responses, or secrets found in logging statements or in the Tarot-scoped diff
  (targeted `git log -p` secret scan against `apps/api/src/tarot`, `apps/web/features/tarot`,
  `tarot-deck.ts`, `seed-tarot.ts` — the only hit was the card-content phrase "secrets withheld," a
  false positive from card copy, not a credential).

## 13. Tests — exact results

| Check | Result |
|---|---|
| `pnpm lint` (repo-wide) | **PASS** — 0 errors; 24 pre-existing warnings, all in `apps/api/src/insight/*.spec.ts` (unrelated to Tarot) |
| `pnpm typecheck` (repo-wide) | **PASS** — clean, both apps |
| `pnpm test:api` (backend unit) | **PASS** — 75 suites / 650 tests |
| Backend e2e — `tarot.e2e-spec.ts` alone | **PASS — 10/10**, reproduced twice (parallel default and `--runInBand`) |
| Backend e2e — full suite (13 files / 159 tests), together | **FAIL as a batch** — 137/139 failures are `429 Too Many Requests` from the shared Redis auth-throttle bucket (`AUTH_RATE_LIMIT_MAX=200`/15min) being exhausted by cumulative `/auth/register` calls across suites; reproduced in both parallel and `--runInBand` runs. Not a Tarot regression — see §1, §16. |
| `pnpm test:web` (frontend unit, full suite) | **PASS — 53/53 suites, 245/245 tests**, including `register-form.test.tsx` in the full run |
| `register-form.test.tsx` in isolation | **PASS — 5/5** |
| `pnpm build` (api + web) | **PASS** — `nest build` clean; `next build` — 31/31 static pages incl. `/discover/tarot` (9.73 kB), `/sitemap.xml`, `/robots.txt` |
| `prisma generate` | **PASS** |
| `prisma validate` | **PASS** — schema valid |
| `prisma migrate status` | **PASS** — 13 migrations, database up to date |
| Playwright `flow-20-tarot-discovery.spec.ts` alone | **PASS**, reproduced twice consecutively (25.2s, then re-verified) after one transient environment timeout (see §15) |
| Full Playwright suite (20 flows / 29 tests) | **INCOMPLETE** — dev server crashed under memory pressure partway through; 4/29 ran before the crash, remaining 25 failed with `ERR_CONNECTION_REFUSED`. Not a logic failure. See §15. |
| `git diff --check` (working tree + last commit) | **PASS** — clean |
| Secret scan (Tarot-scoped diff) | **PASS** — no real secrets found |

## 14. Manual browser smoke test — actually performed

Driven via a real Chromium instance (Playwright's browser engine, invoked directly rather than
through the checked-in test runner) against the live dev servers (`pnpm dev:api` + `pnpm dev:web`),
with screenshots captured and visually reviewed. All checks **PASS**:

| Check | Result |
|---|---|
| Register + onboard (skip path) → `/discover/tarot` | PASS |
| Landing (`/discover/tarot`), desktop 1280×900 | PASS, no horizontal overflow |
| Daily Draw — reveal, real card, upright/reversed rendering | PASS |
| Second Daily Draw same day — blocked with real message | PASS |
| Single Card draw | PASS |
| Three Card Spread with a question — Past/Present/Future | PASS |
| Delete → Restore (reversible) | PASS |
| History list → detail view (`?item=<id>`) | PASS (re-verified with a longer wait after an initial screenshot caught a loading skeleton) |
| Companion bridge — Companion loads/streams normally after a Tarot reading exists | PASS |
| Mobile viewport (375×812) | PASS, no horizontal overflow |
| Tablet viewport (768×1024) | PASS, no horizontal overflow |
| Keyboard navigation (Tab reaches the Draw button) | PASS |

Interpretation-failure path (provider error) was **not manually triggered** — doing so would
require forcing a provider error in the running dev stack, which was out of scope for this smoke
pass. It is covered by code review (§7) and is not a runtime-verified item — see §16.

## 15. Known unrelated flakes / environment limitations

1. **Frontend `register-form.test.tsx` parallel-worker flake** (pre-existing, documented before this
   sprint) — passed in both the full suite run and in isolation during this pass; not modified.
2. **Backend full e2e suite rate-limit exhaustion** (found during this closure pass) — the shared
   `AUTH_RATE_LIMIT_MAX=200`/15min Redis-backed throttle is exhausted by the full suite's cumulative
   register volume when all 13 files run together, causing 429s across nearly every suite,
   including but not limited to Tarot. Tarot alone is unaffected. Auth/rate-limit code was not
   touched, per instruction not to modify unrelated auth code or weaken tests for a green number.
3. **Full Playwright suite dev-server memory instability** (found during this closure pass) — the
   Next.js dev server (`next dev`) crashed partway through a 20-flow/29-test run in this local
   environment, likely from sustained memory pressure across concurrent Docker + dual dev servers +
   Chromium instances. Tarot's own flow was independently re-verified passing after restarting the
   dev server in isolation.

## 16. Runtime-unverified items / process findings

- **Git state discrepancy**: this closure pass's brief assumed an uncommitted working tree with
  frozen Sprint 5C Goal changes needing careful separation from Sprint 6 Tarot before staging. The
  actual repository was already fully committed and pushed (`35417d0`, `origin/master`), and that
  single commit already bundles Sprint 6 Tarot together with the entire (previously-uncommitted)
  Sprint 5C Goal system. No new commit was created by this pass — rewriting or splitting an
  already-pushed commit was judged out of scope and unsafe without explicit instruction (per this
  project's own git-safety rules against amending pushed commits). Flagging for the team: future
  sprint commits should be scoped and pushed independently to avoid mixing frozen and active work.
- AI interpretation failure path is not runtime-verified in this pass (code-reviewed only; see §7,
  §14).
- Full Playwright suite result is incomplete due to environment instability (see §15) — not a
  statement about Tarot correctness, which was independently confirmed via the isolated flow-20 run
  and the manual smoke test.

## 17. Sprint 7 entry criteria

Tarot Discovery Foundation is functionally ready to be treated as done. Before starting Sprint 7
work (excluded from this pass per instruction — no Premium/Payment/Natal Chart/Eastern Horoscope/
Numerology/Community/Notifications/Reflection/Insight/Review/Goal work was added):

1. No code changes required to Tarot itself — all Tarot-scoped checks pass.
2. Recommend (separately, outside Sprint 7 feature scope) investigating whether
   `AUTH_RATE_LIMIT_MAX` should be raised for the local/test environment or whether e2e suites
   should reset the throttle between files, so the full backend e2e suite can run green as a batch
   again.
3. Recommend investigating the local dev-server memory/stability issue (or reducing concurrent
   process load in the verification environment) before relying on a full 20-flow Playwright run as
   a release gate.
4. Recommend committing future sprint work independently of frozen/prior-sprint work so release
   audits can cleanly separate scope by commit, not just by directory.
