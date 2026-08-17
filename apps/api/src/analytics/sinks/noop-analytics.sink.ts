import { Injectable } from '@nestjs/common';
import type { AnalyticsCaptureEvent, AnalyticsSink } from './analytics-sink.interface';

/**
 * The default sink whenever analytics isn't configured (no `POSTHOG_API_KEY`), explicitly
 * disabled (`ANALYTICS_ENABLED=false`), or the process is running under `NODE_ENV=test` (tests
 * must never make a real network call, regardless of what's in the environment — see
 * `AnalyticsModule`'s sink factory). Absent configuration is a safe no-op, never a boot failure,
 * mirroring `SentryModule`'s own `enabled: !!dsn` contract.
 */
@Injectable()
export class NoopAnalyticsSink implements AnalyticsSink {
  async capture(_event: AnalyticsCaptureEvent): Promise<void> {
    // Intentionally does nothing.
  }
}
