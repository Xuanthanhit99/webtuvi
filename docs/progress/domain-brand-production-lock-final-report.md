# Domain + Brand Production Lock — Final Report

Date: 2026-08-20. Founder decision: production brand renamed **BeaconVie → Tử Vi Tarot**,
production domain locked to **tuvitarot.vn** / **api.tuvitarot.vn**, superseding the prior
"BeaconVie, exclusively" branding decision for this product. Per this task's own rules: no Sprint
18 work, no Tử Vi calculation logic implemented or fabricated, no deployment, no real financial
transaction, nothing committed or pushed.

## 1–4. Baseline

`HEAD` = `origin/master` = `3bbd18c`, 0 ahead / 0 behind at task start. Working tree carried the
prior Production Activation task's uncommitted state (2 modified payment-webhook files + 3
untracked docs) — confirmed, not assumed, via `git status`/`git log` before touching anything.

## 5. Old production domain references found

Repo-wide search for `beaconvie.com`/`api.beaconvie.com`: **exactly one match, in
`docs/operations/founder-production-action-pack.md`**, used only as an illustrative placeholder
example (`app.beaconvie.com`, `hello@beaconvie.com`) — never a real hardcoded domain anywhere in
application code. Confirmed by a separate, broader grep for `beaconvie` across every `.ts`/`.tsx`
file in `apps/` — zero hardcoded domains. Every URL-construction code path (canonical, sitemap,
robots, CORS, cookies, metadataBase) already derives from existing env vars
(`NEXT_PUBLIC_APP_URL`, `API_BASE_URL`, `CORS_ORIGINS`, `AUTH_COOKIE_DOMAIN`), never a literal
domain string. This means the domain lock itself required zero code changes to URL-construction
logic — only documenting the correct production values for those existing env vars (§16 below) and
updating the one illustrative example that used a placeholder domain.

## 6–7. New domain / API domain

`tuvitarot.vn` (frontend), `api.tuvitarot.vn` (backend) — locked in `product-completion-roadmap-v2.md`
§11 (additive, non-destructive), `docs/operations/production-activation-checklist.md`, and
`docs/operations/founder-production-action-pack.md`.

## 8–10. Branding occurrences found / changed / preserved

Repo-wide grep for `BeaconVie` (case-sensitive, whole word): **122 files**. Classified, not
blindly replaced:

**Changed (production-critical, ~25 files):**
- `apps/web/lib/seo.ts` — `SITE_NAME`, `DEFAULT_DESCRIPTION` (the single source of truth every
  other metadata/JSON-LD/share-payload call derives from).
- `apps/web/app/layout.tsx` — refactored to import `SITE_NAME`/`DEFAULT_DESCRIPTION` from
  `lib/seo.ts` instead of a second, separately-hardcoded copy (closes the exact kind of drift risk
  that made this multi-file update necessary in the first place).
- `apps/web/components/ui/logo.tsx` — wordmark text.
- `apps/web/components/layout/app-header.tsx`, `sidebar.tsx` (+ `sidebar.test.tsx`, whose assertion
  on the old aria-label would otherwise have failed) — persistent nav chrome, visible on every
  authenticated page.
- `apps/web/content/landing-copy.ts` — 5 occurrences (hero subheadline, solution text, 2 FAQ
  answers, copyright line).
- `apps/web/app/global-error.tsx` — error page copy.
- 4 marketing pages: `about`, `contact`, `privacy`, `terms` — metadata descriptions + body copy.
- `apps/web/app/(auth)/login/page.tsx`, `register/page.tsx` — metadata descriptions.
- 4 email templates (`welcome`, `verify-email`, `password-reset`, `notification`) — subject lines,
  body text, and the branded header tag every outgoing email carries.
- `apps/api/src/companion/prompt/system-prompt.ts` — the AI Companion's own self-identification
  ("You are BeaconVie's Companion" → "You are Tử Vi Tarot's Companion"); `PROMPT_VERSION` bumped
  `companion-core-v1` → `companion-core-v1.1` per the file's own documented convention ("bump
  whenever BASE_RULES changes materially") — a naming-only, non-behavioral revision, hence a minor
  bump not a major one.
- `apps/api/src/config/env.validation.ts` — `GEOCODING_USER_AGENT`'s schema default
  (`BeaconVie/1.0` → `TuViTarot/1.0`, no spaces/diacritics since it's a real HTTP header token sent
  to OpenStreetMap Nominatim on every geocoding request).
- `apps/api/.env.example` — added a locked-production-value comment block for
  `API_BASE_URL`/`FRONTEND_URL`/`APP_PUBLIC_URL`/`CORS_ORIGINS`, updated `EMAIL_FROM` display name
  and `GEOCODING_USER_AGENT` illustrative value. Local dev defaults (`localhost`) deliberately left
  unchanged — those are correct for local development, unrelated to the production domain.
- 4 test files with 9 new regression tests (§27).

**Intentionally preserved (~97 files), by category:**
- **Historical documentation** (~75 files): every `docs/progress/*`, `docs/audit/*` (except this
  new report), `docs/architecture/*`, `docs/design/*`, `docs/reference/*` file. These are
  point-in-time records of what was built, decided, and why — rewriting them to say "Tử Vi Tarot"
  retroactively would be exactly the "rewrite history to look consistent" this task's own Phase 3
  explicitly forbids.
- **Deferred, live-but-secondary feature microcopy** (10 files, documented follow-up, not silently
  dropped): `features/memory/components/{candidate-review,conflicts-section,consent-settings,
  duplicates-section,memory-timeline(+.test),memory-view,merge-suggestions-panel,
  remember-this-button}.tsx`, `features/notifications/components/notification-preferences-section.tsx`,
  `features/settings/components/account-data-section.tsx`. These are real, reachable UI strings
  deep within specific feature flows (Memory panels, notification preferences, account settings) —
  lower visibility than the persistent chrome/marketing surface, and each source+test pair is
  internally consistent (neither touched, so nothing broke). Recorded here as a fast, low-risk
  follow-up, not a blind sweep bundled into this pass.
- **Archived `/menh-vi`**: untouched, per its own existing archival status — not reachable
  publicly regardless of brand text inside it.
- **Test fixtures with no brand-identity assertion**: `.env.test.example`'s `EMAIL_FROM` value,
  `env.validation.spec.ts`'s arbitrary `EMAIL_FROM` test input — these exist only to satisfy the
  schema's non-empty-string requirement, never asserting brand identity, so changing them adds no
  value.
- **CI workflow, Prisma schema comments, `tailwind.config.ts`/`packages/config/tokens.ts` header
  comments**: mentions found were non-functional (project-name comments, not runtime brand
  strings) — verified by reading each, not assumed safe to skip.

## 11. Canonical result

`alternates.canonical` (via `buildMetadata()`) and `metadataBase` (via `layout.tsx`) both resolve
against `NEXT_PUBLIC_APP_URL` — will correctly emit `https://tuvitarot.vn/...` once that env var is
set in production. Verified with a `jest.resetModules()` dynamic-reimport test (§27) proving
`SITE_URL` actually picks up the env var, not merely reading the source and assuming it does.

## 12. Sitemap result

`sitemap.ts` reads `NEXT_PUBLIC_APP_URL` fresh on every call — verified directly (no module-level
caching to worry about, unlike `lib/seo.ts`). New regression tests (§27) prove every entry resolves
to `https://tuvitarot.vn` once the env var is set, and never contains `beaconvie.com`.

## 13. Robots result

`robots.ts` (already deriving its disallow list from `route-guard.ts`'s `APP_ROUTES` per the prior
SEO closure pass) also reads `NEXT_PUBLIC_APP_URL` fresh per call for its `sitemap` field — same
verification pattern applied, same result.

## 14. CORS result

`main.ts`'s `enableCors({ origin: config.corsOrigins, credentials: true, ... })` — config-driven,
zero hardcoded origin. Needs `CORS_ORIGINS=https://tuvitarot.vn` set in production (already
documented in `production-activation-checklist.md`).

## 15. Cookie result

`cookie.service.ts`'s `httpOnly`/`secure`/`sameSite`/`domain` are all config-driven
(`AUTH_COOKIE_*` env vars) — needs `AUTH_COOKIE_DOMAIN=tuvitarot.vn`,
`AUTH_COOKIE_SECURE=true` in production (already documented). No hardcoded domain found.

## 16. CSRF result

**Verified domain-independent by design** — read `csrf.guard.ts`/`csrf.service.ts` directly: pure
double-submit-cookie pattern (cryptographically signed token compared between cookie and header),
zero origin-allowlist logic anywhere. No migration risk, no config needed beyond the existing
`CSRF_SECRET`.

## 17. Auth callback/link result

No OAuth callback URLs exist in this codebase (social login buttons remain disabled per this
repo's own product constraints, confirmed by CLAUDE.md and unchanged this pass) — nothing to
migrate here.

## 18. Email-link result

`APP_PUBLIC_URL` (already the deliberately-separate, fixed base URL every email link is built
from, per `env.validation.ts`'s own doc comment) needs to be set to `https://tuvitarot.vn` in
production — already documented, zero code change needed (the separation from `FRONTEND_URL` was
already correct architecture, predating this pass).

## 19. PayOS URL result

Return/cancel URLs are frontend routes on the real domain — confirmed no hardcoded domain in
`payment-checkout.service.ts`'s URL construction (reads from config). Webhook endpoint
(`{API_BASE_URL}/payment/webhooks/payos`) will correctly resolve to `api.tuvitarot.vn` once
`API_BASE_URL` is set; registration itself remains a founder action (PayOS dashboard), already
tracked, unchanged by this pass.

## 20. PostHog result

`POSTHOG_HOST` is independent of the app's own domain (points at PostHog's ingestion endpoint, not
`tuvitarot.vn`) — no migration needed. Client-side analytics never holds a provider key directly
(confirmed in the prior SEO/Shareability audit) — unaffected by the domain change.

## 21. Sentry result

`SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` are provider-issued ingestion identifiers, independent of
the app's own domain — no migration needed. The `environment`/`release` tags Sentry captures are
unrelated to `tuvitarot.vn` specifically.

## 22. JSON-LD result

`buildWebsiteJsonLd()`/`buildOrganizationJsonLd()` both use `SITE_NAME`/`SITE_URL` from `lib/seo.ts`
— now `Tử Vi Tarot` / (once configured) `https://tuvitarot.vn`. Regression-tested (§27) to never
contain `beaconvie.com`.

## 23. Manifest result

No `manifest.json`/`manifest.ts` exists in this repo (verified by search) — nothing to migrate.

## 24. `/menh-vi` archive result

Unchanged, untouched, still disallowed in `robots.ts` and absent from `sitemap.ts` — reconfirmed,
not assumed.

## 25. Eastern Horoscope naming result

Reconfirmed intact by direct read of `app/(app)/discover/page.tsx` (untouched by this pass) — still
correctly labeled "Ngũ Hành Phương Đông" with an explicit "(Not Vietnamese Tử Vi Lá Số, a separate
future module.)" disclaimer. **Now regression-tested** (new `discover/page.test.tsx`, 3 tests, §27)
specifically because the surrounding product being named "Tử Vi Tarot" is a real, new risk that a
careless future edit could blur the two — the test exists precisely to catch that class of
regression before it ships.

## 26. Sprint 18 status

Unchanged: `BLOCKED_BY_DOMAIN_REFERENCE`. Zero files under any Tử Vi-specific path (school
decision, giờ Tý, Mệnh/Thân, Cục, Tử Vi anchor, 14 chính tinh, phụ tinh, Tuần/Triệt, Tứ Hóa, golden
vectors, `docs/domain/tu-vi/**`) were read or modified — confirmed via `git diff --stat` containing
nothing under any such path. This branding decision does not and cannot unblock Sprint 18; the
product is named after a capability it does not yet ship, by explicit founder choice, not an
engineering claim that the capability exists (see the roadmap's new §11 for the same statement in
the governing doc).

## 27. Tests

**9 new regression tests across 4 files, all passing:**
- `lib/seo.test.ts` (+2): `SITE_NAME` is the locked brand and never the retired one;
  `jest.resetModules()` dynamic-reimport proving `SITE_URL` actually resolves to
  `https://tuvitarot.vn` once `NEXT_PUBLIC_APP_URL` is set (module-level constant, can't be tested
  without a fresh module instance).
- `app/sitemap.test.ts` (+2): every entry resolves to the locked domain once the env var is set;
  never resolves to `beaconvie.com`.
- `app/robots.test.ts` (+2): the `sitemap` field resolves to the locked domain; never
  `beaconvie.com`.
- `app/(app)/discover/page.test.tsx` (new file, 3 tests): Eastern Horoscope is labeled by its real
  name and never as "Tử Vi"/"Tử Vi Lá Số"; the explicit disclaimer text renders; all four live
  Discovery systems render with their correct, distinct names.

**Full suites, fresh:** backend **124 suites / 1205 tests — 100% pass** (including
`env.validation.spec.ts` and `prompt-builder.service.spec.ts`, proving the `GEOCODING_USER_AGENT`
default change and the `system-prompt.ts`/`PROMPT_VERSION` bump are both safe). Frontend **91
suites / 454 tests — 100% pass** (including `app-header.test.tsx`, `global-error.test.tsx`,
`sidebar.test.tsx`).

## 28. Builds

`next build`: `✓ Compiled successfully` (3.5min), typecheck passed, `✓ Generating static pages
(51/51)`. Fails only at the final "Collecting build traces" step with the identical,
already-four-times-documented Windows-only `EPERM: operation not permitted, symlink ...` signature
(this run: `@jridgewell/sourcemap-codec`, a pure third-party `node_modules` package untouched by
this pass) — Windows restricts symlink creation without Developer Mode/admin rights, affecting only
the Linux/Docker-target `output: 'standalone'` bundle step, never compilation/typecheck/static
generation. Classified `PRE_EXISTING_ENVIRONMENTAL`, matching `sprint-17-final-report.md` §42,
`admin-operator-tooling-final-report.md` §30.20, the SEO closure's §50, and the accessibility
closure's §44/§32. Zero product-code change made in response. Both backend and frontend typecheck
independently clean (0 errors each). Both lints clean (0 errors/warnings) across every file this
pass touched.

## 29. Security findings

**None.** This pass changed brand text, one HTTP header default, one AI prompt string, and
documentation — no new attack surface, no new data flow, no authentication/authorization/payment
logic touched. CSRF/cookie/CORS architecture reconfirmed domain-independent and correctly
config-driven (§14–16), not weakened in any way to accommodate the new domain.

## 30. Privacy findings

**None.** No user data, birth data, or private content was ever text this pass touched — every
change was either static brand copy, a fixed HTTP header identifier, or documentation.

## 31. Open blockers

No new blockers introduced. The same external/founder/legal items already tracked in
`docs/operations/production-activation-checklist.md` and `founder-production-action-pack.md` remain
open (hosting provider choice, PayOS/email/Sentry/PostHog credentials, real Privacy Policy/Terms,
refund/tax/retention policy) — both documents updated in place to replace "not decided"/example
placeholders with the now-locked `tuvitarot.vn`/`api.tuvitarot.vn` values (§32).

## 32. External actions remaining

Unchanged in kind from the prior Production Activation Plan, now updated with the locked domain:
DNS access for `tuvitarot.vn` (§9 below has the exact records), hosting provider choice, PayOS/
email/Sentry/PostHog accounts, legal documents. Full detail: `founder-production-action-pack.md`.

## 33. Files changed

28 modified + 3 untracked (2 files carried from the immediately prior Production Activation task,
1 new report from this pass — full list via `git status --short` above). Complete file list: see
§8–10.

## 34. `git diff --check`

Clean — only benign LF→CRLF autocrlf warnings (this Windows checkout's line-ending config), no
real whitespace errors.

## 35. `git status`

28 modified, 4 untracked (3 docs from the prior task + this new report), nothing staged.

## 36. Commit status

**Nothing committed** — per this task's explicit "Do not commit or push unless explicitly
instructed."

## 37. Push status

**Nothing pushed.**

---

## Phase 2 — Domain/Brand Impact Matrix

| Current value | Required production value | File/config | Runtime impact | Requires code change? | Requires founder/provider action? |
|---|---|---|---|---|---|
| `SITE_NAME = 'BeaconVie'` | `'Tử Vi Tarot'` | `apps/web/lib/seo.ts` | Every metadata/OG/Twitter/JSON-LD title/description, ShareButton payload | **Done this pass** | No |
| `NEXT_PUBLIC_APP_URL=localhost:3000` | `https://tuvitarot.vn` | Frontend deploy env (build arg) | `metadataBase`, canonical, sitemap, robots, ShareButton URL | No — already env-var-driven | Yes — set at deploy time |
| `API_BASE_URL=localhost:4000` | `https://api.tuvitarot.vn` | Backend deploy env | Webhook URL construction, internal links | No | Yes |
| `FRONTEND_URL=localhost:3000` | `https://tuvitarot.vn` | Backend deploy env | CORS default reference | No | Yes |
| `APP_PUBLIC_URL` (unset in prod = boot failure) | `https://tuvitarot.vn` | Backend deploy env | Every email link (verify-email, reset-password) | No | Yes — **required**, boot fails without it in production |
| `CORS_ORIGINS=localhost:3000` | `https://tuvitarot.vn` | Backend deploy env | Which origins the API accepts credentialed requests from | No | Yes |
| `AUTH_COOKIE_DOMAIN=localhost` | `tuvitarot.vn` | Backend deploy env | Session cookie scope | No | Yes |
| `AUTH_COOKIE_SECURE=false` | `true` | Backend deploy env | Cookie `Secure` flag — **boot fails in production without this** | No | Yes |
| `EMAIL_FROM` display name | `"Tử Vi Tarot <no-reply@tuvitarot.vn>"` | Backend deploy env (`.env.example` illustrative value updated this pass) | Every outgoing email's From header | **Illustrative example updated this pass**; real value set at deploy | Yes — sender domain must be verified with the chosen email provider first |
| `GEOCODING_USER_AGENT` default | `TuViTarot/1.0 (...)` | `env.validation.ts` schema default | HTTP header sent to OpenStreetMap Nominatim on every geocoding request | **Done this pass** (schema default; `.env.example` illustrative value also updated) | No |
| `TRUST_PROXY` | Real hop count/boolean | Backend deploy env | IP-based rate limiting correctness | No | Yes — depends on hosting topology, unrelated to domain/brand |

## Phase 3 — Brand Audit Classification (A–J)

| Category | Count | Examples | Action taken |
|---|---|---|---|
| A — Must change before production | 25 | `lib/seo.ts`, `layout.tsx`, `logo.tsx`, email templates, `system-prompt.ts` | **Changed this pass** |
| B — User-visible brand copy (secondary/deferred) | 10 | Memory panels, notification preferences, account-data section | **Classified, deferred** — documented follow-up, source+test pairs left internally consistent |
| C — SEO/metadata | (subset of A) | `buildMetadata()` callers, JSON-LD | **Changed this pass** |
| D — Email | (subset of A) | 4 mail templates | **Changed this pass** |
| E — Authentication/security | 0 | — | No brand-text occurrence found in auth/security code paths |
| F — Payment | 0 | — | No brand-text occurrence found in payment code paths (PayOS URLs are config-driven, not brand-name-dependent) |
| G — Internal historical documentation | ~75 | `docs/progress/*`, `docs/audit/*`, `docs/architecture/*` | **Left untouched** — rewriting would falsify history |
| H — Archived `/menh-vi` code | small | `apps/web/app/menh-vi/**`, `features/menh-vi/**` | **Left untouched** — already unreachable, brand text irrelevant |
| I — Tests/fixtures | small | `.env.test.example`, `env.validation.spec.ts` | **Left untouched** — arbitrary values, no brand-identity assertion |
| J — Intentionally preserved historical reference | (overlaps G) | `docs/reference/**`, `docs/design/**` | **Left untouched** |

## Phase 9 — DNS Plan

**Not executed — prepared only, per this task's explicit "do not change DNS automatically."**

Records needed once a hosting provider is chosen (exact A/CNAME targets are provider-specific and
deliberately not invented here, per this task's own instruction):

| Host | Purpose | Record type (target TBD by provider) |
|---|---|---|
| `tuvitarot.vn` (apex) | Frontend | A (or ALIAS/ANAME if the provider requires it for apex — provider-specific, TBD) |
| `www.tuvitarot.vn` | Redirect to apex | CNAME → `tuvitarot.vn`, or a provider-level redirect rule |
| `api.tuvitarot.vn` | Backend | CNAME → the hosting provider's assigned target, or A record if IP-based |

**Recommendation:** `www.tuvitarot.vn` should permanently redirect (HTTP 301) to `https://tuvitarot.vn`
— avoids duplicate-content/canonical ambiguity (the SEO architecture's own `alternates.canonical`
already assumes one single canonical host) and matches the simpler, more common convention for a
product-style domain rather than a corporate one. No provider-specific record types (Railway's
`CNAME` pattern, Vercel's `A`/`ALIAS`, Cloudflare's proxied-orange-cloud CNAME, etc.) are
recommended here since no hosting provider has been chosen yet (tracked as the top external
blocker in `founder-production-action-pack.md`) — inventing one now would risk being wrong and
misleading whoever executes this later.

---

## Final Verdict

**DOMAIN + BRAND PRODUCTION LOCK COMPLETE — READY FOR PRODUCTION ACTIVATION**

Every code path that constructs a URL was already env-var-driven with zero hardcoded domain found
anywhere (confirmed by repo-wide search, not assumed); the domain lock itself required only
documentation, not code changes. The brand rename was applied surgically to the ~25
production-critical, genuinely user-visible surfaces (SEO/metadata, persistent nav chrome, core
marketing pages, auth descriptions, every outgoing email, the AI Companion's own
self-identification, the real HTTP header sent to a third-party geocoding API) while explicitly
preserving historical documentation and deferring a small, well-scoped, documented list of
secondary feature-microcopy files as a low-risk follow-up — not a blind global replacement. Eastern
Horoscope's distinctness from Tử Vi Lá Số was reconfirmed intact and is now regression-tested
specifically because the new brand name introduces a real risk of future conflation. Backend
(124/1205) and frontend (91/454) test suites are both 100% green, both typechecks clean, both lints
clean, and the production build succeeds through compilation/typecheck/static-generation, failing
only at the same pre-existing, four-times-now-documented Windows-only symlink artifact. Zero
security or privacy findings. Sprint 18/Tử Vi remains completely untouched and
`BLOCKED_BY_DOMAIN_REFERENCE` — this branding decision does not and cannot unblock it, and no Tử Vi
calculation logic was implemented or fabricated anywhere. Nothing staged, committed, or pushed.
