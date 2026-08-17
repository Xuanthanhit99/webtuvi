'use client';

import { useEffect, useRef } from 'react';
import type { AnalyticsEventProperties, ClientAnalyticsEventName } from '@beaconvie/types';
import { trackEvent } from '@/lib/analytics';

/**
 * Fires `event` exactly once per real mount. The `fired` ref (not the effect's own dependency
 * array) is what prevents a double-fire under React 18 Strict Mode's dev-only mount→unmount→
 * remount cycle — `properties` is typically an inline object literal at the call site, so it
 * can't safely be a dependency (a new identity every render would either loop or need a second
 * guard anyway). This hook intentionally only ever reads `properties` once, on the first real
 * fire; a page whose properties can legitimately change after mount should call `trackEvent`
 * directly instead of using this hook.
 */
export function useTrackEvent(event: ClientAnalyticsEventName, properties?: AnalyticsEventProperties): void {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
