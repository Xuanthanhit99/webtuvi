# Sprint 6 — Tarot Discovery Foundation: Progress / Audit

## Phase 0 audit

### Repository state at sprint start

`git status --short` confirms the working tree is unchanged from the end of the remediation-planning session: the uncommitted Sprint 5C Goal System changes (frozen, per this sprint's own direction — not touched, not extended, not deleted) plus the two new `docs/audit/` files. `git log --oneline -5` confirms HEAD is still `87ccd06` ("feat: complete Sprint 5B review engine"). No unexpected drift.

### Source of truth re-confirmed

- **Product Bible Module 12** (Tarot Experience): 10 reading types total, but Module 1's own MVP line specifies only **Daily Draw + 3-Card Spread**. Static, curated 78-card database (upright/reversed), deterministic random draw without replacement, positional metadata, no re-draw on Daily Draw, `POST /tarot/draw`, mandatory Companion-chat bridge, reflective/possibility-framed language only, single most-relevant Memory (never multiple) in interpretation.
- **`docs/audit/web-tu-vi-current-state.md`**: confirmed zero prior Tarot implementation of any kind.
- **`docs/audit/web-tu-vi-remediation-roadmap.md`**: Sprint 6 is exactly this sprint — Tarot only, Premium/Payment explicitly deferred to Sprint 7.
- **Frozen systems** (Reflection/Insight/Review/Goal): confirmed via `git status` that the uncommitted Goal System branch is left exactly as it was — this sprint adds a new, independent `tarot/` module and touches nothing under `reflection/`, `insight/`, `review/`, or `goal/`.

## Deliberate scope decisions (disclosed up front, same discipline as every prior sprint)

1. **Three reading types, not two.** The sprint brief (Phase 2) explicitly lists Daily Draw, Single Card, and Three-Card Spread as three distinct types, extending Module 12's own two-type MVP list by separating "Daily Draw" (rate-limited to once per UTC calendar day, no question required, the reflective daily ritual) from "Single Card" (on-demand, unlimited, optional question — a general-purpose one-card pull). Both draw exactly one card via the identical deterministic engine; only the rate-limit and default framing differ.
2. **No card artwork.** "Image metadata" (Phase 1) is implemented as a real, stable `imageSlug` field per card (e.g. `major-00-the-fool`) that a future asset pipeline can resolve — producing actual illustrated card art is a design/art production task, not a backend/data engineering task, and out of scope for this sprint. The frontend renders cards using typographic/symbolic treatment (card name, suit glyph, upright/reversed state) rather than illustration — consistent with Module 22's own "abstract, never literal fortune-teller iconography" design philosophy, so this is not a visual regression against the Bible, just a real disclosed content gap.
3. **Card meanings are original text grounded in traditional/public-domain Tarot knowledge** (the standard Rider-Waite-Smith-descended card meanings used across the entire industry), written fresh for this database — never copied from any single copyrighted source, never AI-generated, never a placeholder. All 78 cards carry real, distinct, researched upright and reversed meanings and keyword sets.
4. **`ReadingSession` is the deterministic-draw audit record**, not a UI "browsing session" concept — one row per `TarotReading`, storing the exact seed, shuffle algorithm version, and full shuffled deck order used, which is what makes the engine's "must be reproducible" requirement (Phase 2) independently verifiable after the fact, not just true at draw-time.
5. **The AI interpretation call reuses `companion/providers/` exactly as built** — no second provider abstraction, no new AI infrastructure. A narrow, Tarot-only prompt layer is added on top; the existing Safety detectors are reused rather than duplicated.
6. **No BullMQ** — per this sprint's own explicit out-of-scope list. AI interpretation is generated synchronously in the request path (a single non-streaming provider call), consistent with "no queue infrastructure exists yet" already disclosed in the remediation roadmap.

## Phase 1+ implementation log

Full design: `docs/architecture/tarot-discovery.md`.

- **Phase 1/3 — domain model**: migration `20260807080409_tarot_discovery` (6 enums, 5 tables,
  additive only). All 78 real cards + 3 spreads (`daily-draw`, `single-card`, `three-card-ppf`)
  seeded via `seed-tarot.ts`, verified: 78 unique slugs, 22 Major (numbers 0–21 all present), 14
  per Minor suit.
- **Phase 2 — draw engine**: `tarot-draw-engine.util.ts`, pure, `fisher-yates-mulberry32-v1`.
  11/11 unit tests passing (determinism, no duplicates, no out-of-pool cards, reproducibility,
  count-bounds rejection).
- **Phase 4 — AI interpretation**: `TarotInterpretationService` reuses `CompanionModule`'s
  `ProviderOrchestratorService`/`SafetyService` (newly exported for this purpose) and
  `MemoryModule`'s `MemoryRetrievalService` (at most one memory). Failure is non-blocking —
  `interpretation` stays `null` and can be retried.
- **Phase 5 — backend API**: `tarot.controller.ts`, 10 routes (deck list/get, draw, reading
  list/get/history/interpret/archive/restore/delete). Manual curl smoke test against the real dev
  DB confirmed: deck listing (78 cards), Daily Draw + generated interpretation, correct rejection
  of a second same-day Daily Draw, Three-Card Spread (3 unique cards, correct position labels),
  reading list totals.
- **Phase 6 — frontend**: `/discover/tarot` — draw panel (type selector, optional question,
  shuffling pacing state, real revealed result), reading view (cards, interpretation or retry
  action, status-gated lifecycle buttons), card detail dialog, history list, `?item=<id>` detail
  routing.
- **Phase 7 — Companion bridge**: `ConversationContext.latestTarotReading` (real card names +
  interpretation of the latest `ACTIVE`/`COMPANION_VISIBLE` reading, or `null`), surfaced in the
  system prompt with an explicit "Companion never draws/reinterprets" instruction. All 27
  companion tests passing after the required context-shape fixes.
- **Phase 8 — SEO**: removed "tarot, astrology, and numerology" overclaiming from landing copy/
  metadata/about page (replaced with real "a real Tarot draw" language); added `sitemap.ts` /
  `robots.ts` (public marketing routes only; all authenticated `(app)` routes disallowed).
- **Phase 9 — security review**: one real finding — the Daily Draw rate-limit check originally
  excluded `DELETED` readings, letting a user soft-delete today's Daily Draw and redraw. Fixed by
  making the check status-agnostic. Everything else (IDOR/ownership, no client-controlled seed,
  safety-check wiring, cross-user Companion-context leakage, XSS, mass-assignment, CSRF) confirmed
  sound.
- **Phase 10 — tests**: backend unit (`tarot-record.service.spec.ts` 8 tests,
  `tarot-deck.service.spec.ts` 7 tests, `tarot-draw-engine.util.spec.ts` 11 tests — 26 total, all
  passing); backend e2e (`tarot.e2e-spec.ts`, 10 tests against the real HTTP surface + real seeded
  DB, all passing — deck integrity, draw/interpretation, the fixed daily-draw-bypass regression,
  lifecycle, ownership/cross-user isolation); frontend component tests (`tarot-card-face`,
  `tarot-reading-view`, `tarot-draw-panel`, `tarot-dashboard` — 18 tests, all passing); Playwright
  `flow-20-tarot-discovery.spec.ts` (Daily Draw, Three Card, history, delete, Companion bridge —
  registers a fresh user rather than reusing the shared demo account, since Daily Draw's once-per-
  day rate limit would otherwise make the spec fail on any second run within the same UTC day).

  **A real bug found by Playwright, not caught by unit/e2e tests**: `TarotDrawPanel` held the
  just-drawn reading in local `useState` and passed it straight to `TarotReadingView` without an
  `onChanged` callback. Archiving/restoring/deleting that reading *did* call the real backend
  mutation (confirmed correct by the API-level tests), but the inline panel's own copy of the
  reading was never refreshed, so the UI kept showing the pre-mutation status/buttons after a
  successful action. Fixed in `tarot-draw-panel.tsx` by adding a `refreshResult()` handler
  (re-fetches the reading via `tarotApi.getReading` and updates local state) wired as
  `TarotReadingView`'s `onChanged` prop — mirrors the pattern `TarotReadingDetail` already used via
  `refetch()`. This is exactly the class of gap unit tests (which mock the API) and API e2e tests
  (which never render the component) cannot catch on their own.

## Definition of Done — results

| Check | Result |
|---|---|
| `pnpm --filter @beaconvie/api lint` | PASS — 0 errors (24 pre-existing warnings, all in `insight/`, unrelated to Tarot) |
| `pnpm --filter @beaconvie/api typecheck` | PASS — clean |
| `pnpm --filter @beaconvie/api test` (full suite) | PASS — 75 suites / 650 tests |
| `pnpm --filter @beaconvie/api test:e2e` (full suite) | PASS — 13 suites / 159 tests |
| `pnpm --filter @beaconvie/web lint` | PASS — clean |
| `pnpm --filter @beaconvie/web typecheck` | PASS — clean |
| `pnpm --filter @beaconvie/web test` (full suite) | 52/53 suites, 243/245 tests — one pre-existing, non-Tarot failure (`register-form.test.tsx`, 2 tests) that passes 5/5 in isolation; a parallel-worker flake, not caused by this sprint. All Tarot suites (4 suites, 18 tests) passed. |
| Playwright `flow-20-tarot-discovery.spec.ts` | PASS |
| `prisma validate` | PASS — schema valid |
| `prisma migrate status` | PASS — up to date, 13 migrations |
| `git diff --check` | PASS — no real violations (only benign CRLF/LF autocrlf warnings) |
| Secret scan (new/changed Tarot files) | PASS — no credentials found; one test-fixture password constant identical to existing `goal.e2e-spec.ts` convention |
| `pnpm build` (both apps) | PASS — `nest build` clean; `next build` compiled successfully, 31/31 static pages generated including `/discover/tarot` (9.72 kB), `/sitemap.xml`, `/robots.txt` |
