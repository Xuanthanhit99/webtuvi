import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  CORS_ORIGINS: z.string().min(1),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  AUTH_COOKIE_DOMAIN: z.string().min(1),
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  PASSWORD_RESET_EXPIRES_IN: z.string().default('1h'),

  MAIL_PROVIDER: z.enum(['mailpit', 'smtp']).default('mailpit'),
  MAIL_FROM: z.string().min(1),
  MAILPIT_HOST: z.string().default('localhost'),
  MAILPIT_PORT: z.coerce.number().int().positive().default(1025),

  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
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
  }

  return parsed.data;
}
