import type { AnalyticsEventName, AnalyticsEventProperties } from '@beaconvie/types';

export interface AnalyticsCaptureEvent {
  event: AnalyticsEventName;
  /** `userId` if authenticated, otherwise the client's anonymous id — never both, never raw PII. */
  distinctId: string;
  properties: AnalyticsEventProperties;
  /** Server receipt time (authoritative) — always set by `AnalyticsService`, never trusted from the client. */
  timestamp: Date;
}

/**
 * The one seam between "we decided to capture this event" (AnalyticsService, privacy-enforced)
 * and "where it actually goes" (a specific provider, or nowhere). Swapping providers — or adding a
 * second one later — never touches anything outside `sinks/`.
 */
export interface AnalyticsSink {
  capture(event: AnalyticsCaptureEvent): Promise<void>;
}

export const ANALYTICS_SINK = Symbol('ANALYTICS_SINK');
