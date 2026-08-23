'use client';

import type { TarotCardDto } from '@beaconvie/types';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SUIT_LABELS } from '../labels';

/** Tarot 78-Card Completion — topic-aware meaning, chosen from the card's own real, canonical
 * fields (never AI-generated, never a separate invented reading). `topic` is optional so this
 * dialog works identically for readings drawn before topic selection exists at the draw-flow
 * level (deferred this pass — see docs/audit/tarot-78-card-completion-audit.md). */
export type TarotDetailTopic = 'LOVE' | 'CAREER' | 'FINANCE' | 'SELF';

const TOPIC_LABELS: Record<TarotDetailTopic, string> = {
  LOVE: 'Love',
  CAREER: 'Career',
  FINANCE: 'Finance',
  SELF: 'Self',
};

function topicMeaning(card: TarotCardDto, topic: TarotDetailTopic): string {
  switch (topic) {
    case 'LOVE':
      return card.loveMeaning;
    case 'CAREER':
      return card.careerMeaning;
    case 'FINANCE':
      return card.financeMeaning;
    case 'SELF':
      return card.selfMeaning;
  }
}

export function TarotCardDetailDialog({
  card,
  isReversed,
  open,
  onClose,
  topic,
}: {
  card: TarotCardDto | null;
  isReversed: boolean;
  open: boolean;
  onClose: () => void;
  /** Optional — when provided, shows that one topic-framed meaning alongside the canonical
   * upright/reversed meaning. Omit to show only the canonical (topic-agnostic) content. */
  topic?: TarotDetailTopic;
}) {
  if (!card) return null;

  return (
    <Dialog open={open} onClose={onClose} title={card.name} description={`${card.nameVi} · ${isReversed ? 'Drawn reversed' : 'Drawn upright'}`}>
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

        {topic && (
          <div>
            <p className="mb-1 text-body-sm font-semibold text-text-secondary">{TOPIC_LABELS[topic]}</p>
            <p className="text-body-sm text-text-primary">{topicMeaning(card, topic)}</p>
          </div>
        )}

        {card.reflectionPrompts.length > 0 && (
          <div>
            <p className="mb-1 text-body-sm font-semibold text-text-secondary">Có thể bạn muốn tự hỏi…</p>
            <ul className="flex flex-col gap-1">
              {card.reflectionPrompts.map((prompt) => (
                <li key={prompt} className="text-body-sm text-text-secondary">
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}
