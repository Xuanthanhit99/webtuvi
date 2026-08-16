import './instrument';
import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppLogger } from './common/logger/pino.logger';
import type { AppConfiguration } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const config = configService.get<AppConfiguration>('app')!;

  app.useLogger(new AppLogger(config.nodeEnv));

  // Only trust X-Forwarded-For when explicitly configured for a known reverse
  // proxy topology — otherwise req.ip (used by the rate limiter) trusts
  // whatever the client claims, letting one attacker bypass IP-based limits
  // by spoofing the header. 'false' (default) = don't trust any proxy hop.
  const trustProxySetting =
    config.trustProxy === 'true' ? true : config.trustProxy === 'false' ? false : Number(config.trustProxy);
  app.set('trust proxy', trustProxySetting);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  if (config.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BeaconVie API')
      .setDescription(
        'Auth, Onboarding, Companion, Dashboard. State-changing requests on authenticated ' +
          'routes require an X-CSRF-Token header matching the beaconvie_csrf_token cookie — see GET /auth/csrf-token.',
      )
      .setVersion('0.2.0')
      .addCookieAuth('beaconvie_access_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'beaconvie_access_token',
      })
      .addApiKey(
        { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' },
        'csrf',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(config.port);
  // eslint-disable-next-line no-console
  console.log(`BeaconVie API listening on ${config.apiBaseUrl}`);
  // Sprint 8.5 remediation — the audit found that a real provider key configured
  // without also setting DEFAULT_AI_PROVIDER silently runs the whole product on
  // the Mock provider with no visible signal. This line is the visible signal:
  // it names which provider/model actually handles generation, and explicitly
  // says "mock" rather than omitting it, so an unintentional mock-only runtime
  // is obvious in the boot log instead of discoverable only by reading code.
  // Never logs API keys or any other credential.
  // eslint-disable-next-line no-console
  console.log(`AI provider: ${config.ai.defaultProvider}`);
  // eslint-disable-next-line no-console
  console.log(`AI fallback: ${config.ai.fallbackProvider ?? '(none)'}`);
}

bootstrap();
