/**
 * Read directly from process.env (not via ConfigService) because NestJS decorators
 * evaluate at class-definition time, before the DI container exists. Values are
 * still governed by the same AUTH_RATE_LIMIT_* variables validated on boot by
 * env.validation.ts.
 */
export const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 5);
export const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 900000);
