# @beaconvie/mobile

Mệnh Vi's mobile client (Expo + TypeScript + Expo Router), part of the BeaconVie pnpm workspace.
See the repo root `README.md`/`CLAUDE.md` for overall project context and Phase 01 scope.

## Get started

From the repo root:

```bash
pnpm install
pnpm dev:mobile
```

Or from this directory: `pnpm start` (then `a`/`i`/`w` for Android/iOS/web).

## Structure

- `src/app/` — Expo Router routes (file-based). `(tabs)/` holds the 5 primary destinations
  (mirrors `apps/web/components/layout/nav-items.ts`).
- `src/theme/` — design tokens and font loading, reconciled from the CURRENT web Home's actual
  styling (see `src/theme/tokens.ts`'s header comment).
- `src/components/` — shared primitives (cards, buttons, states, etc).
- `src/features/home/` — the Mobile Home screen composition.
- `src/lib/` — API client and auth session scaffolding (see `src/lib/auth/session-client.ts` for
  the current mobile-auth limitation).
- `scripts/generate-mobile-home-assets.mjs` — derives mobile-specific crops from the Web asset
  board without ever modifying the Web originals.
