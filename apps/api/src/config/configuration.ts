import { registerAs } from '@nestjs/config';
import { validateEnv } from './env.validation';

/**
 * Single source of app configuration. Validates `process.env` eagerly (fail-fast on
 * boot per Sprint 1 requirement) and exposes it as the `app` namespace so the rest of
 * the codebase reads `configService.get('app.jwt.accessSecret')` instead of touching
 * `process.env` directly anywhere else.
 */
export const appConfig = registerAs('app', () => {
  const env = validateEnv(process.env);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
    apiBaseUrl: env.API_BASE_URL,
    frontendUrl: env.FRONTEND_URL,
    // Falls back to FRONTEND_URL in dev/test so local email links keep working
    // without extra .env setup; production requires it explicitly (env.validation.ts).
    appPublicUrl: env.APP_PUBLIC_URL ?? env.FRONTEND_URL,
    corsOrigins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    trustProxy: env.TRUST_PROXY,

    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    csrf: {
      secret: env.CSRF_SECRET,
    },
    authCookie: {
      domain: env.AUTH_COOKIE_DOMAIN,
      secure: env.AUTH_COOKIE_SECURE,
      sameSite: env.AUTH_COOKIE_SAME_SITE,
    },
    passwordReset: {
      expiresIn: env.PASSWORD_RESET_EXPIRES_IN,
    },
    emailVerification: {
      expiresIn: env.EMAIL_VERIFICATION_EXPIRES_IN,
      resendCooldown: env.EMAIL_VERIFICATION_RESEND_COOLDOWN,
    },
    mail: {
      provider: env.EMAIL_PROVIDER,
      from: env.EMAIL_FROM,
      mailpitHost: env.MAILPIT_HOST,
      mailpitPort: env.MAILPIT_PORT,
      resendApiKey: env.RESEND_API_KEY,
      postmarkServerToken: env.POSTMARK_SERVER_TOKEN,
    },
    authRateLimit: {
      max: env.AUTH_RATE_LIMIT_MAX,
      windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
      redisPrefix: env.RATE_LIMIT_REDIS_PREFIX,
    },
    sessionMaxActive: env.SESSION_MAX_ACTIVE,
    ai: {
      openaiApiKey: env.OPENAI_API_KEY,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      geminiApiKey: env.GEMINI_API_KEY,
      defaultProvider: env.DEFAULT_AI_PROVIDER,
      fallbackProvider: env.FALLBACK_PROVIDER,
      timeoutMs: env.AI_TIMEOUT_MS,
      maxRetries: env.AI_MAX_RETRIES,
      enableMockProvider: env.AI_ENABLE_MOCK_PROVIDER,
      rateLimit: {
        max: env.AI_RATE_LIMIT_MAX,
        windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
        ipMax: env.AI_RATE_LIMIT_IP_MAX,
      },
      concurrency: {
        maxPerUser: env.AI_MAX_CONCURRENT_GENERATIONS_PER_USER,
        lockTtlMs: env.AI_CONCURRENCY_LOCK_TTL_MS,
      },
      budget: {
        dailyRequestLimit: env.AI_DAILY_REQUEST_LIMIT,
        dailyTokenLimit: env.AI_DAILY_TOKEN_LIMIT,
        monthlyTokenLimit: env.AI_MONTHLY_TOKEN_LIMIT,
      },
    },
    discovery: {
      rateLimit: {
        max: env.DISCOVERY_RATE_LIMIT_MAX,
        windowMs: env.DISCOVERY_RATE_LIMIT_WINDOW_MS,
        ipMax: env.DISCOVERY_RATE_LIMIT_IP_MAX,
      },
    },
    memory: {
      contextBudget: {
        totalWindowTokens: env.MEMORY_CONTEXT_WINDOW_TOKENS,
        reservedOutputTokens: env.MEMORY_CONTEXT_RESERVED_OUTPUT_TOKENS,
        conversationMaxTokens: env.MEMORY_CONTEXT_CONVERSATION_MAX_TOKENS,
        memoryMaxTokens: env.MEMORY_CONTEXT_MEMORY_MAX_TOKENS,
      },
    },
    payment: {
      enabled: env.PAYMENTS_ENABLED,
      payos: {
        clientId: env.PAYOS_CLIENT_ID,
        apiKey: env.PAYOS_API_KEY,
        checksumKey: env.PAYOS_CHECKSUM_KEY,
        baseUrl: env.PAYOS_BASE_URL,
        mockCheckout: env.PAYOS_MOCK_CHECKOUT,
      },
      premium: {
        priceVnd: env.PREMIUM_PRICE_VND,
        durationDays: env.PREMIUM_DURATION_DAYS,
      },
      rateLimit: {
        max: env.PAYMENT_RATE_LIMIT_MAX,
        windowMs: env.PAYMENT_RATE_LIMIT_WINDOW_MS,
      },
    },
    geocoding: {
      nominatimBaseUrl: env.GEOCODING_NOMINATIM_BASE_URL,
      userAgent: env.GEOCODING_USER_AGENT,
      timeoutMs: env.GEOCODING_TIMEOUT_MS,
      candidateTtlSeconds: env.GEOCODING_CANDIDATE_TTL_SECONDS,
    },
    sentry: {
      dsn: env.SENTRY_DSN,
    },
    analytics: {
      enabled: env.ANALYTICS_ENABLED,
      posthogApiKey: env.POSTHOG_API_KEY,
      posthogHost: env.POSTHOG_HOST,
    },
  };
});

export type AppConfiguration = ReturnType<typeof appConfig>;
