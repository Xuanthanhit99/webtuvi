import { Injectable, Logger } from '@nestjs/common';
import type { AnalyticsCaptureEvent, AnalyticsSink } from './analytics-sink.interface';

const CAPTURE_TIMEOUT_MS = 5_000;

/**
 * Talks to PostHog's `/i/v0/e` HTTP ingestion endpoint directly (https://posthog.com/docs/api/capture
 * — current official docs name `/i/v0/e` and `/batch` as "the main way to send events," and do not
 * mention the older `/capture/` path this file used until Sprint 13 Release Closure's independent
 * doc-verification pass caught the mismatch; fixed here, same request/field shape otherwise)
 * instead of depending on `posthog-node`. Deliberate: the SDK is built around autocapture,
 * session-recording hooks, and a much larger surface than a single `track()` call needs — every
 * one of those would need to be found and disabled to hold the privacy allowlist in
 * `AnalyticsEventPropertiesDto`, versus this file, which can only ever send the exact shape
 * `AnalyticsService` builds. See docs/architecture/product-analytics.md §"Why not the SDK".
 *
 * Best-effort by design (Sprint 13 brief §20/§21): a failed or slow PostHog request is logged at
 * `warn` (event name + status only, never `properties` — they're already privacy-safe by the time
 * they reach here, but there's no reason to put them in logs too) and swallowed. Analytics must
 * never be capable of failing a request that matters (signup, checkout, payment) — see
 * `AnalyticsService.capture`, which is the only caller and always wraps this in its own try/catch
 * as a second layer of the same guarantee.
 */
@Injectable()
export class PostHogHttpSink implements AnalyticsSink {
  private readonly logger = new Logger('Analytics');

  constructor(
    private readonly apiKey: string,
    private readonly host: string,
  ) {}

  async capture(event: AnalyticsCaptureEvent): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.host}/i/v0/e`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          event: event.event,
          distinct_id: event.distinctId,
          properties: event.properties,
          timestamp: event.timestamp.toISOString(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`PostHog capture failed: ${event.event} → HTTP ${response.status}`);
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      this.logger.warn(`PostHog capture ${aborted ? 'timed out' : 'errored'}: ${event.event}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
