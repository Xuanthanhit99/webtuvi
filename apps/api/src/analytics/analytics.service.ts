import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AnalyticsEventInput, AnalyticsEventProperties, ServerAnalyticsEventName } from '@beaconvie/types';
import { ANALYTICS_SINK, type AnalyticsSink } from './sinks/analytics-sink.interface';
import { MAX_ROUTE_LENGTH } from './analytics.constants';

export interface TrackServerEventInput {
  event: ServerAnalyticsEventName;
  /** The authenticated user this event belongs to — server events are always attributable to a
   * real account (there is no anonymous server-authoritative event in this contract). */
  userId: string;
  properties?: AnalyticsEventProperties;
}

/**
 * The single ingestion funnel for every analytics event in the product, both client-submitted
 * (via `AnalyticsController`, already DTO-validated against the client-allowed event/property
 * allowlist) and server-authoritative (called in-process by other services at the exact point the
 * underlying fact becomes true — see e.g. `PaymentWebhookService`, `AuthService`).
 *
 * Two guarantees this class exists to hold, per Sprint 13 brief §20/§33:
 *  1. Analytics can never fail — or even meaningfully slow down — the operation it's describing.
 *     `capture()` never throws; every error is caught and logged here, one layer above the sink's
 *     own best-effort handling (defense in depth, not redundant: a sink swap that forgets its own
 *     try/catch still can't take down a caller).
 *  2. Nothing reaches the sink that didn't already pass through the property allowlist — `route`
 *     is re-sanitized here (query string/hash stripped, length capped) even though the DTO layer
 *     already constrains it, because server-originated events don't go through that DTO at all.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('Analytics');

  constructor(@Inject(ANALYTICS_SINK) private readonly sink: AnalyticsSink) {}

  /** Called by `AnalyticsController` for a batch of client-submitted events, already validated
   * against `CLIENT_ANALYTICS_EVENT_NAMES` and the property allowlist by `TrackAnalyticsEventsDto`. */
  async trackClientEvents(events: AnalyticsEventInput[], userId: string | null): Promise<void> {
    await Promise.all(
      events.map((input) =>
        this.capture({
          event: input.event,
          distinctId: userId ?? input.anonymousId,
          properties: this.sanitizeProperties(input.properties),
        }),
      ),
    );
  }

  /** Called in-process by other backend services for events only the server can authoritatively
   * observe. Never exposed over HTTP — a client cannot cause one of these to fire directly. */
  async trackServerEvent(input: TrackServerEventInput): Promise<void> {
    await this.capture({
      event: input.event,
      distinctId: input.userId,
      properties: this.sanitizeProperties(input.properties),
    });
  }

  private async capture(params: {
    event: string;
    distinctId: string;
    properties: AnalyticsEventProperties;
  }): Promise<void> {
    try {
      await this.sink.capture({
        // Cast is safe: both call sites above only ever pass a name from one of the two
        // typed unions that together make up `AnalyticsEventName`.
        event: params.event as never,
        distinctId: params.distinctId,
        properties: params.properties,
        timestamp: new Date(),
      });
    } catch (error) {
      // Must never throw into the caller — signup/checkout/payment/etc. always complete
      // regardless of analytics delivery. See class docstring guarantee #1.
      this.logger.warn(`Analytics capture threw unexpectedly for ${params.event}: ${(error as Error).message}`);
    }
  }

  private sanitizeProperties(properties?: AnalyticsEventProperties): AnalyticsEventProperties {
    if (!properties) return {};
    const { route, ...rest } = properties;
    if (!route) return rest;
    const pathnameOnly = route.split('?')[0]!.split('#')[0]!.slice(0, MAX_ROUTE_LENGTH);
    return { ...rest, route: pathnameOnly };
  }
}
