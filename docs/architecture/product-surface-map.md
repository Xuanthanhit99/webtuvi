# Product Surface Map

**As of:** Sprint 14 (Ambiguity Cleanup). **Purpose:** a single, current reference for which
routes exist, what they are, and why — so no route's status is left ambiguous. Supersedes
nothing; it's a new artifact this sprint produces per
`docs/product/product-completion-roadmap-v2.md` Sprint 14.

## Canonical brand

**BeaconVie**, exclusively. No other brand name is live in the product. "Mệnh Vi" exists only as
dead-but-preserved code under an archived, 404-returning route tree (see below) — never rendered
to a real visitor.

## Route classification

| Route | Classification | Notes |
|---|---|---|
| `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/login`, `/register` | **PUBLIC MARKETING** | In `sitemap.ts`; indexable. |
| `/onboarding` | **AUTHENTICATED PRODUCT** | Gated via `middleware.ts` + `route-guard.ts`. |
| `/dashboard`, `/companion`, `/journal(/*)`, `/discover(/*)`, `/settings`, `/memory` | **AUTHENTICATED PRODUCT** | Primary nav (`NAV_ITEMS`) surfaces Dashboard/Companion/Journal/Discover/Settings; Memory is reachable from Settings/Dashboard/Companion, not top-level nav, by design (Module 3 IA). |
| `/discover/tarot`, `/discover/numerology`, `/discover/natal-chart` | **AUTHENTICATED PRODUCT** | Real, shipped Discovery systems. Hub labels: Tarot, Thần Số Học, Bản Đồ Sao. |
| `/premium(/return)` | **AUTHENTICATED PRODUCT** | Code-complete; production payment activation is a founder/business-owned P0, tracked in the roadmap, not this sprint. |
| `/goals`, `/reflections`, `/insights(/internal)`, `/reviews(/:param)` | **FROZEN DIRECT-ACCESS** | Reflection/Insight/Review/Goal — fully implemented, code and data intact, untouched since Sprints 4B–5C. As of this sprint, no longer linked from Settings (their only prior entry point) or anywhere else in the live product. Reachable only by a visitor who already knows the URL; still auth-gated by `middleware.ts`/`route-guard.ts` exactly as before. |
| `/menh-vi`, `/menh-vi/*` (14 sub-routes) | **ARCHIVED** | Design-exploration prototype, never part of the BeaconVie shell. `middleware.ts` rewrites every request under this path to a genuinely unmatched path before Next's router runs, so the response is a real HTTP 404 (verified via `next start`), not merely a visually-blank page. Route files and their components (`apps/web/features/menh-vi/`) are preserved unmodified for future reuse — see `docs/design/menh-vi-reference-breakdown.md`. Excluded from `robots.ts`; was never in `sitemap.ts`. |
| Vietnamese Tử Vi Lá Số | **FUTURE** | No route, no code, no engine exists. Founder-greenlit as a separate future module — see `docs/product/vietnamese-tu-vi-product-definition.md`. Not to be confused with Eastern Horoscope. |
| Eastern Horoscope (`Ngũ Hành Phương Đông`) | **FUTURE** | Discover hub shows it honestly labeled "Coming soon," explicitly distinguished from Tử Vi Lá Số in its own card copy. No backend module exists yet (Roadmap V2 Sprint 17). |
| Reports, Community | **FUTURE / DEFERRED** | No code exists; no route exists. Not part of this sprint. |
| `/insights/internal` | **INTERNAL** (pre-existing, unchanged) | Reachable by direct URL only; not linked from anywhere in the product. Predates this sprint; not touched. |

## Frozen-module direct-route policy

**Option A — remain available but unlisted.** Chosen because:
- The existing Reflection/Insight/Review/Goal Playwright specs (`flow-15` through `flow-19`)
  navigate by direct `page.goto()`, not through the removed Settings link — a redirect or
  internal-only gate would have required rewriting release-blocking regression tests for a
  cleanup sprint whose own scope explicitly excludes touching those modules' implementation.
- Any user data already stored in Goal/Reflection/Review tables stays reachable to its owner via
  direct navigation, avoiding a data-access regression for existing users.
- Least destructive, fully reversible: re-adding a nav/Settings link is a one-line change if these
  modules are ever revived; nothing about their auth gating changed.

## `/menh-vi` disposition

**Archived (404), code and design assets preserved**, not deleted:
- `apps/web/app/menh-vi/**` (14 `page.tsx` files, `layout.tsx`, `not-found.tsx`) — dead-but-present
  route tree; unreachable in production via the `middleware.ts` rewrite (belt-and-suspenders: the
  layout's own `notFound()` call also fires if the rewrite is ever bypassed).
- `apps/web/features/menh-vi/**` — all components, mock data, and the `mv-*` Tailwind design
  tokens (`tailwind.config.ts`) are untouched and still compile/typecheck cleanly, available for
  reuse whenever the founder acts on the Vietnamese Tử Vi product definition.
- `docs/design/menh-vi-*.md` — left as historical design references, unmodified.

## Middleware / auth surface after cleanup

`middleware.ts`'s matcher now covers: marketing/auth routes, all `APP_ROUTES` from
`route-guard.ts` (unchanged), and `/menh-vi(/:path*)` (new, archival-only — no auth logic, just
the not-found rewrite, evaluated before any session fetch). No existing auth behavior changed;
`resolveRedirect()` and `APP_ROUTES` are untouched. No future Tử Vi route was created or opened.
