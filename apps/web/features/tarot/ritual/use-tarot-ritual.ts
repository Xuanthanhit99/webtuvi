'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/components/motion/use-prefers-reduced-motion';

export type ShuffleStage = 'idle' | 'rising' | 'splitting' | 'riffling' | 'closing' | 'settled';
export type RevealStage = 'placed' | 'flipping' | 'done';

/** Full-motion stage durations (ms) — sum lands in the brief's 1.4-2.1s shuffle window. */
const SHUFFLE_STEPS: Array<{ stage: ShuffleStage; after: number }> = [
  { stage: 'rising', after: 220 },
  { stage: 'splitting', after: 380 },
  { stage: 'riffling', after: 620 },
  { stage: 'closing', after: 420 },
  { stage: 'settled', after: 300 },
];
const SHUFFLE_STEPS_REDUCED: Array<{ stage: ShuffleStage; after: number }> = [{ stage: 'settled', after: 150 }];

/** Exported so `TarotDrawPanel` can size its real-data wait to match the shuffle's own total
 * runtime instead of duplicating the figure — see `useTarotRitual`'s `startShuffle`. */
export const SHUFFLE_TOTAL_MS = SHUFFLE_STEPS.reduce((sum, step) => sum + step.after, 0);
export const SHUFFLE_TOTAL_MS_REDUCED = SHUFFLE_STEPS_REDUCED.reduce((sum, step) => sum + step.after, 0);

/**
 * Purely visual ritual state — shuffle choreography and the per-card reveal-flip sequence — kept
 * entirely separate from `TarotDrawPanel`'s business state (`selectedSlots`/`pendingReading`/
 * `result`). Nothing here can affect which cards were drawn or in what order; it only decides what
 * the screen shows while that data resolves. Self-driving: each stage schedules the next via
 * `setTimeout` and cleans up on unmount/skip, no external tick loop needed.
 */
export function useTarotRitual() {
  const reducedMotion = usePrefersReducedMotion();
  const [shuffleStage, setShuffleStage] = useState<ShuffleStage>('idle');
  const [revealStage, setRevealStage] = useState<RevealStage>('placed');
  const [revealCardCount, setRevealCardCount] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startShuffle = useCallback(() => {
    clearTimers();
    const steps = reducedMotion ? SHUFFLE_STEPS_REDUCED : SHUFFLE_STEPS;
    setShuffleStage('idle');
    let elapsed = 0;
    steps.forEach(({ stage, after }) => {
      elapsed += after;
      timers.current.push(setTimeout(() => setShuffleStage(stage), elapsed));
    });
  }, [clearTimers, reducedMotion]);

  const skipShuffle = useCallback(() => {
    clearTimers();
    setShuffleStage('settled');
  }, [clearTimers]);

  const startReveal = useCallback(
    (cardCount: number) => {
      clearTimers();
      setRevealCardCount(cardCount);
      setRevealStage('placed');
      const stagger = reducedMotion ? 60 : 130;
      const flipDuration = reducedMotion ? 180 : 650;
      const toFlipping = reducedMotion ? 60 : 260;
      timers.current.push(setTimeout(() => setRevealStage('flipping'), toFlipping));
      const totalFlipTime = toFlipping + stagger * Math.max(0, cardCount - 1) + flipDuration + 200;
      timers.current.push(setTimeout(() => setRevealStage('done'), totalFlipTime));
    },
    [clearTimers, reducedMotion],
  );

  const skipReveal = useCallback(() => {
    clearTimers();
    setRevealStage('done');
  }, [clearTimers]);

  const resetRitual = useCallback(() => {
    clearTimers();
    setShuffleStage('idle');
    setRevealStage('placed');
    setRevealCardCount(0);
  }, [clearTimers]);

  return {
    reducedMotion,
    shuffleStage,
    revealStage,
    revealCardCount,
    startShuffle,
    skipShuffle,
    startReveal,
    skipReveal,
    resetRitual,
  };
}
