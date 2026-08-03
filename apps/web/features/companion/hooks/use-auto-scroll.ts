'use client';

import { useEffect, useRef, useState } from 'react';
import { isNearBottom } from '../lib/scroll-position';

export interface UseAutoScrollOptions {
  /** Number of persisted messages — a new item arriving is what can trigger the "New message" affordance. */
  itemCount: number;
  /** Length of the in-progress streamed text — grows once per token; used only to keep an already-near-bottom view pinned to the latest content. */
  streamingLength: number;
  /** Injectable for testing; defaults to a real `matchMedia` check. */
  prefersReducedMotion?: () => boolean;
}

function defaultPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * Sprint 2B audit Finding 4: auto-scroll only when the user was already near
 * the bottom (i.e. actively following along); otherwise leave their scroll
 * position alone and surface `hasNewMessage` so the caller can show a calm
 * "New message" affordance instead of yanking them back down mid-read.
 * `isNearBottomRef` is a ref, not state, so the scroll-triggering effect
 * doesn't need to depend on it and re-trigger itself on every scroll.
 */
export function useAutoScroll({ itemCount, streamingLength, prefersReducedMotion = defaultPrefersReducedMotion }: UseAutoScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const prevItemCountRef = useRef(itemCount);

  function scrollToBottom(behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth') {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior });
    isNearBottomRef.current = true;
    setHasNewMessage(false);
  }

  function handleScroll() {
    if (!containerRef.current) return;
    const nearBottom = isNearBottom(containerRef.current);
    isNearBottomRef.current = nearBottom;
    if (nearBottom) setHasNewMessage(false);
  }

  useEffect(() => {
    if (isNearBottomRef.current) {
      const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior });
    } else if (itemCount > prevItemCountRef.current) {
      // A new message landed while the user was reading history — don't
      // force-scroll; just let them know there's something new below.
      setHasNewMessage(true);
    }
    prevItemCountRef.current = itemCount;
    // Only re-run when new content actually arrives, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount, streamingLength]);

  return { containerRef, hasNewMessage, handleScroll, scrollToBottom };
}
