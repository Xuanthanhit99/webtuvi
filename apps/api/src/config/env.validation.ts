import { z } from 'zod';

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
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
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
  // Optional: no explicit fallback attempted if unset (the always-last mock
  // safety net still applies regardless — see ProviderOrchestrator).
  FALLBACK_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'mock']).optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).default(2),
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
    requireProviderKey(parsed.data, parsed.data.DEFAULT_AI_PROVIDER, 'DEFAULT_AI_PROVIDER');
    if (parsed.data.FALLBACK_PROVIDER) {
      requireProviderKey(parsed.data, parsed.data.FALLBACK_PROVIDER, 'FALLBACK_PROVIDER');
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
