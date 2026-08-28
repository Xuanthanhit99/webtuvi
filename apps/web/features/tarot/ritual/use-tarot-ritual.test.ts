import { act, renderHook } from '@testing-library/react';
import { useTarotRitual } from './use-tarot-ritual';

describe('useTarotRitual', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts idle/placed and runs the full shuffle sequence to settled', () => {
    const { result } = renderHook(() => useTarotRitual());
    expect(result.current.shuffleStage).toBe('idle');
    expect(result.current.revealStage).toBe('placed');

    act(() => result.current.startShuffle());
    expect(result.current.shuffleStage).toBe('idle');

    act(() => jest.advanceTimersByTime(220));
    expect(result.current.shuffleStage).toBe('rising');
    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.shuffleStage).toBe('settled');
  });

  it('skipShuffle jumps straight to settled without waiting for the sequence', () => {
    const { result } = renderHook(() => useTarotRitual());
    act(() => result.current.startShuffle());
    act(() => jest.advanceTimersByTime(220));
    expect(result.current.shuffleStage).toBe('rising');

    act(() => result.current.skipShuffle());
    expect(result.current.shuffleStage).toBe('settled');

    // Timers already cleared by skip — advancing further must not un-settle it.
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.shuffleStage).toBe('settled');
  });

  it('runs the reveal sequence (placed -> flipping -> done) staggered by card count', () => {
    const { result } = renderHook(() => useTarotRitual());
    act(() => result.current.startReveal(3));
    expect(result.current.revealStage).toBe('placed');

    act(() => jest.advanceTimersByTime(260));
    expect(result.current.revealStage).toBe('flipping');

    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.revealStage).toBe('done');
  });

  it('skipReveal jumps straight to done', () => {
    const { result } = renderHook(() => useTarotRitual());
    act(() => result.current.startReveal(1));
    act(() => result.current.skipReveal());
    expect(result.current.revealStage).toBe('done');
  });

  it('resetRitual returns both stages to their initial values', () => {
    const { result } = renderHook(() => useTarotRitual());
    act(() => result.current.startShuffle());
    act(() => jest.advanceTimersByTime(5000));
    act(() => result.current.startReveal(1));
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.shuffleStage).toBe('settled');
    expect(result.current.revealStage).toBe('done');

    act(() => result.current.resetRitual());
    expect(result.current.shuffleStage).toBe('idle');
    expect(result.current.revealStage).toBe('placed');
  });
});
