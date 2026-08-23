'use client';

import type { TarotCardDto } from '@beaconvie/types';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SUIT_LABELS } from '../labels';
import { TarotCardFace } from './tarot-card-face';
import { resolveTarotArtworkSrc } from '../artwork';

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

const TOPICS: TarotDetailTopic[] = ['LOVE', 'CAREER', 'FINANCE', 'SELF'];

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
      <div className="grid gap-5 rounded-md border border-[rgba(213,173,98,0.22)] bg-[#07111D] p-3 tablet:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <TarotCardFace card={card} isReversed={isReversed} imageSrc={resolveTarotArtworkSrc(card)} />
        </div>
        <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{card.arcana === 'MAJOR' ? 'Major Arcana' : 'Minor Arcana'}</Badge>
          {card.suit && <Badge variant="neutral">{SUIT_LABELS[card.suit]}</Badge>}
          <Badge variant="insight">{isReversed ? 'Ngược' : 'Xuôi'}</Badge>
          {card.element && <Badge variant="neutral">{card.element}</Badge>}
          {card.astrological && <Badge variant="neutral">{card.astrological}</Badge>}
        </div>

        <div className="rounded-md border border-[rgba(213,173,98,0.16)] bg-[#0A1622]/85 p-3">
          <p className="mb-1 text-body-sm font-semibold text-insight">Upright</p>
          <p className="mb-2 text-body-sm text-text-primary">{card.uprightMeaning}</p>
          <p className="text-caption text-text-tertiary">{card.uprightKeywords.join(' · ')}</p>
        </div>

        <div className="rounded-md border border-[rgba(213,173,98,0.16)] bg-[#0A1622]/85 p-3">
          <p className="mb-1 text-body-sm font-semibold text-insight">Reversed</p>
          <p className="mb-2 text-body-sm text-text-primary">{card.reversedMeaning}</p>
          <p className="text-caption text-text-tertiary">{card.reversedKeywords.join(' · ')}</p>
        </div>

        {topic && (
          <div className="rounded-md border border-[rgba(213,173,98,0.16)] bg-[#0A1622]/85 p-3">
            <p className="mb-1 text-body-sm font-semibold text-insight">{TOPIC_LABELS[topic]}</p>
            <p className="text-body-sm text-text-primary">{topicMeaning(card, topic)}</p>
          </div>
        )}

        {!topic && (
          <div className="grid gap-2 rounded-md border border-[rgba(213,173,98,0.16)] bg-[#0A1622]/85 p-3 tablet:grid-cols-2">
            {TOPICS.map((item) => (
              <div key={item}>
                <p className="mb-1 text-caption font-semibold uppercase text-insight">{TOPIC_LABELS[item]}</p>
                <p className="text-body-sm text-text-secondary">{topicMeaning(card, item)}</p>
              </div>
            ))}
          </div>
        )}

        {card.reflectionPrompts.length > 0 && (
          <div className="rounded-md border border-[rgba(213,173,98,0.16)] bg-[#0A1622]/85 p-3">
            <p className="mb-1 text-body-sm font-semibold text-insight">Có thể bạn muốn tự hỏi…</p>
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
      </div>
    </Dialog>
  );
}
