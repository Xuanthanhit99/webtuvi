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
