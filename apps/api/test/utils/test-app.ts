import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';

/**
 * Mirrors the bootstrap in src/main.ts, minus helmet/CORS which don't matter for
 * supertest. RequestIdMiddleware is applied automatically via AppModule.configure().
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();
  return app;
}

/** Extracts a specific cookie's `name=value` pair from a response's Set-Cookie headers. */
export function extractCookie(setCookieHeaders: string[] | undefined, name: string): string | undefined {
  if (!setCookieHeaders) return undefined;
  const header = setCookieHeaders.find((c) => c.startsWith(`${name}=`));
  return header?.split(';')[0];
}

/**
 * Every register/login/refresh response also sets a fresh CSRF cookie
 * (double-submit pattern — see CsrfGuard/CookieService). Authenticated
 * mutation requests in tests need to send that cookie's exact value back as
 * the X-CSRF-Token header alongside the session cookie.
 */
export function csrfHeaders(accessCookie: string, setCookieHeaders: string[] | undefined): Record<string, string> {
  const csrfCookie = extractCookie(setCookieHeaders, 'beaconvie_csrf_token');
  if (!csrfCookie) throw new Error('No beaconvie_csrf_token cookie found in response — was setAuthCookies called?');
  const csrfToken = csrfCookie.split('=').slice(1).join('=');
  return {
    Cookie: `${accessCookie}; ${csrfCookie}`,
    'X-CSRF-Token': csrfToken,
  };
}
