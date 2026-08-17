import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS_SINK } from './sinks/analytics-sink.interface';
import { NoopAnalyticsSink } from './sinks/noop-analytics.sink';
import { PostHogHttpSink } from './sinks/posthog-http.sink';
import type { AppConfiguration } from '../config/configuration';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    {
      provide: ANALYTICS_SINK,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<AppConfiguration>('app')!;
        // Never emit real events under `test` — a test suite hammering an external endpoint
        // (or even a slow one) is exactly the kind of flake/latency the Sprint 13 brief §10
        // ("test env should not emit external analytics") calls out explicitly.
        const isTestEnv = config.nodeEnv === 'test';
        const enabled = !isTestEnv && config.analytics.enabled && Boolean(config.analytics.posthogApiKey);
        return enabled ? new PostHogHttpSink(config.analytics.posthogApiKey!, config.analytics.posthogHost) : new NoopAnalyticsSink();
      },
    },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
