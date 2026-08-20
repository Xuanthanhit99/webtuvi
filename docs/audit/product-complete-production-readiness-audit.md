# Product Complete — Production Activation & Final Readiness Audit

Date: 2026-08-20. Audit only — no feature implementation, no Sprint 18/Tử Vi work, nothing staged,
committed, or pushed. This session was interrupted once by a transport error mid-investigation
(see "Recovery result" below); no files had been written and no commands were left running at that
point, so this document is written fresh from the evidence already gathered before the
interruption, without re-deriving anything unnecessarily.

## Recovery result

The interrupted run had reached: git/runtime baseline recovered; governing docs read (roadmap,
deployment runbook, Sprint 17/Admin/SEO/Accessibility final reports); current `.env` verified
against the runbook's Sprint 13 claims (still accurate); the `PAYMENTS_ENABLED` string-coercion bug
confirmed already fixed; Privacy/Terms pages read and a real content-accuracy gap found; refund/
tax/retention docs confirmed absent; the external founder checklist confirmed still 100% unchecked;
payment webhook idempotency/signature code read and confirmed solid; `TRUST_PROXY` wiring in
`main.ts` confirmed correct — the last command that ran before the interruption. **Nothing was
lost**: no file had been written yet (`git status --short` was empty, `docs/audit/product-complete-
production-readiness-audit.md` did not exist), so this document proceeds by reusing that evidence
rather than re-reading everything from scratch, plus filling the remaining gaps (CORS/cookies,
observability signal sites) that hadn't been checked yet. 22 orphaned `chrome.exe` processes were
found running (no controlling Node/Playwright process), left untouched — not relevant to an
audit-only task that runs no Playwright.

## 1–4. Git / runtime baseline

`HEAD` = `origin/master` = `3bbd18c` ("fix: complete accessibility and product polish pass"), 0
ahead / 0 behind, working tree clean, nothing staged. `git diff --check` clean. Docker Desktop is
not running (`docker ps` fails to reach the daemon) and no API/web dev server is listening on
3000/4000 — this audit proceeds from code/config/docs, not a live-running stack, consistent with
this task's own emphasis on classification over fabricated runtime verification.

## 5. Current roadmap state

`product-completion-roadmap-v2.md` §10 ("Execution Resequencing") is the authoritative near-term
state: Sprints 13–17 shipped, Admin Operator Tooling (interim) shipped, and this session's own
history confirms SEO/Shareability and Accessibility/Product Polish have since also shipped and
closed (`fa1dad7`, `3bbd18c`) — the roadmap document's own body (§6, written before those two
closures) hasn't been mechanically updated to reflect it, and its Product Complete Gate checklist
(§7) still shows several already-completed items as unchecked (tablet nav fix, Eastern Horoscope
golden-vector verification) — a documentation-currency gap, not a real regression; the underlying
work is genuinely done, evidenced by the two most recent final reports.

## 6. Payment code status

**CODE_COMPLETE.** Read `payment-webhook.service.ts` directly: the full required pipeline (verify
signature → check idempotency → atomically transition order + grant entitlement → persist) is
implemented, with two independent idempotency layers (explicit duplicate-event check + a unique-
constraint-backed atomic transition that only fires on a still-`PENDING` order, making a
duplicate/retried webhook structurally unable to double-grant). Stale/late/mismatched webhooks are
explicitly handled (rejected + audited, not silently dropped or blindly applied). `PAYMENTS_ENABLED`
uses the corrected `zBooleanString` helper (the exact string-coercion bug this task's own §12 warns
about was found and fixed in Sprint 12 Release Closure — confirmed by reading `env.validation.ts`'s
own doc comment and the helper's current implementation, not merely trusting a report).

## 7. PayOS credential status

`PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` have non-empty values in the local `apps/api/
.env`, and `PAYOS_MOCK_CHECKOUT=true` locally. **Cannot be classified as real vs. placeholder-shaped
values without calling PayOS's real API — not attempted, per this task's explicit prohibition on
real financial actions without separate authorization.** `EXTERNAL_CREDENTIAL_REQUIRED` — matches
the deployment runbook's own §12 finding exactly, unchanged since Sprint 13.

## 8. Price sign-off

Not tracked anywhere in code (Premium pricing lives in product config, not something this audit
found evidence of a founder sign-off for). `FOUNDER_ACTION_REQUIRED` — listed on the roadmap's own
external checklist (`- [ ] Premium production price sign-off`), still unchecked.

## 9. Webhook registration

Not possible before a production domain exists (the webhook URL is `{API_BASE_URL}/payment/
webhooks/payos`, and `API_BASE_URL` is still `http://localhost:4000`). `DEPLOYMENT_CONFIRMATION_
REQUIRED`, blocked transitively on §14 (production domain).

## 10. Real payment runtime

**Never exercised against a real or sandbox PayOS endpoint in any session this audit could find
evidence of.** `REAL_RUNTIME_UNVERIFIED`. Not attempted this session either, per the explicit
prohibition on real financial actions.

## 11. Email status

`EMAIL_PROVIDER=mailpit` in `apps/api/.env` (dev-only SMTP capture). No `RESEND_API_KEY`/
`POSTMARK_SERVER_TOKEN` present in any `.env` file this audit could inspect. `env.validation.ts`
throws at boot if `EMAIL_PROVIDER=mailpit` in production, and throws if `resend`/`postmark` is
selected without its corresponding key — verified by reading the validation code directly (§200–
251 of `env.validation.ts`). **Code: CODE_COMPLETE (correct fail-closed behavior). Runtime:
EXTERNAL_CREDENTIAL_REQUIRED** — no real provider credential exists in any environment this audit
could check, unchanged since Sprint 13.

## 12. Sentry status

`SENTRY_DSN` absent from `apps/api/.env`. Capture call sites confirmed by direct grep (not assumed):
exactly two production-code locations call `Sentry.captureException`/`captureMessage` —
`common/filters/http-exception.filter.ts` (global, catches every unhandled 5xx) and `notifications/
scheduler/notifications-scheduler.service.ts` (scheduler-run failures) — plus the scrubbing utility
itself. The allowlist-based `beforeSend` scrubber (`sentry-scrub.util.ts`, already independently
verified in this session's Admin Operator Tooling audit) is wired to activate only once a DSN is
present. `CODE_COMPLETE, CONFIGURED_NOT_RUNTIME_VERIFIED` — no DSN, no project, never exercised
against a real Sentry ingestion endpoint in any environment this audit could find evidence of.

## 13. PostHog status

No `POSTHOG_API_KEY` anywhere. The analytics architecture (`lib/analytics.ts`, verified directly in
this session's SEO/Shareability audit) always sends events to BeaconVie's own backend first, which
alone decides whether to forward them — client code never holds a third-party key. Backend sink
selection not re-verified this session, but the deployment runbook's own §12 states `NoopAnalyticsSink`
is what actually runs absent a key, confirmed there by reading `AnalyticsModule`'s sink factory.
`CODE_COMPLETE, CONFIGURED_NOT_RUNTIME_VERIFIED` — no real event has ever reached a real PostHog
project in any environment this audit could find evidence of; not fabricated as verified.

## 14. Production domain

**Still not decided.** `API_BASE_URL`/`FRONTEND_URL`/`APP_PUBLIC_URL`/`CORS_ORIGINS` are all
`localhost` in the current `.env`. This is the single highest-leverage blocker on this list — it
transitively gates webhook registration (§9), CORS/cookie correctness in production (§15),
`TRUST_PROXY`'s correct value (§16), and email links. `FOUNDER/DEPLOYMENT_ACTION_REQUIRED`.

## 15. CORS/cookie status

Read directly: `app.enableCors({ origin: config.corsOrigins, credentials: true, allowedHeaders:
['Content-Type', 'X-CSRF-Token'] })` — origin is config-driven (currently `localhost:3000`, would
need the real frontend domain), `credentials: true` is required for the cookie-based auth flow to
work cross-subdomain and is correctly scoped (not a wildcard origin, which `credentials: true`
would make dangerous). Cookie service: the access-token cookie sets `httpOnly: true`, `secure`/
`sameSite`/`domain` all config-driven (`secure: false` locally, correct for plain-HTTP local dev,
**must** become `true` in production); the CSRF cookie is deliberately `httpOnly: false` (correct —
the double-submit pattern requires JS to read it). `CODE_COMPLETE, CONFIG_REQUIRED` — no defect,
just needs real production values for `CORS_ORIGINS`/`AUTH_COOKIE_SECURE`/`AUTH_COOKIE_DOMAIN` once
a domain exists.

## 16. TRUST_PROXY

`main.ts`: `config.trustProxy === 'true' ? true : config.trustProxy === 'false' ? false :
Number(config.trustProxy)` — correctly handles the three real Express `trust proxy` forms (boolean
true/false or a hop count), defaults to `'false'` (the safe, restrictive default) when unset.
**Code is correct.** The *value* to use in production cannot be determined without knowing the real
hosting provider's proxy topology, which doesn't exist yet (§14). `DEPLOYMENT_CONFIRMATION_
REQUIRED` — unchanged across every audit this repository has had on this exact point; not guessed
here either, per this task's explicit instruction.

## 17. Privacy Policy

**Still the Sprint 1 placeholder**, self-labeled in its own footer: "This is a plain-language
summary for Sprint 1. A complete legal Privacy Policy will be published before general
availability." `FOUNDER/LEGAL_REVIEW_REQUIRED` for the real policy.

**Additional finding, independent of the legal-review gap — `ENGINEERING_COPY_GAP`:** the
placeholder's own factual illustration of what account deletion removes ("Companion conversations,
Memory, Journal entries, and Discovery readings (Tarot, Numerology, Natal Chart)") predates two
shipped features. `AccountDeletionService` (verified by direct code read in this session's Admin
Operator Tooling audit) actually also deletes `DestinyReport` (Sprint 16) and
`EasternHoroscopeProfile` (Sprint 17) rows — the code is correct and more protective than the copy
describes, but the copy itself is stale. The notice also never mentions analytics tracking at all
(Sprint 13 added a localStorage-based anonymous analytics ID — not a cookie, so the notice's "we
don't set marketing or tracking cookies" claim is technically accurate, but the omission of
analytics existing at all is a completeness gap). Not fixed this pass — writing legal-adjacent copy
without founder/legal sign-off would risk looking more authoritative than warranted; flagged for
the eventual real-policy drafting pass to fold in.

## 18. Terms

**Still the Sprint 1 placeholder** ("Complete legal Terms of Service will be published before
general availability"). `FOUNDER/LEGAL_REVIEW_REQUIRED`. No factual-accuracy gap found in its
(intentionally minimal) two substantive sentences — the crisis-line/not-medical-advice disclaimer
and the good-faith-use clause are both still accurate.

## 19. Refund policy

**No refund policy document exists anywhere in `docs/`** (searched, no matches). No code path
implements a refund action (confirmed in this session's Admin Operator Tooling audit: the payment
lookup services are explicitly read-only, "No refund/retry/repair action exists anywhere in this
file"). `FOUNDER/LEGAL_DECISION_REQUIRED` — zero engineering work is blocked on this per se (there's
no refund tooling to build prematurely), but a real policy decision is a roadmap P1 item.

## 20. Tax/invoice policy

Same situation as §19 — no document, no code assumption either way. `FOUNDER/LEGAL_DECISION_
REQUIRED`.

## 21. Payment retention

`AccountDeletionService` already implements a specific retention behavior — `PaymentOrder`/
`PaymentWebhookEvent`/`PremiumEntitlement` rows are deliberately never deleted on account deletion,
only the user's personal-identity fields are scrubbed (verified by direct code read, same as §17).
This is a real, working, documented *mechanism*, but the underlying **policy** (how long to retain,
for what legal/accounting requirement) was never externally decided — the roadmap's own checklist
still lists `- [ ] Payment retention period decision` unchecked. `CODE_COMPLETE` (the mechanism is
sound and matches the Privacy Notice's own claim about payment records), `FOUNDER/LEGAL_DECISION_
REQUIRED` (the specific retention *duration*/policy).

## 22. Secrets/config matrix

Presence/status only — no values printed.

| Variable | Group | Req in prod | Status |
|---|---|---|---|
| `DATABASE_URL` | Server | Yes | SET (dev value only) |
| `REDIS_URL` | Server | Yes | SET (dev value only) |
| `API_BASE_URL`, `FRONTEND_URL`, `CORS_ORIGINS` | Server | Yes | SET to `localhost` — PLACEHOLDER for production |
| `APP_PUBLIC_URL` | Server | Yes | Present in `.env.example` default; not confirmed set to a real value in `.env` |
| `TRUST_PROXY` | Server | Yes (safe default) | NOT_SET (defaults to `'false'`) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET` | Server | Yes | SET (dev values; env validation already fails boot on left-as-placeholder values) |
| `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAME_SITE` | Cookies | Yes | SET to dev-safe values (`secure=false`, `domain=localhost`) — **must change for production** |
| `EMAIL_PROVIDER` | Email | Yes | SET to `mailpit` — **DEV_ONLY, blocked from production by env validation** |
| `RESEND_API_KEY` / `POSTMARK_SERVER_TOKEN` | Email | PRODUCTION_ONLY | NOT_SET |
| `DEFAULT_AI_PROVIDER` | AI | Yes | SET to `openai` (a real provider, not mock) |
| `OPENAI_API_KEY`/etc. | AI | Yes | SET (dev-tier keys; production-tier not confirmed) |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | PayOS | Yes | SET — real vs. placeholder UNKNOWN (§7) |
| `PAYOS_MOCK_CHECKOUT` | PayOS | Yes | SET to `true` — **DEV_ONLY, blocked from production by env validation** |
| `PAYMENTS_ENABLED` | PayOS | Yes | NOT_SET (defaults to `true`) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Observability | OPTIONAL | NOT_SET |
| `POSTHOG_API_KEY` | Analytics | OPTIONAL | NOT_SET |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Analytics (frontend) | OPTIONAL | NOT_SET (defaults enabled) |

## 23. Unsafe-default audit

Re-verified directly against `env.validation.ts` (not merely trusting the prior runbook's claim):
`PAYOS_MOCK_CHECKOUT`, `AI_ENABLE_MOCK_PROVIDER`, `DEFAULT_AI_PROVIDER=mock`,
`FALLBACK_PROVIDER=mock`, and `EMAIL_PROVIDER=mailpit` **all still throw at boot** when
`NODE_ENV=production` (lines 200–251, read directly this session). `PAYMENTS_ENABLED`'s and every
other boolean env var's string-coercion bug is fixed (`zBooleanString`, §6). **No unsafe production
default found.**

## 24. Admin/Ops readiness

Already closed and independently re-verified in this session's own prior Admin Operator Tooling
audit: all 5 lookups (user, entitlement, payment, notification health, AI spend) live, stale-JWT
demotion → immediate 403 proven live, mass-assignment rejected, admin provisioning is a documented
manual CLI script (no self-service endpoint). Nothing new found this pass that changes that
verdict. **READY.**

## 25. Observability

Direct grep for `captureException`/`captureMessage` across `apps/api/src` (excluding tests) found
exactly two production call sites: the global HTTP exception filter (every unhandled 5xx) and the
notification scheduler service. Classified per this task's own §14 scheme:

| Signal | Classification |
|---|---|
| 5xx errors | OBSERVABLE (global exception filter → Sentry, pending DSN) |
| Scheduler errors | OBSERVABLE (explicit capture site, pending DSN) |
| Payment webhook failures | LOG_ONLY — structured logger + an audit DB row on rejection, but the webhook service's own doc comment confirms rejected deliveries are deliberately handled internally ("never throws itself"), so they do **not** reach the global exception filter/Sentry at all |
| AI budget/cost spikes | LOG_ONLY at most — no dedicated capture site found |
| Email failures | LOG_ONLY (best-effort by design, per architecture docs) |
| Redis outage | OBSERVABLE via `/health/ready`, but fail-open by design — a degraded Redis doesn't page anyone (documented, intentional) |
| DB readiness failure | OBSERVABLE via `/health/ready` (pull-based; whether it becomes a real page depends on the external monitoring/orchestrator, not yet configured) |

**No signal is `NO_SIGNAL`** — every category has at least structured logging. The one
launch-relevant gap: **payment webhook failures don't reach Sentry at all today**, only logs/audit
rows — worth a small, scoped follow-up (an explicit `captureMessage` call in the rejection path)
before launch, given payment failures are the highest-business-impact failure class on this list.

## 26. Alerting

**No active alerting exists in any environment today** — everything above is gated on `SENTRY_DSN`
being configured (§12), which it isn't. Until then, every "OBSERVABLE" row in §25 is really
"logged locally, would become observable once Sentry is connected." `EXTERNAL_CREDENTIAL_REQUIRED`
(Sentry project provisioning is the actual blocker, not missing code).

## 27. SEO regression status

Re-derived from this session's own immediately-prior SEO/Shareability closure (`fa1dad7`, read in
full): homepage title/canonical, `robots.ts` (derives from `route-guard.ts`'s `APP_ROUTES`, closing
the `/premium`/`/onboarding` gap found in that pass), `sitemap.ts` (only genuine public routes),
`/menh-vi` still archived/disallowed, `/admin` still noindex, share payload still privacy-safe (no
private data path exists). **No regression found — closure confirmed still intact**, consistent
with this task's own instruction not to re-implement absent a discovered regression.

## 28. Accessibility regression status

Re-derived from the accessibility/product-polish closure (`3bbd18c`, read in full, including its
own independent live-authenticated re-verification pass with 0 axe violations across 4 scanned
surfaces). Dialog id fix, contrast tokens, tablet nav breakpoint, and all 12 locked items confirmed
implemented and independently re-verified within that same closure. **No regression found.**

## 29. Security status

Re-derived from this session's own Admin Operator Tooling audit (stale-JWT demotion → immediate
403, live-tested against a real running app; mass-assignment on register/preferences → 400, live-
tested; account-status(SUSPENDED) → immediate 401 via `JwtAuthGuard` before `AdminGuard`; CSRF
double-submit pattern; global `ValidationPipe({whitelist:true, forbidNonWhitelisted:true})`) plus
this pass's own fresh reads: CORS scoped correctly (§15), cookies `httpOnly`/config-driven
`secure` (§15), webhook signature verification + dual idempotency (§6), rate limiting present with
production-appropriate documented defaults (`AUTH_RATE_LIMIT_MAX=5`/15min etc., per the deployment
runbook §8 — not re-verified live this pass, but the values themselves were read directly from the
runbook which itself was written from the actual `env.validation.ts` defaults). No unresolved
Blocker/Critical/High found in any of the evidence available to this audit.

## 30. Backup/recovery

**No backup/recovery documentation exists anywhere in `docs/`** (searched, no matches beyond the
deployment runbook's own §13 "Rollback" section, which covers *code* rollback, not *data* backup).
The runbook's rollback guidance is real and useful (stateless API/web images, migration-compatibility
caveats) but is silent on: who owns database backups, what the actual backup cadence/retention is,
and whether a restore has ever been tested. **Classify: `FOUNDER/OPS_ACTION_REQUIRED`** — this is
squarely a hosting-provider-dependent decision (most managed Postgres providers offer automated
backups, but which provider is chosen is itself an open decision, §14) — not something to build
custom tooling for in this repo ahead of that choice, per this task's own instruction not to
implement cloud backup infrastructure the repo doesn't already own.

## 31–35. Blocker ownership breakdown

**EXTERNAL** (a real third-party credential/account that must be obtained): PayOS merchant
credentials (§7), production email provider credential (§11), Sentry project/DSN (§12), PostHog
project key (§13).

**FOUNDER**: production hosting provider choice (§14, which also resolves §16 TRUST_PROXY and §9
webhook registration transitively), Premium price sign-off (§8), final analytics provider
confirmation (§13).

**LEGAL**: real Privacy Policy (§17), real Terms of Service (§18), refund policy (§19), tax/invoice
policy (§20), payment retention *period* (§21 — the mechanism is engineering-complete, only the
duration decision is legal/founder-owned).

**ENGINEERING**: payment-webhook-failure Sentry capture (§25's one gap, small and scoped), the
Privacy Notice copy-accuracy gap (§17, deferred until the real legal draft rather than patched in
isolation), roadmap document currency (§5, cosmetic).

**DOMAIN_EXPERT**: unchanged, entirely Tử Vi-track-specific (Sprint 15's decision register), not
re-audited here since it's explicitly out of this task's scope and already tracked in its own
domain-resolution pack.

## 36. Current-product launch readiness

**The currently-shipped product (everything through Accessibility/Product Polish, excluding Tử Vi)
is code-complete and has no open engineering Blocker/Critical/High.** Every remaining item gating a
real launch is EXTERNAL, FOUNDER, or LEGAL — a real hosting provider/domain, real payment/email/
Sentry/PostHog credentials, and real legal documents. No engineering remediation is required to
reach this state; what's required is a set of external decisions and credential-provisioning steps,
none of which engineering can manufacture.

## 37. Roadmap V2 Product Complete readiness

**Not yet, and cannot be** — Vietnamese Tử Vi remains `BLOCKED_BY_DOMAIN_REFERENCE` (Sprint 18),
and the roadmap's own §7 Product Complete Release Gate explicitly names "Vietnamese Tử Vi promise
fulfilled" as a required line item, not an optional one. This is **not** silently removed from the
definition of Product Complete here, per this task's own explicit instruction. Current-product
launch-readiness (§36) and Roadmap V2 Product Complete (this section) are two different bars, and
BeaconVie can be honestly launch-ready on the first without satisfying the second.

## 38. Remaining P0

1. Production hosting provider + domain decision (founder) — gates §9, §14, §15, §16, §22 secrets.
2. PayOS real merchant credentials + price sign-off (founder/external).
3. Production email provider credential (external).
4. Real Privacy Policy / Terms of Service (legal).
5. Sentry project/DSN provisioned (external) — currently zero production error visibility.
6. `TRUST_PROXY` production value confirmed against the chosen hosting topology (founder/deployment,
   depends on #1).
7. Tử Vi domain decision register resolution (unchanged, tracked in its own track, not re-audited
   here) — remains P0 for the Tử Vi track specifically, per the existing roadmap.

## 39. Remaining P1

1. Refund policy, tax/invoice policy, payment-retention-period decision (legal) — engineering
   mechanism already correct, only the policy values are open.
2. PostHog project key (external) — analytics currently a no-op in every real environment.
3. Payment-webhook-failure Sentry capture (engineering, small, scoped — §25).
4. Post-registration payment webhook real smoke test, once real credentials exist (§10).

## 40. Remaining P2

1. Privacy Notice copy-accuracy refresh (fold Eastern Horoscope/Reports/analytics mentions into the
   eventual real legal draft — §17).
2. Roadmap document currency pass (§5 — cosmetic, doesn't block anything).
3. Backup/recovery ownership + procedure documentation, once a hosting provider is chosen (§30).
4. Deferred LOW accessibility items already tracked in the accessibility closure's own §54 (frozen-
   module contrast, Admin nested-list retry parity, post-reveal focus movement) — unchanged,
   re-confirmed still open, not re-litigated here.

## 41. Remaining P3

Unchanged from the existing roadmap's own §8 ("Explicitly Deferred Beyond Product Complete") —
Community, Marketplace, Voice mode, multiple Tử Vi schools, advanced compatibility/synastry, full
WCAG certification, advanced Western transits. Nothing new added by this audit.

## 42. Production activation checklist

| Item | Owner | Status | Blocking? | Evidence required |
|---|---|---|---|---|
| **BEFORE DEPLOY** | | | | |
| Choose hosting provider | FOUNDER | Open | Yes | Decision recorded |
| Register production domain(s) | FOUNDER | Open | Yes | DNS live |
| Provision Postgres/Redis in production | OPS | Open | Yes | Connection strings |
| Real PayOS merchant credentials | EXTERNAL | Open | Yes (for payments) | Confirmed real, not sandbox-shaped |
| Real email provider credential | EXTERNAL | Open | Yes | Confirmed sending |
| Sentry project + DSN | EXTERNAL | Open | No (launch), Yes (safe launch) | One real captured event |
| PostHog project + key | EXTERNAL | Open | No | One real captured event |
| Real Privacy Policy / Terms | LEGAL | Open | Yes | Published pages |
| Refund/tax/retention policy decisions | LEGAL/FOUNDER | Open | Yes | Written policy |
| **DEPLOY** | | | | |
| Set full production env matrix (§22) | OPS | Blocked on above | Yes | — |
| Confirm `TRUST_PROXY` against real topology | ENGINEERING | Blocked on hosting choice | Yes | Manual verification against provider docs |
| Run `prisma migrate deploy` once, before traffic | ENGINEERING | Ready (code complete) | Yes | Migration log |
| Build + deploy both Docker images | ENGINEERING | Ready (build-verified Sprint 13) | Yes | Successful container boot |
| **AFTER DEPLOY** | | | | |
| `GET /health/live` and `/health/ready` both 200 | ENGINEERING | Ready | Yes | Real HTTP response |
| Register PayOS webhook URL | FOUNDER/ENGINEERING | Blocked on domain | Yes | PayOS dashboard confirmation |
| **REAL-RUNTIME SMOKE** | | | | |
| Real registration → onboarding → Tarot draw | ENGINEERING | Ready to execute once deployed | Yes | Manual pass |
| Real Sentry test error → confirm scrubbing holds | ENGINEERING | Blocked on DSN | Recommended | Captured event reviewed |
| Real `landing_view` event reaches PostHog | ENGINEERING | Blocked on key | No | Provider UI |
| **PAYMENT ACTIVATION** | | | | |
| One real/sandbox checkout completes, webhook transitions order to PAID | FOUNDER (authorizes) + ENGINEERING (executes) | Blocked on real credentials | Yes | Order row transition confirmed |
| **MONITORING** | | | | |
| Payment-webhook-failure Sentry capture added | ENGINEERING | Not started | Recommended before payment activation | Code change + test |
| Backup/recovery procedure documented | OPS | Blocked on hosting choice | Recommended | Written runbook section |
| **GO/NO-GO** | | | | |
| All P0 items above resolved | ALL | Open | Yes | This checklist fully checked |

## 43. Recommended execution order

1. Founder resolves hosting provider + domain (unblocks the largest number of downstream items).
2. In parallel: founder/legal drafts real Privacy Policy, Terms, refund/tax/retention policy.
3. In parallel: engineering adds the payment-webhook-failure Sentry capture (§25, small, doesn't
   need to wait on anything else).
4. Once domain exists: provision Postgres/Redis, set full env matrix, confirm `TRUST_PROXY`,
   register PayOS webhook, provision Sentry/PostHog.
5. Deploy, run health checks, run real-runtime smoke checklist (§42).
6. Founder authorizes one real/sandbox payment smoke test before declaring payment activation
   complete.
7. Go/No-Go review against this document's own checklist.
8. Tử Vi domain-resolution track continues in parallel, on its own separate schedule, unaffected by
   any of the above.

## 44. Roadmap rebase

No new engineering sprint is warranted to "fill time" while Sprint 18 remains blocked — this
audit's own P2 list (§40) is genuinely small (one copy refresh contingent on the legal draft, one
small Sentry capture addition, a documentation currency pass, previously-deferred LOW items) and
doesn't justify a dedicated sprint number. The accurate next roadmap state is: **engineering's
independent-of-Tử-Vi work is now substantially done** (Sprint 23's Admin+SEO+Shareability, plus the
accessibility/polish pass that came after it); what remains is real production activation (external/
founder/legal-owned, §38–39) and the Tử Vi domain track (unchanged, its own schedule). No new
sprint number is proposed; the next engineering action of substance is the one item in §39.3
(webhook-failure Sentry capture) plus whatever real bugs a real production deploy surfaces.

## 45. Files created/modified

**Created:** this document (`docs/audit/product-complete-production-readiness-audit.md`) only.
**Modified:** none.

## 46. Final git status

Rechecked at the end of this pass:

```
git status --short   → (empty prior to this document; this document itself is now untracked)
git diff --stat       → (empty)
git diff               → (empty)
git diff --check      → (clean)
git diff --cached     → (empty)
```

No product code changed, no Tử Vi path touched, no secret value printed anywhere in this document,
no temp logs/Playwright artifacts/screenshots created or tracked, nothing staged.

## 47. Commit status

**Nothing committed.**

## 48. Push status

**Nothing pushed.**

## 49. Sprint 18 status

Unchanged: `BLOCKED_BY_DOMAIN_REFERENCE`. Not started, not touched, not silently resolved or
removed from the Product Complete definition (§37).

## 50. Final verdict

**PRODUCT COMPLETE BLOCKED BY TỬ VI DOMAIN TRACK — CURRENT PRODUCT OTHERWISE LAUNCH-READY**

The currently-shipped product has no open engineering Blocker/Critical/High and no code defect
gating launch — every remaining item is external (real credentials), founder (business/hosting
decisions), or legal (real policy documents), none of which engineering can resolve unilaterally.
Roadmap V2's own Product Complete definition explicitly requires the Vietnamese Tử Vi promise to be
fulfilled, and that track remains genuinely domain-blocked, unaffected by and independent of
everything audited here.

## 51. Exact next action

Hand this document's §42 (production activation checklist) and §38 (remaining P0) to the founder as
a concrete, ordered action list — the single highest-leverage next step is the hosting-provider/
domain decision (§43, step 1), since it transitively unblocks the largest number of other open
items. Engineering's own next concrete action (not blocked on anything external) is the small
payment-webhook-failure Sentry capture addition noted in §39.3 — everything else on engineering's
plate is either already done or waiting on an external/founder/legal input.

---

## Remediation note (follow-on pass, same day)

The §39.3 gap ("payment webhook failures currently produce logs/audit evidence but are not
reported to Sentry") was independently re-verified from source — **confirmed TRUE** — and fixed:
one `Sentry.captureMessage` call added inside `payment-webhook.service.ts`'s existing shared
`audit()` method (the single choke point every rejection already flows through), sending only
already-allowlisted, non-sensitive fields (`orderId`, `errorCategory`), wrapped in its own
try/catch so a Sentry-side failure can never break webhook processing. 7 new tests added
(29/29 passing in the full file), lint and typecheck clean. Full detail, code snippet, and
verification evidence: `docs/operations/production-activation-checklist.md` §10. This is the only
code change made across the production-readiness/activation-planning work; not committed or
pushed, per instruction.
