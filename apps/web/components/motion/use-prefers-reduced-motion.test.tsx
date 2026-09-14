import { act, renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

it('reads the current preference, subscribes to changes, and cleans up', () => {
  const original = window.matchMedia;
  let matches = true;
  const listeners = new Set<() => void>();
  window.matchMedia = jest.fn(() => ({
    get matches() { return matches; },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
  try {
    const { result, unmount } = renderHook(usePrefersReducedMotion);
    expect(result.current).toBe(true);
    act(() => { matches = false; listeners.forEach((fn) => fn()); });
    expect(result.current).toBe(false);
    unmount();
    expect(listeners.size).toBe(0);
  } finally { window.matchMedia = original; }
});
