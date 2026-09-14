'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * CSS alone (`motion-safe:`/`motion-reduce:`) covers most of the app, but JS-driven sequences
 * (pointer parallax rAF loops, framer-motion ritual choreography) need the same signal in script.
 * Starts `false` so SSR/first paint stays deterministic, then syncs on mount + live media-query
 * changes (a user can toggle the OS setting without reloading).
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
