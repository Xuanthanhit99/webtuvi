# Founder Legal Decision Sheet

Companion to `docs/progress/legal-content-completion-final-report.md` (the full original audit —
§3, §4, §9 in particular). This sheet reflects a fresh verification pass against current product
behavior (2026-08-22) and reclassifies each item by who can decide it and what it actually blocks —
see the accompanying chat response for the full reasoning. This sheet exists so you can answer each
open item directly, without re-reading the full audit each time.

**How to use this:** for each `LEGAL-XX`, fill in the `Founder answer:` line. Nothing here is
implemented, committed, or acted on until you do. Items marked "Requires legal review afterward:
YES" should go to an actual lawyer/accountant before the wording is finalized — your answer here is
the business decision, not the final legal text.

---

## LEGAL-01 — Legal entity / operator identity

**Question:** What legal entity operates Tử Vi Tarot — a registered company, or an individual
(sole proprietor)? What is its registered name?

**Current behavior:** Not established anywhere in the repository. The Privacy Notice's §1 shows a
visible `[Owner/Legal to confirm: the legal entity name and registration details that operate this
service]` placeholder rather than asserting one.

**Recommended product/business choice:** Not made here — this is a real business-structure question
(individual vs. registered company) with tax/liability consequences, not a copy-wording question.
See the individual-founder finding below for what changes if there's no company yet.

**Why:** This determines who is legally responsible for the service, who can hold a PayOS merchant
account, and how LEGAL-02/08/09/10 get answered. Getting this wrong (or inventing it) is worse than
leaving it open.

**Alternatives:**
A. Operate as a registered company (existing or newly incorporated).
B. Operate as an individual/sole proprietor under your own legal name.
C. Defer real payments and public launch until a decision is made; keep engineering/internal work
   moving in the meantime (this doesn't block deployment — see the blocker matrix below).

**Founder answer:** [ ]

**Requires legal review afterward:** YES (or at minimum an accountant, especially if choosing
between A/B has tax implications in your jurisdiction)

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: RECOMMENDED before — Real payment: YES — Public launch: YES

---

## LEGAL-02 — Registered/contact business address

**Question:** What address should the Privacy Notice list as the operator's address?

**Current behavior:** Not established. Placeholder shown in Privacy §1.

**Recommended product/business choice:** Depends entirely on LEGAL-01. If a company exists, use its
registered address. If operating as an individual, see the individual-founder finding — a home
address is not required to be public in most models; a registered agent, PO box, or virtual
business address is a common alternative many solo operators use, but confirm what your
jurisdiction's disclosure rules actually require rather than assuming.

**Why:** Standard requirement in most privacy notices/terms of service; depends on LEGAL-01.

**Alternatives:**
A. Company registered address (if incorporated).
B. A non-home business/mailing address (registered agent, virtual office, PO box) if operating
   individually and wanting to keep a home address private.
C. Leave unresolved until LEGAL-01 is settled — safe to do for engineering/internal work.

**Founder answer:** [ ]

**Requires legal review afterward:** YES

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: RECOMMENDED before — Real payment: YES — Public launch: YES

---

## LEGAL-03 — Real support/contact email address

**Question:** What real, monitored email address replaces the current placeholder,
`hello@beaconvie.local`?

**Current behavior:** `apps/web/app/(marketing)/contact/page.tsx` links `mailto:hello@beaconvie.local`
— a non-resolving `.local` domain. This is the *only* live contact-address placeholder; it is
distinct from LEGAL-02's registered business address (see the contact-address finding below — these
are not interchangeable).

**Recommended product/business choice:** Provision a real inbox at the `tuvitarot.vn` domain (e.g.
`hello@tuvitarot.vn` or `support@tuvitarot.vn`) once DNS/email are set up, or use any already-working
address in the meantime. This is a support/contact inbox, not a formal legal notice address.

**Why:** Purely operational — no legal wording risk, just needs a real, checked mailbox.

**Alternatives:**
A. A new address on the production domain, once DNS/email is configured.
B. An existing personal/business email in the interim, swapped later.

**Founder answer:** [ ]

**Requires legal review afterward:** NO

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: RECOMMENDED before — Real payment: RECOMMENDED before — Public launch: YES

---

## LEGAL-04 — Payment/accounting record retention period

**Question:** How long should `PaymentOrder`/`PaymentWebhookEvent`/`PremiumEntitlement` records be
kept after a user deletes their account?

**Current (technical) behavior:** `AccountDeletionService` deliberately never deletes these three
tables — they are retained **indefinitely**, with no expiry logic anywhere in the code. This is the
*technical* current state, not a *legal* retention commitment — nothing in the codebase promises a
specific duration, and "indefinite" is not itself a policy, just the absence of a deletion job.

**Recommended product/business choice:** A common practice for financial/accounting records is a
multi-year retention window (figures commonly cited are 5–10 years, often set by local tax law) —
not adopted here as a default, since accounting-record retention requirements vary by jurisdiction
and should be confirmed against Vietnamese accounting/tax law specifically.

**Why:** You're currently keeping this data forever by default (absence of a deletion job, not a
decision) — that's not obviously wrong, but it also isn't a stated policy a real Privacy Notice
should be silent on.

**Alternatives:**
A. Adopt a specific multi-year window (confirm against local tax/accounting law) and build a
   deletion job for records older than that.
B. Keep the current indefinite-retention behavior, but state it honestly as a policy ("kept
   indefinitely for accounting purposes") rather than leaving it unaddressed.
C. Defer — safe to leave open until real payments go live (see blocker matrix).

**Founder answer:** [ ]

**Requires legal review afterward:** YES

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: NO — Real payment: YES — Public launch: YES

---

## LEGAL-05 — Analytics/error-monitoring data retention

**Question:** What retention period applies to PostHog (analytics) / Sentry (error monitoring) data,
once either is configured?

**Current (technical) behavior:** Neither provider is configured in production today (`POSTHOG_API_KEY`/
`SENTRY_DSN` both unset — analytics uses a `NoopAnalyticsSink`, Sentry is `enabled: !!dsn` and
therefore fully off). There is genuinely nothing being retained by these providers right now. This
is the technical fact — not a promise about what will happen once they're turned on.

**Recommended product/business choice:** Accept each provider's own default retention (commonly
displayed in their dashboard/plan settings) unless you have a reason to shorten it; document
whatever the actual default turns out to be once a provider is chosen, rather than guessing now.

**Why:** Low-stakes and not yet active — safe to defer.

**Alternatives:**
A. Defer entirely until a provider is selected (recommended).
B. Pre-decide a target retention now and configure it as each provider is turned on.

**Founder answer:** [ ]

**Requires legal review afterward:** Recommended, not required immediately

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: NO — Real payment: NO — Public launch: NO (safe to resolve after initial launch, before either provider is actually turned on)

---

## LEGAL-06 — Minimum age

**Question:** What is the minimum age to create an account? Is any parental-consent handling needed?

**Current behavior:** No age gate exists anywhere. `RegisterDto` (email, display name, password,
confirm password, accepted-terms checkbox) has no age or date-of-birth field. The date-of-birth
fields that do exist (Tử Vi, Natal Chart, Numerology, Eastern Horoscope) are feature inputs for
chart calculation only — never used to gate registration or verify age.

**Recommended product/business choice:** Pick a stated minimum age appropriate to your risk
tolerance and target audience (commonly 13, 16, or 18 depending on jurisdiction and product type) —
a reflection/astrology product with AI conversation and payments typically states one even without
building active verification, since the *statement* itself (in Terms) is the low-cost first step;
active age-verification enforcement would be a separate, larger engineering task not scoped here.

**Why:** Real product-policy decision with UX impact if enforcement is later added — but the
*statement* alone (no enforcement) is a business/policy choice you can make without new code.

**Alternatives:**
A. State a minimum age in Terms (e.g., 16+) with no technical enforcement yet — lowest engineering
   cost, immediate.
B. State a minimum age AND build a real registration-time check — requires a follow-up engineering
   task, not done in this pass.
C. State no minimum age at all — higher risk, not recommended without understanding what that
   implies in your operating jurisdiction(s).

**Founder answer:** [ ]

**Requires legal review afterward:** Recommended, especially if choosing an age under 18 or if
users under 13 are foreseeably likely

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: RECOMMENDED before — Real payment: RECOMMENDED before — Public launch: YES

---

## LEGAL-07 — Refund policy

**Question:** Under what circumstances, if any, is a Premium payment refundable?

**Current behavior:** No refund logic exists anywhere in the payment code — there is no engineering
mechanism to process a refund today, independent of what policy is chosen. `PaymentCheckoutService`/
`PaymentWebhookService` handle checkout creation and webhook verification only.

**Recommended product/business choice:** Not proposed here (per instruction not to invent one) —
but note the engineering consequence explicitly: whichever policy you choose, if it requires
*executing* a refund (vs. simply stating "no refunds"), that needs a follow-up engineering task this
pass did not build.

**Why:** Terms cannot honestly state a policy that doesn't exist yet; `production-activation-
checklist.md` already tracks this as "Undecided, no doc."

**Alternatives:**
A. "No refunds" (simplest — states a policy, requires no new engineering).
B. Refund within a stated window (e.g., 7 days, unused) — requires building a refund-execution
   mechanism (new engineering work).
C. Case-by-case at operator discretion, handled manually outside the app — no new engineering
   required, but not a scalable long-term policy.

**Founder answer:** [ ]

**Requires legal review afterward:** YES

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: NO — Real payment: YES — Public launch: YES

---

## LEGAL-08 — Governing law and dispute jurisdiction

**Question:** What law governs these terms, and where would a dispute be resolved?

**Current behavior:** Not established. Placeholder shown in Terms §13.

**Recommended product/business choice:** Not proposed here — this is a classic "get real legal
advice" question; an incorrect or unconsidered jurisdiction clause can be unenforceable. Given the
product's Vietnamese-market focus (`.vn` domain, Vietnamese-language product), Vietnamese law is a
plausible starting point to raise with a lawyer, but this is not a recommendation to adopt without
review.

**Why:** Directly named by the task brief as a "do not invent" item; depends on LEGAL-01
(individual vs. company) and where the operator/users actually are.

**Alternatives:** Not offered — route to legal review directly.

**Founder answer:** [ ]

**Requires legal review afterward:** YES

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: RECOMMENDED before — Real payment: YES — Public launch: YES

---

## LEGAL-09 — Tax/invoice handling

**Question:** How are Premium payments handled for tax/invoicing purposes?

**Current behavior:** No invoice-generation feature exists in the product. `production-activation-
checklist.md` already tracks this as "Undecided, no doc."

**Recommended product/business choice:** Not proposed here — depends on LEGAL-01 (individual vs.
company) and Vietnamese tax law for a digital service. Flag to an accountant alongside LEGAL-01.

**Why:** Real compliance question with financial consequences if wrong; the task brief explicitly
names this as a "do not invent" item.

**Alternatives:** Not offered — route to legal/accounting review directly.

**Founder answer:** [ ]

**Requires legal review afterward:** YES

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: NO — Real payment: YES — Public launch: YES

---

## LEGAL-10 — Limitation of liability language

**Question:** What limitation-of-liability clause is appropriate?

**Current behavior:** Only a generic "as is" disclaimer exists (Terms §11); Terms §12 shows a
placeholder rather than inventing specific liability-limiting language.

**Recommended product/business choice:** Not proposed — the task brief explicitly warns an incorrect
clause here "can be unenforceable or actively harmful." Depends on LEGAL-01/LEGAL-08.

**Why:** Same reasoning as LEGAL-08 — this is language a lawyer should draft or approve, not
something to reverse-engineer from a template.

**Alternatives:** Not offered — route to legal review directly, after LEGAL-01/08.

**Founder answer:** [ ]

**Requires legal review afterward:** YES

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: NO — Real payment: RECOMMENDED before — Public launch: YES

---

## LEGAL-11 — Applicable statutory data-subject rights

**Question:** Beyond the self-service export/delete already built, which specific data-protection
regimes (Vietnamese law, GDPR, others) apply to your actual users, and what does each additionally
require?

**Current behavior:** Self-service export and account deletion already exist and are already
disclosed (Privacy §13–14) — this works regardless of which named statute applies. What's open is
only whether some *additional* regime-specific right (e.g., a formal Data Protection Officer, a
specific request-response SLA) applies beyond what's already built.

**Recommended product/business choice:** Not proposed — depends on real analysis of where users are
located, which only a legal reviewer can meaningfully answer. For an initial Vietnam-focused launch,
Vietnamese data-protection law is the most immediately relevant regime to confirm; broader exposure
(e.g., GDPR, if EU residents use the product) can reasonably be revisited once user geography is
observed rather than pre-solved for hypothetically.

**Why:** An engineering guess here could either overstate or understate real legal rights — worse
than leaving it open.

**Alternatives:**
A. Confirm Vietnamese data-protection obligations now (most directly relevant given the product's
   market); treat broader regimes as a later revisit.
B. Commission a full multi-jurisdiction analysis before any public launch.

**Founder answer:** [ ]

**Requires legal review afterward:** YES

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: NO (self-service rights already work) — Real payment: NO — Public launch: RECOMMENDED before, not a hard block given self-service rights already exist

---

## LEGAL-12 — Cross-border data transfer mechanism

**Question:** Once AI/email/Sentry/analytics providers and hosting are finalized, what transfer
mechanism or safeguard applies to data leaving Vietnam?

**Current behavior:** Not applicable yet — no provider or hosting choice has been made (§4 of the
legal-content report: AI/email/Sentry/PostHog are all `SUPPORTED_BY_PRODUCT`, none
`CONFIGURED_IN_PRODUCTION`). Nominatim (geocoding) is the one exception already live in any running
environment, including local dev.

**Recommended product/business choice:** Defer until provider/hosting choices are made — revisiting
this before those choices exist would mean guessing at facts that don't yet exist.

**Why:** Genuinely moot until LEGAL-05-adjacent provider choices are made.

**Alternatives:** Not offered — genuinely blocked on other decisions (hosting provider, AI provider,
email provider) that haven't been made yet.

**Founder answer:** [ ]

**Requires legal review afterward:** YES, once providers are chosen

**Blocks:**
Private deployment: NO — Domain: NO — Internal smoke: NO — Public signup: NO — Real payment: NO — Public launch: RECOMMENDED before, once real providers are active (not before, since nothing is active yet)

---

## Summary blocker matrix

| ID | Private deploy | Domain | Internal smoke | Public signup | Real payment | Public launch |
|---|---|---|---|---|---|---|
| LEGAL-01 | NO | NO | NO | Recommended | YES | YES |
| LEGAL-02 | NO | NO | NO | Recommended | YES | YES |
| LEGAL-03 | NO | NO | NO | Recommended | Recommended | YES |
| LEGAL-04 | NO | NO | NO | NO | YES | YES |
| LEGAL-05 | NO | NO | NO | NO | NO | NO |
| LEGAL-06 | NO | NO | NO | Recommended | Recommended | YES |
| LEGAL-07 | NO | NO | NO | NO | YES | YES |
| LEGAL-08 | NO | NO | NO | Recommended | YES | YES |
| LEGAL-09 | NO | NO | NO | NO | YES | YES |
| LEGAL-10 | NO | NO | NO | NO | Recommended | YES |
| LEGAL-11 | NO | NO | NO | NO | NO | Recommended |
| LEGAL-12 | NO | NO | NO | NO | NO | Recommended (once providers active) |

**None of the 12 items are technical/code blockers** for deploying to a private production
environment, connecting the domain, or internal smoke testing — those three are gated purely by
infrastructure/credential readiness (see the payment-activation-boundary finding below), not by
legal copy. The items become progressively more load-bearing as you move toward public
registrations, then real payments, then a full public launch.
