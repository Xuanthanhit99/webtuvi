'use client';

import type { TarotReadingDto } from '@beaconvie/types';
import { TarotCard3D } from './tarot-card-3d';
import { RitualSkipButton } from './ritual-skip-button';
import { TAROT_CARD_BACK_SRC } from '../artwork';
import { resolveTarotArtworkSrc } from '../artwork';
import type { RevealStage } from './use-tarot-ritual';

/**
 * Placed cards auto-flip in a short stagger before handing off to `TarotReadingView` — the brief's
 * "reveal reduces 3D intensity, interpretation becomes primary" hand-off. `flipped` is a single
 * shared boolean (driven by `revealStage`); each card's own `flipDelayMs` is what actually staggers
 * them, so the underlying state stays simple.
 */
export function TarotRevealSequence({
  reading,
  revealStage,
  onSkip,
}: {
  reading: TarotReadingDto;
  revealStage: RevealStage;
  onSkip: () => void;
}) {
  const orderedCards = [...reading.cards].sort((a, b) => a.position - b.position);
  const flipped = revealStage !== 'placed';

  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center">
      <p className="font-display text-heading-md text-insight">Lá bài của bạn đang được lật mở</p>
      <div className="flex flex-wrap justify-center gap-4">
        {orderedCards.map((entry, index) => (
          <div key={entry.position} className="flex flex-col items-center gap-2">
            <TarotCard3D
              id={entry.card.id}
              name={entry.card.name}
              imageSrc={resolveTarotArtworkSrc(entry.card)}
              backImageSrc={TAROT_CARD_BACK_SRC}
              reversed={entry.isReversed}
              size="md"
              flipped={flipped}
              flipDelayMs={index * 130}
            />
            <span className="text-caption text-text-tertiary">{entry.positionLabel}</span>
          </div>
        ))}
      </div>
      {revealStage !== 'done' && <RitualSkipButton onClick={onSkip} />}
    </div>
  );
}
