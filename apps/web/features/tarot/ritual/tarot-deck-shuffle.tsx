'use client';

import { motion } from 'framer-motion';
import { TarotCardVisual } from '../components/tarot-card-face';
import { TAROT_CARD_BACK_SRC } from '../artwork';
import type { ShuffleStage } from './use-tarot-ritual';
import { RitualSkipButton } from './ritual-skip-button';

const VISUAL_CARDS = 7;
const CENTER = 3;
const EASE_ORGANIC = [0.22, 1, 0.36, 1] as const;

/**
 * A visually-convincing subset (7 backs, not the real 78) standing in for the deck — the brief's
 * own "do not simulate hundreds of cards" guidance. Each stage below is a hand-tuned transform per
 * card index, not a physics sim: deck rises, splits into two halves, the halves interleave
 * (riffle), close back together, and settle into the resting arc the fan spread picks up from.
 */
function stageTransform(stage: ShuffleStage, index: number) {
  const offset = index - CENTER;
  const half = index < CENTER ? -1 : index > CENTER ? 1 : index % 2 === 0 ? -1 : 1;
  switch (stage) {
    case 'idle':
      return { x: 0, y: 0, rotate: offset * 2, scale: 1 };
    case 'rising':
      return { x: 0, y: -14, rotate: offset * 2, scale: 1.03 };
    case 'splitting':
      return { x: half * 46, y: -10, rotate: half * 6, scale: 1.02 };
    case 'riffling': {
      const jitter = (index % 2 === 0 ? -1 : 1) * 8;
      return { x: half * 20, y: -6 + jitter, rotate: half * 10 + jitter, scale: 1.01 };
    }
    case 'closing':
      return { x: 0, y: -4, rotate: offset * 1.5, scale: 1 };
    case 'settled':
    default:
      return { x: 0, y: Math.abs(offset) * 6, rotate: offset * 9, scale: 1 };
  }
}

export function TarotDeckShuffle({
  stage,
  reducedMotion,
  onSkip,
}: {
  stage: ShuffleStage;
  reducedMotion: boolean;
  onSkip: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="relative h-52 w-80 max-w-full" aria-hidden="true">
        {Array.from({ length: VISUAL_CARDS }).map((_, index) => {
          const t = stageTransform(stage, index);
          return (
            <motion.span
              key={index}
              className="absolute left-1/2 top-0 -translate-x-1/2"
              initial={false}
              animate={{ x: t.x, y: t.y, rotate: t.rotate, scale: t.scale }}
              transition={reducedMotion ? { duration: 0.15 } : { duration: 0.42, ease: EASE_ORGANIC }}
              style={{ zIndex: VISUAL_CARDS - Math.abs(index - CENTER) }}
            >
              <TarotCardVisual id={`shuffle-${index}`} name="Tarot card back" size="sm" revealed={false} backImageSrc={TAROT_CARD_BACK_SRC} />
            </motion.span>
          );
        })}
      </div>
      {stage !== 'settled' && <RitualSkipButton onClick={onSkip} />}
    </div>
  );
}
