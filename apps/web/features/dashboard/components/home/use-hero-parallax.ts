'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/components/motion/use-prefers-reduced-motion';

/**
 * Writes smoothed `--px`/`--py` (range roughly -1..1) onto the hero section as the pointer moves,
 * so each background layer can scale them into its own few-px offset via CSS
 * `translate(calc(var(--px) * Npx), calc(var(--py) * Npx))` — no re-render per frame, direct DOM
 * writes only. Desktop pointer only (`hover: hover` + `pointer: fine`, i.e. not touch); disabled
 * under `prefers-reduced-motion: reduce` per the brief's "no large parallax" reduced-motion rule.
 */
export function useHeroParallax<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    function onPointerMove(event: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    }

    function onPointerLeave() {
      targetX = 0;
      targetY = 0;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      el!.style.setProperty('--px', currentX.toFixed(4));
      el!.style.setProperty('--py', currentY.toFixed(4));
      raf = requestAnimationFrame(tick);
    }

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [reducedMotion]);

  return ref;
}
