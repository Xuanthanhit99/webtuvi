# Sprint 14 — Ambiguity Cleanup — Progress Log

**Scope:** `docs/product/product-completion-roadmap-v2.md` Sprint 14. Goal: close every open
"indefinite limbo" item before any public-facing/SEO/Tử Vi work begins — archive `/menh-vi`,
hide the four frozen modules (Reflection/Insight/Review/Goal) from primary UX, correct stale
CLAUDE.md/README claims, and normalize Discover hub naming per
`docs/product/vietnamese-tu-vi-product-definition.md` §1. No Tử Vi, Eastern Horoscope, Reports,
or Community work; no data deletion; no migration.

## Baseline

- HEAD = origin/master = `50c0e93` (Sprint 13 production analytics foundation), 0/0 ahead-behind,
  clean working tree, both expected commits present, no merge/rebase/cherry-pick in progress.

## Audit findings

- `/menh-vi/*` (14 routes under `apps/web/app/menh-vi/`, backed by `apps/web/features/menh-vi/`)
  sat entirely outside `middleware.ts`'s matcher — publicly reachable, unauthenticated, own brand
  ("Mệnh Vi"), own design tokens (`mv-*` in `tailwind.config.ts`). No route linked it from the
  real product (nav, marketing pages, footer) — confirmed by grep across
  `apps/web/components/marketing` and `apps/web/app/(marketing)`.
- Frozen modules' only entry point anywhere in the live product was one "More tools" card on
  `/settings` linking to `/reflections`, `/insights`, `/reviews`, `/goals`. `NAV_ITEMS`
  (`apps/web/components/layout/nav-items.ts`) already listed only the 5 Bible-IA destinations —
  no frozen-module or `/menh-vi` link there. Dashboard has no frozen-module references.
- No `BeaconSoul` or other legacy brand string exists anywhere in the repo (excluding
  `node_modules`). "Mệnh Vi" is fully confined to `apps/web/app/menh-vi/` and
  `apps/web/features/menh-vi/`.
- CLAUDE.md's "the companion is rule-based, not an LLM" claim was stale since Sprint 2B (real
  OpenAI/Anthropic/Gemini provider, see `docs/architecture/companion-core.md`); the "Sprint 1"
  framing throughout was stale given 13 shipped sprints since.
- README.md's project-structure line for `companion/` and its "only Tarot is real" closing
  paragraph were both stale — Numerology (Sprint 8) and Natal Chart (Sprint 9) have since shipped.

## Implementation

1. **`/menh-vi` archival** — `apps/web/app/menh-vi/layout.tsx` now calls `notFound()`
   unconditionally; all 14 route files and every component under `apps/web/features/menh-vi/`
   (including the `mv-*` design tokens) are preserved, untouched.
   - **Correctness finding:** a layout-level `notFound()` renders the right UI but Next.js 15.5.22
     still serves these statically-generated routes with HTTP **200**, not 404 — confirmed against
     both `next dev` and a real `next start` production server (temporarily built without
     `output: 'standalone'` to work around this Windows host's separate, pre-existing symlink
     trace-copy limitation, already documented in `docs/progress/sprint-13-final-report.md`).
     Fixed by intercepting `/menh-vi` and `/menh-vi/:path*` in `middleware.ts` and rewriting to a
     genuinely unmatched path before Next's route resolution runs — verified this now returns a
     real 404 (`curl -o /dev/null -w '%{http_code}'` → `404`) while real routes are unaffected.
     The predicate (`isArchivedRoute`) lives in `lib/route-guard.ts` for unit testability, mirroring
     the existing `resolveRedirect` pattern.
2. **SEO** — `/menh-vi` added to `robots.ts`'s disallow list. `sitemap.ts` never listed it (no
   change needed there).
3. **Frozen modules hidden** — removed the "More tools" card from `apps/web/app/(app)/settings/page.tsx`.
   Routes, Prisma models, and data are untouched; direct URLs remain reachable (Option A: unlisted,
   not deleted, not redirected) — consistent with the existing Playwright specs for these modules,
   which navigate by URL, not through the removed link.
4. **Discover hub naming** — `apps/web/app/(app)/discover/page.tsx` now labels the four systems
   Tarot / Bản Đồ Sao / Ngũ Hành Phương Đông / Thần Số Học, matching
   `vietnamese-tu-vi-product-definition.md` §1 exactly; Eastern Horoscope's card copy explicitly
   states it is not Tử Vi Lá Số. `apps/web/e2e/flow-23-natal-chart-discovery.spec.ts` updated to
   match the new hub copy (destination page/route unchanged).
5. **CLAUDE.md** — corrected the Companion rule-based claim, the "Sprint 1" framing, and added
   brief current-state notes on `/menh-vi` and the frozen four for future coding agents.
6. **README.md** — corrected the `companion/` project-structure line and the "only Tarot is real"
   paragraph; added notes on the frozen four and `/menh-vi`'s archived status; softened the
   Sprint-1-pinned title/intro.

## Tests

- `apps/web/lib/route-guard.test.ts`: added coverage for `isArchivedRoute`.
- `apps/web/e2e/flow-26-ambiguity-cleanup.spec.ts`: new — landing brand check, `/menh-vi` +
  sub-route 404 check, Settings frozen-link absence + direct-route reachability, Discover naming.
- Full frontend unit suite: 74/74 suites, 369/369 tests passing.
- Lint/typecheck: clean.
- Production build: compiles, typechecks, and generates all 48 static pages cleanly; the
  `output: 'standalone'` trace-copy step fails with the same pre-existing Windows-only `EPERM`
  symlink limitation Sprint 13 already documented and verified fine under Docker — Docker is not
  available in this session to re-verify.

See `docs/progress/sprint-14-final-report.md` for the full closeout and
`docs/architecture/product-surface-map.md` for the resulting route inventory.
