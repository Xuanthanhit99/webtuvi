import { renderHook, act } from '@testing-library/react';
import { useAutoScroll } from './use-auto-scroll';

/** jsdom doesn't implement layout, so scrollTo/scrollHeight/clientHeight/scrollTop are stubbed by hand. */
function makeFakeContainer(overrides: Partial<{ scrollTop: number; scrollHeight: number; clientHeight: number }> = {}) {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { value: overrides.scrollHeight ?? 1000, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: overrides.clientHeight ?? 200, configurable: true });
  Object.defineProperty(el, 'scrollTop', { value: overrides.scrollTop ?? 800, writable: true, configurable: true });
  el.scrollTo = jest.fn(({ top }: { top: number }) => {
    Object.defineProperty(el, 'scrollTop', { value: top, writable: true, configurable: true });
  }) as unknown as typeof el.scrollTo;
  return el;
}

describe('useAutoScroll (Sprint 2B audit Finding 4)', () => {
  it('auto-scrolls to the bottom when new content arrives and the user was already near the bottom', () => {
    const { result, rerender } = renderHook(({ itemCount, streamingLength }) => useAutoScroll({ itemCount, streamingLength, prefersReducedMotion: () => false }), {
      initialProps: { itemCount: 1, streamingLength: 0 },
    });
    const container = makeFakeContainer({ scrollTop: 800, scrollHeight: 1000, clientHeight: 200 }); // near bottom
    act(() => {
      (result.current.containerRef as { current: HTMLDivElement | null }).current = container;
    });

    rerender({ itemCount: 2, streamingLength: 0 });

    expect(container.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1000, behavior: 'smooth' }));
    expect(result.current.hasNewMessage).toBe(false);
  });

  it('does not force-scroll when the user has scrolled up to read older messages', () => {
    const { result, rerender } = renderHook(({ itemCount, streamingLength }) => useAutoScroll({ itemCount, streamingLength, prefersReducedMotion: () => false }), {
      initialProps: { itemCount: 1, streamingLength: 0 },
    });
    const container = makeFakeContainer({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }); // far from bottom
    act(() => {
      (result.current.containerRef as { current: HTMLDivElement | null }).current = container;
      result.current.handleScroll(); // registers "not near bottom" from the current scroll position
    });

    rerender({ itemCount: 1, streamingLength: 40 }); // a token arrives on the in-progress reply

    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  it('shows the "new message" affordance when a new message arrives while the user is reading history, and never repeatedly force-scrolls', () => {
    const { result, rerender } = renderHook(({ itemCount, streamingLength }) => useAutoScroll({ itemCount, streamingLength, prefersReducedMotion: () => false }), {
      initialProps: { itemCount: 1, streamingLength: 0 },
    });
    const container = makeFakeContainer({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 });
    act(() => {
      (result.current.containerRef as { current: HTMLDivElement | null }).current = container;
      result.current.handleScroll();
    });

    rerender({ itemCount: 2, streamingLength: 0 }); // a new persisted message lands

    expect(result.current.hasNewMessage).toBe(true);
    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  it('clears the affordance and scrolls to the bottom when scrollToBottom() is called (clicking the affordance)', () => {
    const { result, rerender } = renderHook(({ itemCount, streamingLength }) => useAutoScroll({ itemCount, streamingLength, prefersReducedMotion: () => false }), {
      initialProps: { itemCount: 1, streamingLength: 0 },
    });
    const container = makeFakeContainer({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 });
    act(() => {
      (result.current.containerRef as { current: HTMLDivElement | null }).current = container;
      result.current.handleScroll();
    });
    rerender({ itemCount: 2, streamingLength: 0 });
    expect(result.current.hasNewMessage).toBe(true);

    act(() => {
      result.current.scrollToBottom();
    });

    expect(container.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1000 }));
    expect(result.current.hasNewMessage).toBe(false);
  });

  it('clears the affordance once the user scrolls back down to the bottom themselves, without clicking anything', () => {
    const { result, rerender } = renderHook(({ itemCount, streamingLength }) => useAutoScroll({ itemCount, streamingLength, prefersReducedMotion: () => false }), {
      initialProps: { itemCount: 1, streamingLength: 0 },
    });
    const container = makeFakeContainer({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 });
    act(() => {
      (result.current.containerRef as { current: HTMLDivElement | null }).current = container;
      result.current.handleScroll();
    });
    rerender({ itemCount: 2, streamingLength: 0 });
    expect(result.current.hasNewMessage).toBe(true);

    act(() => {
      Object.defineProperty(container, 'scrollTop', { value: 800, writable: true, configurable: true });
      result.current.handleScroll();
    });

    expect(result.current.hasNewMessage).toBe(false);
  });

  it('respects prefers-reduced-motion by scrolling instantly instead of smoothly', () => {
    const { result, rerender } = renderHook(({ itemCount, streamingLength }) => useAutoScroll({ itemCount, streamingLength, prefersReducedMotion: () => true }), {
      initialProps: { itemCount: 1, streamingLength: 0 },
    });
    const container = makeFakeContainer({ scrollTop: 800, scrollHeight: 1000, clientHeight: 200 });
    act(() => {
      (result.current.containerRef as { current: HTMLDivElement | null }).current = container;
    });

    rerender({ itemCount: 2, streamingLength: 0 });

    expect(container.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });
});
