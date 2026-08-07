import type { TarotReadingStatusValue, TarotReadingTypeValue, TarotSuitValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/architecture/tarot-discovery.md. */
export const READING_TYPE_LABELS: Record<TarotReadingTypeValue, string> = {
  DAILY_DRAW: 'Daily Draw',
  SINGLE_CARD: 'Single Card',
  THREE_CARD: 'Three Card Spread',
};

export const READING_TYPE_DESCRIPTIONS: Record<TarotReadingTypeValue, string> = {
  DAILY_DRAW: 'One card for today. Once per day — no re-draws, so the reflection stays honest.',
  SINGLE_CARD: 'One card, any time, for whatever is on your mind right now.',
  THREE_CARD: 'Three cards — Past, Present, Future — for a fuller picture of where things stand.',
};

export const READING_STATUS_LABELS: Record<TarotReadingStatusValue, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
};

export const READING_STATUS_BADGE_VARIANT: Record<TarotReadingStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

export const SUIT_LABELS: Record<TarotSuitValue, string> = {
  WANDS: 'Wands',
  CUPS: 'Cups',
  SWORDS: 'Swords',
  PENTACLES: 'Pentacles',
};
