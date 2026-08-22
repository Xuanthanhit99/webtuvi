'use client';

import { useState } from 'react';
import { Flame, Droplet, Wind, Mountain, Sparkles } from 'lucide-react';
import type { TarotCardDto } from '@beaconvie/types';
import { cn } from '@/lib/cn';

/** No illustrated artwork exists yet (disclosed, not faked — see sprint-6-progress.md "Deliberate
 * scope decisions" #2) — a typographic/symbolic card face instead, consistent with the Design
 * Language System's "abstract, never literal fortune-teller iconography" guidance. */
const SUIT_ICON = { WANDS: Flame, CUPS: Droplet, SWORDS: Wind, PENTACLES: Mountain } as const;

export type TarotCardVisualProps = {
  id: string;
  name: string;
  imageSrc?: string | null;
  reversed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  revealed?: boolean;
  symbol?: React.ReactNode;
  numberLabel?: string;
};

const SIZE_CLASSES: Record<NonNullable<TarotCardVisualProps['size']>, string> = {
  sm: 'h-32 w-20 text-caption',
  md: 'h-48 w-32 text-body-sm',
  lg: 'h-64 w-40 text-body-md',
};

function TarotFallbackFace({ name, symbol, numberLabel, revealed }: Pick<TarotCardVisualProps, 'name' | 'symbol' | 'numberLabel' | 'revealed'>) {
  if (revealed === false) {
    return (
      <>
        <span className="pointer-events-none absolute inset-2 rounded-sm border border-insight/15" aria-hidden="true" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-insight/15" aria-hidden="true" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-trust/20" aria-hidden="true" />
        <Sparkles className="relative h-5 w-5 text-insight" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <span className="pointer-events-none absolute inset-2 rounded-sm border border-insight/15" aria-hidden="true" />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-insight/10" aria-hidden="true" />
      <span className="pointer-events-none absolute -right-8 bottom-8 h-10 w-24 rotate-[-20deg] rounded-[50%] border border-trust/15" aria-hidden="true" />
      <span className="relative text-insight" aria-hidden="true">{symbol}</span>
      <span className="relative font-display leading-tight text-text-primary">{name}</span>
      {numberLabel && <span className="relative text-caption text-text-tertiary">{numberLabel}</span>}
    </>
  );
}

export function TarotCardVisual({
  id,
  name,
  imageSrc,
  reversed = false,
  size = 'md',
  revealed = true,
  symbol,
  numberLabel,
}: TarotCardVisualProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'failed'>(imageSrc ? 'loading' : 'failed');
  const showImage = Boolean(imageSrc) && imageState !== 'failed';

  return (
    <span
      data-card-id={id}
      className={cn(
        'relative flex shrink-0 flex-col items-center justify-between gap-2 overflow-hidden rounded-md border border-[rgba(213,173,98,0.28)] bg-surface-raised p-3 text-center shadow-[0_16px_44px_rgba(0,0,0,0.28)]',
        SIZE_CLASSES[size],
        reversed && 'rotate-180',
      )}
    >
      {showImage && (
        <>
          {imageState === 'loading' && <span className="absolute inset-0 animate-pulse bg-insight/5" aria-hidden="true" />}
          {/* eslint-disable-next-line @next/next/no-img-element -- Future approved Tarot art must fail over without Next image optimizer assumptions. */}
          <img
            data-testid="tarot-card-artwork"
            src={imageSrc ?? undefined}
            alt=""
            className={cn('absolute inset-0 h-full w-full object-cover', imageState === 'loading' && 'opacity-0')}
            onLoad={() => setImageState('loaded')}
            onError={() => setImageState('failed')}
          />
          {imageState === 'loaded' && (
            <span className="absolute inset-x-2 bottom-2 rounded-sm bg-canvas/78 px-2 py-1 text-caption font-semibold text-text-primary backdrop-blur-sm">
              {name}
            </span>
          )}
        </>
      )}
      {!showImage && <TarotFallbackFace name={name} symbol={symbol} numberLabel={numberLabel} revealed={revealed} />}
    </span>
  );
}

export function TarotCardFace({
  card,
  isReversed,
  onClick,
  size = 'md',
  imageSrc,
}: {
  card: TarotCardDto;
  isReversed: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  imageSrc?: string | null;
}) {
  const Icon = card.suit ? SUIT_ICON[card.suit] : Sparkles;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${card.name}${isReversed ? ', reversed' : ''}`}
      className={cn(
        'relative transition-transform duration-standard',
        isReversed && 'rotate-180',
        onClick && 'cursor-pointer hover:border-insight',
      )}
    >
      <TarotCardVisual
        id={card.id}
        name={card.name}
        imageSrc={imageSrc}
        size={size}
        symbol={<Icon className="h-5 w-5" aria-hidden="true" />}
        numberLabel={String(card.number).padStart(2, '0')}
      />
    </button>
  );
}
