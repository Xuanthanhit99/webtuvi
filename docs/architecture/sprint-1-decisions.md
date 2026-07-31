# Sprint 1 — Architecture & Product Decisions

This records every place Sprint 1's implementation deliberately deviates from — or
had to choose between — `docs/reference` (the Product Bible/Design Guide/Figma spec)
and the Sprint 1 build brief, plus the technical reasoning. Per the stated priority
order (Product Bible → Design Guide → Figma → Mockup → Sprint 1 prompt → technical
assumption), docs/reference governs product/UI content; this file is the record of
where a technical constraint justified a deviation, and where the user explicitly
confirmed a choice mid-build.

## Confirmed by the user before implementation

1. **Color palette & typography** — uses docs/reference Module 4 §16's canonical
   token JSON (`#161428` canvas / `#E3B368` gold / Fraunces+Karla+IBM Plex Mono),
   not the alternate palette given in the Sprint 1 prompt text.
2. **Landing copy** — verbatim from `05-landing-experience.md` (headline "An AI
   that actually remembers you.", CTA "Meet your Companion" exactly 3 times), not
   the prompt's alternate headline.
3. **Onboarding model** — a continuous Companion conversation (docs/reference
   Module 7), not a numbered form wizard — see below for the Sprint 1-specific
   simplifications applied to keep this AI-free.
4. **Navigation IA** — 5 items (Dashboard/Companion/Journal/Discovery Hub/Settings)
   per docs/reference Module 3 §4, not the 8-item list in the Sprint 1 prompt.

## Technical deviations (with reasons)

### Auth tokens: both access and refresh in httpOnly cookies

docs/reference Module 6 §7 specifies the access token held **in memory, client-side**
and only the refresh token as an httpOnly cookie. Sprint 1 instead puts **both**
tokens in httpOnly, Secure, SameSite=Lax cookies.

**Why**: the Sprint 1 brief's "CÔNG NGHỆ BẮT BUỘC" section explicitly mandates this
exact pattern ("Token đặt trong httpOnly Secure Cookie" for both), which is a direct
technical instruction, not a product/UX call. It also simplifies Next.js App Router
auth: Server Components and middleware can read the access token from the request's
cookie jar directly, with no client-side token-passing plumbing. Both approaches
avoid localStorage/XSS-exposed storage; this is a legitimate, disclosed substitution
of one secure pattern for another.

### Password rule: 8+ chars with a number-or-symbol, not 10+ chars with all four classes

docs/reference Module 6 §6 specifies "minimum 8 characters, at least one number or
symbol" and explicitly argues against strict multi-class composition rules (citing
the well-documented finding that they increase drop-off and paradoxically encourage
weaker real-world password hygiene — reuse, written-down passwords). The Sprint 1
prompt's literal spec asked for a stricter 10-char/upper/lower/number/symbol rule.

**Why followed docs**: this is simultaneously current, mainstream security guidance
(NIST 800-63B favors length over composition complexity) and an explicit product/UX
decision already reasoned through in the source docs — a case where following docs
has a clear, independent technical justification, not just doc-primacy.

### OAuth (Google/Apple): shown, but disabled

docs/reference Module 6 §4 treats Google/Apple as P0/MVP, equal priority to email.
Sprint 1 ships them as visibly present but disabled ("Coming soon") buttons, not
wired to a real provider.

**Why**: no OAuth app credentials exist for this environment, and faking a
successful social login would violate the explicit "no mock auth" requirement.
Wiring this up later is a configuration-only change (the button markup, redirect
handling, and backend `POST /auth/oauth/:provider` shape are structured so adding a
real provider doesn't require UI rework).

### Companion / Memory: rule-based, not an LLM

docs/reference's Onboarding (Module 7) and Companion (Module 9) modules assume a
real generative AI service. Sprint 1 has no LLM/AI provider in scope (not part of
the mandated tech stack, no API key provisioned). Instead:

- Onboarding's Companion messages are **deterministic, templated copy** modeled
  directly on Module 7 §6's canonical example script, with light templating
  (quoting back a short excerpt of the user's own words) so it doesn't feel
  completely canned. See `apps/api/src/onboarding/conversation-script.ts`.
- The post-onboarding Companion chat (`/companion`) uses the same approach: a
  small rotation of warm, generic, rule-based prompts — see
  `apps/api/src/companion/companion-script.ts`.
- This was explicitly discussed and confirmed with the user before implementation
  (see conversation record) as the way to honor the docs' conversational *shape*
  and tone without overclaiming AI capability Sprint 1 doesn't have.
- Real generative replies, embeddings, and a full memory/triviality-filter
  pipeline are explicitly deferred to a later sprint.

### Explicit memory consent before the first MemoryNote is created

Neither the Sprint 1 prompt nor docs/reference's Onboarding module require a
yes/no gate before the Reflection-moment memory is created (docs treat "I'll
remember this" as a transparent disclosure, not a request for permission). A later
continuation instruction from the user explicitly required: "Có consent rõ ràng
trước khi tạo first memory" and "nếu user không đồng ý lưu memory, onboarding vẫn
hoàn thành được." Sprint 1 implements this as an explicit `reflection` stage: the
Companion asks "want me to remember this?" with **Yes, remember this / Not yet**
buttons; declining skips memory creation entirely and still lets onboarding
complete normally. This reinforces, rather than conflicts with, the product's
standing "Privacy > convenience" principle.

### No email verification flow in Sprint 1

docs/reference Module 6 describes a non-blocking email-verification flow (Verify
Email screen, resend, a Dashboard banner). The Sprint 1 endpoint list doesn't
include it, and the brief explicitly permits limiting scope to what's listed
("Có thể thêm endpoint cần thiết nhưng phải ghi rõ lý do" — the inverse also
applies: don't add unrequested scope without reason). `User.emailVerifiedAt` exists
in the schema, ready for this in a later sprint, but is never set in Sprint 1.

### API routing: no `/v1` prefix

docs/reference Module 24 mentions `/v1/...` versioning as a nice-to-have. Sprint 1
routes are unprefixed (`/auth/...`, `/dashboard`, ...) to match the Sprint 1 brief's
literal endpoint list. Adding a version prefix later is a low-risk, mechanical
change (global `app.setGlobalPrefix('v1')` in `main.ts`).

### Dashboard decision engine: recency-based, not significance-weighted

docs/reference Module 8 §18 weights memories by an AI-computed "triviality
filter" significance score, not just recency. Sprint 1's `DashboardService` uses a
recency-based heuristic (most recent MemoryNote, time-of-day greeting) since there
is no real significance-scoring model in scope. The *shape* of the decision engine
(resolve to exactly one item per optional panel, absent — never empty-placeholder —
sections) is preserved exactly.
