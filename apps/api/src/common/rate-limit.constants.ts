/**
 * Read directly from process.env (not via ConfigService) because NestJS decorators
 * evaluate at class-definition time, before the DI container exists. Values are
 * still governed by the same AUTH_RATE_LIMIT_* variables validated on boot by
 * env.validation.ts.
 */
export const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 5);
export const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 900000);

/**
 * Shared by AccountExportController/MemoryExportController/JournalExportController's own
 * `@Throttle({ default: { limit, ttl } })` — all three mirror the same 5/60s, IP-tracked
 * precedent (see AccountExportController's own doc comment). Defaults preserve that exact
 * production value; env-configurable for the same reason AUTH_RATE_LIMIT_MAX is: a full
 * e2e/Playwright run can call an export endpoint from more than one spec file within the same
 * 60s window (all sharing one test-runner IP), which trips this deliberately tight per-IP
 * ceiling even though no single spec file's own export volume is anywhere close to abusive.
 */
export const EXPORT_RATE_LIMIT_MAX = Number(process.env.EXPORT_RATE_LIMIT_MAX ?? 5);
export const EXPORT_RATE_LIMIT_WINDOW_MS = Number(process.env.EXPORT_RATE_LIMIT_WINDOW_MS ?? 60000);
