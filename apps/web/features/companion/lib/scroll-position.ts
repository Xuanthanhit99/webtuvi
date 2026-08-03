/** Within this many pixels of the bottom counts as "already reading the latest message". */
export const NEAR_BOTTOM_THRESHOLD_PX = 120;

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Pure so it's directly unit-testable without mounting the scrollable
 * message list — see companion-view.tsx's `onScroll` handler and
 * scroll-position.spec.ts. Sprint 2B audit Finding 4 (non-intrusive
 * auto-scroll): auto-scroll should only happen when the user was already
 * near the bottom, never yank them away from reading older messages.
 */
export function isNearBottom(el: ScrollMetrics, thresholdPx: number = NEAR_BOTTOM_THRESHOLD_PX): boolean {
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  return distanceFromBottom <= thresholdPx;
}
