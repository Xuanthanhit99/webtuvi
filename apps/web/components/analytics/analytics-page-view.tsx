'use client';

import type { AnalyticsEventProperties, ClientAnalyticsEventName } from '@beaconvie/types';
import { useTrackEvent } from '@/hooks/use-track-event';

/**
 * Renders nothing — a small client-component seam that lets a server-component page (most of
 * `apps/web/app`) still fire a page-view analytics event, which requires browser APIs
 * (`localStorage`, `fetch` with a session cookie) a Server Component can't use directly.
 */
export function AnalyticsPageView({
  event,
  properties,
}: {
  event: ClientAnalyticsEventName;
  properties?: AnalyticsEventProperties;
}) {
  useTrackEvent(event, properties);
  return null;
}
