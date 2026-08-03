# BeaconVie — Sprint 2B Progress: Companion Core

Started from `624c2de3151095124730da708d66397017a4ffe5` (Sprint 2A closure commit). No rollback, no
changes to Sprint 1 or Sprint 2A behavior outside the explicit, user-approved in-place replacement of
the Sprint 1 rule-based Companion (see §5).

## 1. Scope

Built: a production AI conversation layer — provider abstraction (OpenAI/Anthropic/Gemini/Mock),
SSE streaming, conversation persistence, prompt building, context building, safety/moderation,
retry + bounded fallback, cost tracking, and AI observability. Full detail in
`docs/architecture/companion-core.md` and `docs/security/ai-safety.md`.

Explicitly not built (out of scope for this sprint, by design): embeddings, vector search, semantic
memory extraction, RAG, report generation, tarot, astrology, community features.

## 2. Files changed

**Backend — new** (39 files): `companion/{context,conversation,cost,observability,prompt,providers,
safety,stream}/**` (implementation + one `.spec.ts` per unit), `test/companion.e2e-spec.ts`,
`prisma/migrations/20260801162110_companion_core/`.

**Backend — modified**: `prisma/schema.prisma` (4 new models, 3 new enums, 2 new `User` relations),
`config/{configuration,env.validation}.ts` (AI provider env), `dashboard/dashboard.service.ts`
(preview now reads the new `Conversation` model), `companion/companion.module.ts` (rewired),
`common/interceptors/response.interceptor.ts` (SSE bypass — see §6), `main.ts` and
`test/utils/test-app.ts` (pass `Reflector` into the interceptor), `.env.example`,
`.env.test.example`, `.github/workflows/ci.yml` (CI uses `mock` provider).

**Backend — deleted** (Sprint 1 rule-based Companion): `companion.controller.ts`,
`companion.service.ts`, `companion-script.ts`, `dto/send-companion-message.dto.ts`.

**Frontend — new** (10 files): `features/companion/api/conversations-api.ts`,
`features/companion/hooks/use-companion-conversation.{ts,test.ts}`,
`features/companion/components/{companion-view,composer,conversation-sidebar,message-item}.tsx`
(+ `.test.tsx` for the latter three), `e2e/flow-{4,5,6}-companion-*.spec.ts`.

**Frontend — modified**: `app/(app)/companion/page.tsx` (now wraps `CompanionView` in `<Suspense>`
for `useSearchParams()`).

**Frontend — deleted**: `features/companion/api/companion-api.ts`,
`features/companion/components/companion-chat.tsx`.

**Shared**: `packages/types/index.ts` — added `ConversationStatus`, `ConversationDto`,
`ConversationMessageRole`, `ConversationMessageDto`, `ConversationDetailDto`,
`SendConversationMessageResultDto`. The old `CompanionMessageDto` (`role: 'companion'|'user'`) is
kept unchanged for the Dashboard preview.

**Documentation — new**: `docs/architecture/companion-core.md`, `docs/security/ai-safety.md`, this file.

## 3. API endpoints

```
POST   /companion/conversations                       create a conversation
GET    /companion/conversations                        list, most recently active first
GET    /companion/conversations/:id                     one conversation + full message history
POST   /companion/conversations/:id/messages             send a user message (safety-checked)
GET    /companion/conversations/:id/messages/stream       SSE — stream the assistant reply
DELETE /companion/conversations/:id                       delete a conversation and its messages
```

All routes require auth (`JwtAuthGuard`); state-changing routes require CSRF (the stream route is a
`GET`, a safe method, and is naturally exempt).

## 4. Database

4 new models (`Conversation`, `ConversationMessage`, `AIUsage`, `ProviderLog`) and 3 new enums
(`ConversationStatus`, `ConversationRole`, `AIProviderName`), added in migration
`20260801162110_companion_core`. Full field-level detail in `companion-core.md` §"Data model".

## 5. Replacing Sprint 1's Companion

Per an explicit product decision (Sprint 1's Companion was intentionally temporary), the rule-based
implementation was replaced in place: same `/companion` route, same Dashboard nav entry, no parallel
system kept around after cutover. Existing `CompanionMessage` rows are not deleted — a data migration
(appended to the same Prisma migration) copies compatible `context: 'COMPANION'` rows into the new
`Conversation`/`ConversationMessage` model per user, preserving timestamps. Onboarding's own use of
`CompanionMessage` (`context: 'ONBOARDING'`) is unrelated and was not touched. Full reasoning in
`companion-core.md` §"Replacing Sprint 1's rule-based Companion".

## 6. Notable bugs found and fixed during this sprint

**SSE responses silently broken by the global `ResponseInterceptor`.** The project-wide interceptor
wrapped every successful response — including `@Sse()` `MessageEvent`s — in `{data, meta, requestId}`,
which nested the SSE frame's `type` field one level too deep. NestJS's SSE serializer never saw a
top-level `type` to write an `event: <name>` line for, so the browser's `EventSource` never fired its
named `token`/`done`/`stream_error` listeners at all — the frontend just showed a lost-connection
state. This passed an initial Node-side supertest check because that check only asserted a loose JSON
substring match; it was only caught by an actual browser-driven Playwright run. Fixed by having the
interceptor check `SSE_METADATA` (via `Reflector`) and skip wrapping on `@Sse()` routes; the e2e test
was strengthened to assert the literal `event: token` / `event: done` lines via regex so this
regression class can't hide behind a loose match again.

**Two environmental issues that looked like product bugs but weren't:**

1. Repeated automated login attempts across many Playwright runs against the same seeded demo account
   exhausted the Redis-backed auth rate limiter (`AUTH_RATE_LIMIT_MAX=5` per 15-minute window, shared
   across every client hitting the same server IP bucket). This surfaced as "login failures" that
   looked like credential/hash corruption; it was rate limiting working exactly as designed, just
   tripped by test traffic volume in this dev environment. No code change — this is expected behavior
   in production too, and the tests are not exempted from it here.
2. The web server had been left running an earlier build (`next start`, a production server, not
   `next dev`) from before an in-session source fix (moving the active conversation id into the URL
   query string) was ever built. A source-code fix without a rebuild+restart is invisible to a
   `next start` server, and one earlier restart attempt had not actually killed the old process (a
   stale Windows process outlived the `kill`), so it kept serving an old JS chunk manifest that no
   longer matched the files on disk, producing `ChunkLoadError`s. Fixed by force-killing the stale
   process, confirming the port was actually free, and starting a clean server from the current build.

Neither of these required a code change beyond the SSE fix above; both are documented here because
they cost real verification time and are worth knowing about for anyone else testing this sprint's
work in a similar way.

## 7. Definition of Done — verification results

All run against this sprint's final state, both apps, end to end:

| Check | Result |
|---|---|
| Lint (API + web) | PASS |
| Typecheck (API + web) | PASS |
| Backend unit tests | **71/71 PASS** (14 suites) |
| Backend e2e tests | **45/45 PASS** (5 suites, incl. `companion.e2e-spec.ts`) |
| Frontend component/hook tests | **61/61 PASS** (13 suites) |
| Playwright e2e (flows 1–6) | **6/6 PASS**, confirmed stable across 2 consecutive full runs |
| API build (`nest build`) | PASS |
| Web build (`next build`) | PASS |
| `prisma validate` | PASS |
| `prisma migrate status` | up to date, 3 migrations applied |

No `any` introduced. No hard-coded provider selection (env-driven throughout). No secrets committed —
`DEFAULT_AI_PROVIDER=mock`/`FALLBACK_PROVIDER=mock` in every local/CI env file, real provider keys
left unset. No fake/simulated AI responses presented as real ones — `mock` is a clearly-named,
clearly-scoped provider used only for dev/CI/tests, and is refused as the default in production by a
boot-time fail-fast check.

## 8. Not done / deliberately out of scope

Per the sprint's explicit boundaries: no Memory Engine, no embeddings, no vector database, no RAG, no
AI-generated reports, no Tarot, no Astrology, no Discovery/Community work. `CostControlService`
records, estimates, **and (since §9 below) enforces** usage against a daily/monthly budget — there is
still no billing integration (not requested).

## 9. Sprint 2B independent audit remediation

An independent audit (`docs/progress/sprint-2b-audit-report.md`) found two **High** and three
**Medium** verified findings after this sprint's original close-out above. All five, plus the
Low/Informational items explicitly called out for cleanup, have been fixed — see the audit report's
own "Findings fixed" section for the authoritative per-finding status, verification commands, and
exact test results. Summary:

- **Finding 1 (High) — Mock provider reachable in production fallback.** Fixed:
  `ProviderRegistryService` only registers `MockProvider` outside production (or behind
  `AI_ENABLE_MOCK_PROVIDER=true`, itself rejected in production at boot);
  `ProviderOrchestratorService.chain()` no longer appends `mock` unconditionally; `env.validation.ts`
  now also rejects `FALLBACK_PROVIDER=mock` and `AI_ENABLE_MOCK_PROVIDER=true` in production (it
  already rejected `DEFAULT_AI_PROVIDER=mock`). Total provider-chain exhaustion now yields a
  normalized `PROVIDER_UNAVAILABLE` error — no assistant message is persisted, no `AIUsage` row is
  written. See `docs/security/ai-safety.md` "Mock provider: never reachable in production".
- **Finding 2 (High) — No rate limit, concurrency control, or usage budget.** Fixed: a new
  `CompanionThrottlerGuard` (per-user + per-IP, reusing the Sprint 2A Redis-backed
  `ThrottlerModule`) guards `POST .../messages`; a new `GenerationLockService` (atomic Redis counter,
  `try`/`finally` around `StreamService.generate()`) caps concurrent generations per user; a new
  `CostControlService.checkBudget` enforces daily-request/daily-token/monthly-token ceilings before a
  message is even persisted. See `docs/architecture/companion-core.md` "Rate limiting, concurrency,
  and usage budget" and `docs/security/ai-safety.md` for the full design and counting rules.
- **Finding 3 (Medium) — Composer lost typed text on a failed send.** Fixed: `draft` moved from local
  Composer state into `useCompanionConversation`; it's cleared only on a genuine successful
  completion (`done`), a safety refusal, or a deliberate cancel — never synchronously on submit, and
  never on a failed send/stream.
- **Finding 4 (Medium) — Auto-scroll fought a user reading older messages.** Fixed: extracted
  `useAutoScroll` (companion/hooks) tracks whether the user is near the bottom before scrolling; if
  not, it shows a "New message" affordance instead of forcing the scroll position.
- **Finding 5 (Medium) — Streaming risked per-token screen-reader announcements.** Fixed:
  `StreamingMessageItem` is `aria-hidden` (the in-progress text is visual-only); a single dedicated
  `role="status" aria-live="polite"` region announces "Companion is responding…" once per turn; the
  completed reply is announced once, naturally, when the `role="log"` conversation region picks up
  the new persisted message.
- **Low/Informational cleanup**: removed the unused `AIProvider.health()` method (never called in the
  request path) and the unused `providers/retry.util.ts` (the orchestrator has its own inline retry
  logic); added `PROMPT_VERSION` (`prompt/system-prompt.ts`), recorded on every persisted assistant
  message's `metadata`; reordered `.github/workflows/ci.yml` to run Prisma generate before Typecheck.

No schema changes were required — the budget check reads the existing `AIUsage` table (already
indexed on `(userId, createdAt)`); the concurrency lock and rate limiter are Redis-only, ephemeral by
design.
