'use client';

import type { TarotCardVisualProps } from '../components/tarot-card-face';
import { TarotCardVisual } from '../components/tarot-card-face';
import { usePrefersReducedMotion } from '@/components/motion/use-prefers-reduced-motion';

/**
 * A 3D flip wrapper around the existing `TarotCardVisual` — same CSS technique already proven in
 * the repo's `/menh-vi/tarot` mock (perspective + preserve-3d + backface-visibility), just wired
 * to a real card id/artwork instead of a hardcoded mock. `TarotCardVisual` itself is untouched;
 * this only composes two instances of it (back face, front face) inside a rotating container.
 * Under reduced motion, skips the rotation for a short opacity crossfade instead — same two faces,
 * same end state, no `rotateY`.
 */
export function TarotCard3D({
  id,
  name,
  imageSrc,
  backImageSrc,
  reversed,
  size = 'md',
  flipped,
  flipDelayMs,
}: {
  id: string;
  name: string;
  imageSrc?: string | null;
  backImageSrc?: string | null;
  reversed?: boolean;
  size?: TarotCardVisualProps['size'];
  flipped: boolean;
  /** Per-card offset so a multi-card reveal staggers instead of flipping in unison. */
  flipDelayMs?: number;
}) {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) {
    return (
      <span
        className="relative inline-block transition-opacity duration-fast"
        style={{ transitionDelay: `${flipDelayMs ?? 0}ms` }}
        key={flipped ? 'front' : 'back'}
      >
        <TarotCardVisual id={id} name={name} imageSrc={imageSrc} backImageSrc={backImageSrc} reversed={reversed} size={size} revealed={flipped} />
      </span>
    );
  }

  return (
    <span className="relative inline-block" style={{ perspective: '1200px' }}>
      <span
        className="relative block transition-transform duration-[650ms] ease-organic"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transitionDelay: `${flipDelayMs ?? 0}ms`,
        }}
      >
        <span className="block" style={{ backfaceVisibility: 'hidden' }}>
          <TarotCardVisual id={`${id}-back`} name={name} backImageSrc={backImageSrc} revealed={false} size={size} />
        </span>
        <span className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <TarotCardVisual id={`${id}-front`} name={name} imageSrc={imageSrc} reversed={reversed} revealed size={size} />
        </span>
      </span>
    </span>
  );
}
