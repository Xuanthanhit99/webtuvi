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
    corsOrigins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),

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
    authCookie: {
      domain: env.AUTH_COOKIE_DOMAIN,
      secure: env.AUTH_COOKIE_SECURE,
      sameSite: env.AUTH_COOKIE_SAME_SITE,
    },
    passwordReset: {
      expiresIn: env.PASSWORD_RESET_EXPIRES_IN,
    },
    mail: {
      provider: env.MAIL_PROVIDER,
      from: env.MAIL_FROM,
      mailpitHost: env.MAILPIT_HOST,
      mailpitPort: env.MAILPIT_PORT,
    },
    authRateLimit: {
      max: env.AUTH_RATE_LIMIT_MAX,
      windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    },
  };
});

export type AppConfiguration = ReturnType<typeof appConfig>;
