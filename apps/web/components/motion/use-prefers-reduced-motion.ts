'use client';

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * CSS alone (`motion-safe:`/`motion-reduce:`) covers most of the app, but JS-driven sequences
 * (pointer parallax rAF loops, framer-motion ritual choreography) need the same signal in script.
 * Starts `false` so SSR/first paint stays deterministic, then syncs on mount + live media-query
 * changes (a user can toggle the OS setting without reloading).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}
