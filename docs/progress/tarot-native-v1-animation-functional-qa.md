# Tarot Native V1 - Animation + Functional QA

Date: 2026-10-14 (Asia/Bangkok)
Baseline: feat/mobile-v1-full-parity at 75bc6e3; working tree initially clean.

## Scope

Mobile only. No web, backend, authentication, dependency or API contract changes.
The backend selection token and selected positions remain the only draw inputs;
card identities, orientation and interpretation are rendered from its response.

## Implementation

- Native-driver shuffle loop while requesting a selection session.
- Selected card lift; sequential reveal at 520 ms intervals with 420 ms flips.
- Reduced Motion defaults on until the system preference is known and tracks
  preference changes. It skips transforms and reveal delays.
- Animation and reveal timers are stopped on cleanup.
- Synchronous request lock prevents concurrent draw and record mutations.
- Every draw failure discards the one-use selection token, including ambiguous
  network failures; a fresh shuffle is required, with no automatic draw retry.
- History requests discard stale responses after switching filters.

## Automated coverage

Native screen tests mock the Tarot API boundary: expired/used selection tokens,
network failure, draw limit rejection, selection-session failure, history filters,
archive, confirmed soft deletion, restoration, reading/interpretation API errors,
and stale history responses. Existing API tests check draw payload and positions.
Animation tests exercise reveal timing, immediate Reduced Motion behavior,
system preference changes and listener cleanup.

## Acceptance still required

- iOS/Android device visual QA: shuffle, selection, three-card sequence, reversed
  artwork, screen reader behavior, performance and Reduced Motion toggled live.
- Integration against a non-production backend: genuine token expiry/reuse,
  enforced draw limits, offline/reconnection, archive/delete/restore persistence.
- These are local mocked functional tests, not device or live backend E2E evidence.

No commit, push, Actions, merge or deployment performed.

## Local verification

- `pnpm --filter @beaconvie/mobile typecheck`: passed (exit 0).
- `pnpm --filter @beaconvie/mobile test --runInBand`: passed; 7 suites,
  47 tests; no snapshots; 121.115 seconds.
- `git diff --check`: passed; Git reports its existing LF/CRLF conversion policy.
- `pnpm --filter @beaconvie/mobile lint`: passed (exit 0); 0 errors,
  3 pre-existing array-type warnings in settings.tsx, screen.tsx and feature-grid.tsx.

## Correction Pass 1 - 2026-10-14

Starting branch and HEAD were unchanged: feat/mobile-v1-full-parity / 75bc6e3.
All five uncommitted checkpoint files were retained and updated in place;
no reset, commit, push, Actions, merge or deployment was performed.

### Corrections

- Each card now has separate back/front surfaces with hidden backfaces.
  Before its turn, the back remains at 0 degrees; the back rotates to -180
  degrees and the front from 180 to 0 degrees over two 210 ms phases.
  Backend content mounts only at the midpoint. Card intervals remain 520 ms.
- Reduced Motion completes waiting or active reveals immediately. Revealed
  state is sticky, so disabling it cannot hide or replay an existing card.
  Ordinary rerenders do not restart pending or completed reveals.
- Interpretation uses delayed content without an artificial extra card face.
- Cleanup cancels waiting timers, stops active animations and prevents callbacks
  after unmount. System preference listeners are removed and stale initial
  preference responses cannot override a newer preference event.
- History has filter-scoped loading, ready/empty and error states with retry.
  Old rows are hidden while loading/error; stale success/error responses are
  discarded, including requests invalidated by cleanup.
- Successful draws switch to ACTIVE without a redundant fetch of that filter.
- Stateful mock history tests prove disappearance from ACTIVE after archive,
  appearance in ARCHIVED, restoration to ACTIVE, disappearance after soft
  deletion, appearance in DELETED, and restoration again. Confirmation and
  cancellation of deletion have separate assertions.

### Final local checks

- ESLint: exit 0; 0 errors, 3 existing array-type warnings in settings.tsx,
  screen.tsx and feature-grid.tsx. No new warnings in corrected files.
- TypeScript: exit 0.
- Full mobile Jest: exit 0; 7 suites / 60 tests passed, 38.829 seconds.
- git diff --check: exit 0; existing Git LF/CRLF policy warning only.
- Animation assertions use a controlled Animated mock: three-card ordering,
  full visible backs before reveal, exact flip endpoints, pending timer
  cancellation, active animation cleanup, Reduced Motion before/during/after
  reveal, ordinary rerenders, shuffle/spring cleanup and preference listener.

### Post-correction static code review

LOCAL CODE REVIEW PASS. No remaining Critical, High, Medium or Low findings
in the corrected scope. The five findings from the prior review are addressed:

- Full back and two-face flip: tarot-motion.tsx, Reveal and surface styles.
- Sticky Reduced Motion behavior: Reveal state and completion guard.
- Lifecycle assertions: tarot-motion.test.tsx.
- Stateful record/filter assertions and cancel path: tarot-screen.test.tsx.
- Loading/error/empty distinction and retry: tarot.tsx history request/render.

Reviewed token invalidation and request lock as well: backend results and API
payloads remain unchanged. This was a separate static review pass by the same
implementation agent, not a second independent reviewer. The previous
review findings were used as the correction checklist.

Native Visual PASS and Backend E2E PASS are not claimed. Device rendering,
real animation performance and genuine backend lifecycle/error behavior still
require the acceptance checks above.
