'use client';

import type { TarotCardDto } from '@beaconvie/types';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SUIT_LABELS } from '../labels';

export function TarotCardDetailDialog({
  card,
  isReversed,
  open,
  onClose,
}: {
  card: TarotCardDto | null;
  isReversed: boolean;
  open: boolean;
  onClose: () => void;
}) {
  if (!card) return null;

  return (
    <Dialog open={open} onClose={onClose} title={card.name} description={isReversed ? 'Drawn reversed' : 'Drawn upright'}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{card.arcana === 'MAJOR' ? 'Major Arcana' : 'Minor Arcana'}</Badge>
          {card.suit && <Badge variant="neutral">{SUIT_LABELS[card.suit]}</Badge>}
          {card.element && <Badge variant="neutral">{card.element}</Badge>}
          {card.astrological && <Badge variant="neutral">{card.astrological}</Badge>}
        </div>

        <div>
          <p className="mb-1 text-body-sm font-semibold text-text-secondary">Upright</p>
          <p className="mb-2 text-body-sm text-text-primary">{card.uprightMeaning}</p>
          <p className="text-caption text-text-tertiary">{card.uprightKeywords.join(' · ')}</p>
        </div>

        <div>
          <p className="mb-1 text-body-sm font-semibold text-text-secondary">Reversed</p>
          <p className="mb-2 text-body-sm text-text-primary">{card.reversedMeaning}</p>
          <p className="text-caption text-text-tertiary">{card.reversedKeywords.join(' · ')}</p>
        </div>
      </div>
    </Dialog>
  );
}
