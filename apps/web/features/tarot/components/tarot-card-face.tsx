'use client';

import { Flame, Droplet, Wind, Mountain, Sparkles } from 'lucide-react';
import type { TarotCardDto } from '@beaconvie/types';
import { cn } from '@/lib/cn';

/** No illustrated artwork exists yet (disclosed, not faked — see sprint-6-progress.md "Deliberate
 * scope decisions" #2) — a typographic/symbolic card face instead, consistent with the Design
 * Language System's "abstract, never literal fortune-teller iconography" guidance. */
const SUIT_ICON = { WANDS: Flame, CUPS: Droplet, SWORDS: Wind, PENTACLES: Mountain } as const;

export function TarotCardFace({
  card,
  isReversed,
  onClick,
  size = 'md',
}: {
  card: TarotCardDto;
  isReversed: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}) {
  const Icon = card.suit ? SUIT_ICON[card.suit] : Sparkles;
  const sizeClasses = size === 'sm' ? 'h-32 w-20 text-caption' : 'h-48 w-32 text-body-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${card.name}${isReversed ? ', reversed' : ''}`}
      className={cn(
        'flex flex-col items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-raised p-3 text-center shadow-sm transition-transform duration-standard',
        sizeClasses,
        isReversed && 'rotate-180',
        onClick && 'cursor-pointer hover:border-insight',
      )}
    >
      <Icon className="h-5 w-5 text-insight" aria-hidden="true" />
      <span className="font-display leading-tight text-text-primary">{card.name}</span>
      <span className="text-caption text-text-disabled">{String(card.number).padStart(2, '0')}</span>
    </button>
  );
}
