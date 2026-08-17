import { z } from 'zod';

/**
 * Release Closure finding (fixed here, not merely noted): `z.coerce.boolean()` is a real footgun
 * for string-valued env vars — it just runs JavaScript's `Boolean(x)` coercion, which is `true`
 * for ANY non-empty string, including the literal string `"false"`. Every boolean env var in this
 * file previously used `z.coerce.boolean()`, meaning `SOME_FLAG=false` in any `.env` file has
 * always silently parsed to `true` — discovered live during Sprint 12 release closure while
 * verifying the `PAYMENTS_ENABLED` kill switch: setting it to `false` had zero effect. Confirmed
 * also silently active for `AUTH_COOKIE_SECURE=false` (explicitly set in both `.env` and
 * `.env.test`) — its real-world impact was masked only by Chrome's "localhost is a trustworthy
 * origin" exception, which lets a `Secure`-flagged cookie work over plain HTTP on `localhost`
 * regardless. This helper actually parses the string instead of coercing it.
 */
function zBooleanString(defaultValue: boolean) {
  return z.preprocess((val) => {
    if (val === undefined) return defaultValue;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return val;
  }, z.boolean());
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  // Canonical, fixed base URL used to build every link that appears inside an
  // email (verify-email, reset-password). Kept separate from FRONTEND_URL so a
  // future FRONTEND_URL change (e.g. adding a marketing subdomain) can't
  // accidentally widen where email links point — see docs/security/sprint-2a-security.md.
  APP_PUBLIC_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().min(1),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters'),

  AUTH_COOKIE_DOMAIN: z.string().min(1),
  AUTH_COOKIE_SECURE: zBooleanString(false),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  PASSWORD_RESET_EXPIRES_IN: z.string().default('1h'),

  EMAIL_VERIFICATION_EXPIRES_IN: z.string().default('24h'),
  EMAIL_VERIFICATION_RESEND_COOLDOWN: z.string().default('60s'),

  EMAIL_PROVIDER: z.enum(['mailpit', 'resend', 'postmark']).default('mailpit'),
  EMAIL_FROM: z.string().min(1),
  MAILPIT_HOST: z.string().default('localhost'),
  MAILPIT_PORT: z.coerce.number().int().positive().default(1025),
  RESEND_API_KEY: z.string().optional(),
  POSTMARK_SERVER_TOKEN: z.string().optional(),

  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_REDIS_PREFIX: z.string().min(1).default('beaconvie:throttle'),

  // Express `trust proxy` setting: 'false' (default, no proxy), 'true' (trust
  // the nearest hop unconditionally — only safe behind a single known reverse
  // proxy), or a number of hops to trust from the client side. See main.ts.
  TRUST_PROXY: z.string().default('false'),

  // Optional cap on concurrent active sessions per user; unset = unlimited.
  SESSION_MAX_ACTIVE: z.coerce.number().int().positive().optional(),

  // --- Companion Core (Sprint 2B) ---
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  DEFAULT_AI_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'mock']).default('mock'),
  // Optional: no explicit fallback attempted if unset. Mock is never appended
  // automatically anymore — see AI_ENABLE_MOCK_PROVIDER and ProviderRegistryService.
  FALLBACK_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'mock']).optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).default(2),
  // Explicit opt-in for the deterministic Mock provider to even be
  // constructed/registered. Outside production this is effectively moot (mock
  // is registered whenever NODE_ENV !== 'production' regardless of this flag)
  // — it exists as a second, independent gate alongside the NODE_ENV check
  // (defense in depth), and production boot fails fast if it's ever true.
  AI_ENABLE_MOCK_PROVIDER: zBooleanString(false),

  // --- Companion Core (Sprint 2B) — rate limiting, concurrency, usage budget ---
  // Per-authenticated-user request rate limit on Companion generation endpoints.
  AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  // Secondary, looser per-IP ceiling (defense against one IP spread across many
  // accounts) — same window as AI_RATE_LIMIT_WINDOW_MS.
  AI_RATE_LIMIT_IP_MAX: z.coerce.number().int().positive().default(100),
  // How many generations one user may have in flight at once.
  AI_MAX_CONCURRENT_GENERATIONS_PER_USER: z.coerce.number().int().positive().default(1),
  // Safety-net TTL on the Redis concurrency-lock counter so a crashed/never-released
  // lock self-expires rather than permanently blocking that user.
  AI_CONCURRENCY_LOCK_TTL_MS: z.coerce.number().int().positive().default(120_000),
  // Usage budget — coarse abuse/cost ceilings, independent of the short-window
  // rate limit above. Checked against durable AIUsage records before a new
  // generation is allowed to start.
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().positive().default(50),
  AI_DAILY_TOKEN_LIMIT: z.coerce.number().int().positive().default(200_000),
  AI_MONTHLY_TOKEN_LIMIT: z.coerce.number().int().positive().default(2_000_000),

  // --- Discovery AI cost-control parity (Sprint 12) — Tarot/Numerology/Natal Chart's own
  // rate-limit bucket, isolated from `companion`/`companion-ip`/`auth`/`payment` (same isolation
  // convention `f8fcba1` established). Tighter default than Companion's 20/60s: a Discovery
  // interpret call is a single heavier generation (not a chat message), and this is the confirmed
  // abuse vector (Sprint 12 audit §30 — the unlimited `:id/interpret` retry endpoint). Budget
  // ceilings (daily/monthly token limits) remain the AI_* ones above, checked GLOBALLY per user
  // across every feature — see CostControlService.checkBudget's docstring.
  DISCOVERY_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  DISCOVERY_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  DISCOVERY_RATE_LIMIT_IP_MAX: z.coerce.number().int().positive().default(50),

  // --- Memory Intelligence (Sprint 3B) — deterministic context token budgeting. Token counts
  // are all estimated via a fixed chars/4 heuristic (ContextBudgetService.estimateTokens), not
  // a real tokenizer — see docs/architecture/memory-intelligence.md "Context budget algorithm".
  MEMORY_CONTEXT_WINDOW_TOKENS: z.coerce.number().int().positive().default(8_000),
  MEMORY_CONTEXT_RESERVED_OUTPUT_TOKENS: z.coerce.number().int().positive().default(1_024),
  MEMORY_CONTEXT_CONVERSATION_MAX_TOKENS: z.coerce.number().int().positive().default(3_000),
  MEMORY_CONTEXT_MEMORY_MAX_TOKENS: z.coerce.number().int().positive().default(1_500),

  // --- Premium & Payment Foundation (Sprint 7) — one provider (PayOS), one product
  // (PREMIUM_30D). Price/duration are backend-owned config, never client-supplied. ---
  PAYOS_CLIENT_ID: z.string().optional(),
  PAYOS_API_KEY: z.string().optional(),
  // Signs both outgoing checkout requests and verifies incoming webhook signatures (HMAC-SHA256)
  // — never sent to the client, never logged. See docs/architecture/payment-foundation.md.
  PAYOS_CHECKSUM_KEY: z.string().optional(),
  PAYOS_BASE_URL: z.string().url().default('https://api-merchant.payos.vn'),
  // Defense-in-depth gate mirroring AI_ENABLE_MOCK_PROVIDER: outside production, short-circuits
  // only the outbound "create checkout link" HTTP call with a locally-built (but still
  // real-signature) response, so checkout order-creation is testable without a network dependency
  // on PayOS. Webhook signature VERIFICATION is always real — this flag never touches it. See
  // PayOSProvider and docs/security/ai-safety.md "Mock provider" for the precedent this mirrors.
  PAYOS_MOCK_CHECKOUT: zBooleanString(false),
  // Kill switch (PayOS Production Readiness Gate): flips checkout off without a redeploy while
  // existing entitlements and webhook processing stay untouched — see PaymentCheckoutService and
  // docs/progress/payos-production-readiness.md "Payment kill switch". Already-created orders may
  // still legitimately receive a real webhook after checkout is disabled, so the webhook route never
  // checks this flag.
  PAYMENTS_ENABLED: zBooleanString(true),
  PREMIUM_PRICE_VND: z.coerce.number().int().positive().default(79_000),
  PREMIUM_DURATION_DAYS: z.coerce.number().int().positive().default(30),
  PAYMENT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  PAYMENT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  // --- Natal Chart Discovery Foundation (Sprint 9) — geocoding. Public Nominatim (OpenStreetMap)
  // is an MVP/low-volume-appropriate default; the base URL is overridable so a hosted/
  // self-hosted instance can replace it at production scale without a code change. See
  // docs/architecture/natal-chart-discovery.md "Geocoding architecture". ---
  GEOCODING_NOMINATIM_BASE_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  // Nominatim's usage policy requires an identifying User-Agent on every request.
  GEOCODING_USER_AGENT: z.string().min(1).default('BeaconVie/1.0 (natal-chart-geocoding)'),
  GEOCODING_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),
  // How long a search result candidate stays resolvable by its opaque token before chart
  // creation must re-search — bounds both Redis memory and how stale a "confirmed" location can
  // be.
  GEOCODING_CANDIDATE_TTL_SECONDS: z.coerce.number().int().positive().default(900),

  // --- Production error tracking (Sprint 12) — optional. Absent DSN = Sentry fully disabled
  // (SentryModule.forRoot's `enabled: !!dsn`), never a boot failure either way. A DSN is a
  // write-only ingestion identifier, not a secret credential (see Sentry's own docs) — safe to
  // read from a plain env var, no different in sensitivity from e.g. CORS_ORIGINS. ---
  SENTRY_DSN: z.string().url().optional(),

  // --- Product Analytics (Sprint 13) — optional, mirrors SENTRY_DSN's own contract exactly:
  // absent key = analytics fully disabled (NoopAnalyticsSink), never a boot failure either way.
  // See docs/architecture/product-analytics.md. Provider: PostHog, reached via a minimal direct
  // HTTP client (no SDK dependency — see PostHogHttpSink) rather than posthog-node/posthog-js,
  // specifically to avoid inheriting their autocapture/session-replay defaults, which would need
  // to be fought rather than simply not existing (see product-analytics.md §"Why not the SDK").
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),
  // Master kill switch, independent of whether a key is configured — lets ops disable analytics
  // delivery instantly (e.g. mid-incident) without touching the key itself.
  ANALYTICS_ENABLED: zBooleanString(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Fails fast on boot if any required environment variable is missing or malformed,
 * per Sprint 1 requirement: never fall back to an insecure default in production.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  if (parsed.data.NODE_ENV === 'production') {
    if (!parsed.data.AUTH_COOKIE_SECURE) {
      throw new Error('AUTH_COOKIE_SECURE must be true in production');
    }
    if (parsed.data.JWT_ACCESS_SECRET.startsWith('replace-with')) {
      throw new Error('JWT_ACCESS_SECRET is still the placeholder value');
    }
    if (parsed.data.JWT_REFRESH_SECRET.startsWith('replace-with')) {
      throw new Error('JWT_REFRESH_SECRET is still the placeholder value');
    }
    if (parsed.data.CSRF_SECRET.startsWith('replace-with')) {
      throw new Error('CSRF_SECRET is still the placeholder value');
    }
    if (parsed.data.EMAIL_PROVIDER === 'mailpit') {
      throw new Error('EMAIL_PROVIDER cannot be "mailpit" in production — configure resend or postmark');
    }
    if (parsed.data.EMAIL_PROVIDER === 'resend' && !parsed.data.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }
    if (parsed.data.EMAIL_PROVIDER === 'postmark' && !parsed.data.POSTMARK_SERVER_TOKEN) {
      throw new Error('POSTMARK_SERVER_TOKEN is required when EMAIL_PROVIDER=postmark');
    }
    if (!parsed.data.APP_PUBLIC_URL) {
      throw new Error('APP_PUBLIC_URL is required in production (fixed base URL for email links)');
    }
    if (parsed.data.DEFAULT_AI_PROVIDER === 'mock') {
      throw new Error('DEFAULT_AI_PROVIDER cannot be "mock" in production — configure a real provider');
    }
    if (parsed.data.FALLBACK_PROVIDER === 'mock') {
      throw new Error('FALLBACK_PROVIDER cannot be "mock" in production — configure a real fallback or leave it unset');
    }
    if (parsed.data.AI_ENABLE_MOCK_PROVIDER) {
      throw new Error('AI_ENABLE_MOCK_PROVIDER cannot be true in production — the Mock provider must never be reachable there');
    }
    requireProviderKey(parsed.data, parsed.data.DEFAULT_AI_PROVIDER, 'DEFAULT_AI_PROVIDER');
    if (parsed.data.FALLBACK_PROVIDER) {
      requireProviderKey(parsed.data, parsed.data.FALLBACK_PROVIDER, 'FALLBACK_PROVIDER');
    }
    if (!parsed.data.PAYOS_CLIENT_ID || !parsed.data.PAYOS_API_KEY || !parsed.data.PAYOS_CHECKSUM_KEY) {
      throw new Error('PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY are all required in production');
    }
    if (parsed.data.PAYOS_MOCK_CHECKOUT) {
      throw new Error('PAYOS_MOCK_CHECKOUT cannot be true in production — the real PayOS API must always be called there');
    }
  } else {
    // Outside production, a non-mailpit provider still needs its credential —
    // fail fast rather than silently dropping emails.
    if (parsed.data.EMAIL_PROVIDER === 'resend' && !parsed.data.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }
    if (parsed.data.EMAIL_PROVIDER === 'postmark' && !parsed.data.POSTMARK_SERVER_TOKEN) {
      throw new Error('POSTMARK_SERVER_TOKEN is required when EMAIL_PROVIDER=postmark');
    }
    // Same rule for AI providers: 'mock' needs nothing (that's its point — unit
    // tests/CI/offline dev), but selecting a real provider without its key is
    // almost always a misconfiguration, not an intentional choice.
    requireProviderKey(parsed.data, parsed.data.DEFAULT_AI_PROVIDER, 'DEFAULT_AI_PROVIDER');
    if (parsed.data.FALLBACK_PROVIDER) {
      requireProviderKey(parsed.data, parsed.data.FALLBACK_PROVIDER, 'FALLBACK_PROVIDER');
    }
  }

  return parsed.data;
}

function requireProviderKey(
  data: Pick<EnvConfig, 'OPENAI_API_KEY' | 'ANTHROPIC_API_KEY' | 'GEMINI_API_KEY'>,
  provider: 'openai' | 'anthropic' | 'gemini' | 'mock',
  varName: 'DEFAULT_AI_PROVIDER' | 'FALLBACK_PROVIDER',
): void {
  if (provider === 'openai' && !data.OPENAI_API_KEY) {
    throw new Error(`OPENAI_API_KEY is required when ${varName}=openai`);
  }
  if (provider === 'anthropic' && !data.ANTHROPIC_API_KEY) {
    throw new Error(`ANTHROPIC_API_KEY is required when ${varName}=anthropic`);
  }
  if (provider === 'gemini' && !data.GEMINI_API_KEY) {
    throw new Error(`GEMINI_API_KEY is required when ${varName}=gemini`);
  }
}
