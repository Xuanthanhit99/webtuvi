# Production Deployment Readiness (Sprint 12)

Sprint 12 audit §45/§53.6 asked for a short, real deployment-readiness note — not a full
Dockerfile/CI pipeline (that remains a larger, separate, explicitly out-of-scope initiative). This
document is that note: it consolidates the operational configuration decisions a real deploy needs
to get right, without inventing production topology facts this codebase has no way to know.

It complements, and does not duplicate, `docs/progress/payos-production-readiness.md` (the full
PayOS contract/runtime audit) and `docs/architecture/payment-foundation.md` — see those for the
payment-specific detail. This document covers the four items Sprint 12 specifically found
undocumented: `TRUST_PROXY`, PayOS webhook registration procedure, PayOS production env checklist,
and email production readiness.

## 1. `TRUST_PROXY`

**What it controls**: Express's `trust proxy` setting (`main.ts`), which determines whether
`req.ip` (used by every IP-keyed rate limiter — `companion-ip`, `discovery-ip`, and the auth
throttler's IP fallback) trusts the `X-Forwarded-For` header a reverse proxy sets, or trusts
nothing and reads the raw TCP connection's address instead.

**Why it matters, concretely**: this codebase's rate limiters key partly on IP as a secondary
abuse defense (see `CompanionThrottlerGuard`, `DiscoveryThrottlerGuard`, `PaymentThrottlerGuard`
docstrings). Get this wrong in either direction and a real security control silently breaks:

- **`TRUST_PROXY=true` (or a hop count) with no reverse proxy in front of the API** — any client
  can set its own `X-Forwarded-For` header and impersonate any IP address, trivially bypassing
  every IP-keyed rate limit. This is a real spoofing vulnerability, not a theoretical one.
- **`TRUST_PROXY=false` (the default) behind a real reverse proxy/load balancer** — every request
  appears to originate from the proxy's own internal IP, so every distinct real client collapses
  onto one IP-keyed bucket. The IP-keyed limiters (`companion-ip`, `discovery-ip`) become either
  uselessly loose (shared across all users) or — worse — one abusive user can exhaust the shared
  IP bucket and rate-limit every other legitimate user behind the same proxy.

**What this repository does NOT know, and will not fabricate**: the actual production reverse
proxy topology (how many hops sit between the internet and this API — a CDN, a load balancer, a
platform-managed edge proxy, or some combination). No `Dockerfile`, `railway.json`, or `vercel.json`
exists in this repository (confirmed by the Sprint 12 audit, §45) — there is no in-repo evidence of
the intended hosting platform, so this document does not assume one.

**Deployment checklist**:

1. Determine the exact number of reverse-proxy hops between the public internet and this API
   process in the real production topology (0 if the API is directly internet-facing — uncommon
   and not recommended; 1 for a single load balancer/CDN in front; more for a chained setup).
2. Set `TRUST_PROXY` to that exact hop count (Express's numeric `trust proxy` mode), or `true`
   only if there is exactly one trusted hop and its identity is otherwise guaranteed (e.g. a
   platform that strips/overwrites client-supplied `X-Forwarded-For` before appending its own).
   Never set `true` without confirming the platform doesn't let the raw client set that header.
3. After deploying, verify: send two requests from two genuinely different client IPs through the
   real production path and confirm `req.ip` (visible via a debug log, or by observing that the
   `companion-ip`/`discovery-ip` buckets track them independently) resolves to two different,
   correct addresses — not the proxy's own IP, and not attacker-controlled.
4. Re-verify this any time the proxy topology changes (adding a CDN, changing load balancer
   vendor, adding a WAF layer) — a topology change without a matching `TRUST_PROXY` update is the
   exact failure mode described above.

## 2. PayOS webhook registration procedure

**Mechanism**: PayOS's `webhooks.confirm(url)` API call (available in their official SDKs — Node,
PHP, .NET, Python) or the equivalent PayOS merchant dashboard action. This is a **one-time
deployment-time action**, not part of this codebase's runtime request path — confirmed absent from
this repository by design (Sprint 12 audit §11/§23: "Do NOT automatically register webhooks during
application boot... could create dangerous environment coupling").

**Why it is not automated here**: registering a webhook URL requires a real, stable, publicly
reachable production domain and real PayOS merchant credentials — neither exists in any
environment this codebase has been developed or tested in. Automating registration at boot would
mean either (a) silently re-registering on every deploy against whatever `API_BASE_URL` happens to
be set (including a staging/preview URL, which could hijack the production webhook target), or (b)
requiring the registration credentials to be present in every environment including local dev —
both are worse than a deliberate manual step.

**Expected production webhook URL shape**: `{API_BASE_URL}/payment/webhooks/payos` — the same path
`PaymentController.handlePayOSWebhook` already serves (`payment.controller.ts`), unauthenticated by
design (no `JwtAuthGuard`, `@SkipCsrf()`) since PayOS cannot present a BeaconVie session; its
security comes entirely from `PayOSWebhookService`'s independent HMAC-SHA256 signature
verification, never from session/CSRF state. `{API_BASE_URL}` must be the real, final production
API domain — not a preview/staging URL — before this step is run.

**Registration procedure** (perform once, after production domain + real PayOS credentials both
exist):

1. Confirm `API_BASE_URL` in production env is the final, stable production domain (not subject to
   change without re-running this procedure).
2. Confirm the webhook route is reachable over HTTPS from the public internet (PayOS requires
   HTTPS; a domain behind auth/VPN/IP-allowlisting will not work).
3. Using the PayOS merchant dashboard or `payos.webhooks.confirm('{API_BASE_URL}/payment/webhooks/payos')`
   via an official SDK invoked as a one-off script (never from application boot code), register the
   URL against the real merchant account.
4. PayOS will send a verification request to the registered URL as part of confirmation — verify
   the API returns `HTTP 200` and does not error (the existing `handlePayOSWebhook` implementation
   already returns `{ received: true }` with `HTTP 200` for any structurally valid, signature-
   verified payload — no special-casing needed for the confirmation request itself, since PayOS's
   own SDK handles the confirmation handshake using the same endpoint).
5. **Verification procedure**: trigger one real, small-value test transaction through the real
   PayOS checkout flow (sandbox credentials if PayOS offers a sandbox environment, otherwise the
   smallest possible real transaction with founder approval — never fabricated, per this codebase's
   own standing rule against simulating unverifiable claims). Confirm: the webhook is received,
   the signature verifies against the real `PAYOS_CHECKSUM_KEY`, the `PaymentOrder` transitions
   `PENDING → PAID`, and `PremiumEntitlement` is granted — all observable via the existing
   `GET /payment/orders/:id` and `GET /payment/premium-status` endpoints.
6. Re-run this entire procedure if `API_BASE_URL` ever changes (domain migration, platform
   migration) — a stale registered webhook URL means PayOS silently stops delivering webhooks to
   the new domain, and payments would appear to "hang" in `PENDING` with no error surfaced anywhere
   in this codebase (the checkout itself would still succeed; only the confirmation step breaks).

## 3. PayOS production environment checklist

Re-verified against this repository's actual `env.validation.ts`/`configuration.ts` this session
(Sprint 12) — unchanged in shape from `docs/progress/payos-production-readiness.md`'s own §21
checklist, reproduced here for a single consolidated deployment reference:

| Variable | Production requirement | Enforced by |
|---|---|---|
| `PAYOS_CLIENT_ID` | Required (boot fails if missing) | `env.validation.ts` |
| `PAYOS_API_KEY` | Required (boot fails if missing) | `env.validation.ts` |
| `PAYOS_CHECKSUM_KEY` | Required (boot fails if missing) | `env.validation.ts` |
| `PAYOS_BASE_URL` | Defaults to the real PayOS production API (`https://api-merchant.payos.vn`) — no change needed unless PayOS's own infrastructure changes | `env.validation.ts` default |
| `PAYOS_MOCK_CHECKOUT` | Must be `false` (boot fails if `true`) | `env.validation.ts` |
| `PAYMENTS_ENABLED` | Business decision — `true` to accept real checkout, `false` to keep the kill switch closed at launch if payments aren't ready yet. Never gates webhook processing either way (see §14 in the PayOS readiness report) | `env.validation.ts`, `PaymentCheckoutService` |
| `PREMIUM_PRICE_VND` | **Founder/product sign-off required** — `79000` is an explicitly disclosed MVP placeholder, never presented as final (`payment.controller.ts` discloses `isMvpTestPrice: true` in the API response itself, and — Sprint 12 — the frontend now also honestly hides the upgrade CTA when `PAYMENTS_ENABLED=false`, see §21 below) | Product decision, not code |
| `PREMIUM_DURATION_DAYS` | Already a settled product decision (30, one-time, non-renewing) | n/a |
| `FRONTEND_URL` | Must be the real production frontend domain — builds the PayOS `returnUrl`/`cancelUrl` | `env.validation.ts` |
| `API_BASE_URL` | Must be the real production API domain — see §2 above (webhook registration target) | `env.validation.ts` |
| `CORS_ORIGINS` | Must include the real production frontend origin | `env.validation.ts` |

**Never print secret values** — this document intentionally contains none, consistent with every
prior payment-readiness report in this repository.

## 4. Email production readiness

The code is complete for both production-capable providers (`ResendMailProvider`,
`PostmarkMailProvider`, `apps/api/src/mail/providers/`) — nothing to build here. `EMAIL_PROVIDER`
selects between them (or `mailpit`, dev/test-only); `env.validation.ts` already enforces that
production **cannot** select `mailpit` (boot fails), and that whichever real provider is selected
has its matching credential (`RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN`) present.

**No real Resend/Postmark credential exists anywhere in this repository or any environment checked
this session.** This is an external/founder blocker, not an engineering gap — classified
**EMAIL PRODUCTION: EXTERNALLY BLOCKED**, consistent with the Sprint 12 audit's own framing (§25:
"No fake success").

**Checklist to resolve**:

1. Choose a production email provider — Resend or Postmark (both already fully implemented; this
   is a business/vendor choice, not an engineering one).
2. Obtain a real API credential from the chosen provider.
3. Set `EMAIL_PROVIDER` to the chosen provider's name, and the matching credential env var
   (`RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN`).
4. Set `EMAIL_FROM` to a real, deliverability-appropriate sending address for the chosen provider
   (typically requires domain verification with the provider first — DNS records, SPF/DKIM — a
   provider-side setup step, not a code change).
5. Perform one real smoke send (e.g. trigger a real password-reset or the Sprint 11 notification
   email path against a real inbox) and confirm delivery. Do not report this step as done without
   an actual received email — no fake success, per the audit's own explicit instruction.
6. Verify the notification email path specifically (`NotificationDeliveryService`,
   `docs/architecture/notification-retention.md`) since it's the one real user-facing email flow
   Sprint 11 added — same real-send verification as step 5.

## Status summary

| Item | Status |
|---|---|
| `TRUST_PROXY` guidance | Documented (§1) — actual production value still requires knowing the real deployment topology, which does not exist yet |
| PayOS webhook registration | Procedure documented (§2) — not yet performed, blocked on real merchant credentials + production domain (same blocker as `payos-production-readiness.md`) |
| PayOS production env checklist | Documented (§3) — code-ready, business sign-off (price) and credentials remain founder-level blockers |
| Email production readiness | Documented (§4) — code-complete for both providers, blocked on a real provider credential (externally blocked, not an engineering gap) |
